import { useSnackbar } from 'notistack';
import { useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '~/components/ui/button';
import { useAuthStore } from '~/features/auth/auth-store';
import { useEmployeeAccountStore } from '~/features/auth/employee-account-store';
import { canAccess, subjectFor } from '~/features/auth/access-policy';

export function EmployeeAccountAction() {
  const user = useAuthStore((state) => state.user);
  const active = useEmployeeAccountStore((state) => state.active);
  const { enqueueSnackbar } = useSnackbar();
  const [pendingActive, setPendingActive] = useState<boolean | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  if (!canAccess(subjectFor(user, active), 'employee-account', 'update'))
    return null;

  function confirmChange() {
    if (pendingActive === null) return;
    const account = useEmployeeAccountStore.getState();
    const result = account.setActive(
      subjectFor(useAuthStore.getState().user, account.active),
      pendingActive,
    );
    setPendingActive(null);
    if (result.updated && !result.persisted) {
      enqueueSnackbar(
        'Trạng thái đã đổi trong phiên này nhưng không thể lưu trên thiết bị.',
        { variant: 'warning' },
      );
    }
  }

  return (
    <Dialog.Root
      open={pendingActive !== null}
      onOpenChange={(open) => setPendingActive(open ? !active : null)}
    >
      <Dialog.Trigger asChild>
        <Button
          size="sm"
          variant="outline"
          aria-label={active ? 'Vô hiệu hóa employee' : 'Kích hoạt employee'}
        >
          {active ? 'Vô hiệu hóa' : 'Kích hoạt'}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-xl border bg-background p-6 shadow-lg"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelRef.current?.focus();
          }}
        >
          <Dialog.Title className="text-lg font-semibold">
            Xác nhận {pendingActive ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">
            Có chắc chắn muốn {pendingActive ? 'kích hoạt' : 'vô hiệu hóa'} tài
            khoản không?
          </Dialog.Description>
          <p className="text-sm">
            Tài khoản: <span className="font-medium">employee</span>
          </p>
          <div className="flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button ref={cancelRef} variant="outline">
                Hủy
              </Button>
            </Dialog.Close>
            <Button
              variant={pendingActive ? 'default' : 'destructive'}
              onClick={confirmChange}
            >
              Xác nhận
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
