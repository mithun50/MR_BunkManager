import { create } from 'zustand';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string;
  initialized: boolean;
  lastOnlineTime: Date | null;
  lastOfflineTime: Date | null;

  // Actions
  setNetworkState: (state: NetInfoState) => void;
  initialize: () => () => void;
  checkConnection: () => Promise<boolean>;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isConnected: true,
  isInternetReachable: null,
  connectionType: 'unknown',
  initialized: false,
  lastOnlineTime: null,
  lastOfflineTime: null,

  setNetworkState: (state: NetInfoState) => {
    const wasConnected = get().isConnected;
    const isNowConnected = state.isConnected && state.isInternetReachable !== false;

    set({
      isConnected: state.isConnected ?? true,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type || 'unknown',
      initialized: true,
      lastOnlineTime: isNowConnected && !wasConnected ? new Date() : get().lastOnlineTime,
      lastOfflineTime: !isNowConnected && wasConnected ? new Date() : get().lastOfflineTime,
    });

    // Log connection changes
    if (wasConnected !== isNowConnected) {
      console.log(
        isNowConnected
          ? '🌐 Network: Connected'
          : '📡 Network: Disconnected'
      );
    }
  },

  initialize: () => {
    // Initial network state check
    NetInfo.fetch().then((state) => {
      get().setNetworkState(state);
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      get().setNetworkState(state);
    });

    return unsubscribe;
  },

  checkConnection: async () => {
    const state = await NetInfo.fetch();
    get().setNetworkState(state);
    return state.isConnected && state.isInternetReachable !== false;
  },
}));
