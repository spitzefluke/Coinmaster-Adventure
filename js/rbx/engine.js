// Kleine Roblox-Engine für die Vorschau im Browser. Sie kennt die Roblox-Klassen, die das Spiel nutzt
// (Teile, Attachments, ParticleEmitter, Beam, Trail, Licht, Highlight, BillboardGui, SurfaceGui, Decal,
// Fire/Smoke/Sparkles, Lighting mit Atmosphere) und zeichnet sie mit three.js nach Roblox-Regeln:
// Größen in Studs, CFrames wie in Roblox, Teilchen mit Rate/Lifetime/Speed/Drag/LightEmission usw.
//
// Werte in der Engine:
//   Vector3 → THREE.Vector3   CFrame → THREE.Matrix4   Color3 → rgb(r, g, b) (siehe unten)
//   NumberSequence → [[t, v], …]   ColorSequence → [[t, Color3], …]   NumberRange → [min, max]
//   Vector2 → [x, y]   UDim2 → [xs, xo, ys, yo]   UDim → [s, o]   Enum → Name als Text
// Instanzen entstehen ohne Welt (wie Instance.new) und erscheinen, sobald sie unter workspace hängen.

import * as THREE from 'three';
import { partMaterial, neonColor, FORCEFIELD_TIME } from './materials.js';
import { particleTexture } from './textures.js';
import { drawGui, sampleNumber } from './gui.js';

// ── Werte ──
export function rgb(r, g, b) {
  const color = new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
  return { srgb: [r, g, b], color, __rbx: 'Color3' };
}
export const hexColor = (hex) => {
  const c = new THREE.Color(hex);
  const s = c.clone().convertLinearToSRGB();
  return rgb(s.r, s.g, s.b);
};
const WHITE = rgb(1, 1, 1);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const NS = (v) => [[0, v], [1, v]];
const CS = (c) => [[0, c], [1, c]];
export function sampleColorLinear(seq, t, out) {
  if (t <= seq[0][0]) return out.copy(seq[0][1].color);
  for (let i = 1; i < seq.length; i++) {
    if (t <= seq[i][0]) {
      const [t0, a] = seq[i - 1], [t1, b] = seq[i];
      return out.copy(a.color).lerp(b.color, (t - t0) / Math.max(1e-6, t1 - t0));
    }
  }
  return out.copy(seq[seq.length - 1][1].color);
}
const rand = (r) => r[0] + Math.random() * (r[1] - r[0]);

// Standardwerte wie in Roblox
const DEFAULTS = {
  BasePart: () => ({ Size: V3(4, 1, 2), CFrame: new THREE.Matrix4(), Color: rgb(163 / 255, 162 / 255, 165 / 255), Material: 'Plastic', Transparency: 0, Reflectance: 0, Anchored: false, CanCollide: true, CastShadow: true, Shape: 'Block', LocalTransparencyModifier: 0 }),
  Attachment: () => ({ Position: V3(), CFrame: new THREE.Matrix4(), Visible: false }),
  ParticleEmitter: () => ({ Enabled: true, Rate: 20, Lifetime: [5, 10], Speed: [5, 5], SpreadAngle: [0, 0], Size: NS(1), Transparency: NS(0), Color: CS(WHITE), LightEmission: 0, LightInfluence: 0, Texture: 'rbxasset://textures/particles/sparkles_main.dds', Acceleration: V3(), Drag: 0, EmissionDirection: 'Top', Shape: 'Box', ShapeStyle: 'Volume', ShapeInOut: 'Outward', Rotation: [0, 0], RotSpeed: [0, 0], LockedToPart: false, ZOffset: 0, Brightness: 1, TimeScale: 1, Squash: NS(0) }),
  Beam: () => ({ Enabled: true, Attachment0: null, Attachment1: null, Color: CS(WHITE), Transparency: NS(0.5), Width0: 1, Width1: 1, Segments: 10, CurveSize0: 0, CurveSize1: 0, FaceCamera: false, LightEmission: 0, LightInfluence: 1, Texture: '' }),
  Trail: () => ({ Enabled: true, Attachment0: null, Attachment1: null, Color: CS(WHITE), Transparency: NS(0.5), Lifetime: 2, MinLength: 0.1, FaceCamera: false, LightEmission: 0, LightInfluence: 1, WidthScale: NS(1) }),
  PointLight: () => ({ Enabled: true, Brightness: 1, Range: 8, Color: WHITE, Shadows: false }),
  Highlight: () => ({ Enabled: true, Adornee: null, FillColor: rgb(1, 0, 0), FillTransparency: 0.5, OutlineColor: WHITE, OutlineTransparency: 0, DepthMode: 'AlwaysOnTop' }),
  BillboardGui: () => ({ Enabled: true, Adornee: null, Size: [0, 0, 0, 0], StudsOffset: V3(), StudsOffsetWorldSpace: V3(), ExtentsOffset: V3(), AlwaysOnTop: false, MaxDistance: Infinity, LightInfluence: 0 }),
  SurfaceGui: () => ({ Enabled: true, Face: 'Front', LightInfluence: 1, CanvasSize: [800, 600], Adornee: null }),
  GuiObject: () => ({ Visible: true, Size: [0, 100, 0, 100], Position: [0, 0, 0, 0], AnchorPoint: [0, 0], Rotation: 0, BackgroundColor3: rgb(163 / 255, 162 / 255, 165 / 255), BackgroundTransparency: 0, BorderSizePixel: 1, ZIndex: 1 }),
  TextLabel: () => ({ BackgroundColor3: WHITE, Text: 'Label', TextColor3: rgb(27 / 255, 42 / 255, 53 / 255), TextSize: 14, TextScaled: false, Font: 'Legacy', TextStrokeTransparency: 1, TextStrokeColor3: rgb(0, 0, 0), TextTransparency: 0, TextXAlignment: 'Center', TextYAlignment: 'Center', TextWrapped: false }),
  ImageLabel: () => ({ Image: '', ImageTransparency: 0, ImageColor3: WHITE, ImageRectOffset: [0, 0], ImageRectSize: [0, 0], ScaleType: 'Stretch' }),
  UICorner: () => ({ CornerRadius: [0, 8] }),
  UIStroke: () => ({ Color: rgb(0, 0, 0), Thickness: 1, Transparency: 0, Enabled: true, ApplyStrokeMode: 'Contextual', LineJoinMode: 'Round' }),
  UIGradient: () => ({ Color: CS(WHITE), Transparency: NS(0), Rotation: 0, Offset: [0, 0], Enabled: true }),
  SpecialMesh: () => ({ MeshType: 'Head', Scale: V3(1, 1, 1), Offset: V3() }),
  Decal: () => ({ Texture: '', Face: 'Front', Color3: WHITE, Transparency: 0 }),
  Fire: () => ({ Enabled: true, Size: 5, Heat: 9, Color: rgb(236 / 255, 139 / 255, 70 / 255), SecondaryColor: rgb(139 / 255, 80 / 255, 55 / 255) }),
  Smoke: () => ({ Enabled: true, Color: WHITE, Opacity: 0.5, RiseVelocity: 1, Size: 1 }),
  Sparkles: () => ({ Enabled: true, SparkleColor: rgb(144 / 255, 25 / 255, 1) }),
  Lighting: () => ({ Ambient: rgb(70 / 255, 70 / 255, 70 / 255), OutdoorAmbient: rgb(128 / 255, 128 / 255, 128 / 255), Brightness: 2, ClockTime: 14, FogColor: rgb(192 / 255, 192 / 255, 192 / 255), FogEnd: 100000, FogStart: 0, ColorShift_Top: rgb(0, 0, 0), ColorShift_Bottom: rgb(0, 0, 0), ExposureCompensation: 0, GeographicLatitude: 41.733, EnvironmentDiffuseScale: 1, EnvironmentSpecularScale: 1, GlobalShadows: true }),
  Atmosphere: () => ({ Density: 0.3, Offset: 0.25, Color: rgb(199 / 255, 170 / 255, 107 / 255), Decay: rgb(92 / 255, 60 / 255, 13 / 255), Glare: 0, Haze: 0 }),
  ColorCorrectionEffect: () => ({ Enabled: true, Brightness: 0, Contrast: 0, Saturation: 0, TintColor: WHITE }),
  Model: () => ({ PrimaryPart: null, WorldPivot: new THREE.Matrix4() }),
  ScreenGui: () => ({ Enabled: true, DisplayOrder: 0, IgnoreGuiInset: false, ResetOnSpawn: true, ZIndexBehavior: 'Sibling' }),
  TextBox: () => ({ BackgroundColor3: WHITE, Text: '', PlaceholderText: '', PlaceholderColor3: rgb(0.7, 0.7, 0.7), ClearTextOnFocus: true, TextEditable: true, TextColor3: rgb(27 / 255, 42 / 255, 53 / 255), TextSize: 14, TextScaled: false, Font: 'Legacy', TextStrokeTransparency: 1, TextStrokeColor3: rgb(0, 0, 0), TextTransparency: 0, TextXAlignment: 'Center', TextYAlignment: 'Center', TextWrapped: false, Active: true }),
  TextButton: () => ({ BackgroundColor3: WHITE, Text: 'Button', TextColor3: rgb(27 / 255, 42 / 255, 53 / 255), TextSize: 14, TextScaled: false, Font: 'Legacy', TextStrokeTransparency: 1, TextStrokeColor3: rgb(0, 0, 0), TextTransparency: 0, TextXAlignment: 'Center', TextYAlignment: 'Center', TextWrapped: false, AutoButtonColor: true, Active: true }),
  ImageButton: () => ({ Image: '', ImageTransparency: 0, ImageColor3: WHITE, Active: true, AutoButtonColor: true }),
  ViewportFrame: () => ({ CurrentCamera: null, Ambient: rgb(200 / 255, 200 / 255, 200 / 255), LightColor: rgb(140 / 255, 140 / 255, 140 / 255), LightDirection: V3(-1, -1, -1), ImageTransparency: 0, ImageColor3: WHITE }),
  Camera: () => ({ CFrame: new THREE.Matrix4(), FieldOfView: 70 }),
  ScrollingFrame: () => ({ ClipsDescendants: true, CanvasSize: [0, 0, 2, 0], CanvasPosition: [0, 0], ScrollBarThickness: 12, ScrollBarImageColor3: rgb(0, 0, 0), ScrollBarImageTransparency: 0, AutomaticCanvasSize: 'None', ScrollingDirection: 'XY', ScrollingEnabled: true }),
  UIListLayout: () => ({ FillDirection: 'Vertical', Padding: [0, 0], HorizontalAlignment: 'Left', VerticalAlignment: 'Top', SortOrder: 'Name', Wraps: false }),
  UIGridLayout: () => ({ CellSize: [0, 100, 0, 100], CellPadding: [0, 5, 0, 5], FillDirection: 'Horizontal', HorizontalAlignment: 'Left', VerticalAlignment: 'Top', SortOrder: 'Name' }),
  UIPadding: () => ({ PaddingLeft: [0, 0], PaddingRight: [0, 0], PaddingTop: [0, 0], PaddingBottom: [0, 0] }),
  UIAspectRatioConstraint: () => ({ AspectRatio: 1, DominantAxis: 'Width', AspectType: 'FitWithinMaxSize' }),
  UIScale: () => ({ Scale: 1 }),
  UISizeConstraint: () => ({ MinSize: [0, 0], MaxSize: [Infinity, Infinity] }),
};
const PART_CLASSES = new Set(['Part', 'WedgePart', 'SpawnLocation', 'MeshPart', 'TrussPart', 'Seat']);
const GUI_CLASSES = new Set(['Frame', 'TextLabel', 'TextButton', 'TextBox', 'ImageLabel', 'ImageButton', 'ScrollingFrame', 'ViewportFrame']);
export { GUI_CLASSES };
function defaultsFor(cls) {
  if (PART_CLASSES.has(cls)) return DEFAULTS.BasePart();
  if (GUI_CLASSES.has(cls)) return { ...DEFAULTS.GuiObject(), ClipsDescendants: false, Active: false, LayoutOrder: 0, ...(DEFAULTS[cls]?.() || {}) };
  return DEFAULTS[cls]?.() || {};
}

