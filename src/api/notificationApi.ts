import axiosInstance from './axiosInstance';
import type {
    AppNotification,
    NotificationPage,
    NotificationSeverity,
    NotificationType,
} from '../types';

export const NOTIFICATIONS_UPDATED_EVENT = 'smartstock-notifications-updated';

export interface NotificationFilters {
    type?: NotificationType | '';
    severity?: NotificationSeverity | '';
    active?: boolean | '';
    unread?: boolean | '';
    page?: number;
    size?: number;
}

export const notificationApi = {
    getUnreadCount: async (): Promise<number> => {
        const response = await axiosInstance.get<{ count: number }>(
            '/api/notifications/unread-count'
        );
        return response.data.count;
    },

    getRecent: async (limit = 8): Promise<AppNotification[]> => {
        const response = await axiosInstance.get<AppNotification[]>(
            '/api/notifications/recent',
            { params: { limit } }
        );
        return response.data;
    },

    getAll: async (
        filters: NotificationFilters
    ): Promise<NotificationPage> => {
        const response = await axiosInstance.get<NotificationPage>(
            '/api/notifications',
            { params: filters }
        );
        return response.data;
    },

    markAsRead: async (id: number): Promise<AppNotification> => {
        const response = await axiosInstance.patch<AppNotification>(
            `/api/notifications/${id}/read`
        );
        return response.data;
    },

    markAllAsRead: async (): Promise<number> => {
        const response = await axiosInstance.patch<{ updated: number }>(
            '/api/notifications/read-all'
        );
        return response.data.updated;
    },
};
