import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
    DashboardSkeleton,
    ForecastSkeleton,
    NotificationSkeleton,
    TableSkeleton,
} from './Spinner';

describe('loading skeletons', () => {
    it('renders dashboard, forecast, and notification loading states', () => {
        const { unmount } = render(<DashboardSkeleton />);
        expect(screen.getByLabelText('Loading dashboard')).toBeInTheDocument();
        expect(document.querySelector('.animate-pulse')).toBeInTheDocument();

        unmount();
        const { rerender } = render(<ForecastSkeleton />);
        expect(screen.getByLabelText('Loading forecasts')).toBeInTheDocument();

        rerender(<NotificationSkeleton />);
        expect(screen.getByLabelText('Loading notifications')).toBeInTheDocument();
    });

    it('renders the requested number of table placeholder cells', () => {
        const { container } = render(<TableSkeleton cols={3} rows={2} />);

        expect(container.querySelectorAll('.animate-pulse')).toHaveLength(6);
    });
});
