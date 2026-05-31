const KEY = import.meta.env.VITE_GEMINI_KEY as string;

const SYSTEM = `You are an intent parser for a gated community management app called NB Hood.
Parse the user's voice command and return ONLY valid JSON (no markdown, no explanation).

Intent schema:
{
  "kind": "pre_approval" | "book_amenity" | "attendance" | "gate_allow" | "gate_query" | "complaint" | "society_query" | "pay_maintenance" | "clarify" | "unknown",
  "visitorType": string | null,   // for pre_approval: "Delivery", "Maid", "Guest", "Driver", "Cab"
  "duration": string | null,      // for pre_approval: e.g. "Next 1 hr", "today", "tomorrow", "morning 7-9am"
  "name": string | null,          // optional visitor name
  "amenity": string | null,       // for book_amenity: "Gym", "Swimming Pool", "Banquet Hall", "Tennis Court"
  "when": string | null,          // for book_amenity: e.g. "tomorrow 6-7am"
  "status": "present" | "absent" | null,  // for attendance
  "attendanceName": string | null, // for attendance: name of person
  "issue": string | null,          // for complaint: full description
  "location": string | null,       // for complaint
  "category": string | null,       // for complaint: "Electrical", "Plumbing", "Lift", "Housekeeping", "Maintenance"
  "urgent": boolean,
  "visibility": "personal" | "community" | null,
  "topic": string | null,          // for society_query
  "amount": number | null,         // for pay_maintenance
  "missing": string | null,        // for clarify: what info is missing
  "followup": string | null,       // for clarify: question to ask user
  "original": string               // always: the original input
}

Rules:
- For delivery services like swiggy/blinkit/zepto/amazon/instamart → visitorType = "Delivery"
- For maid/bai/sunita → visitorType = "Maid"
- If pre_approval but no duration/time context → kind = "clarify", missing = "duration"
- Understand Hindi, Hinglish, Kannada mixed with English
- urgent = true for words like spark, leak, stuck, emergency, smoke, fire, flood`;

export async function parseHoodIntent(input: string): Promise<any> {
  if (!KEY) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM }] },
          contents: [{ parts: [{ text: input }] }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}
