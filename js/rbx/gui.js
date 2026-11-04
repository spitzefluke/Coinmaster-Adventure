// Zeichnet Roblox-GUI-Objekte (Frame, TextLabel, ImageLabel mit UICorner, UIStroke, UIGradient)
// auf ein Canvas. Genutzt für BillboardGui und SurfaceGui in der Roblox-Vorschau.

const FONTS = {
  GothamBold: '700 {s}px "Montserrat","Gotham","Barlow",system-ui,sans-serif',
  GothamBlack: '900 {s}px "Montserrat","Gotham","Barlow",system-ui,sans-serif',
  Gotham: '500 {s}px "Montserrat","Gotham","Barlow",system-ui,sans-serif',
  Code: '600 {s}px "JetBrains Mono",ui-monospace,monospace',
  Legacy: '400 {s}px Arial,sans-serif',
  SourceSans: '400 {s}px "Source Sans Pro",Arial,sans-serif',
  SourceSansBold: '700 {s}px "Source Sans Pro",Arial,sans-serif',
  FredokaOne: '400 {s}px "Fredoka One","Fredoka",system-ui,sans-serif',
  LuckiestGuy: '400 {s}px "Luckiest Guy",system-ui,sans-serif',
};
const font = (name, size) => (FONTS[name] || FONTS.SourceSans).replace('{s}', Math.max(1, Math.round(size)));
const css = (c, a = 1) => `rgba(${Math.round(c.r8)},${Math.round(c.g8)},${Math.round(c.b8)},${a})`;

// UDim2 [xs, xo, ys, yo] in Pixeln eines Elternrechtecks
const abs = (u, w, h) => [u[0] * w + u[1], u[2] * h + u[3]];

function child(inst, cls) {
  return inst.children.find((c) => c.ClassName === cls && c.props.Enabled !== false);
}

