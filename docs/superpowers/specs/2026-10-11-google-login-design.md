# Thiết kế đăng nhập bằng Google

## Trạng thái

Bản thiết kế được trình bày để người dùng duyệt. Phạm vi được thống nhất trong hội thoại: giữ đăng nhập username/password demo, thêm đăng nhập bằng tài khoản Google thật, tài khoản Google mới có quyền employee và admin demo tiếp tục là tài khoản riêng.

## Mục tiêu và giới hạn

- Thêm lựa chọn “Tiếp tục với Google” vào trang `/login` hiện tại.
- Google xác thực danh tính thật qua OAuth 2.0 / OpenID Connect; sau callback thành công, ứng dụng tạo phiên của chính ứng dụng.
- Giữ hai tài khoản demo `admin` và `employee` cùng luồng đăng nhập hiện tại.
- Không thêm đăng ký, liên kết tài khoản, Google API ngoài thông tin nhận dạng cơ bản, hay quy trình quản trị email được duyệt.
- Đây vẫn là prototype. Google xác thực người dùng thật, nhưng quyền trong giao diện và dữ liệu hiện tại vẫn được kiểm tra phía client. Không coi đây là phân quyền an toàn cho dữ liệu production.

## Cách tiếp cận

1. **OAuth authorization code với callback phía server — chọn.** App chuyển trình duyệt tới Google, nhận authorization code ở callback route của React Router, đổi code và xác minh danh tính trên server, sau đó cấp cookie phiên của app. Phù hợp với app đang dùng SSR và giữ client secret ở server. Google mô tả server flow để backend xác minh người dùng; React Router hỗ trợ quản lý session bằng cookie trong loader/action. [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect) · [React Router sessions and cookies](https://reactrouter.com/explanation/sessions-and-cookies)
2. **Google Identity Services popup.** Giữ người dùng ở trang login, nhưng vẫn cần gửi thông tin đăng nhập tới server để xác minh và tạo session cookie. Trải nghiệm có thể mượt hơn, đổi lại cần xử lý giao tiếp popup, callback phía client và các trạng thái popup bị chặn/đóng.
3. **Mô phỏng nút Google trong frontend.** Không xác minh tài khoản Google và không đáp ứng yêu cầu đăng nhập thật; không chọn.

## Luồng người dùng

1. Khách mở `/login` và chọn username/password hoặc “Tiếp tục với Google”.
2. Với Google, app tạo state chống giả mạo và chuyển hướng tới Google với các scope nhận dạng tối thiểu `openid email profile`.
3. Người dùng chọn tài khoản và chấp thuận. Nếu hủy hoặc Google trả lỗi, app quay lại `/login` với thông báo dễ hiểu; không tạo phiên.
4. Google chuyển về callback URL đã đăng ký. Server kiểm tra state, đổi authorization code, xác minh ID token (chữ ký, issuer, audience và hạn dùng), rồi lấy subject ổn định cùng email đã xác minh và tên hiển thị nếu có.
5. Server tạo phiên app cho danh tính Google đó và chuyển hướng tới `/home`.
6. Khi refresh hoặc mở trang workspace, client khôi phục trạng thái người dùng từ phiên app để UI không nhầm người dùng đã đăng nhập thành khách. Không lưu access token, refresh token, client secret hoặc ID token trong `localStorage`.
7. Đăng xuất xóa phiên app phía server và trạng thái người dùng phía client, rồi chuyển tới `/login`. Đăng xuất app không đăng xuất tài khoản Google khỏi trình duyệt.

## Danh tính và quyền

- Danh tính Google được định danh bằng claim `sub`, không dùng email làm định danh duy nhất vì email có thể đổi.
- Mọi danh tính Google hợp lệ mới nhận quyền `employee`; không thể nhận quyền `admin` từ claim, email, localStorage hoặc dữ liệu do client gửi.
- Tài khoản Google là danh tính riêng với tài khoản demo `employee`; trạng thái bật/tắt employee trong fixture demo không vô hiệu hóa mọi tài khoản Google.
- Tài khoản demo `admin` vẫn đăng nhập bằng username/password; không tự động nâng quyền dựa trên email Google.
- Tên và email đã xác minh có thể được hiển thị trong menu tài khoản. Chỉ lưu các trường cần cho giao diện và phân quyền demo.

## Kiến trúc và cấu hình

- Thêm route bắt đầu OAuth và callback server-side, ví dụ `/auth/google` và `/auth/google/callback`; callback là redirect URI cần đăng ký trong Google Cloud Console.
- Dùng session cookie phía server với `HttpOnly`, `SameSite=Lax`, `Secure` khi chạy HTTPS và secret lấy từ biến môi trường. Không đưa secret vào biến `VITE_*` hay bundle trình duyệt.
- Khai báo biến môi trường cho Google client ID, client secret, redirect URL và session secret; cung cấp file mẫu không chứa credential. Thiếu cấu hình phải tạo lỗi cấu hình rõ ràng thay vì giả lập đăng nhập Google.
- Mở rộng kiểu `AuthUser`, kiểm tra dữ liệu hydrate và policy hiện tại để biểu diễn danh tính Google employee mà không nhầm với hai username demo.
- Phiên cookie là nguồn xác thực Google; Zustand/localStorage chỉ có thể phản chiếu dữ liệu UI không nhạy cảm. Phải khôi phục từ server session sau reload và xóa cả hai phía khi đăng xuất.
- Giữ route module hiện có mỏng và gom xử lý OAuth/session vào `app/features/auth/` theo cấu trúc hiện tại.

## Lỗi và trạng thái giao diện

- Nút Google có trạng thái đang chuyển hướng, bị khóa khi submit đang diễn ra và có accessible name.
- Trả lỗi từ Google, state không khớp, code hết hạn, token không hợp lệ, thiếu claim cần thiết, lỗi cấu hình hoặc lỗi mạng đều không tạo phiên; hiển thị thông báo tiếng Việt tổng quát và cho phép thử lại.
- Không hiển thị token, client secret, stack trace hoặc lỗi nhà cung cấp chi tiết trong UI/log client.
- Nếu callback thành công nhưng điều hướng workspace lỗi, giữ phiên hợp lệ và cho phép thử mở lại trang chủ, tương tự luồng login demo hiện tại.

## Tiêu chí kiểm tra

1. Trang login giữ nguyên đăng nhập demo và hiển thị nút Google.
2. OAuth start chuyển hướng với redirect URI và scope đúng, đồng thời state được tạo và kiểm tra ở callback.
3. Callback hợp lệ tạo phiên app, cấp quyền employee và chuyển tới `/home`.
4. Callback bị hủy, state sai, code/token không hợp lệ, thiếu email đã xác minh hoặc cấu hình thiếu không tạo phiên.
5. Refresh sau Google login khôi phục đúng danh tính; đăng xuất xóa phiên app và quay về `/login`.
6. Tài khoản Google không thể vào route Users hoặc thay đổi trạng thái employee; tài khoản admin demo vẫn có quyền như trước.
7. Client secret và token không xuất hiện trong bundle, localStorage, thông báo UI hoặc log trình duyệt.
8. Login demo, đăng xuất demo, khôi phục phiên demo và xử lý employee fixture hiện tại tiếp tục hoạt động.
9. UI xử lý được pending, lỗi, hủy OAuth, điều hướng và bàn phím/screen reader.

## Giới hạn bảo mật của prototype

Cookie xác nhận rằng người dùng đã đăng nhập Google, nhưng `AuthGate`, vai trò và dữ liệu Users hiện đang chạy ở trình duyệt. Một người dùng có thể sửa state phía client. Nếu app chuyển sang lưu hoặc thao tác dữ liệu thật, cần chuyển xác thực phiên và kiểm tra quyền vào server cho mọi loader/action/API được bảo vệ trước khi dùng dữ liệu đó.
