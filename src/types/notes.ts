// Notes & Collaborative Learning Types

export type NoteContentType = 'text' | 'pdf' | 'image' | 'link';

export interface Note {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  authorRollNumber: string;
  authorCollege: string;
  authorCourse: string;

  // Content
  title: string;
  description?: string;
  contentType: NoteContentType;
  content: string; // Rich text for 'text', URL for others
  fileUrl?: string; // For PDF/image uploads
  fileName?: string;
  fileSize?: number; // in bytes
  thumbnailUrl?: string; // For PDFs/images preview

  // Categorization
  subject?: string;
  subjectCode?: string;
  tags: string[];

  // Visibility
  isPublic: boolean;

  // Stats
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  viewsCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteComment {
  id: string;
  noteId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  authorRollNumber: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface NoteLike {
  id: string;
  noteId: string;
  userId: string;
  createdAt: Date;
}

export interface SavedNote {
  id: string;
  noteId: string;
  userId: string;
  savedAt: Date;
}

// Follow System Types
export interface FollowRelation {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface UserFollowStats {
  followersCount: number;
  followingCount: number;
  notesCount: number;
}

// Public user profile for display
export interface PublicUserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  college: string;
  course: string;
  department: string;
  semester: string;
  rollNumber: string;
  section?: string;
  followersCount: number;
  followingCount: number;
  notesCount: number;
  isFollowing?: boolean; // For current user context
}

// Feed item extends Note with author following status
export interface FeedNote extends Note {
  isLiked: boolean;
  isSaved: boolean;
  isFollowingAuthor: boolean;
}

// Create note input
export interface CreateNoteInput {
  title: string;
  description?: string;
  contentType: NoteContentType;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  subject?: string;
  subjectCode?: string;
  tags: string[];
  isPublic: boolean;
}

// Note filters for explore/search
export interface NoteFilters {
  college?: string;
  course?: string;
  semester?: string;
  subject?: string;
  contentType?: NoteContentType;
  tags?: string[];
  authorId?: string;
  sortBy?: 'recent' | 'popular' | 'trending';
}

// Pagination
export interface PaginatedResult<T> {
  items: T[];
  lastDoc: any; // Firestore DocumentSnapshot for cursor
  hasMore: boolean;
}
