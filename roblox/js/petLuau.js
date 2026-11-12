// Haustiere und Schlüpfen für Roblox Studio: PetData (Tiere je Ei, Chancen, Ziehen), PetBuilder
// (Tier aus dem Ordner „Haustiere“ klonen) und HatchFx (Schlüpf-Animation mit Tweens und Partikeln).
// Reiner Text wie luau.js, damit es auch in Node prüfbar ist.

const str = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
const num = (n) => String(Math.round(n * 1000) / 1000);

const HEADER = (title) => `-- Coinmaster Adventure · ${title}
-- Automatisch erzeugt von der Coinmaster-Webseite. Änderungen besser dort machen
-- und neu übertragen, sonst gehen sie beim nächsten Import verloren.
`;

export function petDataSource({ PETS }) {
  const pets = PETS.map((p) => `{ Id = ${str(p.id)}, Name = ${str(p.name)}, Egg = ${str(p.egg)}, Chance = ${num(p.chance)}, Rarity = ${str(p.rarityName)}, Epic = ${p.epic ? 'true' : 'false'}, Glow = Color3.fromHex(${str(p.glow)}), Text = ${str(p.text)} }`);
  return `${HEADER('Haustiere')}
-- ${PETS.length} Haustiere, neun pro Ei (eins pro Seltenheit). Chance = Drop-Chance in Prozent, in jedem Ei gleich.
-- Rarity = Seltenheit (Common … Secret), Epic = ab Legendary. Modelle gibt es noch nicht: PetBuilder baut eine
-- leuchtende Kugel in der Farbe der Seltenheit, bis Modelle im Ordner „Haustiere“ liegen.

local PetData = {}

PetData.Pets = {
	${pets.join(',\n\t')},
}

PetData.ById = {}
PetData.ByEgg = {}
for _, pet in ipairs(PetData.Pets) do
	PetData.ById[pet.Id] = pet
	PetData.ByEgg[pet.Egg] = PetData.ByEgg[pet.Egg] or {}
	table.insert(PetData.ByEgg[pet.Egg], pet)
end

-- Ein Tier aus einem Ei ziehen (rng optional, z. B. Random.new())
function PetData.Roll(eggId, rng)
	local list = PetData.ByEgg[eggId]
	if not list then
		return nil
	end
	local r = (rng and rng:NextNumber() or math.random()) * 100
	for _, pet in ipairs(list) do
		r = r - pet.Chance
		if r <= 0 then
			return pet
		end
	end
	return list[#list]
end

return PetData
`;
}

export const PET_BUILDER = `${HEADER('Haustiere bauen')}
-- PetBuilder.Build(petId) klont das Tier aus ReplicatedStorage > CoinmasterAdventure > Haustiere (falls dort ein
-- Modell mit der Id liegt). Sonst gibt es eine leuchtende Kugel in der Farbe der Seltenheit als Ersatz.
-- Jedes Modell hat eine unsichtbare PrimaryPart „Root“; ihre Unterseite steht auf dem Boden.

local PetData = require(script.Parent.PetData)

local PetBuilder = {}

function PetBuilder.Build(petId)
	local folder = script.Parent:FindFirstChild("Haustiere")
	local source = folder and folder:FindFirstChild(petId)
	if source then
		local model = source:Clone()
		model:SetAttribute("PetId", petId)
		return model
	end
	local pet = PetData.ById[petId]
	local model = Instance.new("Model")
	model.Name = petId
	local root = Instance.new("Part")
	root.Name = "Root"
	root.Anchored = true
	root.CanCollide = false
	root.Transparency = 1
	root.Size = Vector3.new(2, 3, 2)
	root.CFrame = CFrame.new(0, 1.5, 0)
	root.Parent = model
	local ball = Instance.new("Part")
	ball.Name = "Ersatz"
	ball.Shape = Enum.PartType.Ball
	ball.Anchored = true
	ball.CanCollide = false
	ball.Material = Enum.Material.Neon
	ball.Color = pet and pet.Glow or Color3.new(1, 1, 1)
	ball.Size = Vector3.new(2.4, 2.4, 2.4)
	ball.CFrame = CFrame.new(0, 1.3, 0)
	ball.Parent = model
	model.PrimaryPart = root
	model:SetAttribute("PetId", petId)
	return model
end

return PetBuilder
`;

// HatchFx (Schlüpfen v2 in fünf Akten) liegt bei den Eiern in eggLuau.js
export { HATCH_FX } from './eggLuau.js';
