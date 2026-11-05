// Münzrollen für Roblox: RollData (Daten und Öffnen nach Seltenheit), RollBuilder (Rolle auf Sockel)
// und RollFx (Aufreißen, Bäume und Gartenwerkzeug fliegen heraus). Die Webseite führt dieselben
// Module aus (rollen/). Was in den Rollen steckt, steht in GardenData (gardenLuau.js).

const str = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
const num = (n) => (Number.isFinite(n) ? String(Math.round(n * 1000) / 1000) : 'math.huge');
const color = (hex) => `Color3.fromHex(${str(hex)})`;
const list = (items, indent = '\t') => `{\n${items.map((i) => `${indent}${i},`).join('\n')}\n${indent.slice(1)}}`;
const fields = (obj) =>
  '{ ' +
  Object.entries(obj)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k} = ${v}`)
    .join(', ') +
  ' }';

const HEADER = (title) => `-- Coinmaster Adventure · ${title}
-- Automatisch erzeugt von der Coinmaster-Webseite. Änderungen besser dort machen
-- und neu übertragen, sonst gehen sie beim nächsten Import verloren.
`;

export function rollDataSource({ ROLLS }) {
  const rolls = ROLLS.map((r) =>
    fields({
      Id: str(r.id),
      Name: str(r.name),
      Alias: r.alias ? str(r.alias) : undefined,
      Rank: num(r.rank),
      RankName: str(r.rankName),
      Luck: num(r.luck),
      Guarantee: r.guarantee ? str(r.guarantee) : undefined,
      Paper: color(r.paper),
      Band: color(r.band),
      Metal: color(r.metal),
      Glow: color(r.glow),
      Price: r.price ? `{ Amount = ${num(r.price.amount)}, Currency = ${str(r.price.currency === 'robux' ? 'Robux' : 'Coins')} }` : 'nil',
      Availability: str(r.availability),
      Text: str(r.text),
    }),
  );
  return `${HEADER('Münzrollen')}
-- Aus einer Münzrolle kommt genau eine Sache für den Münzbaumgarten (Baum oder Werkzeug aus GardenData).
-- Luck hebt seltene Stufen an: Gewicht einer Seltenheit = Chance × Luck ^ (Stufe / 5).
-- Guarantee: Mindest-Seltenheit (seltener geht immer, gewöhnlicher nie).
-- Price = nil: nicht kaufbar.
-- Wichtig: RollData.Open nur auf dem Server aufrufen, nie auf dem Client.

local GardenData = require(script.Parent.GardenData)

local RollData = {}

RollData.Rolls = ${list(rolls)}

RollData.ById = {}
for _, roll in ipairs(RollData.Rolls) do
	RollData.ById[roll.Id] = roll
end

-- Chance je Seltenheit in Prozent (Reihenfolge von GardenData.Rarities); minIndex schneidet darunter ab
function RollData.TierChances(roll, minIndex)
	minIndex = minIndex or 1
	local n = #GardenData.Rarities - 1
	local weights, sum = {}, 0
	for i, tier in ipairs(GardenData.Rarities) do
		local w = 0
		if i >= minIndex then
			w = tier.Chance * roll.Luck ^ ((i - 1) / n)
		end
		weights[i] = w
		sum = sum + w
	end
	for i = 1, #weights do
		weights[i] = weights[i] / sum * 100
	end
	return weights
end

local function pickTier(chances, rng)
	local roll = rng:NextNumber() * 100
	local last = 1
	for i, c in ipairs(chances) do
		if c > 0 then
			last = i
			roll = roll - c
			if roll <= 0 then
				return i
			end
		end
	end
	return last
end

-- Mindest-Seltenheit einer Rolle als Index (1 = Gewöhnlich)
function RollData.MinIndex(roll)
	return roll.Guarantee and GardenData.RarityById[roll.Guarantee].Index or 1
end

