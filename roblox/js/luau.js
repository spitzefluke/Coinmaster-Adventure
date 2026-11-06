// Erzeugt aus den Daten der Webseite (Münzen, Stufen, Mutationen, Wetter, Eier, Welten) Luau-Code
// für Roblox Studio: einzelne ModuleScripts und ein Installer-Skript für die Befehlsleiste.
//
// Alles ist reiner Text – keine Abhängigkeit vom Browser, damit es auch in Node prüfbar ist.

import { auraDataSource, AURA_FX, AURA_SERVER, AURA_CLIENT, AURA_SHOWCASE } from './auraLuau.js';
import { petDataSource, PET_BUILDER, HATCH_FX } from './petLuau.js';
import { EGG_BUILDER } from './eggLuau.js';
import { worldFxSource, WORLD_FX_CLIENT } from './worldFxLuau.js';
import { shopDataSource, GAME_UI, SHOP_SERVER, UI_CLIENT, UI_THEME } from './uiLuau.js';
import { skillDataSource, rewardDataSource, playerServerSource } from './uiMoreLuau.js';
import { PLAYER_DATA, PLAYER_DATA_START } from './dataLuau.js';
import { rollDataSource, ROLL_BUILDER, ROLL_FX } from './rollLuau.js';
import { gardenDataSource, LOOT_BUILDER, GARDEN_BUILDER, GARDEN_SERVER, GARDEN_CLIENT } from './gardenLuau.js';

// ── Luau-Werte ───────────────────────────────────────────────────────────────

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

// ── ModuleScripts ────────────────────────────────────────────────────────────

export function coinDataSource({ TIERS, COINS }) {
  const tiers = TIERS.map((t, i) =>
    fields({
      Id: str(t.id),
      Name: str(t.name),
      Index: num(i + 1),
      Value: num(Number(t.value)),
      Chance: num(t.chance),
      Color: color(t.color),
      Edge: str(t.edge),
      Effects: `{ ${t.fx.map(str).join(', ')} }`,
    }),
  );
  const coins = COINS.map((c, i) =>
    fields({
      Id: num(i + 1),
      Name: str(c.name),
      Tier: str(c.tier),
      Emblem: str(c.emblem),
      Text: str(c.text),
      Metal: `{ Light = ${color(c.metal[0])}, Mid = ${color(c.metal[1])}, Dark = ${color(c.metal[2])} }`,
      Accent: c.glow || c.gem || c.ember ? color(c.glow || c.gem || c.ember) : undefined,
      DecalId: '0',
    }),
  );
  return `${HEADER('Stufen und Münzen')}
-- DecalId: Nach dem Hochladen der Motive (ZIP von der Webseite) hier die Asset-ID eintragen,
-- dann zeigt CoinBuilder das Motiv auf beiden Seiten der Münze.

local CoinData = {}

-- Value: Nennwert in Talern (math.huge = unendlich), Chance: Drop-Chance in Prozent
CoinData.Tiers = ${list(tiers)}

CoinData.Coins = ${list(coins)}

CoinData.TierById = {}
for _, tier in ipairs(CoinData.Tiers) do
	CoinData.TierById[tier.Id] = tier
end

CoinData.CoinByName = {}
for _, coin in ipairs(CoinData.Coins) do
	CoinData.CoinByName[coin.Name] = coin
end

-- Wert einer gefundenen Münze: Nennwert (unendlich zählt als 1 Mio.) × Mutation × Fundbonus
-- (Fundbonus = Skills, Aura, Welt und Wiedergeburten beim Finden)
function CoinData.EntryValue(coinId, mutationMultiplier, bonus)
	local coin = CoinData.Coins[coinId]
	if not coin then return 0 end
	local base = CoinData.TierById[coin.Tier].Value
	if base == math.huge then base = 1000000 end
	return math.floor(base * (mutationMultiplier or 1) * (bonus or 1) * 100 + 0.5) / 100
end

return CoinData
`;
}

export function mutationDataSource({ MUTATIONS, WEATHER, WEATHER_MS = 180000 }) {
  const muts = MUTATIONS.map((m) =>
    fields({ Id: str(m.id), Name: str(m.name), Multiplier: num(m.multiplier), Color: color(m.color), Weather: str(m.weather), Chance: num(m.chance), Effect: str(m.effect) }),
  );
  const weather = WEATHER.map((w) => fields({ Id: str(w.id), Name: str(w.name), Weight: num(w.weight), Color: color(w.color), Text: str(w.text), Sky: w.sky ? color(w.sky) : undefined, Light: w.light != null ? num(w.light) : undefined }));
  return `${HEADER('Mutationen und Wetter')}
local MutationData = {}

-- Chance: Prozent, mit der eine gezogene Münze während des passenden Wetters mutiert
MutationData.Mutations = ${list(muts)}

-- Weight: wie häufig das Wetter im Vergleich vorkommt
-- Sky/Light: Farbe und Helligkeit, die WeatherFx in Lighting setzt
MutationData.Weather = ${list(weather)}

-- Sekunden, die ein Wetter anhält
MutationData.WeatherDuration = ${num(WEATHER_MS / 1000)}

MutationData.ById = {}
for _, m in ipairs(MutationData.Mutations) do
	MutationData.ById[m.Id] = m
end

MutationData.WeatherById = {}
for _, w in ipairs(MutationData.Weather) do
	MutationData.WeatherById[w.Id] = w
end

function MutationData.ForWeather(weatherId)
	for _, m in ipairs(MutationData.Mutations) do
		if m.Weather == weatherId then
			return m
		end
	end
	return nil
end

return MutationData
`;
}

export function eggDataSource({ EGGS }) {
  const eggs = EGGS.map((e) =>
    fields({
      Id: str(e.id),
      Name: str(e.name),
      Alias: e.alias ? str(e.alias) : undefined,
      Rank: num(e.rank),
      RankName: str(e.rankName),
      Color: color(e.color),
      Glow: color(e.glow),
      Price: e.price ? `{ Amount = ${num(e.price.amount)}, Currency = ${str(e.price.currency === 'robux' ? 'Robux' : 'Coins')} }` : 'nil',
      Availability: str(e.availability),
      Text: str(e.text),
    }),
  );
  return `${HEADER('Eier')}
-- Price = nil: nicht kaufbar. Currency "Robux" braucht im Spiel ein Developer Product.

local EggData = {}

EggData.Eggs = ${list(eggs)}

EggData.ById = {}
for _, egg in ipairs(EggData.Eggs) do
	EggData.ById[egg.Id] = egg
end

return EggData
`;
}

export const GACHA = `${HEADER('Ziehen, Mutationen, Wetter')}
-- Wichtig: Im Spiel nur auf dem Server würfeln (z. B. in einem Script in
-- ServerScriptService), nie auf dem Client – sonst lässt sich das Ergebnis fälschen.

local CoinData = require(script.Parent.CoinData)
local MutationData = require(script.Parent.MutationData)

local Gacha = {}

-- Zieht eine Münze nach Drop-Chance: erst die Stufe, dann gleichverteilt innerhalb der Stufe
function Gacha.RollCoin(rng)
	rng = rng or Random.new()
	local roll = rng:NextNumber() * 100
	local chosen = CoinData.Tiers[1]
	for _, tier in ipairs(CoinData.Tiers) do
		roll = roll - tier.Chance
		if roll <= 0 then
			chosen = tier
			break
		end
	end
	local pool = {}
	for _, coin in ipairs(CoinData.Coins) do
		if coin.Tier == chosen.Id then
			table.insert(pool, coin)
		end
	end
	return pool[rng:NextInteger(1, #pool)]
end

-- Gibt die Mutation zurück, wenn die Münze während dieses Wetters mutiert, sonst nil
function Gacha.RollMutation(weatherId, rng)
	rng = rng or Random.new()
	local m = MutationData.ForWeather(weatherId)
	if m and rng:NextNumber() * 100 < m.Chance then
		return m
	end
	return nil
end

-- Aktuelles Wetter und Sekunden bis zum Wechsel. Ergibt sich aus der Uhrzeit,
-- damit alle Server dasselbe Wetter haben.
function Gacha.CurrentWeather(now)
	now = now or os.time()
	local duration = MutationData.WeatherDuration
	local slot = math.floor(now / duration)
	local total = 0
	for _, w in ipairs(MutationData.Weather) do
		total = total + w.Weight
	end
	local roll = Random.new(slot):NextNumber() * total
	for _, w in ipairs(MutationData.Weather) do
		roll = roll - w.Weight
		if roll < 0 then
			return w, (slot + 1) * duration - now
		end
	end
	return MutationData.Weather[1], 0
end

-- Wert einer Münze in Talern, mit Multiplikator der Mutation
function Gacha.Value(coin, mutation)
	local value = CoinData.TierById[coin.Tier].Value
	if mutation then
		value = value * mutation.Multiplier
	end
	return value
end

return Gacha
`;

