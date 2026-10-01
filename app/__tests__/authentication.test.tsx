import { test, expect, describe } from '@jest/globals';
import { CheckEmail, CheckPasswords } from '../app/Authentication';

describe("White-Box: CheckPasswords Coverage", () => {
    // Branch 1: Regex test /^[!-~]+$/ (printable ASCII without space)
    test('Regex Branch: Disallows spaces in password', () => {
        expect(CheckPasswords("asd a", "asd a")).toBe(false);
        expect(CheckPasswords(" pass", " pass")).toBe(false);
        expect(CheckPasswords("pass ", "pass ")).toBe(false);
    });

    test('Regex Branch: Disallows tab and newline characters', () => {
        expect(CheckPasswords("pass\t123", "pass\t123")).toBe(false);
        expect(CheckPasswords("pass\n123", "pass\n123")).toBe(false);
    });

    test('Regex Branch: Disallows non-ASCII and Unicode characters', () => {
        expect(CheckPasswords("pass🔑123", "pass🔑123")).toBe(false);
        expect(CheckPasswords("pàssword", "pàssword")).toBe(false);
    });

    test('Regex Branch: Allows standard printable ASCII punctuation and symbols', () => {
        expect(CheckPasswords("asd%#$@#$", "asd%#$@#$")).toBe(true);
        expect(CheckPasswords("P@ssw0rd!~_=", "P@ssw0rd!~_=")).toBe(true);
    });

    // Branch 2: Boundary Value Analysis on Length (max 32 chars)
    test('Boundary Length: Rejects empty string (0 characters)', () => {
        expect(CheckPasswords("", "")).toBe(false);
    });

    test('Boundary Length: Accepts minimum length (1 character)', () => {
        expect(CheckPasswords("a", "a")).toBe(true);
    });

    test('Boundary Length: Accepts exact upper limit (32 characters)', () => {
        const pass32 = "a".repeat(32);
        expect(CheckPasswords(pass32, pass32)).toBe(true);
    });

    test('Boundary Length: Rejects upper boundary + 1 (33 characters)', () => {
        const pass33 = "a".repeat(33);
        expect(CheckPasswords(pass33, pass33)).toBe(false);
    });

    // Branch 3: Trimming check ((password.trim() === "") || (repassword.trim() === ""))
    test('Trimming Branch: Rejects whitespace-only inputs', () => {
        expect(CheckPasswords("   ", "   ")).toBe(false);
    });

    // Branch 4: Equality comparison (password === repassword)
    test('Equality Branch: Returns true when passwords match perfectly', () => {
        expect(CheckPasswords("StrongPass123!", "StrongPass123!")).toBe(true);
    });

    test('Equality Branch: Returns false when passwords differ', () => {
        expect(CheckPasswords("asasd", "asdjsxcz")).toBe(false);
        expect(CheckPasswords("Pass1234", "pass1234")).toBe(false); // case sensitive mismatch
    });
});

describe('White-Box: CheckEmail Coverage', () => {
    // Valid patterns
    test('Valid Format: Standard standard domain', () => {
        expect(CheckEmail('test@example.com')).toBe(true);
        expect(CheckEmail('pilot.app@sub.domain.co')).toBe(true);
    });

    test('Valid Format: Minimum two-character TLD', () => {
        expect(CheckEmail('test@example.co')).toBe(true);
        expect(CheckEmail('a@b.us')).toBe(true);
    });

    test('Valid Format: Case-insensitive conversion', () => {
        expect(CheckEmail('TEST@EXAMPLE.COM')).toBe(true);
        expect(CheckEmail('User.Name@Uni.Edu')).toBe(true);
    });

    test('Valid Format: Allowed special characters in local-part (+, _, -, %, .)', () => {
        expect(CheckEmail('user+tag_test-1%2@example.com')).toBe(true);
    });

    // Invalid patterns
    test('Invalid Format: Disallow missing @ sign', () => {
        expect(CheckEmail('testexample.com')).toBe(false);
    });

    test('Invalid Format: Disallow multiple @ signs', () => {
        expect(CheckEmail('test@@@example.co')).toBe(false);
        expect(CheckEmail('test@user@example.com')).toBe(false);
    });

    test('Invalid Format: Disallow missing domain name', () => {
        expect(CheckEmail('test@.com')).toBe(false);
    });

    test('Invalid Format: Disallow missing TLD', () => {
        expect(CheckEmail('test@example.')).toBe(false);
        expect(CheckEmail('test@example')).toBe(false);
    });

    test('Invalid Format: Disallow 1-character TLD', () => {
        expect(CheckEmail('test@example.c')).toBe(false);
    });

    test('Invalid Format: Disallow spaces in email', () => {
        expect(CheckEmail('test user@example.com')).toBe(false);
        expect(CheckEmail('test@ example.com')).toBe(false);
    });

    test('Invalid Format: Disallow empty string', () => {
        expect(CheckEmail('')).toBe(false);
    });
});
});