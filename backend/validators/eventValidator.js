const { z } = require('zod');

const participantValidator = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional(),
  email: z.string().email('Invalid participant email address'),
  name: z.string().min(1, 'Participant name is required'),
  rsvpStatus: z.enum(['pending', 'accepted', 'declined']).optional().default('pending')
});

const recurrenceValidator = z.object({
  frequency: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
  interval: z.number().min(1).optional().default(1),
  endDate: z.string().transform((val) => new Date(val)).or(z.date()).optional()
});

const reminderValidator = z.object({
  minutesBefore: z.number().min(0),
  channel: z.enum(['email', 'push'])
});

// Base body schema without refinements so that .partial() can be used for updates safely
const eventBodySchema = z.object({
  type: z.enum(['meeting', 'call', 'internal']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
  startTime: z.string().transform((val) => new Date(val)).or(z.date()),
  endTime: z.string().transform((val) => new Date(val)).or(z.date()),
  timezone: z.string().optional().default('UTC'),
  relatedTo: z.object({
    module: z.enum(['Lead', 'Contact', 'Deal', 'Account']),
    recordId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid record ID')
  }).optional(),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid assignedTo user ID').optional(),
  participants: z.array(participantValidator).optional().default([]),
  location: z.string().optional().default(''),
  conferenceLink: z.string().url('Invalid conference URL').or(z.literal('')).optional().default(''),
  colorTag: z.enum(['gold', 'success', 'warning', 'danger', 'neutral']).optional().default('neutral'),
  recurrence: recurrenceValidator.optional(),
  reminders: z.array(reminderValidator).optional().default([]),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional().default('scheduled')
});

const createEventSchema = z.object({
  body: eventBodySchema.refine((data) => {
    return data.startTime < data.endTime;
  }, {
    message: "startTime must be before endTime",
    path: ["endTime"]
  }).refine((data) => {
    if (data.recurrence && data.recurrence.frequency !== 'none') {
      return !!data.recurrence.endDate;
    }
    return true;
  }, {
    message: "endDate is required when recurrence frequency is set",
    path: ["recurrence.endDate"]
  })
});

const updateEventSchema = z.object({
  body: eventBodySchema.partial().refine((data) => {
    if (data.startTime && data.endTime) {
      return data.startTime < data.endTime;
    }
    return true;
  }, {
    message: "startTime must be before endTime",
    path: ["endTime"]
  })
});

module.exports = {
  createEventSchema,
  updateEventSchema
};