const BUILD_HELPERS = `local function part(className, props, parent)
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

local function emitter(parent, props)
	local e = Instance.new("ParticleEmitter")
	e.LightEmission = 1
	e.Texture = "rbxasset://textures/particles/sparkles_main.dds"
	for key, value in pairs(props) do
		e[key] = value
	end
	e.Parent = parent
	return e
end

local function light(parent, color, brightness, range)
	local l = Instance.new("PointLight")
	l.Color = color
	l.Brightness = brightness
	l.Range = range
	l.Parent = parent
	return l
end

local function attachment(parent, position)
	local a = Instance.new("Attachment")
	a.Position = position
	a.Parent = parent
	return a
end
`;

export const COIN_BUILDER = `${HEADER('Münzen bauen')}
-- CoinBuilder.Build(coin) baut eine Münze als Model aus Parts. Die Münze steht hochkant,
-- die Vorder- und Rückseite zeigen entlang der X-Achse. Stufen-Effekte (Glühen, Funken,
-- Flügel, Heiligenschein …) werden als Lichter, Partikel und Parts angebaut.

local CoinData = require(script.Parent.CoinData)

local CoinBuilder = {}

local RADIUS = 2
local THICKNESS = 0.3

${BUILD_HELPERS}
-- Steht die Münze am Ursprung, liegt dieser Punkt auf dem Rand im Winkel angle (Grad)
local function onRim(angle, radius, x)
	local a = math.rad(angle)
	return Vector3.new(x or 0, math.sin(a) * radius, math.cos(a) * radius)
end

function CoinBuilder.Build(coin)
	local tier = CoinData.TierById[coin.Tier]
	local accent = coin.Accent or tier.Color
	local effects = {}
	for _, id in ipairs(tier.Effects) do
		effects[id] = true
	end

	local model = Instance.new("Model")
	model.Name = coin.Name

	-- Gestufte Prägung: Randscheibe, darauf der Münzkörper, darauf die Motivplatte; dazwischen ein Perlkreis
	local rim = part("Part", {
		Name = "Rim",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(THICKNESS, RADIUS * 2 + 0.2, RADIUS * 2 + 0.2),
		Color = coin.Metal.Light,
		Material = Enum.Material.Metal,
		Reflectance = 0.25,
	}, model)
	local body = part("Part", {
		Name = "Body",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(THICKNESS * 1.25, RADIUS * 1.84, RADIUS * 1.84),
		Color = tier.Index == 9 and coin.Metal.Dark or coin.Metal.Mid,
		Material = Enum.Material.Metal,
		Reflectance = 0.15,
	}, model)
	local field = part("Part", {
		Name = "Field",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(THICKNESS * 1.5, RADIUS * 1.5, RADIUS * 1.5),
		Color = coin.Metal.Dark,
		Material = Enum.Material.Metal,
		Reflectance = 0.3,
	}, model)
	model.PrimaryPart = body
	for i = 0, 31 do
		for _, side in ipairs({ 1, -1 }) do
			part("Part", { Name = "Perle", Shape = Enum.PartType.Ball, Size = Vector3.new(0.13, 0.13, 0.13), Color = coin.Metal.Light, Material = Enum.Material.Metal, Reflectance = 0.25, CFrame = CFrame.new(onRim(i * 11.25, RADIUS * 0.84, side * THICKNESS * 0.64)) }, model)
		end
	end

	-- Motiv als Decal auf beiden Seiten, sobald eine Asset-ID eingetragen ist
	if coin.DecalId and coin.DecalId > 0 then
		for _, face in ipairs({ Enum.NormalId.Right, Enum.NormalId.Left }) do
			local d = Instance.new("Decal")
			d.Face = face
			d.Texture = "rbxassetid://" .. coin.DecalId
			d.Parent = field
		end
	end

	local center = attachment(body, Vector3.zero)

	if effects.shine then
		emitter(center, { Rate = 3, Lifetime = NumberRange.new(0.4, 0.8), Speed = NumberRange.new(0), Size = NumberSequence.new(0.6, 0), Color = ColorSequence.new(Color3.fromRGB(255, 247, 208)), SpreadAngle = Vector2.new(180, 180) })
	end
	if effects.glow then
		light(body, accent, 2, 10)
	end
	if effects.gems then
		for i = 0, 7 do
			for _, side in ipairs({ 1, -1 }) do
				part("Part", { Name = "Gem", Shape = Enum.PartType.Ball, Size = Vector3.new(0.28, 0.28, 0.28), Color = accent, Material = Enum.Material.Neon, CFrame = CFrame.new(onRim(i * 45, RADIUS * 0.95, side * THICKNESS * 0.55)) }, model)
			end
		end
	end
	if effects.embers then
		emitter(center, { Texture = "rbxasset://textures/particles/fire_main.dds", Rate = 18, Lifetime = NumberRange.new(1, 1.6), Speed = NumberRange.new(2, 4), Acceleration = Vector3.new(0, 3, 0), Size = NumberSequence.new(0.5, 0), Color = ColorSequence.new(accent), SpreadAngle = Vector2.new(25, 25), EmissionDirection = Enum.NormalId.Top })
	end
	if effects.runes or effects.orbitRing then
		field.Material = Enum.Material.Neon
		field.Color = accent
		for i = 0, 15 do
			part("Part", { Name = "RuneStone", Shape = Enum.PartType.Ball, Size = Vector3.new(0.18, 0.18, 0.18), Color = accent, Material = Enum.Material.Neon, CFrame = CFrame.new(onRim(i * 22.5, RADIUS * 1.45, math.sin(i) * 0.4)) }, model)
		end
	end
	if effects.wings then
		for _, side in ipairs({ 1, -1 }) do
			for k = 0, 2 do
				part("Part", { Name = "Feather", Shape = Enum.PartType.Ball, Size = Vector3.new(0.15, 1.1 - k * 0.2, 2.2 - k * 0.45), Color = Color3.new(1, 1, 1), Material = Enum.Material.SmoothPlastic, CFrame = CFrame.new(-0.2, 0.6 + k * 0.25, side * (RADIUS + 0.9 + k * 0.35)) * CFrame.Angles(side * math.rad(20 + k * 12), 0, 0) }, model)
			end
		end
	end
	if effects.halo then
		for i = 0, 23 do
			local a = math.rad(i * 15)
			part("Part", { Name = "Halo", Shape = Enum.PartType.Ball, Size = Vector3.new(0.16, 0.16, 0.16), Color = Color3.fromRGB(255, 224, 138), Material = Enum.Material.Neon, CFrame = CFrame.new(math.sin(a) * 0.35, RADIUS + 0.9, math.cos(a) * 1) }, model)
		end
	end
	if effects.rays then
		light(body, accent, 4, 16)
		emitter(center, { Rate = 6, Lifetime = NumberRange.new(1, 1.5), Speed = NumberRange.new(0), Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.5, 6), NumberSequenceKeypoint.new(1, 0) }), Transparency = NumberSequence.new(0.7), Color = ColorSequence.new(accent), Rotation = NumberRange.new(0, 360), RotSpeed = NumberRange.new(-20, 20) })
	end
	if effects.planets or effects.nebula then
		for i, c in ipairs({ Color3.fromRGB(255, 157, 92), Color3.fromRGB(92, 214, 255), Color3.fromRGB(232, 208, 255) }) do
			part("Part", { Name = "Planet", Shape = Enum.PartType.Ball, Size = Vector3.new(0.5, 0.5, 0.5) * (1.2 - i * 0.2), Color = c, Material = Enum.Material.Neon, CFrame = CFrame.new(onRim(i * 120, RADIUS * 1.6, 0.4 * (i - 2))) }, model)
		end
	end
	if effects.rainbow or effects.rings then
		emitter(center, { Rate = 25, Lifetime = NumberRange.new(1, 2), Speed = NumberRange.new(1, 2), Size = NumberSequence.new(0.35, 0), Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 77, 109)), ColorSequenceKeypoint.new(0.33, Color3.fromRGB(255, 249, 77)), ColorSequenceKeypoint.new(0.66, Color3.fromRGB(77, 210, 255)), ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 77, 216)) }), SpreadAngle = Vector2.new(180, 180) })
		body.Material = Enum.Material.Glass
	end
	if effects.sparkles then
		local s = Instance.new("Sparkles")
		s.SparkleColor = accent
		s.Parent = body
	end

	-- Werte für Skripte im Spiel
	model:SetAttribute("CoinId", coin.Id)
	model:SetAttribute("Tier", coin.Tier)
	model:SetAttribute("Value", tier.Value)
	return model
end

return CoinBuilder
`;

