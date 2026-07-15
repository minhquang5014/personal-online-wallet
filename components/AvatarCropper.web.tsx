import { useEffect, useRef, useState } from 'react';
import { colors } from '../constants/theme';

export interface AvatarCropperProps {
  uri: string;
  onCancel: () => void;
  onDone: (base64: string) => void;
}

const VIEWPORT = 288; // cạnh khung cắt (px)
const OUTPUT = 512; // cạnh ảnh xuất ra (px)

/**
 * Cắt ảnh đại diện trên WEB: kéo để dịch, thanh trượt để phóng to, mặt nạ tròn
 * để xem trước. Bấm Xong -> vẽ vùng trong khung ra <canvas> vuông rồi trả base64.
 *
 * File .web.tsx nên chạy trên React DOM (react-native-web) -> dùng thẳng thẻ DOM
 * và canvas để tính toán cắt chính xác theo pixel.
 */
export default function AvatarCropper({ uri, onCancel, onDone }: AvatarCropperProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // toạ độ góc trên-trái ảnh so với khung
  const drag = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);

  const baseScale = img ? Math.max(VIEWPORT / img.naturalWidth, VIEWPORT / img.naturalHeight) : 1;
  const scale = baseScale * zoom;
  const dw = img ? img.naturalWidth * scale : 0;
  const dh = img ? img.naturalHeight * scale : 0;

  // Giữ ảnh luôn phủ kín khung (không để lộ mép trống).
  function clampAt(w: number, h: number, p: { x: number; y: number }) {
    return {
      x: Math.min(0, Math.max(VIEWPORT - w, p.x)),
      y: Math.min(0, Math.max(VIEWPORT - h, p.y)),
    };
  }

  useEffect(() => {
    const el = new window.Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => setImg(el);
    el.src = uri;
  }, [uri]);

  // Căn giữa khi ảnh vừa tải.
  useEffect(() => {
    if (!img) return;
    const s = Math.max(VIEWPORT / img.naturalWidth, VIEWPORT / img.naturalHeight);
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    setZoom(1);
    setPos({ x: (VIEWPORT - w) / 2, y: (VIEWPORT - h) / 2 });
  }, [img]);

  function applyZoom(next: number) {
    if (!img) return;
    const prevS = baseScale * zoom;
    const nextS = baseScale * next;
    // Giữ nguyên điểm ảnh đang ở giữa khung khi phóng to/thu nhỏ.
    const cx = (VIEWPORT / 2 - pos.x) / prevS;
    const cy = (VIEWPORT / 2 - pos.y) / prevS;
    const nx = VIEWPORT / 2 - cx * nextS;
    const ny = VIEWPORT / 2 - cy * nextS;
    setZoom(next);
    setPos(clampAt(img.naturalWidth * nextS, img.naturalHeight * nextS, { x: nx, y: ny }));
  }

  function onPointerDown(e: React.PointerEvent) {
    drag.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const nx = drag.current.px + (e.clientX - drag.current.sx);
    const ny = drag.current.py + (e.clientY - drag.current.sy);
    setPos(clampAt(dw, dh, { x: nx, y: ny }));
  }
  function onPointerUp() {
    drag.current = null;
  }

  function handleDone() {
    if (!img) return;
    const s = scale;
    const src = VIEWPORT / s; // cạnh vùng nguồn (px ảnh gốc) rơi vào khung
    const sx = -pos.x / s;
    const sy = -pos.y / s;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, src, src, 0, 0, OUTPUT, OUTPUT);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onDone(dataUrl.split(',')[1]);
  }

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <div style={S.title}>Chỉnh ảnh đại diện</div>

        <div
          style={S.viewport}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {img && (
            <img
              src={uri}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: dw,
                height: dh,
                maxWidth: 'none',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          )}
          {/* Mặt nạ tròn: làm tối phần ngoài vòng tròn để xem trước khung avatar. */}
          <div style={S.mask} />
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => applyZoom(Number(e.target.value))}
          style={S.slider}
          aria-label="Phóng to"
        />

        <div style={S.actions}>
          <button style={{ ...S.btn, ...S.btnGhost }} onClick={onCancel}>
            Huỷ
          </button>
          <button style={{ ...S.btn, ...S.btnPrimary }} onClick={handleDone} disabled={!img}>
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16,
  },
  card: {
    background: colors.card,
    borderRadius: 20,
    padding: 20,
    width: VIEWPORT + 40,
    maxWidth: '100%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  title: { fontSize: 16, fontWeight: 700, color: colors.text },
  viewport: {
    position: 'relative',
    width: VIEWPORT,
    height: VIEWPORT,
    overflow: 'hidden',
    borderRadius: 12,
    background: '#000',
    cursor: 'grab',
    touchAction: 'none',
  },
  mask: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
    pointerEvents: 'none',
  },
  slider: { width: '100%', accentColor: colors.primary },
  actions: { display: 'flex', gap: 12, width: '100%' },
  btn: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 12,
    border: 'none',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnGhost: { background: colors.background, color: colors.text },
  btnPrimary: { background: colors.primary, color: '#fff' },
};
