import { useState, useEffect, useRef } from 'react';
import { X, Send, Copy } from 'lucide-react';

// Transliterated + Devanagari triggers
const TRIGGER_PREAPPROVAL = [
  'pre-approve','pre approval','pre-approval','gate pass','delivery','blinkit','swiggy','zomato',
  'amazon','flipkart','zepto','dunzo','uber','ola','rapido','cab','guest','visitor',
  'प्री-अप्रूवल','प्री अप्रूवल','गेट पास','डिलीवरी','ब्लिंकिट','स्विगी','ज़ोमाटो','जोमाटो',
  'अमेज़न','फ्लिपकार्ट','ज़ेप्टो','उबर','ओला','रैपिडो','कैब','गेस्ट','विजिटर','मेहमान',
  'आने वाला','परवल','अप्रूवल','अनुमति','इजाज़त',
];
const TRIGGER_HELPDESK = [
  'complaint','ticket','raise','issue','problem','kaam nahi','kaam nhi','band hai','nahi chal',
  'lift','elevator','paani','water','bijli','electricity','light','parking','leak','broken',
  'noise','smell','pest','sewage',
  'शिकायत','समस्या','खराब','बंद है','काम नहीं','नहीं चल','लिफ्ट','पानी','बिजली','लाइट',
  'पार्किंग','लीक','शोर','कीड़े','सीवेज','गंदगी','टिकट','दर्ज',
];
const HIGH_PRIORITY = [
  'lift stuck','koi andar band','fire','aag','flood','paani bhar','leak','gas',
  'लिफ्ट फंसी','आग','बाढ़','गैस लीक','कोई फंसा',
];

function classify(text) {
  const t = text.toLowerCase();
  if (TRIGGER_HELPDESK.some(w => t.includes(w))) return 'helpdesk';
  if (TRIGGER_PREAPPROVAL.some(w => t.includes(w))) return 'preapproval';
  return null;
}
function extractDate(text) {
  const t = text.toLowerCase();
  if (t.includes('kal') || t.includes('tomorrow') || t.includes('कल')) return 'Tomorrow';
  if (t.includes('parso') || t.includes('day after') || t.includes('परसों')) return 'Day after tomorrow';
  if (t.includes('aaj') || t.includes('today') || t.includes('आज')) return 'Today';
  if (t.includes('friday') || t.includes('शुक्रवार')) return 'Friday';
  if (t.includes('saturday') || t.includes('शनिवार')) return 'Saturday';
  if (t.includes('sunday') || t.includes('रविवार')) return 'Sunday';
  if (t.includes('monday') || t.includes('सोमवार')) return 'Monday';
  return null;
}
function extractTime(text) {
  const t = text.toLowerCase();
  const m = t.match(/(\d{1,2})\s*(am|pm|baje|बजे)/i);
  if (m) return `${m[1]} ${m[2].replace('बजे','').toUpperCase() || 'AM'}`;
  if (t.includes('subah') || t.includes('morning') || t.includes('सुबह')) return 'Morning';
  if (t.includes('shaam') || t.includes('evening') || t.includes('शाम')) return 'Evening';
  if (t.includes('raat') || t.includes('night') || t.includes('रात')) return 'Night';
  return null;
}
function extractVisitorType(text) {
  const t = text.toLowerCase();
  if (t.includes('blinkit') || t.includes('ब्लिंकिट')) return 'Blinkit delivery';
  if (t.includes('swiggy') || t.includes('स्विगी')) return 'Swiggy delivery';
  if (t.includes('zomato') || t.includes('ज़ोमाटो') || t.includes('जोमाटो')) return 'Zomato delivery';
  if (t.includes('amazon') || t.includes('अमेज़न')) return 'Amazon delivery';
  if (t.includes('flipkart') || t.includes('फ्लिपकार्ट')) return 'Flipkart delivery';
  if (t.includes('zepto') || t.includes('ज़ेप्टो')) return 'Zepto delivery';
  if (t.includes('uber')||t.includes('ola')||t.includes('rapido')||t.includes('cab')||
      t.includes('उबर')||t.includes('ओला')||t.includes('रैपिडो')||t.includes('कैब')) return 'Cab';
  if (t.includes('guest')||t.includes('visitor')||t.includes('मेहमान')||
      t.includes('गेस्ट')||t.includes('विजिटर')) return 'Guest';
  if (t.includes('delivery') || t.includes('डिलीवरी')) return 'Delivery';
  return 'Visitor';
}
function extractIssueType(text) {
  const t = text.toLowerCase();
  if (t.includes('lift')||t.includes('elevator')||t.includes('लिफ्ट')) return 'Lift / Elevator';
  if (t.includes('paani')||t.includes('water')||t.includes('पानी')) return 'Water Supply';
  if (t.includes('bijli')||t.includes('electricity')||t.includes('light')||
      t.includes('बिजली')||t.includes('लाइट')) return 'Electricity';
  if (t.includes('parking')||t.includes('पार्किंग')) return 'Parking';
  if (t.includes('leak')||t.includes('लीक')) return 'Leakage';
  if (t.includes('noise')||t.includes('शोर')) return 'Noise Complaint';
  if (t.includes('pest')||t.includes('कीड़े')) return 'Pest Control';
  if (t.includes('sewage')||t.includes('सीवेज')) return 'Sewage';
  return null;
}
function isHighPriority(text) {
  return HIGH_PRIORITY.some(w => text.toLowerCase().includes(w));
}