export const MUTATION_FX = `${HEADER('Mutations-Effekte')}
-- MutationFx.Apply(model, mutationId) hängt die dauerhaften Effekte einer Mutation an eine
-- Münze aus CoinBuilder. Animierte Effekte laufen, solange die Münze im Spiel ist.

local MutationData = require(script.Parent.MutationData)

local MutationFx = {}

${BUILD_HELPERS}
-- wiederholt fn alle step Sekunden, bis die Münze entfernt wird
local function loop(model, step, fn)
	task.spawn(function()
		local t = 0
		while model.Parent do
			fn(t)
			t = t + task.wait(step)
		end
	end)
end

local EFFECTS = {}

function EFFECTS.nass(model, body)
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") then
			p.Reflectance = math.min(1, p.Reflectance + 0.3)
		end
	end
	local bottom = attachment(body, Vector3.new(0, -body.Size.Y / 2, 0))
	emitter(bottom, { Rate = 8, Lifetime = NumberRange.new(0.5, 0.8), Speed = NumberRange.new(0), Acceleration = Vector3.new(0, -25, 0), Size = NumberSequence.new(0.25, 0.1), Color = ColorSequence.new(Color3.fromRGB(159, 220, 255)), LightEmission = 0.4 })
end

function EFFECTS.gestein(model, body)
	local rng = Random.new(7)
	for i = 0, 9 do
		local a = math.rad(i * 36 + rng:NextNumber(-10, 10))
		local s = rng:NextNumber(0.35, 0.8)
		part("Part", { Name = "Rock", Size = Vector3.new(s, s * 0.8, s * 1.1), Color = Color3.fromRGB(125, 113, 102), Material = Enum.Material.Slate, CFrame = body.CFrame * CFrame.new(rng:NextNumber(-0.15, 0.15), math.sin(a) * body.Size.Y / 2, math.cos(a) * body.Size.Z / 2) * CFrame.Angles(rng:NextNumber(0, 6), rng:NextNumber(0, 6), 0) }, model)
	end
	local smoke = Instance.new("Smoke")
	smoke.Color = Color3.fromRGB(201, 180, 154)
	smoke.Opacity = 0.08
	smoke.RiseVelocity = -1
	smoke.Size = 1
	smoke.Parent = body
end

function EFFECTS.disco(model, body)
	local colors = { Color3.fromRGB(255, 61, 242), Color3.fromRGB(61, 232, 255), Color3.fromRGB(255, 226, 61), Color3.fromRGB(122, 92, 255) }
	local l = light(body, colors[1], 4, 14)
	local spots = emitter(attachment(body, Vector3.zero), { Rate = 20, Lifetime = NumberRange.new(0.8, 1.2), Speed = NumberRange.new(4, 6), Size = NumberSequence.new(0.3, 0), SpreadAngle = Vector2.new(180, 180) })
	loop(model, 0.4, function(t)
		local c = colors[math.floor(t / 0.4) % #colors + 1]
		l.Color = c
		spots.Color = ColorSequence.new(c)
	end)
end

function EFFECTS.daemonisch(model, body)
	for _, side in ipairs({ 1, -1 }) do
		part("Part", { Name = "Horn", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.9, 0.22, 0.22), Color = Color3.fromRGB(42, 6, 6), Material = Enum.Material.SmoothPlastic, CFrame = body.CFrame * CFrame.new(0, body.Size.Y / 2 + 0.25, side * 0.8) * CFrame.Angles(0, 0, math.rad(90)) * CFrame.Angles(side * math.rad(25), 0, 0) }, model)
	end
	local fire = Instance.new("Fire")
	fire.Color = Color3.fromRGB(255, 42, 26)
	fire.SecondaryColor = Color3.fromRGB(40, 0, 0)
	fire.Heat = 6
	fire.Size = 5
	fire.Parent = body
	light(body, Color3.fromRGB(255, 26, 26), 3, 12)
end

-- Farben laufen weich durch (unter 3 Wechseln pro Sekunde) – grell, aber nicht gefährlich
function EFFECTS.augenkrebs(model, body)
	local sparkles = Instance.new("Sparkles")
	sparkles.Parent = body
	local parts = {}
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") then
			p.Material = Enum.Material.Neon
			table.insert(parts, p)
		end
	end
	loop(model, 0.1, function(t)
		local h = (t * 0.35) % 1
		for i, p in ipairs(parts) do
			p.Color = Color3.fromHSV((h + i * 0.15) % 1, 1, 1)
		end
		sparkles.SparkleColor = Color3.fromHSV((h + 0.5) % 1, 1, 1)
	end)
end

function EFFECTS.hacked(model, body)
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") then
			p.Color = p.Color:Lerp(Color3.fromRGB(61, 255, 122), 0.35)
		end
	end
	emitter(attachment(body, Vector3.new(0, body.Size.Y / 2 + 1, 0)), { Rate = 14, Lifetime = NumberRange.new(1, 1.4), Speed = NumberRange.new(3), EmissionDirection = Enum.NormalId.Bottom, Size = NumberSequence.new(0.25), Color = ColorSequence.new(Color3.fromRGB(61, 255, 122)), SpreadAngle = Vector2.new(30, 30) })
	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.fromScale(4, 1)
	gui.StudsOffset = Vector3.new(0, -body.Size.Y / 2 - 0.8, 0)
	gui.AlwaysOnTop = true
	gui.Parent = body
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundColor3 = Color3.new(0, 0, 0)
	label.BackgroundTransparency = 0.3
	label.TextColor3 = Color3.fromRGB(61, 255, 122)
	label.Font = Enum.Font.Code
	label.TextScaled = true
	label.Text = "HACKED"
	label.Parent = gui
	loop(model, 0.15, function()
		label.TextTransparency = math.random() < 0.1 and 0.6 or 0
	end)
end

function EFFECTS.gefroren(model, body)
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") then
			p.Color = p.Color:Lerp(Color3.fromRGB(191, 234, 255), 0.4)
			p.Reflectance = math.min(1, p.Reflectance + 0.15)
		end
	end
	local rng = Random.new(11)
	for i = 0, 7 do
		local a = math.rad(i * 45 + rng:NextNumber(-8, 8))
		local h = rng:NextNumber(0.7, 1.3)
		part("Part", { Name = "Eiskristall", Size = Vector3.new(0.25, h, 0.25), Color = Color3.fromRGB(191, 244, 255), Material = Enum.Material.Ice, Transparency = 0.2, CFrame = body.CFrame * CFrame.new(0, math.sin(a) * (body.Size.Y / 2 + h * 0.3), math.cos(a) * (body.Size.Z / 2 + h * 0.3)) * CFrame.Angles(a, 0, 0) }, model)
	end
	emitter(attachment(body, Vector3.new(0, body.Size.Y / 2 + 1, 0)), { Rate = 6, Lifetime = NumberRange.new(1.5, 2.2), Speed = NumberRange.new(1, 2), EmissionDirection = Enum.NormalId.Bottom, Size = NumberSequence.new(0.2), Color = ColorSequence.new(Color3.fromRGB(255, 255, 255)), SpreadAngle = Vector2.new(40, 40), LightEmission = 0.3 })
end

-- Blitze ruhig: höchstens zehn Wechsel pro Sekunde, Licht pulsiert weich
function EFFECTS.elektrisch(model, body)
	local yellow = Color3.fromRGB(255, 233, 74)
	local l = light(body, yellow, 2, 12)
	local sparks = emitter(attachment(body, Vector3.zero), { Rate = 25, Lifetime = NumberRange.new(0.15, 0.3), Speed = NumberRange.new(6, 10), Size = NumberSequence.new(0.18, 0), Color = ColorSequence.new(yellow), SpreadAngle = Vector2.new(180, 180) })
	local bolts = {}
	for i = 1, 3 do
		table.insert(bolts, part("Part", { Name = "Blitz", Size = Vector3.new(0.12, 1.4, 0.12), Color = Color3.fromRGB(255, 247, 176), Material = Enum.Material.Neon, Transparency = 1, CFrame = body.CFrame }, model))
	end
	loop(model, 0.1, function(t)
		l.Brightness = 1.6 + math.sin(t * 3) * 0.8
		for _, b in ipairs(bolts) do
			if math.random() < 0.35 then
				local a = math.random() * math.pi * 2
				b.CFrame = body.CFrame * CFrame.new(0, math.sin(a) * body.Size.Y * 0.6, math.cos(a) * body.Size.Z * 0.6) * CFrame.Angles(a, 0, 0)
				b.Transparency = 0.1
			else
				b.Transparency = 1
			end
		end
		sparks.Rate = 15 + math.sin(t * 3) * 10
	end)
end

function EFFECTS.golden(model, body)
	local gold = Color3.fromRGB(255, 201, 58)
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") then
			p.Color = gold
			p.Material = Enum.Material.Foil
			p.Reflectance = 0.25
		end
	end
	local sparkles = Instance.new("Sparkles")
	sparkles.SparkleColor = Color3.fromRGB(255, 246, 192)
	sparkles.Parent = body
	light(body, gold, 2.5, 14)
	emitter(attachment(body, Vector3.new(0, -body.Size.Y / 2, 0)), { Rate = 4, Lifetime = NumberRange.new(0.6, 0.9), Speed = NumberRange.new(0), Acceleration = Vector3.new(0, -25, 0), Size = NumberSequence.new(0.22, 0.12), Color = ColorSequence.new(gold), LightEmission = 0.6 })
end

function EFFECTS.kosmisch(model, body)
	local purple = Color3.fromRGB(176, 123, 255)
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") then
			p.Color = p.Color:Lerp(Color3.fromRGB(42, 20, 90), 0.6)
		end
	end
	local sparkles = Instance.new("Sparkles")
	sparkles.SparkleColor = purple
	sparkles.Parent = body
	light(body, purple, 3, 16)
	emitter(attachment(body, Vector3.zero), { Rate = 18, Lifetime = NumberRange.new(1.5, 2.5), Speed = NumberRange.new(0.5, 1.5), Size = NumberSequence.new(0.15, 0), Color = ColorSequence.new(Color3.fromRGB(255, 255, 255), purple), SpreadAngle = Vector2.new(180, 180), RotSpeed = NumberRange.new(-90, 90) })
end

function MutationFx.Apply(model, mutationId)
	local fx = EFFECTS[mutationId]
	if not fx then
		return model
	end
	fx(model, model.PrimaryPart)
	local m = MutationData.ById[mutationId]
	model:SetAttribute("Mutation", mutationId)
	model:SetAttribute("Value", (model:GetAttribute("Value") or 0) * m.Multiplier)
	return model
end

return MutationFx
`;

