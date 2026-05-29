import { useState, useCallback } from 'react';
import HomeScreen from './components/HomeScreen';
import MyraButton from './components/MyraButton';
import MyraSheet from './components/MyraSheet';

// myraPhase: 'idle' | 'moving' | 'active' | 'closing'
export default function App() {
  const [phase, setPhase] = useState('idle');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetClosing, setSheetClosing] = useState(false);

  const openMyra = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('moving');
    setTimeout(() => {
      setPhase('active');
      setSheetOpen(true);
    }, 440);
  }, [phase]);

  const closeMyra = useCallback(() => {
    if (phase !== 'active') return;
    setSheetClosing(true);
    setPhase('closing');
    setTimeout(() => {
      setSheetOpen(false);
      setSheetClosing(false);
    }, 360);
    setTimeout(() => {
      setPhase('idle');
    }, 820);
  }, [phase]);

  return (
    <div style={{ position: 'relative', width: 375, height: 812, overflow: 'hidden', background: '#f0f2f5' }}>
      <HomeScreen />

      {/* Backdrop — absolute so it stays inside the phone frame */}
      {sheetOpen && (
        <div
          onClick={closeMyra}
          style={{
            position: 'absolute', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.5)',
            opacity: sheetClosing ? 0 : 1,
            transition: 'opacity 0.32s ease',
            pointerEvents: sheetClosing ? 'none' : 'auto',
          }}
        />
      )}

      {/* Sheet */}
      {sheetOpen && (
        <MyraSheet isClosing={sheetClosing} onClose={closeMyra} />
      )}

      {/* Myra button */}
      <MyraButton phase={phase} onTap={openMyra} />
    </div>
  );
}
