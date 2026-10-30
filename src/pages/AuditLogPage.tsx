import { useCallback, useEffect, useState } from 'react';
import { ClipboardClock, Search } from 'lucide-react';
import { auditApi, type AuditEvent } from '../api/auditApi';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, TableSkeleton } from '../components/ui/Spinner';
import { EmptyRow, TableWrap, Td, Th } from '../components/Table';
import { useToast } from '../context/useToast';

export default function AuditLogPage() {
    const { error: showError } = useToast();
    const [events, setEvents] = useState<AuditEvent[] | null>(null);
    const [search, setSearch] = useState('');
    const [loadError, setLoadError] = useState(false);

    const loadEvents = useCallback(async () => {
        setLoadError(false);
        try {
            setEvents(await auditApi.getRecent());
        } catch {
            setLoadError(true);
            showError('Could not load the audit log');
        }
    }, [showError]);

    useEffect(() => {
        let cancelled = false;
        void Promise.resolve().then(() => {
            if (!cancelled) void loadEvents();
        });
        return () => { cancelled = true; };
    }, [loadEvents]);

    const query = search.trim().toLowerCase();
    const filtered = events?.filter(event => [
        event.actorName,
        event.actorEmail,
        event.action,
        event.entityType,
        event.details,
    ].some(value => value.toLowerCase().includes(query))) ?? [];

    return (
        <>
            <PageHeader
                eyebrow="Administration"
                title="Audit log"
                description="Recent account, inventory, order, support and export activity."
                actions={
                    <label className="relative block w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            className="input pl-9"
                            placeholder="Search events"
                            aria-label="Search audit events"
                        />
                    </label>
                }
            />
            <div className="card overflow-hidden">
                {loadError ? (
                    <div className="p-8 text-center">
                        <p className="text-sm text-slate-600">Audit activity could not be loaded.</p>
                        <button type="button" onClick={() => void loadEvents()} className="btn-secondary mt-4">Try again</button>
                    </div>
                ) : !events ? (
                    <TableSkeleton cols={5} />
                ) : events.length === 0 ? (
                    <EmptyState
                        icon={ClipboardClock}
                        title="No activity recorded yet"
                        message="Tracked changes will appear here as your team uses SmartStock."
                    />
                ) : (
                    <TableWrap>
                        <thead>
                            <tr>
                                <Th>When</Th>
                                <Th>Who</Th>
                                <Th>Action</Th>
                                <Th>Record</Th>
                                <Th>Details</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <EmptyRow colSpan={5} message="No events match this search." />
                            ) : filtered.map(event => (
                                <tr key={event.id} className="hover:bg-slate-50/60">
                                    <Td className="whitespace-nowrap text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</Td>
                                    <Td>
                                        <p className="font-medium text-slate-800">{event.actorName}</p>
                                        <p className="text-xs text-slate-400">{event.actorEmail}</p>
                                    </Td>
                                    <Td><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{event.action.replaceAll('_', ' ')}</span></Td>
                                    <Td className="text-xs text-slate-600">{event.entityType.replaceAll('_', ' ')}{event.entityId ? ` #${event.entityId}` : ''}</Td>
                                    <Td className="max-w-sm text-sm text-slate-600">{event.details}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrap>
                )}
            </div>
            {events && (
                <p className="mt-3 text-xs text-slate-400">
                    Showing up to the latest 200 tracked events.
                </p>
            )}
        </>
    );
}