// EggBuilder (Eier v2) liegt in eggLuau.js
export { EGG_BUILDER };

export function worldDataSource({ PLANETS, WORLDS, REBIRTH }) {
  const planets = PLANETS.map((p) =>
    fields({
      Id: str(p.id),
      Name: str(p.name),
      Title: str(p.title),
      Text: str(p.text),
      Color: color(p.color),
      Portal: p.portal ? `{ Name = ${str(p.portal.name)}, Rebirths = ${num(p.portal.rebirths)}, Text = ${str(p.portal.text)} }` : 'nil',
      ComingSoon: p.soon ? 'true' : undefined,
    }),
  );
  const worlds = WORLDS.map((w) =>
    w.soon
      ? fields({ Id: str(w.id), Planet: str(w.planet), Name: str(w.name), ComingSoon: 'true' })
      : fields({
          Id: str(w.id),
          Planet: str(w.planet),
          Name: str(w.name),
          Price: num(w.price),
          Luck: num(w.luck),
          Value: num(w.value),
          Ground: color(w.ground),
          Accent: color(w.accent),
          Text: str(w.text),
        }),
  );
  return `${HEADER('Planeten, Welten, Wiedergeburt')}
-- Welten kauft man pro Planet der Reihe nach mit Talern. Ein Portal zum nächsten Planeten öffnet
-- sich, wenn die letzte Welt des vorigen Planeten gekauft ist und genug Wiedergeburten da sind.
-- Luck wirkt wie der Skill „Glückspilz“ (0.5 = +50 % auf alle Stufen außer Normal),
-- Value multipliziert den Münzwert.

local WorldData = {}

WorldData.Planets = ${list(planets)}

WorldData.Worlds = ${list(worlds)}

WorldData.ById = {}
for _, world in ipairs(WorldData.Worlds) do
	WorldData.ById[world.Id] = world
end
WorldData.PlanetById = {}
for _, planet in ipairs(WorldData.Planets) do
	WorldData.PlanetById[planet.Id] = planet
end

-- Spielbare Welten eines Planeten in Kaufreihenfolge
function WorldData.OfPlanet(planetId)
	local result = {}
	for _, world in ipairs(WorldData.Worlds) do
		if world.Planet == planetId and not world.ComingSoon then
			table.insert(result, world)
		end
	end
	return result
end

WorldData.Rebirth = {
	BaseCost = ${num(REBIRTH.cost(0))},
	CostFactor = ${num(REBIRTH.cost(1) / REBIRTH.cost(0))},
	Bonus = ${num(REBIRTH.bonus)},
}

-- Kosten der nächsten Wiedergeburt, wenn man schon n hat
function WorldData.RebirthCost(n)
	return WorldData.Rebirth.BaseCost * WorldData.Rebirth.CostFactor ^ n
end

-- Münzwert-Faktor bei n Wiedergeburten
function WorldData.RebirthMultiplier(n)
	return 1 + WorldData.Rebirth.Bonus * n
end

-- ── Regeln für Kaufen und Portale (Server und Oberfläche nutzen dieselben) ──
-- state = { Owned = { [worldId] = true }, Portals = { [planetId] = true }, Taler = n, Rebirths = n }
-- Am Spieler stehen sie als Attribute: Worlds und Portals (Ids mit Komma), Rebirths, World (aktuelle Welt)

function WorldData.ParseList(text)
	local set = {}
	for id in string.gmatch(text or "", "[^,]+") do
		set[id] = true
	end
	return set
end

function WorldData.Owns(state, worldId)
	local world = WorldData.ById[worldId]
	return (world ~= nil and world.Planet == "hub") or state.Owned[worldId] == true
end

-- Grund, warum die Welt (noch) nicht gekauft werden kann, sonst nil
function WorldData.CanBuy(state, worldId)
	local world = WorldData.ById[worldId]
	if not world then return "Diese Welt gibt es nicht" end
	if world.ComingSoon then return "Coming soon" end
	if world.Planet == "hub" then return "Immer offen" end
	if WorldData.Owns(state, worldId) then return "Schon gekauft" end
	if not state.Portals[world.Planet] then return "Erst das Portal öffnen" end
	local list = WorldData.OfPlanet(world.Planet)
	for i, w in ipairs(list) do
		if w == world and i > 1 and not WorldData.Owns(state, list[i - 1].Id) then
			return "Erst „" .. list[i - 1].Name .. "“ kaufen"
		end
	end
	if state.Taler < world.Price then return "Zu wenig Taler" end
	return nil
end

-- Bedingungen für das Portal zu einem Planeten: { { Text, erfüllt } }
function WorldData.PortalChecks(state, planetId)
	local planet = WorldData.PlanetById[planetId]
	if not planet or not planet.Portal then return {} end
	local prev
	for i, p in ipairs(WorldData.Planets) do
		if p == planet then prev = WorldData.Planets[i - 1] end
	end
	local checks = {}
	if prev then
		local list = WorldData.OfPlanet(prev.Id)
		local last = list[#list]
		table.insert(checks, { "„" .. last.Name .. "“ auf " .. prev.Name .. " gekauft", WorldData.Owns(state, last.Id) })
	end
	local n = planet.Portal.Rebirths
	table.insert(checks, { n .. " Wiedergeburt" .. (n > 1 and "en" or "") .. " (du hast " .. state.Rebirths .. ")", state.Rebirths >= n })
	return checks
end

function WorldData.CanOpenPortal(state, planetId)
	local planet = WorldData.PlanetById[planetId]
	if not planet then return "Diesen Planeten gibt es nicht" end
	if planet.ComingSoon then return "Kommt mit einem späteren Update" end
	if state.Portals[planetId] then return "Schon offen" end
	for _, check in ipairs(WorldData.PortalChecks(state, planetId)) do
		if not check[2] then return "Fehlt: " .. check[1] end
	end
	return nil
end

return WorldData
`;
}

