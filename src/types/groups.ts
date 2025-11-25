export interface Group {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdByName: string;
  createdByPhotoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  members: string[];
  memberCount: number;
  imageUrl?: string;
  isPrivate: boolean;
  category: 'study' | 'project' | 'social' | 'general';
  lastActivity?: Date;
  // Optional metadata
  college?: string;
  course?: string;
  department?: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  message: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: Date;
  // Optional metadata
  replyTo?: string; // Message ID being replied to
  edited?: boolean;
  editedAt?: Date;
}

export interface GroupMember {
  userId: string;
  userName: string;
  userPhotoURL?: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}
