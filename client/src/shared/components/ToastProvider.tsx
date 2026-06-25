import { useCallback, useState, type ReactNode } from "react";
import { ToastContext, type Toast, type ToastType } from "@/shared/lib/toastContext";
import { ToastViewport } from "@/shared/components/ToastViewport";

const AUTO_DISMISS_MS: Record<ToastType, number> = {
  success: 5000,
  error: 7000, // errors get a bit longer — there's more to read and it matters more
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, type, message }]);
      setTimeout(() => dismissToast(id), AUTO_DISMISS_MS[type]);
    },
    [dismissToast]
  );

  return (
    <ToastContext value={{ showToast }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext>
  );
}
