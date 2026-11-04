// Aura-Vorschau 1:1 wie in Roblox: Die Seite führt dieselben Module AuraData und AuraFx aus, die der
// Installer nach Studio bringt, und zeichnet das Ergebnis mit der Roblox-Engine (js/rbx).

import * as THREE from 'three';
import { createLua } from '../../js/rbx/lua.js';
import { RbxWorld } from '../../js/rbx/engine.js';
import { auraDataSource, AURA_FX } from '../../roblox/js/auraLuau.js';
import { AURAS, RARITIES, THEMES, BONUSES } from './auras.js';

// Vorschau-Helfer in Luau: Figur bauen, Aura daran, jedes Bild AuraFx.Step
const PREVIEW = `
local root = game:GetService("ReplicatedStorage"):WaitForChild("CoinmasterAdventure")
local AuraData = require(root.AuraData)
local AuraFx = require(root.AuraFx)
local previews = {}
function __buildAura(key, auraId)
	local folder = Instance.new("Folder")
	folder.Name = "Vorschau"
	folder.Parent = workspace
	local rootCFrame = CFrame.new(0, 3, 0)
	local figure = AuraFx.BuildDummy(rootCFrame, folder)
	local aura = AuraData.ById[auraId]
	local handle = AuraFx.Build(aura, folder, { Character = figure })
	previews[key] = { handle = handle, folder = folder, root = rootCFrame }
	AuraFx.Step(handle, rootCFrame, 0)
end
function __stepAura(key, t)
	local e = previews[key]
	if e then AuraFx.Step(e.handle, e.root, t) end
end
function __dropAura(key)
	local e = previews[key]
	if e then e.folder:Destroy() previews[key] = nil end
end
`;

let luaReady = null;
export function auraLua() {
  luaReady ||= (async () => {
    const lua = await createLua();
    lua.call('__addModule', 'AuraData', auraDataSource({ AURAS, RARITIES, THEMES, BONUSES }));
    lua.call('__addModule', 'AuraFx', AURA_FX);
    lua.run(PREVIEW, 'Aura-Vorschau');
    return lua;
  })();
  return luaReady;
}

// Grauer Boden wie die Baseplate in einem neuen Roblox-Ort
function baseplate(world) {
  world.addStaticParts([{ shape: 'Block', pos: [0, -0.5, 0], rot: [1, 0, 0, 0, 1, 0, 0, 0, 1], size: [48, 1, 48], color: '#5b5d69', material: 'Plastic', transparency: 0 }]);
}

let nextKey = 1;
export async function createAuraPreview(aura) {
  const lua = await auraLua();
  const world = new RbxWorld({ shadows: true });
  world.setShadowArea(new THREE.Vector3(0, 3, 0), 9);
  baseplate(world);
  const key = 'a' + nextKey++;
  lua.setWorld(world);
  lua.call('__buildAura', key, aura.id);
  return {
    world,
    aura,
    step(t, dt) {
      lua.call('__stepAura', key, t);
      world.update(dt);
    },
    dispose() {
      lua.call('__dropAura', key);
      world.dispose();
    },
  };
}
