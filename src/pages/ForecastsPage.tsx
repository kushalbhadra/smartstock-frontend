import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle, RefreshCw, Sparkles, TrendingUp,
} from 'lucide-react';
import {
    CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
    Tooltip, XAxis, YAxis,
} from 'recharts';
import { forecastApi } from '../api/forecastApi';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { PageHeader } from '../components/PageHeader';
import { ForecastSkeleton } from '../components/ui/Spinner';
import { getApiErrorMessage } from '../utils/apiError';
import { fmt, fmtDateTime } from '../utils/format';
import type {
    DemandForecast, ForecastAccuracyPoint,
} from '../types';

type ForecastView = 'daily' | 'weekly' | 'monthly';

const viewLabels: Record<ForecastView, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
};

export default function ForecastsPage() {
    const { isAdmin } = useAuth();
    const { error: showError, success: showSuccess } = useToast();
    const [forecasts, setForecasts] = useState<DemandForecast[] | null>(null);
    const [view, setView] = useState<ForecastView>('daily');
    const [running, setRunning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setForecasts(await forecastApi.getCurrent());
            setLoadError(null);
        } catch (reason) {
            const message = getApiErrorMessage(
                reason, 'Failed to load forecasts'
            );
            setLoadError(message);
            showError(message);
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        void Promise.resolve().then(load);
    }, [load]);

    const currentForecasts = useMemo(() => {
        const latest = new Map<string, DemandForecast>();
        forecasts?.forEach(forecast => {
            const key = `${forecast.product.id}:${forecast.warehouseId ?? 'legacy'}`;
            if (!latest.has(key)) latest.set(key, forecast);
        });
        return [...latest.values()];
    }, [forecasts]);

    const refresh = () => {
        setLoading(true);
        setLoadError(null);
        void load();
    };

    const handleRunJob = async () => {
        setRunning(true);
        try {
            await forecastApi.runJob();
            showSuccess(
                'Forecast generation started. Refresh after it completes to see results.'
            );
        } catch (reason) {
            showError(getApiErrorMessage(
                reason, 'Could not start the forecast job'
            ));
        } finally {
            setRunning(false);
        }
    };

    return (
        <>
            <PageHeader
                eyebrow="Intelligence"
                title="AI Demand Forecasts"
                description="Daily predictions are the source for consistent 7-day and 30-day demand totals."
                actions={
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={refresh}
                            disabled={loading}
                            className="btn-secondary"
                        >
                            <RefreshCw className={`w-4 h-4 ${
                                loading ? 'animate-spin' : ''
                            }`} />
                            Refresh
                        </button>
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={handleRunJob}
                                disabled={running}
                                className="btn-primary"
                            >
                                <RefreshCw className={`w-4 h-4 ${
                                    running ? 'animate-spin' : ''
                                }`} />
                                {running ? 'Starting...' : 'Run Forecast Now'}
                            </button>
                        )}
                    </div>
                }
            />

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl
                            p-4 mb-6 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-indigo-800">
                        AI-assisted demand estimates
                    </p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                        Demand is calculated from recorded OUTBOUND movements only.
                        Transfers and adjustments are excluded. Insufficient history
                        and generation failures are reported without zero-value predictions.
                    </p>
                </div>
            </div>

            {loading && !forecasts ? (
                <ForecastSkeleton />
            ) : loadError ? (
                <div className="card p-8 text-center">
                    <p role="alert" className="text-sm text-rose-600">
                        {loadError}
                    </p>
                    <button type="button" className="btn-secondary mt-4"
                        onClick={refresh}>
                        Try again
                    </button>
                </div>
            ) : forecasts === null ? (
                <div className="card p-8 text-center">
                    <p role="alert" className="text-sm text-rose-600">
                        Forecast data is unavailable.
                    </p>
                </div>
            ) : currentForecasts.length === 0 ? (
                <div className="text-center py-16">
                    <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="font-semibold text-slate-700">No forecasts yet</p>
                    <p className="text-sm text-slate-400 mt-1">
                        Forecasts are generated for products allocated to warehouses.
                    </p>
                    {isAdmin && (
                        <button type="button" onClick={handleRunJob}
                            disabled={running} className="btn-primary mt-4">
                            <RefreshCw className="w-4 h-4" />
                            Run Now
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex gap-2 mb-5" role="tablist"
                        aria-label="Forecast horizon">
                        {(Object.keys(viewLabels) as ForecastView[]).map(option => (
                            <button
                                key={option}
                                type="button"
                                role="tab"
                                aria-selected={view === option}
                                onClick={() => setView(option)}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold
                                    ${view === option
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-slate-600 border border-slate-200'}`}
                            >
                                {viewLabels[option]}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {currentForecasts.map(forecast => (
                            <ForecastCard
                                key={`${forecast.id}-${forecast.warehouseId ?? 'legacy'}`}
                                forecast={forecast}
                                view={view}
                            />
                        ))}
                    </div>
                </>
            )}
        </>
    );
}

function ForecastCard({
    forecast,
    view,
}: {
    forecast: DemandForecast;
    view: ForecastView;
}) {
    const successful = forecast.status === 'SUCCESS';
    const anomaly = successful && forecast.anomalyDetected === true;
    const historyChart = [
        ...forecast.historicalDemand.slice(-14).map(point => ({
            date: point.date,
            actual: point.units,
            predicted: null as number | null,
        })),
        ...forecast.dailyPredictions.map(point => ({
            date: point.date,
            actual: null as number | null,
            predicted: point.units,
        })),
    ];

    return (
        <article className={`card p-5 flex flex-col gap-4 ${
            anomaly ? 'border-amber-300 bg-amber-50/30' : ''
        }`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-bold text-slate-900">
                        {forecast.product.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                        SKU: {forecast.product.sku}
                        {forecast.warehouseName
                            ? ` · ${forecast.warehouseName}` : ''}
                    </p>
                </div>
                <StatusBadge forecast={forecast} />
            </div>

            {!successful ? (
                <p className={`rounded-lg p-3 text-sm ${
                    forecast.status === 'FAILED'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-800'
                }`}>
                    {forecast.statusMessage
                        ?? (forecast.status === 'LEGACY'
                            ? 'This older forecast has no daily history or validated status.'
                            : 'A valid forecast is not available.')}
                </p>
            ) : (
                <>
                    <ForecastValues forecast={forecast} view={view} />
                    {view === 'daily' && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 mb-2">
                                Recent demand and 30-day daily forecast
                            </h3>
                            {historyChart.length > 0 ? (
                                <div className="h-64 w-full" aria-label="Daily demand chart">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={historyChart}
                                            margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }}
                                                tickFormatter={formatChartDate}
                                                minTickGap={24} />
                                            <YAxis allowDecimals={false}
                                                tick={{ fontSize: 10 }} />
                                            <Tooltip labelFormatter={label =>
                                                formatChartDate(String(label))} />
                                            <Legend />
                                            <Line type="monotone" dataKey="actual"
                                                name="Actual outbound" stroke="#0f766e"
                                                strokeWidth={2} dot={false}
                                                connectNulls={false} />
                                            <Line type="monotone" dataKey="predicted"
                                                name="Predicted demand" stroke="#4f46e5"
                                                strokeWidth={2} dot={false}
                                                connectNulls={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">
                                    Daily demand history is unavailable for this forecast.
                                </p>
                            )}
                        </div>
                    )}
                    {forecast.accuracyComparison.length > 0 && (
                        <AccuracyComparison points={forecast.accuracyComparison} />
                    )}
                    <div className="rounded-lg bg-indigo-50 p-3">
                        <div className="flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 text-indigo-600
                                shrink-0 mt-0.5" />
                            <p className="text-xs text-indigo-700">
                                {forecast.recommendation}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <p className="text-slate-500">
                            Suggested reorder:{' '}
                            <strong className="text-slate-800">
                                {fmtForecast(forecast.suggestedReorderQuantity)} units
                            </strong>
                            <span className="block text-slate-400 mt-0.5">
                                Advisory only; no order is created automatically.
                            </span>
                        </p>
                        <p className="text-right text-slate-400">
                            {forecast.modelName ?? 'Configured Groq model'}
                            <span className="block mt-1">
                                Generated {forecast.createdAt
                                    ? fmtDateTime(forecast.createdAt) : '—'}
                            </span>
                        </p>
                    </div>
                </>
            )}
        </article>
    );
}

function ForecastValues({
    forecast,
    view,
}: {
    forecast: DemandForecast;
    view: ForecastView;
}) {
    const values = view === 'daily'
        ? [
            ['Next day', forecast.forecastNextDay],
            ['Next 7 days', forecast.forecastNextWeek],
            ['Next 30 days', forecast.forecastNextMonth],
        ] as const
        : view === 'weekly'
            ? [['Next 7 days', forecast.forecastNextWeek]] as const
            : [['Next 30 days', forecast.forecastNextMonth]] as const;
    const confidence = forecast.confidenceScore;

    return (
        <div className={`grid gap-3 ${
            values.length === 3 ? 'grid-cols-3' : 'grid-cols-1'
        }`}>
            {values.map(([label, amount]) => (
                <div key={label} className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className="text-2xl font-bold text-slate-800">
                        {fmtForecast(amount)}
                    </p>
                    <p className="text-xs text-slate-400">units</p>
                </div>
            ))}
            <div className="col-span-full flex flex-wrap items-center
                            justify-between gap-2 border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500">
                    AI-estimated confidence (not measured accuracy)
                </p>
                <p className="text-xs font-bold text-slate-700">
                    {confidence == null ? '—' : `${Math.round(confidence * 100)}%`}
                </p>
                {forecast.accuracyDays != null && (
                    <p className="w-full text-xs text-slate-500">
                        Validated on {forecast.accuracyDays} completed days ·
                        MAE {forecast.accuracyMae?.toFixed(2) ?? '—'} units ·
                        WAPE {forecast.accuracyWape == null
                            ? 'not defined (zero actual demand)'
                            : `${(forecast.accuracyWape * 100).toFixed(1)}%`}
                    </p>
                )}
            </div>
        </div>
    );
}

function AccuracyComparison({
    points,
}: {
    points: ForecastAccuracyPoint[];
}) {
    return (
        <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Actual vs predicted (first 7 completed days)
            </h3>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={points}
                        margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }}
                            tickFormatter={formatChartDate} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip labelFormatter={label =>
                            formatChartDate(String(label))} />
                        <Legend />
                        <Line type="monotone" dataKey="actualUnits"
                            name="Actual outbound" stroke="#0f766e"
                            strokeWidth={2} />
                        <Line type="monotone" dataKey="predictedUnits"
                            name="Predicted" stroke="#4f46e5"
                            strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}

function StatusBadge({ forecast }: { forecast: DemandForecast }) {
    if (forecast.status === 'SUCCESS') {
        return forecast.anomalyDetected ? (
            <span className="inline-flex items-center gap-1 rounded-full
                bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                <AlertTriangle className="w-3 h-3" /> Anomaly
            </span>
        ) : (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1
                text-[11px] font-bold text-emerald-700">
                Forecast ready
            </span>
        );
    }
    const label = forecast.status === 'FAILED'
        ? 'Generation failed'
        : forecast.status === 'INSUFFICIENT_DATA'
            ? 'Insufficient data' : 'Legacy forecast';
    return (
        <span className="rounded-full bg-amber-100 px-2.5 py-1
            text-[11px] font-bold text-amber-800">
            {label}
        </span>
    );
}

function formatChartDate(value: string) {
    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

function fmtForecast(value: number | null | undefined) {
    return value == null ? '—' : fmt(value);
}
