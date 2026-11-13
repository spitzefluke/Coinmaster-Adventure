// Mutations-Effekte, zweite Fassung (aus Claude Design „Mutationseffekte“, muenzen/js/mutations-v2.js)
// als Roblox-Modul MutationFx: alles aus Parts, Beams, ParticleEmittern, Lichtern und SurfaceGuis auf den
// Münzseiten. Reiner Text wie luau.js, damit es auch in Node prüfbar ist.

const HEADER = (title) => `-- Coinmaster Adventure · ${title}
-- Automatisch erzeugt von der Coinmaster-Webseite. Änderungen besser dort machen
-- und neu übertragen, sonst gehen sie beim nächsten Import verloren.
`;

export const MUTATION_FX = `${HEADER('Mutations-Effekte')}
-- MutationFx.Apply(model, mutationId) hängt die Effekte einer Mutation an eine Münze aus CoinBuilder.
-- Mehrere Mutationen mit Komma ("big,nass"): alle Effekte übereinander; GIGANT (big) vergrößert danach die
-- ganze Münze samt Effekten auf das 3,5-Fache (Scale aus MutationData), Animationen rechnen mit.
-- (Münze steht hochkant, Vorder- und Rückseite zeigen entlang X, Radius 2 Studs).
-- Was fest an der Münze sitzt (Prägungs-Muster, Hörner, Eiszapfen, Spiegelkacheln) dreht sich mit ihr;
-- Regen, Boden, Funken und Flammen bleiben aufrecht. Animationen laufen, solange die Münze im Spiel ist.
--   Nass: dunkler Wasserfilm, Tropfen rinnen, Regen prallt ab, Pfütze mit Ringen
--   Gestein: Risse, Brocken (unten dichter), Beben mit Staub, schwebende Kiesel
--   Gefroren: Eisblumen, Eiszapfen tropfen, Kristalle, Nebel, Schneeflocken, Funkeln
--   Disco: Spiegelkacheln im Takt, Discokugel mit Lichtkegeln, leuchtende Tanzfläche
--   Elektrisch: Blitze mit Kern und Schein, Einschläge mit Funken, kriechende Ladungen
--   Dämonisch: Lavarisse im Herzschlag, Hörner, Flammen und Rauch, Beschwörungskreis
--   Augenkrebs: Op-Art dreht sich, Neon-Formen mit Kontur, Strahlenkranz, weiche Farbwechsel
--   Hacked: Code-Spalten, Scanlinien, Glitch mit Farbversatz, Fehlermeldungen, Pixelzerfall
--   Golden: massives Gold, Glanzstreifen, Funkeln, Strahlenkranz, Goldtropfen, Münzregen
--   Kosmisch: Sternenmetall mit Spiralgalaxie, Sternbild, Sternenstaub-Scheibe, Planeten, Sternschnuppen

local RunService = game:GetService("RunService")
local MutationData = require(script.Parent.MutationData)

local MutationFx = {}

local TAU = math.pi * 2
local S = 2 -- Münzradius in Studs
local FACE = 0.24 -- Abstand der Prägung von der Mitte
local FLOOR = -3.1 -- Boden unter der Münze
local V = Vector3.new
local UP = CFrame.Angles(0, 0, math.pi / 2)
local WHITE = Color3.new(1, 1, 1)
local function hex(s) return Color3.fromHex(s) end
local function rand(a, b) return a + math.random() * (b - a) end

-- ── Bausteine ──
local function newPart(parent, shape, size, cf, color, material, transparency, name)
	local p = Instance.new(shape == "Wedge" and "WedgePart" or "Part")
	p.Name = name or "Effekt"
	p.Anchored = true
	p.CanCollide = false
	p.CastShadow = false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Color = color
	p.Material = Enum.Material[material or "SmoothPlastic"]
	p.Transparency = transparency or 0
	if shape == "Cyl" then
		p.Shape = Enum.PartType.Cylinder
		p.Size = V(size.Y, size.X, size.Z)
		p.CFrame = cf * UP
	else
		p.Size = size
		p.CFrame = cf
		if shape == "Ball" then
			local m = Instance.new("SpecialMesh")
			m.MeshType = Enum.MeshType.Sphere
			m.Parent = p
		end
	end
	p:SetAttribute("Fx", true)
	p.Parent = parent
	return p
end

local function emitter(parent, props)
	local e = Instance.new("ParticleEmitter")
	e.LightEmission = 1
	e.Texture = "rbxasset://textures/particles/sparkles_main.dds"
	e.Rate = 0
	for k, v in pairs(props) do e[k] = v end
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
local function seq(...)
	local list, args = {}, { ... }
	for i = 1, #args, 2 do table.insert(list, NumberSequenceKeypoint.new(args[i], args[i + 1])) end
	return NumberSequence.new(list)
end

-- Kontext je Münze: lokale Punkte (x quer, y hoch, z = Seite der Prägung) wie in der Web-Fassung, mal 2
local function rig(model, body)
	local k = { Model = model, Body = body, Updates = {} }
	-- an der Münze (dreht sich mit)
	-- Maßstab der Münze (GIGANT setzt das Attribut FxScale), damit Animationen mitwachsen
	local function sc() return model:GetAttribute("FxScale") or 1 end
	function k.spin(x, y, z) local s = S * sc() return body.CFrame * CFrame.new((z or 0) * s, y * s, x * s) end
	-- aufrecht um die Münzmitte (Regen, Boden, Flammen)
	function k.fix(x, y, z) local s = S * sc() return CFrame.new(body.Position + V(x * s, y * s, (z or 0) * s)) end
	function k.on(fn) table.insert(k.Updates, fn) end
	-- unsichtbarer Halter für Partikel an einer festen Stelle
	function k.holder(cf, size)
		return newPart(model, "Block", size or V(0.2, 0.2, 0.2), cf, WHITE, "SmoothPlastic", 1, "Quelle")
	end
	return k
end

-- alle Teile der Münze (ohne Effekte) umfärben
local function recolor(model, fn)
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") and not p:GetAttribute("Fx") and p.Transparency < 1 then fn(p) end
	end
end

-- Muster auf beiden Prägungen: dünne Platte mit SurfaceGui, Kreis mit Radius r (Web-Einheiten)
local function faceGui(k, r)
	local guis = {}
	for _, side in ipairs({ 1, -1 }) do
		local plate = newPart(k.Model, "Block", V(0.02, r * 2 * S, r * 2 * S), k.spin(0, 0, side * (FACE + 0.02) / S), WHITE, "SmoothPlastic", 1, "Muster")
		local gui = Instance.new("SurfaceGui")
		gui.Face = side > 0 and Enum.NormalId.Right or Enum.NormalId.Left
		gui.LightInfluence = 0
		gui.Parent = plate
		table.insert(guis, { Gui = gui, Plate = plate, Side = side })
	end
	return guis
end
local function frame(parent, props)
	local f = Instance.new("Frame")
	f.BorderSizePixel = 0
	f.BackgroundColor3 = WHITE
	for key, v in pairs(props) do f[key] = v end
	f.Parent = parent
	return f
end
local function round(f) local c = Instance.new("UICorner") c.CornerRadius = UDim.new(0.5, 0) c.Parent = f return f end
local function grad(f, rotation, transparency, color)
	local g = Instance.new("UIGradient")
	g.Rotation = rotation or 0
	if transparency then g.Transparency = transparency end
	if color then g.Color = color end
	g.Parent = f
	return g
end

-- Platten der Münzseiten an die Münze binden (sie drehen sich mit)
local function follow(k, list)
	local items = {}
	for _, e in ipairs(list) do table.insert(items, { P = e.Plate or e, O = k.Body.CFrame:ToObjectSpace((e.Plate or e).CFrame) }) end
	k.on(function()
		for _, it in ipairs(items) do it.P.CFrame = k.Body.CFrame * it.O end
	end)
end
-- weitere Teile an die Münze binden
local function attach(k, parts)
	local items = {}
	for _, p in ipairs(parts) do table.insert(items, { P = p, O = k.Body.CFrame:ToObjectSpace(p.CFrame) }) end
	k.on(function()
		for _, it in ipairs(items) do it.P.CFrame = k.Body.CFrame * it.O end
	end)
	return items
end

-- Tropfen sammeln sich, fallen und werfen am Boden einen Ring
local function dripper(k, sources, color, material, period, size, ringColor)
	local items = {}
	for i, src in ipairs(sources) do
		local d = newPart(k.Model, "Ball", V(1, 1, 1) * size, k.fix(src[1], src[2]), color, material, material == "Glass" and 0.35 or 0, "Tropfen")
		local ring = newPart(k.Model, "Cyl", V(1, 0.02, 1), k.fix(src[1], FLOOR / S), ringColor, "Neon", 1, "Ring")
		table.insert(items, { D = d, R = ring, Src = src, Off = (i - 1) / #sources + rand(0, 0.1), Per = period * rand(0.85, 1.3) })
	end
	k.on(function(t)
		for _, it in ipairs(items) do
			local life = (t / it.Per + it.Off) % 1
			local x, y = it.Src[1], it.Src[2]
			local base = k.Body.Position
			if life < 0.4 then
				local q = life / 0.4
				it.D.Transparency = 0.2
				it.D.Size = V(size * q + 0.01, size * 1.4 * q + 0.01, size * q + 0.01)
				it.D.CFrame = CFrame.new(base + V(0, y * S - size * 0.8 * q, x * S))
			elseif life < 0.62 then
				local q = (life - 0.4) / 0.22
				it.D.Size = V(size * 0.85, size * (1.4 + q * 1.2), size * 0.85)
				it.D.CFrame = CFrame.new(base + V(0, y * S - size - (y * S - FLOOR) * q * q, x * S))
			else
				it.D.Transparency = 1
			end
			local q = life < 0.62 and 1 or (life - 0.62) / 0.38
			local w = 0.1 + q * 1.6
			it.R.Size = V(0.02, w, w)
			it.R.CFrame = CFrame.new(base + V(0, FLOOR + 0.02, x * S)) * UP
			it.R.Transparency = life < 0.62 and 1 or 0.45 + 0.55 * q
		end
	end)
end

-- Münze kurz versetzen (Beben, Glitch), ohne eine äußere Drehung zu stören
local function jiggler(model)
	local last = CFrame.new()
	return function(offset)
		local cur = model:GetPivot()
		model:PivotTo(cur * last:Inverse() * offset)
		last = offset
	end
end

local EFFECTS = {}

-- ── Nass ──
function EFFECTS.nass(k)
	recolor(k.Model, function(p)
		p.Color = (p.Color:Lerp(Color3.new(0, 0, 0), 0.38)):Lerp(hex("#5aa8e0"), 0.1)
		p.Reflectance = math.min(1, p.Reflectance + 0.35)
	end)
	-- Wasserfilm: helle Wellenbänder fließen langsam nach unten
	local faces = faceGui(k, 0.97)
	local bands = {}
	for _, f in ipairs(faces) do
		local circle = round(frame(f.Gui, { Size = UDim2.fromScale(1, 1), BackgroundColor3 = hex("#9fd0f0"), BackgroundTransparency = 0.8 }))
		for i = 0, 3 do
			local b = round(frame(f.Gui, { Size = UDim2.new(0.9, 0, 0.08, 0), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.2 + i * 0.2), BackgroundColor3 = WHITE, BackgroundTransparency = 0.82, Rotation = -6 }))
			grad(b, 0, seq(0, 1, 0.5, 0.2, 1, 1))
			table.insert(bands, { F = b, Y = i * 0.2 })
		end
	end
	follow(k, faces)
	-- Tropfen auf der Prägung, ein paar rinnen ruckweise herunter
	local drops = {}
	for _, side in ipairs({ 1, -1 }) do
		for i = 1, 16 do
			local a, r, s = rand(0, TAU), math.sqrt(math.random()) * 0.88, rand(0.05, 0.14)
			table.insert(drops, newPart(k.Model, "Ball", V(s * 0.45, s * 1.15, s), k.spin(math.cos(a) * r, math.sin(a) * r, side * (FACE / S + 0.01)), hex("#f2fbff"), "Glass", 0.35, "Tropfen"))
		end
	end
	attach(k, drops)
	local runners = {}
	for _, side in ipairs({ 1, -1 }) do
		for i = 1, 3 do
			local x = rand(-0.6, 0.6)
			local p = newPart(k.Model, "Ball", V(0.06, 0.2, 0.14), k.spin(x, 0.6, side * (FACE / S + 0.012)), hex("#f2fbff"), "Glass", 0.25, "Rinnsal")
			table.insert(runners, { P = p, X = x, Side = side, Top = math.sqrt(0.81 - x * x) * 0.85, Bottom = -math.sqrt(0.86 - x * x), Off = math.random(), Sp = rand(0.6, 1.1) })
		end
	end
	local sources = {}
	for i = 1, 4 do local x = rand(-0.55, 0.55) table.insert(sources, { x, -math.sqrt(1.02 - x * x) }) end
	dripper(k, sources, hex("#e8f8ff"), "Glass", 2.2, 0.16, hex("#9fdcff"))
	-- Pfütze, in der sich die Münze spiegelt
	newPart(k.Model, "Cyl", V(4.4, 0.04, 4.4), k.fix(0, FLOOR / S), hex("#2a6a9a"), "Glass", 0.6, "Pfuetze").Reflectance = 0.6
	-- Regen fällt von oben, prallt oben auf die Münze und spritzt
	local sky = k.holder(k.fix(0, 2.6), V(8, 0.2, 5))
	emitter(sky, { Texture = "", Color = ColorSequence.new(hex("#bfe2ff")), LightEmission = 0.4, Size = NumberSequence.new(0.05), Squash = NumberSequence.new(2.5), Lifetime = NumberRange.new(0.35, 0.45), Speed = NumberRange.new(22, 26), EmissionDirection = Enum.NormalId.Bottom, Rate = 50, Transparency = NumberSequence.new(0.2) })
	local top = k.holder(k.fix(0, 1.04), V(0.4, 0.1, 3))
	emitter(top, { Color = ColorSequence.new(hex("#cfefff")), Size = NumberSequence.new(0.12, 0), Lifetime = NumberRange.new(0.3, 0.5), Speed = NumberRange.new(2, 4), SpreadAngle = Vector2.new(60, 60), Acceleration = V(0, -14, 0), Rate = 14 })
	k.on(function(t)
		for _, b in ipairs(bands) do
			local y = (b.Y + t * 0.04) % 1
			b.F.Position = UDim2.fromScale(0.5, 0.1 + y * 0.8)
		end
		for _, r in ipairs(runners) do
			local l = (t * 0.07 * r.Sp + r.Off) % 1
			local q = l - math.sin(l * TAU * 4) / (TAU * 4)
			r.P.CFrame = k.spin(r.X + math.sin(q * 9 + r.Off * 6) * 0.03, r.Top + (r.Bottom - r.Top) * q, r.Side * (FACE / S + 0.012))
			r.P.Transparency = l < 0.97 and 0.25 or 1
		end
	end)
end

-- ── Gestein ──
function EFFECTS.gestein(k)
	recolor(k.Model, function(p)
		p.Color = p.Color:Lerp(hex("#8a7f73"), 0.45)
		p.Reflectance = 0
		if p.Material == Enum.Material.Metal or p.Material == Enum.Material.Foil then p.Material = Enum.Material.Slate end
	end)
	-- Risse durch das Metall
	local faces = faceGui(k, 0.97)
	for _, f in ipairs(faces) do
		local R = Random.new(4)
		for i = 1, 9 do
			local a = R:NextNumber(0, 360)
			local len = R:NextNumber(0.25, 0.5)
			frame(f.Gui, { Size = UDim2.new(len, 0, 0.012, 0), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5 + math.cos(math.rad(a)) * 0.2, 0.5 + math.sin(math.rad(a)) * 0.2), Rotation = a + R:NextNumber(-25, 25), BackgroundColor3 = hex("#1e1610"), BackgroundTransparency = 0.1 })
		end
	end
	follow(k, faces)
	-- Brocken am Rand, unten dichter als oben
	local rocks = {}
	local cols = { hex("#7d7166"), hex("#5a5048"), hex("#968877") }
	for i = 0, 15 do
		local u = i / 16
		local a = -math.pi / 2 + (u - 0.5) * TAU * (0.55 + 0.45 * math.abs(u - 0.5) * 2) + rand(-0.12, 0.12)
		local s = rand(0.2, 0.48) * (math.sin(a) < 0 and 1.15 or 0.8)
		local rr = rand(0.94, 1.04)
		table.insert(rocks, newPart(k.Model, "Block", V(s * rand(0.6, 0.9), s * rand(0.7, 1.1), s), k.spin(math.cos(a) * rr, math.sin(a) * rr, rand(-0.08, 0.08)) * CFrame.Angles(rand(0, 6), rand(0, 6), rand(0, 6)), cols[i % 3 + 1], "Slate", 0, "Brocken"))
	end
	attach(k, rocks)
	-- schwebende Kiesel
	local floaters = {}
	for i = 0, 6 do
		table.insert(floaters, { P = newPart(k.Model, "Block", V(1, 1, 1) * rand(0.1, 0.16), k.fix(0, 0), cols[i % 3 + 1], "Slate", 0, "Kiesel"), A = i / 7 * TAU, R = rand(1.3, 1.55), Y = rand(-0.6, 0.4), Sp = rand(0.15, 0.3) })
	end
	-- Beben: Zittern, Staubwolke, fallende Krümel
	local floor = k.holder(k.fix(0, FLOOR / S + 0.1), V(3, 0.1, 3))
	local puff = emitter(floor, { Texture = "rbxasset://textures/particles/smoke_main.dds", LightEmission = 0, Color = ColorSequence.new(hex("#bba98f")), Size = NumberSequence.new(0.6, 2.2), Transparency = seq(0, 0.5, 1, 1), Lifetime = NumberRange.new(1.2, 1.6), Speed = NumberRange.new(0.5, 1.2), SpreadAngle = Vector2.new(60, 10) })
	local under = k.holder(k.fix(0, -0.95), V(2.4, 0.1, 0.4))
	local crumbs = emitter(under, { Texture = "", LightEmission = 0, Color = ColorSequence.new(hex("#7d7166")), Size = NumberSequence.new(0.12), Lifetime = NumberRange.new(0.6, 0.8), Speed = NumberRange.new(0, 0.5), Acceleration = V(0, -18, 0), RotSpeed = NumberRange.new(-200, 200) })
	emitter(under, { Texture = "rbxasset://textures/particles/smoke_main.dds", LightEmission = 0, Color = ColorSequence.new(hex("#c9b49a")), Size = NumberSequence.new(0.15, 0.3), Transparency = seq(0, 1, 0.5, 0.6, 1, 1), Lifetime = NumberRange.new(2, 3), Speed = NumberRange.new(0.3, 0.6), EmissionDirection = Enum.NormalId.Bottom, Rate = 6 })
	local shake = jiggler(k.Model)
	local nextQuake, quake = 1.2, -9
	k.on(function(t)
		if t > nextQuake then
			quake = t
			nextQuake = t + rand(2.6, 3.8)
			puff:Emit(6)
			crumbs:Emit(4)
		end
		local q = math.max(0, 1 - (t - quake) / 0.55)
		shake(q > 0 and CFrame.new(0, math.cos(t * 53) * 0.04 * q, math.sin(t * 70) * 0.07 * q) * CFrame.Angles(math.sin(t * 61) * 0.025 * q, 0, 0) or CFrame.new())
		for _, f in ipairs(floaters) do
			local a = f.A + t * f.Sp
			f.P.CFrame = k.fix(math.cos(a) * f.R, f.Y + math.sin(t * 1.3 + f.A) * 0.08 + q * 0.06, math.sin(a) * f.R) * CFrame.Angles(t * 0.4 + f.A, t * 0.3, 0)
		end
	end)
end

-- ── Gefroren ──
function EFFECTS.gefroren(k)
	recolor(k.Model, function(p)
		p.Color = p.Color:Lerp(hex("#bfeaff"), 0.4)
		p.Reflectance = math.min(1, p.Reflectance + 0.2)
	end)
	-- Eisblumen wachsen vom Rand: verzweigte helle Linien
	local faces = faceGui(k, 0.97)
	for _, f in ipairs(faces) do
		round(frame(f.Gui, { Size = UDim2.fromScale(1, 1), BackgroundColor3 = hex("#e8f8ff"), BackgroundTransparency = 0.88 }))
		for i = 0, 11 do
			local a = i / 12 * 360 + 8
			local branch = frame(f.Gui, { Size = UDim2.new(0.34, 0, 0.012, 0), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5 + math.cos(math.rad(a)) * 0.33, 0.5 + math.sin(math.rad(a)) * 0.33), Rotation = a, BackgroundColor3 = WHITE, BackgroundTransparency = 0.25 })
			grad(branch, 0, seq(0, 1, 1, 0.1))
			for j = 1, 2 do
				local d = 0.28 + j * 0.06
				for _, s in ipairs({ -1, 1 }) do
					frame(f.Gui, { Size = UDim2.new(0.08, 0, 0.01, 0), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5 + math.cos(math.rad(a)) * d + math.cos(math.rad(a + s * 50)) * 0.03, 0.5 + math.sin(math.rad(a)) * d + math.sin(math.rad(a + s * 50)) * 0.03), Rotation = a + s * 50, BackgroundColor3 = WHITE, BackgroundTransparency = 0.35 })
				end
			end
		end
	end
	follow(k, faces)
	local ice = hex("#d8f6ff")
	local bits, tips = {}, {}
	-- Eiszapfen unten (Spitzen zeigen nach unten), Kristalle oben
	for i = 0, 10 do
		local a = -math.pi / 2 + (i / 10 - 0.5) * 2.3 + rand(-0.05, 0.05)
		local center = 1 - math.abs(a + math.pi / 2) / 1.2
		local len = (0.12 + 0.42 * center) * rand(0.6, 1) * S
		local w = (0.07 + 0.06 * center) * S
		local x, y = math.cos(a) * 0.98, math.sin(a) * 0.98
		local cf = k.spin(x, y - len / S / 2 + 0.02, 0) * CFrame.Angles(math.pi, 0, 0)
		table.insert(bits, newPart(k.Model, "Wedge", V(w, len, w / 2), cf * CFrame.new(0, 0, -w / 4), ice, "Ice", 0.15, "Eiszapfen"))
		table.insert(bits, newPart(k.Model, "Wedge", V(w, len, w / 2), cf * CFrame.new(0, 0, w / 4) * CFrame.Angles(0, math.pi, 0), ice, "Ice", 0.15, "Eiszapfen"))
		if len / S > 0.3 then table.insert(tips, { x, y - len / S + 0.02 }) end
	end
	for i = 0, 11 do
		local a = math.pi / 2 + rand(-1.1, 1.1)
		local h = rand(0.14, 0.36)
		table.insert(bits, newPart(k.Model, "Block", V(h * 0.28 * S, h * S, h * 0.28 * S), k.spin(math.cos(a) * (1 + h * 0.35), math.sin(a) * (1 + h * 0.35), rand(-0.05, 0.05)) * CFrame.Angles(math.pi / 2 - a + rand(-0.35, 0.35), 0, 0) * CFrame.Angles(0, math.pi / 4, 0), ice, "Ice", 0.1, "Kristall"))
	end
	attach(k, bits)
	dripper(k, tips, ice, "Ice", 4.5, 0.1, hex("#cfefff"))
	-- Funkeln an wechselnden Stellen
	local glints = {}
	for i = 1, 5 do
		local a = newPart(k.Model, "Block", V(0.02, 0.5, 0.05), k.fix(0, 0), WHITE, "Neon", 1, "Funkeln")
		local b = newPart(k.Model, "Block", V(0.02, 0.05, 0.5), k.fix(0, 0), WHITE, "Neon", 1, "Funkeln")
		table.insert(glints, { A = a, B = b, Off = math.random(), P = { rand(-0.9, 0.9), rand(-0.9, 1) } })
	end
	-- kalter Nebel am Boden und Schneeflocken
	local floor = k.holder(k.fix(0, FLOOR / S + 0.1), V(8, 0.1, 4))
	emitter(floor, { Texture = "rbxasset://textures/particles/smoke_main.dds", LightEmission = 0.2, Color = ColorSequence.new(hex("#d4f2ff")), Size = NumberSequence.new(1.6, 2.6), Transparency = seq(0, 1, 0.4, 0.85, 1, 1), Lifetime = NumberRange.new(4, 6), Speed = NumberRange.new(0.2, 0.5), SpreadAngle = Vector2.new(80, 5), Rate = 2 })
	local sky = k.holder(k.fix(0, 2), V(7, 0.1, 3))
	emitter(sky, { Color = ColorSequence.new(WHITE), LightEmission = 0.4, Size = NumberSequence.new(0.22), Lifetime = NumberRange.new(4, 6), Speed = NumberRange.new(1, 2), EmissionDirection = Enum.NormalId.Bottom, SpreadAngle = Vector2.new(15, 15), Acceleration = V(0.3, 0, 0), RotSpeed = NumberRange.new(-60, 60), Rate = 8 })
	k.on(function(t)
		for _, g in ipairs(glints) do
			local l = (t * 0.45 + g.Off) % 1
			if l < 0.02 then g.P = { rand(-0.95, 0.95), rand(-1.1, 1.1) } end
			local s = math.max(0, math.sin(math.min(1, l * 3) * math.pi))
			local cf = k.spin(g.P[1], g.P[2], (FACE / S + 0.05)) * CFrame.Angles(t, 0, 0)
			g.A.CFrame, g.B.CFrame = cf, cf
			g.A.Size, g.B.Size = V(0.02, 0.8 * s + 0.01, 0.06 * s + 0.01), V(0.02, 0.06 * s + 0.01, 0.8 * s + 0.01)
			g.A.Transparency, g.B.Transparency = s > 0.05 and 0 or 1, s > 0.05 and 0 or 1
		end
	end)
end

-- ── Disco ──
function EFFECTS.disco(k)
	local palette = { hex("#ff3df2"), hex("#3de8ff"), hex("#ffe23d"), hex("#7a5cff") }
	recolor(k.Model, function(p)
		p.Color = p.Color:Lerp(WHITE, 0.35)
		p.Reflectance = math.min(1, p.Reflectance + 0.45)
	end)
	-- Spiegelkacheln am Rand in zwei Reihen
	local tiles = {}
	local N = 32
	for j = 0, N - 1 do
		for r = 0, 1 do
			local a = (j + r * 0.5) / N * TAU
			local p = newPart(k.Model, "Block", V(0.13, 0.03, 0.11 * S), k.spin(math.cos(a) * 1.045, math.sin(a) * 1.045, r == 0 and -0.032 or 0.032) * CFrame.Angles(math.pi / 2 - a, 0, 0), palette[j % 4 + 1], "Glass", 0, "Spiegelkachel")
			p.Reflectance = 0.5
			table.insert(tiles, { P = p, J = j })
		end
	end
	local plain = {}
	for _, it in ipairs(tiles) do table.insert(plain, it.P) end
	attach(k, plain)
	-- Discokugel an der Schnur, Lichtkegel zum Boden
	local ball = newPart(k.Model, "Ball", V(0.8, 0.8, 0.8), k.fix(0, 1.62), WHITE, "Glass", 0, "Discokugel")
	ball.Reflectance = 0.8
	newPart(k.Model, "Cyl", V(0.02, 2, 0.02), k.fix(0, 2.32), hex("#8f879b"), "SmoothPlastic", 0, "Schnur")
	local a0 = Instance.new("Attachment")
	a0.Parent = ball
	local beams = {}
	for i, c in ipairs(palette) do
		local spot = k.holder(k.fix(0, FLOOR / S), V(0.1, 0.1, 0.1))
		local a1 = Instance.new("Attachment")
		a1.Parent = spot
		local b = Instance.new("Beam")
		b.Attachment0, b.Attachment1 = a0, a1
		b.Color = ColorSequence.new(c)
		b.Width0, b.Width1 = 0.1, 1.6
		b.LightEmission = 1
		b.FaceCamera = true
		b.Transparency = seq(0, 0.5, 1, 0.9)
		b.Parent = ball
		table.insert(beams, { B = b, Spot = spot, Ph = (i - 1) / 4 * TAU })
	end
	-- Tanzfläche 7 × 7
	local floor = {}
	for i = 0, 48 do
		local x, z = i % 7 - 3, math.floor(i / 7) - 3
		table.insert(floor, { P = newPart(k.Model, "Block", V(0.72, 0.04, 0.72), k.fix(x * 0.4, FLOOR / S, z * 0.4), palette[1], "Neon", 0.6, "Tanzflaeche"), X = x, Z = z })
	end
	-- Lichter und Lichtflecken im Raum
	local lights = {}
	for i, c in ipairs(palette) do
		local h = k.holder(k.fix(0, 0))
		table.insert(lights, { H = h, L = light(h, c, 3, 10) })
	end
	local flecks = {}
	for i = 1, 24 do
		local d = V(rand(-1, 1), rand(-1, 1), rand(-1, 1)).Unit * rand(4, 5)
		table.insert(flecks, { P = newPart(k.Model, "Ball", V(0.24, 0.24, 0.24), k.fix(0, 0), palette[i % 4 + 1], "Neon", 0.3, "Lichtfleck"), D = d, Ph = rand(0, 6), C = i % 4 + 1 })
	end
	local beat = -1
	k.on(function(t)
		ball.CFrame = k.fix(0, 1.62) * CFrame.Angles(0, t * 1.1, 0)
		for _, b in ipairs(beams) do
			local a = b.Ph + t * 0.7
			b.Spot.CFrame = k.fix(math.cos(a) * 1.4, FLOOR / S, math.sin(a) * 1.4)
		end
		for i, l in ipairs(lights) do
			local a = t * 1.1 + (i - 1) / 4 * TAU
			l.H.CFrame = k.fix(math.cos(a) * 1.4, math.sin(a * 0.7) * 1.1, 1.4 + math.sin(a) * 0.5)
		end
		local rot = CFrame.Angles(0, t * 0.45, 0)
		for _, f in ipairs(flecks) do
			f.P.CFrame = CFrame.new(k.Body.Position + rot:VectorToWorldSpace(f.D))
			f.P.Transparency = 0.65 - 0.6 * (0.5 + 0.5 * math.sin(t * 2.2 + f.Ph)) ^ 2
		end
		local nb = math.floor(t * 2) -- zwei Wechsel pro Sekunde
		if nb ~= beat then
			beat = nb
			for _, it in ipairs(tiles) do it.P.Color = palette[(it.J + beat) % 4 + 1] end
			for _, f in ipairs(floor) do
				local fall = math.max(0, 1 - math.sqrt(f.X * f.X + f.Z * f.Z) / 4.2)
				local on = (f.X + f.Z + beat) % 2 == 0 or (math.abs(f.X) + math.abs(f.Z) + beat) % 3 == 0
				f.P.Color = palette[(math.abs(f.X * 3 + f.Z) + beat) % 4 + 1]
				f.P.Transparency = 1 - (on and fall * 0.85 or fall * 0.12)
			end
		end
	end)
end

-- ── Elektrisch ──
function EFFECTS.elektrisch(k)
	recolor(k.Model, function(p) p.Color = p.Color:Lerp(hex("#fff2a0"), 0.15) end)
	local glow = light(k.Body, hex("#ffe94a"), 1, 14)
	local SEG = 8
	local arcs = {}
	for i = 1, 6 do
		local core, halo = {}, {}
		for s = 1, SEG do
			table.insert(core, newPart(k.Model, "Block", V(0.05, 0.05, 0.3), k.fix(0, 0), hex("#fffbe0"), "Neon", 1, "Blitz"))
			table.insert(halo, newPart(k.Model, "Block", V(0.18, 0.18, 0.3), k.fix(0, 0), hex("#ffd23a"), "Neon", 1, "Blitzschein"))
		end
		table.insert(arcs, { Core = core, Halo = halo, Born = -9, Life = 0.2 })
	end
	local function place(arc, pts)
		for s = 1, SEG do
			local a, b = pts[s], pts[s + 1]
			local d = (b - a)
			local cf = CFrame.lookAt((a + b) / 2, b)
			arc.Core[s].Size = V(0.05, 0.05, d.Magnitude + 0.02)
			arc.Halo[s].Size = V(0.18, 0.18, d.Magnitude + 0.05)
			arc.Core[s].CFrame, arc.Halo[s].CFrame = cf, cf
		end
	end
	local function jag(A, B, amp, bulge)
		local pts = {}
		for i = 0, SEG do
			local q = i / SEG
			local p = A:Lerp(B, q)
			if bulge > 0 then
				local rel = p - k.Body.Position
				p = k.Body.Position + rel.Unit * (rel.Magnitude + math.sin(q * math.pi) * bulge)
			end
			if i > 0 and i < SEG then p = p + V(rand(-amp, amp), rand(-amp, amp), rand(-amp, amp)) end
			table.insert(pts, p)
		end
		return pts
	end
	-- Funken springen bei Einschlägen
	local spark = k.holder(k.fix(0, 0))
	local sparks = emitter(spark, { Color = ColorSequence.new(hex("#fffbe0"), hex("#ffb020")), Size = NumberSequence.new(0.16, 0), Lifetime = NumberRange.new(0.5, 0.8), Speed = NumberRange.new(3, 6), SpreadAngle = Vector2.new(70, 70), Acceleration = V(0, -14, 0), Drag = 1 })
	-- Ladungen kriechen über den Rand
	local crawl = {}
	for i = 1, 10 do
		table.insert(crawl, { P = newPart(k.Model, "Ball", V(0.16, 0.16, 0.16), k.fix(0, 0), hex("#fff6a0"), "Neon", 0, "Ladung"), A = rand(0, TAU), S = rand(0.8, 2.2) * (math.random() < 0.5 and -1 or 1), Z = rand(-0.08, 0.08), Ph = rand(0, 6) })
	end
	local nextArc, energy, last = 0, 0, 0
	k.on(function(t)
		local d = math.min(0.1, t - last)
		last = t
		if t > nextArc then
			nextArc = t + rand(0.09, 0.22)
			local arc = arcs[1]
			for _, a in ipairs(arcs) do if a.Born < arc.Born then arc = a end end
			arc.Born, arc.Life = t, rand(0.14, 0.3)
			if math.random() < 0.3 then
				-- Einschlag in den Boden
				local ang = rand(-2.6, -0.5)
				local A = k.spin(math.cos(ang), math.sin(ang), rand(-0.1, 0.1)).Position
				local B = k.Body.Position + V(0, FLOOR, 0) + V(rand(-0.8, 0.8), 0, (A - k.Body.Position).Z * 1.6 + rand(-0.8, 0.8))
				place(arc, jag(A, B, 0.24, 0))
				spark.CFrame = CFrame.new(B)
				sparks:Emit(10)
			else
				local a0 = rand(0, TAU)
				local a1 = a0 + rand(0.6, 1.9)
				local A = k.spin(math.cos(a0) * 1.04, math.sin(a0) * 1.04, rand(-0.2, 0.2)).Position
				local B = k.spin(math.cos(a1) * 1.04, math.sin(a1) * 1.04, rand(-0.2, 0.2)).Position
				place(arc, jag(A, B, 0.2, rand(0.4, 0.9)))
				if math.random() < 0.4 then
					spark.CFrame = CFrame.new(B)
					sparks:Emit(6)
				end
			end
			energy = math.min(1, energy + 0.2)
		end
		energy = energy * math.exp(-d * 5)
		glow.Brightness = 0.8 + energy * 2.2 + math.sin(t * 2.4) * 0.2
		for _, a in ipairs(arcs) do
			local q = (t - a.Born) / a.Life
			local o = (q < 0 or q > 1) and 0 or 1 - q * q
			for s = 1, SEG do
				a.Core[s].Transparency = 1 - o
				a.Halo[s].Transparency = 1 - o * 0.32
			end
		end
		for _, c in ipairs(crawl) do
			c.A = c.A + d * c.S
			c.P.CFrame = k.spin(math.cos(c.A) * 1.05, math.sin(c.A) * 1.05, c.Z)
			c.P.Transparency = 0.45 - 0.45 * math.sin(t * 5 + c.Ph)
		end
	end)
end

-- ── Dämonisch ──
function EFFECTS.daemonisch(k)
	recolor(k.Model, function(p) p.Color = p.Color:Lerp(hex("#4a0808"), 0.55) end)
	-- glühende Lavarisse pulsieren im Herzschlag
	local faces = faceGui(k, 0.97)
	local cracks = {}
	for _, f in ipairs(faces) do
		local R = Random.new(9)
		for i = 1, 12 do
			local a = R:NextNumber(0, 360)
			local c = frame(f.Gui, { Size = UDim2.new(R:NextNumber(0.2, 0.45), 0, 0.018, 0), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5 + math.cos(math.rad(a)) * R:NextNumber(0.1, 0.3), 0.5 + math.sin(math.rad(a)) * R:NextNumber(0.1, 0.3)), Rotation = a + R:NextNumber(-30, 30), BackgroundColor3 = hex("#ff5a1a") })
			grad(c, 0, seq(0, 1, 0.5, 0, 1, 1), ColorSequence.new(hex("#ffd36a"), hex("#ff3a0a")))
			table.insert(cracks, c)
		end
	end
	follow(k, faces)
	-- geschwungene Hörner mit glühenden Spitzen
	local horn = {}
	local tips = {}
	local bends = { 0.42, 0.14, 0.14, 0.12, 0.06, -0.12, -0.22, -0.3 }
	for _, s in ipairs({ -1, 1 }) do
		local x, y, th = 0, 0, 0
		for i, b in ipairs(bends) do
			th = th + b
			local q = (i - 1) / #bends
			local r = 0.085 * (1 - q * 0.82) * S * 2
			local h = 0.1 * S
			local cx, cy = x + s * math.sin(th) * h / 2, y + math.cos(th) * h / 2
			local p = newPart(k.Model, "Cyl", V(r, h * 1.1, r), k.spin(s * 0.45 + cx / S, 0.83 + cy / S, 0) * CFrame.Angles(s * th, 0, 0), i > 5 and hex("#ff2a10") or hex("#2a0606"), i > 5 and "Neon" or "SmoothPlastic", 0, "Horn")
			table.insert(horn, p)
			if i > 5 then table.insert(tips, p) end
			x, y = x + s * math.sin(th) * h, y + math.cos(th) * h
		end
	end
	attach(k, horn)
	local aura = light(k.Body, hex("#ff1a1a"), 2, 14)
	-- Beschwörungskreis am Boden: Ringe, Fünfstern, Runen
	local circle = {}
	local center = k.fix(0, FLOOR / S)
	local function ringOf(radius, n, thick)
		for i = 0, n - 1 do
			local a = i / n * TAU
			table.insert(circle, newPart(k.Model, "Block", V(TAU * radius / n * 1.05, 0.03, thick), center * CFrame.new(math.cos(a) * radius, 0.02, math.sin(a) * radius) * CFrame.Angles(0, -a + math.pi / 2, 0), hex("#ff2a1a"), "Neon", 0.25, "Kreis"))
		end
	end
	ringOf(3.0, 32, 0.08)
	ringOf(2.4, 28, 0.05)
	for i = 0, 4 do
		local a, b = i / 5 * TAU, (i + 2) / 5 * TAU
		local A, B = V(math.cos(a) * 2.4, 0, math.sin(a) * 2.4), V(math.cos(b) * 2.4, 0, math.sin(b) * 2.4)
		table.insert(circle, newPart(k.Model, "Block", V(0.06, 0.03, (B - A).Magnitude), center * CFrame.lookAt((A + B) / 2, B) * CFrame.new(0, 0.02, 0), hex("#ff2a1a"), "Neon", 0.25, "Stern"))
	end
	for i = 0, 11 do
		local a = i / 12 * TAU
		table.insert(circle, newPart(k.Model, "Block", V(0.18, 0.03, 0.3), center * CFrame.new(math.cos(a) * 2.7, 0.02, math.sin(a) * 2.7) * CFrame.Angles(0, -a, 0), hex("#ff6a3a"), "Neon", 0.3, "Rune"))
	end
	local circleItems = {}
	for _, p in ipairs(circle) do table.insert(circleItems, { P = p, O = center:ToObjectSpace(p.CFrame) }) end
	-- Flammen mit Farbverlauf, dunkler Rauch, Glut
	local flames = k.holder(k.fix(0, -0.55), V(3.6, 1.6, 0.5))
	emitter(flames, { Texture = "rbxasset://textures/particles/fire_main.dds", Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, hex("#ffd36a")), ColorSequenceKeypoint.new(0.45, hex("#ff5a1a")), ColorSequenceKeypoint.new(1, hex("#a50d05")) }), Size = seq(0, 0.6, 0.4, 1.2, 1, 0.2), Transparency = seq(0, 0.2, 0.7, 0.5, 1, 1), Lifetime = NumberRange.new(0.8, 1.2), Speed = NumberRange.new(2.5, 4), SpreadAngle = Vector2.new(10, 10), Rate = 30, RotSpeed = NumberRange.new(-60, 60) })
	local smoke = k.holder(k.fix(0, 1.2, -0.12), V(1.6, 0.2, 0.3))
	emitter(smoke, { Texture = "rbxasset://textures/particles/smoke_main.dds", LightEmission = 0, Color = ColorSequence.new(hex("#1e0606")), Size = NumberSequence.new(1, 3), Transparency = seq(0, 1, 0.4, 0.6, 1, 1), Lifetime = NumberRange.new(3, 4), Speed = NumberRange.new(1, 1.6), Rate = 3 })
	local glowFloor = k.holder(k.fix(0, -1), V(4.4, 0.2, 1.6))
	emitter(glowFloor, { Color = ColorSequence.new(hex("#ffb06a"), hex("#ff3a0a")), Size = NumberSequence.new(0.12, 0), Lifetime = NumberRange.new(2, 3), Speed = NumberRange.new(1.5, 2.5), SpreadAngle = Vector2.new(15, 15), Rate = 12 })
	k.on(function(t)
		-- Herzschlag: zwei kurze Pulse, dann Pause
		local hb = (t * 0.9) % 1
		local beat = math.exp(-((hb - 0.1) * 14) ^ 2) + 0.7 * math.exp(-((hb - 0.3) * 14) ^ 2)
		for _, c in ipairs(cracks) do c.BackgroundTransparency = 0.55 - beat * 0.55 end
		aura.Brightness = 1.6 + beat * 2.4
		for _, p in ipairs(tips) do p.Transparency = 0.4 - beat * 0.4 end
		local rot = k.fix(0, FLOOR / S) * CFrame.Angles(0, t * 0.18, 0)
		for _, it in ipairs(circleItems) do
			it.P.CFrame = rot * it.O
			it.P.Transparency = 0.55 - beat * 0.35
		end
	end)
end

-- ── Augenkrebs ── Farben laufen weich durch (unter 3 Wechseln pro Sekunde), kein schnelles Blitzen
function EFFECTS.augenkrebs(k)
	local parts = {}
	recolor(k.Model, function(p) p.Material = Enum.Material.Neon table.insert(parts, p) end)
	-- Op-Art: konzentrische Ringe und ein Schachbrett-Kranz, dreht sich gegenläufig auf beiden Seiten
	local faces = faceGui(k, 0.97)
	local spinners = {}
	for _, f in ipairs(faces) do
		local holder = frame(f.Gui, { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1 })
		for i = 0, 5 do
			local s = 1 - i * 0.16
			local ring = round(frame(holder, { Size = UDim2.fromScale(s, s), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), BackgroundTransparency = 1 }))
			local st = Instance.new("UIStroke")
			st.Thickness = 5
			st.Color = i % 2 == 0 and Color3.new(0, 0, 0) or WHITE
			st.Transparency = 0.3
			st.Parent = ring
		end
		for i = 0, 15 do
			local a = i / 16 * 360
			frame(holder, { Size = UDim2.new(0.08, 0, 0.08, 0), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5 + math.cos(math.rad(a)) * 0.42, 0.5 + math.sin(math.rad(a)) * 0.42), Rotation = a, BackgroundColor3 = i % 2 == 0 and Color3.new(0, 0, 0) or WHITE, BackgroundTransparency = 0.35 })
		end
		table.insert(spinners, { F = holder, Side = f.Side })
	end
	follow(k, faces)
	-- Strahlenkranz hinter der Münze in Gegenfarbe
	local rays = {}
	for i = 0, 11 do
		table.insert(rays, newPart(k.Model, "Block", V(0.05, 9.2, 0.25), k.fix(0, 0), WHITE, "Neon", 0.78, "Strahl"))
	end
	-- Neon-Formen mit Comic-Kontur umkreisen die Münze
	local shapes = {}
	local kinds = { { "Ball", V(0.4, 0.4, 0.4) }, { "Block", V(0.36, 0.36, 0.36) }, { "Wedge", V(0.36, 0.36, 0.36) }, { "Ball", V(0.5, 0.2, 0.5) }, { "Cyl", V(0.4, 0.16, 0.4) } }
	for i, kd in ipairs(kinds) do
		local p = newPart(k.Model, kd[1], kd[2], k.fix(0, 0), hex("#ff00ff"), "Neon", 0, "Form")
		local h = Instance.new("Highlight")
		h.Adornee = p
		h.FillTransparency = 1
		h.OutlineColor = hex("#0b0a10")
		h.Parent = p
		table.insert(shapes, { P = p, R = (1.45 + ((i - 1) % 2) * 0.2) * S, Sp = 0.7 + (i - 1) * 0.18, Ph = (i - 1) / 5 * TAU, Tilt = CFrame.Angles(rand(-0.8, 0.8), 0, rand(-0.5, 0.5)) })
	end
	-- Zickzack-Ring (Drahtgitter) dreht sich frei
	local zig = {}
	for i = 0, 23 do
		local a = i / 24 * TAU
		table.insert(zig, { P = newPart(k.Model, "Block", V(0.06, 0.06, 0.62), k.fix(0, 0), hex("#ff00ff"), "Neon", 0.1, "Zickzack"), A = a })
	end
	k.on(function(t)
		local h = (t * 0.3) % 1
		local c1, c2 = Color3.fromHSV(h, 0.8, 1), Color3.fromHSV((h + 0.5) % 1, 0.9, 1)
		for i, p in ipairs(parts) do p.Color = i % 3 == 0 and c2 or c1:Lerp(WHITE, 0.15) end
		for _, s in ipairs(spinners) do s.F.Rotation = s.Side * t * 34 end
		local rc = Color3.fromHSV((h + 0.25) % 1, 1, 1)
		for i, r in ipairs(rays) do
			r.Color = rc
			r.CFrame = k.spin(0, 0, -0.15) * CFrame.Angles(i / 12 * math.pi - t * 0.35, 0, 0)
		end
		for i, s in ipairs(shapes) do
			local a = t * s.Sp + s.Ph
			s.P.CFrame = CFrame.new(k.Body.Position) * s.Tilt * CFrame.new(math.cos(a) * s.R, math.sin(t * 1.6 + i) * 0.4, math.sin(a) * s.R) * CFrame.Angles(t * 1.3 + i, t * 0.9, 0)
			s.P.Color = Color3.fromHSV((h + i / 5) % 1, 1, 1)
		end
		local zc = Color3.fromHSV((h + 0.75) % 1, 1, 1)
		local zr = CFrame.new(k.Body.Position) * CFrame.Angles(t * 0.6, t * 0.45, t * 0.3)
		for i, z in ipairs(zig) do
			z.P.Color = zc
			z.P.CFrame = zr * CFrame.new(math.cos(z.A) * 2.5, 0, math.sin(z.A) * 2.5) * CFrame.Angles((i % 2 == 0 and 0.5 or -0.5), -z.A, 0)
		end
	end)
end

-- ── Hacked ──
function EFFECTS.hacked(k)
	local green = hex("#3dff7a")
	recolor(k.Model, function(p) p.Color = p.Color:Lerp(hex("#1a3a22"), 0.45) end)
	-- Scanlinien wandern über die Prägung, Glitch-Geister in Magenta und Cyan
	local faces = faceGui(k, 0.97)
	local scans, ghosts = {}, {}
	for _, f in ipairs(faces) do
		round(frame(f.Gui, { Size = UDim2.fromScale(1, 1), BackgroundColor3 = hex("#0aff5a"), BackgroundTransparency = 0.9 }))
		for i = 0, 9 do
			local l = frame(f.Gui, { Size = UDim2.new(0.86, 0, 0.012, 0), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, i / 10), BackgroundColor3 = green, BackgroundTransparency = 0.55 })
			grad(l, 0, seq(0, 1, 0.5, 0, 1, 1))
			table.insert(scans, { F = l, Y = i / 10 })
		end
		for _, g in ipairs({ { hex("#ff2a9a"), -0.035 }, { hex("#2ad4ff"), 0.035 } }) do
			table.insert(ghosts, round(frame(f.Gui, { Size = UDim2.fromScale(0.97, 0.97), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5 + g[2], 0.5), BackgroundColor3 = g[1], BackgroundTransparency = 1 })))
		end
	end
	follow(k, faces)
	-- Code-Spalten: heller Kopf, auslaufende Spur
	local glyphs = { "0", "1", "A", "F", "7", "#" }
	local cols = {}
	for c = 0, 11 do
		local a = c / 12 * TAU + rand(-0.1, 0.1)
		local r = rand(1.55, 1.9)
		local host = k.holder(k.fix(math.cos(a) * r, 0, math.sin(a) * r))
		local gui = Instance.new("BillboardGui")
		gui.Size = UDim2.fromScale(0.7, 4)
		gui.LightInfluence = 0
		gui.Parent = host
		local text = Instance.new("TextLabel")
		text.Size = UDim2.fromScale(1, 1)
		text.BackgroundTransparency = 1
		text.Font = Enum.Font.Code
		text.TextScaled = true
		text.TextColor3 = green
		text.Parent = gui
		grad(text, 90, seq(0, 1, 0.75, 0.3, 1, 0))
		table.insert(cols, { Gui = gui, Text = text, Off = math.random(), Sp = rand(0.25, 0.45), Host = host, X = math.cos(a) * r, Z = math.sin(a) * r })
	end
	-- Drahtgitter beim Glitch
	local wire = {}
	for i = 0, 19 do
		local a = i / 20 * TAU
		for _, s in ipairs({ -1, 1 }) do
			table.insert(wire, newPart(k.Model, "Block", V(0.03, TAU * 1.06 * S / 20, 0.03), k.spin(math.cos(a) * 1.06, math.sin(a) * 1.06, s * 0.09) * CFrame.Angles(-a, 0, 0), green, "Neon", 1, "Gitter"))
		end
	end
	attach(k, wire)
	-- Schild und Fehlermeldungen
	local function tag(text, size, offset)
		local host = k.holder(k.fix(0, 0))
		local gui = Instance.new("BillboardGui")
		gui.Size = size
		gui.StudsOffset = offset
		gui.AlwaysOnTop = true
		gui.Parent = host
		local l = Instance.new("TextLabel")
		l.Size = UDim2.fromScale(1, 1)
		l.BackgroundColor3 = Color3.new(0, 0, 0)
		l.BackgroundTransparency = 0.25
		l.TextColor3 = green
		l.Font = Enum.Font.Code
		l.TextScaled = true
		l.Text = text
		l.Parent = gui
		return gui, l, host
	end
	local label, labelText = tag("HACKED", UDim2.fromScale(3.6, 0.9), V(0, -2.5, 0))
	local errs = {}
	for i, txt in ipairs({ "ERROR", "0xDEAD", "ZUGRIFF" }) do
		local gui, _, host = tag(txt, UDim2.fromScale(2.4, 0.6), V(0, 0, 0))
		table.insert(errs, { Gui = gui, Host = host, Off = (i - 1) / 3, P = nil })
	end
	-- Zerfall in Pixel am Rand
	local rim = k.holder(k.fix(0, 0), V(0.4, 3.6, 3.6))
	emitter(rim, { Texture = "", Color = ColorSequence.new(green), LightEmission = 1, Shape = Enum.ParticleEmitterShape.Cylinder, ShapeStyle = Enum.ParticleEmitterShapeStyle.Surface, Size = NumberSequence.new(0.12, 0.06), Transparency = seq(0, 0, 1, 1), Lifetime = NumberRange.new(1, 1.6), Speed = NumberRange.new(0.6, 1.4), Acceleration = V(0, 0.5, 0), Rate = 14 })
	local shake = jiggler(k.Model)
	local glitchUntil, nextGlitch = 0, 1
	local lastText = -1
	k.on(function(t)
		for _, s in ipairs(scans) do s.F.Position = UDim2.fromScale(0.5, 0.05 + ((s.Y + t * 0.12) % 1) * 0.9) end
		local tick = math.floor(t * 8)
		for i, c in ipairs(cols) do
			local head = 2 - ((t * c.Sp + c.Off) % 1) * 4.2
			c.Host.CFrame = k.fix(c.X, head - 1, c.Z)
			if tick ~= lastText then
				local str = ""
				for j = 1, 10 do str = str .. glyphs[(i * 7 + j * 3 + tick) % #glyphs + 1] .. (j < 10 and "\\n" or "") end
				c.Text.Text = str
			end
		end
		lastText = tick
		if t > nextGlitch then glitchUntil, nextGlitch = t + 0.18, t + rand(1.2, 2.8) end
		local g = t < glitchUntil
		shake(g and CFrame.new(0, 0, rand(-0.16, 0.16)) or CFrame.new())
		for _, f in ipairs(ghosts) do f.BackgroundTransparency = g and 0.65 or 1 end
		for _, w in ipairs(wire) do w.Transparency = g and 0.1 or 1 end
		label.StudsOffset = V(g and rand(-0.2, 0.2) or 0, -2.5, 0)
		labelText.TextTransparency = (g and math.random() < 0.5) and 0.65 or 0
		for _, e in ipairs(errs) do
			local l = (t * 0.33 + e.Off) % 1
			e.Gui.Enabled = l < 0.22
			if l < 0.01 or not e.P then e.P = { rand(-1.3, 1.3), rand(-0.6, 1.3) } end
			e.Host.CFrame = k.fix(e.P[1], e.P[2], 0.6)
		end
	end)
end

-- ── Golden ──
function EFFECTS.golden(k)
	local gold = hex("#ffc93a")
	recolor(k.Model, function(p)
		p.Color = p.Name == "Body" and gold or hex("#fff0a0")
		p.Material = Enum.Material.Foil
		p.Reflectance = 0.3
	end)
	local glow = light(k.Body, hex("#ffd23a"), 2.5, 14)
	-- Strahlenkranz hinter der Münze
	local rays = {}
	for i = 0, 11 do table.insert(rays, newPart(k.Model, "Block", V(0.05, 8.8, 0.22), k.fix(0, 0), hex("#ffcf4a"), "Neon", 0.75, "Strahl")) end
	-- Glanzstreifen wandert über beide Seiten
	local faces = faceGui(k, 0.98)
	local bands = {}
	for _, f in ipairs(faces) do
		local b = frame(f.Gui, { Size = UDim2.new(0.22, 0, 1.1, 0), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(-0.3, 0.5), Rotation = 20, BackgroundColor3 = hex("#fff6d0"), BackgroundTransparency = 0.2 })
		grad(b, 0, seq(0, 1, 0.5, 0.15, 1, 1))
		table.insert(bands, b)
	end
	follow(k, faces)
	-- Sternfunkeln an wechselnden Stellen
	local glints = {}
	for i = 1, 6 do
		table.insert(glints, { A = newPart(k.Model, "Block", V(0.02, 0.8, 0.06), k.fix(0, 0), hex("#fff3c0"), "Neon", 1, "Funkeln"), B = newPart(k.Model, "Block", V(0.02, 0.06, 0.8), k.fix(0, 0), hex("#fff3c0"), "Neon", 1, "Funkeln"), Per = rand(1.2, 2.2), Off = math.random(), I = i })
	end
	-- flüssiges Gold tropft, kleine Goldmünzen regnen
	local sources = {}
	for i = 1, 4 do local x = rand(-0.5, 0.5) table.insert(sources, { x, -math.sqrt(1.02 - x * x) }) end
	dripper(k, sources, gold, "Foil", 2.8, 0.18, hex("#ffd23a"))
	local coins = {}
	for i = 1, 10 do
		table.insert(coins, { P = newPart(k.Model, "Cyl", V(0.3, 0.05, 0.3), k.fix(0, 0), gold, "Foil", 0, "Goldmuenze"), X = rand(-1.8, 1.8), Z = rand(-0.8, -0.2), Off = math.random(), Sp = rand(0.18, 0.3), R = rand(2, 5) })
	end
	k.on(function(t)
		glow.Brightness = 2.2 + math.sin(t * 1.6) * 0.5
		for i, r in ipairs(rays) do
			r.CFrame = k.spin(0, 0, -0.15) * CFrame.Angles(i / 12 * math.pi + t * 0.12, 0, 0)
			r.Transparency = 0.75 - math.sin(t * 1.3) * 0.08
		end
		local sweep = (t % 2.8) / 2.8
		for _, b in ipairs(bands) do b.Position = UDim2.fromScale(sweep < 0.4 and -0.3 + (sweep / 0.4) * 1.6 or 1.5, 0.5) end
		for _, g in ipairs(glints) do
			local raw = t / g.Per + g.Off
			local n = math.floor(raw)
			local l = raw - n
			local R = Random.new(n * 31 + g.I * 7)
			local a, r = R:NextNumber() * TAU, 0.2 + R:NextNumber() * 0.8
			local side = R:NextNumber() < 0.5 and 1 or -1
			local s = l < 0.35 and math.sin((l / 0.35) * math.pi) or 0
			local cf = k.spin(math.cos(a) * r, math.sin(a) * r, side * (FACE / S + 0.03)) * CFrame.Angles(t * 0.8, 0, 0)
			g.A.CFrame, g.B.CFrame = cf, cf
			g.A.Size, g.B.Size = V(0.02, 0.84 * s + 0.01, 0.06), V(0.02, 0.06, 0.84 * s + 0.01)
			g.A.Transparency, g.B.Transparency = s > 0.05 and 0 or 1, s > 0.05 and 0 or 1
		end
		for _, c in ipairs(coins) do
			local l = (t * c.Sp + c.Off) % 1
			c.P.CFrame = k.fix(c.X, 2.2 - l * 4, c.Z) * CFrame.Angles(t * c.R, t * c.R * 0.6, 0) * UP
		end
	end)
end

-- ── Kosmisch ──
function EFFECTS.kosmisch(k)
	recolor(k.Model, function(p)
		p.Color = p.Name == "Body" and hex("#2a2260") or p.Color:Lerp(Color3.new(0, 0, 0), 0.7):Lerp(hex("#2a1a5a"), 0.4)
		p.Reflectance = 0.2
	end)
	-- Spiralgalaxie in der Prägung, Sternbild darüber
	local faces = faceGui(k, 0.97)
	local galaxies, cstars = {}, {}
	local cons = {}
	local CR = Random.new(77)
	for i = 1, 7 do local a, r = CR:NextNumber() * TAU, 0.25 + CR:NextNumber() * 0.6 table.insert(cons, { math.cos(a) * r * 0.5 + 0.5, math.sin(a) * r * 0.5 + 0.5 }) end
	for _, f in ipairs(faces) do
		round(frame(f.Gui, { Size = UDim2.fromScale(1, 1), BackgroundColor3 = hex("#06041a"), BackgroundTransparency = 0.35 }))
		local gal = frame(f.Gui, { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1 })
		for arm = 0, 2 do
			for i = 0, 17 do
				local q = (i / 17) ^ 0.8
				local a = arm * TAU / 3 + q * 2.6 * math.pi
				local r = 0.03 + q * 0.4
				local s = 0.07 - q * 0.04
				round(frame(gal, { Size = UDim2.fromScale(s, s), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5 + math.cos(a) * r, 0.5 + math.sin(a) * r), BackgroundColor3 = Color3.fromHSV((290 - q * 110) / 360, 0.7, 1), BackgroundTransparency = 0.35 + q * 0.4 }))
			end
		end
		round(frame(gal, { Size = UDim2.fromScale(0.16, 0.16), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), BackgroundColor3 = hex("#ffecfa"), BackgroundTransparency = 0.1 }))
		table.insert(galaxies, { F = gal, Side = f.Side })
		for _, pair in ipairs({ { 1, 2 }, { 2, 3 }, { 3, 4 }, { 4, 5 }, { 5, 6 }, { 6, 7 }, { 3, 6 } }) do
			local A, B = cons[pair[1]], cons[pair[2]]
			local dx, dy = B[1] - A[1], B[2] - A[2]
			frame(f.Gui, { Size = UDim2.new(math.sqrt(dx * dx + dy * dy), 0, 0.006, 0), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale((A[1] + B[1]) / 2, (A[2] + B[2]) / 2), Rotation = math.deg(math.atan2(dy, dx)), BackgroundColor3 = hex("#9fd4ff"), BackgroundTransparency = 0.5 })
		end
		for i, c in ipairs(cons) do
			table.insert(cstars, { F = round(frame(f.Gui, { Size = UDim2.fromScale(0.04, 0.04), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(c[1], c[2]), BackgroundColor3 = hex("#e8f2ff") })), Ph = i * 0.9 + (f.Side > 0 and 0 or 3) })
		end
	end
	follow(k, faces)
	-- zwei Nebel hinter der Münze, Leuchten
	local neb1 = newPart(k.Model, "Ball", V(1, 7, 9), k.fix(0, 0, -0.3), hex("#b07bff"), "Neon", 0.94, "Nebel")
	local neb2 = newPart(k.Model, "Ball", V(1, 9, 7), k.fix(0, 0, -0.35), hex("#7ad7ff"), "Neon", 0.96, "Nebel")
	light(k.Body, hex("#7b5cff"), 2, 14)
	-- Sternenstaub-Scheibe mit Spiralarmen (innen schneller), Planeten
	local tilt = CFrame.Angles(math.pi / 2 - 0.32, 0.25, 0)
	local dust = {}
	for i = 1, 70 do
		local q = math.random()
		local r = 1.25 + q * 1.15
		table.insert(dust, { P = newPart(k.Model, "Ball", V(0.1, 0.1, 0.1), k.fix(0, 0), Color3.fromHSV(0.78 - q * 0.25, 0.7, 1), "Neon", 0.2, "Sternenstaub"), R = r * S, A = (i % 2) * math.pi + math.log(r) * 4.2 + rand(-0.35, 0.35), Ph = rand(0, 6) })
	end
	local planets = {}
	for _, pl in ipairs({ { hex("#ff9d5c"), 0.22, 2.05, 0.35, 0, true }, { hex("#5cd6ff"), 0.16, 1.5, 0.6, 2.5, false } }) do
		local p = newPart(k.Model, "Ball", V(1, 1, 1) * pl[2] * S, k.fix(0, 0), pl[1], "SmoothPlastic", 0, "Planet")
		local ring = pl[6] and newPart(k.Model, "Cyl", V(pl[2] * S * 2, 0.02, pl[2] * S * 2), k.fix(0, 0), hex("#ffd9b0"), "SmoothPlastic", 0.4, "Planetenring") or nil
		table.insert(planets, { P = p, Ring = ring, R = pl[3] * S, Sp = pl[4], Ph = pl[5] })
	end
	-- Sternschnuppen und ferne Sterne
	local shooters = {}
	for i = 1, 3 do table.insert(shooters, { P = newPart(k.Model, "Block", V(0.04, 0.06, 2.2), k.fix(0, 0), hex("#e8dcff"), "Neon", 1, "Sternschnuppe"), Per = rand(3, 5), Off = (i - 1) / 3, I = i }) end
	local far = {}
	for i = 1, 40 do
		local d = V(rand(-1, 1), rand(-1, 1), rand(-1, 1)).Unit * rand(5.2, 6.8)
		table.insert(far, { P = newPart(k.Model, "Ball", V(0.09, 0.09, 0.09), CFrame.new(k.Body.Position + d), WHITE, "Neon", 0.3, "Stern"), D = d, Ph = rand(0, 6) })
	end
	k.on(function(t)
		for _, g in ipairs(galaxies) do g.F.Rotation = g.Side * t * 7 end
		for _, s in ipairs(cstars) do
			local z = 0.03 + (0.5 + 0.5 * math.sin(t * 1.8 + s.Ph)) ^ 3 * 0.04
			s.F.Size = UDim2.fromScale(z, z)
		end
		neb1.CFrame = k.fix(0, 0, -0.3) * CFrame.Angles(t * 0.03, 0, 0)
		neb2.CFrame = k.fix(0, 0, -0.35) * CFrame.Angles(-t * 0.05, 0, 0)
		local base = CFrame.new(k.Body.Position) * tilt
		for _, d in ipairs(dust) do
			local a = d.A + t * (0.55 / (d.R / S))
			d.P.CFrame = base * CFrame.new(math.cos(a) * d.R, math.sin(a) * d.R, 0)
			d.P.Transparency = 0.5 - 0.5 * (0.5 + 0.5 * math.sin(t * 2 + d.Ph)) ^ 2
		end
		for _, p in ipairs(planets) do
			local a = t * p.Sp + p.Ph
			p.P.CFrame = base * CFrame.new(math.cos(a) * p.R, math.sin(a) * p.R, 0)
			if p.Ring then p.Ring.CFrame = p.P.CFrame * CFrame.Angles(1.2, 0, 0) * UP end
		end
		for _, s in ipairs(shooters) do
			local raw = t / s.Per + s.Off
			local n = math.floor(raw)
			local l = raw - n
			local Rr = Random.new(n * 13 + s.I * 101)
			local x0, y0 = 1.2 + Rr:NextNumber() * 1.2, 0.6 + Rr:NextNumber() * 1.4
			local q = math.min(1, l / 0.22)
			s.P.CFrame = k.fix(x0 - q * 2.6, y0 - q * 1.17, -1.2) * CFrame.Angles(0.42, 0, 0) * CFrame.Angles(0, math.pi / 2, 0)
			s.P.Transparency = l < 0.22 and 1 - math.sin(q * math.pi) or 1
		end
		for _, f in ipairs(far) do f.P.Transparency = 0.7 - 0.7 * (0.5 + 0.5 * math.sin(t * 1.5 + f.Ph)) ^ 3 end
	end)
end

-- Ganze Münze samt Effekten um den Mittelpunkt vergrößern (Teile, Partikel, Lichter, Bänder)
local function scaleModel(model, f)
	local pivot = model:GetPivot()
	for _, d in ipairs(model:GetDescendants()) do
		if d:IsA("BasePart") then
			local rel = pivot:ToObjectSpace(d.CFrame)
			d.Size = d.Size * f
			d.CFrame = pivot * (rel - rel.Position + rel.Position * f)
		elseif d:IsA("ParticleEmitter") then
			pcall(function()
				local pts = {}
				for _, kp in ipairs(d.Size.Keypoints) do
					table.insert(pts, NumberSequenceKeypoint.new(kp.Time, kp.Value * f, (kp.Envelope or 0) * f))
				end
				d.Size = NumberSequence.new(pts)
				d.Speed = NumberRange.new(d.Speed.Min * f, d.Speed.Max * f)
			end)
		elseif d:IsA("PointLight") or d:IsA("SpotLight") or d:IsA("SurfaceLight") then
			d.Range = math.min(60, d.Range * f)
		elseif d:IsA("Beam") then
			d.Width0, d.Width1 = d.Width0 * f, d.Width1 * f
		elseif d:IsA("Attachment") then
			d.Position = d.Position * f
		end
	end
	model:SetAttribute("FxScale", (model:GetAttribute("FxScale") or 1) * f)
end
MutationFx.ScaleModel = scaleModel

function MutationFx.Apply(model, mutationId)
	local list = MutationData.Parse and MutationData.Parse(mutationId) or { MutationData.ById[mutationId] }
	if #list > 1 or (list[1] and list[1].Scale) then
		-- erst alle Effekte in normaler Größe, dann vergrößern
		local scale, mult = 1, 1
		for _, m in ipairs(list) do
			if m.Scale then
				scale, mult = scale * m.Scale, mult * m.Multiplier
			else
				MutationFx.Apply(model, m.Id)
			end
		end
		if scale ~= 1 then scaleModel(model, scale) end
		model:SetAttribute("Mutation", MutationData.Key(list))
		model:SetAttribute("Value", (model:GetAttribute("Value") or 0) * mult)
		return model
	end
	local fx = EFFECTS[mutationId]
	if not fx then return model end
	local body = model.PrimaryPart
	local k = rig(model, body)
	fx(k)
	if #k.Updates > 0 then
		local start = os.clock()
		local connection
		connection = RunService.Heartbeat:Connect(function()
			if not model.Parent then return end
			local t = os.clock() - start
			for _, u in ipairs(k.Updates) do u(t) end
		end)
		model.Destroying:Connect(function() connection:Disconnect() end)
	end
	local m = MutationData.ById[mutationId]
	model:SetAttribute("Mutation", mutationId)
	model:SetAttribute("Value", (model:GetAttribute("Value") or 0) * m.Multiplier)
	return model
end

return MutationFx
`;
