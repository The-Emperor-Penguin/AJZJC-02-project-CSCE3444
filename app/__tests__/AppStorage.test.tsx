import { test, expect, describe } from '@jest/globals';
import {
  saveItem,
  getItem,
  deleteItem,
  saveInsecureItem,
  getInsecureItem,
  deleteInsecureItem
} from '@/app/AppStorage';

describe('Test Secure Store (SecureStore)', () => {
    test('Allows storage and retrieval of string pairs', async () => {
        await saveItem("test_key", "test_value");
        const did_store = await getItem("test_key");
        expect(did_store).toBe("test_value");
    });
    test('Allows deletion of values', async () => {
        await saveItem("test_key", "test_value");
        await deleteItem("test_key");
        const did_store = await getItem("test_key");
        expect(did_store).toBeNull();
    });
    test('Returns null for non existing values', async () => {
        const did_store = await getItem("non_existing_key");
        expect(did_store).toBeNull();
    });
});

describe('Test Insecure Store (AsyncStorage)', () => {
    test('Allows storage and retrieval of key-value pairs', async () => {
        await saveInsecureItem("insecure_key", "insecure_val");
        const stored = await getInsecureItem("insecure_key");
        expect(stored).toBe("insecure_val");
    });

    test('Allows deletion of insecure values', async () => {
        await saveInsecureItem("insecure_key", "insecure_val");
        await deleteInsecureItem("insecure_key");
        const stored = await getInsecureItem("insecure_key");
        expect(stored).toBeNull();
    });

    test('Returns null for non-existing insecure key', async () => {
        const stored = await getInsecureItem("non_existing_insecure");
        expect(stored).toBeNull();
    });
});
});