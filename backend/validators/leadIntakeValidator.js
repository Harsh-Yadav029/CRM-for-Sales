const { z } = require('zod');

const leadIntakeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').trim(),
    email: z.string().email('Invalid email address').trim().optional().or(z.literal('')),
    phone: z.string().trim().optional().or(z.literal('')),
    message: z.string().trim().optional().default(''),
    serviceInterest: z.string().trim().optional().default(''),
    source: z.string().trim().optional().default('Website'),
    website_hp: z.string().optional()
  }).refine((data) => {
    // Ensure at least one of email or phone is provided
    return (data.email && data.email.length > 0) || (data.phone && data.phone.length > 0);
  }, {
    message: 'At least one contact method (email or phone) is required',
    path: ['email']
  })
});

module.exports = { leadIntakeSchema };
