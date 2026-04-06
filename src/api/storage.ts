// src/api/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export const storage = {
  getString: async (key: string): Promise<string | null> => {
    return await AsyncStorage.getItem(key);
  },
  set: async (key: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(key, value);
  },
  delete: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },
};
