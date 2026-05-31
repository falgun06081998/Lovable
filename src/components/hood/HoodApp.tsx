import { useEffect, useRef, useState } from "react";
import { parseHoodIntent } from "@/lib/hood-intent";
import { getGeminiLiveToken } from "@/lib/gemini-live-token";
import { GeminiLiveSession, type ToolCall } from "@/lib/gemini-live-session";
import {
  PreApproveScreen, HelpdeskScreen, AmenitiesScreen,
  type ScreenKind, type ScreenAutoFill, type ScreenSubmitPayload,
} from "./Screens";
import {
  Mic, Check, X, ChevronRight, Plus, Search, ChevronDown, Sparkles,
  ArrowUp, Calendar, Wrench, Building2, Users, ClipboardList, HousePlug,
  MessageSquare, BadgeCheck, HelpCircle, ShoppingBag, IdCard, UserPlus,
  HandHeart, ArrowUpRight, Flame, Truck, Undo2, Globe, Keyboard, Captions,
} from "lucide-react";


// ============ Types ============

type EventType =
  | "assistant_opened"
  | "assistant_command_received"
  | "assistant_intent_recognised"
  | "assistant_clarification_requested"
  | "assistant_action_confirmed"
  | "assistant_action_completed"
  | "assistant_action_failed"
  | "assistant_undo_triggered"
  | "create_pre_approval"
  | "amenity_booked"
  | "attendance_marked"
  | "maintenance_ticket_raised"
  | "gate_request_resolved";

type LogEvent = {
  id: string;
  type: EventType;
  label: string;
  meta?: string;
  at: number;
};

type Lang = "en" | "hi" | "kn" | "hinglish";

type Intent =
  | { kind: "pre_approval"; visitorType: string; duration: string; name?: string }
  | { kind: "book_amenity"; amenity: string; when: string }
  | { kind: "attendance"; name: string; status: "present" | "absent" }
  | { kind: "gate_allow" }
  | { kind: "gate_query" }
  | { kind: "complaint"; issue: string; location: string; category?: string; urgent?: boolean; visibility?: "personal" | "community" }
  | { kind: "society_query"; topic: string }
  | { kind: "pay_maintenance"; amount: number }
  | { kind: "clarify"; missing: string; original: string; followup?: string }
  | { kind: "unknown"; original: string };

type Msg =
  | { id: string; role: "assistant"; text: string; lang: Lang }
  | { id: string; role: "user"; text: string; lang: Lang }
  | { id: string; role: "card"; intent: Intent; status: "pending" | "done" | "cancelled" };

// ============ Intent parser (mocked NLU) ============

const detectLang = (t: string): Lang => {
  const s = t.toLowerCase();
  if (/[ऀ-ॿ]/.test(t)) return "hi";
  if (/[ಀ-೿]/.test(t)) return "kn";
  if (/\b(karo|kar do|hai|aaj|kal|bai|paisa|subah|shaam|roz|baje|kaun|aaya|aayi)\b/.test(s)) return "hinglish";
  return "en";
};

