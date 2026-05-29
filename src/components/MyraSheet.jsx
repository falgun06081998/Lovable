import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Copy } from 'lucide-react';

// ── NLP helpers ──────────────────────────────────────────────
const DELIVERY_BRANDS = ['blinkit','swiggy','zomato','amazon','flipkart','zepto','dunzo','meesho','dtdc','bluedart'];
const CAB_BRANDS = ['uber','ola','rapido','blusmart'];
const GROUP_WORDS = ['party','gathering','group invite','multiple guests','many people','festival','birthday'];
const GUEST_WORDS = ['guest','visitor','friend','family','doctor','plumber','electrician','maid','cook','relative','nurse','carpenter','vendor','salesman','repair'];
const CONFIRM_WORDS = ['haan','yes','confirm','theek hai','kar do','ok','correct','sahi'];

function detectIntent(text) {
  const t = text.toLowerCase();
  if (GROUP_WORDS.some(w => t.includes(w))) return { category:'group', slots:{ occasion: extractOccasion(t), date:extractDate(t) } };
  const dBrand = DELIVERY_BRANDS.find(w => t.includes(w));
  if (dBrand) return { category:'delivery', slots:{ deliveryPartner:capitalize(dBrand), date:extractDate(t), time:extractTime(t) } };
  const cBrand = CAB_BRANDS.find(w => t.includes(w));
  if (cBrand || t.includes('cab') || t.includes('taxi')) return { category:'cab', slots:{ cabCompany: cBrand ? capitalize(cBrand) : undefined, date:extractDate(t), time:extractTime(t) } };
  const gWord = GUEST_WORDS.find(w => t.includes(w));
  if (gWord) return { category:'guest', slots:{ subCategory:extractSubCategory(t), date:extractDate(t), time:extractTime(t) } };
  if (['pre-approv','pre approv','gate pass','delivery','pre approve'].some(w => t.includes(w))) return { category:null, slots:{} };
  return null;
}

function extractDate(t) {
  if (t.includes('kal') || t.includes('tomorrow') || t.includes('कल')) return 'Tomorrow';
  if (t.includes('parso') || t.includes('day after') || t.includes('परसों')) return 'Day after tomorrow';
  if (t.includes('aaj') || t.includes('today') || t.includes('आज')) return 'Today';
  if (t.includes('friday')) return 'Friday';
  if (t.includes('saturday')) return 'Saturday';
  if (t.includes('sunday')) return 'Sunday';
  if (t.includes('monday')) return 'Monday';
  if (t.includes('weekend')) return 'This weekend';
  return null;
}

function extractTime(t) {
  const m = t.match(/(\d{1,2})\s*(am|pm|baje|बजे)/i);
  if (m) return `${m[1]}:00 ${m[2].replace(/baje|बजे/i,'AM').toUpperCase()}`;
  if (t.includes('morning') || t.includes('subah') || t.includes('सुबह')) return 'Morning (9 AM)';
  if (t.includes('afternoon') || t.includes('dopahar')) return 'Afternoon (2 PM)';
  if (t.includes('evening') || t.includes('shaam') || t.includes('शाम')) return 'Evening (6 PM)';
  if (t.includes('night') || t.includes('raat') || t.includes('tonight') || t.includes('रात')) return 'Night (9 PM)';
  return null;
}

function extractSubCategory(t) {
  if (['doctor','nurse','medical'].some(w => t.includes(w))) return 'doctor';
  if (['plumber','electrician','carpenter','repair','ac '].some(w => t.includes(w))) return 'service';
  if (['friend','family','relative','saas','bhai','bahen','parents'].some(w => t.includes(w))) return 'guest';
  if (['vendor','salesman'].some(w => t.includes(w))) return 'vendor';
  if (t.includes('maid') || t.includes('cook')) return 'service';
  return null;
}

