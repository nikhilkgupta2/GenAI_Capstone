import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Dialog, DialogTone } from '../components/ui/Dialog';

interface DialogOptions {
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: DialogTone;
}

interface DialogContextType {
    confirm: (options: DialogOptions) => Promise<boolean>;
    alert: (options: DialogOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        confirmLabel: string;
        cancelLabel: string;
        tone: DialogTone;
        isAlert: boolean;
        resolve: (value: boolean | void) => void;
    } | null>(null);

    const confirm = useCallback((options: DialogOptions) => {
        return new Promise<boolean>((resolve) => {
            setState({
                isOpen: true,
                title: options.title,
                description: options.description,
                confirmLabel: options.confirmLabel || 'Confirm',
                cancelLabel: options.cancelLabel || 'Cancel',
                tone: options.tone || 'info',
                isAlert: false,
                resolve: resolve as (value: boolean | void) => void,
            });
        });
    }, []);

    const alert = useCallback((options: DialogOptions) => {
        return new Promise<void>((resolve) => {
            setState({
                isOpen: true,
                title: options.title,
                description: options.description,
                confirmLabel: options.confirmLabel || 'OK',
                cancelLabel: '',
                tone: options.tone || 'info',
                isAlert: true,
                resolve: () => resolve(),
            });
        });
    }, []);

    const handleClose = useCallback(() => {
        if (state) {
            state.resolve(false);
            setState(null);
        }
    }, [state]);

    const handleConfirm = useCallback(() => {
        if (state) {
            state.resolve(true);
            setState(null);
        }
    }, [state]);

    return (
        <DialogContext.Provider value={{ confirm, alert }}>
            {children}
            {state && (
                <Dialog
                    isOpen={state.isOpen}
                    title={state.title}
                    description={state.description}
                    confirmLabel={state.confirmLabel}
                    cancelLabel={state.cancelLabel}
                    tone={state.tone}
                    isAlert={state.isAlert}
                    onClose={handleClose}
                    onConfirm={handleConfirm}
                />
            )}
        </DialogContext.Provider>
    );
}

export function useDialog() {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
}