const parseIntent = (raw: string): Intent => {
  const t = raw.toLowerCase().trim();

  // pre-approval
  if (/\b(pre.?approve|allow|pre.?appr|allowed)\b/.test(t) || /karo.*delivery|delivery.*karo/.test(t)) {
    let visitorType = "Delivery";
    if (/maid|bai|sunita/.test(t)) visitorType = "Maid";
    else if (/driver/.test(t)) visitorType = "Driver";
    else if (/guest|friend|karan|brother|bhai/.test(t)) visitorType = "Guest";
    else if (/blinkit|zepto|swiggy|amazon|delivery|instamart/.test(t)) visitorType = "Delivery";

    let duration = "";
    const hr = t.match(/(\d+)\s*(hour|hr|ghante|ghanta)/);
    if (hr) duration = `${hr[1]} hour${+hr[1] > 1 ? "s" : ""}`;
    else if (/today|aaj/.test(t)) duration = "today";
    else if (/tomorrow|kal/.test(t)) duration = "tomorrow";
    else if (/evening|shaam/.test(t)) duration = "this evening 7–9pm";
    else if (/morning|subah/.test(t)) duration = "morning 7–9am";
    else if (/weekday|mon.?fri|roz/.test(t)) duration = "Mon–Fri, 7–9am";

    const nameM = raw.match(/\b(karan|rahul|sunita|raju|amit|priya|ramesh)\b/i);
    const name = nameM?.[1];

    if (!duration) return { kind: "clarify", missing: "duration", original: raw };
    return { kind: "pre_approval", visitorType, duration, name };
  }

  // book amenity
  if (/\b(book|reserve)\b.*(gym|pool|swimming|banquet|hall|court)/.test(t) || /(gym|pool).*\bbook\b/.test(t)) {
    let amenity = "Gym";
    if (/pool|swim/.test(t)) amenity = "Swimming Pool";
    else if (/banquet|hall/.test(t)) amenity = "Banquet Hall";
    else if (/court/.test(t)) amenity = "Tennis Court";

    let when = "tomorrow 6–7am";
    if (/tomorrow|kal/.test(t)) when = "tomorrow 6–7am";
    else if (/saturday/.test(t)) when = "Saturday 7–8am";
    else if (/sunday/.test(t)) when = "Sunday 8–9am";
    else if (/today|aaj/.test(t)) when = "today 7–8pm";
    const tm = t.match(/(\d{1,2})\s*(am|pm)/);
    if (tm) when = when.replace(/\d.+/, `${tm[1]} ${tm[2]}, 1 hour`);
    return { kind: "book_amenity", amenity, when };
  }

  // attendance
  if (/\b(mark|attendance)\b.*\b(present|absent|aayi|aaya)\b/.test(t) || /(maid|sunita|driver|bai).*(present|absent|aayi|aaya|came)/.test(t)) {
    const status: "present" | "absent" = /absent|nahi/.test(t) ? "absent" : "present";
    let name = "Sunita (Maid)";
    if (/driver|raju/.test(t)) name = "Raju (Driver)";
    return { kind: "attendance", name, status };
  }

  // gate allow
  if (/\b(let.*in|allow|open the gate|gate khol)\b/.test(t) && /(delivery|visitor|them|him|her|guard)/.test(t)) {
    return { kind: "gate_allow" };
  }
  if (/who.*gate|kaun.*gate|who.*at the gate/.test(t)) return { kind: "gate_query" };

  // complaint
  if (/\b(complaint|raise|broken|not working|out|leak|kharab|sparking|flicker|stuck|dirty|garbage|trash|smell|spark)\b/.test(t)) {
    // Vague guard — "something is broken", "it's broken"
    if (/^(something|it|this|that)('?s)?\s+(broken|not working|off|out)\b/.test(t) && t.length < 35) {
      return {
        kind: "clarify",
        missing: "description",
        original: raw,
        followup: "Sorry to hear that. Is it electrical, plumbing, the lift, or something in the common area?",
      };
    }

    let category = "Maintenance";
    let issue = raw.trim();
    let location = "A-002";
    if (/light|bulb|electric|power|spark|switch|fan/.test(t)) category = "Electrical";
    else if (/water|leak|tap|sink|plumb|drain|toilet/.test(t)) category = "Plumbing";
    else if (/lift|elevator/.test(t)) category = "Lift";
    else if (/clean|garbage|trash|dirty|housekeep|sweep/.test(t)) category = "Housekeeping";

    if (/corridor|hallway|lobby|common|garden|park|gate|stair/.test(t)) location = "Common area";
    if (/d.?block|block d/.test(t)) location = "D Block";
    else if (/c.?block|block c/.test(t)) location = "C Block";
    else if (/b.?block|block b/.test(t)) location = "B Block";
    const fm = t.match(/(\d+)(st|nd|rd|th)?\s*floor/);
    if (fm) location += ` · Floor ${fm[1]}`;

    const urgent = /\b(urgent|emergency|asap|immediately|spark|sparking|leaking everywhere|fire|smoke|flood|gas|trapped|stuck)\b/.test(t);
    const isCommon = /\b(everyone|hallway|corridor|lobby|common|garden|lift|elevator|stair|gate|block)\b/.test(t);
    const visibility: "personal" | "community" = isCommon ? "community" : "personal";

    return { kind: "complaint", issue, location, category, urgent, visibility };
  }

  // pay maintenance
  if (/\b(pay|paisa|maintenance|dues)\b/.test(t)) {
    return { kind: "pay_maintenance", amount: 3200 };
  }

  // society query
  if (/\b(when|what|who|kab|kya|kaun)\b/.test(t) && /(gym|pool|amc|admin|timing|rule|parking)/.test(t)) {
    return { kind: "society_query", topic: t.includes("gym") ? "Gym timings" : "Society info" };
  }

  return { kind: "unknown", original: raw };
};

const normalizeAiIntent = (o: any, original: string): Intent => {
  switch (o?.kind) {
    case "pre_approval":
      if (!o.duration) return { kind: "clarify", missing: "duration", original };
      return { kind: "pre_approval", visitorType: o.visitorType || "Delivery", duration: o.duration, name: o.name };
    case "book_amenity":
      return { kind: "book_amenity", amenity: o.amenity || "Gym", when: o.when || "tomorrow 6–7am" };
    case "attendance":
      return { kind: "attendance", name: o.name || "Sunita (Maid)", status: o.status === "absent" ? "absent" : "present" };
    case "gate_allow": return { kind: "gate_allow" };
    case "gate_query": return { kind: "gate_query" };
    case "complaint":
      return {
        kind: "complaint",
        issue: o.issue || "General",
        location: o.location || "A-002",
        category: o.category,
        urgent: !!o.urgent,
        visibility: o.visibility === "community" ? "community" : "personal",
      };
    case "society_query":
      return { kind: "society_query", topic: o.topic || "Society info" };
    case "pay_maintenance":
      return { kind: "pay_maintenance", amount: typeof o.amount === "number" ? o.amount : 3200 };
    case "clarify":
      return { kind: "clarify", missing: o.missing || "duration", original };
    default:
      return { kind: "unknown", original };
  }
};

const intentSummary = (i: Intent): { title: string; lines: string[]; cta: string } => {

  switch (i.kind) {
    case "pre_approval":
      return {
        title: "Create pre-approval",
        lines: [
          `Visitor: ${i.visitorType}${i.name ? ` (${i.name})` : ""}`,
          `Window: ${i.duration}`,
          `Guard will wave them through silently.`,
        ],
        cta: "Confirm pre-approval",
      };
    case "book_amenity":
      return {
        title: `Book ${i.amenity}`,
        lines: [`When: ${i.when}`, `Reminder will be set 15 min before.`],
        cta: "Confirm booking",
      };
    case "attendance":
      return {
        title: "Mark attendance",
        lines: [`${i.name} → ${i.status.toUpperCase()}`, `Today, ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}`],
        cta: i.status === "absent" ? "Mark absent" : "Mark present",
      };
    case "gate_allow":
      return { title: "Allow visitor at gate", lines: ["Swiggy delivery · waiting 0:42", "Gate will open and chime will play."], cta: "Allow & open gate" };
    case "gate_query":
      return { title: "Who's at the gate", lines: ["No active request.", "Last entry: Blinkit at 8:32am (auto-approved)."], cta: "Got it" };
    case "complaint":
      return {
        title: i.urgent ? "Raise URGENT ticket" : "Raise maintenance ticket",
        lines: [
          `${i.category ? i.category + " · " : ""}${i.issue}`,
          `Location: ${i.location}`,
          `Visibility: ${i.visibility === "community" ? "Community (All)" : "Personal (Only me)"}`,
          i.urgent ? "Priority: URGENT · technician dispatched in 30 min" : "Priority: Normal · ETA 2 working days",
        ],
        cta: i.urgent ? "Raise urgent ticket" : "Confirm & log ticket",
      };
    case "society_query":
      return { title: i.topic, lines: ["Gym: 5:00am – 10:00pm daily", "Pool: 6:00am – 9:00pm (closed Mondays)"], cta: "Thanks" };
    case "pay_maintenance":
      return { title: "Pay maintenance", lines: [`Outstanding: ₹${i.amount.toLocaleString("en-IN")}`, "Month: This month", "Pays via your default UPI."], cta: `Pay ₹${i.amount.toLocaleString("en-IN")}` };
    default:
      return { title: "Got it", lines: ["Tap confirm to continue."], cta: "Confirm" };
  }
};

const intentEvent = (i: Intent): { type: EventType; label: string; meta?: string } => {
  switch (i.kind) {
    case "pre_approval":     return { type: "create_pre_approval", label: `${i.visitorType} · ${i.duration}`, meta: "source=ASSISTANT_VOICE" };
    case "book_amenity":     return { type: "amenity_booked", label: `${i.amenity} · ${i.when}`, meta: "source=ASSISTANT" };
    case "attendance":       return { type: "attendance_marked", label: `${i.name} · ${i.status}` };
    case "gate_allow":       return { type: "gate_request_resolved", label: "Allowed via assistant", meta: "method=voice" };
    case "complaint":        return { type: "maintenance_ticket_raised", label: `${i.issue} @ ${i.location}` };
    case "pay_maintenance":  return { type: "assistant_action_completed", label: `Paid ₹${i.amount}` };
    default:                 return { type: "assistant_action_completed", label: "Done" };
  }
};

// ============ Root ============

export type PreApproval = {
  id: string;
  visitorType: string;
  name?: string;
  duration: string;
  source: "ASSISTANT_VOICE" | "ASSISTANT_TEXT" | "MANUAL";
  at: number;
};

export type Ticket = {
  id: string;
  ticketNumber: string;
  issue: string;
  location: string;
  category?: string;
  urgent?: boolean;
  visibility?: "personal" | "community";
  status: "Open" | "In Progress" | "Resolved";
  source: "ASSISTANT_VOICE" | "ASSISTANT_TEXT" | "MANUAL";
  at: number;
};

type AdCreative = { brand: string; tagline: string; cta: string; emoji: string; accent: string };
const AD_POOL: AdCreative[] = [
  { brand: "Blinkit", tagline: "Groceries in 10 minutes to A-002", cta: "Order now", emoji: "🛒", accent: "from-[oklch(0.85_0.18_95)] to-[oklch(0.7_0.2_60)]" },
  { brand: "Swiggy Dineout", tagline: "Flat 30% off tonight near HSR", cta: "Book a table", emoji: "🍽️", accent: "from-[oklch(0.75_0.2_30)] to-[oklch(0.6_0.22_15)]" },
  { brand: "cult.fit", tagline: "Free trial session at your society gym", cta: "Claim trial", emoji: "💪", accent: "from-[oklch(0.7_0.18_150)] to-[oklch(0.55_0.2_170)]" },
  { brand: "Urban Company", tagline: "Deep home cleaning · ₹999 today", cta: "Book service", emoji: "🧹", accent: "from-[oklch(0.7_0.18_260)] to-[oklch(0.55_0.2_280)]" },
  { brand: "NoBroker Pay", tagline: "Pay rent on credit card · 0% fee", cta: "Pay now", emoji: "💳", accent: "from-[oklch(0.7_0.18_200)] to-[oklch(0.55_0.2_220)]" },
  { brand: "Asian Paints", tagline: "Free home colour consultation", cta: "Book visit", emoji: "🎨", accent: "from-[oklch(0.75_0.18_330)] to-[oklch(0.6_0.2_350)]" },
];
const AD_BY_CATEGORY: Record<string, AdCreative> = {
  Electrical: { brand: "Urban Company", tagline: "Certified electrician at A-002 in 60 min · ₹199", cta: "Book electrician", emoji: "⚡", accent: "from-[oklch(0.78_0.18_85)] to-[oklch(0.62_0.2_55)]" },
  Plumbing:   { brand: "Urban Company", tagline: "Plumber on-call · same-day leak fix · ₹249", cta: "Book plumber", emoji: "🔧", accent: "from-[oklch(0.7_0.18_220)] to-[oklch(0.55_0.2_240)]" },
  Housekeeping: { brand: "Urban Company", tagline: "Deep home cleaning · ₹999 today only", cta: "Book service", emoji: "🧹", accent: "from-[oklch(0.7_0.18_260)] to-[oklch(0.55_0.2_280)]" },
  Lift:       { brand: "NoBroker Insure", tagline: "Personal accident cover · ₹49/month", cta: "Get covered", emoji: "🛡️", accent: "from-[oklch(0.65_0.18_25)] to-[oklch(0.5_0.2_15)]" },
  Maintenance:{ brand: "Asian Paints", tagline: "Free home colour & repair consultation", cta: "Book visit", emoji: "🎨", accent: "from-[oklch(0.75_0.18_330)] to-[oklch(0.6_0.2_350)]" },
};
const pickAd = () => AD_POOL[Math.floor(Math.random() * AD_POOL.length)];
const pickAdForCategory = (cat?: string) => (cat && AD_BY_CATEGORY[cat]) || pickAd();
const newTicketNumber = () => `HD-${Math.floor(1000 + Math.random() * 9000)}`;

export function HoodApp() {
  const [log, setLog] = useState<LogEvent[]>([]);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantAutoConnectToken, setAssistantAutoConnectToken] = useState(0);
  const [assistantIntroActive, setAssistantIntroActive] = useState(false);
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const [successBanner, setSuccessBanner] = useState<{ title: string; subtitle: string; ad: AdCreative; ticketId?: string; key: number } | null>(null);
  const [agentFocus, setAgentFocus] = useState<{ id: string | null; key: number }>({ id: null, key: 0 });
  const assistantIntroRunRef = useRef(0);

  const [preApprovals, setPreApprovals] = useState<PreApproval[]>([
    { id: "seed1", visitorType: "Delivery", duration: "Mon–Fri, 7–9am", source: "MANUAL", at: Date.now() - 1000 * 60 * 60 * 24 },
  ]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [screen, setScreen] = useState<{ kind: ScreenKind; autoFill?: ScreenAutoFill; key: number } | null>(null);
  const openScreen = (kind: ScreenKind, autoFill?: ScreenAutoFill) =>
    setScreen({ kind, autoFill, key: Date.now() });
  const handleScreenSubmit = (kind: ScreenKind, p: ScreenSubmitPayload) => {
    if (kind === "pre-approve") {
      const id = addPreApproval({
        visitorType: p.visitorType || "Delivery",
        name: p.name,
        duration: p.duration || "today",
        source: p.source,
      });
      pushLog("create_pre_approval", `${p.visitorType} · ${p.duration}`, `source=${p.source}`);
      setToast({ text: `${p.visitorType || "Visitor"} pre-approved · ${p.duration || "today"}`, undo: () => removePreApproval(id) });
      showSuccess(`${p.visitorType || "Visitor"} pre-approved`, p.duration || "today");
      focusAgent("view-all");
    } else if (kind === "helpdesk") {
      const cat = p.category;
      const { id, ticketNumber } = addTicket({
        issue: p.issue || "",
        location: p.location || "A-002",
        category: cat,
        urgent: p.urgent,
        visibility: p.visibility,
        source: p.source,
      });
      pushLog("maintenance_ticket_raised", `${p.issue} @ ${p.location}`, `source=${p.source}${p.urgent ? " urgent=1" : ""}`);
      setToast({ text: `Ticket ${ticketNumber} logged · ${p.issue}`, undo: () => removeTicket(id) });
      showSuccess(
        p.urgent ? `Urgent ticket raised · ${ticketNumber}` : `Ticket raised · ${ticketNumber}`,
        `${cat ? cat + " · " : ""}${p.location || "A-002"}`,
        { ad: pickAdForCategory(cat), ticketId: ticketNumber },
      );
      focusAgent("view-all");
    } else if (kind === "amenities") {
      pushLog("amenity_booked", `${p.amenity} · ${p.when}`, `source=${p.source}`);
      setToast({ text: `${p.amenity} booked · ${p.when}` });
      showSuccess(`${p.amenity} booked`, p.when || "");
    }
  };


  const pushLog = (type: EventType, label: string, meta?: string) =>
    setLog((l) => [{ id: Math.random().toString(36).slice(2), type, label, meta, at: Date.now() }, ...l].slice(0, 60));

  const addPreApproval = (pa: Omit<PreApproval, "id" | "at">) => {
    const id = Math.random().toString(36).slice(2);
    setPreApprovals((p) => [{ ...pa, id, at: Date.now() }, ...p]);
    return id;
  };
  const removePreApproval = (id: string) => setPreApprovals((p) => p.filter((x) => x.id !== id));

  const addTicket = (t: Omit<Ticket, "id" | "at" | "status" | "ticketNumber"> & { status?: Ticket["status"]; ticketNumber?: string }) => {
    const id = Math.random().toString(36).slice(2);
    const ticketNumber = t.ticketNumber || newTicketNumber();
    setTickets((arr) => [{ status: "Open", ...t, ticketNumber, id, at: Date.now() }, ...arr]);
    return { id, ticketNumber };
  };
  const removeTicket = (id: string) => setTickets((arr) => arr.filter((x) => x.id !== id));

  const focusAgent = (id: string) => setAgentFocus((f) => ({ id, key: f.key + 1 }));

  const showSuccess = (title: string, subtitle: string, opts?: { ad?: AdCreative; ticketId?: string }) =>
    setSuccessBanner({ title, subtitle, ad: opts?.ad ?? pickAd(), ticketId: opts?.ticketId, key: Date.now() });

  const stopAssistantIntro = () => {
    assistantIntroRunRef.current += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setAssistantIntroActive(false);
  };

  const closeAssistant = () => {
    stopAssistantIntro();
    setAssistantOpen(false);
  };

  const openAssistantWithIntro = () => {
    // Cancel any lingering speech and skip the spoken intro — Myra goes
    // straight into persistent listening so the user can speak immediately.
    assistantIntroRunRef.current += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setAssistantIntroActive(false);
    setAssistantOpen(true);
    pushLog("assistant_opened", "FAB tap");
    setAssistantAutoConnectToken((token) => token + 1);
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 10000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!successBanner) return;
    const t = setTimeout(() => setSuccessBanner(null), 8000);
    return () => clearTimeout(t);
  }, [successBanner]);

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);


  return (
    <div className="min-h-screen bg-[oklch(0.96_0.005_60)] text-foreground flex justify-center">
      <div className="w-full max-w-[440px] relative pb-24 min-h-screen bg-[oklch(0.96_0.005_60)]">
        <NobrokerHome
          onOpenAssistant={openAssistantWithIntro}
          onOpenViewAll={() => setViewAllOpen(true)}
          onOpenScreen={openScreen}
          preApprovalCount={preApprovals.length + tickets.length}
          agentFocus={agentFocus}
        />
        <BottomNav />

        {/* Floating Assistant FAB */}
        {!assistantOpen && !viewAllOpen && !screen && (
          <button
            onClick={openAssistantWithIntro}
            aria-label="Talk to Myra"
            className="fixed bottom-24 right-[max(1rem,calc(50%-220px+1rem))] z-40 rounded-full bg-gradient-to-br from-primary to-[oklch(0.45_0.2_18)] text-primary-foreground shadow-2xl shadow-primary/40 pl-1.5 pr-4 py-1.5 flex items-center gap-2 font-bold text-[13px] active:scale-95 transition assistant-fab"
          >
            <span className="relative grid place-items-center w-10 h-10 rounded-full bg-white/15 ring-2 ring-white/40">
              <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
              <span className="relative text-[16px] font-extrabold">M</span>
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[10px] opacity-80 font-semibold">Tap to talk</span>
              <span className="text-[14px] font-extrabold flex items-center gap-1">Myra <Mic className="w-3 h-3" /></span>
            </span>
          </button>
        )}

        {viewAllOpen && (
          <ViewAllSheet
            items={preApprovals}
            tickets={tickets}
            onClose={() => setViewAllOpen(false)}
            onRemove={removePreApproval}
            onRemoveTicket={removeTicket}
          />
        )}

        {screen?.kind === "pre-approve" && (
          <PreApproveScreen
            key={screen.key}
            autoFill={screen.autoFill}
            onClose={() => setScreen(null)}
            onSubmit={(p) => handleScreenSubmit("pre-approve", p)}
          />
        )}
        {screen?.kind === "helpdesk" && (
          <HelpdeskScreen
            key={screen.key}
            autoFill={screen.autoFill}
            onClose={() => setScreen(null)}
            onSubmit={(p) => handleScreenSubmit("helpdesk", p)}
          />
        )}
        {screen?.kind === "amenities" && (
          <AmenitiesScreen
            key={screen.key}
            autoFill={screen.autoFill}
            onClose={() => setScreen(null)}
            onSubmit={(p) => handleScreenSubmit("amenities", p)}
          />
        )}

        {assistantOpen && (
          <Assistant
            onClose={closeAssistant}
            introActive={assistantIntroActive}
            autoConnectToken={assistantAutoConnectToken}
            onInterruptIntro={() => {
              stopAssistantIntro();
              setAssistantAutoConnectToken((token) => token + 1);
            }}
            log={log}
            pushLog={pushLog}
            onToast={(t, undo) => setToast({ text: t, undo })}
            addPreApproval={addPreApproval}
            removePreApproval={removePreApproval}
            addTicket={addTicket}
            removeTicket={removeTicket}
            onOpenViewAll={() => { setAssistantOpen(false); setViewAllOpen(true); }}
            onAgentAction={focusAgent}
            onOpenScreen={openScreen}
            onSuccess={showSuccess}
          />
        )}


        {toast && (
          <div className="fixed bottom-[88px] left-1/2 -translate-x-1/2 z-50 bg-foreground text-background rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 slide-up max-w-[420px] w-[calc(100%-2rem)]">
            <Check className="w-4 h-4 text-success shrink-0" />
            <span className="text-[13px] flex-1 truncate">{toast.text}</span>
            {toast.undo && (
              <button onClick={() => { toast.undo!(); setToast(null); }} className="text-[12px] font-bold text-primary flex items-center gap-1">
                <Undo2 className="w-3.5 h-3.5" /> Undo
              </button>
            )}
          </div>
        )}

        {successBanner && (
          <div key={successBanner.key} className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-[420px] slide-down">
            <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
              <div className="px-4 py-3 flex items-start gap-3 bg-gradient-to-r from-success/15 to-success/5">
                <div className="w-9 h-9 rounded-full bg-success text-white grid place-items-center shrink-0 shadow-md shadow-success/30">
                  <Check className="w-5 h-5" strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-extrabold text-foreground truncate">{successBanner.title}</div>
                  <div className="text-[12px] text-muted-foreground truncate">
                    {successBanner.ticketId && <span className="font-bold text-foreground/80">#{successBanner.ticketId} · </span>}
                    {successBanner.subtitle} · completed
                  </div>
                </div>
                <button onClick={() => setSuccessBanner(null)} className="text-muted-foreground/70 hover:text-foreground -mr-1 -mt-1 p-1" aria-label="Dismiss">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className={`px-4 py-3 flex items-center gap-3 bg-gradient-to-r ${successBanner.ad.accent} text-white`}>
                <div className="w-10 h-10 rounded-xl bg-white/20 grid place-items-center text-[20px] shrink-0 backdrop-blur">
                  {successBanner.ad.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider opacity-80 font-bold">Sponsored · {successBanner.ad.brand}</div>
                  <div className="text-[13px] font-bold leading-tight truncate">{successBanner.ad.tagline}</div>
                </div>
                <button className="bg-white text-foreground rounded-full px-3 py-1.5 text-[12px] font-extrabold shrink-0 active:scale-95 transition">
                  {successBanner.ad.cta}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}



// ============ NoBroker-style Home ============

function NobrokerHome({ onOpenAssistant, onOpenViewAll, onOpenScreen, preApprovalCount, agentFocus }: { onOpenAssistant: () => void; onOpenViewAll: () => void; onOpenScreen: (kind: ScreenKind, autoFill?: ScreenAutoFill) => void; preApprovalCount: number; agentFocus: { id: string | null; key: number } }) {
  const [tab, setTab] = useState<"Visitors" | "My Bills" | "Society" | "Services">("Visitors");
  return (
    <div className="relative">
      {/* Status bar */}
      <div className="px-5 pt-2 flex items-center justify-between text-[14px] font-semibold">
        <span>12:25</span>
        <span className="flex items-center gap-2 text-foreground">
          <span className="flex items-end gap-[1px]">
            <span className="w-[3px] h-[4px] bg-foreground rounded-[1px]" />
            <span className="w-[3px] h-[6px] bg-foreground rounded-[1px]" />
            <span className="w-[3px] h-[8px] bg-foreground rounded-[1px]" />
            <span className="w-[3px] h-[10px] bg-foreground/40 rounded-[1px]" />
          </span>
          <span className="text-[11px] font-bold">4G</span>
          <span className="relative inline-flex items-center">
            <span className="w-7 h-3 rounded-[3px] border-[1.5px] border-foreground/80 grid place-items-start p-[1px]">
              <span className="block h-full w-1/2 bg-foreground rounded-[1px]" />
            </span>
            <span className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-1.5 bg-foreground/80 rounded-r" />
            <span className="ml-1 text-[9.5px] font-bold">50</span>
          </span>
        </span>
      </div>

      {/* Header */}
      <header className="px-3 pt-3 pb-3 flex items-center gap-2">
        <button className="flex items-center gap-1.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-foreground/70 to-foreground grid place-items-center text-white text-[12px] font-bold ring-2 ring-white shadow" />
          <span className="text-[14px] font-bold">…-321</span>
          <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
        <button className="ml-1 flex-1 flex items-center gap-1.5 bg-white rounded-full pl-1 pr-2 py-1 shadow-sm min-w-0 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-[oklch(0.95_0.01_0)] grid place-items-center shrink-0">
            <Truck className="w-3.5 h-3.5 text-foreground/70" />
          </div>
          <span className="text-[12.5px] font-bold truncate flex-1">Starts Outsid…</span>
          <ChevronDown className="w-3.5 h-3.5 text-foreground/70 shrink-0" strokeWidth={2.5} />
        </button>
        <button className="w-8 h-8 grid place-items-center"><Search className="w-5 h-5" strokeWidth={2.5} /></button>
        <div className="w-8 h-8 rounded-full bg-[oklch(0.68_0.18_55)] grid place-items-center text-white font-extrabold text-[14px]">N</div>
      </header>

      {/* Tabs card with curved active tab */}
      <div className="mx-3">
        <div className="grid grid-cols-4 px-1">
          {(["Visitors", "My Bills", "Society", "Services"] as const).map((t) => {
            const emoji = t === "Visitors" ? "🏠" : t === "My Bills" ? "🧾" : t === "Society" ? "🏛️" : "🛠️";
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative flex flex-col items-center gap-1 pt-3 pb-4 -mb-2 rounded-t-2xl ${active ? "bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.04)] z-10" : ""}`}
              >
                <div className="text-[26px] leading-none">{emoji}</div>
                <div className={`text-[12px] ${active ? "font-extrabold" : "font-semibold text-foreground/75"}`}>{t}</div>
              </button>
            );
          })}
        </div>
        <div className="bg-white rounded-2xl rounded-tl-none shadow-sm px-4 pt-4 pb-4 relative z-0">
          <div className="grid grid-cols-3 gap-2">
            <QuickAction
              id="pre-approve"
              icon={<UserPlus className="w-5 h-5 text-foreground/70" strokeWidth={2} />}
              label="Pre-Appr…"
              badge
              onClick={() => onOpenScreen("pre-approve")}
              agentFocus={agentFocus}
            />
            <QuickAction
              id="daily-help"
              icon={<HandHeart className="w-5 h-5 text-foreground/70" strokeWidth={2} />}
              label="Daily Help"
              badge
              onClick={onOpenAssistant}
              agentFocus={agentFocus}
            />
            <QuickAction
              id="view-all"
              icon={<ArrowUpRight className="w-5 h-5 text-[oklch(0.5_0.12_180)]" strokeWidth={2.5} />}
              label="View All"
              onClick={onOpenViewAll}
              count={preApprovalCount}
              agentFocus={agentFocus}
            />
          </div>
        </div>
      </div>

      {/* GIVA ribbon */}
      <button className="mx-3 mt-3 w-[calc(100%-1.5rem)] flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[oklch(0.88_0.05_25)] to-[oklch(0.92_0.04_20)] px-2.5 py-2 shadow-sm">
        <span className="bg-[oklch(0.3_0.08_25)] text-white text-[11px] font-extrabold tracking-wide italic px-2 py-1 rounded">GIVA</span>
        <span className="text-[12.5px] font-semibold text-foreground/85 truncate flex-1 text-left">GIVA-வில் புது வரவுகள்</span>
        <ChevronRight className="w-4 h-4 text-foreground/60" />
      </button>

      {/* Fire OTP card */}
      <button className="mx-3 mt-3 w-[calc(100%-1.5rem)] flex items-center gap-2.5 rounded-2xl bg-white shadow-sm px-3 py-3">
        <div className="w-8 h-8 rounded-full bg-[oklch(0.95_0.02_30)] grid place-items-center shrink-0">
          <Flame className="w-4 h-4 text-[oklch(0.55_0.22_25)]" />
        </div>
        <div className="flex-1 min-w-0 text-left flex items-center gap-2 flex-wrap">
          <span className="text-[13.5px] font-extrabold">Fire</span>
          <span className="text-foreground/40 font-bold">|</span>
          <span className="text-[13.5px] font-bold">D-Block-321</span>
          <span className="bg-foreground text-white text-[10px] font-extrabold px-2 py-0.5 rounded">OTP - 240997</span>
        </div>
        <span className="text-[13px] font-extrabold text-[oklch(0.5_0.12_180)] flex items-center shrink-0">View <ChevronRight className="w-4 h-4" /></span>
      </button>

      {/* Your actions */}
      <div className="mx-3 mt-3 rounded-2xl bg-white shadow-sm p-3.5">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-[15px] font-extrabold">Your actions</h3>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-foreground/60"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>
          <span className="bg-[oklch(0.55_0.22_25)] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">NEW</span>
          <button className="ml-auto text-[12.5px] font-bold text-foreground/40">See all</button>
        </div>
        <div className="flex gap-3 overflow-x-auto -mx-3.5 px-3.5 pb-1">
          <ActionTileLarge icon={<HelpCircle className="w-7 h-7 text-foreground/80" strokeWidth={1.8} />} label="Helpdesk" onClick={() => onOpenScreen("helpdesk")} />
          <ActionTileLarge
            label="Cleaning"
            customTile={
              <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-[oklch(0.55_0.22_295)] to-[oklch(0.4_0.2_290)] grid place-items-center text-white">
                <span className="text-[11px] font-extrabold tracking-wide">INSTANT</span>
              </div>
            }
            onClick={() => onOpenScreen("amenities")}
          />
          <ActionTileLarge icon={<ShoppingBag className="w-7 h-7 text-foreground/80" strokeWidth={1.8} />} label="Marketpla…" />
          <ActionTileLarge icon={<IdCard className="w-7 h-7 text-foreground/80" strokeWidth={1.8} />} label="Visit Pass" />
        </div>
      </div>

      {/* McCain promo banner */}
      <div className="mx-3 mt-3 flex gap-2 overflow-x-auto pb-1">
        <div className="shrink-0 w-[88%] h-[150px] rounded-2xl overflow-hidden bg-gradient-to-br from-[oklch(0.28_0.04_30)] to-[oklch(0.18_0.03_25)] text-white relative p-4">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[oklch(0.85_0.15_85)]">⚡ SNACK & WIN</div>
          <div className="text-[12px] font-bold mt-1 leading-tight">SUBMIT YOUR ENTRY & GET<br/>AN <span className="text-[oklch(0.7_0.2_25)] font-extrabold">EXTRA 10% OFF</span> ON<br/>MCCAIN SNACKS</div>
          <button className="mt-2 bg-white text-foreground text-[11px] font-extrabold rounded-full px-3 py-1.5">Order Now</button>
          <div className="absolute top-2 right-2 w-9 h-9 rounded-full bg-[oklch(0.85_0.15_85)] grid place-items-center text-[9px] font-extrabold text-[oklch(0.3_0.1_25)]">McCain</div>
        </div>
        <div className="shrink-0 w-[60%] h-[150px] rounded-2xl overflow-hidden bg-white shadow-sm relative p-3">
          <div className="text-[15px] font-extrabold leading-tight">Need a <span className="text-[oklch(0.45_0.2_295)] italic">MOV…</span></div>
          <div className="text-[10.5px] font-semibold text-foreground/70 mt-1">Book Pack…<br/>Movers n…</div>
          <Truck className="absolute bottom-3 right-3 w-12 h-12 text-foreground/70" strokeWidth={1.2} />
        </div>
      </div>

      {/* Dots pagination */}
      <div className="flex justify-center gap-1.5 mt-2">
        {[0,1,2,3,4].map((i) => (
          <span key={i} className={`rounded-full ${i===3 ? "w-4 h-1.5 bg-foreground/70" : "w-1.5 h-1.5 bg-foreground/25"}`} />
        ))}
      </div>

      {/* Vertical Amazon Now pill */}
      <div className="fixed top-1/2 right-[max(0px,calc(50%-220px))] -translate-y-1/2 z-30">
        <div className="bg-gradient-to-b from-[oklch(0.55_0.18_240)] to-[oklch(0.42_0.2_255)] text-white rounded-l-2xl px-1.5 py-3 flex flex-col items-center gap-1 shadow-lg">
          <span className="text-[9px] font-extrabold leading-tight text-center">amazon<br/>now</span>
          <span className="text-[11px] font-extrabold tracking-wider [writing-mode:vertical-rl] rotate-180">Amazon Now</span>
        </div>
      </div>

      {/* Home Services header */}
      <div className="mx-3 mt-4 rounded-t-2xl bg-white shadow-sm px-3.5 py-3 flex items-center gap-2">
        <h3 className="text-[14.5px] font-extrabold">Home Services by</h3>
        <span className="flex items-center gap-1">
          <span className="w-5 h-5 rounded-full bg-[oklch(0.55_0.22_25)] grid place-items-center text-white text-[9px] font-extrabold">∞</span>
          <span className="text-[13px] font-extrabold tracking-tight">NOBROKER</span>
        </span>
        <button className="ml-auto text-[12.5px] font-bold text-foreground/45">See All</button>
      </div>
    </div>
  );
}

function ActionTileLarge({ icon, label, customTile, onClick }: { icon?: React.ReactNode; label: string; customTile?: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="shrink-0 flex flex-col items-center gap-1.5 active:scale-95 transition">
      {customTile ?? (
        <div className="w-[72px] h-[72px] rounded-2xl bg-[oklch(0.97_0.005_60)] grid place-items-center">
          {icon}
        </div>
      )}
      <div className="text-[11.5px] font-semibold text-foreground/85 text-center leading-tight max-w-[80px] truncate">{label}</div>
    </button>
  );
}

function QuickAction({ id, icon, label, badge, onClick, count, agentFocus }: { id?: string; icon: React.ReactNode; label: string; badge?: boolean; onClick?: () => void; count?: number; agentFocus?: { id: string | null; key: number } }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [glow, setGlow] = useState(false);
  useEffect(() => {
    if (!agentFocus || !id || agentFocus.id !== id) return;
    setGlow(true);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setGlow(false), 1800);
    return () => clearTimeout(t);
  }, [agentFocus?.key, agentFocus?.id, id]);
  return (
    <button ref={ref} onClick={onClick} className="flex flex-col items-center gap-1.5 py-1 active:scale-95 transition">
      <div className={`relative w-11 h-11 rounded-full bg-[oklch(0.95_0.02_180)] border border-[oklch(0.85_0.03_180)] grid place-items-center transition ${glow ? "ring-4 ring-primary/60 ring-offset-2 ring-offset-white scale-110 animate-pulse" : ""}`}>
        {icon}
        {badge && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[oklch(0.65_0.18_150)] border-2 border-white grid place-items-center"><Plus className="w-2.5 h-2.5 text-white" strokeWidth={4} /></div>}
        {typeof count === "number" && count > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold grid place-items-center border-2 border-white">{count}</div>
        )}
      </div>
      <div className={`text-[11.5px] font-semibold truncate max-w-[80px] ${glow ? "text-primary" : "text-foreground/85"}`}>{label}</div>
    </button>
  );
}



function BottomNav() {
  const items = [
    { label: "My Hood", icon: <span className="text-primary text-xl font-extrabold">∞</span>, active: true },
    { label: "Society", icon: <Users className="w-5 h-5" /> },
    { label: "Polls", icon: <MessageSquare className="w-5 h-5" /> },
    { label: "Services", icon: <Wrench className="w-5 h-5" /> },
    { label: "Homes", icon: <Building2 className="w-5 h-5" /> },
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-30 bg-white border-t border-border/50">
      <div className="grid grid-cols-5 px-1 pt-1 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
        {items.map((it) => (
          <button key={it.label} className={`flex flex-col items-center gap-0.5 py-2 ${it.active ? "text-primary" : "text-foreground/70"}`}>
            <div className="h-6 grid place-items-center">{it.icon}</div>
            <span className={`text-[10.5px] font-bold ${it.active ? "text-primary" : ""}`}>{it.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ============ AI Assistant Bottom Sheet ============

const SUGGESTIONS = [
  { label: "Pre-approve Blinkit for 2 hours", icon: <Truck className="w-3.5 h-3.5" /> },
  { label: "Book gym tomorrow 6am", icon: <Calendar className="w-3.5 h-3.5" /> },
  { label: "Mark Sunita present", icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { label: "Corridor light 4th floor is out", icon: <Wrench className="w-3.5 h-3.5" /> },
  { label: "Who came home today?", icon: <HousePlug className="w-3.5 h-3.5" /> },
];

function Assistant({
  onClose, introActive, autoConnectToken, onInterruptIntro, log, pushLog, onToast, addPreApproval, removePreApproval, addTicket, removeTicket, onOpenViewAll, onAgentAction, onOpenScreen, onSuccess,
}: {
  onClose: () => void;
  introActive: boolean;
  autoConnectToken: number;
  onInterruptIntro: () => void;
  log: LogEvent[];
  pushLog: (t: EventType, l: string, m?: string) => void;
  onToast: (t: string, undo?: () => void) => void;
  addPreApproval: (pa: Omit<PreApproval, "id" | "at">) => string;
  removePreApproval: (id: string) => void;
  addTicket: (t: Omit<Ticket, "id" | "at" | "status" | "ticketNumber"> & { status?: Ticket["status"]; ticketNumber?: string }) => { id: string; ticketNumber: string };
  removeTicket: (id: string) => void;
  onOpenViewAll: () => void;
  onAgentAction: (id: string) => void;
  onOpenScreen: (kind: ScreenKind, autoFill?: ScreenAutoFill) => void;
  onSuccess: (title: string, subtitle: string, opts?: { ad?: AdCreative; ticketId?: string }) => void;
}) {


  const greeting: Msg = { id: "greet", role: "assistant", lang: "en", text: "Hi Falgun, I'm Myra 👋 — your NoBroker Hood assistant. I can pre-approve visitors, book amenities, mark daily-help attendance, raise tickets and more. Speak in any language, or tap a suggestion below." };
  const [msgs, setMsgs] = useState<Msg[]>([greeting]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [interim, _setInterim] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const userMsgIdRef = useRef<string | null>(null);
  const asstMsgIdRef = useRef<string | null>(null);
  const [tab, setTab] = useState<"chat" | "events">("chat");
  const [mode, setMode] = useState<"voice" | "chat">("voice");
  const [showCaptions, setShowCaptions] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking, interim]);

  useEffect(() => () => { try { sessionRef.current?.stop(); } catch {} }, []);

  useEffect(() => {
    if (!autoConnectToken) return;
    startVoice();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnectToken]);

  const parseIntent_server = parseHoodIntent;

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const lang = detectLang(text);
    const userMsg: Msg = { id: Math.random().toString(36).slice(2), role: "user", text, lang };
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    pushLog("assistant_command_received", text, `lang=${lang}`);

    // If a card is awaiting confirmation, allow natural replies to act on it.
    const pending = [...msgs].reverse().find(
      (x) => x.role === "card" && (x as any).status === "pending",
    ) as (Msg & { role: "card"; intent: Intent; status: "pending" }) | undefined;
    if (pending) {
      const t = text.toLowerCase();
      const confirmRe = /^(yes|yep|yeah|ok|okay|confirm|do it|go ahead|allow|approve|sure|haan|haa|ji|theek hai|kar do|kardo|proceed|sahi|done)\b/i;
      const cancelRe = /^(no|nope|cancel|stop|nahi|nahin|mat karo|don'?t|abort|reject|deny)\b/i;
      if (confirmRe.test(t)) {
        pushLog("assistant_action_confirmed", `${pending.intent.kind}`, "confirmation=voice");
        confirmCard(pending.id, pending.intent);
        return;
      }
      if (cancelRe.test(t)) {
        cancelCard(pending.id);
        return;
      }
    }

    setThinking(true);


    let intent: Intent;
    let aiReply: string | undefined;
    try {
      const out = await parseIntent_server(text);
      aiReply = out?.reply;
      intent = normalizeAiIntent(out, text);
    } catch (e: any) {
      pushLog("assistant_action_failed", "ai_parse_error", e?.message ?? "unknown");
      intent = parseIntent(text); // graceful fallback to local NLU
      if (intent.kind === "unknown") onAgentAction("daily-help");
    }

    pushLog("assistant_intent_recognised", `intent=${intent!.kind}`, "source=ai");

    if (intent!.kind === "clarify") {
      pushLog("assistant_clarification_requested", `missing=${(intent as any).missing}`);
      const followup = (intent as any).followup
        ?? aiReply
        ?? ((intent as any).missing === "description"
            ? "Could you tell me what's broken — is it electrical, plumbing, the lift, or something in the common area?"
            : `For how long should I pre-approve? E.g. "2 hours" or "today morning".`);
      setMsgs((m) => [...m, { id: rid(), role: "assistant", lang, text: followup }]);
      onAgentAction((intent as any).missing === "description" ? "daily-help" : "pre-approve");
    } else if (intent!.kind === "unknown") {
      setMsgs((m) => [...m, { id: rid(), role: "assistant", lang, text: (aiReply ?? `I couldn't do that for you — I've highlighted the closest option on your home screen.`) }]);
      onAgentAction("daily-help");
    } else if (intent!.kind === "society_query") {
      setMsgs((m) => [...m, { id: rid(), role: "assistant", lang, text: aiReply ?? `Here's what I know about ${(intent as any).topic}.` }]);
    } else {
      setMsgs((m) => [...m, { id: rid(), role: "card", intent: intent!, status: "pending" }]);
    }
    setThinking(false);
  };


  const confirmCard = (cardId: string, intent: Intent) => {
    setMsgs((m) => m.map((x) => (x.role === "card" && x.id === cardId ? { ...x, status: "done" } : x)));
    pushLog("assistant_action_confirmed", `${intent.kind}`, "confirmation=tap");
    const ev = intentEvent(intent);
    pushLog(ev.type, ev.label, ev.meta);
    pushLog("assistant_action_completed", `${intent.kind}`, "success=true");
    const sum = intentSummary(intent);

    let createdId: string | null = null;
    let createdTicketId: string | null = null;
    let createdTicketNumber: string | null = null;
    let createdCategory: string | undefined;
    let extraText = "";
    if (intent.kind === "pre_approval") {
      createdId = addPreApproval({
        visitorType: intent.visitorType,
        name: intent.name,
        duration: intent.duration,
        source: "ASSISTANT_VOICE",
      });
      extraText = " Added to View All.";
    } else if (intent.kind === "complaint") {
      createdCategory = intent.category;
      const t = addTicket({
        issue: intent.issue,
        location: intent.location,
        category: intent.category,
        urgent: intent.urgent,
        visibility: intent.visibility,
        source: "ASSISTANT_VOICE",
      });
      createdTicketId = t.id;
      createdTicketNumber = t.ticketNumber;
      extraText = ` Ticket ${t.ticketNumber} added to View All.`;
    }

    // Spotlight the matching home widget so the user sees the agent act on the page
    const focusMap: Partial<Record<Intent["kind"], string>> = {
      pre_approval: "pre-approve",
      attendance: "daily-help",
      gate_allow: "pre-approve",
      gate_query: "pre-approve",
      book_amenity: "view-all",
      complaint: "view-all",
      pay_maintenance: "view-all",
    };
    const focusId = focusMap[intent.kind];
    if (focusId) onAgentAction(focusId);
    if (focusId === "view-all") onOpenViewAll();



    setMsgs((m) => [...m, {
      id: rid(), role: "assistant", lang: "en",
      text: `Done — ${sum.title.toLowerCase()}.${extraText}`,
    }]);

    if (intent.kind === "pre_approval") {
      setMsgs((m) => [...m, {
        id: rid(), role: "assistant", lang: "en",
        text: `Tap below to see all your pre-approvals.`,
      }]);
    }

    if (intent.kind === "complaint") {
      onSuccess(
        intent.urgent ? `Urgent ticket raised · ${createdTicketNumber}` : `Ticket raised · ${createdTicketNumber}`,
        `${createdCategory ? createdCategory + " · " : ""}${intent.location}`,
        { ad: pickAdForCategory(createdCategory), ticketId: createdTicketNumber ?? undefined },
      );
    } else {
      onSuccess(sum.title, sum.lines[0] || intent.kind.replace(/_/g, " "));
    }
    onToast(sum.title + " completed", () => {

      pushLog("assistant_undo_triggered", `${intent.kind}`);
      if (createdId) removePreApproval(createdId);
      if (createdTicketId) removeTicket(createdTicketId);
      setMsgs((m) => m.map((x) => (x.role === "card" && x.id === cardId ? { ...x, status: "cancelled" } : x)));
    });

    if (intent.kind === "pre_approval" || intent.kind === "complaint") {
      // Close the chat window so the user sees the home + success banner
      setTimeout(() => onClose(), 350);
    }
  };

  const cancelCard = (cardId: string) => {
    setMsgs((m) => m.map((x) => (x.role === "card" && x.id === cardId ? { ...x, status: "cancelled" } : x)));
    setMsgs((m) => [...m, { id: rid(), role: "assistant", lang: "en", text: "Cancelled. What else?" }]);
  };

  const handleToolCall = async (call: ToolCall) => {
    const args = call.args ?? {};
    let intent: Intent | null = null;
    let focusId: string | null = null;
    switch (call.name) {
      case "pre_approve_visitor":
        intent = { kind: "pre_approval", visitorType: args.visitorType ?? "Delivery", duration: args.duration ?? "today", name: args.name };
        focusId = "pre-approve";
        break;
      case "book_amenity":
        intent = { kind: "book_amenity", amenity: args.amenity ?? "Gym", when: args.when ?? "tomorrow" };
        focusId = "view-all";
        break;
      case "mark_attendance":
        intent = { kind: "attendance", name: args.name ?? "", status: (args.status === "absent" ? "absent" : "present") };
        focusId = "daily-help";
        break;
      case "raise_complaint":
        intent = { kind: "complaint", issue: args.issue ?? "", location: args.location ?? "" };
        focusId = "view-all";
        break;
      case "call_guard":
        intent = { kind: "gate_allow" };
        focusId = "pre-approve";
        break;
      case "highlight_home_option":
        focusId = String(args.optionId ?? "daily-help");
        if (focusId) onAgentAction(focusId);
        return { ok: true };
    }
    if (focusId) onAgentAction(focusId);
    // Open the relevant background screen so the user sees the agent act on the page
    const screenMap: Record<string, ScreenKind> = {
      pre_approve_visitor: "pre-approve",
      book_amenity: "amenities",
      raise_complaint: "helpdesk",
    };
    const screenKind = screenMap[call.name];
    if (screenKind) onOpenScreen(screenKind, args as ScreenAutoFill);
    if (intent) {
      const cardId = rid();
      const finalIntent = intent;
      setMsgs((m) => [...m, { id: cardId, role: "card", intent: finalIntent, status: "pending" }]);
      setTimeout(() => confirmCard(cardId, finalIntent), 400);
      return { ok: true, action: call.name };
    }
    return { ok: false, error: "unknown tool" };
  };


  const upsertTranscript = (role: "user" | "assistant", text: string, isFinal: boolean) => {
    const ref = role === "user" ? userMsgIdRef : asstMsgIdRef;
    if (!text) return;
    if (!ref.current) {
      const id = rid();
      ref.current = id;
      setMsgs((m) => [...m, { id, role, lang: "en", text } as Msg]);
    } else {
      const id = ref.current;
      setMsgs((m) => m.map((x) => (x.id === id && (x.role === "user" || x.role === "assistant") ? ({ ...x, text } as Msg) : x)));
    }
    if (isFinal) ref.current = null;
  };

  const startVoice = async () => {
    if (sessionRef.current || connecting) return;
    setMicError(null);
    setConnecting(true);
    try {
      const firstTime = typeof window !== "undefined" && !localStorage.getItem("myra_introduced");
      const tokenPayload = await getGeminiLiveToken();
      const { token, model } = tokenPayload;
      if (firstTime && typeof window !== "undefined") localStorage.setItem("myra_introduced", "1");
      const session = new GeminiLiveSession({
        onUserTranscript: (t: string, f: boolean) => upsertTranscript("user", t, f),
        onAssistantTranscript: (t: string, f: boolean) => upsertTranscript("assistant", t, f),
        onSpeakingChange: setSpeaking,
        onListeningChange: setListening,
        onToolCall: handleToolCall,
        onError: (m: string) => { setMicError(m); setConnecting(false); },
        onClose: () => { sessionRef.current = null; setListening(false); setSpeaking(false); setConnecting(false); },
      });
      sessionRef.current = session;
      if (!token) throw new Error("Could not get voice session token");
      await session.start(token, model);
      setConnecting(false);
    } catch (err: any) {
      const raw = String(err?.message ?? err ?? "");
      let clean = raw.trim();
      // If the server returned an HTML error page, strip tags and pick a short reason.
      if (/<\/?[a-z][^>]*>/i.test(clean)) {
        const text = clean.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        clean = /project not found/i.test(text)
          ? "Voice service is unavailable on this preview. Please try again in a moment."
          : "Could not start Myra. Please try again.";
      }
      if (clean.length > 160) clean = clean.slice(0, 160) + "…";
      setMicError(clean || "Could not start Myra. Please try again.");
      sessionRef.current = null;
      setConnecting(false);
    }
  };

  const stopVoice = async () => {
    try { await sessionRef.current?.stop(); } catch {}
    sessionRef.current = null;
    setListening(false);
    setSpeaking(false);
    setConnecting(false);
  };


  const voiceState: "listening" | "speaking" | "idle" = speaking ? "speaking" : listening ? "listening" : "idle";
  const voiceLabel = voiceState === "speaking" ? "Myra is speaking…" : voiceState === "listening" ? "Listening — speak now" : "Voice is off";

  // Latest assistant message for live caption strip
  const lastAsst = [...msgs].reverse().find((m) => m.role === "assistant") as
    | (Msg & { role: "assistant" })
    | undefined;
  const captionText =
    voiceState === "speaking" ? lastAsst?.text :
    voiceState === "listening" ? (interim || "Listening…") : null;

  // ============ Compact ixigo-style voice overlay ============
  if (mode === "voice") {
    const statusLabel =
      micError ? "Tap mic to retry" :
      introActive ? "Myra is introducing herself…" :
      connecting ? "Connecting…" :
      voiceState === "speaking" ? "Myra is speaking…" :
      voiceState === "listening" ? "Listening" : "Tap mic to talk";

    return (
      <div className="fixed inset-0 z-50 flex justify-center items-end pointer-events-none">
        {/* Transparent tap-catcher to close on outside tap */}
        <div className="absolute inset-0 pointer-events-auto" onClick={onClose} />

        <div className="relative w-full max-w-[440px] pointer-events-auto slide-up">
          {/* Suggestion chips - above the orb area */}
          {msgs.length <= 1 && (
            <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => { setMode("chat"); send(s.label); }}
                  className="shrink-0 rounded-2xl bg-foreground/70 backdrop-blur-md border border-white/10 px-3.5 py-2.5 text-left max-w-[180px]"
                >
                  <div className="text-[12.5px] font-extrabold text-white leading-tight truncate">{s.label.split(" ").slice(0, 3).join(" ")}</div>
                  <div className="text-[10.5px] text-white/70 leading-tight truncate mt-0.5">{s.label}</div>
                </button>
              ))}
            </div>
          )}

          {/* Live caption */}
          {showCaptions && captionText && (
            <div className="mx-6 mb-2 px-3 py-2 rounded-xl bg-foreground/80 backdrop-blur-md text-white text-[12.5px] text-center leading-snug max-h-20 overflow-hidden">
              {captionText}
            </div>
          )}

          {/* Glow / orb backdrop */}
          <div className="relative h-[220px] bg-gradient-to-t from-[oklch(0.85_0.08_60)] via-[oklch(0.88_0.05_280)]/60 to-transparent">
            {/* Orb */}
            <div className="absolute inset-0 grid place-items-center">
              <div className="relative w-[88px] h-[88px]">
                <span className={`absolute inset-0 rounded-full blur-2xl opacity-80 bg-gradient-to-br from-[oklch(0.7_0.22_30)] via-[oklch(0.65_0.2_350)] to-[oklch(0.7_0.18_220)] ${voiceState !== "idle" ? "animate-pulse" : ""}`} />
                <div className={`relative w-full h-full rounded-full bg-gradient-to-br from-[oklch(0.65_0.22_30)] via-[oklch(0.55_0.2_350)] to-[oklch(0.6_0.18_220)] shadow-2xl ${voiceState === "speaking" ? "animate-[pulse_0.8s_ease-in-out_infinite]" : voiceState === "listening" ? "animate-[pulse_1.6s_ease-in-out_infinite]" : ""}`}>
                  <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-white/30 via-transparent to-white/10" />
                  <div className="absolute inset-0 grid place-items-center">
                    <Sparkles className="w-7 h-7 text-white/90" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom controls row */}
            <div className="absolute left-0 right-0 bottom-3 px-8 flex items-center justify-between">
              <button
                onClick={() => (introActive ? onInterruptIntro() : listening || speaking || connecting ? stopVoice() : startVoice())}
                aria-label="Toggle mic"
                className="w-12 h-12 rounded-full bg-foreground/70 backdrop-blur-md grid place-items-center text-white shadow-lg active:scale-95 transition"
              >
                <Mic className="w-5 h-5" strokeWidth={2.5} />
              </button>

              <div className="text-white text-[13px] font-bold drop-shadow text-center px-2 truncate">
                {statusLabel}
              </div>

              <button
                onClick={() => { stopVoice(); setMode("chat"); }}
                aria-label="Open keyboard"
                className="w-12 h-12 rounded-full bg-foreground/70 backdrop-blur-md grid place-items-center text-white shadow-lg active:scale-95 transition"
              >
                <Keyboard className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Captions toggle (bottom-left) & close (bottom-right) */}
            <div className="absolute left-3 bottom-4">
              <button
                onClick={() => setShowCaptions((v) => !v)}
                aria-label="Toggle captions"
                className={`w-8 h-8 rounded-md grid place-items-center ${showCaptions ? "bg-white/90 text-foreground" : "bg-foreground/40 text-white/90"}`}
              >
                <Captions className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute right-3 bottom-4">
              <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full grid place-items-center text-white/90 hover:bg-foreground/30">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {micError && (
            <div className="mx-4 mb-2 rounded-xl bg-destructive/90 text-white text-[12px] px-3 py-2 flex items-start gap-2">
              <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span className="flex-1">{micError}</span>
              <button onClick={() => { setMicError(null); startVoice(); }} className="font-bold underline">Retry</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-end slide-up">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[440px] h-[92vh] bg-white rounded-t-[28px] shadow-2xl shadow-foreground/30 border-t border-border flex flex-col overflow-hidden">

        <div className="pt-2 pb-1 grid place-items-center shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="px-4 pb-2 flex items-center gap-3 shrink-0">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.4_0.2_15)] grid place-items-center text-primary-foreground shrink-0 font-extrabold text-[16px] shadow-md shadow-primary/30">
            M
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${voiceState === "idle" ? "bg-muted-foreground/40" : "bg-success animate-pulse"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-extrabold leading-tight">Myra</div>
            <div className="text-[11px] text-muted-foreground leading-tight truncate">your society assistant</div>
          </div>
          <div className="flex items-center gap-0.5 bg-muted/60 rounded-full p-0.5">
            <button onClick={() => setTab("chat")} className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${tab === "chat" ? "bg-white shadow text-foreground" : "text-muted-foreground"}`}>Chat</button>
            <button onClick={() => setTab("events")} className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${tab === "events" ? "bg-white shadow text-foreground" : "text-muted-foreground"}`}>Events <span className="opacity-60">({log.length})</span></button>
          </div>
          <button onClick={() => setMode("voice")} aria-label="Voice mode" className="p-1.5 rounded-full hover:bg-muted" title="Voice"><Mic className="w-4 h-4" /></button>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        {/* Voice status strip — replaces floating mic overlay */}
        {tab === "chat" && (
          <div className={`mx-4 mb-2 rounded-2xl px-3 py-2 flex items-center gap-3 shrink-0 border ${voiceState === "idle" ? "bg-muted/50 border-border" : "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"}`}>
            <div className={`relative w-9 h-9 rounded-full grid place-items-center shrink-0 ${voiceState === "idle" ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
              {voiceState !== "idle" && <span className={`absolute inset-0 rounded-full bg-primary/40 ${voiceState === "speaking" ? "animate-ping" : "animate-pulse"}`} />}
              <Mic className="w-4 h-4 relative" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold leading-tight truncate">{voiceLabel}</div>
              <div className="text-[10.5px] text-muted-foreground leading-tight truncate">English · हिन्दी · ಕನ್ನಡ · தமிழ் · తెలుగు · मराठी</div>
            </div>
            {voiceState === "idle" ? (
              <button onClick={startVoice} className="text-[11.5px] font-extrabold bg-primary text-primary-foreground px-3 py-1.5 rounded-full shadow shadow-primary/30">Start</button>
            ) : (
              <button onClick={stopVoice} className="text-[11.5px] font-bold text-primary border border-primary/30 px-3 py-1.5 rounded-full">Stop</button>
            )}
          </div>
        )}


        {/* Body */}
        {tab === "chat" ? (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[oklch(0.98_0.003_60)]">
              {msgs.map((m) => {
                if (m.role === "user") {
                  return (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 text-[14px] leading-snug shadow-sm">
                        {m.text}
                        {m.lang !== "en" && <span className="ml-2 inline-flex items-center gap-1 text-[10px] opacity-80 bg-white/15 px-1.5 py-0.5 rounded"><Globe className="w-2.5 h-2.5" />{m.lang}</span>}
                      </div>
                    </div>
                  );
                }
                if (m.role === "assistant") {
                  return (
                    <div key={m.id} className="flex items-start gap-2 max-w-[88%]">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[oklch(0.4_0.2_15)] grid place-items-center shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="text-[14px] leading-snug text-foreground">{m.text}</div>
                    </div>
                  );
                }
                // card
                const sum = intentSummary(m.intent);
                return (
                  <div key={m.id} className="flex items-start gap-2 max-w-[92%]">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[oklch(0.4_0.2_15)] grid place-items-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 rounded-2xl rounded-tl-md bg-white border border-border shadow-sm overflow-hidden">
                      <div className="p-4">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                          <BadgeCheck className="w-3.5 h-3.5" /> Confirm action
                        </div>
                        <div className="mt-1 text-[15px] font-extrabold">{sum.title}</div>
                        <ul className="mt-2 space-y-1">
                          {sum.lines.map((l, i) => (
                            <li key={i} className="text-[12.5px] text-foreground/80 flex gap-1.5"><span className="text-muted-foreground">•</span>{l}</li>
                          ))}
                        </ul>
                      </div>
                      {m.status === "pending" && m.intent.kind !== "gate_query" && m.intent.kind !== "society_query" ? (
                        <div className="grid grid-cols-2 gap-px bg-border/60">
                          <button onClick={() => cancelCard(m.id)} className="bg-white py-3 text-[13px] font-bold text-muted-foreground hover:bg-muted/40">Cancel</button>
                          <button onClick={() => confirmCard(m.id, m.intent)} className="bg-primary text-primary-foreground py-3 text-[13px] font-extrabold flex items-center justify-center gap-1.5">
                            <Check className="w-4 h-4" strokeWidth={3} /> {sum.cta}
                          </button>
                        </div>
                      ) : m.status === "pending" ? (
                        <div className="bg-border/60 grid">
                          <button onClick={() => confirmCard(m.id, m.intent)} className="bg-primary text-primary-foreground py-3 text-[13px] font-extrabold">{sum.cta}</button>
                        </div>
                      ) : m.status === "done" ? (
                        <div className="bg-success/10 text-success py-2.5 text-center text-[12px] font-bold flex items-center justify-center gap-1.5 border-t border-success/20">
                          <Check className="w-3.5 h-3.5" strokeWidth={3} /> Completed
                        </div>
                      ) : (
                        <div className="bg-muted py-2.5 text-center text-[12px] font-bold text-muted-foreground border-t border-border">Cancelled</div>
                      )}
                    </div>
                  </div>
                );
              })}

              {thinking && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[oklch(0.4_0.2_15)] grid place-items-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-border rounded-2xl rounded-tl-md px-3 py-2 flex items-center gap-1.5">
                    <span className="dot-bounce" style={{ animationDelay: "0s" }} />
                    <span className="dot-bounce" style={{ animationDelay: "0.15s" }} />
                    <span className="dot-bounce" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {msgs.length <= 1 && (
              <div className="px-4 pt-1 pb-2">
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Try saying</div>
                <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => send(s.label)}
                      className="shrink-0 inline-flex items-center gap-1.5 bg-white border border-border rounded-full px-3 py-2 text-[12px] font-semibold hover:border-primary/40 hover:text-primary"
                    >
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input bar */}
            <div className="border-t border-border bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {micError && (
                <div className="mb-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-[12px] px-3 py-2 flex items-start gap-2">
                  <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span className="flex-1">{micError}</span>
                  <button onClick={() => setMicError(null)} className="font-bold">Dismiss</button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <div className="flex-1 flex items-end bg-muted/60 rounded-2xl pl-4 pr-1 py-1 border border-transparent focus-within:border-primary/40 focus-within:bg-white transition">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
                    placeholder="Type, or tap mic to speak"
                    className="flex-1 bg-transparent py-2.5 text-[14px] outline-none placeholder:text-muted-foreground"
                  />
                </div>
                {input.trim() ? (
                  <button onClick={() => send(input)} className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-md shadow-primary/30">
                    <ArrowUp className="w-5 h-5" strokeWidth={3} />
                  </button>
                ) : (
                  <button onClick={() => (introActive ? onInterruptIntro() : startVoice())} aria-label="Talk to Myra" className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-md shadow-primary/30">
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="mt-1.5 text-[10.5px] text-muted-foreground text-center">
                <button onClick={onOpenViewAll} className="font-bold text-primary">View all pre-approvals & tickets →</button>
              </div>
            </div>
          </>
        ) : (
          <EventsTab log={log} />
        )}
      </div>
    </div>
  );
}

function EventsTab({ log }: { log: LogEvent[] }) {
  const tones: Partial<Record<EventType, string>> = {
    assistant_opened: "bg-muted text-foreground",
    assistant_command_received: "bg-primary/10 text-primary",
    assistant_intent_recognised: "bg-primary/10 text-primary",
    assistant_clarification_requested: "bg-warning/20 text-warning-foreground",
    assistant_action_confirmed: "bg-accent text-accent-foreground",
    assistant_action_completed: "bg-success/15 text-success",
    assistant_action_failed: "bg-destructive/15 text-destructive",
    assistant_undo_triggered: "bg-muted text-foreground",
    create_pre_approval: "bg-primary/10 text-primary",
    amenity_booked: "bg-success/15 text-success",
    attendance_marked: "bg-success/15 text-success",
    maintenance_ticket_raised: "bg-warning/20 text-warning-foreground",
    gate_request_resolved: "bg-success/15 text-success",
  };
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[oklch(0.98_0.003_60)]">
      <div className="rounded-2xl bg-white border border-border p-4 mb-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Instrumentation</div>
        <h2 className="text-[17px] font-extrabold mt-1">Assistant events</h2>
        <p className="text-[12px] text-muted-foreground mt-1">Intent recognition, completion rate, and voice/text split — all from this live session.</p>
      </div>
      {log.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-10 text-center text-[13px] text-muted-foreground">
          No events yet. Open the chat tab and ask Hood something.
        </div>
      ) : (
        <ul className="rounded-2xl bg-white border border-border overflow-hidden divide-y divide-border">
          {log.map((e) => (
            <li key={e.id} className="px-3 py-2.5 flex items-start gap-2">
              <span className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-1 rounded-md whitespace-nowrap ${tones[e.type] ?? "bg-muted"}`}>{e.type}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold truncate">{e.label}</div>
                {e.meta && <div className="text-[10.5px] text-muted-foreground truncate">{e.meta}</div>}
              </div>
              <div className="text-[10px] text-muted-foreground whitespace-nowrap pt-1">{new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const rid = () => Math.random().toString(36).slice(2);

// ============ View All sheet (Pre-approvals) ============

function ViewAllSheet({
  items, tickets, onClose, onRemove, onRemoveTicket,
}: {
  items: PreApproval[];
  tickets: Ticket[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onRemoveTicket: (id: string) => void;
}) {
  const fmtTime = (at: number) => {
    const diff = Date.now() - at;
    if (diff < 60_000) return "Just now";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h ago`;
    return new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const sourceLabel: Record<PreApproval["source"], { txt: string; cls: string }> = {
    ASSISTANT_VOICE: { txt: "Voice", cls: "bg-primary/10 text-primary" },
    ASSISTANT_TEXT: { txt: "AI · Text", cls: "bg-primary/10 text-primary" },
    MANUAL: { txt: "Manual", cls: "bg-muted text-foreground/70" },
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-end">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm fade-in" onClick={onClose} />
      <div className="relative w-full max-w-[440px] bg-white rounded-t-[28px] shadow-2xl h-[88vh] flex flex-col slide-up overflow-hidden">
        <div className="pt-2 pb-1 grid place-items-center"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>

        <div className="px-5 pb-3 flex items-center gap-3 border-b border-border/40">
          <div className="w-10 h-10 rounded-2xl bg-[oklch(0.95_0.02_180)] grid place-items-center">
            <UserPlus className="w-5 h-5 text-[oklch(0.5_0.12_180)]" />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-extrabold leading-tight">All activity</div>
            <div className="text-[11.5px] text-muted-foreground">{items.length} pre-approvals · {tickets.length} tickets</div>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-[oklch(0.98_0.003_60)] space-y-2.5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground px-1">Pre-approvals</div>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-8 text-center text-[13px] text-muted-foreground">
              No pre-approvals yet.<br/>
              <span className="text-foreground/70">Try: "Pre-approve Blinkit for 2 hours"</span>
            </div>
          ) : items.map((p) => {
            const s = sourceLabel[p.source];
            return (
              <div key={p.id} className="rounded-2xl bg-white border border-border p-3.5 flex items-center gap-3 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 grid place-items-center">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-[14px] font-extrabold truncate">{p.visitorType}{p.name ? ` · ${p.name}` : ""}</div>
                    <span className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${s.cls}`}>{s.txt}</span>
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">
                    {p.duration} · added {fmtTime(p.at)}
                  </div>
                </div>
                <button
                  onClick={() => onRemove(p.id)}
                  className="text-[12px] font-bold text-muted-foreground hover:text-destructive px-2 py-1 rounded-lg hover:bg-destructive/10"
                >
                  Remove
                </button>
              </div>
            );
          })}

          <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground px-1 pt-3">Maintenance tickets</div>
          {tickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-8 text-center text-[13px] text-muted-foreground">
              No tickets raised yet.<br/>
              <span className="text-foreground/70">Try: "Corridor light 4th floor is out"</span>
            </div>
          ) : tickets.map((t) => {
            const s = sourceLabel[t.source];
            const statusCls = t.status === "Resolved"
              ? "bg-success/15 text-success-foreground"
              : t.status === "In Progress"
              ? "bg-warning/20 text-warning-foreground"
              : "bg-primary/10 text-primary";
            return (
              <div key={t.id} className="rounded-2xl bg-white border border-border p-3.5 flex items-center gap-3 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 grid place-items-center">
                  <Wrench className="w-5 h-5 text-warning-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-[14px] font-extrabold truncate">{t.issue}</div>
                    <span className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${statusCls}`}>{t.status}</span>
                    <span className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${s.cls}`}>{s.txt}</span>
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">
                    {t.location} · raised {fmtTime(t.at)}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveTicket(t.id)}
                  className="text-[12px] font-bold text-muted-foreground hover:text-destructive px-2 py-1 rounded-lg hover:bg-destructive/10"
                >
                  Remove
                </button>
              </div>
            );
          })}


          <div className="rounded-2xl bg-accent/40 border border-primary/20 p-4 mt-3">
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="w-3.5 h-3.5" /> Pro tip
            </div>
            <p className="text-[12.5px] text-foreground/80 mt-1.5">
              Tap the <span className="font-bold">Ask Hood</span> button and say things like "Pre-approve my driver today morning" — they'll all land here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