const DEMO_CHIPS = [
  { text: 'Blinkit delivery tomorrow 8am', type: 'preapproval' },
  { text: 'Uber cab tonight 9pm', type: 'preapproval' },
  { text: 'Guest visiting Friday', type: 'preapproval' },
  { text: 'Lift not working 5th floor', type: 'helpdesk' },
  { text: 'Water supply issue', type: 'helpdesk' },
  { text: 'Parking blocked', type: 'helpdesk' },
];

export default function MyraSheet({ isClosing, onClose }) {
  const [voiceState, setVoiceState] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([]);
  const [flow, setFlow] = useState(null);
  const [showCard, setShowCard] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [passcode] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const chatRef = useRef(null);
  const speechRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, voiceState]);

  useEffect(() => {
    const t = setTimeout(() => startListening(), 600);
    return () => { clearTimeout(t); stopListening(); };
  }, []);

  function startListening() {
    setVoiceState('listening');
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'hi-IN';
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(' ');
      setTranscript(t);
      if (e.results[0].isFinal) processUtterance(t);
    };
    rec.onerror = () => setVoiceState('idle');
    rec.start();
    speechRef.current = rec;
  }
  function stopListening() {
    if (speechRef.current) { try { speechRef.current.stop(); } catch (_e) {} }
  }
  function processUtterance(text) {
    stopListening();
    setVoiceState('thinking');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setTranscript('');
    setTimeout(() => runFlow(text), 1200);
  }
  function addMyra(text) {
    setMessages(prev => [...prev, { role: 'myra', text }]);
  }
  function runFlow(text) {
    if (flow) { continueFlow(text); return; }
    const type = classify(text);
    if (!type) {
      setVoiceState('responding');
      addMyra('Mujhe samajh nahi aaya. Kya aap dobara bol sakte hain?\n(I didn\'t understand, please try again.)');
      setTimeout(() => startListening(), 1800);
      return;
    }
    if (type === 'preapproval') startPreapprovalFlow(text);
    else startHelpdeskFlow(text);
  }
  function startPreapprovalFlow(text) {
    const visitor = extractVisitorType(text);
    const date = extractDate(text);
    const time = extractTime(text);
    const needsHandoff = visitor.toLowerCase().includes('delivery');
    const data = { visitor, date, time, handoff: needsHandoff ? null : 'Direct to flat' };
    const f = { type: 'preapproval', data, step: 0 };
    setFlow(f);
    askNextPreapproval(f);
  }
  function askNextPreapproval(f) {
    setVoiceState('responding');
    if (!f.data.date) {
      addMyra('Kab ke liye chahiye?\n(Kal, parso, ya koi aur date?)');
      setFlow({ ...f, step: 'date' });
      setTimeout(() => startListening(), 1000);
    } else if (!f.data.time) {
      addMyra('Kitne baje expected hai?');
      setFlow({ ...f, step: 'time' });
      setTimeout(() => startListening(), 1000);
    } else if (f.data.handoff === null) {
      addMyra('Security ko dena hai ya directly tumhare flat pe deliver karein?');
      setFlow({ ...f, step: 'handoff' });
      setTimeout(() => startListening(), 1000);
    } else {
      addMyra('Yeh details sahi hain?');
      setFlow({ ...f, step: 'confirm' });
      setShowCard(true);
    }
  }
  function startHelpdeskFlow(text) {
    const issueType = extractIssueType(text);
    const locMatch = text.match(/(\d+\w*)\s*floor/i);
    const location = locMatch ? locMatch[1] + ' floor' : null;
    const priority = isHighPriority(text) ? 'HIGH' : 'MEDIUM';
    const data = { issueType, location, description: text, priority };
    const f = { type: 'helpdesk', data, step: 0 };
    setFlow(f);
    askNextHelpdesk(f);
  }
  function askNextHelpdesk(f) {
    setVoiceState('responding');
    if (!f.data.issueType) {
      addMyra('Kya problem hai — lift, paani, bijli, ya kuch aur?');
      setFlow({ ...f, step: 'issue' });
      setTimeout(() => startListening(), 1000);
    } else if (!f.data.location) {
      addMyra('Yeh kahan hai — floor number ya specific area batao?');
      setFlow({ ...f, step: 'location' });
      setTimeout(() => startListening(), 1000);
    } else {
      addMyra('Samajh gaya. Yeh details sahi hain?');
      setFlow({ ...f, step: 'confirm' });
      setShowCard(true);
    }
  }
  function continueFlow(text) {
    const f = flow;
    if (f.type === 'preapproval') {
      const updated = { ...f, data: { ...f.data } };
      if (f.step === 'date') updated.data.date = extractDate(text) || text.trim();
      else if (f.step === 'time') updated.data.time = extractTime(text) || text.trim();
      else if (f.step === 'handoff') updated.data.handoff = (text.toLowerCase().includes('security')||text.includes('सिक्यूरिटी')||text.toLowerCase().includes('gate')) ? 'Leave with security' : 'Direct to flat';
      setFlow(updated); askNextPreapproval(updated);
    } else {
      const updated = { ...f, data: { ...f.data } };
      if (f.step === 'issue') updated.data.issueType = extractIssueType(text) || text.trim();
      else if (f.step === 'location') updated.data.location = text.trim();
      setFlow(updated); askNextHelpdesk(updated);
    }
  }
  function handleChip(chip) {
    setMessages(prev => [...prev, { role: 'user', text: chip.text }]);
    setVoiceState('thinking');
    setTimeout(() => {
      if (chip.type === 'preapproval') startPreapprovalFlow(chip.text);
      else startHelpdeskFlow(chip.text);
    }, 1200);
  }
  function handleConfirm() { setShowCard(false); setShowSuccess(true); }
  function handleEdit() {
    setShowCard(false);
    addMyra('Theek hai, dobara batao. Kab ke liye chahiye?');
    setFlow(f => ({ ...f, step: 'date', data: { ...f.data, date: null, time: null } }));
    setTimeout(() => startListening(), 800);
  }
  function handleDone() { setShowSuccess(false); setFlow(null); setMessages([]); setVoiceState('idle'); onClose(); }
  function handleTextSubmit() {
    if (!textInput.trim()) return;
    processUtterance(textInput.trim());
    setTextInput('');
  }

  return (
    <div
      className={isClosing ? 'animate-sheet-down' : 'animate-sheet-up'}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 96, zIndex: 50, background: 'white', borderRadius: '20px 20px 0 0', maxHeight: 'calc(85% - 96px)', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 6 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e0e0e0' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 16px 10px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#C8102E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>M</span>
          </div>
          <div style={{ position: 'absolute', top: 1, right: 1, width: 8, height: 8, borderRadius: '50%', background: '#22c55e', border: '1.5px solid white' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', lineHeight: 1.2 }}>Myra</p>
          <p style={{ fontSize: 10, color: '#888' }}>your society assistant</p>
        </div>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', background: '#f0f0f0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={14} color="#555" />
        </button>
      </div>

      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && voiceState === 'idle' && (
          <div className="animate-fade-in" style={{ textAlign: 'center', paddingTop: 20 }}>
            <p style={{ fontSize: 15, color: '#1a1a2e', fontWeight: 500, marginBottom: 6 }}>Hi, I&#39;m Myra — your society assistant.</p>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>How can I help you today?</p>
            <p style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Try saying:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {DEMO_CHIPS.map((chip, i) => (
                <button key={i} onClick={() => handleChip(chip)} style={{ background: '#f5f5f5', border: '1px solid #e8e8e8', borderRadius: 16, padding: '6px 12px', fontSize: 11.5, color: '#444', cursor: 'pointer' }}>{chip.text}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className="animate-fade-in" style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
            {m.role === 'myra' && (
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#C8102E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>M</span>
              </div>
            )}
            <div style={{ maxWidth: '75%', background: m.role === 'user' ? '#0f1f3d' : '#f5f5f5', color: m.role === 'user' ? 'white' : '#1a1a2e', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '9px 13px', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.text}</div>
          </div>
        ))}
        {voiceState === 'listening' && (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 8, height: 28, alignItems: 'center' }}>
              {[0,0.12,0.24,0.12,0].map((d,i) => <div key={i} className="animate-wave-bar" style={{ width: 4, borderRadius: 2, background: '#C8102E', animationDelay: `${d}s`, height: 6 }} />)}
            </div>
            {transcript && <p style={{ fontSize: 13, color: '#888', fontStyle: 'italic' }}>&#34;{transcript}&#34;</p>}
          </div>
        )}
        {voiceState === 'thinking' && (
          <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#C8102E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>M</span></div>
            <div style={{ background: '#f5f5f5', borderRadius: '16px 16px 16px 4px', padding: '12px 16px', display: 'flex', gap: 5 }}>
              {[0,0.2,0.4].map((d,i) => <div key={i} className="bounce-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#0f1f3d', animationDelay: `${d}s` }} />)}
            </div>
          </div>
        )}
        {showSuccess && (
          <div className="animate-fade-in" style={{ textAlign: 'center', paddingTop: 10 }}>
            <div className="animate-scale-in" style={{ display: 'inline-block', marginBottom: 12 }}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="36" stroke="#22c55e" strokeWidth="4" fill="none" className="draw-circle" />
                <polyline points="22,42 34,54 58,30" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" className="draw-check" />
              </svg>
            </div>
            {flow?.type === 'preapproval' ? (
              <>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 6 }}>Pre-approval created!</p>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>{flow.data.visitor} · {flow.data.date} {flow.data.time} · {flow.data.handoff}</p>
                <div style={{ border: '2px dashed #e0e0e0', borderRadius: 10, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginLeft: 16, marginRight: 16 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: '#1a1a2e', letterSpacing: 4 }}>{passcode}</span>
                  <button onClick={() => navigator.clipboard?.writeText(passcode)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Copy size={18} color="#888" /></button>
                </div>
                <div style={{ background: '#fffbeb', borderRadius: 10, padding: '10px 14px', margin: '0 16px 12px', textAlign: 'left' }}>
                  <span style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase' }}>Sponsored</span>
                  <p style={{ fontSize: 12, color: '#1a1a2e', fontWeight: 500, margin: '2px 0 4px' }}>NoBroker Pay — Zero fee on maintenance payments</p>
                  <span style={{ fontSize: 11, color: '#C8102E', cursor: 'pointer' }}>Explore →</span>
                </div>
                <button style={{ display: 'block', width: 'calc(100% - 32px)', margin: '0 16px 8px', background: '#0f1f3d', color: 'white', border: 'none', borderRadius: 12, padding: 13, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Share via WhatsApp</button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 6 }}>Complaint raised!</p>
                <p style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#0f1f3d', marginBottom: 6 }}>#HD-2047</p>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>Expected resolution: 24–48 hours</p>
                <div style={{ background: '#eff6ff', borderRadius: 10, padding: '10px 14px', margin: '0 16px 12px', textAlign: 'left' }}>
                  <span style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase' }}>Sponsored</span>
                  <p style={{ fontSize: 12, color: '#1a1a2e', fontWeight: 500, margin: '2px 0 4px' }}>NoBroker Home Services — Trusted plumbers &amp; electricians near you</p>
                  <span style={{ fontSize: 11, color: '#C8102E', cursor: 'pointer' }}>Book now →</span>
                </div>
              </>
            )}
            <button onClick={handleDone} style={{ display: 'block', width: 'calc(100% - 32px)', margin: '0 auto', background: '#f0f0f0', color: '#555', border: 'none', borderRadius: 12, padding: 13, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Done</button>
          </div>
        )}
      </div>

      {showCard && flow && (
        <div className="animate-card-up" style={{ background: 'white', borderTop: '1px solid #e8e8e8', padding: '14px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{flow.type === 'preapproval' ? 'Create pre-approval' : 'Raise complaint'}</span>
            <span style={{ background: '#e0eaff', color: '#2563eb', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>
              {flow.type === 'preapproval' ? (flow.data.visitor?.includes('delivery') ? 'Delivery' : flow.data.visitor === 'Cab' ? 'Cab' : 'Guest') : (flow.data.issueType || 'Issue')}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {(flow.type === 'preapproval'
              ? [['Visitor',flow.data.visitor],['Date',flow.data.date],['Time',flow.data.time],['Valid for','2 hours (default)'],['Handoff',flow.data.handoff]]
              : [['Category',flow.data.issueType||'—'],['Issue',(flow.data.description||'').slice(0,55)+'...'],['Location',flow.data.location||'Not specified'],['Priority',flow.data.priority]]
            ).map(([label,value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#888' }}>{label}</span>
                {label === 'Priority'
                  ? <span style={{ background: value==='HIGH'?'#fee2e2':'#fef3c7', color: value==='HIGH'?'#C8102E':'#d97706', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8 }}>{value}</span>
                  : <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e', maxWidth: '55%', textAlign: 'right' }}>{value||'—'}</span>
                }
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleConfirm} style={{ flex: 1, background: '#C8102E', color: 'white', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{flow.type === 'preapproval' ? 'Confirm' : 'Confirm & Submit'}</button>
            <button onClick={handleEdit} style={{ flex: 1, background: '#f0f0f0', color: '#555', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
          </div>
        </div>
      )}

      {!showSuccess && (
        <div style={{ flexShrink: 0, padding: '8px 16px 12px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input value={textInput} onChange={e => setTextInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTextSubmit()} placeholder="Or type here and press Enter"
              style={{ flex: 1, background: '#f5f5f5', border: 'none', borderRadius: 20, padding: '10px 16px', fontSize: 13, color: '#1a1a2e', outline: 'none' }} />
            <button onClick={handleTextSubmit} style={{ width: 36, height: 36, borderRadius: '50%', background: '#C8102E', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={16} color="white" />
            </button>
          </div>
          <p style={{ fontSize: 10, color: '#bbb', textAlign: 'center' }}>English · हिन्दी · ಕನ್ನಡ · தமிழ் · తెలుగు · मराठी</p>
        </div>
      )}
    </div>
  );
}
