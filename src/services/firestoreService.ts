import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, TimetableEntry, Subject, AttendanceRecord } from '../types/user';

class FirestoreService {
  // User Profile Operations
  async createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...data,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserProfile;
    }
    return null;
  }

  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async completeOnboarding(uid: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      onboardingCompleted: true,
      updatedAt: serverTimestamp(),
    });
  }

  // Timetable Operations
  async saveTimetable(uid: string, timetable: TimetableEntry[]): Promise<void> {
    const timetableRef = collection(db, 'users', uid, 'timetable');

    // Delete existing timetable
    const existingQuery = query(timetableRef);
    const existingDocs = await getDocs(existingQuery);

    // Add new timetable entries
    const promises = timetable.map(entry =>
      addDoc(timetableRef, entry)
    );

    await Promise.all(promises);
  }

  async getTimetable(uid: string): Promise<TimetableEntry[]> {
    const timetableRef = collection(db, 'users', uid, 'timetable');
    const querySnapshot = await getDocs(timetableRef);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TimetableEntry[];
  }

  // Subject Operations
  async getSubjects(uid: string): Promise<Subject[]> {
    const subjectsRef = collection(db, 'users', uid, 'subjects');
    const querySnapshot = await getDocs(subjectsRef);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      };
    }) as Subject[];
  }

  async addSubject(uid: string, subject: Subject): Promise<void> {
    const subjectRef = doc(db, 'users', uid, 'subjects', subject.id);
    await setDoc(subjectRef, {
      ...subject,
      lastUpdated: serverTimestamp(),
    });
  }

  async updateSubjectAttendance(uid: string, subjectId: string, attended: boolean): Promise<void> {
    const subjectRef = doc(db, 'users', uid, 'subjects', subjectId);
    const subjectSnap = await getDoc(subjectRef);

    if (subjectSnap.exists()) {
      const currentData = subjectSnap.data() as Subject;
      const newTotalClasses = (currentData.totalClasses || 0) + 1;
      const newAttendedClasses = (currentData.attendedClasses || 0) + (attended ? 1 : 0);
      const attendancePercentage = newTotalClasses > 0 ? (newAttendedClasses / newTotalClasses) * 100 : 0;

      await updateDoc(subjectRef, {
        totalClasses: newTotalClasses,
        attendedClasses: newAttendedClasses,
        attendancePercentage,
        lastUpdated: serverTimestamp(),
      });
    }
  }

  async deleteSubject(uid: string, subjectId: string): Promise<void> {
    const subjectRef = doc(db, 'users', uid, 'subjects', subjectId);
    await updateDoc(subjectRef, { deleted: true });
  }

  // Attendance Records
  async checkAttendanceExists(uid: string, subjectId: string, date: Date): Promise<boolean> {
    // Get all attendance records for this subject
    const recordsRef = collection(db, 'users', uid, 'attendance');
    const q = query(recordsRef, where('subjectId', '==', subjectId));
    const querySnapshot = await getDocs(q);

    // Check if any record matches the date
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

    for (const docSnap of querySnapshot.docs) {
      const recordDate = docSnap.data().date?.toDate();
      if (recordDate) {
        const recordDateStr = recordDate.toISOString().split('T')[0];
        if (recordDateStr === dateStr) {
          return true;
        }
      }
    }

    return false;
  }

  async addAttendanceRecord(uid: string, record: AttendanceRecord): Promise<void> {
    const recordRef = doc(db, 'users', uid, 'attendance', record.id);
    await setDoc(recordRef, {
      ...record,
      date: Timestamp.fromDate(record.date),
    });
  }

  async getAttendanceRecords(uid: string, startDate?: Date, endDate?: Date): Promise<AttendanceRecord[]> {
    const recordsRef = collection(db, 'users', uid, 'attendance');
    let q = query(recordsRef);

    if (startDate && endDate) {
      q = query(
        recordsRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      );
    }

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
    })) as AttendanceRecord[];
  }
}

export default new FirestoreService();