function roundRect(g, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// Verlauf aus UIGradient (Farbe und Transparenz) als Canvas-Füllung
function gradientFill(g, grad, base, baseAlpha, x, y, w, h) {
  const rot = ((grad.props.Rotation || 0) * Math.PI) / 180;
  const cx = x + w / 2, cy = y + h / 2, dx = (Math.cos(rot) * w) / 2, dy = (Math.sin(rot) * h) / 2;
  const lg = g.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  const cs = grad.props.Color, ts = grad.props.Transparency;
  const keys = new Set([0, 1, ...cs.map((k) => k[0]), ...ts.map((k) => k[0])]);
  for (const t of [...keys].sort((a, b) => a - b)) {
    const c = sampleColor(cs, t), a = 1 - sampleNumber(ts, t);
    lg.addColorStop(t, css({ r8: base.r8 * c.r, g8: base.g8 * c.g, b8: base.b8 * c.b }, baseAlpha * a));
  }
  return lg;
}

export function sampleNumber(seq, t) {
  if (!seq || !seq.length) return 0;
  if (t <= seq[0][0]) return seq[0][1];
  for (let i = 1; i < seq.length; i++) {
    if (t <= seq[i][0]) {
      const [t0, v0] = seq[i - 1], [t1, v1] = seq[i];
      return v0 + ((v1 - v0) * (t - t0)) / Math.max(1e-6, t1 - t0);
    }
  }
  return seq[seq.length - 1][1];
}
// Farben hier als sRGB 0..1 (nur fürs Canvas)
export function sampleColor(seq, t) {
  const pick = (c) => ({ r: c.srgb[0], g: c.srgb[1], b: c.srgb[2] });
  if (!seq || !seq.length) return { r: 1, g: 1, b: 1 };
  if (t <= seq[0][0]) return pick(seq[0][1]);
  for (let i = 1; i < seq.length; i++) {
    if (t <= seq[i][0]) {
      const [t0, a] = seq[i - 1], [t1, b] = seq[i], k = (t - t0) / Math.max(1e-6, t1 - t0);
      const A = pick(a), B = pick(b);
      return { r: A.r + (B.r - A.r) * k, g: A.g + (B.g - A.g) * k, b: A.b + (B.b - A.b) * k };
    }
  }
  return pick(seq[seq.length - 1][1]);
}

const c8 = (c) => ({ r8: c.srgb[0] * 255, g8: c.srgb[1] * 255, b8: c.srgb[2] * 255 });

function drawObject(g, o, px, py, pw, ph, images) {
  const P = o.props;
  if (P.Visible === false) return;
  const [w, h] = abs(P.Size, pw, ph);
  const [x0, y0] = abs(P.Position, pw, ph);
  const x = px + x0 - P.AnchorPoint[0] * w, y = py + y0 - P.AnchorPoint[1] * h;
  g.save();
  if (P.Rotation) {
    g.translate(x + w / 2, y + h / 2);
    g.rotate((P.Rotation * Math.PI) / 180);
    g.translate(-(x + w / 2), -(y + h / 2));
  }
  const corner = child(o, 'UICorner');
  const radius = corner ? corner.props.CornerRadius[0] * Math.min(w, h) + corner.props.CornerRadius[1] : 0;
  const grad = child(o, 'UIGradient');
  const bgA = 1 - (P.BackgroundTransparency ?? 0);
  if (bgA > 0.001) {
    const base = c8(P.BackgroundColor3);
    g.fillStyle = grad ? gradientFill(g, grad, base, bgA, x, y, w, h) : css(base, bgA);
    roundRect(g, x, y, w, h, radius);
    g.fill();
  }
  if (o.ClassName === 'ImageLabel' || o.ClassName === 'ImageButton') {
    const img = images(P.Image);
    if (img) {
      g.globalAlpha = 1 - (P.ImageTransparency ?? 0);
      g.drawImage(img, x, y, w, h);
      g.globalAlpha = 1;
    }
  }
  if ((o.ClassName === 'TextLabel' || o.ClassName === 'TextButton') && P.Text) {
    const lines = String(P.Text).split('\n');
    let size = P.TextSize ?? 14;
    if (P.TextScaled) {
      size = h / lines.length * 0.82;
      g.font = font(P.Font, size);
      const widest = Math.max(...lines.map((l) => g.measureText(l).width));
      if (widest > w * 0.96) size *= (w * 0.96) / widest;
    }
    g.font = font(P.Font, size);
    g.textBaseline = 'middle';
    const align = P.TextXAlignment || 'Center';
    g.textAlign = align === 'Left' ? 'left' : align === 'Right' ? 'right' : 'center';
    const tx = align === 'Left' ? x : align === 'Right' ? x + w : x + w / 2;
    const ta = 1 - (P.TextTransparency ?? 0);
    lines.forEach((line, i) => {
      const ty = y + h / 2 + (i - (lines.length - 1) / 2) * size * 1.1;
      const ts = child(o, 'UIStroke');
      if (ts && ts.props.ApplyStrokeMode !== 'Border') {
        g.strokeStyle = css(c8(ts.props.Color), (1 - (ts.props.Transparency ?? 0)) * ta);
        g.lineWidth = (ts.props.Thickness ?? 1) * 2;
        g.lineJoin = 'round';
        g.strokeText(line, tx, ty);
      } else if ((P.TextStrokeTransparency ?? 1) < 1) {
        g.strokeStyle = css(c8(P.TextStrokeColor3), (1 - P.TextStrokeTransparency) * ta);
        g.lineWidth = Math.max(1, size / 9);
        g.lineJoin = 'round';
        g.strokeText(line, tx, ty);
      }
      g.fillStyle = grad && bgA <= 0.001 ? gradientFill(g, grad, c8(P.TextColor3), ta, x, y, w, h) : css(c8(P.TextColor3), ta);
      g.fillText(line, tx, ty);
    });
  }
  const stroke = child(o, 'UIStroke');
  // Roblox: Contextual umrandet bei Text-Objekten den Text (hier wie TextStroke gezeichnet), sonst den Rahmen
  const textObj = o.ClassName === 'TextLabel' || o.ClassName === 'TextButton';
  if (stroke && textObj && stroke.props.ApplyStrokeMode !== 'Border') {
    // schon beim Text berücksichtigt
  } else if (stroke) {
    g.strokeStyle = css(c8(stroke.props.Color), 1 - (stroke.props.Transparency ?? 0));
    g.lineWidth = stroke.props.Thickness ?? 1;
    roundRect(g, x, y, w, h, radius);
    g.stroke();
  }
  const kids = o.children.filter((c) => c.props.Size && c.props.Visible !== false).sort((a, b) => (a.props.ZIndex ?? 1) - (b.props.ZIndex ?? 1));
  for (const k of kids) drawObject(g, k, x, y, w, h, images);
  g.restore();
}

// Alle GUI-Kinder eines Containers (BillboardGui, SurfaceGui) auf ein Canvas zeichnen
export function drawGui(canvas, container, images = () => null) {
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, canvas.width, canvas.height);
  const kids = container.children.filter((c) => c.props.Size && c.props.Visible !== false).sort((a, b) => (a.props.ZIndex ?? 1) - (b.props.ZIndex ?? 1));
  for (const k of kids) drawObject(g, k, 0, 0, canvas.width, canvas.height, images);
}
