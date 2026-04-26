import { beforeEach, jest } from "@jest/globals";


jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockSecureStoreMemory = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStoreMemory.set(key, value);
  }),
  getItemAsync: jest.fn(async (key: string) => {
    return mockSecureStoreMemory.has(key) ? mockSecureStoreMemory.get(key)! : null;
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStoreMemory.delete(key);
  }),
  isAvailableAsync: jest.fn(async () => true),
}));

beforeEach(() => {
  mockSecureStoreMemory.clear();
  jest.clearAllMocks();
});