import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Modal({ title, onClose, children, wide }: {
    title: string;
    onClose: () => void;
    children: ReactNode;
    wide?: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                aria-label="Close"
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-auto`}>
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
                    <h2 className="font-bold text-lg text-slate-900">{title}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

export function ConfirmDialog({ title, message, onConfirm, onCancel }: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                aria-label="Cancel"
                onClick={onCancel}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <h3 className="font-bold text-lg text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 mt-2">{message}</p>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onCancel} className="btn-secondary">Cancel</button>
                    <button onClick={onConfirm} className="btn-danger">Delete</button>
                </div>
            </div>
        </div>
    );
}