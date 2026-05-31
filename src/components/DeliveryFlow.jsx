import { useState } from 'react'
import { X, ChevronDown, Minus, Plus } from 'lucide-react'

const companies = ['Any', '📦 Amazon', '🌿 Amazon Fresh', '🛒 BigBasket', '⚡ Blinkit', '🍕 Swiggy', '+74']

export default function DeliveryFlow({ onBack, onClose }) {
  const [tab, setTab] = useState('once')
  const [duration, setDuration] = useState('1week')
  const [entries, setEntries] = useState(1)
  const [selectedCompany, setSelectedCompany] = useState(0)

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <button onClick={onClose} className="absolute top-14 right-5 text-gray-400">
        <X size={24} />
      </button>

      <div className="px-4 pb-4">
        <div className="text-white mb-4 px-1">
          <h2 className="text-3xl font-bold">Allow Delivery</h2>
          <p className="text-gray-300 text-sm mt-1">Ensure hassle-free entries by creating approvals in advance for your visitors 🟡 🟠</p>
        </div>

        {/* Tabs */}
        <div className="relative mb-0">
          <div className="flex bg-gray-700 rounded-t-3xl overflow-hidden">
            <button onClick={() => setTab('once')} className={`flex-1 py-3 text-sm font-semibold rounded-t-3xl transition-colors ${tab === 'once' ? 'bg-white text-gray-800' : 'text-gray-300'}`}>Once</button>
            <button onClick={() => setTab('frequent')} className={`flex-1 py-3 text-sm font-semibold rounded-t-3xl transition-colors ${tab === 'frequent' ? 'bg-white text-gray-800' : 'text-gray-300'}`}>Frequent</button>
          </div>
        </div>

        <div className="bg-white rounded-b-3xl rounded-tr-3xl p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {tab === 'once' ? (
            <>
              <FormField label="DELIVERY DATE">
                <Dropdown value="Today" />
              </FormField>
              <FormField label="VALID FOR">
                <Dropdown value="Next 1 hr" />
              </FormField>
              <button className="text-teal-600 text-sm font-semibold flex items-center gap-1">MORE DETAILS ›</button>
              <div className="flex gap-3">
                <CheckOption label="Make it Private" />
                <CheckOption label="Give to securi..." />
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
              <FormField label="Days">
                <Dropdown value="Everyday" />
              </FormField>
              <div className="flex gap-3">
                <FormField label="START FROM" className="flex-1">
                  <Dropdown value="12:00 AM" />
                </FormField>
                <FormField label="VALID TILL" className="flex-1">
                  <Dropdown value="11:59 PM" />
                </FormField>
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
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {companies.map((c, i) => (
                    <button key={i} onClick={() => setSelectedCompany(i)}
                      className={`min-w-[52px] h-13 px-2 py-1 rounded-2xl border-2 flex items-center justify-center text-xs font-medium transition-colors ${selectedCompany === i ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white'}`}>
                      <span className="text-center leading-tight">{c}</span>
                      {selectedCompany === i && i === 0 && <span className="ml-0.5 text-teal-500">✓</span>}
                    </button>
                  ))}
                </div>
              </FormField>
            </>
          )}
        </div>

        <button className="w-full mt-3 bg-teal-600 text-white font-bold py-4 rounded-2xl text-base">
          Pre-Approve
        </button>
      </div>
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