export const WEATHER_FX = `${HEADER('Wetter-Effekte')}
-- Läuft auf dem Client (LocalScript): WeatherFx.Apply(weatherId) stellt Himmel, Licht, Nebel
-- und Partikel für das Wetter ein, WeatherFx.Announce(...) zeigt die Ansage beim Wechsel.
-- Bewusst ruhig: Blitze höchstens alle 2,5 Sekunden, Farben wechseln langsam.

local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local MutationData = require(script.Parent.MutationData)

local WeatherFx = {}

local base = nil -- Lighting vor dem ersten Wetter
local current = nil -- { parts, connections }
local SLOW = TweenInfo.new(3)

local function remember()
	if base then
		return
	end
	base = {
		Ambient = Lighting.Ambient, OutdoorAmbient = Lighting.OutdoorAmbient, Brightness = Lighting.Brightness,
		ClockTime = Lighting.ClockTime, FogColor = Lighting.FogColor, FogEnd = Lighting.FogEnd, ColorShift_Top = Lighting.ColorShift_Top,
	}
end

local function clear()
	if not current then
		return
	end
	for _, c in ipairs(current.connections) do
		c:Disconnect()
	end
	for _, p in ipairs(current.parts) do
		p:Destroy()
	end
	current = nil
end

-- Eine unsichtbare Platte über der Kamera, aus der die Partikel fallen
local function cloudPart(height)
	local p = Instance.new("Part")
	p.Name = "Wetterwolke"
	p.Anchored = true
	p.CanCollide = false
	p.Transparency = 1
	p.Size = Vector3.new(160, 1, 160)
	p.Parent = workspace
	table.insert(current.parts, p)
	table.insert(current.connections, RunService.RenderStepped:Connect(function()
		local cam = workspace.CurrentCamera
		if cam then
			p.CFrame = CFrame.new(cam.CFrame.Position + Vector3.new(0, height, 0))
		end
	end))
	return p
end

-- Wetter bleibt dezent: alle Partikelmengen werden auf diesen Anteil gesenkt
local AMOUNT = 0.4

local function particles(parent, props)
	local e = Instance.new("ParticleEmitter")
	e.Texture = "rbxasset://textures/particles/sparkles_main.dds"
	e.EmissionDirection = Enum.NormalId.Bottom
	e.SpreadAngle = Vector2.new(8, 8)
	e.LightEmission = 0.2
	for key, value in pairs(props) do
		e[key] = value
	end
	e.Rate = math.max(1, e.Rate * AMOUNT)
	e.Parent = parent
	return e
end

local function lightning(cloud)
	local last = 0
	table.insert(current.connections, RunService.Heartbeat:Connect(function()
		local now = os.clock()
		if now - last < 6 + math.random() * 6 then
			return
		end
		last = now
		local cam = workspace.CurrentCamera
		if not cam then
			return
		end
		local pos = cam.CFrame.Position + Vector3.new(math.random(-60, 60), 0, math.random(-60, 60))
		local bolt = Instance.new("Part")
		bolt.Name = "Blitz"
		bolt.Anchored = true
		bolt.CanCollide = false
		bolt.Material = Enum.Material.Neon
		bolt.Color = Color3.fromRGB(255, 247, 192)
		bolt.Size = Vector3.new(0.6, 70, 0.6)
		bolt.CFrame = CFrame.new(pos + Vector3.new(0, 30, 0)) * CFrame.Angles(0, 0, math.rad(math.random(-8, 8)))
		bolt.Parent = workspace
		Lighting.Brightness = 5
		TweenService:Create(Lighting, TweenInfo.new(0.6), { Brightness = base.Brightness * 0.5 }):Play()
		TweenService:Create(bolt, TweenInfo.new(0.5), { Transparency = 1 }):Play()
		task.delay(0.6, function()
			bolt:Destroy()
		end)
	end))
end

local SETUPS = {}

function SETUPS.regen(cloud)
	particles(cloud, { Rate = 400, Lifetime = NumberRange.new(1.2, 1.5), Speed = NumberRange.new(70, 80), Size = NumberSequence.new(0.12), Color = ColorSequence.new(Color3.fromRGB(207, 232, 255)), LightEmission = 0 })
end

function SETUPS.gewitter(cloud)
	SETUPS.regen(cloud)
	lightning(cloud)
end

function SETUPS.erdbeben(cloud)
	particles(cloud, { Rate = 25, Lifetime = NumberRange.new(2, 3), Speed = NumberRange.new(20, 30), Size = NumberSequence.new(0.8), Color = ColorSequence.new(Color3.fromRGB(125, 113, 102)), LightEmission = 0 })
	-- sanftes Wackeln der Kamera über den Humanoid
	table.insert(current.connections, RunService.RenderStepped:Connect(function()
		local char = Players.LocalPlayer and Players.LocalPlayer.Character
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		if hum then
			local t = os.clock()
			hum.CameraOffset = Vector3.new(math.sin(t * 23) * 0.25, math.sin(t * 31) * 0.15, 0)
		end
	end))
	table.insert(current.connections, { Disconnect = function()
		local char = Players.LocalPlayer and Players.LocalPlayer.Character
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		if hum then
			hum.CameraOffset = Vector3.zero
		end
	end })
end

function SETUPS.schneesturm(cloud)
	particles(cloud, { Rate = 300, Lifetime = NumberRange.new(4, 6), Speed = NumberRange.new(10, 16), Acceleration = Vector3.new(12, 0, 4), Size = NumberSequence.new(0.35), Color = ColorSequence.new(Color3.fromRGB(255, 255, 255)), SpreadAngle = Vector2.new(30, 30) })
end

function SETUPS.disconacht(cloud)
	local colors = { Color3.fromRGB(255, 61, 242), Color3.fromRGB(61, 232, 255), Color3.fromRGB(255, 226, 61), Color3.fromRGB(122, 92, 255) }
	local e = particles(cloud, { Rate = 60, Lifetime = NumberRange.new(4, 6), Speed = NumberRange.new(4, 8), Size = NumberSequence.new(0.6), Color = ColorSequence.new(colors[1], colors[2]), LightEmission = 1, SpreadAngle = Vector2.new(60, 60) })
	local i = 0
	local last = 0
	table.insert(current.connections, RunService.Heartbeat:Connect(function()
		if os.clock() - last < 1.5 then
			return
		end
		last = os.clock()
		i = i % #colors + 1
		TweenService:Create(Lighting, TweenInfo.new(1.4), { Ambient = colors[i]:Lerp(Color3.new(0, 0, 0), 0.6) }):Play()
		e.Color = ColorSequence.new(colors[i], colors[i % #colors + 1])
	end))
end

function SETUPS.blutmond(cloud)
	particles(cloud, { Rate = 40, Lifetime = NumberRange.new(5, 7), Speed = NumberRange.new(2, 4), Size = NumberSequence.new(0.3), Color = ColorSequence.new(Color3.fromRGB(255, 58, 16), Color3.fromRGB(255, 26, 26)), LightEmission = 1, EmissionDirection = Enum.NormalId.Top })
end

function SETUPS.neonsturm(cloud)
	local e = particles(cloud, { Rate = 80, Lifetime = NumberRange.new(3, 5), Speed = NumberRange.new(6, 12), Size = NumberSequence.new(0.5), Color = ColorSequence.new(Color3.fromRGB(198, 255, 0)), LightEmission = 1, SpreadAngle = Vector2.new(70, 70) })
	table.insert(current.connections, RunService.Heartbeat:Connect(function()
		local h = (os.clock() * 0.05) % 1
		Lighting.Ambient = Color3.fromHSV(h, 0.8, 0.45)
		e.Color = ColorSequence.new(Color3.fromHSV(h, 1, 1), Color3.fromHSV((h + 0.5) % 1, 1, 1))
	end))
end

function SETUPS.goldregen(cloud)
	particles(cloud, { Rate = 180, Lifetime = NumberRange.new(2, 3), Speed = NumberRange.new(30, 40), Size = NumberSequence.new(0.3), Color = ColorSequence.new(Color3.fromRGB(255, 210, 58), Color3.fromRGB(255, 176, 32)), LightEmission = 0.8 })
end

function SETUPS.datensturm(cloud)
	particles(cloud, { Rate = 120, Lifetime = NumberRange.new(3, 4), Speed = NumberRange.new(12, 18), Size = NumberSequence.new(0.35), Color = ColorSequence.new(Color3.fromRGB(61, 255, 122)), LightEmission = 1, SpreadAngle = Vector2.new(2, 2) })
end

function SETUPS.sternschnuppen(cloud)
	particles(cloud, { Rate = 3, Lifetime = NumberRange.new(1, 1.5), Speed = NumberRange.new(80, 110), Acceleration = Vector3.new(60, 0, 20), Size = NumberSequence.new(0.6, 0), Color = ColorSequence.new(Color3.fromRGB(255, 246, 224)), LightEmission = 1, SpreadAngle = Vector2.new(20, 20) })
	particles(cloud, { Rate = 30, Lifetime = NumberRange.new(4, 6), Speed = NumberRange.new(1, 3), Size = NumberSequence.new(0.2), Color = ColorSequence.new(Color3.fromRGB(224, 200, 255)), LightEmission = 1, SpreadAngle = Vector2.new(80, 80) })
end

-- Nachts spielen diese Wetter
local NIGHT = { disconacht = true, blutmond = true, datensturm = true, sternschnuppen = true }

function WeatherFx.Apply(weatherId)
	remember()
	clear()
	current = { parts = {}, connections = {} }
	local w = MutationData.WeatherById[weatherId]
	if not w or weatherId == "klar" then
		TweenService:Create(Lighting, SLOW, base):Play()
		return
	end
	local sky = w.Sky or base.FogColor
	local light = w.Light or 1
	TweenService:Create(Lighting, SLOW, {
		Ambient = base.Ambient:Lerp(sky, 0.6),
		OutdoorAmbient = base.OutdoorAmbient:Lerp(sky, 0.6),
		Brightness = base.Brightness * light,
		FogColor = sky,
		FogEnd = math.min(base.FogEnd, light < 0.7 and 350 or 700),
		ColorShift_Top = w.Color,
		ClockTime = NIGHT[weatherId] and 0 or base.ClockTime,
	}):Play()
	local cloud = cloudPart(45)
	local setup = SETUPS[weatherId]
	if setup then
		setup(cloud)
	end
end

-- Große Ansage oben in der Mitte, verschwindet nach ein paar Sekunden
function WeatherFx.Announce(weatherId, playerGui)
	local w = MutationData.WeatherById[weatherId]
	if not w or not playerGui then
		return
	end
	local m = MutationData.ForWeather(weatherId)
	local gui = Instance.new("ScreenGui")
	gui.Name = "Wetteransage"
	gui.ResetOnSpawn = false
	local frame = Instance.new("Frame")
	frame.AnchorPoint = Vector2.new(0.5, 0)
	frame.Position = UDim2.new(0.5, 0, 0.12, 0)
	frame.Size = UDim2.fromOffset(420, 120)
	frame.BackgroundColor3 = Color3.fromRGB(18, 15, 24)
	frame.BackgroundTransparency = 0.1
	frame.Parent = gui
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 18)
	corner.Parent = frame
	local stroke = Instance.new("UIStroke")
	stroke.Color = w.Color
	stroke.Thickness = 3
	stroke.Parent = frame
	local title = Instance.new("TextLabel")
	title.BackgroundTransparency = 1
	title.Size = UDim2.new(1, 0, 0.55, 0)
	title.Font = Enum.Font.GothamBold
	title.TextScaled = true
	title.TextColor3 = w.Color
	title.Text = w.Name
	title.Parent = frame
	local sub = Instance.new("TextLabel")
	sub.BackgroundTransparency = 1
	sub.Position = UDim2.new(0, 0, 0.58, 0)
	sub.Size = UDim2.new(1, 0, 0.32, 0)
	sub.Font = Enum.Font.Gotham
	sub.TextScaled = true
	sub.TextColor3 = Color3.fromRGB(239, 232, 219)
	sub.Text = m and ("%d %% Chance auf %s · Wert ×%s"):format(m.Chance, m.Name, tostring(m.Multiplier)) or w.Text
	sub.Parent = frame
	gui.Parent = playerGui
	task.delay(4.5, function()
		gui:Destroy()
	end)
end

return WeatherFx
`;

