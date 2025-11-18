import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetworkStore } from '../store/networkStore';

interface QueuedOperation {
  id: string;
  type: 'attendance' | 'profile' | 'subject' | 'timetable';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

const QUEUE_KEY = '@offline_queue';
const MAX_RETRIES = 3;

class OfflineQueueService {
  private queue: QueuedOperation[] = [];
  private processing = false;

  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`📦 Loaded ${this.queue.length} queued operations`);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  async addToQueue(
    type: QueuedOperation['type'],
    operation: QueuedOperation['operation'],
    data: any
  ): Promise<void> {
    const queuedOp: QueuedOperation = {
      id: `${type}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedOp);
    await this.saveQueue();
    console.log(`📥 Queued ${type} ${operation} operation:`, queuedOp.id);
  }

  async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    const { isConnected, isInternetReachable } = useNetworkStore.getState();
    if (!isConnected || isInternetReachable === false) {
      console.log('📡 Offline - skipping queue processing');
      return;
    }

    this.processing = true;
    console.log(`🔄 Processing ${this.queue.length} queued operations...`);

    const failedOps: QueuedOperation[] = [];

    for (const op of this.queue) {
      try {
        await this.executeOperation(op);
        console.log(`✅ Processed queued operation: ${op.id}`);
      } catch (error) {
        console.error(`❌ Failed to process operation ${op.id}:`, error);

        op.retryCount++;
        if (op.retryCount < MAX_RETRIES) {
          failedOps.push(op);
        } else {
          console.warn(`⚠️ Dropping operation ${op.id} after ${MAX_RETRIES} retries`);
        }
      }
    }

    this.queue = failedOps;
    await this.saveQueue();
    this.processing = false;

    if (this.queue.length === 0) {
      console.log('✅ All queued operations processed successfully');
    } else {
      console.log(`⏳ ${this.queue.length} operations still pending`);
    }
  }

  private async executeOperation(op: QueuedOperation): Promise<void> {
    // Import services dynamically to avoid circular dependencies
    const firestoreService = (await import('./firestoreService')).default;

    switch (op.type) {
      case 'attendance':
        if (op.operation === 'create') {
          await firestoreService.addAttendanceRecord(op.data.uid, op.data.record);
        } else if (op.operation === 'update') {
          await firestoreService.updateSubjectAttendance(
            op.data.uid,
            op.data.subjectId,
            op.data.attended,
            op.data.isLeave
          );
        }
        break;

      case 'profile':
        if (op.operation === 'update') {
          await firestoreService.updateUserProfile(op.data.uid, op.data.profileData);
        }
        break;

      case 'subject':
        if (op.operation === 'create') {
          await firestoreService.addSubject(op.data.uid, op.data.subject);
        } else if (op.operation === 'delete') {
          await firestoreService.deleteSubject(op.data.uid, op.data.subjectId);
        }
        break;

      case 'timetable':
        if (op.operation === 'update') {
          await firestoreService.saveTimetable(op.data.uid, op.data.timetable);
        }
        break;

      default:
        throw new Error(`Unknown operation type: ${op.type}`);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  async getQueueLength(): Promise<number> {
    return this.queue.length;
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    await AsyncStorage.removeItem(QUEUE_KEY);
    console.log('🗑️ Offline queue cleared');
  }
}

export default new OfflineQueueService();
