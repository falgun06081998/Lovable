const BASE = 'https://generativelanguage.googleapis.com/v1beta'
const KEY = import.meta.env.VITE_GEMINI_KEY

// ── TTS via gemini-2.5-flash-preview-tts ─────────────────────────────────────
let audioCtx = null
function getAudioCtx() {
  if (!audioCtx || audioCtx.state === 'closed') audioCtx = new AudioContext()
  return audioCtx
}

export async function geminiSpeak(text) {
  if (!KEY) return fallbackSpeak(text)
  try {
    const res = await fetch(
      `${BASE}/models/gemini-2.5-flash-preview-tts:generateContent?key=${KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
          },
        }),
      }
    )
    const data = await res.json()
    const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
    if (!b64) { fallbackSpeak(text); return }

    // Decode base64 PCM (16-bit, 24 kHz, mono)
    const raw = atob(b64)
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
    const pcm16 = new Int16Array(bytes.buffer)
    const float32 = Float32Array.from(pcm16, (v) => v / 32768)

    const ctx = getAudioCtx()
    const buffer = ctx.createBuffer(1, float32.length, 24000)
    buffer.copyToChannel(float32, 0)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.connect(ctx.destination)
    src.start()
  } catch (e) {
    console.warn('Gemini TTS failed, using fallback', e)
    fallbackSpeak(text)
  }
}

function fallbackSpeak(text) {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'en-IN'
  utt.rate = 1.05
  speechSynthesis.speak(utt)
}

// ── Intent parsing via gemini-2.0-flash ──────────────────────────────────────
const SYSTEM_PROMPT = `You are an intent extractor for a neighborhood gated community app called NB Hood.
Given a user's voice command, return ONLY a valid JSON object — no markdown, no explanation.

JSON schema:
{
  "intent": "delivery" | "guest" | "cab" | "group" | "preapprove" | "unknown",
  "company": "amazon" | "fresh" | "bigbasket" | "blinkit" | "swiggy" | "zomato" | null,
  "validFor": "Next 30 mins" | "Next 1 hr" | "Next 2 hrs" | "Next 4 hrs" | "All day" | null,
  "isFrequent": true | false,
  "occasion": "home" | "birthday" | "tea" | "gaming" | "party" | "gift" | null,
  "isGroup": true | false,
  "isVague": true | false,
  "clarifyQuestion": string | null
}

Rules:
- isFrequent = true if user says "every", "daily", "regular", "maid", "help", "morning", "evening"
- isGroup = true if user mentions "friends" (plural), "group", "team", "everyone", "people"
- isVague = true if intent is unclear (e.g. "someone is coming", "allow entry")
- clarifyQuestion = a short follow-up question if intent is vague, else null
- For delivery, map brand names: swiggy/zomato → swiggy, amazon fresh → fresh, grofers/blinkit → blinkit`

export async function geminiIntent(text) {
  if (!KEY) return null
  try {
    const res = await fetch(
      `${BASE}/models/gemini-2.0-flash:generateContent?key=${KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text }] }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    )
    const data = await res.json()
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch (e) {
    console.warn('Gemini intent failed', e)
    return null
  }
}
