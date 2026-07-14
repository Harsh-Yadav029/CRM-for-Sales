const Lead = require('../models/Lead');

// Native fetch utility to communicate with Google Gemini API if key is present
const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.warn('Gemini API returned an error:', err);
      return null;
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    return null;
  } catch (err) {
    console.error('Failed to contact Gemini API:', err);
    return null;
  }
};

// @desc    Predict lead win probability and calculate score
// @route   GET /api/ai/score/:leadId
// @access  Private
const scoreLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.leadId });
    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    // 1. Check if we can use real Gemini for prediction
    const prompt = `You are Compass, an AI sales assistant. Given the following Lead profile, predict the win probability (0-100%) and write a brief explanation.
Name: ${lead.name}
Company: ${lead.company}
Source: ${lead.source}
Status: ${lead.status}
Expected Revenue: $${lead.expectedRevenue}
Notes/Timeline length: ${lead.notes.length} notes logged.

Output your response strictly as valid JSON with keys: "score" (number) and "explanation" (string). Do not add any markdown blocks around the JSON output.`;

    const geminiResponse = await callGemini(prompt);
    if (geminiResponse) {
      try {
        const parsed = JSON.parse(geminiResponse.replace(/```json|```/g, '').trim());
        return res.json({
          score: parsed.score,
          explanation: parsed.explanation,
          mode: 'ai_generative'
        });
      } catch (e) {
        console.warn('Failed to parse Gemini JSON response, falling back to heuristics.');
      }
    }

    // 2. Fallback to heuristic rule-based calculations if key is missing or failed
    let score = 20; // base score

    if (lead.phone && lead.phone !== '') score += 15;
    if (lead.email && lead.email !== '') score += 10;
    
    // Status weightings
    if (lead.status === 'Contacted') score += 15;
    else if (lead.status === 'Demo Scheduled') score += 25;
    else if (lead.status === 'Proposal Sent') score += 35;
    else if (lead.status === 'Negotiation') score += 45;
    else if (lead.status === 'Won') score += 80;

    // Timeline engagement
    if (lead.notes.length > 5) score += 10;
    else if (lead.notes.length > 2) score += 5;

    score = Math.min(100, score);

    let explanation = `Heuristic predictive score set at ${score}%. `;
    if (lead.status === 'New') {
      explanation += 'Lead is newly created. We recommend initiating a phone or email check-in to qualify their requirements.';
    } else if (score > 70) {
      explanation += 'Strong engagement indicators present. Progression through negotiation stages suggests high conversion likelihood.';
    } else {
      explanation += 'Moderate engagement. Keep logging communication activity to build pipeline confidence.';
    }

    res.json({
      score,
      explanation,
      mode: 'heuristic_fallback'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Draft a customized follow-up email draft using AI
// @route   POST /api/ai/draft-email
// @access  Private
const draftEmail = async (req, res, next) => {
  const { leadId, instructions } = req.body;

  try {
    const lead = await Lead.findOne({ _id: leadId });
    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    const promptInstructions = instructions || 'Draft a friendly follow-up check-in email';

    // 1. Check if we can use real Gemini
    const prompt = `Write a professional email following these instructions: "${promptInstructions}".
Target Recipient:
Name: ${lead.name}
Company: ${lead.company}
Status: ${lead.status}
Expected Revenue: $${lead.expectedRevenue}

Keep it clean, concise, and do not write placeholders. Return only the email body.`;

    const emailDraft = await callGemini(prompt);
    if (emailDraft) {
      return res.json({ draft: emailDraft.trim(), mode: 'ai_generative' });
    }

    // 2. Fallback to heuristic dynamic templates
    let draft = `Dear ${lead.name},\n\n`;
    if (promptInstructions.toLowerCase().includes('proposal') || lead.status === 'Proposal Sent') {
      draft += `I hope you are doing well. I wanted to follow up on the proposal we shared for ${lead.company}. Let me know if you had any questions or if we should schedule a quick alignment call.\n\nBest regards,\nSales Team`;
    } else if (promptInstructions.toLowerCase().includes('demo') || lead.status === 'Demo Scheduled') {
      draft += `Thank you for interest in our solutions. I wanted to check if the proposed demo schedule is confirmed on your calendar. Looking forward to speaking with you and the team at ${lead.company}.\n\nBest regards,\nSales Team`;
    } else {
      draft += `I wanted to follow up and check if you had a moment to review our initial discussion details. We are excited about the prospect of partnering with ${lead.company} and would love to help you build out your plans.\n\nBest regards,\nSales Team`;
    }

    res.json({
      draft,
      mode: 'template_fallback'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze lead timeline and suggest next best action
// @route   GET /api/ai/next-action/:leadId
// @access  Private
const getNextAction = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.leadId });
    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    // 1. Check if we can use real Gemini
    const prompt = `Analyze this sales lead and suggest the single "next best action" (1-2 sentences).
Status: ${lead.status}
Source: ${lead.source}
Timeline activity: ${lead.notes.length} interactions logged.
Last note text: "${lead.notes.length > 0 ? lead.notes[lead.notes.length - 1].text : 'No notes logged yet'}"

Return your response strictly as JSON with keys: "action" (string) and "rationale" (string). Do not include markdown blocks.`;

    const geminiResponse = await callGemini(prompt);
    if (geminiResponse) {
      try {
        const parsed = JSON.parse(geminiResponse.replace(/```json|```/g, '').trim());
        return res.json(parsed);
      } catch (e) {
        console.warn('Failed to parse next-action Gemini JSON response, falling back to heuristics.');
      }
    }

    // 2. Fallback to heuristic next action recommendation
    let action = 'Initiate initial check-in call.';
    let rationale = 'Lead is new and has no logged communication history. Setting up a call is critical to understand their scope.';

    if (lead.status === 'Proposal Sent') {
      action = 'Send email follow-up on proposal.';
      rationale = 'The proposal has been shared. A follow-up within 3 days is standard practice to answer client questions.';
    } else if (lead.status === 'Demo Scheduled') {
      action = 'Prepare custom demo slide deck.';
      rationale = 'The client has scheduled a demo. Tailoring product features to their industry will maximize conversion chance.';
    } else if (lead.notes.length > 0) {
      action = 'Update deal value and schedule follow-up task.';
      rationale = 'Recent activity has been logged. Keep the momentum going by logging a clear next task.';
    }

    res.json({
      action,
      rationale,
      mode: 'heuristic_fallback'
    });
  } catch (error) {
    next(error);
  }
};

const chatWithAI = async (req, res, next) => {
  const { message, leadId } = req.body;

  try {
    let leadContext = '';
    if (leadId) {
      const lead = await Lead.findOne({ _id: leadId });
      if (lead) {
        leadContext = `Lead Context:
- Name: ${lead.name}
- Company: ${lead.company}
- Email: ${lead.email}
- Status: ${lead.status}
- Expected Value: $${lead.expectedRevenue}
- Logged interactions count: ${lead.notes?.length || 0}
`;
      }
    }

    const prompt = `You are Compass, the AI sales assistant. Answer the sales representative's query below. Use the provided lead profile context if available.
${leadContext}
Representative Query: "${message}"

Keep your response clean, professional, and directly actionable. Avoid meta-commentary.`;

    const responseText = await callGemini(prompt);
    if (responseText) {
      return res.json({ response: responseText.trim(), mode: 'ai_generative' });
    }

    // Heuristic Smart Fallbacks
    let response = "I am Compass, your AI Sales Assistant. Let me know how I can help you analyze leads, draft messages, or review statuses.";
    const queryLower = message.toLowerCase();
    
    if (leadId) {
      const lead = await Lead.findOne({ _id: leadId });
      if (lead) {
        if (queryLower.includes('summar') || queryLower.includes('info') || queryLower.includes('about')) {
          response = `Here is a summary for ${lead.name} representing ${lead.company}: The lead is currently in the "${lead.status}" stage, with an estimated deal value of ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(lead.expectedRevenue || 0)}. We have logged ${lead.notes?.length || 0} interactions on their timeline.`;
        } else if (queryLower.includes('email') || queryLower.includes('write') || queryLower.includes('draft')) {
          response = `Subject: Quick follow up: Walk the Plan CRM & ${lead.company}

Dear ${lead.name},

I hope you are having a productive week.

I wanted to check in regarding our discussions. We are excited to support ${lead.company} in building your sales pipeline structure. Please let me know if you are free for a brief review call this week.

Best regards,
Sales Team`;
        } else if (queryLower.includes('next') || queryLower.includes('action') || queryLower.includes('todo')) {
          response = `Based on the active status "${lead.status}", we recommend scheduling a follow-up call to review recent timeline feedback and set a clear delivery task.`;
        }
      }
    } else {
      if (queryLower.includes('forecast') || queryLower.includes('pipeline') || queryLower.includes('revenue')) {
        response = "Based on our latest analytics report, active pipelines are progressing steadily. We recommend focusing on high-revenue deals currently stuck in the Negotiation stages to close the month strong.";
      }
    }

    res.json({
      response,
      mode: 'heuristic_fallback'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scoreLead,
  draftEmail,
  getNextAction,
  chatWithAI
};
