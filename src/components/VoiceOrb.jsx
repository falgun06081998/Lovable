import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mic } from 'lucide-react'
import { buildConversation, resolveClarification } from '../state/commandInterpreter'
import { geminiSpeak } from '../services/gemini'

const ASSISTANT_NAME = 'Aria'

const HINTS = [
  '"Pre-approve a Swiggy delivery"',
  '"My friends are coming over for a party"',
  '"Allow Amazon for 2 hours"',
  '"A cab is coming"',
  '"My maid comes every morning"',
]

const speak = (text) => geminiSpeak(text)

export default function VoiceOrb({ dispatch }) {
  const [open, setOpen] = useState(false)
  // convoPhase: 'intro' | 'listening' | 'thinking' | 'executing' | 'clarify'
  const [convoPhase, setConvoPhase] = useState('intro')
  const [transcript, setTranscript] = useState('')
  const [assistantText, setAssistantText] = useState('')
  const [hintIdx, setHintIdx] = useState(0)
  const [waveAmps, setWaveAmps] = useState(Array(7).fill(0.3))
  const [demoInput, setDemoInput] = useState('')
  const [clarifyContext, setClarifyContext] = useState(null)
  const [highlightField, setHighlightField] = useState(null)
  const recognitionRef = useRef(null)
  const waveTimer = useRef(null)
  const stepQueue = useRef([])

  // Rotate hints
  useEffect(() => {
    if (!open) return
    const t = setInterval(() => setHintIdx((i) => (i + 1) % HINTS.length), 3500)
    return () => clearInterval(t)
  }, [open])

  // Wave animation while listening
  useEffect(() => {
    if (convoPhase === 'listening') {
      waveTimer.current = setInterval(() => {
        setWaveAmps(Array.from({ length: 7 }, () => 0.15 + Math.random() * 0.85))
      }, 110)
    } else {
      clearInterval(waveTimer.current)
      setWaveAmps(Array(7).fill(0.15))
    }
    return () => clearInterval(waveTimer.current)
  }, [convoPhase])

  const openOrb = () => {
    setOpen(true)
    setConvoPhase('intro')
    setTranscript('')
    setAssistantText("I'm here. Who are we approving today?")
    speak("I'm here. Who are we approving today?")
  }

  const closeOrb = () => {
    recognitionRef.current?.abort()
    speechSynthesis.cancel()
    setOpen(false)
    setConvoPhase('intro')
    setTranscript('')
    setAssistantText('')
    setClarifyContext(null)
    setHighlightField(null)
    stepQueue.current = []
  }

  const startListening = () => {
    setConvoPhase('listening')
    setTranscript('')

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return // fallback via text input

    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-IN'
    recognitionRef.current = rec
    let final = ''

    rec.onresult = (e) => {
      final = Array.from(e.results).map((r) => r[0].transcript).join('')
      setTranscript(final)
    }
    rec.onend = () => {
      if (final) processInput(final)
      else setConvoPhase('intro')
    }
    rec.onerror = () => setConvoPhase('intro')
    rec.start()
  }

  const processInput = async (text) => {
    setConvoPhase('thinking')
    setTranscript(text)

    const steps = await (clarifyContext
      ? resolveClarification(text, clarifyContext)
      : buildConversation(text))

    if (!steps || steps.length === 0) {
      const msg = "Sorry, I didn't catch that. Try saying something like \"Pre-approve a Swiggy delivery\"."
      setAssistantText(msg)
      speak("Sorry, I didn't catch that. Could you try again?")
      setConvoPhase('intro')
      return
    }

    stepQueue.current = [...steps]
    setClarifyContext(null)
    runNextStep()
  }

  const runNextStep = () => {
    const step = stepQueue.current.shift()
    if (!step) {
      // All steps done — close after short delay
      setTimeout(closeOrb, 1200)
      return
    }

    setAssistantText(step.speech)
    speak(step.speech)

    if (step.action) {
      setConvoPhase('executing')
      // Dispatch immediately but show "executing" for 800ms so user sees animation
      setTimeout(() => {
        dispatch({ type: step.action, payload: step.payload })
        if (step.highlight) setHighlightField(step.highlight)
        if (step.clarify) {
          setConvoPhase('clarify')
          if (step.waitFor) setClarifyContext(step.waitFor)
        } else if (stepQueue.current.length > 0) {
          setTimeout(runNextStep, 1800)
        } else {
          setTimeout(closeOrb, 2000)
        }
      }, 800)
    } else if (step.clarify) {
      setConvoPhase('clarify')
      if (step.waitFor) setClarifyContext(step.waitFor)
    } else {
      // Info step — pause then continue
      setTimeout(runNextStep, 2500)
    }
  }

  const handleSubmit = (text) => {
    if (!text.trim()) return
    setDemoInput('')
    processInput(text)
  }

  const isListening = convoPhase === 'listening'
  const isThinking = convoPhase === 'thinking'
  const isExecuting = convoPhase === 'executing'

  return (
    <>
      {/* Floating Orb */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.88 }}
            onClick={openOrb}
            className="absolute bottom-24 right-4 z-30 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 35%, #ec4899 65%, #f59e0b 100%)',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              className="w-full h-full rounded-full flex items-center justify-center"
            >
              <Mic size={22} className="text-white" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center px-6"
            style={{ backdropFilter: 'blur(20px)', background: 'rgba(10,8,25,0.72)' }}
          >
            <button onClick={closeOrb} className="absolute top-4 right-4 text-white/60 hover:text-white">
              <X size={24} />
            </button>

            {/* Name */}
            <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="text-center mb-8">
              <p className="text-white/50 text-xs tracking-widest uppercase mb-1">Your assistant</p>
              <h2 className="text-white text-3xl font-bold tracking-tight">{ASSISTANT_NAME}</h2>
            </motion.div>

            {/* Central orb */}
            <motion.div
              initial={{ scale: 0.2 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              onClick={convoPhase === 'intro' || convoPhase === 'clarify' ? startListening : undefined}
              className="relative w-36 h-36 rounded-full flex items-center justify-center mb-8 cursor-pointer select-none"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899, #f59e0b)',
                boxShadow: isListening
                  ? '0 0 0 0 rgba(139,92,246,0), 0 0 80px rgba(236,72,153,0.5)'
                  : '0 0 60px rgba(139,92,246,0.5)',
              }}
            >
              {/* Pulse rings when listening */}
              {isListening && [0, 1, 2].map((i) => (
                <motion.div key={i}
                  className="absolute inset-0 rounded-full border border-purple-400/30"
                  animate={{ scale: [1, 2 + i * 0.4], opacity: [0.7, 0] }}
                  transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.45, ease: 'easeOut' }}
                />
              ))}

              {/* Spinner when thinking/executing */}
              {(isThinking || isExecuting) && (
                <motion.div
                  className="absolute inset-2 rounded-full border-4 border-white/20 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                />
              )}

              <motion.div
                animate={isExecuting ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <Mic size={36} className="text-white drop-shadow" />
              </motion.div>
            </motion.div>

            {/* Wave bars */}
            <div className="flex items-end gap-1 h-10 mb-5">
              {waveAmps.map((amp, i) => (
                <motion.div key={i}
                  animate={{ height: isListening ? amp * 40 : 5 }}
                  transition={{ duration: 0.1 }}
                  className="w-2 rounded-full"
                  style={{ background: 'linear-gradient(to top, #6366f1, #ec4899)' }}
                />
              ))}
            </div>

            {/* Assistant speech bubble */}
            <AnimatePresence mode="wait">
              <motion.div key={assistantText}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center min-h-[52px] mb-2 px-4">
                {assistantText ? (
                  <p className="text-white text-base font-medium leading-snug">{assistantText}</p>
                ) : (
                  <p className="text-white/40 text-sm">Tap the orb to speak</p>
                )}
              </motion.div>
            </AnimatePresence>

            {/* User transcript */}
            {transcript && convoPhase !== 'intro' && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-purple-300 text-sm text-center mb-3 italic">
                "{transcript}"
              </motion.p>
            )}

            {/* Status label */}
            <p className="text-white/30 text-xs mb-6 tracking-wide">
              {convoPhase === 'intro' && 'Tap the orb or type below'}
              {convoPhase === 'listening' && '● Listening...'}
              {convoPhase === 'thinking' && '⚙ Thinking...'}
              {convoPhase === 'executing' && '✦ Setting up your approval...'}
              {convoPhase === 'clarify' && 'Tap orb or type your reply'}
            </p>

            {/* Text input fallback */}
            {(convoPhase === 'intro' || convoPhase === 'clarify') && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }} className="w-full max-w-sm">
                <p className="text-white/30 text-xs text-center mb-2">{HINTS[hintIdx]}</p>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit(demoInput)}
                    placeholder="Type a command..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-purple-400/60"
                  />
                  <button onClick={() => handleSubmit(demoInput)}
                    className="bg-purple-500 hover:bg-purple-400 text-white px-5 py-3 rounded-2xl text-sm font-semibold transition-colors">
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
