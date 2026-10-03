import type { ReactNode } from "react";
import { SnackbarProvider, closeSnackbar } from "notistack";
import { X } from "lucide-react";
import { SessionBootstrap } from "~/features/auth/session-bootstrap";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SnackbarProvider
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      maxSnack={2}
      preventDuplicate
      autoHideDuration={6000}
      action={(key) => (
        <button type="button" aria-label="Đóng thông báo" onClick={() => closeSnackbar(key)}
          className="rounded p-1 focus-visible:outline-2 focus-visible:outline-offset-2">
          <X size={18} aria-hidden="true" />
        </button>
      )}
    >
      <SessionBootstrap />
      {children}
    </SnackbarProvider>
  );
}
