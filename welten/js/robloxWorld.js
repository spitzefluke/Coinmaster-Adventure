// Welt 1:1 wie in Roblox: dieselben Teile wie der .rbxmx-Export (worldToParts), dasselbe Licht
// (worldLighting) und das Wetter aus dem Roblox-Modul WeatherFx, ausgeführt mit Luau im Browser.
// Alles in Studs.

import * as THREE from 'three';
import { RbxWorld, Inst, rgb, hexColor } from '../../js/rbx/engine.js';
import { createLua } from '../../js/rbx/lua.js';
import { worldToParts } from '../../roblox/js/worldParts.js';
import { mutationDataSource, WEATHER_FX } from '../../roblox/js/luau.js';
import { worldFxSource } from '../../roblox/js/worldFxLuau.js';
import { WORLDS } from './worlds.js';
import { skipAnimations } from '../../js/settings.js';
import { MUTATIONS, WEATHER, WEATHER_RARITIES, WEATHER_BLOCK, WEATHER_WARN } from '../../muenzen/js/mutations.js';

const partsCache = new Map();
export function partsOf(world) {
  if (!partsCache.has(world.id)) partsCache.set(world.id, worldToParts(world));
  return partsCache.get(world.id);
}

const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const cframe = (pos, r) => new THREE.Matrix4().set(r[0], r[1], r[2], pos[0], r[3], r[4], r[5], pos[1], r[6], r[7], r[8], pos[2], 0, 0, 0, 1);
const ID = [1, 0, 0, 0, 1, 0, 0, 0, 1];

function inst(cls, props, parent) {
  const i = new Inst(cls);
  for (const [k, v] of Object.entries(props)) i.props[k] = v;
  if (parent) i.setParent(parent);
  return i;
}

// Lighting-Werte und Atmosphere wie im Ordner „Licht“ des Exports
export function applyLighting(rw, L) {
  const P = rw.lighting.props;
  P.ClockTime = L.ClockTime;
  P.Brightness = L.Brightness;
  P.Ambient = hexColor(L.Ambient);
  P.OutdoorAmbient = hexColor(L.OutdoorAmbient);
  P.FogColor = hexColor(L.FogColor);
  P.FogStart = L.FogStart;
  P.FogEnd = L.FogEnd;
  let atm = rw.lighting.children.find((c) => c.ClassName === 'Atmosphere');
  if (!atm) atm = inst('Atmosphere', {}, rw.lighting);
  const a = L.atmosphere;
  Object.assign(atm.props, { Density: a.Density, Offset: a.Offset, Color: hexColor(a.Color), Decay: hexColor(a.Decay), Glare: a.Glare, Haze: a.Haze });
}

// Baut die Welt in einer Roblox-Engine-Welt; gibt { rw, data } zurück
export function buildRobloxWorld(world, { shadows = true } = {}) {
  const data = partsOf(world);
  const rw = new RbxWorld({ shadows });
  rw.setShadowArea(new THREE.Vector3(0, 0, 0), data.meta.radius * 1.05);
  const model = inst('Model', { Name: 'Welt_' + world.name }, rw.workspace);
  // Teile mit Schrift (SurfaceGui) einzeln, alle anderen gebündelt
  const plain = [], signs = [];
  for (const p of [...data.parts, ...data.sky]) (p.text ? signs : plain).push(p);
  rw.addStaticParts(plain);
  for (const p of signs) {
    const part = inst(p.className || 'Part', {
      Name: p.name || 'Schild', Size: v3(p.size), CFrame: cframe(p.pos, p.rot), Color: hexColor(p.color), Material: p.material, Transparency: p.transparency || 0,
      Shape: p.shape === 'Cylinder' ? 'Cylinder' : 'Block', Anchored: true,
    }, model);
    if (p.shape === 'Ellipsoid') inst('SpecialMesh', { MeshType: 'Sphere' }, part);
    const gui = inst('SurfaceGui', { Name: 'Schild', Face: 'Back', LightInfluence: 0.2 }, part);
    const c = new THREE.Color(p.textColor).convertLinearToSRGB();
    inst('TextLabel', { Name: 'Text', Size: [1, 0, 1, 0], BackgroundTransparency: 1, Text: p.text, TextScaled: true, TextColor3: hexColor(p.textColor), TextStrokeTransparency: 0.6, Font: 'Legacy' }, gui);
    void c;
  }
  // Lichter und Weltpartikel wie im Ordner „Effekte“
  for (const l of data.lights) {
    const holder = inst('Part', { Name: 'Licht', Size: v3([1, 1, 1]), CFrame: cframe(l.pos, ID), Transparency: 1, Anchored: true, CanCollide: false }, model);
    inst('PointLight', { Color: hexColor(l.color), Brightness: l.brightness, Range: l.range }, holder);
  }
  for (const e of data.emitters || (data.emitter ? [data.emitter] : [])) {
    const holder = inst('Part', { Name: 'Partikelquelle', Size: v3(e.size), CFrame: cframe(e.pos, ID), Transparency: 1, Anchored: true, CanCollide: false }, model);
    const cols = e.colors.slice(0, 3).map(hexColor);
    inst('ParticleEmitter', {
      Name: e.name || 'Weltpartikel',
      Color: cols.length === 1 ? [[0, cols[0]], [1, cols[0]]] : cols.map((c, i) => [i / (cols.length - 1), c]),
      Size: [[0, e.particleSize], [1, e.particleSize * 0.8]],
      Transparency: [[0, 0.1], [0.8, 0.3], [1, 1]],
      Lifetime: e.lifetime, Rate: e.rate, Speed: e.speed, SpreadAngle: e.spread, EmissionDirection: e.direction,
      LightEmission: e.lightEmission, RotSpeed: [-40, 40], Rotation: [0, 360], Texture: 'rbxasset://textures/particles/sparkles_main.dds',
    }, holder);
  }
  applyLighting(rw, data.lighting);
  return { rw, data, model };
}

