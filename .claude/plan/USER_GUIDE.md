# TaskFlow — Hướng dẫn sử dụng

> Hướng dẫn đầy đủ cho người dùng cuối. TaskFlow là ứng dụng quản lý công việc theo phong cách Kanban — giúp nhóm của bạn theo dõi tiến độ, giao việc và cộng tác hiệu quả.

---

## Mục lục

1. [Bắt đầu — Tạo tài khoản & Đăng nhập](#1-bắt-đầu)
2. [Workspace — Không gian làm việc](#2-workspace)
3. [Board — Bảng Kanban](#3-board)
4. [Lists — Cột công việc](#4-lists)
5. [Cards — Thẻ công việc](#5-cards)
6. [Nhãn (Labels)](#6-nhãn-labels)
7. [Checklist](#7-checklist)
8. [Bình luận (Comments)](#8-bình-luận)
9. [Đính kèm (Attachments)](#9-đính-kèm)
10. [Nhật ký hoạt động](#10-nhật-ký-hoạt-động)
11. [Thông báo](#11-thông-báo)
12. [Hồ sơ cá nhân](#12-hồ-sơ-cá-nhân)

---

## 1. Bắt đầu

### Tạo tài khoản

1. Truy cập ứng dụng → nhấn **Đăng ký**.
2. Nhập **Họ và tên**, **Email**, **Mật khẩu** (tối thiểu 6 ký tự) → nhấn **Đăng ký**.
3. Kiểm tra hộp thư đến — bạn sẽ nhận được **mã OTP 6 chữ số** (hiệu lực 15 phút).
4. Nhập mã OTP vào trang xác minh → tài khoản được kích hoạt.

> **Chưa nhận được mã?** Nhấn **Gửi lại mã xác minh** trên trang OTP.

### Đăng nhập

1. Nhập **Email** và **Mật khẩu** → nhấn **Đăng nhập**.
2. Phiên đăng nhập được duy trì tự động — bạn không cần đăng nhập lại sau khi đóng trình duyệt.

### Quên mật khẩu

1. Nhấn **Quên mật khẩu** ở trang đăng nhập.
2. Nhập email → nhấn **Gửi link đặt lại**.
3. Mở email → nhấn link đặt lại mật khẩu (hiệu lực 1 giờ).
4. Nhập mật khẩu mới → **Đặt lại mật khẩu**.

---

## 2. Workspace

Workspace là không gian làm việc chứa nhiều board. Mỗi workspace thường đại diện cho một nhóm hoặc dự án.

### Tạo workspace

1. Từ trang chủ → nhấn **Tạo workspace mới**.
2. Nhập tên workspace → nhấn **Tạo workspace**.

### Mời thành viên vào workspace

1. Mở workspace → vào **Cài đặt workspace** (biểu tượng bánh răng).
2. Tìm kiếm email thành viên → nhấn **Mời**.

> **Lưu ý:** Thành viên phải đã có tài khoản TaskFlow. Họ sẽ nhận email thông báo và xuất hiện trong workspace ngay lập tức.

### Phân quyền trong workspace

| Quyền | Owner | Admin | Member |
|---|:---:|:---:|:---:|
| Xoá workspace | ✅ | ❌ | ❌ |
| Mời / xoá thành viên | ✅ | ✅ | ❌ |
| Tạo board | ✅ | ✅ | ✅ |
| Xem board | ✅ | ✅ | ✅ |

### Xoá hoặc đổi tên workspace

Vào **Cài đặt workspace** → chỉnh sửa tên hoặc cuộn xuống phần **Vùng nguy hiểm** để xoá.

---

## 3. Board

Board là bảng Kanban chứa các cột (list) và thẻ công việc (card).

### Tạo board

1. Trong workspace → nhấn **Tạo board mới**.
2. Nhập **Tên board**, chọn **màu nền**, chọn **quyền hiển thị**:
   - `Riêng tư` — chỉ thành viên board mới thấy.
   - `Workspace` — mọi thành viên workspace đều thấy.
   - `Công khai` — bất kỳ ai có link đều xem được.
3. Nhấn **Tạo board**.

### Mời thành viên vào board

1. Mở board → nhấn nút **Mời thành viên** (góc trên phải).
2. Nhập email:
   - **Người đã có tài khoản** → được thêm ngay + nhận email thông báo.
   - **Người chưa có tài khoản** → nhận email với link mời; sau khi đăng ký và xác minh email khớp sẽ tự động vào board.
3. Có thể xem danh sách lời mời đang chờ và **Thu hồi** nếu cần.

### Phân quyền trong board

| Quyền | Owner | Admin | Member | Viewer |
|---|:---:|:---:|:---:|:---:|
| Xoá board | ✅ | ❌ | ❌ | ❌ |
| Mời / xoá thành viên | ✅ | ✅ | ❌ | ❌ |
| Tạo / xoá list, card | ✅ | ✅ | ✅ | ❌ |
| Xem board | ✅ | ✅ | ✅ | ✅ |

---

## 4. Lists

List là các **cột** trên board — đại diện cho từng giai đoạn công việc (VD: `Cần làm`, `Đang làm`, `Hoàn thành`).

### Tạo list

Nhấn **+ Thêm danh sách** ở cuối hàng cột → nhập tên → nhấn **Enter** hoặc nhấn nút xác nhận.

### Đổi tên list

Click trực tiếp vào tên cột → chỉnh sửa → nhấn **Enter** để lưu hoặc **Escape** để huỷ.

### Sắp xếp lại thứ tự cột

**Kéo thả** tiêu đề cột sang vị trí mới — thứ tự được lưu ngay vào cơ sở dữ liệu.

### Xoá list

Nhấn menu `⋯` trên cột → **Xoá danh sách**. Toàn bộ card trong cột cũng sẽ bị xoá.

---

## 5. Cards

Card là đơn vị công việc cơ bản — tương đương một task hoặc đầu việc cụ thể.

### Tạo card

Nhấn **Thêm card** ở dưới cùng một cột → nhập tiêu đề → nhấn **Enter**.

### Mở chi tiết card

Click vào card để mở modal chi tiết với đầy đủ thông tin và công cụ.

### Chỉnh sửa thông tin card

Trong modal chi tiết:

| Trường | Cách chỉnh sửa |
|---|---|
| **Tiêu đề** | Click vào tiêu đề → sửa trực tiếp |
| **Mô tả** | Click vào vùng mô tả → nhập nội dung |
| **Độ ưu tiên** | Chọn từ sidebar: `Thấp` / `Trung bình` / `Cao` / `Khẩn cấp` |
| **Ngày hết hạn** | Chọn ngày từ date picker trong sidebar |
| **Người thực hiện** | Chọn thành viên từ dropdown trong sidebar |

> **Lưu ý:** Độ ưu tiên và người thực hiện được lưu **ngay khi chọn**. Tiêu đề và mô tả được lưu khi nhấn nút **Lưu trữ card** (mô tả không được để trống).

### Đánh dấu hoàn thành

Nhấn nút **Đánh dấu hoàn thành** trong sidebar → tiêu đề card sẽ hiện gạch ngang và xuất hiện badge **Đã hoàn thành**.

### Di chuyển card

**Kéo thả** card sang cột khác hoặc vị trí khác trong cùng cột — vị trí được lưu ngay.

> Nếu có lỗi mạng khi kéo thả, card sẽ tự động trở về vị trí cũ (snapshot rollback).

### Xoá card

Trong modal chi tiết → nhấn nút **Xoá card** ở sidebar.

---

## 6. Nhãn (Labels)

Nhãn giúp phân loại và lọc card theo chủ đề, loại công việc hoặc trạng thái.

### Tạo nhãn cho board

1. Mở card → trong sidebar nhấn **Nhãn** → nhấn **+ Tạo nhãn mới**.
2. Nhập tên nhãn, chọn màu từ bảng 10 màu → nhấn **Tạo**.

### Gán nhãn vào card

Trong sidebar của card → nhấn **Nhãn** → click vào nhãn muốn gán (checkbox toggle).

### Chỉnh sửa / Xoá nhãn

Trong panel nhãn → nhấn biểu tượng ✏️ bên cạnh nhãn → chỉnh sửa tên/màu hoặc nhấn **Xoá nhãn**.

> Xoá nhãn khỏi board sẽ tự động gỡ nhãn đó khỏi tất cả các card.

---

## 7. Checklist

Checklist là danh sách các bước nhỏ bên trong một card — hữu ích khi một task cần nhiều việc con.

### Thêm checklist vào card

Mở card → trong sidebar nhấn **Checklist** → nhập tên checklist → nhấn **Thêm**.

### Thêm mục vào checklist

Nhấn **+ Thêm mục** bên dưới checklist → nhập nội dung → nhấn **Enter** để xác nhận.

### Đánh dấu hoàn thành mục

Tick vào **checkbox** bên trái mục — text sẽ gạch ngang, progress bar cập nhật tức thì.

### Chỉnh sửa nội dung mục

Click vào text của mục → chỉnh sửa trực tiếp → **Enter** để lưu, **Escape** để huỷ.

### Giao mục cho thành viên

Hover vào mục → nhấn biểu tượng 👤 → chọn thành viên từ dropdown.

> Avatar của người được giao hiện ngay bên cạnh mục.

### Đặt ngày hết hạn cho mục

Hover vào mục → nhấn biểu tượng 📅 → chọn ngày.

> Ngày hết hạn hiện badge màu **đỏ** nếu đã quá hạn.

### Đổi tên checklist

Click vào tiêu đề checklist → chỉnh sửa → **Enter** để lưu.

### Xoá mục hoặc checklist

- **Xoá mục:** Hover vào mục → nhấn biểu tượng ✕.
- **Xoá checklist:** Nhấn nút **Xoá** bên cạnh tên checklist.

> **Progress bar** phía trên mỗi checklist hiển thị `completed/total` — chuyển xanh khi đạt 100%. Badge `☑ X/Y` cũng hiện trên card ngoài board view.

---

## 8. Bình luận

Bình luận trực tiếp trên card để trao đổi với đồng đội.

### Thêm bình luận

Mở card → chuyển sang tab **Bình luận** → nhập nội dung → nhấn **Enter** hoặc nút gửi.

### Reply bình luận

Nhấn **Trả lời** bên dưới bình luận gốc → nhập nội dung → gửi.

> Chỉ hỗ trợ reply 1 cấp — không thể reply vào reply.

### Chỉnh sửa / Xoá bình luận

Chỉ tác giả mới được chỉnh sửa hoặc xoá bình luận của mình:
- Nhấn biểu tượng ✏️ để sửa → **Lưu**.
- Nhấn biểu tượng 🗑 để xoá.

> Bình luận đã chỉnh sửa hiện nhãn **(đã sửa)** bên cạnh thời gian.

---

## 9. Đính kèm

Upload file vào card — ảnh, PDF, tài liệu Office, ZIP (tối đa 10 MB mỗi file).

### Upload file

Mở card → trong sidebar nhấn **Đính kèm** → chọn file từ máy tính.

### Tải xuống file

Nhấn tên file trong danh sách đính kèm → hộp thoại lưu file xuất hiện.

### Đặt làm ảnh bìa

Chỉ áp dụng với file **ảnh**: Nhấn **Đặt làm ảnh bìa** bên cạnh file → ảnh hiển thị trên đầu card trong board view.

### Xoá file đính kèm

Nhấn biểu tượng 🗑 bên cạnh file — file sẽ bị xoá cả trên server.

> Chỉ người upload hoặc board admin/owner mới xoá được file của người khác.

---

## 10. Nhật ký hoạt động

Mọi thao tác trên card đều được ghi lại tự động — ai làm gì, lúc nào.

### Xem nhật ký của card

Mở card → chuyển sang tab **Hoạt động** — danh sách hiển thị theo thứ tự mới nhất lên trên.

### Cập nhật real-time

Khi đồng đội cũng đang mở cùng card, nhật ký của bạn **tự động cập nhật** không cần refresh:
- Mục mới được **highlight xanh 3 giây**.
- Nếu bạn đang cuộn xuống và có mục mới, pill **"↑ N hoạt động mới"** xuất hiện — click để scroll lên đầu.
- Nếu bạn đang ở tab khác, badge đếm số hoạt động mới hiện trên tab **Hoạt động**.

### Xem nhật ký của toàn board

_(Tính năng dành cho team lead)_ — Trong tương lai có thể xem từ menu board settings.

---

## 11. Thông báo

TaskFlow gửi thông báo real-time cho các sự kiện quan trọng.

### Các loại thông báo tự động

| Sự kiện | Người nhận |
|---|---|
| Được gán vào card | Người được assign |
| Có bình luận mới trên card | Người được assign card (nếu không phải người comment) |
| Card sắp đến hạn (trong 24 giờ) | Người được assign card |

### Xem thông báo

Nhấn biểu tượng 🔔 trên thanh điều hướng — số badge đỏ hiển thị thông báo chưa đọc.

### Đánh dấu đã đọc

- **Từng thông báo:** Nhấn vào thông báo.
- **Tất cả:** Nhấn **Đánh dấu tất cả đã đọc** trong dropdown.

### Xoá thông báo

Nhấn biểu tượng ✕ bên cạnh từng thông báo.

---

## 12. Hồ sơ cá nhân

### Cập nhật tên và ảnh đại diện

1. Nhấn vào avatar của bạn (góc trên phải) → **Hồ sơ cá nhân**.
2. **Đổi ảnh:** Nhấn biểu tượng 📷 trên ảnh đại diện → chọn ảnh từ máy (tối đa 2 MB).
3. **Đổi tên:** Chỉnh sửa trường **Họ và tên**.
4. Nhấn **Lưu thay đổi** — cả tên và ảnh được cập nhật trên toàn hệ thống.

> Email không thể thay đổi sau khi đăng ký.

### Đổi mật khẩu

Hiện tại, để đổi mật khẩu vui lòng sử dụng luồng **Quên mật khẩu** ở trang đăng nhập.

### Đăng xuất

Nhấn **Đăng xuất** trong trang Hồ sơ hoặc từ menu avatar.

---

## Mẹo sử dụng hiệu quả

| Mẹo | Chi tiết |
|---|---|
| **Kéo thả nhanh** | Kéo card giữa các cột thay vì mở modal để chuyển trạng thái |
| **Độ ưu tiên tức thì** | Click priority trong sidebar — lưu ngay, không cần "Lưu trữ card" |
| **Checklist cho task phức tạp** | Dùng checklist thay vì tạo nhiều card con — progress bar hiển thị ngay trên board |
| **Nhãn màu** | Dùng màu sắc nhất quán cho nhãn (VD: đỏ = urgent, xanh = đang review) |
| **Badge checklist** | Badge `☑ X/Y` trên card giúp xem tiến độ mà không cần mở modal |
| **Ảnh bìa** | Đặt ảnh bìa cho card giúp nhận diện nhanh trong board view |
