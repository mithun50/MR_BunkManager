import * as FileSystem from 'expo-file-system/legacy';
import { TimetableEntry } from '../types/user';
import Groq from 'groq-sdk';

class GroqService {
  private groq: Groq;
  private model: string;

  constructor() {
    // Groq API configuration - API key should be set in .env file
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('EXPO_PUBLIC_GROQ_API_KEY is not set in .env file');
    }

    this.groq = new Groq({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Required for React Native/Expo
    });
    // Using Llama 4 Maverick for better vision accuracy (128 experts vs 16)
    this.model = 'meta-llama/llama-4-maverick-17b-128e-instruct';
  }

  private async callGroq(messages: any[]): Promise<string> {
    try {
      console.log('Making Groq API request');
      console.log('Using model:', this.model);

      const chatCompletion = await this.groq.chat.completions.create({
        messages: messages,
        model: this.model,
        temperature: 0,
        max_completion_tokens: 4096,
        top_p: 1,
        stream: false,
      });

      return chatCompletion.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('Groq API error:', error);
      throw error;
    }
  }

  async extractTimetableFromImage(imageUri: string): Promise<TimetableEntry[]> {
    try {
      console.log('Starting timetable extraction from image');
      console.log('Image URI:', imageUri);

      // Check if API key is configured
      if (!process.env.EXPO_PUBLIC_GROQ_API_KEY) {
        throw new Error('API key not configured. Please add EXPO_PUBLIC_GROQ_API_KEY to your .env file.');
      }

      // Read the image file as base64
      console.log('Reading image as base64...');
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });
      console.log('Image loaded, size:', base64.length, 'bytes');

      // Enhanced prompt for better accuracy and duplicate prevention
      const prompt = `You are extracting a class timetable from an image. Return ONLY a JSON array.

CRITICAL RULES:
1. Each time slot should appear EXACTLY ONCE - never repeat the same subject at the same time on the same day
2. SKIP completely: BREAK, LUNCH, RECESS, TEA BREAK, FREE PERIOD, VACANT, EMPTY, or any gaps
3. Days must be: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY (full uppercase)
4. Times: "09:00 AM", "02:30 PM" format (12-hour with AM/PM)
5. Only extract what you clearly see - DO NOT invent or guess data
6. If a subject appears multiple times in the week, that's normal - but never duplicate the same day+time combination

Return JSON in this exact format (no extra text):
[
  {
    "day": "MONDAY",
    "startTime": "09:00 AM",
    "endTime": "10:00 AM",
    "subject": "Mathematics",
    "subjectCode": "MATH101",
    "type": "lecture",
    "room": "A-201",
    "faculty": "Dr. Smith"
  }
]

Notes:
- Use "lecture" for type if unclear
- Use empty string "" for missing fields (subjectCode, room, faculty)
- Return ONLY valid JSON array
- NO duplicates for same day+time

Extract now:`;

      // Call Groq API with vision capabilities
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
              },
            },
          ],
        },
      ];

      const text = await this.callGroq(messages);
      console.log('AI Response (first 500 chars):', text.substring(0, 500));

      // Parse the JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in AI response. Full response:', text);
        throw new Error('Could not extract timetable data from the image. AI response did not contain valid JSON.');
      }

      console.log('Extracted JSON:', jsonMatch[0].substring(0, 300));
      const timetableData = JSON.parse(jsonMatch[0]);
      console.log('Parsed timetable entries:', timetableData.length);

      // Helper function to normalize subject names for better duplicate detection
      const normalizeSubject = (subject: string): string => {
        return subject
          .toLowerCase()
          .trim()
          .replace(/\s+/g, ' ')  // normalize whitespace
          .replace(/[^\w\s]/g, ''); // remove special chars
      };

      // Comprehensive filtering for invalid entries
      console.log('Starting filtering. Total entries before filter:', timetableData.length);
      const filteredData = timetableData.filter((entry: any, index: number) => {
        const subject = entry.subject?.toLowerCase()?.trim() || '';

        // Must have required fields
        if (!subject || !entry.day || !entry.startTime || !entry.endTime) {
          console.log(`Entry ${index} FILTERED - missing fields:`, {
            subject: entry.subject,
            day: entry.day,
            startTime: entry.startTime,
            endTime: entry.endTime
          });
          return false;
        }

        // Exclude breaks, lunch, free periods, empty slots
        const invalidKeywords = [
          'break', 'lunch', 'recess', 'free', 'vacant', 'empty',
          'no class', 'holiday', 'off', 'nil', 'na', 'n/a', 'tea',
          'short break', 'interval', 'rest'
        ];

        if (invalidKeywords.some(keyword => subject.includes(keyword))) {
          console.log(`Entry ${index} FILTERED - invalid keyword in "${entry.subject}"`);
          return false;
        }

        // Must be at least 2 characters (avoid single letter subjects)
        if (subject.length < 2) {
          console.log(`Entry ${index} FILTERED - too short: "${entry.subject}"`);
          return false;
        }

        // Filter out entries with only dashes or special chars
        if (/^[-_.\s]+$/.test(subject)) {
          console.log(`Entry ${index} FILTERED - only special chars: "${entry.subject}"`);
          return false;
        }

        console.log(`Entry ${index} KEPT: ${entry.day} ${entry.startTime}-${entry.endTime} ${entry.subject}`);
        return true;
      });
      console.log('After filtering:', filteredData.length, 'entries remaining');

      // Enhanced duplicate removal - using day + time as primary key
      // (same time slot on same day can only have ONE subject)
      const uniqueEntries = new Map<string, any>();
      const duplicatesByTimeSlot = new Map<string, number>();

      filteredData.forEach((entry: any, index: number) => {
        // Primary uniqueness: day + start time (a time slot can only have one subject)
        const timeSlotKey = `${entry.day.toLowerCase()}-${entry.startTime.toLowerCase()}`;

        // Check if this time slot already exists
        if (!uniqueEntries.has(timeSlotKey)) {
          uniqueEntries.set(timeSlotKey, entry);
          console.log(`✓ Added entry: ${entry.day} ${entry.startTime} - ${entry.subject}`);
        } else {
          // Time slot conflict - keep the first one, log the duplicate
          const existing = uniqueEntries.get(timeSlotKey);
          const dupCount = (duplicatesByTimeSlot.get(timeSlotKey) || 0) + 1;
          duplicatesByTimeSlot.set(timeSlotKey, dupCount);

          console.log(`✗ DUPLICATE TIME SLOT REJECTED:`, {
            day: entry.day,
            time: entry.startTime,
            duplicate: entry.subject,
            existing: existing.subject,
            duplicateCount: dupCount
          });
        }
      });

      // Log summary of duplicate issues
      if (duplicatesByTimeSlot.size > 0) {
        console.log('\n⚠️  DUPLICATE DETECTION SUMMARY:');
        duplicatesByTimeSlot.forEach((count, timeSlot) => {
          console.log(`  ${timeSlot}: ${count} duplicate(s) removed`);
        });
      }

      // Add IDs and validate - remove undefined fields for Firebase
      return Array.from(uniqueEntries.values()).map((entry: any, index: number) => {
        // Normalize day to proper case (MONDAY → Monday)
        const normalizeDay = (day: string): string => {
          const d = day.trim();
          return d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
        };

        const timetableEntry: any = {
          id: `timetable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          day: normalizeDay(entry.day),
          startTime: entry.startTime.trim(),
          endTime: entry.endTime.trim(),
          subject: entry.subject.trim(),
          type: entry.type?.toLowerCase() || 'lecture',
        };

        // Only add optional fields if they have meaningful values
        if (entry.subjectCode && entry.subjectCode.trim().length > 0) {
          timetableEntry.subjectCode = entry.subjectCode.trim();
        }
        if (entry.room && entry.room.trim().length > 0) {
          timetableEntry.room = entry.room.trim();
        }
        if (entry.faculty && entry.faculty.trim().length > 0) {
          timetableEntry.faculty = entry.faculty.trim();
        }

        return timetableEntry;
      }) as TimetableEntry[];
    } catch (error: any) {
      console.error('Groq extraction error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Better error messages based on error type
      if (error.message?.includes('RATE_LIMIT') || error.message?.includes('429') || error.status === 429) {
        throw new Error('API rate limit reached. Please wait a minute and try again, or skip to enter manually.');
      } else if (error.message?.includes('401') || error.message?.includes('API_KEY') || error.status === 401) {
        throw new Error('API authentication failed. Please check your API key configuration.');
      } else if (error.message?.includes('quota') || error.message?.includes('insufficient_quota')) {
        throw new Error('API quota exceeded. Please skip and enter timetable manually.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.message?.includes('timeout')) {
        throw new Error('Request timed out. Please try again with a clearer image.');
      } else if (error.message?.includes('JSON')) {
        throw new Error('Could not understand the timetable format. Please try a clearer image or enter manually.');
      } else {
        // Include more specific error info for debugging
        const errorMsg = error.message || error.toString();
        throw new Error(`Extraction failed: ${errorMsg.substring(0, 100)}. Please try again or skip to enter manually.`);
      }
    }
  }

  async extractTimetableFromPDF(pdfUri: string): Promise<TimetableEntry[]> {
    try {
      // For PDF, we'll read it as base64
      const base64 = await FileSystem.readAsStringAsync(pdfUri, {
        encoding: 'base64',
      });

      const prompt = `You are extracting a class timetable from a PDF. Return ONLY a JSON array.

CRITICAL RULES:
1. Each time slot should appear EXACTLY ONCE - never repeat the same subject at the same time on the same day
2. SKIP completely: BREAK, LUNCH, RECESS, TEA BREAK, FREE PERIOD, VACANT, EMPTY, or any gaps
3. Days must be: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY (full uppercase)
4. Times: "09:00 AM", "02:30 PM" format (12-hour with AM/PM)
5. Only extract what you clearly see - DO NOT invent or guess data
6. If a subject appears multiple times in the week, that's normal - but never duplicate the same day+time combination

Return JSON in this exact format (no extra text):
[
  {
    "day": "MONDAY",
    "startTime": "09:00 AM",
    "endTime": "10:00 AM",
    "subject": "Mathematics",
    "subjectCode": "MATH101",
    "type": "lecture",
    "room": "A-201",
    "faculty": "Dr. Smith"
  }
]

Notes:
- Use "lecture" for type if unclear
- Use empty string "" for missing fields (subjectCode, room, faculty)
- Return ONLY valid JSON array
- NO duplicates for same day+time

Extract now:`;

      // Call Groq API with PDF support
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:application/pdf;base64,${base64}`,
              },
            },
          ],
        },
      ];

      const text = await this.callGroq(messages);
      console.log('AI Response from PDF (first 500 chars):', text.substring(0, 500));

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in PDF AI response. Full response:', text);
        throw new Error('Could not extract timetable data from the PDF. AI response did not contain valid JSON.');
      }

      console.log('Extracted JSON from PDF:', jsonMatch[0].substring(0, 300));
      const timetableData = JSON.parse(jsonMatch[0]);
      console.log('Parsed PDF timetable entries:', timetableData.length);

      // Comprehensive filtering for invalid entries (same as image extraction)
      console.log('Starting PDF filtering. Total entries before filter:', timetableData.length);
      const filteredData = timetableData.filter((entry: any, index: number) => {
        const subject = entry.subject?.toLowerCase()?.trim() || '';

        // Must have required fields
        if (!subject || !entry.day || !entry.startTime || !entry.endTime) {
          console.log(`PDF Entry ${index} FILTERED - missing fields:`, {
            subject: entry.subject,
            day: entry.day,
            startTime: entry.startTime,
            endTime: entry.endTime
          });
          return false;
        }

        // Exclude breaks, lunch, free periods, empty slots
        const invalidKeywords = [
          'break', 'lunch', 'recess', 'free', 'vacant', 'empty',
          'no class', 'holiday', 'off', 'nil', 'na', 'n/a', 'tea',
          'short break', 'interval', 'rest'
        ];

        if (invalidKeywords.some(keyword => subject.includes(keyword))) {
          console.log(`PDF Entry ${index} FILTERED - invalid keyword in "${entry.subject}"`);
          return false;
        }

        // Must be at least 2 characters (avoid single letter subjects)
        if (subject.length < 2) {
          console.log(`PDF Entry ${index} FILTERED - too short: "${entry.subject}"`);
          return false;
        }

        // Filter out entries with only dashes or special chars
        if (/^[-_.\s]+$/.test(subject)) {
          console.log(`PDF Entry ${index} FILTERED - only special chars: "${entry.subject}"`);
          return false;
        }

        console.log(`PDF Entry ${index} KEPT: ${entry.day} ${entry.startTime}-${entry.endTime} ${entry.subject}`);
        return true;
      });
      console.log('After PDF filtering:', filteredData.length, 'entries remaining');

      // Enhanced duplicate removal - using day + time as primary key
      const uniqueEntries = new Map<string, any>();
      const duplicatesByTimeSlot = new Map<string, number>();

      filteredData.forEach((entry: any) => {
        // Primary uniqueness: day + start time (a time slot can only have one subject)
        const timeSlotKey = `${entry.day.toLowerCase()}-${entry.startTime.toLowerCase()}`;

        // Check if this time slot already exists
        if (!uniqueEntries.has(timeSlotKey)) {
          uniqueEntries.set(timeSlotKey, entry);
          console.log(`✓ PDF Added entry: ${entry.day} ${entry.startTime} - ${entry.subject}`);
        } else {
          // Time slot conflict - keep the first one, log the duplicate
          const existing = uniqueEntries.get(timeSlotKey);
          const dupCount = (duplicatesByTimeSlot.get(timeSlotKey) || 0) + 1;
          duplicatesByTimeSlot.set(timeSlotKey, dupCount);

          console.log(`✗ PDF DUPLICATE TIME SLOT REJECTED:`, {
            day: entry.day,
            time: entry.startTime,
            duplicate: entry.subject,
            existing: existing.subject,
            duplicateCount: dupCount
          });
        }
      });

      // Log summary of duplicate issues
      if (duplicatesByTimeSlot.size > 0) {
        console.log('\n⚠️  PDF DUPLICATE DETECTION SUMMARY:');
        duplicatesByTimeSlot.forEach((count, timeSlot) => {
          console.log(`  ${timeSlot}: ${count} duplicate(s) removed`);
        });
      }

      // Remove undefined fields for Firebase compatibility
      return Array.from(uniqueEntries.values()).map((entry: any, index: number) => {
        // Normalize day to proper case (MONDAY → Monday)
        const normalizeDay = (day: string): string => {
          const d = day.trim();
          return d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
        };

        const timetableEntry: any = {
          id: `timetable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          day: normalizeDay(entry.day),
          startTime: entry.startTime.trim(),
          endTime: entry.endTime.trim(),
          subject: entry.subject.trim(),
          type: entry.type?.toLowerCase() || 'lecture',
        };

        // Only add optional fields if they have meaningful values
        if (entry.subjectCode && entry.subjectCode.trim().length > 0) {
          timetableEntry.subjectCode = entry.subjectCode.trim();
        }
        if (entry.room && entry.room.trim().length > 0) {
          timetableEntry.room = entry.room.trim();
        }
        if (entry.faculty && entry.faculty.trim().length > 0) {
          timetableEntry.faculty = entry.faculty.trim();
        }

        return timetableEntry;
      }) as TimetableEntry[];
    } catch (error: any) {
      console.error('Groq PDF extraction error:', error);

      if (error.message?.includes('RATE_LIMIT') || error.message?.includes('429') || error.message?.includes('quota')) {
        throw new Error('API quota limit reached. Please skip and enter your timetable manually.');
      } else {
        throw new Error('Failed to extract timetable from PDF. Please skip to enter manually.');
      }
    }
  }
}

export default new GroqService();
