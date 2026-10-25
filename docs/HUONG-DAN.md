# Hướng dẫn chạy và đưa dự án lên GitHub

## 1. Tạo Firebase (khoảng 5 phút)

1. Vào https://console.firebase.google.com → **Add project** (có thể tắt Google Analytics).
2. **Build → Authentication → Get started → Sign-in method** → bật **Email/Password**.
3. **Build → Firestore Database → Create database** → chọn vùng gần (ví dụ `asia-southeast1`) → chế độ **production**.
4. Vào tab **Rules** của Firestore, dán toàn bộ nội dung file `firestore.rules` → **Publish**.
5. **Project settings (bánh răng) → General → Your apps → biểu tượng `</>`** để tạo Web app → copy đoạn `firebaseConfig`.
6. Dán các giá trị đó vào `src/environments/environment.ts` (thay các chỗ `YOUR_...`).

> Cấu hình web của Firebase không phải bí mật, có thể commit lên GitHub. Dữ liệu được bảo vệ bằng `firestore.rules`.

## 2. Chạy trên máy

```bash
npm install
npm start
```

Mở http://localhost:4200 → **Sign up** tạo tài khoản → bấm **Generate sample data** ở Dashboard.

Nếu gặp lỗi build, copy nguyên thông báo lỗi gửi lại để sửa.

## 3. Đưa lên GitHub

Tạo repo trống tên `shop-admin` trên GitHub (không tick README), rồi:

```bash
git init
git add .
git commit -m "feat: initial shop admin dashboard"
git branch -M main
git remote add origin https://github.com/<username>/shop-admin.git
git push -u origin main
```

Nhớ commit cả `package-lock.json` (sinh ra sau `npm install`), vì GitHub Actions dùng `npm ci` cần file này.

## 4. Deploy để có link demo

```bash
npm install -g firebase-tools
firebase login
firebase use --add
npm run build
firebase deploy --only hosting
```

Sau đó vào Firebase **Authentication → Settings → Authorized domains** kiểm tra domain `*.web.app` đã có.

## 5. Làm cho repo "ăn điểm" với khách

- Chụp 3 ảnh (Dashboard, Products, Orders) lưu vào `docs/screenshots/` và chèn vào README.
- Điền link demo + một tài khoản demo vào đầu README.
- Commit nhỏ, message rõ ràng (`feat:`, `fix:`, `refactor:`) — khách hay xem lịch sử commit.
- Làm dần mục **Roadmap** trong README, mỗi tính năng một branch + pull request.
