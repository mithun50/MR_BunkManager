import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system/legacy';
import { TimetableEntry } from '../types/user';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash which has better availability
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async extractTimetableFromImage(imageUri: string): Promise<TimetableEntry[]> {
    try {
      // Read the image file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      // Prepare the prompt
      const prompt = `You are a timetable extraction expert. Analyze this timetable image and extract all class information.

Extract the following details for each class:
- Day of the week (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday)
- Start time (in 12-hour format like "09:00 AM")
- End time (in 12-hour format like "10:00 AM")
- Subject name
- Subject code (if visible)
- Type (lecture, lab, or tutorial)
- Room number (if visible)
- Faculty name (if visible)

Return the data as a JSON array with this exact structure:
[
  {
    "day": "Monday",
    "startTime": "09:00 AM",
    "endTime": "10:00 AM",
    "subject": "Data Structures",
    "subjectCode": "CS301",
    "type": "lecture",
    "room": "Room 301",
    "faculty": "Dr. Smith"
  }
]

Important:
- If any field is not visible, omit it from the object
- Type must be one of: "lecture", "lab", or "tutorial"
- Times must be in 12-hour format with AM/PM
- Return ONLY the JSON array, no other text
- If the image is not a timetable, return an empty array []`;

      // Generate content with the image
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64,
            mimeType: 'image/jpeg',
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not extract timetable data from the image');
      }

      const timetableData = JSON.parse(jsonMatch[0]);

      // Add IDs and validate
      return timetableData.map((entry: any, index: number) => ({
        id: `timetable_${Date.now()}_${index}`,
        day: entry.day,
        startTime: entry.startTime,
        endTime: entry.endTime,
        subject: entry.subject,
        subjectCode: entry.subjectCode,
        type: entry.type || 'lecture',
        room: entry.room,
        faculty: entry.faculty,
      })) as TimetableEntry[];
    } catch (error: any) {
      console.error('Gemini extraction error:', error);

      // Better error messages based on error type
      if (error.message?.includes('RATE_LIMIT_EXCEEDED')) {
        throw new Error('API quota exceeded. Please wait a moment and try again, or enter timetable manually.');
      } else if (error.message?.includes('API_KEY_INVALID')) {
        throw new Error('Invalid API key. Please check your Gemini API configuration.');
      } else if (error.message?.includes('quota')) {
        throw new Error('API quota limit reached. You can skip this step and enter your timetable manually later.');
      } else {
        throw new Error('Failed to extract timetable. Please try again or skip to enter manually.');
      }
    }
  }

  async extractTimetableFromPDF(pdfUri: string): Promise<TimetableEntry[]> {
    try {
      // For PDF, we'll read it as base64
      const base64 = await FileSystem.readAsStringAsync(pdfUri, {
        encoding: 'base64',
      });

      const prompt = `You are a timetable extraction expert. Analyze this PDF document and extract all class schedule information.

Extract the following details for each class:
- Day of the week
- Start time (12-hour format with AM/PM)
- End time (12-hour format with AM/PM)
- Subject name
- Subject code
- Type (lecture, lab, or tutorial)
- Room number
- Faculty name

Return as JSON array with this structure:
[
  {
    "day": "Monday",
    "startTime": "09:00 AM",
    "endTime": "10:00 AM",
    "subject": "Subject Name",
    "subjectCode": "CODE123",
    "type": "lecture",
    "room": "Room 101",
    "faculty": "Faculty Name"
  }
]

Return ONLY the JSON array, no other text.`;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64,
            mimeType: 'application/pdf',
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not extract timetable data from the PDF');
      }

      const timetableData = JSON.parse(jsonMatch[0]);

      return timetableData.map((entry: any, index: number) => ({
        id: `timetable_${Date.now()}_${index}`,
        ...entry,
        type: entry.type || 'lecture',
      })) as TimetableEntry[];
    } catch (error: any) {
      console.error('Gemini PDF extraction error:', error);

      if (error.message?.includes('RATE_LIMIT_EXCEEDED') || error.message?.includes('quota')) {
        throw new Error('API quota limit reached. Please skip and enter your timetable manually.');
      } else {
        throw new Error('Failed to extract timetable from PDF. Please skip to enter manually.');
      }
    }
  }
}

export default new GeminiService();
