import { geminiIntent } from '../services/gemini'

const COMPANY_INDEX = { amazon: 1, fresh: 2, bigbasket: 3, blinkit: 4, swiggy: 5, zomato: 5 }
const OCCASION_INDEX = { home: 0, birthday: 1, tea: 2, gaming: 3, party: 4, gift: 5 }
const VALID_FOR_MAP = {
  '30 min': 'Next 30 mins', '30 mins': 'Next 30 mins', 'half hour': 'Next 30 mins',
  '1 hour': 'Next 1 hr', '1 hr': 'Next 1 hr', 'an hour': 'Next 1 hr',
  '2 hour': 'Next 2 hrs', '2 hrs': 'Next 2 hrs',
  '4 hour': 'Next 4 hrs', 'all day': 'All day',
}

// ── Keyword fallback (no API needed) ─────────────────────────────────────────
function keywordExtract(text) {
  const lower = text.toLowerCase()
  const company = Object.entries(COMPANY_INDEX).find(([k]) => lower.includes(k))?.[1] ?? null
  const occasion = Object.entries(OCCASION_INDEX).find(([k]) => lower.includes(k))?.[1] ?? null
  const validFor = Object.entries(VALID_FOR_MAP).find(([k]) => lower.includes(k))?.[1] ?? null
  const isFrequent = /every|daily|regular|frequent|morning|evening|maid|help/.test(lower)
  const isGroup = /friends|group|team|everyone|people/.test(lower)

  const isDelivery = /deliver|package|parcel|order/.test(lower) || company !== null
  const isCab = /cab|taxi|uber|ola/.test(lower)
  const isGuest = /guest|friend|family|visit|coming over|party|invite|birthday|dinner|lunch|tea/.test(lower) || occasion !== null
  const isVague = /someone|somebody|person|they are coming/.test(lower)

  return {
    intent: isDelivery ? 'delivery' : isCab ? 'cab' : isGuest ? 'guest' : isVague ? 'unknown' : 'preapprove',
    company, occasion, validFor, isFrequent, isGroup,
    isVague: isVague || (!isDelivery && !isCab && !isGuest),
    clarifyQuestion: isVague ? 'Is it a guest visiting or a delivery coming in?' : null,
  }
}

// ── Build steps from parsed intent ───────────────────────────────────────────
function buildSteps(parsed) {
  const { intent, company, validFor, isFrequent, occasion, isGroup, isVague, clarifyQuestion } = parsed
  const companyIdx = typeof company === 'string' ? (COMPANY_INDEX[company] ?? 0) : (company ?? 0)
  const occasionIdx = typeof occasion === 'string' ? (OCCASION_INDEX[occasion] ?? 0) : (occasion ?? 0)
  const companyName = companyIdx > 0 ? ['Any','Amazon','Amazon Fresh','BigBasket','Blinkit','Swiggy'][companyIdx] : null

  if (intent === 'delivery') {
    const tab = isFrequent ? 'frequent' : 'once'
    const duration = validFor || 'Next 1 hr'
    const steps = [{
      speech: companyName
        ? `Got it! Setting up a${isFrequent ? ' frequent' : ''} pre-approval for ${companyName}.`
        : `Sure! Opening the delivery pre-approval.`,
      action: 'OPEN_DELIVERY_FLOW',
      payload: { company: companyIdx, validFor: duration, tab },
    }]
    if (!validFor && !isFrequent) {
      steps.push({
        speech: `I've set it for the next hour. Does that work, or would you like a different window?`,
        highlight: 'validFor',
      })
    }
    if (isFrequent) {
      steps.push({
        speech: `I've switched to Frequent mode. What time does your delivery usually arrive?`,
        highlight: 'startTime',
      })
    }
    return steps
  }

  if (intent === 'cab') {
    return [{
      speech: 'Opening cab pre-approval! Set for today.',
      action: 'OPEN_CAB_FLOW',
      payload: {},
    }]
  }

  if (intent === 'guest' || intent === 'group') {
    const useGroup = isGroup || intent === 'group'
    const steps = [{
      speech: useGroup
        ? `Sounds like a group! I've opened Group Invite with the party occasion.`
        : `Opening the guest invite for you!`,
      action: useGroup ? 'OPEN_MODAL' : 'OPEN_GUEST_FLOW',
      payload: useGroup ? 'group' : { occasion: occasionIdx },
    }]
    if (useGroup) {
      steps.push({
        speech: `Would you like to add their names now, or should I send a general invite link?`,
        highlight: 'addGuests',
        clarify: true,
      })
    }
    return steps
  }

  if (isVague || intent === 'unknown') {
    return [{
      speech: clarifyQuestion || 'Is it a guest visiting or a delivery coming in?',
      clarify: true,
      waitFor: 'guestOrDelivery',
    }]
  }

  if (intent === 'preapprove') {
    return [{
      speech: 'Sure! Who would you like to pre-approve?',
      action: 'OPEN_MODAL',
      payload: 'preapprove',
    }]
  }

  return null
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function buildConversation(text) {
  // Try Gemini first, fall back to keywords
  const gemini = await geminiIntent(text)
  const parsed = gemini || keywordExtract(text)
  return buildSteps(parsed)
}

export async function resolveClarification(text, context) {
  if (context === 'guestOrDelivery') {
    const lower = text.toLowerCase()
    if (/deliver|package|food|order/.test(lower)) return buildConversation('delivery')
    if (/guest|friend|visit/.test(lower)) return buildConversation('guest')
  }
  return buildConversation(text)
}
