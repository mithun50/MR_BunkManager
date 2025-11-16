export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  college: string;
  course: string;
  department: string;
  semester: string;
  rollNumber: string;
  section?: string;
  minimumAttendance: number; // percentage (75, 80, 85, etc.)
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimetableEntry {
  id: string;
  day: string; // Monday, Tuesday, etc.
  startTime: string; // "09:00 AM"
  endTime: string; // "10:00 AM"
  subject: string;
  subjectCode?: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'practical' | 'seminar';
  room?: string;
  faculty?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'practical' | 'seminar';
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  faculty?: string;
  room?: string;
  lastUpdated?: Date;
}

export interface AttendanceRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  date: Date;
  status: 'present' | 'absent';
  type: 'lecture' | 'lab' | 'tutorial' | 'practical' | 'seminar';
  remarks?: string;
}

export interface OnboardingData {
  step: number;
  completed: boolean;
  profileData?: Partial<UserProfile>;
  timetableData?: TimetableEntry[];
}
