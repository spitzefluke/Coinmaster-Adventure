// Eier v2 für Roblox Studio (aus Claude Design „Haustiere und Eier v2“): EggBuilder baut jedes Ei aus Parts
// (Sockel in drei Stufen mit Leuchtband und Runenring, Schale mit eigener Deko, Risse für das Schlüpfen) und
// bewegt die Deko (Runen, Flügel, Planeten, Scanner …). HatchFx spielt das Schlüpfen in fünf Akten.
// Reiner Text wie luau.js, damit es auch in Node prüfbar ist.

const HEADER = (title) => `-- Coinmaster Adventure · ${title}
-- Automatisch erzeugt von der Coinmaster-Webseite. Änderungen besser dort machen
-- und neu übertragen, sonst gehen sie beim nächsten Import verloren.
`;

// Zusätze je Ei (für die Karten der Webseite)
export const EGG_EXTRAS = {
  normal: ['Strohnest', 'Sprenkel', 'Münzhaufen', 'Leuchtsockel'],
  wald: ['Ranken & Blätter', 'Moos', 'Wurzeln', 'Fliegenpilze', 'Glühwürmchen'],
  eis: ['Frostkappe', 'Eiszapfen', 'Kristallkranz', 'Schneefall', 'Runenring'],
  engel: ['Goldfiligran', 'Perlen', 'Flügel', 'Heiligenschein', 'Lichtfunken'],
  galaxie: ['Glasschale mit Nebel', 'Sternenring', 'Planeten', 'Runenring'],
  admin: ['Panzerplatten', 'Neon-Leiterbahnen', 'Scanner', 'Warnstreifen', 'Glitch'],
  release: ['Geschenkband', 'Schleife', 'Luftballons', 'Konfetti'],
};

