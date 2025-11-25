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
  Timestamp,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  increment,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Group, GroupMessage, GroupMember } from '../types/groups';

// Backend URL for notifications
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://mr-bunk-manager-backend.vercel.app';

class GroupsService {
  // ==================== GROUP OPERATIONS ====================

  /**
   * Create a new group
   * @overload Simple signature for component usage
   */
  async createGroup(
    name: string,
    description: string,
    category: 'study' | 'project' | 'social' | 'general',
    isPrivate: boolean,
    userId: string,
    userName: string,
    userPhotoURL?: string,
    college?: string,
    course?: string,
    department?: string
  ): Promise<string> {
    try {
      const groupRef = collection(db, 'groups');

      const newGroup = {
        name,
        description,
        createdBy: userId,
        createdByName: userName,
        createdByPhotoURL: userPhotoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        members: [],
        memberCount: 0,
        isPrivate,
        category,
        lastActivity: serverTimestamp(),
        college: college || null,
        course: course || null,
        department: department || null,
      };

      const docRef = await addDoc(groupRef, newGroup);
      console.log('✅ Group created:', docRef.id);

      // Add creator as admin member
      await this.addMember(docRef.id, userId, userName, userPhotoURL, 'admin');

      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating group:', error);
      throw error;
    }
  }

  /**
   * Get a single group by ID
   */
  async getGroup(groupId: string): Promise<Group | null> {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupSnap = await getDoc(groupRef);

      if (groupSnap.exists()) {
        const data = groupSnap.data();
        return {
          id: groupSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastActivity: data.lastActivity?.toDate() || new Date(),
        } as Group;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching group:', error);
      throw error;
    }
  }

