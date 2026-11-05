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
      Items: num(r.items),
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
-- Eine Münzrolle enthält Items Sachen für den Münzbaumgarten (Bäume und Werkzeug aus GardenData).
-- Luck hebt seltene Stufen an: Gewicht einer Seltenheit = Chance × Luck ^ (Stufe / 5).
-- Die letzte Sache ist mindestens Guarantee (falls vorher nichts so Seltenes kam).
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

-- Öffnet eine Rolle: Liste von Sachen (Einträge aus GardenData.Loot), seltenste zuletzt
function RollData.Open(rollId, rng)
	rng = rng or Random.new()
	local roll = RollData.ById[rollId]
	local min = roll.Guarantee and GardenData.RarityById[roll.Guarantee].Index or 1
	local free = RollData.TierChances(roll)
	local sure = RollData.TierChances(roll, min)
	local out, reached = {}, false
	for k = 1, roll.Items do
		local chances = free
		if k == roll.Items and not reached then
			chances = sure
		end
		local tier = GardenData.Rarities[pickTier(chances, rng)]
		if tier.Index >= min then
			reached = true
		end
		local pool = {}
		for _, item in ipairs(GardenData.Loot) do
			if item.Rarity == tier.Id then
				table.insert(pool, item)
			end
		end
		table.insert(out, pool[rng:NextInteger(1, #pool)])
	end
	table.sort(out, function(a, b)
		return GardenData.RarityById[a.Rarity].Index < GardenData.RarityById[b.Rarity].Index
	end)
	return out
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
-- RollFx.Play(rollId, itemIds, options) zeigt das Öffnen einer Rolle an einem Ort
-- (options.CFrame = Boden unter der Rolle, options.Parent = Elternteil, Standard workspace).
-- itemIds: Liste von Ids aus GardenData (Bäume, Werkzeug), am besten aus RollData.Open auf dem Server.
-- Die Rolle wackelt, hebt ab, dreht sich immer schneller und reißt auf. Papierfetzen fliegen, dann
-- springen die Sachen einzeln heraus und reihen sich auf. Seltene kommen mit Blitz und Druckwelle,
-- vor einer sehr seltenen letzten (ab Legendär) gibt es eine kurze Pause.
-- Läuft am besten auf dem Client (LocalScript). Gibt { Folder, Items } zurück, wenn alles liegt.

local TweenService = game:GetService("TweenService")
local GardenData = require(script.Parent.GardenData)
local LootBuilder = require(script.Parent.LootBuilder)
local RollData = require(script.Parent.RollData)
local RollBuilder = require(script.Parent.RollBuilder)

local RollFx = {}

RollFx.ItemSize = 2.1 -- so hoch wird jede Sache in Studs
RollFx.PerRow = 4

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

-- Platz der k-ten von n Sachen: Reihen zu je PerRow, leicht gebogen, oberste Reihe zuerst
local function slot(k, n)
	local per = RollFx.PerRow
	local rows = math.ceil(n / per)
	local row = math.floor((k - 1) / per)
	local inRow = math.min(per, n - row * per)
	local col = (k - 1) % per
	-- die Kamera schaut von vorne (−Z), dort liegt +X links: darum von +X nach −X auffüllen
	local x = ((inRow - 1) / 2 - col) * 2.45
	local y = 2.2 + (rows - 1 - row) * 2.95
	local z = -1.6 + 0.09 * x * x
	return Vector3.new(x, y, z)
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

function RollFx.Play(rollId, itemIds, options)
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

	-- 4. Die Sachen springen einzeln heraus, die seltenste zuletzt
	local items = {}
	local n = #itemIds
	for k, id in ipairs(itemIds) do
		local item = GardenData.ById[id]
		local tier = GardenData.RarityById[item.Rarity]
		local rare = tier.Index - 1 -- 0 bei Gewöhnlich
		local isLast = k == n
		-- Spannung vor einer sehr seltenen letzten Sache
		if isLast and rare >= 3 then
			local tease = emitter(burst, { Color = ColorSequence.new(tier.Color), Lifetime = NumberRange.new(0.5, 0.9), Speed = NumberRange.new(-6, -3), SpreadAngle = Vector2.new(180, 180), Size = NumberSequence.new(0.4, 0), Rate = 40 + rare * 15 })
			local pulse = Instance.new("PointLight")
			pulse.Color = tier.Color
			pulse.Brightness = 0
			pulse.Range = 14
			pulse.Parent = burst
			tween(pulse, 0.5 + rare * 0.2, { Brightness = 6 }, Enum.EasingStyle.Sine, Enum.EasingDirection.In)
			task.wait(0.5 + rare * 0.2)
			tease.Rate = 0
			tween(pulse, 0.6, { Brightness = 0 })
		end

		local model = LootBuilder.Build(item)
		model.Parent = folder
		local height = model:GetAttribute("Height") or 2
		local scale = RollFx.ItemSize / height
		local place = rig(model, CFrame.new(0, height / 2, 0))
		local from = center.Position
		local to = (origin * CFrame.new(slot(k, n))).Position
		local flight = 0.32 + (isLast and 0.12 or 0)
		local steps = math.max(4, math.floor(flight / 0.03))
		local turns = 1 + math.min(rare, 3)
		for s = 1, steps do
			local t = s / steps
			local e = 1 - (1 - t) ^ 3
			local pos = from:Lerp(to, e) + Vector3.new(0, math.sin(t * math.pi) * 2.2, 0)
			place(CFrame.new(pos) * CFrame.Angles(0, (1 - e) * turns * math.pi * 2, 0), scale * (0.3 + 0.7 * e))
			task.wait(flight / steps)
		end
		place(CFrame.new(to), scale)
		local anchor = holder(folder, CFrame.new(to))
		anchor.Name = item.Name
		label(anchor, item, tier)
		local pop = emitter(anchor, { Color = ColorSequence.new(tier.Color, Color3.new(1, 1, 1)), Lifetime = NumberRange.new(0.4, 0.8), Speed = NumberRange.new(3, 6 + rare), SpreadAngle = Vector2.new(180, 180), Drag = 3, Size = NumberSequence.new(0.3, 0) })
		pop:Emit(6 + rare * 8)
		if rare >= 1 then
			local l = Instance.new("PointLight")
			l.Color = tier.Color
			l.Brightness = 3 + rare * 1.5
			l.Range = 6 + rare
			l.Parent = anchor
			tween(l, 0.8, { Brightness = 0.5 + rare * 0.25 })
		end
		if rare >= 2 then
			shockwave(folder, CFrame.new(to) * CFrame.Angles(0, math.rad(90), 0), tier.Color, 3 + rare, 0.5)
		end
		if isLast and rare >= 3 then
			shockwave(folder, origin * CFrame.new(0, 0.7, 0) * CFrame.Angles(0, 0, math.rad(90)), tier.Color, 14 + rare * 3, 1)
			local s = Instance.new("Sparkles")
			s.SparkleColor = tier.Color
			s.Parent = anchor
		end
		table.insert(items, { Model = model, Item = item, Tier = tier, Place = place, Position = to, Scale = scale })
		task.wait(isLast and 0.3 or 0.12 + math.min(rare, 3) * 0.08)
	end

	-- die Sachen wiegen sich sanft und drehen sich, solange der Ordner existiert
	task.spawn(function()
		local t = 0
		while folder.Parent do
			t = t + 0.05
			for i, c in ipairs(items) do
				local bob = math.sin(t * 2 + i) * 0.08
				c.Place(CFrame.new(c.Position + Vector3.new(0, bob, 0)) * CFrame.Angles(0, math.sin(t * 0.8 + i * 0.7) * 0.5, 0), c.Scale)
			end
			task.wait(0.05)
		end
	end)
	return { Folder = folder, Items = items }
end

return RollFx
`;
