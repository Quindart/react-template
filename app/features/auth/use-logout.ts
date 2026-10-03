import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useSnackbar } from "notistack";
import { useAuthStore } from "./auth-store";

export function useLogout() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [isPending, setPending] = useState(false);
  const locked = useRef(false);
  const logout = async () => {
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    const { persisted } = useAuthStore.getState().signOut();
    enqueueSnackbar(persisted ? "Đã đăng xuất." : "Đã đăng xuất, nhưng không thể xóa phiên đã lưu. Phiên cũ có thể được khôi phục khi tải lại trang.", {
      variant: persisted ? "success" : "warning",
      autoHideDuration: persisted ? 4000 : 6000,
    });
    try {
      await navigate("/login", { replace: true });
    } catch {
      enqueueSnackbar("Bạn đã đăng xuất nhưng chưa thể mở trang đăng nhập. Vui lòng thử lại.", {
        variant: "error", autoHideDuration: 6000,
      });
    } finally {
      locked.current = false;
      setPending(false);
    }
  };
  return { logout, isPending };
}
