import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, Button, useTheme, Card, SegmentedButtons, TextInput as PaperInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TimetableEntry } from '../../types/user';

interface TimetableManualEntryScreenProps {
  onNext: (timetable: TimetableEntry[]) => void;
  onSkip: () => void;
  initialTimetable?: TimetableEntry[];
}

export default function TimetableManualEntryScreen({
  onNext,
  onSkip,
  initialTimetable = []
}: TimetableManualEntryScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [timetable, setTimetable] = useState<TimetableEntry[]>(initialTimetable);

  // Form state
  const [manualDay, setManualDay] = useState('Monday');
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualEndTime, setManualEndTime] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualSubjectCode, setManualSubjectCode] = useState('');
  const [manualType, setManualType] = useState<'lecture' | 'lab' | 'tutorial' | 'practical' | 'seminar'>('lecture');
  const [manualRoom, setManualRoom] = useState('');
  const [manualFaculty, setManualFaculty] = useState('');

  // Time pickers
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [manualStartDate, setManualStartDate] = useState(new Date());
  const [manualEndDate, setManualEndDate] = useState(new Date());

  const generateTimetableId = () => `timetable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const formatTimeString = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const h = hours % 12 === 0 ? 12 : hours % 12;
    const period = hours < 12 ? 'AM' : 'PM';
    return `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const validateTimeSlot = (newEntry: any) => {
    const duplicate = timetable.find(e =>
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

  const handleAddEntry = () => {
    if (!manualSubject.trim() || !manualStartTime.trim() || !manualEndTime.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields (Subject, Start Time, End Time)');
      return;
    }

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
    const validation = validateTimeSlot(entry);
    if (!validation.valid) {
      Alert.alert('Duplicate Time Slot', validation.message);
      return;
    }

    // Add to timetable
    setTimetable([...timetable, entry]);

    // Reset form
    setManualSubject('');
    setManualSubjectCode('');
    setManualStartTime('');
    setManualEndTime('');
    setManualRoom('');
    setManualFaculty('');
    setManualType('lecture');

    Alert.alert('Success', 'Class added! Add more or continue to next step.');
  };

  const handleRemoveEntry = (id: string) => {
    setTimetable(timetable.filter(entry => entry.id !== id));
  };

  const handleContinue = () => {
    if (timetable.length === 0) {
      Alert.alert(
        'No Timetable Added',
        'You haven\'t added any classes yet. Continue anyway?',
        [
          { text: 'Add Classes', style: 'cancel' },
          { text: 'Skip', onPress: () => onSkip() }
        ]
      );
      return;
    }

    onNext(timetable);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="timetable" size={48} color={theme.colors.primary} />
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
          Add Your Timetable
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Add classes one by one. You can edit anytime later.
        </Text>
      </View>

      {/* Added Classes Counter */}
      {timetable.length > 0 && (
        <Card style={styles.counterCard}>
          <Card.Content style={styles.counterContent}>
            <MaterialCommunityIcons name="calendar-check" size={20} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
              {timetable.length} {timetable.length === 1 ? 'class' : 'classes'} added
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Form Card */}
      <Card style={styles.formCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.formTitle}>
            Add New Class
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

          <Text variant="labelMedium" style={styles.fieldLabel}>Start Time *</Text>
          <Button
            mode="outlined"
            onPress={() => setShowStartTimePicker(true)}
            icon="clock-start"
            style={styles.timeButton}
            contentStyle={styles.timeButtonContent}
          >
            {manualStartTime || 'Select Start Time'}
          </Button>

          <Text variant="labelMedium" style={styles.fieldLabel}>End Time *</Text>
          <Button
            mode="outlined"
            onPress={() => setShowEndTimePicker(true)}
            icon="clock-end"
            style={styles.timeButton}
            contentStyle={styles.timeButtonContent}
          >
            {manualEndTime || 'Select End Time'}
          </Button>

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

          <Button
            mode="contained"
            onPress={handleAddEntry}
            icon="plus"
            style={styles.addButton}
            disabled={!manualSubject.trim() || !manualStartTime || !manualEndTime}
          >
            Add This Class
          </Button>
        </Card.Content>
      </Card>

      {/* Added Classes List */}
      {timetable.length > 0 && (
        <View style={styles.addedClassesSection}>
          <Text variant="titleMedium" style={styles.addedClassesTitle}>
            Added Classes
          </Text>
          {timetable.map((entry) => (
            <Card key={entry.id} style={styles.classCard}>
              <Card.Content>
                <View style={styles.classHeader}>
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
                  </View>
                  <Button
                    mode="text"
                    onPress={() => handleRemoveEntry(entry.id)}
                    textColor={theme.colors.error}
                    icon="delete"
                    compact
                  >
                    Remove
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <Button
        mode="contained"
        onPress={handleContinue}
        icon="arrow-right"
        style={styles.continueButton}
      >
        {timetable.length > 0 ? 'Continue to Next Step' : 'Skip for Now'}
      </Button>

      <Text variant="bodySmall" style={styles.footerNote}>
        * Required fields
      </Text>

      {/* Time Pickers */}
      {showStartTimePicker && (
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

      {showEndTimePicker && (
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
  },
  counterCard: {
    marginBottom: 16,
    elevation: 2,
  },
  counterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formCard: {
    marginBottom: 16,
    elevation: 2,
  },
  formTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fieldLabel: {
    marginBottom: 8,
    marginTop: 4,
  },
  dayButtonsRow: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  timeButton: {
    marginBottom: 16,
    justifyContent: 'flex-start',
  },
  timeButtonContent: {
    paddingVertical: 8,
    justifyContent: 'flex-start',
  },
  input: {
    marginBottom: 16,
  },
  addButton: {
    marginTop: 8,
  },
  addedClassesSection: {
    marginBottom: 16,
  },
  addedClassesTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  classCard: {
    marginBottom: 8,
    elevation: 1,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  continueButton: {
    marginBottom: 8,
  },
  footerNote: {
    textAlign: 'center',
    opacity: 0.6,
  },
});