export const EGG_BUILDER = `${HEADER('Eier bauen')}
-- EggBuilder.Build(egg) baut ein Ei auf seinem Sockel als Model. PrimaryPart ist die unsichtbare „Root“
-- am Boden unter dem Ei. Die Schale und alles, was an ihr klebt, liegt im Model „Body“ (wackelt beim
-- Schlüpfen), die Risse heißen „Crack“ und sind erst unsichtbar.
-- Bewegte Deko (Runenring, Flügel, Planeten, Scanner, Glitch …) läuft von selbst, solange das Ei im Spiel
-- liegt. Für Kopien aus einem Ordner einmal EggBuilder.Start(model) aufrufen.

local RunService = game:GetService("RunService")

local EggBuilder = {}

local RX, RY, PED_TOP = 1.5, 2.025, 0.74
local SHELL_Y = PED_TOP + RY
local TAU = math.pi * 2
local V = Vector3.new
local UP = CFrame.Angles(0, 0, math.pi / 2) -- Zylinder stehen (Achse X → Y)
local FLIP = CFrame.Angles(0, math.pi, 0) -- Vorderseite des Eis zeigt nach −Z (zur Kamera)
local IDENT = CFrame.new()

EggBuilder.PedestalTop = PED_TOP
EggBuilder.ShellCenter = V(0, SHELL_Y, 0)
EggBuilder.ShellSize = V(RX * 2, RY * 2, RX * 2)
EggBuilder.Height = SHELL_Y + RY + 0.4

local LOOK = {
	normal = { "#e8c98f", "SmoothPlastic" },
	wald = { "#6fbf4a", "SmoothPlastic" },
	eis = { "#7fd6ff", "Ice", 0.2 },
	engel = { "#fff1c2", "SmoothPlastic", 0, 0.2 },
	galaxie = { "#2a1a5a", "Glass", 0.25 },
	admin = { "#1d1d24", "Metal" },
	release = { "#ffc93c", "Foil" },
}

-- Aussehen: Farbe (Hex oder Color3), Material, Durchsichtigkeit, Spiegelung
local MATS = { Gold = "Foil", Gem = "Glass", Ink = "SmoothPlastic", Balloon = "SmoothPlastic" }
local function M(color, material, transparency, reflectance)
	material = material or "SmoothPlastic"
	return {
		Color = type(color) == "string" and Color3.fromHex(color) or color,
		Material = Enum.Material[MATS[material] or material],
		Transparency = transparency or 0,
		Reflectance = reflectance or ((material == "Gold" or material == "Balloon") and 0.2 or 0),
	}
end

local function make(parent, shape, size, cf, m, name)
	local p = Instance.new(shape == "Wedge" and "WedgePart" or "Part")
	p.Name = name or "Teil"
	p.Anchored = true
	p.CanCollide = false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Color = m.Color
	p.Material = m.Material
	p.Transparency = m.Transparency
	if m.Reflectance ~= 0 then p.Reflectance = m.Reflectance end
	if shape == "Cyl" then
		p.Shape = Enum.PartType.Cylinder
		p.Size = V(size.Y, size.X, size.Z)
		p.CFrame = FLIP * cf * UP
	else
		p.Size = size
		p.CFrame = FLIP * cf
		if shape == "Ball" then
			local mesh = Instance.new("SpecialMesh")
			mesh.MeshType = Enum.MeshType.Sphere
			mesh.Parent = p
		end
	end
	p.Parent = parent
	return p
end

local function at(x, y, z, rx, ry, rz)
	local cf = CFrame.new(x, y, z)
	if rx then cf = cf * CFrame.Angles(rx, ry or 0, rz or 0) end
	return cf
end
local function size3(s) return type(s) == "number" and V(s, s, s) or s end
local function blk(p, s, cf, m, name) return make(p, "Block", size3(s), cf, m, name) end
local function ball(p, s, cf, m, name) return make(p, "Ball", size3(s), cf, m, name) end
local function cyl(p, s, cf, m, name) return make(p, "Cyl", size3(s), cf, m, name) end

-- Kegel als zwei Keile Rücken an Rücken (Spitze oben)
local function spike(p, s, cf, m, name)
	make(p, "Wedge", V(s.X, s.Y, s.Z / 2), cf * CFrame.new(0, 0, -s.Z / 4), m, name)
	make(p, "Wedge", V(s.X, s.Y, s.Z / 2), cf * CFrame.new(0, 0, s.Z / 4) * CFrame.Angles(0, math.pi, 0), m, name)
end

-- Ring aus Blöcken in der XZ-Ebene von cf (Radius R, Dicke t)
local function ring(p, cf, R, t, m, n, name)
	n = n or math.max(12, math.floor(R * 14))
	local len = TAU * R / n * 1.08
	for i = 0, n - 1 do
		local a = i / n * TAU
		blk(p, V(len, t * 2, t * 2), cf * CFrame.new(math.cos(a) * R, 0, math.sin(a) * R) * CFrame.Angles(0, -a + math.pi / 2, 0), m, name)
	end
end

-- CFrame an Position pos, dessen Y-Achse entlang n zeigt
local function alignY(pos, n)
	n = n.Unit
	local ref = math.abs(n.Y) > 0.95 and Vector3.xAxis or Vector3.yAxis
	local x = ref:Cross(n).Unit
	local z = x:Cross(n).Unit
	return CFrame.fromMatrix(pos, x, n, z)
end

-- Punkt auf der Eischale (th von oben gemessen, ph rundherum): Y-Achse = Normale nach außen,
-- X-Achse entlang des Breitenkreises, Z-Achse entlang des Längenkreises
local function surfPos(th, ph, out)
	local s, c = math.sin(th), math.cos(th)
	local n = V(-math.cos(ph) * s / RX, c / RY, math.sin(ph) * s / RX).Unit
	return V(-math.cos(ph) * s * RX, c * RY + SHELL_Y, math.sin(ph) * s * RX) + n * (out or 0), n
end
local function surf(th, ph, out)
	local p, n = surfPos(th, ph, out)
	return alignY(p, n)
end

-- Glied zwischen zwei Punkten
local function link(p, a, b, m, th)
	local d = b - a
	return blk(p, V(th, d.Magnitude, th), alignY((a + b) / 2, d), m)
end
-- Röhre aus Kugeln und Gliedern (Ranken, Wurzeln)
local function tube(p, pts, r, m, taper)
	for i, q in ipairs(pts) do
		local k = 1 - (taper or 0) * (i - 1) / #pts
		ball(p, r * 2 * k, CFrame.new(q), m)
		if i > 1 then link(p, pts[i - 1], q, m, r * 1.8 * k) end
	end
end

-- Bewegte Gruppe: Model mit Attribut Anim; Pivot ist der Drehpunkt (CFrame im Ei)
local function group(parent, anim, pivot, attrs)
	local g = Instance.new("Model")
	g.Name = anim
	g:SetAttribute("Anim", anim)
	g:SetAttribute("Pivot", FLIP * pivot)
	for k, v in pairs(attrs or {}) do g:SetAttribute(k, v) end
	g.Parent = parent
	return g
end

local function emitterAt(parent, cf, size, props, name)
	local host = make(parent, "Block", size, cf, M("#ffffff", "SmoothPlastic", 1), name or "Partikel")
	local e = Instance.new("ParticleEmitter")
	e.LightEmission = 1
	e.Texture = "rbxasset://textures/particles/sparkles_main.dds"
	for k, v in pairs(props) do e[k] = v end
	e.Parent = host
	return e, host
end
local function colors(list)
	local keys = {}
	for i, c in ipairs(list) do
		table.insert(keys, ColorSequenceKeypoint.new(#list == 1 and 0 or (i - 1) / (#list - 1), Color3.fromHex(c)))
	end
	if #keys == 1 then return ColorSequence.new(keys[1].Value) end
	return ColorSequence.new(keys)
end

local function coin(p, cf, s)
	cyl(p, V(0.5, 0.08, 0.5) * s, cf, M("#f2c14e", "Gold"), "Muenze")
	cyl(p, V(0.36, 0.09, 0.36) * s, cf, M("#d9a43a", "Gold"), "Muenze")
end

local function leafAt(p, rng, th, ph, m, s, out)
	local cf = surf(th, ph, out or 0.06) * CFrame.Angles(0, rng:NextNumber() * TAU, 0)
	ball(p, V(0.36, 0.05, 0.2) * s, cf * CFrame.new(0.2 * s, 0.02 * s, 0) * CFrame.Angles(0, 0, 0.25), m, "Blatt")
end

local DECO = {}

function DECO.normal(b)
	local d, rng = b.Body, b.Rng
	local sp = { M("#a8743a"), M("#c99556"), M("#7d5226") }
	for i = 0, 15 do
		local th, ph = 0.35 + rng:NextNumber() * 2.2, rng:NextNumber() * TAU
		ball(d, V(0.22 + rng:NextNumber() * 0.18, 0.04, 0.18 + rng:NextNumber() * 0.14), surf(th, ph, -0.005), sp[i % 3 + 1], "Sprenkel")
		for k = 0, 1 do
			ball(d, V(0.07, 0.03, 0.07), surf(th + (rng:NextNumber() - 0.5) * 0.25, ph + (rng:NextNumber() - 0.5) * 0.3, -0.003), sp[(i + k) % 3 + 1], "Sprenkel")
		end
	end
	-- Nest aus geflochtenem Stroh, abstehende Halme, zwei Federn
	local straw = { M("#c9a05a"), M("#e0bd72"), M("#a9803e"), M("#8a6630") }
	for r = 0, 3 do
		local R, y = 1.0 + r * 0.22, 0.1 + r * 0.21
		for i = 0, 17 do
			local a = i / 18 * TAU + r * 0.4
			blk(b.Model, V(0.2, 0.19, 0.62), at(math.cos(a) * R, PED_TOP + y + math.sin(i * 2.3) * 0.03, math.sin(a) * R, math.sin(i) * 0.4, -a, 0.35 * (i % 2 == 1 and 1 or -1)), straw[(i + r) % 4 + 1], "Stroh")
		end
	end
	ring(b.Model, at(0, PED_TOP + 0.06, 0), 1.08, 0.12, straw[4], 18, "Stroh")
	for i = 0, 17 do
		local a, r = rng:NextNumber() * TAU, 1.35 + rng:NextNumber() * 0.5
		cyl(b.Model, V(0.04, 0.7 + rng:NextNumber() * 0.6, 0.04), at(math.cos(a) * r, PED_TOP + 0.3 + rng:NextNumber() * 0.25, math.sin(a) * r, math.pi / 2 + (rng:NextNumber() - 0.5) * 0.9, a + math.pi / 2 + (rng:NextNumber() - 0.5) * 1.2, 0), straw[i % 4 + 1], "Halm")
	end
	for _, f in ipairs({ { 0.6, "#fff6e8" }, { 3.4, "#e8c98f" } }) do
		local a = f[1]
		local cf = at(math.cos(a) * 1.55, PED_TOP + 0.55, math.sin(a) * 1.55, 0.3, -a, 0.9)
		blk(b.Model, V(0.02, 0.7, 0.02), cf * CFrame.new(0, 0.35, 0), M("#c9a05a"), "Feder")
		for k = 0, 5 do
			ball(b.Model, V(0.22 - k * 0.025, 0.14, 0.03), cf * CFrame.new(0, 0.18 + k * 0.09, 0) * CFrame.Angles(0, 0, 0.35), M(f[2]), "Feder")
		end
	end
	-- kleiner Münzhaufen auf dem Sockel
	local pile = at(1.55, PED_TOP + 0.04, 0.95)
	for i = 0, 4 do coin(b.Model, pile * at(0, i * 0.085, 0, 0, i * 0.7, i % 2 == 1 and 0.05 or -0.05), 1) end
	coin(b.Model, pile * at(0.42, 0.06, -0.12, 0.5, 0, 0.6), 1)
	coin(b.Model, pile * at(-0.3, 0.04, 0.25, 0, 1, 0.1), 1)
	emitterAt(b.Model, at(0, SHELL_Y, 0), V(2.4, 2.4, 2.4), { Rate = 3, Lifetime = NumberRange.new(2, 3), Speed = NumberRange.new(0.1, 0.3), SpreadAngle = Vector2.new(180, 180), Size = NumberSequence.new(0.35, 0), Color = colors({ "#fff3c4", "#ffd89a" }) })
end

function DECO.wald(b)
	local d, rng = b.Body, b.Rng
	local moss = { M("#3f7f26", "Grass"), M("#5ea73a", "Grass"), M("#7cc44f", "Grass") }
	for i = 0, 21 do
		ball(d, V(0.45 + rng:NextNumber() * 0.35, 0.16 + rng:NextNumber() * 0.1, 0.45 + rng:NextNumber() * 0.35), surf(2.05 + rng:NextNumber() * 0.9, rng:NextNumber() * TAU, -0.04), moss[i % 3 + 1], "Moos")
	end
	for i = 0, 7 do
		ball(d, V(0.36, 0.07, 0.3), surf(0.6 + rng:NextNumber() * 1.4, rng:NextNumber() * TAU, -0.02), moss[i % 3 + 1], "Moos")
	end
	-- drei dicke Ranken mit Blättern
	local vine = M("#2f6b22")
	local leaf = { M("#8fdc5a"), M("#6fbf4a"), M("#b6ff6a") }
	for k = 0, 2 do
		local pts = {}
		for i = 0, 13 do
			local u = i / 13
			table.insert(pts, (surfPos(0.2 + u * 2.55, u * TAU * 1.1 + k * TAU / 3, 0.05)))
		end
		tube(d, pts, 0.09, vine, 0.4)
		for i = 1, 13, 2 do
			local u = i / 13
			leafAt(d, rng, 0.2 + u * 2.55 + 0.05, u * TAU * 1.1 + k * TAU / 3 + 0.15, leaf[i % 3 + 1], i % 4 == 1 and 1.4 or 1)
		end
	end
	-- leuchtende Blüten
	local bloom = { M("#ff9ec2", "Neon"), M("#fff3a0", "Neon") }
	for i = 0, 5 do
		local cf = surf(0.6 + rng:NextNumber() * 1.6, rng:NextNumber() * TAU, 0.07)
		for p = 0, 3 do
			local a = p / 4 * TAU
			ball(d, V(0.13, 0.04, 0.09), cf * at(math.cos(a) * 0.08, 0, math.sin(a) * 0.08, 0, -a, 0), bloom[i % 2 + 1], "Bluete")
		end
		ball(d, 0.07, cf * CFrame.new(0, 0.02, 0), M("#ffcc33", "Neon"), "Bluete")
	end
	-- Wurzeln greifen über den Sockel
	local root = M("#5a3a22")
	for i = 0, 4 do
		local a, pts = i / 5 * TAU + 0.3, {}
		for k = 0, 4 do
			local u = k / 4
			local r = 1.1 + u * 1.15
			table.insert(pts, V(math.cos(a + u * 0.25) * r, PED_TOP + 0.12 + math.sin(u * math.pi) * 0.18 - u * 0.12, math.sin(a + u * 0.25) * r))
		end
		tube(b.Model, pts, 0.12, root, 0.6)
	end
	-- Farnwedel
	local fern = M("#4f9a2e")
	for i = 0, 2 do
		local a = i / 3 * TAU + 1
		local base = at(math.cos(a) * 1.95, PED_TOP, math.sin(a) * 1.95, 0, -a + math.pi / 2, 0)
		for f = 0, 2 do
			local st = base * CFrame.Angles(0, (f - 1) * 0.6, 0) * CFrame.Angles(0.4 + f * 0.1, 0, 0)
			blk(b.Model, V(0.04, 0.68, 0.04), st * CFrame.new(0, 0.34, 0), fern, "Farn")
			for s = 0, 3 do
				for _, sx in ipairs({ 1, -1 }) do
					ball(b.Model, V(0.26 - s * 0.04, 0.05, 0.08), st * at(sx * (0.12 - s * 0.015), 0.12 + s * 0.16, 0, 0, 0, sx * 0.4), fern, "Farn")
				end
			end
		end
	end
	-- Fliegenpilze in Gruppen
	for i = 0, 2 do
		local a = i / 3 * TAU + 0.2
		local gg = at(math.cos(a) * 1.75, PED_TOP, math.sin(a) * 1.75)
		for m = 0, 2 do
			local s = ({ 1.6, 1, 0.7 })[m + 1] * (i % 2 == 1 and 1.1 or 0.9)
			local g = gg * at(m == 0 and 0 or (m == 1 and 0.3 or -0.25), 0, m == 0 and 0 or 0.15, 0, 0, (m - 1) * 0.2)
			cyl(b.Model, V(0.14, 0.3, 0.14) * s, g * CFrame.new(0, 0.15 * s, 0), M("#f3ead8"), "Pilz")
			ball(b.Model, V(0.44, 0.26, 0.44) * s, g * CFrame.new(0, 0.32 * s, 0), M(i == 2 and "#c88a3a" or "#d8322e"), "Pilz")
			ball(b.Model, V(0.38, 0.08, 0.38) * s, g * CFrame.new(0, 0.24 * s, 0), M("#f6ecd6"), "Pilz")
			for _, xz in ipairs({ { 0.1, 0.05 }, { -0.08, -0.1 } }) do
				ball(b.Model, 0.06 * s, g * CFrame.new(xz[1] * s, 0.42 * s, xz[2] * s), M("#ffffff"), "Pilz")
			end
		end
	end
	-- Glühwürmchen und fallende Blätter
	emitterAt(b.Model, at(0, SHELL_Y, 0), V(2.8, 2.8, 2.8), { Rate = 8, Lifetime = NumberRange.new(2, 3.5), Speed = NumberRange.new(0.2, 0.5), SpreadAngle = Vector2.new(180, 180), Size = NumberSequence.new(0.35, 0.3), Transparency = NumberSequence.new(0, 1), Color = colors({ "#d8ff6a", "#b6ff6a", "#fff3a0" }) })
	emitterAt(b.Model, at(0, 6.6, 0), V(2.4, 0.2, 2.4), { Rate = 2, Lifetime = NumberRange.new(3, 4), Speed = NumberRange.new(0.3, 0.5), EmissionDirection = Enum.NormalId.Bottom, SpreadAngle = Vector2.new(20, 20), Acceleration = V(0.3, 0, 0.2), Size = NumberSequence.new(0.3, 0.25), Transparency = NumberSequence.new(0.1, 1), LightEmission = 0.3, Texture = "", Color = colors({ "#8fdc5a", "#c9a05a" }) })
end

function DECO.eis(b)
	local d, rng = b.Body, b.Rng
	-- leuchtender Kern hinter der Eisschale
	ball(d, V(1.6, 2.2, 1.6), at(0, SHELL_Y - 0.1, 0), M("#9ff0ff", "Neon", 0.65), "Kern")
	-- Kristallsplitter wachsen aus der Schale
	local shard = { M("#dff6ff", "Ice", 0.1), M("#bfeaff", "Ice", 0.15) }
	local shardS = M("#e8f9ff")
	for i = 0, 8 do
		local cf = surf(1.0 + rng:NextNumber() * 1.6, i / 9 * TAU + rng:NextNumber() * 0.3, -0.08)
		for k = 0, 1 do
			spike(d, V(0.42 - k * 0.12, 0.55 + rng:NextNumber() * 0.35 - k * 0.2, 0.3 - k * 0.1), cf * at(k * 0.14, 0.25, k * 0.08, k * 0.5, rng:NextNumber(), (rng:NextNumber() - 0.5) * 0.3), k == 1 and shardS or shard[i % 2 + 1], "Splitter")
		end
	end
	-- Frostlinien
	local fl = M("#ffffff", "Neon", 0.3)
	for k = 0, 5 do
		local th, ph = 0.8 + rng:NextNumber() * 1.2, rng:NextNumber() * TAU
		for i = 0, 3 do
			local t2, p2 = th + (rng:NextNumber() - 0.5) * 0.25, ph + (rng:NextNumber() - 0.5) * 0.3
			link(d, (surfPos(th, ph, 0.01)), (surfPos(t2, p2, 0.01)), fl, 0.025)
			th, ph = t2, p2
		end
	end
	-- Schneehaube mit Wehen und Eiszapfen
	local snow, snow2 = M("#ffffff", "Snow"), M("#eef8ff", "Snow")
	local cap = at(0, SHELL_Y + RY * 0.8, 0)
	ball(d, V(2.25, 1.0, 2.25), cap, snow, "Schnee")
	ball(d, V(1.2, 0.6, 1.1), cap * CFrame.new(0.2, 0.35, 0.1), snow2, "Schnee")
	for i = 0, 7 do
		local a = i / 8 * TAU
		ball(d, V(0.8, 0.5, 0.7), cap * CFrame.new(math.cos(a) * 0.78, -0.12 - (i % 2) * 0.1, math.sin(a) * 0.78), i % 2 == 1 and snow or snow2, "Schnee")
	end
	for i = 0, 11 do
		local a = i / 12 * TAU + 0.1
		spike(d, V(0.18, 0.45 + rng:NextNumber() * 0.6, 0.18), cap * at(math.cos(a) * 1.02, -0.6, math.sin(a) * 1.02, math.pi, a, 0), M("#eaf9ff", "Ice"), "Eiszapfen")
	end
	-- Gletscherblöcke als Fuß
	local ice = M("#bfeaff", "Ice", 0.25)
	for i = 0, 6 do
		local a = i / 7 * TAU
		blk(b.Model, V(1.3, 0.5 + rng:NextNumber() * 0.25, 0.9), at(math.cos(a) * 1.35, PED_TOP + 0.2, math.sin(a) * 1.35, rng:NextNumber() * 0.2, -a, rng:NextNumber() * 0.2), ice, "Gletscher")
	end
	-- Kristallgruppen rundherum
	local cr = { M("#c8f2ff", "Glass", 0.35), M("#9ff0ff", "Glass", 0.45) }
	for c = 0, 5 do
		local a = c / 6 * TAU + 0.5
		local g = at(math.cos(a) * 1.95, PED_TOP, math.sin(a) * 1.95)
		for k = 0, 3 do
			local h = (k > 0 and 0.6 or 1.3) + rng:NextNumber() * 0.7
			local ang = k * 2.1
			local off = k > 0 and 0.18 or 0
			local lean = k > 0 and 0.35 or 0.14
			spike(b.Model, V(0.32, h, 0.32), g * at(math.cos(ang) * off, h / 2, math.sin(ang) * off, math.sin(ang + a) * lean, ang, -math.cos(ang + a) * lean), cr[k % 2 + 1], "Kristall")
		end
	end
	for i = 0, 11 do
		local a = i / 12 * TAU
		spike(b.Model, V(0.14, 0.32 + (i % 3) * 0.14, 0.14), at(math.cos(a) * 2.18, 0.34, math.sin(a) * 2.18, math.pi, a, 0), M("#dff6ff", "Ice"), "Eiszapfen")
	end
	-- schwebende Eissplitter
	local orb = group(b.Model, "Kreisen", at(0, SHELL_Y, 0), { Speed = 0.3 })
	for i = 0, 7 do
		local a = i / 8 * TAU
		spike(orb, V(0.3, 0.7, 0.3), at(math.cos(a) * 2.6, SHELL_Y + math.sin(i * 1.7) * 0.6, math.sin(a) * 2.6, i, i * 2, 0), shard[i % 2 + 1], "Splitter")
	end
	-- Schneefall und Bodennebel
	emitterAt(b.Model, at(0, 7.5, 0), V(3.6, 0.2, 3.6), { Rate = 18, Lifetime = NumberRange.new(2.5, 3.5), Speed = NumberRange.new(0.8, 1.4), EmissionDirection = Enum.NormalId.Bottom, SpreadAngle = Vector2.new(15, 15), Size = NumberSequence.new(0.24, 0.16), Transparency = NumberSequence.new(0, 1), Color = colors({ "#ffffff", "#dff6ff" }) })
	emitterAt(b.Model, at(0, PED_TOP + 0.3, 0), V(2.2, 0.1, 2.2), { Rate = 8, Lifetime = NumberRange.new(1.5, 2.5), Speed = NumberRange.new(0.2, 0.4), SpreadAngle = Vector2.new(15, 15), Size = NumberSequence.new(0.8, 1.4), Transparency = NumberSequence.new(0.82, 1), LightEmission = 0.4, Texture = "rbxasset://textures/particles/smoke_main.dds", Color = colors({ "#dff6ff" }) })
end

-- Engelsflügel: Bogen, Handschwingen mit Goldspitzen, Armschwingen, Deckfedern
local function wings(b)
	local white, cream, pearl, gold = M("#ffffff"), M("#fff6dd"), M("#f4ecff"), M("#f2c14e", "Gold")
	local glowM = M("#fff4cf", "Neon", 0.15)
	local shellC = at(0, SHELL_Y, 0)
	for _, sx in ipairs({ 1, -1 }) do
		local piv = shellC * at(sx * 1.15, -0.15, -0.55, 0, sx * 0.35, 0)
		local w = group(b.Body, "Fluegel", piv, { Side = sx })
		local arm = {}
		for i = 0, 5 do
			local u = i / 5
			arm[i + 1] = { sx * (0.15 + u * 2.3), 0.35 + math.sin(u * math.pi * 0.85) * 0.9 }
		end
		for i = 1, #arm - 1 do
			local x1, y1, x2, y2 = arm[i][1], arm[i][2], arm[i + 1][1], arm[i + 1][2]
			blk(w, V(math.sqrt((x2 - x1) ^ 2 + (y2 - y1) ^ 2) + 0.12, 0.2, 0.18), piv * at((x1 + x2) / 2, (y1 + y2) / 2, 0.04, 0, 0, math.atan2(y2 - y1, x2 - x1)), cream, "Fluegel")
			blk(w, V(math.sqrt((x2 - x1) ^ 2 + (y2 - y1) ^ 2), 0.05, 0.05), piv * at((x1 + x2) / 2, (y1 + y2) / 2 + 0.1, 0.14, 0, 0, math.atan2(y2 - y1, x2 - x1)), glowM, "Fluegel")
		end
		-- Handschwingen: lang, außen, Goldspitzen
		for i = 0, 8 do
			local u = i / 8
			local a = arm[4 + math.min(2, math.floor(u * 3))]
			local f = piv * at(a[1], a[2] - 0.05, -0.04 - i * 0.012, 0, 0, sx * (0.1 + u * 0.75) - math.pi)
			local L = 1.6 + math.sin(u * math.pi) * 0.6 - u * 0.4
			blk(w, V(0.46 - u * 0.08, L, 0.06), f * CFrame.new(0, L / 2, 0), i % 2 == 1 and white or pearl, "Feder")
			ball(w, V(0.44 - u * 0.08, 0.42, 0.07), f * CFrame.new(0, L, 0), gold, "Feder")
		end
		-- Armschwingen: mittel, innen
		for i = 0, 7 do
			local u = i / 7
			local a = arm[1 + math.min(3, math.floor(u * 3.5))]
			local f = piv * at(a[1], a[2] - 0.05, 0.02, 0, 0, -math.pi + sx * (-0.05 + u * 0.12))
			local L = 1.0 + u * 0.4
			blk(w, V(0.46, L, 0.06), f * CFrame.new(0, L / 2, 0), i % 2 == 1 and pearl or white, "Feder")
			ball(w, V(0.46, 0.32, 0.07), f * CFrame.new(0, L, 0), i % 2 == 1 and white or pearl, "Feder")
		end
		-- Deckfedern am Bogen
		for i = 0, 7 do
			local u = i / 7
			ball(w, V(0.55, 0.6, 0.08), piv * at(sx * (0.25 + u * 2.1), math.sin(u * math.pi * 0.85) * 0.85, 0.09, 0, 0, sx * 0.2), i % 2 == 1 and cream or white, "Feder")
		end
	end
end

function DECO.engel(b)
	local d = b.Body
	local gold = M("#f2c14e", "Gold")
	for _, th in ipairs({ 0.9, 1.7, 2.3 }) do
		for i = 0, 19 do
			blk(d, V(0.46, 0.05, 0.08), surf(th + math.sin(i * 0.8) * 0.06, i / 20 * TAU, 0.01), gold, "Filigran")
		end
	end
	for i = 0, 7 do ball(d, V(0.2, 0.08, 0.2), surf(1.3, i / 8 * TAU, 0.02), M("#ffffff", "Gem", 0.1, 0.3), "Perle") end
	-- Heiligenschein dreht sich und schwebt
	local haloAt = at(0, SHELL_Y + RY + 0.55, 0)
	local halo = group(d, "Kreisen", haloAt, { Speed = 0.6, Bob = 0.11, BobSpeed = 1.8 })
	ring(halo, haloAt, 0.9, 0.08, M("#ffe08a", "Neon"), 24, "Heiligenschein")
	wings(b)
	emitterAt(b.Model, at(0, PED_TOP + 0.2, 0), V(2, 0.1, 2), { Rate = 10, Lifetime = NumberRange.new(1.8, 2.8), Speed = NumberRange.new(0.6, 1.2), SpreadAngle = Vector2.new(12, 12), Size = NumberSequence.new(0.35, 0), Color = colors({ "#fff4cf", "#ffe08a" }) })
end

function DECO.galaxie(b)
	local d, rng = b.Body, b.Rng
	-- Nebel in der Glasschale
	local neb = group(d, "Kreisen", at(0, SHELL_Y, 0), { Speed = 0.35 })
	for _, n in ipairs({ { 0.3, 0.3, 0.1, "#ff7ad9", 0.9 }, { -0.35, -0.2, -0.1, "#7a8cff", 1 }, { 0.1, -0.6, 0.3, "#b49cff", 0.8 }, { -0.1, 0.7, -0.2, "#5ad1ff", 0.7 } }) do
		ball(neb, n[5], at(n[1], SHELL_Y + n[2], n[3]), M(n[4], "Neon", 0.5), "Nebel")
	end
	for i = 0, 19 do
		ball(neb, 0.07, at((rng:NextNumber() - 0.5) * 2, SHELL_Y + (rng:NextNumber() - 0.5) * 3, (rng:NextNumber() - 0.5) * 2), M("#ffffff", "Neon"), "Stern")
	end
	-- Sternenring, darauf zwei Planeten
	local tilt = at(0, SHELL_Y, 0, 0.35, 0, 0.12)
	for i = 0, 31 do
		local a = i / 32 * TAU
		local k = (i % 8) / 8
		ball(d, 0.17, tilt * CFrame.new(math.cos(a) * 2.5, 0, math.sin(a) * 2.5), M(Color3.fromHex("#b49cff"):Lerp(Color3.fromHex("#5ad1ff"), k), "Neon"), "Sternenring")
	end
	local pl = group(d, "Kreisen", tilt, { Speed = 0.4 })
	local sat = tilt * CFrame.new(2.5, 0, 0)
	ball(pl, 0.55, sat, M("#ff9d5c"), "Planet")
	ring(pl, sat * CFrame.Angles(0.35, 0, 0.2), 0.48, 0.05, M("#ffd8b0"), 14, "Planetenring")
	ball(pl, 0.35, tilt * CFrame.new(-2.5, 0, 0), M("#5cd6ff"), "Planet")
	emitterAt(d, at(0, SHELL_Y, 0), V(3, 3, 3), { Rate = 8, Lifetime = NumberRange.new(0.8, 1.4), Speed = NumberRange.new(0, 0.3), SpreadAngle = Vector2.new(180, 180), Size = NumberSequence.new(0.5, 0), Color = colors({ "#ffffff", "#b49cff" }) })
end

function DECO.admin(b)
	local d = b.Body
	local plate, red = M("#2e2e38", "DiamondPlate"), M("#ff4058", "Neon")
	for i = 0, 5 do blk(d, V(0.9, 0.12, 1.2), surf(1.55, i / 6 * TAU + 0.26, 0.02), plate, "Panzer") end
	for i = 0, 27 do blk(d, V(0.36, 0.08, 0.16), surf(math.pi / 2, i / 28 * TAU, 0.08), red, "Leiterbahn") end
	for k = 0, 3 do
		for i = 0, 11 do blk(d, V(0.05, 0.05, 0.3), surf(0.2 + i / 12 * 2.7, k / 4 * TAU, 0.06), red, "Leiterbahn") end
	end
	-- Scanner fährt auf und ab
	local scan = cyl(d, V(RX * 2, 0.06, RX * 2), at(0, SHELL_Y, 0), M("#ff4058", "Neon", 0.2), "Scanner")
	scan:SetAttribute("Anim", "Scanner")
	-- Warnstreifen am Sockel
	local y, k = M("#ffcc33"), M("#141018", "Ink")
	for i = 0, 23 do
		local a = i / 24 * TAU
		blk(b.Model, V(0.5, 0.25, 0.1), at(math.cos(a) * 2.47, 0.46, math.sin(a) * 2.47, 0, -a + math.pi / 2, 0.5), i % 2 == 1 and y or k, "Warnstreifen")
	end
	-- Glitch-Würfel springen um das Ei
	for i = 0, 9 do
		local c = blk(b.Model, V(0.2, 0.2, 0.2), at(0, SHELL_Y, 0), M(({ "#ff4058", "#ff3df2", "#3de8ff" })[i % 3 + 1], "Neon"), "Glitch")
		c:SetAttribute("Anim", "Glitch")
		c:SetAttribute("Seed", i)
	end
end

function DECO.release(b)
	local d, rng = b.Body, b.Rng
	local rib = M("#e0243a")
	for _, ph0 in ipairs({ 0, math.pi / 2 }) do
		for _, ph in ipairs({ ph0, ph0 + math.pi }) do
			for i = 0, 19 do
				blk(d, V(0.44, 0.07, 0.34), surf(0.06 + i / 19 * (math.pi - 0.12), ph, 0.02), rib, "Band")
			end
		end
	end
	-- Schleife oben
	local bow = at(0, SHELL_Y + RY + 0.25, 0)
	for _, sx in ipairs({ 1, -1 }) do
		ring(d, bow * at(sx * 0.42, 0.1, 0, 0, 0, sx * 0.4) * CFrame.Angles(math.pi / 2, 0, 0), 0.38, 0.12, rib, 12, "Schleife")
		blk(d, V(0.22, 0.6, 0.06), bow * at(sx * 0.25, -0.35, 0.3, 0.2, 0, sx * 0.5), rib, "Schleife")
	end
	ball(d, 0.32, bow, rib, "Schleife")
	-- zwei Luftballons
	for i, bl in ipairs({ { -1.9, 0.7, "#5ad1ff" }, { 1.8, -0.9, "#ff5aa5" } }) do
		local x, z = bl[1], bl[2]
		local cf = at(x, 3.9, z)
		local g = group(b.Model, "Schweben", cf, { Phase = rng:NextNumber() * 6 })
		ball(g, V(0.9, 1.05, 0.9), cf, M(bl[3], "Balloon"), "Ballon")
		spike(g, V(0.14, 0.12, 0.14), cf * at(0, -0.56, 0, math.pi, 0, 0), M(bl[3]), "Ballon")
		cyl(b.Model, V(0.02, 3.1, 0.02), at(x * 0.95, 2.25, z * 0.95), M("#fbf7ef"), "Schnur")
	end
	emitterAt(b.Model, at(0, 7.2, 0), V(3.4, 0.2, 3.4), { Rate = 16, Lifetime = NumberRange.new(2.4, 3.4), Speed = NumberRange.new(0.4, 0.8), EmissionDirection = Enum.NormalId.Bottom, SpreadAngle = Vector2.new(25, 25), Size = NumberSequence.new(0.22, 0.2), Transparency = NumberSequence.new(0, 0.7), RotSpeed = NumberRange.new(-180, 180), LightEmission = 0.3, Texture = "", Color = colors({ "#ff5aa5", "#ffe07a", "#5ad1ff", "#7dff8a", "#b49cff" }) })
	emitterAt(d, at(0, SHELL_Y, 0), V(2.2, 2.2, 2.2), { Rate = 6, Lifetime = NumberRange.new(0.8, 1.2), Speed = NumberRange.new(0, 0.2), SpreadAngle = Vector2.new(180, 180), Size = NumberSequence.new(0.5, 0), Color = colors({ "#ffffff", "#ffe07a" }) })
end

-- ── Bewegung ──
local ANIMS = {}
function ANIMS.Kreisen(t, g)
	local bob = g.Bob and math.sin(t * (g.BobSpeed or 1) + (g.Phase or 0)) * g.Bob or 0
	return CFrame.new(0, bob, 0) * CFrame.Angles(0, t * (g.Speed or 0.3), 0)
end
function ANIMS.Runen(t)
	return CFrame.new(0, math.sin(t * 1.2) * 0.08, 0) * CFrame.Angles(0, t * 0.25, 0)
end
function ANIMS.Schweben(t, g)
	local ph = g.Phase or 0
	return CFrame.new(0, math.sin(t * 1.3 + ph) * 0.12, 0) * CFrame.Angles(0, 0, math.sin(t + ph) * 0.08)
end
function ANIMS.Fluegel(t, g)
	local k, sx = math.sin(t * 1.4), g.Side or 1
	return CFrame.Angles(0, sx * k * 0.22, sx * k * 0.06)
end

local records = setmetatable({}, { __mode = "k" })

local function track(model)
	local root = model.PrimaryPart
	local body = model:FindFirstChild("Body")
	local rec = { Model = model, Root = root, Body = body, Groups = {}, Static = {}, Specials = {}, Wobble = IDENT, Dirty = false }
	local inv = root.CFrame:Inverse()
	local grouped = {}
	for _, g in ipairs(model:GetDescendants()) do
		if g:IsA("Model") and g:GetAttribute("Anim") then
			local pivot = g:GetAttribute("Pivot") or IDENT
			local entry = { Kind = g:GetAttribute("Anim"), Pivot = pivot, Parts = {}, InBody = body ~= nil and g:IsDescendantOf(body), Attrs = g:GetAttributes() }
			local pinv = pivot:Inverse()
			for _, p in ipairs(g:GetDescendants()) do
				if p:IsA("BasePart") then
					grouped[p] = true
					table.insert(entry.Parts, { Part = p, Offset = pinv * inv * p.CFrame })
				end
			end
			if ANIMS[entry.Kind] then table.insert(rec.Groups, entry) end
		end
	end
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") and not grouped[p] then
			local kind = p:GetAttribute("Anim")
			local inBody = body ~= nil and p:IsDescendantOf(body)
			if kind then
				table.insert(rec.Specials, { Kind = kind, Part = p, InBody = inBody, Seed = p:GetAttribute("Seed") or 0, Size = p.Size, Offset = inv * p.CFrame })
			elseif inBody then
				table.insert(rec.Static, { Part = p, Offset = inv * p.CFrame })
			elseif p.Name == "Leuchtband" then
				table.insert(rec.Specials, { Kind = "Leuchten", Part = p })
			end
		end
	end
	records[model] = rec
	return rec
end

local function glitchRand(seed, step, k)
	local x = math.sin(seed * 12.9898 + step * 78.233 + k * 37.719) * 43758.5453
	return x - math.floor(x)
end

-- Ein Bild weiterrechnen (läuft von selbst; t = Zeit in Sekunden)
function EggBuilder.Animate(model, t)
	local rec = records[model] or track(model)
	local root = rec.Root.CFrame
	local wob = rec.Wobble
	for _, g in ipairs(rec.Groups) do
		local base = root * (g.InBody and wob or IDENT) * g.Pivot * ANIMS[g.Kind](t, g.Attrs)
		for _, e in ipairs(g.Parts) do e.Part.CFrame = base * e.Offset end
	end
	for _, s in ipairs(rec.Specials) do
		if s.Kind == "Scanner" then
			local k = (math.sin(t * 1.3) + 1) / 2
			local y = PED_TOP + 0.4 + k * 3.4
			local r = math.sqrt(math.max(0.05, 1 - ((y - SHELL_Y) / RY) ^ 2)) * 1.05
			s.Part.Size = V(s.Size.X, s.Size.Y * r, s.Size.Z * r)
			s.Part.CFrame = root * wob * CFrame.new(0, y, 0) * UP
		elseif s.Kind == "Glitch" then
			local step = math.floor(t / 0.14)
			if rec.Model:GetAttribute("Geplatzt") then
				s.Part.Transparency = 1
			elseif s.Step ~= step then
				s.Step = step
				local r1, r2, r3 = glitchRand(s.Seed, step, 1), glitchRand(s.Seed, step, 2), glitchRand(s.Seed, step, 3)
				s.Part.Transparency = glitchRand(s.Seed, step, 4) < 0.6 and 0 or 1
				s.Part.Size = s.Size * (0.5 + glitchRand(s.Seed, step, 5))
				s.Part.CFrame = root * CFrame.new((r1 - 0.5) * 4, SHELL_Y + (r2 - 0.5) * 4, (r3 - 0.5) * 4)
			end
		elseif s.Kind == "Leuchten" then
			s.Part.Transparency = 0.15 - math.sin(t * 2) * 0.15
		end
	end
	if rec.Dirty then
		local base = root * wob
		for _, e in ipairs(rec.Static) do e.Part.CFrame = base * e.Offset end
		for _, s in ipairs(rec.Specials) do
			if s.InBody and s.Kind ~= "Scanner" and s.Offset then s.Part.CFrame = base * s.Offset end
		end
		rec.Dirty = wob ~= IDENT
	end
end

-- Wackeln beim Schlüpfen: cf dreht die ganze Schale um ihren Fußpunkt (CFrame.new() = Ruhe)
function EggBuilder.SetWobble(model, cf)
	local rec = records[model] or track(model)
	rec.Wobble = cf
	rec.Dirty = true
end
function EggBuilder.WobbleAround(rx, rz)
	local foot = CFrame.new(0, PED_TOP, 0)
	return foot * CFrame.Angles(rx, 0, rz) * foot:Inverse()
end

-- Bewegung starten (beim Bauen automatisch; für Kopien aus einem Ordner selbst aufrufen)
function EggBuilder.Start(model)
	if model:GetAttribute("Animated") then return end
	model:SetAttribute("Animated", true)
	track(model)
	local start = os.clock()
	local connection
	connection = RunService.Heartbeat:Connect(function()
		if model.Parent then EggBuilder.Animate(model, os.clock() - start) end
	end)
	model.Destroying:Connect(function() connection:Disconnect() end)
end

function EggBuilder.Build(egg)
	local look = LOOK[egg.Id] or { "#e8c98f", "SmoothPlastic" }
	local glow = egg.Glow
	local rank = egg.Rank
	local model = Instance.new("Model")
	model.Name = egg.Name
	local root = blk(model, V(1, 0.2, 1), CFrame.new(), M("#ffffff", "SmoothPlastic", 1), "Root")
	model.PrimaryPart = root

	-- Sockel: drei Stufen, Leuchtband, Nieten, Einlage
	cyl(model, V(4.9, 0.28, 4.9), at(0, 0.14, 0), M("#221e2a", "Slate"), "Sockel")
	cyl(model, V(4.4, 0.36, 4.4), at(0, 0.46, 0), M("#2a2532", "Slate"), "Sockel")
	cyl(model, V(4.0, 0.1, 4.0), at(0, 0.69, 0), M("#36303f"), "Sockel")
	cyl(model, V(4.5, 0.1, 4.5), at(0, 0.56, 0), M(glow, "Neon"), "Leuchtband")
	ring(model, at(0, 0.745, 0), 1.6, 0.025, M(glow, "Neon", 0.4), 28, "Einlage")
	for i = 0, 11 do
		local a = i / 12 * TAU
		ball(model, 0.13, at(math.cos(a) * 2.38, 0.2, math.sin(a) * 2.38), M(glow, "Neon"), "Niete")
	end
	if rank >= 2 then
		local rune = group(model, "Runen", at(0, 1.0, 0))
		for i = 0, 15 do
			local a = i / 16 * TAU
			blk(rune, V(0.16, 0.05 + (i % 3) * 0.04, 0.05), at(math.cos(a) * 2.7, 1.0, math.sin(a) * 2.7, 0, -a, 0), M(glow, "Neon"), "Rune")
		end
	end

	-- Schale mit Licht; Risse leuchten erst beim Schlüpfen auf
	local body = Instance.new("Model")
	body.Name = "Body"
	body.Parent = model
	local shell = ball(body, V(RX * 2, RY * 2, RX * 2), at(0, SHELL_Y, 0), M(look[1], look[2], look[3], look[4]), "Shell")
	local lamp = blk(model, V(0.2, 0.2, 0.2), at(0, SHELL_Y, 2.4), M("#ffffff", "SmoothPlastic", 1), "EggLight")
	local l = Instance.new("PointLight")
	l.Color = glow
	l.Brightness = 1 + rank * 0.4
	l.Range = 10 + rank * 2
	l.Parent = lamp
	local rng = Random.new(rank * 97 + 13)
	local crackM = M(glow, "Neon", 1)
	for i = 0, 13 do
		local th, ph = 0.5 + rng:NextNumber() * 1.8, rng:NextNumber() * TAU
		blk(body, V(0.05, 0.02, 0.5 + rng:NextNumber() * 0.5), surf(th, ph, 0.005) * CFrame.Angles(0, rng:NextNumber() * math.pi, 0), crackM, "Crack")
	end

	local deco = DECO[egg.Id]
	if deco then deco({ Model = model, Body = body, Rng = rng, Egg = egg }) end

	model:SetAttribute("EggId", egg.Id)
	EggBuilder.Start(model)
	return model
end

return EggBuilder
`;

