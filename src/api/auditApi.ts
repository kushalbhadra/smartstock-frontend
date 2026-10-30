import axiosInstance from './axiosInstance';

export interface AuditEvent {
    id: number;
    actorEmail: string;
    actorName: string;
    action: string;
    entityType: string;
    entityId: number | null;
    details: string;
    createdAt: string;
}

export const auditApi = {
    getRecent: async (): Promise<AuditEvent[]> => {
        const response = await axiosInstance.get('/api/audit');
        return response.data;
    },
};
