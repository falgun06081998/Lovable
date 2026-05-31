import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import PreApproveModal from './components/PreApproveModal'

export default function App() {
  const [modal, setModal] = useState(null)

  return (
    <div className="w-full max-w-sm mx-auto bg-white min-h-screen relative overflow-hidden shadow-2xl">
      <HomeScreen onPreApprove={() => setModal('preapprove')} />
      {modal && (
        <PreApproveModal
          step={modal}
          onStep={setModal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
