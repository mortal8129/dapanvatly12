# Tra Cứu Vật Lí 12 - Mobile Web App (GDPT 2018)

> Ứng dụng Web Mobile tra cứu toàn diện 3.224 câu hỏi Vật Lí 12 chuẩn chương trình Giáo dục Phổ thông 2018 của Bộ Giáo dục và Đào tạo.

---

## 📱 Điểm Nổi Bật
- **Giao diện chuẩn Mobile App**:
  - Mô hình nguyên tử Bohr động (Animated Bohr Atom) phát sáng ở trung tâm.
  - Chế độ Sáng / Tối (Dark / Light Theme) linh hoạt, lưu trạng thái tự động.
  - Watermark công thức Vật lí nền trang nhã (`p·V = n·R·T`, `Q = mcΔT`, `B = 2π·10⁻⁷·I/R`,...).
  - Thanh tìm kiếm Docked Header mượt mà khi gõ 6 số ID (`000001` - `003224`) hoặc từ khóa.
- **Dữ liệu hoàn thiện 100%**:
  - Đầy đủ 3.224 câu hỏi độc bản chuẩn hóa (Chương 1 đến Chương 4).
  - 100% câu hỏi có đáp án chính thức và 100% có lời giải chi tiết sư phạm.
  - Đầy đủ 176 hình vẽ bài tập, mạch điện, đồ thị.
- **Kiến trúc Hybrid API & PWA Offline**:
  - Khi có Backend: Kết nối trực tiếp cơ sở dữ liệu **MariaDB** qua REST API (FastAPI).
  - Khi Standalone trên **GitHub Pages**: Tự động dùng Client-side Data Engine siêu tốc, không cần server.
  - Hỗ trợ cài đặt PWA (Add to Home Screen) thành ứng dụng độc lập trên điện thoại.

---

## 🚀 Hướng Dẫn Public Lên GitHub Pages

### Cách 1: Sử dụng script tự động
```bash
bash deploy_to_github.sh https://github.com/<tai_khoan_cua_ban>/<ten_repo>.git
```

### Cách 2: Dùng lệnh Git thủ công
```bash
git remote add origin https://github.com/<tai_khoan_cua_ban>/<ten_repo>.git
git branch -M main
git push -u origin main --force
```

### Cách 3: Dùng GitHub CLI (`gh`)
```bash
gh auth login
gh repo create tra-cuu-vat-ly-12 --public --source=. --push
```

Sau khi push, vào **Settings -> Pages** trên GitHub:
- **Source**: Chọn `Deploy from a branch`
- **Branch**: Chọn `main` / `/(root)` $\rightarrow$ bấm **Save**.
Trang web sẽ hoạt động trực tuyến toàn cầu tại:
`https://<username>.github.io/<ten_repo>/`

---

## 🌐 Chạy Trực Tiếp Localhost
Web đã được tích hợp trực tiếp vào FastAPI server:
- Giao diện Web: `http://127.0.0.1:8000/`
- API Swagger Docs: `http://127.0.0.1:8000/docs`
