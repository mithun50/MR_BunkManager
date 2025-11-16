import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Surface, Button, Avatar, useTheme, Divider, Appbar, ActivityIndicator, Card, IconButton, Portal, Modal, SegmentedButtons, TextInput as PaperInput, Dialog } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import authService from '@/src/services/authService';
import firestoreService from '@/src/services/firestoreService';
import { router } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { UserProfile, Subject, AttendanceRecord, TimetableEntry } from '@/src/types/user';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import groqService from '@/src/services/geminiService';
import { ThemeSwitcher } from '@/src/components/ThemeSwitcher';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickAttendance, setShowQuickAttendance] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | 'leave'>('present');
  const [showTimetableOptions, setShowTimetableOptions] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // Add subject form
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');

  // Manual timetable entry form
  const [manualDay, setManualDay] = useState('Monday');
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualEndTime, setManualEndTime] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualSubjectCode, setManualSubjectCode] = useState('');
  const [manualType, setManualType] = useState<'lecture' | 'lab' | 'tutorial' | 'practical' | 'seminar'>('lecture');
  const [manualRoom, setManualRoom] = useState('');
  const [manualFaculty, setManualFaculty] = useState('');

  // Load user profile and subjects from Firestore
  const loadData = useCallback(async () => {
    if (user) {
      try {
        setLoading(true);
        const [userProfile, subjectsList, timetableData] = await Promise.all([
          firestoreService.getUserProfile(user.uid),
          firestoreService.getSubjects(user.uid),
          firestoreService.getTimetable(user.uid),
        ]);

        // Filter out invalid subjects
        const validSubjects = subjectsList.filter(subject => {
          const name = subject.name?.toLowerCase()?.trim() || '';
          if (!name || name.length < 2) return false;

          const invalidKeywords = ['break', 'lunch', 'recess', 'free', 'vacant', 'empty', 'no class', 'holiday', 'off', '-', 'nil', 'na', 'n/a'];
          return !invalidKeywords.some(keyword => name.includes(keyword));
        });

        // Filter out invalid timetable entries
        const validTimetable = timetableData.filter(entry => {
          const subject = entry.subject?.toLowerCase()?.trim() || '';
          if (!subject || subject.length < 2) return false;

          const invalidKeywords = ['break', 'lunch', 'recess', 'free', 'vacant', 'empty', 'no class', 'holiday', 'off', '-', 'nil', 'na', 'n/a'];
          return !invalidKeywords.some(keyword => subject.includes(keyword));
        });

        setProfile(userProfile);
        setSubjects(validSubjects);
        setTimetable(validTimetable);
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

  const handleAddSubject = async () => {
    if (!user || !newSubjectName.trim()) return;

    try {
      const newSubject: Subject = {
        id: `subject_${Date.now()}`,
        name: newSubjectName.trim(),
        code: newSubjectCode.trim() || undefined,
        totalClasses: 0,
        attendedClasses: 0,
        attendancePercentage: 0,
        lastUpdated: new Date(),
      };

      await firestoreService.addSubject(user.uid, newSubject);

      // Reload subjects
      const updatedSubjects = await firestoreService.getSubjects(user.uid);
      setSubjects(updatedSubjects);

      // Reset form
      setNewSubjectName('');
      setNewSubjectCode('');
      setShowAddSubject(false);
    } catch (error) {
      console.error('Error adding subject:', error);
    }
  };

  const handleQuickAttendance = async () => {
    if (!user || !selectedSubject) return;

    try {
      const today = new Date();

      // Check if attendance already marked for this subject today
      const exists = await firestoreService.checkAttendanceExists(
        user.uid,
        selectedSubject.id,
        today
      );

      if (exists) {
        alert('Attendance already marked for this subject today!');
        return;
      }

      const attended = attendanceStatus === 'present';

      // Update subject attendance
      await firestoreService.updateSubjectAttendance(user.uid, selectedSubject.id, attended);

      // Add attendance record
      const record: AttendanceRecord = {
        id: `attendance_${Date.now()}`,
        subjectId: selectedSubject.id,
        date: today,
        status: attendanceStatus,
      };
      await firestoreService.addAttendanceRecord(user.uid, record);

      // Reload subjects
      const updatedSubjects = await firestoreService.getSubjects(user.uid);
      setSubjects(updatedSubjects);

      // Reset form
      setShowQuickAttendance(false);
      setSelectedSubject(null);
      setAttendanceStatus('present');
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const handleDiscardTimetable = async () => {
    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      console.log('Starting to discard timetable for user:', user.uid);

      // Delete all timetable entries
      await firestoreService.deleteTimetable(user.uid);
      console.log('Timetable deleted from Firestore');

      // Small delay to ensure Firestore propagates the deletion
      await new Promise(resolve => setTimeout(resolve, 300));

      // Immediately clear timetable state
      setTimetable([]);
      console.log('Timetable state cleared');

      // Reload data to ensure everything is in sync
      await loadData();
      console.log('Data reloaded, timetable entries:', timetable.length);

      setShowDiscardDialog(false);
      setShowTimetableOptions(false);
      Alert.alert('Success', 'Timetable discarded successfully. All timetable data has been removed.');
    } catch (error: any) {
      console.error('Error discarding timetable:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', `Failed to discard timetable: ${error.message || 'Unknown error'}`);
    }
  };

  const handleExtractFromImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setExtracting(true);
        setShowTimetableOptions(false);

        try {
          const extractedData = await groqService.extractTimetableFromImage(result.assets[0].uri);

          if (extractedData.length === 0) {
            Alert.alert('No Data', 'Could not extract timetable data from the image');
            return;
          }

          // Save timetable
          if (user) {
            await firestoreService.saveTimetable(user.uid, extractedData);

            // Create subjects from timetable
            const uniqueSubjects = new Map<string, TimetableEntry>();
            extractedData.forEach(entry => {
              const uniqueKey = `${entry.subject}-${entry.subjectCode || 'no-code'}`.toLowerCase();
              if (!uniqueSubjects.has(uniqueKey)) {
                uniqueSubjects.set(uniqueKey, entry);
              }
            });

            const subjectPromises = Array.from(uniqueSubjects.values()).map(entry => {
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

              if (entry.faculty) subject.faculty = entry.faculty;
              if (entry.room) subject.room = entry.room;

              return firestoreService.addSubject(user.uid, subject);
            });

            await Promise.all(subjectPromises);
            await loadData();

            Alert.alert('Success', `Extracted ${extractedData.length} classes from timetable`);
          }
        } catch (error: any) {
          console.error('Extraction error:', error);
          Alert.alert('Extraction Failed', error.message || 'Failed to extract timetable');
        } finally {
          setExtracting(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
      setExtracting(false);
    }
  };

  const handleExtractFromPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (result.canceled === false && result.assets[0]) {
        setExtracting(true);
        setShowTimetableOptions(false);

        try {
          const extractedData = await groqService.extractTimetableFromPDF(result.assets[0].uri);

          if (extractedData.length === 0) {
            Alert.alert('No Data', 'Could not extract timetable data from the PDF');
            return;
          }

          // Save timetable
          if (user) {
            await firestoreService.saveTimetable(user.uid, extractedData);

            // Create subjects from timetable
            const uniqueSubjects = new Map<string, TimetableEntry>();
            extractedData.forEach(entry => {
              const uniqueKey = `${entry.subject}-${entry.subjectCode || 'no-code'}`.toLowerCase();
              if (!uniqueSubjects.has(uniqueKey)) {
                uniqueSubjects.set(uniqueKey, entry);
              }
            });

            const subjectPromises = Array.from(uniqueSubjects.values()).map(entry => {
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

              if (entry.faculty) subject.faculty = entry.faculty;
              if (entry.room) subject.room = entry.room;

              return firestoreService.addSubject(user.uid, subject);
            });

            await Promise.all(subjectPromises);
            await loadData();

            Alert.alert('Success', `Extracted ${extractedData.length} classes from timetable`);
          }
        } catch (error: any) {
          console.error('Extraction error:', error);
          Alert.alert('Extraction Failed', error.message || 'Failed to extract timetable');
        } finally {
          setExtracting(false);
        }
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick PDF');
      setExtracting(false);
    }
  };

  const handleAddManualEntry = async () => {
    if (!user || !manualSubject.trim() || !manualStartTime.trim() || !manualEndTime.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    try {
      const entry: any = {
        id: `timetable_${Date.now()}`,
        day: manualDay,
        startTime: manualStartTime,
        endTime: manualEndTime,
        subject: manualSubject.trim(),
        type: manualType,
      };

      if (manualSubjectCode.trim()) entry.subjectCode = manualSubjectCode.trim();
      if (manualRoom.trim()) entry.room = manualRoom.trim();
      if (manualFaculty.trim()) entry.faculty = manualFaculty.trim();

      // Add to timetable
      const updatedTimetable = [...timetable, entry];
      await firestoreService.saveTimetable(user.uid, updatedTimetable);

      // Check if subject exists, if not create it
      const subjectExists = subjects.some(s =>
        s.name.toLowerCase() === entry.subject.toLowerCase() &&
        (!entry.subjectCode || s.code === entry.subjectCode)
      );

      if (!subjectExists) {
        const newSubject: any = {
          id: `subject_${Date.now()}`,
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

      // Reload data and reset form
      await loadData();

      setManualDay('Monday');
      setManualStartTime('');
      setManualEndTime('');
      setManualSubject('');
      setManualSubjectCode('');
      setManualType('lecture');
      setManualRoom('');
      setManualFaculty('');
      setShowManualEntry(false);

      Alert.alert('Success', 'Timetable entry added');
    } catch (error) {
      console.error('Error adding manual entry:', error);
      Alert.alert('Error', 'Failed to add timetable entry');
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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
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
          </Surface>

          {/* Manage Subjects */}
          <Surface style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Manage Subjects
              </Text>
              <IconButton
                icon="plus-circle"
                size={24}
                iconColor={theme.colors.primary}
                onPress={() => setShowAddSubject(true)}
              />
            </View>
            <Divider style={styles.divider} />
            {subjects.length === 0 ? (
              <View style={styles.emptySubjects}>
                <MaterialCommunityIcons name="book-off-outline" size={48} color={theme.colors.outline} />
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No subjects added yet
                </Text>
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={() => setShowAddSubject(true)}
                  style={styles.addButton}
                >
                  Add Subject
                </Button>
              </View>
            ) : (
              <>
                <Text variant="bodySmall" style={styles.infoLabel}>
                  Tap a subject to mark attendance
                </Text>
                <View style={styles.quickAttendanceGrid}>
                  {subjects.map((subject) => (
                    <Card
                      key={subject.id}
                      style={styles.quickSubjectCard}
                      onPress={() => {
                        setSelectedSubject(subject);
                        setShowQuickAttendance(true);
                      }}
                    >
                      <Card.Content style={styles.quickSubjectContent}>
                        <Text variant="labelSmall" numberOfLines={2}>
                          {subject.name}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                          {subject.attendancePercentage.toFixed(0)}%
                        </Text>
                      </Card.Content>
                    </Card>
                  ))}
                </View>
              </>
            )}
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
              <View style={styles.extractingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.extractingText}>
                  Extracting timetable...
                </Text>
              </View>
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
                  icon="upload"
                  onPress={() => setShowTimetableOptions(true)}
                  style={styles.timetableButton}
                >
                  Extract from AI
                </Button>

                <Button
                  mode="contained"
                  icon="pencil-plus"
                  onPress={() => setShowManualEntry(true)}
                  style={styles.timetableButton}
                >
                  Add Manually
                </Button>
              </View>
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

      {/* Add Subject Modal */}
      <Portal>
        <Modal
          visible={showAddSubject}
          onDismiss={() => setShowAddSubject(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Add New Subject
          </Text>

          <PaperInput
            label="Subject Name *"
            value={newSubjectName}
            onChangeText={setNewSubjectName}
            mode="outlined"
            style={styles.input}
            left={<PaperInput.Icon icon="book" />}
          />

          <PaperInput
            label="Subject Code (Optional)"
            value={newSubjectCode}
            onChangeText={setNewSubjectCode}
            mode="outlined"
            style={styles.input}
            left={<PaperInput.Icon icon="barcode" />}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowAddSubject(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddSubject}
              style={styles.modalButton}
              disabled={!newSubjectName.trim()}
            >
              Add Subject
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Quick Attendance Modal */}
      <Portal>
        <Modal
          visible={showQuickAttendance}
          onDismiss={() => {
            setShowQuickAttendance(false);
            setSelectedSubject(null);
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Mark Attendance
          </Text>

          {selectedSubject && (
            <>
              <Card style={styles.modalSubjectCard}>
                <Card.Content>
                  <Text variant="titleMedium">{selectedSubject.name}</Text>
                  {selectedSubject.code && (
                    <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                      {selectedSubject.code}
                    </Text>
                  )}
                  <View style={styles.modalStats}>
                    <Text variant="bodySmall">
                      Current: {selectedSubject.attendedClasses}/{selectedSubject.totalClasses}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                      {selectedSubject.attendancePercentage.toFixed(1)}%
                    </Text>
                  </View>
                </Card.Content>
              </Card>

              <Text variant="titleSmall" style={styles.modalLabel}>
                Status
              </Text>
              <SegmentedButtons
                value={attendanceStatus}
                onValueChange={(value) => setAttendanceStatus(value as any)}
                buttons={[
                  {
                    value: 'present',
                    label: 'Present',
                    icon: 'check-circle',
                  },
                  {
                    value: 'absent',
                    label: 'Absent',
                    icon: 'close-circle',
                  },
                  {
                    value: 'leave',
                    label: 'Leave',
                    icon: 'medical-bag',
                  },
                ]}
                style={styles.segmentedButtons}
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowQuickAttendance(false);
                    setSelectedSubject(null);
                  }}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleQuickAttendance}
                  style={styles.modalButton}
                >
                  Save
                </Button>
              </View>
            </>
          )}
        </Modal>
      </Portal>

      {/* Timetable Options Modal */}
      <Portal>
        <Modal
          visible={showTimetableOptions}
          onDismiss={() => setShowTimetableOptions(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Extract Timetable
          </Text>
          <Text variant="bodyMedium" style={styles.modalDescription}>
            Choose a method to extract your timetable
          </Text>

          <Button
            mode="contained"
            icon="image"
            onPress={handleExtractFromImage}
            style={styles.optionButton}
          >
            From Image
          </Button>

          <Button
            mode="contained"
            icon="file-pdf-box"
            onPress={handleExtractFromPDF}
            style={styles.optionButton}
          >
            From PDF
          </Button>

          <Button
            mode="outlined"
            onPress={() => setShowTimetableOptions(false)}
            style={styles.optionButton}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>

      {/* Manual Entry Modal */}
      <Portal>
        <Modal
          visible={showManualEntry}
          onDismiss={() => setShowManualEntry(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Add Timetable Entry
            </Text>

            <Text variant="labelMedium" style={styles.fieldLabel}>Day *</Text>
            <View style={styles.dayButtonsRow}>
              <SegmentedButtons
                value={manualDay}
                onValueChange={setManualDay}
                buttons={[
                  { value: 'Monday', label: 'Mon' },
                  { value: 'Tuesday', label: 'Tue' },
                  { value: 'Wednesday', label: 'Wed' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>
            <View style={styles.dayButtonsRow}>
              <SegmentedButtons
                value={manualDay}
                onValueChange={setManualDay}
                buttons={[
                  { value: 'Thursday', label: 'Thu' },
                  { value: 'Friday', label: 'Fri' },
                  { value: 'Saturday', label: 'Sat' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            <PaperInput
              label="Start Time (e.g., 09:00 AM) *"
              value={manualStartTime}
              onChangeText={setManualStartTime}
              mode="outlined"
              style={styles.input}
              left={<PaperInput.Icon icon="clock-start" />}
              placeholder="09:00 AM"
            />

            <PaperInput
              label="End Time (e.g., 10:00 AM) *"
              value={manualEndTime}
              onChangeText={setManualEndTime}
              mode="outlined"
              style={styles.input}
              left={<PaperInput.Icon icon="clock-end" />}
              placeholder="10:00 AM"
            />

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
              <Button
                mode="contained"
                onPress={handleAddManualEntry}
                style={styles.modalButton}
                disabled={!manualSubject.trim() || !manualStartTime.trim() || !manualEndTime.trim()}
              >
                Add Entry
              </Button>
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
            <Button onPress={handleDiscardTimetable} textColor={theme.colors.error}>
              Discard
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  profileCard: {
    padding: 24,
    borderRadius: 12,
    elevation: 2,
    alignItems: 'center',
    marginBottom: 16,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
  quickAttendanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  quickSubjectCard: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    elevation: 1,
  },
  quickSubjectContent: {
    padding: 8,
    minHeight: 60,
    justifyContent: 'space-between',
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalSubjectCard: {
    marginBottom: 16,
    elevation: 1,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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
  emptySubjects: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    opacity: 0.7,
    marginTop: 8,
    marginBottom: 16,
  },
  addButton: {
    marginTop: 8,
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
});
