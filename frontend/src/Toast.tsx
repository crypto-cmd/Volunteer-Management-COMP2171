import { useState, useEffect } from 'react';
let toasts: ToastInfo[] = [];
let listeners = new Set<(toasts: ToastInfo[]) => void>();
let nextToastId = 1;

export type ToastInfo = {
    message: string;
    type: 'success' | 'error' | 'info';
    id: number;
};

function notifyListeners() {
    const snapshot = [...toasts];
    listeners.forEach((listener) => listener(snapshot));
}

export function addToast(toastInfo: Omit<ToastInfo, 'id'>) {
    const id = nextToastId++;
    toasts = [...toasts, { ...toastInfo, id }];
    notifyListeners();

    // Auto-remove toast after 3 seconds
    setTimeout(() => {
        toasts = toasts.filter((toast) => toast.id !== id);
        notifyListeners();
    }, 3000);
};

export const useToasts = () => {
    const [state, setState] = useState<ToastInfo[]>([...toasts]);
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