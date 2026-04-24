import { test, expect, describe } from '@jest/globals';
import { CheckPasswords } from '../app/Authentication';
import { render } from '@testing-library/react-native';

describe("Testing Authentication", () => {
    test('See if password check disallow space', () => {
        const good_password = CheckPasswords("asd a 120 -#@#!@$!#@%$^%^", "asd a 120 -#@#!@$!#@%$^%^"); 
        expect(good_password).toBe(false);
    })
});