// Auras für Roblox Studio: AuraData (Daten), AuraFx (Effekte am Spieler), ein Server-Skript für
// Kaufen und Anlegen und ein Client-Skript, das die Auras aller Spieler zeichnet.
// Reiner Text wie luau.js, damit es auch in Node prüfbar ist.

const str = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
const num = (n) => String(Math.round(n * 1000) / 1000);
const color = (hex) => `Color3.fromHex(${str(hex)})`;

const HEADER = (title) => `-- Coinmaster Adventure · ${title}
-- Automatisch erzeugt von der Coinmaster-Webseite. Änderungen besser dort machen
-- und neu übertragen, sonst gehen sie beim nächsten Import verloren.
`;

// look aus auras.js als Luau-Tabelle
function lookTable(look) {
  const out = [`Colors = { ${look.cols.map(color).join(', ')} }`, `Texture = ${str(look.tex || 'dot')}`];
  if (look.rise) out.push(`Rise = { Count = ${num(look.rise.n)}, Speed = ${num(look.rise.speed)} }`);
  if (look.fall) out.push(`Fall = { Count = ${num(look.fall.n)} }`);
  if (look.swirl) out.push(`Swirl = { Count = ${num(look.swirl.n)}, Low = ${look.swirl.low ? 'true' : 'false'} }`);
  if (look.orbit) out.push(`Orbit = { Kind = ${str(look.orbit.kind)}, Count = ${num(look.orbit.n)} }`);
  if (look.ring) out.push(`Ring = ${str(look.ring)}`);
  for (const k of ['halo', 'wings', 'crown', 'pillar', 'bolts', 'shell', 'beams', 'glitch', 'burst']) if (look[k]) out.push(`${k[0].toUpperCase() + k.slice(1)} = true`);
  return `{ ${out.join(', ')} }`;
}

export function auraDataSource({ AURAS, RARITIES, THEMES, BONUSES }) {
  const rarities = RARITIES.map((r, i) => `{ Id = ${str(r.id)}, Name = ${str(r.name)}, Color = ${color(r.color)}, Index = ${i + 1} }`);
  const themes = THEMES.map((t) => `{ Id = ${str(t.id)}, Name = ${str(t.name)}, Color = ${color(t.color)} }`);
  const bonuses = Object.entries(BONUSES).map(([id, b]) => `${id} = ${str(b.name)}`);
  const auras = AURAS.map((a) => `{
		Id = ${str(a.id)}, Name = ${str(a.name)}, Theme = ${str(a.theme)}, Rarity = ${str(a.rarity)},
		Price = ${num(a.price)}, Bonus = { Type = ${str(a.bonus.type)}, Value = ${num(a.bonus.value)} },
		Text = ${str(a.text)},
		Look = ${lookTable(a.look)},
	}`);
  return `${HEADER('Auras')}
-- ${AURAS.length} Auras. Man kauft sie mit Talern und legt eine an. Die angelegte Aura gibt einen
-- kleinen Bonus in Prozent: glueck (wie „Glückspilz“), wert (Münzwert), ep (Erfahrung), tempo (Laufen).
-- Look beschreibt die Effekte, AuraFx baut sie daraus.

local AuraData = {}

AuraData.Rarities = {
	${rarities.join(',\n\t')},
}

AuraData.Themes = {
	${themes.join(',\n\t')},
}

AuraData.BonusNames = { ${bonuses.join(', ')} }

-- Eigene Teilchenbilder: Decal-Asset-IDs hier eintragen (z. B. coin = 123456).
-- Leer = Roblox-Standardfunkeln in der Farbe der Aura.
AuraData.Textures = { dot = nil, star = nil, flake = nil, bubble = nil, square = nil, heart = nil, leaf = nil, coin = nil, note = nil, glyph = nil }

AuraData.Auras = {
	${auras.join(',\n\t')},
}

AuraData.ById = {}
for _, aura in ipairs(AuraData.Auras) do
	AuraData.ById[aura.Id] = aura
end
AuraData.RarityById = {}
for _, r in ipairs(AuraData.Rarities) do
	AuraData.RarityById[r.Id] = r
end

-- Bonus der Aura für eine Art („glueck“, „wert“, „ep“, „tempo“) in Prozent, sonst 0
function AuraData.Bonus(auraId, bonusType)
	local aura = auraId and AuraData.ById[auraId]
	if aura and aura.Bonus.Type == bonusType then
		return aura.Bonus.Value
	end
	return 0
end

-- Gekaufte Auras stehen als Text am Spieler („funken,krone“), damit sie ohne Extra-Objekte replizieren
function AuraData.ParseOwned(text)
	local owned = {}
	for id in string.gmatch(text or "", "[^,]+") do
		owned[id] = true
	end
	return owned
end

return AuraData
`;
}

