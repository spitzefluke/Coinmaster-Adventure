// Eier, Schlüpfen und Haustiere 1:1 wie in Roblox: Die Seite führt EggBuilder, PetBuilder und HatchFx aus
// dem Installer aus. Die Haustiere entstehen aus denselben Teilen wie die Datei Haustiere.rbxmx
// (roblox/js/petParts.js) und liegen wie in Roblox im Ordner „Haustiere“.

import * as THREE from 'three';
import { createLua } from '../../js/rbx/lua.js';
import { RbxWorld } from '../../js/rbx/engine.js';
import { eggDataSource, EGG_BUILDER } from '../../roblox/js/luau.js';
import { petDataSource, PET_BUILDER, HATCH_FX } from '../../roblox/js/petLuau.js';
import { petToParts } from '../../roblox/js/petParts.js';
import { EGGS } from './eggs.js';
import { PETS } from '../../haustiere/js/pets.js';

const PREVIEW = `
local root = game:GetService("ReplicatedStorage"):WaitForChild("CoinmasterAdventure")
local EggData = require(root.EggData)
local EggBuilder = require(root.EggBuilder)
local HatchFx = require(root.HatchFx)
local pets = Instance.new("Folder")
pets.Name = "Haustiere"
pets.Parent = root
__petParts = {}

-- Tier wie in Haustiere.rbxmx: Model mit unsichtbarer Root und Teilen
function __definePet(id, height)
	if pets:FindFirstChild(id) then return end
	local model = Instance.new("Model")
	model.Name = id
	local rootPart = Instance.new("Part")
	rootPart.Name = "Root"
	rootPart.Anchored = true
	rootPart.CanCollide = false
	rootPart.Transparency = 1
	rootPart.Size = Vector3.new(2, height, 2)
	rootPart.CFrame = CFrame.new(0, height / 2, 0)
	rootPart.Parent = model
	for _, d in ipairs(__petParts[id]) do
		local p = Instance.new(d[1] == "Wedge" and "WedgePart" or "Part")
		p.Anchored = true
		p.CanCollide = false
		if d[1] ~= "Wedge" then
			p.Shape = d[1] == "Cylinder" and Enum.PartType.Cylinder or d[1] == "Ball" and Enum.PartType.Ball or Enum.PartType.Block
		end
		p.Size = Vector3.new(d[2], d[3], d[4])
		p.CFrame = CFrame.new(d[5], d[6], d[7], d[8], d[9], d[10], d[11], d[12], d[13], d[14], d[15], d[16])
		p.Color = Color3.fromHex(d[17])
		p.Material = Enum.Material[d[18]]
		p.Transparency = d[19]
		if d[1] == "Ellipsoid" then
			local m = Instance.new("SpecialMesh")
			m.MeshType = Enum.MeshType.Sphere
			m.Parent = p
		end
		p.Parent = model
	end
	model.PrimaryPart = rootPart
	model.Parent = pets
end

local previews = {}
function __buildEgg(key, eggId)
	local model = EggBuilder.Build(EggData.ById[eggId])
	model.Parent = workspace
	previews[key] = model
end
function __hatch(key, eggId, petId)
	local holder = Instance.new("Folder")
	holder.Name = "Vorschau"
	holder.Parent = workspace
	previews[key] = holder
	task.spawn(function()
		HatchFx.Play(eggId, petId, { Parent = holder, OnPhase = function(phase) if __hatchPhase then __hatchPhase(key, phase) end end })
		if __hatchDone then __hatchDone(key) end
	end)
end
function __drop(key)
	local m = previews[key]
	if m then m:Destroy() previews[key] = nil end
end
`;

const f = (n) => String(Math.round(n * 1000) / 1000);
function petChunk(id) {
  const { parts, height } = petToParts(PETS.find((p) => p.id === id));
  const rows = parts.map((p) => `{${JSON.stringify(p.shape)},${p.size.map(f)},${p.pos.map(f)},${p.rot.map(f)},${JSON.stringify(p.color)},${JSON.stringify(p.material)},${f(p.transparency || 0)}}`);
  return { code: `__petParts[${JSON.stringify(id)}] = {${rows.join(',')}}`, height };
}

let luaReady = null;
export function eggLua() {
  luaReady ||= (async () => {
    const lua = await createLua();
    lua.call('__addModule', 'EggData', eggDataSource({ EGGS }));
    lua.call('__addModule', 'PetData', petDataSource({ PETS }));
    lua.call('__addModule', 'EggBuilder', EGG_BUILDER);
    lua.call('__addModule', 'PetBuilder', PET_BUILDER);
    lua.call('__addModule', 'HatchFx', HATCH_FX);
    lua.run(PREVIEW, 'Ei-Vorschau');
    return lua;
  })();
  return luaReady;
}

const defined = new Set();
function definePet(lua, id) {
  if (defined.has(id)) return;
  const { code, height } = petChunk(id);
  lua.run(code, 'Haustier ' + id);
  lua.call('__definePet', id, height);
  defined.add(id);
}

let nextKey = 1;
function makeWorld({ shadows, sky }) {
  const world = new RbxWorld({ shadows, sky });
  world.setShadowArea(new THREE.Vector3(0, 2, 0), 9);
  return world;
}

// Ei auf seinem Sockel (EggBuilder); parts = Anzahl der Teile
export async function createRobloxEgg(egg, { shadows = false } = {}) {
  const lua = await eggLua();
  const world = makeWorld({ shadows, sky: false });
  const key = 'e' + nextKey++;
  lua.setWorld(world);
  lua.call('__buildEgg', key, egg.id);
  return {
    world,
    step(dt) {
      world.update(dt);
    },
    dispose() {
      lua.call('__drop', key);
      world.dispose();
    },
  };
}

// Schlüpfen: HatchFx.Play wie im Spiel (das Tier ist vorher gezogen); onPhase meldet die fünf Akte
const doneHandlers = new Map();
const phaseHandlers = new Map();
export async function createRobloxHatch(egg, pet, { shadows = true, onDone, onPhase } = {}) {
  const lua = await eggLua();
  if (!lua.hatchHook) {
    lua.register('__hatchDone', (key) => doneHandlers.get(key)?.());
    lua.register('__hatchPhase', (key, phase) => phaseHandlers.get(key)?.(phase));
    lua.hatchHook = true;
  }
  definePet(lua, pet.id);
  const world = makeWorld({ shadows, sky: false });
  const key = 'h' + nextKey++;
  let done = false;
  doneHandlers.set(key, () => {
    done = true;
    onDone?.();
  });
  if (onPhase) phaseHandlers.set(key, onPhase);
  lua.setWorld(world);
  lua.call('__hatch', key, egg.id, pet.id);
  return {
    world,
    lua,
    get done() {
      return done;
    },
    // vorspulen: Lua-Zeit laufen lassen, bis HatchFx fertig ist
    skip() {
      for (let i = 0; i < 600 && !done; i++) {
        lua.frame(1 / 30);
        world.update(1 / 30);
      }
    },
    step(dt) {
      world.update(dt);
    },
    dispose() {
      doneHandlers.delete(key);
      phaseHandlers.delete(key);
      lua.call('__drop', key);
      world.dispose();
    },
  };
}

// Kamera vor das Ei (Roblox-Modelle schauen nach −Z)
export function orbitEgg(camera, angle, tilt, dist, y = 2.6) {
  camera.position.set(Math.sin(angle) * Math.cos(tilt) * dist, y + Math.sin(tilt) * dist, -Math.cos(angle) * Math.cos(tilt) * dist);
  camera.lookAt(0, y, 0);
  camera.updateMatrixWorld();
}
