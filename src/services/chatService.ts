/**
 * Groq Chat Service for MR BunkManager
 * AI-powered attendance assistant and study helper
 * Uses Llama 4 Maverick with vision capabilities
 */

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'meta-llama/llama-4-maverick-17b-128e-instruct';

export interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string; // base64 data URL
  };
}

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | (TextContent | ImageContent)[];
}

export interface AttendanceContext {
  overallPercentage: number;
  minimumRequired: number;
  totalClasses: number;
  attendedClasses: number;
  canBunk: number;
  mustAttend: number;
  subjects: Array<{
    name: string;
    percentage: number;
    attended: number;
    total: number;
  }>;
}

/**
 * Create system prompt with attendance context
 */
function createSystemPrompt(context: AttendanceContext | null): string {
  let systemPrompt = `You are BunkBot, a friendly AI assistant for MR BunkManager app. You help students with:
1. Attendance queries and bunk calculations
2. Study tips and academic questions
3. Motivation and encouragement

Keep responses concise, friendly, and helpful. Use emojis sparingly.`;

  if (context) {
    systemPrompt += `

STUDENT'S CURRENT ATTENDANCE DATA:
- Overall Attendance: ${context.overallPercentage.toFixed(1)}%
- Minimum Required: ${context.minimumRequired}%
- Total Classes: ${context.totalClasses}
- Attended: ${context.attendedClasses}
- ${context.canBunk >= 0 ? `Can safely bunk: ${context.canBunk} classes` : `Must attend: ${context.mustAttend} more classes to reach ${context.minimumRequired}%`}

SUBJECT-WISE BREAKDOWN:
${context.subjects.map(s => `- ${s.name}: ${s.percentage.toFixed(1)}% (${s.attended}/${s.total})`).join('\n')}

Use this data to give personalized advice. If attendance is low, encourage them. If good, appreciate them.`;
  }

  return systemPrompt;
}

/**
 * Send message to Groq API with optional image
 */
export async function sendMessage(
  userMessage: string,
  conversationHistory: ChatMessage[],
  attendanceContext: AttendanceContext | null,
  imageBase64?: string // Optional base64 image data
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured');
  }

  const systemMessage: ChatMessage = {
    role: 'system',
    content: createSystemPrompt(attendanceContext)
  };

  // Build user message content (with or without image)
  let userContent: string | (TextContent | ImageContent)[];
  if (imageBase64) {
    userContent = [
      { type: 'text', text: userMessage },
      { type: 'image_url', image_url: { url: imageBase64 } }
    ];
  } else {
    userContent = userMessage;
  }

  const messages = [
    systemMessage,
    ...conversationHistory,
    { role: 'user' as const, content: userContent }
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get response');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (error: any) {
    console.error('Groq API error:', error);
    throw new Error(error.message || 'Failed to connect to AI service');
  }
}

/**
 * Quick prompts for common queries
 */
export const quickPrompts = [
  { label: '📊 Attendance Status', prompt: 'How is my attendance looking?' },
  { label: '🎯 Can I bunk?', prompt: 'Can I bunk any classes today?' },
  { label: '📚 Study Tips', prompt: 'Give me some study tips' },
  { label: '💪 Motivate Me', prompt: 'I need some motivation to attend classes' },
];

export default {
  sendMessage,
  quickPrompts,
};