export const AURA_FX = `${HEADER('Aura-Effekte')}
-- AuraFx.Build(aura, parent, options) baut die Aura als Model aus verankerten Teilen.
-- AuraFx.Step(handle, rootCFrame, t) setzt sie jedes Bild an die Figur (rootCFrame = HumanoidRootPart).
-- AuraFx.Destroy(handle) räumt auf. Gebaut wird in Studs, Füße liegen 3 Studs unter dem Root.

local AuraData = require(script.Parent:WaitForChild("AuraData"))

local AuraFx = {}

local SPARKLES = "rbxasset://textures/particles/sparkles_main.dds"
local FIRE = "rbxasset://textures/particles/fire_main.dds"
local SMOKE = "rbxasset://textures/particles/smoke_main.dds"
local FEET = -3

local function texture(name)
	local id = AuraData.Textures[name]
	if id then
		return "rbxassetid://" .. tostring(id)
	end
	if name == "bubble" then
		return SMOKE
	end
	return SPARKLES
end

local function colorSeq(colors)
	if #colors == 1 then
		return ColorSequence.new(colors[1])
	end
	local keys = {}
	for i, c in ipairs(colors) do
		table.insert(keys, ColorSequenceKeypoint.new((i - 1) / (#colors - 1), c))
	end
	return ColorSequence.new(keys)
end

local function newPart(handle, props, offset)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.CanTouch = false
	p.CastShadow = false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = Enum.Material.Neon
	for key, value in pairs(props) do
		p[key] = value
	end
	p.Parent = handle.Model
	table.insert(handle.Parts, p)
	table.insert(handle.Offsets, offset or CFrame.new(0, 0, 0))
	return p
end

-- Unsichtbarer Träger für Teilchen; Größe bestimmt die Fläche, aus der sie kommen
local function carrier(handle, size, offset)
	return newPart(handle, { Name = "Emitter", Size = size, Transparency = 1 }, offset)
end

local function emitter(parent, look, props)
	local e = Instance.new("ParticleEmitter")
	e.LightEmission = 1
	e.LightInfluence = 0
	e.Texture = texture(look.Texture)
	e.Color = colorSeq(look.Colors)
	e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.2, 0.1), NumberSequenceKeypoint.new(1, 1) })
	for key, value in pairs(props) do
		e[key] = value
	end
	e.Parent = parent
	return e
end

local function rate(count, scale)
	return math.min(120, math.max(4, count * (scale or 0.5)))
end

-- Kreisende Dinge
local function orbitPart(handle, kind, color, offset)
	if kind == "coin" then
		return newPart(handle, { Name = "Coin", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.2, 1.1, 1.1), Color = Color3.fromHex("#ffcf4a"), Material = Enum.Material.Metal, Reflectance = 0.3 }, offset)
	elseif kind == "gem" or kind == "diamond" or kind == "crystal" then
		local size = kind == "diamond" and Vector3.new(0.9, 0.9, 0.9) or Vector3.new(0.7, 0.7, 0.7)
		return newPart(handle, { Name = "Gem", Size = size, Color = color, Material = kind == "crystal" and Enum.Material.Neon or Enum.Material.Glass, Transparency = 0.15 }, offset)
	elseif kind == "rock" then
		return newPart(handle, { Name = "Rock", Size = Vector3.new(1, 0.8, 0.9), Color = color, Material = Enum.Material.Slate }, offset)
	elseif kind == "moon" then
		return newPart(handle, { Name = "Moon", Shape = Enum.PartType.Ball, Size = Vector3.new(1.6, 1.6, 1.6), Color = Color3.fromHex("#dfe4ee"), Material = Enum.Material.Slate }, offset)
	elseif kind == "planet" then
		return newPart(handle, { Name = "Planet", Shape = Enum.PartType.Ball, Size = Vector3.new(0.9, 0.9, 0.9), Color = color, Material = Enum.Material.SmoothPlastic }, offset)
	elseif kind == "hole" then
		local p = newPart(handle, { Name = "BlackHole", Shape = Enum.PartType.Ball, Size = Vector3.new(1.8, 1.8, 1.8), Color = Color3.new(0, 0, 0), Material = Enum.Material.SmoothPlastic }, offset)
		newPart(handle, { Name = "Disk", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.1, 4, 4), Color = Color3.fromHex("#ffb060"), Transparency = 0.3 }, offset * CFrame.Angles(0, 0, math.rad(80)))
		return p
	elseif kind == "book" then
		return newPart(handle, { Name = "Book", Size = Vector3.new(0.8, 1, 0.25), Color = color, Material = Enum.Material.SmoothPlastic }, offset)
	elseif kind == "disco" then
		return newPart(handle, { Name = "Disco", Shape = Enum.PartType.Ball, Size = Vector3.new(2, 2, 2), Color = Color3.fromHex("#d8dce8"), Material = Enum.Material.Foil, Reflectance = 0.6 }, offset)
	elseif kind == "cat" then
		return newPart(handle, { Name = "Cat", Size = Vector3.new(0.5, 0.5, 0.9), Color = color, Material = Enum.Material.SmoothPlastic }, offset)
	end
	-- orb, star, cube
	local shape = kind == "cube" and Enum.PartType.Block or Enum.PartType.Ball
	return newPart(handle, { Name = "Orb", Shape = shape, Size = Vector3.new(0.6, 0.6, 0.6), Color = color }, offset)
end

function AuraFx.Build(aura, parent, options)
	options = options or {}
	local look = aura.Look
	local colors = look.Colors
	local function col(i)
		return colors[((i - 1) % #colors) + 1]
	end
	local handle = { Aura = aura, Parts = {}, Offsets = {}, Movers = {}, Beams = {}, Bursts = {}, Glitch = nil, Model = Instance.new("Model") }
	handle.Model.Name = "Aura_" .. aura.Id

	-- Kern mit Licht
	local core = newPart(handle, { Name = "Core", Size = Vector3.new(0.2, 0.2, 0.2), Transparency = 1 }, CFrame.new(0, 0, 0))
	local light = Instance.new("PointLight")
	light.Color = colors[1]
	light.Brightness = 1 + AuraData.RarityById[aura.Rarity].Index * 0.3
	light.Range = 8 + AuraData.RarityById[aura.Rarity].Index
	light.Parent = core

	if look.Rise then
		local e = carrier(handle, Vector3.new(4, 0.2, 4), CFrame.new(0, FEET + 0.2, 0))
		emitter(e, look, {
			Texture = look.Ring == "flame" and FIRE or texture(look.Texture),
			Rate = rate(look.Rise.Count), Lifetime = NumberRange.new(1.2, 2.2),
			Speed = NumberRange.new(2 * look.Rise.Speed, 4 * look.Rise.Speed), EmissionDirection = Enum.NormalId.Top,
			SpreadAngle = Vector2.new(10, 10), Size = NumberSequence.new(0.5, 0.1),
		})
	end
	if look.Fall then
		local e = carrier(handle, Vector3.new(6, 0.2, 6), CFrame.new(0, 6, 0))
		emitter(e, look, {
			Rate = rate(look.Fall.Count), Lifetime = NumberRange.new(1.4, 2), Speed = NumberRange.new(3, 5),
			EmissionDirection = Enum.NormalId.Bottom, Size = NumberSequence.new(0.35), RotSpeed = NumberRange.new(-90, 90),
		})
	end
	if look.Swirl then
		local h = look.Swirl.Low and 2.5 or 6.5
		local e = carrier(handle, Vector3.new(4, h, 4), CFrame.new(0, FEET + h / 2, 0))
		emitter(e, look, {
			Shape = Enum.ParticleEmitterShape.Cylinder, ShapeStyle = Enum.ParticleEmitterShapeStyle.Surface,
			Rate = rate(look.Swirl.Count, 0.4), Lifetime = NumberRange.new(1, 1.8), Speed = NumberRange.new(0.5, 1.5),
			Acceleration = Vector3.new(0, 2, 0), Size = NumberSequence.new(0.3, 0), Drag = 1,
		})
		table.insert(handle.Movers, function(t)
			return e, CFrame.new(0, FEET + h / 2, 0) * CFrame.Angles(0, t * 2, 0)
		end)
	end
	if look.Burst then
		local e = carrier(handle, Vector3.new(0.2, 0.2, 0.2), CFrame.new(0, 6, 0))
		local fx = emitter(e, look, {
			Texture = SPARKLES, Rate = options.Static and 30 or 0, Lifetime = NumberRange.new(0.8, 1.3),
			Speed = NumberRange.new(8, 11), SpreadAngle = Vector2.new(180, 180), Acceleration = Vector3.new(0, -8, 0),
			Size = NumberSequence.new(0.4, 0), Drag = 2,
		})
		table.insert(handle.Bursts, fx)
	end
	if look.Orbit then
		local kind, n = look.Orbit.Kind, look.Orbit.Count
		local single = n == 1 and (kind == "hole" or kind == "disco" or kind == "moon")
		for i = 1, n do
			local p = orbitPart(handle, kind, col(i), CFrame.new(0, 0, 0))
			local index = #handle.Parts
			local phase = (i - 1) / n * math.pi * 2
			local radius = kind == "cat" and 3 or (single and 3.5 or 2.6)
			local y = kind == "cat" and FEET + 0.5 or (single and 2.5 or 0.5)
			if single and kind ~= "moon" then
				handle.Offsets[index] = CFrame.new(0, 5, 0)
			else
				table.insert(handle.Movers, function(t)
					local a = phase + t * (kind == "rock" and 0.5 or 0.9)
					local spin = kind == "cat" and -a or t * 1.5
					return p, CFrame.new(math.cos(a) * radius, y + math.sin(a * 2 + phase) * 0.4, math.sin(a) * radius) * CFrame.Angles(0, spin, 0)
				end)
			end
		end
	end
	if look.Ring then
		local ring = newPart(handle, { Name = "Ring", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.1, 6.5, 6.5), Color = colors[1], Transparency = 0.55 }, CFrame.new(0, FEET + 0.05, 0) * CFrame.Angles(0, 0, math.rad(90)))
		if look.Ring == "rune" or look.Ring == "hex" then
			local inner = newPart(handle, { Name = "Inner", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.12, 4, 4), Color = col(2), Transparency = 0.5 }, CFrame.new(0, FEET + 0.06, 0) * CFrame.Angles(0, 0, math.rad(90)))
			local e = carrier(handle, Vector3.new(5, 0.1, 5), CFrame.new(0, FEET + 0.1, 0))
			emitter(e, look, { Texture = texture("glyph"), Rate = 10, Lifetime = NumberRange.new(1, 1.6), Speed = NumberRange.new(0.5, 1), EmissionDirection = Enum.NormalId.Top, Size = NumberSequence.new(0.4, 0) })
		elseif look.Ring == "flame" then
			local e = carrier(handle, Vector3.new(5, 0.2, 5), CFrame.new(0, FEET + 0.2, 0))
			emitter(e, look, {
				Texture = FIRE, Shape = Enum.ParticleEmitterShape.Cylinder, ShapeStyle = Enum.ParticleEmitterShapeStyle.Surface,
				Rate = 40, Lifetime = NumberRange.new(0.5, 0.9), Speed = NumberRange.new(2, 3), EmissionDirection = Enum.NormalId.Top, Size = NumberSequence.new(0.9, 0.2),
			})
		end
	end
	if look.Halo then
		for i = 1, 12 do
			local a = (i - 1) / 12 * math.pi * 2
			newPart(handle, { Name = "Halo", Shape = Enum.PartType.Ball, Size = Vector3.new(0.3, 0.3, 0.3), Color = Color3.fromHex("#fff2b0") }, CFrame.new(math.cos(a) * 0.9, 3.2, math.sin(a) * 0.9))
		end
	end
	if look.Crown then
		local y = look.Halo and 3.6 or 3.1
		for i = 1, 6 do
			local a = (i - 1) / 6 * math.pi * 2
			local spike = newPart(handle, { Name = "Crown", Size = Vector3.new(0.3, 0.6, 0.3), Color = Color3.fromHex("#ffcf4a"), Material = Enum.Material.Metal, Reflectance = 0.3 }, CFrame.new(0, 0, 0))
			table.insert(handle.Movers, function(t)
				return spike, CFrame.new(math.cos(a + t * 0.6) * 0.7, y + math.sin(t * 1.6) * 0.15, math.sin(a + t * 0.6) * 0.7)
			end)
		end
	end
	if look.Wings then
		for _, side in ipairs({ -1, 1 }) do
			local wing = newPart(handle, { Name = "Wing", Shape = Enum.PartType.Block, Size = Vector3.new(3.4, 2.4, 0.1), Color = colors[1], Transparency = 0.35 }, CFrame.new(0, 0, 0))
			table.insert(handle.Movers, function(t)
				local flap = side * (0.35 + math.sin(t * 2.4) * 0.25)
				return wing, CFrame.new(0, 1.4, 0.7) * CFrame.Angles(0, flap, side * 0.35) * CFrame.new(side * 1.8, 0.4, 0)
			end)
		end
	end
	if look.Pillar then
		newPart(handle, { Name = "Pillar", Shape = Enum.PartType.Cylinder, Size = Vector3.new(14, 4.6, 4.6), Color = colors[1], Material = Enum.Material.ForceField, Transparency = 0.2 }, CFrame.new(0, FEET + 7, 0) * CFrame.Angles(0, 0, math.rad(90)))
	end
	if look.Shell then
		local shell = newPart(handle, { Name = "Shell", Size = Vector3.new(5, 7, 5), Color = colors[1], Material = Enum.Material.ForceField, Transparency = 0.1 }, CFrame.new(0, 0, 0))
		local mesh = Instance.new("SpecialMesh")
		mesh.MeshType = Enum.MeshType.Sphere
		mesh.Parent = shell
	end
	-- Lichtbänder und Blitze sind Beams zwischen zwei Attachments am Kern
	local function beam(c, width, segments)
		local a0 = Instance.new("Attachment")
		a0.Parent = core
		local a1 = Instance.new("Attachment")
		a1.Parent = core
		local b = Instance.new("Beam")
		b.Attachment0 = a0
		b.Attachment1 = a1
		b.Color = ColorSequence.new(c)
		b.LightEmission = 1
		b.LightInfluence = 0
		b.FaceCamera = true
		b.Width0 = width
		b.Width1 = width
		b.Segments = segments
		b.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.3, 0.3), NumberSequenceKeypoint.new(1, 1) })
		b.Parent = core
		return { Beam = b, A0 = a0, A1 = a1 }
	end
	if look.Beams then
		local n = math.min(#colors * 2, 8)
		for i = 1, n do
			local b = beam(col(i), 1.2, 4)
			local a = (i - 1) / n * math.pi * 2
			b.Update = function(t)
				local r = a + t * 0.35
				b.A0.Position = Vector3.new(math.cos(r) * 2.6, FEET + 0.5, math.sin(r) * 2.6)
				b.A1.Position = Vector3.new(math.cos(r) * 2.6, FEET + 8 + math.sin(t + i) * 0.5, math.sin(r) * 2.6)
			end
			table.insert(handle.Beams, b)
		end
	end
	if look.Bolts then
		for i = 1, 3 do
			local b = beam(col(i), 0.15, 10)
			b.Beam.Transparency = NumberSequence.new(0)
			b.Beam.CurveSize0 = 0
			b.Beam.CurveSize1 = 0
			local rng = Random.new(i * 97)
			b.Update = function(t)
				if t - (b.Last or -1) < 0.08 then
					return
				end
				b.Last = t
				local a = rng:NextNumber(0, math.pi * 2)
				b.A0.Position = Vector3.new(math.cos(a) * 1.6, rng:NextNumber(-2, 2), math.sin(a) * 1.6)
				b.A1.Position = Vector3.new(math.cos(a + 1.5) * 2.4, rng:NextNumber(-1, 3), math.sin(a + 1.5) * 2.4)
				b.Beam.CurveSize0 = rng:NextNumber(-2, 2)
				b.Beam.CurveSize1 = rng:NextNumber(-2, 2)
			end
			table.insert(handle.Beams, b)
		end
	end
	if look.Glitch and options.Character then
		local h = Instance.new("Highlight")
		h.FillColor = colors[1]
		h.OutlineColor = colors[2] or colors[1]
		h.FillTransparency = 0.6
		h.Enabled = false
		h.Adornee = options.Character
		h.Parent = handle.Model
		handle.Glitch = { Highlight = h, Rng = Random.new(7) }
	end

	handle.Model.Parent = parent
	if options.Static then
		AuraFx.Step(handle, options.Static, 0.6)
	end
	return handle
end

-- Alle Teile an die Figur setzen und Bewegungen weiterrechnen
function AuraFx.Step(handle, rootCFrame, t)
	for _, mover in ipairs(handle.Movers) do
		local part, offset = mover(t)
		for i, p in ipairs(handle.Parts) do
			if p == part then
				handle.Offsets[i] = offset
				break
			end
		end
	end
	local cframes = {}
	for i, offset in ipairs(handle.Offsets) do
		cframes[i] = rootCFrame * offset
	end
	workspace:BulkMoveTo(handle.Parts, cframes, Enum.BulkMoveMode.FireCFrameChanged)
	for _, b in ipairs(handle.Beams) do
		b.Update(t)
	end
	for _, fx in ipairs(handle.Bursts) do
		if math.floor(t * 0.8) ~= (handle.LastBurst or -1) then
			handle.LastBurst = math.floor(t * 0.8)
			fx:Emit(40)
		end
	end
	if handle.Glitch then
		local g = handle.Glitch
		g.Highlight.Enabled = g.Rng:NextNumber() < 0.3
	end
end

function AuraFx.Destroy(handle)
	handle.Model:Destroy()
end

return AuraFx
`;

