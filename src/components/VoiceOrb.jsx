import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mic } from 'lucide-react'
import { interpretCommand } from '../state/commandInterpreter'

const ASSISTANT_NAME = 'Aria'

const PROMPTS = [
  'Try: "Pre-approve a Swiggy delivery"',
  'Try: "My friend is coming over for a party"',
  'Try: "Allow an Amazon delivery for 2 hours"',
  'Try: "A cab is coming"',
  'Try: "Blinkit order arriving soon"',
]

export default function VoiceOrb({ dispatch }) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState('idle') // idle | listening | thinking
  const [transcript, setTranscript] = useState('')
  const [promptIdx, setPromptIdx] = useState(0)
  const [waveAmps, setWaveAmps] = useState([0.2, 0.4, 0.6, 0.4, 0.2, 0.5, 0.3])
  const recognitionRef = useRef(null)
  const waveRef = useRef(null)

  // Cycle placeholder prompts
  useEffect(() => {
    if (!open) return
    const t = setInterval(() => setPromptIdx((i) => (i + 1) % PROMPTS.length), 3000)
    return () => clearInterval(t)
  }, [open])

  // Animate wave bars
  useEffect(() => {
    if (phase !== 'listening') return
    waveRef.current = setInterval(() => {
      setWaveAmps(Array.from({ length: 7 }, () => 0.2 + Math.random() * 0.8))
    }, 120)
    return () => clearInterval(waveRef.current)
  }, [phase])

  const startListening = () => {
    setPhase('listening')
    setTranscript('')

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      // Fallback: simulate after 2s
      setTimeout(() => handleTranscript('Pre-approve a Swiggy delivery'), 2000)
      return
    }

    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-IN'
    recognitionRef.current = rec

    rec.onresult = (e) => {
      const t = Array.from(e.results).map((r) => r[0].transcript).join('')
      setTranscript(t)
    }
    rec.onend = () => {
      if (transcript) handleTranscript(transcript)
      else setPhase('idle')
    }
    rec.start()
  }

  const handleTranscript = (text) => {
    setPhase('thinking')
    setTranscript(text)

    setTimeout(() => {
      const result = interpretCommand(text)
      if (result) {
        // Speak the response
        if ('speechSynthesis' in window) {
          const utt = new SpeechSynthesisUtterance(result.speech)
          utt.lang = 'en-IN'
          utt.rate = 1.1
          speechSynthesis.speak(utt)
        }
        dispatch({ type: result.action, payload: result.payload })
      }
      setOpen(false)
      setPhase('idle')
      setTranscript('')
    }, 1200)
  }

  const handleClose = () => {
    recognitionRef.current?.abort()
    setOpen(false)
    setPhase('idle')
    setTranscript('')
  }

  // Simulate typing a command (demo mode)
  const [demoInput, setDemoInput] = useState('')

  return (
    <>
      {/* Floating Orb */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-24 z-30 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
            style={{ right: 'calc(50% - 176px)' }}
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 30%, #ec4899 60%, #f59e0b 100%)',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-full h-full rounded-full flex items-center justify-center"
            >
              <Mic size={22} className="text-white" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Full-screen listening overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center"
            style={{ backdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.55)' }}
          >
            {/* Close */}
            <button onClick={handleClose} className="absolute top-14 right-5 text-white/70">
              <X size={24} />
            </button>

            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-8 px-6"
            >
              <p className="text-white/60 text-sm mb-1">Hey, I am</p>
              <h2 className="text-white text-3xl font-bold">{ASSISTANT_NAME}</h2>
              <p className="text-white/50 text-sm mt-1">Your neighborhood assistant</p>
            </motion.div>

            {/* Orb (expanded) */}
            <motion.div
              initial={{ scale: 0.3 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              onClick={phase === 'idle' ? startListening : undefined}
              className="relative w-36 h-36 rounded-full cursor-pointer flex items-center justify-center mb-8"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 30%, #ec4899 60%, #f59e0b 100%)',
                boxShadow: '0 0 60px rgba(139,92,246,0.6), 0 0 120px rgba(236,72,153,0.3)',
              }}
            >
              {/* Pulse rings */}
              {phase === 'listening' && [1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-purple-400/40"
                  animate={{ scale: [1, 1.6 + i * 0.3], opacity: [0.6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.4 }}
                />
              ))}
              <Mic size={36} className="text-white" />
            </motion.div>

            {/* Wave bars */}
            <div className="flex items-end gap-1 h-12 mb-6">
              {waveAmps.map((amp, i) => (
                <motion.div
                  key={i}
                  animate={{ height: phase === 'listening' ? amp * 48 : 8 }}
                  transition={{ duration: 0.1 }}
                  className="w-2 rounded-full"
                  style={{ background: 'linear-gradient(to top, #6366f1, #ec4899)' }}
                />
              ))}
            </div>

            {/* Status text */}
            <motion.p
              key={phase + transcript}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-center px-8 text-base font-medium min-h-[48px]"
            >
              {phase === 'idle' && 'Tap the orb to speak'}
              {phase === 'listening' && (transcript || 'Listening...')}
              {phase === 'thinking' && `"${transcript}"`}
            </motion.p>

            {phase === 'thinking' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-purple-300 text-sm mt-1"
              >
                Working on it...
              </motion.p>
            )}

            {/* Demo text input (fallback for devices without mic) */}
            {phase === 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 w-full px-6"
              >
                <p className="text-white/40 text-xs text-center mb-3">{PROMPTS[promptIdx]}</p>
                <div className="flex gap-2">
                  <input
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && demoInput && handleTranscript(demoInput)}
                    placeholder="Or type a command..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none"
                  />
                  <button
                    onClick={() => demoInput && handleTranscript(demoInput)}
                    className="bg-purple-500 text-white px-4 py-3 rounded-2xl text-sm font-semibold"
                  >
                    Go
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
