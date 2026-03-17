import { useState, useEffect } from 'react';
let toasts: ToastInfo[] = [];
let listeners = new Set<(toasts: ToastInfo[]) => void>();

export type ToastInfo = {
    message: string;
    type: 'success' | 'error' | 'info';
    id: number;
};
export function addToast(toastInfo: ToastInfo) {
    const id = Date.now();
    toasts.push({ ...toastInfo, id });
    listeners.forEach((listener) => listener(toasts));

    // Auto-remove toast after 3 seconds
    setTimeout(() => {
        toasts = toasts.filter((toast) => toast.id !== id);
        listeners.forEach((listener) => listener(toasts));
    }, 3000);
};

export const useToasts = () => {
    const [state, setState] = useState(toasts);
    useEffect(() => {
        const listener = (newToasts: ToastInfo[]) => setState(newToasts);
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, []);
    return state;
};