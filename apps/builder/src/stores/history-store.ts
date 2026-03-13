import { create } from 'zustand';

export interface Command {
  id: string;
  label: string;
  execute: () => void;
  undo: () => void;
}

const MAX_HISTORY = 50;
const COALESCE_WINDOW_MS = 300;

export interface HistoryStoreState {
  undoStack: Command[];
  redoStack: Command[];
  lastCommandTime: number;
  lastCommandLabel: string;
}

export interface HistoryStoreActions {
  push: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useHistoryStore = create<HistoryStoreState & HistoryStoreActions>()((set, get) => ({
  undoStack: [],
  redoStack: [],
  lastCommandTime: 0,
  lastCommandLabel: '',

  push: (command) => {
    const now = Date.now();
    const { lastCommandTime, lastCommandLabel, undoStack } = get();

    // Coalesce rapid sequential changes of the same type
    if (
      command.label === lastCommandLabel &&
      now - lastCommandTime < COALESCE_WINDOW_MS &&
      undoStack.length > 0
    ) {
      // Replace the top of the stack — keep the old undo, use new execute
      const top = undoStack[undoStack.length - 1];
      const coalesced: Command = {
        id: command.id,
        label: command.label,
        execute: command.execute,
        undo: top.undo, // original undo restores the earliest state
      };
      set({
        undoStack: [...undoStack.slice(0, -1), coalesced],
        redoStack: [],
        lastCommandTime: now,
        lastCommandLabel: command.label,
      });
      return;
    }

    command.execute();

    const nextStack = [...undoStack, command];
    if (nextStack.length > MAX_HISTORY) {
      nextStack.shift();
    }

    set({
      undoStack: nextStack,
      redoStack: [],
      lastCommandTime: now,
      lastCommandLabel: command.label,
    });
  },

  undo: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return;

    const command = undoStack[undoStack.length - 1];
    command.undo();

    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, command],
      lastCommandTime: 0,
      lastCommandLabel: '',
    });
  },

  redo: () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) return;

    const command = redoStack[redoStack.length - 1];
    command.execute();

    set({
      undoStack: [...undoStack, command],
      redoStack: redoStack.slice(0, -1),
      lastCommandTime: 0,
      lastCommandLabel: '',
    });
  },

  clear: () => set({ undoStack: [], redoStack: [], lastCommandTime: 0, lastCommandLabel: '' }),
  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,
}));
