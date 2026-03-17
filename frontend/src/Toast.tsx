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

export const ToastContainer = () => {
    const toasts = useToasts();

    return (
        <div style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            zIndex: 9999
        }}>
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        color: "white",
                        background:
                            toast.type === "success" ? "#22c55e" :
                            toast.type === "error" ? "#ef4444" :
                            "#3b82f6",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                    }}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    );
};