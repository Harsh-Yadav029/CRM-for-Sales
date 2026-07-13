const { z } = require('zod');

const eventSchema = z.object({
  body: z.object({
    type: z.enum(['meeting', 'call', 'internal']),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid start time'
    }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid end time'
    }),
    timezone: z.string().min(1, 'Timezone is required'),
    relatedTo: z.object({
      module: z.enum(['Lead', 'Contact', 'Deal', 'Account']),
      recordId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Related ObjectId')
    }).optional(),
    assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Owner User ID').optional(), // can default to current user if not provided, but optional in client schema
    participants: z.array(z.object({
      userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Participant User ID').optional(),
      email: z.string().email('Invalid participant email'),
      name: z.string().min(1, 'Participant name is required'),
      rsvpStatus: z.enum(['pending', 'accepted', 'declined']).default('pending')
    })).optional(),
    location: z.string().optional(),
    conferenceLink: z.string().url('Invalid conference URL').or(z.string().max(0)).or(z.null()).optional(),
    colorTag: z.enum(['gold', 'success', 'warning', 'danger', 'neutral']).default('neutral'),
    recurrence: z.object({
      frequency: z.enum(['none', 'daily', 'weekly', 'monthly']),
      interval: z.number().int().min(1).optional(),
      endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid recurrence end date'
      }).optional()
    }).default({ frequency: 'none' }).refine((val) => {
      if (val.frequency !== 'none') {
        return val.interval !== undefined && val.endDate !== undefined;
      }
      return true;
    }, {
      message: 'Interval and endDate are required when recurrence frequency is set'
    }),
    reminders: z.array(z.object({
      minutesBefore: z.number().int().min(0),
      channel: z.enum(['email', 'push'])
    })).optional(),
    status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
    externalSync: z.object({
      provider: z.enum(['none', 'google', 'outlook']),
      externalEventId: z.string().optional(),
      lastSyncedAt: z.string().optional()
    }).optional()
  }).refine((data) => {
    return Date.parse(data.startTime) < Date.parse(data.endTime);
  }, {
    message: 'Start time must be before end time',
    path: ['endTime']
  })
});

module.exports = { eventSchema };
