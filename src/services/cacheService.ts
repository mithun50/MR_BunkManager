import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Subject, TimetableEntry, AttendanceRecord } from '../types/user';

const CACHE_KEYS = {
  USER_PROFILE: '@cache_user_profile_',
  SUBJECTS: '@cache_subjects_',
  TIMETABLE: '@cache_timetable_',
  ATTENDANCE: '@cache_attendance_',
  ONBOARDING_STATUS: '@cache_onboarding_',
};

const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CacheService {
  // User Profile Cache
  async cacheUserProfile(uid: string, profile: UserProfile): Promise<void> {
    try {
      const entry: CacheEntry<UserProfile> = {
        data: profile,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        `${CACHE_KEYS.USER_PROFILE}${uid}`,
        JSON.stringify(entry)
      );
      console.log('💾 Cached user profile for:', uid);
    } catch (error) {
      console.error('Failed to cache user profile:', error);
    }
  }

  async getCachedUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEYS.USER_PROFILE}${uid}`);
      if (!cached) return null;

      const entry: CacheEntry<UserProfile> = JSON.parse(cached);

      // Check if cache is still valid
      if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
        console.log('⏰ User profile cache expired');
        await this.clearUserProfileCache(uid);
        return null;
      }

      console.log('📦 Retrieved cached user profile');
      return {
        ...entry.data,
        createdAt: new Date(entry.data.createdAt),
        updatedAt: new Date(entry.data.updatedAt),
      };
    } catch (error) {
      console.error('Failed to get cached user profile:', error);
      return null;
    }
  }

  async clearUserProfileCache(uid: string): Promise<void> {
    await AsyncStorage.removeItem(`${CACHE_KEYS.USER_PROFILE}${uid}`);
  }

  // Onboarding Status Cache
  async cacheOnboardingStatus(uid: string, completed: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${CACHE_KEYS.ONBOARDING_STATUS}${uid}`,
        JSON.stringify({ completed, timestamp: Date.now() })
      );
      console.log('💾 Cached onboarding status:', completed);
    } catch (error) {
      console.error('Failed to cache onboarding status:', error);
    }
  }

  async getCachedOnboardingStatus(uid: string): Promise<boolean | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEYS.ONBOARDING_STATUS}${uid}`);
      if (!cached) return null;

      const { completed, timestamp } = JSON.parse(cached);

      // Onboarding status doesn't expire - it's a one-time flag
      console.log('📦 Retrieved cached onboarding status:', completed);
      return completed;
    } catch (error) {
      console.error('Failed to get cached onboarding status:', error);
      return null;
    }
  }

  // Subjects Cache
  async cacheSubjects(uid: string, subjects: Subject[]): Promise<void> {
    try {
      const entry: CacheEntry<Subject[]> = {
        data: subjects,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        `${CACHE_KEYS.SUBJECTS}${uid}`,
        JSON.stringify(entry)
      );
      console.log(`💾 Cached ${subjects.length} subjects`);
    } catch (error) {
      console.error('Failed to cache subjects:', error);
    }
  }

  async getCachedSubjects(uid: string): Promise<Subject[] | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEYS.SUBJECTS}${uid}`);
      if (!cached) return null;

      const entry: CacheEntry<Subject[]> = JSON.parse(cached);

      // Check if cache is still valid
      if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
        console.log('⏰ Subjects cache expired');
        await this.clearSubjectsCache(uid);
        return null;
      }

      console.log(`📦 Retrieved ${entry.data.length} cached subjects`);
      return entry.data.map(s => ({
        ...s,
        lastUpdated: new Date(s.lastUpdated),
      }));
    } catch (error) {
      console.error('Failed to get cached subjects:', error);
      return null;
    }
  }

  async clearSubjectsCache(uid: string): Promise<void> {
    await AsyncStorage.removeItem(`${CACHE_KEYS.SUBJECTS}${uid}`);
  }

  // Timetable Cache
  async cacheTimetable(uid: string, timetable: TimetableEntry[]): Promise<void> {
    try {
      const entry: CacheEntry<TimetableEntry[]> = {
        data: timetable,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        `${CACHE_KEYS.TIMETABLE}${uid}`,
        JSON.stringify(entry)
      );
      console.log(`💾 Cached ${timetable.length} timetable entries`);
    } catch (error) {
      console.error('Failed to cache timetable:', error);
    }
  }

  async getCachedTimetable(uid: string): Promise<TimetableEntry[] | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEYS.TIMETABLE}${uid}`);
      if (!cached) return null;

      const entry: CacheEntry<TimetableEntry[]> = JSON.parse(cached);

      // Check if cache is still valid
      if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
        console.log('⏰ Timetable cache expired');
        await this.clearTimetableCache(uid);
        return null;
      }

      console.log(`📦 Retrieved ${entry.data.length} cached timetable entries`);
      return entry.data;
    } catch (error) {
      console.error('Failed to get cached timetable:', error);
      return null;
    }
  }

  async clearTimetableCache(uid: string): Promise<void> {
    await AsyncStorage.removeItem(`${CACHE_KEYS.TIMETABLE}${uid}`);
  }

  // Attendance Records Cache
  async cacheAttendanceRecords(uid: string, records: AttendanceRecord[]): Promise<void> {
    try {
      const entry: CacheEntry<AttendanceRecord[]> = {
        data: records,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        `${CACHE_KEYS.ATTENDANCE}${uid}`,
        JSON.stringify(entry)
      );
      console.log(`💾 Cached ${records.length} attendance records`);
    } catch (error) {
      console.error('Failed to cache attendance records:', error);
    }
  }

  async getCachedAttendanceRecords(uid: string): Promise<AttendanceRecord[] | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEYS.ATTENDANCE}${uid}`);
      if (!cached) return null;

      const entry: CacheEntry<AttendanceRecord[]> = JSON.parse(cached);

      // Attendance records cache expires faster (1 day)
      const ATTENDANCE_EXPIRY = 24 * 60 * 60 * 1000;
      if (Date.now() - entry.timestamp > ATTENDANCE_EXPIRY) {
        console.log('⏰ Attendance cache expired');
        await this.clearAttendanceCache(uid);
        return null;
      }

      console.log(`📦 Retrieved ${entry.data.length} cached attendance records`);
      return entry.data.map(r => ({
        ...r,
        date: new Date(r.date),
      }));
    } catch (error) {
      console.error('Failed to get cached attendance records:', error);
      return null;
    }
  }

  async clearAttendanceCache(uid: string): Promise<void> {
    await AsyncStorage.removeItem(`${CACHE_KEYS.ATTENDANCE}${uid}`);
  }

  // Clear all caches for a user
  async clearAllUserCaches(uid: string): Promise<void> {
    await Promise.all([
      this.clearUserProfileCache(uid),
      this.clearSubjectsCache(uid),
      this.clearTimetableCache(uid),
      this.clearAttendanceCache(uid),
    ]);
    console.log('🗑️ Cleared all caches for user:', uid);
  }

  // Clear all expired caches
  async clearExpiredCaches(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        Object.values(CACHE_KEYS).some(prefix => key.startsWith(prefix))
      );

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            const entry = JSON.parse(value);
            if (entry.timestamp && Date.now() - entry.timestamp > CACHE_EXPIRY) {
              await AsyncStorage.removeItem(key);
              console.log('🗑️ Removed expired cache:', key);
            }
          } catch {
            // Invalid cache entry, remove it
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Failed to clear expired caches:', error);
    }
  }
}

export default new CacheService();
