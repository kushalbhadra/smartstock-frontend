import axios from 'axios';

interface ApiErrorResponse {
    message?: unknown;
}

export function getApiErrorMessage(
    error: unknown,
    fallback: string
): string {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const message = error.response?.data?.message;
        if (typeof message === 'string' && message.trim()) {
            return message;
        }
    }
    return fallback;
}
