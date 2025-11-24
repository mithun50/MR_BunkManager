import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  serverTimestamp,
  increment,
  updateDoc,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { NoteComment, SavedNote, PaginatedResult, Note } from '../types/notes';
import { UserProfile } from '../types/user';

const NOTES_COLLECTION = 'notes';
const PAGE_SIZE = 20;

class SocialService {
  // ==================== LIKES ====================

  // Like a note
  async likeNote(noteId: string, userId: string): Promise<void> {
    const likeRef = doc(db, NOTES_COLLECTION, noteId, 'likes', userId);
    const existingLike = await getDoc(likeRef);

    if (existingLike.exists()) {
      return; // Already liked
    }

    await setDoc(likeRef, {
      userId,
      createdAt: serverTimestamp(),
    });

    // Increment likes count on note
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      likesCount: increment(1),
    });
  }

  // Unlike a note
  async unlikeNote(noteId: string, userId: string): Promise<void> {
    const likeRef = doc(db, NOTES_COLLECTION, noteId, 'likes', userId);
    const existingLike = await getDoc(likeRef);

    if (!existingLike.exists()) {
      return; // Not liked
    }

    await deleteDoc(likeRef);

    // Decrement likes count on note
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      likesCount: increment(-1),
    });
  }

  // Toggle like
  async toggleLike(noteId: string, userId: string): Promise<boolean> {
    const likeRef = doc(db, NOTES_COLLECTION, noteId, 'likes', userId);
    const existingLike = await getDoc(likeRef);

    if (existingLike.exists()) {
      await this.unlikeNote(noteId, userId);
      return false;
    } else {
      await this.likeNote(noteId, userId);
      return true;
    }
  }

  // Check if user liked a note
  async isLiked(noteId: string, userId: string): Promise<boolean> {
    const likeRef = doc(db, NOTES_COLLECTION, noteId, 'likes', userId);
    const likeSnap = await getDoc(likeRef);
    return likeSnap.exists();
  }

  // Get users who liked a note
  async getLikedByUsers(noteId: string): Promise<string[]> {
    const likesRef = collection(db, NOTES_COLLECTION, noteId, 'likes');
    const snapshot = await getDocs(likesRef);
    return snapshot.docs.map((doc) => doc.id);
  }

  // ==================== COMMENTS ====================

  // Add a comment
  async addComment(
    noteId: string,
    author: UserProfile,
    content: string
  ): Promise<NoteComment> {
    const commentId = `${author.uid}_${Date.now()}`;
    const commentRef = doc(
      db,
      NOTES_COLLECTION,
      noteId,
      'comments',
      commentId
    );

    const comment = {
      id: commentId,
      noteId,
      authorId: author.uid,
      authorName: author.displayName,
      authorPhotoURL: author.photoURL,
      authorRollNumber: author.rollNumber,
      content,
      createdAt: serverTimestamp(),
    };

    await setDoc(commentRef, comment);

    // Increment comments count on note
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      commentsCount: increment(1),
    });

    return {
      ...comment,
      createdAt: new Date(),
    };
  }

  // Delete a comment
  async deleteComment(
    noteId: string,
    commentId: string,
    userId: string
  ): Promise<void> {
    const commentRef = doc(
      db,
      NOTES_COLLECTION,
      noteId,
      'comments',
      commentId
    );
    const commentSnap = await getDoc(commentRef);

    if (!commentSnap.exists()) {
      throw new Error('Comment not found');
    }

    if (commentSnap.data().authorId !== userId) {
      throw new Error('Unauthorized to delete this comment');
    }

    await deleteDoc(commentRef);

    // Decrement comments count on note
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      commentsCount: increment(-1),
    });
  }

  // Get comments for a note
  async getComments(
    noteId: string,
    lastDoc?: DocumentSnapshot
  ): Promise<PaginatedResult<NoteComment>> {
    let q = query(
      collection(db, NOTES_COLLECTION, noteId, 'comments'),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const comments = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
      } as NoteComment;
    });

    return {
      items: comments,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === PAGE_SIZE,
    };
  }

  // ==================== SAVES ====================

  // Save a note
  async saveNote(noteId: string, userId: string): Promise<void> {
    const saveRef = doc(db, 'users', userId, 'savedNotes', noteId);
    const existingSave = await getDoc(saveRef);

    if (existingSave.exists()) {
      return; // Already saved
    }

    await setDoc(saveRef, {
      noteId,
      savedAt: serverTimestamp(),
    });

    // Increment saves count on note
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      savesCount: increment(1),
    });
  }

  // Unsave a note
  async unsaveNote(noteId: string, userId: string): Promise<void> {
    const saveRef = doc(db, 'users', userId, 'savedNotes', noteId);
    const existingSave = await getDoc(saveRef);

    if (!existingSave.exists()) {
      return; // Not saved
    }

    await deleteDoc(saveRef);

    // Decrement saves count on note
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      savesCount: increment(-1),
    });
  }

  // Toggle save
  async toggleSave(noteId: string, userId: string): Promise<boolean> {
    const saveRef = doc(db, 'users', userId, 'savedNotes', noteId);
    const existingSave = await getDoc(saveRef);

    if (existingSave.exists()) {
      await this.unsaveNote(noteId, userId);
      return false;
    } else {
      await this.saveNote(noteId, userId);
      return true;
    }
  }

  // Check if user saved a note
  async isSaved(noteId: string, userId: string): Promise<boolean> {
    const saveRef = doc(db, 'users', userId, 'savedNotes', noteId);
    const saveSnap = await getDoc(saveRef);
    return saveSnap.exists();
  }

  // Get saved notes for user
  async getSavedNotes(
    userId: string,
    lastDoc?: DocumentSnapshot
  ): Promise<PaginatedResult<Note>> {
    let q = query(
      collection(db, 'users', userId, 'savedNotes'),
      orderBy('savedAt', 'desc'),
      limit(PAGE_SIZE)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);

    // Fetch actual note data for each saved note
    const notes = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const noteRef = doc(db, NOTES_COLLECTION, docSnap.id);
        const noteSnap = await getDoc(noteRef);

        if (!noteSnap.exists()) {
          return null;
        }

        const data = noteSnap.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Note;
      })
    );

    return {
      items: notes.filter((n): n is Note => n !== null),
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === PAGE_SIZE,
    };
  }

  // ==================== DOWNLOAD TRACKING ====================

  // Track download
  async trackDownload(noteId: string): Promise<void> {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      downloadsCount: increment(1),
    });
  }
}

export default new SocialService();
