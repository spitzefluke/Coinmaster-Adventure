// Eier für Roblox Studio aus Claude Design „Tier-Eier“: EggBuilder baut jedes Ei als facettierte Schale aus
// Schalenstücken mit leuchtendem Kern, eingesperrt in einen Käfig (Sockel, zwölf Gitterstäbe, Goldringe,
// Kuppel mit Spitze, zwei Ketten und ein Vorhängeschloss), dazu eigene Deko je Ei. EggBuilder.BuildStage baut
// die Bühne: neuneckiger Sockel mit Leuchtkante, Felsbrocken, Boden, Licht und Partikel der Ei-Welt.
// HatchFx spielt das Schlüpfen wie im Design: Schloss springt ab, Ketten fallen, der Käfig öffnet sich,
// das Ei glüht und bebt, platzt in alle Stücke, und das Tier springt heraus und landet.
// Reiner Text wie luau.js, damit es auch in Node prüfbar ist.

const HEADER = (title) => `-- Coinmaster Adventure · ${title}
-- Automatisch erzeugt von der Coinmaster-Webseite. Änderungen besser dort machen
-- und neu übertragen, sonst gehen sie beim nächsten Import verloren.
`;

// Zusätze je Ei (für die Karten der Webseite)
export const EGG_EXTRAS = {
  normal: ['Käfig mit Ketten', 'Vorhängeschloss', 'Staub'],
  wald: ['Moos', 'Fliegenpilze', 'Fallende Blätter'],
  eis: ['Eiskristalle', 'Schneefall'],
  engel: ['Heiligenschein', 'Lichtfunken'],
  galaxie: ['Umlaufbahn mit Mond', 'Sternenstaub'],
  admin: ['Glitch-Würfel', 'Code-Regen'],
  release: ['Partyhut', 'Konfetti'],
};

// Farben und Welt je Ei (aus creature-data.js des Designs)
export const EGG_THEMES = {
  normal: { shell: ['#d9c3a0', '#a88a62'], bg: '#1b1712', glow: '#4a3a26', ped: '#8a6f4e', ped2: '#c9a774', rim: '#f0b75a', ground: '#201b15', key: '#fff1dc', fx: 'dust', fxc: ['#f3d9a8'], deco: [] },
  wald: { shell: ['#7fae5a', '#4b3a2a'], bg: '#0f1a14', glow: '#24452f', ped: '#4b3a2a', ped2: '#5f8a45', rim: '#9be36b', ground: '#121d16', key: '#f4ffe6', fx: 'leaves', fxc: ['#9fd36a', '#d9b34a', '#6fa84a'], deco: ['moss', 'mushrooms'] },
  eis: { shell: ['#cfe6f5', '#6f9cc0'], bg: '#0e1722', glow: '#2a4a66', ped: '#5c7a96', ped2: '#cfe6f5', rim: '#8fe3ff', ground: '#111c28', key: '#eef8ff', fx: 'snow', fxc: ['#e9f6ff'], deco: ['crystals'] },
  engel: { shell: ['#f3eee2', '#e6c77a'], bg: '#1c1a24', glow: '#5a5068', ped: '#d9d2c4', ped2: '#f3eee2', rim: '#ffd77a', ground: '#221f2a', key: '#fff8ea', fx: 'sparkle', fxc: ['#ffe7a8', '#fff6dc'], deco: ['halo'] },
  galaxie: { shell: ['#5a3aa8', '#1c1838'], bg: '#0c0a1c', glow: '#2e2160', ped: '#2b2547', ped2: '#3d3466', rim: '#b48cff', ground: '#100d22', key: '#e6dcff', fx: 'stars', fxc: ['#cdb8ff', '#8fd8ff', '#f2eeff'], deco: ['orbit'] },
  admin: { shell: ['#26393a', '#3dffb0'], bg: '#0a1412', glow: '#123a32', ped: '#1d2a2a', ped2: '#26393a', rim: '#3dffb0', ground: '#0c1816', key: '#e6fff6', fx: 'code', fxc: ['#3dffb0', '#2fd3ff'], deco: ['glitch'] },
  release: { shell: ['#ff9d3d', '#ffd84a'], bg: '#1a1410', glow: '#5a3418', ped: '#3a2f2a', ped2: '#4a3c34', rim: '#ff9d3d', ground: '#1e1712', key: '#fff2e0', fx: 'confetti', fxc: ['#ff9d3d', '#ffd84a', '#7ad7ff', '#ff6f91', '#9b8cff'], deco: ['hat'] },
};

const luaStr = (s) => '"' + s + '"';
const themeLua = () =>
  Object.entries(EGG_THEMES)
    .map(([id, t]) => `\t${id} = { Shell = { ${t.shell.map(luaStr).join(', ')} }, Bg = "${t.bg}", Glow = "${t.glow}", Ped = "${t.ped}", Ped2 = "${t.ped2}", Rim = "${t.rim}", Ground = "${t.ground}", Key = "${t.key}", Fx = "${t.fx}", Fxc = { ${t.fxc.map(luaStr).join(', ')} }, Deco = { ${t.deco.map(luaStr).join(', ')} } },`)
    .join('\n');

