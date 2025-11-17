import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Portal, Dialog, Button, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function NetworkMonitor() {
  const theme = useTheme();
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;

      if (!isConnected && !wasOffline) {
        // Just went offline
        setShowOfflineDialog(true);
        setWasOffline(true);
      } else if (isConnected && wasOffline) {
        // Just came back online
        setShowOfflineDialog(false);
        setWasOffline(false);
        Alert.alert('Back Online', 'Internet connection restored!');
      }
    });

    // Check initial connection state
    NetInfo.fetch().then(state => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;
      if (!isConnected) {
        setShowOfflineDialog(true);
        setWasOffline(true);
      }
    });

    return () => unsubscribe();
  }, [wasOffline]);

  return (
    <Portal>
      <Dialog visible={showOfflineDialog} dismissable={false}>
        <Dialog.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
          <MaterialCommunityIcons
            name="wifi-off"
            size={64}
            color={theme.colors.error}
            style={{ marginBottom: 16 }}
          />
          <Text variant="headlineSmall" style={{ marginBottom: 8, fontWeight: 'bold' }}>
            No Internet Connection
          </Text>
          <Text variant="bodyMedium" style={{ textAlign: 'center', opacity: 0.7 }}>
            Please check your internet connection and try again.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowOfflineDialog(false)}>
            Dismiss
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
