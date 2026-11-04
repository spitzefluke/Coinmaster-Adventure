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
  const pets = PETS.map((p) => `{ Id = ${str(p.id)}, Name = ${str(p.name)}, Egg = ${str(p.egg)}, Chance = ${num(p.chance)}, Epic = ${p.epic ? 'true' : 'false'}, Glow = Color3.fromHex(${str(p.glow)}), Text = ${str(p.text)} }`);
  return `${HEADER('Haustiere')}
-- ${PETS.length} Haustiere, sieben pro Ei. Chance = Schlupfchance innerhalb des Eis in Prozent.
-- Die Modelle liegen im Ordner „Haustiere“ (Datei Haustiere.rbxmx von der Webseite), PetBuilder klont sie.

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
-- PetBuilder.Build(petId) klont das Tier aus ReplicatedStorage > CoinmasterAdventure > Haustiere.
-- Fehlt der Ordner, gibt es eine leuchtende Kugel mit dem Namen als Ersatz.
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

export const HATCH_FX = `${HEADER('Schlüpfen')}
-- HatchFx.Play(eggId, petId, options) zeigt das Schlüpfen an einem Ort (options.CFrame = Boden unter dem Ei,
-- options.Parent = Elternteil, Standard workspace). Das Ei wackelt immer stärker, leuchtet auf, platzt in
-- einem Lichtblitz, und das Tier wächst heraus. Seltene Eier wackeln länger und platzen größer.
-- Läuft am besten auf dem Client (LocalScript). Gibt { Folder, Pet } zurück, sobald das Tier steht.

local TweenService = game:GetService("TweenService")
local EggData = require(script.Parent.EggData)
local PetData = require(script.Parent.PetData)
local EggBuilder = require(script.Parent.EggBuilder)
local PetBuilder = require(script.Parent.PetBuilder)

local HatchFx = {}

local function tween(inst, time, goal, style, dir)
	local t = TweenService:Create(inst, TweenInfo.new(time, style or Enum.EasingStyle.Quad, dir or Enum.EasingDirection.Out), goal)
	t:Play()
	return t
end

-- Modell um seinen Drehpunkt auf Faktor k skalieren (Größen und Abstände der Teile)
local function scaler(model, pivot)
	local parts = {}
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") then
			table.insert(parts, { Part = p, Offset = pivot:ToObjectSpace(p.CFrame), Size = p.Size })
		end
	end
	return function(k, turn)
		local base = pivot * CFrame.Angles(0, turn or 0, 0)
		for _, e in ipairs(parts) do
			local o = e.Offset
			e.Part.Size = e.Size * math.max(k, 0.01)
			e.Part.CFrame = base * CFrame.new(o.Position * k) * o.Rotation
		end
	end
end

local function emitter(parent, props)
	local e = Instance.new("ParticleEmitter")
	e.Texture = "rbxasset://textures/particles/sparkles_main.dds"
	e.LightEmission = 1
	e.Rate = 0
	for key, value in pairs(props) do
		e[key] = value
	end
	e.Parent = parent
	return e
end

