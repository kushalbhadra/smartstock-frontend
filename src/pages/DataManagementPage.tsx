import { useState } from 'react';
import { Archive, Download, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { stockApi } from '../api/stockApi';
import { useToast } from '../context/useToast';
import { PageHeader } from '../components/PageHeader';
import { downloadBlob } from '../utils/excel';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';

export default function DataManagementPage() {
    const { error: showError, success: showSuccess } = useToast();
    const { isAdmin, token } = useAuth();
    const [downloading, setDownloading] = useState<'stock' | 'movements' | null>(null);

    const download = async (kind: 'stock' | 'movements') => {
        setDownloading(kind);
        try {
            const blob = kind === 'stock'
                ? await stockApi.exportStocks()
                : await stockApi.exportMovements();
            const fileName = kind === 'stock'
                ? 'stock-levels.xlsx'
                : 'stock-movements.xlsx';
            downloadBlob(blob, fileName);
            showSuccess('Export downloaded');
        } catch {
            showError('Could not export data. Check your connection and try again.');
        } finally {
            setDownloading(null);
        }
    };

    return (
        <>
            {!token && (
                <header className="mb-6 rounded-xl border border-slate-200 bg-white px-5 py-4">
                    <Link to="/" className="font-bold tracking-tight text-slate-900">
                        smartstock
                    </Link>
                </header>
            )}
            <PageHeader
                eyebrow="Workspace information"
                title="Data & retention"
                description="Export operational records and understand how this installation handles stored data."
            />

            {isAdmin ? (
            <section className="card p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                    <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700">
                        <Download className="h-5 w-5" />
                    </span>
                    <div>
                        <h2 className="font-semibold text-slate-900">Export workspace data</h2>
                        <p className="mt-1 text-sm text-slate-500">Download the current dataset as an Excel workbook.</p>
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <ExportCard
                        title="Stock levels"
                        description="Current quantities and minimum/maximum levels by warehouse and product."
                        busy={downloading === 'stock'}
                        disabled={downloading !== null}
                        onClick={() => void download('stock')}
                    />
                    <ExportCard
                        title="Stock movements"
                        description="Recorded inbound, outbound and adjustment movements."
                        busy={downloading === 'movements'}
                        disabled={downloading !== null}
                        onClick={() => void download('movements')}
                    />
                </div>
            </section>
            ) : (
                <section className="card p-5 sm:p-6">
                    <h2 className="font-semibold text-slate-900">Workspace exports</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        {token
                            ? 'Workspace exports are available to administrators.'
                            : 'Sign in as an administrator to export workspace data.'}
                    </p>
                    {!token && (
                        <Link to="/login" className="btn-primary mt-4">
                            Sign in
                        </Link>
                    )}
                </section>
            )}

            <section className="card mt-5 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                    <span className="rounded-xl bg-amber-50 p-2.5 text-amber-800">
                        <Archive className="h-5 w-5" />
                    </span>
                    <div>
                        <h2 className="font-semibold text-slate-900">Retention in this installation</h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                            SmartStock does not currently run an automatic retention or deletion schedule. Records remain in the configured database until an authorized user deletes them or an administrator manages the database. Some records cannot be deleted while they are referenced by operational history.
                        </p>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                            Database backups, storage duration, and recovery procedures depend on how your organization hosts the backend and database; this screen does not configure or verify those services. Agree a retention and backup policy with your system administrator before using real business or personal data.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex gap-3">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                    <p className="text-sm leading-6 text-slate-600">
                        Treat downloaded files as sensitive business data. Store them securely and share them only with people who are authorized to see the information.
                    </p>
                </div>
            </section>
        </>
    );
}

function ExportCard({
    title,
    description,
    busy,
    disabled,
    onClick,
}: {
    title: string;
    description: string;
    busy: boolean;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <div className="flex flex-col justify-between gap-5 rounded-xl border border-slate-200 p-4">
            <div className="flex gap-3">
                <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                </div>
            </div>
            <button type="button" className="btn-secondary self-start" disabled={disabled} onClick={onClick}>
                <Download className="h-4 w-4" />
                {busy ? 'Preparing…' : 'Download Excel'}
            </button>
        </div>
    );
}
