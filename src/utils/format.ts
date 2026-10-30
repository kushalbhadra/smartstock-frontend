import type { StockStatus } from '../types';

// Format number in Indian style: 1,00,000
export const fmt = (n: number): string =>
    new Intl.NumberFormat('en-IN').format(n);

// Format as Indian rupees
export const money = (n: number): string =>
    `₹${new Intl.NumberFormat('en-IN').format(n)}`;

// Format date as DD/MM/YYYY
export const fmtDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

// Format date and time
export const fmtDateTime = (dateStr: string): string => {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
};

// How long ago: "2 hrs ago", "3 days ago"
export const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
};

// Combine class names (like clsx but tiny)
export const cx = (...classes: (string | false | undefined | null)[]): string =>
    classes.filter(Boolean).join(' ');

// Get stock status from quantities
export const getStockStatus = (
    quantity: number,
    minQty: number,
    maxQty: number
): { label: StockStatus; color: string } => {
    if (quantity <= 0)
        return { label: 'CRITICAL', color: 'red' };
    if (quantity > maxQty)
        return { label: 'OVERSTOCK', color: 'purple' };
    if (quantity < minQty * 0.5)
        return { label: 'CRITICAL', color: 'red' };
    if (quantity < minQty)
        return { label: 'LOW', color: 'yellow' };
    return { label: 'OK', color: 'green' };
};