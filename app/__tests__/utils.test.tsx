import { test, expect, describe } from '@jest/globals';
import { pickerToTag } from '@/app/utils';

describe('Testing pickerToTag', () => {
    test('Correctly maps clothing type to display name', () => {
        const result = pickerToTag('t-shirt');
        expect(result).toBe('T-Shirt');
    })
    test('Correctly maps color to display name', () => {
        const result = pickerToTag('black');
        expect(result).toBe('Black');
    })
    test('Returns original string for unknown value', () => {
        const result = pickerToTag('unknown-value');
        expect(result).toBe('unknown-value');
    })
})