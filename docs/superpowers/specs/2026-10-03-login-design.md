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
- Đúng credentials: lưu user, hiển thị “Đăng nhập thành công. Chào mừng admin!”, chuyển tới Home.
- Notistack đặt ở góc trên bên phải, tự đóng, có nút đóng và ngăn thông báo trùng. Provider tồn tại xuyên suốt chuyển trang.
- Nút submit có trạng thái đang xử lý và chặn gửi lặp. Không thêm thời gian chờ giả.

## Login action, progress bar và phản hồi

Login action là handler phía client trong `useLogin`, không phải server action: credentials demo và phiên localStorage được xử lý ở client. Handler phân biệt lỗi credentials, lỗi lưu phiên và lỗi ngoài dự kiến; không hiển thị exception kỹ thuật cho người dùng.

Luồng trạng thái: `idle` → kiểm tra form → `submitting` → `redirecting` khi thành công hoặc trở về `idle` khi thất bại. Trạng thái xử lý bao phủ cả bước chuyển trang, không chỉ thời gian kiểm tra credentials. Dùng trạng thái form/navigation và trạng thái cần thiết trong hook, không persist trạng thái xử lý.

- **Form không hợp lệ:** không chạy kiểm tra credentials và không bật progress bar. Field hiển thị “Vui lòng nhập tên đăng nhập.” hoặc “Vui lòng nhập mật khẩu.”; focus field lỗi đầu tiên. Snackbar error: “Vui lòng kiểm tra các trường được đánh dấu.”
- **Đang xử lý:** hiển thị progress bar mảnh phía trên form, dùng trạng thái indeterminate vì không có phần trăm tiến độ thực. Nút có spinner Lucide và nhãn “Đang đăng nhập…”. Khóa input và submit, chặn cả click lặp lẫn Enter lặp; form có `aria-busy`.
- **Thành công:** lưu user, thông báo success “Đăng nhập thành công. Chào mừng admin!”, nhãn chuyển thành “Đang chuyển đến trang chủ…”. Giữ progress bar và khóa form đến khi route Home được hiển thị. Snackbar vẫn còn sau khi chuyển trang nhờ provider chung.
- **Sai tài khoản/mật khẩu:** dừng progress bar, mở lại form, ở lại `/login`. Snackbar error: “Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng thử lại.” Hiển thị cùng thông điệp dưới nhóm field để người dùng vẫn đọc được sau khi snackbar đóng. Giữ username, xóa password và focus vào password để nhập lại; xóa lỗi credentials khi người dùng sửa form.
- **Lỗi ngoài dự kiến:** dừng progress bar, mở lại form và hiển thị “Không thể đăng nhập lúc này. Vui lòng thử lại.” Không tạo phiên mới nếu bước xác thực chưa thành công.
- **Không lưu được localStorage:** credentials đúng vẫn được đăng nhập trong bộ nhớ và chuyển Home; snackbar warning “Đăng nhập thành công, nhưng không thể lưu phiên. Bạn có thể cần đăng nhập lại khi tải lại trang.” thay cho snackbar success để tránh thông báo trùng.
- **Chuyển trang thất bại sau khi đăng nhập:** giữ phiên hợp lệ, dừng progress bar và cho phép thử mở Home lại. Hiển thị “Bạn đã đăng nhập nhưng chưa thể mở trang chủ. Vui lòng thử lại.”; không báo sai credentials.

Progress bar có accessible name “Đang đăng nhập”, role `progressbar`, không gán phần trăm giả; vùng status đọc trạng thái bằng `aria-live="polite"`. Tôn trọng `prefers-reduced-motion`. Không cố kéo dài tác vụ demo để giữ animation: kiểm tra credentials có thể hoàn thành ngay; progress hiển thị trong khoảng pending thực tế của submit/chuyển route.

Snackbar dùng success/error/warning tương ứng, đặt góc trên bên phải, tối đa hai thông báo cùng lúc; success tự đóng sau 4 giây, error/warning sau 6 giây, có nút đóng truy cập được bằng bàn phím. Thông điệp quan trọng của lỗi form vẫn hiển thị inline, không chỉ dựa vào màu sắc hoặc thời gian tồn tại của snackbar.

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
9. Pending thực tế hiển thị progress bar, khóa gửi lặp, giữ trạng thái đến khi Home hiển thị; mọi nhánh thất bại đều kết thúc pending và cho phép thử lại.
10. Chạy các kiểm thử logic và E2E dưới đây, Prettier check, ESLint, typecheck và production build.

