// Erzeugt aus den Daten der Webseite (Münzen, Stufen, Mutationen, Wetter, Eier, Welten) Luau-Code
// für Roblox Studio: einzelne ModuleScripts und ein Installer-Skript für die Befehlsleiste.
//
// Alles ist reiner Text – keine Abhängigkeit vom Browser, damit es auch in Node prüfbar ist.

import { auraDataSource, AURA_FX, AURA_SERVER, AURA_CLIENT, AURA_SHOWCASE } from './auraLuau.js';
import { petDataSource, PET_BUILDER, HATCH_FX } from './petLuau.js';
import { EGG_BUILDER } from './eggLuau.js';
import { worldFxSource, WORLD_FX_CLIENT } from './worldFxLuau.js';
import { JUICE_CLIENT } from './juiceLuau.js';
import { MUTATION_FX } from './mutationLuau.js';
import { shopDataSource, GAME_UI, SHOP_SERVER, UI_CLIENT, UI_THEME } from './uiLuau.js';
import { skillDataSource, rewardDataSource, playerServerSource } from './uiMoreLuau.js';
import { PLAYER_DATA, PLAYER_DATA_START } from './dataLuau.js';
import { rollDataSource, ROLL_BUILDER, ROLL_FX } from './rollLuau.js';
import { gardenDataSource, LOOT_BUILDER, GARDEN_BUILDER, GARDEN_SERVER, GARDEN_CLIENT } from './gardenLuau.js';
import { adminDataSource, adminServerSource } from './adminLuau.js';
import { ADMIN, ADMIN_IDS } from '../../spiel/js/admin.js';
import { GALAXIES as ALL_GALAXIES, SUPERNOVA as SUPERNOVA_RULES } from '../../welten/js/worlds.js';
import { GEMS as ALL_GEMS, GEM_FACTOR, GEM_BAGS, GEM_BAG_TIERS } from '../../edelsteine/js/gems.js';

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
      Rank: num((t.rank ?? i) + 1),
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
      Value: c.value != null ? num(c.value) : undefined,
      Weight: c.weight != null ? num(c.weight) : undefined,
      Special: c.special ? str(c.special) : undefined,
      DecalId: '0',
    }),
  );
  return `${HEADER('Stufen und Münzen')}
-- DecalId: Nach dem Hochladen der Motive (ZIP von der Webseite) hier die Asset-ID eintragen,
-- dann zeigt CoinBuilder das Motiv auf beiden Seiten der Münze.

local CoinData = {}

-- Value: Nennwert in Moneten (math.huge = unendlich), Chance: Drop-Chance in Prozent,
-- Rank: zählt für Effekte und EP (Premium wie Legendär). Münzen: Value = eigener Wert (Premium),
-- Weight = Gewicht innerhalb der Stufe (Standard 1), Special = "glitch" (Wert 1–999 beim Finden) oder
-- "mystery" (verwandelt sich beim Ziehen in eine andere Münze, siehe Gacha.RollCoin)
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
-- Nennwert einer Münze: eigener Wert (Premium) oder Wert der Stufe
function CoinData.BaseValue(coin)
	local base = coin.Value or CoinData.TierById[coin.Tier].Value
	if base == math.huge then base = 1000000 end
	return base
end
-- glitchValue: bei der Glitch-Münze der beim Finden gewürfelte Wert
function CoinData.EntryValue(coinId, mutationMultiplier, bonus, glitchValue)
	local coin = CoinData.Coins[coinId]
	if not coin then return 0 end
	local base = glitchValue or CoinData.BaseValue(coin)
	return math.floor(base * (mutationMultiplier or 1) * (bonus or 1) * 100 + 0.5) / 100
end

return CoinData
`;
}