function extractOccasion(t) {
  if (t.includes('birthday') || t.includes('bday')) return 'Birthday';
  if (t.includes('party')) return 'Party';
  if (t.includes('festival') || t.includes('holi') || t.includes('diwali') || t.includes('eid')) return 'Festival';
  return null;
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// ── Flow engine ──────────────────────────────────────────────
function getNextQuestion(category, slots) {
  if (category === 'delivery') {
    if (!slots.date) return { pendingSlot:'date', question:"When is the delivery expected?", chips:[{l:'Today',v:'Today'},{l:'Tomorrow',v:'Tomorrow'},{l:'Day after',v:'Day after tomorrow'}] };
    if (!slots.time) return { pendingSlot:'time', question:"What time should I keep the gate pass valid from?", chips:[{l:'Morning 9am',v:'Morning (9 AM)'},{l:'Afternoon 2pm',v:'Afternoon (2 PM)'},{l:'Evening 6pm',v:'Evening (6 PM)'},{l:'Night 9pm',v:'Night (9 PM)'},{l:'Custom ⏰',v:'__custom__'}] };
    if (!slots.handoff) return { pendingSlot:'handoff', question:"Should the delivery be handed to you directly or left with security?", chips:[{l:'🏠 Deliver to me',v:'Deliver to me'},{l:'🔐 Leave with security',v:'Leave with security'}] };
    return null;
  }
  if (category === 'cab') {
    if (!slots.date) return { pendingSlot:'date', question:"When is the cab arriving?", chips:[{l:'Today',v:'Today'},{l:'Tomorrow',v:'Tomorrow'},{l:'Day after',v:'Day after tomorrow'}] };
    if (!slots.time) return { pendingSlot:'time', question:"What time should the driver be allowed entry?", chips:[{l:'Early morning 5am',v:'Early morning (5 AM)'},{l:'Morning 8am',v:'Morning (8 AM)'},{l:'Afternoon',v:'Afternoon (2 PM)'},{l:'Evening',v:'Evening (6 PM)'},{l:'Custom ⏰',v:'__custom__'}] };
    if (slots.cabCompany === undefined) return { pendingSlot:'cabCompany', question:"Which cab service? (You can skip this)", chips:[{l:'Ola',v:'Ola'},{l:'Uber',v:'Uber'},{l:'Rapido',v:'Rapido'},{l:'Other',v:'Other'},{l:'Skip',v:null}] };
    return null;
  }
  if (category === 'guest') {
    if (!slots.subCategory) return { pendingSlot:'subCategory', question:"Who is coming to visit you?", chips:[{l:'👨‍👩‍👧 Guest/Family',v:'guest'},{l:'🔧 Service person',v:'service'},{l:'👨‍⚕️ Doctor',v:'doctor'},{l:'📦 Vendor',v:'vendor'}] };
    if (!slots.date) return { pendingSlot:'date', question:"When are you expecting them?", chips:[{l:'Today',v:'Today'},{l:'Tomorrow',v:'Tomorrow'},{l:'Day after',v:'Day after tomorrow'},{l:'This weekend',v:'This weekend'}] };
    if (!slots.time) return { pendingSlot:'time', question:"What time are you expecting them?", chips:[{l:'Morning 9am',v:'Morning (9 AM)'},{l:'Afternoon 2pm',v:'Afternoon (2 PM)'},{l:'Evening 6pm',v:'Evening (6 PM)'},{l:'Night 9pm',v:'Night (9 PM)'},{l:'Custom ⏰',v:'__custom__'}] };
    if (!slots.validFor) return { pendingSlot:'validFor', question:"How long should the pass be valid?", chips:[{l:'1 hour',v:'1 hour'},{l:'2 hours',v:'2 hours'},{l:'4 hours',v:'4 hours'},{l:'All day',v:'All day'}] };
    return null;
  }
  if (category === 'group') {
    if (!slots.occasion) return { pendingSlot:'occasion', question:"Creating a group invite! What's the occasion?", chips:[{l:'🎂 Birthday',v:'Birthday'},{l:'🎉 Party',v:'Party'},{l:'🕌 Festival',v:'Festival'},{l:'Other',v:'Other'}] };
    if (!slots.date) return { pendingSlot:'date', question:"What date is the event?", chips:[{l:'Today',v:'Today'},{l:'Tomorrow',v:'Tomorrow'},{l:'This weekend',v:'This weekend'},{l:'Day after',v:'Day after tomorrow'}] };
    if (!slots.timeRange) return { pendingSlot:'timeRange', question:"What time does it start and end?", chips:[{l:'6pm–9pm',v:'6:00 PM – 9:00 PM'},{l:'7pm–11pm',v:'7:00 PM – 11:00 PM'},{l:'Custom ⏰',v:'__custom__'}] };
    if (slots.maxEntries === undefined) return { pendingSlot:'maxEntries', question:"How many guests are you expecting? (Optional)", chips:[{l:'Skip',v:null},{l:'10–20',v:'10–20'},{l:'20–50',v:'20–50'},{l:'50+',v:'50+'}] };
    return null;
  }
  return null;
}

function buildConfirmRows(category, slots) {
  if (category === 'delivery') return [['Visitor',(slots.deliveryPartner||'Delivery')+' delivery'],['Date',slots.date],['Time',slots.time],['Valid for','2 hours'],['Handoff',slots.handoff]];
  if (category === 'cab') return [['Visitor',(slots.cabCompany||'Cab')+' cab'],['Date',slots.date],['Time',slots.time],['Valid for','1 hour']];
  if (category === 'guest') {
    const m={guest:'Guest / Family',service:'Service person',doctor:'Doctor',vendor:'Vendor'};
    return [['Visitor',m[slots.subCategory]||'Guest'],['Date',slots.date],['Time',slots.time],['Valid for',slots.validFor||'2 hours']];
  }
  if (category === 'group') return [['Event',slots.occasion||'Group gathering'],['Date',slots.date],['Time',slots.timeRange],['Max guests',slots.maxEntries||'Unlimited']];
  return [];
}

function getCategoryBadge(category, slots) {
  if (category === 'delivery') return `📦 ${slots.deliveryPartner||'Delivery'}`;
  if (category === 'cab') return `🚖 ${slots.cabCompany||'Cab'}`;
  if (category === 'guest') { const m={guest:'👤 Guest',service:'🔧 Service',doctor:'👨‍⚕️ Doctor',vendor:'📦 Vendor'}; return m[slots.subCategory]||'👤 Guest'; }
  if (category === 'group') return '🎉 Group';
  return 'Visitor';
}

// ── Subcomponents ────────────────────────────────────────────
function ListeningWave() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, padding:'10px 0' }}>
      {[0,0.1,0.2,0.3,0.4].map((d,i) => (
        <div key={i} className="animate-wave-bar" style={{
          width:4, height:4, borderRadius:2, background:'#C8102E',
          animationDelay:`${d}s`,
        }} />
      ))}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 0 8px 4px' }}>
      {[0,0.2,0.4].map((d,i) => (
        <div key={i} className="bounce-dot" style={{
          width:8, height:8, borderRadius:'50%', background:'#ddd',
          animationDelay:`${d}s`,
        }} />
      ))}
    </div>
  );
}