## Kiểm thử E2E bằng Playwright

Thêm Playwright Test, cấu hình `playwright.config.ts` và test trong `tests/e2e/`. Web server do cấu hình test quản lý; dùng build production và start server để kiểm tra cả SSR/hydration. Dùng browser context mới cho từng test để localStorage không rò sang test khác. Chạy Chromium trên desktop và cấu hình viewport mobile cho luồng chính.

Các kịch bản bắt buộc:

1. Khách truy cập `/`, `/home` được chuyển tới `/login`, không thấy nội dung Home trước khi redirect.
2. Submit form rỗng: lỗi từng field, focus đúng, snackbar error, không tạo phiên.
3. Sai username và sai password: kiểm tra từng trường hợp, nội dung snackbar/inline đúng, password được xóa, username được giữ, form có thể submit lại.
4. Đúng credentials: snackbar success ở góc trên bên phải, URL `/home`, lời chào admin; localStorage chỉ persist user và metadata của Zustand, không chứa password hoặc giá trị form.
5. Reload và mở tab mới trong cùng browser context giữ phiên; truy cập `/login` khi có phiên chuyển tới `/home`.
6. Đăng xuất, refresh và điều hướng Back không mở lại Home được bảo vệ.
7. localStorage chứa JSON lỗi/user sai cấu trúc hoặc không thể đọc/ghi: không crash, không chờ vô hạn; đăng nhập với lỗi ghi hiển thị đúng warning.
8. Hiện/ẩn password không submit; Enter đăng nhập được; thao tác bằng bàn phím và nút đóng snackbar hoạt động.
9. Viewport mobile không tràn ngang, input/nút chính sử dụng được; snackbar có anchor top-right và không vượt viewport.
10. Làm chậm có kiểm soát request tài nguyên/route Home trong môi trường test để quan sát pending: progress có accessible name, nút/form đang khóa, không phát sinh nhiều lần đăng nhập/thông báo; giải phóng request thì Home hiển thị và progress kết thúc.
11. Thu thập `pageerror` và lỗi console liên quan hydration để phát hiện lỗi SSR/client trong các luồng login, reload và redirect.

Không dùng `waitForTimeout` để đồng bộ test hoặc thêm delay vào code sản phẩm. Dùng locators theo role/label và assertions tự chờ. Các nhánh exception khó tạo tự nhiên với credentials đồng bộ được kiểm tra bằng test hook/service với dependency được kiểm soát, không thêm cờ lỗi hay route thử nghiệm vào sản phẩm. Kiểm tra sự chuyển đổi pending của hook bằng promise được điều khiển; E2E kiểm tra pending điều hướng thực tế.

Khi thất bại, lưu screenshot, trace và báo cáo HTML phục vụ điều tra; không commit các artifact sinh ra. Chỉ báo hoàn tất khi các test thực sự đã chạy, ghi rõ nếu môi trường chặn browser hoặc cài dependencies.

## Format và lint

- Thêm Prettier, cấu hình thống nhất và ignore cho build, thư mục sinh tự động, báo cáo Playwright và dependencies.
- Thêm ESLint với cấu hình TypeScript, React Hooks và JSX accessibility; tắt các rule format xung đột Prettier. Không bỏ rule hoặc dùng blanket disable để làm check xanh.
- Scripts: `format` chạy Prettier write; `format:check` chạy Prettier check; `lint` chạy ESLint với zero warnings; `test` chạy test logic; `test:e2e` chạy Playwright với production server; `test:e2e:ui` dành cho debug tương tác.
- Sau khi viết code: chạy format, format check, lint, typecheck, test logic, build và E2E. Cấu hình E2E tái sử dụng build vừa được xác minh, không build lặp không cần thiết.
- Ignore `playwright-report/`, `test-results/`, build và các file sinh tự động trong công cụ tương ứng; không bỏ qua source code, test hoặc cấu hình viết tay.

## Trạng thái duyệt

Người dùng đã duyệt bản spec bổ sung Playwright E2E, progress bar, thông điệp login action, Prettier và lint trong hội thoại ngày 2026-10-03. Chuyển sang lập kế hoạch triển khai.