-- Eine Sache nach den Chancen der Rolle würfeln (Eintrag aus GardenData.Loot)
function RollData.Pick(roll, rng)
	rng = rng or Random.new()
	local tier = GardenData.Rarities[pickTier(RollData.TierChances(roll, RollData.MinIndex(roll)), rng)]
	local pool = {}
	for _, item in ipairs(GardenData.Loot) do
		if item.Rarity == tier.Id then
			table.insert(pool, item)
		end
	end
	return pool[rng:NextInteger(1, #pool)]
end

-- Öffnet eine Rolle: genau eine Sache
function RollData.Open(rollId, rng)
	return RollData.Pick(RollData.ById[rollId], rng)
end

return RollData
`;
}

export const ROLL_BUILDER = `${HEADER('Münzrollen bauen')}
-- RollBuilder.Build(roll) baut eine aufrecht stehende Münzrolle auf einem Sockel als Model.
-- Oben schaut die erste Münze aus dem Papier, vorne sitzt ein Siegel in Form einer Münze.

local RollBuilder = {}

local function part(className, props, parent)
	local p = Instance.new(className)
	p.Anchored = true
	p.CanCollide = false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for key, value in pairs(props) do
		p[key] = value
	end
	p.Parent = parent
	return p
end

local UP = CFrame.Angles(0, 0, math.rad(90)) -- Zylinder aufrecht
local FRONT = CFrame.Angles(0, math.rad(90), 0) -- Zylinder zeigt nach vorne (−Z)

local LOOK = {
	kupfer = { Material = Enum.Material.Fabric },
	silber = { Material = Enum.Material.SmoothPlastic, Reflectance = 0.15 },
	gold = { Material = Enum.Material.Foil },
	juwel = { Material = Enum.Material.Fabric },
	stern = { Material = Enum.Material.SmoothPlastic },
}

RollBuilder.Height = 4
RollBuilder.Radius = 0.82
RollBuilder.Base = 0.6 -- Oberkante des Sockels

function RollBuilder.Build(roll)
	local look = LOOK[roll.Id] or {}
	local h, r, base = RollBuilder.Height, RollBuilder.Radius, RollBuilder.Base
	local mid = base + h / 2
	local model = Instance.new("Model")
	model.Name = roll.Name

	part("Part", { Name = "Pedestal", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.6, 4.4, 4.4), Color = Color3.fromRGB(42, 37, 50), Material = Enum.Material.Slate, CFrame = CFrame.new(0, 0.3, 0) * UP }, model)
	part("Part", { Name = "PedestalRim", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.14, 4.52, 4.52), Color = roll.Glow, Material = Enum.Material.Neon, CFrame = CFrame.new(0, 0.42, 0) * UP }, model)

	-- Papierhülle
	local body = part("Part", { Name = "Wrapper", Shape = Enum.PartType.Cylinder, Size = Vector3.new(h, r * 2, r * 2), Color = roll.Paper, Material = look.Material or Enum.Material.SmoothPlastic, Reflectance = look.Reflectance or 0, CFrame = CFrame.new(0, mid, 0) * UP }, model)
	model.PrimaryPart = body
	-- umgefalzte Kanten oben und unten
	for _, y in ipairs({ base + 0.12, base + h - 0.12 }) do
		part("Part", { Name = "Fold", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.2, r * 2 + 0.03, r * 2 + 0.03), Color = roll.Paper:Lerp(Color3.new(0, 0, 0), 0.15), Material = look.Material or Enum.Material.SmoothPlastic, CFrame = CFrame.new(0, y, 0) * UP }, model)
	end
	-- Banderole mit zwei feinen Streifen
	part("Part", { Name = "Band", Shape = Enum.PartType.Cylinder, Size = Vector3.new(1.1, r * 2 + 0.04, r * 2 + 0.04), Color = roll.Band, Material = Enum.Material.SmoothPlastic, CFrame = CFrame.new(0, mid, 0) * UP }, model)
	for _, dy in ipairs({ -0.8, 0.8 }) do
		part("Part", { Name = "Stripe", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.09, r * 2 + 0.03, r * 2 + 0.03), Color = roll.Band, Material = Enum.Material.SmoothPlastic, CFrame = CFrame.new(0, mid + dy, 0) * UP }, model)
	end
	-- oben schaut die erste Münze heraus
	local top = base + h
	part("Part", { Name = "TopCoin", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.16, r * 2 - 0.14, r * 2 - 0.14), Color = roll.Metal, Material = Enum.Material.Metal, CFrame = CFrame.new(0, top + 0.02, 0) * UP }, model)
	part("Part", { Name = "TopRelief", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.18, r * 1.2, r * 1.2), Color = roll.Metal:Lerp(Color3.new(0, 0, 0), 0.2), Material = Enum.Material.Metal, CFrame = CFrame.new(0, top + 0.03, 0) * UP }, model)
	-- Siegel vorne auf der Banderole
	local sealPos = Vector3.new(0, mid, -(r + 0.05))
	part("Part", { Name = "Seal", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.12, 0.85, 0.85), Color = roll.Metal, Material = Enum.Material.Metal, CFrame = CFrame.new(sealPos) * FRONT }, model)
	part("Part", { Name = "SealCore", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.14, 0.45, 0.45), Color = roll.Rank >= 2 and roll.Glow or roll.Metal:Lerp(Color3.new(0, 0, 0), 0.25), Material = roll.Rank >= 2 and Enum.Material.Neon or Enum.Material.Metal, CFrame = CFrame.new(sealPos + Vector3.new(0, 0, -0.02)) * FRONT }, model)

	local glow = Instance.new("PointLight")
	glow.Color = roll.Glow
	glow.Brightness = 1 + roll.Rank * 0.5
	glow.Range = 8 + roll.Rank * 2
	glow.Parent = body

	if roll.Id == "gold" then
		local s = Instance.new("Sparkles")
		s.SparkleColor = roll.Glow
		s.Parent = body
	elseif roll.Id == "juwel" then
		local gems = { Color3.fromRGB(255, 95, 210), Color3.fromRGB(110, 230, 255), Color3.fromRGB(150, 255, 140), Color3.fromRGB(255, 220, 90) }
		for i = 0, 9 do
			local a = math.rad(i * 36 + 18)
			part("Part", { Name = "Gem", Shape = Enum.PartType.Ball, Size = Vector3.new(0.26, 0.26, 0.26), Color = gems[i % 4 + 1], Material = Enum.Material.Neon, CFrame = CFrame.new(math.sin(a) * (r + 0.04), mid, -math.cos(a) * (r + 0.04)) }, model)
		end
	elseif roll.Id == "stern" then
		local rng = Random.new(7)
		for i = 1, 26 do
			local a = rng:NextNumber(0, math.pi * 2)
			local y = rng:NextNumber(base + 0.3, base + h - 0.3)
			if math.abs(y - mid) > 0.6 then
				part("Part", { Name = "Star", Shape = Enum.PartType.Ball, Size = Vector3.new(0.1, 0.1, 0.1) * rng:NextNumber(0.8, 1.6), Color = Color3.fromRGB(255, 244, 210), Material = Enum.Material.Neon, CFrame = CFrame.new(math.sin(a) * r, y, math.cos(a) * r) }, model)
			end
		end
		for i = 0, 29 do
			local a = math.rad(i * 12)
			part("Part", { Name = "Orbit", Shape = Enum.PartType.Ball, Size = Vector3.new(0.18, 0.18, 0.18), Color = Color3.fromHSV(0.12 + (i % 5) * 0.03, 0.55, 1), Material = Enum.Material.Neon, CFrame = CFrame.new(math.cos(a) * 1.9, mid + math.sin(a * 2) * 0.35, math.sin(a) * 1.9) }, model)
		end
		local s = Instance.new("Sparkles")
		s.SparkleColor = roll.Glow
		s.Parent = body
	end

	model:SetAttribute("RollId", roll.Id)
	return model
