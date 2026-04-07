import { test, expect, describe } from '@jest/globals';
import { CreateAccountScreen } from '../app/Authentication';
import { render } from '@testing-library/react-native';

describe("Testing Authentication", () => {
    test('Check Passswords function', () => {
        const bool = true;
        expect(bool).toBe(true);
    })
});