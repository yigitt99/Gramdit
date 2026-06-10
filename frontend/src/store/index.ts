import { create } from 'zustand';

interface StoreState {
  // Base state structure - empty for now
}

interface StoreActions {
  setState: (partial: Partial<StoreState>) => void;
  resetState: () => void;
}

type Store = StoreState & StoreActions;

const initialState: StoreState = {};

const useStore = create<Store>((set) => ({
  ...initialState,
  setState: (partial) => set((state) => ({ ...state, ...partial })),
  resetState: () => set(initialState),
}));

export default useStore;