  /**
   * Get all public groups
   */
  async getPublicGroups(limitCount: number = 50): Promise<Group[]> {
    try {
      const groupsRef = collection(db, 'groups');
      // Simple query without orderBy to avoid composite index requirement
      const q = query(
        groupsRef,
        where('isPrivate', '==', false),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);

      const groups = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastActivity: data.lastActivity?.toDate() || new Date(),
        } as Group;
      });

      // Sort by lastActivity client-side
      groups.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
      return groups;
    } catch (error) {
      console.error('❌ Error fetching public groups:', error);
      throw error;
    }
  }

  /**
   * Get user's groups
   */
  async getUserGroups(userId: string): Promise<Group[]> {
    try {
      const groupsRef = collection(db, 'groups');
      // Simple query without orderBy to avoid composite index requirement
      const q = query(
        groupsRef,
        where('members', 'array-contains', userId)
      );

      const querySnapshot = await getDocs(q);

      const groups = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastActivity: data.lastActivity?.toDate() || new Date(),
        } as Group;
      });

      // Sort by lastActivity client-side
      groups.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
      return groups;
    } catch (error) {
      console.error('❌ Error fetching user groups:', error);
      throw error;
    }
  }

  /**
   * Subscribe to user's groups in real-time
   */
  subscribeToMyGroups(userId: string, callback: (groups: Group[]) => void): Unsubscribe {
    const groupsRef = collection(db, 'groups');
    // Simple query without orderBy to avoid composite index requirement
    const q = query(
      groupsRef,
      where('members', 'array-contains', userId)
    );

    return onSnapshot(q, (snapshot) => {
      const groups = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastActivity: data.lastActivity?.toDate() || new Date(),
        } as Group;
      });
      // Sort by lastActivity client-side
      groups.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
      callback(groups);
    }, (error) => {
      console.error('❌ Error in groups subscription:', error);
      // Call with empty array on error so UI doesn't hang
      callback([]);
    });
  }

  /**
   * Join a public group
   */
  async joinGroup(
    groupId: string,
    userId: string,
    userName: string,
    userPhotoURL?: string
  ): Promise<void> {
    try {
      await this.addMember(groupId, userId, userName, userPhotoURL, 'member');
      console.log('✅ User joined group:', userId, groupId);
    } catch (error) {
      console.error('❌ Error joining group:', error);
      throw error;
    }
  }

  /**
   * Leave a group
   */
  async leaveGroup(groupId: string, userId: string): Promise<void> {
    try {
      await this.removeMember(groupId, userId);
      console.log('✅ User left group:', userId, groupId);
    } catch (error) {
      console.error('❌ Error leaving group:', error);
      throw error;
    }
  }

  /**
   * Update group details
   */
  async updateGroup(groupId: string, updates: Partial<Group>): Promise<void> {
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Group updated:', groupId);
    } catch (error) {
      console.error('❌ Error updating group:', error);
      throw error;
    }
  }

  /**
   * Delete a group
   */
  async deleteGroup(groupId: string): Promise<void> {
    try {
      // Delete all messages
      const messagesRef = collection(db, 'groups', groupId, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      const deleteMessagePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteMessagePromises);

      // Delete all members
      const membersRef = collection(db, 'groups', groupId, 'members');
      const membersSnapshot = await getDocs(membersRef);
      const deleteMemberPromises = membersSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteMemberPromises);

      // Delete the group
      const groupRef = doc(db, 'groups', groupId);
      await deleteDoc(groupRef);

      console.log('✅ Group deleted:', groupId);
    } catch (error) {
      console.error('❌ Error deleting group:', error);
      throw error;
    }
  }

  // ==================== MEMBER OPERATIONS ====================

  /**
   * Add a member to a group
   */
  async addMember(
    groupId: string,
    userId: string,
    userName: string,
    userPhotoURL: string | undefined,
    role: 'admin' | 'member' = 'member'
  ): Promise<void> {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const memberRef = doc(db, 'groups', groupId, 'members', userId);

      // Add to members array and increment count
      await updateDoc(groupRef, {
        members: arrayUnion(userId),
        memberCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      // Add member details
      await setDoc(memberRef, {
        userId,
        userName,
        userPhotoURL: userPhotoURL || null,
        role,
        joinedAt: serverTimestamp(),
      });

      console.log('✅ Member added to group:', userId, groupId);
    } catch (error) {
      console.error('❌ Error adding member:', error);
      throw error;
    }
  }

  /**
   * Remove a member from a group
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const memberRef = doc(db, 'groups', groupId, 'members', userId);

      // Remove from members array and decrement count
      await updateDoc(groupRef, {
        members: arrayRemove(userId),
        memberCount: increment(-1),
        updatedAt: serverTimestamp(),
      });

      // Delete member details
      await deleteDoc(memberRef);

      console.log('✅ Member removed from group:', userId, groupId);
    } catch (error) {
      console.error('❌ Error removing member:', error);
      throw error;
    }
  }

  /**
   * Update a member's role in a group
   */
  async updateMemberRole(groupId: string, userId: string, newRole: 'admin' | 'member'): Promise<void> {
    try {
      const memberRef = doc(db, 'groups', groupId, 'members', userId);

      await updateDoc(memberRef, {
        role: newRole,
      });

      console.log('✅ Member role updated:', userId, newRole);
    } catch (error) {
      console.error('❌ Error updating member role:', error);
      throw error;
    }
  }

  /**
   * Get all members of a group
   */
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const membersRef = collection(db, 'groups', groupId, 'members');
      const querySnapshot = await getDocs(membersRef);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          joinedAt: data.joinedAt?.toDate() || new Date(),
        } as GroupMember;
      });
    } catch (error) {
      console.error('❌ Error fetching group members:', error);
      throw error;
    }
  }

  /**
   * Check if user is member of a group
   */
  async isMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupSnap = await getDoc(groupRef);

      if (groupSnap.exists()) {
        const members = groupSnap.data().members || [];
        return members.includes(userId);
      }
      return false;
    } catch (error) {
      console.error('❌ Error checking membership:', error);
      return false;
    }
  }

  // ==================== MESSAGE OPERATIONS ====================

  /**
   * Send a message to a group
   */
  async sendMessage(
    groupId: string,
    userId: string,
    userName: string,
    userPhotoURL: string | undefined,
    message: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: string
  ): Promise<string> {
    try {
      const messagesRef = collection(db, 'groups', groupId, 'messages');
      const groupRef = doc(db, 'groups', groupId);

      const newMessage = {
        groupId,
        userId,
        userName,
        userPhotoURL: userPhotoURL || null,
        message,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        createdAt: serverTimestamp(),
        edited: false,
      };

      const docRef = await addDoc(messagesRef, newMessage);

      // Update group's last activity
      await updateDoc(groupRef, {
        lastActivity: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Message sent:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a group
   */
  async getMessages(groupId: string, limitCount: number = 50): Promise<GroupMessage[]> {
    try {
      const messagesRef = collection(db, 'groups', groupId, 'messages');
      const q = query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);

      const messages = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          editedAt: data.editedAt?.toDate(),
        } as GroupMessage;
      });

      // Reverse to show oldest first
      return messages.reverse();
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Listen to real-time messages
   */
  subscribeToMessages(
    groupId: string,
    callback: (messages: GroupMessage[]) => void,
    limitCount: number = 50
  ): Unsubscribe {
    const messagesRef = collection(db, 'groups', groupId, 'messages');
    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          editedAt: data.editedAt?.toDate(),
        } as GroupMessage;
      });

      // Reverse to show oldest first
      callback(messages.reverse());
    }, (error) => {
      console.error('❌ Error in messages subscription:', error);
    });
  }

  /**
   * Delete a message
   */
  async deleteMessage(groupId: string, messageId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'groups', groupId, 'messages', messageId);
      await deleteDoc(messageRef);
      console.log('✅ Message deleted:', messageId);
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Edit a message
   */
  async editMessage(groupId: string, messageId: string, newMessage: string): Promise<void> {
    try {
      const messageRef = doc(db, 'groups', groupId, 'messages', messageId);
      await updateDoc(messageRef, {
        message: newMessage,
        edited: true,
        editedAt: serverTimestamp(),
      });
      console.log('✅ Message edited:', messageId);
    } catch (error) {
      console.error('❌ Error editing message:', error);
      throw error;
    }
  }

  // ==================== USER SEARCH OPERATIONS ====================

  /**
   * Search users by roll number to invite to group
   */
  async searchUsersByRollNumber(rollNumber: string, currentUserId: string): Promise<any[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('rollNumber', '>=', rollNumber.toUpperCase()),
        where('rollNumber', '<=', rollNumber.toUpperCase() + '\uf8ff'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map(docSnap => {
          const data = docSnap.data();
          return {
            uid: data.uid,
            displayName: data.displayName,
            photoURL: data.photoURL,
            rollNumber: data.rollNumber,
            college: data.college,
            department: data.department,
            semester: data.semester,
          };
        })
        .filter(u => u.uid !== currentUserId); // Exclude current user

      return users;
    } catch (error) {
      console.error('❌ Error searching users by roll number:', error);
      throw error;
    }
  }

  /**
   * Search users by name to invite to group
   */
  async searchUsersByName(name: string, currentUserId: string): Promise<any[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('displayName', '>=', name),
        where('displayName', '<=', name + '\uf8ff'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map(docSnap => {
          const data = docSnap.data();
          return {
            uid: data.uid,
            displayName: data.displayName,
            photoURL: data.photoURL,
            rollNumber: data.rollNumber,
            college: data.college,
            department: data.department,
            semester: data.semester,
          };
        })
        .filter(u => u.uid !== currentUserId); // Exclude current user

      return users;
    } catch (error) {
      console.error('❌ Error searching users by name:', error);
      throw error;
    }
  }

  // ==================== SEARCH OPERATIONS ====================

  /**
   * Search groups by name or description
   */
  async searchGroups(searchTerm: string, userId: string): Promise<Group[]> {
    try {
      const groupsRef = collection(db, 'groups');

      // Get all public groups and filter locally
      // Note: Firestore doesn't support full-text search natively
      const q = query(
        groupsRef,
        where('isPrivate', '==', false),
        orderBy('lastActivity', 'desc'),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      const searchLower = searchTerm.toLowerCase();

      const groups = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastActivity: data.lastActivity?.toDate() || new Date(),
          } as Group;
        })
        .filter(group =>
          group.name.toLowerCase().includes(searchLower) ||
          group.description.toLowerCase().includes(searchLower) ||
          group.category.toLowerCase().includes(searchLower)
        );

      return groups;
    } catch (error) {
      console.error('❌ Error searching groups:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATION OPERATIONS ====================

  /**
   * Notify all group members about activity (message, file, call)
   * @param groupId - Group ID
   * @param groupName - Group name for notification
   * @param senderId - User ID who triggered the notification
   * @param senderName - Name of the sender
   * @param type - Notification type: 'message', 'file', 'call'
   * @param extra - Extra data (message, fileName, isVideo)
   */
  async notifyGroupMembers(
    groupId: string,
    groupName: string,
    senderId: string,
    senderName: string,
    type: 'message' | 'file' | 'call',
    extra: { message?: string; fileName?: string; isVideo?: boolean } = {}
  ): Promise<void> {
    try {
      const response = await fetch(`${BACKEND_URL}/notify-group-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          groupName,
          senderId,
          senderName,
          type,
          extra,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Group notification sent: ${type}`, data.result);
      } else {
        console.warn('⚠️ Group notification failed:', data.error);
      }
    } catch (error) {
      // Don't throw - notifications are non-critical
      console.warn('⚠️ Failed to send group notification:', error);
    }
  }
}

export default new GroupsService();