export const EGG_BUILDER = `${HEADER('Eier bauen')}
-- EggBuilder.Build(egg) baut das Ei im Käfig als Model. PrimaryPart ist die unsichtbare „Root“ am Boden.
-- Unterteile (für das Schlüpfen): „Ei“ (Schalenstücke „Schale“, Kern, Licht), „Kaefig“ mit „Stab1“–„Stab12“,
-- „Mitte“, „Oben“, „Kette1“, „Kette2“, „Schloss“, dazu „Deko“.
-- EggBuilder.BuildStage(egg) baut die Bühne (Sockel, Boden, Licht, Partikel), die Oberkante liegt auf Höhe 0.
-- Das Ei atmet, schwebt und dreht sich von selbst; für Kopien aus einem Ordner einmal EggBuilder.Start(model).
-- EggBuilder.Pose(model, t, state) stellt alles für einen Zeitpunkt (HatchFx nutzt das beim Schlüpfen).

local RunService = game:GetService("RunService")
local Lighting = game:GetService("Lighting")

local EggBuilder = {}

local S = 2 -- Studs je Einheit des Designs
local EH, ER = 2.3, 0.74 -- Höhe und Radius der Schale (Einheiten)
local TAU = math.pi * 2
local V = Vector3.new
local FLIP = CFrame.Angles(0, math.pi, 0) -- Vorderseite zeigt nach −Z (zur Kamera)
local UP = CFrame.Angles(0, 0, math.pi / 2) -- Zylinder stehen (Achse X → Y)
local IDENT = CFrame.new()

local THEMES = {
${themeLua()}
}
EggBuilder.Themes = THEMES
EggBuilder.Scale = S
EggBuilder.EggHeight = EH * S
EggBuilder.Center = V(0, EH * 0.45 * S, 0)
EggBuilder.PedestalTop = 0
EggBuilder.Height = EH * 1.08 * S + 1

local function hex(c) return type(c) == "string" and Color3.fromHex(c) or c end
local function soften(c, k) return hex(c):Lerp(Color3.fromHex("#ffd49a"), k) end
EggBuilder.Soften = soften

local function eggR(v)
	v = math.clamp(v, 0, 1)
	local y = 2 * v - 1
	return ER * math.sqrt(math.max(0, 1 - y * y)) * (1 - 0.2 * y) * (1 - 0.12 * math.max(0, y) ^ 3)
end
local function cageR(v) return eggR(math.clamp(v, 0.03, 0.97)) * 1.22 + 0.14 end
EggBuilder.EggRadius = function(v) return eggR(v) * S end

-- Aussehen: Farbe, Material, Durchsichtigkeit
local function M(color, material, transparency)
	return { Color = hex(color), Material = Enum.Material[material or "SmoothPlastic"], Transparency = transparency or 0 }
end

-- Lage im Design (Einheiten, Blick nach +Z) → Lage im Model (Studs, Blick nach −Z)
local function toWorld(cf) return FLIP * CFrame.new(cf.Position * S) * cf.Rotation end
EggBuilder.ToWorld = toWorld

local function make(parent, shape, size, cf, m, name)
	local p = Instance.new(shape == "Wedge" and "WedgePart" or "Part")
	p.Name = name or "Teil"
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Color = m.Color
	p.Material = m.Material
	p.Transparency = m.Transparency
	local world = toWorld(cf)
	if shape == "Cyl" then
		p.Shape = Enum.PartType.Cylinder
		p.Size = V(size.Y, size.X, size.Z) * S
		p.CFrame = world * UP
	else
		p.Size = size * S
		p.CFrame = world
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

-- CFrame an Position pos, dessen Y-Achse entlang n zeigt
local function alignY(pos, n)
	n = n.Unit
	local ref = math.abs(n.Y) > 0.95 and Vector3.xAxis or Vector3.yAxis
	local x = ref:Cross(n).Unit
	local z = x:Cross(n).Unit
	return CFrame.fromMatrix(pos, x, n, z)
end

-- Kegel aus zwei gekreuzten Keilpaaren: Fuß bei pos, Spitze entlang dir
local function cone(p, r, h, pos, dir, m, name)
	local base = alignY(pos, dir or Vector3.yAxis) * CFrame.new(0, h / 2, 0)
	for _, ry in ipairs({ 0, math.pi / 2 }) do
		local cf = base * CFrame.Angles(0, ry, 0)
		make(p, "Wedge", V(r * 1.4, h, r), cf * CFrame.new(0, 0, -r / 2), m, name)
		make(p, "Wedge", V(r * 1.4, h, r), cf * CFrame.new(0, 0, r / 2) * CFrame.Angles(0, math.pi, 0), m, name)
	end
end

-- Ring aus Blöcken in der XZ-Ebene von cf (Radius R, Dicke t)
local function ring(p, cf, R, t, m, n, name)
	n = n or math.max(12, math.floor(R * 22))
	local len = TAU * R / n * 1.08
	for i = 0, n - 1 do
		local a = i / n * TAU
		blk(p, V(len, t * 2, t * 2), cf * CFrame.new(math.cos(a) * R, 0, math.sin(a) * R) * CFrame.Angles(0, -a + math.pi / 2, 0), m, name)
	end
end

-- Untermodell mit Drehpunkt (Lage im Design) für das Schlüpfen
local function group(parent, name, pivot)
	local g = Instance.new("Model")
	g.Name = name
	g:SetAttribute("Pivot", toWorld(pivot or IDENT))
	g.Parent = parent
	return g
end

-- ── Deko je Ei (wie DECO im Design; A.Back = sechs Punkte auf dem Käfigsockel) ──
local DECO = {}
function DECO.moss(A)
	for _, p in ipairs(A.Back) do
		local r = 0.16 + A.Rng:NextNumber() * 0.08
		ball(A.Deko, V(r * 2, r * 0.9, r * 2), CFrame.new(p) * CFrame.Angles(0, A.Rng:NextNumber() * TAU, 0), M("#4f8a3a", "Grass"), "Moos")
	end
end
function DECO.mushrooms(A)
	for i, p in ipairs(A.Back) do
		if i == 1 or i == 3 or i == 4 then
			local sc = 0.7 + A.Rng:NextNumber() * 0.6
			local cf = CFrame.new(p) * CFrame.Angles(0, 0, (A.Rng:NextNumber() - 0.5) * 0.5)
			cyl(A.Deko, V(0.09 * sc, 0.2 * sc, 0.09 * sc), cf * CFrame.new(0, 0.1 * sc, 0), M("#efe6d2"), "Pilz")
			ball(A.Deko, V(0.32 * sc, 0.2 * sc, 0.32 * sc), cf * CFrame.new(0, 0.2 * sc, 0), M("#d8453a"), "Pilz")
			for k = 0, 2 do
				local a = k * 2.1
				blk(A.Deko, V(0.05, 0.025, 0.05) * sc, cf * CFrame.new(math.cos(a) * 0.08 * sc, 0.29 * sc, math.sin(a) * 0.08 * sc), M("#f4f1ea"), "Pilz")
			end
		end
	end
end
function DECO.crystals(A)
	local m = M(A.Glow, "Glass", 0.25)
	for _, p in ipairs(A.Back) do
		for _ = 1, 3 do
			local r = A.Rng
			local pos = p + V((r:NextNumber() - 0.5) * 0.2, -0.05, (r:NextNumber() - 0.5) * 0.2)
			cone(A.Deko, 0.05 + r:NextNumber() * 0.05, 0.22 + r:NextNumber() * 0.35, pos, V(r:NextNumber() - 0.5, 1.3, r:NextNumber() - 0.8), m, "Kristall")
		end
	end
end
function DECO.halo(A)
	local g = group(A.Deko, "Heiligenschein", at(0, A.Top + 0.27, 0))
	g:SetAttribute("Anim", "Schweben")
	ring(g, at(0, A.Top + 0.27, 0), 0.24, 0.03, M("#ffe08a", "Neon"), 20, "Heiligenschein")
end
function DECO.hat(A)
	local r = 0.15
	local cf = at(r * 0.3, A.Top + r * 0.9, 0) * CFrame.Angles(0, 0, -0.25)
	cone(A.Deko, r, r * 2, cf.Position, cf.UpVector, M(A.Glow, "Neon"), "Partyhut")
	cyl(A.Deko, V(r * 1.4, r * 0.25, r * 1.4), cf * CFrame.new(0, -r * 0.3 + r * 0.1, 0), M("#f4f1ea"), "Partyhut")
	ball(A.Deko, r * 0.56, cf * CFrame.new(0, r * 2.05, 0), M("#f4f1ea"), "Partyhut")
end
function DECO.orbit(A)
	local y = 1.44
	local tilt = at(0, y, 0) * CFrame.Angles(0.35, 0, 0)
	ring(A.Deko, tilt, 1.25, 0.015, M(A.Glow, "Neon"), 64, "Umlaufbahn")
	local g = group(A.Deko, "Mond", tilt)
	g:SetAttribute("Anim", "Mond")
	ball(g, 0.24, tilt * CFrame.new(1.25, 0, 0), M(A.Rim, "SmoothPlastic"), "Mond")
end
function DECO.glitch(A)
	for i = 1, 9 do
		local r = A.Rng
		local g = group(A.Deko, "Glitch" .. i, IDENT)
		g:SetAttribute("Anim", "Glitch")
		g:SetAttribute("R", 1.1 + r:NextNumber() * 0.6)
		g:SetAttribute("H", 0.3 + r:NextNumber() * 1.8)
		g:SetAttribute("Sp", 0.4 + r:NextNumber() * 0.6)
		g:SetAttribute("Ph", r:NextNumber() * 6)
		blk(g, 0.1, IDENT, M(A.Glow, "Neon"), "Glitch")
	end
end

-- ── Ei mit Käfig ──
function EggBuilder.Build(egg)
	local th = THEMES[egg.Id] or THEMES.normal
	local glow = soften(th.Rim, 0.4)
	local rng = Random.new(#egg.Id * 977 + string.byte(egg.Id, 1))
	local model = Instance.new("Model")
	model.Name = egg.Name
	local root = blk(model, V(0.5, 0.1, 0.5), IDENT, M("#ffffff", "SmoothPlastic", 1), "Root")
	model.PrimaryPart = root

	-- Schale: zehn verdrehte Streifen in sieben Bändern, dunkel facettiert; der Kern leuchtet durch die Fugen
	local ei = group(model, "Ei", at(0, 0.05, 0))
	local core = ball(ei, V(eggR(0.5) * 1.8, EH * 0.9, eggR(0.5) * 1.8), at(0, 0.05 + EH * 0.5, 0), M(glow:Lerp(Color3.new(), 0.35), "Neon"), "Kern")
	local lamp = blk(ei, 0.1, at(0, 0.05 + EH * 0.45, 0), M("#ffffff", "SmoothPlastic", 1), "Licht")
	local light = Instance.new("PointLight")
	light.Color = glow
	light.Brightness = 0.6
	light.Range = 5 * S
	light.Parent = lamp
	local stone = Color3.fromHex("#1d1b20")
	local sectors, cuts = 10, {}
	for k = 1, sectors do
		cuts[k] = {}
		for b, c in ipairs({ 0.14, 0.29, 0.44, 0.59, 0.74, 0.88 }) do cuts[k][b] = c + (rng:NextNumber() - 0.5) * 0.07 end
	end
	for k = 1, sectors do
		for b = 0, 6 do
			local v0 = b == 0 and 0.02 or cuts[k][b]
			local v1 = b == 6 and 0.985 or cuts[k][b + 1]
			local v = (v0 + v1) / 2
			local a = (k - 0.5) / sectors * TAU - v * 0.9
			local r = eggR(v)
			local y = 0.05 + v * EH
			local dr = (eggR(v + 0.01) - eggR(v - 0.01)) / 0.02
			local slope = math.atan2(dr, EH) -- Neigung der Schale gegen die Senkrechte
			local len = math.sqrt(dr * dr + EH * EH) * (v1 - v0)
			local width = TAU * r / sectors
			local twist = math.atan(r * 0.9 / math.sqrt(dr * dr + EH * EH))
			local cf = CFrame.new(math.cos(a) * r, y, math.sin(a) * r) * CFrame.Angles(0, -a + math.pi / 2, 0) * CFrame.Angles(slope, 0, 0) * CFrame.Angles(0, 0, -twist)
			local col = hex(th.Shell[2]):Lerp(hex(th.Shell[1]), b / 6):Lerp(stone, 0.42 + rng:NextNumber() * 0.14)
			local p = blk(ei, V(math.max(0.08, width * 0.92), math.max(0.08, len * 0.9), 0.07), cf, M(col, "SmoothPlastic"), "Schale")
			p.CastShadow = true
		end
	end

	-- Käfig: Sockel, Goldring mit Zacken, zwölf Stäbe, Ringe, Kuppel mit Spitze
	local iron = M(hex(th.Ped):Lerp(Color3.fromHex("#17161a"), 0.6), "Metal")
	local gold = M("#c9a25a", "Metal")
	local cage = group(model, "Kaefig", IDENT)
	local r0, CH = cageR(0.03), EH * 1.08
	local function cy(v) return 0.12 + v * CH - 0.03 * CH end
	cyl(cage, V((r0 + 0.17) * 2, 0.16, (r0 + 0.17) * 2), at(0, 0.08, 0), iron, "Sockel")
	ring(cage, at(0, 0.17, 0), r0 + 0.12, 0.045, gold, 28, "Goldring")
	for i = 0, 11 do
		local a = i / 12 * TAU
		cone(cage, 0.05, 0.12, V(math.cos(a) * (r0 + 0.17), 0.14, math.sin(a) * (r0 + 0.17)), Vector3.yAxis, gold, "Zacke")
	end
	for i = 0, 11 do
		local a = i / 12 * TAU
		local pivot = at(math.cos(a) * r0, 0.12, math.sin(a) * r0) * CFrame.Angles(0, -a, 0)
		local bar = group(cage, "Stab" .. (i + 1), pivot)
		local prev = V(0, 0, 0)
		local N = 8
		for j = 1, N do
			local v = 0.03 + j / N * 0.92
			local q = V(cageR(v) - r0, v * CH - 0.03 * CH, 0)
			local d = q - prev
			blk(bar, V(0.055, d.Magnitude + 0.03, 0.055), pivot * alignY((q + prev) / 2, d), iron, "Stab")
			prev = q
		end
		ball(bar, 0.09, pivot * CFrame.new(prev), gold, "Knauf")
	end
	local midY, topY = cy(0.45), cy(0.95)
	local mid = group(cage, "Mitte", at(0, midY, 0))
	ring(mid, at(0, midY, 0), cageR(0.45) + 0.02, 0.04, gold, 36, "Ring")
	local top = group(cage, "Oben", at(0, topY, 0))
	local tr = cageR(0.95)
	ring(top, at(0, topY, 0), tr + 0.02, 0.035, gold, 22, "Ring")
	ball(top, V((tr + 0.06) * 2, (tr + 0.06) * 1.2, (tr + 0.06) * 2), at(0, topY + 0.02, 0), iron, "Kuppel")
	cone(top, 0.07, 0.3, V(0, topY + tr * 0.7 + 0.03, 0), Vector3.yAxis, gold, "Spitze")
	ball(top, 0.14, at(0, topY + tr * 0.7 + 0.03, 0), gold, "Spitze")

	-- zwei Ketten, schräg ums Ei gewickelt, und das Schloss vorne
	local FA = 0.92
	local chainM = M("#6b6a70", "Metal")
	for c = 0, 1 do
		local g = group(cage, "Kette" .. (c + 1), IDENT)
		local function pt(u)
			local v = 0.18 + u * 0.6
			local ang = FA + (c == 1 and -1 or 1) * (u - 0.5) * TAU
			local r = cageR(v) + 0.07
			return V(math.cos(ang) * r, cy(v), math.sin(ang) * r)
		end
		local N = 30
		for k = 0, N - 1 do
			local p, q = pt(k / N), pt(k / N + 0.01)
			local cf = CFrame.lookAt(p, q) * CFrame.Angles(0, 0, k % 2 == 1 and math.pi / 2 or 0)
			blk(g, V(0.035, 0.11, 0.17), cf, chainM, "Glied")
		end
	end
	local lv = 0.48
	local lr = cageR(lv) + 0.17
	local lp = V(math.cos(FA) * lr, cy(lv), math.sin(FA) * lr)
	local lockCf = CFrame.lookAt(lp, lp * V(2, 1, 2))
	local lock = group(cage, "Schloss", lockCf)
	blk(lock, V(0.3, 0.26, 0.1), lockCf * CFrame.new(0, -0.04, 0), gold, "Schloss")
	blk(lock, V(0.05, 0.09, 0.03), lockCf * CFrame.new(0, -0.06, -0.055), M("#1a1410"), "Schlüsselloch")
	for i = 0, 6 do
		local a = i / 6 * math.pi
		blk(lock, V(0.03, 0.05, 0.04), lockCf * CFrame.new(math.cos(a) * 0.09, 0.09 + math.sin(a) * 0.09, 0) * CFrame.Angles(0, 0, a), M("#8a8a90", "Metal"), "Bügel")
	end

	-- Deko
	local deko = Instance.new("Model")
	deko.Name = "Deko"
	deko.Parent = cage
	local back = {}
	for i = 0, 5 do
		local a = i / 6 * TAU + 0.5
		table.insert(back, V(math.cos(a) * (r0 + 0.08), 0.17, math.sin(a) * (r0 + 0.08)))
	end
	local A = { Deko = deko, Back = back, Top = topY + 0.3, Glow = glow, Rim = th.Rim, Rng = rng }
	for _, d in ipairs(th.Deco) do
		if DECO[d] then DECO[d](A) end
	end

	model:SetAttribute("EggId", egg.Id)
	EggBuilder.Start(model)
	return model
end

-- ── Bühne: Sockel, Boden, Licht und Partikel der Ei-Welt ──
local FX = {
	dust = { V = 0.12, Size = 0.05, Glow = true },
	leaves = { V = -0.35, Size = 0.1, Square = true },
	snow = { V = -0.3, Size = 0.07 },
	sparkle = { V = 0.25, Size = 0.07, Glow = true, Twinkle = true },
	stars = { V = 0.03, Size = 0.06, Glow = true, Twinkle = true },
	code = { V = 0.4, Size = 0.08, Square = true, Glow = true },
	confetti = { V = -0.45, Size = 0.12, Square = true },
	bubbles = { V = 0.45, Size = 0.13 },
}

-- Neuneck aus Blöcken (Apothem R, Höhe h)
local function ngon(p, y, R, h, m, n, name)
	n = n or 9
	local chord = 2 * R * math.tan(math.pi / n) + 0.02
	for i = 0, n - 1 do
		local a = i / n * TAU
		blk(p, V(chord, h, R), at(math.cos(a) * R * 0.5, y, math.sin(a) * R * 0.5) * CFrame.Angles(0, math.pi / 2 - a, 0), m, name)
	end
end

local function colors(list)
	local keys = {}
	for i, c in ipairs(list) do
		table.insert(keys, ColorSequenceKeypoint.new(#list == 1 and 0 or (i - 1) / (#list - 1), hex(c)))
	end
	if #keys == 1 then return ColorSequence.new(keys[1].Value) end
	return ColorSequence.new(keys)
end

function EggBuilder.BuildStage(egg)
	local th = THEMES[egg.Id] or THEMES.normal
	local rng = Random.new(#egg.Id * 131 + 7)
	local model = Instance.new("Model")
	model.Name = "Buehne"
	local root = blk(model, V(0.5, 0.1, 0.5), IDENT, M("#ffffff", "SmoothPlastic", 1), "Root")
	model.PrimaryPart = root

	ngon(model, -0.29, 2.05, 0.42, M(th.Ped, "Slate"), 9, "Sockel")
	local h, s, l = hex(th.Ped2):ToHSV()
	local topColor = Color3.fromHSV(h, math.min(s, 0.5), math.min(l, 0.42))
	ngon(model, -0.05, 1.86, 0.1, M(topColor, "SmoothPlastic"), 9, "Platte")
	-- Leuchtkante rundherum
	local R = 1.95
	local chord = 2 * R * math.tan(math.pi / 9)
	for i = 0, 8 do
		local a = i / 9 * TAU
		blk(model, V(chord, 0.04, 0.04), at(math.cos(a) * R, -0.08, math.sin(a) * R) * CFrame.Angles(0, math.pi / 2 - a, 0), M(th.Rim, "Neon"), "Leuchtkante")
	end
	for i = 0, 7 do
		local a = i / 8 * TAU + rng:NextNumber() * 0.4
		local r = 2.25 + rng:NextNumber() * 0.3
		local sz = 0.28 + rng:NextNumber() * 0.36
		blk(model, V(sz, sz * 0.85, sz * 1.1), at(math.cos(a) * r, -0.42, math.sin(a) * r, rng:NextNumber(), rng:NextNumber() * 3, 0), M(th.Ped, "Slate"), "Fels")
	end
	cyl(model, V(28, 0.04, 28), at(0, -0.52, 0), M(th.Ground, "SmoothPlastic"), "Boden")

	-- Licht: warmes Hauptlicht schräg vorne, Kantenlicht hinten, Leuchten am Sockel
	local function lamp(pos, color, brightness, range, name)
		local p = blk(model, 0.1, CFrame.new(pos), M("#ffffff", "SmoothPlastic", 1), name)
		local l = Instance.new("PointLight")
		l.Color = hex(color)
		l.Brightness = brightness
		l.Range = range
		l.Shadows = name == "Hauptlicht"
		l.Parent = p
		return l
	end
	lamp(V(3, 6, 4) * 0.55, th.Key, 1.6, 22, "Hauptlicht")
	lamp(V(-4, 3, -5) * 0.5, th.Rim, 1.4, 16, "Kantenlicht")
	lamp(V(0, 0.4, 2.6), th.Rim, 2, 14, "Sockellicht")

	-- Partikel der Welt (Staub, Blätter, Schnee, Funken, Sterne, Code, Konfetti, Blasen)
	local fx = FX[th.Fx] or FX.dust
	local host = blk(model, V(8, 5, 8), at(0, 2.2, 0), M("#ffffff", "SmoothPlastic", 1), "Partikel")
	local e = Instance.new("ParticleEmitter")
	e.Name = "Welt"
	e.Texture = fx.Square and "" or "rbxasset://textures/particles/sparkles_main.dds"
	e.Color = colors(th.Fxc)
	e.LightEmission = fx.Glow and 1 or 0.2
	e.Size = NumberSequence.new(fx.Size * S * (fx.Square and 1 or 1.6))
	e.Transparency = fx.Twinkle and NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.2, 0.1), NumberSequenceKeypoint.new(0.5, 0.6), NumberSequenceKeypoint.new(0.8, 0.1), NumberSequenceKeypoint.new(1, 1) }) or NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.15, 0.1), NumberSequenceKeypoint.new(0.85, 0.1), NumberSequenceKeypoint.new(1, 1) })
	e.EmissionDirection = fx.V >= 0 and Enum.NormalId.Top or Enum.NormalId.Bottom
	e.Speed = NumberRange.new(math.abs(fx.V) * S * 0.6, math.abs(fx.V) * S * 1.4)
	e.SpreadAngle = Vector2.new(12, 12)
	e.Lifetime = NumberRange.new(3, 6)
	e.Rate = 26
	e.RotSpeed = fx.Square and NumberRange.new(-120, 120) or NumberRange.new(0, 0)
	e.Rotation = NumberRange.new(0, 360)
	e.Parent = host

	model:SetAttribute("EggId", egg.Id)
	return model
end

-- Licht und Nebel der Ei-Welt setzen (für eine eigene Schlupf-Bühne); gibt eine Funktion zum Zurücksetzen zurück
function EggBuilder.ApplyEnvironment(egg)
	local th = THEMES[egg.Id] or THEMES.normal
	local old = { FogColor = Lighting.FogColor, FogStart = Lighting.FogStart, FogEnd = Lighting.FogEnd, Ambient = Lighting.Ambient, OutdoorAmbient = Lighting.OutdoorAmbient }
	Lighting.FogColor = hex(th.Bg)
	Lighting.FogStart = 10 * S
	Lighting.FogEnd = 22 * S
	Lighting.Ambient = hex(th.Glow)
	Lighting.OutdoorAmbient = hex(th.Glow):Lerp(hex(th.Key), 0.3)
	return function()
		for k, v in pairs(old) do Lighting[k] = v end
	end
end

-- ── Bewegung ──
local records = setmetatable({}, { __mode = "k" })

local function rig(model)
	local rec = records[model]
	if rec then return rec end
	rec = { Root = model.PrimaryPart, Groups = {}, Anims = {} }
	local inv = rec.Root.CFrame:Inverse()
	local function collect(g)
		local pivot = g:GetAttribute("Pivot") or IDENT
		local e = { Model = g, Pivot = pivot, Parts = {} }
		local pinv = pivot:Inverse()
		for _, p in ipairs(g:GetDescendants()) do
			if p:IsA("BasePart") then table.insert(e.Parts, { Part = p, Offset = pinv * inv * p.CFrame, Size = p.Size }) end
		end
		return e
	end
	local ei = model:FindFirstChild("Ei")
	local cage = model:FindFirstChild("Kaefig")
	if ei then rec.Groups.Ei = collect(ei) end
	if cage then
		for _, name in ipairs({ "Mitte", "Oben", "Kette1", "Kette2", "Schloss" }) do
			local g = cage:FindFirstChild(name)
			if g then rec.Groups[name] = collect(g) end
		end
		rec.Bars = {}
		for i = 1, 12 do
			local g = cage:FindFirstChild("Stab" .. i)
			if g then table.insert(rec.Bars, collect(g)) end
		end
		local deko = cage:FindFirstChild("Deko")
		if deko then
			for _, g in ipairs(deko:GetChildren()) do
				if g:IsA("Model") and g:GetAttribute("Anim") then
					local e = collect(g)
					e.Kind = g:GetAttribute("Anim")
					e.Attrs = g:GetAttributes()
					table.insert(rec.Anims, e)
				end
			end
		end
		rec.Cage = collect(cage)
	end
	for _, p in ipairs(ei and ei:GetDescendants() or {}) do
		if p.Name == "Kern" then rec.Core = p end
		if p:IsA("PointLight") then rec.Light = p end
	end
	rec.CoreColor = rec.Core and rec.Core.Color
	records[model] = rec
	return rec
end
EggBuilder.Rig = rig

-- Gruppe stellen: a = Bewegung um den Drehpunkt (Studs), k = Größe, spread = Abstände der Teile (Zahl oder Vector3)
local function place(rec, e, a, k, spread)
	if not e then return end
	local base = rec.Root.CFrame * e.Pivot * a
	k = k or 1
	spread = spread or k
	for _, it in ipairs(e.Parts) do
		local o = it.Offset
		it.Part.CFrame = base * CFrame.new(o.Position * spread) * o.Rotation
		if it.K ~= k then
			it.K = k
			it.Part.Size = it.Size * math.max(k, 0.01)
		end
	end
end
EggBuilder.Place = place

local function easeOutBack(x)
	local c1 = 1.70158
	return 1 + (c1 + 1) * (x - 1) ^ 3 + c1 * (x - 1) ^ 2
end
EggBuilder.EaseOutBack = easeOutBack

local ANIMS = {}
function ANIMS.Schweben(t) return CFrame.new(0, math.sin(t * 2) * 0.03 * S, 0) end
function ANIMS.Mond(t) return CFrame.Angles(0, -t * 0.8, 0) end
function ANIMS.Glitch(t, g, rec)
	local a = t * g.Sp + g.Ph
	local pos = V(math.cos(a) * g.R, g.H + math.sin(t * 2 + g.Ph) * 0.1, math.sin(a) * g.R) * S
	return CFrame.new(pos) * CFrame.Angles(t, t * 0.7, 0), math.sin(t * 7 + g.Ph) > -0.8
end

-- Alles für Zeit t stellen. state (optional): Shake, Push, Squash, Hop, Glow (0–1), Lock (Zeit seit Start),
-- Bars (0–1 offen). Ohne state: Ruhe (atmen, schweben, drehen, Herzschlag im Kern).
function EggBuilder.Pose(model, t, state)
	local rec = rig(model)
	state = state or {}
	local sh, push, sq, hop = state.Shake or 0, state.Push or 0, state.Squash or 0, state.Hop or 0
	local hatching = state.Lock ~= nil
	local hb = hatching and 0 or math.max(0, math.sin(t * 2.1)) ^ 24
	local br = math.sin(t * 2) * 0.018 * (1 - sh) + hb * 0.035
	local y = math.sin(t * 1.6) * 0.03 * (1 - sh) + hop * (1 - sq)
	local rz = math.sin(t * (3 + sh * 30)) * (0.012 + sh * 0.12) + hb * math.sin(t * 30) * 0.04
	local rx = math.cos(t * (2.5 + sh * 26)) * sh * 0.07
	local a = CFrame.new(0, y * S, 0) * CFrame.Angles(rx, t * 0.25, rz)
	local spread = V(1 + br + sq * 0.1, 1 - br - sq * 0.15, 1 + br + sq * 0.1) * (1 + push * 0.05)
	place(rec, rec.Groups.Ei, a, 1, spread)
	if rec.Core then
		local ci = hatching and 0.38 + (state.Glow or 0) * 1.6 or 0.38 + math.sin(t * 2) * 0.1 + hb * 0.35
		rec.Core.Color = rec.CoreColor:Lerp(Color3.new(1, 0.97, 0.9), math.clamp((ci - 0.3) / 1.8, 0, 1))
	end
	if rec.Light then rec.Light.Brightness = hatching and 0.6 + (state.Glow or 0) * 3.4 or 0.6 + math.sin(t * 2) * 0.2 end

	-- Schloss, Ketten, Stäbe, Ringe
	local T = state.Lock
	if T then
		local lock = rec.Groups.Schloss
		if T < 0.8 then
			place(rec, lock, CFrame.Angles(0, 0, math.sin(T * 40) * 0.18 * (T / 0.8)))
		elseif lock then
			local d = T - 0.8
			local out = lock.Pivot.Position * V(0.6, 0, 0.6) / S
			local p = V(out.X * d, 1.4 * d - 4.9 * d * d, out.Z * d) * S
			local gone = lock.Pivot.Position.Y / S + p.Y / S < -0.4
			place(rec, lock, CFrame.new(lock.Pivot.Rotation:Inverse() * p) * CFrame.Angles(d * 7, 0, 0), gone and 0.01 or 1)
		end
		local cd = math.max(0, T - 0.8)
		for _, n in ipairs({ "Kette1", "Kette2" }) do
			place(rec, rec.Groups[n], CFrame.new(0, -cd * cd * 3 * S, 0), math.max(0.01, 1 - cd * 1.4))
		end
		local op = easeOutBack(math.clamp((T - 1) / 0.8, 0, 1))
		for _, bar in ipairs(rec.Bars) do place(rec, bar, CFrame.Angles(0, 0, -op * 1.0)) end
		place(rec, rec.Groups.Oben, CFrame.new(0, op * 0.7 * S, 0), math.max(0.01, 1 - op))
		place(rec, rec.Groups.Mitte, IDENT, math.max(0.01, 1 - op))
	end

	for _, e in ipairs(rec.Anims) do
		local cf, visible = ANIMS[e.Kind](t, e.Attrs, rec)
		place(rec, e, cf)
		if visible ~= nil then
			for _, it in ipairs(e.Parts) do it.Part.Transparency = visible and 0 or 1 end
		end
	end
end

-- Bewegung starten (beim Bauen automatisch; für Kopien aus einem Ordner selbst aufrufen)
function EggBuilder.Start(model)
	if model:GetAttribute("Animated") then return end
	model:SetAttribute("Animated", true)
	local start = os.clock()
	local connection
	connection = RunService.Heartbeat:Connect(function()
		if model.Parent and not model:GetAttribute("Hatching") then EggBuilder.Pose(model, os.clock() - start) end
	end)
	model.Destroying:Connect(function() connection:Disconnect() end)
end

return EggBuilder
`;

