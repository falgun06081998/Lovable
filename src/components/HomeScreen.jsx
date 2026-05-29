import { Search, MessageCircle, Bell, ChevronDown, ChevronRight, ArrowUpRight, Pencil } from 'lucide-react';

/* ── Status bar SVGs ── */
const SignalIcon = () => (
  <svg width="17" height="12" viewBox="0 0 17 12" fill="white">
    <rect x="0" y="7" width="3" height="5" rx="0.5"/>
    <rect x="4.5" y="4.5" width="3" height="7.5" rx="0.5"/>
    <rect x="9" y="2" width="3" height="10" rx="0.5"/>
    <rect x="13.5" y="0" width="3" height="12" rx="0.5"/>
  </svg>
);

const WifiIcon = () => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
    <path d="M8 10a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
    <path d="M8 6.5c1.6 0 3 .65 4.05 1.7l1.4-1.4A7.9 7.9 0 008 4.5c-2.2 0-4.2.9-5.65 2.3l1.4 1.4A5.9 5.9 0 018 6.5z"/>
    <path d="M8 2.5c2.8 0 5.3 1.15 7.1 3l1.4-1.4A11.4 11.4 0 008 .5 11.4 11.4 0 00.5 4.1l1.4 1.4A9.4 9.4 0 018 2.5z"/>
  </svg>
);

const BatteryIcon = () => (
  <svg width="25" height="12" viewBox="0 0 25 12" fill="white">
    <rect x="0" y="1" width="21" height="10" rx="2.5" stroke="white" strokeWidth="1.2" fill="none"/>
    <rect x="1.5" y="2.5" width="16" height="7" rx="1.5" fill="white"/>
    <rect x="22" y="3.5" width="2.5" height="5" rx="1.2" fill="white"/>
  </svg>
);

/* ── Quick Tile ── */
const QuickTile = ({ icon, label, bg }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flex:1 }}>
    <div style={{
      width:56, height:56, borderRadius:16,
      background:bg, display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:26, boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
    }}>{icon}</div>
    <span style={{ fontSize:11, fontWeight:500, color:'#444', textAlign:'center' }}>{label}</span>
  </div>
);

/* ── People Avatar ── */
const PersonAvatar = ({ initial, bg, name, online }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
    <div style={{ position:'relative' }}>
      <div style={{
        width:46, height:46, borderRadius:'50%',
        background:bg, display:'flex', alignItems:'center', justifyContent:'center',
        color:'white', fontWeight:700, fontSize:17,
      }}>{initial}</div>
      {online && (
        <div style={{
          position:'absolute', bottom:1, right:1,
          width:11, height:11, borderRadius:'50%',
          background:'#22c55e', border:'2px solid white',
        }} />
      )}
    </div>
    <span style={{ fontSize:10, color:'#555', maxWidth:46, textAlign:'center', lineHeight:1.2 }}>{name}</span>
  </div>
);

/* ── Dashed Help Circle ── */
const DailyHelpCircle = () => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
    <div style={{
      width:46, height:46, borderRadius:'50%',
      border:'1.5px dashed #aaa', display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:22,
    }}>🧹</div>
    <span style={{ fontSize:10, color:'#888', maxWidth:48, textAlign:'center', lineHeight:1.2 }}>Daily Help</span>
  </div>
);

/* ── Service Card ── */
const ServiceCard = ({ icon, label, bg, small }) => (
  <div style={{
    flexShrink:0, borderRadius:14, background:bg||'#f5f5f5',
    padding: small ? '10px 12px' : '12px 14px',
    display:'flex', flexDirection:'column', gap:6,
    minWidth: small ? 80 : 110,
    boxShadow:'0 1px 6px rgba(0,0,0,0.07)',
  }}>
    <span style={{ fontSize: small ? 22 : 26 }}>{icon}</span>
    <span style={{ fontSize: small ? 10 : 11, fontWeight:600, color:'#1a1a2e', lineHeight:1.3 }}>{label}</span>
  </div>
);

