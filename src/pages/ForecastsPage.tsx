import { useCallback, useEffect, useState } from 'react';
import {
    AlertTriangle, CheckCircle2,
    RefreshCw, Sparkles, TrendingUp,
} from 'lucide-react';
import { forecastApi } from '../api/forecastApi';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { PageHeader } from '../components/PageHeader';
import { PageLoader } from '../components/ui/Spinner';
import { fmt, fmtDateTime } from '../utils/format';
import type { DemandForecast } from '../types';

export default function ForecastsPage() {
    const { isAdmin } = useAuth();
    const { error: showError, success: showSuccess } = useToast();

    const [forecasts, setForecasts] = useState<DemandForecast[] | null>(null);
    const [running, setRunning]     = useState(false);

    const load = useCallback(async () => {
        try {
            setForecasts(await forecastApi.getAll());
        } catch {
            showError('Failed to load forecasts');
        }
    }, [showError]);

    useEffect(() => {
        void Promise.resolve().then(load);
    }, [load]);

    const handleRunJob = async () => {
        setRunning(true);
        showSuccess('AI forecast job started — this may take a minute...');
        try {
            await forecastApi.runJob();
            showSuccess('Forecasts updated successfully');
            await load();
        } catch {
            showError('Forecast job failed');
        } finally {
            setRunning(false);
        }
    };

    return (
        <>
            <PageHeader
                eyebrow="Intelligence"
                title="AI Demand Forecasts"
                description="Groq AI predicts demand and detects anomalies nightly."
                actions={
                    isAdmin && (
                        <button
                            onClick={handleRunJob}
                            disabled={running}
                            className="btn-primary"
                        >
                            <RefreshCw className={`w-4 h-4 ${
                                running ? 'animate-spin' : ''
                            }`} />
                            {running ? 'Running...' : 'Run Forecast Now'}
                        </button>
                    )
                }
            />

            {/* AI info banner */}
            <div className="bg-indigo-50 border border-indigo-200
                            rounded-xl p-4 mb-6 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0
                                     mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-indigo-800">
                        Powered by Groq AI (Llama 3.1 8B)
                    </p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                        Forecasts run automatically every night at 2 AM.
                        Admins can trigger manually above.
                    </p>
                </div>
            </div>

            {/* Loading */}
            {!forecasts ? (
                <PageLoader />
            ) : forecasts.length === 0 ? (
                <div className="text-center py-16">
                    <Sparkles className="w-12 h-12 text-slate-300
                                         mx-auto mb-4" />
                    <p className="font-semibold text-slate-700">
                        No forecasts yet
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                        Run the AI forecast job to generate predictions
                    </p>
                    {isAdmin && (
                        <button
                            onClick={handleRunJob}
                            disabled={running}
                            className="btn-primary mt-4"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Run Now
                        </button>
                    )}
                </div>
            ) : (
                /* ── FORECAST CARDS GRID ─────────────────────────── */
                <div className="grid grid-cols-1 md:grid-cols-2
                                xl:grid-cols-3 gap-4">
                    {forecasts.map(f => (
                        <ForecastCard key={f.id} forecast={f} />
                    ))}
                </div>
            )}
        </>
    );
}

// ── FORECAST CARD ─────────────────────────────────────────────────────

function ForecastCard({ forecast: f }: { forecast: DemandForecast }) {
    const confidencePct = Math.round(f.confidenceScore * 100);

    const confidenceColor =
        confidencePct >= 80 ? 'bg-emerald-500' :
        confidencePct >= 60 ? 'bg-amber-500' :
        'bg-rose-500';

    return (
        <div className={`card p-5 flex flex-col gap-4 ${
            f.anomalyDetected
                ? 'border-amber-300 bg-amber-50/30'
                : ''
        }`}>

            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="font-bold text-slate-900 text-base">
                        {f.product?.name ?? '—'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                        SKU: {f.product?.sku ?? '—'}
                    </p>
                </div>
                {f.anomalyDetected ? (
                    <div className="flex items-center gap-1.5
                                    bg-amber-100 text-amber-700
                                    rounded-full px-2.5 py-1
                                    text-[11px] font-bold shrink-0">
                        <AlertTriangle className="w-3 h-3" />
                        Anomaly
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5
                                    bg-emerald-100 text-emerald-700
                                    rounded-full px-2.5 py-1
                                    text-[11px] font-bold shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Normal
                    </div>
                )}
            </div>

            {/* Forecast numbers */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">
                        Next Week
                    </p>
                    <p className="text-2xl font-bold text-slate-800">
                        {fmt(f.forecastNextWeek)}
                    </p>
                    <p className="text-xs text-slate-400">units</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">
                        Next Month
                    </p>
                    <p className="text-2xl font-bold text-slate-800">
                        {fmt(f.forecastNextMonth)}
                    </p>
                    <p className="text-xs text-slate-400">units</p>
                </div>
            </div>

            {/* Confidence bar */}
            <div>
                <div className="flex justify-between items-center mb-1.5">
                    <p className="text-xs text-slate-500">
                        Confidence Score
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                        {confidencePct}%
                    </p>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all
                                    ${confidenceColor}`}
                        style={{ width: `${confidencePct}%` }}
                    />
                </div>
            </div>

            {/* Recommendation */}
            <div className="bg-indigo-50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600
                                          shrink-0 mt-0.5" />
                    <p className="text-xs text-indigo-700 italic">
                        {f.recommendation}
                    </p>
                </div>
            </div>

            {/* Reorder */}
            <div className="flex items-center justify-between
                            border-t border-slate-100 pt-3">
                <div>
                    <p className="text-xs text-slate-400">
                        Suggested Reorder
                    </p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {fmt(f.suggestedReorderQuantity)} units
                    </p>
                </div>
                <p className="text-[11px] text-slate-400">
                    {fmtDateTime(f.createdAt)}
                </p>
            </div>
        </div>
    );
}