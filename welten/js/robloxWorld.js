// Welt 1:1 wie in Roblox: dieselben Teile wie der .rbxmx-Export (worldToParts), dasselbe Licht
// (worldLighting) und das Wetter aus dem Roblox-Modul WeatherFx, ausgeführt mit Luau im Browser.
// Alles in Studs.

import * as THREE from 'three';
import { RbxWorld, Inst, rgb, hexColor } from '../../js/rbx/engine.js';
import { createLua } from '../../js/rbx/lua.js';
import { worldToParts } from '../../roblox/js/worldParts.js';
import { skyboxFiles, dayNightAt } from './skyboxes.js';
import { mutationDataSource, WEATHER_FX } from '../../roblox/js/luau.js';
import { worldFxSource } from '../../roblox/js/worldFxLuau.js';
import { TELEPORT_FX } from '../../roblox/js/teleportLuau.js';
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
  // Himmelsbild: Sky wie das Licht-Skript es in Roblox aus dem Ordner „Himmelsbild“ baut
  let sky = rw.lighting.children.find((c) => c.ClassName === 'Sky');
  if (L.himmel) {
    const f = skyboxFiles(L.himmel.id), url = (p) => new URL('../../' + p, import.meta.url).href;
    if (!sky) sky = inst('Sky', {}, rw.lighting);
    Object.assign(sky.props, { SkyboxBk: url(f.seite), SkyboxFt: url(f.seite), SkyboxLf: url(f.seite), SkyboxRt: url(f.seite), SkyboxUp: url(f.oben), SkyboxDn: url(f.unten), CelestialBodiesShown: L.himmel.sun });
  } else if (sky) sky.setParent(null);
}

