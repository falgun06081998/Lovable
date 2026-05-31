import { useState } from 'react'
import { X, ChevronDown, Plus, Pencil } from 'lucide-react'

const occasions = [
  { emoji: '🛋️', label: 'Home' },
  { emoji: '🎂', label: 'Birthday' },
  { emoji: '🍵', label: 'Tea' },
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '🎉', label: 'Party' },
  { emoji: '🎁', label: 'Gift' },
]

export default function GuestFlow({ onBack, onClose }) {
  const [tab, setTab] = useState('oneday')
  const [occasion, setOccasion] = useState(0)
  const [isPrivate, setIsPrivate] = useState(false)

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end"
      style={{ background: 'linear-gradient(to bottom, rgba(180,200,160,0.6) 0%, rgba(100,130,90,0.8) 100%)' }}>
      <button onClick={onClose} className="absolute top-14 right-5 text-gray-600">
        <X size={24} />
      </button>

      <div className="px-4 pb-4">
        <div className="mb-4 px-1 relative">
          <p className="text-gray-600 text-base">Hello!</p>
          <h2 className="text-4xl font-bold text-gray-800">Falgun has invited you!</h2>
          <div className="absolute top-10 right-0 bg-white rounded-2xl px-4 py-2 shadow flex items-center gap-2">
            <Pencil size={14} className="text-teal-600" />
            <span className="text-teal-600 font-semibold text-sm">Edit</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-300 bg-opacity-50 rounded-t-3xl overflow-hidden">
          <button onClick={() => setTab('oneday')} className={`flex-1 py-3 text-sm font-semibold rounded-t-3xl transition-colors ${tab === 'oneday' ? 'bg-white text-gray-800' : 'text-gray-600'}`}>One Day</button>
          <button onClick={() => setTab('long')} className={`flex-1 py-3 text-sm font-semibold rounded-t-3xl transition-colors ${tab === 'long' ? 'bg-white text-gray-800' : 'text-gray-600'}`}>Long Duration</button>
        </div>

        <div className="bg-white rounded-b-3xl rounded-tr-3xl p-5 space-y-4">
          {/* Occasion Scroller */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            {occasions.map(({ emoji, label }, i) => (
              <button key={i} onClick={() => setOccasion(i)}
                className={`min-w-[64px] h-16 rounded-2xl flex items-center justify-center border-2 flex-col gap-0.5 text-xl transition-colors ${occasion === i ? 'border-teal-500' : 'border-transparent bg-blue-50'}`}>
                <span>{emoji}</span>
                {occasion === i && <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>}
              </button>
            ))}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">DATE</label>
            <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
              <span className="text-gray-800 text-sm">Today</span>
              <ChevronDown size={16} className="text-gray-500" />
            </div>
          </div>

          {/* Guest */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">GUEST</label>
            <button className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-4 flex items-center justify-center gap-2 text-teal-600 font-semibold">
              <Plus size={18} />
              <span>Add guests</span>
            </button>
          </div>

          {/* Private */}
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

        <button className="w-full mt-3 bg-gray-200 text-gray-500 font-bold py-4 rounded-2xl text-base">
          Create Invite
        </button>
      </div>
    </div>
  )
}
