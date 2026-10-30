import { ArrowDown, ArrowRight, BarChart3, Boxes, Check, Menu, Package, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const highlights = [
    {
        icon: Boxes,
        title: 'Know what is on hand',
        text: 'See stock across locations, with low-stock items easy to spot.',
    },
    {
        icon: BarChart3,
        title: 'Keep a clear trail',
        text: 'Follow stock movements and purchase orders without hunting through spreadsheets.',
    },
    {
        icon: Sparkles,
        title: 'Plan the next order',
        text: 'Use demand forecasts as a practical starting point for replenishment.',
    },
];

export default function LandingPage() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="relative z-20 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur">
                <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
                    <Link to="/" className="flex items-center gap-2.5" aria-label="SmartStock home">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                            <Package className="h-5 w-5" />
                        </span>
                        <span className="text-lg font-bold tracking-tight">SmartStock</span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setMenuOpen(value => !value)}
                        className="rounded-lg p-2 text-slate-600 sm:hidden"
                        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
                    >
                        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                    <div className={`${menuOpen ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5 text-sm sm:static sm:flex sm:flex-row sm:items-center sm:border-0 sm:bg-transparent sm:p-0`}>
                        <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-slate-600 transition hover:text-indigo-700">How it works</a>
                        <a href="#features" onClick={() => setMenuOpen(false)} className="text-slate-600 transition hover:text-indigo-700">Features</a>
                        <Link to="/help" onClick={() => setMenuOpen(false)} className="text-slate-600 transition hover:text-indigo-700">Help</Link>
                        <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-700">
                            Sign in <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </nav>
            </header>

            <main>
                <section className="relative isolate overflow-hidden">
                    <div className="absolute -right-36 -top-32 -z-10 h-[34rem] w-[34rem] rounded-full bg-indigo-100/70 blur-3xl" />
                    <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_0.95fr] lg:py-28">
                        <div className="landing-enter">
                            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-indigo-900">
                                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                                INVENTORY, WITHOUT THE GUESSWORK
                            </p>
                            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                                A steadier way to keep <span className="font-serif italic text-indigo-700">stock moving.</span>
                            </h1>
                            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                                One clear view of your products, warehouses and orders—so your team can spend less time checking sheets and more time getting the next thing done.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/10 transition duration-300 hover:-translate-y-0.5 hover:bg-indigo-700">
                                    Open your workspace <ArrowRight className="h-4 w-4" />
                                </Link>
                                <a href="#features" className="inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-white">
                                    Take a look <ArrowDown className="h-4 w-4" />
                                </a>
                            </div>
                            <div className="mt-10 flex items-center gap-3 text-sm text-slate-500">
                                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                                Role-based access for your team
                            </div>
                        </div>

                        <div className="relative landing-float">
                            <div className="absolute -left-7 top-16 z-10 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/5 sm:block landing-float-slow">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                                        <Boxes className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <p className="text-xs text-slate-500">Stock to review</p>
                                        <p className="text-sm font-bold">3 items need attention</p>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                    <div>
                                        <p className="text-sm font-semibold">Inventory overview</p>
                                        <p className="mt-0.5 text-xs text-slate-400">Example workspace preview</p>
                                    </div>
                                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">Preview</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 p-4 sm:p-5">
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500">Products tracked</p>
                                        <p className="mt-2 text-3xl font-semibold tracking-tight">1,284</p>
                                        <p className="mt-1 text-xs text-indigo-700">Across all locations</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500">On-hand units</p>
                                        <p className="mt-2 text-3xl font-semibold tracking-tight">8,640</p>
                                        <p className="mt-1 text-xs text-slate-500">Example figure</p>
                                    </div>
                                </div>
                                <div className="px-4 pb-5 sm:px-5">
                                    <div className="flex items-center justify-between pb-3">
                                        <p className="text-sm font-semibold">Recent stock movement</p>
                                        <span className="text-xs text-slate-400">This week</span>
                                    </div>
                                    <div className="flex h-32 items-end gap-2 rounded-2xl bg-slate-50 px-4 pb-3 pt-5">
                                        {[42, 63, 48, 78, 57, 91, 69, 84, 55, 74, 96, 68].map((height, index) => (
                                            <span
                                                key={index}
                                                className={`landing-bar flex-1 rounded-t-md ${index === 11 ? 'bg-indigo-600' : 'bg-indigo-200'}`}
                                                style={{ height: `${height}%`, animationDelay: `${index * 45}ms` }}
                                            />
                                        ))}
                                    </div>
                                    <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/70 px-3.5 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                                            <span className="text-xs font-medium text-slate-700">Reorder point reached</span>
                                        </div>
                                        <span className="text-xs font-semibold text-amber-800">Review</span>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-5 -right-4 hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-xl sm:flex landing-float-slow">
                                <Check className="h-4 w-4 text-indigo-600" />
                                One place for the whole operation
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="scroll-mt-20 border-y border-slate-200/70 bg-white py-20 sm:py-24">
                    <div className="mx-auto max-w-7xl px-5 sm:px-8">
                        <div className="max-w-2xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">Built for the everyday work</p>
                            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">The details that keep a warehouse running.</h2>
                            <p className="mt-4 leading-7 text-slate-600">No complicated setup to understand. Just the tools your team needs to keep products accounted for and orders moving.</p>
                        </div>
                        <div className="mt-11 grid gap-4 md:grid-cols-3">
                            {highlights.map(({ icon: Icon, title, text }, index) => (
                                <article key={title} className="group rounded-2xl border border-slate-200 p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/5" style={{ animationDelay: `${index * 100}ms` }}>
                                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                                    <p className="mt-2 leading-6 text-slate-600">{text}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="how-it-works" className="scroll-mt-20 bg-slate-50 py-20 sm:py-24">
                    <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">A calmer daily rhythm</p>
                            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">From receiving to reorder, keep the picture together.</h2>
                            <p className="mt-5 leading-7 text-slate-600">Bring your catalog and warehouse activity into a shared workspace. Record movements, review open purchase orders and check forecasts when it’s time to plan.</p>
                            <Link to="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-600">Go to sign in <ArrowRight className="h-4 w-4" /></Link>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                ['01', 'Add your locations', 'Keep warehouse details and assignments in one view.'],
                                ['02', 'Bring in your catalog', 'Give each product a consistent name and SKU.'],
                                ['03', 'Record what changes', 'Capture inbound, outbound and adjustment movements.'],
                                ['04', 'Review what is next', 'Use alerts and forecasts to make replenishment decisions.'],
                            ].map(([number, title, description]) => (
                                <div key={number} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md">
                                    <p className="font-mono text-xs text-indigo-700">{number} / WORKFLOW</p>
                                    <h3 className="mt-4 font-semibold">{title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-5 py-16 sm:px-8 sm:py-20">
                    <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[1.75rem] bg-slate-900 px-7 py-9 text-white sm:px-10 sm:py-11 md:flex-row md:items-center">
                        <div>
                            <p className="text-sm text-indigo-200">Ready when your team is</p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Bring your stock into view.</h2>
                        </div>
                        <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-indigo-50">
                            Sign in to SmartStock <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between">
                    <p>© {new Date().getFullYear()} SmartStock. Inventory work, made clearer.</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                        <Link to="/help" className="hover:text-indigo-700">Help & support</Link>
                        <Link to="/privacy" className="hover:text-indigo-700">Privacy policy</Link>
                        <Link to="/terms" className="hover:text-indigo-700">Terms of use</Link>
                        <Link to="/data" className="hover:text-indigo-700">Data & retention</Link>
                        <a href="mailto:kushalbhadra546@gmail.com" className="hover:text-indigo-700">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