// Server: Kaufen und Anlegen über eine RemoteFunction, alles wird hier geprüft
export const AURA_SERVER = `-- Coinmaster Adventure · Auras (Server)
-- Kaufen und Anlegen. Der Client fragt nur, der Server prüft Preis, Besitz und Aura-Id.
-- Taler kommen aus leaderstats.Taler (IntValue oder NumberValue), falls es das gibt.
-- Speichern (DataStore) fehlt noch: Gekauftes geht beim Verlassen verloren.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local root = ReplicatedStorage:WaitForChild("CoinmasterAdventure")
local AuraData = require(root:WaitForChild("AuraData"))

local remote = root:FindFirstChild("AuraRemote")
if not remote then
	remote = Instance.new("RemoteFunction")
	remote.Name = "AuraRemote"
	remote.Parent = root
end

local lastCall = {}

local function talerOf(player)
	local stats = player:FindFirstChild("leaderstats")
	local taler = stats and stats:FindFirstChild("Taler")
	if taler and (taler:IsA("IntValue") or taler:IsA("NumberValue")) then
		return taler
	end
	return nil
end

local function owned(player)
	return AuraData.ParseOwned(player:GetAttribute("OwnedAuras"))
end

local function addOwned(player, id)
	local text = player:GetAttribute("OwnedAuras") or ""
	player:SetAttribute("OwnedAuras", text == "" and id or (text .. "," .. id))
end

local function handle(player, action, id)
	-- höchstens 4 Anfragen pro Sekunde
	local now = os.clock()
	if lastCall[player] and now - lastCall[player] < 0.25 then
		return false, "Zu schnell"
	end
	lastCall[player] = now
	if type(action) ~= "string" then
		return false, "Ungültig"
	end
	if action == "unequip" then
		player:SetAttribute("Aura", nil)
		return true
	end
	if type(id) ~= "string" or #id > 40 then
		return false, "Ungültig"
	end
	local aura = AuraData.ById[id]
	if not aura then
		return false, "Diese Aura gibt es nicht"
	end
	if action == "equip" then
		if not owned(player)[id] then
			return false, "Noch nicht gekauft"
		end
		player:SetAttribute("Aura", id)
		return true
	elseif action == "buy" then
		if owned(player)[id] then
			return false, "Schon gekauft"
		end
		local taler = talerOf(player)
		if not taler then
			return false, "Keine Taler gefunden (leaderstats.Taler fehlt)"
		end
		if taler.Value < aura.Price then
			return false, "Zu wenig Taler"
		end
		taler.Value = taler.Value - aura.Price
		addOwned(player, id)
		player:SetAttribute("Aura", id)
		return true
	end
	return false, "Ungültig"
end

remote.OnServerInvoke = handle

-- Nur in Studio: „/aura krone“ im Chat legt eine Aura zum Testen an, „/aura“ legt sie ab
local function onPlayer(player)
	if not RunService:IsStudio() then
		return
	end
	player.Chatted:Connect(function(message)
		local id = string.match(message, "^/aura%s*(%S*)")
		if id == nil then
			return
		end
		if id == "" then
			player:SetAttribute("Aura", nil)
		elseif AuraData.ById[id] then
			player:SetAttribute("Aura", id)
		end
	end)
end
Players.PlayerAdded:Connect(onPlayer)
for _, player in ipairs(Players:GetPlayers()) do
	onPlayer(player)
end
Players.PlayerRemoving:Connect(function(player)
	lastCall[player] = nil
end)
`;

