import { Search, MessageCircle, Bell, ChevronDown, ChevronRight, ArrowUpRight, Pencil } from 'lucide-react';

export default function HomeScreen() {
  return (
    <div style={{ background: 'white', height: 812, overflowY: 'auto', paddingBottom: 60 }}>

      {/* STATUS BAR */}
      <div style={{ background: 'white', padding: '10px 16px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>9:41</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="4" width="3" height="8" rx="1" fill="#1a1a2e"/><rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill="#1a1a2e"/><rect x="9" y="1" width="3" height="11" rx="1" fill="#1a1a2e"/></svg>
          <svg width="24" height="12" viewBox="0 0 24 12"><rect x="0" y="1" width="21" height="10" rx="2" stroke="#1a1a2e" strokeWidth="1.2" fill="none"/><rect x="21" y="3.5" width="2" height="5" rx="1" fill="#1a1a2e"/><rect x="1.5" y="2.5" width="14" height="7" rx="1" fill="#1a1a2e"/></svg>
        </div>
      </div>

      {/* TOP BAR */}
      <div style={{ background: 'white', padding: '6px 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, border: '1.5px solid #e8e8e8', cursor: 'pointer' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>R</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>B-1805</span>
          <ChevronDown size={14} color="#888" />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, border: '1.5px solid #e8e8e8', cursor: 'pointer', overflow: 'hidden' }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: '#e23744', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontSize: 9, fontWeight: 800 }}>Z</span>
          </div>
          <span style={{ fontSize: 11.5, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>15% OFF on k...</span>
          <ChevronDown size={13} color="#888" />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Search size={20} color="#1a1a2e" />
          <MessageCircle size={20} color="#1a1a2e" />
          <div style={{ position: 'relative' }}>
            <Bell size={20} color="#1a1a2e" />
            <div style={{ position: 'absolute', top: -4, right: -4, background: '#C8102E', width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 8, fontWeight: 700 }}>N</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK TILES */}
      <div style={{ background: 'white', padding: '8px 16px 16px', display: 'flex', justifyContent: 'space-between' }}>
        {[{label:'Visitors',bg:'#fff4f0',emoji:'🏠'},{label:'My Bills',bg:'#fff8f0',emoji:'🧾'},{label:'Society',bg:'#f0f4ff',emoji:'🏢'},{label:'Services',bg:'#f8f0ff',emoji:'✨'}].map(({label,bg,emoji})=>(
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flex: 1 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{emoji}</div>
            <span style={{ fontSize: 11.5, color: '#1a1a2e', fontWeight: 500, textAlign: 'center' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* PEOPLE ROW */}
      <div style={{ background: 'white', paddingBottom: 12 }}>
        <div style={{ display: 'flex', gap: 16, paddingLeft: 16, paddingRight: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[{name:'Govindara',color:'#7c3aed'},{name:'Jayesh',color:'#2563eb'},{name:'Jayesh',color:'#059669'}].map((p,i)=>(
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16 }}>{p.name[0]}</div>
                <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid white' }} />
              </div>
              <span style={{ fontSize: 10.5, color: '#555', maxWidth: 50, textAlign: 'center', lineHeight: 1.2 }}>{p.name}</span>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#f0f2f5', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🧹</div>
            <span style={{ fontSize: 10.5, color: '#555', textAlign: 'center' }}>Daily Help</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowUpRight size={20} color="#888" /></div>
            <span style={{ fontSize: 10.5, color: '#555' }}>View all</span>
          </div>
        </div>
      </div>

      {/* BLINKIT STRIP */}
      <div style={{ margin: '8px 16px', background: '#f8e71c', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'black', borderRadius: 6, padding: '2px 7px' }}><span style={{ color: '#f8e71c', fontSize: 12, fontWeight: 900 }}>blinkit</span></div>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: '#1a1a2e' }}>Get holi colours, pichkaris and more</span>
        </div>
        <ChevronRight size={16} color="#1a1a2e" />
      </div>

      {/* MAINTENANCE BILL */}
      <div style={{ margin: '0 16px 8px', background: 'white', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e8e8e8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>✂️</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a2e' }}>₹45000 Maintenance Bill</span>
            <span style={{ background: '#C8102E', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>DUE</span>
          </div>
        </div>
        <span style={{ fontSize: 13, color: '#C8102E', fontWeight: 600, cursor: 'pointer' }}>Pay Now ›</span>
      </div>

      {/* SERVICES */}
      <div style={{ padding: '8px 0', background: 'white', marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 10px' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>Services you need</span>
          <Pencil size={15} color="#888" />
        </div>
        <div style={{ display: 'flex', gap: 14, paddingLeft: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[{label:'Cleaning Services',card:true},{label:'Helpdesk',emoji:'🆘'},{label:'SOS',emoji:'🚨',red:true},{label:'Security',emoji:'👮'},{label:'Billing',emoji:'💳'}].map(({label,emoji,card,red})=>(
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {card
                ? <div style={{ width: 72, height: 60, borderRadius: 12, background: 'linear-gradient(135deg,#e0f2fe,#bae6fd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#0369a1', fontWeight: 600, textAlign: 'center', padding: 6 }}>Book Professional Clean ✨</div>
                : <div style={{ width: 52, height: 52, borderRadius: '50%', background: red ? '#C8102E' : '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{emoji}</div>
              }
              <span style={{ fontSize: 10.5, color: '#555', textAlign: 'center', maxWidth: 70 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ADS */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 16px', background: '#f0f2f5' }}>
        <div style={{ flex: 1, borderRadius: 14, background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', padding: 14, minHeight: 110 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            <div style={{ background: '#C8102E', borderRadius: 4, padding: '2px 6px' }}><span style={{ color: 'white', fontSize: 9, fontWeight: 800 }}>zepto</span></div>
            <span style={{ background: '#C8102E', color: 'white', fontSize: 8, padding: '2px 5px', borderRadius: 3, fontWeight: 700 }}>pharmacy</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '3px 8px', display: 'inline-block', marginBottom: 6 }}>
            <span style={{ color: 'white', fontSize: 9 }}>flat 20% off on your first order</span>
          </div>
          <p style={{ color: 'white', fontSize: 11, fontWeight: 600, marginBottom: 10, lineHeight: 1.35 }}>now delivering<br />10,000+ medicines<br />in 10 minutes*</p>
          <button style={{ background: '#C8102E', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Order Now</button>
        </div>
        <div style={{ flex: 1, borderRadius: 14, background: 'linear-gradient(135deg,#7f1d1d,#b91c1c)', padding: 14, minHeight: 110, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ background: 'white', borderRadius: 4, padding: '2px 6px', display: 'inline-block', marginBottom: 8 }}><span style={{ color: '#b91c1c', fontSize: 10, fontWeight: 900 }}>TITAN</span></div>
            <p style={{ color: 'white', fontSize: 18, fontWeight: 800, lineHeight: 1.1, marginBottom: 4 }}>Buy 1<br />Get 1 Free</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>Frames and Sunglasses</p>
          </div>
          <button style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer', marginTop: 10 }}>Visit Now</button>
        </div>
      </div>

      {/* SOCIETY NOTICES */}
      <div style={{ padding: '4px 16px 80px', background: 'white', marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>Society Notices</span>
            <span style={{ background: '#C8102E', color: 'white', fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
          </div>
          <span style={{ fontSize: 12, color: '#C8102E', fontWeight: 600, cursor: 'pointer' }}>See all</span>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[{title:'Experience the GIIS di...',desc:'Comprehensive 9G Teaching Framework, Skill Comprehensive 9GEMS Teaching Framework...',time:'2d ago',color:'#7c3aed'},{title:'Emergency maintenance...',desc:'Urgent notice regarding scheduled maintenance work...',time:'3d ago',color:'#2563eb'}].map((n,i)=>(
            <div key={i} style={{ flexShrink: 0, width: 155, border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ height: 60, background: `linear-gradient(135deg,${n.color}22,${n.color}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📋</div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C8102E', flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{n.title}</span>
                </div>
                <span style={{ fontSize: 9.5, color: '#888', display: 'block', marginBottom: 4 }}>{n.time}</span>
                <p style={{ fontSize: 10.5, color: '#555', lineHeight: 1.4 }}>{n.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM NAV — sticky so it stays at bottom of scroll */}
      <div style={{ position: 'sticky', bottom: 0, background: 'white', borderTop: '1px solid #e8e8e8', display: 'flex', zIndex: 20 }}>
        {[{label:'Home',emoji:'🏠',active:true},{label:'Visitors',emoji:'👥'},{label:'Society',emoji:'🏢'},{label:'Profile',emoji:'👤'}].map(({label,emoji,active})=>(
          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 4px', cursor: 'pointer' }}>
            <span style={{ fontSize: 22 }}>{emoji}</span>
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? '#C8102E' : '#888', marginTop: 2 }}>{label}</span>
            {active && <div style={{ width: 20, height: 2, background: '#C8102E', borderRadius: 2, marginTop: 2 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
