import { Mic } from 'lucide-react';

export default function MyraButton({ phase, onTap }) {
  const centered = phase === 'moving' || phase === 'active';
  const isActive = phase === 'active';
  const isIdle = phase === 'idle';
  const size = centered ? 68 : 52;

  return (
    <>
      {/* Active pulse rings */}
      {isActive && [0, 0.5, 1.0].map((delay, i) => (
        <div key={i} className="animate-pulse-ring" style={{
          position:'absolute', zIndex:59, pointerEvents:'none',
          width:68, height:68, borderRadius:'50%',
          background:`rgba(200,16,46,${0.3 - i*0.08})`,
          left:'50%', bottom:24,
          transform:'translateX(-50%)',
          animationDelay:`${delay}s`,
        }} />
      ))}

      {/* MYRA IS LISTENING label */}
      {isActive && (
        <div className="animate-fade-in" style={{
          position:'absolute', zIndex:61,
          left:'50%', bottom:100,
          transform:'translateX(-50%)',
          background:'white', border:'1.5px solid #C8102E',
          borderRadius:20, padding:'4px 14px',
          pointerEvents:'none', whiteSpace:'nowrap',
        }}>
          <span style={{ color:'#C8102E', fontSize:10, fontWeight:700, letterSpacing:'0.08em' }}>
            MYRA IS LISTENING
          </span>
        </div>
      )}

      {/* The button */}
      <div
        onClick={isIdle ? onTap : undefined}
        style={{
          position:'absolute', zIndex:60,
          width:size, height:size, borderRadius:'50%',
          background:'#C8102E',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor: isIdle ? 'pointer' : 'default',
          boxShadow: isActive ? '0 8px 30px rgba(200,16,46,0.5)' : '0 4px 14px rgba(200,16,46,0.4)',
          transition:[
            'left 0.42s cubic-bezier(0.34,1.3,0.64,1)',
            'bottom 0.42s cubic-bezier(0.34,1.3,0.64,1)',
            'width 0.42s cubic-bezier(0.34,1.3,0.64,1)',
            'height 0.42s cubic-bezier(0.34,1.3,0.64,1)',
          ].join(', '),
          ...(centered
            ? { left:'50%', transform:'translateX(-50%)', bottom:24 }
            : { left:16, transform:'none', bottom:80 }),
        }}
      >
        {isIdle && (
          <div style={{
            position:'absolute', top:2, right:2,
            width:10, height:10, borderRadius:'50%',
            background:'#22c55e', border:'2px solid white',
          }} />
        )}
        {/* Idle double pulse rings */}
        {isIdle && [0, 1.5].map((delay, i) => (
          <div key={i} className="animate-pulse-ring" style={{
            position:'absolute', width:'100%', height:'100%',
            borderRadius:'50%', background:'rgba(200,16,46,0.25)',
            animationDuration:'3s',
            animationDelay:`${delay}s`,
            transform:'translateX(0)',
          }} />
        ))}
        <span style={{
          position:'absolute', color:'white', fontWeight:800,
          fontSize: centered ? 26 : 22,
          opacity: centered ? 0 : 1,
          transition:'opacity .2s ease',
          userSelect:'none',
        }}>M</span>
        <span style={{
          position:'absolute',
          opacity: centered ? 1 : 0,
          transition:'opacity .2s ease .18s',
          display:'flex',
        }}>
          <Mic size={30} color="white" />
        </span>
      </div>
    </>
  );
}
