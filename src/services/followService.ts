import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { PublicUserProfile, UserFollowStats } from '../types/notes';
import { UserProfile } from '../types/user';

class FollowService {
  // Follow a user by their UID
  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if already following
    const followRef = doc(db, 'users', followerId, 'following', followingId);
    const existingFollow = await getDoc(followRef);
    if (existingFollow.exists()) {
      return; // Already following
    }

    // Add to follower's following list
    await setDoc(followRef, {
      followingId,
      createdAt: serverTimestamp(),
    });

    // Add to followee's followers list
    const followerRef = doc(db, 'users', followingId, 'followers', followerId);
    await setDoc(followerRef, {
      followerId,
      createdAt: serverTimestamp(),
    });

    // Update counts
    await Promise.all([
      this.updateFollowStats(followerId, 'followingCount', 1),
      this.updateFollowStats(followingId, 'followersCount', 1),
    ]);
  }

  // Unfollow a user
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const followRef = doc(db, 'users', followerId, 'following', followingId);
    const followerRef = doc(db, 'users', followingId, 'followers', followerId);

    await Promise.all([deleteDoc(followRef), deleteDoc(followerRef)]);

    // Update counts
    await Promise.all([
      this.updateFollowStats(followerId, 'followingCount', -1),
      this.updateFollowStats(followingId, 'followersCount', -1),
    ]);
  }

  // Check if user A is following user B
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) return false;
    const followRef = doc(db, 'users', followerId, 'following', followingId);
    const followSnap = await getDoc(followRef);
    return followSnap.exists();
  }

  // Get list of users that current user is following
  async getFollowing(userId: string): Promise<string[]> {
    const followingRef = collection(db, 'users', userId, 'following');
    const snapshot = await getDocs(followingRef);
    return snapshot.docs.map((doc) => doc.id);
  }

  // Get list of followers
  async getFollowers(userId: string): Promise<string[]> {
    const followersRef = collection(db, 'users', userId, 'followers');
    const snapshot = await getDocs(followersRef);
    return snapshot.docs.map((doc) => doc.id);
  }

  // Get follow stats for a user
  async getFollowStats(userId: string): Promise<UserFollowStats> {
    const statsRef = doc(db, 'users', userId, 'stats', 'follow');
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
      return statsSnap.data() as UserFollowStats;
    }

    return {
      followersCount: 0,
      followingCount: 0,
      notesCount: 0,
    };
  }

  // Search users by roll number
  async searchByRollNumber(
    rollNumber: string,
    currentUserId: string
  ): Promise<PublicUserProfile[]> {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('rollNumber', '>=', rollNumber.toUpperCase()),
      where('rollNumber', '<=', rollNumber.toUpperCase() + '\uf8ff'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    const users = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data() as UserProfile;
        const stats = await this.getFollowStats(data.uid);
        const isFollowing =
          currentUserId !== data.uid
            ? await this.isFollowing(currentUserId, data.uid)
            : false;

        return {
          uid: data.uid,
          displayName: data.displayName,
          photoURL: data.photoURL,
          college: data.college,
          course: data.course,
          department: data.department,
          semester: data.semester,
          rollNumber: data.rollNumber,
          section: data.section,
          followersCount: stats.followersCount,
          followingCount: stats.followingCount,
          notesCount: stats.notesCount,
          isFollowing,
        } as PublicUserProfile;
      })
    );

    // Filter out current user from results
    return users.filter((u) => u.uid !== currentUserId);
  }

  // Search users by name
  async searchByName(
    name: string,
    currentUserId: string
  ): Promise<PublicUserProfile[]> {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('displayName', '>=', name),
      where('displayName', '<=', name + '\uf8ff'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    const users = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data() as UserProfile;
        const stats = await this.getFollowStats(data.uid);
        const isFollowing =
          currentUserId !== data.uid
            ? await this.isFollowing(currentUserId, data.uid)
            : false;

        return {
          uid: data.uid,
          displayName: data.displayName,
          photoURL: data.photoURL,
          college: data.college,
          course: data.course,
          department: data.department,
          semester: data.semester,
          rollNumber: data.rollNumber,
          section: data.section,
          followersCount: stats.followersCount,
          followingCount: stats.followingCount,
          notesCount: stats.notesCount,
          isFollowing,
        } as PublicUserProfile;
      })
    );

    return users.filter((u) => u.uid !== currentUserId);
  }

  // Get public profile of a user
  async getPublicProfile(
    userId: string,
    currentUserId: string
  ): Promise<PublicUserProfile | null> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    const data = userSnap.data() as UserProfile;
    const stats = await this.getFollowStats(userId);
    const isFollowing =
      currentUserId !== userId
        ? await this.isFollowing(currentUserId, userId)
        : false;

    return {
      uid: data.uid,
      displayName: data.displayName,
      photoURL: data.photoURL,
      college: data.college,
      course: data.course,
      department: data.department,
      semester: data.semester,
      rollNumber: data.rollNumber,
      section: data.section,
      followersCount: stats.followersCount,
      followingCount: stats.followingCount,
      notesCount: stats.notesCount,
      isFollowing,
    };
  }

  // Get following users with profiles
  async getFollowingProfiles(
    userId: string,
    currentUserId: string
  ): Promise<PublicUserProfile[]> {
    const followingIds = await this.getFollowing(userId);
    const profiles = await Promise.all(
      followingIds.map((id) => this.getPublicProfile(id, currentUserId))
    );
    return profiles.filter((p): p is PublicUserProfile => p !== null);
  }

  // Get follower users with profiles
  async getFollowerProfiles(
    userId: string,
    currentUserId: string
  ): Promise<PublicUserProfile[]> {
    const followerIds = await this.getFollowers(userId);
    const profiles = await Promise.all(
      followerIds.map((id) => this.getPublicProfile(id, currentUserId))
    );
    return profiles.filter((p): p is PublicUserProfile => p !== null);
  }

  // Get suggested users to follow (same college/course)
  async getSuggestedUsers(
    currentUser: UserProfile,
    limitCount: number = 10
  ): Promise<PublicUserProfile[]> {
    const usersRef = collection(db, 'users');

    // Get users from same college
    const q = query(
      usersRef,
      where('college', '==', currentUser.college),
      where('course', '==', currentUser.course),
      limit(limitCount + 1)
    );

    const snapshot = await getDocs(q);
    const followingIds = await this.getFollowing(currentUser.uid);

    const users = await Promise.all(
      snapshot.docs
        .filter(
          (docSnap) =>
            docSnap.id !== currentUser.uid &&
            !followingIds.includes(docSnap.id)
        )
        .map(async (docSnap) => {
          const data = docSnap.data() as UserProfile;
          const stats = await this.getFollowStats(data.uid);

          return {
            uid: data.uid,
            displayName: data.displayName,
            photoURL: data.photoURL,
            college: data.college,
            course: data.course,
            department: data.department,
            semester: data.semester,
            rollNumber: data.rollNumber,
            section: data.section,
            followersCount: stats.followersCount,
            followingCount: stats.followingCount,
            notesCount: stats.notesCount,
            isFollowing: false,
          } as PublicUserProfile;
        })
    );

    return users.slice(0, limitCount);
  }

  // Helper: Update follow stats
  private async updateFollowStats(
    userId: string,
    field: 'followersCount' | 'followingCount',
    delta: number
  ): Promise<void> {
    const statsRef = doc(db, 'users', userId, 'stats', 'follow');
    await setDoc(
      statsRef,
      {
        [field]: increment(delta),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

export default new FollowService();