function MessageBubble({ m }) {
  const isMyra = m.role === 'myra';
  return (
    <div className="animate-fade-in" style={{
      display:'flex', justifyContent: isMyra ? 'flex-start' : 'flex-end',
    }}>
      {isMyra && (
        <div style={{
          width:28, height:28, borderRadius:'50%', background:'#C8102E',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'white', fontWeight:800, fontSize:12, flexShrink:0,
          marginRight:8, marginTop:2,
        }}>M</div>
      )}
      <div style={{
        maxWidth:'72%',
        background: isMyra ? '#f5f5f5' : '#0f1f3d',
        color: isMyra ? '#1a1a2e' : 'white',
        borderRadius: isMyra ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
        padding:'10px 13px', fontSize:13, lineHeight:1.5,
        whiteSpace:'pre-wrap',
      }}>
        {m.text}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function MyraSheet({ isClosing, onClose }) {
  const [messages, setMessages] = useState([]);
  const [activeChips, setActiveChips] = useState(null);
  const [flowCat, setFlowCat] = useState(null);
  const [slots, setSlots] = useState({});
  const [pendingSlot, setPendingSlot] = useState(null);
  const [voiceState, setVoiceState] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [showCard, setShowCard] = useState(false);
  const [cardEditing, setCardEditing] = useState(false);
  const [editSlots, setEditSlots] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customTimeVal, setCustomTimeVal] = useState('09:00');
  const [copied, setCopied] = useState(false);
  const [passcode] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const [textInput, setTextInput] = useState('');

  const micAvailRef = useRef(null);
  const speechRef = useRef(null);
  const chatRef = useRef(null);
  const msgIdRef = useRef(0);

  const pendingSlotRef = useRef(null);
  const flowCatRef = useRef(null);
  const slotsRef = useRef({});
  const showCardRef = useRef(false);

  useEffect(() => { pendingSlotRef.current = pendingSlot; }, [pendingSlot]);
  useEffect(() => { flowCatRef.current = flowCat; }, [flowCat]);
  useEffect(() => { slotsRef.current = slots; }, [slots]);
  useEffect(() => { showCardRef.current = showCard; }, [showCard]);

  const nextId = () => ++msgIdRef.current;

  const addMyraMsg = useCallback((text, chips = null) => {
    const id = nextId();
    setMessages(prev => [...prev, { id, role:'myra', text }]);
    if (chips) {
      setActiveChips({ id, chips, pendingSlot: chips.pendingSlot });
    }
    return id;
  }, []);

  const addUserMsg = useCallback((text) => {
    const id = nextId();
    setMessages(prev => [...prev, { id, role:'user', text }]);
    return id;
  }, []);

  const stopListening = useCallback(() => {
    if (speechRef.current) { try { speechRef.current.stop(); } catch(_){} }
  }, []);

  const startListening = useCallback(() => {
    if (micAvailRef.current === false) return;
    setVoiceState('listening');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { micAvailRef.current = false; setVoiceState('idle'); return; }
    const rec = new SR();
    rec.lang = 'hi-IN';
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(' ');
      setTranscript(t);
      if (e.results[e.results.length-1].isFinal) {
        setTranscript('');
        addUserMsg(t);
        processInputRef.current(t);
      }
    };
    rec.onerror = () => { micAvailRef.current = false; setVoiceState('idle'); };
    rec.onend = () => { setVoiceState(v => v === 'listening' ? 'idle' : v); };
    rec.start();
    speechRef.current = rec;
  }, [addUserMsg]);

  const processInputRef = useRef(null);

  const introChips = [
    {l:'Pre-approve delivery', v:'delivery tomorrow'},
    {l:'Pre-approve cab', v:'cab tomorrow'},
    {l:'Pre-approve guest', v:'guest tomorrow'},
    {l:'Something else', v:'__else__'},
  ];

  const categoryChips = [
    {l:'📦 Delivery', v:'delivery'},
    {l:'🚖 Cab', v:'cab'},
    {l:'👤 Guest', v:'guest'},
    {l:'🎉 Group invite', v:'group'},
  ];

  const demoChips = [
    {l:'📦 Blinkit delivery tomorrow 8am', v:'blinkit delivery tomorrow 8am', demo:true},
    {l:'🚖 Uber cab tonight 9pm', v:'uber cab tonight 9pm', demo:true},
    {l:'👤 Guest visiting Friday evening', v:'guest visiting Friday evening', demo:true},
    {l:'👨‍👩‍👧 Family for the weekend', v:'family for the weekend', demo:true},
    {l:'🔧 Plumber tomorrow morning', v:'plumber tomorrow morning', demo:true},
    {l:'🎉 Party Saturday 7pm to 11pm', v:'party saturday 7pm to 11pm', demo:true},
  ];

  const askNext = useCallback((category, currentSlots) => {
    const q = getNextQuestion(category, currentSlots);
    if (!q) {
      addMyraMsg("Here's a summary — does everything look right?");
      setShowCard(true);
      setVoiceState('idle');
      return;
    }
    setPendingSlot(q.pendingSlot);
    pendingSlotRef.current = q.pendingSlot;
    const chipsWithSlot = q.chips.map(c => c);
    chipsWithSlot.pendingSlot = q.pendingSlot;
    addMyraMsg(q.question, chipsWithSlot);
    setTimeout(() => startListening(), 800);
  }, [addMyraMsg, startListening]);

  const fillSlot = useCallback((slot, rawText, currentSlots, category) => {
    let value = rawText;
    if (slot === 'date') value = extractDate(rawText.toLowerCase()) || rawText;
    if (slot === 'time') value = extractTime(rawText.toLowerCase()) || rawText;
    if (slot === 'subCategory') value = extractSubCategory(rawText.toLowerCase()) || rawText;

    const newSlots = { ...currentSlots, [slot]: value === null ? undefined : value };
    setSlots(newSlots);
    slotsRef.current = newSlots;
    setPendingSlot(null);
    pendingSlotRef.current = null;
    setActiveChips(null);
    askNext(category, newSlots);
  }, [askNext]);

  const processInput = useCallback((text) => {
    setVoiceState('thinking');
    stopListening();
    setTimeout(() => {
      const currentPendingSlot = pendingSlotRef.current;
      const currentCat = flowCatRef.current;
      const currentSlots = slotsRef.current;
      const currentShowCard = showCardRef.current;

      if (currentPendingSlot) {
        fillSlot(currentPendingSlot, text, currentSlots, currentCat);
        setVoiceState('idle');
        return;
      }

      if (currentShowCard && CONFIRM_WORDS.some(w => text.toLowerCase().includes(w))) {
        setShowSuccess(true);
        setShowCard(false);
        setVoiceState('idle');
        return;
      }

      const result = detectIntent(text);
      if (!result) {
        addMyraMsg("Hmm, I didn't quite get that. You can ask me to pre-approve a delivery, cab, or guest. Or tap one of the chips below! 😊");
        setActiveChips({ chips: introChips });
        setVoiceState('idle');
        return;
      }

      addMyraMsg("Got it! Let me set up the pre-approval for you. 👍");

      if (!result.category) {
        setFlowCat(null);
        flowCatRef.current = null;
        const chips = categoryChips;
        chips.pendingSlot = 'category';
        addMyraMsg("What kind of visitor are you expecting?", chips);
        setVoiceState('idle');
        return;
      }

      const newSlots = { ...result.slots };
      Object.keys(newSlots).forEach(k => { if (newSlots[k] === null) delete newSlots[k]; });
      setFlowCat(result.category);
      flowCatRef.current = result.category;
      setSlots(newSlots);
      slotsRef.current = newSlots;
      setPendingSlot(null);
      pendingSlotRef.current = null;
      setVoiceState('idle');
      askNext(result.category, newSlots);
    }, 1200);
  }, [addMyraMsg, fillSlot, askNext, stopListening]);

  useEffect(() => { processInputRef.current = processInput; }, [processInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      const chips = [...introChips];
      chips.pendingSlot = null;
      addMyraMsg("Hi! I'm Myra, your society assistant. 👋\nWhat would you like to do today?", chips);

      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        micAvailRef.current = true;
        startListening();
      } else {
        micAvailRef.current = false;
      }
    }, 400);
    return () => {
      clearTimeout(t);
      stopListening();
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, activeChips, voiceState, showCard, showSuccess]);

  const handleChipTap = useCallback((chip) => {
    const { l, v, demo } = chip;
    setActiveChips(null);
    setShowCustomTime(false);

    if (v === '__custom__') {
      setShowCustomTime(true);
      return;
    }

    if (v === '__else__') {
      addUserMsg(l);
      const chips = categoryChips;
      chips.pendingSlot = 'category';
      addMyraMsg("What kind of visitor are you expecting?", chips);
      return;
    }

    if (pendingSlotRef.current === 'category') {
      addUserMsg(l);
      const category = v;
      setFlowCat(category);
      flowCatRef.current = category;
      const newSlots = {};
      setSlots(newSlots);
      slotsRef.current = newSlots;
      setPendingSlot(null);
      pendingSlotRef.current = null;
      askNext(category, newSlots);
      return;
    }

    if (v === null) {
      addUserMsg('Skip');
      const slot = pendingSlotRef.current;
      const currentSlots = { ...slotsRef.current };
      if (slot === 'maxEntries') {
        currentSlots.maxEntries = null;
        setSlots(currentSlots);
        slotsRef.current = currentSlots;
      } else if (slot === 'cabCompany') {
        currentSlots.cabCompany = null;
        setSlots(currentSlots);
        slotsRef.current = currentSlots;
      }
      setPendingSlot(null);
      pendingSlotRef.current = null;
      askNext(flowCatRef.current, currentSlots);
      return;
    }

    addUserMsg(l);

    if (demo || pendingSlotRef.current === null) {
      processInputRef.current(v);
      return;
    }

    const slot = pendingSlotRef.current;
    fillSlot(slot, v, slotsRef.current, flowCatRef.current);
  }, [addUserMsg, addMyraMsg, askNext, fillSlot]);

  const handleConfirm = useCallback(() => {
    setShowSuccess(true);
    setShowCard(false);
  }, []);

  const handleSendText = useCallback(() => {
    const t = textInput.trim();
    if (!t) return;
    setTextInput('');
    addUserMsg(t);
    processInputRef.current(t);
  }, [textInput, addUserMsg]);

  const handleConfirmCustomTime = useCallback(() => {
    setShowCustomTime(false);
    const slot = pendingSlotRef.current;
    const [h, m] = customTimeVal.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const hr12 = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
    const timeStr = `${hr12}:${m} ${ampm}`;
    addUserMsg(timeStr);
    fillSlot(slot, timeStr, slotsRef.current, flowCatRef.current);
  }, [customTimeVal, addUserMsg, fillSlot]);

  function ConfirmCard() {
    const rows = buildConfirmRows(flowCat, slots);
    const badge = getCategoryBadge(flowCat, slots);

    if (cardEditing) {
      return (
        <div className="animate-card-up" style={{
          background:'white', borderTop:'1px solid #e8e8e8',
          padding:'14px 16px', flexShrink:0,
        }}>
          <p style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Edit details</p>
          {rows.map(([label, value]) => (
            <div key={label} style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, color:'#888' }}>{label}</label>
              <input
                value={editSlots[label] !== undefined ? editSlots[label] : (value||'')}
                onChange={e => setEditSlots(s => ({ ...s, [label]: e.target.value }))}
                style={{
                  width:'100%', border:'1px solid #e8e8e8', borderRadius:8,
                  padding:'8px 10px', fontSize:13, marginTop:4, outline:'none',
                }}
              />
            </div>
          ))}
          <button
            onClick={() => setCardEditing(false)}
            style={{
              width:'100%', background:'#C8102E', color:'white', border:'none',
              borderRadius:10, padding:'11px', fontSize:13, fontWeight:700, cursor:'pointer',
            }}
          >Done editing</button>
        </div>
      );
    }

    return (
      <div className="animate-card-up" style={{
        background:'white', borderTop:'1px solid #e8e8e8',
        padding:'14px 16px', flexShrink:0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <span style={{ fontSize:13, fontWeight:600, color:'#1a1a2e' }}>Create pre-approval</span>
          <span style={{
            background:'#e0eaff', color:'#2563eb', fontSize:10, fontWeight:600,
            padding:'2px 8px', borderRadius:10,
          }}>{badge}</span>
        </div>
        {rows.map(([label, value]) => {
          const displayValue = editSlots[label] !== undefined ? editSlots[label] : (value || '—');
          return (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:12, color:'#888' }}>{label}</span>
              <span style={{ fontSize:12, fontWeight:600, color:'#1a1a2e' }}>{displayValue || '—'}</span>
            </div>
          );
        })}
        <div style={{ display:'flex', gap:10, marginTop:14 }}>
          <button
            onClick={handleConfirm}
            style={{
              flex:1, background:'#C8102E', color:'white', border:'none',
              borderRadius:10, padding:'11px', fontSize:13, fontWeight:700, cursor:'pointer',
            }}
          >Confirm ✓</button>
          <button
            onClick={() => {
              setEditSlots(Object.fromEntries(rows.map(([l, v]) => [l, v||''])));
              setCardEditing(true);
            }}
            style={{
              flex:1, background:'#f0f0f0', color:'#555', border:'none',
              borderRadius:10, padding:'11px', fontSize:13, fontWeight:600, cursor:'pointer',
            }}
          >Edit ✎</button>
        </div>
      </div>
    );
  }

  function SuccessScreen() {
    const rows = buildConfirmRows(flowCat, slots);
    const badge = getCategoryBadge(flowCat, slots);
    const dateRow = rows.find(r => r[0] === 'Date');

    const shareText = `Pre-approval created!\nType: ${badge}\n${dateRow ? 'Date: '+dateRow[1]+'\n' : ''}Passcode: ${passcode}\nGenerated via NoBrokerHood`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    return (
      <div className="animate-fade-in" style={{ padding:'8px 0 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
        <div className="animate-scale-in" style={{ marginTop:8 }}>
          <svg width="72" height="72" viewBox="0 0 100 100">
            <circle className="draw-circle" cx="50" cy="50" r="45" fill="none" stroke="#22c55e" strokeWidth="5" />
            <polyline className="draw-check" points="28,52 43,67 72,36" fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div style={{ textAlign:'center' }}>
          <p style={{ fontSize:16, fontWeight:800, color:'#1a1a2e' }}>Pre-approval created!</p>
          <p style={{ fontSize:12, color:'#888', marginTop:4 }}>
            {badge} · {dateRow ? dateRow[1] : 'Today'}
          </p>
        </div>

        <div style={{
          border:'2px dashed #C8102E', borderRadius:14, padding:'12px 24px',
          display:'flex', flexDirection:'column', alignItems:'center', gap:6,
          background:'#fdf0f2',
        }}>
          <span style={{ fontSize:11, color:'#C8102E', fontWeight:600 }}>GATE PASSCODE</span>
          <span style={{ fontSize:32, fontWeight:800, color:'#C8102E', letterSpacing:'0.18em' }}>{passcode}</span>
          <button
            onClick={() => { navigator.clipboard?.writeText(passcode).catch(()=>{}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{
              display:'flex', alignItems:'center', gap:5,
              background:'white', border:'1px solid #C8102E', borderRadius:8,
              padding:'5px 12px', fontSize:11, fontWeight:600, color:'#C8102E', cursor:'pointer',
            }}
          >
            <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div style={{
          width:'100%', borderRadius:12,
          background:'linear-gradient(135deg,#0c1445,#1a237e)',
          padding:'12px 14px', display:'flex', alignItems:'center', gap:10,
        }}>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:9, color:'rgba(255,255,255,0.6)', marginBottom:2 }}>SPONSORED</p>
            <p style={{ fontSize:12, fontWeight:700, color:'white' }}>zepto pharmacy</p>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.8)' }}>flat 20% off on medicines</p>
          </div>
          <button style={{
            background:'#C8102E', color:'white', border:'none',
            borderRadius:8, padding:'6px 10px', fontSize:10, fontWeight:700, cursor:'pointer',
          }}>Order Now</button>
        </div>

        <button
          onClick={() => window.open(waUrl, '_blank')}
          style={{
            width:'100%', background:'#0f1f3d', color:'white', border:'none',
            borderRadius:12, padding:'12px', fontSize:13, fontWeight:700, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}
        >
          <span>💬</span> Share via WhatsApp
        </button>
        <button
          onClick={onClose}
          style={{
            width:'100%', background:'#f0f0f0', color:'#555', border:'none',
            borderRadius:12, padding:'12px', fontSize:13, fontWeight:600, cursor:'pointer',
          }}
        >Done</button>
      </div>
    );
  }

  function ChipRow({ chips, onChip }) {
    return (
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
        {chips.map((chip, i) => (
          <button
            key={i}
            onClick={() => onChip(chip)}
            style={{
              background: chip.demo ? '#fff8f0' : '#f5f5f5',
              border: chip.demo ? '1px solid #f59e0b' : '1px solid #e0e0e0',
              borderRadius:20, padding:'7px 13px',
              fontSize:12, fontWeight:600,
              color: chip.demo ? '#92400e' : '#1a1a2e',
              cursor:'pointer',
              transition:'transform .1s',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
            onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {chip.l}
          </button>
        ))}
        {showCustomTime && (
          <div style={{ width:'100%', display:'flex', gap:8, alignItems:'center', marginTop:4 }}>
            <input
              type="time"
              value={customTimeVal}
              onChange={e => setCustomTimeVal(e.target.value)}
              style={{ flex:1, border:'1px solid #e0e0e0', borderRadius:8, padding:'7px 10px', fontSize:13 }}
            />
            <button
              onClick={handleConfirmCustomTime}
              style={{
                background:'#C8102E', color:'white', border:'none',
                borderRadius:8, padding:'8px 14px', fontSize:12, fontWeight:700, cursor:'pointer',
              }}
            >Set</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={isClosing ? 'animate-sheet-down' : 'animate-sheet-up'}
      style={{
        position:'absolute', left:0, right:0, bottom:98,
        zIndex:50, background:'white', borderRadius:'20px 20px 0 0',
        maxHeight:'calc(78vh - 98px)',
        display:'flex', flexDirection:'column',
        boxShadow:'0 -8px 40px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ display:'flex', justifyContent:'center', paddingTop:10, paddingBottom:6 }}>
        <div style={{ width:36, height:4, borderRadius:2, background:'#e0e0e0' }} />
      </div>

      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 16px 12px', borderBottom:'1px solid #f0f0f0',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:36, height:36, borderRadius:'50%', background:'#C8102E',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'white', fontWeight:800, fontSize:16,
          }}>M</div>
          <div>
            <p style={{ fontSize:14, fontWeight:800, color:'#1a1a2e' }}>Myra</p>
            <p style={{ fontSize:11, color:'#888' }}>Society AI Assistant</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {voiceState === 'listening' && (
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e' }} />
              <span style={{ fontSize:10, color:'#22c55e', fontWeight:600 }}>Listening</span>
            </div>
          )}
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
            <X size={20} color="#888" />
          </button>
        </div>
      </div>

      <div ref={chatRef} style={{
        flex:1, overflowY:'auto', padding:'12px 16px',
        display:'flex', flexDirection:'column', gap:10,
      }}>
        {messages.map(m => <MessageBubble key={m.id} m={m} />)}

        {activeChips && !showCard && !showSuccess && (
          <ChipRow chips={activeChips.chips} onChip={handleChipTap} />
        )}

        {!showCard && !showSuccess && !flowCat && messages.length <= 1 && (
          <div style={{ marginTop:8 }}>
            <p style={{ fontSize:11, color:'#aaa', marginBottom:8 }}>Try saying:</p>
            <ChipRow chips={demoChips} onChip={handleChipTap} />
          </div>
        )}

        {voiceState === 'listening' && transcript && (
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <div style={{
              background:'#0f1f3d', color:'white', opacity:0.6,
              borderRadius:'16px 16px 4px 16px', padding:'9px 13px', fontSize:13,
            }}>
              {transcript}
            </div>
          </div>
        )}

        {voiceState === 'listening' && !transcript && <ListeningWave />}
        {voiceState === 'thinking' && <ThinkingDots />}
        {showSuccess && <SuccessScreen />}
      </div>

      {showCard && !showSuccess && <ConfirmCard />}

      {!showSuccess && (
        <div style={{
          borderTop:'1px solid #f0f0f0', padding:'10px 14px',
          display:'flex', gap:8, alignItems:'center',
          background:'white',
        }}>
          <input
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSendText(); }}
            placeholder="Type a message..."
            style={{
              flex:1, border:'1px solid #e0e0e0', borderRadius:20,
              padding:'9px 14px', fontSize:13, outline:'none',
              background:'#fafafa',
            }}
          />
          <button
            onClick={handleSendText}
            disabled={!textInput.trim()}
            style={{
              width:36, height:36, borderRadius:'50%',
              background: textInput.trim() ? '#C8102E' : '#e0e0e0',
              border:'none', cursor: textInput.trim() ? 'pointer' : 'default',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
            }}
          >
            <Send size={16} color="white" />
          </button>
        </div>
      )}
    </div>
  );
}
