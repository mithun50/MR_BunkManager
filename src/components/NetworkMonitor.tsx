import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Portal, Dialog, Button, Text, useTheme, Banner, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNetworkStore } from '../store/networkStore';
import offlineQueueService from '../services/offlineQueueService';

export default function NetworkMonitor() {
  const theme = useTheme();
  const { isConnected, isInternetReachable, initialize } = useNetworkStore();
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const isOffline = !isConnected || isInternetReachable === false;

  useEffect(() => {
    // Initialize network store
    const unsubscribe = initialize();

    // Initialize offline queue
    offlineQueueService.initialize();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Update queue length
    const updateQueueLength = async () => {
      const length = await offlineQueueService.getQueueLength();
      setQueueLength(length);
    };

    updateQueueLength();
    const interval = setInterval(updateQueueLength, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Show/hide offline dialog based on connection
    if (isOffline) {
      setShowOfflineDialog(true);
    } else {
      setShowOfflineDialog(false);

      // Process queued operations when coming back online
      if (queueLength > 0) {
        syncQueuedOperations();
      }
    }
  }, [isOffline, queueLength]);

  const syncQueuedOperations = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      console.log('🔄 Syncing queued operations...');
      await offlineQueueService.processQueue();
      const remainingQueue = await offlineQueueService.getQueueLength();
      setQueueLength(remainingQueue);

      if (remainingQueue === 0) {
        console.log('✅ All operations synced successfully');
      }
    } catch (error) {
      console.error('Failed to sync queued operations:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      {/* Offline Banner - less intrusive than dialog */}
      {isOffline && (
        <Portal>
          <Banner
            visible={isOffline}
            icon={({ size }) => (
              <MaterialCommunityIcons
                name="cloud-off-outline"
                size={size}
                color={theme.colors.onSurface}
              />
            )}
            style={{
              backgroundColor: theme.colors.errorContainer,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
            }}
          >
            <View>
              <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: theme.colors.onErrorContainer }}>
                You're offline
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer, opacity: 0.8 }}>
                {queueLength > 0
                  ? `${queueLength} change${queueLength > 1 ? 's' : ''} will sync when online`
                  : 'You can still view cached data'}
              </Text>
            </View>
          </Banner>
        </Portal>
      )}

      {/* Syncing Indicator */}
      {isSyncing && (
        <Portal>
          <Banner
            visible={isSyncing}
            icon={({ size }) => (
              <ActivityIndicator size={size} />
            )}
            style={{
              backgroundColor: theme.colors.primaryContainer,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1001,
            }}
          >
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
              Syncing {queueLength} pending change{queueLength > 1 ? 's' : ''}...
            </Text>
          </Banner>
        </Portal>
      )}

      {/* Initial offline dialog (dismissable) */}
      <Portal>
        <Dialog visible={showOfflineDialog} dismissable={true} onDismiss={() => setShowOfflineDialog(false)}>
          <Dialog.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
            <MaterialCommunityIcons
              name="cloud-off-outline"
              size={64}
              color={theme.colors.error}
              style={{ marginBottom: 16 }}
            />
            <Text variant="headlineSmall" style={{ marginBottom: 8, fontWeight: 'bold' }}>
              You're Offline
            </Text>
            <Text variant="bodyMedium" style={{ textAlign: 'center', opacity: 0.7, marginBottom: 16 }}>
              No internet connection detected. You can still view your cached data, but changes won't sync until you're back online.
            </Text>
            {queueLength > 0 && (
              <View style={{
                backgroundColor: theme.colors.secondaryContainer,
                padding: 12,
                borderRadius: 8,
                width: '100%'
              }}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer, textAlign: 'center' }}>
                  📦 {queueLength} change{queueLength > 1 ? 's' : ''} waiting to sync
                </Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowOfflineDialog(false)}>
              Got it
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
