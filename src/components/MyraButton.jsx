import { Mic } from 'lucide-react';

export default function MyraButton({ phase, onTap }) {
  const centered = phase === 'moving' || phase === 'active';
  const isActive = phase === 'active';
  const isIdle = phase === 'idle';
  const size = centered ? 64 : 48;

  return (
    <>
      {/* 3 pulse rings when active */}
      {isActive && [0, 0.6, 1.2].map((delay, i) => (
        <div key={i} className="animate-pulse-ring" style={{
          position: 'absolute', zIndex: 59, pointerEvents: 'none',
          width: 64, height: 64, borderRadius: '50%',
          background: `rgba(200,16,46,${0.28 - i * 0.08})`,
          left: '50%', bottom: 28,
          transform: 'translateX(-50%)',
          animationDelay: `${delay}s`,
        }} />
      ))}

      {/* "MYRA IS LISTENING" label */}
      {isActive && (
        <div className="animate-fade-in" style={{
          position: 'absolute', zIndex: 61,
          left: '50%', bottom: 100,
          transform: 'translateX(-50%)',
          background: 'white', border: '1.5px solid #C8102E',
          borderRadius: 20, padding: '4px 14px',
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          <span style={{ color: '#C8102E', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>
            MYRA IS LISTENING
          </span>
        </div>
      )}

      {/* The button */}
      <div
        onClick={isIdle ? onTap : undefined}
        style={{
          position: 'absolute', zIndex: 60,
          width: size, height: size, borderRadius: '50%',
          background: '#C8102E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: isIdle ? 'pointer' : 'default',
          boxShadow: isActive ? '0 8px 30px rgba(200,16,46,0.5)' : '0 4px 14px rgba(200,16,46,0.4)',
          transition: [
            'left 0.44s cubic-bezier(0.34,1.26,0.64,1)',
            'bottom 0.44s cubic-bezier(0.34,1.26,0.64,1)',
            'width 0.44s cubic-bezier(0.34,1.26,0.64,1)',
            'height 0.44s cubic-bezier(0.34,1.26,0.64,1)',
          ].join(', '),
          ...(centered
            ? { left: '50%', transform: 'translateX(-50%)', bottom: 28 }
            : { left: 16, transform: 'none', bottom: 72 }),
        }}
      >
        {/* Green online dot */}
        {isIdle && (
          <div style={{
            position: 'absolute', top: 2, right: 2,
            width: 10, height: 10, borderRadius: '50%',
            background: '#22c55e', border: '2px solid white',
          }} />
        )}

        {/* Idle pulse ring */}
        {isIdle && (
          <div className="animate-pulse-ring" style={{
            position: 'absolute', width: '100%', height: '100%',
            borderRadius: '50%', background: 'rgba(200,16,46,0.3)',
            animationDuration: '3s',
          }} />
        )}

        {/* M text */}
        <span style={{
          position: 'absolute', color: 'white', fontWeight: 800,
          fontSize: centered ? 24 : 20,
          opacity: centered ? 0 : 1,
          transition: 'opacity 0.2s ease',
          userSelect: 'none',
        }}>M</span>

        {/* Mic icon */}
        <span style={{
          position: 'absolute',
          opacity: centered ? 1 : 0,
          transition: 'opacity 0.2s ease 0.18s',
          display: 'flex',
        }}>
          <Mic size={28} color="white" />
        </span>
      </div>
    </>
  );
}
