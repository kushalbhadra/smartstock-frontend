import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '../context/useAuth';

const DOCUMENTS = {
    '/privacy': {
        eyebrow: 'Privacy',
        title: 'Privacy notice',
        revised: 'MCA final-year project • Last updated 29 October 2026',
        introduction: 'This notice describes the SmartStock inventory-management application as built for an MCA final-year project. It is intended to explain the data the application handles in a classroom, evaluation or demonstration environment. Please use sample data for demonstrations. A person or organization running its own deployment is responsible for that deployment, its hosting providers, legal obligations and any additional notice users may need.',
        sections: [
            ['Who operates SmartStock', 'SmartStock is an academic software project, not a separate company or public inventory service. In a local demo, the student or evaluator running the application controls the demo environment. In any hosted or organizational deployment, the person or organization that decides why and how the data is used is responsible for that deployment and must provide any notices required by applicable law. The project contact below is for questions about the student project; it does not mean the project author can access data held by another operator.'],
            ['Information the application handles', 'Depending on the features used, SmartStock stores account name and email address; a password hash (not the readable password); role and assigned warehouse; optional phone number; and records entered into the system, including products, suppliers, warehouses, stock levels, stock movements, purchase orders and forecasts. It also stores in-app notifications, legacy alert delivery records, support-ticket subjects and messages, and audit entries such as an actor’s name and email, action, affected record and time. A support message can contain whatever a user chooses to type, so do not include passwords, payment-card details, government identifiers, health information or other sensitive information.'],
            ['Why the information is used', 'The application uses account information to sign users in, apply role-based access and show profile preferences. Business records power stock management, purchase orders, alerts, reports, exports and demand forecasts. Support-ticket and audit information is used to respond to questions and show administrative activity. The application is not designed to sell personal information or use it for advertising.'],
            ['AI demand forecasting', 'When an operator has configured the Groq AI integration and a forecast is requested, the backend sends the product identifier, product name and category, current stock, and recent outbound quantities to Groq to generate a forecast. These are inventory/business details and could be confidential; use sample data for academic demonstrations and do not send confidential records unless the deployment operator has approved the integration and reviewed the provider’s terms and privacy practices. The integration may be disabled or replaced by the operator.'],
            ['In-app notifications', 'SmartStock stores inventory and forecast notifications in its configured database and displays them to authorized users in the application. Notifications are scoped to administrators and the managers assigned to affected warehouses; viewers do not receive operational notifications. This version does not send notifications through WhatsApp or Twilio.'],
            ['Who can access data and when it leaves the application', 'Access to application features is restricted by account roles. Administrators can manage accounts and settings, view audit activity and access operational records; warehouse managers and viewers have access according to their assigned permissions. Data is stored in the database and infrastructure configured by the operator. It is sent to external providers only for integrations the operator has configured and used, such as Groq for forecasting. Hosting, database, backup, email or network providers may also process data as part of operating a deployment. Their identity, location and terms depend on that deployment and are not fixed by this student project.'],
            ['Browser storage and technical information', 'The sign-in token and basic signed-in profile details are stored in this browser tab’s session storage so the application can keep you signed in between page loads; signing out removes that saved entry. Session storage is browser storage, not a secure cookie, so sign out on shared devices and keep your browser up to date. The application does not include an analytics or advertising tracker. The hosting platform or server may independently collect technical connection or error logs under its own configuration and policies.'],
            ['How long information is kept', 'The current application does not automatically delete records on a retention schedule. Data can remain in the configured database until the deployment operator removes it or applies a database, backup or hosting retention policy. The application offers exports, but exporting a file does not delete the original record or control copies in backups. A copy downloaded to a device is controlled by the person who downloaded it. Ask the deployment operator how to request deletion and how backups are handled.'],
            ['Security and responsible use', 'The application uses password hashing, signed authentication tokens and server-side role checks. These measures reduce risk but cannot guarantee that data is always secure. Security also depends on the operator’s configuration, software updates, access controls, HTTPS, database and backup protection, and the devices used to access the application. This academic project has not been presented as an independently audited or certified production service. Use fictional or non-sensitive data for coursework and demonstrations.'],
            ['Your choices and privacy requests', 'You can sign out to remove the saved sign-in state from this browser. Depending on your role and deployment, you may be able to update profile details or notification preferences in the application. For a request to access, correct or delete account information, or to raise a privacy concern, contact the person or organization operating your deployment first; it controls the database and can verify the request. You may also contact the project email below with questions about this notice. The application does not currently provide a complete automated privacy-request or consent-management workflow, so the operator may need to handle requests outside the application and follow the laws that apply to them.'],
            ['Children and sensitive information', 'SmartStock is an inventory-management academic project, not a service designed for children. It does not need sensitive personal information to demonstrate its features. Do not enter children’s information or sensitive personal information into a demo. If such information has been entered into a deployment, contact that deployment’s operator.'],
            ['Changes to this notice', 'This notice may be updated when the project’s features or data flows change. The “Last updated” date above indicates the date of the current notice. A deployment operator should review this notice against its actual hosting, integrations and practices before inviting real users.'],
        ],
    },
    '/terms': {
        eyebrow: 'Terms',
        title: 'Terms of use',
        revised: 'Draft for organization review',
        introduction: 'This page is a plain-language starting point, not a binding agreement. The organization providing SmartStock should replace it with terms reviewed for its users, services and jurisdiction.',
        sections: [
            ['Authorized use', 'Use SmartStock only with an account provided or approved by the organization operating the workspace. Keep sign-in details secure and do not share accounts.'],
            ['Inventory records', 'Users are responsible for entering accurate product, stock, movement and order information. Forecasts and alerts are decision-support tools; verify important operational decisions before acting.'],
            ['Access and availability', 'Administrators assign roles and warehouse access. The operator should document service availability, maintenance, support commitments and any restrictions that apply to the deployment.'],
            ['Data and exports', 'Workspace data remains subject to the organization’s policies. Exported files may contain business-sensitive information and should be handled accordingly. Retention and backup behavior depends on the hosting environment.'],
            ['Contact and required additions', 'For questions about this website, contact kushalbhadra546@gmail.com. Before adopting these terms, specify the provider’s identity, effective date, governing law, acceptable-use rules, liability terms and termination process with qualified legal review.'],
        ],
    },
} as const;