end

return RollBuilder
`;

export const ROLL_FX = `${HEADER('Münzrolle öffnen')}
-- RollFx.Play(rollId, itemId, options) zeigt das Öffnen einer Rolle an einem Ort
-- (options.CFrame = Boden unter der Rolle, options.Parent = Elternteil, Standard workspace,
-- options.Window = halbe Breite des Rollbands in Studs, Standard RollFx.Window).
-- itemId: Id aus GardenData (Samen eines Baums oder Werkzeug), am besten aus RollData.Open auf dem Server.
-- Ablauf: Die Rolle wackelt, hebt ab und dreht sich immer schneller. Dann wird sie zerrissen: Sie teilt sich
-- in zwei Hälften mit Papierzacken, der Riss glüht, reißt in zwei Rucken auf, und die Hälften fliegen mit
-- Konfetti und einer Lichtsäule auseinander. Danach klappt ein Rollband auf: farbige Karten (Farbe der
-- Seltenheit) laufen durch, Lauflichter in Regenbogenfarben, Fahrtwind, Rahmen und Markierung leuchten in
-- der Farbe der Karte unter der Markierung. Das Band wird langsamer, pocht am Ende, bleibt knapp daneben
-- stehen und rastet ein. Der Gewinn springt nach vorne, mit Strahlenkranz, Konfetti und Druckwellen, die mit
-- der Seltenheit wachsen (Göttlich: Regenbogen-Strahlen). Die Vorderseite zeigt nach −Z.
-- Läuft am besten auf dem Client (LocalScript). Gibt { Folder, Item } zurück, wenn alles steht.

local TweenService = game:GetService("TweenService")
local GardenData = require(script.Parent.GardenData)
local LootBuilder = require(script.Parent.LootBuilder)
local RollData = require(script.Parent.RollData)
local RollBuilder = require(script.Parent.RollBuilder)

local RollFx = {}

RollFx.ItemSize = 2.1 -- so hoch wird jede Sache im Band in Studs
RollFx.Spacing = 3.3 -- Abstand der Felder im Band
RollFx.Window = 12 -- halbe Breite des sichtbaren Bands
RollFx.SpinTime = 6.2 -- Sekunden, bis das Band steht
RollFx.Slots = 30 -- Felder im Band; das gewonnene liegt bei Slots − 4

local function tween(inst, time, goal, style, dir)
	local t = TweenService:Create(inst, TweenInfo.new(time, style or Enum.EasingStyle.Quad, dir or Enum.EasingDirection.Out), goal)
	t:Play()
	return t
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

local function holder(parent, cf)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.Transparency = 1
	p.Size = Vector3.new(1, 1, 1)
	p.CFrame = cf
	p.Parent = parent
	return p
end

local function shockwave(parent, cf, color, size, time)
	local wave = Instance.new("Part")
	wave.Name = "Druckwelle"
	wave.Anchored = true
	wave.CanCollide = false
	wave.Shape = Enum.PartType.Cylinder
	wave.Material = Enum.Material.Neon
	wave.Color = color
	wave.Transparency = 0.2
	wave.Size = Vector3.new(0.1, 1, 1)
	wave.CFrame = cf
	wave.Parent = parent
	tween(wave, time, { Size = Vector3.new(0.1, size, size), Transparency = 1 })
	task.delay(time, function()
		wave:Destroy()
	end)
end

-- Teile eines Modells relativ zu einem Drehpunkt merken und neu setzen (verschieben, drehen, skalieren)
local function rig(model, pivot)
	local parts = {}
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") then
			table.insert(parts, { Part = p, Offset = pivot:ToObjectSpace(p.CFrame), Size = p.Size })
		end
	end
	return function(cf, k)
		k = k or 1
		for _, e in ipairs(parts) do
			local o = e.Offset
			e.Part.Size = e.Size * math.max(k, 0.01)
			e.Part.CFrame = cf * CFrame.new(o.Position * k) * o.Rotation
		end
	end, parts
end

local function label(parent, item, tier)
	local gui = Instance.new("BillboardGui")
	-- Größe in Studs, damit sich die Schilder nebeneinander nie überlappen
	gui.Size = UDim2.new(2.35, 0, 0.66, 0)
	gui.StudsOffsetWorldSpace = Vector3.new(0, 1.45, 0)
	gui.AlwaysOnTop = true
	gui.Parent = parent
	local title = Instance.new("TextLabel")
	title.BackgroundTransparency = 1
	title.Size = UDim2.new(1, 0, 0.58, 0)
	title.Font = Enum.Font.GothamBlack
	title.TextScaled = true
	title.TextColor3 = Color3.new(1, 1, 1)
	title.TextStrokeTransparency = 0.2
	title.TextStrokeColor3 = Color3.fromRGB(20, 16, 28)
	title.Text = GardenData.LootName(item)
	title.Parent = gui
	local sub = Instance.new("TextLabel")
	sub.BackgroundTransparency = 1
	sub.Position = UDim2.new(0, 0, 0.6, 0)
	sub.Size = UDim2.new(1, 0, 0.4, 0)
	sub.Font = Enum.Font.GothamBold
	sub.TextScaled = true
	sub.TextColor3 = tier.Color
	sub.TextStrokeTransparency = 0.3
	sub.Text = tier.Name
	sub.Parent = gui
	return gui