// Client: zeichnet die Aura jedes Spielers lokal (spart Netzwerk, läuft flüssig)
export const AURA_CLIENT = `-- Coinmaster Adventure · Auras (Client)
-- Zeichnet die Aura jedes Spielers. Welche Aura jemand trägt, steht im Attribut „Aura“ am Spieler.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local root = ReplicatedStorage:WaitForChild("CoinmasterAdventure")
local AuraData = require(root:WaitForChild("AuraData"))
local AuraFx = require(root:WaitForChild("AuraFx"))

local folder = Instance.new("Folder")
folder.Name = "CoinmasterAuras"
folder.Parent = workspace

local active = {}

local function clear(player)
	local entry = active[player]
	if entry then
		AuraFx.Destroy(entry.Handle)
		active[player] = nil
	end
end

local function refresh(player)
	clear(player)
	local aura = AuraData.ById[player:GetAttribute("Aura") or ""]
	local character = player.Character
	local hrp = character and character:FindFirstChild("HumanoidRootPart")
	if aura and hrp then
		active[player] = { Handle = AuraFx.Build(aura, folder, { Character = character }), Root = hrp }
	end
end

local function watch(player)
	player:GetAttributeChangedSignal("Aura"):Connect(function()
		refresh(player)
	end)
	player.CharacterAdded:Connect(function(character)
		character:WaitForChild("HumanoidRootPart")
		refresh(player)
	end)
	refresh(player)
end

Players.PlayerAdded:Connect(watch)
Players.PlayerRemoving:Connect(clear)
for _, player in ipairs(Players:GetPlayers()) do
	watch(player)
end

RunService.RenderStepped:Connect(function()
	local t = os.clock()
	for player, entry in pairs(active) do
		if entry.Root.Parent then
			AuraFx.Step(entry.Handle, entry.Root.CFrame, t)
		else
			clear(player)
		end
	end
end)
`;

