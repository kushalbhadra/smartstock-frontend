import axiosInstance from './axiosInstance';

export type TicketStatus = 'OPEN' | 'RESOLVED';

export interface SupportTicket {
    id: number;
    requesterName: string;
    requesterEmail: string;
    subject: string;
    message: string;
    status: TicketStatus;
    createdAt: string;
}

export const supportApi = {
    getTickets: async (): Promise<SupportTicket[]> => {
        const response = await axiosInstance.get('/api/support/tickets');
        return response.data;
    },

    createTicket: async (
        subject: string,
        message: string
    ): Promise<SupportTicket> => {
        const response = await axiosInstance.post('/api/support/tickets', {
            subject,
            message,
        });
        return response.data;
    },

    resolveTicket: async (id: number): Promise<SupportTicket> => {
        const response = await axiosInstance.put(
            `/api/support/tickets/${id}/status`,
            null,
            { params: { status: 'RESOLVED' } }
        );
        return response.data;
    },
};