end

-- Eine Hälfte der Rolle (oben oder unten) als eigenes Model, im Raum der Rolle (Boden = 0, y nach oben).
-- Die Rissstelle bekommt Papierzacken, damit sie beim Auseinanderziehen wie abgerissen aussieht.
local function half(roll, top)
	local h, r = RollBuilder.Height, RollBuilder.Radius
	local mid = h / 2
	local UP = CFrame.Angles(0, 0, math.rad(90))
	local m = Instance.new("Model")
	m.Name = top and "Oben" or "Unten"
	local function add(name, size, cf, color, material, shape)
		local p = Instance.new("Part")
		p.Name = name
		p.Anchored = true
		p.CanCollide = false
		p.Size = size
		p.CFrame = cf
		p.Color = color
		p.Material = material or Enum.Material.SmoothPlastic
		if shape then p.Shape = shape end
		p.Parent = m
		return p
	end
	local paper = roll.Paper
	local y0 = top and mid or 0
	add("Huelle", Vector3.new(mid, r * 2, r * 2), CFrame.new(0, y0 + mid / 2, 0) * UP, paper, Enum.Material.SmoothPlastic, Enum.PartType.Cylinder)
	add("Falz", Vector3.new(0.2, r * 2 + 0.03, r * 2 + 0.03), CFrame.new(0, top and h - 0.12 or 0.12, 0) * UP, paper:Lerp(Color3.new(0, 0, 0), 0.15), nil, Enum.PartType.Cylinder)
	add("Band", Vector3.new(0.55, r * 2 + 0.04, r * 2 + 0.04), CFrame.new(0, mid + (top and 0.275 or -0.275), 0) * UP, roll.Band, nil, Enum.PartType.Cylinder)
	add("Streifen", Vector3.new(0.09, r * 2 + 0.03, r * 2 + 0.03), CFrame.new(0, mid + (top and 0.8 or -0.8), 0) * UP, roll.Band, nil, Enum.PartType.Cylinder)
	if top then
		add("Muenze", Vector3.new(0.16, r * 2 - 0.14, r * 2 - 0.14), CFrame.new(0, h + 0.02, 0) * UP, roll.Metal, Enum.Material.Metal, Enum.PartType.Cylinder)
	end
	-- Zacken: kleine gedrehte Papierstücke rund um die Rissstelle, oben und unten versetzt
	local n = 16
	for i = 0, n - 1 do
		local a = (i + (top and 0.5 or 0)) / n * math.pi * 2
		local cf = CFrame.new(math.sin(a) * (r + 0.01), mid + (top and -0.05 or 0.05), -math.cos(a) * (r + 0.01)) * CFrame.Angles(0, -a, 0) * CFrame.Angles(0, 0, math.rad(45))
		add("Zacke", Vector3.new(0.3, 0.3, 0.05), cf, i % 3 == 0 and roll.Band:Lerp(Color3.new(1, 1, 1), 0.25) or roll.Band)
	end
	-- an der Rissfläche glänzen die Münzen aus der Rolle
	add("Innen", Vector3.new(0.06, r * 2 - 0.08, r * 2 - 0.08), CFrame.new(0, mid + (top and -0.03 or 0.03), 0) * UP, roll.Metal, Enum.Material.Metal, Enum.PartType.Cylinder)
	add("InnenRelief", Vector3.new(0.07, r * 1.15, r * 1.15), CFrame.new(0, mid + (top and -0.035 or 0.035), 0) * UP, roll.Metal:Lerp(Color3.new(0, 0, 0), 0.2), Enum.Material.Metal, Enum.PartType.Cylinder)
	return m
end

