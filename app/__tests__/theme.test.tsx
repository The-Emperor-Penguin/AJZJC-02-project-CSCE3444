import { test, expect, describe } from '@jest/globals';
import { createThemeStyles } from '@/app/Theme';

describe('Testing createThemeStyles', () => {
    test('Returns dark background color when dark mode is enabled', () => {
        const styles = createThemeStyles(true, 'blue');
        expect(styles.container.backgroundColor).toBe('#0f172a');
    })
    test('Returns light background color when dark mode is disabled', () => {
        const styles = createThemeStyles(false, 'blue');
        expect(styles.container.backgroundColor).toBe('#ffffff');
    })
    test('Returns white text color when dark mode is enabled', () => {
        const styles = createThemeStyles(true, 'blue');
        expect(styles.text.color).toBe('#ffffff');
    })
    test('Returns black text color when dark mode is disabled', () => {
        const styles = createThemeStyles(false, 'blue');
        expect(styles.text.color).toBe('#000000');
    })
})