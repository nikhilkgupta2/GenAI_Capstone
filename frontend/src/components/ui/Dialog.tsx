import React from 'react';
import { AlertCircle, Trash2, CheckCircle2, Info, X } from 'lucide-react';
import { Button } from '../Button';
import { cn } from '../../lib/cn';

export type DialogTone = 'danger' | 'info' | 'success' | 'warning';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: DialogTone;
    isAlert?: boolean;
}

const toneStyles: Record<DialogTone, { icon: any; iconContainer: string; iconColor: string; buttonBg: string }> = {
    danger: {
        icon: Trash2,
        iconContainer: 'bg-red-50 dark:bg-red-950/30',
        iconColor: 'text-red-600 dark:text-red-400',
        buttonBg: 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
    },
    warning: {
        icon: AlertCircle,
        iconContainer: 'bg-amber-50 dark:bg-amber-950/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
        buttonBg: 'bg-amber-600 hover:bg-amber-700',
    },
    success: {
        icon: CheckCircle2,
        iconContainer: 'bg-emerald-50 dark:bg-emerald-950/30',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
    },
    info: {
        icon: Info,
        iconContainer: 'bg-indigo-50 dark:bg-indigo-950/30',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
    },
};

export function Dialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'info',
    isAlert = false,
}: DialogProps) {
    if (!isOpen) return null;

    const style = toneStyles[tone];
    const Icon = style.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity dark:bg-black/60"
                onClick={onClose}
            />

            {/* Dialog Panel */}
            <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:border dark:border-white/10 dark:bg-slate-900 border border-slate-200">
                <div className="p-6">
                    <div className="flex flex-col items-center text-center">
                        {/* Icon Circle */}
                        <div className={cn("mb-4 flex h-14 w-14 items-center justify-center rounded-full shrink-0", style.iconContainer)}>
                            <Icon className={cn("h-7 w-7", style.iconColor)} />
                        </div>

                        <h3 className="text-lg font-bold text-slate-950 dark:text-white leading-tight">
                            {title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 dark:text-white/60 leading-relaxed px-2">
                            {description}
                        </p>
                    </div>

                    <div className="mt-8 flex flex-col gap-2 sm:flex-row-reverse">
                        <Button
                            onClick={onConfirm || onClose}
                            className={cn("w-full h-11 transition-all active:scale-95", style.buttonBg)}
                        >
                            {confirmLabel}
                        </Button>
                        {!isAlert && (
                            <Button
                                onClick={onClose}
                                className="w-full h-11 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 active:scale-95"
                            >
                                {cancelLabel}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Close Button (Optional) */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:text-white/40 dark:hover:bg-white/5 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
