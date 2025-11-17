import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ProgressBar, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import firestoreService from '../../services/firestoreService';
import imageUploadService from '../../services/imageUploadService';
import ProfileSetupScreen, { ProfileData } from './ProfileSetupScreen';
import TimetableUploadScreen from './TimetableUploadScreen';
import AttendanceSettingsScreen from './AttendanceSettingsScreen';
import { TimetableEntry } from '../../types/user';

export default function OnboardingContainer() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);

  const totalSteps = 3;
  const progress = (currentStep + 1) / totalSteps;

  const handleProfileNext = (data: ProfileData) => {
    setProfileData(data);
    setCurrentStep(1);
  };

  const handleTimetableNext = (timetable: TimetableEntry[]) => {
    setTimetableData(timetable);
    setCurrentStep(2);
  };

  const handleTimetableSkip = () => {
    setTimetableData([]);
    setCurrentStep(2);
  };

  const handleComplete = async (minimumAttendance: number) => {
    if (!user || !profileData) return;

    try {
      let photoURL = profileData.photoURL;

      // Upload avatar to Catbox if exists
      if (profileData.photoURL && profileData.photoURL.startsWith('file://')) {
        try {
          // Upload to Catbox.moe (FREE, no API key needed) and get URL
          photoURL = await imageUploadService.uploadImage(profileData.photoURL);
          console.log('Avatar uploaded to Catbox:', photoURL);
        } catch (uploadError) {
          console.warn('Avatar upload failed, continuing without avatar:', uploadError);
          // Continue without avatar - it's optional
          photoURL = undefined;
        }
      }

      // Prepare user profile data (exclude undefined fields)
      const userProfileData: any = {
        uid: user.uid,
        email: user.email || '',
        displayName: profileData.displayName,
        college: profileData.college,
        course: profileData.course,
        department: profileData.department,
        semester: profileData.semester,
        rollNumber: profileData.rollNumber,
        minimumAttendance,
        onboardingCompleted: true, // Mark as completed immediately
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Only add optional fields if they exist
      if (photoURL) {
        userProfileData.photoURL = photoURL;
      }
      if (profileData.section) {
        userProfileData.section = profileData.section;
      }

      // Save user profile to Firestore
      await firestoreService.createUserProfile(user.uid, userProfileData);

      // Save timetable and create subjects if provided
      if (timetableData.length > 0) {
        await firestoreService.saveTimetable(user.uid, timetableData);

        // Extract unique subjects from timetable (by subject name + code combination)
        const uniqueSubjects = new Map<string, TimetableEntry>();
        timetableData.forEach(entry => {
          // Create unique key using subject name and code (if available)
          const uniqueKey = `${entry.subject}-${entry.subjectCode || 'no-code'}`.toLowerCase();
          if (!uniqueSubjects.has(uniqueKey)) {
            uniqueSubjects.set(uniqueKey, entry);
          }
        });

        // Get existing subjects to avoid duplicates
        const existingSubjects = await firestoreService.getSubjects(user.uid);
        const existingSubjectKeys = new Set(
          existingSubjects.map(s => `${s.name}-${s.code || 'no-code'}`.toLowerCase())
        );

        // Create subject records for attendance tracking with all available details (avoid duplicates)
        const subjectPromises = Array.from(uniqueSubjects.values())
          .filter(entry => {
            const key = `${entry.subject}-${entry.subjectCode || 'no-code'}`.toLowerCase();
            return !existingSubjectKeys.has(key); // Only add if doesn't exist
          })
          .map(entry => {
            const subject: any = {
              id: `subject_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: entry.subject,
              code: entry.subjectCode || '',
              type: entry.type || 'lecture',
              totalClasses: 0,
              attendedClasses: 0,
              attendancePercentage: 0,
              lastUpdated: new Date(),
            };

            // Add optional fields if available
            if (entry.faculty) {
              subject.faculty = entry.faculty;
            }
            if (entry.room) {
              subject.room = entry.room;
            }

            return firestoreService.addSubject(user.uid, subject);
          });

        await Promise.all(subjectPromises);
      }

      console.log('Onboarding completed successfully, navigating to dashboard...');

      // Navigate to tabs immediately - the onboardingCompleted flag is already set in Firestore
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Onboarding completion error:', error);
      alert('Failed to complete setup. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.content}>
        {/* Progress Bar */}
        <ProgressBar
          progress={progress}
          color={theme.colors.primary}
          style={styles.progressBar}
        />

        {/* Step Content */}
        {currentStep === 0 && (
          <ProfileSetupScreen onNext={handleProfileNext} initialData={profileData || undefined} />
        )}

        {currentStep === 1 && (
          <TimetableUploadScreen onNext={handleTimetableNext} onSkip={handleTimetableSkip} />
        )}

        {currentStep === 2 && (
          <AttendanceSettingsScreen onComplete={handleComplete} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  progressBar: {
    height: 4,
  },
});
