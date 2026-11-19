import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForecastsPage from './ForecastsPage';

const mocks = vi.hoisted(() => ({
    getCurrent: vi.fn(),
    runJob: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
}));

vi.mock('../api/forecastApi', () => ({
    forecastApi: {
        getCurrent: mocks.getCurrent,
        runJob: mocks.runJob,
    },
}));
vi.mock('../context/useAuth', () => ({
    useAuth: () => ({ isAdmin: true }),
}));
vi.mock('../context/useToast', () => ({
    useToast: () => ({
        error: mocks.showError,
        success: mocks.showSuccess,
    }),
}));
vi.mock('recharts', async () => {
    const React = await import('react');
    const wrapper = ({
        children,
    }: React.PropsWithChildren) => React.createElement('div', null, children);
    const leaf = () => null;
    return {
        CartesianGrid: leaf,
        Legend: leaf,
        Line: leaf,
        LineChart: wrapper,
        ResponsiveContainer: wrapper,
        Tooltip: leaf,
        XAxis: leaf,
        YAxis: leaf,
    };
});

const successForecast = {
    id: 1,
    product: { id: 10, name: 'Widget', sku: 'W-10' },
    warehouseId: 2,
    warehouseName: 'North warehouse',
    forecastNextDay: 4,
    forecastNextWeek: 28,
    forecastNextMonth: 120,
    confidenceScore: 0.8,
    anomalyDetected: false,
    recommendation: 'Review reorder timing.',
    suggestedReorderQuantity: 12,
    status: 'SUCCESS' as const,
    historicalDemand: [{ date: '2026-11-16', units: 3 }],
    dailyPredictions: [{ date: '2026-11-18', units: 4 }],
    accuracyComparison: [],
    createdAt: '2026-11-17T02:00:00',
};

describe('ForecastsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getCurrent.mockResolvedValue([successForecast]);
        mocks.runJob.mockResolvedValue({});
    });

    it('shows daily, weekly and monthly horizons from one daily forecast', async () => {
        const user = userEvent.setup();
        render(<ForecastsPage />);

        expect(await screen.findByText('Recent demand and 30-day daily forecast'))
            .toBeInTheDocument();
        expect(screen.getByText('Next day')).toBeInTheDocument();
        expect(screen.getByText('Next 7 days')).toBeInTheDocument();
        expect(screen.getByText('Next 30 days')).toBeInTheDocument();
        expect(screen.getByText(
            'AI-estimated confidence (not measured accuracy)'
        )).toBeInTheDocument();

        await user.click(screen.getByRole('tab', { name: 'Weekly' }));
        expect(screen.getByText('Next 7 days')).toBeInTheDocument();

        await user.click(screen.getByRole('tab', { name: 'Monthly' }));
        expect(screen.getByText('Next 30 days')).toBeInTheDocument();
    });

    it('displays failed and insufficient-data states without predictions', async () => {
        mocks.getCurrent.mockResolvedValue([
            {
                ...successForecast,
                id: 2,
                status: 'INSUFFICIENT_DATA',
                statusMessage: 'Only 12 days of movement history are available.',
                dailyPredictions: [],
                historicalDemand: [],
            },
            {
                ...successForecast,
                id: 3,
                product: { id: 11, name: 'Gasket', sku: 'G-11' },
                status: 'FAILED',
                statusMessage: 'Groq service could not be reached.',
                dailyPredictions: [],
                historicalDemand: [],
            },
        ]);
        render(<ForecastsPage />);

        expect(await screen.findByText('Insufficient data')).toBeInTheDocument();
        expect(screen.getByText('Generation failed')).toBeInTheDocument();
        expect(screen.getByText(
            'Only 12 days of movement history are available.'
        )).toBeInTheDocument();
        expect(screen.getByText(
            'Groq service could not be reached.'
        )).toBeInTheDocument();
        expect(screen.queryByText('Recent demand and 30-day daily forecast'))
            .not.toBeInTheDocument();
    });

    it('shows an empty state when no forecast data exists', async () => {
        mocks.getCurrent.mockResolvedValue([]);
        render(<ForecastsPage />);

        expect(await screen.findByText('No forecasts yet'))
            .toBeInTheDocument();
    });

    it('labels measured accuracy separately and handles zero-actual WAPE', async () => {
        mocks.getCurrent.mockResolvedValue([{
            ...successForecast,
            accuracyDays: 7,
            accuracyMae: 1.25,
            accuracyWape: null,
            accuracyComparison: [{
                date: '2026-11-10',
                actualUnits: 0,
                predictedUnits: 2,
            }],
        }]);
        render(<ForecastsPage />);

        expect(await screen.findByText(
            'Actual vs predicted (first 7 completed days)'
        )).toBeInTheDocument();
        expect(screen.getByText(/WAPE not defined \(zero actual demand\)/))
            .toBeInTheDocument();
        expect(screen.getByText(/Validated on 7 completed days/))
            .toBeInTheDocument();
    });

    it('shows an API error and retries the request', async () => {
        const user = userEvent.setup();
        mocks.getCurrent
            .mockRejectedValueOnce({
                isAxiosError: true,
                response: { data: { message: 'Network unavailable' } },
            })
            .mockResolvedValueOnce([successForecast]);
        render(<ForecastsPage />);

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Network unavailable');
        await user.click(screen.getByRole('button', { name: 'Try again' }));

        await waitFor(() => {
            expect(screen.getByText('Widget')).toBeInTheDocument();
        });
        expect(mocks.getCurrent).toHaveBeenCalledTimes(2);
    });
});
