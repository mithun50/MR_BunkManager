import { View, StyleSheet, ScrollView, Alert, Platform, Image, Pressable, useWindowDimensions } from 'react-native';
import { Text, Surface, Button, Avatar, useTheme, Divider, Appbar, Card, IconButton, Portal, Modal, SegmentedButtons, TextInput as PaperInput, Dialog, Chip, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import authService from '@/src/services/authService';
import firestoreService from '@/src/services/firestoreService';
import followService from '@/src/services/followService';
import notesService from '@/src/services/notesService';
import { router } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { UserProfile, Subject, AttendanceRecord, TimetableEntry } from '@/src/types/user';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ThemeSwitcher } from '@/src/components/ThemeSwitcher';
import DateTimePicker from '@react-native-community/datetimepicker';
import VideoLoadingScreen from '@/src/components/VideoLoadingScreen';
import imageUploadService from '@/src/services/imageUploadService';
import OnlineButton from '@/src/components/OnlineButton';
import { extractTextFromImage } from '@/src/services/ocrService';
import { parseTimetableFromText } from '@/src/services/timetableParserService';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Responsive breakpoints
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;
  const isWeb = Platform.OS === 'web';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);

  // Utility functions for consistent ID generation
  const generateTimetableId = () => `timetable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const generateSubjectId = () => `subject_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Validate time slot to prevent duplicates
  const validateTimeSlot = (entries: TimetableEntry[], newEntry: any, excludeId: string | null = null) => {
    const duplicate = entries.find(e =>
      e.id !== excludeId &&
      e.day === newEntry.day &&
      e.startTime === newEntry.startTime
    );

    if (duplicate) {
      return {
        valid: false,
        message: `${duplicate.subject} is already scheduled on ${newEntry.day} at ${newEntry.startTime}`
      };
    }

    return { valid: true, message: '' };
  };
  const [loading, setLoading] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState('');
  const [extractionPreviewImage, setExtractionPreviewImage] = useState<string | null>(null);
  const [showEditTimetable, setShowEditTimetable] = useState(false);
  const [selectedTimetableEntry, setSelectedTimetableEntry] = useState<TimetableEntry | null>(null);
  const [showDeleteTimetableEntryDialog, setShowDeleteTimetableEntryDialog] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showEditStartTimePicker, setShowEditStartTimePicker] = useState(false);
  const [showEditEndTimePicker, setShowEditEndTimePicker] = useState(false);

  // Date objects for time pickers
  const [manualStartDate, setManualStartDate] = useState(new Date());
  const [manualEndDate, setManualEndDate] = useState(new Date());
  const [editStartDate, setEditStartDate] = useState(new Date());
  const [editEndDate, setEditEndDate] = useState(new Date());

  // Manual timetable entry form
  const [manualDay, setManualDay] = useState('Monday');
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualEndTime, setManualEndTime] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualSubjectCode, setManualSubjectCode] = useState('');
  const [manualType, setManualType] = useState<'lecture' | 'lab' | 'tutorial' | 'practical' | 'seminar'>('lecture');
  const [manualRoom, setManualRoom] = useState('');
  const [manualFaculty, setManualFaculty] = useState('');

  // Edit timetable entry form
  const [editDay, setEditDay] = useState('Monday');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editSubjectCode, setEditSubjectCode] = useState('');
  const [editType, setEditType] = useState<'lecture' | 'lab' | 'tutorial' | 'practical' | 'seminar'>('lecture');
  const [editRoom, setEditRoom] = useState('');
  const [editFaculty, setEditFaculty] = useState('');

  // Edit profile modal
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editSemester, setEditSemester] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editRollNumber, setEditRollNumber] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Helper function to convert time to comparable format
  const convertTo24Hour = (time: string) => {
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':');
    let hour = parseInt(hours);

    if (period?.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (period?.toUpperCase() === 'AM' && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  // Convert Date object to time string (e.g., "09:00 AM")
  const formatTimeString = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const h = hours % 12 === 0 ? 12 : hours % 12;
    const period = hours < 12 ? 'AM' : 'PM';
    return `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Convert 12-hour format (e.g., "09:00 AM") to 24-hour format (e.g., "09:00") for HTML input
  const convertTo24HourFormat = (time12: string): string => {
    const [time, period] = time12.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);

    if (period?.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (period?.toUpperCase() === 'AM' && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  // Convert 24-hour format (e.g., "14:30") to 12-hour format (e.g., "02:30 PM") for display
  const convertTo12HourFormat = (time24: string): string => {
    const [hours, minutes] = time24.split(':');
    let hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour.toString().padStart(2, '0')}:${minutes} ${period}`;
  };

  // Convert time string to Date object
  const parseTimeString = (timeStr: string) => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    const date = new Date();
    date.setHours(hour, parseInt(minutes), 0, 0);
    return date;
  };

  // Helper function to sort timetable by day and time
  const sortTimetable = (entries: TimetableEntry[]) => {
    const dayOrder: { [key: string]: number } = {
      'monday': 0,
      'tuesday': 1,
      'wednesday': 2,
      'thursday': 3,
      'friday': 4,
      'saturday': 5,
      'sunday': 6,
    };

    return [...entries].sort((a, b) => {
      // Sort by day first (case-insensitive)
      const dayA = a.day?.toLowerCase() || '';
      const dayB = b.day?.toLowerCase() || '';
      const dayDiff = (dayOrder[dayA] ?? 7) - (dayOrder[dayB] ?? 7);
      if (dayDiff !== 0) return dayDiff;

      // If same day, sort by start time
      const timeA = convertTo24Hour(a.startTime);
      const timeB = convertTo24Hour(b.startTime);
      return timeA.localeCompare(timeB);
    });
  };

  // Load user profile and subjects from Firestore
  const loadData = useCallback(async () => {
    if (user) {
      try {
        setLoading(true);
        const [userProfile, subjectsList, timetableData, socialStats, userNotes] = await Promise.all([
          firestoreService.getUserProfile(user.uid),
          firestoreService.getSubjects(user.uid),
          firestoreService.getTimetable(user.uid),
          followService.getFollowStats(user.uid),
          notesService.getUserNotes(user.uid),
        ]);

        // Set social stats (default to 0 if undefined)
        setFollowersCount(socialStats.followersCount || 0);
        setFollowingCount(socialStats.followingCount || 0);
        setNotesCount(userNotes.items?.length || 0);

        // Filter out invalid subjects
        const validSubjects = subjectsList.filter(subject => {
          const name = subject.name?.toLowerCase()?.trim() || '';
          if (!name || name.length < 2) return false;

          const invalidKeywords = ['break', 'lunch', 'recess', 'free', 'vacant', 'empty', 'no class', 'holiday', 'off', '-', 'nil', 'na', 'n/a'];
          return !invalidKeywords.some(keyword => name.includes(keyword));
        });

        // Remove duplicate subjects (keep the one with most attendance data)
        const uniqueSubjects = new Map<string, Subject>();
        validSubjects.forEach(subject => {
          const key = `${subject.name}-${subject.code || 'no-code'}`.toLowerCase().trim();
          const existing = uniqueSubjects.get(key);

          // Keep the one with more attendance data, or the first one if equal
          if (!existing || subject.totalClasses > existing.totalClasses) {
            uniqueSubjects.set(key, subject);
          }
        });

        const deduplicatedSubjects = Array.from(uniqueSubjects.values());

        // Filter out invalid timetable entries
        const validTimetable = timetableData.filter(entry => {
          const subject = entry.subject?.toLowerCase()?.trim() || '';
          if (!subject || subject.length < 2) return false;

          const invalidKeywords = ['break', 'lunch', 'recess', 'free', 'vacant', 'empty', 'no class', 'holiday', 'off', '-', 'nil', 'na', 'n/a'];
          return !invalidKeywords.some(keyword => subject.includes(keyword));
        });

        // Sort timetable by day and time
        const sortedTimetable = sortTimetable(validTimetable);

        setProfile(userProfile);
        setSubjects(deduplicatedSubjects);
        setTimetable(sortedTimetable);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [user]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDiscardTimetable = async () => {
    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      console.log('Starting to discard timetable for user:', user.uid);

      // Delete all timetable entries AND subjects
      await Promise.all([
        firestoreService.deleteTimetable(user.uid),
        firestoreService.deleteAllSubjects(user.uid)
      ]);
      console.log('Timetable and subjects deleted from Firestore');

      // Small delay to ensure Firestore propagates the deletion
      await new Promise(resolve => setTimeout(resolve, 300));

      // Immediately clear both states
      setTimetable([]);
      setSubjects([]);
      console.log('Timetable and subjects state cleared');

      // Reload data to ensure everything is in sync
      await loadData();
      console.log('Data reloaded');

      setShowDiscardDialog(false);
      Alert.alert('Success', 'Timetable and subjects discarded successfully. All data has been removed.');
    } catch (error: any) {
      console.error('Error discarding timetable:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', `Failed to discard data: ${error.message || 'Unknown error'}`);
    }
  };

  // Helper function for platform-specific alerts
  const showPlatformAlert = (title: string, message: string, buttons?: any[]) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 1) {
        const result = window.confirm(`${title}\n\n${message}`);
        if (result && buttons[0]?.onPress) {
          buttons[0].onPress();
        } else if (!result && buttons[1]?.onPress) {
          buttons[1].onPress();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
        if (buttons?.[0]?.onPress) {
          buttons[0].onPress();
        }
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  // Handle image extraction for timetable
  const handleExtractFromImage = async () => {
    if (Platform.OS === 'web') {
      // Web: Use file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            await processExtractionImage(base64);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Native: Show options
      Alert.alert(
        'Select Timetable Image',
        'Choose how to add your timetable image',
        [
          { text: 'Take Photo', onPress: () => pickExtractionImage(true) },
          { text: 'Choose from Gallery', onPress: () => pickExtractionImage(false) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const pickExtractionImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Photo library permission is required to select images.');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
          });

      if (!result.canceled && result.assets[0]) {
        await processExtractionImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const processExtractionImage = async (imageUri: string) => {
    if (!user) return;

    setExtracting(true);
    setExtractionPreviewImage(imageUri);
    setExtractionStatus('Extracting text from image...');

    try {
      // Step 1: OCR extraction
      const ocrResult = await extractTextFromImage(imageUri);

      if (!ocrResult.success) {
        throw new Error(ocrResult.error || 'Failed to extract text from image');
      }

      setExtractionStatus('Parsing timetable data...');

      // Step 2: AI parsing
      const parseResult = await parseTimetableFromText(ocrResult.text);

      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Failed to parse timetable');
      }

      setExtracting(false);
      setExtractionPreviewImage(null);
      setExtractionStatus('');

      // Add extracted entries to existing timetable
      const newEntries = parseResult.entries.map(entry => ({
        ...entry,
        id: generateTimetableId(),
      }));

      // Check for duplicates and merge
      const existingKeys = new Set(timetable.map(e => `${e.day}-${e.startTime}-${e.subject}`.toLowerCase()));
      const uniqueNewEntries = newEntries.filter(
        e => !existingKeys.has(`${e.day}-${e.startTime}-${e.subject}`.toLowerCase())
      );

      if (uniqueNewEntries.length === 0) {
        showPlatformAlert('No New Entries', 'All extracted entries already exist in your timetable.');
        return;
      }

      const updatedTimetable = sortTimetable([...timetable, ...uniqueNewEntries]);

      // Update UI immediately
      setTimetable(updatedTimetable);

      // Save to Firestore
      await firestoreService.saveTimetable(user.uid, updatedTimetable);

      // Create subjects for new entries
      const allSubjects = await firestoreService.getSubjects(user.uid);
      const existingSubjectKeys = new Set(
        allSubjects.map(s => `${s.name}-${s.code || 'no-code'}`.toLowerCase())
      );

      for (const entry of uniqueNewEntries) {
        const subjectKey = `${entry.subject}-${entry.subjectCode || 'no-code'}`.toLowerCase();
        if (!existingSubjectKeys.has(subjectKey)) {
          const newSubject: any = {
            id: generateSubjectId(),
            name: entry.subject,
            code: entry.subjectCode || '',
            type: entry.type,
            totalClasses: 0,
            attendedClasses: 0,
            attendancePercentage: 0,
            lastUpdated: new Date(),
          };

          if (entry.faculty) newSubject.faculty = entry.faculty;
          if (entry.room) newSubject.room = entry.room;

          await firestoreService.addSubject(user.uid, newSubject);
          existingSubjectKeys.add(subjectKey);
        }
      }

      showPlatformAlert(
        'Success!',
        `Added ${uniqueNewEntries.length} new class${uniqueNewEntries.length !== 1 ? 'es' : ''} to your timetable.`
      );

      // Reload data to sync
      await loadData();
    } catch (error) {
      setExtracting(false);
      setExtractionPreviewImage(null);
      setExtractionStatus('');
      showPlatformAlert(
        'Extraction Failed',
        error instanceof Error ? error.message : 'Failed to process image. Please try again or add classes manually.'
      );
    }
  };

  const handleAddManualEntry = async () => {
    if (!user || !manualSubject.trim() || !manualStartTime.trim() || !manualEndTime.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    try {
      const entry: any = {
        id: generateTimetableId(),
        day: manualDay,
        startTime: manualStartTime,
        endTime: manualEndTime,
        subject: manualSubject.trim(),
        type: manualType,
      };

      if (manualSubjectCode.trim()) entry.subjectCode = manualSubjectCode.trim();
      if (manualRoom.trim()) entry.room = manualRoom.trim();
      if (manualFaculty.trim()) entry.faculty = manualFaculty.trim();

      // Validate time slot
      const validation = validateTimeSlot(timetable, entry);
      if (!validation.valid) {
        Alert.alert('Duplicate Time Slot', validation.message);
        return;
      }

      // Add to timetable and sort
      const updatedTimetable = sortTimetable([...timetable, entry]);

      // Update UI immediately
      setTimetable(updatedTimetable);

      // Reset form
      setManualDay('Monday');
      setManualStartTime('');
      setManualEndTime('');
      setManualSubject('');
      setManualSubjectCode('');
      setManualType('lecture');
      setManualRoom('');
      setManualFaculty('');
      setShowManualEntry(false);

      // Save to Firestore in background
      await firestoreService.saveTimetable(user.uid, updatedTimetable);

      // Check if subject exists, if not create it (check against all subjects in Firestore)
      const allSubjects = await firestoreService.getSubjects(user.uid);
      const subjectExists = allSubjects.some(s =>
        s.name.toLowerCase().trim() === entry.subject.toLowerCase().trim() &&
        (!entry.subjectCode || s.code?.toLowerCase().trim() === entry.subjectCode.toLowerCase().trim())
      );

      if (!subjectExists) {
        const newSubject: any = {
          id: generateSubjectId(),
          name: entry.subject,
          code: entry.subjectCode || '',
          type: entry.type,
          totalClasses: 0,
          attendedClasses: 0,
          attendancePercentage: 0,
          lastUpdated: new Date(),
        };

        if (entry.faculty) newSubject.faculty = entry.faculty;
        if (entry.room) newSubject.room = entry.room;

        await firestoreService.addSubject(user.uid, newSubject);
      }

      Alert.alert('Success', 'Timetable entry added');
    } catch (error) {
      console.error('Error adding manual entry:', error);
      Alert.alert('Error', 'Failed to add timetable entry');
    }
  };

  const handleEditTimetableEntry = (entry: TimetableEntry) => {
    setSelectedTimetableEntry(entry);
    setEditDay(entry.day);
    setEditStartTime(entry.startTime);
    setEditEndTime(entry.endTime);
    setEditSubject(entry.subject);
    setEditSubjectCode(entry.subjectCode || '');
    setEditType(entry.type);
    setEditRoom(entry.room || '');
    setEditFaculty(entry.faculty || '');

    // Parse time strings to Date objects for time pickers
    setEditStartDate(parseTimeString(entry.startTime));
    setEditEndDate(parseTimeString(entry.endTime));

    setShowEditTimetable(true);
  };

  const handleSaveEditTimetable = async () => {
    if (!user || !selectedTimetableEntry || !editSubject.trim() || !editStartTime.trim() || !editEndTime.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    try {
      // Validate time slot (excluding current entry)
      const editedEntry = {
        day: editDay,
        startTime: editStartTime,
        endTime: editEndTime,
        subject: editSubject.trim(),
      };

      const validation = validateTimeSlot(timetable, editedEntry, selectedTimetableEntry.id);
      if (!validation.valid) {
        Alert.alert('Duplicate Time Slot', validation.message);
        return;
      }

      // Update the timetable entry
      const updatedTimetable = sortTimetable(timetable.map(entry =>
        entry.id === selectedTimetableEntry.id
          ? {
              ...entry,
              day: editDay,
              startTime: editStartTime,
              endTime: editEndTime,
              subject: editSubject.trim(),
              subjectCode: editSubjectCode.trim() || undefined,
              type: editType,
              room: editRoom.trim() || undefined,
              faculty: editFaculty.trim() || undefined,
            }
          : entry
      ));

      // Update UI immediately
      setTimetable(updatedTimetable);
      setShowEditTimetable(false);
      setSelectedTimetableEntry(null);

      // Save to Firestore in background
      await firestoreService.saveTimetable(user.uid, updatedTimetable);

      Alert.alert('Success', 'Timetable entry updated');
    } catch (error) {
      console.error('Error updating timetable entry:', error);
      Alert.alert('Error', 'Failed to update timetable entry');
      // Reload on error to restore correct state
      await loadData();
    }
  };

  const handleDeleteTimetableEntry = async () => {
    if (!user || !selectedTimetableEntry) return;

    try {
      const deletedSubjectName = selectedTimetableEntry.subject;

      // Remove the entry from timetable
      const updatedTimetable = timetable.filter(entry => entry.id !== selectedTimetableEntry.id);

      // Check if there are any remaining timetable entries for this subject
      const remainingEntriesForSubject = updatedTimetable.filter(
        entry => entry.subject.toLowerCase().trim() === deletedSubjectName.toLowerCase().trim()
      );

      // Update UI immediately
      setTimetable(updatedTimetable);
      setShowDeleteTimetableEntryDialog(false);
      setSelectedTimetableEntry(null);

      // Save to Firestore in background
      await firestoreService.saveTimetable(user.uid, updatedTimetable);

      // If no more timetable entries for this subject, delete the subject too
      if (remainingEntriesForSubject.length === 0) {
        console.log(`No more timetable entries for "${deletedSubjectName}", deleting subject...`);

        // Find and delete the subject
        const subjectToDelete = subjects.find(
          s => s.name.toLowerCase().trim() === deletedSubjectName.toLowerCase().trim()
        );

        if (subjectToDelete) {
          await firestoreService.deleteSubject(user.uid, subjectToDelete.id);
          console.log(`Subject "${deletedSubjectName}" deleted`);

          // Update subjects list
          setSubjects(subjects.filter(s => s.id !== subjectToDelete.id));
        }
      }

      Alert.alert('Success', 'Timetable entry deleted');
    } catch (error) {
      console.error('Error deleting timetable entry:', error);
      Alert.alert('Error', 'Failed to delete timetable entry');
      // Reload on error to restore correct state
      await loadData();
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Profile editing functions
  const handleOpenEditProfile = () => {
    if (profile) {
      setEditDisplayName(profile.displayName || '');
      setEditCollege(profile.college || '');
      setEditCourse(profile.course || '');
      setEditDepartment(profile.department || '');
      setEditSemester(profile.semester || '');
      setEditSection(profile.section || '');
      setEditRollNumber(profile.rollNumber || '');
      setEditPhotoURL(profile.photoURL || '');
      setShowEditProfile(true);
    }
  };

  const handlePickAvatar = async () => {
    // Web: Use file input
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          try {
            // Upload directly to Catbox via backend proxy
            const formData = new FormData();
            formData.append('file', file);

            const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
            const response = await fetch(`${BACKEND_URL}/upload-catbox`, {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error('Upload failed');
            }

            const result = await response.json();
            if (result.success && result.url) {
              setEditPhotoURL(result.url);
              window.alert('Image uploaded successfully!');
            } else {
              throw new Error(result.error || 'Upload failed');
            }
          } catch (error: any) {
            console.error('Web avatar upload error:', error);
            window.alert('Failed to upload image: ' + (error.message || 'Unknown error'));
          }
        }
      };
      input.click();
      return;
    }

    // Native: Use ImagePicker
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant gallery permission to upload avatar');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditPhotoURL(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    // Camera not supported on web
    if (Platform.OS === 'web') {
      window.alert('Camera is not supported on web. Please use "Pick from Gallery" instead.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permission');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditPhotoURL(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    const showError = (message: string) => {
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Error', message);
      }
    };

    // Validation
    if (!editDisplayName.trim()) {
      showError('Please enter your name');
      return;
    }
    if (!editCollege.trim()) {
      showError('Please enter your college');
      return;
    }
    if (!editCourse.trim()) {
      showError('Please enter your course');
      return;
    }
    if (!editDepartment.trim()) {
      showError('Please enter your department');
      return;
    }
    if (!editSemester.trim()) {
      showError('Please enter your semester');
      return;
    }
    if (!editRollNumber.trim()) {
      showError('Please enter your roll number');
      return;
    }

    try {
      setSavingProfile(true);

      let photoURL = editPhotoURL;

      // Upload avatar if it's a local file
      if (editPhotoURL && editPhotoURL.startsWith('file://')) {
        try {
          photoURL = await imageUploadService.uploadImage(editPhotoURL);
          console.log('Avatar uploaded to Catbox:', photoURL);
        } catch (uploadError) {
          console.warn('Avatar upload failed, using existing:', uploadError);
          photoURL = profile.photoURL; // Keep existing avatar
        }
      }

      // Prepare updated profile data
      const updatedProfile: any = {
        ...profile,
        displayName: editDisplayName.trim(),
        college: editCollege.trim(),
        course: editCourse.trim(),
        department: editDepartment.trim(),
        semester: editSemester.trim(),
        rollNumber: editRollNumber.trim(),
        updatedAt: new Date(),
      };

      // Add optional fields
      if (photoURL) {
        updatedProfile.photoURL = photoURL;
      }
      if (editSection.trim()) {
        updatedProfile.section = editSection.trim();
      }

      // Update profile in Firestore
      await firestoreService.updateUserProfile(user.uid, updatedProfile);

      // Clear the author photo cache so notes show the new photo
      notesService.clearAuthorPhotoCache(user.uid);

      // Update local state
      setProfile(updatedProfile);
      setShowEditProfile(false);
      setSavingProfile(false);

      if (Platform.OS === 'web') {
        window.alert('Profile updated successfully');
      } else {
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to update profile. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
      setSavingProfile(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        elevated
        style={{ backgroundColor: theme.colors.surface }}
      >
        <MaterialCommunityIcons name="account-circle" size={24} color={theme.colors.primary} style={{ marginLeft: 16 }} />
        <Appbar.Content title="My Profile" titleStyle={{ fontWeight: 'bold' }} />
        <View style={{ marginRight: 16 }}>
          <ThemeSwitcher />
        </View>
      </Appbar.Header>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 16 },
          (isTablet || isDesktop) && styles.contentWide,
        ]}
        showsVerticalScrollIndicator={false}
      >
      {loading ? (
        <VideoLoadingScreen onFinish={() => setLoading(false)} />
      ) : (
        <>
          <Surface style={styles.profileCard}>
            {/* Display avatar from ImgBB URL or use initials */}
            {profile?.photoURL ? (
              <Avatar.Image
                size={80}
                source={{ uri: profile.photoURL }}
              />
            ) : (
              <Avatar.Text
                size={80}
                label={profile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                style={{ backgroundColor: theme.colors.primary }}
              />
            )}
            <Text variant="headlineMedium" style={styles.name}>
              {profile?.displayName || user?.displayName || 'User'}
            </Text>
            <Text variant="bodyMedium" style={styles.email}>
              {user?.email}
            </Text>
            <Button
              mode="contained-tonal"
              icon="pencil"
              onPress={handleOpenEditProfile}
              style={{ marginTop: 16 }}
            >
              Edit Profile
            </Button>
          </Surface>

          {/* Social Stats Section */}
          <Surface style={styles.socialStatsCard}>
            <Pressable
              style={styles.statItem}
              onPress={() => router.push('/create-note' as any)}
            >
              <MaterialCommunityIcons name="note-text" size={24} color={theme.colors.primary} />
              <Text variant="headlineSmall" style={styles.statNumber}>
                {notesCount}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Notes
              </Text>
            </Pressable>

            <View style={[styles.statDivider, { backgroundColor: theme.colors.outline }]} />

            <Pressable
              style={styles.statItem}
              onPress={() =>
                router.push({
                  pathname: '/user/followers',
                  params: { userId: user?.uid, tab: 'followers', userName: profile?.displayName },
                } as any)
              }
            >
              <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary} />
              <Text variant="headlineSmall" style={styles.statNumber}>
                {followersCount}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Followers
              </Text>
            </Pressable>

            <View style={[styles.statDivider, { backgroundColor: theme.colors.outline }]} />

            <Pressable
              style={styles.statItem}
              onPress={() =>
                router.push({
                  pathname: '/user/followers',
                  params: { userId: user?.uid, tab: 'following', userName: profile?.displayName },
                } as any)
              }
            >
              <MaterialCommunityIcons name="account-multiple" size={24} color={theme.colors.primary} />
              <Text variant="headlineSmall" style={styles.statNumber}>
                {followingCount}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Following
              </Text>
            </Pressable>
          </Surface>

          {/* Manage Timetable */}
          <Surface style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Manage Timetable
            </Text>
            <Divider style={styles.divider} />

            {timetable.length > 0 && (
              <View style={styles.timetableInfo}>
                <MaterialCommunityIcons name="calendar-check" size={20} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.timetableCount}>
                  {timetable.length} classes scheduled
                </Text>
              </View>
            )}

            {extracting ? (
              <Card style={{ marginVertical: 16, padding: 20 }}>
                <View style={{ alignItems: 'center' }}>
                  {extractionPreviewImage && (
                    <Image
                      source={{ uri: extractionPreviewImage }}
                      style={{ width: 150, height: 100, borderRadius: 8, marginBottom: 16 }}
                      resizeMode="contain"
                    />
                  )}
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text variant="titleMedium" style={{ marginTop: 16, textAlign: 'center' }}>
                    {extractionStatus}
                  </Text>
                  <Text variant="bodySmall" style={{ opacity: 0.6, marginTop: 8 }}>
                    This may take a few seconds...
                  </Text>
                </View>
              </Card>
            ) : (
              <View style={styles.timetableButtons}>
                {timetable.length > 0 && (
                  <Button
                    mode="outlined"
                    icon="delete"
                    onPress={() => setShowDiscardDialog(true)}
                    style={styles.timetableButton}
                    textColor={theme.colors.error}
                  >
                    Discard Timetable
                  </Button>
                )}

                <Button
                  mode="contained"
                  icon="image-search"
                  onPress={handleExtractFromImage}
                  style={styles.timetableButton}
                >
                  {Platform.OS === 'web' ? 'Extract from Image' : 'Extract from Image'}
                </Button>

                <Button
                  mode="outlined"
                  icon="pencil-plus"
                  onPress={() => setShowManualEntry(true)}
                  style={styles.timetableButton}
                >
                  Add Class Manually
                </Button>
              </View>
            )}

            {/* Display Timetable Entries */}
            {timetable.length > 0 && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleSmall" style={[styles.sectionTitle, { marginTop: 8 }]}>
                  Your Schedule ({timetable.length} entries)
                </Text>
                <View style={styles.timetableEntriesContainer}>
                  {sortTimetable(timetable).map((entry, index) => (
                    <Card key={entry.id || index} style={styles.timetableEntryCard}>
                      <Card.Content>
                        <View style={styles.timetableEntryHeader}>
                          <View style={{ flex: 1 }}>
                            <Text variant="labelSmall" style={{ opacity: 0.7 }}>
                              {entry.day} • {entry.startTime} - {entry.endTime}
                            </Text>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginTop: 4 }}>
                              {entry.subject}
                            </Text>
                            {entry.subjectCode && (
                              <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                                {entry.subjectCode}
                              </Text>
                            )}
                            <View style={styles.timetableEntryDetails}>
                              {entry.type && (
                                <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                                  {entry.type}
                                </Text>
                              )}
                              {entry.room && (
                                <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                                  • {entry.room}
                                </Text>
                              )}
                              {entry.faculty && (
                                <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                                  • {entry.faculty}
                                </Text>
                              )}
                            </View>
                          </View>
                          <View style={styles.timetableEntryActions}>
                            <IconButton
                              icon="pencil"
                              size={20}
                              iconColor={theme.colors.primary}
                              onPress={() => handleEditTimetableEntry(entry)}
                            />
                            <IconButton
                              icon="delete"
                              size={20}
                              iconColor={theme.colors.error}
                              onPress={() => {
                                setSelectedTimetableEntry(entry);
                                setShowDeleteTimetableEntryDialog(true);
                              }}
                            />
                          </View>
                        </View>
                      </Card.Content>
                    </Card>
                  ))}
                </View>
              </>
            )}
          </Surface>

          {/* Student Information */}
          {profile && (
            <Surface style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Student Information
              </Text>
              <Divider style={styles.divider} />

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.infoLabel}>College:</Text>
                <Text variant="bodyMedium" style={styles.infoValue}>{profile.college}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.infoLabel}>Department:</Text>
                <Text variant="bodyMedium" style={styles.infoValue}>{profile.department}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.infoLabel}>Semester:</Text>
                <Text variant="bodyMedium" style={styles.infoValue}>{profile.semester}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.infoLabel}>Roll Number:</Text>
                <Text variant="bodyMedium" style={styles.infoValue}>{profile.rollNumber}</Text>
              </View>

              {profile.section && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Section:</Text>
                  <Text variant="bodyMedium" style={styles.infoValue}>{profile.section}</Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.infoLabel}>Target Attendance:</Text>
                <Text variant="bodyMedium" style={[styles.infoValue, { color: theme.colors.primary }]}>
                  {profile.minimumAttendance}%
                </Text>
              </View>
            </Surface>
          )}
        </>
      )}

      {/* Developers Section */}
      <Surface style={styles.section}>
        <View style={styles.developersHeader}>
          <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary} />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Development Team
          </Text>
        </View>
        <Divider style={styles.divider} />

        {/* Developer Cards */}
        {[
          {
            name: "Nevil Dsouza",
            email: "nevilansondsouza@gmail.com",
            role: "Team Leader",
            badges: ["Core Dev", "Tester"],
            avatar: "N",
            color: "#2196F3",
          },
          {
            name: "Lavanya",
            email: "Kk7318069@gmail.com",
            role: "Developer",
            badges: ["Documentation", "Presentation"],
            avatar: "L",
            color: "#E91E63",
          },
          {
            name: "Manas Habbu",
            email: "manaskiranhabbu@gmail.com",
            role: "Developer",
            badges: ["Documentation", "Presentation", "Designer"],
            avatar: "M",
            color: "#00BCD4",
          },
          {
            name: "Manasvi R",
            email: "manasvi0523@gmail.com",
            role: "Developer",
            badges: ["Documentation", "Presentation Designer"],
            avatar: "M",
            color: "#9C27B0",
          },
          {
            name: "Mithun Gowda B",
            email: "mithungowda.b7411@gmail.com",
            role: "Core Developer",
            badges: ["Main Dev"],
            avatar: "M",
            color: "#FF9800",
          },
          {
            name: "Naren V",
            email: "narenbhaskar2007@gmail.com",
            role: "Developer",
            badges: ["UI Designer"],
            avatar: "N",
            color: "#4CAF50",
          },
        ].map((dev, index) => (
          <Card key={index} style={styles.developerCard}>
            <Card.Content>
              <View style={styles.developerHeader}>
                <Avatar.Text
                  size={56}
                  label={dev.avatar}
                  style={{ backgroundColor: dev.color }}
                  labelStyle={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }}
                />
                <View style={styles.developerInfo}>
                  <Text variant="titleMedium" style={styles.developerName}>
                    {dev.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.developerRole}>
                    {dev.role}
                  </Text>
                  {dev.email && (
                    <View style={styles.emailContainer}>
                      <MaterialCommunityIcons name="email-outline" size={12} color={theme.colors.primary} />
                      <Text variant="bodySmall" style={styles.developerEmail}>
                        {dev.email}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.badgesContainer}>
                {dev.badges.map((badge, badgeIndex) => (
                  <Chip
                    key={badgeIndex}
                    mode="flat"
                    compact
                    style={[styles.badge, { backgroundColor: dev.color + '20' }]}
                    textStyle={[styles.badgeText, { color: dev.color }]}
                    icon={() => (
                      <MaterialCommunityIcons
                        name={
                          badge.includes('Core Dev') || badge.includes('Main Dev') ? 'star' :
                          badge.includes('Tester') ? 'test-tube' :
                          badge.includes('UI') ? 'palette' :
                          badge.includes('Documentation') ? 'file-document' :
                          badge.includes('Presentation') ? 'presentation' :
                          badge.includes('Designer') ? 'draw' :
                          'check-circle'
                        }
                        size={14}
                        color={dev.color}
                      />
                    )}
                  >
                    {badge}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        ))}
      </Surface>

      <Surface style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Account Settings
        </Text>
        <Divider />
        <Button
          mode="outlined"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </Surface>
      </ScrollView>

      {/* Manual Entry Modal */}
      <Portal>
        <Modal
          visible={showManualEntry}
          onDismiss={() => setShowManualEntry(false)}
          contentContainerStyle={[
            styles.modal,
            isTablet && styles.modalTablet,
            isDesktop && styles.modalDesktop,
            { backgroundColor: theme.colors.surface }
          ]}
          style={isWeb ? styles.webModalOverlay : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalScrollContent}
          >
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Add Timetable Entry
            </Text>

            <Text variant="labelMedium" style={styles.fieldLabel}>Day *</Text>
            <View style={styles.dayChipsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dayChipsContainer}
                style={styles.dayChipsScroll}
            >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                  <Chip
                    key={day}
                    selected={manualDay === day}
                    onPress={() => setManualDay(day)}
                    style={styles.dayChip}
                    mode={manualDay === day ? 'flat' : 'outlined'}
                    showSelectedCheck={false}
                  >
                    {day.slice(0, 3)}
                  </Chip>
                ))}
              </ScrollView>
            </View>

            <Text variant="labelMedium" style={styles.fieldLabel}>Start Time *</Text>
            {isWeb ? (
              <Surface style={[styles.webTimeInputSurface, { borderColor: theme.colors.outline }]} elevation={0}>
                <IconButton icon="clock-start" size={20} style={styles.webTimeIcon} />
                <input
                  type="time"
                  value={manualStartTime ? convertTo24HourFormat(manualStartTime) : ''}
                  onChange={(e) => {
                    const time24 = e.target.value;
                    if (time24) {
                      setManualStartTime(convertTo12HourFormat(time24));
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: 12,
                    fontSize: isSmallScreen ? 14 : 16,
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: theme.colors.onSurface,
                    outline: 'none',
                  }}
                />
              </Surface>
            ) : (
              <Button
                mode="outlined"
                onPress={() => setShowStartTimePicker(true)}
                icon="clock-start"
                style={styles.timeButton}
                contentStyle={styles.timeButtonContent}
              >
                {manualStartTime || 'Select Start Time'}
              </Button>
            )}

            <Text variant="labelMedium" style={styles.fieldLabel}>End Time *</Text>
            {isWeb ? (
              <Surface style={[styles.webTimeInputSurface, { borderColor: theme.colors.outline }]} elevation={0}>
                <IconButton icon="clock-end" size={20} style={styles.webTimeIcon} />
                <input
                  type="time"
                  value={manualEndTime ? convertTo24HourFormat(manualEndTime) : ''}
                  onChange={(e) => {
                    const time24 = e.target.value;
                    if (time24) {
                      setManualEndTime(convertTo12HourFormat(time24));
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: 12,
                    fontSize: isSmallScreen ? 14 : 16,
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: theme.colors.onSurface,
                    outline: 'none',
                  }}
                />
              </Surface>
            ) : (
              <Button
                mode="outlined"
                onPress={() => setShowEndTimePicker(true)}
                icon="clock-end"
                style={styles.timeButton}
                contentStyle={styles.timeButtonContent}
              >
                {manualEndTime || 'Select End Time'}
              </Button>
            )}

            <PaperInput
              label="Subject Name *"
              value={manualSubject}
              onChangeText={setManualSubject}
              mode="outlined"
              style={styles.input}
              left={<PaperInput.Icon icon="book" />}
            />

            <PaperInput
              label="Subject Code (Optional)"
              value={manualSubjectCode}
              onChangeText={setManualSubjectCode}
              mode="outlined"
              style={styles.input}
              left={<PaperInput.Icon icon="barcode" />}
            />

            <Text variant="labelMedium" style={styles.fieldLabel}>Class Type</Text>
            <SegmentedButtons
              value={manualType}
              onValueChange={(value) => setManualType(value as any)}
              buttons={[
                { value: 'lecture', label: 'Lecture' },
                { value: 'lab', label: 'Lab' },
                { value: 'tutorial', label: 'Tutorial' },
              ]}
              style={styles.segmentedButtons}
            />

            <PaperInput
              label="Room (Optional)"
              value={manualRoom}
              onChangeText={setManualRoom}
              mode="outlined"
              style={styles.input}
              left={<PaperInput.Icon icon="map-marker" />}
            />

            <PaperInput
              label="Faculty (Optional)"
              value={manualFaculty}
              onChangeText={setManualFaculty}
              mode="outlined"
              style={styles.input}
              left={<PaperInput.Icon icon="account-tie" />}
            />

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowManualEntry(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <OnlineButton
                mode="contained"
                onPress={handleAddManualEntry}
                style={styles.modalButton}
                disabled={!manualSubject.trim() || !manualStartTime.trim() || !manualEndTime.trim()}
                requiresOnline={true}
                offlineMessage="You need internet connection to add timetable entry"
              >
                Add Entry
              </OnlineButton>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Discard Timetable Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDiscardDialog} onDismiss={() => setShowDiscardDialog(false)}>
          <Dialog.Icon icon="alert" color={theme.colors.error} size={48} />
          <Dialog.Title>Discard Timetable?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              This will delete all {timetable.length} timetable entries. This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDiscardDialog(false)}>Cancel</Button>
            <OnlineButton
              onPress={handleDiscardTimetable}
              textColor={theme.colors.error}
              requiresOnline={true}
              offlineMessage="Cannot delete timetable while offline"
            >
              Discard
            </OnlineButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Timetable Entry Modal */}
      <Portal>
        <Modal
          visible={showEditTimetable}
          onDismiss={() => setShowEditTimetable(false)}
          contentContainerStyle={[
            styles.modal,
            isTablet && styles.modalTablet,
            isDesktop && styles.modalDesktop,
            { backgroundColor: theme.colors.surface }
          ]}
          style={isWeb ? styles.webModalOverlay : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalScrollContent}
          >
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Edit Timetable Entry
            </Text>

            <Text variant="labelMedium" style={styles.fieldLabel}>Day *</Text>
            <View style={styles.dayChipsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dayChipsContainer}
                style={styles.dayChipsScroll}
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                  <Chip
                    key={day}
                    selected={editDay === day}
                    onPress={() => setEditDay(day)}
                    style={styles.dayChip}
                    mode={editDay === day ? 'flat' : 'outlined'}
                    showSelectedCheck={false}
                  >
                    {day.slice(0, 3)}
                  </Chip>
                ))}
              </ScrollView>
            </View>

            <Text variant="labelMedium" style={styles.fieldLabel}>Start Time *</Text>
            {isWeb ? (
              <Surface style={[styles.webTimeInputSurface, { borderColor: theme.colors.outline }]} elevation={0}>
                <IconButton icon="clock-start" size={20} style={styles.webTimeIcon} />
                <input
                  type="time"
                  value={editStartTime ? convertTo24HourFormat(editStartTime) : ''}
                  onChange={(e) => {
                    const time24 = e.target.value;
                    if (time24) {
                      setEditStartTime(convertTo12HourFormat(time24));
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: 12,
                    fontSize: isSmallScreen ? 14 : 16,
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: theme.colors.onSurface,
                    outline: 'none',
                  }}
                />
              </Surface>
            ) : (
              <Button
                mode="outlined"
                onPress={() => setShowEditStartTimePicker(true)}
                icon="clock-start"
                style={styles.timeButton}
                contentStyle={styles.timeButtonContent}
              >
                {editStartTime || 'Select Start Time'}
              </Button>
            )}

            <Text variant="labelMedium" style={styles.fieldLabel}>End Time *</Text>
            {isWeb ? (
              <Surface style={[styles.webTimeInputSurface, { borderColor: theme.colors.outline }]} elevation={0}>
                <IconButton icon="clock-end" size={20} style={styles.webTimeIcon} />
                <input
                  type="time"
                  value={editEndTime ? convertTo24HourFormat(editEndTime) : ''}
                  onChange={(e) => {
                    const time24 = e.target.value;
                    if (time24) {
                      setEditEndTime(convertTo12HourFormat(time24));
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: 12,
                    fontSize: isSmallScreen ? 14 : 16,
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: theme.colors.onSurface,
                    outline: 'none',
                  }}
                />
              </Surface>
            ) : (
              <Button
                mode="outlined"
                onPress={() => setShowEditEndTimePicker(true)}
                icon="clock-end"
                style={styles.timeButton}
                contentStyle={styles.timeButtonContent}
              >
                {editEndTime || 'Select End Time'}
              </Button>
            )}

            <PaperInput
              label="Subject Name *"
              value={editSubject}
              onChangeText={setEditSubject}
              mode="outlined"
              style={styles.input}
              left={<PaperInput.Icon icon="book" />}
            />

            <PaperInput
              label="Subject Code (Optional)"
              value={editSubjectCode}
              onChangeText={setEditSubjectCode}
              mode="outlined"
              style={styles.input}
              left={<PaperInput.Icon icon="barcode" />}
            />

            <Text variant="labelMedium" style={styles.fieldLabel}>Class Type</Text>
            <SegmentedButtons
              value={editType}
              onValueChange={(value) => setEditType(value as any)}
              buttons={[
                { value: 'lecture', label: 'Lecture' },
                { value: 'lab', label: 'Lab' },
                { value: 'tutorial', label: 'Tutorial' },
              ]}
              style={styles.segmentedButtons}
            />

            <PaperInput
              label="Room (Optional)"
              value={editRoom}
              onChangeText={setEditRoom}
              mode="outlined"
              style={styles.input}
              left={<PaperInput.Icon icon="map-marker" />}
            />

            <PaperInput
              label="Faculty (Optional)"
              value={editFaculty}
              onChangeText={setEditFaculty}
              mode="outlined"
              style={styles.input}
              left={<PaperInput.Icon icon="account-tie" />}
            />

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowEditTimetable(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <OnlineButton
                mode="contained"
                onPress={handleSaveEditTimetable}
                style={styles.modalButton}
                disabled={!editSubject.trim() || !editStartTime.trim() || !editEndTime.trim()}
                requiresOnline={true}
                offlineMessage="You need internet connection to save timetable changes"
              >
                Save Changes
              </OnlineButton>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Delete Timetable Entry Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDeleteTimetableEntryDialog} onDismiss={() => setShowDeleteTimetableEntryDialog(false)}>
          <Dialog.Icon icon="delete-alert" color={theme.colors.error} size={48} />
          <Dialog.Title>Delete Entry?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete this timetable entry?
            </Text>
            {selectedTimetableEntry && (
              <Card style={{ marginTop: 12 }}>
                <Card.Content>
                  <Text variant="titleMedium">{selectedTimetableEntry.subject}</Text>
                  <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                    {selectedTimetableEntry.day} • {selectedTimetableEntry.startTime} - {selectedTimetableEntry.endTime}
                  </Text>
                </Card.Content>
              </Card>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteTimetableEntryDialog(false)}>Cancel</Button>
            <Button onPress={handleDeleteTimetableEntry} textColor={theme.colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Edit Profile Modal */}
        <Modal
          visible={showEditProfile}
          onDismiss={() => !savingProfile && setShowEditProfile(false)}
          contentContainerStyle={[
            styles.modalContainer,
            isTablet && styles.modalTablet,
            isDesktop && styles.modalDesktop,
            { backgroundColor: theme.colors.background }
          ]}
          style={isWeb ? styles.webModalOverlay : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalScrollContent}
          >
              <View style={styles.modalHeader}>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
                  Edit Profile
                </Text>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => !savingProfile && setShowEditProfile(false)}
                  disabled={savingProfile}
                />
              </View>

              {/* Avatar Section - Same as onboarding */}
              <View style={styles.editAvatarContainer}>
                {editPhotoURL ? (
                  <Image source={{ uri: editPhotoURL }} style={styles.editAvatar} />
                ) : (
                  <Avatar.Icon
                    size={100}
                    icon="account"
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                  />
                )}
                <View style={styles.avatarButtonsRow}>
                  <IconButton
                    icon="camera"
                    mode="contained"
                    size={24}
                    onPress={handleTakePhoto}
                    containerColor={theme.colors.primary}
                    iconColor={theme.colors.onPrimary}
                    disabled={savingProfile}
                  />
                  <IconButton
                    icon="image"
                    mode="contained"
                    size={24}
                    onPress={handlePickAvatar}
                    containerColor={theme.colors.secondary}
                    iconColor={theme.colors.onSecondary}
                    disabled={savingProfile}
                  />
                </View>
              </View>

              {/* Form Fields */}
              <PaperInput
                label="Full Name *"
                value={editDisplayName}
                onChangeText={setEditDisplayName}
                mode="outlined"
                left={<PaperInput.Icon icon="account" />}
                style={styles.modalInput}
                disabled={savingProfile}
              />

              <PaperInput
                label="College/University *"
                value={editCollege}
                onChangeText={setEditCollege}
                mode="outlined"
                left={<PaperInput.Icon icon="school" />}
                style={styles.modalInput}
                disabled={savingProfile}
              />

              <PaperInput
                label="Course *"
                value={editCourse}
                onChangeText={setEditCourse}
                mode="outlined"
                left={<PaperInput.Icon icon="school-outline" />}
                style={styles.modalInput}
                placeholder="e.g., B.Tech, BCA, MCA"
                disabled={savingProfile}
              />

              <PaperInput
                label="Branch/Stream *"
                value={editDepartment}
                onChangeText={setEditDepartment}
                mode="outlined"
                left={<PaperInput.Icon icon="book-open-variant" />}
                style={styles.modalInput}
                placeholder="e.g., Computer Science"
                disabled={savingProfile}
              />

              <View style={styles.rowInputs}>
                <PaperInput
                  label="Semester *"
                  value={editSemester}
                  onChangeText={setEditSemester}
                  mode="outlined"
                  left={<PaperInput.Icon icon="numeric" />}
                  style={[styles.modalInput, { flex: 1 }]}
                  keyboardType="numeric"
                  disabled={savingProfile}
                />

                <PaperInput
                  label="Section"
                  value={editSection}
                  onChangeText={setEditSection}
                  mode="outlined"
                  left={<PaperInput.Icon icon="alpha-a" />}
                  style={[styles.modalInput, { flex: 1 }]}
                  placeholder="e.g., A"
                  disabled={savingProfile}
                />
              </View>

              <PaperInput
                label="USN No / Roll No *"
                value={editRollNumber}
                onChangeText={setEditRollNumber}
                mode="outlined"
                left={<PaperInput.Icon icon="card-account-details" />}
                style={styles.modalInput}
                placeholder="e.g., 1CR21CS001"
                autoCapitalize="characters"
                disabled={savingProfile}
              />

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowEditProfile(false)}
                  style={{ flex: 1 }}
                  disabled={savingProfile}
                >
                  Cancel
                </Button>
                <OnlineButton
                  mode="contained"
                  onPress={handleSaveProfile}
                  style={{ flex: 1 }}
                  loading={savingProfile}
                  disabled={savingProfile}
                  requiresOnline={true}
                  offlineMessage="You need internet connection to save profile changes"
                >
                  Save Changes
                </OnlineButton>
              </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Start Time Picker for Manual Entry */}
      {showStartTimePicker && !isWeb && (
        <DateTimePicker
          value={manualStartDate}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowStartTimePicker(false);
            }
            if (event.type === 'set' && selectedDate) {
              setManualStartDate(selectedDate);
              setManualStartTime(formatTimeString(selectedDate));
            }
            if (Platform.OS === 'ios' && selectedDate) {
              setManualStartDate(selectedDate);
              setManualStartTime(formatTimeString(selectedDate));
            }
          }}
        />
      )}

      {/* End Time Picker for Manual Entry */}
      {showEndTimePicker && !isWeb && (
        <DateTimePicker
          value={manualEndDate}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowEndTimePicker(false);
            }
            if (event.type === 'set' && selectedDate) {
              setManualEndDate(selectedDate);
              setManualEndTime(formatTimeString(selectedDate));
            }
            if (Platform.OS === 'ios' && selectedDate) {
              setManualEndDate(selectedDate);
              setManualEndTime(formatTimeString(selectedDate));
            }
          }}
        />
      )}

      {/* Start Time Picker for Edit Entry */}
      {showEditStartTimePicker && !isWeb && (
        <DateTimePicker
          value={editStartDate}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowEditStartTimePicker(false);
            }
            if (event.type === 'set' && selectedDate) {
              setEditStartDate(selectedDate);
              setEditStartTime(formatTimeString(selectedDate));
            }
            if (Platform.OS === 'ios' && selectedDate) {
              setEditStartDate(selectedDate);
              setEditStartTime(formatTimeString(selectedDate));
            }
          }}
        />
      )}

      {/* End Time Picker for Edit Entry */}
      {showEditEndTimePicker && !isWeb && (
        <DateTimePicker
          value={editEndDate}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowEditEndTimePicker(false);
            }
            if (event.type === 'set' && selectedDate) {
              setEditEndDate(selectedDate);
              setEditEndTime(formatTimeString(selectedDate));
            }
            if (Platform.OS === 'ios' && selectedDate) {
              setEditEndDate(selectedDate);
              setEditEndTime(formatTimeString(selectedDate));
            }
          }}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  contentWide: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  profileCard: {
    padding: 24,
    borderRadius: 12,
    elevation: 2,
    alignItems: 'center',
    marginBottom: 16,
  },
  socialStatsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  statNumber: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 50,
  },
  name: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  email: {
    marginTop: 4,
    opacity: 0.7,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  divider: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    opacity: 0.7,
    flex: 1,
  },
  infoValue: {
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '90%',
    maxWidth: 550,
    width: '95%',
    alignSelf: 'center',
  },
  modalTablet: {
    margin: 24,
    padding: 24,
    width: '85%',
    maxWidth: 550,
    maxHeight: '85%',
  },
  modalDesktop: {
    margin: 32,
    padding: 32,
    width: '70%',
    maxWidth: 550,
    maxHeight: '85%',
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalScrollContent: {
    paddingBottom: 16,
  },
  modalLabel: {
    marginBottom: 8,
  },
  dayButtonsRow: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  timetableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  timetableCount: {
    flex: 1,
  },
  timetableButtons: {
    gap: 12,
  },
  timetableButton: {
    marginBottom: 8,
  },
  extractingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  extractingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  modalDescription: {
    marginBottom: 16,
    opacity: 0.7,
  },
  optionButton: {
    marginBottom: 12,
  },
  fieldLabel: {
    marginBottom: 8,
    marginTop: 4,
  },
  timetableEntriesContainer: {
    marginTop: 12,
    gap: 8,
  },
  timetableEntryCard: {
    marginBottom: 8,
    elevation: 1,
  },
  timetableEntryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  timetableEntryDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  timetableEntryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeButton: {
    marginBottom: 16,
    justifyContent: 'flex-start',
  },
  timeButtonContent: {
    paddingVertical: 8,
    justifyContent: 'flex-start',
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '90%',
    maxWidth: 550,
    width: '95%',
    alignSelf: 'center',
  },
  modalContent: {
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  editAvatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  editAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarButtonsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  modalInput: {
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  developersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  developerCard: {
    marginBottom: 12,
    elevation: 2,
  },
  developerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  developerInfo: {
    flex: 1,
  },
  developerName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  developerRole: {
    opacity: 0.7,
    marginBottom: 6,
    fontSize: 13,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  developerEmail: {
    opacity: 0.6,
    fontSize: 11,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    height: 28,
  },
  badgeText: {
    fontSize: 11,
    marginVertical: 0,
    fontWeight: '600',
  },
  // Web Modal Overlay Style - centers modal properly on web
  webModalOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  // Web Time Input Container - matches outlined input style
  webTimeInputSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  webTimeIcon: {
    margin: 0,
  },
  // Day Chips - Scrollable selector with wrapper for proper positioning
  dayChipsWrapper: {
    marginBottom: 16,
    zIndex: 1,
    overflow: 'visible',
  },
  dayChipsScroll: {
    maxHeight: 50,
    overflow: 'visible',
  },
  dayChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  dayChip: {
    marginRight: 4,
  },
});
