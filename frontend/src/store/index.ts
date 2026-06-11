import { create } from 'zustand';
import { User } from '../types/auth';

interface StoreState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface StoreActions {
  setState: (partial: Partial<StoreState>) => void;
  resetState: () => void;
  loginSuccess: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

type Store = StoreState & StoreActions;

const storedToken = localStorage.getItem('gramdit_token');
const storedUser = localStorage.getItem('gramdit_user');
let initialUser: User | null = null;

try {
  if (storedUser) {
    initialUser = JSON.parse(storedUser);
  }
} catch (error) {
  console.error('Failed to parse initial user from local storage:', error);
}

const initialState: StoreState = {
  user: initialUser,
  token: storedToken,
  isAuthenticated: !!storedToken,
};

const useStore = create<Store>((set) => ({
  ...initialState,
  setState: (partial) => set((state) => ({ ...state, ...partial })),
  resetState: () => {
    localStorage.removeItem('gramdit_token');
    localStorage.removeItem('gramdit_refresh_token');
    localStorage.removeItem('gramdit_user');
    set(initialState);
  },
  loginSuccess: (user, accessToken, refreshToken) => {
    localStorage.setItem('gramdit_token', accessToken);
    localStorage.setItem('gramdit_refresh_token', refreshToken);
    localStorage.setItem('gramdit_user', JSON.stringify(user));
    set({ user, token: accessToken, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('gramdit_token');
    localStorage.removeItem('gramdit_refresh_token');
    localStorage.removeItem('gramdit_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));


export default useStore;
