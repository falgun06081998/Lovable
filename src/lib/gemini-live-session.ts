// Browser-side Gemini Live session: mic in (16kHz PCM) + audio out (24kHz PCM)
// + transcripts + tool calls.

import { GoogleGenAI, Modality, type Session } from "@google/genai";

export type ToolCall = {
  id: string;
  name: string;
  args: Record<string, any>;
};

export type LiveCallbacks = {
  onUserTranscript: (text: string, isFinal: boolean) => void;
  onAssistantTranscript: (text: string, isFinal: boolean) => void;
  onSpeakingChange: (speaking: boolean) => void;
  onListeningChange: (listening: boolean) => void;
  onToolCall: (call: ToolCall) => Promise<any>;
  onError: (msg: string) => void;
  onClose: () => void;
};

function int16ToBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return btoa(binary);
}

function base64ToInt16(b64: string): Int16Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
}

export class GeminiLiveSession {
  private session: Session | null = null;
  private inputCtx: AudioContext | null = null;
  private outputCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private playbackTime = 0;
  private interimUser = "";
  private interimAssistant = "";
  private cb: LiveCallbacks;
  private closed = false;

  constructor(cb: LiveCallbacks) {
    this.cb = cb;
  }

  async start(token: string, model: string) {
    const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: "v1alpha" } });

    this.session = await ai.live.connect({
      model,
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          // nothing — mic starts separately after open
        },
        onmessage: (msg: any) => this.handleMessage(msg),
        onerror: (e: any) => this.cb.onError(e?.message ?? "Live connection error"),
        onclose: () => { this.cb.onClose(); },
      },
    });

    await this.startMic();
  }

  private async startMic() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.inputCtx = new Ctx({ sampleRate: 16000 });
      this.source = this.inputCtx!.createMediaStreamSource(this.micStream);
      this.processor = this.inputCtx!.createScriptProcessor(4096, 1, 1);
      this.processor.onaudioprocess = (e) => {
        if (!this.session || this.closed) return;
        const f32 = e.inputBuffer.getChannelData(0);
        const i16 = new Int16Array(f32.length);
        for (let i = 0; i < f32.length; i++) {
          const s = Math.max(-1, Math.min(1, f32[i]));
          i16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        try {
          this.session.sendRealtimeInput({
            audio: { data: int16ToBase64(i16), mimeType: "audio/pcm;rate=16000" },
          });
        } catch {}
      };
      this.source.connect(this.processor);
      this.processor.connect(this.inputCtx!.destination);
      this.cb.onListeningChange(true);
    } catch (e: any) {
      this.cb.onError(e?.message ?? "Microphone permission denied");
    }
  }

  private ensureOutputCtx() {
    if (this.outputCtx) return this.outputCtx;
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.outputCtx = new Ctx({ sampleRate: 24000 });
    this.playbackTime = this.outputCtx!.currentTime;
    return this.outputCtx!;
  }

  private playPcm(b64: string) {
    const ctx = this.ensureOutputCtx();
    const i16 = base64ToInt16(b64);
    const f32 = new Float32Array(i16.length);
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 0x8000;
    const buf = ctx.createBuffer(1, f32.length, 24000);
    buf.copyToChannel(f32, 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    const now = ctx.currentTime;
    const startAt = Math.max(now, this.playbackTime);
    src.start(startAt);
    this.playbackTime = startAt + buf.duration;
    this.cb.onSpeakingChange(true);
    src.onended = () => {
      if (ctx.currentTime >= this.playbackTime - 0.05) this.cb.onSpeakingChange(false);
    };
  }

  private async handleMessage(msg: any) {
    // Audio chunks
    const sc = msg.serverContent;
    if (sc) {
      const parts = sc.modelTurn?.parts ?? [];
      for (const p of parts) {
        const inline = p.inlineData;
        if (inline?.mimeType?.startsWith("audio/") && inline.data) {
          this.playPcm(inline.data);
        }
      }
      // Transcriptions
      if (sc.inputTranscription?.text) {
        this.interimUser += sc.inputTranscription.text;
        this.cb.onUserTranscript(this.interimUser, false);
      }
      if (sc.outputTranscription?.text) {
        this.interimAssistant += sc.outputTranscription.text;
        this.cb.onAssistantTranscript(this.interimAssistant, false);
      }
      if (sc.turnComplete) {
        if (this.interimUser.trim()) this.cb.onUserTranscript(this.interimUser.trim(), true);
        if (this.interimAssistant.trim()) this.cb.onAssistantTranscript(this.interimAssistant.trim(), true);
        this.interimUser = "";
        this.interimAssistant = "";
      }
      if (sc.interrupted) {
        // Stop playback
        this.playbackTime = this.outputCtx?.currentTime ?? 0;
        this.cb.onSpeakingChange(false);
      }
    }

    // Tool calls
    const tc = msg.toolCall;
    if (tc?.functionCalls?.length) {
      const responses: any[] = [];
      for (const fc of tc.functionCalls) {
        try {
          const result = await this.cb.onToolCall({ id: fc.id, name: fc.name, args: fc.args ?? {} });
          responses.push({ id: fc.id, name: fc.name, response: { result } });
        } catch (e: any) {
          responses.push({ id: fc.id, name: fc.name, response: { error: e?.message ?? "failed" } });
        }
      }
      try {
        this.session?.sendToolResponse({ functionResponses: responses });
      } catch {}
    }
  }

  async stop() {
    this.closed = true;
    try { this.processor?.disconnect(); } catch {}
    try { this.source?.disconnect(); } catch {}
    try { this.micStream?.getTracks().forEach((t) => t.stop()); } catch {}
    try { await this.inputCtx?.close(); } catch {}
    try { this.session?.close(); } catch {}
    this.cb.onListeningChange(false);
    this.cb.onSpeakingChange(false);
  }
}
