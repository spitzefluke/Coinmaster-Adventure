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
-- itemId: Id aus GardenData (Baum oder Werkzeug), am besten aus RollData.Open auf dem Server.
-- Die Rolle wackelt, hebt ab, dreht sich immer schneller und reißt auf. Dann läuft ein Band mit Sachen
-- durch (Rollanimation), wird langsamer und bleibt unter der Markierung auf der gewonnenen Sache stehen.
-- Die springt heraus; seltene mit Blitz und Druckwelle. Die Vorderseite zeigt nach −Z.
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
RollFx.SpinTime = 5 -- Sekunden, bis das Band steht
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
	title.Text = item.Name
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

function RollFx.Play(rollId, itemId, options)
	options = options or {}
	local roll = RollData.ById[rollId]
	local origin = options.CFrame or CFrame.new()
	local rank = roll.Rank
	local glow = roll.Glow
	local folder = Instance.new("Folder")
	folder.Name = "Muenzrolle"
	folder.Parent = options.Parent or workspace

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
	local pose, parts = rig(moving, base)
	local light = moving:FindFirstChild("Wrapper"):FindFirstChildOfClass("PointLight")

	-- 1. Wackeln um die Unterkante, immer heftiger
	local shakes = 3 + rank
	for i = 1, shakes do
		local k = i / shakes
		local angle = math.rad(5 + k * 12) * (i % 2 == 0 and 1 or -1)
		local time = 0.16 - k * 0.07
		local steps = math.max(2, math.floor(time / 0.03))
		for s = 1, steps do
			local a = angle * math.sin(s / steps * math.pi)
			pose(base * CFrame.Angles(0, 0, a))
			task.wait(time / steps)
		end
		if light then
			light.Brightness = 1 + k * (3 + rank)
		end
		task.wait(0.1 * (1 - k))
	end
	pose(base)

	-- 2. Abheben und immer schneller drehen
	local spinTime = 0.7 + rank * 0.15
	local frames = math.floor(spinTime / 0.03)
	local turn = 0
	for f = 1, frames do
		local k = f / frames
		turn = turn + (0.15 + k * k * 1.1)
		pose(base * CFrame.new(0, k * 1.2, 0) * CFrame.Angles(0, turn, 0) * CFrame.Angles(0, 0, math.sin(f * 1.7) * 0.05 * k))
		task.wait(0.03)
	end
	for _, e in ipairs(parts) do
		if e.Part.Name == "Wrapper" or e.Part.Name == "Band" then
			tween(e.Part, 0.15, { Color = glow })
			e.Part.Material = Enum.Material.Neon
		end
	end
	task.wait(0.15)

	-- 3. Aufreißen: Blitz, Konfetti, Papierfetzen, Druckwelle
	local center = base * CFrame.new(0, 1.2 + RollBuilder.Height / 2, 0)
	local burst = holder(folder, center)
	burst.Name = "Blitz"
	local confetti = emitter(burst, { Color = ColorSequence.new(roll.Paper, roll.Band), LightEmission = 0.3, Lifetime = NumberRange.new(0.8, 1.4), Speed = NumberRange.new(9, 16 + rank * 2), SpreadAngle = Vector2.new(180, 180), Drag = 2, Size = NumberSequence.new(0.35, 0.15), Acceleration = Vector3.new(0, -14, 0), RotSpeed = NumberRange.new(-300, 300) })
	confetti:Emit(40 + rank * 15)
	local sparks = emitter(burst, { Color = ColorSequence.new(glow, Color3.new(1, 1, 1)), Lifetime = NumberRange.new(0.5, 1), Speed = NumberRange.new(10, 18), SpreadAngle = Vector2.new(180, 180), Drag = 3, Size = NumberSequence.new(0.5, 0) })
	sparks:Emit(20 + rank * 10)
	local flash = Instance.new("PointLight")
	flash.Color = glow
	flash.Brightness = 10
	flash.Range = 18 + rank * 2
	flash.Parent = burst
	tween(flash, 1.2, { Brightness = 0 })
	shockwave(folder, center * CFrame.Angles(0, 0, math.rad(90)), glow, 10 + rank * 2, 0.8)
	moving:Destroy()

	local rng = Random.new()
	local scraps = {}
	for i = 1, 10 + rank * 2 do
		local a = rng:NextNumber(0, math.pi * 2)
		local p = Instance.new("Part")
		p.Name = "Fetzen"
		p.Anchored = true
		p.CanCollide = false
		p.Size = Vector3.new(rng:NextNumber(0.5, 0.9), rng:NextNumber(0.4, 0.8), 0.05)
		p.Color = i % 3 == 0 and roll.Band or roll.Paper
		p.Material = Enum.Material.SmoothPlastic
		p.CFrame = center * CFrame.new(math.cos(a) * 0.8, rng:NextNumber(-1.4, 1.4), math.sin(a) * 0.8) * CFrame.Angles(rng:NextNumber(0, 6), a, 0)
		p.Parent = folder
		table.insert(scraps, { Part = p, Vel = Vector3.new(math.cos(a), 0, math.sin(a)) * rng:NextNumber(7, 13) + Vector3.new(0, rng:NextNumber(5, 11), 0), Spin = CFrame.Angles(rng:NextNumber(-0.4, 0.4), rng:NextNumber(-0.4, 0.4), rng:NextNumber(-0.4, 0.4)) })
	end
	task.spawn(function()
		for f = 1, 34 do
			for _, s in ipairs(scraps) do
				s.Vel = s.Vel + Vector3.new(0, -26 * 0.03, 0)
				s.Vel = s.Vel * 0.97
				s.Part.CFrame = (s.Part.CFrame + s.Vel * 0.03) * s.Spin
				if f > 20 then
					s.Part.Transparency = (f - 20) / 14
				end
			end
			task.wait(0.03)
		end
		for _, s in ipairs(scraps) do
			s.Part:Destroy()
		end
	end)
	task.wait(0.2)

	-- 4. Rollband: Felder mit Sachen laufen von rechts nach links durch und bleiben auf dem Gewinn stehen
	if type(itemId) == "table" then itemId = itemId[1] end
	local item = GardenData.ById[itemId]
	local tier = GardenData.RarityById[item.Rarity]
	local rare = tier.Index - 1 -- 0 bei Gewöhnlich
	local window = options.Window or RollFx.Window
	local spacing = RollFx.Spacing
	local reelC = origin * CFrame.new(0, 3.9, 0)
	local reel = Instance.new("Model")
	reel.Name = "Rollband"
	reel.Parent = folder
	local function block(name, size, cf, color, material, transparency)
		local p = Instance.new("Part")
		p.Name = name
		p.Anchored = true
		p.CanCollide = false
		p.Size = size
		p.CFrame = cf
		p.Color = color
		p.Material = material or Enum.Material.SmoothPlastic
		p.Transparency = transparency or 0
		p.Parent = reel
		return p
	end
	local width = window * 2 + 2
	local frameParts = {
		block("Rueckwand", Vector3.new(width, 4.4, 0.3), reelC * CFrame.new(0, 0, 1), Color3.fromRGB(26, 22, 36)),
		block("RandOben", Vector3.new(width, 0.18, 0.5), reelC * CFrame.new(0, 2.25, 0.4), glow, Enum.Material.Neon),
		block("RandUnten", Vector3.new(width, 0.18, 0.5), reelC * CFrame.new(0, -2.25, 0.4), glow, Enum.Material.Neon),
	}
	local marker = block("Markierung", Vector3.new(0.09, 4.3, 0.09), reelC * CFrame.new(0, 0, -1.7), Color3.new(1, 1, 1), Enum.Material.Neon, 0.35)
	table.insert(frameParts, marker)
	for _, y in ipairs({ 2.45, -2.45 }) do
		table.insert(frameParts, block("Zeiger", Vector3.new(0.5, 0.5, 0.2), reelC * CFrame.new(0, y, -1.7) * CFrame.Angles(0, 0, math.rad(45)), Color3.fromRGB(255, 220, 120), Enum.Material.Neon))
	end
	-- Band aufrollen lassen: Rand wächst aus der Mitte
	for _, p in ipairs(frameParts) do
		if p.Name ~= "Markierung" and p.Name ~= "Zeiger" then
			local size = p.Size
			p.Size = Vector3.new(0.2, size.Y, size.Z)
			tween(p, 0.35, { Size = size }, Enum.EasingStyle.Back)
		end
	end

	-- Felder: Sache plus Karte mit Streifen in der Farbe der Seltenheit. Gebaut wird erst, wenn sie ins Bild kommen.
	local n = RollFx.Slots
	local win = n - 4
	local rng = Random.new()
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
		slots[k] = { Item = thing }
	end
	local PARK = origin * CFrame.new(0, -500, 0)
	local function build(slot)
		local it = slot.Item
		local r = GardenData.RarityById[it.Rarity]
		local m = LootBuilder.Build(it)
		m.Parent = reel
		local h = m:GetAttribute("Height") or 2
		slot.Scale = RollFx.ItemSize / h
		slot.Place = rig(m, CFrame.new(0, h / 2, 0))
		slot.Model = m
		local card = Instance.new("Model")
		card.Name = "Karte"
		local back = Instance.new("Part")
		back.Anchored, back.CanCollide = true, false
		back.Size = Vector3.new(spacing - 0.3, 3.8, 0.1)
		back.CFrame = CFrame.new(0, 0, 0.55)
		back.Color = Color3.fromRGB(44, 38, 58)
		back.Material = Enum.Material.SmoothPlastic
		back.Parent = card
		local stripe = back:Clone()
		stripe.Size = Vector3.new(spacing - 0.3, 0.26, 0.12)
		stripe.CFrame = CFrame.new(0, -1.72, 0.48)
		stripe.Color = r.Color
		stripe.Material = Enum.Material.Neon
		stripe.Parent = card
		local glowBack = back:Clone()
		glowBack.Size = Vector3.new(spacing - 0.9, 3, 0.05)
		glowBack.CFrame = CFrame.new(0, 0.1, 0.48)
		glowBack.Color = r.Color
		glowBack.Transparency = 0.82
		glowBack.Material = Enum.Material.Neon
		glowBack.Parent = card
		card.Parent = reel
		slot.Card = rig(card, CFrame.new())
		slot.Visible = true
	end
	local lastTick = nil
	local function layout(pos, spin)
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
					slot.Place(cf * CFrame.new(0, 0.15, -0.35) * CFrame.Angles(0, spin or 0, 0), slot.Scale)
					slot.Visible = true
				elseif slot.Visible then
					slot.Card(PARK, 1)
					slot.Place(PARK, slot.Scale)
					slot.Visible = false
				end
			end
		end
		-- jedes Feld, das die Markierung passiert, lässt sie kurz aufleuchten
		local current = math.floor(pos + 0.5)
		if current ~= lastTick then
			lastTick = current
			marker.Transparency = 0
			tween(marker, 0.12, { Transparency = 0.35 })
		end
	end

	local start = 3
	local jitter = rng:NextNumber(-0.38, 0.38) -- bleibt nicht genau in der Mitte stehen
	local goal = win + jitter
	local frames = math.floor(RollFx.SpinTime / 0.03)
	for f = 1, frames do
		local t = f / frames
		local e = 1 - (1 - t) ^ 4
		layout(start + (goal - start) * e, math.sin(f * 0.21) * 0.25 * (1 - t))
		task.wait(0.03)
	end
	-- einrasten
	for f = 1, 10 do
		local e = f / 10
		layout(goal + (win - goal) * (1 - (1 - e) ^ 2))
		task.wait(0.03)
	end
	layout(win)
	task.wait(0.25)

	-- 5. Gewinn: alles andere verschwindet, die Sache springt nach vorne
	local winner = slots[win]
	winner.Model.Parent = folder -- bleibt, wenn das Band verschwindet
	for k, slot in ipairs(slots) do
		if slot.Model and k ~= win then
			slot.Card(PARK, 1)
			slot.Place(PARK, slot.Scale)
		end
	end
	winner.Card(PARK, 1)
	for _, p in ipairs(frameParts) do
		tween(p, 0.35, { Transparency = 1 })
	end
	local from = reelC * CFrame.new(0, 0.15, -0.35)
	local to = reelC * CFrame.new(0, -0.3, -1.6)
	local big = winner.Scale * 1.35
	local steps = 16
	for s = 1, steps do
		local t = s / steps
		local back = 1 + 2.7 * (t - 1) ^ 3 + 1.7 * (t - 1) ^ 2 -- Überschwingen wie Back-Out
		winner.Place(from:Lerp(to, t) * CFrame.Angles(0, (1 - t) * math.pi * 2, 0), winner.Scale + (big - winner.Scale) * back)
		task.wait(0.03)
	end
	winner.Place(to, big)
	local anchor = holder(folder, to)
	anchor.Name = item.Name
	local gui = label(anchor, item, tier)
	gui.StudsOffsetWorldSpace = Vector3.new(0, RollFx.ItemSize * 1.35 / 2 + 0.7, 0)
	local pop = emitter(anchor, { Color = ColorSequence.new(tier.Color, Color3.new(1, 1, 1)), Lifetime = NumberRange.new(0.5, 1), Speed = NumberRange.new(4, 8 + rare * 2), SpreadAngle = Vector2.new(180, 180), Drag = 3, Size = NumberSequence.new(0.35, 0) })
	pop:Emit(14 + rare * 12)
	local l = Instance.new("PointLight")
	l.Color = tier.Color
	l.Brightness = 4 + rare * 1.5
	l.Range = 8 + rare
	l.Parent = anchor
	tween(l, 1, { Brightness = 1 + rare * 0.3 })
	if rare >= 2 then
		shockwave(folder, to * CFrame.Angles(0, math.rad(90), 0), tier.Color, 5 + rare * 1.5, 0.6)
	end
	if rare >= 3 then
		shockwave(folder, origin * CFrame.new(0, 0.7, 0) * CFrame.Angles(0, 0, math.rad(90)), tier.Color, 14 + rare * 3, 1)
		local sp = Instance.new("Sparkles")
		sp.SparkleColor = tier.Color
		sp.Parent = anchor
	end
	task.delay(0.4, function()
		reel:Destroy()
	end)
	-- leicht schweben und drehen, solange der Ordner existiert
	task.spawn(function()
		local t = 0
		while folder.Parent do
			t = t + 0.05
			if winner.Model.Parent then
				winner.Place(to * CFrame.new(0, math.sin(t * 2) * 0.1, 0) * CFrame.Angles(0, math.sin(t * 0.8) * 0.6, 0), big)
			end
			task.wait(0.05)
		end
	end)
	task.wait(0.4)
	return { Folder = folder, Item = item }
end

return RollFx
`;
