import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Button, Avatar, useTheme, Divider, Appbar, ActivityIndicator, Card, IconButton, Portal, Modal, SegmentedButtons, TextInput as PaperInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import authService from '@/src/services/authService';
import firestoreService from '@/src/services/firestoreService';
import { router } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { UserProfile, Subject, AttendanceRecord } from '@/src/types/user';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickAttendance, setShowQuickAttendance] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | 'leave'>('present');

  // Add subject form
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');

  // Load user profile and subjects from Firestore
  const loadData = useCallback(async () => {
    if (user) {
      try {
        setLoading(true);
        const [userProfile, subjectsList] = await Promise.all([
          firestoreService.getUserProfile(user.uid),
          firestoreService.getSubjects(user.uid),
        ]);
        setProfile(userProfile);
        setSubjects(subjectsList);
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
        <Appbar.Content title="Profile" />
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
});
