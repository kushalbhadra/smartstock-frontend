import axios from 'axios';

interface ApiErrorResponse {
    message?: unknown;
    referenceId?: unknown;
}

export function getApiErrorMessage(
    error: unknown,
    fallback: string
): string {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const message = error.response?.data?.message;
        if (typeof message === 'string' && message.trim()) {
            const referenceId = error.response?.data?.referenceId;
            return typeof referenceId === 'string' && referenceId.trim()
                ? `${message} (Reference ID: ${referenceId})`
                : message;
        }
    }
    return fallback;
}
