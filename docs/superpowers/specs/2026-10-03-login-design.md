# Thiết kế đăng nhập và phiên người dùng

## Mục tiêu và phạm vi

Thêm luồng đăng nhập vào React Router template hiện tại, theo thiết kế người dùng đã duyệt trong hội thoại. Dùng React Hook Form, Zod, Zustand persist, Notistack, shadcn/ui và Lucide React. Giữ cấu hình SSR hiện tại.

Tài khoản demo cố định: username `admin`, password `admin123456Aa@`. Đây là xác thực phía client cho template; không có backend, token hay cơ chế bảo vệ dữ liệu server trong phạm vi này.

## Routing

- `/login`: hiển thị form cho khách; người đã đăng nhập được chuyển tới `/home` bằng replace.
- `/home`: hiển thị trang chào mừng và nút đăng xuất. Khách được chuyển tới `/login` bằng replace.
- `/`: sau khi khôi phục phiên, chuyển tới `/home` hoặc `/login` theo trạng thái đăng nhập.
- Đăng nhập đúng luôn chuyển tới `/home`. Đăng xuất xóa phiên và chuyển tới `/login`.
- Route guard chỉ render nội dung Home sau khi khôi phục phiên và xác định người dùng đã đăng nhập.

## Cấu trúc và trách nhiệm

- `app/features/auth/`: schema, kiểm tra credentials, store, custom hooks và các component dành riêng cho auth.
- `app/components/ui/`: các primitive shadcn/ui tái sử dụng như Button, Input, Label và Card.
- `app/providers/app-providers.tsx`: SnackbarProvider và phần khởi tạo phiên phía client.
- `app/routes/`: các route module mỏng, ghép giao diện và guard.
- `app/routes.ts`: khai báo route; `app/root.tsx`: đặt provider dùng chung; `app/app.css`: theme và style nền.

`useLogin` sở hữu React Hook Form, Zod resolver và handler submit: kiểm tra credentials, cập nhật store, thông báo và điều hướng. Hook dành cho đăng xuất thực hiện xóa phiên và điều hướng. Component con dùng hooks/store selectors hoặc FormProvider khi cần chia field; không truyền trạng thái auth qua nhiều tầng props. Không tạo thêm AuthContext trùng với Zustand.

## Form và thông báo

- Username và password đều bắt buộc; username được trim, password được giữ nguyên và so sánh chính xác, phân biệt hoa thường.
- Zod kiểm tra trường bắt buộc. Credentials không trùng tài khoản demo là lỗi đăng nhập, không phải lỗi định dạng schema.
- Lỗi field hiển thị ngay dưới input, liên kết bằng `aria-describedby` và `aria-invalid`.
- Submit form thiếu dữ liệu hiển thị lỗi field và thông báo thất bại; sai credentials hiển thị thông báo chung, không tạo phiên và không redirect.
- Đúng credentials: lưu user, hiển thị “Đăng nhập thành công”, chuyển tới Home.
- Notistack đặt ở góc trên bên phải, tự đóng, có nút đóng và ngăn thông báo trùng. Provider tồn tại xuyên suốt chuyển trang.
- Nút submit có trạng thái đang xử lý và chặn gửi lặp. Không thêm thời gian chờ giả.

## Persist và SSR

- Zustand persist dùng localStorage với key `auth-session`, version `1`, chỉ lưu user `{ username: "admin" }` hoặc `null`.
- Không lưu password, giá trị form, trạng thái submit hoặc cờ hydration. Trạng thái đăng nhập suy ra từ user.
- Tắt hydration tự động; chủ động rehydrate sau khi mount ở client. Không truy cập localStorage trong quá trình render server.
- Server và lần render client đầu cùng hiển thị trạng thái khôi phục phiên trung tính, tránh hydration mismatch và redirect nhầm khi refresh.
- Dữ liệu lưu hỏng hoặc user không hợp lệ được coi là chưa đăng nhập; quá trình khôi phục luôn kết thúc, không để màn hình chờ vô hạn.
- Nếu localStorage không khả dụng, ứng dụng vẫn hoạt động trong phiên bộ nhớ và thông báo khi không thể lưu phiên qua lần tải lại.
- Đăng xuất ghi trạng thái user null vào persist để tải lại không khôi phục phiên cũ.

## UI/UX

Dùng bố cục login từ shadcn/ui: nền sáng, form card rõ ràng, khoảng cách rộng, nội dung tiếng Việt. Desktop có vùng giới thiệu bên cạnh form; mobile ưu tiên form một cột, không tràn ngang. Không thêm chức năng đăng ký hoặc quên mật khẩu khi chưa có backend.

Input có label, autocomplete `username` và `current-password`. Nút hiện/ẩn mật khẩu dùng Lucide Eye/EyeOff, có tên truy cập được và không submit form. Icon trang trí ẩn với screen reader; focus bàn phím rõ ràng. Home tối giản, hiển thị username và thao tác đăng xuất.

## Tiêu chí kiểm tra

1. Form rỗng không tạo phiên, hiển thị lỗi field và thông báo thất bại.
2. Sai username hoặc password không tạo phiên và ở lại Login.
3. Credentials đúng thông báo thành công, chuyển tới `/home` và lưu user, không lưu password.
4. Refresh `/home` khôi phục phiên, không nháy Login hoặc cảnh báo hydration.
5. Khách vào `/home` bị chuyển tới Login; người đăng nhập vào `/login` được chuyển tới Home.
6. Đăng xuất rồi refresh không khôi phục phiên đã xóa; nút Back không hiển thị Home được bảo vệ.
7. localStorage hỏng/không khả dụng không làm ứng dụng crash hoặc chờ vô hạn.
8. Toggle password, submit bằng Enter, focus, đóng thông báo và bố cục mobile hoạt động đúng.
9. Kiểm thử logic schema/credentials/persist và các luồng routing quan trọng; chạy typecheck và production build.

## Trạng thái duyệt

Thiết kế trong hội thoại đã được duyệt. Tài liệu này chờ người dùng duyệt trước khi viết kế hoạch triển khai theo workflow brainstorming.
