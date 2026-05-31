// Companies list index map (matches DeliveryFlow.jsx companies array)
const COMPANY_MAP = {
  amazon: 1,
  'amazon fresh': 2,
  fresh: 2,
  bigbasket: 3,
  blinkit: 4,
  grofers: 4,
  swiggy: 5,
  zomato: 5,
}

// Occasion index map (matches GuestFlow.jsx occasions array)
const OCCASION_MAP = {
  home: 0,
  birthday: 1,
  cake: 1,
  tea: 2,
  chai: 2,
  gaming: 3,
  game: 3,
  party: 4,
  gift: 5,
  dinner: 4,
  lunch: 4,
}

const VALID_FOR_MAP = {
  '30 min': 'Next 30 mins',
  '30 mins': 'Next 30 mins',
  '1 hour': 'Next 1 hr',
  '1 hr': 'Next 1 hr',
  '2 hour': 'Next 2 hrs',
  '2 hrs': 'Next 2 hrs',
  '4 hour': 'Next 4 hrs',
  'all day': 'All day',
}

export function interpretCommand(text) {
  const lower = text.toLowerCase()

  // --- DELIVERY intent ---
  const isDelivery =
    lower.includes('deliver') ||
    lower.includes('package') ||
    lower.includes('parcel') ||
    lower.includes('order') ||
    Object.keys(COMPANY_MAP).some((k) => lower.includes(k))

  if (isDelivery) {
    const company = Object.entries(COMPANY_MAP).find(([k]) => lower.includes(k))?.[1] ?? 0
    const validFor = Object.entries(VALID_FOR_MAP).find(([k]) => lower.includes(k))?.[1] || 'Next 1 hr'
    const tab = lower.includes('frequent') || lower.includes('regular') || lower.includes('daily') ? 'frequent' : 'once'
    return {
      action: 'OPEN_DELIVERY_FLOW',
      payload: { company, validFor, tab },
      speech: company > 0
        ? `Got it! I've opened the delivery pre-approval and selected the company for you.`
        : `Sure! I've set up the delivery pre-approval. Tap Pre-Approve when ready.`,
    }
  }

  // --- CAB intent ---
  if (lower.includes('cab') || lower.includes('taxi') || lower.includes('uber') || lower.includes('ola') || lower.includes('car')) {
    return {
      action: 'OPEN_CAB_FLOW',
      payload: {},
      speech: `Opening the cab pre-approval for you!`,
    }
  }

  // --- GUEST intent ---
  const isGuest =
    lower.includes('guest') ||
    lower.includes('friend') ||
    lower.includes('family') ||
    lower.includes('visit') ||
    lower.includes('coming over') ||
    lower.includes('party') ||
    lower.includes('invite') ||
    lower.includes('birthday') ||
    lower.includes('dinner') ||
    lower.includes('lunch') ||
    lower.includes('tea')

  if (isGuest) {
    const occasion = Object.entries(OCCASION_MAP).find(([k]) => lower.includes(k))?.[1] ?? 0
    return {
      action: 'OPEN_GUEST_FLOW',
      payload: { occasion },
      speech: `I've opened the guest invite screen for you. Just add your guests and tap Create Invite!`,
    }
  }

  // --- PRE-APPROVE generic ---
  if (lower.includes('pre') || lower.includes('approve') || lower.includes('allow') || lower.includes('entry')) {
    return {
      action: 'OPEN_MODAL',
      payload: 'preapprove',
      speech: `Sure! Who would you like to pre-approve?`,
    }
  }

  return null
}
