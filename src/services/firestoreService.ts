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
  deleteDoc,
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

    // Delete existing timetable documents first
    const existingQuery = query(timetableRef);
    const existingDocs = await getDocs(existingQuery);

    const deletePromises = existingDocs.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Add new timetable entries
    const addPromises = timetable.map(entry =>
      addDoc(timetableRef, entry)
    );

    await Promise.all(addPromises);
  }

  async getTimetable(uid: string): Promise<TimetableEntry[]> {
    const timetableRef = collection(db, 'users', uid, 'timetable');
    const querySnapshot = await getDocs(timetableRef);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TimetableEntry[];
  }

  async deleteTimetable(uid: string): Promise<void> {
    try {
      console.log('deleteTimetable called for uid:', uid);
      const timetableRef = collection(db, 'users', uid, 'timetable');
      const querySnapshot = await getDocs(timetableRef);

      console.log('Found timetable documents:', querySnapshot.docs.length);

      if (querySnapshot.docs.length === 0) {
        console.log('No timetable documents to delete');
        return;
      }

      // Delete all timetable documents
      const deletePromises = querySnapshot.docs.map(doc => {
        console.log('Deleting document:', doc.id);
        return deleteDoc(doc.ref);
      });

      await Promise.all(deletePromises);
      console.log('All timetable documents deleted successfully');
    } catch (error) {
      console.error('Error in deleteTimetable:', error);
      throw error;
    }
  }

  // Subject Operations
  async getSubjects(uid: string): Promise<Subject[]> {
    const subjectsRef = collection(db, 'users', uid, 'subjects');
    const querySnapshot = await getDocs(subjectsRef);

    return querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        };
      })
      .filter(subject => !subject.deleted) as Subject[]; // Filter out soft-deleted subjects
  }

  async addSubject(uid: string, subject: Subject): Promise<void> {
    const subjectRef = doc(db, 'users', uid, 'subjects', subject.id);
    await setDoc(subjectRef, {
      ...subject,
      lastUpdated: serverTimestamp(),
    });
  }

  async updateSubjectAttendance(uid: string, subjectId: string, attended: boolean, isLeave: boolean = false): Promise<void> {
    const subjectRef = doc(db, 'users', uid, 'subjects', subjectId);
    const subjectSnap = await getDoc(subjectRef);

    if (subjectSnap.exists()) {
      const currentData = subjectSnap.data() as Subject;

      // If it's a leave day, don't count it at all
      if (isLeave) {
        // Leave days don't affect attendance calculations
        // We only store the record but don't update totals
        return;
      }

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

  async deleteAllSubjects(uid: string): Promise<void> {
    try {
      console.log('deleteAllSubjects called for uid:', uid);
      const subjectsRef = collection(db, 'users', uid, 'subjects');
      const querySnapshot = await getDocs(subjectsRef);

      console.log('Found subjects:', querySnapshot.docs.length);

      if (querySnapshot.docs.length === 0) {
        console.log('No subjects to delete');
        return;
      }

      // Delete all subject documents
      const deletePromises = querySnapshot.docs.map(doc => {
        console.log('Deleting subject:', doc.id);
        return deleteDoc(doc.ref);
      });

      await Promise.all(deletePromises);
      console.log('All subjects deleted successfully');
    } catch (error) {
      console.error('Error in deleteAllSubjects:', error);
      throw error;
    }
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
