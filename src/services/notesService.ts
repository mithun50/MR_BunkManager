import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  serverTimestamp,
  increment,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Note,
  CreateNoteInput,
  NoteFilters,
  PaginatedResult,
  FeedNote,
} from '../types/notes';
import { UserProfile } from '../types/user';
import googleDriveService from './googleDriveService';

const NOTES_COLLECTION = 'notes';
const PAGE_SIZE = 10;
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

class NotesService {
  // Create a new note
  async createNote(
    authorProfile: UserProfile,
    input: CreateNoteInput
  ): Promise<Note> {
    const noteId = `${authorProfile.uid}_${Date.now()}`;
    const noteRef = doc(db, NOTES_COLLECTION, noteId);

    const note: Record<string, any> = {
      id: noteId,
      authorId: authorProfile.uid,
      authorName: authorProfile.displayName || 'Anonymous',
      authorPhotoURL: authorProfile.photoURL || null,
      authorRollNumber: authorProfile.rollNumber || null,
      authorCollege: authorProfile.college || null,
      authorCourse: authorProfile.course || null,

      title: input.title || 'Untitled',
      description: input.description || null,
      contentType: input.contentType || 'text',
      content: input.content || null,

      subject: input.subject || null,
      subjectCode: input.subjectCode || null,
      tags: input.tags || [],

      isPublic: input.isPublic ?? true,

      likesCount: 0,
      commentsCount: 0,
      savesCount: 0,
      viewsCount: 0,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only add optional file fields if they have values
    if (input.fileUrl) note.fileUrl = input.fileUrl;
    if (input.fileName) note.fileName = input.fileName;
    if (input.fileSize !== undefined) note.fileSize = input.fileSize;
    if (input.thumbnailUrl) note.thumbnailUrl = input.thumbnailUrl;

    await setDoc(noteRef, note);

    // Update user's notes count
    const userStatsRef = doc(db, 'users', authorProfile.uid, 'stats', 'notes');
    await setDoc(
      userStatsRef,
      { notesCount: increment(1), updatedAt: serverTimestamp() },
      { merge: true }
    );

    // Notify followers about the new note (fire and forget - don't block)
    this.notifyFollowers(authorProfile.uid, {
      authorName: authorProfile.displayName || 'Someone',
      noteId,
      title: input.title,
      subject: input.subject,
    }).catch((error) => {
      console.error('Error notifying followers:', error);
    });

    return {
      ...note,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Notify followers when a new note is created
  private async notifyFollowers(authorId: string, noteInfo: {
    authorName: string;
    noteId: string;
    title: string;
    subject?: string;
  }): Promise<void> {
    try {
      const response = await fetch(`${BACKEND_URL}/notify-followers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorId,
          authorName: noteInfo.authorName,
          noteId: noteInfo.noteId,
          title: noteInfo.title,
          subject: noteInfo.subject,
        }),
      });

      const data = await response.json();
      if (data.success) {
        console.log('✅ Followers notified successfully');
      } else {
        console.error('❌ Failed to notify followers:', data.error);
      }
    } catch (error) {
      console.error('❌ Error calling notify-followers endpoint:', error);
    }
  }

  // Get a single note by ID
  async getNote(noteId: string): Promise<Note | null> {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    const noteSnap = await getDoc(noteRef);

    if (!noteSnap.exists()) {
      return null;
    }

    const data = noteSnap.data();
    return this.convertToNote(data);
  }

  // Get note with user context (liked, saved, following)
  async getNoteWithContext(
    noteId: string,
    currentUserId: string
  ): Promise<FeedNote | null> {
    const note = await this.getNote(noteId);
    if (!note) return null;

    // Increment view count
    await updateDoc(doc(db, NOTES_COLLECTION, noteId), {
      viewsCount: increment(1),
    });

    const [isLiked, isSaved, isFollowing] = await Promise.all([
      this.isNoteLiked(noteId, currentUserId),
      this.isNoteSaved(noteId, currentUserId),
      this.isFollowing(currentUserId, note.authorId),
    ]);

    return {
      ...note,
      isLiked,
      isSaved,
      isFollowingAuthor: isFollowing,
    };
  }

  // Update a note
  async updateNote(
    noteId: string,
    authorId: string,
    updates: Partial<CreateNoteInput>
  ): Promise<void> {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    const noteSnap = await getDoc(noteRef);

    if (!noteSnap.exists()) {
      throw new Error('Note not found');
    }

    if (noteSnap.data().authorId !== authorId) {
      throw new Error('Unauthorized to edit this note');
    }

    await updateDoc(noteRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  // Delete a note
  async deleteNote(noteId: string, authorId: string): Promise<void> {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    const noteSnap = await getDoc(noteRef);

    if (!noteSnap.exists()) {
      throw new Error('Note not found');
    }

    const noteData = noteSnap.data();
    if (noteData.authorId !== authorId) {
      throw new Error('Unauthorized to delete this note');
    }

    // Delete file from Google Drive if exists
    if (noteData.fileUrl) {
      try {
        const fileId = this.extractFileIdFromUrl(noteData.fileUrl);
        if (fileId) {
          await googleDriveService.deleteFile(fileId);
        }
      } catch (error) {
        console.error('Error deleting file from Drive:', error);
      }
    }

    await deleteDoc(noteRef);

    // Update user's notes count
    const userStatsRef = doc(db, 'users', authorId, 'stats', 'notes');
    await setDoc(
      userStatsRef,
      { notesCount: increment(-1), updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  // Get feed notes from followed users
  async getFeedNotes(
    currentUserId: string,
    followingIds: string[],
    lastDoc?: DocumentSnapshot
  ): Promise<PaginatedResult<FeedNote>> {
    if (followingIds.length === 0) {
      return { items: [], lastDoc: null, hasMore: false };
    }

    // Firestore 'in' query limit is 30
    const limitedIds = followingIds.slice(0, 30);

    let q = query(
      collection(db, NOTES_COLLECTION),
      where('authorId', 'in', limitedIds),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const notes = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const note = this.convertToNote(docSnap.data());
        const [isLiked, isSaved] = await Promise.all([
          this.isNoteLiked(note.id, currentUserId),
          this.isNoteSaved(note.id, currentUserId),
        ]);
        return {
          ...note,
          isLiked,
          isSaved,
          isFollowingAuthor: true,
        };
      })
    );

    return {
      items: notes,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === PAGE_SIZE,
    };
  }

  // Get explore/trending notes
  async getExploreNotes(
    currentUserId: string,
    filters: NoteFilters,
    lastDoc?: DocumentSnapshot
  ): Promise<PaginatedResult<FeedNote>> {
    let q = query(
      collection(db, NOTES_COLLECTION),
      where('isPublic', '==', true)
    );

    // Apply filters
    if (filters.college) {
      q = query(q, where('authorCollege', '==', filters.college));
    }
    if (filters.course) {
      q = query(q, where('authorCourse', '==', filters.course));
    }
    if (filters.subject) {
      q = query(q, where('subject', '==', filters.subject));
    }
    if (filters.contentType) {
      q = query(q, where('contentType', '==', filters.contentType));
    }
    if (filters.authorId) {
      q = query(q, where('authorId', '==', filters.authorId));
    }

    // Sort
    if (filters.sortBy === 'popular') {
      q = query(q, orderBy('likesCount', 'desc'), limit(PAGE_SIZE));
    } else if (filters.sortBy === 'trending') {
      q = query(q, orderBy('viewsCount', 'desc'), limit(PAGE_SIZE));
    } else {
      q = query(q, orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const notes = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const note = this.convertToNote(docSnap.data());
        const [isLiked, isSaved, isFollowing] = await Promise.all([
          this.isNoteLiked(note.id, currentUserId),
          this.isNoteSaved(note.id, currentUserId),
          this.isFollowing(currentUserId, note.authorId),
        ]);
        return {
          ...note,
          isLiked,
          isSaved,
          isFollowingAuthor: isFollowing,
        };
      })
    );

    return {
      items: notes,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === PAGE_SIZE,
    };
  }

  // Get user's own notes
  async getUserNotes(
    userId: string,
    lastDoc?: DocumentSnapshot
  ): Promise<PaginatedResult<Note>> {
    let q = query(
      collection(db, NOTES_COLLECTION),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const notes = snapshot.docs.map((docSnap) =>
      this.convertToNote(docSnap.data())
    );

    return {
      items: notes,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === PAGE_SIZE,
    };
  }

  // Search notes
  async searchNotes(
    currentUserId: string,
    searchQuery: string,
    filters: NoteFilters
  ): Promise<FeedNote[]> {
    // For now, search by title prefix (Firestore limitation)
    // Consider using Algolia or Typesense for full-text search
    const q = query(
      collection(db, NOTES_COLLECTION),
      where('isPublic', '==', true),
      where('title', '>=', searchQuery),
      where('title', '<=', searchQuery + '\uf8ff'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    const notes = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const note = this.convertToNote(docSnap.data());
        const [isLiked, isSaved, isFollowing] = await Promise.all([
          this.isNoteLiked(note.id, currentUserId),
          this.isNoteSaved(note.id, currentUserId),
          this.isFollowing(currentUserId, note.authorId),
        ]);
        return {
          ...note,
          isLiked,
          isSaved,
          isFollowingAuthor: isFollowing,
        };
      })
    );

    return notes;
  }

  // Helper: Check if note is liked by user
  private async isNoteLiked(noteId: string, userId: string): Promise<boolean> {
    const likeRef = doc(db, NOTES_COLLECTION, noteId, 'likes', userId);
    const likeSnap = await getDoc(likeRef);
    return likeSnap.exists();
  }

  // Helper: Check if note is saved by user
  private async isNoteSaved(noteId: string, userId: string): Promise<boolean> {
    const saveRef = doc(db, 'users', userId, 'savedNotes', noteId);
    const saveSnap = await getDoc(saveRef);
    return saveSnap.exists();
  }

  // Helper: Check if user is following another user
  private async isFollowing(
    followerId: string,
    followingId: string
  ): Promise<boolean> {
    if (followerId === followingId) return false;
    const followRef = doc(db, 'users', followerId, 'following', followingId);
    const followSnap = await getDoc(followRef);
    return followSnap.exists();
  }

  // Helper: Convert Firestore data to Note type
  private convertToNote(data: any): Note {
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Note;
  }

  // Helper: Extract file ID from Google Drive URL
  private extractFileIdFromUrl(url: string): string | null {
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : null;
  }
}

export default new NotesService();
