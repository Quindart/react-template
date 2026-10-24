import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useSnackbar } from 'notistack';
import { useAuthStore } from './auth-store';
import { AUTH_MESSAGES } from './auth-messages';

export function useLogout() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [isPending, setPending] = useState(false);
  const locked = useRef(false);
  const logout = async () => {
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    try {
      const response = await fetch('/auth/session', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'clear' }),
      });
      if (!response.ok) throw new Error('Could not revoke server session');
    } catch {
      enqueueSnackbar(AUTH_MESSAGES.logoutError, {
        variant: 'error',
        autoHideDuration: 6000,
      });
      locked.current = false;
      setPending(false);
      return;
    }
    const { persisted } = useAuthStore.getState().signOut();
    enqueueSnackbar(
      persisted
        ? 'Đã đăng xuất.'
        : 'Đã đăng xuất, nhưng không thể xóa phiên đã lưu. Phiên cũ có thể được khôi phục khi tải lại trang.',
      {
        variant: persisted ? 'success' : 'warning',
        autoHideDuration: persisted ? 4000 : 6000,
      },
    );
    try {
      await navigate('/login', { replace: true });
    } catch {
      enqueueSnackbar(
        'Bạn đã đăng xuất nhưng chưa thể mở trang đăng nhập. Vui lòng thử lại.',
        {
          variant: 'error',
          autoHideDuration: 6000,
        },
      );
    } finally {
      locked.current = false;
      setPending(false);
    }
  };
  return { logout, isPending };
}
