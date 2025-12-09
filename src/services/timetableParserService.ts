/**
 * Timetable Parser Service
 * Uses Groq AI to parse OCR-extracted text into TimetableEntry format
 */

import { TimetableEntry } from '../types/user';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'meta-llama/llama-4-maverick-17b-128e-instruct';

export interface ParseResult {
  success: boolean;
  entries: TimetableEntry[];
  error?: string;
}

const SYSTEM_PROMPT = `You are a timetable parser. Your job is to extract class schedule information from OCR text and convert it to JSON format.

RULES:
1. Extract all classes found in the text
2. Generate a unique ID for each entry (use format: "tt_" + random 8 chars)
3. Day must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
4. Time format must be "HH:MM AM/PM" (e.g., "09:00 AM", "02:30 PM")
5. Type must be one of: lecture, lab, tutorial, practical, seminar (default to "lecture" if unclear)
6. If subject code is not clear, leave it empty
7. If room or faculty is not clear, leave them empty

OUTPUT FORMAT (JSON array only, no other text):
[
  {
    "id": "tt_abc12345",
    "day": "Monday",
    "startTime": "09:00 AM",
    "endTime": "10:00 AM",
    "subject": "Data Structures",
    "subjectCode": "CS201",
    "type": "lecture",
    "room": "Room 101",
    "faculty": "Dr. Smith"
  }
]

If you cannot find any timetable data, return an empty array: []
IMPORTANT: Return ONLY the JSON array, no explanations or markdown.`;

/**
 * Parse OCR text into TimetableEntry array using AI
 */
export async function parseTimetableFromText(ocrText: string): Promise<ParseResult> {
  if (!GROQ_API_KEY) {
    return {
      success: false,
      entries: [],
      error: 'AI API key not configured',
    };
  }

  if (!ocrText || ocrText.trim().length < 10) {
    return {
      success: false,
      entries: [],
      error: 'Not enough text to parse',
    };
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Parse this timetable text:\n\n${ocrText}` },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        entries: [],
        error: error.error?.message || 'AI processing failed',
      };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed)) {
      return {
        success: false,
        entries: [],
        error: 'Invalid response format',
      };
    }

    // Validate and clean entries
    const validEntries: TimetableEntry[] = parsed
      .filter((entry: any) =>
        entry.day &&
        entry.startTime &&
        entry.endTime &&
        entry.subject
      )
      .map((entry: any) => ({
        id: entry.id || `tt_${Math.random().toString(36).substring(2, 10)}`,
        day: validateDay(entry.day),
        startTime: formatTime(entry.startTime),
        endTime: formatTime(entry.endTime),
        subject: entry.subject.trim(),
        subjectCode: entry.subjectCode?.trim() || '',
        type: validateType(entry.type),
        room: entry.room?.trim() || '',
        faculty: entry.faculty?.trim() || '',
      }));

    if (validEntries.length === 0) {
      return {
        success: false,
        entries: [],
        error: 'No valid timetable entries found',
      };
    }

    return {
      success: true,
      entries: validEntries,
    };
  } catch (error) {
    return {
      success: false,
      entries: [],
      error: error instanceof Error ? error.message : 'Failed to parse timetable',
    };
  }
}

/**
 * Validate and normalize day name
 */
function validateDay(day: string): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const normalized = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();

  // Handle abbreviations
  const abbrevMap: Record<string, string> = {
    'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
    'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday',
    'M': 'Monday', 'T': 'Tuesday', 'W': 'Wednesday',
    'Th': 'Thursday', 'F': 'Friday', 'S': 'Saturday', 'Su': 'Sunday',
  };

  if (abbrevMap[day]) return abbrevMap[day];
  return days.includes(normalized) ? normalized : 'Monday';
}

/**
 * Validate and normalize class type
 */
function validateType(type: string): TimetableEntry['type'] {
  const validTypes: TimetableEntry['type'][] = ['lecture', 'lab', 'tutorial', 'practical', 'seminar'];
  const normalized = type?.toLowerCase().trim();
  return validTypes.includes(normalized as TimetableEntry['type'])
    ? (normalized as TimetableEntry['type'])
    : 'lecture';
}

/**
 * Format time to consistent format
 */
function formatTime(time: string): string {
  if (!time) return '09:00 AM';

  // Already in correct format
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(time)) {
    const [timePart, period] = time.split(/\s+/);
    const [hours, minutes] = timePart.split(':');
    return `${hours.padStart(2, '0')}:${minutes} ${period.toUpperCase()}`;
  }

  // Handle 24-hour format
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  return time;
}

export default {
  parseTimetableFromText,
};
