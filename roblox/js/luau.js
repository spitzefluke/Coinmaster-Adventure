// Erzeugt aus den Daten der Webseite (Münzen, Stufen, Mutationen, Wetter, Eier, Welten) Luau-Code
// für Roblox Studio: einzelne ModuleScripts und ein Installer-Skript für die Befehlsleiste.
//
// Alles ist reiner Text – keine Abhängigkeit vom Browser, damit es auch in Node prüfbar ist.

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

const GACHA = `${HEADER('Ziehen, Mutationen, Wetter')}
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

const COIN_BUILDER = `${HEADER('Münzen bauen')}
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

	-- Rand, Körper und erhöhtes Feld in der Mitte
	local rim = part("Part", {
		Name = "Rim",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(THICKNESS * 0.85, RADIUS * 2 + 0.16, RADIUS * 2 + 0.16),
		Color = coin.Metal.Light,
		Material = Enum.Material.Metal,
		Reflectance = 0.25,
	}, model)
	local body = part("Part", {
		Name = "Body",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(THICKNESS, RADIUS * 2, RADIUS * 2),
		Color = tier.Index == 9 and coin.Metal.Dark or coin.Metal.Mid,
		Material = Enum.Material.Metal,
		Reflectance = 0.15,
	}, model)
	local field = part("Part", {
		Name = "Field",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(THICKNESS + 0.06, RADIUS * 1.62, RADIUS * 1.62),
		Color = coin.Metal.Dark,
		Material = Enum.Material.Metal,
		Reflectance = 0.3,
	}, model)
	model.PrimaryPart = body

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

const MUTATION_FX = `${HEADER('Mutations-Effekte')}
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

const EGG_BUILDER = `${HEADER('Eier bauen')}
-- EggBuilder.Build(egg) baut ein Ei auf einem Sockel als Model.

local EggData = require(script.Parent.EggData)

local EggBuilder = {}

${BUILD_HELPERS}
local LOOK = {
	normal = { Material = Enum.Material.SmoothPlastic },
	wald = { Material = Enum.Material.Grass },
	eis = { Material = Enum.Material.Ice, Transparency = 0.1 },
	engel = { Material = Enum.Material.SmoothPlastic, Reflectance = 0.25 },
	galaxie = { Material = Enum.Material.Glass, Color = Color3.fromRGB(26, 18, 54) },
	admin = { Material = Enum.Material.DiamondPlate, Color = Color3.fromRGB(23, 23, 29) },
	release = { Material = Enum.Material.Foil },
}