// Server: setzt das Wetter als Attribut an ReplicatedStorage (alle Server gleich, aus der Uhrzeit)
const WEATHER_SERVER = `-- Coinmaster Adventure · Wetter (Server)
-- Setzt alle paar Minuten das Wetter. Clients lesen ReplicatedStorage:GetAttribute("Weather").
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local root = ReplicatedStorage:WaitForChild("CoinmasterAdventure")
local Gacha = require(root:WaitForChild("Gacha"))

while true do
	local w, left = Gacha.CurrentWeather()
	ReplicatedStorage:SetAttribute("Weather", w.Id)
	ReplicatedStorage:SetAttribute("WeatherEnds", os.time() + left)
	task.wait(math.max(1, left))
end
`;

// Client: wendet das Wetter an und zeigt die Ansage
const WEATHER_CLIENT = `-- Coinmaster Adventure · Wetter (Client)
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local root = ReplicatedStorage:WaitForChild("CoinmasterAdventure")
local WeatherFx = require(root:WaitForChild("WeatherFx"))
local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui")

local last = nil
local function update()
	local id = ReplicatedStorage:GetAttribute("Weather")
	if not id or id == last then
		return
	end
	WeatherFx.Apply(id)
	if last then
		WeatherFx.Announce(id, playerGui)
	end
	last = id
end
ReplicatedStorage:GetAttributeChangedSignal("Weather"):Connect(update)
update()
`;

// Client: setzt Licht und Atmosphere der Welt, in deren Nähe die Kamera ist (Ordner „Licht“ im Weltmodell)
// Modelle der CC0-Pakete einsetzen: Die Welten-Dateien enthalten unsichtbare Teile „ModellPlatz“ (Lage und
// Größe des Modells, StringValue „Modell“, BoolValue „Fest“). Die Bibliothek bibliothek.glb kommt einmal mit
// dem 3D-Importer nach ServerStorage > CoinmasterModelle. Das Modul setzt an jeden Platz eine Kopie.
export const MODEL_PLACER = `-- Coinmaster Adventure · Modelle einsetzen
--
-- Sucht unter root (Standard: Workspace) alle Teile „ModellPlatz“ und setzt dort das gleichnamige Modell
-- aus ServerStorage > CoinmasterModelle ein (MeshPart oder Model), gestreckt auf die Größe des Platzes.
-- Im Spiel ruft das Skript CoinmasterModelle das beim Start auf. Damit die Modelle schon in Studio zu sehen
-- sind und fest gespeichert werden, einmal in der Befehlsleiste ausführen:
--   require(game.ServerScriptService.CoinmasterModelle.Einsetzen)()

local ServerStorage = game:GetService("ServerStorage")

local function library()
	return ServerStorage:FindFirstChild("CoinmasterModelle") or workspace:FindFirstChild("CoinmasterModelle")
end

local function setPart(p, fest)
	p.Anchored = true
	p.CanCollide = fest
	p.CanQuery = fest
	p.CanTouch = false
end

-- eine Kopie der Vorlage an den Platz setzen, den Platzhalter entfernen
local function place_(place, template, id)
	local festValue = place:FindFirstChild("Fest")
	local fest = festValue ~= nil and festValue.Value
	local copy = template:Clone()
	if copy:IsA("BasePart") then
		copy.Size = place.Size
		copy.CFrame = place.CFrame
		setPart(copy, fest)
	else
		-- Model: gleichmäßig auf die Höhe des Platzes skalieren, Mitte des Rahmens auf die Mitte des Platzes
		local _, size = copy:GetBoundingBox()
		if size.Y > 0 then
			copy:ScaleTo(copy:GetScale() * place.Size.Y / size.Y)
		end
		local box = copy:GetBoundingBox()
		copy:PivotTo(place.CFrame * box:ToObjectSpace(copy:GetPivot()))
		for _, p in ipairs(copy:GetDescendants()) do
			if p:IsA("BasePart") then
				setPart(p, fest)
			end
		end
	end
	copy.Name = id
	copy.Parent = place.Parent
	place:Destroy()
	return 1
end

return function(root)
	root = root or workspace
	local lib = library()
	if not lib then
		warn("[Coinmaster] Modellbibliothek fehlt: bibliothek.glb mit dem 3D-Importer einfügen und als ServerStorage > CoinmasterModelle ablegen")
		return 0
	end
	-- Vorlagen nach Namen (das erste Vorkommen: ein Model mit Teilen oder ein einzelnes MeshPart)
	local templates = {}
	for _, d in ipairs(lib:GetDescendants()) do
		if (d:IsA("BasePart") or d:IsA("Model")) and not templates[d.Name] then
			templates[d.Name] = d
		end
	end
	local places = {}
	for _, d in ipairs(root:GetDescendants()) do
		if d.Name == "ModellPlatz" and d:IsA("BasePart") then
			table.insert(places, d)
		end
	end
	local count, missing = 0, {}
	for _, place in ipairs(places) do
		local idValue = place:FindFirstChild("Modell")
		local id = idValue and idValue.Value
		local template = id and templates[id]
		if not template then
			if id then
				missing[id] = true
			end
		else
			count = count + place_(place, template, id)
		end
	end
	local list = {}
	for id in pairs(missing) do
		table.insert(list, id)
	end
	if #list > 0 then
		warn("[Coinmaster] Modelle fehlen in der Bibliothek: " .. table.concat(list, ", "))
	end
	print(("[Coinmaster] %d Modelle eingesetzt"):format(count))
	return count
end
`;

