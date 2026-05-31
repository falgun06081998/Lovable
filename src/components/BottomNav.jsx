import { Home, Users, BarChart2, Wrench, Building } from 'lucide-react'

const tabs = [
  { label: 'My Hood', icon: <Home size={20} />, active: true },
  { label: 'Society', icon: <Users size={20} /> },
  { label: 'Polls', icon: <BarChart2 size={20} /> },
  { label: 'Services', icon: <Wrench size={20} /> },
  { label: 'Homes', icon: <Building size={20} /> },
]

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 flex justify-around py-2 z-10">
      {tabs.map(({ label, icon, active }) => (
        <button key={label} className={`flex flex-col items-center gap-0.5 px-3 py-1 ${active ? 'text-red-500' : 'text-gray-500'}`}>
          {icon}
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </div>
  )
}
