import { motion } from 'framer-motion'
import { CheckCircle, Share2, X } from 'lucide-react'

const ADS = {
  delivery: {
    title: 'Snack & Win',
    subtitle: 'Get 10% off on McCain Snacks with your next order!',
    emoji: '🍟',
    cta: 'Order Now',
    bg: 'from-orange-500 to-red-500',
    assistantLine: 'All set! While you wait, check out this deal on snacks 🍟',
  },
  guest: {
    title: 'Party Essentials',
    subtitle: 'Order party snacks & drinks — delivered in 10 mins via Blinkit',
    emoji: '🎉',
    cta: 'Shop Now',
    bg: 'from-purple-500 to-pink-500',
    assistantLine: 'All set! Make your party even better with these deals 🎉',
  },
  cab: {
    title: 'Ola Outstation',
    subtitle: 'Planning a trip? Book an outstation cab at 20% off today',
    emoji: '🚗',
    cta: 'Book Now',
    bg: 'from-yellow-400 to-orange-500',
    assistantLine: 'Cab pre-approved! Want to plan an outstation trip too? 🚗',
  },
  default: {
    title: 'NoBroker Services',
    subtitle: 'Home cleaning, pest control & more — starting ₹199',
    emoji: '🏠',
    cta: 'Explore',
    bg: 'from-teal-500 to-green-500',
    assistantLine: 'Done! Check out home services while you\'re here 🏠',
  },
}

export default function SuccessScreen({ success, dispatch }) {
  const ad = ADS[success.type] || ADS.default

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 z-50 bg-white flex flex-col"
    >
      {/* Top section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-6">
        <button
          onClick={() => dispatch({ type: 'CLOSE_SUCCESS' })}
          className="absolute top-14 right-5 text-gray-400"
        >
          <X size={24} />
        </button>

        {/* Checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
          className="w-24 h-24 rounded-full bg-teal-50 flex items-center justify-center mb-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
          >
            <CheckCircle size={56} className="text-teal-500" />
          </motion.div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-gray-800 text-center"
        >
          Pre-Approved!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-500 text-center mt-2 text-sm"
        >
          {success.summary}
        </motion.p>

        {/* Share button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 flex items-center gap-2 border-2 border-teal-500 text-teal-600 font-semibold px-6 py-3 rounded-2xl"
        >
          <Share2 size={18} />
          Share Invite
        </motion.button>
      </div>

      {/* Assistant bubble */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
        className="mx-4 mb-3 flex items-start gap-3"
      >
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
          style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
          ✨
        </div>
        <div className="bg-purple-50 rounded-2xl rounded-tl-sm px-4 py-2.5 flex-1">
          <p className="text-sm text-gray-700">{ad.assistantLine}</p>
        </div>
      </motion.div>

      {/* Native Ad */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mx-4 mb-6 rounded-3xl overflow-hidden shadow-lg relative"
      >
        <div className={`bg-gradient-to-r ${ad.bg} p-5 flex items-center gap-4`}>
          <span className="text-4xl">{ad.emoji}</span>
          <div className="flex-1">
            <p className="text-white font-bold text-lg leading-tight">{ad.title}</p>
            <p className="text-white/80 text-xs mt-0.5">{ad.subtitle}</p>
            <button className="mt-2.5 bg-white/20 border border-white/40 text-white text-xs font-bold px-4 py-1.5 rounded-full">
              {ad.cta}
            </button>
          </div>
        </div>
        <div className="absolute top-2 right-3 bg-black/20 text-white/70 text-[9px] px-1.5 py-0.5 rounded font-medium">
          SPONSORED
        </div>
      </motion.div>

      {/* Done button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        onClick={() => dispatch({ type: 'CLOSE_SUCCESS' })}
        className="mx-4 mb-8 bg-teal-600 text-white font-bold py-4 rounded-2xl text-base"
      >
        Done
      </motion.button>
    </motion.div>
  )
}