export const MODEL_PLACER_START = `-- Coinmaster Adventure · Modelle beim Spielstart einsetzen (Modul Einsetzen darunter)
require(script:WaitForChild("Einsetzen"))(workspace)
`;

export const WORLD_LIGHT_CLIENT = `-- Coinmaster Adventure · Weltlicht (Client)
-- Jede Welt aus den .rbxmx-Dateien hat einen Ordner „Licht“ mit einer Atmosphere und Lighting-Werten.
-- Dieses Skript übernimmt sie für die Welt, die der Kamera am nächsten ist.
local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")

local folders = {}
local function scan()
	folders = {}
	for _, f in ipairs(workspace:GetDescendants()) do
		if f:IsA("Folder") and f.Name == "Licht" and f.Parent and f.Parent:IsA("Model") then
			table.insert(folders, f)
		end
	end
end

local current = nil
local function apply(folder)
	for _, v in ipairs(folder:GetChildren()) do
		if v:IsA("ValueBase") then
			Lighting[v.Name] = v.Value
		end
	end
	-- Bloom der Welt (Neon und Lava leuchten nach)
	local bloomSource = folder:FindFirstChildOfClass("BloomEffect")
	if bloomSource then
		local bloom = Lighting:FindFirstChild("CoinmasterBloom")
		if not bloom then
			bloom = Instance.new("BloomEffect")
			bloom.Name = "CoinmasterBloom"
			bloom.Parent = Lighting
		end
		bloom.Intensity, bloom.Size, bloom.Threshold = bloomSource.Intensity, bloomSource.Size, bloomSource.Threshold
	end
	local source = folder:FindFirstChildOfClass("Atmosphere")
	if source then
		local atm = Lighting:FindFirstChildOfClass("Atmosphere")
		if not atm then
			atm = Instance.new("Atmosphere")
			atm.Parent = Lighting
		end
		for _, key in ipairs({ "Density", "Offset", "Color", "Decay", "Glare", "Haze" }) do
			atm[key] = source[key]
		end
	end
end

local elapsed = 0
local rescan = 0
RunService.Heartbeat:Connect(function(dt)
	elapsed = elapsed + dt
	rescan = rescan - dt
	if elapsed < 1 then
		return
	end
	elapsed = 0
	if rescan <= 0 then
		scan()
		rescan = 10
	end
	local cam = workspace.CurrentCamera
	if not cam then
		return
	end
	local best, bestDistance = nil, math.huge
	for _, f in ipairs(folders) do
		if f.Parent then
			local d = (f.Parent:GetPivot().Position - cam.CFrame.Position).Magnitude
			if d < bestDistance then
				best, bestDistance = f, d
			end
		end
	end
	if best and best ~= current then
		current = best
		apply(best)
	end
end)
`;

// Alle ModuleScripts in der Reihenfolge, in der sie im Ordner liegen
export function moduleSources(data) {
  return [
    { name: 'CoinData', source: coinDataSource(data) },
    { name: 'MutationData', source: mutationDataSource(data) },
    { name: 'EggData', source: eggDataSource(data) },
    { name: 'WorldData', source: worldDataSource(data) },
    { name: 'Gacha', source: GACHA },
    { name: 'CoinBuilder', source: COIN_BUILDER },
    { name: 'MutationFx', source: MUTATION_FX },
    { name: 'WeatherFx', source: WEATHER_FX },
    { name: 'WorldFx', source: worldFxSource(data) },
    { name: 'EggBuilder', source: EGG_BUILDER },
    ...(data.AURAS ? [{ name: 'AuraData', source: auraDataSource(data) }, { name: 'AuraFx', source: AURA_FX }] : []),
    ...(data.PETS ? [{ name: 'PetData', source: petDataSource(data) }, { name: 'PetBuilder', source: PET_BUILDER }, { name: 'HatchFx', source: HATCH_FX }] : []),
    ...(data.TREES ? [{ name: 'GardenData', source: gardenDataSource(data) }, { name: 'LootBuilder', source: LOOT_BUILDER }, { name: 'GardenBuilder', source: GARDEN_BUILDER }] : []),
    ...(data.ROLLS && data.TREES ? [{ name: 'RollData', source: rollDataSource(data) }, { name: 'RollBuilder', source: ROLL_BUILDER }, { name: 'RollFx', source: ROLL_FX }] : []),
    ...(data.BOOSTS && data.AURAS && data.SKILLS
      ? [{ name: 'ShopData', source: shopDataSource(data) }, { name: 'SkillData', source: skillDataSource(data) }, { name: 'RewardData', source: rewardDataSource(data) }, { name: 'UITheme', source: UI_THEME }, { name: 'GameUI', source: GAME_UI }]
      : []),
  ];
}

// Langer String, dessen Klammer-Ebene im Inhalt nicht vorkommt
function longString(s) {
  let level = 1;
  while (s.includes(']' + '='.repeat(level) + ']')) level++;
  const eq = '='.repeat(level);
  return `[${eq}[\n${s}]${eq}]`;
}