/* ── Notice Card ── */
const NoticeCard = ({ title, time, desc, gradient }) => (
  <div style={{
    flexShrink:0, width:200, borderRadius:14,
    background:gradient, padding:'14px',
    color:'white',
  }}>
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
      <span style={{ fontSize:20 }}>📋</span>
      <div>
        <p style={{ fontSize:12, fontWeight:700, lineHeight:1.3 }}>{title}</p>
        <p style={{ fontSize:10, opacity:0.75 }}>{time}</p>
      </div>
    </div>
    <p style={{ fontSize:11, opacity:0.85, lineHeight:1.5 }}>{desc}</p>
  </div>
);

export default function HomeScreen() {
  return (
    <div style={{ height:812, overflowY:'auto', paddingBottom:70, background:'#f0f2f5', position:'relative' }}>

      {/* Status Bar */}
      <div style={{
        background:'#C8102E', padding:'8px 18px 6px',
        display:'flex', justifyContent:'space-between', alignItems:'center',
      }}>
        <span style={{ color:'white', fontSize:14, fontWeight:700 }}>9:41</span>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <SignalIcon /><WifiIcon /><BatteryIcon />
        </div>
      </div>

      {/* Top Bar */}
      <div style={{
        background:'#C8102E', padding:'0 14px 12px',
        display:'flex', alignItems:'center', gap:8,
      }}>
        {/* Society pill */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
          <div style={{
            width:34, height:34, borderRadius:'50%',
            background:'#FF6B00', display:'flex', alignItems:'center', justifyContent:'center',
            color:'white', fontWeight:800, fontSize:15, flexShrink:0,
          }}>R</div>
          <div style={{
            display:'flex', alignItems:'center', gap:3,
            background:'rgba(255,255,255,0.2)', borderRadius:20, padding:'4px 10px',
          }}>
            <span style={{ color:'white', fontSize:12, fontWeight:600 }}>B-1805</span>
            <ChevronDown size={14} color="white" />
          </div>
        </div>

        {/* Zomato pill */}
        <div style={{
          display:'flex', alignItems:'center', gap:5,
          background:'rgba(255,255,255,0.18)', borderRadius:20, padding:'4px 10px',
          flexShrink:0,
        }}>
          <div style={{
            width:18, height:18, borderRadius:'50%', background:'#e23744',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'white', fontWeight:800, fontSize:9,
          }}>Z</div>
          <span style={{ color:'white', fontSize:10, fontWeight:600 }}>15% OFF on k...</span>
        </div>

        {/* Icons */}
        <div style={{ display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
          <Search size={20} color="white" />
          <MessageCircle size={20} color="white" />
          <div style={{ position:'relative' }}>
            <Bell size={20} color="white" />
            <div style={{
              position:'absolute', top:-4, right:-4,
              width:14, height:14, borderRadius:'50%',
              background:'#22c55e', border:'1.5px solid #C8102E',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <span style={{ color:'white', fontSize:7, fontWeight:700 }}>N</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tiles */}
      <div style={{ background:'white', margin:'10px 12px', borderRadius:16, padding:'14px 10px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }}>
        <div style={{ display:'flex', justifyContent:'space-around' }}>
          <QuickTile icon="🏠" label="Visitors" bg="#fff3e8" />
          <QuickTile icon="🧾" label="My Bills" bg="#fffbeb" />
          <QuickTile icon="🏢" label="Society" bg="#eff6ff" />
          <QuickTile icon="✨" label="Services" bg="#f5f3ff" />
        </div>
      </div>

      {/* People Row */}
      <div style={{ background:'white', margin:'0 12px 10px', borderRadius:16, padding:'14px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <span style={{ fontSize:13, fontWeight:700, color:'#1a1a2e' }}>People</span>
          <div style={{ display:'flex', alignItems:'center', gap:4, color:'#C8102E' }}>
            <span style={{ fontSize:12, fontWeight:600 }}>View all</span>
            <ArrowUpRight size={14} color="#C8102E" />
          </div>
        </div>
        <div style={{ display:'flex', gap:14, overflowX:'auto', paddingBottom:4 }}>
          <PersonAvatar initial="G" bg="#7c3aed" name="Govindara" online />
          <PersonAvatar initial="J" bg="#2563eb" name="Jayesh" online />
          <PersonAvatar initial="J" bg="#16a34a" name="Jayesh" online />
          <DailyHelpCircle />
        </div>
      </div>

      {/* Blinkit Strip */}
      <div style={{
        margin:'0 12px 10px', borderRadius:14,
        background:'#f9e03c', padding:'10px 14px',
        display:'flex', alignItems:'center', gap:10,
      }}>
        <div style={{
          background:'#1a1a1a', borderRadius:8, padding:'3px 8px',
          display:'flex', alignItems:'center',
        }}>
          <span style={{ color:'#f9e03c', fontSize:13, fontWeight:800 }}>blinkit</span>
        </div>
        <span style={{ flex:1, fontSize:12, fontWeight:600, color:'#1a1a1a' }}>
          Get holi colours, pichkaris and more
        </span>
        <ChevronRight size={18} color="#1a1a1a" />
      </div>

      {/* Maintenance Bill Card */}
      <div style={{
        margin:'0 12px 10px', borderRadius:14, background:'white',
        padding:'14px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)',
        display:'flex', alignItems:'center', gap:12,
      }}>
        <span style={{ fontSize:28 }}>✂️</span>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#1a1a2e' }}>₹45000 Maintenance Bill</span>
            <span style={{
              background:'#fef2f2', color:'#C8102E',
              fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:6,
              border:'1px solid #fecaca',
            }}>DUE</span>
          </div>
          <span style={{ fontSize:11, color:'#888' }}>Society maintenance for March 2025</span>
        </div>
        <span style={{ color:'#C8102E', fontSize:12, fontWeight:700, whiteSpace:'nowrap' }}>Pay Now ›</span>
      </div>

      {/* Services You Need */}
      <div style={{ margin:'0 12px 10px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#1a1a2e' }}>Services you need</span>
            <Pencil size={14} color="#888" />
          </div>
        </div>
        <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4 }}>
          <div style={{
            flexShrink:0, borderRadius:14, overflow:'hidden',
            background:'linear-gradient(135deg,#667eea,#764ba2)',
            padding:'12px 14px', minWidth:130,
            boxShadow:'0 2px 8px rgba(102,126,234,0.35)',
          }}>
            <span style={{ fontSize:22 }}>✨</span>
            <p style={{ fontSize:11, fontWeight:700, color:'white', marginTop:6, lineHeight:1.3 }}>
              Book Professional Clean
            </p>
          </div>
          <ServiceCard icon="🆘" label="Helpdesk" bg="#fff0f0" />
          <div style={{
            flexShrink:0, width:60, height:80, borderRadius:30,
            background:'#C8102E', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:4,
            boxShadow:'0 2px 8px rgba(200,16,46,0.3)',
          }}>
            <span style={{ fontSize:22 }}>🚨</span>
            <span style={{ fontSize:9, fontWeight:700, color:'white' }}>SOS</span>
          </div>
          <ServiceCard icon="👮" label="Security" bg="#f0f9ff" />
          <ServiceCard icon="💳" label="Billing" bg="#f0fdf4" />
        </div>
      </div>

      {/* Ad Banners */}
      <div style={{ margin:'0 12px 10px', display:'flex', gap:10 }}>
        {/* Zepto */}
        <div style={{
          flex:1, borderRadius:14, overflow:'hidden',
          background:'linear-gradient(135deg,#0c1445,#1a237e)',
          padding:'14px', display:'flex', flexDirection:'column', gap:6,
        }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:2 }}>
            <span style={{ color:'white', fontSize:15, fontWeight:800 }}>zepto</span>
            <span style={{ color:'#82b0ff', fontSize:10, fontWeight:600 }}>pharmacy</span>
          </div>
          <p style={{ color:'white', fontSize:11, fontWeight:600, lineHeight:1.4 }}>flat 20% off</p>
          <button style={{
            background:'#C8102E', color:'white', border:'none', borderRadius:8,
            padding:'5px 10px', fontSize:10, fontWeight:700, cursor:'pointer', alignSelf:'flex-start',
          }}>Order Now</button>
        </div>
        {/* Titan */}
        <div style={{
          flex:1, borderRadius:14, overflow:'hidden',
          background:'linear-gradient(135deg,#7f1d1d,#450a0a)',
          padding:'14px', display:'flex', flexDirection:'column', gap:6,
        }}>
          <div style={{
            background:'white', borderRadius:6, padding:'2px 8px',
            display:'inline-flex', alignSelf:'flex-start',
          }}>
            <span style={{ color:'#7f1d1d', fontSize:12, fontWeight:800, letterSpacing:'0.1em' }}>TITAN</span>
          </div>
          <p style={{ color:'white', fontSize:11, fontWeight:600, lineHeight:1.4 }}>Buy 1 Get 1 Free</p>
          <button style={{
            background:'rgba(255,255,255,0.15)', color:'white', border:'1px solid rgba(255,255,255,0.3)',
            borderRadius:8, padding:'5px 10px', fontSize:10, fontWeight:700, cursor:'pointer', alignSelf:'flex-start',
          }}>Visit Now</button>
        </div>
      </div>

      {/* Society Notices */}
      <div style={{ margin:'0 12px 10px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#1a1a2e' }}>Society Notices</span>
            <div style={{
              background:'#C8102E', color:'white', borderRadius:'50%',
              width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:10, fontWeight:700,
            }}>3</div>
          </div>
          <span style={{ color:'#C8102E', fontSize:12, fontWeight:600 }}>See all</span>
        </div>
        <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4 }}>
          <NoticeCard
            title="Water Supply Disruption"
            time="2 hours ago"
            desc="Water supply will be off from 10am to 2pm on Friday for maintenance."
            gradient="linear-gradient(135deg,#7c3aed,#4c1d95)"
          />
          <NoticeCard
            title="Parking Rules Update"
            time="1 day ago"
            desc="New parking slots have been allocated. Check the notice board for details."
            gradient="linear-gradient(135deg,#2563eb,#1e3a8a)"
          />
        </div>
      </div>

      {/* SALE M tab */}
      <div style={{
        position:'absolute', right:-22, top:320,
        background:'#ec4899', color:'white',
        padding:'10px 6px', borderRadius:'6px 0 0 6px',
        writingMode:'vertical-rl', textOrientation:'mixed',
        fontSize:11, fontWeight:800, letterSpacing:'0.08em',
        transform:'rotate(180deg)',
        zIndex:10,
      }}>SALE M</div>

      {/* Bottom Nav */}
      <div style={{
        position:'sticky', bottom:0, left:0, right:0,
        background:'white', borderTop:'1px solid #e8e8e8',
        display:'flex', justifyContent:'space-around', alignItems:'center',
        padding:'10px 0 14px', zIndex:20,
      }}>
        {[
          { icon:'🏠', label:'Home', active:true },
          { icon:'👥', label:'Visitors', active:false },
          { icon:'🏢', label:'Society', active:false },
          { icon:'👤', label:'Profile', active:false },
        ].map(({ icon, label, active }) => (
          <div key={label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, cursor:'pointer' }}>
            <span style={{ fontSize:22 }}>{icon}</span>
            <span style={{ fontSize:10, fontWeight: active ? 700 : 400, color: active ? '#C8102E' : '#888' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