export const HATCH_FX = `${HEADER('Schlüpfen')}
-- HatchFx.Play(eggId, petId, options) spielt das Schlüpfen wie im Design „Tier-Eier“
-- (options.CFrame = Oberkante der Bühne, options.Parent = Elternteil, Standard workspace,
--  options.Stage = false: ohne Bühne, options.Lighting = true: Licht und Nebel der Ei-Welt setzen):
--   unlock  Schloss zittert und springt ab, Ketten fallen, die Gitterstäbe klappen auf, die Kuppel hebt sich
--   charge  das Ei glüht von innen, bebt immer stärker, Funken sprühen aus den Fugen, zuletzt staucht es sich
--   burst   die Schale platzt in alle Stücke, Blitz, Druckwelle, Funkenregen (selten: Lichtstrahlen),
--           der Käfig versinkt im Sockel, das Tier springt heraus
--   reveal  das Tier landet mit Staubring und federt nach; seltene Tiere bekommen ihren Auftritt
--           (Leuchten, Ring am Boden, Lichtsäule mit Splittern, Bahnen)
--   done    Name und Chance stehen über dem Tier
-- options.OnPhase(name) meldet die Abschnitte. Gibt { Folder, Pet } zurück, sobald das Tier steht.

local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local EggData = require(script.Parent.EggData)
local PetData = require(script.Parent.PetData)
local EggBuilder = require(script.Parent.EggBuilder)
local PetBuilder = require(script.Parent.PetBuilder)

local HatchFx = {}

local TAU = math.pi * 2
local S = EggBuilder.Scale
local HATCH_T = 3.4
local V = Vector3.new
local UP = CFrame.Angles(0, 0, math.pi / 2)

local function tween(inst, time, goal, style, dir)
	local t = TweenService:Create(inst, TweenInfo.new(time, style or Enum.EasingStyle.Quad, dir or Enum.EasingDirection.Out), goal)
	t:Play()
	return t
end

local function frame()
	return RunService.Heartbeat:Wait()
end

local function newPart(parent, props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
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
	for key, value in pairs(props) do e[key] = value end
	e.Parent = parent
	return e
end

-- Modell um seinen Fußpunkt skalieren und drehen (k = Größe, sx/sy = Stauchen, lift = Sprunghöhe)
local function scaler(model, pivot)
	local parts = {}
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") then table.insert(parts, { Part = p, Offset = pivot:ToObjectSpace(p.CFrame), Size = p.Size }) end
	end
	return function(k, turn, lift, sx, sy)
		sx, sy = sx or 1, sy or 1
		local base = pivot * CFrame.new(0, lift or 0, 0) * CFrame.Angles(0, turn or 0, 0)
		local f = V(k * sx, k * sy, k * sx)
		for _, e in ipairs(parts) do
			local o = e.Offset
			e.Part.Size = e.Size * math.max(k, 0.01)
			e.Part.CFrame = base * CFrame.new(o.Position * f) * o.Rotation
		end
	end
end

-- Ring aus Leuchtblöcken (für Druckwelle und Staubring)
local function glowRing(parent, cf, color, n)
	local parts = {}
	for i = 1, n do
		parts[i] = newPart(parent, { Name = "Welle", Material = Enum.Material.Neon, Color = color, Size = V(0.4, 0.06, 0.12) })
	end
	return function(r, transparency)
		for i, p in ipairs(parts) do
			local a = (i - 1) / n * TAU
			p.Size = V(TAU * r / n * 1.05, 0.06, 0.12 + r * 0.02)
			p.CFrame = cf * CFrame.new(math.cos(a) * r, 0, math.sin(a) * r) * CFrame.Angles(0, -a + math.pi / 2, 0)
			p.Transparency = transparency
		end
	end, parts
end

local function tierOf(pet)
	for i, p in ipairs(PetData.ByEgg[pet.Egg] or {}) do
		if p.Id == pet.Id then return i - 1 end
	end
	return pet.Epic and 5 or 0
end

function HatchFx.Play(eggId, petId, options)
	options = options or {}
	local egg = EggData.ById[eggId]
	local pet = PetData.ById[petId]
	local origin = options.CFrame or CFrame.new()
	local onPhase = options.OnPhase or function() end
	local theme = EggBuilder.Themes[eggId] or EggBuilder.Themes.normal
	local glow = EggBuilder.Soften(theme.Rim, 0.4)
	local tier = tierOf(pet)
	local big = 1 + tier * 0.1
	local folder = Instance.new("Folder")
	folder.Name = "Schluepfen"
	folder.Parent = options.Parent or workspace
	local restore
	if options.Lighting then restore = EggBuilder.ApplyEnvironment(egg) end
	folder.Destroying:Connect(function() if restore then restore() end end)

	-- Bühne und Ei im Käfig
	if options.Stage ~= false then
		local stage = EggBuilder.BuildStage(egg)
		stage:PivotTo(origin)
		stage.Parent = folder
	end
	local eggModel = EggBuilder.Build(egg)
	eggModel:SetAttribute("Hatching", true)
	eggModel:PivotTo(origin)
	eggModel.Parent = folder
	local rec = EggBuilder.Rig(eggModel)
	local center = origin * EggBuilder.Center

	-- Funken aus den Fugen (Rate wächst mit dem Glühen)
	local core = newPart(folder, { Name = "Mitte", Transparency = 1, Size = V(1.2, 1.2, 1.2) * S, CFrame = CFrame.new(center) })
	local seep = emitter(core, { Shape = Enum.ParticleEmitterShape.Sphere, ShapeStyle = Enum.ParticleEmitterShapeStyle.Surface, Color = ColorSequence.new(Color3.fromHex("#ffc27a"):Lerp(glow, 0.3)), Lifetime = NumberRange.new(0.5, 1.4), Speed = NumberRange.new(2, 5), Drag = 0.8, Acceleration = V(0, -10, 0), Size = NumberSequence.new(0.18, 0) })

	-- 1. Aufschließen und 2. Aufladen (zusammen 3,4 s wie im Design)
	onPhase("unlock")
	local T, charging = 0, false
	while T < HATCH_T do
		T = T + frame()
		local p = math.clamp((T - 1.4) / (HATCH_T - 1.4), 0, 1)
		if p > 0 and not charging then
			charging = true
			onPhase("charge")
		end
		local sh = p * p
		local tl = HATCH_T - T
		EggBuilder.Pose(eggModel, T, {
			Lock = T,
			Shake = sh,
			Push = p,
			Glow = sh,
			Hop = math.max(0, math.sin(T * 7)) * 0.1 * sh,
			Squash = tl < 0.35 and 1 - math.max(0, tl) / 0.35 or 0,
		})
		seep.Rate = p * 120
	end

	-- 3. Platzen
	onPhase("burst")
	seep.Rate = 0
	if rec.Core then rec.Core.Transparency = 1 end
	local chunks = {}
	for _, it in ipairs(rec.Groups.Ei.Parts) do
		local part = it.Part
		if part.Name == "Schale" then
			local d = (part.Position - center)
			d = (d.Magnitude > 0.01 and d.Unit or V(0, 1, 0)) * (2.2 + math.random() * 2.6) + V(0, 1.8 + math.random() * 2.2, 0)
			table.insert(chunks, { Part = part, Vel = d * S, Spin = V((math.random() - 0.5) * 10, 0, (math.random() - 0.5) * 10), Size = part.Size })
		end
	end
	local floorY = origin.Position.Y + 0.06
	local cageScale = rec.Cage and scaler(rec.Cage.Model, origin)
	local deko = rec.Cage and rec.Cage.Model:FindFirstChild("Deko")
	if deko then
		for _, p in ipairs(deko:GetDescendants()) do
			if p:IsA("BasePart") then p.Transparency = 1 end
		end
	end

	local flash = newPart(folder, { Name = "Blitz", Shape = Enum.PartType.Ball, Material = Enum.Material.Neon, Color = Color3.fromHex("#fff4e0"):Lerp(glow, 0.5), Transparency = 0.55, Size = V(0.6, 0.6, 0.6) * S, CFrame = origin * CFrame.new(0, 1 * S, 0) })
	local wave = glowRing(folder, origin * CFrame.new(0, 0.06 * S, 0), glow, 32)
	wave(0.8 * S, 0.3)
	local sparks = emitter(core, { Shape = Enum.ParticleEmitterShape.Sphere, Color = ColorSequence.new(Color3.fromHex("#ffc27a"):Lerp(glow, 0.35)), Lifetime = NumberRange.new(0.5, 1.4), Speed = NumberRange.new(2.5 * S, (2.5 + 4.5 * big) * S), Drag = 1.6, Acceleration = V(0, -5 * S, 0), Size = NumberSequence.new(0.3, 0), SpreadAngle = Vector2.new(180, 180) })
	sparks:Emit(110 + tier * 20)
	local boom = Instance.new("PointLight")
	boom.Color = glow
	boom.Brightness = 8
	boom.Range = 9 * S
	boom.Parent = core
	tween(boom, 1.4, { Brightness = 0 })

	-- seltene Tiere (ab Stufe 3): Lichtstrahlen hinter dem Ei
	local rays = {}
	if tier >= 3 then
		for i = 1, 8 + tier do
			rays[i] = newPart(folder, { Name = "Strahl", Material = Enum.Material.Neon, Color = glow, Transparency = 1, Size = V(0.25, 6 * S * 0.5, 0.25) })
		end
	end
	local function placeRays(spin, transparency)
		for i, p in ipairs(rays) do
			local a = (i - 1) / #rays * TAU + spin
			p.CFrame = origin * CFrame.new(0, 1.3 * S, 1.6 * S) * CFrame.Angles(0, 0, a) * CFrame.new(0, 1.5 * S, 0)
			p.Transparency = transparency
		end
	end

	local flying = true
	task.spawn(function()
		local age = 0
		while flying or age < 3.2 do
			local dt = frame()
			age = age + dt
			for _, c in ipairs(chunks) do
				c.Vel = c.Vel + V(0, -9.8 * S * dt, 0)
				local pos = c.Part.Position + c.Vel * dt
				if pos.Y < floorY and c.Vel.Y < 0 then
					pos = V(pos.X, floorY, pos.Z)
					c.Vel = V(c.Vel.X * 0.6, -c.Vel.Y * 0.35, c.Vel.Z * 0.6)
				end
				local k = math.clamp(1 - (age - 1.3) / 0.8, 0, 1)
				c.Part.Size = c.Size * math.max(0.01, k)
				c.Part.CFrame = CFrame.new(pos) * (c.Part.CFrame - c.Part.Position) * CFrame.Angles(c.Spin.X * dt, 0, c.Spin.Z * dt)
				if k <= 0 then c.Part.Transparency = 1 end
			end
			if rec.Light then rec.Light.Brightness = math.max(0, 4 * (1 - age * 2)) end
			local ck = math.min(1, age / 0.7)
			if cageScale then cageScale(math.max(0.01, 1 - ck), 0, -ck * ck * 1.2 * S) end
			local kf = math.min(1, age / 0.5)
			flash.Size = V(1, 1, 1) * math.min(1.8, (0.3 + kf * 1.6) * big) * S * 1.2
			flash.Transparency = 0.55 + 0.45 * kf
			local kw = math.min(1, age / 1)
			wave((0.8 + kw * 3.2 * big) * S, 0.3 + 0.7 * kw)
			if #rays > 0 then
				local kr = math.min(1, age / 3.2)
				local op = (kr < 0.12 and kr / 0.12 or 1 - (kr - 0.12) / 0.88) * (0.14 + tier * 0.04) * 2.4
				placeRays(kr * 1.1, 1 - math.clamp(op, 0, 0.85))
			end
			if age > 2.2 and eggModel.Parent then eggModel:Destroy() end
		end
		flash:Destroy()
		for _, p in ipairs(rays) do p:Destroy() end
	end)

	-- Das Tier springt heraus (0,8 s, Überschwingen, Drehung, Sprungbogen)
	local petModel = PetBuilder.Build(petId)
	for _, p in ipairs(petModel:GetDescendants()) do
		if p:IsA("BasePart") then
			p.Anchored = true
			p.CFrame = origin * p.CFrame
		end
	end
	petModel.Parent = folder
	local scale = scaler(petModel, origin)
	scale(0.01, 0)
	local t2 = 0
	while t2 < 0.8 do
		t2 = t2 + frame()
		local p = math.min(1, t2 / 0.8)
		scale(math.max(0.01, EggBuilder.EaseOutBack(p)), (1 - p) * -2.4, math.sin(math.pi * p) * 1.1 * S)
	end
	scale(1, 0)

	-- 4. Landung: Staubring, Staub, Nachfedern
	onPhase("reveal")
	local dust, dustParts = glowRing(folder, origin * CFrame.new(0, 0.04 * S, 0), Color3.fromHex("#d8cfc0"), 28)
	for _, p in ipairs(dustParts) do p.Material = Enum.Material.SmoothPlastic end
	local puff = emitter(core, { Texture = "rbxasset://textures/particles/smoke_main.dds", LightEmission = 0, Color = ColorSequence.new(Color3.fromHex("#e8dccb")), Lifetime = NumberRange.new(0.5, 0.9), Speed = NumberRange.new(2 * S, 4 * S), SpreadAngle = Vector2.new(80, 10), EmissionDirection = Enum.NormalId.Top, Drag = 3, Size = NumberSequence.new(0.5, 1.2), Transparency = NumberSequence.new(0.4, 1) })
	core.CFrame = origin * CFrame.new(0, 0.1 * S, 0)
	puff:Emit(30)
	local tl = 0
	while tl < 0.6 do
		tl = tl + frame()
		local k = math.min(1, tl / 0.4)
		local a = math.sin(k * math.pi * 2.5) * (1 - k) * 0.2
		scale(1, 0, 0, 1 + a, 1 - a * 1.4)
		local kd = math.min(1, tl / 0.6)
		dust((0.6 + kd * 2.2) * S, 0.65 + 0.35 * kd)
	end
	scale(1, 0)
	for _, p in ipairs(dustParts) do p:Destroy() end
	flying = false

	-- Auftritt seltener Tiere (wie „epic“ im Design)
	local col = pet.Glow or glow
	if tier >= 3 then
		local pl = Instance.new("PointLight")
		pl.Color = col
		pl.Brightness = 0.8 + tier * 0.3
		pl.Range = 6 * S
		pl.Parent = core
		core.CFrame = origin * CFrame.new(0, 1.3 * S, -0.7 * S)
	end
	local spinners = {}
	if tier >= 4 then
		local parts = {}
		for i = 0, 17 do
			parts[i + 1] = newPart(folder, { Name = "Auftritt", Material = Enum.Material.Neon, Color = col, Size = V(i % 2 == 1 and 0.1 or 0.24, 0.03, 0.06) * S })
		end
		table.insert(spinners, function(t)
			for i, p in ipairs(parts) do
				local a = (i - 1) / 18 * TAU + t * 0.4
				p.CFrame = origin * CFrame.new(math.cos(a) * 1.68 * S, 0.06 * S, math.sin(a) * 1.68 * S) * CFrame.Angles(0, -a + math.pi / 2, 0)
			end
		end)
	end
	if tier >= 5 then
		local beam = newPart(folder, { Name = "Lichtsaeule", Shape = Enum.PartType.Cylinder, Material = Enum.Material.Neon, Color = col, Transparency = 0.93, Size = V(5.5 * S, 2.3 * S, 2.3 * S), CFrame = origin * CFrame.new(0, 2.75 * S, 0) * UP })
		local shards = {}
		for i = 1, tier >= 6 and 16 or 10 do
			shards[i] = { Part = newPart(folder, { Name = "Splitter", Material = Enum.Material.Neon, Color = col, Size = V(0.06, 0.14, 0.06) * S }), R = 1.75 + math.random() * 0.5, H = 0.3 + math.random() * 2.4, Sp = 0.3 + math.random() * 0.6, Ph = math.random() * 6 }
		end
		table.insert(spinners, function(t)
			beam.Transparency = 0.92 + 0.03 * math.sin(t * 1.7)
			for _, s in ipairs(shards) do
				local a = t * s.Sp + s.Ph
				s.Part.CFrame = origin * CFrame.new(math.cos(a) * s.R * S, (s.H + math.sin(t * 1.3 + s.Ph) * 0.15) * S, math.sin(a) * s.R * S) * CFrame.Angles(0, t * 2, 0)
			end
		end)
	end
	if tier >= 6 then
		local r2, r3 = {}, {}
		for i = 1, 40 do
			r2[i] = newPart(folder, { Name = "Bahn", Material = Enum.Material.Neon, Color = col, Transparency = 0.6, Size = V(0.32, 0.03, 0.03) * S })
			r3[i] = newPart(folder, { Name = "Bahn", Material = Enum.Material.Neon, Color = col, Transparency = 0.75, Size = V(0.35, 0.025, 0.025) * S })
		end
		table.insert(spinners, function(t)
			local c2 = origin * CFrame.new(0, 0.55 * S, 0) * CFrame.Angles(math.sin(t * 0.7) * 0.12, t * 0.5, 0)
			local c3 = origin * CFrame.new(0, 0.3 * S, 0) * CFrame.Angles(math.cos(t * 0.6) * 0.14, -t * 0.4, 0)
			for i = 1, 40 do
				local a = (i - 1) / 40 * TAU
				r2[i].CFrame = c2 * CFrame.new(math.cos(a) * 2.0 * S, 0, math.sin(a) * 2.0 * S) * CFrame.Angles(0, -a + math.pi / 2, 0)
				r3[i].CFrame = c3 * CFrame.new(math.cos(a) * 2.2 * S, 0, math.sin(a) * 2.2 * S) * CFrame.Angles(0, -a + math.pi / 2, 0)
			end
		end)
	end
	if #spinners > 0 then
		task.spawn(function()
			local t = 0
			while folder.Parent do
				t = t + frame()
				for _, f in ipairs(spinners) do f(t) end
			end
		end)
	end

	-- 5. Name und Chance
	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.fromOffset(240, 70)
	gui.StudsOffsetWorldSpace = V(0, 6.4, 0)
	gui.AlwaysOnTop = true
	gui.Adornee = core
	gui.Parent = core
	core.CFrame = origin
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
	onPhase("done")
	return { Folder = folder, Pet = petModel }
end

return HatchFx
`;
