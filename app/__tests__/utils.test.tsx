import { test, expect, describe, jest } from '@jest/globals';
import { pickerToTag, fetchWithTimeout } from '@/app/utils';

describe('White-Box: pickerToTag Mapping & Fallback', () => {
    test('Clothing type dictionary: maps categories to human-readable names', () => {
        expect(pickerToTag('t-shirt')).toBe('T-Shirt');
        expect(pickerToTag('long-sleeve')).toBe('Long Sleeve');
        expect(pickerToTag('button-up')).toBe('Button-Up');
        expect(pickerToTag('polo')).toBe('Polo');
        expect(pickerToTag('sweater')).toBe('Sweater');
        expect(pickerToTag('hoodie')).toBe('Hoodie');
        expect(pickerToTag('jacket')).toBe('Jacket');
        expect(pickerToTag('coat')).toBe('Coat');
        expect(pickerToTag('blazer')).toBe('Blazer');
        expect(pickerToTag('jeans')).toBe('Jeans');
        expect(pickerToTag('pants')).toBe('Pants');
        expect(pickerToTag('shorts')).toBe('Shorts');
        expect(pickerToTag('skirt')).toBe('Skirt');
        expect(pickerToTag('dress')).toBe('Dress');
        expect(pickerToTag('jumpsuit')).toBe('Jumpsuit');
        expect(pickerToTag('suit')).toBe('Suit');
        expect(pickerToTag('activewear')).toBe('Activewear');
        expect(pickerToTag('sleepwear')).toBe('Sleepwear');
        expect(pickerToTag('underwear')).toBe('Underwear');
        expect(pickerToTag('shoes')).toBe('Shoes');
    });

    test('Color dictionary: maps color codes to capitalized display names', () => {
        expect(pickerToTag('black')).toBe('Black');
        expect(pickerToTag('white')).toBe('White');
        expect(pickerToTag('gray')).toBe('Gray');
        expect(pickerToTag('blue')).toBe('Blue');
        expect(pickerToTag('green')).toBe('Green');
        expect(pickerToTag('red')).toBe('Red');
        expect(pickerToTag('pink')).toBe('Pink');
        expect(pickerToTag('purple')).toBe('Purple');
        expect(pickerToTag('yellow')).toBe('Yellow');
        expect(pickerToTag('orange')).toBe('Orange');
        expect(pickerToTag('brown')).toBe('Brown');
        expect(pickerToTag('beige')).toBe('Beige');
        expect(pickerToTag('teal')).toBe('Teal');
    });

    test('Nullish Coalescing Branch: returns original input when value is not in dictionary', () => {
        expect(pickerToTag('scarf')).toBe('scarf');
        expect(pickerToTag('custom-tag-123')).toBe('custom-tag-123');
        expect(pickerToTag('')).toBe('');
    });
});

describe('White-Box: fetchWithTimeout Control Flow', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    test('Path 1: Successful fetch (response.ok = true) returns response', async () => {
        const mockResponse = { ok: true, status: 200, json: async () => ({ data: 'ok' }) };
        global.fetch = jest.fn().mockImplementation(async () => mockResponse as any);

        const res = await fetchWithTimeout('http://localhost:3000/test', { timeout: 1000 });
        expect(res.ok).toBe(true);
        expect(res.status).toBe(200);
    });

    test('Path 2: Non-ok response (!response.ok) throws HTTP status error', async () => {
        const mockResponse = { ok: false, status: 404 };
        global.fetch = jest.fn().mockImplementation(async () => mockResponse as any);

        await expect(fetchWithTimeout('http://localhost:3000/not-found', { timeout: 1000 }))
            .rejects
            .toThrow('HTTP 404');
    });

    test('Path 3: Network error propagates out', async () => {
        global.fetch = jest.fn().mockImplementation(async () => {
            throw new Error('Connection refused');
        });

        await expect(fetchWithTimeout('http://localhost:3000/offline', { timeout: 1000 }))
            .rejects
            .toThrow('Connection refused');
    });
});
})