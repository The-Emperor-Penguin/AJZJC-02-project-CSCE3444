import { test, expect, describe } from '@jest/globals';
import { CheckEmail, CheckPasswords } from '../app/Authentication';
import { render } from '@testing-library/react-native';

describe("Testing Password Checker", () => {
    test('See if password check disallow space', () => {
        const good_password = CheckPasswords("asd a", "asd a"); 
        expect(good_password).toBe(false);
    })
    test('See if password check allows symbols', () => {
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

describe('Testing Email Checker', () => {
    test('See if email checker disallows non url endings', () => {
        const good_email = CheckEmail("test@example");
        expect(good_email).toBe(false);
    })
    test('See if email checker allows urls with two characters for tld', () => {
        const good_email = CheckEmail('test@example.co');
        expect(good_email).toBe(true);
    })
    test('Disallow multiple @ signs', () => {
        const good_email = CheckEmail('test@@@example.co');
        expect(good_email).toBe(false);
    })
    test('Disallow no domain name', () => {
        const good_email = CheckEmail('test@.com');
        expect(good_email).toBe(false);
    })
    test('Disallow no TLD', () => {
        const good_email = CheckEmail('test@example.');
        expect(good_email).toBe(false);
    })

});