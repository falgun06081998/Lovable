import { X } from 'lucide-react'

const options = [
  { id: 'delivery', label: 'Delivery', emoji: '🛵' },
  { id: 'guest', label: 'Guest', emoji: '👥' },
  { id: 'group', label: 'Group invite', emoji: '👨‍👩‍👧', isNew: true },
  { id: 'cab', label: 'Cab', emoji: '🚕' },
  { id: 'other', label: 'Other', emoji: '🎫' },
]

export default function PreApproveModal({ onStep, onClose }) {
  return (
    <div className="px-4 pb-4 pt-2">
      <div className="text-white mb-5 px-1">
        <h2 className="text-3xl font-bold">Pre-Approve</h2>
        <p className="text-gray-300 text-sm mt-1">
          Ensure hassle-free entries by creating approvals in advance for your visitors
        </p>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden">
        {options.map(({ id, label, emoji, isNew }, i) => (
          <button
            key={id}
            onClick={() => onStep(id)}
            className={`w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors ${i < options.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{emoji}</span>
              <span className="text-gray-800 font-medium">{label}</span>
              {isNew && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">NEW</span>}
            </div>
            <span className="text-gray-400 text-lg">›</span>
          </button>
        ))}

        <div className="flex items-center gap-3 px-5 py-4 bg-gray-50">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">🎤</div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Voice Command</p>
            <p className="text-xs text-gray-400">Tap the orb below to try!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