export default function LegalPage() {
    const { pathname } = useLocation();
    const { token } = useAuth();
    const document = DOCUMENTS[pathname as keyof typeof DOCUMENTS]
        ?? DOCUMENTS['/privacy'];

    return (
        <div className={token ? '' : 'min-h-screen bg-slate-50'}>
            {!token && (
                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
                        <Link to="/" className="font-bold tracking-tight text-slate-900">smartstock</Link>
                        <Link to="/login" className="text-sm font-semibold text-emerald-800 hover:text-emerald-700">Sign in</Link>
                    </div>
                </header>
            )}
            <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
                {!token && (
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-800">
                        <ArrowLeft className="h-4 w-4" /> Back to home
                    </Link>
                )}
                <div className="mt-9 flex items-start gap-4">
                    <span className="rounded-xl bg-emerald-50 p-3 text-emerald-800">
                        <FileText className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">{document.eyebrow}</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{document.title}</h1>
                        <p className="mt-2 text-xs font-medium text-amber-700">{document.revised}</p>
                    </div>
                </div>
                <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm leading-6 text-amber-950">
                    {document.introduction}
                </div>
                <div className="mt-8 space-y-8">
                    {document.sections.map(([title, body]) => (
                        <section key={title}>
                            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                            <p className="mt-2 leading-7 text-slate-600">{body}</p>
                        </section>
                    ))}
                </div>
                <div className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500">
                    <p>
                        Contact:{' '}
                        <a
                            href="mailto:kushalbhadra546@gmail.com"
                            className="font-semibold text-emerald-800 hover:underline"
                        >
                            kushalbhadra546@gmail.com
                        </a>
                    </p>
                    <Link to="/help" className="mt-2 inline-block font-semibold text-emerald-800 hover:underline">Visit Help & Support</Link>
                </div>
            </main>
        </div>
    );
}
