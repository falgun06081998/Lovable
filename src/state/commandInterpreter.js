// ─── Intent extraction ────────────────────────────────────────────────────────

const COMPANY_MAP = {
  amazon: 1, 'amazon fresh': 2, fresh: 2, bigbasket: 3,
  blinkit: 4, grofers: 4, swiggy: 5, zomato: 5,
}
const OCCASION_MAP = {
  home: 0, birthday: 1, cake: 1, tea: 2, chai: 2,
  gaming: 3, game: 3, party: 4, dinner: 4, lunch: 4, gift: 5,
}
const VALID_FOR_MAP = {
  '30 min': 'Next 30 mins', '30 mins': 'Next 30 mins',
  'half hour': 'Next 30 mins', '1 hour': 'Next 1 hr',
  '1 hr': 'Next 1 hr', 'an hour': 'Next 1 hr',
  '2 hour': 'Next 2 hrs', '2 hrs': 'Next 2 hrs',
  '4 hour': 'Next 4 hrs', 'all day': 'All day',
}

export function extractIntent(text) {
  const lower = text.toLowerCase()

  const company = Object.entries(COMPANY_MAP).find(([k]) => lower.includes(k))?.[1] ?? null
  const occasion = Object.entries(OCCASION_MAP).find(([k]) => lower.includes(k))?.[1] ?? null
  const validFor = Object.entries(VALID_FOR_MAP).find(([k]) => lower.includes(k))?.[1] ?? null
  const isFrequent =
    lower.includes('every') || lower.includes('daily') ||
    lower.includes('regular') || lower.includes('frequent') ||
    lower.includes('morning') || lower.includes('maid') || lower.includes('help')
  const isGroup =
    lower.includes('friends') || lower.includes('group') || lower.includes('team') || lower.includes('everyone')
  const hasTime = !!validFor
  const hasGuests = lower.includes('add') || lower.includes('name')

  // ── Classify ──────────────────────────────────────────────────────────────
  const isDelivery =
    lower.includes('deliver') || lower.includes('package') ||
    lower.includes('parcel') || lower.includes('order') || company !== null

  const isCab =
    lower.includes('cab') || lower.includes('taxi') ||
    lower.includes('uber') || lower.includes('ola')

  const isGuest =
    lower.includes('guest') || lower.includes('friend') ||
    lower.includes('family') || lower.includes('visit') ||
    lower.includes('coming over') || lower.includes('party') ||
    lower.includes('invite') || lower.includes('birthday') ||
    lower.includes('dinner') || lower.includes('lunch') ||
    lower.includes('tea') || occasion !== null

  const isVague =
    lower.includes('someone') || lower.includes('somebody') ||
    lower.includes('person') || lower.includes('they are coming')

  const isPreApprove =
    lower.includes('pre') || lower.includes('approve') ||
    lower.includes('allow') || lower.includes('entry')

  return {
    isDelivery, isGuest, isCab, isVague, isPreApprove, isFrequent, isGroup,
    company, occasion, validFor, hasTime, hasGuests,
  }
}

// ── Full conversation engine ──────────────────────────────────────────────────
// Returns { steps: [{speech, action?, payload?, clarify?}] }
export function buildConversation(text) {
  const i = extractIntent(text)

  // ── DELIVERY ──────────────────────────────────────────────────────────────
  if (i.isDelivery) {
    const tab = i.isFrequent ? 'frequent' : 'once'
    const validFor = i.validFor || 'Next 1 hr'
    const company = i.company ?? 0
    const companyName = company > 0
      ? ['Any', 'Amazon', 'Amazon Fresh', 'BigBasket', 'Blinkit', 'Swiggy'][company]
      : null

    const steps = []

    // Execution step
    steps.push({
      speech: companyName
        ? `Got it! Setting up a${i.isFrequent ? ' frequent' : ''} pre-approval for ${companyName}.`
        : `Sure! Opening the delivery pre-approval for you.`,
      action: 'OPEN_DELIVERY_FLOW',
      payload: { company, validFor, tab },
    })

    // Edge: missing time → pulse highlight + confirm
    if (!i.hasTime && !i.isFrequent) {
      steps.push({
        speech: `I've set it for ${validFor}. Does that work, or would you like a different window?`,
        highlight: 'validFor',
      })
    }

    // Edge: frequent but no start time
    if (i.isFrequent) {
      steps.push({
        speech: `I switched to Frequent mode. What time does your delivery usually arrive? I've left it open for now.`,
        highlight: 'startTime',
      })
    }

    return steps
  }

  // ── CAB ───────────────────────────────────────────────────────────────────
  if (i.isCab) {
    return [{
      speech: `Opening cab pre-approval! I've set it for today.`,
      action: 'OPEN_CAB_FLOW',
      payload: {},
    }]
  }

  // ── GUEST ─────────────────────────────────────────────────────────────────
  if (i.isGuest) {
    const occasion = i.occasion ?? (i.isGroup ? 4 : 0)

    const steps = [{
      speech: i.isGroup
        ? `Sounds like a group! I've selected Group Invite and picked the party occasion.`
        : `Opening the guest invite for you!`,
      action: i.isGroup ? 'OPEN_MODAL' : 'OPEN_GUEST_FLOW',
      payload: i.isGroup ? 'group' : { occasion },
    }]

    // Edge: group but no guest names
    if (i.isGroup && !i.hasGuests) {
      steps.push({
        speech: `Would you like to add their names now, or should I send a general invite link?`,
        highlight: 'addGuests',
        clarify: true,
      })
    }

    return steps
  }

  // ── VAGUE ─────────────────────────────────────────────────────────────────
  if (i.isVague || i.isPreApprove) {
    return [{
      speech: `Is it a guest visiting or a delivery coming in?`,
      clarify: true,
      waitFor: 'guestOrDelivery',
    }]
  }

  return null
}

// ── Clarification resolver ────────────────────────────────────────────────────
export function resolveClarification(text, context) {
  const lower = text.toLowerCase()
  if (context === 'guestOrDelivery') {
    if (lower.includes('deliver') || lower.includes('package') || lower.includes('food'))
      return buildConversation('delivery')
    if (lower.includes('guest') || lower.includes('friend') || lower.includes('visit'))
      return buildConversation('guest')
  }
  return buildConversation(text)
}
