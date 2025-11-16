import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Text,
  Card,
  Button,
  Chip,
  useTheme,
  Portal,
  Modal,
  TextInput,
  SegmentedButtons,
  ProgressBar,
  IconButton,
  Divider,
  Appbar,
} from 'react-native-paper';
import Calendar from 'react-native-calendars/src/calendar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import firestoreService from '../../services/firestoreService';
import { Subject, AttendanceRecord } from '../../types/user';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';

export default function AttendanceScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [todayClasses, setTodayClasses] = useState<any[]>([]);

  // Mark attendance form
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | 'leave'>('present');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const loadSubjects = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [subjectsList, timetableData] = await Promise.all([
        firestoreService.getSubjects(user.uid),
        firestoreService.getTimetable(user.uid),
      ]);

      // Get today's day name
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

      // Filter and validate today's classes
      const todaySchedule = timetableData
        .filter(entry => {
          const subject = entry.subject?.toLowerCase()?.trim() || '';

          // Must match today
          if (entry.day !== today) return false;

          // Must have valid subject name
          if (!subject || subject.length < 2) return false;

          // Exclude breaks, lunch, etc.
          const invalidKeywords = [
            'break', 'lunch', 'recess', 'free', 'vacant', 'empty',
            'no class', 'holiday', 'off', '-', 'nil', 'na', 'n/a'
          ];

          return !invalidKeywords.some(keyword => subject.includes(keyword));
        })
        .sort((a, b) => {
          const timeA = convertTo24Hour(a.startTime);
          const timeB = convertTo24Hour(b.startTime);
          return timeA.localeCompare(timeB);
        });

      setTodayClasses(todaySchedule);
      console.log(`Today (${today}): ${todaySchedule.length} valid classes`);

      // Filter subjects to show ONLY subjects that have classes today
      const todaySubjectNames = new Set(
        todaySchedule.map(entry => entry.subject.toLowerCase().trim())
      );

      console.log('Today\'s subject names:', Array.from(todaySubjectNames));

      // Filter subjects: must be valid AND have a class today
      const validTodaySubjects = subjectsList.filter(subject => {
        const name = subject.name?.toLowerCase()?.trim() || '';

        // Exclude empty names
        if (!name || name.length < 2) return false;

        // Exclude breaks, lunch, etc.
        const invalidKeywords = [
          'break', 'lunch', 'recess', 'free', 'vacant', 'empty',
          'no class', 'holiday', 'off', '-', 'nil', 'na', 'n/a'
        ];

        if (invalidKeywords.some(keyword => name.includes(keyword))) {
          return false;
        }

        // MUST have a class scheduled for today
        const hasClassToday = todaySubjectNames.has(name);

        console.log(`Subject "${subject.name}": hasClassToday=${hasClassToday}`);

        return hasClassToday;
      });

      console.log(`Filtered subjects: ${validTodaySubjects.length} subjects with classes today`);
      setSubjects(validTodaySubjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const convertTo24Hour = (time: string) => {
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':');
    let hour = parseInt(hours);

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSubjects();
    }, [loadSubjects])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSubjects();
    setRefreshing(false);
  };

  const loadAttendanceDates = async (subjectId: string) => {
    if (!user) return;

    try {
      // Get all attendance records for this subject
      const records = await firestoreService.getAttendanceRecords(user.uid);
      const subjectRecords = records.filter(r => r.subjectId === subjectId);

      // Create marked dates object
      const marked: any = {};

      subjectRecords.forEach(record => {
        const dateStr = record.date.toISOString().split('T')[0];
        marked[dateStr] = {
          marked: true,
          dotColor:
            record.status === 'present' ? theme.colors.tertiary :
            record.status === 'absent' ? theme.colors.error :
            theme.colors.secondary,
        };
      });

      // Add selected date highlighting
      if (selectedDate) {
        marked[selectedDate] = {
          ...marked[selectedDate],
          selected: true,
          selectedColor: theme.colors.primary,
        };
      }

      setMarkedDates(marked);
    } catch (error) {
      console.error('Error loading attendance dates:', error);
    }
  };

  const handleMarkAttendance = async () => {
    if (!user || !selectedSubject) return;

    try {
      // Check if attendance already marked for this subject on this date
      const exists = await firestoreService.checkAttendanceExists(
        user.uid,
        selectedSubject.id,
        new Date(selectedDate)
      );

      if (exists) {
        alert('Attendance already marked for this subject on this date!');
        return;
      }

      const attended = attendanceStatus === 'present';

      // Update subject attendance
      await firestoreService.updateSubjectAttendance(user.uid, selectedSubject.id, attended);

      // Add attendance record
      const record: any = {
        id: `attendance_${Date.now()}`,
        subjectId: selectedSubject.id,
        date: new Date(selectedDate),
        status: attendanceStatus,
      };

      // Only add notes if they exist
      if (notes.trim()) {
        record.notes = notes.trim();
      }

      await firestoreService.addAttendanceRecord(user.uid, record);

      // Reload subjects and attendance dates
      await loadSubjects();
      await loadAttendanceDates(selectedSubject.id);

      // Reset form
      setAttendanceStatus('present');
      setNotes('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setShowMarkModal(false);
      setSelectedSubject(null);
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return theme.colors.tertiary; // Green
    if (percentage >= 75) return theme.colors.secondary; // Yellow
    return theme.colors.error; // Red
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 85) return 'check-circle';
    if (percentage >= 75) return 'alert-circle';
    return 'close-circle';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        elevated
        style={{ backgroundColor: theme.colors.surface }}
      >
        <MaterialCommunityIcons name="calendar-check" size={24} color={theme.colors.primary} style={{ marginLeft: 16 }} />
        <Appbar.Content title="Track Attendance" titleStyle={{ fontWeight: 'bold' }} />
        <View style={{ marginRight: 16 }}>
          <ThemeSwitcher />
        </View>
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Classes */}
        {todayClasses.length > 0 && (
          <Card style={styles.todayCard}>
            <Card.Content>
              <View style={styles.todayHeader}>
                <MaterialCommunityIcons name="calendar-today" size={24} color={theme.colors.primary} />
                <Text variant="titleLarge" style={styles.todayTitle}>
                  Today's Classes
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.todaySubtitle}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <Divider style={styles.todayDivider} />
              {todayClasses.map((classEntry, index) => (
                <View key={`${classEntry.id}-${index}`} style={styles.todayClassItem}>
                  <View style={styles.todayClassTime}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.primary} />
                    <Text variant="bodySmall" style={styles.timeText}>
                      {classEntry.startTime}
                    </Text>
                  </View>
                  <View style={styles.todayClassInfo}>
                    <Text variant="titleSmall">{classEntry.subject}</Text>
                    {classEntry.room && (
                      <Text variant="bodySmall" style={styles.todayClassDetail}>
                        📍 {classEntry.room}
                      </Text>
                    )}
                    {classEntry.faculty && (
                      <Text variant="bodySmall" style={styles.todayClassDetail}>
                        👨‍🏫 {classEntry.faculty}
                      </Text>
                    )}
                  </View>
                  <Chip mode="outlined" compact textStyle={{ fontSize: 10 }}>
                    {classEntry.type}
                  </Chip>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Subjects List - Only show subjects with classes today */}
        {subjects.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons
                name={todayClasses.length === 0 ? "calendar-remove" : "school-outline"}
                size={64}
                color={theme.colors.outline}
              />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                {todayClasses.length === 0 ? "No Classes Today" : "No Subjects for Today"}
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                {todayClasses.length === 0
                  ? "Enjoy your day off! No classes scheduled for today."
                  : "None of your subjects have classes scheduled for today."}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.subjectsList}>
            {subjects.map((subject) => (
              <Card key={subject.id} style={styles.subjectCard}>
                <Card.Content>
                  <View style={styles.subjectHeader}>
                    <View style={styles.subjectInfo}>
                      <Text variant="titleLarge" style={styles.subjectName}>
                        {subject.name}
                      </Text>
                      {subject.code && (
                        <Text variant="bodySmall" style={styles.subjectCode}>
                          {subject.code}
                        </Text>
                      )}
                      {subject.faculty && (
                        <View style={styles.detailRow}>
                          <MaterialCommunityIcons name="account-tie" size={14} color={theme.colors.onSurface} style={{ opacity: 0.7 }} />
                          <Text variant="bodySmall" style={styles.detailText}>
                            {subject.faculty}
                          </Text>
                        </View>
                      )}
                      {subject.room && (
                        <View style={styles.detailRow}>
                          <MaterialCommunityIcons name="map-marker" size={14} color={theme.colors.onSurface} style={{ opacity: 0.7 }} />
                          <Text variant="bodySmall" style={styles.detailText}>
                            {subject.room}
                          </Text>
                        </View>
                      )}
                      <Chip mode="outlined" compact style={styles.typeChip}>
                        {subject.type}
                      </Chip>
                    </View>
                    <MaterialCommunityIcons
                      name={getStatusIcon(subject.attendancePercentage)}
                      size={32}
                      color={getAttendanceColor(subject.attendancePercentage)}
                    />
                  </View>

                  {/* Attendance Stats */}
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text variant="bodySmall" style={styles.statLabel}>
                        Attended
                      </Text>
                      <Text variant="titleMedium" style={styles.statValue}>
                        {subject.attendedClasses}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text variant="bodySmall" style={styles.statLabel}>
                        Total
                      </Text>
                      <Text variant="titleMedium" style={styles.statValue}>
                        {subject.totalClasses}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text variant="bodySmall" style={styles.statLabel}>
                        Percentage
                      </Text>
                      <Text
                        variant="titleMedium"
                        style={[styles.statValue, { color: getAttendanceColor(subject.attendancePercentage) }]}
                      >
                        {subject.attendancePercentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>

                  <ProgressBar
                    progress={subject.attendancePercentage / 100}
                    color={getAttendanceColor(subject.attendancePercentage)}
                    style={styles.progressBar}
                  />

                  {/* Mark Attendance Button */}
                  <Button
                    mode="contained"
                    onPress={() => {
                      setSelectedSubject(subject);
                      setShowMarkModal(true);
                      loadAttendanceDates(subject.id);
                    }}
                    style={styles.markButton}
                    icon="calendar-check"
                  >
                    Mark Attendance
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Mark Attendance Modal */}
      <Portal>
        <Modal
          visible={showMarkModal}
          onDismiss={() => {
            setShowMarkModal(false);
            setSelectedSubject(null);
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Mark Attendance
          </Text>

          {selectedSubject && (
            <>
              <Text variant="titleMedium" style={styles.selectedSubject}>
                {selectedSubject.name}
              </Text>

              {/* Calendar */}
              <Calendar
                current={selectedDate}
                onDayPress={(day) => {
                  // Only allow selecting today or past dates
                  const selectedDateObj = new Date(day.dateString);
                  const today = new Date();
                  today.setHours(23, 59, 59, 999); // End of today

                  if (selectedDateObj <= today) {
                    setSelectedDate(day.dateString);
                    // Update marked dates to highlight new selection
                    setMarkedDates({
                      ...markedDates,
                      [day.dateString]: {
                        ...markedDates[day.dateString],
                        selected: true,
                        selectedColor: theme.colors.primary,
                      },
                    });
                  }
                }}
                maxDate={new Date().toISOString().split('T')[0]} // Disable future dates
                markedDates={markedDates}
                markingType={'dot'}
                theme={{
                  selectedDayBackgroundColor: theme.colors.primary,
                  todayTextColor: theme.colors.primary,
                  arrowColor: theme.colors.primary,
                  textDisabledColor: '#d9d9d9',
                  dotColor: theme.colors.primary,
                }}
                style={styles.calendar}
              />

              <Divider style={styles.divider} />

              {/* Status Selection */}
              <Text variant="titleSmall" style={styles.label}>
                Attendance Status
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

              {/* Notes */}
              <TextInput
                label="Notes (Optional)"
                value={notes}
                onChangeText={setNotes}
                mode="outlined"
                multiline
                numberOfLines={2}
                style={styles.input}
                placeholder="Add any notes..."
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowMarkModal(false);
                    setSelectedSubject(null);
                  }}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button mode="contained" onPress={handleMarkAttendance} style={styles.modalButton}>
                  Save Attendance
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
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyCard: {
    marginTop: 40,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 8,
  },
  subjectsList: {
    gap: 16,
  },
  subjectCard: {
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontWeight: 'bold',
  },
  subjectCode: {
    opacity: 0.7,
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  detailText: {
    opacity: 0.7,
  },
  typeChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  markButton: {
    marginTop: 8,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  selectedSubject: {
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  calendar: {
    marginBottom: 16,
    borderRadius: 8,
  },
  divider: {
    marginVertical: 16,
  },
  label: {
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
  todayCard: {
    marginBottom: 16,
    elevation: 2,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  todayTitle: {
    fontWeight: 'bold',
  },
  todaySubtitle: {
    opacity: 0.7,
    marginBottom: 12,
  },
  todayDivider: {
    marginBottom: 12,
  },
  todayClassItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: 12,
  },
  todayClassTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 80,
  },
  timeText: {
    fontWeight: '600',
  },
  todayClassInfo: {
    flex: 1,
    gap: 2,
  },
  todayClassDetail: {
    opacity: 0.7,
  },
});
