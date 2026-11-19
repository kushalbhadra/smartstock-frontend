import { describe, expect, it } from 'vitest';
import {
    normalizeEmail,
    validateEmail,
    validatePasswordStrength,
} from './contactValidation';

describe('contact validation', () => {
    it('normalizes email and rejects malformed addresses', () => {
        expect(normalizeEmail('  User@Example.com ')).toBe('user@example.com');
        expect(validateEmail('not-an-email', true)).toContain('valid email');
    });

    it('enforces password length, ASCII letter, number, and BCrypt byte limit', () => {
        expect(validatePasswordStrength('short1')).toContain('at least 8');
        expect(validatePasswordStrength('longpassword')).toContain(
            'letter and one number'
        );
        expect(validatePasswordStrength(`Abc12345${'é'.repeat(33)}`))
            .toContain('72 UTF-8 bytes');
        expect(validatePasswordStrength('GoodsPilot123')).toBeUndefined();
    });
});