// ── Instanz ──
let nextId = 1;
export class Inst {
  constructor(cls) {
    this.ClassName = cls;
    this.id = nextId++;
    this.props = { Name: cls, ...defaultsFor(cls) };
    this.children = [];
    this.parent = null;
    this.attrs = {};
    this.world = null;
    this.listeners = null;
    // ViewportFrame: eigene kleine 3D-Welt für alles, was darin liegt (gezeichnet in screen.js)
    if (cls === 'ViewportFrame') this.vpWorld = new RbxWorld({ shadows: false, sky: false });
  }
  get name() {
    return this.props.Name;
  }
  isA(cls) {
    if (cls === 'Instance' || cls === this.ClassName) return true;
    if (cls === 'BasePart') return PART_CLASSES.has(this.ClassName);
    if (cls === 'GuiObject') return GUI_CLASSES.has(this.ClassName);
    if (cls === 'Light') return this.ClassName === 'PointLight';
    return false;
  }
  set(key, value) {
    if (key === 'Parent') return this.setParent(value);
    this.props[key] = value;
    this.world?.changed(this, key);
    this.dirtyGui();
  }
  dirtyGui() {
    // GUI-Änderungen zeichnen den BillboardGui/SurfaceGui-Container neu
    for (let p = this; p; p = p.parent) if (p.gui) p.gui.dirty = true;
  }
  setParent(p) {
    if (p === this.parent) return;
    if (this.parent) {
      const list = this.parent.children;
      list.splice(list.indexOf(this), 1);
      this.parent.dirtyGui();
    }
    this.parent = p || null;
    if (p) p.children.push(this);
    const world = p ? p.vpWorld || p.world : null;
    if (world !== this.world) this.setWorld(world);
    else if (world) world.reparented(this);
    this.dirtyGui();
  }
  setWorld(world) {
    const old = this.world;
    this.world = null;
    if (old) old.detach(this);
    for (const c of this.children) c.setWorld(this.vpWorld || world);
    this.world = world;
    if (world) world.attach(this);
  }
  findFirstChild(name) {
    return this.children.find((c) => c.props.Name === name) || null;
  }
  descendants(out = []) {
    for (const c of this.children) {
      out.push(c);
      c.descendants(out);
    }
    return out;
  }
  destroy() {
    this.setParent(null);
    for (const c of [...this.children]) c.destroy();
  }
  clone() {
    const c = new Inst(this.ClassName);
    for (const [k, v] of Object.entries(this.props)) c.props[k] = v && v.clone ? v.clone() : Array.isArray(v) ? v.slice() : v;
    c.attrs = { ...this.attrs };
    for (const k of this.children) k.clone().setParent(c);
    return c;
  }
}

// ── Formen ──
function headGeometry() {
  // Roblox-Kopf: Zylinder mit runden Kanten, Höhe und Breite 1
  const pts = [], r = 0.5, k = 0.22, h = 0.5;
  pts.push(new THREE.Vector2(0, -h));
  for (let i = 0; i <= 6; i++) {
    const a = -Math.PI / 2 + (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r - k + Math.cos(a) * k, -h + k + Math.sin(a) * k));
  }
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r - k + Math.cos(a) * k, h - k + Math.sin(a) * k));
  }
  pts.push(new THREE.Vector2(0, h));
  return new THREE.LatheGeometry(pts, 28);
}
function wedgeGeometry() {
  // WedgePart: hohe Seite hinten (+Z), Schräge fällt nach vorne (−Z) ab
  const g = new THREE.BufferGeometry();
  const p = [
    [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5],
  ];
  const faces = [[0, 2, 1], [0, 3, 2], [3, 5, 2], [3, 4, 5], [0, 1, 5], [0, 5, 4], [0, 4, 3], [1, 2, 5]];
  const pos = [];
  for (const f of faces) for (const i of f) pos.push(...p[i]);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
const GEO = {
  Block: new THREE.BoxGeometry(1, 1, 1),
  Ball: new THREE.SphereGeometry(0.5, 32, 20),
  Cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 32).rotateZ(-Math.PI / 2),
  Wedge: wedgeGeometry(),
  Sphere: new THREE.SphereGeometry(0.5, 32, 20),
  Head: headGeometry(),
};

