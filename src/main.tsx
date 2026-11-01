
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import App from './App';
import { ThemeToggle } from './components/ThemeToggle';
import './index.css';

if (localStorage.getItem('smartstock-theme') === 'dark') {
    document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <AuthProvider>
            <ToastProvider>
                <App />
                <ThemeToggle />
            </ToastProvider>
        </AuthProvider>
    </BrowserRouter>
);