// ── Luau für Wetter (WeatherFx) und Figuren (AuraFx.BuildDummy) ──
let luaReady = null;
export function worldLua() {
  luaReady ||= (async () => {
    const lua = await createLua();
    lua.call('__addModule', 'MutationData', mutationDataSource({ MUTATIONS, WEATHER, WEATHER_RARITIES, WEATHER_BLOCK, WEATHER_WARN }));
    lua.call('__addModule', 'WorldFx', worldFxSource({ WORLDS }));
    lua.run(`
      local root = game:GetService("ReplicatedStorage"):WaitForChild("CoinmasterAdventure")
      function __weather(id, instant)
        local fx = require(root.WeatherFx)
        fx.Apply(id, instant)
      end
      local worldFx = nil
      function __worldFx(id)
        if worldFx then worldFx.Destroy() worldFx = nil end
        worldFx = require(root.WorldFx).Apply(id, Vector3.new(0, 0, 0), workspace)
      end
      function __worldFxReset()
        if worldFx then pcall(worldFx.Destroy) worldFx = nil end
      end
      function __weatherReset()
        local m = root:FindFirstChild("WeatherFx")
        if m then pcall(function() require(m).Apply("klar", true) end) end
      end
    `, 'Wetter-Vorschau');
    return lua;
  })();
  return luaReady;
}

// Umgebung der Welt (WorldFx): Himmel, Fernkulisse, Partikel und Leben, ruhig animiert
export async function showWorldFx(rw, worldId) {
  const lua = await worldLua();
  lua.setWorld(rw);
  lua.call('__worldFx', worldId);
  return lua;
}

// Wetter in einer Welt anzeigen: neues WeatherFx-Modul (merkt sich das Licht dieser Welt als Grundlage)
// In derselben Welt wechselt das Wetter sanft (WeatherFx blendet über); in einer neuen Welt beginnt es frisch.
export async function showWeather(rw, weatherId, { instant = skipAnimations() } = {}) {
  const lua = await worldLua();
  if (lua.weatherWorld !== rw) {
    lua.call('__weatherReset');
    lua.setWorld(rw);
    lua.call('__addModule', 'WeatherFx', WEATHER_FX);
    lua.weatherWorld = rw;
  } else {
    lua.setWorld(rw);
  }
  lua.call('__weather', weatherId, instant);
  return lua;
}

// Roblox-Figur (R6) zum Größenvergleich: Teile wie AuraFx.BuildDummy, Füße auf pos
export function addFigure(rw, pos, faceTo) {
  const root = new THREE.Matrix4().lookAt(new THREE.Vector3(pos[0], 0, pos[2]), new THREE.Vector3(faceTo[0], 0, faceTo[2]), new THREE.Vector3(0, 1, 0));
  // Roblox-Figuren schauen nach −Z: lookAt liefert +Z zum Ziel weg, also um 180° drehen
  root.multiply(new THREE.Matrix4().makeRotationY(Math.PI));
  root.setPosition(pos[0], pos[1] + 3, pos[2]);
  const model = inst('Model', { Name: 'Groessenvergleich' }, rw.workspace);
  const skin = hexColor('#f2c8a0'), shirt = hexColor('#3d4f78'), pants = hexColor('#2a2f40');
  const block = (name, size, off, color) => inst('Part', { Name: name, Size: v3(size), CFrame: root.clone().multiply(new THREE.Matrix4().makeTranslation(...off)), Color: color, Material: 'SmoothPlastic', Anchored: true }, model);
  block('Left Leg', [1, 2, 1], [-0.5, -2, 0], pants);
  block('Right Leg', [1, 2, 1], [0.5, -2, 0], pants);
  block('Torso', [2, 2, 1], [0, 0, 0], shirt);
  block('Left Arm', [1, 2, 1], [-1.5, 0, 0], skin);
  block('Right Arm', [1, 2, 1], [1.5, 0, 0], skin);
  const head = block('Head', [2, 1, 1], [0, 1.5, 0], skin);
  inst('SpecialMesh', { MeshType: 'Head', Scale: v3([1.25, 1.25, 1.25]) }, head);
  inst('Decal', { Name: 'face', Texture: 'rbxasset://textures/face.png', Face: 'Front' }, head);
  // Leuchtsäule und Schild, damit man die kleine Figur findet (nur in der Vorschau)
  const beam = inst('Part', { Name: 'Markierung', Size: v3([0.6, 60, 0.6]), CFrame: new THREE.Matrix4().makeTranslation(pos[0], pos[1] + 36, pos[2]), Color: hexColor('#00a2ff'), Material: 'Neon', Transparency: 0.45, Anchored: true }, model);
  const tag = inst('BillboardGui', { Size: [0, 150, 0, 34], StudsOffsetWorldSpace: new THREE.Vector3(0, 4.2, 0), AlwaysOnTop: true }, head);
  const label = inst('TextLabel', { Size: [1, 0, 1, 0], BackgroundColor3: rgb(0.06, 0.05, 0.08), BackgroundTransparency: 0.1, Text: 'Roblox-Figur', TextScaled: true, Font: 'GothamBold', TextColor3: rgb(1, 1, 1) }, tag);
  inst('UICorner', { CornerRadius: [1, 0] }, label);
  inst('UIStroke', { Color: hexColor('#00a2ff'), Thickness: 3, ApplyStrokeMode: 'Border' }, label);
  void beam;
  return model;
}