export const HATCH_FX = `${HEADER('Schlüpfen')}
-- HatchFx.Play(eggId, petId, options) spielt das Schlüpfen in fünf Akten an einem Ort
-- (options.CFrame = Boden unter dem Ei, options.Parent = Elternteil, Standard workspace):
--   1 Wackeln: das Ei schaukelt immer stärker, Risse leuchten auf
--   2 Aufladen: Licht wird eingesogen, Strahlen drehen sich, die Schale glüht
--   3 Platzen: die Schale fliegt in zehn Stücken weg, Druckwelle, Funkenregen
--   4 Enthüllung: das Tier wächst mit Drehung heraus, Leuchtring am Boden (episch: Konfetti)
--   5 Name und Chance als BillboardGui
-- options.OnPhase(name) meldet die Akte ("wobble", "charge", "burst", "reveal", "done").
-- Seltene Eier wackeln und laden länger und platzen größer. Läuft am besten auf dem Client (LocalScript).
-- Gibt { Folder, Pet } zurück, sobald das Tier steht.

local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local EggData = require(script.Parent.EggData)
local PetData = require(script.Parent.PetData)
local EggBuilder = require(script.Parent.EggBuilder)
local PetBuilder = require(script.Parent.PetBuilder)

local HatchFx = {}

local TAU = math.pi * 2
local UP = CFrame.Angles(0, 0, math.pi / 2)

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

local function newPart(parent, props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in pairs(props) do p[k] = v end
	p.Parent = parent
	return p
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

-- Wartet ein Bild und gibt die vergangene Zeit zurück
local function frame()
	return RunService.Heartbeat:Wait()
end

function HatchFx.Play(eggId, petId, options)
	options = options or {}
	local egg = EggData.ById[eggId]
	local pet = PetData.ById[petId]
	local origin = options.CFrame or CFrame.new()
	local onPhase = options.OnPhase or function() end
	local rank = egg.Rank
	local glow = egg.Glow
	local folder = Instance.new("Folder")
	folder.Name = "Schluepfen"
	folder.Parent = options.Parent or workspace

	-- Ei auf seinem Sockel
	local eggModel = EggBuilder.Build(egg)
	eggModel:PivotTo(origin)
	eggModel.Parent = folder
	local body = eggModel:FindFirstChild("Body")
	local shell = body:FindFirstChild("Shell")
	local lamp = eggModel:FindFirstChild("EggLight")
	local light = lamp and lamp:FindFirstChildOfClass("PointLight")
	local baseLight = light and light.Brightness or 1
	local cracks, deco = {}, {}
	for _, p in ipairs(body:GetDescendants()) do
		if p:IsA("BasePart") then
			if p.Name == "Crack" then table.insert(cracks, p) elseif p ~= shell then table.insert(deco, p) end
		end
	end
	local center = origin * EggBuilder.ShellCenter
	local shellColor = shell.Color

	local D1 = 1.6 + rank * 0.32 -- Wackeln
	local D2 = 0.8 + rank * 0.14 -- Aufladen

	-- Hilfsteile: Mitte (Funken), Strahlen
	local core = newPart(folder, { Name = "Mitte", Transparency = 1, Size = Vector3.new(4, 4, 4), CFrame = CFrame.new(center) })
	local inward = emitter(core, { Shape = Enum.ParticleEmitterShape.Sphere, ShapeStyle = Enum.ParticleEmitterShapeStyle.Surface, ShapeInOut = Enum.ParticleEmitterShapeInOut.Inward, Speed = NumberRange.new(5.5, 7), Lifetime = NumberRange.new(0.3, 0.35), Size = NumberSequence.new(0.16, 0.4), Transparency = NumberSequence.new(0.8, 0), Color = ColorSequence.new(glow, Color3.new(1, 1, 1)) })
	local beams = {}
	local count = 6 + rank
	for i = 1, count do
		beams[i] = newPart(folder, { Name = "Strahl", Material = Enum.Material.Neon, Color = glow, Transparency = 1, Size = Vector3.new(0.3, 10, 0.3) })
	end
	local function placeBeams(spin, transparency)
		for i, p in ipairs(beams) do
			local a = (i - 1) / count * TAU + spin
			p.CFrame = origin * CFrame.new(0, EggBuilder.PedestalTop, 0) * CFrame.Angles(0, a, 0) * CFrame.new(0.9, 5, 0) * CFrame.Angles(0, 0, 0.3)
			p.Transparency = transparency
		end
	end

	-- 1. Wackeln: immer kräftiger und schneller, Risse leuchten nacheinander auf
	onPhase("wobble")
	local t = 0
	while t < D1 do
		t = t + frame()
		local k = math.min(1, t / D1)
		local amp = 0.04 + k * k * 0.3
		local f = 9 + k * 16
		local rz = math.sin(t * f) * amp * (0.55 + 0.45 * math.sin(t * 2.7))
		local rx = math.cos(t * f * 0.7) * amp * 0.3
		EggBuilder.SetWobble(eggModel, EggBuilder.WobbleAround(rx, rz))
		for i, c in ipairs(cracks) do c.Transparency = (i - 1) < k * 1.15 * #cracks and 0 or 1 end
		shell.Color = shellColor:Lerp(glow, k * 0.25)
		if light then light.Brightness = baseLight * (1 + k * 2) end
	end

	-- 2. Aufladen: Licht wird eingesogen, Strahlen drehen sich, die Schale glüht
	onPhase("charge")
	for _, c in ipairs(cracks) do c.Transparency = 0 end
	inward.Rate = 170
	local spin, t2 = 0, 0
	while t2 < D2 do
		local dt = frame()
		t2 = t2 + dt
		t = t + dt
		local k = math.min(1, t2 / D2)
		EggBuilder.SetWobble(eggModel, EggBuilder.WobbleAround(0, math.sin(t * 40) * 0.05 * k))
		shell.Color = shellColor:Lerp(glow, 0.25 + k * 0.75)
		spin = spin + dt * (1 + k * 3)
		placeBeams(spin, 1 - k * 0.6)
		if light then light.Brightness = baseLight * (3 + k * 6) end
	end

	-- 3. Platzen: Blitz, zehn Schalenstücke, Funken, Druckwelle
	onPhase("burst")
	inward.Rate = 0
	EggBuilder.SetWobble(eggModel, CFrame.new())
	local sparks = emitter(core, { Shape = Enum.ParticleEmitterShape.Sphere, Color = ColorSequence.new(glow, Color3.new(1, 1, 1)), Lifetime = NumberRange.new(0.6, 1.3), Speed = NumberRange.new(6, 12 + rank * 1.5), Drag = 2.2, Size = NumberSequence.new(0.55, 0), Acceleration = Vector3.new(0, -6, 0) })
	sparks:Emit(100 + rank * 30)
	local flash = Instance.new("PointLight")
	flash.Color = glow
	flash.Brightness = 10
	flash.Range = 18 + rank * 2
	flash.Parent = core
	tween(flash, 1.2, { Brightness = 0 })
	for _, p in ipairs(deco) do p.Transparency = 1 end
	for _, p in ipairs(cracks) do p.Transparency = 1 end
	for _, e in ipairs(body:GetDescendants()) do
		if e:IsA("ParticleEmitter") then e.Enabled = false end
	end
	shell.Transparency = 1
	eggModel:SetAttribute("Geplatzt", true)
	-- Schalenstücke: zwei Ringe zu je fünf, gewölbt wie die Schale
	local pieces = {}
	local half = EggBuilder.ShellSize / 2
	for band = 0, 1 do
		for j = 0, 4 do
			local th = band == 0 and math.pi * 0.21 or math.pi * 0.5
			local ph = j * TAU / 5 + TAU / 10 + (band == 1 and 0.6 or 0)
			local dir = Vector3.new(-math.cos(ph) * math.sin(th), math.cos(th), math.sin(ph) * math.sin(th)).Unit
			local pos = center + Vector3.new(dir.X * half.X, dir.Y * half.Y, dir.Z * half.Z) * 0.92
			local piece = newPart(folder, { Name = "Schale", Color = shell.Color, Material = shell.Material, Size = Vector3.new(1.7, 0.22, 1.5), CFrame = CFrame.lookAt(pos, pos + dir) * CFrame.Angles(-math.pi / 2, 0, 0) })
			local mesh = Instance.new("SpecialMesh")
			mesh.MeshType = Enum.MeshType.Sphere
			mesh.Parent = piece
			table.insert(pieces, { Part = piece, Vel = dir * (4 + math.random() * 3) + Vector3.new(0, 2.5, 0), Spin = Vector3.new(math.random() - 0.5, math.random() - 0.5, math.random() - 0.5) * 8 })
		end
	end
	local wave = newPart(folder, { Name = "Druckwelle", Shape = Enum.PartType.Cylinder, Material = Enum.Material.Neon, Color = glow, Transparency = 0.1, Size = Vector3.new(0.1, 2, 2), CFrame = origin * CFrame.new(0, EggBuilder.PedestalTop + 0.15, 0) * UP })
	tween(wave, 0.9, { Size = Vector3.new(0.1, 16 + rank * 2, 16 + rank * 2), Transparency = 1 })
	local flying = true
	task.spawn(function()
		local age = 0
		while flying and age < 1.6 do
			local dt = frame()
			age = age + dt
			for _, s in ipairs(pieces) do
				s.Vel = s.Vel + Vector3.new(0, -14 * dt, 0)
				s.Part.CFrame = (s.Part.CFrame + s.Vel * dt) * CFrame.Angles(s.Spin.X * dt, s.Spin.Y * dt, s.Spin.Z * dt)
				s.Part.Transparency = math.min(1, age * 0.9)
			end
			placeBeams(spin + age * 3, math.min(1, 0.4 + age * 1.2))
		end
		for _, s in ipairs(pieces) do s.Part:Destroy() end
		for _, p in ipairs(beams) do p:Destroy() end
	end)
	if light then tween(light, 1, { Brightness = baseLight }) end
	task.wait(0.35)

	-- 4. Enthüllung: Tier wächst mit eineinhalb Drehungen heraus (Überschwingen wie Back-Out)
	onPhase("reveal")
	local petModel = PetBuilder.Build(petId)
	local stand = origin * CFrame.new(0, EggBuilder.PedestalTop, 0)
	for _, p in ipairs(petModel:GetDescendants()) do
		if p:IsA("BasePart") then
			p.Anchored = true
			p.CFrame = stand * p.CFrame
		end
	end
	petModel.Parent = folder
	local scale = scaler(petModel, stand)
	scale(0.01, 0)
	local under = newPart(folder, { Name = "Lichtkranz", Shape = Enum.PartType.Cylinder, Material = Enum.Material.Neon, Color = pet.Epic and Color3.fromRGB(255, 210, 90) or glow, Transparency = 0.4, Size = Vector3.new(0.06, 2.2, 2.2), CFrame = stand * CFrame.new(0, 0.03, 0) * UP })
	tween(under, 0.9, { Size = Vector3.new(0.06, 3.6, 3.6) })
	local glowRing = emitter(core, { Color = ColorSequence.new(pet.Glow), Lifetime = NumberRange.new(1, 1.6), Speed = NumberRange.new(1, 3), SpreadAngle = Vector2.new(180, 180), Size = NumberSequence.new(0.35, 0), Rate = pet.Epic and 30 or 12 })
	core.CFrame = stand * CFrame.new(0, 1.5, 0)
	if pet.Epic then
		local confetti = emitter(core, { Texture = "", LightEmission = 0.3, EmissionDirection = Enum.NormalId.Top, SpreadAngle = Vector2.new(45, 45), Lifetime = NumberRange.new(1.6, 2.6), Speed = NumberRange.new(4, 9), Drag = 0.8, Acceleration = Vector3.new(0, -7, 0), Size = NumberSequence.new(0.3, 0.25), RotSpeed = NumberRange.new(-200, 200), Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromHex("#ff5aa5")), ColorSequenceKeypoint.new(0.25, Color3.fromHex("#ffe07a")), ColorSequenceKeypoint.new(0.5, Color3.fromHex("#5ad1ff")), ColorSequenceKeypoint.new(0.75, Color3.fromHex("#7dff8a")), ColorSequenceKeypoint.new(1, Color3.fromHex("#b49cff")) }) })
		confetti:Emit(180)
	end
	local grow, tr = 0.9, 0
	while tr < grow do
		tr = tr + frame()
		local k = math.min(1, tr / grow)
		local back = 1 + 2.70158 * (k - 1) ^ 3 + 1.70158 * (k - 1) ^ 2
		scale(math.max(0.01, back), (1 - k) * TAU * 1.5)
	end
	scale(1, 0)
	flying = false

	-- 5. Name und Chance
	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.fromOffset(240, 70)
	gui.StudsOffsetWorldSpace = Vector3.new(0, 5.4 + (pet.Epic and 0.6 or 0), 0)
	gui.AlwaysOnTop = true
	gui.Parent = core
	core.CFrame = stand
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
	task.delay(0.8, function()
		glowRing.Rate = pet.Epic and 8 or 0
	end)
	task.spawn(function()
		local t3 = 0
		while under.Parent do
			t3 = t3 + frame()
			under.Transparency = 0.4 + math.sin(t3 * 3) * 0.25
		end
	end)
	onPhase("done")
	return { Folder = folder, Pet = petModel }
end

return HatchFx
`;
