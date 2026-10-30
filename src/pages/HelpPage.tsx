import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowUpRight, CircleHelp, LifeBuoy, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supportApi, type SupportTicket } from '../api/supportApi';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { getApiErrorMessage } from '../utils/apiError';

const FAQS = [
    {
        question: 'How do I record stock that arrived?',
        answer: 'Open Stock Movements, choose the warehouse and product, select Inbound, enter the quantity and save. The movement is added to the stock history.',
    },
    {
        question: 'Why can’t I see every warehouse?',
        answer: 'Warehouse Managers are limited to their assigned location. Ask an administrator to review your warehouse assignment if it looks wrong.',
    },
    {
        question: 'Where can I find low-stock items?',
        answer: 'Check the Dashboard or Stock Levels page. Items are compared with the minimum quantity set for that stock record.',
    },
    {
        question: 'How do I export inventory data?',
        answer: 'Administrators can open Data & Retention to download the current stock-level and stock-movement spreadsheets.',
    },
];

export default function HelpPage() {
    const { token, isAdmin } = useAuth();
    const { error: showError, success: showSuccess } = useToast();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const loadTickets = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            setTickets(await supportApi.getTickets());
        } catch (error) {
            showError(getApiErrorMessage(error, 'Could not load support requests'));
        } finally {
            setLoading(false);
        }
    }, [showError, token]);

    useEffect(() => {
        void Promise.resolve().then(loadTickets);
    }, [loadTickets]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            await supportApi.createTicket(subject, message);
            setSubject('');
            setMessage('');
            showSuccess('Your support request has been submitted');
            await loadTickets();
        } catch (error) {
            showError(getApiErrorMessage(error, 'Could not submit your request'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleResolve = async (id: number) => {
        try {
            await supportApi.resolveTicket(id);
            showSuccess('Support request marked resolved');
            await loadTickets();
        } catch (error) {
            showError(getApiErrorMessage(error, 'Could not update the request'));
        }
    };

    return (
        <>
            <PageHeader
                eyebrow="Help desk"
                title="Help & Support"
                description="Quick answers for day-to-day inventory work, or send the team a note."
            />

            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <section className="card p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-800">
                            <CircleHelp className="h-5 w-5" />
                        </span>
                        <div>
                            <h2 className="font-semibold text-slate-900">Common questions</h2>
                            <p className="mt-1 text-sm text-slate-500">A few quick pointers to get unstuck.</p>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {FAQS.map(faq => (
                            <details key={faq.question} className="group py-4 first:pt-1">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-800">
                                    {faq.question}
                                    <span className="text-lg text-slate-400 transition group-open:rotate-45">+</span>
                                </summary>
                                <p className="mt-3 pr-7 text-sm leading-6 text-slate-600">{faq.answer}</p>
                            </details>
                        ))}
                    </div>
                </section>

                <section className="card p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <span className="rounded-xl bg-amber-50 p-2.5 text-amber-800">
                            <LifeBuoy className="h-5 w-5" />
                        </span>
                        <div>
                            <h2 className="font-semibold text-slate-900">Contact support</h2>
                            <p className="mt-1 text-sm text-slate-500">Tell us what happened and we’ll keep the request here.</p>
                            <a
                                href="mailto:kushalbhadra546@gmail.com"
                                className="mt-1 inline-block text-xs font-medium text-emerald-800 hover:underline"
                            >
                                kushalbhadra546@gmail.com
                            </a>
                        </div>
                    </div>
                    {token ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="support-subject" className="label">Subject</label>
                                <input
                                    id="support-subject"
                                    value={subject}
                                    onChange={event => setSubject(event.target.value)}
                                    className="input"
                                    maxLength={160}
                                    required
                                    placeholder="What do you need help with?"
                                />
                            </div>
                            <div>
                                <label htmlFor="support-message" className="label">Details</label>
                                <textarea
                                    id="support-message"
                                    value={message}
                                    onChange={event => setMessage(event.target.value)}
                                    className="input min-h-32 resize-y"
                                    maxLength={4000}
                                    required
                                    placeholder="Include the page and steps that led to the issue."
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={submitting}>
                                <Send className="h-4 w-4" />
                                {submitting ? 'Sending...' : 'Send request'}
                            </button>
                        </form>
                    ) : (
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-sm leading-6 text-slate-600">Sign in to create a support request and follow its status.</p>
                            <Link to="/login" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800">
                                Sign in <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </section>
            </div>

            {token && (
                <section className="card mt-5 p-5 sm:p-6">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                {isAdmin ? 'Recent support requests' : 'Your support requests'}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {isAdmin ? 'Requests submitted by workspace users.' : 'Check the status of requests you have sent.'}
                            </p>
                        </div>
                        {loading && <span className="text-xs text-slate-400">Refreshing…</span>}
                    </div>
                    {tickets.length === 0 && !loading ? (
                        <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No support requests yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {tickets.map(ticket => (
                                <article key={ticket.id} className="rounded-xl border border-slate-200 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-800">{ticket.subject}</h3>
                                            {isAdmin && (
                                                <p className="mt-1 text-xs text-slate-500">{ticket.requesterName} · {ticket.requesterEmail}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge tone={ticket.status === 'OPEN' ? 'orange' : 'green'}>{ticket.status}</Badge>
                                            {isAdmin && ticket.status === 'OPEN' && (
                                                <button type="button" onClick={() => void handleResolve(ticket.id)} className="text-xs font-semibold text-emerald-800 hover:underline">
                                                    Mark resolved
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{ticket.message}</p>
                                    <p className="mt-3 text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleString()}</p>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </>
    );
}