function RollFx.Play(rollId, itemId, options)
	options = options or {}
	local roll = RollData.ById[rollId]
	local origin = options.CFrame or CFrame.new()
	local rank = roll.Rank
	local glow = roll.Glow
	if type(itemId) == "table" then itemId = itemId[1] end
	local item = GardenData.ById[itemId]
	local tier = GardenData.RarityById[item.Rarity]
	local rare = tier.Index - 1 -- 0 bei Gewöhnlich
	local folder = Instance.new("Folder")
	folder.Name = "Muenzrolle"
	folder.Parent = options.Parent or workspace
	local rng = Random.new()

	-- Rolle auf ihrem Sockel; alles außer dem Sockel bewegt sich als Ganzes
	local model = RollBuilder.Build(roll)
	local moving = Instance.new("Model")
	moving.Name = "Rolle"
	for _, p in ipairs(model:GetChildren()) do
		if p:IsA("BasePart") then
			p.CFrame = origin * p.CFrame
			if p.Name ~= "Pedestal" and p.Name ~= "PedestalRim" then
				p.Parent = moving
			end
		end
	end
	model.Parent = folder
	moving.Parent = folder
	local base = origin * CFrame.new(0, RollBuilder.Base, 0)
	local pose = rig(moving, base)
	local light = moving:FindFirstChild("Wrapper"):FindFirstChildOfClass("PointLight")

	-- 1. Wackeln um die Unterkante, immer heftiger
	local shakes = 2 + rank
	for i = 1, shakes do
		local k = i / shakes
		local angle = math.rad(5 + k * 12) * (i % 2 == 0 and 1 or -1)
		local time = 0.15 - k * 0.06
		local steps = math.max(2, math.floor(time / 0.03))
		for s = 1, steps do
			pose(base * CFrame.Angles(0, 0, angle * math.sin(s / steps * math.pi)))
			task.wait(time / steps)
		end
		if light then light.Brightness = 1 + k * (3 + rank) end
		task.wait(0.08 * (1 - k))
	end

	-- 2. Abheben und immer schneller drehen
	local lift = 1.4
	local frames = math.floor((0.6 + rank * 0.1) / 0.03)
	local turn = 0
	for f = 1, frames do
		local k = f / frames
		turn = turn + (0.15 + k * k * 1.1)
		pose(base * CFrame.new(0, k * lift, 0) * CFrame.Angles(0, turn, 0))
		task.wait(0.03)
	end
	local held = base * CFrame.new(0, lift, 0) * CFrame.Angles(0, turn, 0)
	local mid = held * CFrame.new(0, RollBuilder.Height / 2, 0)

	-- 3. Zerreißen: die Rolle wird zu zwei Hälften, die Rissstelle glüht, reißt in Rucken auf und fliegt auseinander
	moving:Destroy()
	local upper, lower = half(roll, true), half(roll, false)
	upper.Parent, lower.Parent = folder, folder
	local placeUp, partsUp = rig(upper, CFrame.new(0, RollBuilder.Height / 2, 0))
	local placeDown, partsDown = rig(lower, CFrame.new(0, RollBuilder.Height / 2, 0))
	local crack = Instance.new("Part")
	crack.Name = "Riss"
	crack.Anchored, crack.CanCollide = true, false
	crack.Shape = Enum.PartType.Cylinder
	crack.Material = Enum.Material.Neon
	crack.Color = glow
	crack.Transparency = 1
	crack.Size = Vector3.new(0.05, RollBuilder.Radius * 2 - 0.05, RollBuilder.Radius * 2 - 0.05)
	crack.CFrame = mid * CFrame.Angles(0, 0, math.rad(90))
	crack.Parent = folder
	local core = holder(folder, mid)
	local coreLight = Instance.new("PointLight")
	coreLight.Color = glow
	coreLight.Brightness = 0
	coreLight.Range = 10 + rank * 2
	coreLight.Parent = core
	local fizz = emitter(core, { Color = ColorSequence.new(glow, Color3.new(1, 1, 1)), Lifetime = NumberRange.new(0.3, 0.6), Speed = NumberRange.new(3, 7), SpreadAngle = Vector2.new(180, 15), Drag = 2, Size = NumberSequence.new(0.18, 0) })
	local function apart(gap, tiltUp, tiltDown, shake)
		local j = shake and Vector3.new(rng:NextNumber(-shake, shake), rng:NextNumber(-shake, shake), 0) or Vector3.new()
		placeUp(mid * CFrame.new(j + Vector3.new(0, gap / 2, 0)) * CFrame.Angles(0, 0, tiltUp), 1)
		placeDown(mid * CFrame.new(j + Vector3.new(0, -gap / 2, 0)) * CFrame.Angles(0, 0, tiltDown), 1)
		crack.Size = Vector3.new(math.max(0.05, gap), crack.Size.Y, crack.Size.Z)
	end
	-- Spannung: zittern, der Riss glimmt auf
	for f = 1, 16 do
		local k = f / 16
		apart(0.02 * k, 0, 0, 0.04 * k)
		crack.Transparency = 1 - k * 0.8
		coreLight.Brightness = k * 3
		fizz.Rate = 30 * k
		task.wait(0.03)
	end
	-- Ratsch – Ratsch: zwei Rucke, jedes Mal Papierfetzen und Licht
	local confettiCore = emitter(core, { Color = ColorSequence.new(roll.Paper, roll.Band), LightEmission = 0.2, Lifetime = NumberRange.new(0.6, 1.1), Speed = NumberRange.new(6, 11), SpreadAngle = Vector2.new(180, 25), Drag = 2, Size = NumberSequence.new(0.28, 0.12), Acceleration = Vector3.new(0, -12, 0), RotSpeed = NumberRange.new(-300, 300) })
	for step, gap in ipairs({ 0.22, 0.5 }) do
		for f = 1, 4 do
			apart(gap * f / 4, math.rad(3 * step) * f / 4, math.rad(-2 * step) * f / 4, 0.03)
			task.wait(0.02)
		end
		confettiCore:Emit(10 + step * 6)
		coreLight.Brightness = 5 + step * 2
		crack.Transparency = 0
		for f = 1, 9 do
			apart(gap, math.rad(3 * step), math.rad(-2 * step), 0.05 * (1 - f / 9))
			coreLight.Brightness = coreLight.Brightness * 0.94
			task.wait(0.03)
		end
	end
	-- ganz auseinander: Hälften fliegen weg, Licht bricht heraus
	fizz.Rate = 0
	local burst = holder(folder, mid)
	burst.Name = "Blitz"
	local confetti = emitter(burst, { Color = ColorSequence.new(roll.Paper, roll.Band), LightEmission = 0.3, Lifetime = NumberRange.new(0.8, 1.4), Speed = NumberRange.new(9, 16 + rank * 2), SpreadAngle = Vector2.new(180, 180), Drag = 2, Size = NumberSequence.new(0.35, 0.15), Acceleration = Vector3.new(0, -14, 0), RotSpeed = NumberRange.new(-300, 300) })
	confetti:Emit(40 + rank * 15)
	local sparks = emitter(burst, { Color = ColorSequence.new(glow, Color3.new(1, 1, 1)), Lifetime = NumberRange.new(0.5, 1), Speed = NumberRange.new(10, 20), SpreadAngle = Vector2.new(180, 180), Drag = 3, Size = NumberSequence.new(0.5, 0) })
	sparks:Emit(25 + rank * 10)
	local flash = Instance.new("PointLight")
	flash.Color = glow
	flash.Brightness = 12
	flash.Range = 20 + rank * 2
	flash.Parent = burst
	tween(flash, 1.2, { Brightness = 0 })
	shockwave(folder, mid * CFrame.Angles(0, 0, math.rad(90)), glow, 11 + rank * 2, 0.8)
	-- Lichtsäule schießt nach oben
	local pillar = Instance.new("Part")
	pillar.Name = "Lichtsaeule"
	pillar.Anchored, pillar.CanCollide = true, false
	pillar.Shape = Enum.PartType.Cylinder
	pillar.Material = Enum.Material.Neon
	pillar.Color = glow
	pillar.Transparency = 0.15
	pillar.Size = Vector3.new(0.5, 1.4, 1.4)
	pillar.CFrame = mid * CFrame.Angles(0, 0, math.rad(90))
	pillar.Parent = folder
	tween(pillar, 0.5, { Size = Vector3.new(14, 0.5, 0.5), CFrame = mid * CFrame.new(0, 6, 0) * CFrame.Angles(0, 0, math.rad(90)), Transparency = 1 })
	crack:Destroy()
	local flyFrames = 20
	for f = 1, flyFrames do
		local k = f / flyFrames
		local e = 1 - (1 - k) ^ 2
		placeUp(mid * CFrame.new(1.6 * e, 0.25 + 3 * e, -0.4 * e) * CFrame.Angles(0, 0, -math.rad(55) * e), 1)
		placeDown(mid * CFrame.new(-1.1 * e, -0.25 - 0.9 * e, -0.3 * e) * CFrame.Angles(0, 0, math.rad(35) * e), 1)
		if f > 8 then
			for _, e2 in ipairs(partsUp) do e2.Part.Transparency = (f - 8) / (flyFrames - 8) end
			for _, e2 in ipairs(partsDown) do e2.Part.Transparency = (f - 8) / (flyFrames - 8) end
		end
		task.wait(0.03)
	end
	upper:Destroy()
	lower:Destroy()
	task.delay(0.6, function() pillar:Destroy() end)

	-- 4. Rollband: farbige Karten laufen von rechts nach links und bleiben auf dem Gewinn stehen
	local window = options.Window or RollFx.Window
	local spacing = RollFx.Spacing
	local reelC = origin * CFrame.new(0, 3.9, 0)
	local reel = Instance.new("Model")
	reel.Name = "Rollband"
	reel.Parent = folder
	local function block(name, size, cf, color, material, transparency, shape)
		local p = Instance.new("Part")
		p.Name = name
		p.Anchored = true
		p.CanCollide = false
		p.Size = size
		p.CFrame = cf
		p.Color = color
		p.Material = material or Enum.Material.SmoothPlastic
		p.Transparency = transparency or 0
		if shape then p.Shape = shape end
		p.Parent = reel
		return p
	end
	local width = window * 2 + 2
	local back = block("Rueckwand", Vector3.new(width, 4.6, 0.3), reelC * CFrame.new(0, 0, 1), Color3.fromRGB(18, 14, 28))
	local rails = {
		block("RandOben", Vector3.new(width, 0.22, 0.5), reelC * CFrame.new(0, 2.35, 0.4), glow, Enum.Material.Neon),
		block("RandUnten", Vector3.new(width, 0.22, 0.5), reelC * CFrame.new(0, -2.35, 0.4), glow, Enum.Material.Neon),
	}
	-- Lauflichter: Lämpchen auf beiden Rändern, Regenbogen läuft durch
	local lamps = {}
	local count = math.floor(width / 1.1)
	for i = 0, count - 1 do
		local x = -width / 2 + 0.55 + i * 1.1
		for _, y in ipairs({ 2.35, -2.35 }) do
			table.insert(lamps, { Part = block("Lampe", Vector3.new(0.26, 0.26, 0.26), reelC * CFrame.new(x, y, -0.05), Color3.new(1, 1, 1), Enum.Material.Neon, 0, Enum.PartType.Ball), I = i })
		end
	end
	local marker = block("Markierung", Vector3.new(0.12, 4.5, 0.12), reelC * CFrame.new(0, 0, -1.7), Color3.new(1, 1, 1), Enum.Material.Neon, 0.25)
	local pointers = {}
	for _, y in ipairs({ 2.65, -2.65 }) do
		table.insert(pointers, block("Zeiger", Vector3.new(0.6, 0.6, 0.22), reelC * CFrame.new(0, y, -1.7) * CFrame.Angles(0, 0, math.rad(45)), Color3.fromRGB(255, 220, 120), Enum.Material.Neon))
	end
	local backLight = Instance.new("PointLight")
	backLight.Color = glow
	backLight.Brightness = 2
	backLight.Range = 16
	backLight.Parent = marker
	-- Band klappt aus der Mitte auf
	for _, p in ipairs({ back, rails[1], rails[2] }) do
		local size = p.Size
		p.Size = Vector3.new(0.2, size.Y, size.Z)
		tween(p, 0.4, { Size = size }, Enum.EasingStyle.Back)
	end
	-- Fahrtwind: Lichtstreifen fliegen am Band entlang, solange es schnell läuft
	local streakSrc = holder(reel, reelC * CFrame.new(-window, 0, -0.8))
	local streaks = emitter(streakSrc, { Color = ColorSequence.new(glow, Color3.new(1, 1, 1)), Lifetime = NumberRange.new(0.25, 0.45), Speed = NumberRange.new(30, 45), SpreadAngle = Vector2.new(0, 12), Size = NumberSequence.new(0.22, 0), Rate = 0, EmissionDirection = Enum.NormalId.Right })

	-- Felder: farbige Karte (Farbe der Seltenheit) mit der Sache. Gebaut wird erst, wenn sie ins Bild kommen.
	local n = RollFx.Slots
	local win = n - 4
	local slots = {}
	for k = 1, n do
		local thing = k == win and item or RollData.Pick(roll, rng)
		-- knapp daneben: direkt hinter dem Gewinn oft etwas Seltenes
		if k == win + 1 and rng:NextNumber() < 0.5 then
			local top = {}
			for _, it in ipairs(GardenData.Loot) do
				if GardenData.RarityById[it.Rarity].Index >= 4 then table.insert(top, it) end
			end
			thing = top[rng:NextInteger(1, #top)]
		end
		slots[k] = { Item = thing, Tier = GardenData.RarityById[thing.Rarity] }
	end
	local PARK = origin * CFrame.new(0, -500, 0)
	local function build(slot)
		local it, r = slot.Item, slot.Tier
		local m = LootBuilder.Build(it)
		m.Parent = reel
		local h = m:GetAttribute("Height") or 2
		slot.Scale = RollFx.ItemSize / h
		slot.Place = rig(m, CFrame.new(0, h / 2, 0))
		slot.Model = m
		local card = Instance.new("Model")
		card.Name = "Karte"
		local function cardPart(name, size, cf, color, material, transparency)
			local p = Instance.new("Part")
			p.Name = name
			p.Anchored, p.CanCollide = true, false
			p.Size, p.CFrame, p.Color = size, cf, color
			p.Material = material or Enum.Material.SmoothPlastic
			p.Transparency = transparency or 0
			p.Parent = card
			return p
		end
		local w = spacing - 0.3
		cardPart("Karte", Vector3.new(w, 4, 0.1), CFrame.new(0, 0, 0.55), r.Color:Lerp(Color3.new(0, 0, 0), 0.62))
		cardPart("Schein", Vector3.new(w - 0.5, 3.2, 0.05), CFrame.new(0, 0.15, 0.48), r.Color, Enum.Material.Neon, 0.72)
		cardPart("Streifen", Vector3.new(w, 0.32, 0.12), CFrame.new(0, -1.82, 0.46), r.Color, Enum.Material.Neon)
		cardPart("Kante", Vector3.new(w, 0.08, 0.12), CFrame.new(0, 1.96, 0.46), r.Color, Enum.Material.Neon)
		if r.Index >= 4 then
			-- seltene Karten bekommen Ecken-Steine
			for _, x in ipairs({ -w / 2 + 0.25, w / 2 - 0.25 }) do
				cardPart("Stein", Vector3.new(0.24, 0.24, 0.12), CFrame.new(x, 1.65, 0.44) * CFrame.Angles(0, 0, math.rad(45)), Color3.new(1, 1, 1), Enum.Material.Neon)
			end
		end
		card.Parent = reel
		slot.Card = rig(card, CFrame.new())
		slot.Visible = true
	end
	local lastTick, clock = nil, 0
	local function layout(pos, spin, speed)
		for k, slot in ipairs(slots) do
			local x = -(k - pos) * spacing
			local visible = math.abs(x) <= window - spacing * 0.35
			if visible and not slot.Model then
				build(slot)
			end
			if slot.Model then
				if visible then
					local cf = reelC * CFrame.new(x, 0, 0)
					slot.Card(cf, 1)
					-- Karten nahe der Mitte heben sich leicht nach vorne
					local near = math.max(0, 1 - math.abs(x) / spacing)
					slot.Place(cf * CFrame.new(0, 0.15, -0.35 - near * 0.4) * CFrame.Angles(0, spin or 0, 0), slot.Scale * (1 + near * 0.15))
					slot.Visible = true
				elseif slot.Visible then
					slot.Card(PARK, 1)
					slot.Place(PARK, slot.Scale)
					slot.Visible = false
				end
			end
		end
		-- Rahmen und Markierung leuchten in der Farbe der Karte unter der Markierung
		local current = math.clamp(math.floor(pos + 0.5), 1, n)
		local color = slots[current].Tier.Color
		if current ~= lastTick then
			lastTick = current
			marker.Transparency = 0
			tween(marker, 0.12, { Transparency = 0.25 })
			for _, r in ipairs(rails) do r.Color = color end
			marker.Color = color:Lerp(Color3.new(1, 1, 1), 0.5)
			backLight.Color = color
			for _, p in ipairs(pointers) do p.Color = color:Lerp(Color3.new(1, 1, 1), 0.35) end
		end
		-- Lauflichter: schneller, je schneller das Band
		clock = clock + 0.03 * (0.5 + (speed or 0) * 4)
		for _, l in ipairs(lamps) do
			l.Part.Color = Color3.fromHSV((l.I * 0.06 + clock) % 1, 0.7, 1)
		end
		streaks.Rate = math.clamp((speed or 0) * 120, 0, 90)
	end

	local start = 3
	local jitter = rng:NextNumber(-0.38, 0.38) -- bleibt nicht genau in der Mitte stehen
	local goal = win + jitter
	local frames = math.floor(RollFx.SpinTime / 0.03)
	local lastPos = start
	for f = 1, frames do
		local t = f / frames
		local e = 1 - (1 - t) ^ 5
		local pos = start + (goal - start) * e
		-- Herzschlag am Ende: das Licht pocht, während das Band kriecht
		if t > 0.75 then
			backLight.Brightness = 2 + math.abs(math.sin(f * 0.35)) * 4
		end
		layout(pos, math.sin(f * 0.21) * 0.25 * (1 - t), pos - lastPos)
		lastPos = pos
		task.wait(0.03)
	end
	-- einrasten
	for f = 1, 10 do
		local e = f / 10
		layout(goal + (win - goal) * (1 - (1 - e) ^ 2), 0, 0)
		task.wait(0.03)
	end
	layout(win, 0, 0)
	streaks.Rate = 0
	task.wait(0.3)

	-- 5. Gewinn: alles andere verschwindet, die Sache springt nach vorne; je seltener, desto größer der Auftritt
	local winner = slots[win]
	winner.Model.Parent = folder -- bleibt, wenn das Band verschwindet
	for k, slot in ipairs(slots) do
		if slot.Model and k ~= win then
			slot.Card(PARK, 1)
			slot.Place(PARK, slot.Scale)
		end
	end
	winner.Card(PARK, 1)
	for _, p in ipairs(reel:GetChildren()) do
		if p:IsA("BasePart") then tween(p, 0.35, { Transparency = 1 }) end
	end
	local to = reelC * CFrame.new(0, -0.3, -1.6)
	local from = reelC * CFrame.new(0, 0.15, -0.75)
	local big = winner.Scale * 1.4
	local anchor = holder(folder, to)
	anchor.Name = GardenData.LootName(item)
	-- Strahlenkranz hinter dem Gewinn (ab Selten), bei Göttlich in Regenbogenfarben
	local rays = {}
	if rare >= 1 then
		local nRays = 6 + rare * 2
		for i = 1, nRays do
			local ray = Instance.new("Part")
			ray.Name = "Strahl"
			ray.Anchored, ray.CanCollide = true, false
			ray.Material = Enum.Material.Neon
			ray.Color = rare >= 5 and Color3.fromHSV(i / nRays, 0.6, 1) or tier.Color
			ray.Transparency = 0.58
			ray.Size = Vector3.new(0.05, 0.05, 0.05)
			ray.Parent = folder
			table.insert(rays, { Part = ray, A = i / nRays * math.pi * 2, L = 3.6 + rare * 0.9 })
		end
	end
	local function placeRays(spinA, k)
		for _, r in ipairs(rays) do
			local a = r.A + spinA
			r.Part.Size = Vector3.new(0.28 * k, r.L * k, 0.05)
			r.Part.CFrame = to * CFrame.new(0, 0, 0.9) * CFrame.Angles(0, 0, a) * CFrame.new(0, r.L * k / 2, 0)
		end
	end
	local steps = 16
	for s = 1, steps do
		local t = s / steps
		local backOut = 1 + 2.7 * (t - 1) ^ 3 + 1.7 * (t - 1) ^ 2 -- Überschwingen wie Back-Out
		winner.Place(from:Lerp(to, t) * CFrame.Angles(0, (1 - t) * math.pi * 2, 0), winner.Scale + (big - winner.Scale) * backOut)
		placeRays(t, t)
		task.wait(0.03)
	end
	winner.Place(to, big)
	label(anchor, item, tier).StudsOffsetWorldSpace = Vector3.new(0, RollFx.ItemSize * 1.4 / 2 + 0.7, 0)
	local pop = emitter(anchor, { Color = ColorSequence.new(tier.Color, Color3.new(1, 1, 1)), Lifetime = NumberRange.new(0.6, 1.2), Speed = NumberRange.new(5, 10 + rare * 2), SpreadAngle = Vector2.new(180, 180), Drag = 3, Size = NumberSequence.new(0.4, 0) })
	pop:Emit(18 + rare * 14)
	local winConfetti = emitter(anchor, { Color = ColorSequence.new(tier.Color, tier.Color:Lerp(Color3.new(1, 1, 1), 0.6)), LightEmission = 0.4, Lifetime = NumberRange.new(1, 1.8), Speed = NumberRange.new(8, 14), SpreadAngle = Vector2.new(60, 60), EmissionDirection = Enum.NormalId.Top, Acceleration = Vector3.new(0, -12, 0), Drag = 1, Size = NumberSequence.new(0.3, 0.15), RotSpeed = NumberRange.new(-300, 300) })
	winConfetti:Emit(20 + rare * 15)
	local l = Instance.new("PointLight")
	l.Color = tier.Color
	l.Brightness = 6 + rare * 2
	l.Range = 10 + rare * 2
	l.Parent = anchor
	tween(l, 1.2, { Brightness = 1.5 + rare * 0.4 })
	shockwave(folder, to * CFrame.Angles(0, math.rad(90), 0), tier.Color, 5 + rare * 2, 0.6)
	if rare >= 3 then
		shockwave(folder, origin * CFrame.new(0, 0.7, 0) * CFrame.Angles(0, 0, math.rad(90)), tier.Color, 14 + rare * 3, 1)
		local sp = Instance.new("Sparkles")
		sp.SparkleColor = tier.Color
		sp.Parent = anchor
		-- mehrere Wellen hintereinander, bei Göttlich drei
		for wave = 1, rare - 2 do
			task.delay(0.25 * wave, function()
				if folder.Parent then
					shockwave(folder, to * CFrame.Angles(0, math.rad(90), 0), wave % 2 == 0 and Color3.new(1, 1, 1) or tier.Color, 8 + rare * 2 + wave * 2, 0.7)
					pop:Emit(12 + rare * 4)
				end
			end)
		end
	end
	task.delay(0.4, function()
		reel:Destroy()
	end)
	-- schweben und drehen, der Strahlenkranz dreht sich langsam mit
	task.spawn(function()
		local t = 0
		while folder.Parent do
			t = t + 0.05
			if winner.Model.Parent then
				winner.Place(to * CFrame.new(0, math.sin(t * 2) * 0.1, 0) * CFrame.Angles(0, math.sin(t * 0.8) * 0.6, 0), big)
			end
			placeRays(1 + t * 0.25, 1 + math.sin(t * 3) * 0.05)
			task.wait(0.05)
		end
	end)
	task.wait(0.5)
	return { Folder = folder, Item = item }
end

return RollFx
`;