function EggBuilder.Build(egg)
	local look = LOOK[egg.Id] or {}
	local model = Instance.new("Model")
	model.Name = egg.Name

	local pedestal = part("Part", { Name = "Pedestal", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.6, 4.4, 4.4), Color = Color3.fromRGB(42, 37, 50), Material = Enum.Material.Slate, CFrame = CFrame.new(0, 0.3, 0) * CFrame.Angles(0, 0, math.rad(90)) }, model)
	part("Part", { Name = "PedestalRim", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.12, 4.5, 4.5), Color = egg.Glow, Material = Enum.Material.Neon, CFrame = CFrame.new(0, 0.62, 0) * CFrame.Angles(0, 0, math.rad(90)) }, model)

	local shell = part("Part", { Name = "Shell", Shape = Enum.PartType.Ball, Size = Vector3.new(3, 3, 3), Color = look.Color or egg.Color, Material = look.Material or Enum.Material.SmoothPlastic, Transparency = look.Transparency or 0, Reflectance = look.Reflectance or 0, CFrame = CFrame.new(0, 0.6 + 2.05, 0) }, model)
	local mesh = Instance.new("SpecialMesh")
	mesh.MeshType = Enum.MeshType.Sphere
	mesh.Scale = Vector3.new(1, 1.35, 1)
	mesh.Parent = shell
	model.PrimaryPart = shell
	light(shell, egg.Glow, 1 + egg.Rank * 0.4, 8 + egg.Rank * 2)

	local top = shell.Position + Vector3.new(0, 2.05, 0)
	if egg.Id == "engel" then
		for i = 0, 23 do
			local a = math.rad(i * 15)
			part("Part", { Name = "Halo", Shape = Enum.PartType.Ball, Size = Vector3.new(0.18, 0.18, 0.18), Color = Color3.fromRGB(255, 224, 138), Material = Enum.Material.Neon, CFrame = CFrame.new(top + Vector3.new(math.cos(a) * 0.9, 0.7, math.sin(a) * 0.9)) }, model)
		end
		for _, side in ipairs({ 1, -1 }) do
			part("Part", { Name = "Wing", Shape = Enum.PartType.Ball, Size = Vector3.new(2.6, 1.4, 0.2), Color = Color3.new(1, 1, 1), Material = Enum.Material.SmoothPlastic, CFrame = CFrame.new(shell.Position + Vector3.new(side * 2, 0.6, -0.4)) * CFrame.Angles(0, 0, side * math.rad(-20)) }, model)
		end
	elseif egg.Id == "galaxie" then
		for i = 0, 35 do
			local a = math.rad(i * 10)
			part("Part", { Name = "Ring", Shape = Enum.PartType.Ball, Size = Vector3.new(0.2, 0.2, 0.2), Color = Color3.fromHSV(0.72 + (i % 6) * 0.02, 0.6, 1), Material = Enum.Material.Neon, CFrame = CFrame.new(shell.Position + Vector3.new(math.cos(a) * 2.6, math.sin(a) * 0.6, math.sin(a) * 2.6)) }, model)
		end
		local s = Instance.new("Sparkles")
		s.SparkleColor = egg.Glow
		s.Parent = shell
	elseif egg.Id == "admin" then
		part("Part", { Name = "Band", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.4, 3.08, 3.08), Color = egg.Glow, Material = Enum.Material.Neon, CFrame = CFrame.new(shell.Position) * CFrame.Angles(0, 0, math.rad(90)) }, model)
	elseif egg.Id == "release" then
		for _, side in ipairs({ 1, -1 }) do
			part("Part", { Name = "Bow", Shape = Enum.PartType.Ball, Size = Vector3.new(0.9, 0.6, 0.5), Color = Color3.fromRGB(224, 36, 58), Material = Enum.Material.SmoothPlastic, CFrame = CFrame.new(top + Vector3.new(side * 0.4, 0.15, 0)) * CFrame.Angles(0, 0, side * math.rad(25)) }, model)
		end
		local s = Instance.new("Sparkles")
		s.SparkleColor = egg.Glow
		s.Parent = shell
	elseif egg.Id == "wald" then
		for i = 0, 2 do
			local a = math.rad(i * 120 + 20)
			local base = Vector3.new(math.cos(a) * 1.7, 0.9, math.sin(a) * 1.7)
			part("Part", { Name = "MushroomStem", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.4, 0.2, 0.2), Color = Color3.fromRGB(243, 234, 216), Material = Enum.Material.SmoothPlastic, CFrame = CFrame.new(base) * CFrame.Angles(0, 0, math.rad(90)) }, model)
			part("Part", { Name = "MushroomCap", Shape = Enum.PartType.Ball, Size = Vector3.new(0.6, 0.35, 0.6), Color = Color3.fromRGB(216, 50, 46), Material = Enum.Material.SmoothPlastic, CFrame = CFrame.new(base + Vector3.new(0, 0.25, 0)) }, model)
		end
	elseif egg.Id == "eis" then
		local rng = Random.new(3)
		for i = 0, 11 do
			local a = math.rad(i * 30)
			part("WedgePart", { Name = "Crystal", Size = Vector3.new(0.4, rng:NextNumber(0.8, 1.6), 0.5), Color = Color3.fromRGB(200, 242, 255), Material = Enum.Material.Glass, Transparency = 0.2, CFrame = CFrame.new(Vector3.new(math.cos(a) * 1.7, 1.2, math.sin(a) * 1.7)) * CFrame.Angles(0, -a, math.rad(15)) }, model)
		end
	end

	model:SetAttribute("EggId", egg.Id)
	return model
end

return EggBuilder
`;

export function worldDataSource({ PLANETS, WORLDS, REBIRTH }) {
  const planets = PLANETS.map((p) =>
    fields({
      Id: str(p.id),
      Name: str(p.name),
      Title: str(p.title),
      Color: color(p.color),
      Portal: p.portal ? `{ Name = ${str(p.portal.name)}, Rebirths = ${num(p.portal.rebirths)} }` : 'nil',
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

return WorldData
`;
}

const WEATHER_FX = `${HEADER('Wetter-Effekte')}
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

local function particles(parent, props)
	local e = Instance.new("ParticleEmitter")
	e.Texture = "rbxasset://textures/particles/sparkles_main.dds"
	e.EmissionDirection = Enum.NormalId.Bottom
	e.SpreadAngle = Vector2.new(8, 8)
	e.LightEmission = 0.2
	for key, value in pairs(props) do
		e[key] = value
	end
	e.Parent = parent
	return e
end

local function lightning(cloud)
	local last = 0
	table.insert(current.connections, RunService.Heartbeat:Connect(function()
		local now = os.clock()
		if now - last < 2.5 + math.random() * 3 then
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
    { name: 'EggBuilder', source: EGG_BUILDER },
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
--   Workspace > CoinmasterShowcase            alle ${data.COINS.length} Münzen und ${data.EGGS.length} Eier zum Ansehen
--   ServerScriptService > CoinmasterWeather   wechselt das Wetter (alle ${(data.WEATHER_MS ?? 180000) / 60000} Minuten)
--   StarterPlayerScripts > CoinmasterWeatherClient   Wettereffekte und Ansage beim Wechsel
--
-- Ein erneuter Import ersetzt beides. Strg+Z macht den Import rückgängig.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

local old = ReplicatedStorage:FindFirstChild("CoinmasterAdventure")
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

showcase.Parent = workspace

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

pcall(function()
	ChangeHistoryService:SetWaypoint("Coinmaster Adventure importiert")
end)
print(("Coinmaster Adventure importiert: %d Münzen, %d Eier, %d Module."):format(#CoinData.Coins, #EggData.Eggs, ${modules.length}))
`;
}