function HatchFx.Play(eggId, petId, options)
	options = options or {}
	local egg = EggData.ById[eggId]
	local pet = PetData.ById[petId]
	local origin = options.CFrame or CFrame.new()
	local rank = egg.Rank
	local folder = Instance.new("Folder")
	folder.Name = "Schluepfen"
	folder.Parent = options.Parent or workspace

	-- Ei auf seinem Sockel
	local eggModel = EggBuilder.Build(egg)
	for _, p in ipairs(eggModel:GetDescendants()) do
		if p:IsA("BasePart") then
			p.CFrame = origin * p.CFrame
		end
	end
	eggModel.Parent = folder
	local shell = eggModel:FindFirstChild("Shell")
	local light = shell:FindFirstChildOfClass("PointLight")
	local shellCFrame = shell.CFrame
	local glow = egg.Glow

	-- 1. Wackeln: immer kräftiger und schneller
	local shakes = 3 + rank
	for i = 1, shakes do
		local k = i / shakes
		local angle = math.rad(6 + k * 14) * (i % 2 == 0 and 1 or -1)
		local time = 0.2 - k * 0.1
		tween(shell, time, { CFrame = shellCFrame * CFrame.Angles(0, 0, angle) }, Enum.EasingStyle.Sine)
		if light then
			tween(light, time, { Brightness = 1 + k * (3 + rank) })
		end
		task.wait(time)
		tween(shell, time * 0.8, { CFrame = shellCFrame }, Enum.EasingStyle.Sine)
		task.wait(time * 0.8 + 0.12 * (1 - k))
	end

	-- 2. Aufleuchten
	tween(shell, 0.35, { Color = glow })
	shell.Material = Enum.Material.Neon
	task.wait(0.35)

	-- 3. Platzen: Blitz, Funken, Druckwelle; das Ei verschwindet
	local burst = Instance.new("Part")
	burst.Name = "Blitz"
	burst.Anchored = true
	burst.CanCollide = false
	burst.Transparency = 1
	burst.Size = Vector3.new(1, 1, 1)
	burst.CFrame = shell.CFrame
	burst.Parent = folder
	local sparks = emitter(burst, { Color = ColorSequence.new(glow, Color3.new(1, 1, 1)), Lifetime = NumberRange.new(0.6, 1.2), Speed = NumberRange.new(10, 18 + rank * 2), SpreadAngle = Vector2.new(180, 180), Drag = 3, Size = NumberSequence.new(0.6, 0), Acceleration = Vector3.new(0, -6, 0) })
	sparks:Emit(30 + rank * 15)
	local flash = Instance.new("PointLight")
	flash.Color = glow
	flash.Brightness = 10
	flash.Range = 18 + rank * 2
	flash.Parent = burst
	tween(flash, 1.2, { Brightness = 0 })
	local wave = Instance.new("Part")
	wave.Name = "Druckwelle"
	wave.Anchored = true
	wave.CanCollide = false
	wave.Shape = Enum.PartType.Cylinder
	wave.Material = Enum.Material.Neon
	wave.Color = glow
	wave.Transparency = 0.2
	wave.Size = Vector3.new(0.1, 1, 1)
	wave.CFrame = origin * CFrame.new(0, 0.8, 0) * CFrame.Angles(0, 0, math.rad(90))
	wave.Parent = folder
	tween(wave, 0.9, { Size = Vector3.new(0.1, 12 + rank * 2, 12 + rank * 2), Transparency = 1 })
	for _, p in ipairs(eggModel:GetDescendants()) do
		if p:IsA("BasePart") and p.Name ~= "Pedestal" and p.Name ~= "PedestalRim" then
			tween(p, 0.25, { Transparency = 1 })
		end
	end
	tween(shell, 0.25, { Size = shell.Size * 1.3 })
	task.wait(0.25)

	-- 4. Das Tier wächst heraus und dreht sich zur Kamera
	local petModel = PetBuilder.Build(petId)
	local stand = origin * CFrame.new(0, 0.62, 0)
	local root = petModel.PrimaryPart
	local rootOffset = root and CFrame.new(0, root.Size.Y / 2, 0) or CFrame.new()
	for _, p in ipairs(petModel:GetDescendants()) do
		if p:IsA("BasePart") then
			p.Anchored = true
			p.CFrame = stand * p.CFrame
		end
	end
	petModel.Parent = folder
	local scale = scaler(petModel, stand)
	local glowRing = emitter(burst, { Color = ColorSequence.new(pet.Glow), Lifetime = NumberRange.new(1, 1.6), Speed = NumberRange.new(1, 3), SpreadAngle = Vector2.new(180, 180), Size = NumberSequence.new(0.35, 0), Rate = pet.Epic and 30 or 12 })
	local steps = 18
	for i = 1, steps do
		local k = i / steps
		local back = 1 + 2.7 * (k - 1) ^ 3 + 1.7 * (k - 1) ^ 2 -- Überschwingen wie Back-Out
		scale(back, (1 - k) * math.pi * 2)
		task.wait(0.03)
	end
	scale(1, 0)

	-- 5. Name, Chance und bei epischen Tieren ein Lichtkranz
	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.fromOffset(240, 70)
	gui.StudsOffsetWorldSpace = Vector3.new(0, 5.4 + (pet.Epic and 0.6 or 0), 0)
	gui.AlwaysOnTop = true
	gui.Parent = burst
	burst.CFrame = stand
	local title = Instance.new("TextLabel")
	title.BackgroundTransparency = 1
	title.Size = UDim2.new(1, 0, 0.6, 0)
	title.Font = Enum.Font.GothamBlack
	title.TextScaled = true
	title.TextColor3 = Color3.new(1, 1, 1)
	title.TextStrokeTransparency = 0.2
	title.TextStrokeColor3 = Color3.fromRGB(20, 16, 28)
	title.Text = pet.Name
	title.Parent = gui
	local sub = Instance.new("TextLabel")
	sub.BackgroundTransparency = 1
	sub.Position = UDim2.new(0, 0, 0.62, 0)
	sub.Size = UDim2.new(1, 0, 0.38, 0)
	sub.Font = Enum.Font.GothamBold
	sub.TextScaled = true
	sub.TextColor3 = pet.Epic and Color3.fromRGB(255, 210, 90) or glow
	sub.TextStrokeTransparency = 0.3
	sub.Text = (pet.Epic and "Episch · " or "") .. tostring(pet.Chance) .. " %"
	sub.Parent = gui
	if pet.Epic then
		local sparkles = Instance.new("Sparkles")
		sparkles.SparkleColor = pet.Glow
		sparkles.Parent = burst
		local ring = Instance.new("Part")
		ring.Name = "Lichtkranz"
		ring.Anchored = true
		ring.CanCollide = false
		ring.Shape = Enum.PartType.Cylinder
		ring.Material = Enum.Material.Neon
		ring.Color = Color3.fromRGB(255, 210, 90)
		ring.Transparency = 0.5
		ring.Size = Vector3.new(0.08, 5.6, 5.6)
		ring.CFrame = stand * CFrame.new(0, 0.05, 0) * CFrame.Angles(0, 0, math.rad(90))
		ring.Parent = folder
	end
	task.delay(0.8, function()
		glowRing.Rate = pet.Epic and 8 or 0
	end)
	return { Folder = folder, Pet = petModel }
end

return HatchFx
`;
