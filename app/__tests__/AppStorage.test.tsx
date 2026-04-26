import { test, expect, describe } from '@jest/globals';
import { saveItem, getItem, deleteItem } from '@/app/AppStorage';

describe('Test Secure Store', () => {
    test('Allows storage and retrieval of string pairs', async () => {
        await saveItem("test_key", "test_value");
        const did_store = await getItem("test_key");
        expect(did_store).toBe("test_value");
    })
    test('Allows deletion of values', async () => {
        await saveItem("test_key", "test_value");
        await deleteItem("test_key");
        const did_store = await getItem("test_key");
        expect(did_store).toBeNull();
    })
    test('Returns null for non existing values', async () => {
        const did_store = await getItem("test_key");
        expect(did_store).toBeNull();
    })
});