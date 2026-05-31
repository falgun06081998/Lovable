import { ChevronDown } from 'lucide-react'

export default function CabFlow({ onBack, onClose, onSuccess }) {
  return (
    <div className="px-4 pb-4 pt-2">
      <div className="text-white mb-4 px-1">
        <h2 className="text-3xl font-bold">Allow Cab</h2>
        <p className="text-gray-300 text-sm mt-1">Pre-approve a cab entry for your visitor</p>
      </div>

      <div className="bg-white rounded-3xl p-5 space-y-4">
        <Field label="DATE"><Dropdown value="Today" /></Field>
        <Field label="VALID FOR"><Dropdown value="Next 1 hr" /></Field>
        <Field label="CAB SERVICE"><Dropdown value="Any" /></Field>
        <div className="flex gap-3">
          <CheckBox label="Make it Private" />
          <CheckBox label="SMS Alert" />
        </div>
      </div>

      <button onClick={onSuccess} className="w-full mt-3 bg-teal-600 text-white font-bold py-4 rounded-2xl text-base">
        Pre-Approve
      </button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">{label}</label>
      {children}
    </div>
  )
}

function Dropdown({ value }) {
  return (
    <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
      <span className="text-gray-800 text-sm">{value}</span>
      <ChevronDown size={16} className="text-gray-500" />
    </div>
  )
}

function CheckBox({ label }) {
  return (
    <div className="flex items-center gap-2 flex-1 px-3 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50">
      <div className="w-5 h-5 rounded border-2 border-gray-400" />
      <span className="text-xs text-gray-600 font-medium">{label}</span>
    </div>
  )
}
