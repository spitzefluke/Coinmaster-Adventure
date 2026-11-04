// ScreenGuis wie in Roblox auf ein Canvas über der 3D-Ansicht zeichnen und bedienbar machen.
// Layout nach Roblox-Regeln: UDim2 (Anteil + Pixel), AnchorPoint, ZIndex, Visible, ClipsDescendants,
// UIListLayout, UIGridLayout, UIPadding, UIScale, UIAspectRatioConstraint, UISizeConstraint,
// ScrollingFrame (CanvasSize, AutomaticCanvasSize, CanvasPosition). Dazu UICorner, UIStroke, UIGradient.
// Klicks und Maus-drüber gehen als Activated, MouseButton1Click, MouseEnter, MouseLeave an Lua.
//
//   const screen = createScreen(canvas, playerGuiInst, lua);
//   screen.render();                       // jedes Bild (zeichnet nur bei Änderungen)
//   screen.pointer(type, x, y) → true, wenn die UI getroffen wurde

import { sampleNumber, sampleColor } from './gui.js';

// Roblox-Leiste oben (Menü, Chat): Inhalte ohne IgnoreGuiInset beginnen darunter
export const TOPBAR = 58;

const FONTS = {
  FredokaOne: '400 {s}px "Fredoka One","Fredoka",system-ui,sans-serif',
  GothamBlack: '900 {s}px "Montserrat","Gotham",system-ui,sans-serif',
  GothamBold: '700 {s}px "Montserrat","Gotham",system-ui,sans-serif',
  GothamMedium: '600 {s}px "Montserrat","Gotham",system-ui,sans-serif',
  Gotham: '500 {s}px "Montserrat","Gotham",system-ui,sans-serif',
  LuckiestGuy: '400 {s}px "Luckiest Guy",system-ui,sans-serif',
  Code: '600 {s}px "JetBrains Mono",ui-monospace,monospace',
  SourceSansBold: '700 {s}px "Source Sans 3","Source Sans Pro",Arial,sans-serif',
  SourceSans: '400 {s}px "Source Sans 3","Source Sans Pro",Arial,sans-serif',
  Legacy: '400 {s}px Arial,sans-serif',
};
const font = (name, size) => (FONTS[name] || FONTS.SourceSans).replace('{s}', Math.max(1, Math.round(size)));
const rgba = (c, a = 1, k = 1) => `rgba(${Math.round(c.srgb[0] * 255 * k)},${Math.round(c.srgb[1] * 255 * k)},${Math.round(c.srgb[2] * 255 * k)},${Math.max(0, Math.min(1, a))})`;
const isGui = (i) => i.props && i.props.Size && Array.isArray(i.props.Size) && ['Frame', 'TextLabel', 'TextButton', 'TextBox', 'ImageLabel', 'ImageButton', 'ScrollingFrame', 'CanvasGroup'].includes(i.ClassName);
const isButton = (i) => i.ClassName === 'TextButton' || i.ClassName === 'ImageButton';
const isText = (i) => i.ClassName === 'TextLabel' || i.ClassName === 'TextButton' || i.ClassName === 'TextBox';
// Knöpfe und Eingabefelder nehmen Klicks an
const isClickable = (i) => isButton(i) || i.ClassName === 'TextBox';
const kid = (i, cls) => i.children.find((c) => c.ClassName === cls && c.props.Enabled !== false);

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

// Zeilen umbrechen
function wrapLines(g, text, width) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (g.measureText(test).width > width && line) {
        out.push(line);
        line = word;
      } else line = test;
    }
    out.push(line);
  }
  return out;
}

