import { useState } from 'react'
import { ChevronDown, Plus, Pencil } from 'lucide-react'
import { motion } from 'framer-motion'

const occasions = [
  { emoji: '🛋️', label: 'Home' },
  { emoji: '🎂', label: 'Birthday' },
  { emoji: '🍵', label: 'Tea' },
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '🎉', label: 'Party' },
  { emoji: '🎁', label: 'Gift' },
]

export default function GuestFlow({ state, dispatch, onBack, onClose, onSuccess }) {
  const [tab, setTab] = useState('oneday')
  const selectedOccasion = state?.selectedOccasion ?? 0
  const setOccasion = (i) => dispatch({ type: 'SET_OCCASION', payload: i })
  const [isPrivate, setIsPrivate] = useState(false)

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="mb-4 px-1 relative">
        <p className="text-gray-300 text-base">Hello!</p>
        <h2 className="text-4xl font-bold text-white">Falgun has invited you!</h2>
        <div className="absolute top-10 right-0 bg-white rounded-2xl px-4 py-2 shadow flex items-center gap-2">
          <Pencil size={14} className="text-teal-600" />
          <span className="text-teal-600 font-semibold text-sm">Edit</span>
        </div>
      </div>

      <div className="flex bg-gray-700 rounded-t-3xl overflow-hidden">
        <button onClick={() => setTab('oneday')} className={`flex-1 py-3 text-sm font-semibold rounded-t-3xl transition-colors ${tab === 'oneday' ? 'bg-white text-gray-800' : 'text-gray-300'}`}>One Day</button>
        <button onClick={() => setTab('long')} className={`flex-1 py-3 text-sm font-semibold rounded-t-3xl transition-colors ${tab === 'long' ? 'bg-white text-gray-800' : 'text-gray-300'}`}>Long Duration</button>
      </div>

      <div className="bg-white rounded-b-3xl rounded-tr-3xl p-5 space-y-4">
        {/* Occasion Scroller */}
        <div className="flex gap-3 overflow-x-auto pb-1">
          {occasions.map(({ emoji, label }, i) => (
            <motion.button key={i} onClick={() => setOccasion(i)}
              animate={{ scale: selectedOccasion === i ? 1.08 : 1 }}
              className={`min-w-[64px] h-16 rounded-2xl flex flex-col items-center justify-center border-2 gap-0.5 text-xl transition-colors ${selectedOccasion === i ? 'border-teal-500 bg-teal-50' : 'border-transparent bg-blue-50'}`}>
              <span>{emoji}</span>
              <span className="text-[9px] text-gray-500">{label}</span>
              {selectedOccasion === i && (
                <div className="absolute mt-12 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
              )}
            </motion.button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">DATE</label>
          <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
            <span className="text-gray-800 text-sm">Today</span>
            <ChevronDown size={16} className="text-gray-500" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">GUEST</label>
          <button className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-4 flex items-center justify-center gap-2 text-teal-600 font-semibold">
            <Plus size={18} />
            <span>Add guests</span>
          </button>
        </div>

        <button onClick={() => setIsPrivate(!isPrivate)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-colors ${isPrivate ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isPrivate ? 'border-teal-500 bg-teal-500' : 'border-gray-400'}`}>
            {isPrivate && <span className="text-white text-xs">✓</span>}
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">MAKE IT PRIVATE</p>
            <p className="text-xs text-gray-400">Don't notify others about this visit</p>
          </div>
        </button>
      </div>

      <button onClick={onSuccess} className="w-full mt-3 bg-teal-600 text-white font-bold py-4 rounded-2xl text-base">
        Create Invite
      </button>
    </div>
  )
}
