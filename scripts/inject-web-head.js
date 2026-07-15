/**
 * Chèn thẻ apple-touch-icon + meta "chạy toàn màn hình" vào dist/index.html
 * sau khi `expo export --platform web`.
 *
 * Lý do phải làm ở đây: bản web dùng `web.output: "single"` (SPA). Ở chế độ này
 * Expo dựng index.html từ template cố định và BỎ QUA `app/+html.tsx` (file đó chỉ
 * chạy cho `output: "static"`). Nên không có chỗ khai báo apple-touch-icon trong
 * app -> thiếu icon khi "Thêm vào MH chính" trên iPhone. Ta vá thẳng vào file đã build.
 *
 * Chạy: node scripts/inject-web-head.js   (sau bước export, trước khi deploy)
 * Idempotent: chạy nhiều lần không nhân đôi thẻ.
 */
const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(file)) {
  console.error('Không thấy dist/index.html — hãy chạy `expo export --platform web` trước.');
  process.exit(1);
}

let html = fs.readFileSync(file, 'utf8');

if (html.includes('apple-touch-icon')) {
  console.log('dist/index.html đã có apple-touch-icon — bỏ qua.');
  process.exit(0);
}

// Thêm viewport-fit=cover để dùng hết vùng tai thỏ khi chạy toàn màn hình.
html = html.replace(
  'content="width=device-width, initial-scale=1, shrink-to-fit=no"',
  'content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"'
);

const tags = [
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '<meta name="apple-mobile-web-app-title" content="Chi tiêu" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="theme-color" content="#ffffff" />',
].join('\n  ');

html = html.replace('</head>', `  ${tags}\n</head>`);

fs.writeFileSync(file, html);
console.log('Đã chèn apple-touch-icon + meta toàn màn hình vào dist/index.html.');