export function createScreen(canvas, playerGui, lua, { dpr = Math.min(2, devicePixelRatio || 1), topbar = true } = {}) {
  const g = canvas.getContext('2d');
  const state = { hits: [], hover: null, press: null, dirty: true, w: 0, h: 0, frame: 0 };
  playerGui.gui = { dirty: true }; // Änderungen in der UI markieren das Canvas zum Neuzeichnen

  // ── Layout ──
  // rect: { x, y, w, h }, k: gesammelter UIScale-Faktor (skaliert Pixelwerte)
  function sizeOf(i, pw, ph, k) {
    const s = i.props.Size;
    let w = s[0] * pw + s[1] * k, h = s[2] * ph + s[3] * k;
    const sc = kid(i, 'UISizeConstraint');
    if (sc) {
      w = Math.min(Math.max(w, sc.props.MinSize[0] * k), sc.props.MaxSize[0] * k);
      h = Math.min(Math.max(h, sc.props.MinSize[1] * k), sc.props.MaxSize[1] * k);
    }
    const ar = kid(i, 'UIAspectRatioConstraint');
    if (ar) {
      const r = ar.props.AspectRatio || 1;
      if (ar.props.AspectType === 'ScaleWithParentSize') {
        if (ar.props.DominantAxis === 'Height') w = h * r;
        else h = w / r;
      } else if (w / Math.max(1e-6, h) > r) w = h * r;
      else h = w / r;
    }
    const us = kid(i, 'UIScale');
    const scale = us ? us.props.Scale : 1;
    return { w: w * scale, h: h * scale, scale };
  }
  function contentRect(i, r, k) {
    const p = kid(i, 'UIPadding');
    if (!p) return { ...r };
    const P = p.props;
    const l = P.PaddingLeft[0] * r.w + P.PaddingLeft[1] * k, rr = P.PaddingRight[0] * r.w + P.PaddingRight[1] * k;
    const t = P.PaddingTop[0] * r.h + P.PaddingTop[1] * k, b = P.PaddingBottom[0] * r.h + P.PaddingBottom[1] * k;
    return { x: r.x + l, y: r.y + t, w: Math.max(0, r.w - l - rr), h: Math.max(0, r.h - t - b) };
  }
  const sorted = (list, by) =>
    list.slice().sort((a, b) => (by === 'LayoutOrder' ? a.props.LayoutOrder - b.props.LayoutOrder || 0 : String(a.props.Name).localeCompare(String(b.props.Name))));

  // Lage aller Kinder eines Containers; gibt die belegte Höhe/Breite zurück (für AutomaticCanvasSize)
  function layoutChildren(parent, area, k) {
    const kids = parent.children.filter((c) => isGui(c) && c.props.Visible !== false);
    const list = kid(parent, 'UIListLayout'), grid = kid(parent, 'UIGridLayout');
    let extentX = 0, extentY = 0;
    const place = (c, x, y, sz) => {
      c.abs = { x, y, w: sz.w, h: sz.h, k: k * sz.scale };
      extentX = Math.max(extentX, x + sz.w - area.x);
      extentY = Math.max(extentY, y + sz.h - area.y);
      layoutNode(c);
    };
    if (list) {
      const L = list.props, vertical = L.FillDirection !== 'Horizontal';
      const pad = vertical ? L.Padding[0] * area.h + L.Padding[1] * k : L.Padding[0] * area.w + L.Padding[1] * k;
      const items = sorted(kids, L.SortOrder).map((c) => [c, sizeOf(c, area.w, area.h, k)]);
      const total = items.reduce((n, [, s]) => n + (vertical ? s.h : s.w), 0) + pad * Math.max(0, items.length - 1);
      const main = vertical ? L.VerticalAlignment : L.HorizontalAlignment;
      let pos = (vertical ? area.y : area.x) + (main === 'Center' ? ((vertical ? area.h : area.w) - total) / 2 : main === 'Bottom' || main === 'Right' ? (vertical ? area.h : area.w) - total : 0);
      for (const [c, s] of items) {
        if (vertical) {
          const x = L.HorizontalAlignment === 'Center' ? area.x + (area.w - s.w) / 2 : L.HorizontalAlignment === 'Right' ? area.x + area.w - s.w : area.x;
          place(c, x, pos, s);
          pos += s.h + pad;
        } else {
          const y = L.VerticalAlignment === 'Center' ? area.y + (area.h - s.h) / 2 : L.VerticalAlignment === 'Bottom' ? area.y + area.h - s.h : area.y;
          place(c, pos, y, s);
          pos += s.w + pad;
        }
      }
    } else if (grid) {
      const G = grid.props;
      const cw = G.CellSize[0] * area.w + G.CellSize[1] * k, ch = G.CellSize[2] * area.h + G.CellSize[3] * k;
      const px = G.CellPadding[0] * area.w + G.CellPadding[1] * k, py = G.CellPadding[2] * area.h + G.CellPadding[3] * k;
      const cols = Math.max(1, Math.floor((area.w + px) / (cw + px)));
      const items = sorted(kids, G.SortOrder);
      const rowW = Math.min(items.length, cols) * cw + (Math.min(items.length, cols) - 1) * px;
      const x0 = area.x + (G.HorizontalAlignment === 'Center' ? (area.w - rowW) / 2 : G.HorizontalAlignment === 'Right' ? area.w - rowW : 0);
      items.forEach((c, n) => place(c, x0 + (n % cols) * (cw + px), area.y + Math.floor(n / cols) * (ch + py), { w: cw, h: ch, scale: 1 }));
    } else {
      for (const c of kids) {
        const s = sizeOf(c, area.w, area.h, k);
        const P = c.props;
        // AnchorPoint bleibt beim Skalieren (UIScale) an derselben Stelle
        const ax = area.x + P.Position[0] * area.w + P.Position[1] * k, ay = area.y + P.Position[2] * area.h + P.Position[3] * k;
        place(c, ax - P.AnchorPoint[0] * s.w, ay - P.AnchorPoint[1] * s.h, s);
      }
    }
    return { extentX, extentY };
  }
  function layoutNode(i) {
    const r = i.abs;
    let area = contentRect(i, r, r.k);
    if (i.ClassName === 'ScrollingFrame') {
      const P = i.props;
      let cw = P.CanvasSize[0] * r.w + P.CanvasSize[1] * r.k, ch = P.CanvasSize[2] * r.h + P.CanvasSize[3] * r.k;
      const auto = P.AutomaticCanvasSize;
      // erst mit Rahmengröße auslegen, um die Inhaltshöhe zu messen
      const probe = layoutChildren(i, { x: area.x, y: area.y, w: auto === 'X' || auto === 'XY' ? area.w : cw - (r.w - area.w), h: auto === 'Y' || auto === 'XY' ? area.h : ch - (r.h - area.h) }, r.k);
      const pad = kid(i, 'UIPadding');
      const padB = pad ? pad.props.PaddingBottom[1] * r.k : 0;
      if (auto === 'Y' || auto === 'XY') ch = Math.max(r.h, probe.extentY + (area.y - r.y) + padB);
      if (auto === 'X' || auto === 'XY') cw = Math.max(r.w, probe.extentX + (area.x - r.x));
      i.canvas = { w: Math.max(cw, r.w), h: Math.max(ch, r.h) };
      const maxY = Math.max(0, i.canvas.h - r.h), maxX = Math.max(0, i.canvas.w - r.w);
      P.CanvasPosition = [Math.min(Math.max(0, P.CanvasPosition[0]), maxX), Math.min(Math.max(0, P.CanvasPosition[1]), maxY)];
      const inner = contentRect({ children: i.children, props: i.props }, { x: r.x - P.CanvasPosition[0], y: r.y - P.CanvasPosition[1], w: i.canvas.w, h: i.canvas.h }, r.k);
      layoutChildren(i, inner, r.k);
      return;
    }
    layoutChildren(i, area, r.k);
  }

  // ── Zeichnen ──
  function draw(i, clip, alphaMul) {
    const P = i.props, r = i.abs, k = r.k;
    if (P.Visible === false || r.w <= 0 || r.h <= 0) return;
    g.save();
    if (P.Rotation) {
      g.translate(r.x + r.w / 2, r.y + r.h / 2);
      g.rotate((P.Rotation * Math.PI) / 180);
      g.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
    }
    const corner = kid(i, 'UICorner');
    const radius = corner ? corner.props.CornerRadius[0] * Math.min(r.w, r.h) + corner.props.CornerRadius[1] * k : 0;
    const grad = kid(i, 'UIGradient');
    const pressed = state.press === i, hover = state.hover === i;
    const shade = isButton(i) && P.AutoButtonColor !== false ? (pressed ? 0.75 : hover ? 0.9 : 1) : 1;
    const bgA = (1 - (P.BackgroundTransparency ?? 0)) * alphaMul;
    const fillStyle = (base, a) => {
      if (!grad) return rgba(base, a, shade);
      const rot = ((grad.props.Rotation || 0) * Math.PI) / 180;
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2, dx = (Math.cos(rot) * r.w) / 2, dy = (Math.sin(rot) * r.h) / 2;
      const off = grad.props.Offset || [0, 0];
      const lg = g.createLinearGradient(cx - dx + off[0] * r.w, cy - dy + off[1] * r.h, cx + dx + off[0] * r.w, cy + dy + off[1] * r.h);
      const keys = new Set([0, 1, ...grad.props.Color.map((q) => q[0]), ...grad.props.Transparency.map((q) => q[0])]);
      for (const t of [...keys].sort((a, b) => a - b)) {
        const c = sampleColor(grad.props.Color, t), ta = 1 - sampleNumber(grad.props.Transparency, t);
        lg.addColorStop(t, `rgba(${Math.round(base.srgb[0] * c.r * 255 * shade)},${Math.round(base.srgb[1] * c.g * 255 * shade)},${Math.round(base.srgb[2] * c.b * 255 * shade)},${a * ta})`);
      }
      return lg;
    };
    if (bgA > 0.002) {
      g.fillStyle = fillStyle(P.BackgroundColor3, bgA);
      roundRect(g, r.x, r.y, r.w, r.h, radius);
      g.fill();
    }
    const stroke = kid(i, 'UIStroke');
    // Roblox: ApplyStrokeMode Contextual umrandet bei Text-Objekten den Text, sonst den Rahmen
    const strokeText = stroke && stroke.props.ApplyStrokeMode !== 'Border' && isText(i);
    // TextBox: ohne Text der Platzhalter, beim Tippen ein blinkender Strich
    const focused = state.focus && state.focus.box === i;
    const placeholder = i.ClassName === 'TextBox' && !P.Text && !focused;
    const shown = placeholder ? P.PlaceholderText : P.Text;
    if (isText(i) && (shown || focused)) {
      const ta = (1 - (P.TextTransparency ?? 0)) * alphaMul;
      let size = (P.TextSize ?? 14) * k;
      g.font = font(P.Font, size);
      const avail = r.w - 2;
      let lines = P.TextWrapped || P.TextScaled ? wrapLines(g, shown || '', avail) : String(shown || '').split('\n');
      if (P.TextScaled) {
        size = Math.min(100 * k, r.h * 0.86);
        for (let n = 0; n < 30; n++) {
          g.font = font(P.Font, size);
          lines = P.TextWrapped ? wrapLines(g, shown || '', avail) : String(shown || '').split('\n');
          const wide = Math.max(...lines.map((l) => g.measureText(l).width));
          if (wide <= avail && lines.length * size * 1.08 <= r.h) break;
          size *= 0.9;
        }
      }
      g.font = font(P.Font, size);
      const lh = size * 1.12, total = lines.length * lh;
      const xa = P.TextXAlignment || 'Center', ya = P.TextYAlignment || 'Center';
      g.textAlign = xa === 'Left' ? 'left' : xa === 'Right' ? 'right' : 'center';
      g.textBaseline = 'middle';
      const tx = xa === 'Left' ? r.x : xa === 'Right' ? r.x + r.w : r.x + r.w / 2;
      const top = ya === 'Top' ? r.y : ya === 'Bottom' ? r.y + r.h - total : r.y + (r.h - total) / 2;
      lines.forEach((line, n) => {
        const ty = top + lh * (n + 0.5);
        if (strokeText) {
          g.strokeStyle = rgba(stroke.props.Color, (1 - stroke.props.Transparency) * ta);
          g.lineWidth = stroke.props.Thickness * 2 * k;
          g.lineJoin = 'round';
          g.strokeText(line, tx, ty);
        } else if ((P.TextStrokeTransparency ?? 1) < 1) {
          g.strokeStyle = rgba(P.TextStrokeColor3, (1 - P.TextStrokeTransparency) * ta);
          g.lineWidth = Math.max(1, size / 8);
          g.lineJoin = 'round';
          g.strokeText(line, tx, ty);
        }
        g.fillStyle = placeholder ? rgba(P.PlaceholderColor3, ta) : grad && bgA <= 0.002 ? fillStyle(P.TextColor3, ta) : rgba(P.TextColor3, ta);
        g.fillText(line, tx, ty);
        if (focused && n === lines.length - 1 && Math.floor(performance.now() / 530) % 2 === 0) {
          const wLine = g.measureText(line).width;
          const cx = xa === 'Left' ? tx + wLine + 2 : xa === 'Right' ? tx + 2 : tx + wLine / 2 + 2;
          g.fillStyle = rgba(P.TextColor3, ta);
          g.fillRect(cx, ty - size * 0.5, Math.max(1.5, k * 1.5), size);
        }
      });
    }
    if (stroke && !strokeText) {
      g.strokeStyle = rgba(stroke.props.Color, (1 - stroke.props.Transparency) * alphaMul);
      g.lineWidth = stroke.props.Thickness * k;
      roundRect(g, r.x, r.y, r.w, r.h, radius);
      g.stroke();
    }
    // für Klicks merken (in Zeichenreihenfolge)
    state.hits.push({ i, r, clip });
    let childClip = clip;
    if (P.ClipsDescendants) {
      g.save();
      roundRect(g, r.x, r.y, r.w, r.h, radius);
      g.clip();
      childClip = clip ? intersect(clip, r) : { ...r };
    }
    const kids = i.children.filter(isGui).sort((a, b) => (a.props.ZIndex ?? 1) - (b.props.ZIndex ?? 1));
    for (const c of kids) if (c.abs) draw(c, childClip, alphaMul);
    // Scrollbalken
    if (i.ClassName === 'ScrollingFrame' && i.canvas && i.canvas.h > r.h + 1 && P.ScrollBarThickness > 0) {
      const t = P.ScrollBarThickness * k * 0.5, frac = r.h / i.canvas.h;
      const bh = Math.max(20, r.h * frac), by = r.y + (P.CanvasPosition[1] / (i.canvas.h - r.h)) * (r.h - bh);
      g.fillStyle = rgba(P.ScrollBarImageColor3, (1 - P.ScrollBarImageTransparency) * 0.6 * alphaMul);
      roundRect(g, r.x + r.w - t - 2, by, t, bh, t / 2);
      g.fill();
    }
    if (P.ClipsDescendants) g.restore();
    g.restore();
  }
  const intersect = (a, b) => {
    const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y);
    return { x, y, w: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x), h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y) };
  };

  // Roblox-Leiste oben links: Menü und Chat
  function drawTopbar() {
    const btn = (x, drawIcon) => {
      g.fillStyle = 'rgba(18,18,21,0.6)';
      roundRect(g, x, 12, 44, 44, 22);
      g.fill();
      drawIcon(x + 22, 34);
    };
    btn(12, (cx, cy) => {
      g.fillStyle = '#fff';
      g.save();
      g.translate(cx, cy);
      g.rotate(0.26);
      g.fillRect(-9, -9, 18, 18);
      g.fillStyle = 'rgba(18,18,21,1)';
      g.fillRect(-3, -3, 6, 6);
      g.restore();
    });
    btn(64, (cx, cy) => {
      g.strokeStyle = '#fff';
      g.lineWidth = 2.5;
      roundRect(g, cx - 10, cy - 8, 20, 14, 4);
      g.stroke();
      g.beginPath();
      g.moveTo(cx - 4, cy + 6);
      g.lineTo(cx - 7, cy + 11);
      g.lineTo(cx + 1, cy + 6);
      g.stroke();
    });
  }

  function render(force = false) {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H) return;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      force = true;
    }
    if (state.focus) force = true; // blinkender Strich im TextBox
    if (!force && !playerGui.gui.dirty) return;
    playerGui.gui.dirty = false;
    state.w = W;
    state.h = H;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    state.hits = [];
    if (topbar) drawTopbar();
    const guis = playerGui.children
      .filter((c) => c.ClassName === 'ScreenGui' && c.props.Enabled !== false)
      .sort((a, b) => (a.props.DisplayOrder ?? 0) - (b.props.DisplayOrder ?? 0));
    for (const sg of guis) {
      const inset = sg.props.IgnoreGuiInset ? 0 : TOPBAR;
      const area = { x: 0, y: inset, w: W, h: H - inset };
      sg.abs = { ...area, k: 1 };
      layoutChildren(sg, area, 1);
      const kids = sg.children.filter(isGui).sort((a, b) => (a.props.ZIndex ?? 1) - (b.props.ZIndex ?? 1));
      for (const c of kids) if (c.abs) draw(c, null, 1);
    }
  }

  // ── Eingaben ──
  const inside = (h, x, y) => x >= h.r.x && x <= h.r.x + h.r.w && y >= h.r.y && y <= h.r.y + h.r.h && (!h.clip || (x >= h.clip.x && x <= h.clip.x + h.clip.w && y >= h.clip.y && y <= h.clip.y + h.clip.h));
  const fire = (i, name) => {
    const id = lua.idOf(i);
    if (id) lua.call('__fireGui', id, name);
  };
  function topAt(x, y, pred) {
    for (let n = state.hits.length - 1; n >= 0; n--) {
      const h = state.hits[n];
      if (inside(h, x, y) && pred(h.i)) return h.i;
    }
    return null;
  }
  const solid = (i) => isClickable(i) || (i.props.BackgroundTransparency ?? 0) < 0.95 || i.ClassName === 'ScrollingFrame';
  // type: move, down, up, leave, wheel; gibt true zurück, wenn die UI den Zeiger hat
  function pointer(type, x, y, delta = 0) {
    if (type === 'leave') {
      if (state.hover) fire(state.hover, 'MouseLeave');
      state.hover = state.press = null;
      playerGui.gui.dirty = true;
      return false;
    }
    const btn = topAt(x, y, isClickable);
    const over = topAt(x, y, solid);
    // nur der oberste Knopf zählt, wenn kein undurchsichtiges Element darüber liegt
    const target = btn && (!over || over === btn || isDescendant(over, btn)) ? btn : null;
    if (type === 'move' && target !== state.hover) {
      if (state.hover) fire(state.hover, 'MouseLeave');
      state.hover = target;
      if (target) fire(target, 'MouseEnter');
      playerGui.gui.dirty = true;
    }
    if (type === 'down' && target) {
      state.press = target;
      if (isButton(target)) fire(target, 'MouseButton1Down');
      playerGui.gui.dirty = true;
    }
    if (type === 'up') {
      const was = state.press;
      state.press = null;
      if (was) playerGui.gui.dirty = true;
      if (was && was === target) {
        if (target.ClassName === 'TextBox') focusBox(target);
        else {
          fire(target, 'MouseButton1Click');
          fire(target, 'Activated');
        }
      }
    }
    if (type === 'wheel') {
      const sf = topAt(x, y, (i) => i.ClassName === 'ScrollingFrame' && i.canvas && i.canvas.h > i.abs.h);
      if (sf) {
        const P = sf.props;
        P.CanvasPosition = [P.CanvasPosition[0], Math.min(Math.max(0, P.CanvasPosition[1] + delta), sf.canvas.h - sf.abs.h)];
        const id = lua.idOf(sf);
        if (id) lua.call('__syncProp', id, 'CanvasPosition', P.CanvasPosition[0], P.CanvasPosition[1]);
        playerGui.gui.dirty = true;
        return true;
      }
    }
    canvas.style.cursor = target ? 'pointer' : '';
    return !!(target || over);
  }
  // TextBox: ein unsichtbares HTML-Eingabefeld über dem Feld nimmt die Tastatur an (auch am Handy)
  function focusBox(box) {
    if (state.focus?.box === box) return state.focus.input.focus();
    state.focus?.input.blur();
    const id = lua.idOf(box);
    const input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('aria-label', box.props.PlaceholderText || 'Eingabe');
    const r = box.abs, c = canvas.getBoundingClientRect(), host = canvas.parentElement.getBoundingClientRect();
    Object.assign(input.style, { position: 'absolute', left: `${c.left - host.left + r.x}px`, top: `${c.top - host.top + r.y}px`, width: `${r.w}px`, height: `${r.h}px`, opacity: '0', fontSize: '16px', border: '0', padding: '0', zIndex: '5' });
    if (box.props.ClearTextOnFocus) box.props.Text = '';
    input.value = box.props.Text || '';
    if (id) lua.call('__setText', id, input.value);
    const f = { box, input, enter: false };
    state.focus = f;
    input.addEventListener('input', () => {
      box.props.Text = input.value;
      if (id) lua.call('__setText', id, input.value);
      playerGui.gui.dirty = true;
    });
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        f.enter = true;
        input.blur();
      } else if (e.key === 'Escape') input.blur();
    });
    input.addEventListener('blur', () => {
      if (state.focus === f) state.focus = null;
      input.remove();
      playerGui.gui.dirty = true;
      if (id) lua.call('__fireGui', id, 'FocusLost', f.enter);
    });
    canvas.parentElement.append(input);
    input.focus();
    if (id) lua.call('__fireGui', id, 'Focused');
    playerGui.gui.dirty = true;
  }
  const isDescendant = (a, b) => {
    for (let p = a; p; p = p.parent) if (p === b) return true;
    return false;
  };

  return { render, pointer, state };
}