// Tag-Nacht-Wechsel in der Vorschau (gleicher Verlauf wie das Licht-Skript in Roblox): phase 0..1 eines Tages.
// Liefert den Nachtanteil (0 Tag … 1 Nacht).
export function applyDayNight(rw, L, phase) {
  if (!L.nacht) return 0;
  const { clock, night: k } = dayNightAt(phase, L.ClockTime);
  const P = rw.lighting.props, N = L.nacht;
  const mix = (a, b) => hexColor('#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString());
  P.ClockTime = clock % 24;
  P.Brightness = L.Brightness + (N.Brightness - L.Brightness) * k;
  P.Ambient = mix(L.Ambient, N.Ambient);
  P.OutdoorAmbient = mix(L.OutdoorAmbient, N.OutdoorAmbient);
  P.FogColor = mix(L.FogColor, N.FogColor);
  const atm = rw.lighting.children.find((c) => c.ClassName === 'Atmosphere');
  if (atm) Object.assign(atm.props, { Color: mix(L.atmosphere.Color, N.atmosphere.Color), Decay: mix(L.atmosphere.Decay, N.atmosphere.Decay), Glare: L.atmosphere.Glare * (1 - k), Haze: L.atmosphere.Haze + (N.atmosphere.Haze - L.atmosphere.Haze) * k });
  const sky = rw.lighting.children.find((c) => c.ClassName === 'Sky');
  if (sky && L.himmel?.night) {
    const f = skyboxFiles(L.himmel.id, k > 0.5), url = (p) => new URL('../../' + p, import.meta.url).href;
    if (sky.props.SkyboxBk !== url(f.seite)) Object.assign(sky.props, { SkyboxBk: url(f.seite), SkyboxFt: url(f.seite), SkyboxLf: url(f.seite), SkyboxRt: url(f.seite), SkyboxUp: url(f.oben), SkyboxDn: url(f.unten) });
  }
  return k;
}

// Baut die Welt in einer Roblox-Engine-Welt; gibt { rw, data } zurück
export function buildRobloxWorld(world, { shadows = true } = {}) {
  const data = partsOf(world);
  const rw = new RbxWorld({ shadows });
  rw.setShadowArea(new THREE.Vector3(0, 0, 0), data.meta.radius * 1.05);
  const model = inst('Model', { Name: 'Welt_' + world.name }, rw.workspace);
  // Teile mit Schrift (SurfaceGui) einzeln, alle anderen gebündelt
  // Ebenen: Welt (Insel und Bauten), Deko (Streu-Deko auf der Insel), Umgebung (Kulisse, Wolken, Schwebeinseln)
  // Die Werkstatt blendet Deko und Umgebung einzeln aus; die Himmelskuppel bleibt immer (sie ist der Himmel selbst).
  // Ebenen: Insel (Boden, Wege, Fels), Gebäude (alles Feste auf der Insel), Deko (Streu-Deko), Umgebung (Kulisse,
  // Wolken, Schwebeinseln). Die Werkstatt blendet sie einzeln aus; die Himmelskuppel bleibt (sie ist der Himmel selbst).
  const plain = [], bau = [], deko = [], around = [], signs = [];
  // mit Himmelsbild ist die Kuppel ausgeblendet (in Roblox macht das das Licht-Skript)
  const hideDome = !!data.lighting?.himmel;
  for (const p of data.parts) (p.text ? signs : p.deko ? deko : p.bau ? bau : plain).push(p);
  for (const p of data.sky) if (p.name === 'Himmelskuppel') { if (!hideDome) plain.push(p); } else (p.text ? signs : around).push(p);
  rw.addStaticParts(plain);
  const layers = { gebaeude: rw.addStaticParts(bau), deko: rw.addStaticParts(deko), umgebung: rw.addStaticParts(around) };
  // Schilder sind einzelne Teile (Schrift): je Ebene merken, die Werkstatt hängt sie zum Ausblenden ab
  const signParts = { gebaeude: [], deko: [], umgebung: [] };
  for (const p of signs) {
    const part = inst(p.className || 'Part', {
      Name: p.name || 'Schild', Size: v3(p.size), CFrame: cframe(p.pos, p.rot), Color: hexColor(p.color), Material: p.material, Transparency: p.transparency || 0,
      Shape: p.shape === 'Cylinder' ? 'Cylinder' : 'Block', Anchored: true,
    }, model);
    if (p.shape === 'Ellipsoid') inst('SpecialMesh', { MeshType: 'Sphere' }, part);
    const gui = inst('SurfaceGui', { Name: 'Schild', Face: 'Back', LightInfluence: 0.2 }, part);
    const c = new THREE.Color(p.textColor).convertLinearToSRGB();
    inst('TextLabel', { Name: 'Text', Size: [1, 0, 1, 0], BackgroundTransparency: 1, Text: p.text, TextScaled: true, TextColor3: hexColor(p.textColor), TextStrokeTransparency: 0.6, Font: 'Legacy' }, gui);
    const lay = data.sky.includes(p) ? 'umgebung' : p.deko ? 'deko' : p.bau ? 'gebaeude' : null;
    if (lay) signParts[lay].push(part);
    void c;
  }
  // Lichter und Weltpartikel wie im Ordner „Effekte“
  for (const l of data.lights) {
    const holder = inst('Part', { Name: 'Licht', Size: v3([1, 1, 1]), CFrame: cframe(l.pos, ID), Transparency: 1, Anchored: true, CanCollide: false }, model);
    inst('PointLight', { Color: hexColor(l.color), Brightness: l.brightness, Range: l.range }, holder);
  }
  for (const e of data.emitters || (data.emitter ? [data.emitter] : [])) {
    const holder = inst('Part', { Name: 'Partikelquelle', Size: v3(e.size), CFrame: cframe(e.pos, e.rot || ID), Transparency: 1, Anchored: true, CanCollide: false }, model);
    const cols = e.colors.slice(0, 3).map(hexColor);
    inst('ParticleEmitter', {
      Name: e.name || 'Weltpartikel',
      Color: cols.length === 1 ? [[0, cols[0]], [1, cols[0]]] : cols.map((c, i) => [i / (cols.length - 1), c]),
      Size: [[0, e.particleSize], [1, e.sizeEnd ?? e.particleSize * 0.8]],
      Transparency: e.transparency || [[0, 0.1], [0.8, 0.3], [1, 1]],
      Lifetime: e.lifetime, Rate: e.rate, Speed: e.speed, SpreadAngle: e.spread, EmissionDirection: e.direction,
      LightEmission: e.lightEmission, RotSpeed: e.rotSpeed || [-40, 40], Rotation: e.rotSpeed ? [0, 0] : [0, 360], Texture: 'rbxasset://textures/particles/sparkles_main.dds',
      ...(e.drag ? { Drag: e.drag } : {}),
      ...(e.squash ? { Squash: [[0, e.squash], [1, e.squash]] } : {}),
      ...(e.acceleration ? { Acceleration: v3(e.acceleration) } : {}),
    }, holder);
  }
  applyLighting(rw, data.lighting);
  // Ebene zeigen oder verstecken (Teile gebündelt, Schilder abhängen)
  const setLayer = (name, on) => {
    layers[name].visible = on;
    for (const s of signParts[name]) if ((s.parent === model) !== on) s.setParent(on ? model : null);
  };
  return { rw, data, model, layers, setLayer };
}

// ── Luau für Wetter (WeatherFx) und Figuren (AuraFx.BuildDummy) ──
let luaReady = null;
export function worldLua() {
  luaReady ||= (async () => {
    const lua = await createLua();
    lua.call('__addModule', 'MutationData', mutationDataSource({ MUTATIONS, WEATHER, WEATHER_RARITIES, WEATHER_BLOCK, WEATHER_WARN }));
    lua.call('__addModule', 'WorldFx', worldFxSource({ WORLDS }));
    lua.call('__addModule', 'TeleportFx', TELEPORT_FX);
    lua.register('__tpFlash', () => lua.onTeleportFlash?.());
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
      -- Teleport-Animation (TeleportFx): Abflug an der Portalscheibe, Ankunft an den Füßen
      function __tpDepart(px, py, pz, lx, ly, lz, r, g, b, radius)
        local center = CFrame.lookAt(Vector3.new(px, py, pz), Vector3.new(px + lx, py + ly, pz + lz))
        require(root.TeleportFx).Depart(center, Color3.new(r, g, b), radius, function() __tpFlash() end)
      end
      function __tpArrive(x, y, z, r, g, b)
        require(root.TeleportFx).Arrive(Vector3.new(x, y, z), Color3.new(r, g, b))
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

// Teleport-Animation in einer Welt abspielen (Luau-Modul TeleportFx, wie im Spiel)
export async function teleportDepart(rw, pos, look, color, radius, onFlash) {
  const lua = await worldLua();
  lua.setWorld(rw);
  lua.onTeleportFlash = onFlash;
  const c = new THREE.Color(color);
  lua.call('__tpDepart', pos[0], pos[1], pos[2], look[0], look[1], look[2], c.r, c.g, c.b, radius);
  return lua;
}
export async function teleportArrive(rw, feet, color) {
  const lua = await worldLua();
  lua.setWorld(rw);
  const c = new THREE.Color(color);
  lua.call('__tpArrive', feet[0], feet[1], feet[2], c.r, c.g, c.b);
  return lua;
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
