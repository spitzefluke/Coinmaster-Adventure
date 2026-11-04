// Münz-Vorschau 1:1 wie in Roblox: Die Seite führt dieselben Module CoinBuilder und MutationFx aus,
// die der Installer nach Studio bringt, und zeichnet das Ergebnis mit der Roblox-Engine (js/rbx).
// Das Motiv erscheint als Decal, so wie nach dem Hochladen der Motiv-PNGs (DecalId in CoinData).

import * as THREE from 'three';
import { createLua } from '../../js/rbx/lua.js';
import { RbxWorld, registerImage } from '../../js/rbx/engine.js';
import { coinDataSource, mutationDataSource, COIN_BUILDER, MUTATION_FX } from '../../roblox/js/luau.js';
import { TIERS, COINS, tierById } from './coins.js';
import { MUTATIONS, WEATHER, WEATHER_MS } from './mutations.js';
import { renderEmblem } from './emblems.js';
import { pixelRatio } from '../../js/settings.js';

// In der Vorschau hat jede Münze eine „hochgeladene“ Decal-ID: 9000 + Nummer
export const PREVIEW_DECAL = 9000;

const PREVIEW = `
local root = game:GetService("ReplicatedStorage"):WaitForChild("CoinmasterAdventure")
local CoinData = require(root.CoinData)
local CoinBuilder = require(root.CoinBuilder)
local MutationFx = require(root.MutationFx)
for i, coin in ipairs(CoinData.Coins) do
	coin.DecalId = ${PREVIEW_DECAL} + i
end
local previews = {}
function __buildCoin(key, index, mutationId)
	local model = CoinBuilder.Build(CoinData.Coins[index])
	model.Parent = workspace
	if mutationId ~= "" then
		MutationFx.Apply(model, mutationId)
	end
	previews[key] = model
end
function __dropCoin(key)
	local m = previews[key]
	if m then
		m:Destroy()
		previews[key] = nil
	end
end
`;

let luaReady = null;
export function coinLua() {
  luaReady ||= (async () => {
    const lua = await createLua();
    lua.call('__addModule', 'CoinData', coinDataSource({ TIERS, COINS }));
    lua.call('__addModule', 'MutationData', mutationDataSource({ MUTATIONS, WEATHER, WEATHER_MS }));
    lua.call('__addModule', 'CoinBuilder', COIN_BUILDER);
    lua.call('__addModule', 'MutationFx', MUTATION_FX);
    lua.run(PREVIEW, 'Münz-Vorschau');
    return lua;
  })();
  return luaReady;
}

// Motiv-Bild einer Münze (dasselbe wie im ZIP zum Hochladen)
const emblemDone = new Set();
export function ensureEmblem(index) {
  if (emblemDone.has(index)) return;
  const c = COINS[index];
  registerImage(`rbxassetid://${PREVIEW_DECAL + index + 1}`, renderEmblem(c.emblem, 512, c.metal).colorCv);
  emblemDone.add(index);
}

// Abstand der Kamera je Stufe: Effekte wie Flügel und Ringe brauchen Platz
export const COIN_CAMERA = [10, 10, 10.5, 12, 12.5, 15, 15.5, 15.5, 16, 15];

let nextKey = 1;
// Münze in einer eigenen Roblox-Welt (ohne Himmel, transparenter Hintergrund)
export async function createRobloxCoin(coin, { mutation = null, shadows = false } = {}) {
  const lua = await coinLua();
  const index = COINS.indexOf(coin);
  ensureEmblem(index);
  const world = new RbxWorld({ shadows, sky: false });
  world.setShadowArea(new THREE.Vector3(), 6);
  const key = 'c' + nextKey++;
  lua.setWorld(world);
  lua.call('__buildCoin', key, index + 1, mutation || '');
  return {
    world,
    coin,
    tier: tierById[coin.tier],
    distance: COIN_CAMERA[tierById[coin.tier].index],
    step(dt) {
      world.update(dt);
    },
    dispose() {
      lua.call('__dropCoin', key);
      world.dispose();
    },
  };
}

// Renderer für Roblox-Vorschauen (sRGB, ohne Tonemapping, Stencil für Highlights)
export function rbxRenderer(canvas, { shadows = false } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, stencil: true });
  r.setPixelRatio(pixelRatio());
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NoToneMapping;
  r.shadowMap.enabled = shadows;
  r.setClearColor(0x000000, 0);
  return r;
}

// Kamera um die Münze kreisen lassen: Roblox-Münzen zeigen ihre Seiten entlang der X-Achse
export function orbitCoin(camera, angle, tilt, dist) {
  camera.position.set(Math.cos(angle) * Math.cos(tilt) * dist, Math.sin(tilt) * dist, Math.sin(angle) * Math.cos(tilt) * dist);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
}