export function mutationDataSource({ MUTATIONS, WEATHER, WEATHER_RARITIES = [], WEATHER_BLOCK = 900, WEATHER_WARN = 60, SIDE_CLEAR = 100 }) {
  const muts = MUTATIONS.map((m) =>
    fields({ Id: str(m.id), Name: str(m.name), Multiplier: num(m.multiplier), Color: color(m.color), Weather: str(m.weather), Chance: num(m.chance), Scale: m.scale ? num(m.scale) : undefined, Effect: str(m.effect) }),
  );
  const weather = WEATHER.map((w) =>
    fields({
      Id: str(w.id), Name: str(w.name), Rarity: w.rarity ? str(w.rarity) : undefined, Weight: num(w.weight), Duration: w.duration ? num(w.duration) : undefined,
      Intensity: w.intensity != null ? num(w.intensity) : undefined, Color: color(w.color), Text: str(w.text), Sky: w.sky ? color(w.sky) : undefined, Light: w.light != null ? num(w.light) : undefined,
    }),
  );
  const rarities = WEATHER_RARITIES.map((r, i) => fields({ Id: str(r.id), Name: str(r.name), Index: num(i + 1), Color: color(r.color) }));
  return `${HEADER('Mutationen und Wetter')}
local MutationData = {}

-- Chance: Prozent, mit der eine gezogene Münze während des passenden Wetters mutiert (Haupt- oder Nebenwetter).
-- Laufen zwei Wetter, kann eine Münze zwei Mutationen haben: im Spielstand als "big,nass" (Reihenfolge wie hier),
-- Multiplikatoren werden multipliziert. Scale: Größe der Münze (GIGANT 3,5-fach).
MutationData.Mutations = ${list(muts)}

-- Weight: wie oft das Wetter in einem Zeitblock gewählt wird (klar = der Block bleibt klar)
-- Duration: Sekunden, die es anhält · Intensity: Stärke der Effekte · Rarity: Seltenheit (WeatherRarities)
-- Sky/Light: Farbe und Helligkeit, die WeatherFx in Lighting setzt
MutationData.Weather = ${list(weather)}

-- Seltenheiten der Wetter (je seltener, desto stärker die Effekte und größer die Ansage)
MutationData.WeatherRarities = ${rarities.length ? list(rarities) : '{}'}

-- Zeitblock in Sekunden (pro Block höchstens ein Wetter) und Vorwarnzeit
MutationData.WeatherBlock = ${num(WEATHER_BLOCK)}
MutationData.WeatherWarn = ${num(WEATHER_WARN)}
-- Nebenwetter: zweite Spur im Zeitplan, Gewicht von „klar“ dort (siehe Gacha.SideWeatherAt)
MutationData.SideClear = ${num(SIDE_CLEAR)}

MutationData.WeatherRarityById = {}
for _, r in ipairs(MutationData.WeatherRarities) do
	MutationData.WeatherRarityById[r.Id] = r
end

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

-- "big,nass" → { big, nass } (nur bekannte Mutationen, Reihenfolge wie MutationData.Mutations)
function MutationData.Parse(text)
	local set = {}
	for id in string.gmatch(text or "", "[^,]+") do set[id] = true end
	local list = {}
	for _, m in ipairs(MutationData.Mutations) do
		if set[m.Id] then table.insert(list, m) end
	end
	return list
end
function MutationData.Key(list)
	local ids = {}
	for _, m in ipairs(list) do table.insert(ids, m.Id) end
	return #ids > 0 and table.concat(ids, ",") or nil
end
function MutationData.Multiplier(text)
	local p = 1
	for _, m in ipairs(MutationData.Parse(text)) do p = p * m.Multiplier end
	return p
end
-- Name und Farbe einer Kombination: stärkste zuerst ("GIGANT + Sturzflut")
function MutationData.Name(text)
	local list = MutationData.Parse(text)
	table.sort(list, function(a, b) return a.Multiplier > b.Multiplier end)
	local names = {}
	for _, m in ipairs(list) do table.insert(names, m.Name) end
	return table.concat(names, " + "), list[1] and list[1].Color or nil
end
-- Eine Mutation oder Kombination als Tabelle wie eine einzelne Mutation (Id = Schlüssel, Name, Color,
-- Multiplier = Produkt), für Anzeigen; nil ohne Mutation
function MutationData.Combo(text)
	local list = MutationData.Parse(text)
	if #list == 0 then return nil end
	if #list == 1 then return list[1] end
	local name, color = MutationData.Name(text)
	return { Id = MutationData.Key(list), Name = name, Color = color, Multiplier = MutationData.Multiplier(text), List = list }
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

-- Zieht eine Münze nach Drop-Chance: erst die Stufe, dann nach Gewicht innerhalb der Stufe (Weight, Standard 1).
-- Die Mystery-Münze verwandelt sich sofort in eine andere Münze: Rückgabe coin, true (= war Mystery).
-- keepMystery = true: die Mystery-Münze selbst zurückgeben.
function Gacha.RollCoin(rng, keepMystery)
	rng = rng or Random.new()
	local total = 0
	for _, tier in ipairs(CoinData.Tiers) do
		total = total + tier.Chance
	end
	local roll = rng:NextNumber() * total
	local chosen = CoinData.Tiers[1]
	for _, tier in ipairs(CoinData.Tiers) do
		roll = roll - tier.Chance
		if roll <= 0 then
			chosen = tier
			break
		end
	end
	local pool, weights = {}, 0
	for _, coin in ipairs(CoinData.Coins) do
		if coin.Tier == chosen.Id then
			table.insert(pool, coin)
			weights = weights + (coin.Weight or 1)
		end
	end
	local r = rng:NextNumber() * weights
	local coin = pool[#pool]
	for _, c in ipairs(pool) do
		r = r - (c.Weight or 1)
		if r <= 0 then
			coin = c
			break
		end
	end
	if coin.Special == "mystery" and not keepMystery then
		local next = coin
		while next.Special == "mystery" do
			next = Gacha.RollCoin(rng, true)
		end
		return next, true
	end
	return coin, false
end

-- Wert einer Glitch-Münze: beim Finden gewürfelt (1–999)
function Gacha.GlitchValue(rng)
	return (rng or Random.new()):NextInteger(1, 999)
end

-- Gibt die Mutation zurück, wenn die Münze während dieses Wetters mutiert, sonst nil
-- bonus: zusätzliche Prozentpunkte (Skill „Wettergespür“)
function Gacha.RollMutation(weatherId, rng, bonus)
	rng = rng or Random.new()
	local m = MutationData.ForWeather(weatherId)
	if m and rng:NextNumber() * 100 < m.Chance + (bonus or 0) then
		return m
	end
	return nil
end

-- Würfelt für jedes laufende Wetter seine Mutation (Liste von Wetter-Ids, z. B. aus Gacha.WeathersAt).
-- Gibt den Schlüssel ("big,nass") oder nil zurück.
function Gacha.RollMutations(weatherIds, rng, bonus)
	rng = rng or Random.new()
	local list, seen = {}, {}
	for _, id in ipairs(weatherIds) do
		if not seen[id] then
			seen[id] = true
			local m = Gacha.RollMutation(id, rng, bonus)
			if m then table.insert(list, m) end
		end
	end
	return MutationData.Key(MutationData.Parse(MutationData.Key(list)))
end

-- ── Wetter-Zeitplan (wie weatherAt in muenzen/js/mutations.js) ──
-- Die Zeit ist in Blöcke von WeatherBlock Sekunden geteilt. Pro Block wird gewürfelt: meist bleibt er klar,
-- sonst kommt genau ein Wetter für seine Duration an einer gewürfelten Stelle. Reine Ganzzahl-Rechnung aus
-- der Uhrzeit, damit alle Server (und die Webseite) dasselbe Wetter haben.
local function hashR(block, salt)
	local h1 = ((block % 10007) * 7919 + salt * 104729) % 10007
	return ((h1 * h1 + 12345) % 10007) / 10007
end
local totalWeight = 0
for _, w in ipairs(MutationData.Weather) do
	totalWeight = totalWeight + w.Weight
end

-- Wetter im Block: w, Beginn, Ende (Sekunden) oder nil, wenn der Block klar bleibt
function Gacha.WeatherEvent(block)
	local roll = hashR(block, 1) * totalWeight
	local chosen = MutationData.Weather[1]
	for _, w in ipairs(MutationData.Weather) do
		roll = roll - w.Weight
		if roll < 0 then
			chosen = w
			break
		end
	end
	if chosen.Id == "klar" then return nil end
	local B = MutationData.WeatherBlock
	local start = block * B + math.floor(hashR(block, 2) * (B - chosen.Duration))
	return chosen, start, start + chosen.Duration
end

-- Nächstes Wetter, das nach now beginnt: w, Beginn, Ende (oder nil)
function Gacha.NextWeather(now)
	now = now or os.time()
	local b = math.floor(now / MutationData.WeatherBlock)
	for k = 0, 47 do
		local w, s, e = Gacha.WeatherEvent(b + k)
		if w and s > now then return w, s, e end
	end
	return nil
end

-- Wetter jetzt: w, Beginn, Ende (klar reicht vom Ende des letzten bis zum Beginn des nächsten Wetters)
function Gacha.WeatherAt(now)
	now = now or os.time()
	local B = MutationData.WeatherBlock
	local b = math.floor(now / B)
	local w, s, e = Gacha.WeatherEvent(b)
	if w and now >= s and now < e then return w, s, e end
	local starts = b * B
	for k = 0, 47 do
		local pw, ps, pe = Gacha.WeatherEvent(b - k)
		if pw and pe <= now then
			starts = pe
			break
		end
	end
	local _, ns = Gacha.NextWeather(now)
	return MutationData.Weather[1], starts, ns or (b + 1) * B
end

-- ── Nebenwetter (wie sideWeatherEvent in mutations.js): zweite Spur, kann gleichzeitig laufen ──
local sideTotal = totalWeight - MutationData.Weather[1].Weight + (MutationData.SideClear or 100)
function Gacha.SideWeatherEvent(block)
	local roll = hashR(block, 3) * sideTotal - (MutationData.SideClear or 100)
	if roll < 0 then return nil end
	local chosen = MutationData.Weather[#MutationData.Weather]
	for i = 2, #MutationData.Weather do
		local w = MutationData.Weather[i]
		roll = roll - w.Weight
		if roll < 0 then
			chosen = w
			break
		end
	end
	local main = Gacha.WeatherEvent(block)
	if main and main.Id == chosen.Id then return nil end
	local B = MutationData.WeatherBlock
	local start = block * B + math.floor(hashR(block, 4) * (B - chosen.Duration))
	return chosen, start, start + chosen.Duration
end
-- Nebenwetter jetzt: w, Beginn, Ende oder nil
function Gacha.SideWeatherAt(now)
	now = now or os.time()
	local b = math.floor(now / MutationData.WeatherBlock)
	for _, k in ipairs({ 0, -1 }) do
		local w, s, e = Gacha.SideWeatherEvent(b + k)
		if w and now >= s and now < e then return w, s, e end
	end
	return nil
end
-- Alle Wetter-Ids, die jetzt laufen (ohne klar); mit erzwungenem Wetter vom Admin Panel
function Gacha.WeathersAt(now)
	now = now or os.time()
	local out = {}
	local main = Gacha.Forced(now) or Gacha.WeatherAt(now)
	if main.Id ~= "klar" then table.insert(out, main.Id) end
	local side = Gacha.SideWeatherAt(now)
	if side and side.Id ~= main.Id then table.insert(out, side.Id) end
	return out
end

-- Aktuelles Wetter und Sekunden bis zum Wechsel
function Gacha.CurrentWeather(now)
	now = now or os.time()
	local w, _, e = Gacha.WeatherAt(now)
	return w, e - now
end

-- Wetter, das ein Admin erzwungen hat (ReplicatedStorage: AdminWeather, AdminWeatherEnds): w, Ende oder nil.
-- Danach geht der Zeitplan weiter.
function Gacha.Forced(now)
	local rs = game:GetService("ReplicatedStorage")
	local w = MutationData.WeatherById[rs:GetAttribute("AdminWeather") or ""]
	local ends = rs:GetAttribute("AdminWeatherEnds") or 0
	if w and ends > (now or os.time()) then return w, ends end
	return nil
end

-- Die nächsten n Phasen: { { Id, Starts, Ends }, … } (mit erzwungenem Wetter vorne)
function Gacha.Forecast(n, now)
	now = now or os.time()
	local out = {}
	local t = now
	local fw, fe = Gacha.Forced(now)
	if fw then
		table.insert(out, { Id = fw.Id, Starts = now, Ends = fe })
		t = fe
	end
	while #out < n do
		local w, s, e = Gacha.WeatherAt(t)
		table.insert(out, { Id = w.Id, Starts = math.max(s, t), Ends = e })
		t = e
	end
	return out
end

-- Wert einer Münze in Moneten (Premium: eigener Wert), mit Multiplikator der Mutation
function Gacha.Value(coin, mutation)
	local value = CoinData.BaseValue(coin)
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

// MutationFx (zweite Fassung der Mutations-Effekte) liegt in mutationLuau.js
export { MUTATION_FX };

// EggBuilder (Eier v2) liegt in eggLuau.js
export { EGG_BUILDER };

export function worldDataSource({ PLANETS, WORLDS, REBIRTH, GALAXIES = ALL_GALAXIES, SUPERNOVA = SUPERNOVA_RULES }) {
  const galaxies = GALAXIES.map((g) =>
    fields({ Id: str(g.id), Name: str(g.name), Title: str(g.title), Text: str(g.text), Color: color(g.color), Find: str(g.find), Supernovas: num(g.supernovas) }),
  );
  const planets = PLANETS.map((p) =>
    fields({
      Id: str(p.id),
      Galaxy: str(p.galaxy || 'g1'),
      Name: str(p.name),
      Title: str(p.title),
      Text: str(p.text),
      Color: color(p.color),
      Portal: p.portal ? `{ Name = ${str(p.portal.name)}, Rebirths = ${num(p.portal.rebirths || 0)}, Supernovas = ${num(p.portal.supernovas || 0)}, Text = ${str(p.portal.text)} }` : 'nil',
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
          Currency: str(GALAXIES.find((g) => g.id === (PLANETS.find((p) => p.id === w.planet)?.galaxy || 'g1'))?.currency || 'moneten'),
          Ground: color(w.ground),
          Accent: color(w.accent),
          Text: str(w.text),
        }),
  );
  return `${HEADER('Galaxien, Planeten, Welten, Wiedergeburt, Supernova')}
-- Welten kauft man pro Planet der Reihe nach mit Moneten. Ein Portal zum nächsten Planeten öffnet
-- sich, wenn die letzte Welt des vorigen Planeten (derselben Galaxie) gekauft ist und genug
-- Wiedergeburten da sind. Das erste Portal einer neuen Galaxie braucht eine Supernova.
-- Luck wirkt wie der Skill „Glückspilz“ (0.5 = +50 % auf alle Stufen außer Normal),
-- Value multipliziert den Münzwert. Find: was man in der Galaxie findet ("coins" oder "gems").

local WorldData = {}

WorldData.Galaxies = ${list(galaxies)}

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
WorldData.GalaxyById = {}
for _, galaxy in ipairs(WorldData.Galaxies) do
	WorldData.GalaxyById[galaxy.Id] = galaxy
end

-- Planeten einer Galaxie in Reihenfolge
function WorldData.PlanetsOf(galaxyId)
	local result = {}
	for _, planet in ipairs(WorldData.Planets) do
		if planet.Galaxy == galaxyId then table.insert(result, planet) end
	end
	return result
end

-- Galaxie einer Welt (der Spawn zählt zur ersten)
function WorldData.GalaxyOfWorld(worldId)
	local world = WorldData.ById[worldId]
	local planet = world and WorldData.PlanetById[world.Planet]
	return (planet and WorldData.GalaxyById[planet.Galaxy]) or WorldData.Galaxies[1]
end

-- Findet man in dieser Welt Edelsteine statt Münzen?
function WorldData.FindsGems(worldId)
	return WorldData.GalaxyOfWorld(worldId).Find == "gems"
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

-- Supernova (Prestige): ab Rebirths Wiedergeburten, einmal pro weiterer Galaxie (Max).
-- Moneten und Wiedergeburten gehen auf 0, alles ist danach für immer Bonus-mal so viel wert.
WorldData.Supernova = {
	Rebirths = ${num(SUPERNOVA.rebirths)},
	Bonus = ${num(SUPERNOVA.bonus)},
	Max = ${num(SUPERNOVA.max)},
}

function WorldData.SupernovaMultiplier(n)
	return WorldData.Supernova.Bonus ^ (n or 0)
end

-- Grund, warum (noch) keine Supernova geht, sonst nil. state wie unten (mit Supernovas)
function WorldData.CanSupernova(state)
	if (state.Supernovas or 0) >= WorldData.Supernova.Max then return "Alle Galaxien sind schon offen" end
	if state.Rebirths < WorldData.Supernova.Rebirths then
		return "Erst " .. WorldData.Supernova.Rebirths .. " Wiedergeburten (du hast " .. state.Rebirths .. ")"
	end
	return nil
end

-- Galaxie, die die nächste Supernova öffnet (oder nil)
function WorldData.NextGalaxy(state)
	for _, g in ipairs(WorldData.Galaxies) do
		if g.Supernovas == (state.Supernovas or 0) + 1 then return g end
	end
	return nil
end

-- ── Regeln für Kaufen und Portale (Server und Oberfläche nutzen dieselben) ──
-- state = { Owned = { [worldId] = true }, Portals = { [planetId] = true }, Moneten = n, Staub = n, Rebirths = n, Supernovas = n }
-- Currency einer Welt: "moneten" (Milchstraße) oder "staub" (Diamantstaub, Juwelnebel)
WorldData.Currencies = {
	moneten = { Name = "Moneten", Attribute = "Moneten", Icon = "coin", Color = Color3.fromHex("#ffd76a") },
	staub = { Name = "Diamantstaub", Attribute = "Diamantstaub", Icon = "gem", Color = Color3.fromHex("#8af0ff") },
}
function WorldData.Wallet(state, currency)
	if currency == "staub" then return state.Staub or 0 end
	return state.Moneten or 0
end
-- Am Spieler stehen sie als Attribute: Worlds und Portals (Ids mit Komma), Rebirths, Supernovas, World (aktuelle Welt)

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
	if WorldData.Wallet(state, world.Currency) < world.Price then return "Zu wenig " .. WorldData.Currencies[world.Currency or "moneten"].Name end
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
	if prev and prev.Galaxy == planet.Galaxy then
		local list = WorldData.OfPlanet(prev.Id)
		local last = list[#list]
		table.insert(checks, { "„" .. last.Name .. "“ auf " .. prev.Name .. " gekauft", WorldData.Owns(state, last.Id) })
	end
	local sn = planet.Portal.Supernovas or 0
	if sn > 0 then
		local have = state.Supernovas or 0
		table.insert(checks, { (sn > 1 and (sn .. " Supernovas") or "Supernova") .. " (du hast " .. have .. ")", have >= sn })
	end
	local n = planet.Portal.Rebirths
	if n > 0 then
		table.insert(checks, { n .. " Wiedergeburt" .. (n > 1 and "en" or "") .. " (du hast " .. state.Rebirths .. ")", state.Rebirths >= n })
	end
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

// Edelsteine (Juwelnebel): dieselben Stufen wie CoinData, Wert = Münzwert der Stufe × Factor
export function gemDataSource({ GEMS = ALL_GEMS } = {}) {
  const gems = GEMS.map((g, i) =>
    fields({
      Id: str(g.id),
      Index: num(i + 1),
      Name: str(g.name),
      Tier: str(g.tier),
      Cut: str(g.cut),
      Light: color(g.colors[0]),
      Color: color(g.colors[1]),
      Dark: color(g.colors[2]),
      Text: str(g.text),
    }),
  );
  const bagTiers = GEM_BAG_TIERS.map((t) => fields({ Id: str(t.id), Name: str(t.name), Color: color(t.color) }));
  const bags = GEM_BAGS.map((b) => fields({ Nr: num(b.nr), Name: str(b.name), Tier: str(b.tier), Capacity: num(b.capacity), Price: num(b.price), Text: str(b.text) }));
  return `${HEADER('Edelsteine')}
-- Im Juwelnebel (Galaxie 2, nach der Supernova) findet man Edelsteine statt Münzen.
-- Tier: Stufe aus CoinData (gleiche Drop-Chancen). Wert in Moneten: CoinData-Stufenwert × Factor,
-- beim Fund mal Welt, Wiedergeburt und Supernova. Am Spieler: Gem_<id> (Anzahl), GemValue_<id> (Gesamtwert).

local GemData = {}

GemData.Factor = ${num(GEM_FACTOR)}

GemData.Gems = ${list(gems)}

GemData.ById = {}
for _, gem in ipairs(GemData.Gems) do
	GemData.ById[gem.Id] = gem
end

-- Edelstein-Taschen: der Reihe nach mit Diamantstaub kaufen (Attribut GemBag = Nr. der Tasche, Start 1).
-- Capacity = wie viele Edelsteine man gleichzeitig tragen kann.
GemData.BagTiers = ${list(bagTiers)}
GemData.BagTierById = {}
for _, t in ipairs(GemData.BagTiers) do
	GemData.BagTierById[t.Id] = t
end
GemData.Bags = ${list(bags)}

function GemData.Bag(nr)
	return GemData.Bags[math.clamp(math.floor(nr or 1), 1, #GemData.Bags)]
end

return GemData
`;
}

export const WEATHER_FX = `${HEADER('Wetter-Effekte')}
-- Läuft auf dem Client (LocalScript): WeatherFx.Apply(weatherId) blendet Himmel, Licht, Nebel, Wolken und
-- Partikel sanft zum neuen Wetter über. Mehrere Wetter gleichzeitig: WeatherFx.Apply("regen,riesenmond") oder
-- eine Liste; die Effekte laufen übereinander, das seltenste Wetter bestimmt Licht und Nebel.
-- (Einzelnes Wetter:)
-- Partikel sanft zum neuen Wetter über (das alte klingt aus). Die Stärke richtet sich nach dem Wetter
-- (Intensity): häufiges Wetter bleibt dezent, seltenes wird richtig stark.
-- WeatherFx.Announce(weatherId, playerGui) zeigt die Ansage beim Beginn, je seltener desto größer.
-- WeatherFx.Warn(weatherId, startsAt, playerGui) kündigt ein Wetter vorher an, mit Countdown.

local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local MutationData = require(script.Parent.MutationData)

local WeatherFx = {}

local FADE_IN = 8 -- Sekunden, bis ein Wetter voll da ist
local FADE_OUT = 6 -- Sekunden, bis das alte ausgeklungen ist
local LIGHT = TweenInfo.new(FADE_IN, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)

local base = nil -- Lighting vor dem ersten Wetter
local actives = {} -- laufende Wetter: [weatherId] = set (siehe newSet)
local lightFor = nil -- Wetter, dessen Licht gerade gilt

-- Licht setzen: sanft über FADE_IN Sekunden oder sofort
local function setLight(goal, instant)
	if instant then
		for k, v in pairs(goal) do Lighting[k] = v end
	else
		TweenService:Create(Lighting, LIGHT, goal):Play()
	end
end

local function remember()
	if base then return end
	base = {
		Ambient = Lighting.Ambient, OutdoorAmbient = Lighting.OutdoorAmbient, Brightness = Lighting.Brightness,
		ClockTime = Lighting.ClockTime, FogColor = Lighting.FogColor, FogEnd = Lighting.FogEnd, ColorShift_Top = Lighting.ColorShift_Top,
	}
end

-- Ein Wetter: Teile, Effekt-Verbindungen, Partikel mit Zielmenge und Funktionen fürs Ein-/Ausblenden (k 0–1)
local function newSet(id, strength)
	return { Id = id, Strength = strength, Parts = {}, Effects = {}, Follow = {}, Emitters = {}, Fades = {}, Start = os.clock() }
end

local function camPos()
	local cam = workspace.CurrentCamera
	return cam and cam.CFrame.Position or Vector3.zero
end

-- Boden unter einem Punkt (Strahl nach unten); ohne Treffer y = 0
local function groundBelow(pos)
	local ok, hit = pcall(function()
		local params = RaycastParams.new()
		params.FilterType = Enum.RaycastFilterType.Exclude
		local char = Players.LocalPlayer and Players.LocalPlayer.Character
		params.FilterDescendantsInstances = char and { char } or {}
		return workspace:Raycast(pos, Vector3.new(0, -200, 0), params)
	end)
	if ok and hit then return hit.Position end
	return Vector3.new(pos.X, 0, pos.Z)
end

-- Unsichtbare Platte, die mit der Kamera mitwandert (offset über bzw. am Boden unter der Kamera)
local function holder(set, size, offset, onGround)
	local p = Instance.new("Part")
	p.Name = "Wetter"
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.Transparency = 1
	p.Size = size
	p.Parent = workspace
	table.insert(set.Parts, p)
	table.insert(set.Follow, RunService.RenderStepped:Connect(function()
		local c = camPos()
		p.CFrame = CFrame.new((onGround and groundBelow(c) or c) + offset)
	end))
	return p
end

-- Partikel: startet bei 0 und wächst beim Einblenden auf Rate × Stärke
local function particles(set, parent, props)
	local e = Instance.new("ParticleEmitter")
	e.Texture = "rbxasset://textures/particles/sparkles_main.dds"
	e.EmissionDirection = Enum.NormalId.Bottom
	e.SpreadAngle = Vector2.new(8, 8)
	e.LightEmission = 0.2
	for key, value in pairs(props) do
		e[key] = value
	end
	local target = math.max(0.5, (props.Rate or 10) * set.Strength)
	e.Rate = 0
	e.Parent = parent
	table.insert(set.Emitters, { E = e, Target = target })
	return e
end

-- Effekt-Schleife (endet sofort, wenn das Wetter geht)
local function every(set, fn)
	table.insert(set.Effects, RunService.Heartbeat:Connect(fn))
end

-- Großes leuchtendes Objekt am Himmel, das mit der Kamera mitwandert und weich erscheint
local function skyObject(set, props, offset, still)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.CastShadow = false
	for key, value in pairs(props) do p[key] = value end
	local goal = p.Transparency
	p.Transparency = 1
	p.Parent = workspace
	table.insert(set.Parts, p)
	p.CFrame = CFrame.new(camPos() + offset)
	if not still then
		table.insert(set.Follow, RunService.RenderStepped:Connect(function()
			p.CFrame = CFrame.new(camPos() + offset)
		end))
	end
	table.insert(set.Fades, function(k) p.Transparency = goal + (1 - goal) * (1 - k) end)
	return p
end

-- Wolkendecke (Terrain.Clouds), falls vorhanden
local function clouds(cover, density, color)
	pcall(function()
		local terrain = workspace:FindFirstChildOfClass("Terrain")
		if not terrain then return end
		local c = terrain:FindFirstChildOfClass("Clouds")
		if not c then
			c = Instance.new("Clouds")
			c.Cover = 0
			c.Parent = terrain
		end
		TweenService:Create(c, LIGHT, { Cover = cover, Density = density, Color = color }):Play()
	end)
end

-- Blitz mit Zickzack-Ästen, hellem Licht und kurzem Aufblitzen des Himmels
local function bolt(set)
	local top = camPos() + Vector3.new(math.random(-70, 70), 70, math.random(-70, 70))
	local ground = groundBelow(top)
	local parts = {}
	local function seg(a, b, w)
		local mid = (a + b) / 2
		local p = Instance.new("Part")
		p.Name = "Blitz"
		p.Anchored = true
		p.CanCollide = false
		p.CanQuery = false
		p.Material = Enum.Material.Neon
		p.Color = Color3.fromRGB(255, 250, 210)
		p.Size = Vector3.new(w, w, (b - a).Magnitude + w)
		p.CFrame = CFrame.lookAt(mid, b)
		p.Parent = workspace
		table.insert(parts, p)
	end
	local pos = top
	local n = 8
	for i = 1, n do
		local nextPos = top:Lerp(ground, i / n) + Vector3.new(math.random(-4, 4), 0, math.random(-4, 4))
		seg(pos, nextPos, 0.7)
		-- zwei Seitenäste
		if i == 3 or i == 5 then
			local bp = nextPos
			for k = 1, 3 do
				local np = bp + Vector3.new(math.random(-6, 6), -6, math.random(-6, 6))
				seg(bp, np, 0.35)
				bp = np
			end
		end
		pos = nextPos
	end
	local light = Instance.new("PointLight")
	light.Brightness = 8
	light.Range = 60
	light.Color = Color3.fromRGB(220, 230, 255)
	light.Parent = parts[#parts]
	local was = Lighting.Brightness
	Lighting.Brightness = was + 3
	TweenService:Create(Lighting, TweenInfo.new(0.5), { Brightness = was }):Play()
	for _, p in ipairs(parts) do
		TweenService:Create(p, TweenInfo.new(0.45), { Transparency = 1 }):Play()
	end
	task.delay(0.5, function()
		for _, p in ipairs(parts) do p:Destroy() end
	end)
end

local SETUPS = {}

function SETUPS.regen(set)
	local sky = holder(set, Vector3.new(140, 1, 140), Vector3.new(0, 45, 0))
	particles(set, sky, { Rate = 900, Lifetime = NumberRange.new(0.8, 1), Speed = NumberRange.new(75, 85), Size = NumberSequence.new(0.09), Squash = NumberSequence.new(4), Color = ColorSequence.new(Color3.fromRGB(200, 226, 255)), Transparency = NumberSequence.new(0.3), LightEmission = 0 })
	-- Spritzer und Pfützenglitzern am Boden um die Kamera
	local floor = holder(set, Vector3.new(60, 0.2, 60), Vector3.new(0, 0.2, 0), true)
	particles(set, floor, { Rate = 160, EmissionDirection = Enum.NormalId.Top, Lifetime = NumberRange.new(0.25, 0.4), Speed = NumberRange.new(3, 6), SpreadAngle = Vector2.new(40, 40), Acceleration = Vector3.new(0, -30, 0), Size = NumberSequence.new(0.12, 0), Color = ColorSequence.new(Color3.fromRGB(220, 236, 255)), LightEmission = 0.3 })
	-- Dunst
	particles(set, floor, { Rate = 8, EmissionDirection = Enum.NormalId.Top, Lifetime = NumberRange.new(6, 9), Speed = NumberRange.new(0.5, 1), Size = NumberSequence.new(8, 14), Transparency = NumberSequence.new(0.9, 1), Color = ColorSequence.new(Color3.fromRGB(200, 210, 225)), LightEmission = 0 })
	clouds(0.75, 0.6, Color3.fromRGB(150, 160, 175))
end

function SETUPS.gewitter(set)
	SETUPS.regen(set)
	clouds(0.9, 0.85, Color3.fromRGB(70, 76, 92))
	local last, wait = os.clock(), 3
	every(set, function()
		if os.clock() - last < wait then return end
		last = os.clock()
		wait = (5 + math.random() * 6) / math.max(0.5, set.Strength * 1.4)
		bolt(set)
	end)
end

function SETUPS.erdbeben(set)
	local sky = holder(set, Vector3.new(100, 1, 100), Vector3.new(0, 30, 0))
	particles(set, sky, { Rate = 40, Lifetime = NumberRange.new(2, 3), Speed = NumberRange.new(20, 30), Size = NumberSequence.new(0.8), Color = ColorSequence.new(Color3.fromRGB(125, 113, 102)), LightEmission = 0 })
	-- herabfallende Brocken, die sich drehen
	particles(set, sky, { Rate = 10, Lifetime = NumberRange.new(1.5, 2), Speed = NumberRange.new(25, 35), Size = NumberSequence.new(1.4), Rotation = NumberRange.new(0, 360), RotSpeed = NumberRange.new(-200, 200), Color = ColorSequence.new(Color3.fromRGB(96, 84, 74)), LightEmission = 0 })
	-- Staubwolken am Boden
	local floor = holder(set, Vector3.new(50, 0.2, 50), Vector3.new(0, 0.3, 0), true)
	particles(set, floor, { Rate = 14, EmissionDirection = Enum.NormalId.Top, Lifetime = NumberRange.new(2, 3.5), Speed = NumberRange.new(2, 5), SpreadAngle = Vector2.new(70, 70), Size = NumberSequence.new(2, 5), Transparency = NumberSequence.new(0.6, 1), Color = ColorSequence.new(Color3.fromRGB(170, 150, 120)), LightEmission = 0 })
	-- Beben in Wellen: mal stärker, mal ruhig
	local function hum()
		local char = Players.LocalPlayer and Players.LocalPlayer.Character
		return char and char:FindFirstChildOfClass("Humanoid")
	end
	every(set, function()
		local h = hum()
		if not h then return end
		local t = os.clock()
		local wave = math.max(0, math.sin(t * 0.7)) ^ 2
		local a = (0.1 + wave * 0.35) * set.Strength * math.min(1, (t - set.Start) / FADE_IN)
		h.CameraOffset = Vector3.new(math.sin(t * 23) * a, math.sin(t * 31) * a * 0.6, 0)
	end)
	table.insert(set.Effects, { Disconnect = function()
		local h = hum()
		if h then h.CameraOffset = Vector3.zero end
	end })
end

function SETUPS.schneesturm(set)
	local sky = holder(set, Vector3.new(160, 1, 160), Vector3.new(0, 40, 0))
	local big = particles(set, sky, { Rate = 260, Lifetime = NumberRange.new(4, 6), Speed = NumberRange.new(10, 16), Acceleration = Vector3.new(12, 0, 4), Size = NumberSequence.new(0.4), Rotation = NumberRange.new(0, 360), RotSpeed = NumberRange.new(-60, 60), Color = ColorSequence.new(Color3.fromRGB(255, 255, 255)), SpreadAngle = Vector2.new(30, 30) })
	local small = particles(set, sky, { Rate = 500, Lifetime = NumberRange.new(3, 4), Speed = NumberRange.new(18, 24), Acceleration = Vector3.new(20, 0, 6), Size = NumberSequence.new(0.14), Color = ColorSequence.new(Color3.fromRGB(235, 246, 255)), SpreadAngle = Vector2.new(20, 20) })
	-- Böen: der Wind dreht und frischt auf
	every(set, function()
		local t = os.clock()
		local gust = 10 + math.sin(t * 0.6) * 10 + math.max(0, math.sin(t * 0.23)) * 25
		big.Acceleration = Vector3.new(gust, 0, math.sin(t * 0.4) * 8)
		small.Acceleration = Vector3.new(gust * 1.6, 0, math.sin(t * 0.4) * 12)
	end)
	clouds(0.85, 0.7, Color3.fromRGB(225, 232, 240))
end

function SETUPS.disconacht(set)
	local colors = { Color3.fromRGB(255, 61, 242), Color3.fromRGB(61, 232, 255), Color3.fromRGB(255, 226, 61), Color3.fromRGB(122, 92, 255) }
	local sky = holder(set, Vector3.new(80, 1, 80), Vector3.new(0, 30, 0))
	local glow = particles(set, sky, { Rate = 70, Lifetime = NumberRange.new(4, 6), Speed = NumberRange.new(4, 8), Size = NumberSequence.new(0.6), Color = ColorSequence.new(colors[1], colors[2]), LightEmission = 1, SpreadAngle = Vector2.new(60, 60) })
	-- Konfetti
	particles(set, sky, { Rate = 50, Lifetime = NumberRange.new(4, 6), Speed = NumberRange.new(6, 10), Size = NumberSequence.new(0.35), Rotation = NumberRange.new(0, 360), RotSpeed = NumberRange.new(-300, 300), Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, colors[1]), ColorSequenceKeypoint.new(0.33, colors[2]), ColorSequenceKeypoint.new(0.66, colors[3]), ColorSequenceKeypoint.new(1, colors[4]) }), LightEmission = 0.6, SpreadAngle = Vector2.new(50, 50) })
	-- vier Lichtkegel, die über den Himmel schwenken
	local beams = {}
	for i = 1, 4 do
		beams[i] = skyObject(set, { Name = "Lichtkegel", Size = Vector3.new(3, 3, 160), Material = Enum.Material.Neon, Color = colors[i], Transparency = 0.78 }, Vector3.new(0, -10, 0), true)
	end
	local i, last = 0, 0
	every(set, function()
		local t = os.clock()
		for k, b in ipairs(beams) do
			local a = t * 0.6 + k * math.pi / 2
			b.CFrame = CFrame.new(camPos() + Vector3.new(math.cos(a) * 30, -12, math.sin(a) * 30)) * CFrame.Angles(math.rad(-55 + math.sin(t + k) * 15), a, 0) * CFrame.new(0, 0, -80)
		end
		if t - last < 1.5 then return end
		last = t
		i = i % #colors + 1
		TweenService:Create(Lighting, TweenInfo.new(1.4), { Ambient = colors[i]:Lerp(Color3.new(0, 0, 0), 0.6) }):Play()
		glow.Color = ColorSequence.new(colors[i], colors[i % #colors + 1])
		for k, b in ipairs(beams) do b.Color = colors[(i + k) % #colors + 1] end
	end)
end

function SETUPS.blutmond(set)
	-- riesiger roter Mond mit Hof
	skyObject(set, { Name = "Blutmond", Shape = Enum.PartType.Ball, Size = Vector3.new(70, 70, 70), Material = Enum.Material.Neon, Color = Color3.fromRGB(200, 20, 16), Transparency = 0 }, Vector3.new(120, 220, 420))
	skyObject(set, { Name = "Mondhof", Shape = Enum.PartType.Ball, Size = Vector3.new(110, 110, 110), Material = Enum.Material.Neon, Color = Color3.fromRGB(255, 40, 30), Transparency = 0.85 }, Vector3.new(120, 220, 425))
	local floor = holder(set, Vector3.new(70, 0.2, 70), Vector3.new(0, 0.3, 0), true)
	-- aufsteigende Glut
	particles(set, floor, { Rate = 60, EmissionDirection = Enum.NormalId.Top, Lifetime = NumberRange.new(5, 7), Speed = NumberRange.new(2, 4), Size = NumberSequence.new(0.3, 0), Color = ColorSequence.new(Color3.fromRGB(255, 80, 20), Color3.fromRGB(255, 20, 20)), LightEmission = 1, SpreadAngle = Vector2.new(20, 20) })
	-- roter Bodennebel
	particles(set, floor, { Rate = 10, EmissionDirection = Enum.NormalId.Top, Lifetime = NumberRange.new(6, 9), Speed = NumberRange.new(0.3, 0.8), Size = NumberSequence.new(7, 12), Transparency = NumberSequence.new(0.85, 1), Color = ColorSequence.new(Color3.fromRGB(140, 10, 10)), LightEmission = 0.2 })
end

function SETUPS.neonsturm(set)
	local sky = holder(set, Vector3.new(90, 40, 90), Vector3.new(0, 20, 0))
	local e = particles(set, sky, { Rate = 90, Lifetime = NumberRange.new(3, 5), Speed = NumberRange.new(6, 12), Size = NumberSequence.new(0.5), Color = ColorSequence.new(Color3.fromRGB(198, 255, 0)), LightEmission = 1, SpreadAngle = Vector2.new(70, 70) })
	-- waagerechte Neonschlieren
	local streak = particles(set, sky, { Rate = 40, EmissionDirection = Enum.NormalId.Right, Lifetime = NumberRange.new(0.6, 1), Speed = NumberRange.new(60, 90), Size = NumberSequence.new(0.25), Squash = NumberSequence.new(-5), Color = ColorSequence.new(Color3.fromRGB(0, 255, 200)), LightEmission = 1, SpreadAngle = Vector2.new(5, 30) })
	every(set, function()
		local h = (os.clock() * 0.05) % 1
		Lighting.Ambient = Color3.fromHSV(h, 0.8, 0.45)
		e.Color = ColorSequence.new(Color3.fromHSV(h, 1, 1), Color3.fromHSV((h + 0.5) % 1, 1, 1))
		streak.Color = ColorSequence.new(Color3.fromHSV((h + 0.3) % 1, 1, 1))
	end)
end

function SETUPS.goldregen(set)
	local sky = holder(set, Vector3.new(120, 1, 120), Vector3.new(0, 40, 0))
	particles(set, sky, { Rate = 220, Lifetime = NumberRange.new(1.2, 1.6), Speed = NumberRange.new(30, 40), Size = NumberSequence.new(0.22), Squash = NumberSequence.new(3), Color = ColorSequence.new(Color3.fromRGB(255, 210, 58), Color3.fromRGB(255, 176, 32)), LightEmission = 0.8 })
	-- große, taumelnde Goldmünzen
	particles(set, sky, { Rate = 25, Lifetime = NumberRange.new(2.5, 3.5), Speed = NumberRange.new(14, 20), Size = NumberSequence.new(0.9), Rotation = NumberRange.new(0, 360), RotSpeed = NumberRange.new(-260, 260), Squash = NumberSequence.new(0.6), Color = ColorSequence.new(Color3.fromRGB(255, 220, 90)), LightEmission = 0.9, SpreadAngle = Vector2.new(25, 25) })
	-- Glitzern in der Luft
	local mid = holder(set, Vector3.new(60, 20, 60), Vector3.new(0, 8, 0))
	particles(set, mid, { Rate = 50, Lifetime = NumberRange.new(1, 2), Speed = NumberRange.new(0, 1), Size = NumberSequence.new(0.35, 0), Color = ColorSequence.new(Color3.fromRGB(255, 246, 200)), LightEmission = 1, SpreadAngle = Vector2.new(180, 180) })
end

function SETUPS.datensturm(set)
	local sky = holder(set, Vector3.new(90, 1, 90), Vector3.new(0, 35, 0))
	-- grüner Code-Regen in langen Fäden
	particles(set, sky, { Rate = 220, Lifetime = NumberRange.new(2, 3), Speed = NumberRange.new(14, 20), Size = NumberSequence.new(0.18), Squash = NumberSequence.new(6), Color = ColorSequence.new(Color3.fromRGB(61, 255, 122), Color3.fromRGB(10, 120, 40)), LightEmission = 1, SpreadAngle = Vector2.new(1, 1) })
	particles(set, sky, { Rate = 80, Lifetime = NumberRange.new(2, 3), Speed = NumberRange.new(10, 14), Size = NumberSequence.new(0.35), Color = ColorSequence.new(Color3.fromRGB(180, 255, 200)), LightEmission = 1, SpreadAngle = Vector2.new(1, 1) })
	-- Störungen: kurzes Flackern von Licht und Farbe
	local nextGlitch = os.clock() + 2
	every(set, function()
		if os.clock() < nextGlitch then return end
		nextGlitch = os.clock() + 1.5 + math.random() * 3.5
		local was, shift = Lighting.Ambient, Lighting.ColorShift_Top
		Lighting.Ambient = Color3.fromRGB(20, 255, 90)
		Lighting.ColorShift_Top = Color3.fromRGB(255, 0, 80)
		task.delay(0.08 + math.random() * 0.1, function()
			Lighting.Ambient = was
			Lighting.ColorShift_Top = shift
		end)
	end)
end

function SETUPS.sternschnuppen(set)
	local sky = holder(set, Vector3.new(200, 1, 200), Vector3.new(0, 70, 0))
	-- Sternschnuppen mit langem Schweif
	particles(set, sky, { Rate = 6, Lifetime = NumberRange.new(1, 1.5), Speed = NumberRange.new(90, 120), Acceleration = Vector3.new(60, 0, 20), Size = NumberSequence.new(0.7, 0), Squash = NumberSequence.new(-6), Color = ColorSequence.new(Color3.fromRGB(255, 246, 224), Color3.fromRGB(180, 140, 255)), LightEmission = 1, SpreadAngle = Vector2.new(20, 20) })
	-- funkelnder Sternenhimmel
	particles(set, sky, { Rate = 60, Lifetime = NumberRange.new(3, 6), Speed = NumberRange.new(0, 0.5), Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.5, 0.5), NumberSequenceKeypoint.new(1, 0) }), Color = ColorSequence.new(Color3.fromRGB(224, 210, 255)), LightEmission = 1, SpreadAngle = Vector2.new(180, 180) })
	-- Polarlicht: drei leuchtende Bänder, die langsam wehen
	local bands = {}
	for i = 1, 3 do
		bands[i] = skyObject(set, { Name = "Polarlicht", Size = Vector3.new(220, 26, 2), Material = Enum.Material.Neon, Color = ({ Color3.fromRGB(120, 255, 200), Color3.fromRGB(160, 120, 255), Color3.fromRGB(80, 200, 255) })[i], Transparency = 0.82 }, Vector3.new(0, 120 + i * 18, 260 + i * 30), true)
	end
	every(set, function()
		local t = os.clock()
		for k, b in ipairs(bands) do
			b.CFrame = CFrame.new(camPos() + Vector3.new(math.sin(t * 0.2 + k) * 30, 120 + k * 18 + math.sin(t * 0.5 + k) * 6, 260 + k * 30)) * CFrame.Angles(math.rad(-25), math.sin(t * 0.15 + k) * 0.3, math.sin(t * 0.3 + k) * 0.08)
		end
	end)
end

function SETUPS.riesenmond(set)
	-- riesiger, warm leuchtender Mond, tief am Himmel, mit Kratern und Hof
	skyObject(set, { Name = "Riesenmond", Shape = Enum.PartType.Ball, Size = Vector3.new(160, 160, 160), Material = Enum.Material.Neon, Color = Color3.fromRGB(255, 196, 120), Transparency = 0 }, Vector3.new(-80, 150, 460))
	skyObject(set, { Name = "Mondhof", Shape = Enum.PartType.Ball, Size = Vector3.new(230, 230, 230), Material = Enum.Material.Neon, Color = Color3.fromRGB(255, 150, 60), Transparency = 0.88 }, Vector3.new(-80, 150, 466))
	for i, c in ipairs({ { -30, 30, 26 }, { 34, -10, 20 }, { -6, -44, 16 }, { 40, 40, 12 } }) do
		skyObject(set, { Name = "Krater" .. i, Shape = Enum.PartType.Ball, Size = Vector3.new(c[3], c[3], c[3]), Material = Enum.Material.SmoothPlastic, Color = Color3.fromRGB(200, 130, 70), Transparency = 0.2 }, Vector3.new(-80 + c[1], 150 + c[2], 384))
	end
	-- große, langsam schwebende Staubflocken
	local mid = holder(set, Vector3.new(80, 20, 80), Vector3.new(0, 10, 0))
	particles(set, mid, { Rate = 18, Lifetime = NumberRange.new(6, 9), Speed = NumberRange.new(0.3, 1), Size = NumberSequence.new(0.9, 0), Color = ColorSequence.new(Color3.fromRGB(255, 200, 140)), LightEmission = 0.8, SpreadAngle = Vector2.new(180, 180) })
end

-- Nachts spielen diese Wetter
local NIGHT = { disconacht = true, blutmond = true, datensturm = true, sternschnuppen = true, riesenmond = true }

-- Altes Wetter ausklingen lassen: Effekte enden sofort, Partikel und Himmelsobjekte blenden aus
local function retire(set, instant)
	for _, c in ipairs(set.Effects) do c:Disconnect() end
	local start = os.clock() - (instant and FADE_OUT or 0)
	local conn
	conn = RunService.Heartbeat:Connect(function()
		local k = 1 - math.clamp((os.clock() - start) / FADE_OUT, 0, 1)
		for _, r in ipairs(set.Emitters) do r.E.Rate = r.Target * k end
		for _, f in ipairs(set.Fades) do f(k) end
		if k <= 0 then
			conn:Disconnect()
			-- warten, bis die letzten Partikel gelandet sind
			task.delay(4, function()
				for _, c in ipairs(set.Follow) do c:Disconnect() end
				for _, p in ipairs(set.Parts) do p:Destroy() end
			end)
		end
	end)
end

-- Licht und Nebel für ein Wetter (je stärker, desto deutlicher die Stimmung)
local function lightOf(w, instant)
	local strength = w.Intensity or 1
	local sky = w.Sky or base.FogColor
	local bright = w.Light or 1
	local mix = math.clamp(0.3 + strength * 0.5, 0.3, 0.9)
	setLight({
		Ambient = base.Ambient:Lerp(sky, mix),
		OutdoorAmbient = base.OutdoorAmbient:Lerp(sky, mix),
		Brightness = base.Brightness * (1 - (1 - bright) * math.min(1, strength + 0.3)),
		FogColor = sky,
		FogEnd = math.min(base.FogEnd, math.max(550, (bright < 0.7 and 700 or 950) / math.max(0.8, strength))),
		ColorShift_Top = base.ColorShift_Top:Lerp(w.Color, math.min(1, strength)),
		ClockTime = NIGHT[w.Id] and 0 or base.ClockTime,
	}, instant)
end
local function rankOf(w)
	local r = w.Rarity and MutationData.WeatherRarityById[w.Rarity]
	return r and r.Index or 0
end

-- weatherIds: "regen", "regen,riesenmond" oder { "regen", "riesenmond" }; klar oder leer = kein Wetter
-- instant = true: ohne Überblenden (für „Animationen überspringen“ / weniger Bewegung)
function WeatherFx.Apply(weatherIds, instant)
	remember()
	local ids = {}
	if type(weatherIds) == "table" then
		ids = weatherIds
	else
		for id in string.gmatch(weatherIds or "", "[^,]+") do table.insert(ids, id) end
	end
	local want, top = {}, nil
	for _, id in ipairs(ids) do
		local w = MutationData.WeatherById[id]
		if w and id ~= "klar" then
			want[id] = true
			if not top or rankOf(w) > rankOf(top) then top = w end
		end
	end
	-- was nicht mehr läuft, klingt aus
	for id, set in pairs(actives) do
		if not want[id] then
			if set.Ramp then set.Ramp:Disconnect() end
			retire(set, instant)
			actives[id] = nil
		end
	end
	-- Licht: das seltenste laufende Wetter
	if not top then
		if lightFor ~= "klar" then
			setLight(base, instant)
			clouds(0.35, 0.3, Color3.fromRGB(255, 255, 255))
		end
		lightFor = "klar"
	elseif lightFor ~= top.Id then
		lightFor = top.Id
		lightOf(top, instant)
	end
	-- neue Wetter einblenden: Partikel und Himmelsobjekte wachsen über FADE_IN Sekunden
	for _, id in ipairs(ids) do
		if want[id] and not actives[id] then
			local w = MutationData.WeatherById[id]
			local set = newSet(id, w.Intensity or 1)
			actives[id] = set
			local setup = SETUPS[id]
			if setup then setup(set) end
			if instant then set.Start = os.clock() - FADE_IN end
			set.Ramp = RunService.Heartbeat:Connect(function()
				local k = math.clamp((os.clock() - set.Start) / FADE_IN, 0, 1)
				local eased = k * k * (3 - 2 * k)
				for _, r in ipairs(set.Emitters) do r.E.Rate = r.Target * eased end
				for _, f in ipairs(set.Fades) do f(eased) end
				if k >= 1 then
					set.Ramp:Disconnect()
					set.Ramp = nil
				end
			end)
		end
	end
end

-- ── Ansagen ──
local function rarityOf(w)
	return w.Rarity and MutationData.WeatherRarityById[w.Rarity]
end

local function label(parent, props)
	local l = Instance.new("TextLabel")
	l.BackgroundTransparency = 1
	l.TextScaled = true
	l.Font = Enum.Font.GothamBold
	l.TextColor3 = Color3.fromRGB(239, 232, 219)
	for k, v in pairs(props) do l[k] = v end
	l.Parent = parent
	return l
end

-- Große Ansage oben in der Mitte. Je seltener, desto größer, länger und mit Blitz über den ganzen Schirm.
function WeatherFx.Announce(weatherId, playerGui)
	local w = MutationData.WeatherById[weatherId]
	if not w or not playerGui or weatherId == "klar" then return end
	local r = rarityOf(w)
	local rank = r and r.Index or 1
	local m = MutationData.ForWeather(weatherId)
	local gui = Instance.new("ScreenGui")
	gui.Name = "Wetteransage"
	gui.ResetOnSpawn = false
	gui.IgnoreGuiInset = true
	gui.DisplayOrder = 22
	if rank >= 4 then
		-- Blitz über den ganzen Bildschirm in der Farbe des Wetters
		local flash = Instance.new("Frame")
		flash.Size = UDim2.fromScale(1, 1)
		flash.BackgroundColor3 = w.Color
		flash.BackgroundTransparency = 0.35
		flash.BorderSizePixel = 0
		flash.Parent = gui
		TweenService:Create(flash, TweenInfo.new(1.2), { BackgroundTransparency = 1 }):Play()
	end
	local frame = Instance.new("Frame")
	frame.AnchorPoint = Vector2.new(0.5, 0)
	frame.Position = UDim2.new(0.5, 0, 0.11, 0)
	frame.Size = UDim2.fromOffset(400 + rank * 30, 132 + rank * 8)
	frame.BackgroundColor3 = Color3.fromRGB(18, 15, 24)
	frame.BackgroundTransparency = 0.08
	frame.Parent = gui
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 18)
	corner.Parent = frame
	local stroke = Instance.new("UIStroke")
	stroke.Color = r and r.Color or w.Color
	stroke.Thickness = 2 + rank
	stroke.Parent = frame
	local scale = Instance.new("UIScale")
	scale.Scale = 0.6
	scale.Parent = frame
	TweenService:Create(scale, TweenInfo.new(0.45, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Scale = 1 }):Play()
	if r then
		local pill = Instance.new("Frame")
		pill.AnchorPoint = Vector2.new(0.5, 0.5)
		pill.Position = UDim2.new(0.5, 0, 0, 0)
		pill.Size = UDim2.fromOffset(150 + rank * 6, 28)
		pill.BackgroundColor3 = r.Color
		pill.Parent = frame
		local pc = Instance.new("UICorner")
		pc.CornerRadius = UDim.new(1, 0)
		pc.Parent = pill
		label(pill, { Size = UDim2.new(1, -16, 1, -6), Position = UDim2.fromOffset(8, 3), Text = string.upper(r.Name), TextColor3 = Color3.fromRGB(20, 16, 26), Font = Enum.Font.GothamBlack })
	end
	label(frame, { Size = UDim2.new(1, -24, 0.5, 0), Position = UDim2.new(0, 12, 0.12, 0), Text = w.Name, TextColor3 = w.Color, Font = Enum.Font.GothamBlack })
	local minutes = math.floor((w.Duration or 180) / 60 + 0.5)
	local mult = (tostring(m and m.Multiplier or 1):gsub("%.", ","))
	local chance = (tostring(m and m.Chance or 0):gsub("%.", ","))
	label(frame, { Size = UDim2.new(1, -24, 0.26, 0), Position = UDim2.new(0, 12, 0.64, 0), Font = Enum.Font.Gotham, Text = m and (chance .. " % Chance auf " .. m.Name .. " · Wert ×" .. mult .. " · " .. minutes .. " Minuten") or w.Text })
	if rank >= 5 then
		-- Rahmen pulsiert in der Farbe der Seltenheit
		TweenService:Create(stroke, TweenInfo.new(0.6, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true), { Thickness = 2 + rank * 2 }):Play()
	end
	gui.Parent = playerGui
	task.delay(4 + rank * 0.8, function()
		TweenService:Create(frame, TweenInfo.new(0.4), { BackgroundTransparency = 1 }):Play()
		task.wait(0.4)
		gui:Destroy()
	end)
end

-- Vorwarnung: schmale Leiste oben mit Countdown bis zum Beginn (startsAt = os.time() des Beginns)
local warnGui = nil
function WeatherFx.Warn(weatherId, startsAt, playerGui)
	local w = MutationData.WeatherById[weatherId]
	if not w or not playerGui then return end
	if warnGui then warnGui:Destroy() end
	local r = rarityOf(w)
	local gui = Instance.new("ScreenGui")
	gui.Name = "Wettervorwarnung"
	gui.ResetOnSpawn = false
	gui.DisplayOrder = 21
	warnGui = gui
	-- unten über der Bildschirmmitte, damit die Leisten oben frei bleiben
	local bar = Instance.new("Frame")
	bar.AnchorPoint = Vector2.new(0.5, 1)
	bar.Position = UDim2.new(0.5, 0, 1, -140)
	bar.Size = UDim2.fromOffset(380, 44)
	bar.BackgroundColor3 = Color3.fromRGB(18, 15, 24)
	bar.BackgroundTransparency = 0.1
	bar.Parent = gui
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(1, 0)
	corner.Parent = bar
	local stroke = Instance.new("UIStroke")
	stroke.Color = w.Color
	stroke.Thickness = 2
	stroke.Parent = bar
	local text = label(bar, { Size = UDim2.new(1, -28, 1, -12), Position = UDim2.fromOffset(14, 6), Text = "" })
	gui.Parent = playerGui
	task.spawn(function()
		while gui.Parent do
			local left = startsAt - os.time()
			if left <= 0 then break end
			text.Text = ("⚠ %s zieht auf%s · %d:%02d"):format(w.Name, r and (" (" .. r.Name .. ")") or "", math.floor(left / 60), left % 60)
			stroke.Transparency = (left % 2 == 0) and 0 or 0.5
			task.wait(0.5)
		end
		if warnGui == gui then warnGui = nil end
		gui:Destroy()
	end)
end

return WeatherFx
`;

// Server: setzt das Wetter als Attribut an ReplicatedStorage (alle Server gleich, aus der Uhrzeit)
const WEATHER_SERVER = `-- Coinmaster Adventure · Wetter (Server)
-- Setzt das Wetter nach dem Zeitplan aus Gacha.WeatherAt. Clients lesen an ReplicatedStorage:
-- Weather, WeatherEnds (Ende), WeatherNext und WeatherNextAt (nächstes Wetter und sein Beginn, für die Vorwarnung).
-- Weather2, Weather2Ends: Nebenwetter, das gleichzeitig laufen kann ("" = keins).
-- Ein Admin kann ein Wetter erzwingen (AdminWeather, AdminWeatherEnds; Admin Panel), danach geht der Zeitplan weiter.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local root = ReplicatedStorage:WaitForChild("CoinmasterAdventure")
local Gacha = require(root:WaitForChild("Gacha"))

local function state(now)
	local fw, fe = Gacha.Forced(now)
	if fw then
		-- nach dem erzwungenen Wetter: was der Zeitplan dann hat
		local w = Gacha.WeatherAt(fe)
		local nw, ns = w, fe
		if w.Id == "klar" then nw, ns = Gacha.NextWeather(fe) end
		return fw.Id, fe, nw, ns
	end
	local w, _, ends = Gacha.WeatherAt(now)
	local nw, ns = Gacha.NextWeather(now)
	return w.Id, ends, nw, ns
end

-- jede Sekunde prüfen (Attribute ändern sich nur, wenn der Wert neu ist)
-- Nebenwetter: Weather2 und Weather2Ends ("" = keins), läuft gleichzeitig mit dem Hauptwetter
while true do
	local now = os.time()
	local id, ends, nw, ns = state(now)
	local side, _, sideEnds = Gacha.SideWeatherAt(now)
	if side and side.Id == id then side = nil end
	ReplicatedStorage:SetAttribute("WeatherNext", nw and nw.Id or "")
	ReplicatedStorage:SetAttribute("WeatherNextAt", ns or 0)
	ReplicatedStorage:SetAttribute("WeatherEnds", ends)
	ReplicatedStorage:SetAttribute("Weather2Ends", side and sideEnds or 0)
	ReplicatedStorage:SetAttribute("Weather2", side and side.Id or "")
	ReplicatedStorage:SetAttribute("Weather", id)
	task.wait(1)
end
`;

// Client: wendet das Wetter an, warnt eine Minute vorher und zeigt die Ansage
const WEATHER_CLIENT = `-- Coinmaster Adventure · Wetter (Client)
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local root = ReplicatedStorage:WaitForChild("CoinmasterAdventure")
local WeatherFx = require(root:WaitForChild("WeatherFx"))
local MutationData = require(root:WaitForChild("MutationData"))
local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui")

-- Haupt- und Nebenwetter zusammen anwenden; neu beginnende Wetter bekommen ihre Ansage
local last, lastSide = nil, nil
local function update()
	local id = ReplicatedStorage:GetAttribute("Weather")
	local side = ReplicatedStorage:GetAttribute("Weather2") or ""
	if not id or (id == last and side == lastSide) then
		return
	end
	WeatherFx.Apply(side ~= "" and (id .. "," .. side) or id)
	if last and id ~= last then WeatherFx.Announce(id, playerGui) end
	if lastSide ~= nil and side ~= "" and side ~= lastSide then WeatherFx.Announce(side, playerGui) end
	last, lastSide = id, side
end
ReplicatedStorage:GetAttributeChangedSignal("Weather"):Connect(update)
ReplicatedStorage:GetAttributeChangedSignal("Weather2"):Connect(update)
update()

-- Vorwarnung: WeatherWarn Sekunden vor dem nächsten Wetter
local warned = nil
while true do
	local nextId = ReplicatedStorage:GetAttribute("WeatherNext")
	local at = ReplicatedStorage:GetAttribute("WeatherNextAt") or 0
	local left = at - os.time()
	if nextId and nextId ~= "" and left > 0 and left <= MutationData.WeatherWarn and warned ~= at then
		warned = at
		WeatherFx.Warn(nextId, at, playerGui)
	end
	task.wait(0.5)
end
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

-- Himmelsbild (Ordner „Himmelsbild“ mit den Bild-IDs Seite, Oben, Unten): eigenes Sky-Objekt, die
-- Himmelskuppeln der Welten werden auf diesem Gerät ausgeblendet. Eigene Skies der Place werden solange
-- beiseitegelegt und danach zurückgegeben.
local stash = {}
local function setSky(box, on)
	local sky = Lighting:FindFirstChild("CoinmasterSky")
	if on then
		for _, s in ipairs(Lighting:GetChildren()) do
			if s:IsA("Sky") and s.Name ~= "CoinmasterSky" then
				table.insert(stash, s)
				s.Parent = nil
			end
		end
		if not sky then
			sky = Instance.new("Sky")
			sky.Name = "CoinmasterSky"
			sky.Parent = Lighting
		end
		local function asset(name)
			local v = box:FindFirstChild(name)
			if v and v.Value > 0 then
				return "rbxassetid://" .. tostring(v.Value)
			end
			return nil
		end
		local side = asset("Seite")
		sky.SkyboxBk, sky.SkyboxFt, sky.SkyboxLf, sky.SkyboxRt = side, side, side, side
		sky.SkyboxUp = asset("Oben") or side
		sky.SkyboxDn = asset("Unten") or side
		local sun = box:FindFirstChild("Sonne")
		sky.CelestialBodiesShown = sun == nil or sun.Value
		sky.StarCount = 0
	else
		if sky then
			sky:Destroy()
		end
		for _, s in ipairs(stash) do
			s.Parent = Lighting
		end
		stash = {}
	end
	for _, f in ipairs(folders) do
		local himmel = f.Parent and f.Parent:FindFirstChild("Himmel")
		if himmel then
			for _, p in ipairs(himmel:GetChildren()) do
				if p.Name == "Himmelskuppel" and p:IsA("BasePart") then
					p.LocalTransparencyModifier = on and 1 or 0
				end
			end
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
	local box = folder:FindFirstChild("Himmelsbild")
	local seite = box and box:FindFirstChild("Seite")
	setSky(box, seite ~= nil and seite.Value > 0)
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
    { name: 'GemData', source: gemDataSource(data) },
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
      ? [{ name: 'ShopData', source: shopDataSource(data) }, { name: 'SkillData', source: skillDataSource(data) }, { name: 'RewardData', source: rewardDataSource(data) }, { name: 'AdminData', source: adminDataSource({ ADMIN: data.ADMIN ?? ADMIN }) }, { name: 'UITheme', source: UI_THEME }, { name: 'GameUI', source: GAME_UI }]
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
--   ServerScriptService > CoinmasterWeather   setzt das Wetter (aus der Uhrzeit, Blöcke von ${(data.WEATHER_BLOCK ?? 900) / 60} Minuten)
--   StarterPlayerScripts > CoinmasterWeatherClient   Wettereffekte und Ansage beim Wechsel
--   StarterPlayerScripts > CoinmasterWorldLighting   Licht und Himmel der Welt, in der man gerade ist
--   StarterPlayerScripts > CoinmasterWorldFx   Umgebung der Welt: Himmel, Fernkulisse, Partikel und Leben (WorldFx)
--   StarterPlayerScripts > CoinmasterJuice     Spielgefühl: Staub beim Springen und Landen, Kamera federt, Teleport-Blitz
--   ServerScriptService > CoinmasterModelle   setzt die Modelle (bibliothek.glb) in die Welten ein
--   StarterPlayerScripts > CoinmasterUI       Spiel-Oberfläche (HUD, Menü und alle Fenster) aus GameUI
--   ServerScriptService > CoinmasterShop      Käufe, Verkauf, Welten, Portale, Wiedergeburt (ShopRemote)
--   ServerScriptService > CoinmasterPlayer    Skills, Belohnungen, Codes, Einstellungen, Ranglisten (PlayerRemote)
--   ServerScriptService > CoinmasterAdmin     Admin Panel (AdminRemote): Wetter, Uhrzeit, Spieler, Banns, Events
--     Admins: Besitzer des Spiels, ADMIN_IDS oben im Skript, IntValues in ServerStorage > CoinmasterAdmins
--   ServerScriptService > CoinmasterData      lädt und speichert den Spielstand (Modul CoinmasterServer > PlayerData)
--     Zum Speichern in Studio: Game Settings > Security > „Enable Studio Access to API Services“${data.AURAS ? `
--   Haustiere: PetData mit allen Pets; bis Modelle im Ordner „Haustiere“ liegen, zeigen PetBuilder und
--   HatchFx (Schlüpf-Animation) eine leuchtende Kugel in der Farbe der Seltenheit.
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
addScript("LocalScript", game:GetService("StarterPlayer"):WaitForChild("StarterPlayerScripts"), "CoinmasterJuice", ${longString(JUICE_CLIENT)})
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
addScript("Script", game:GetService("ServerScriptService"), "CoinmasterAdmin", ${longString(adminServerSource({ ADMIN_IDS: data.ADMIN_IDS ?? ADMIN_IDS }))})
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
