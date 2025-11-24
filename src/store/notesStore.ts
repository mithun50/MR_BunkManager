import { create } from 'zustand';

interface NoteInteraction {
  isLiked: boolean;
  isSaved: boolean;
  likesCount: number;
}

interface NotesState {
  // Map of noteId -> interaction state
  interactions: Record<string, NoteInteraction>;

  // Update a note's like state
  setLiked: (noteId: string, isLiked: boolean, likesCount: number) => void;

  // Update a note's save state
  setSaved: (noteId: string, isSaved: boolean) => void;

  // Initialize or update interaction for a note
  setInteraction: (noteId: string, interaction: NoteInteraction) => void;

  // Bulk set interactions (for when loading notes)
  setInteractions: (interactions: Record<string, NoteInteraction>) => void;

  // Get interaction for a note (returns undefined if not in store)
  getInteraction: (noteId: string) => NoteInteraction | undefined;

  // Clear all interactions (e.g., on logout)
  clearInteractions: () => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  interactions: {},

  setLiked: (noteId, isLiked, likesCount) => {
    set((state) => ({
      interactions: {
        ...state.interactions,
        [noteId]: {
          ...state.interactions[noteId],
          isLiked,
          likesCount,
        },
      },
    }));
  },

  setSaved: (noteId, isSaved) => {
    set((state) => ({
      interactions: {
        ...state.interactions,
        [noteId]: {
          ...state.interactions[noteId],
          isSaved,
        },
      },
    }));
  },

  setInteraction: (noteId, interaction) => {
    set((state) => ({
      interactions: {
        ...state.interactions,
        [noteId]: interaction,
      },
    }));
  },

  setInteractions: (interactions) => {
    set((state) => ({
      interactions: {
        ...state.interactions,
        ...interactions,
      },
    }));
  },

  getInteraction: (noteId) => {
    return get().interactions[noteId];
  },

  clearInteractions: () => {
    set({ interactions: {} });
  },
}));
