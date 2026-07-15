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

// URL Supabase để preconnect (bắt tay DNS/TLS sớm cho lần gọi API đầu tiên).
// Node không tự nạp .env như expo -> đọc tay nếu có.
function readEnv(key) {
  if (process.env[key]) return process.env[key];
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return '';
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split('\n')
    .find((l) => l.trim().startsWith(key + '='));
  return line ? line.slice(line.indexOf('=') + 1).trim() : '';
}
const supabaseUrl = readEnv('EXPO_PUBLIC_SUPABASE_URL').replace(/\/+$/, '');

const tags = [
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '<meta name="apple-mobile-web-app-title" content="Chi tiêu" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="theme-color" content="#F4F6FA" />',
  supabaseUrl ? `<link rel="preconnect" href="${supabaseUrl}" crossorigin />` : '',
  // Logo hiện NGAY (trước khi tải xong ~650KB JS) để hết cảnh trắng trang.
  // React mount vào #root sẽ tự thay thế nội dung này.
  `<style>
    html,body{background:#F4F6FA}
    #app-loading{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#F4F6FA}
    #app-loading img{width:96px;height:96px;border-radius:22px;animation:app-pulse 1.2s ease-in-out infinite}
    @keyframes app-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.94)}}
  </style>`,
]
  .filter(Boolean)
  .join('\n  ');

html = html.replace('</head>', `  ${tags}\n</head>`);

// Chèn logo chờ vào #root.
html = html.replace(
  '<div id="root"></div>',
  '<div id="root"><div id="app-loading"><img src="/apple-touch-icon.png" alt="Đang tải" /></div></div>'
);

fs.writeFileSync(file, html);
console.log('Đã chèn apple-touch-icon + meta + logo chờ + preconnect vào dist/index.html.');