// Teil des Installers: 50 Figuren mit ihrer Aura in Workspace > CoinmasterAuraShowcase
export const AURA_SHOWCASE = `
-- Auras: 50 Figuren mit ihrer Aura nebeneinander
local AuraData = require(root.AuraData)
local AuraFx = require(root.AuraFx)
local oldAuras = workspace:FindFirstChild("CoinmasterAuraShowcase")
if oldAuras then
	oldAuras:Destroy()
end
local auraShowcase = Instance.new("Model")
auraShowcase.Name = "CoinmasterAuraShowcase"
local auraFloor = Instance.new("Part")
auraFloor.Name = "Floor"
auraFloor.Anchored = true
auraFloor.Size = Vector3.new(104, 1, 60)
auraFloor.CFrame = CFrame.new(100, -0.5, -5)
auraFloor.Color = Color3.fromRGB(24, 21, 31)
auraFloor.Material = Enum.Material.Slate
auraFloor.Parent = auraShowcase

local function dummy(x, z)
	local model = Instance.new("Model")
	model.Name = "Figur"
	local function block(name, size, y, xo, c)
		local p = Instance.new("Part")
		p.Name = name
		p.Anchored = true
		p.Size = size
		p.CFrame = CFrame.new(x + xo, y, z)
		p.Color = c
		p.TopSurface = Enum.SurfaceType.Smooth
		p.BottomSurface = Enum.SurfaceType.Smooth
		p.Parent = model
		return p
	end
	local skin, shirt, pants = Color3.fromHex("#f2c8a0"), Color3.fromHex("#3d4f78"), Color3.fromHex("#2a2f40")
	block("Left Leg", Vector3.new(1, 2, 1), 1, -0.5, pants)
	block("Right Leg", Vector3.new(1, 2, 1), 1, 0.5, pants)
	local torso = block("Torso", Vector3.new(2, 2, 1), 3, 0, shirt)
	block("Left Arm", Vector3.new(1, 2, 1), 3, -1.5, skin)
	block("Right Arm", Vector3.new(1, 2, 1), 3, 1.5, skin)
	block("Head", Vector3.new(2, 1, 1), 4.5, 0, skin)
	model.PrimaryPart = torso
	return model
end

for i, aura in ipairs(AuraData.Auras) do
	local col = (i - 1) % 10
	local row = math.floor((i - 1) / 10)
	local x, z = 55 + col * 10, 15 - row * 10
	local figure = dummy(x, z)
	figure.Name = aura.Name
	nameTag(figure, aura.Name, AuraData.RarityById[aura.Rarity].Color)
	figure.Parent = auraShowcase
	AuraFx.Build(aura, figure, { Static = CFrame.new(x, 3, z) })
end
auraShowcase.Parent = workspace
`;