// Gesicht (rbxasset://textures/face.png) und andere bekannte Bilder
const IMAGES = new Map();
// Bilder, die in Roblox als Decal hochgeladen werden (z. B. Münzmotive), für die Vorschau bekannt machen
export function registerImage(url, canvas) {
  IMAGES.set(url, canvas);
}
// Bild zu einer Adresse (registerImage oder eingebaute), für GUI-Bilder in screen.js
export function imageOf(url) {
  return knownImage(url);
}
function knownImage(url) {
  if (!url) return null;
  if (IMAGES.has(url)) return IMAGES.get(url);
  let canvas = null;
  if (url.includes('face.png')) {
    canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const g = canvas.getContext('2d');
    g.fillStyle = '#141414';
    for (const x of [44, 84]) {
      g.beginPath();
      g.ellipse(x, 52, 7, 13, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = '#141414';
    g.lineWidth = 7;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(64, 66, 28, 0.25 * Math.PI, 0.75 * Math.PI);
    g.stroke();
  }
  IMAGES.set(url, canvas);
  return canvas;
}
const FACE = { Front: [0, 0, -1], Back: [0, 0, 1], Top: [0, 1, 0], Bottom: [0, -1, 0], Right: [1, 0, 0], Left: [-1, 0, 0] };

// ── Welt ──
const tmpM = new THREE.Matrix4(), tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), tmpC = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);

