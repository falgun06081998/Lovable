// Centralized app state machine
export const initialState = {
  modal: null,          // null | 'preapprove' | 'delivery' | 'guest' | 'cab' | 'other'
  deliveryTab: 'once',  // 'once' | 'frequent'
  guestTab: 'oneday',
  selectedCompany: 0,   // index in companies array
  selectedOccasion: 0,  // index in occasions array
  validFor: 'Next 1 hr',
  assistant: 'idle',    // 'idle' | 'listening' | 'thinking' | 'done'
  assistantMessage: '',
  success: null,        // null | { type, summary, ad }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'OPEN_MODAL':
      return { ...state, modal: action.payload }
    case 'CLOSE_MODAL':
      return { ...state, modal: null }
    case 'SET_DELIVERY_TAB':
      return { ...state, deliveryTab: action.payload }
    case 'SET_GUEST_TAB':
      return { ...state, guestTab: action.payload }
    case 'SET_COMPANY':
      return { ...state, selectedCompany: action.payload }
    case 'SET_OCCASION':
      return { ...state, selectedOccasion: action.payload }
    case 'SET_VALID_FOR':
      return { ...state, validFor: action.payload }
    case 'SET_ASSISTANT':
      return { ...state, assistant: action.payload.status, assistantMessage: action.payload.message || '' }
    case 'SHOW_SUCCESS':
      return { ...state, modal: null, assistant: 'idle', success: action.payload }
    case 'CLOSE_SUCCESS':
      return { ...state, success: null }
    // Assistant-driven compound actions
    case 'OPEN_DELIVERY_FLOW':
      return {
        ...state,
        modal: 'delivery',
        deliveryTab: action.payload?.tab || 'once',
        selectedCompany: action.payload?.company ?? 0,
        validFor: action.payload?.validFor || 'Next 1 hr',
      }
    case 'OPEN_GUEST_FLOW':
      return {
        ...state,
        modal: 'guest',
        selectedOccasion: action.payload?.occasion ?? 0,
      }
    case 'OPEN_CAB_FLOW':
      return { ...state, modal: 'cab' }
    default:
      return state
  }
}
