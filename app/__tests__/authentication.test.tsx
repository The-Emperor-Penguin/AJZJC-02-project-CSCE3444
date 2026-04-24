import { test, expect, describe } from '@jest/globals';
import { CheckPasswords } from '../app/Authentication';
import { render } from '@testing-library/react-native';

describe("Testing Password Checker", () => {
    test('See if password check disallow space', () => {
        const good_password = CheckPasswords("asd a", "asd a"); 
        expect(good_password).toBe(false);
    })
    test('See if password check allows symbles', () => {
        const good_password = CheckPasswords("asd%#$@#$", "asd%#$@#$"); 
        expect(good_password).toBe(true);
    })
    test('See if password check disallows 33 characters', () => {
        let pass = "a";
        const good_password = CheckPasswords(pass.repeat(33), pass.repeat(33)); 
        expect(good_password).toBe(false);
    })
    test('See if password check allows 32 characters', () => {
        let pass = "a";
        const good_password = CheckPasswords(pass.repeat(32), pass.repeat(32)); 
        expect(good_password).toBe(true);
    })
    test('See if password check disallows 0 characters', () => {
        const good_password = CheckPasswords("", ""); 
        expect(good_password).toBe(false);
    })
    test('See if password check disallows different passwords', () => {
        const good_password = CheckPasswords("asasd", "asdjsxcz"); 
        expect(good_password).toBe(false);
    })
});