import { useReducer } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { reducer, initialState } from './state/appReducer'
import HomeScreen from './components/HomeScreen'
import PreApproveModal from './components/PreApproveModal'
import DeliveryFlow from './components/DeliveryFlow'
import GuestFlow from './components/GuestFlow'
import CabFlow from './components/CabFlow'
import VoiceOrb from './components/VoiceOrb'
import SuccessScreen from './components/SuccessScreen'

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const handleSuccess = (type, summary) => {
    dispatch({ type: 'SHOW_SUCCESS', payload: { type, summary } })
  }

  return (
    <div className="w-full max-w-sm mx-auto bg-white min-h-screen relative overflow-hidden shadow-2xl">
      <HomeScreen onPreApprove={() => dispatch({ type: 'OPEN_MODAL', payload: 'preapprove' })} />

      {/* Backdrop */}
      <AnimatePresence>
        {state.modal && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence mode="wait">
        {state.modal === 'preapprove' && (
          <SlideUp key="preapprove">
            <PreApproveModal
              onStep={(s) => dispatch({ type: 'OPEN_MODAL', payload: s })}
              onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
            />
          </SlideUp>
        )}
        {state.modal === 'delivery' && (
          <SlideUp key="delivery">
            <DeliveryFlow
              state={state}
              dispatch={dispatch}
              onBack={() => dispatch({ type: 'OPEN_MODAL', payload: 'preapprove' })}
              onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
              onSuccess={() => handleSuccess('delivery', 'Your delivery has been pre-approved for today.')}
            />
          </SlideUp>
        )}
        {state.modal === 'guest' && (
          <SlideUp key="guest">
            <GuestFlow
              state={state}
              dispatch={dispatch}
              onBack={() => dispatch({ type: 'OPEN_MODAL', payload: 'preapprove' })}
              onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
              onSuccess={() => handleSuccess('guest', 'Invite created! Your guests are pre-approved.')}
            />
          </SlideUp>
        )}
        {state.modal === 'cab' && (
          <SlideUp key="cab">
            <CabFlow
              onBack={() => dispatch({ type: 'OPEN_MODAL', payload: 'preapprove' })}
              onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
              onSuccess={() => handleSuccess('cab', 'Cab entry pre-approved for today.')}
            />
          </SlideUp>
        )}
      </AnimatePresence>

      {/* Success screen */}
      <AnimatePresence>
        {state.success && (
          <SuccessScreen key="success" success={state.success} dispatch={dispatch} />
        )}
      </AnimatePresence>

      <VoiceOrb dispatch={dispatch} />
    </div>
  )
}

function SlideUp({ children }) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 350, damping: 35 }}
      className="absolute inset-0 z-20 flex flex-col justify-end pointer-events-none"
    >
      <div className="pointer-events-auto">
        {children}
      </div>
    </motion.div>
  )
}
