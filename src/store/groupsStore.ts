import { create } from 'zustand';
import { Group, GroupMessage, GroupMember } from '../types/groups';

interface GroupsState {
  // Groups data
  myGroups: Group[];
  publicGroups: Group[];
  selectedGroup: Group | null;

  // Messages
  messages: GroupMessage[];

  // Members
  members: GroupMember[];
  currentUserRole: 'admin' | 'member' | null;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMessages: boolean;

  // UI state
  activeTab: 'my' | 'discover';
  searchQuery: string;

  // Actions
  setMyGroups: (groups: Group[]) => void;
  setPublicGroups: (groups: Group[]) => void;
  setSelectedGroup: (group: Group | null) => void;
  setMessages: (messages: GroupMessage[]) => void;
  setMembers: (members: GroupMember[]) => void;
  setCurrentUserRole: (role: 'admin' | 'member' | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsRefreshing: (refreshing: boolean) => void;
  setIsLoadingMessages: (loading: boolean) => void;
  setActiveTab: (tab: 'my' | 'discover') => void;
  setSearchQuery: (query: string) => void;

  // Group mutations
  addGroup: (group: Group) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  removeGroup: (groupId: string) => void;

  // Message mutations
  addMessage: (message: GroupMessage) => void;
  removeMessage: (messageId: string) => void;

  // Reset
  reset: () => void;
  resetGroupDetail: () => void;
}

const initialState = {
  myGroups: [],
  publicGroups: [],
  selectedGroup: null,
  messages: [],
  members: [],
  currentUserRole: null,
  isLoading: true,
  isRefreshing: false,
  isLoadingMessages: false,
  activeTab: 'my' as const,
  searchQuery: '',
};

export const useGroupsStore = create<GroupsState>((set, get) => ({
  ...initialState,

  setMyGroups: (groups) => set({ myGroups: groups }),
  setPublicGroups: (groups) => set({ publicGroups: groups }),
  setSelectedGroup: (group) => set({ selectedGroup: group }),
  setMessages: (messages) => set({ messages }),
  setMembers: (members) => set({ members }),
  setCurrentUserRole: (role) => set({ currentUserRole: role }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
  setIsLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addGroup: (group) => {
    const { myGroups } = get();
    set({ myGroups: [group, ...myGroups] });
  },

  updateGroup: (groupId, updates) => {
    const { myGroups, publicGroups, selectedGroup } = get();

    set({
      myGroups: myGroups.map(g => g.id === groupId ? { ...g, ...updates } : g),
      publicGroups: publicGroups.map(g => g.id === groupId ? { ...g, ...updates } : g),
      selectedGroup: selectedGroup?.id === groupId ? { ...selectedGroup, ...updates } : selectedGroup,
    });
  },

  removeGroup: (groupId) => {
    const { myGroups, publicGroups, selectedGroup } = get();

    set({
      myGroups: myGroups.filter(g => g.id !== groupId),
      publicGroups: publicGroups.filter(g => g.id !== groupId),
      selectedGroup: selectedGroup?.id === groupId ? null : selectedGroup,
    });
  },

  addMessage: (message) => {
    const { messages } = get();
    set({ messages: [...messages, message] });
  },

  removeMessage: (messageId) => {
    const { messages } = get();
    set({ messages: messages.filter(m => m.id !== messageId) });
  },

  reset: () => set(initialState),

  resetGroupDetail: () => set({
    selectedGroup: null,
    messages: [],
    members: [],
    currentUserRole: null,
    isLoadingMessages: false,
  }),
}));
