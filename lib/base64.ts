const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * base64 -> bytes.
 * Tự viết vì `atob` / `Buffer` không có sẵn trên mọi runtime của React Native.
 */
export function base64ToBytes(b64: string): Uint8Array {
  // Bỏ khoảng trắng, xuống dòng và ký tự đệm '='.
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));

  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = B64.indexOf(clean[i]);
    const c1 = B64.indexOf(clean[i + 1]);
    const c2 = B64.indexOf(clean[i + 2]);
    const c3 = B64.indexOf(clean[i + 3]);

    // Ký tự thiếu ở cuối cho ra -1; dịch bit vẫn an toàn vì byte tương ứng
    // sẽ không được ghi (điều kiện i + 2 / i + 3 bên dưới).
    const n = (c0 << 18) | (c1 << 12) | ((c2 & 63) << 6) | (c3 & 63);

    bytes[p++] = (n >> 16) & 0xff;
    if (i + 2 < clean.length) bytes[p++] = (n >> 8) & 0xff;
    if (i + 3 < clean.length) bytes[p++] = n & 0xff;
  }

  return bytes.subarray(0, p);
}