export class RbxWorld {
  constructor({ shadows = true, sky = true } = {}) {
    this.scene = new THREE.Scene();
    this.time = 0;
    this.parts = new Set();
    this.emitters = new Set();
    this.beams = new Set();
    this.trails = new Set();
    this.lights = new Set();
    this.highlights = new Set();
    this.guis = new Set();
    this.workspace = new Inst('Workspace');
    this.workspace.props.Name = 'Workspace';
    this.workspace.world = this;
    this.lighting = new Inst('Lighting');
    this.lighting.props.Name = 'Lighting';
    this.lighting.world = this;
    // Licht
    this.sun = new THREE.DirectionalLight(0xffffff, 1);
    this.sun.castShadow = shadows;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.04;
    this.setShadowArea(V3(), 30);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1);
    this.ambient = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(this.sun, this.sun.target, this.hemi, this.ambient);
    this.pointPool = Array.from({ length: 8 }, () => {
      const l = new THREE.PointLight(0xffffff, 0, 8, 1.2);
      this.scene.add(l);
      return l;
    });
    this.skyMesh = sky ? makeSky() : null;
    if (this.skyMesh) this.scene.add(this.skyMesh);
    this.staticGroups = [];
  }
  setShadowArea(center, radius) {
    const c = this.sun.shadow.camera;
    c.left = c.bottom = -radius;
    c.right = c.top = radius;
    c.near = 0.5;
    c.far = radius * 6;
    c.updateProjectionMatrix();
    this.shadowCenter = center.clone();
    this.shadowRadius = radius;
  }

  // ── Anmelden und Abmelden ──
  attach(inst) {
    this.version = (this.version || 0) + 1;
    const cls = inst.ClassName;
    if (PART_CLASSES.has(cls)) {
      inst.mesh = new THREE.Mesh(GEO.Block, null);
      inst.mesh.matrixAutoUpdate = false;
      inst.mesh.userData.inst = inst;
      this.scene.add(inst.mesh);
      this.parts.add(inst);
      this.refreshPart(inst, true);
    } else if (cls === 'SpecialMesh' || cls === 'Decal') {
      if (inst.parent?.mesh) this.refreshPart(inst.parent, true);
    } else if (cls === 'ParticleEmitter' || cls === 'Fire' || cls === 'Smoke' || cls === 'Sparkles') {
      inst.sim = makeParticleSim(inst);
      this.scene.add(inst.sim.mesh);
      this.emitters.add(inst);
    } else if (cls === 'Beam') {
      inst.strip = makeStrip();
      this.scene.add(inst.strip.mesh);
      this.beams.add(inst);
    } else if (cls === 'Trail') {
      inst.strip = makeStrip();
      inst.points = [];
      this.scene.add(inst.strip.mesh);
      this.trails.add(inst);
    } else if (cls === 'PointLight') {
      this.lights.add(inst);
    } else if (cls === 'Highlight') {
      inst.hl = { group: new THREE.Group(), map: new Map() };
      inst.hl.group.renderOrder = 10;
      this.scene.add(inst.hl.group);
      this.highlights.add(inst);
    } else if (cls === 'BillboardGui' || cls === 'SurfaceGui') {
      const canvas = document.createElement('canvas');
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: cls === 'SurfaceGui' ? THREE.FrontSide : THREE.DoubleSide, toneMapped: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      mesh.matrixAutoUpdate = false;
      inst.gui = { canvas, tex, mesh, dirty: true };
      this.scene.add(mesh);
      this.guis.add(inst);
    }
    if (inst.ClassName !== 'Workspace' && inst.parent && PART_CLASSES.has(inst.parent.ClassName) && (cls === 'SurfaceGui')) inst.gui.dirty = true;
  }
  detach(inst) {
    this.version = (this.version || 0) + 1;
    const cls = inst.ClassName;
    if (inst.mesh) {
      this.scene.remove(inst.mesh);
      inst.mesh.material?.dispose();
      inst.decals?.forEach((d) => this.scene.remove(d));
      inst.mesh = null;
      this.parts.delete(inst);
    } else if (cls === 'SpecialMesh' || cls === 'Decal') {
      if (inst.parent?.mesh) this.refreshPart(inst.parent, true);
    }
    if (inst.sim) {
      this.scene.remove(inst.sim.mesh);
      inst.sim.dispose();
      inst.sim = null;
      this.emitters.delete(inst);
    }
    if (inst.strip) {
      this.scene.remove(inst.strip.mesh);
      inst.strip.dispose();
      inst.strip = null;
      this.beams.delete(inst);
      this.trails.delete(inst);
    }
    this.lights.delete(inst);
    if (inst.hl) {
      this.scene.remove(inst.hl.group);
      inst.hl.group.traverse((o) => o.material?.dispose());
      inst.hl = null;
      this.highlights.delete(inst);
    }
    if (inst.gui) {
      this.scene.remove(inst.gui.mesh);
      inst.gui.tex.dispose();
      inst.gui.mesh.material.dispose();
      inst.gui = null;
      this.guis.delete(inst);
    }
  }
  reparented(inst) {
    if (inst.ClassName === 'SpecialMesh' || inst.ClassName === 'Decal') {
      for (const p of this.parts) if (p.children.includes(inst)) this.refreshPart(p, true);
    }
  }
  changed(inst, key) {
    this.version = (this.version || 0) + 1;
    if (inst.mesh) this.refreshPart(inst, key !== 'CFrame' && key !== 'Size');
    else if ((inst.ClassName === 'SpecialMesh' || inst.ClassName === 'Decal') && inst.parent?.mesh) this.refreshPart(inst.parent, true);
  }

  // ── Teile ──
  refreshPart(inst, look) {
    const m = inst.mesh, P = inst.props;
    const special = inst.children.find((c) => c.ClassName === 'SpecialMesh');
    let shape = inst.ClassName === 'WedgePart' ? 'Wedge' : P.Shape === 'Ball' ? 'Ball' : P.Shape === 'Cylinder' ? 'Cylinder' : P.Shape === 'Wedge' ? 'Wedge' : 'Block';
    let sx = P.Size.x, sy = P.Size.y, sz = P.Size.z;
    if (special) {
      shape = special.props.MeshType === 'Sphere' ? 'Sphere' : special.props.MeshType === 'Head' ? 'Head' : special.props.MeshType === 'Cylinder' ? 'Cylinder' : shape;
      const s = special.props.Scale;
      if (shape === 'Head') {
        const d = Math.min(sx, sz);
        sx = d; sz = d;
      }
      sx *= s.x; sy *= s.y; sz *= s.z;
    } else if (shape === 'Ball') {
      const d = Math.min(sx, sy, sz);
      sx = sy = sz = d;
    } else if (shape === 'Cylinder') {
      const d = Math.min(sy, sz);
      sy = sz = d;
    }
    m.geometry = GEO[shape];
    m.matrix.copy(P.CFrame);
    const off = special?.props.Offset;
    if (off && (off.x || off.y || off.z)) m.matrix.multiply(tmpM.makeTranslation(off.x, off.y, off.z));
    m.matrix.multiply(tmpM.makeScale(sx, sy, sz));
    m.matrixWorldNeedsUpdate = true;
    const transparency = Math.min(1, P.Transparency + (P.LocalTransparencyModifier || 0));
    m.visible = transparency < 0.999;
    if (look) {
      m.material?.dispose();
      m.material = partMaterial(P.Material, { color: P.Color.color, transparency, reflectance: P.Reflectance });
      m.castShadow = P.CastShadow && P.Material !== 'Neon' && P.Material !== 'ForceField' && transparency < 0.5;
      m.receiveShadow = P.Material !== 'Neon' && P.Material !== 'ForceField';
      this.refreshDecals(inst);
    }
    if (inst.decals) for (const d of inst.decals) d.matrix.copy(m.matrix).multiply(d.userData.local);
  }
  refreshDecals(inst) {
    inst.decals?.forEach((d) => {
      this.scene.remove(d);
      d.material.dispose();
    });
    inst.decals = [];
    for (const c of inst.children) {
      if (c.ClassName !== 'Decal') continue;
      const img = knownImage(c.props.Texture);
      if (!img) continue;
      const tex = new THREE.CanvasTexture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
      const n = FACE[c.props.Face] || FACE.Front;
      // Ebene auf die Seite legen (Einheitswürfel, Kopf: Zylinder mit Radius 0.5)
      const local = new THREE.Matrix4().lookAt(V3(), V3(...n), Math.abs(n[1]) > 0.5 ? V3(0, 0, -1) : UP);
      local.premultiply(new THREE.Matrix4().makeTranslation(n[0] * 0.505, n[1] * 0.505, n[2] * 0.505));
      local.multiply(new THREE.Matrix4().makeRotationY(Math.PI));
      mesh.userData.local = local;
      mesh.matrixAutoUpdate = false;
      this.scene.add(mesh);
      inst.decals.push(mesh);
    }
  }
  // Viele feste Teile auf einmal (Welten): gebündelt als InstancedMesh, Aussehen wie refreshPart
  addStaticParts(list) {
    const buckets = new Map();
    for (const p of list) {
      if ((p.transparency ?? 0) >= 1) continue;
      const shape = p.shape === 'Ellipsoid' ? 'Sphere' : p.shape;
      const key = `${shape}|${p.material}|${p.transparency || 0}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(p);
    }
    const group = new THREE.Group();
    const m4 = new THREE.Matrix4(), sc = new THREE.Matrix4();
    for (const [key, ps] of buckets) {
      const [shape, material, tr] = key.split('|');
      const mat = partMaterial(material, { instanced: true, transparency: Number(tr) });
      const inst = new THREE.InstancedMesh(GEO[shape] || GEO.Block, mat, ps.length);
      ps.forEach((p, i) => {
        const r = p.rot;
        let [sx, sy, sz] = p.size;
        if (shape === 'Cylinder') sy = sz = Math.min(sy, sz);
        if (shape === 'Ball') sx = sy = sz = Math.min(sx, sy, sz);
        m4.set(r[0], r[1], r[2], p.pos[0], r[3], r[4], r[5], p.pos[1], r[6], r[7], r[8], p.pos[2], 0, 0, 0, 1);
        inst.setMatrixAt(i, m4.multiply(sc.makeScale(sx, sy, sz)));
        const c = new THREE.Color(p.color);
        inst.setColorAt(i, material === 'Neon' ? neonColor(c) : c);
      });
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      inst.castShadow = material !== 'Neon' && Number(tr) < 0.5;
      inst.receiveShadow = material !== 'Neon';
      inst.userData.parts = ps; // für Raycasts: Treffer → Teil
      group.add(inst);
    }
    this.scene.add(group);
    this.staticGroups.push(group);
    return group;
  }

  // Weltlage einer Instanz (Teil, Attachment oder deren Kinder)
  worldCFrame(inst, out = new THREE.Matrix4()) {
    if (!inst) return out.identity();
    if (inst.mesh || PART_CLASSES.has(inst.ClassName)) return out.copy(inst.props.CFrame);
    if (inst.ClassName === 'Attachment') {
      this.worldCFrame(inst.parent, out);
      tmpM.copy(inst.props.CFrame).setPosition(inst.props.Position);
      return out.multiply(tmpM);
    }
    if (inst.ClassName === 'Model') {
      const pp = inst.props.PrimaryPart;
      return pp ? out.copy(pp.props.CFrame) : out.copy(inst.props.WorldPivot);
    }
    return this.worldCFrame(inst.parent, out);
  }

  // ── Bild für Bild ──
  update(dt) {
    this.time += dt;
    FORCEFIELD_TIME.value = this.time;
    for (const e of this.emitters) e.sim.update(this, dt);
    for (const t of this.trails) updateTrailPoints(this, t);
  }
  prepare(camera, viewportHeight) {
    this.applyLighting(camera);
    for (const e of this.emitters) e.sim.prepare(camera);
    for (const b of this.beams) drawBeam(this, b, camera);
    for (const t of this.trails) drawTrail(this, t, camera);
    for (const h of this.highlights) drawHighlight(this, h);
    for (const g of this.guis) drawGuiContainer(this, g, camera, viewportHeight);
    this.placeLights(camera);
  }
  // Spiegelung des Himmels für Metall, Glas und Licht von oben (wie Roblox' Umgebungslicht)
  // (je Renderer eine eigene: Texturen gelten nur im WebGL-Kontext, in dem sie entstanden sind)
  ensureEnvironment(renderer) {
    if (this.envRenderer === renderer) return;
    if (!envCache.has(renderer)) envCache.set(renderer, buildEnvironment(renderer));
    this.scene.environment = envCache.get(renderer);
    this.envRenderer = renderer;
  }
  render(renderer, camera) {
    this.ensureEnvironment(renderer);
    const h = renderer.getRenderTarget() ? renderer.getRenderTarget().height : renderer.getContext().drawingBufferHeight;
    const vp = renderer.getCurrentViewport(new THREE.Vector4());
    this.prepare(camera, (vp.w || h) / renderer.getPixelRatio());
    renderer.render(this.scene, camera);
  }

  applyLighting(camera) {
    // ViewportFrame: Licht wie in Roblox nur aus Ambient, LightColor und LightDirection
    const V = this.viewportLight;
    if (V) {
      this.sun.position.copy(this.shadowCenter).addScaledVector(V.direction.clone().normalize(), -this.shadowRadius * 3);
      this.sun.target.position.copy(this.shadowCenter);
      this.sun.color.copy(V.color);
      this.sun.intensity = 2.4;
      this.sun.castShadow = false;
      this.hemi.color.copy(V.ambient);
      this.hemi.groundColor.copy(V.ambient).multiplyScalar(0.55);
      this.hemi.intensity = 1.1;
      this.ambient.color.copy(V.ambient);
      this.ambient.intensity = 0.55;
      this.scene.fog = null;
      return;
    }
    const L = this.lighting.props;
    const atm = this.lighting.children.find((c) => c.ClassName === 'Atmosphere');
    const cc = this.lighting.children.find((c) => c.ClassName === 'ColorCorrectionEffect' && c.props.Enabled);
    // Sonne aus der Uhrzeit (Süden = +Z wie in Roblox bei 0°)
    const t = ((L.ClockTime % 24) + 24) % 24;
    const day = Math.sin(((t - 6) / 12) * Math.PI);
    const elev = Math.max(-0.3, day) * 1.15, az = ((t - 12) / 12) * Math.PI;
    const sunDir = V3(Math.sin(az) * Math.cos(elev), Math.sin(elev), Math.cos(az) * Math.cos(elev) * 0.6 + 0.4).normalize();
    const dayK = THREE.MathUtils.clamp(day * 3, 0, 1);
    const center = this.shadowCenter;
    // nachts scheint der Mond (schwächer, bläulich, von oben)
    const lightDir = dayK > 0.05 ? sunDir : V3(-sunDir.x, Math.abs(sunDir.y) + 0.8, -sunDir.z).normalize();
    this.sun.position.copy(center).addScaledVector(lightDir, this.shadowRadius * 3);
    this.sun.target.position.copy(center);
    const shiftTop = L.ColorShift_Top.color;
    this.sun.color.setRGB(1, 0.97, 0.92).lerp(tmpC.setRGB(1, 0.6, 0.35), 1 - THREE.MathUtils.clamp(day * 2.2, 0, 1)).lerp(tmpC.setRGB(0.55, 0.62, 0.9), 1 - dayK).add(shiftTop);
    const exposure = Math.pow(2, L.ExposureCompensation || 0) * (1 + (cc ? cc.props.Brightness : 0));
    this.sun.intensity = L.Brightness * (1.25 * dayK + 0.35 * (1 - dayK)) * exposure;
    this.sun.castShadow = this.sun.castShadow && L.GlobalShadows !== false;
    // Himmel- und Bodenlicht (OutdoorAmbient), Grundlicht (Ambient)
    const skyTint = tmpC.setRGB(0.55, 0.7, 1).lerp(new THREE.Color(1, 1, 1), 0.4);
    this.hemi.color.copy(L.OutdoorAmbient.color).multiply(skyTint).multiplyScalar(1.9 * (0.35 + 0.65 * dayK) * L.EnvironmentDiffuseScale + 0.5);
    this.hemi.groundColor.copy(L.OutdoorAmbient.color).multiplyScalar(0.9);
    this.hemi.intensity = exposure * (this.scene.environment ? 0.45 : 1);
    this.ambient.color.copy(L.Ambient.color);
    this.ambient.intensity = 1.2 * exposure;
    if (cc) {
      this.sun.color.multiply(cc.props.TintColor.color);
      this.hemi.color.multiply(cc.props.TintColor.color);
    }
    // Nebel
    if (L.FogEnd < 10000) {
      if (!this.scene.fog) this.scene.fog = new THREE.Fog(0xffffff, 0, 1000);
      this.scene.fog.color.copy(L.FogColor.color);
      this.scene.fog.near = L.FogStart;
      this.scene.fog.far = L.FogEnd;
    } else this.scene.fog = null;
    if (this.skyMesh) updateSky(this.skyMesh, camera, sunDir, day, atm?.props, L);
  }
  placeLights(camera) {
    // Die 8 hellsten Lichter in Kameranähe (Roblox zeigt sehr viele, die Vorschau rechnet mit 8)
    const list = [];
    for (const l of this.lights) {
      if (!l.props.Enabled || !l.parent) continue;
      const p = this.worldCFrame(l.parent, tmpM);
      const pos = V3().setFromMatrixPosition(p);
      list.push([l, pos, pos.distanceTo(camera.position) - l.props.Range * l.props.Brightness]);
    }
    list.sort((a, b) => a[2] - b[2]);
    this.pointPool.forEach((pl, i) => {
      const e = list[i];
      if (!e) {
        pl.intensity = 0;
        return;
      }
      const [l, pos] = e;
      pl.position.copy(pos);
      pl.color.copy(l.props.Color.color);
      pl.distance = l.props.Range;
      pl.intensity = l.props.Brightness * 2.2;
    });
  }
  dispose() {
    for (const i of this.workspace.descendants()) this.detach(i);
    for (const g of this.staticGroups) g.traverse((o) => o.material?.dispose());
    this.skyMesh?.material.dispose();
  }
}

const envCache = new WeakMap();
function buildEnvironment(renderer) {
  const scene = new THREE.Scene();
  const sky = makeSky();
  updateSky(sky, null, V3(0.4, 0.8, 0.45).normalize(), 1, null, null);
  sky.onBeforeRender = () => {};
  sky.scale.setScalar(50);
  scene.add(sky);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x4a4c55 }));
  ground.position.y = -2;
  scene.add(ground);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(scene, 0.04).texture;
  pm.dispose();
  return tex;
}

// ── Himmel wie der Roblox-Standardhimmel, getönt von Atmosphere ──
function makeSky() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, haze: { value: new THREE.Color() }, sunDir: { value: V3(0, 1, 0) }, sunCol: { value: new THREE.Color(1, 1, 0.9) }, clouds: { value: 1 }, glare: { value: 0 }, night: { value: 0 } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 haze; uniform vec3 sunDir; uniform vec3 sunCol; uniform float clouds; uniform float glare; uniform float night; varying vec3 vDir;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      void main(){ vec3 d = normalize(vDir); float y = d.y;
        vec3 c = mix(horizon, top, pow(clamp(y, 0.0, 1.0), 0.55));
        c = mix(c, haze, smoothstep(0.25, -0.05, y) * 0.9);
        if (y > 0.0) { vec2 uv = d.xz / (y + 0.12) * 1.6; float cl = n(uv) * 0.6 + n(uv * 2.3) * 0.3 + n(uv * 5.1) * 0.1; cl = smoothstep(0.55, 0.85, cl) * smoothstep(0.0, 0.25, y) * clouds; c = mix(c, vec3(1.0) * (0.85 + 0.15 * top.b), cl * 0.85); }
        if (night > 0.0 && y > 0.0) { vec3 g = floor(d * 260.0); float st = h(g.xy + g.z * 17.0); c += vec3(step(0.9975, st) * night * (0.6 + 0.4 * h(g.zx))); }
        float s = max(dot(d, normalize(sunDir)), 0.0);
        c += sunCol * (pow(s, 900.0) * 3.0 + pow(s, 12.0) * (0.12 + glare * 0.6));
        gl_FragColor = vec4(c, 1.0); }`,
    side: THREE.BackSide, depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -100;
  mesh.onBeforeRender = (r, s, cam) => {
    mesh.position.copy(cam.position);
    mesh.scale.setScalar(cam.far * 0.9);
    mesh.updateMatrixWorld();
  };
  return mesh;
}
function updateSky(mesh, camera, sunDir, day, atm, L) {
  const u = mesh.material.uniforms;
  const dayK = THREE.MathUtils.clamp(day * 2.5 + 0.3, 0, 1);
  u.top.value.setRGB(0.13, 0.42, 0.9).lerp(tmpC.setRGB(0.01, 0.015, 0.04), 1 - dayK);
  u.horizon.value.setRGB(0.62, 0.8, 0.98).lerp(tmpC.setRGB(0.04, 0.05, 0.1), 1 - dayK);
  u.haze.value.copy(u.horizon.value);
  u.clouds.value = dayK;
  u.night.value = 1 - dayK;
  u.glare.value = 0;
  if (atm) {
    // Atmosphere: Color tönt den Horizont, Decay den Himmel weiter oben, Haze/Density machen ihn dichter
    const k = THREE.MathUtils.clamp(atm.Density * 1.6, 0, 1);
    u.horizon.value.lerp(atm.Color.color, k * 0.85);
    u.haze.value.copy(atm.Color.color).lerp(u.horizon.value, 0.3);
    u.top.value.lerp(atm.Decay.color, k * 0.35 * (0.3 + atm.Haze / 10));
    u.glare.value = atm.Glare / 10;
  }
  u.sunDir.value.copy(sunDir);
  u.sunCol.value.setRGB(1, 1, 0.9).multiplyScalar(dayK);
}

// ── Teilchen ──
const PVS = `attribute vec3 iPos; attribute vec4 iCol; attribute vec2 iSize; attribute float iRot;
uniform float zOffset; varying vec2 vUv; varying vec4 vCol;
void main(){ vUv = uv; vCol = iCol; vec4 mv = viewMatrix * vec4(iPos, 1.0);
  float c = cos(iRot), s = sin(iRot); vec2 q = position.xy * iSize;
  mv.xy += vec2(c * q.x - s * q.y, s * q.x + c * q.y);
  mv.xyz += normalize(-mv.xyz) * zOffset; gl_Position = projectionMatrix * mv; }`;
const PFS = `uniform sampler2D map; uniform float emission; varying vec2 vUv; varying vec4 vCol;
void main(){ vec4 t = texture2D(map, vUv); float a = t.a * vCol.a; if (a < 0.003) discard;
  vec3 c = t.rgb * vCol.rgb; gl_FragColor = vec4(c * a, a * (1.0 - emission)); }`;
const PREMUL = { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation };

function particleMaterial(texture, emission) {
  return new THREE.ShaderMaterial({ uniforms: { map: { value: texture }, emission: { value: emission }, zOffset: { value: 0 } }, vertexShader: PVS, fragmentShader: PFS, transparent: true, depthWrite: false, ...PREMUL });
}
function quadGeometry(cap) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('iCol', new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('iSize', new THREE.InstancedBufferAttribute(new Float32Array(cap * 2), 2).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('iRot', new THREE.InstancedBufferAttribute(new Float32Array(cap), 1).setUsage(THREE.DynamicDrawUsage));
  g.instanceCount = 0;
  return g;
}

// Fire, Smoke und Sparkles sind in Roblox fertige Emitter; hier als Voreinstellungen
function legacyProps(inst) {
  const P = inst.props;
  if (inst.ClassName === 'Fire') {
    const s = P.Size;
    return { Enabled: P.Enabled, Rate: 65, Lifetime: [0.7, 1], Speed: [P.Heat * 0.25, P.Heat * 0.35], SpreadAngle: [12, 12], Size: [[0, s * 0.4], [1, s * 0.08]], Transparency: [[0, 0.3], [1, 1]], Color: [[0, P.Color], [1, P.SecondaryColor]], LightEmission: 0.8, LightInfluence: 0, Texture: 'rbxasset://textures/particles/fire_main.dds', Acceleration: V3(0, P.Heat * 0.4, 0), Drag: 0, EmissionDirection: 'Top', Shape: 'Box', ShapeStyle: 'Volume', Rotation: [0, 360], RotSpeed: [-60, 60], LockedToPart: false, ZOffset: 0, Brightness: 1, legacySize: s * 0.25 };
  }
  if (inst.ClassName === 'Smoke') {
    return { Enabled: P.Enabled, Rate: 12, Lifetime: [3, 5], Speed: [P.RiseVelocity * 0.8, P.RiseVelocity * 1.2], SpreadAngle: [15, 15], Size: [[0, P.Size * 0.6], [1, P.Size * 2.2]], Transparency: [[0, 1 - P.Opacity], [1, 1]], Color: CS(P.Color), LightEmission: 0, LightInfluence: 1, Texture: 'rbxasset://textures/particles/smoke_main.dds', Acceleration: V3(), Drag: 0.5, EmissionDirection: 'Top', Shape: 'Box', ShapeStyle: 'Volume', Rotation: [0, 360], RotSpeed: [-20, 20], LockedToPart: false, ZOffset: 0, Brightness: 1, legacySize: 0.4 };
  }
  return { Enabled: P.Enabled, Rate: 18, Lifetime: [0.8, 1.4], Speed: [2, 4], SpreadAngle: [180, 180], Size: [[0, 0.6], [1, 0]], Transparency: NS(0), Color: CS(P.SparkleColor), LightEmission: 1, LightInfluence: 0, Texture: 'rbxasset://textures/particles/sparkles_main.dds', Acceleration: V3(), Drag: 1.5, EmissionDirection: 'Top', Shape: 'Box', ShapeStyle: 'Volume', Rotation: [0, 360], RotSpeed: [-90, 90], LockedToPart: false, ZOffset: 0, Brightness: 1.5, legacySize: 0.5 };
}

const NORMAL = { Top: V3(0, 1, 0), Bottom: V3(0, -1, 0), Front: V3(0, 0, -1), Back: V3(0, 0, 1), Right: V3(1, 0, 0), Left: V3(-1, 0, 0) };

function makeParticleSim(inst) {
  let cap = 64;
  let geo = quadGeometry(cap);
  const mat = particleMaterial(particleTexture(inst.props.Texture), 0);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  const list = [];
  let carry = 0, texUrl = null;
  const cf = new THREE.Matrix4(), rot = new THREE.Matrix3();
  const P = () => (inst.ClassName === 'ParticleEmitter' ? inst.props : legacyProps(inst));
  function spawn(world, n, p) {
    const host = inst.parent;
    if (!host) return;
    world.worldCFrame(host, cf);
    rot.setFromMatrix4(cf);
    const isPart = PART_CLASSES.has(host.ClassName);
    const size = isPart ? host.props.Size : V3(p.legacySize || 0, p.legacySize || 0, p.legacySize || 0);
    for (let i = 0; i < n; i++) {
      const local = V3();
      let dir = (NORMAL[p.EmissionDirection] || NORMAL.Top).clone();
      const surface = p.ShapeStyle === 'Surface';
      if (p.Shape === 'Sphere') {
        const d = V3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        local.copy(d).multiplyScalar(surface ? 0.5 : 0.5 * Math.cbrt(Math.random())).multiply(size);
        dir = d;
      } else if (p.Shape === 'Cylinder' || p.Shape === 'Disc') {
        const a = Math.random() * Math.PI * 2, r = surface ? 0.5 : 0.5 * Math.sqrt(Math.random());
        local.set(Math.cos(a) * r * size.x, p.Shape === 'Disc' ? 0 : (Math.random() - 0.5) * size.y, Math.sin(a) * r * size.z);
        if (p.Shape === 'Cylinder') dir = V3(Math.cos(a), 0, Math.sin(a));
      } else {
        if (surface) {
          const ax = Math.floor(Math.random() * 3), sgn = Math.random() < 0.5 ? -0.5 : 0.5;
          local.set((Math.random() - 0.5) * size.x, (Math.random() - 0.5) * size.y, (Math.random() - 0.5) * size.z);
          local.setComponent(ax, sgn * size.getComponent(ax));
        } else local.set((Math.random() - 0.5) * size.x, (Math.random() - 0.5) * size.y, (Math.random() - 0.5) * size.z);
      }
      if (p.ShapeInOut === 'Inward') dir.negate();
      // Streuung: zwei Winkel um die Achsen quer zur Richtung
      const sx = (p.SpreadAngle[0] * Math.PI) / 180, sy = (p.SpreadAngle[1] * Math.PI) / 180;
      if (sx || sy) {
        const a1 = (Math.random() * 2 - 1) * sx, a2 = (Math.random() * 2 - 1) * sy;
        const side = Math.abs(dir.y) > 0.9 ? V3(1, 0, 0) : V3(0, 1, 0);
        const u = side.clone().cross(dir).normalize(), w = dir.clone().cross(u).normalize();
        dir.applyAxisAngle(u, a1).applyAxisAngle(w, a2);
      }
      const speed = rand(p.Speed);
      const worldPos = local.clone().applyMatrix4(cf);
      const vel = dir.applyMatrix3(rot).normalize().multiplyScalar(speed);
      const life = Math.max(0.01, rand(p.Lifetime));
      const q = { pos: p.LockedToPart ? local : worldPos, vel: p.LockedToPart ? vel.applyMatrix3(rot.clone().transpose()) : vel, age: 0, life, rot: (rand(p.Rotation) * Math.PI) / 180, spin: (rand(p.RotSpeed) * Math.PI) / 180, seed: Math.random() };
      list.push(q);
    }
  }
  return {
    mesh,
    emit(world, n) {
      spawn(world, n, P());
    },
    update(world, dt) {
      const p = P();
      if (texUrl !== p.Texture) {
        texUrl = p.Texture;
        mat.uniforms.map.value = particleTexture(p.Texture);
      }
      const ts = dt * (p.TimeScale ?? 1);
      if (p.Enabled && inst.parent && p.Rate > 0) {
        carry += p.Rate * ts;
        const n = Math.floor(carry);
        carry -= n;
        if (n) spawn(world, Math.min(n, 400), p);
      }
      const drag = p.Drag ? Math.pow(0.5, p.Drag * ts) : 1;
      for (let i = list.length - 1; i >= 0; i--) {
        const q = list[i];
        q.age += ts;
        if (q.age >= q.life) {
          list.splice(i, 1);
          continue;
        }
        q.vel.addScaledVector(p.Acceleration, ts).multiplyScalar(drag);
        q.pos.addScaledVector(q.vel, ts);
        q.rot += q.spin * ts;
      }
    },
    prepare(camera) {
      const p = P();
      if (list.length > cap) {
        while (cap < list.length) cap *= 2;
        geo.dispose();
        geo = quadGeometry(cap);
        mesh.geometry = geo;
      }
      mat.uniforms.emission.value = THREE.MathUtils.clamp(p.LightEmission, 0, 1);
      mat.uniforms.zOffset.value = p.ZOffset || 0;
      const pos = geo.attributes.iPos.array, col = geo.attributes.iCol.array, siz = geo.attributes.iSize.array, rt = geo.attributes.iRot.array;
      const lit = 1 - (p.LightInfluence ?? 0) * 0.25;
      const bright = (p.Brightness ?? 1) * lit;
      let hostCf = null;
      if (p.LockedToPart && inst.world) hostCf = inst.world.worldCFrame(inst.parent, cf);
      for (let i = 0; i < list.length; i++) {
        const q = list[i], t = q.age / q.life;
        const w = q.pos;
        if (hostCf) tmpV.copy(w).applyMatrix4(hostCf);
        else tmpV.copy(w);
        pos[i * 3] = tmpV.x;
        pos[i * 3 + 1] = tmpV.y;
        pos[i * 3 + 2] = tmpV.z;
        sampleColorLinear(p.Color, t, tmpC);
        col[i * 4] = tmpC.r * bright;
        col[i * 4 + 1] = tmpC.g * bright;
        col[i * 4 + 2] = tmpC.b * bright;
        col[i * 4 + 3] = 1 - THREE.MathUtils.clamp(sampleNumber(p.Transparency, t), 0, 1);
        const s = Math.max(0, sampleNumber(p.Size, t));
        const sq = sampleNumber(p.Squash, t);
        siz[i * 2] = s * (1 - sq * 0.5);
        siz[i * 2 + 1] = s * (1 + sq * 0.5);
        rt[i] = q.rot;
      }
      geo.instanceCount = list.length;
      for (const k of ['iPos', 'iCol', 'iSize', 'iRot']) geo.attributes[k].needsUpdate = true;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
    get count() {
      return list.length;
    },
  };
}

// ── Bänder (Beam, Trail) ──
const SVS = `attribute vec4 sCol; varying vec4 vCol; void main(){ vCol = sCol; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SFS = `uniform float emission; varying vec4 vCol; void main(){ float a = vCol.a; if (a < 0.003) discard; gl_FragColor = vec4(vCol.rgb * a, a * (1.0 - emission)); }`;
function makeStrip() {
  const geo = new THREE.BufferGeometry();
  let cap = 0;
  const mat = new THREE.ShaderMaterial({ uniforms: { emission: { value: 0 } }, vertexShader: SVS, fragmentShader: SFS, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...PREMUL });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return {
    mesh,
    // pts: [[x,y,z], …] als Paare (links, rechts); cols: [r,g,b,a] je Paar
    set(pairs) {
      const n = pairs.length;
      if (n * 2 > cap) {
        cap = Math.max(16, n * 4);
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cap * 3), 3).setUsage(THREE.DynamicDrawUsage));
        geo.setAttribute('sCol', new THREE.BufferAttribute(new Float32Array(cap * 4), 4).setUsage(THREE.DynamicDrawUsage));
        const idx = [];
        for (let i = 0; i < cap / 2 - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
        geo.setIndex(idx);
      }
      const P = geo.attributes.position.array, C = geo.attributes.sCol.array;
      pairs.forEach(([a, b, c], i) => {
        P.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
        C.set(c, i * 8);
        C.set(c, i * 8 + 4);
      });
      geo.setDrawRange(0, Math.max(0, (n - 1) * 6));
      geo.attributes.position.needsUpdate = true;
      geo.attributes.sCol.needsUpdate = true;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}
function attachmentInfo(world, a) {
  const m = world.worldCFrame(a, new THREE.Matrix4());
  return { pos: V3().setFromMatrixPosition(m), axis: V3(1, 0, 0).transformDirection(m), up: V3(0, 1, 0).transformDirection(m) };
}
function drawBeam(world, b, camera) {
  const P = b.props;
  const ok = P.Enabled && P.Attachment0?.world === world && P.Attachment1?.world === world;
  b.strip.mesh.visible = !!ok;
  if (!ok) return;
  const A = attachmentInfo(world, P.Attachment0), B = attachmentInfo(world, P.Attachment1);
  const p0 = A.pos, p3 = B.pos, p1 = p0.clone().addScaledVector(A.axis, P.CurveSize0), p2 = p3.clone().addScaledVector(B.axis, -P.CurveSize1);
  const seg = Math.max(1, Math.min(100, P.Segments | 0));
  const pairs = [];
  const bez = (t) => {
    const u = 1 - t;
    return V3().addScaledVector(p0, u * u * u).addScaledVector(p1, 3 * u * u * t).addScaledVector(p2, 3 * u * t * t).addScaledVector(p3, t * t * t);
  };
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, p = bez(t), tan = bez(Math.min(1, t + 0.01)).sub(bez(Math.max(0, t - 0.01))).normalize();
    let side;
    if (P.FaceCamera) side = tan.clone().cross(tmpV2.copy(camera.position).sub(p)).normalize();
    else side = A.up.clone().lerp(B.up, t).cross(tan).cross(tan).negate().normalize();
    if (!side.lengthSq()) side.set(1, 0, 0);
    const w = (P.Width0 + (P.Width1 - P.Width0) * t) / 2;
    sampleColorLinear(P.Color, t, tmpC);
    const a = 1 - THREE.MathUtils.clamp(sampleNumber(P.Transparency, t), 0, 1);
    const lit = 1 - (P.LightInfluence ?? 0) * 0.2;
    pairs.push([p.clone().addScaledVector(side, -w), p.clone().addScaledVector(side, w), [tmpC.r * lit, tmpC.g * lit, tmpC.b * lit, a]]);
  }
  b.strip.mesh.material.uniforms.emission.value = THREE.MathUtils.clamp(P.LightEmission, 0, 1);
  b.strip.set(pairs);
}
function updateTrailPoints(world, t) {
  const P = t.props;
  const ok = P.Enabled && P.Attachment0?.world === world && P.Attachment1?.world === world;
  if (!ok) {
    t.points.length = 0;
    return;
  }
  const a = attachmentInfo(world, P.Attachment0).pos, b = attachmentInfo(world, P.Attachment1).pos;
  const last = t.points[t.points.length - 1];
  const mid = a.clone().add(b).multiplyScalar(0.5);
  if (!last || last.mid.distanceTo(mid) >= P.MinLength) t.points.push({ a, b, mid, time: world.time });
  else Object.assign(last, { a, b, mid, time: world.time });
  while (t.points.length && world.time - t.points[0].time > P.Lifetime) t.points.shift();
}
function drawTrail(world, t, camera) {
  const P = t.props, pts = t.points;
  t.strip.mesh.visible = pts.length > 1;
  if (pts.length < 2) return;
  const pairs = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const q = pts[i], k = THREE.MathUtils.clamp((world.time - q.time) / P.Lifetime, 0, 1);
    sampleColorLinear(P.Color, k, tmpC);
    const alpha = 1 - THREE.MathUtils.clamp(sampleNumber(P.Transparency, k), 0, 1);
    const ws = sampleNumber(P.WidthScale, k);
    let A = q.a, B = q.b;
    if (P.FaceCamera) {
      const next = pts[Math.max(0, i - 1)].mid, prev = pts[Math.min(pts.length - 1, i + 1)].mid;
      const tan = prev.clone().sub(next).normalize();
      const side = tan.cross(tmpV2.copy(camera.position).sub(q.mid)).normalize().multiplyScalar(q.a.distanceTo(q.b) / 2 * ws);
      A = q.mid.clone().sub(side);
      B = q.mid.clone().add(side);
    } else if (ws !== 1) {
      A = q.mid.clone().lerp(q.a, ws);
      B = q.mid.clone().lerp(q.b, ws);
    }
    pairs.push([A, B, [tmpC.r, tmpC.g, tmpC.b, alpha]]);
  }
  t.strip.mesh.material.uniforms.emission.value = THREE.MathUtils.clamp(P.LightEmission, 0, 1);
  t.strip.set(pairs);
}

// ── Highlight: Umriss um die ganze Silhouette und Füllung ──
// Wie in Roblox: Erst schreiben alle Teile eine Maske (Stencil), dann wird der vergrößerte Umriss nur
// außerhalb der Maske gezeichnet. So entsteht ein Rand um die Figur statt um jedes einzelne Teil.
let stencilRef = 1;
function drawHighlight(world, h) {
  const P = h.props, target = P.Adornee || h.parent;
  const parts = !P.Enabled || !target ? [] : (PART_CLASSES.has(target.ClassName) ? [target] : target.descendants().filter((d) => d.mesh));
  const seen = new Set();
  h.hl.ref ||= (stencilRef = (stencilRef % 250) + 1);
  const ref = h.hl.ref;
  for (const part of parts) {
    if (!part.mesh || !part.mesh.visible) continue;
    seen.add(part);
    let e = h.hl.map.get(part);
    if (!e) {
      const mask = new THREE.Mesh(part.mesh.geometry, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false, stencilWrite: true, stencilRef: ref, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp }));
      const outline = new THREE.Mesh(part.mesh.geometry, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, depthTest: false, toneMapped: false, stencilWrite: true, stencilRef: ref, stencilFunc: THREE.NotEqualStencilFunc, stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.KeepStencilOp }));
      const fill = new THREE.Mesh(part.mesh.geometry, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, toneMapped: false }));
      mask.renderOrder = 18;
      outline.renderOrder = 19;
      fill.renderOrder = 20;
      for (const m of [mask, outline, fill]) {
        m.matrixAutoUpdate = false;
        h.hl.group.add(m);
      }
      e = { mask, outline, fill };
      h.hl.map.set(part, e);
    }
    e.mask.geometry = e.outline.geometry = e.fill.geometry = part.mesh.geometry;
    part.mesh.matrix.decompose(tmpV, tmpQ, tmpV2);
    const grow = (v) => (Math.abs(v) + 0.22) / Math.max(Math.abs(v), 0.01);
    e.outline.matrix.compose(tmpV, tmpQ, V3(tmpV2.x * grow(tmpV2.x), tmpV2.y * grow(tmpV2.y), tmpV2.z * grow(tmpV2.z)));
    e.mask.matrix.copy(part.mesh.matrix);
    e.fill.matrix.copy(part.mesh.matrix);
    e.outline.material.color.copy(P.OutlineColor.color);
    e.outline.material.opacity = 1 - P.OutlineTransparency;
    e.fill.material.color.copy(P.FillColor.color);
    e.fill.material.opacity = 1 - P.FillTransparency;
    e.fill.visible = P.FillTransparency < 0.999;
    e.outline.visible = e.mask.visible = P.OutlineTransparency < 0.999;
  }
  for (const [part, e] of h.hl.map) {
    if (seen.has(part)) continue;
    h.hl.group.remove(e.mask, e.outline, e.fill);
    for (const m of [e.mask, e.outline, e.fill]) m.material.dispose();
    h.hl.map.delete(part);
  }
}

// ── BillboardGui und SurfaceGui ──
function drawGuiContainer(world, g, camera, viewportHeight) {
  const P = g.props, gui = g.gui, host = P.Adornee || g.parent;
  const live = P.Enabled && host && host.world === world;
  gui.mesh.visible = !!live;
  if (!live) return;
  if (g.ClassName === 'SurfaceGui') {
    if (!host.mesh) {
      gui.mesh.visible = false;
      return;
    }
    const s = host.props.Size, face = P.Face || 'Front', n = FACE[face];
    const w = Math.abs(n[0]) ? s.z : s.x, h = Math.abs(n[1]) ? s.z : s.y;
    if (gui.dirty) {
      gui.canvas.width = Math.min(1024, Math.max(16, Math.round(w * 48)));
      gui.canvas.height = Math.min(1024, Math.max(16, Math.round(h * 48)));
      drawGui(gui.canvas, g, knownImage);
      gui.tex.needsUpdate = true;
      gui.dirty = false;
    }
    const local = new THREE.Matrix4().lookAt(V3(), V3(...n), Math.abs(n[1]) > 0.5 ? V3(0, 0, -1) : UP);
    local.premultiply(new THREE.Matrix4().makeTranslation((n[0] * s.x) / 2 * 1.002, (n[1] * s.y) / 2 * 1.002, (n[2] * s.z) / 2 * 1.002));
    local.multiply(new THREE.Matrix4().makeRotationY(Math.PI)).multiply(new THREE.Matrix4().makeScale(w, h, 1));
    gui.mesh.matrix.copy(host.props.CFrame).multiply(local);
    return;
  }
  // BillboardGui: zur Kamera gedreht; Size.Scale in Studs, Size.Offset in Bildschirmpixeln
  const [xs, xo, ys, yo] = P.Size;
  const anchor = V3().setFromMatrixPosition(world.worldCFrame(host, tmpM)).add(P.StudsOffsetWorldSpace);
  const camQ = camera.quaternion;
  anchor.add(P.StudsOffset.clone().applyQuaternion(camQ));
  const dist = anchor.distanceTo(camera.position);
  if (dist > P.MaxDistance) {
    gui.mesh.visible = false;
    return;
  }
  const perPx = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * dist) / Math.max(1, viewportHeight);
  const W = xs + xo * perPx, H = ys + yo * perPx;
  if (gui.dirty) {
    const pxW = xs ? Math.min(1024, xs * 48) + xo : xo * 2, pxH = ys ? Math.min(1024, ys * 48) + yo : yo * 2;
    gui.canvas.width = Math.max(8, Math.round(pxW));
    gui.canvas.height = Math.max(8, Math.round(pxH));
    drawGui(gui.canvas, g, knownImage);
    gui.tex.needsUpdate = true;
    gui.dirty = false;
  }
  gui.mesh.matrix.compose(anchor, camQ, V3(Math.max(W, 0.001), Math.max(H, 0.001), 1));
  gui.mesh.material.depthTest = !P.AlwaysOnTop;
  gui.mesh.renderOrder = P.AlwaysOnTop ? 30 : 5;
}

// Partikel sofort ausstoßen (ParticleEmitter:Emit)
export function emitParticles(inst, n) {
  if (inst.sim && inst.world) inst.sim.emit(inst.world, n);
}
export { PART_CLASSES };
