import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoggedIn: false,

  login: async (token, user) => {
    await AsyncStorage.setItem("auth_token", token);
    await AsyncStorage.setItem("auth_user", JSON.stringify(user));
    set({ token, user, isLoggedIn: true });
  },

  logout: async () => {
    try {
      await apiClient.delete("/users/logout");
    } catch (err) {
      // ігноруємо помилку
    }
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("auth_user");
    set({ token: null, user: null, isLoggedIn: false });
  },

  restoreSession: async () => {
    const token = await AsyncStorage.getItem("auth_token");
    const userJson = await AsyncStorage.getItem("auth_user");
    if (token && userJson) {
      set({ token, user: JSON.parse(userJson), isLoggedIn: true });
    }
  },
}));
