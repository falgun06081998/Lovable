import { useState } from 'react'
import { ChevronDown, Minus, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

const companies = [
  { label: 'Any', emoji: '✓' },
  { label: 'Amazon', emoji: '📦' },
  { label: 'Fresh', emoji: '🌿' },
  { label: 'BigBasket', emoji: '🛒' },
  { label: 'Blinkit', emoji: '⚡' },
  { label: 'Swiggy', emoji: '🍕' },
]

const VALID_FOR_OPTIONS = ['Next 30 mins', 'Next 1 hr', 'Next 2 hrs', 'Next 4 hrs', 'All day']

export default function DeliveryFlow({ state, dispatch, onBack, onClose, onSuccess }) {
  const tab = state?.deliveryTab || 'once'
  const selectedCompany = state?.selectedCompany ?? 0
  const validFor = state?.validFor || 'Next 1 hr'

  const setTab = (t) => dispatch({ type: 'SET_DELIVERY_TAB', payload: t })
  const setCompany = (i) => dispatch({ type: 'SET_COMPANY', payload: i })
  const setValidFor = (v) => dispatch({ type: 'SET_VALID_FOR', payload: v })

  const [duration, setDuration] = useState('1week')
  const [entries, setEntries] = useState(1)
  const [showValidPicker, setShowValidPicker] = useState(false)

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="text-white mb-4 px-1">
        <h2 className="text-3xl font-bold">Allow Delivery</h2>
        <p className="text-gray-300 text-sm mt-1">
          Ensure hassle-free entries by creating approvals in advance 🟡 🟠
        </p>
      </div>

      <div className="flex bg-gray-700 rounded-t-3xl overflow-hidden">
        <button onClick={() => setTab('once')} className={`flex-1 py-3 text-sm font-semibold rounded-t-3xl transition-colors ${tab === 'once' ? 'bg-white text-gray-800' : 'text-gray-300'}`}>Once</button>
        <button onClick={() => setTab('frequent')} className={`flex-1 py-3 text-sm font-semibold rounded-t-3xl transition-colors ${tab === 'frequent' ? 'bg-white text-gray-800' : 'text-gray-300'}`}>Frequent</button>
      </div>

      <div className="bg-white rounded-b-3xl rounded-tr-3xl p-5 space-y-4 max-h-[58vh] overflow-y-auto">
        {tab === 'once' ? (
          <>
            <FormField label="DELIVERY DATE"><Dropdown value="Today" /></FormField>
            <FormField label="VALID FOR">
              <div className="relative">
                <button onClick={() => setShowValidPicker(!showValidPicker)}
                  className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
                  <span className="text-gray-800 text-sm">{validFor}</span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>
                {showValidPicker && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl z-10 mt-1 overflow-hidden">
                    {VALID_FOR_OPTIONS.map((v) => (
                      <button key={v} onClick={() => { setValidFor(v); setShowValidPicker(false) }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 ${validFor === v ? 'text-teal-600 font-semibold' : 'text-gray-700'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </FormField>
            <FormField label="SELECT COMPANY">
              <CompanyScroller companies={companies} selected={selectedCompany} onSelect={setCompany} />
            </FormField>
            <button className="text-teal-600 text-sm font-semibold">MORE DETAILS ›</button>
            <div className="flex gap-3">
              <CheckOption label="Make it Private" />
              <CheckOption label="Give to Security" />
            </div>
          </>
        ) : (
          <>
            <div className="flex bg-gray-100 rounded-2xl p-1">
              {['1week', '30days', 'custom'].map((d) => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${duration === d ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
                  {d === '1week' ? '1 WEEK' : d === '30days' ? '30 DAYS' : 'CUSTOM'}
                </button>
              ))}
            </div>
            <FormField label="Days"><Dropdown value="Everyday" /></FormField>
            <div className="flex gap-3">
              <FormField label="START FROM" className="flex-1"><Dropdown value="12:00 AM" /></FormField>
              <FormField label="VALID TILL" className="flex-1"><Dropdown value="11:59 PM" /></FormField>
            </div>
            <FormField label="NUMBER OF ENTRIES">
              <div className="flex items-center gap-4">
                <button onClick={() => setEntries(Math.max(1, entries - 1))}
                  className="w-9 h-9 rounded-xl border-2 border-teal-500 flex items-center justify-center text-teal-600">
                  <Minus size={16} />
                </button>
                <span className="text-gray-800 font-semibold text-lg w-4 text-center">{entries}</span>
                <button onClick={() => setEntries(entries + 1)}
                  className="w-9 h-9 rounded-xl border-2 border-teal-500 flex items-center justify-center text-teal-600">
                  <Plus size={16} />
                </button>
              </div>
            </FormField>
            <FormField label="SELECT COMPANY">
              <CompanyScroller companies={companies} selected={selectedCompany} onSelect={setCompany} />
            </FormField>
          </>
        )}
      </div>

      <button onClick={onSuccess} className="w-full mt-3 bg-teal-600 text-white font-bold py-4 rounded-2xl text-base">
        Pre-Approve
      </button>
    </div>
  )
}

function CompanyScroller({ companies, selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {companies.map((c, i) => (
        <motion.button key={i} onClick={() => onSelect(i)} animate={{ scale: selected === i ? 1.08 : 1 }}
          className={`min-w-[52px] h-14 px-2 py-1 rounded-2xl border-2 flex flex-col items-center justify-center text-xs font-medium transition-colors ${selected === i ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white'}`}>
          <span className="text-lg">{c.emoji}</span>
          <span className="text-[9px] text-gray-500 mt-0.5">{c.label}</span>
        </motion.button>
      ))}
    </div>
  )
}

function FormField({ label, children, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
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

function CheckOption({ label }) {
  const [checked, setChecked] = useState(false)
  return (
    <button onClick={() => setChecked(!checked)}
      className={`flex items-center gap-2 flex-1 px-3 py-3 rounded-2xl border-2 transition-colors ${checked ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${checked ? 'border-teal-500 bg-teal-500' : 'border-gray-400'}`}>
        {checked && <span className="text-white text-xs">✓</span>}
      </div>
      <span className="text-xs text-gray-600 font-medium">{label}</span>
    </button>
  )
}
