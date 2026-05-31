const MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
const KEY = import.meta.env.VITE_GEMINI_KEY as string;

const SYSTEM_INSTRUCTION = `You are Myra, a smart and friendly voice assistant for NB Hood, a gated community management app.
You help residents with:
- Pre-approving visitors, deliveries, cabs
- Booking amenities (gym, pool, banquet hall, tennis court)
- Logging maintenance/helpdesk tickets
- Marking attendance for domestic help
- Answering society queries

Speak in Indian English. Be concise, warm, and action-oriented.
When you understand an intent, call the relevant tool immediately.
Support Hindi, Hinglish naturally — respond in the language the user speaks.

Tools available:
- pre_approve_visitor: Pre-approve a visitor/delivery/cab
- book_amenity: Book a society amenity
- raise_complaint: Log a maintenance ticket
- mark_attendance: Mark maid/driver attendance
- highlight_home_option: Highlight a feature on the home screen`;

export const TOOLS = [
  {
    name: 'pre_approve_visitor',
    description: 'Pre-approve a visitor, delivery person, or cab to enter the society',
    parameters: {
      type: 'object',
      properties: {
        visitorType: { type: 'string', description: 'Type of visitor: Delivery, Guest, Maid, Driver, Cab' },
        duration: { type: 'string', description: 'Duration/window e.g. Next 1 hr, today, tomorrow morning' },
        name: { type: 'string', description: 'Name of visitor if mentioned' },
      },
      required: ['visitorType', 'duration'],
    },
  },
  {
    name: 'book_amenity',
    description: 'Book a society amenity',
    parameters: {
      type: 'object',
      properties: {
        amenity: { type: 'string', description: 'Amenity name: Gym, Swimming Pool, Banquet Hall, Tennis Court' },
        when: { type: 'string', description: 'When to book e.g. tomorrow 6-7am' },
      },
      required: ['amenity', 'when'],
    },
  },
  {
    name: 'raise_complaint',
    description: 'Raise a maintenance or helpdesk ticket',
    parameters: {
      type: 'object',
      properties: {
        issue: { type: 'string', description: 'Description of the issue' },
        location: { type: 'string', description: 'Location e.g. A-002, Common area' },
        category: { type: 'string', description: 'Category: Electrical, Plumbing, Lift, Housekeeping, Maintenance' },
        urgent: { type: 'boolean', description: 'Whether this is urgent' },
        visibility: { type: 'string', description: 'personal or community' },
      },
      required: ['issue', 'location'],
    },
  },
  {
    name: 'mark_attendance',
    description: 'Mark domestic help attendance',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the person' },
        status: { type: 'string', enum: ['present', 'absent'], description: 'Attendance status' },
      },
      required: ['name', 'status'],
    },
  },
  {
    name: 'highlight_home_option',
    description: 'Highlight or navigate to a specific feature on the home screen',
    parameters: {
      type: 'object',
      properties: {
        option: { type: 'string', description: 'Option to highlight: pre-approve, helpdesk, amenities, bills' },
      },
      required: ['option'],
    },
  },
];

export async function getGeminiLiveToken(): Promise<{ token: string; model: string }> {
  // For prototype: use API key directly as token
  // In production, this would be a server call to mint a short-lived token
  return { token: KEY, model: MODEL };
}

export { SYSTEM_INSTRUCTION };
