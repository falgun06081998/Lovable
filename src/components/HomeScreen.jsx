import {
  Home, Receipt, Building2, Wrench, UserPlus, Users, ArrowUpRight,
  Headphones, Sparkles, Store, CreditCard, Bell, Search, ChevronDown,
  Flame
} from 'lucide-react'
import BottomNav from './BottomNav'

const quickActions = [
  { label: 'Helpdesk', icon: <Headphones size={22} className="text-gray-500" /> },
  { label: 'Cleaning', icon: <Sparkles size={22} className="text-white" />, bg: 'bg-purple-600' },
  { label: 'Marketplace', icon: <Store size={22} className="text-gray-500" /> },
  { label: 'Visit Pass', icon: <CreditCard size={22} className="text-gray-500" /> },
]

export default function HomeScreen({ onPreApprove }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 pt-10 pb-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gray-300" />
          <div className="flex items-center gap-1 text-sm font-semibold text-gray-800">
            D-Block-321
            <ChevronDown size={14} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600 flex items-center gap-1">
            <span>Starts Outside</span>
            <ChevronDown size={12} />
          </div>
          <Search size={20} className="text-gray-600" />
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">N</div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          </div>
        </div>
      </div>

      {/* Top Nav Grid */}
      <div className="bg-white mx-3 mt-3 rounded-3xl shadow-sm p-4">
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Visitors', icon: <Home size={22} />, active: true },
            { label: 'My Bills', icon: <Receipt size={22} /> },
            { label: 'Society', icon: <Building2 size={22} /> },
            { label: 'Services', icon: <Wrench size={22} /> },
          ].map(({ label, icon, active }) => (
            <button key={label} className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl ${active ? 'bg-orange-50' : ''}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${active ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-500'}`}>
                {icon}
              </div>
              <span className={`text-[11px] font-medium ${active ? 'text-orange-600' : 'text-gray-600'}`}>{label}</span>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 pt-2 border-t border-gray-100">
          <button onClick={onPreApprove} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center">
              <UserPlus size={18} className="text-teal-600" />
            </div>
            <span className="text-[10px] text-gray-600">Pre-Appr...</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center">
              <Users size={18} className="text-teal-600" />
            </div>
            <span className="text-[10px] text-gray-600">Daily Help</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
              <ArrowUpRight size={18} className="text-gray-600" />
            </div>
            <span className="text-[10px] text-gray-600">View All</span>
          </button>
        </div>
      </div>

      {/* Alert bar */}
      <div className="mx-3 mt-3 bg-red-50 rounded-2xl px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
            <Flame size={14} className="text-red-500" />
          </div>
          <span className="text-sm font-medium text-gray-700">Fire</span>
          <span className="text-xs text-gray-500">| D-Block-321</span>
          <span className="bg-gray-800 text-white text-xs px-2 py-0.5 rounded-full">OTP - 240997</span>
        </div>
        <button className="text-teal-600 text-sm font-semibold">View &gt;</button>
      </div>

      {/* Your Actions */}
      <div className="mx-3 mt-3 bg-white rounded-3xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">Your actions</span>
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">NEW</span>
          </div>
          <span className="text-sm text-gray-400">See all</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {quickActions.map(({ label, icon, bg }) => (
            <button key={label} className="flex flex-col items-center gap-1.5 min-w-[60px]">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg || 'bg-gray-100'}`}>
                {icon}
              </div>
              <span className="text-[10px] text-gray-600">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Promo Banner */}
      <div className="mx-3 mt-3 rounded-3xl overflow-hidden bg-yellow-900 min-h-[120px] flex items-center px-5"
        style={{ background: 'linear-gradient(135deg, #7c3f1e 0%, #b85c2c 100%)' }}>
        <div className="flex-1">
          <p className="text-yellow-300 font-extrabold text-lg leading-tight">SNACK & WIN</p>
          <p className="text-white text-xs mt-1">Submit your entry & get an EXTRA 10% OFF on McCain Snacks</p>
          <button className="mt-2 bg-white text-orange-600 font-bold text-xs px-4 py-1.5 rounded-full">Order Now</button>
        </div>
      </div>

      {/* Home Services */}
      <div className="mx-3 mt-3 bg-white rounded-3xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-800">Home Services</span>
          <span className="text-sm text-gray-400">See All</span>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