// Installer für die Befehlsleiste von Roblox Studio
export function installerSource(data) {
  const modules = moduleSources(data);
  return `-- Coinmaster Adventure · Installer für Roblox Studio
--
-- So geht's: In Roblox Studio oben auf „Ansicht“ (View) > „Befehlsleiste“ (Command Bar),
-- diesen ganzen Text hineinkopieren und Enter drücken.
--
-- Danach gibt es:
--   ReplicatedStorage > CoinmasterAdventure   alle Daten und Module (${modules.length} ModuleScripts)
--   ReplicatedStorage > CoinmasterAdventure > Coins / Eggs   fertige Modelle zum Klonen
--   Workspace > CoinmasterShowcase            alle ${data.COINS.length} Münzen und ${data.EGGS.length} Eier${data.ROLLS && data.TREES ? ` und ${data.ROLLS.length} Münzrollen` : ''} zum Ansehen${data.ROLLS && data.TREES ? `
--   Workspace > CoinmasterGardenShowcase      Münzbaumgarten mit allen ${data.TREES.length} Münzbäumen (GardenBuilder)
--   ServerScriptService > CoinmasterGarden    Münzbaumgarten und Münzrollen (GardenRemote)
--   StarterPlayerScripts > CoinmasterGardenClient   baut den eigenen Garten (Part „GartenPlatz“ im Workspace)` : ''}
--   ServerScriptService > CoinmasterWeather   wechselt das Wetter (alle ${(data.WEATHER_MS ?? 180000) / 60000} Minuten)
--   StarterPlayerScripts > CoinmasterWeatherClient   Wettereffekte und Ansage beim Wechsel
--   StarterPlayerScripts > CoinmasterWorldLighting   Licht und Himmel der Welt, in der man gerade ist
--   StarterPlayerScripts > CoinmasterWorldFx   Umgebung der Welt: Himmel, Fernkulisse, Partikel und Leben (WorldFx)
--   ServerScriptService > CoinmasterModelle   setzt die Modelle (bibliothek.glb) in die Welten ein
--   StarterPlayerScripts > CoinmasterUI       Spiel-Oberfläche (HUD, Menü und alle Fenster) aus GameUI
--   ServerScriptService > CoinmasterShop      Käufe, Verkauf, Welten, Portale, Wiedergeburt (ShopRemote)
--   ServerScriptService > CoinmasterPlayer    Skills, Belohnungen, Codes, Einstellungen, Ranglisten (PlayerRemote)
--   ServerScriptService > CoinmasterData      lädt und speichert den Spielstand (Modul CoinmasterServer > PlayerData)
--     Zum Speichern in Studio: Game Settings > Security > „Enable Studio Access to API Services“${data.AURAS ? `
--   Haustiere: Datei Haustiere.rbxmx von der Webseite in ReplicatedStorage > CoinmasterAdventure einfügen,
--   dann bauen PetBuilder und HatchFx (Schlüpf-Animation) die echten Tiere.
--   Workspace > CoinmasterAuraShowcase        alle ${data.AURAS.length} Auras an Figuren
--   ServerScriptService > CoinmasterAuras     Auras kaufen und anlegen (RemoteFunction AuraRemote)
--   StarterPlayerScripts > CoinmasterAuraClient   zeichnet die Aura jedes Spielers
--   Test in Studio: Play drücken und im Chat „/aura krone“ schreiben` : ''}
--
-- Ein erneuter Import ersetzt beides. Strg+Z macht den Import rückgängig.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

local old = ReplicatedStorage:FindFirstChild("CoinmasterAdventure")
-- eingefügte Haustiere (Haustiere.rbxmx) behalten
local keepPets = old and old:FindFirstChild("Haustiere")
if keepPets then
	keepPets.Parent = nil
end
if old then
	old:Destroy()
end
local oldShowcase = workspace:FindFirstChild("CoinmasterShowcase")
if oldShowcase then
	oldShowcase:Destroy()
end

local root = Instance.new("Folder")
root.Name = "CoinmasterAdventure"
root.Parent = ReplicatedStorage
if keepPets then
	keepPets.Parent = root
end

local function addModule(name, source)
	local m = Instance.new("ModuleScript")
	m.Name = name
	m.Source = source
	m.Parent = root
	return m
end

${modules.map((m) => `addModule(${str(m.name)}, ${longString(m.source)})`).join('\n\n')}

-- Modelle bauen
local CoinData = require(root.CoinData)
local EggData = require(root.EggData)
local CoinBuilder = require(root.CoinBuilder)
local EggBuilder = require(root.EggBuilder)

local coinFolder = Instance.new("Folder")
coinFolder.Name = "Coins"
coinFolder.Parent = root
local eggFolder = Instance.new("Folder")
eggFolder.Name = "Eggs"
eggFolder.Parent = root

local showcase = Instance.new("Model")
showcase.Name = "CoinmasterShowcase"

local floor = Instance.new("Part")
floor.Name = "Floor"
floor.Anchored = true
floor.Size = Vector3.new(64, 1, 90)
floor.CFrame = CFrame.new(0, -0.5, 10)
floor.Color = Color3.fromRGB(24, 21, 31)
floor.Material = Enum.Material.Slate
floor.Parent = showcase

local function nameTag(model, text, color)
	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.fromOffset(160, 36)
	gui.StudsOffsetWorldSpace = Vector3.new(0, 3.2, 0)
	gui.MaxDistance = 80
	gui.Parent = model.PrimaryPart
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.TextColor3 = color
	label.TextStrokeTransparency = 0.4
	label.Font = Enum.Font.GothamBold
	label.TextScaled = true
	label.Text = text
	label.Parent = gui
end

-- Münzen: eine Reihe pro Stufe, hintereinander gestaffelt und nach oben steigend
local column = {}
for _, coin in ipairs(CoinData.Coins) do
	local model = CoinBuilder.Build(coin)
	model:Clone().Parent = coinFolder
	local tier = CoinData.TierById[coin.Tier]
	column[coin.Tier] = (column[coin.Tier] or 0) + 1
	local x = (column[coin.Tier] - 5) * 5.5
	local z = (tier.Index - 1) * -7
	local y = 3 + (tier.Index - 1) * 1.2
	model:PivotTo(CFrame.new(x, y, z) * CFrame.Angles(0, math.rad(90), 0))
	nameTag(model, coin.Name, tier.Color)
	model.Parent = showcase
end

-- Eier vorne in einer Reihe
for i, egg in ipairs(EggData.Eggs) do
	local model = EggBuilder.Build(egg)
	model:Clone().Parent = eggFolder
	model:PivotTo(CFrame.new((i - 4) * 7, 0, 22) * model:GetPivot().Rotation)
	nameTag(model, egg.Name, egg.Glow)
	model.Parent = showcase
end

${data.ROLLS && data.TREES ? `-- Münzrollen in einer Reihe vor den Eiern
local RollData = require(root.RollData)
local RollBuilder = require(root.RollBuilder)
local rollFolder = Instance.new("Folder")
rollFolder.Name = "Rolls"
rollFolder.Parent = root
for i, roll in ipairs(RollData.Rolls) do
	local model = RollBuilder.Build(roll)
	model:Clone().Parent = rollFolder
	model:PivotTo(CFrame.new((i - (#RollData.Rolls + 1) / 2) * 7, 0, 32) * model:GetPivot().Rotation)
	nameTag(model, roll.Name, roll.Glow)
	model.Parent = showcase
end

-- Münzbaumgarten mit allen Bäumen, ausgewachsen und reif
local GardenData = require(root.GardenData)
local GardenBuilder = require(root.GardenBuilder)
local oldGarden = workspace:FindFirstChild("CoinmasterGardenShowcase")
if oldGarden then
	oldGarden:Destroy()
end
local plots = {}
for i, tree in ipairs(GardenData.Trees) do
	plots[i] = { Tree = tree.Id, Stage = 3, Ripe = 1 }
end
local garden = GardenBuilder.Build({ Beds = math.min(GardenData.Garden.MaxBeds, math.ceil(#plots / 4) * 4), Plots = plots })
garden.Name = "CoinmasterGardenShowcase"
garden:PivotTo(CFrame.new(0, 0, 70))
garden.Parent = workspace
` : ''}showcase.Parent = workspace
${data.AURAS ? AURA_SHOWCASE : ''}
-- Wetter: Server-Skript und Client-Skript (alte Fassungen ersetzen)
local function addScript(className, parent, name, source)
	local old = parent:FindFirstChild(name)
	if old then
		old:Destroy()
	end
	local s = Instance.new(className)
	s.Name = name
	s.Source = source
	s.Parent = parent
	return s
end
addScript("Script", game:GetService("ServerScriptService"), "CoinmasterWeather", ${longString(WEATHER_SERVER)})
addScript("LocalScript", game:GetService("StarterPlayer"):WaitForChild("StarterPlayerScripts"), "CoinmasterWeatherClient", ${longString(WEATHER_CLIENT)})
addScript("LocalScript", game:GetService("StarterPlayer"):WaitForChild("StarterPlayerScripts"), "CoinmasterWorldLighting", ${longString(WORLD_LIGHT_CLIENT)})
addScript("LocalScript", game:GetService("StarterPlayer"):WaitForChild("StarterPlayerScripts"), "CoinmasterWorldFx", ${longString(WORLD_FX_CLIENT)})
-- Modelle der Welten: Skript mit Modul „Einsetzen“ (Bibliothek: ServerStorage > CoinmasterModelle)
do
	local placer = addScript("Script", game:GetService("ServerScriptService"), "CoinmasterModelle", ${longString(MODEL_PLACER_START)})
	local m = Instance.new("ModuleScript")
	m.Name = "Einsetzen"
	m.Source = ${longString(MODEL_PLACER)}
	m.Parent = placer
end
${data.BOOSTS && data.AURAS && data.SKILLS ? `-- Spielstand: Modul PlayerData (ServerScriptService > CoinmasterServer) und das Skript, das es startet
local serverFolder = game:GetService("ServerScriptService"):FindFirstChild("CoinmasterServer")
if serverFolder then
	serverFolder:Destroy()
end
serverFolder = Instance.new("Folder")
serverFolder.Name = "CoinmasterServer"
serverFolder.Parent = game:GetService("ServerScriptService")
local playerData = Instance.new("ModuleScript")
playerData.Name = "PlayerData"
playerData.Source = ${longString(PLAYER_DATA)}
playerData.Parent = serverFolder
addScript("Script", game:GetService("ServerScriptService"), "CoinmasterData", ${longString(PLAYER_DATA_START)})
addScript("Script", game:GetService("ServerScriptService"), "CoinmasterShop", ${longString(SHOP_SERVER)})
addScript("Script", game:GetService("ServerScriptService"), "CoinmasterPlayer", ${longString(playerServerSource(data))})
addScript("LocalScript", game:GetService("StarterPlayer"):WaitForChild("StarterPlayerScripts"), "CoinmasterUI", ${longString(UI_CLIENT)})
${data.ROLLS && data.TREES ? `addScript("Script", game:GetService("ServerScriptService"), "CoinmasterGarden", ${longString(GARDEN_SERVER)})
addScript("LocalScript", game:GetService("StarterPlayer"):WaitForChild("StarterPlayerScripts"), "CoinmasterGardenClient", ${longString(GARDEN_CLIENT)})
` : ''}` : ''}${data.AURAS ? `addScript("Script", game:GetService("ServerScriptService"), "CoinmasterAuras", ${longString(AURA_SERVER)})
addScript("LocalScript", game:GetService("StarterPlayer"):WaitForChild("StarterPlayerScripts"), "CoinmasterAuraClient", ${longString(AURA_CLIENT)})
` : ''}
pcall(function()
	ChangeHistoryService:SetWaypoint("Coinmaster Adventure importiert")
end)
print(("Coinmaster Adventure importiert: %d Münzen, %d Eier, %d Module."):format(#CoinData.Coins, #EggData.Eggs, ${modules.length}))
`;
}
