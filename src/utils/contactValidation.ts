const EMAIL_PATTERN =
    /^(?!\.)(?!.*\.\.)[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+(?<!\.)@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
const INDIAN_MOBILE_PATTERN = /^(?:\+91)?[6-9]\d{9}$/;

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function validateEmail(
    email: string,
    required = false
): string | undefined {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        return required ? 'Email is required.' : undefined;
    }
    if (normalizedEmail.length > 150
            || !EMAIL_PATTERN.test(normalizedEmail)) {
        return 'Enter a valid email address, such as example@gmail.com.';
    }
    return undefined;
}

export function validateIndianPhone(
    phone: string
): string | undefined {
    if (!phone) return undefined;
    if (!INDIAN_MOBILE_PATTERN.test(phone)) {
        return 'Enter a 10-digit Indian mobile number, optionally prefixed with +91.';
    }
    return undefined;
}

export function normalizeIndianPhone(phone: string): string {
    return phone.startsWith('+91') ? phone.slice(3) : phone;
}

export function validatePasswordStrength(
    password: string
): string | undefined {
    if (password.length < 8) {
        return 'Password must be at least 8 characters long.';
    }
    if (new TextEncoder().encode(password).length > 72) {
        return 'Password must be no more than 72 UTF-8 bytes.';
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return 'Password must contain at least one letter and one number.';
    }
    return undefined;
}
