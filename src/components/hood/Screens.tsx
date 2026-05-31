import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronDown, X, Mic, Paperclip, Check, Sparkles, MapPin } from "lucide-react";

export type ScreenKind = "pre-approve" | "helpdesk" | "amenities";

export type ScreenAutoFill = {
  visitorType?: string;
  duration?: string;
  name?: string;
  amenity?: string;
  when?: string;
  issue?: string;
  location?: string;
  category?: string;
  urgent?: boolean;
  visibility?: "personal" | "community";
};

export type ScreenSubmitPayload = {
  visitorType?: string;
  duration?: string;
  name?: string;
  amenity?: string;
  when?: string;
  issue?: string;
  location?: string;
  category?: string;
  urgent?: boolean;
  visibility?: "personal" | "community";
  source: "MANUAL" | "ASSISTANT_VOICE";
};

// ============ Shared shell ============

function ScreenShell({
  children,
  onClose: _onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-black/40 animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-[440px] bg-white slide-up flex flex-col h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function AgentToast({ text }: { text: string }) {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-foreground/90 backdrop-blur text-white rounded-full px-3 py-1.5 text-[11.5px] font-bold shadow-lg flex items-center gap-1.5 max-w-[90%]">
      <Sparkles className="w-3 h-3 text-[oklch(0.85_0.18_85)]" />
      <span className="truncate">{text}</span>
    </div>
  );
}

function useAutoRun(deps: any[], cb: () => void | (() => void)) {
  useEffect(() => {
    const r = cb();
    return typeof r === "function" ? r : undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ============ Pre-Approve Screen ============

export function PreApproveScreen({
  autoFill,
  onClose,
  onSubmit,
}: {
  autoFill?: ScreenAutoFill;
  onClose: () => void;
  onSubmit: (p: ScreenSubmitPayload) => void;
}) {
  const isAuto = !!autoFill;
  const [tab, setTab] = useState<"once" | "frequent">("once");
  const [visitorType, setVisitorType] = useState("");
  const [duration, setDuration] = useState("");
  const [date, setDate] = useState("Today");
  const [pressing, setPressing] = useState(false);
  const [done, setDone] = useState(false);
  const [stage, setStage] = useState<"idle" | "filling" | "ready">(isAuto ? "filling" : "idle");

  // Auto-fill animation
  useAutoRun([], () => {
    if (!isAuto) return;
    const t1 = setTimeout(() => {
      setVisitorType(autoFill!.visitorType || "Delivery");
    }, 350);
    const t2 = setTimeout(() => {
      setDuration(autoFill!.duration || "Next 1 hr");
      if (autoFill!.duration && /tomorrow|kal/i.test(autoFill!.duration)) setDate("Tomorrow");
    }, 900);
    const t3 = setTimeout(() => setStage("ready"), 1400);
    const t4 = setTimeout(() => setPressing(true), 1700);
    const t5 = setTimeout(() => {
      setDone(true);
      onSubmit({
        visitorType: autoFill!.visitorType || visitorType || "Delivery",
        duration: autoFill!.duration || duration || "Next 1 hr",
        name: autoFill!.name,
        source: "ASSISTANT_VOICE",
      });
    }, 2100);
    const t6 = setTimeout(() => onClose(), 3600);
    return () => { [t1, t2, t3, t4, t5, t6].forEach(clearTimeout); };
  });

  const headline = autoFill?.name
    ? `Allow ${autoFill.name}`
    : visitorType
    ? `Allow ${visitorType}`
    : "Pre-Approve";

  const submit = () => {
    if (done) return;
    setPressing(true);
    setTimeout(() => {
      setDone(true);
      onSubmit({
        visitorType: visitorType || "Delivery",
        duration: duration || "Next 1 hr",
        name: autoFill?.name,
        source: "MANUAL",
      });
      setTimeout(onClose, 1200);
    }, 300);
  };

  return (
    <ScreenShell onClose={onClose}>
      {isAuto && <AgentToast text="Myra is filling this in for you…" />}

      {/* Header area like ixigo modal */}
      <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 w-9 h-9 grid place-items-center rounded-full bg-white/80 backdrop-blur z-10">
        <X className="w-5 h-5" />
      </button>

      <div className="px-5 pt-16 pb-6 bg-gradient-to-b from-[oklch(0.95_0.02_60)] to-white">
        <h1 className="text-[40px] font-extrabold leading-[1.05] text-foreground">{headline}</h1>
        <p className="mt-3 text-[14px] text-muted-foreground leading-snug">
          Ensure hassle-free entries by creating approvals in advance for your visitors
          <span className="inline-flex items-center gap-1.5 ml-1.5 align-middle">
            <span className="bg-[oklch(0.92_0.18_95)] text-foreground text-[10px] font-extrabold px-1.5 py-0.5 rounded">blinkit</span>
            <span className="bg-[oklch(0.6_0.2_25)] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">swiggy</span>
          </span>
        </p>
      </div>

      {/* Tab area */}
      <div className="px-5 -mt-2">
        <div className="flex">
          <button
            onClick={() => setTab("once")}
            className={`flex-1 py-3 text-[15px] font-extrabold rounded-tl-3xl ${tab === "once" ? "bg-white text-foreground shadow-[0_-4px_12px_rgba(0,0,0,0.06)]" : "bg-foreground/10 text-foreground/60"}`}
          >Once</button>
          <button
            onClick={() => setTab("frequent")}
            className={`flex-1 py-3 text-[15px] font-extrabold rounded-tr-3xl ${tab === "frequent" ? "bg-white text-foreground shadow-[0_-4px_12px_rgba(0,0,0,0.06)]" : "bg-foreground/10 text-foreground/60"}`}
          >Frequent</button>
        </div>
      </div>

      <div className="flex-1 bg-white px-5 pt-6 overflow-y-auto">
        <div className="space-y-5">
          <Field
            label="VISITOR / DELIVERY"
            value={visitorType}
            placeholder="Pick one"
            highlight={stage === "filling" && !!visitorType}
          />
          <Field
            label="DELIVERY DATE"
            value={date}
            highlight={false}
          />
          <Field
            label="VALID FOR"
            value={duration}
            placeholder="e.g. Next 1 hr"
            highlight={stage === "filling" && !!duration}
          />
          <div className="text-[12px] font-extrabold text-primary tracking-wide pt-1">MORE DETAILS ›</div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="px-5 pt-3 pb-5 bg-white border-t border-border/40">
        <button
          onClick={submit}
          disabled={done}
          className={`w-full rounded-2xl py-4 text-[16px] font-extrabold text-white transition-all duration-200 ${
            done
              ? "bg-[oklch(0.65_0.18_150)]"
              : "bg-primary"
          } ${pressing && !done ? "scale-[0.97] ring-4 ring-primary/30" : ""}`}
        >
          {done ? (
            <span className="inline-flex items-center justify-center gap-2"><Check className="w-5 h-5" /> Pre-Approved</span>
          ) : "Pre-Approve"}
        </button>
      </div>
    </ScreenShell>
  );
}

function Field({
  label, value, placeholder, highlight,
}: { label: string; value: string; placeholder?: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-extrabold tracking-wider text-muted-foreground mb-1.5">{label}</div>
      <div className={`flex items-center justify-between rounded-xl border px-4 py-3.5 bg-white transition-all ${highlight ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border"}`}>
        <span className={`text-[15px] font-bold ${value ? "text-foreground" : "text-muted-foreground/60"}`}>
          {value || placeholder || "Select"}
        </span>
        <ChevronDown className="w-4 h-4 text-foreground/60" />
      </div>
    </div>
  );
}

// ============ Helpdesk / Create Ticket Screen ============

export function HelpdeskScreen({
  autoFill,
  onClose,
  onSubmit,
}: {
  autoFill?: ScreenAutoFill;
  onClose: () => void;
  onSubmit: (p: ScreenSubmitPayload) => void;
}) {
  const isAuto = !!autoFill;
  const [visibility, setVisibility] = useState<"personal" | "community">("personal");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("A-002");
  const [description, setDescription] = useState("");
  const [pressing, setPressing] = useState(false);
  const [done, setDone] = useState(false);

  const categoryFor = (issue?: string) => {
    if (!issue) return "Maintenance";
    const t = issue.toLowerCase();
    if (/light|bulb|electric|power/.test(t)) return "Electrical";
    if (/water|leak|tap|plumb/.test(t)) return "Plumbing";
    if (/lift|elevator/.test(t)) return "Lift";
    if (/clean|garbage|trash/.test(t)) return "Housekeeping";
    return "Maintenance";
  };

  useAutoRun([], () => {
    if (!isAuto) return;
    const t1 = setTimeout(() => setCategory(categoryFor(autoFill!.issue)), 350);
    const t2 = setTimeout(() => { if (autoFill!.location) setLocation(autoFill!.location); }, 750);
    const t3 = setTimeout(() => {
      // Typewriter for description
      const full = autoFill!.issue || "";
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setDescription(full.slice(0, i));
        if (i >= full.length) clearInterval(iv);
      }, 20);
    }, 1100);
    const t4 = setTimeout(() => setPressing(true), 2400);
    const t5 = setTimeout(() => {
      setDone(true);
      onSubmit({
        issue: autoFill!.issue || "",
        location: autoFill!.location || location,
        source: "ASSISTANT_VOICE",
      });
    }, 2800);
    const t6 = setTimeout(() => onClose(), 4200);
    return () => { [t1, t2, t3, t4, t5, t6].forEach(clearTimeout); };
  });

  const submit = () => {
    if (done || !description.trim()) return;
    setPressing(true);
    setTimeout(() => {
      setDone(true);
      onSubmit({
        issue: description.trim(),
        location,
        source: "MANUAL",
      });
      setTimeout(onClose, 1200);
    }, 300);
  };

  return (
    <ScreenShell onClose={onClose}>
      {isAuto && <AgentToast text="Myra is logging your ticket…" />}

      <header className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-border/60">
        <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-full bg-white shadow-sm border border-border/60">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[18px] font-extrabold flex-1 text-center pr-9">Create Ticket</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pt-5 space-y-5">
        <div>
          <div className="text-[13px] text-muted-foreground mb-2">Complaints Visibility</div>
          <div className="bg-muted rounded-full p-1 flex">
            <button
              onClick={() => setVisibility("personal")}
              className={`flex-1 py-2 text-[13px] font-bold rounded-full ${visibility === "personal" ? "bg-white shadow text-foreground" : "text-muted-foreground"}`}
            >Personal (Only Me)</button>
            <button
              onClick={() => setVisibility("community")}
              className={`flex-1 py-2 text-[13px] font-bold rounded-full ${visibility === "community" ? "bg-white shadow text-foreground" : "text-muted-foreground"}`}
            >Community (All)</button>
          </div>
        </div>

        <div>
          <div className="text-[13px] text-muted-foreground mb-1">Category</div>
          <div className={`flex items-center justify-between border-b py-3 transition-all ${category && isAuto ? "border-primary" : "border-border"}`}>
            <span className={`text-[15px] font-bold ${category ? "text-foreground" : "text-muted-foreground/60"}`}>
              {category || "Select Category"}
            </span>
            <ChevronLeft className="w-4 h-4 -rotate-180 text-muted-foreground" />
          </div>
        </div>

        <div>
          <div className="text-[13px] text-muted-foreground mb-1">Complaints Location</div>
          <div className="flex items-center justify-between border-b border-border py-3">
            <span className="text-[16px] font-extrabold">{location}</span>
            <ChevronLeft className="w-4 h-4 -rotate-180 text-muted-foreground" />
          </div>
        </div>

        <div>
          <div className="text-[13px] text-muted-foreground mb-2">Description (Mandatory)</div>
          <div className={`relative rounded-lg bg-muted/50 transition-all ${description && isAuto ? "ring-2 ring-primary/40" : ""}`}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              readOnly={isAuto}
              className="w-full h-32 bg-transparent rounded-lg p-3 text-[14px] outline-none resize-none"
              placeholder="Describe your issue…"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label className="flex items-center gap-2 flex-1">
              <span className="w-9 h-5 rounded-full bg-muted-foreground/30 relative">
                <span className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" />
              </span>
              <span className="text-[13px] font-bold">This is Urgent</span>
            </label>
            <button className="w-10 h-10 rounded-full border border-border grid place-items-center text-muted-foreground"><Mic className="w-4 h-4" /></button>
            <button className="w-10 h-10 rounded-full border border-border grid place-items-center text-muted-foreground"><Paperclip className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-border/40 bg-white">
        <button
          onClick={submit}
          disabled={done}
          className={`w-full rounded-2xl py-4 text-[16px] font-extrabold text-white transition-all duration-200 ${
            done ? "bg-[oklch(0.65_0.18_150)]" : "bg-[oklch(0.65_0.16_160)]"
          } ${pressing && !done ? "scale-[0.97] ring-4 ring-primary/30" : ""}`}
        >
          {done ? (
            <span className="inline-flex items-center justify-center gap-2"><Check className="w-5 h-5" /> Ticket Logged</span>
          ) : "Log Ticket"}
        </button>
      </div>
    </ScreenShell>
  );
}

// ============ Amenities Screen ============

const AMENITY_LIST = [
  { name: "Gym", hours: "05:00 AM - 10:00 PM", loc: "Sports Complex" },
  { name: "Swimming Pool", hours: "06:00 AM - 09:00 PM", loc: "Pool Deck" },
  { name: "Banquet Hall", hours: "09:00 AM - 11:00 PM", loc: "Clubhouse" },
  { name: "Tennis Court", hours: "06:00 AM - 09:00 PM", loc: "Sports Complex" },
];

export function AmenitiesScreen({
  autoFill,
  onClose,
  onSubmit,
}: {
  autoFill?: ScreenAutoFill;
  onClose: () => void;
  onSubmit: (p: ScreenSubmitPayload) => void;
}) {
  const isAuto = !!autoFill;
  const [focused, setFocused] = useState<string | null>(null);
  const [step, setStep] = useState<"list" | "detail">("list");
  const [picked, setPicked] = useState<typeof AMENITY_LIST[number] | null>(null);
  const [whenChoice, setWhenChoice] = useState<"Today" | "Tomorrow" | "Custom">("Today");
  const [pressing, setPressing] = useState(false);
  const [done, setDone] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const matchAmenity = (name?: string) => {
    if (!name) return AMENITY_LIST[0];
    const t = name.toLowerCase();
    return AMENITY_LIST.find((a) => t.includes(a.name.toLowerCase().split(" ")[0])) || AMENITY_LIST[0];
  };

  useAutoRun([], () => {
    if (!isAuto) return;
    const target = matchAmenity(autoFill!.amenity);
    const t1 = setTimeout(() => setFocused(target.name), 300);
    const t2 = setTimeout(() => { setPicked(target); setStep("detail"); }, 1100);
    const t3 = setTimeout(() => {
      if (autoFill!.when && /tomorrow|kal/i.test(autoFill!.when)) setWhenChoice("Tomorrow");
    }, 1500);
    const t4 = setTimeout(() => setPressing(true), 2100);
    const t5 = setTimeout(() => {
      setDone(true);
      onSubmit({
        amenity: target.name,
        when: autoFill!.when || "Today",
        source: "ASSISTANT_VOICE",
      });
    }, 2500);
    const t6 = setTimeout(() => onClose(), 3900);
    return () => { [t1, t2, t3, t4, t5, t6].forEach(clearTimeout); };
  });

  const handleBook = (a: typeof AMENITY_LIST[number]) => {
    setPicked(a);
    setStep("detail");
  };

  const submit = () => {
    if (done || !picked) return;
    setPressing(true);
    setTimeout(() => {
      setDone(true);
      onSubmit({ amenity: picked.name, when: whenChoice, source: "MANUAL" });
      setTimeout(onClose, 1200);
    }, 300);
  };

  return (
    <ScreenShell onClose={onClose}>
      {isAuto && <AgentToast text="Myra is booking this for you…" />}

      <header className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-border/60">
        <button onClick={step === "detail" ? () => setStep("list") : onClose} className="w-9 h-9 grid place-items-center rounded-full bg-white shadow-sm border border-border/60">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[18px] font-extrabold flex-1 text-center">
          {step === "list" ? "Amenities" : picked?.name}
        </h1>
        {step === "list" && (
          <div className="rounded-full border border-border px-3 py-1.5 text-[13px] font-bold">Bookings</div>
        )}
        {step === "detail" && <div className="w-9" />}
      </header>

      {step === "list" && (
        <>
          <div className="px-5 pt-4">
            <div className="bg-muted rounded-full p-1 flex">
              <button className="flex-1 py-2 text-[13px] font-bold rounded-full bg-white shadow text-foreground">Amenities</button>
              <button className="flex-1 py-2 text-[13px] font-bold rounded-full text-muted-foreground">Classes</button>
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[oklch(0.97_0.005_60)]">
            {AMENITY_LIST.map((a) => {
              const isFocused = focused === a.name;
              return (
                <div
                  key={a.name}
                  className={`rounded-2xl bg-white border p-4 transition-all ${isFocused ? "border-primary ring-2 ring-primary/30 scale-[1.02]" : "border-border/60"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[18px] font-extrabold">{a.name}</div>
                      <div className="text-[12px] font-bold text-[oklch(0.55_0.16_160)]">Open</div>
                      <div className="mt-2 flex items-center gap-1 text-[12.5px] text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" /> {a.loc}
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-muted/40 grid place-items-center text-foreground/40">
                      <Sparkles className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="border-t border-border/60 mt-3 pt-3 flex items-center justify-between">
                    <div className="text-[12px]">
                      <div className="text-muted-foreground">Everyday</div>
                      <div className="font-bold">{a.hours}</div>
                    </div>
                    <button
                      onClick={() => handleBook(a)}
                      className="px-6 py-2.5 rounded-xl bg-[oklch(0.65_0.16_160)] text-white text-[14px] font-extrabold"
                    >Book</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {step === "detail" && picked && (
        <>
          <div className="px-5 pt-5 pb-4 bg-[oklch(0.97_0.005_60)] border-b border-border/40">
            <div className="text-[13px] text-muted-foreground">Timings: <span className="font-bold text-foreground">{picked.hours}</span></div>
            <div className="text-[13px] text-muted-foreground mt-1">Booking Limit: <span className="font-bold text-foreground">1 person per slot</span></div>
            <div className="text-[13px] text-muted-foreground mt-1">Location: <span className="font-bold text-foreground">{picked.loc}</span></div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-5">
            <div className="text-[17px] font-extrabold mb-3">Pick a Date</div>
            <div className="flex gap-2.5">
              {(["Today", "Tomorrow", "Custom"] as const).map((d) => {
                const active = whenChoice === d;
                return (
                  <button
                    key={d}
                    onClick={() => setWhenChoice(d)}
                    className={`px-5 py-3 rounded-xl border text-[14px] font-bold transition-all ${active ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30" : "border-border text-foreground"}`}
                  >{d}</button>
                );
              })}
            </div>
          </div>

          <div className="px-5 py-4 border-t border-border/40 bg-white">
            <button
              onClick={submit}
              disabled={done}
              className={`w-full rounded-2xl py-4 text-[16px] font-extrabold text-white transition-all duration-200 ${
                done ? "bg-[oklch(0.65_0.18_150)]" : "bg-[oklch(0.65_0.16_160)]"
              } ${pressing && !done ? "scale-[0.97] ring-4 ring-primary/30" : ""}`}
            >
              {done ? (
                <span className="inline-flex items-center justify-center gap-2"><Check className="w-5 h-5" /> Booked</span>
              ) : "Book"}
            </button>
          </div>
        </>
      )}
    </ScreenShell>
  );
}
