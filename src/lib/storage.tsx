// src/lib/storage.ts
import { Platform } from 'react-native';

type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

let storage: StorageLike;

if (Platform.OS === 'web') {
  // 웹: localStorage 사용 (브라우저 환경에서만 실행됨)
  storage = {
    getItem: async (key: string) => {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(key);
    },
  };
} else {
  // 모바일: AsyncStorage 사용
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  storage = AsyncStorage;
}

export default storage;