// Umgebung der Welten für Roblox (Modul WorldFx): Himmel und Licht, Fernkulisse, Atmosphäre-Partikel und Leben
// rund um jede Insel. Alles aus Parts, ruhig animiert (ziehende Wolken, kreisende Vögel und Fische,
// schwebende Inseln, wogendes Polarlicht). Läuft auf dem Client: WorldFx.Apply(weltId, mitte, eltern).
// Reiner Text wie luau.js, damit es auch in Node prüfbar ist.

import { KULISSE } from '../../welten/js/worlds.js';

const str = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

// Farben je Welt für das Modul (aus worlds.js)
function worldTable(WORLDS) {
  return WORLDS.filter((w) => !w.soon)
    .map((w) => {
      const n = parseInt(w.sky[0].slice(1), 16);
      const lin = (v) => Math.pow(v / 255, 2.2); // wie THREE.Color (linear)
      const night = 0.3 * lin(n >> 16) + 0.59 * lin((n >> 8) & 255) + 0.11 * lin(n & 255) < 0.2;
      return `\t[${str(w.id)}] = { Planet = ${str(w.planet)}, Top = Color3.fromHex(${str(w.sky[0])}), Horizon = Color3.fromHex(${str(w.sky[1])}), Accent = Color3.fromHex(${str(w.accent)}), Ground = Color3.fromHex(${str(w.ground)}), Rock = Color3.fromHex(${str(w.rock)}), Side = Color3.fromHex(${str(w.side)}), Band = Color3.fromHex(${str(KULISSE[w.id]?.horizont || w.sky[1])}), Night = ${night}, Water = ${!!w.water} },`;
    })
    .join('\n');
}

export function worldFxSource({ WORLDS }) {
  return `-- Coinmaster Adventure · Umgebung der Welten
-- Automatisch erzeugt von der Coinmaster-Webseite. Änderungen besser dort machen
-- und neu übertragen, sonst gehen sie beim nächsten Import verloren.
--
-- WorldFx.Apply(weltId, mitte, eltern) baut rund um eine Insel (mitte = Mitte der Himmelskuppel) einen Ordner
-- „Umgebung“: Himmel und Licht (Sonne, Mond, Sterne, Polarlicht, Lichtstrahlen, Nebel, Farbstimmung),
-- Fernkulisse am Rand der Kuppel (Berge, Skyline, Vulkane, Eisberge, Korallen, Ruinen …), Atmosphäre-Partikel
-- und Leben (Vögel, Schmetterlinge, Fische, Wal, Quallen, Ballons, Satelliten …). Bewegungen sind ruhig.
-- Gibt { Folder, Destroy } zurück. Läuft auf dem Client (LocalScript CoinmasterWorldFx).

local RunService = game:GetService("RunService")
local Lighting = game:GetService("Lighting")

local WorldFx = {}

local WORLDS = {
${worldTable(WORLDS)}
}
WorldFx.Worlds = WORLDS

local TAU = math.pi * 2
local V = Vector3.new
local UP = CFrame.Angles(0, 0, math.pi / 2)
local SEA = -175 -- Wolkenmeer unter der Insel
local WHITE = Color3.new(1, 1, 1)
local function hex(s) return Color3.fromHex(s) end

-- ── Teile ──
local function P(k, shape, size, cf, color, material, transparency, name)
	local p = Instance.new(shape == "Wedge" and "WedgePart" or "Part")
	p.Name = name or "Kulisse"
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
	p.Parent = k.Folder
	if k.Bucket then table.insert(k.Bucket, p) end
	return p
end

-- alle Teile, die fn baut, als Liste
local function collect(k, fn)
	local outer = k.Bucket
	k.Bucket = {}
	fn()
	local list = k.Bucket
	k.Bucket = outer
	if outer then for _, p in ipairs(list) do table.insert(outer, p) end end
	return list
end

local function at(k, x, y, z) return CFrame.new(k.C + V(x, y, z)) end
-- Blick zur Mitte (−Z zeigt zur Insel)
local function facing(k, x, y, z)
	local p = k.C + V(x, y, z)
	return CFrame.lookAt(p, V(k.C.X, p.Y, k.C.Z))
end
local function polar(a, r) return math.cos(a) * r, math.sin(a) * r end
local function rnd(k, a, b) return k.R:NextNumber(a, b) end

-- Dreiecksprisma: von der Insel aus ein Dreieck (Breite w, Höhe h, Tiefe d)
local function prism(k, cf, w, h, d, color, material, transparency, name)
	local base = cf * CFrame.Angles(0, math.pi / 2, 0)
	P(k, "Wedge", V(d, h, w / 2), base * CFrame.new(0, 0, -w / 4), color, material, transparency, name)
	P(k, "Wedge", V(d, h, w / 2), base * CFrame.new(0, 0, w / 4) * CFrame.Angles(0, math.pi, 0), color, material, transparency, name)
end

-- ── Bewegung ──
local function anim(k, fn) table.insert(k.Updates, fn) end
local function offsets(parts, pivot)
	local inv, list = pivot:Inverse(), {}
	for _, p in ipairs(parts) do table.insert(list, { Part = p, Offset = inv * p.CFrame }) end
	return list
end
-- Teile drehen sich langsam um die Inselachse
local function orbit(k, parts, speed, tilt)
	local pivot = CFrame.new(k.C) * (tilt or CFrame.new())
	local list = offsets(parts, pivot)
	anim(k, function(t)
		local base = pivot * CFrame.Angles(0, t * speed, 0)
		for _, e in ipairs(list) do e.Part.CFrame = base * e.Offset end
	end)
end
-- Teile schweben auf und ab
local function bob(k, parts, amp, freq, phase, sway)
	local pivot = parts[1].CFrame
	local list = offsets(parts, pivot)
	anim(k, function(t)
		local s = t * freq + phase
		local base = pivot * CFrame.new(0, math.sin(s) * amp, 0) * CFrame.Angles(0, 0, math.sin(s * 0.7) * (sway or 0))
		for _, e in ipairs(list) do e.Part.CFrame = base * e.Offset end
	end)
end
-- Durchsichtigkeit pulsiert
local function pulse(k, parts, base, amp, freq)
	for i, p in ipairs(parts) do
		local ph = i * 0.7
		anim(k, function(t) p.Transparency = math.clamp(base + math.sin(t * freq + ph) * amp, 0, 1) end)
	end
end

-- ── Himmel und Licht ──
local function skyPos(k, az, el, dist)
	return k.C + V(math.cos(el) * math.cos(az) * dist, math.sin(el) * dist, math.cos(el) * math.sin(az) * dist)
end

local function sun(k, az, el, color, size, glow)
	local pos = skyPos(k, az, el, 560)
	local core = P(k, "Ball", V(size, size, size), CFrame.new(pos), color, "Neon", 0, "Sonne")
	local halos = collect(k, function()
		P(k, "Ball", V(size, size, size) * 1.7, CFrame.new(pos), glow or color, "Neon", 0.72, "Sonnenschein")
		P(k, "Ball", V(size, size, size) * 2.6, CFrame.new(pos), glow or color, "Neon", 0.88, "Sonnenschein")
	end)
	pulse(k, { halos[1] }, 0.72, 0.05, 0.4)
	return core
end

local function moon(k, az, el, color, size)
	local pos = skyPos(k, az, el, 560)
	local face = CFrame.lookAt(pos, k.C)
	P(k, "Ball", V(size, size, size), face, color, "Neon", 0.05, "Mond")
	P(k, "Ball", V(size, size, size) * 1.6, face, color, "Neon", 0.9, "Mondschein")
	for i = 1, 5 do
		local a, r = i * 1.9, size * (0.12 + (i % 3) * 0.1)
		P(k, "Ball", V(size * 0.18, size * 0.18, size * 0.05), face * CFrame.new(math.cos(a) * r, math.sin(a) * r, -size * 0.47), color:Lerp(Color3.new(0.5, 0.5, 0.6), 0.35), "SmoothPlastic", 0, "Krater")
	end
end

local function stars(k, n, colors, minEl)
	local twinkle = {}
	for i = 1, n do
		local az, el = rnd(k, 0, TAU), math.asin(rnd(k, math.sin(minEl or 0.1), 0.98))
		local s = rnd(k, 1.4, 3.2)
		local p = P(k, "Ball", V(s, s, s), CFrame.new(skyPos(k, az, el, 600)), colors[i % #colors + 1], "Neon", 0, "Stern")
		if i % 4 == 0 then table.insert(twinkle, p) end
	end
	pulse(k, twinkle, 0.35, 0.35, 1.1)
end

-- Polarlicht: Bänder aus leuchtenden Streifen, die langsam wogen
local function aurora(k, colors, az0, span, y)
	local strips = {}
	for b = 0, 1 do
		local n = 26
		for i = 0, n - 1 do
			local a = az0 + (i / (n - 1) - 0.5) * span + b * 0.12
			local x, z = polar(a, 470 - b * 40)
			local h = 90 + math.sin(i * 0.9) * 25
			local p = P(k, "Block", V(22, h, 1), facing(k, x, y + b * 30, z), colors[(i + b) % #colors + 1], "Neon", 0.78, "Polarlicht")
			table.insert(strips, { Part = p, Base = p.CFrame, Ph = i * 0.35 + b })
		end
	end
	anim(k, function(t)
		for _, s in ipairs(strips) do
			s.Part.CFrame = s.Base * CFrame.new(0, math.sin(t * 0.35 + s.Ph) * 10, math.sin(t * 0.25 + s.Ph) * 14)
			s.Part.Transparency = 0.74 + math.sin(t * 0.5 + s.Ph * 1.3) * 0.12
		end
	end)
end

-- Lichtstrahlen von der Wasseroberfläche
local function shafts(k, color, n)
	local list = {}
	for i = 1, n do
		local a, r = rnd(k, 0, TAU), rnd(k, 90, 330)
		local x, z = polar(a, r)
		local cf = at(k, x, 160, z) * CFrame.Angles(rnd(k, -0.25, 0.25), rnd(k, 0, TAU), rnd(k, -0.25, 0.25))
		local p = P(k, "Block", V(rnd(k, 14, 30), 560, 2), cf, color, "Neon", 0.9, "Lichtstrahl")
		table.insert(list, { Part = p, Base = cf, Ph = i })
	end
	anim(k, function(t)
		for _, s in ipairs(list) do
			s.Part.CFrame = s.Base * CFrame.Angles(0, t * 0.03, math.sin(t * 0.2 + s.Ph) * 0.04)
			s.Part.Transparency = 0.88 + math.sin(t * 0.45 + s.Ph * 1.7) * 0.06
		end
	end)
end

-- Nebelschleier im All: große, fast durchsichtige Leuchtwolken
local function nebula(k, colors, n)
	local parts = collect(k, function()
		for i = 1, n do
			local pos = skyPos(k, rnd(k, 0, TAU), rnd(k, 0.25, 0.9), 540)
			local s = rnd(k, 140, 240)
			P(k, "Ball", V(s, s * 0.45, s * 0.8), CFrame.new(pos) * CFrame.Angles(rnd(k, 0, 1), rnd(k, 0, 3), rnd(k, 0, 1)), colors[i % #colors + 1], "Neon", 0.9, "Nebelschleier")
		end
	end)
	pulse(k, parts, 0.9, 0.035, 0.2)
end

-- Komet zieht ganz langsam über den Himmel
local function comet(k, color, el)
	local parts = collect(k, function()
		local head = skyPos(k, 0, el, 520)
		P(k, "Ball", V(7, 7, 7), CFrame.new(head), WHITE, "Neon", 0, "Komet")
		for i = 1, 7 do
			local s = 7 - i * 0.6
			P(k, "Ball", V(s, s, s * 3), CFrame.new(skyPos(k, -i * 0.025, el + i * 0.004, 520)), color, "Neon", 0.25 + i * 0.09, "Schweif")
		end
	end)
	orbit(k, parts, 0.012, CFrame.Angles(0.18, 0, 0.1))
end

-- Farbstimmung der Welt (ColorCorrection) – sanft
local function grade(k, tint, saturation, contrast)
	local cc = Instance.new("ColorCorrectionEffect")
	cc.Name = "CoinmasterWeltStimmung"
	cc.TintColor = WHITE:Lerp(tint, 0.1)
	cc.Saturation = saturation or 0.05
	cc.Contrast = contrast or 0.04
	cc.Parent = Lighting
	k.Grade = cc
end

-- ── Wolken, Inselchen, Brocken ──
-- Wolkenbänke ziehen langsam um die Insel
local function cloudBank(k, n, color, transparency, y0, y1)
	local parts = collect(k, function()
		for i = 0, n - 1 do
			local a = i / n * TAU + rnd(k, -0.2, 0.2)
			local r = rnd(k, 380, 520)
			local y = rnd(k, y0 or 30, y1 or 150)
			local x, z = polar(a, r)
			local cf = facing(k, x, y, z)
			-- Haufenwolke: flacher, breiter Sockel, darauf drei Bäusche (Mitte am höchsten), unten etwas dunkler.
			-- Durchscheinende Wolken nur sehr zart: überlappende Kugeln wirkten sonst wie Blasen.
			local s, t = rnd(k, 40, 62), math.min(transparency or 0, 0.12)
			local under = color:Lerp(hex("#b8c4d8"), 0.22)
			P(k, "Ball", V(s * 3.2, s * 0.62, s * 1.5), cf * CFrame.new(0, -s * 0.12, 0), under, "SmoothPlastic", t, "Wolkenbank")
			for j = -1, 1 do
				local q = s * (j == 0 and rnd(k, 1.15, 1.35) or rnd(k, 0.8, 1))
				P(k, "Ball", V(q * 1.2, q, q), cf * CFrame.new(j * s * 0.95 + rnd(k, -6, 6), q * (j == 0 and 0.32 or 0.18), rnd(k, -6, 6)), color, "SmoothPlastic", t, "Wolkenbank")
			end
		end
	end)
	orbit(k, parts, 0.006)
end

-- schwebende Inselchen
local function islets(k, n, top, rock, extra)
	for i = 1, n do
		local a, r = i / n * TAU + rnd(k, -0.3, 0.3), rnd(k, 430, 520)
		local x, z = polar(a, r)
		local y, s = rnd(k, -110, -20), rnd(k, 18, 34)
		local parts = collect(k, function()
			local cf = at(k, x, y, z)
			P(k, "Ball", V(s * 2, s * 2.2, s * 2), cf * CFrame.new(0, -s * 0.9, 0), rock, "Rock", 0, "Schwebeinsel")
			P(k, "Cyl", V(s * 2.1, s * 0.35, s * 2.1), cf * CFrame.new(0, 0.1 * s, 0), top, "Grass", 0, "Schwebeinsel")
			if extra then extra(cf * CFrame.new(0, 0.3 * s, 0), s) end
		end)
		bob(k, parts, rnd(k, 3, 6), rnd(k, 0.15, 0.3), i, 0.02)
	end
end

-- Felsbrocken-Ring, der langsam kreist (Asteroiden, Saturnring)
local function rockBelt(k, n, colors, r0, r1, y, thick, material, speed, tiltCF)
	local parts = collect(k, function()
		for i = 1, n do
			local a, r = rnd(k, 0, TAU), rnd(k, r0, r1)
			local x, z = polar(a, r)
			local s = rnd(k, 6, 22)
			P(k, "Ball", V(s, s * rnd(k, 0.6, 0.9), s * rnd(k, 0.7, 1)), at(k, x, y + rnd(k, -thick, thick), z) * CFrame.Angles(rnd(k, 0, 3), rnd(k, 0, 3), 0), colors[i % #colors + 1], material or "Slate", 0, "Brocken")
		end
	end)
	orbit(k, parts, speed or 0.01, tiltCF)
end

-- ── Fernkulisse: drei Tiefen, ein Wahrzeichen, Gruppen mit Lücken, Horizontband ──
-- Nah 380–460 Studs (niedrig und satt), Mitte 480–560, Fern 600–630 (stark in die Horizontfarbe getönt).
-- Das Wahrzeichen steht gegenüber der Startkamera (Richtung HELD), damit man die Welt im ersten Bild erkennt.
local DEPTH = {
	nah = { R0 = 380, R1 = 460, Tint = 0.15, H = 0.4 },
	mitte = { R0 = 480, R1 = 560, Tint = 0.4, H = 0.55 },
	fern = { R0 = 600, R1 = 630, Tint = 0.7, H = 1 },
}
local HELD = 4.0 -- Kamera beim Start bei Winkel 0,86: gegenüber
local HELD_R = 520
local DARK = Color3.new(0, 0, 0)
local function tint(k, c, amount) return c:Lerp(k.W.Horizon, amount) end

-- Gruppen mit Tälern dazwischen: vor dem Wahrzeichen bleibt eine Lücke
local function layer(k, depth, groups, perGroup, colors, make)
	local d = DEPTH[depth]
	local span = TAU / groups
	local a0 = HELD + span / 2 + rnd(k, -0.12, 0.12)
	for g = 0, groups - 1 do
		local center = a0 + g * span
		local width = span * rnd(k, 0.42, 0.58)
		for i = 0, perGroup - 1 do
			local u = perGroup == 1 and 0.5 or i / (perGroup - 1)
			local a = center + (u - 0.5) * width + rnd(k, -0.03, 0.03)
			local x, z = polar(a, rnd(k, d.R0, d.R1))
			local mid = 1 - math.abs(u - 0.5) * 0.9 -- in der Gruppenmitte am größten
			make(facing(k, x, SEA, z), d.H * (0.7 + mid * 0.5) * rnd(k, 0.85, 1.1), tint(k, colors[(g + i) % #colors + 1], d.Tint), i, a)
		end
	end
end

-- flacher Neon-Ring in Horizontfarbe knapp über dem Meer
local function horizonBand(k)
	local n = 40
	for i = 0, n - 1 do
		local x, z = polar(i / n * TAU, 612)
		P(k, "Block", V(TAU * 612 / n * 1.04, 24, 1), facing(k, x, SEA + 30, z), k.W.Band, "Neon", 0.85, "Horizontband")
	end
end

-- Platz und Blickrichtung des Wahrzeichens (Grund auf Meereshöhe)
local function heldAt(k, r, y)
	local x, z = polar(HELD, r or HELD_R)
	return facing(k, x, y or SEA, z)
end

local function smoke(k, part, colors, size, rate, life)
	local e = Instance.new("ParticleEmitter")
	e.Texture = "rbxasset://textures/particles/smoke_main.dds"
	e.Color = ColorSequence.new(colors[1], colors[2] or colors[1])
	e.Size = NumberSequence.new(size, size * 2.5)
	e.Transparency = NumberSequence.new(0.55, 1)
	e.Lifetime = NumberRange.new(life or 10, (life or 10) * 1.4)
	e.Speed = NumberRange.new(5, 9)
	e.SpreadAngle = Vector2.new(12, 12)
	e.Rate = rate or 1
	e.Acceleration = V(3, 0, 0)
	e.Parent = part
	return e
end

-- ── Bausteine der Ferne (cf = Grund auf Meereshöhe, −Z zur Insel; s = Größe; c = getönte Farbe) ──
local EL = {}

-- Dreieck aus zwei Keilen (Punkte in Weltkoordinaten), wie der Boden der Inseln
local function tri(k, a, b, c, color, material, name)
	local ab, ac, bc = b - a, c - a, c - b
	local abd, acd, bcd = ab:Dot(ab), ac:Dot(ac), bc:Dot(bc)
	if abd > acd and abd > bcd then
		a, c = c, a
	elseif acd > bcd and acd > abd then
		a, b = b, a
	end
	ab, ac, bc = b - a, c - a, c - b
	local right = ac:Cross(ab).Unit
	local up = bc:Cross(right).Unit
	local back = bc.Unit
	local height = math.abs(ab:Dot(up))
	P(k, "Wedge", V(1.5, height, math.abs(ab:Dot(back))), CFrame.fromMatrix((a + b) / 2, right, up, back), color, material, 0, name)
	P(k, "Wedge", V(1.5, height, math.abs(ac:Dot(back))), CFrame.fromMatrix((a + c) / 2, -right, up, -back), color, material, 0, name)
end

-- Berg aus Dreiecken: Ring am Fuß, zwei verdrehte Ringe darüber, Spitze. Flächen abwechselnd hell und dunkel
-- (Grate), mit Schnee über einer zackigen Grenze. Nur die Seite zur Insel (−Z) wird gebaut, die Rückseite sieht
-- man nie.
local function mountain(k, cf, r, h, c, cap, material, name)
	local n = 7
	local RR, YY = { 1, 0.55, 0.26 }, { 0, 0.5, 0.8 }
	local tw, rings = rnd(k, 0, TAU), {}
	for i = 1, 3 do
		local ring = {}
		for j = 0, n - 1 do
			local a = tw + j / n * TAU + (i - 1) * 0.33 + rnd(k, -0.12, 0.12)
			local rr = r * RR[i] * rnd(k, 0.82, 1.15)
			ring[j] = cf * V(math.cos(a) * rr, i == 1 and -12 or h * YY[i] * rnd(k, 0.93, 1.07), math.sin(a) * rr)
		end
		rings[i] = ring
	end
	local tip = cf * V(rnd(k, -0.1, 0.1) * r, h, rnd(k, -0.1, 0.1) * r)
	local shade = { c:Lerp(WHITE, 0.1), c, c:Lerp(DARK, 0.12) }
	local snow = cap and { cap, cap:Lerp(hex("#c4d2e6"), 0.35) }
	local function seen(p) return cf:PointToObjectSpace(p).Z < r * 0.35 end
	local function face(a, b, d, j, white)
		if not seen((a + b + d) / 3) then return end
		if white and snow then tri(k, a, b, d, snow[j % 2 + 1], "Snow", "Schneekappe")
		else tri(k, a, b, d, shade[j % 3 + 1], material or "Rock", name or "Berg") end
	end
	for i = 1, 2 do
		local A, B = rings[i], rings[i + 1]
		for j = 0, n - 1 do
			local j1 = (j + 1) % n
			-- Schnee nur oben und zackig: Dreiecke mit zwei oberen Ecken öfter weiß als die mit zwei unteren
			face(A[j], B[j], B[j1], j, i == 2 and rnd(k, 0, 1) < 0.6)
			face(A[j], B[j1], A[j1], j + 1, i == 2 and rnd(k, 0, 1) < 0.15)
		end
	end
	for j = 0, n - 1 do face(rings[3][j], tip, rings[3][(j + 1) % n], j, true) end
end

function EL.peak(k, cf, s, c, cap, material)
	local h, w = 330 * s, 230 * s
	mountain(k, cf, w * 0.55, h, c, cap, material)
	-- Vorberg seitlich davor, ohne Schnee
	mountain(k, cf * CFrame.new(w * 0.5, 0, -w * 0.15), w * 0.38, h * 0.5, c:Lerp(DARK, 0.06), nil, material, "Vorberg")
end
-- flacher Bergkamm (Stufen in der Ferne)
function EL.ridge(k, cf, s, c)
	local h, w = 200 * s, 360 * s
	prism(k, cf * CFrame.new(0, h / 2 - 10, 0), w, h, w * 0.3, c, "Rock", 0, "Kamm")
end
-- Hügel, der aus dem Wolkenmeer ragt; gibt die Höhe der Kuppe zurück
local function mound(k, cf, w, h, c, material)
	P(k, "Ball", V(w, h * 2, w * 0.75), cf, c, material or "Grass", 0, "Huegel")
	return h
end
function EL.hill(k, cf, s, c) mound(k, cf, 250 * s, 170 * s, c) end
function EL.trees(k, cf, s, c)
	local w, h = 220 * s, 130 * s
	mound(k, cf, w, h, c)
	local tree = c:Lerp(DARK, 0.3)
	for j = 1, 6 do
		local off = (j - 3.5) * w * 0.13
		local th = 60 * s * rnd(k, 0.8, 1.2)
		local top = h * math.sqrt(math.max(0, 1 - (off / (w * 0.5)) ^ 2)) - 8
		prism(k, cf * CFrame.new(off, top + th / 2, -w * 0.18), th * 0.55, th, th * 0.5, tree, "Grass", 0, "Tanne")
	end
end
-- Hof auf einem Hügel: Haus mit Dach, Feldstreifen
function EL.farm(k, cf, s, c, roof)
	local h = mound(k, cf, 230 * s, 120 * s, c)
	local top = cf * CFrame.new(0, h - 4, -30 * s)
	P(k, "Block", V(34 * s, 26 * s, 26 * s), top * CFrame.new(0, 13 * s, 0), hex("#f2e6d0"):Lerp(k.W.Horizon, 0.2), "WoodPlanks", 0, "Hofhaus")
	prism(k, top * CFrame.new(0, 26 * s + 9 * s, 0), 40 * s, 18 * s, 30 * s, roof or hex("#c0503a"), "SmoothPlastic", 0, "Dach")
	for f = -1, 1, 2 do
		P(k, "Block", V(50 * s, 2, 22 * s), top * CFrame.new(f * 55 * s, -6 * s, -10 * s) * CFrame.Angles(0.25, 0, 0), f > 0 and hex("#e8c860") or hex("#7fbf5a"), "Grass", 0, "Feld")
	end
end
-- Burg-Silhouette auf einem Waldrücken
function EL.castle(k, cf, s, c)
	EL.trees(k, cf, s, c)
	local top = cf * CFrame.new(0, 130 * s - 6, -50 * s)
	s = s * 0.55
	local stone = hex("#b8b4c0"):Lerp(k.W.Horizon, 0.45)
	P(k, "Block", V(40 * s, 70 * s, 30 * s), top * CFrame.new(0, 35 * s, 0), stone, "Cobblestone", 0, "Burg")
	for sx = -1, 1, 2 do
		P(k, "Cyl", V(18 * s, 95 * s, 18 * s), top * CFrame.new(sx * 30 * s, 47 * s, 0), stone, "Cobblestone", 0, "Burgturm")
		prism(k, top * CFrame.new(sx * 30 * s, 105 * s, 0), 22 * s, 26 * s, 22 * s, hex("#5a6a9a"):Lerp(k.W.Horizon, 0.4), "SmoothPlastic", 0, "Turmdach")
	end
end
function EL.windmill(k, cf, s, c)
	local h = mound(k, cf, 200 * s, 120 * s, c)
	local top = cf * CFrame.new(0, h - 4, -40 * s)
	P(k, "Cyl", V(6 * s, 80 * s, 6 * s), top * CFrame.new(0, 40 * s, 0), hex("#f4f4f4"):Lerp(k.W.Horizon, 0.3), "SmoothPlastic", 0, "Windrad")
	local hub = top * CFrame.new(0, 80 * s, -4 * s)
	local blades = collect(k, function()
		for b = 0, 2 do
			P(k, "Block", V(4 * s, 44 * s, 1), hub * CFrame.Angles(0, 0, b * TAU / 3) * CFrame.new(0, 22 * s, 0), hex("#ffffff"):Lerp(k.W.Horizon, 0.3), "SmoothPlastic", 0, "Fluegel")
		end
	end)
	local list = offsets(blades, hub)
	local ph = rnd(k, 0, 6)
	anim(k, function(t)
		local base = hub * CFrame.Angles(0, 0, t * 0.5 + ph)
		for _, e in ipairs(list) do e.Part.CFrame = base * e.Offset end
	end)
end
function EL.mushroom(k, cf, s, c, cap)
	local h = 110 * s
	P(k, "Cyl", V(22 * s, h, 22 * s), cf * CFrame.new(0, 40 + h / 2, -20), hex("#f2e6d0"):Lerp(k.W.Horizon, 0.25), "SmoothPlastic", 0, "Riesenpilz")
	P(k, "Ball", V(100 * s, 50 * s, 100 * s), cf * CFrame.new(0, 40 + h, -20), cap or c, "SmoothPlastic", 0, "Riesenpilz")
	P(k, "Cyl", V(16 * s, 90 * s, 16 * s), cf * CFrame.new(70 * s, 40, -10) * CFrame.Angles(0, 0, math.pi / 2 - 0.15), hex("#6b4a2e"):Lerp(k.W.Horizon, 0.2), "Wood", 0, "Stamm")
	mound(k, cf, 160 * s, 60, c:Lerp(DARK, 0.2))
end
-- Hochhaus; lit = Fenster
function EL.tower(k, cf, s, c, lit)
	local w, h = rnd(k, 34, 60) * math.max(0.6, s), rnd(k, 170, 290) * s
	local body = cf * CFrame.new(0, h / 2, 0)
	P(k, "Block", V(w, h, w * 0.8), body, c, "Concrete", 0, "Hochhaus")
	for row = 1, math.floor(h / 34) do
		if row % 2 == 0 then
			local win = P(k, "Block", V(w * 0.8, 4, 1), body * CFrame.new(0, h / 2 - row * 30, -w * 0.4 - 0.6), lit, "Neon", 0.3, "Fenster")
			if row % 4 == 0 then
				local ph = rnd(k, 0, 6)
				anim(k, function(t) win.Transparency = math.sin(t * 0.3 + ph) > 0.6 and 0.85 or 0.3 end)
			end
		end
	end
end
function EL.bridge(k, cf, s, c)
	local deck = hex("#8a8f99"):Lerp(k.W.Horizon, 0.2)
	for p = -1, 1 do
		P(k, "Block", V(12, 150, 12), cf * CFrame.new(p * 60, 75, 0), deck, "Concrete", 0, "Pfeiler")
	end
	P(k, "Block", V(200, 8, 18), cf * CFrame.new(0, 152, 0), deck, "Concrete", 0, "Hochbahn")
	P(k, "Block", V(60, 12, 14), cf * CFrame.new(rnd(k, -60, 60), 164, 0), hex("#e8e4d8"):Lerp(k.W.Horizon, 0.15), "SmoothPlastic", 0, "Zug")
end
function EL.spike(k, cf, s, c, material, transparency)
	local h, w = 260 * s, 80 * s
	prism(k, cf * CFrame.new(0, h / 2, 0), w, h, w * 0.6, c, material or "Ice", transparency or 0, "Spitze")
	prism(k, cf * CFrame.new(w * 0.55, h * 0.3, -4), w * 0.55, h * 0.6, w * 0.4, c:Lerp(WHITE, 0.15), material or "Ice", transparency or 0, "Spitze")
end
-- treibende Eisscholle
function EL.floe(k, cf, s, c)
	local list = collect(k, function()
		P(k, "Block", V(rnd(k, 60, 110), 12, rnd(k, 40, 80)), cf * CFrame.new(0, 60, 0) * CFrame.Angles(0, rnd(k, 0, 3), 0), hex("#f4fbff"), "Glacier", 0, "Eisscholle")
		prism(k, cf * CFrame.new(10, 80, 0), 40, 30, 30, hex("#dff4ff"), "Ice", 0, "Eisscholle")
	end)
	bob(k, list, 3, rnd(k, 0.2, 0.3), rnd(k, 0, 6), 0.02)
end
function EL.volcano(k, cf, s, c, lava)
	local h, w = 200 * s, 230 * s
	prism(k, cf * CFrame.new(0, h / 2, 0), w, h, w * 0.6, c, "Basalt", 0, "Vulkan")
	local glow = P(k, "Cyl", V(w * 0.2, 8, w * 0.28), cf * CFrame.new(0, h - h * 0.12, -w * 0.05), lava, "Neon", 0, "Glut")
	pulse(k, { glow }, 0.1, 0.1, 0.7)
	local host = P(k, "Block", V(20, 2, 20), cf * CFrame.new(0, h, 0), WHITE, "SmoothPlastic", 1, "Rauchquelle")
	smoke(k, host, { Color3.fromRGB(70, 50, 45), Color3.fromRGB(40, 30, 30) }, 24, 0.8, 10)
end
function EL.basalt(k, cf, s, c)
	for j = 0, 4 do
		local h = rnd(k, 90, 170) * s
		P(k, "Cyl", V(32 * s, h, 32 * s), cf * CFrame.new((j - 2) * 30 * s, h / 2, rnd(k, -10, 10)), c:Lerp(DARK, (j % 2) * 0.1), "Basalt", 0, "Basaltsaeule")
	end
end
-- Lavasee mit Glutblasen
function EL.lavaLake(k, cf, s, c, lava)
	local h = mound(k, cf, 220 * s, 80, c, "Basalt")
	local pool = P(k, "Cyl", V(150 * s, 4, 110 * s), cf * CFrame.new(0, h - 2, -10), lava, "Neon", 0, "Lavasee")
	pulse(k, { pool }, 0.15, 0.12, 0.5)
	for b = 1, 3 do
		local bub = P(k, "Ball", V(14, 14, 14), cf * CFrame.new(rnd(k, -40, 40) * s, h, rnd(k, -30, 10)), lava:Lerp(WHITE, 0.3), "Neon", 0, "Glutblase")
		local base, ph = bub.CFrame, rnd(k, 0, 6)
		anim(k, function(t)
			local u = (t * 0.25 + ph) % 1
			bub.CFrame = base * CFrame.new(0, u * 10, 0)
			bub.Transparency = u
		end)
	end
end
-- Rauchwand mit rotem Glühen von unten
function EL.smokeWall(k, cf, s, c, glow)
	P(k, "Ball", V(260 * s, 260 * s, 120), cf * CFrame.new(0, 110 * s, 0), c, "SmoothPlastic", 0.35, "Rauchwand")
	local band = P(k, "Block", V(240 * s, 30, 2), cf * CFrame.new(0, 40, -62), glow, "Neon", 0.4, "Glut")
	pulse(k, { band }, 0.45, 0.15, 0.3)
end
function EL.stalagmite(k, cf, s, c, glowC)
	local h = 180 * s
	prism(k, cf * CFrame.new(0, h / 2, 0), 70 * s, h, 50 * s, c, "Slate", 0, "Stalagmit")
	for j = 1, 3 do
		local m = P(k, "Ball", V(16, 9, 16), cf * CFrame.new(rnd(k, -30, 30) * s, rnd(k, 30, 80), -28 * s), glowC, "Neon", 0.1, "Leuchtpilz")
		pulse(k, { m }, 0.15, 0.12, 0.8)
	end
end
function EL.crystal(k, cf, s, c)
	EL.spike(k, cf, s, c, "Glass", 0.2)
	local core = P(k, "Block", V(8, 160 * s, 2), cf * CFrame.new(0, 80 * s, -25 * s), c:Lerp(WHITE, 0.3), "Neon", 0.4, "Kristallader")
	pulse(k, { core }, 0.45, 0.2, 0.4)
end
function EL.caveWall(k, cf, s, c)
	P(k, "Block", V(200, 520, 40), cf * CFrame.new(0, 200, 0), c, "Slate", 0, "Hoehlenwand")
end
function EL.lolli(k, cf, s, c)
	local h = 200 * s
	P(k, "Cyl", V(8, h, 8), cf * CFrame.new(0, h / 2 + 40, 0), WHITE, "SmoothPlastic", 0, "Lollistiel")
	local disc = cf * CFrame.new(0, h + 70 * s, 0) * CFrame.Angles(math.pi / 2, 0, 0)
	P(k, "Cyl", V(80 * s, 14, 80 * s), disc, c, "SmoothPlastic", 0, "Lolli")
	P(k, "Cyl", V(50 * s, 15, 50 * s), disc, WHITE:Lerp(c, 0.2), "SmoothPlastic", 0, "Lolli")
	P(k, "Ball", V(90 * s, 50 * s, 70 * s), cf * CFrame.new(0, 60, -10), hex("#ffd8f0"), "SmoothPlastic", 0, "Zuckerwatte")
end
-- Waffelberg mit Eiskugeln
function EL.waffle(k, cf, s, c)
	local h, w = 230 * s, 170 * s
	prism(k, cf * CFrame.new(0, h / 2, 0) * CFrame.Angles(0, 0, math.pi), w, h, w * 0.6, hex("#d89a52"):Lerp(k.W.Horizon, 0.3), "SmoothPlastic", 0, "Waffel")
	for j = -1, 1 do
		P(k, "Ball", V(w * 0.45, w * 0.42, w * 0.45), cf * CFrame.new(j * w * 0.26, h + w * 0.08 + math.abs(j) * -w * 0.1, 0), c, "SmoothPlastic", 0, "Eiskugel")
	end
end
function EL.craterRim(k, cf, s, c)
	for j = 0, 6 do
		local a = j / 7 * math.pi
		P(k, "Ball", V(50, rnd(k, 50, 80), 40), cf * CFrame.new(math.cos(a) * 90 * s, 70, -math.sin(a) * 30), c:Lerp(DARK, (j % 2) * 0.08), "Rock", 0, "Kraterrand")
	end
end
function EL.mesa(k, cf, s, c)
	local w, h = rnd(k, 150, 230) * s, rnd(k, 170, 240) * s
	for st = 0, 2 do
		local ws = w * (1 - st * 0.17)
		P(k, "Block", V(ws, h / 3 + 1, ws * 0.6), cf * CFrame.new(0, h / 6 + st * h / 3, 0), c:Lerp(DARK, st * 0.07), "Sandstone", 0, "Tafelberg")
	end
end
function EL.dune(k, cf, s, c)
	P(k, "Ball", V(220 * s, 140, 90), cf * CFrame.new(0, 40, 0), c, "Sand", 0, "Duene")
	local host = P(k, "Block", V(120 * s, 2, 20), cf * CFrame.new(0, 105, 0), WHITE, "SmoothPlastic", 1, "Staubfahne")
	local e = smoke(k, host, { c:Lerp(WHITE, 0.2), c }, 10, 1.5, 5)
	e.Acceleration = V(12, 0, 4)
end
function EL.spire(k, cf, s, c, bulb)
	local h = 220 * s
	P(k, "Cyl", V(14, h, 14), cf * CFrame.new(0, h / 2, 0), c, "SmoothPlastic", 0, "Stiel")
	local b = P(k, "Ball", V(60 * s, 44 * s, 60 * s), cf * CFrame.new(0, h + 10, 0), bulb, "Neon", 0.15, "Leuchtknolle")
	pulse(k, { b }, 0.2, 0.15, 0.6)
end
function EL.flare(k, cf, s, c)
	local R = 130 * s
	local list = collect(k, function()
		for j = 0, 15 do
			local u = j / 15 * math.pi
			P(k, "Ball", V(26 * s, 26 * s, 26 * s), cf * CFrame.new(math.cos(u) * R, 30 + math.sin(u) * R * 1.3, 0), c:Lerp(WHITE, (j % 3) * 0.15), "Neon", 0.2, "Sonnenbogen")
		end
	end)
	pulse(k, list, 0.35, 0.25, 0.5)
end
function EL.coral(k, cf, s, c)
	local h = 250 * s
	P(k, "Cyl", V(40 * s, h, 40 * s), cf * CFrame.new(0, h / 2, 0), c, "SmoothPlastic", 0, "Koralle")
	for j = 1, 4 do
		local side = j % 2 == 0 and 1 or -1
		local y = h * j / 5
		P(k, "Cyl", V(16 * s, 60 * s, 16 * s), cf * CFrame.new(side * 32 * s, y, 0) * CFrame.Angles(0, 0, -side * 0.6), c, "SmoothPlastic", 0, "Koralle")
		P(k, "Ball", V(26 * s, 26 * s, 26 * s), cf * CFrame.new(side * 52 * s, y + 22 * s, 0), c:Lerp(WHITE, 0.25), "SmoothPlastic", 0, "Koralle")
	end
	P(k, "Ball", V(60 * s, 40 * s, 60 * s), cf * CFrame.new(0, h, 0), c:Lerp(WHITE, 0.15), "SmoothPlastic", 0, "Koralle")
end
function EL.kelp(k, cf, s, c)
	local h = 260 * s
	local parts = collect(k, function()
		for st = 0, 4 do P(k, "Block", V(10, h / 5 + 2, 3), cf * CFrame.new(0, st * h / 5 + h / 10, 0), c, "Grass", 0, "Seetang") end
	end)
	local list = offsets(parts, cf)
	local ph = rnd(k, 0, 6)
	anim(k, function(t)
		for j, e in ipairs(list) do e.Part.CFrame = cf * CFrame.Angles(0, 0, math.sin(t * 0.4 + ph + j * 0.4) * 0.05 * j) * e.Offset end
	end)
end
function EL.reef(k, cf, s, c)
	P(k, "Block", V(240, 150 * s, 60), cf * CFrame.new(0, 75 * s, 0), c, "Rock", 0, "Riffkante")
	P(k, "Ball", V(200, 70, 70), cf * CFrame.new(0, 150 * s, 0), c:Lerp(WHITE, 0.1), "Rock", 0, "Riffkante")
end
function EL.shell(k, cf, s, c)
	local sz = 170 * s
	local shell = cf * CFrame.new(0, sz * 0.4, 0) * CFrame.Angles(-0.5, 0, 0)
	P(k, "Ball", V(sz * 1.4, sz * 0.25, sz), shell, c, "SmoothPlastic", 0, "Muschel")
	for r = -3, 3 do P(k, "Block", V(6, 6, sz * 0.95), shell * CFrame.Angles(0, r * 0.32, 0) * CFrame.new(0, sz * 0.1, 0), c:Lerp(WHITE, 0.3), "SmoothPlastic", 0, "Rippe") end
end
function EL.arch(k, cf, s, c)
	local h = 200 * s
	for sx = -1, 1, 2 do P(k, "Block", V(40 * s, h, 40 * s), cf * CFrame.new(sx * 70 * s, h / 2, 0), c, "Rock", 0, "Felsbogen") end
	P(k, "Ball", V(200 * s, 60 * s, 50 * s), cf * CFrame.new(0, h, 0), c, "Rock", 0, "Felsbogen")
end
function EL.sandbank(k, cf, s, c) P(k, "Ball", V(300 * s, 120, 120), cf * CFrame.new(0, 30, 0), c, "Sand", 0, "Sandbank") end
function EL.rockStar(k, cf, s, c)
	local h = mound(k, cf, 140 * s, 90, c, "Rock")
	local star = cf * CFrame.new(0, h - 2, -20)
	for a = 0, 4 do P(k, "Block", V(8, 4, 26), star * CFrame.Angles(0, a / 5 * TAU, 0) * CFrame.new(0, 0, 12), hex("#ff7a4a"), "SmoothPlastic", 0, "Seestern") end
end
function EL.column(k, cf, s, c, fallen)
	local h = 160 * s
	if fallen then
		P(k, "Cyl", V(18, h, 18), cf * CFrame.new(0, 70, 0) * CFrame.Angles(0, 0, math.pi / 2 - 0.2), c, "Marble", 0, "Saeule")
	else
		P(k, "Cyl", V(18, h, 18), cf * CFrame.new(0, h / 2, 0), c, "Marble", 0, "Saeule")
		P(k, "Block", V(30, 10, 30), cf * CFrame.new(0, h + 5, 0), c, "Marble", 0, "Kapitell")
	end
end
function EL.ruin(k, cf, s, c)
	for st = 0, 2 do
		local w = 200 * s * (1 - st * 0.25)
		P(k, "Block", V(w, 40 * s, 80), cf * CFrame.new(0, 40 + st * 40 * s, st * -6), c:Lerp(DARK, st * 0.06), "Marble", 0, "Terrasse")
		for p = -2, 2 do
			if (p + st) % 2 == 0 then P(k, "Cyl", V(10, 36 * s, 10), cf * CFrame.new(p * w * 0.2, 60 + st * 40 * s + 20 * s, -40), c, "Marble", 0, "Saeule") end
		end
	end
end
function EL.cliff(k, cf, s, c, vein)
	P(k, "Block", V(120 * s, 280 * s, 60), cf * CFrame.new(0, 140 * s, 0) * CFrame.Angles(0, 0, rnd(k, -0.08, 0.08)), c, "Slate", 0, "Felswand")
	for j = 1, 3 do
		local v = P(k, "Block", V(4, rnd(k, 60, 140) * s, 1), cf * CFrame.new(rnd(k, -40, 40) * s, rnd(k, 60, 220) * s, -31) * CFrame.Angles(0, 0, rnd(k, -0.5, 0.5)), vein, "Neon", 0.2, "Leuchtader")
		pulse(k, { v }, 0.3, 0.2, 0.5)
	end
end
function EL.smoker(k, cf, s, c, glow)
	local h = 200 * s
	for st = 0, 3 do P(k, "Cyl", V(40 * s * (1 - st * 0.15), h / 4 + 2, 40 * s * (1 - st * 0.15)), cf * CFrame.new(rnd(k, -3, 3), st * h / 4 + h / 8, 0), c:Lerp(DARK, (st % 2) * 0.15), "Basalt", 0, "Schlot") end
	local top = P(k, "Cyl", V(18 * s, 4, 18 * s), cf * CFrame.new(0, h, 0), glow, "Neon", 0, "Schlotglut")
	pulse(k, { top }, 0.1, 0.1, 0.8)
	local host = P(k, "Block", V(10, 2, 10), cf * CFrame.new(0, h + 2, 0), WHITE, "SmoothPlastic", 1, "Blasenquelle")
	smoke(k, host, { hex("#6a7480"), hex("#2a3036") }, 14, 1.2, 8)
end
function EL.cloudTower(k, cf, s, c)
	local list = collect(k, function()
		for st = 0, 4 do
			local sz = (110 - st * 14) * s
			P(k, "Ball", V(sz * 1.4, sz, sz), cf * CFrame.new(rnd(k, -10, 10), 40 + st * 60 * s, 0), c:Lerp(WHITE, 0.6), "SmoothPlastic", 0, "Wolkenturm")
		end
	end)
	bob(k, list, 4, rnd(k, 0.1, 0.18), rnd(k, 0, 6), 0)
end
function EL.cloudIsle(k, cf, s, c, goldC)
	local list = collect(k, function()
		local base = cf * CFrame.new(0, 90, 0)
		P(k, "Ball", V(90 * s, 40, 70), base, WHITE:Lerp(c, 0.15), "SmoothPlastic", 0, "Wolkeninsel")
		P(k, "Block", V(26 * s, 20 * s, 20 * s), base * CFrame.new(0, 22 + 10 * s, 0), hex("#f4f2fa"), "Marble", 0, "Pavillon")
		prism(k, base * CFrame.new(0, 22 + 20 * s + 8 * s, 0), 32 * s, 16 * s, 26 * s, goldC, "Foil", 0, "Pavillondach")
		P(k, "Block", V(90 * s, 3, 8), base * CFrame.new(-70 * s, 10, -10) * CFrame.Angles(0, 0, 0.12), goldC, "Foil", 0, "Goldbruecke")
	end)
	bob(k, list, 4, rnd(k, 0.15, 0.25), rnd(k, 0, 6), 0.01)
end
function EL.stairs(k, cf, s, c)
	for st = 0, 9 do
		local step = P(k, "Block", V(40 * s, 6, 16 * s), cf * CFrame.new(st * 6 * s, 40 + st * 14 * s, -st * 4), hex("#f8f6f0"):Lerp(k.W.Horizon, 0.15), "Marble", 0, "Treppe")
		local base, ph = step.CFrame, st * 0.6
		anim(k, function(t) step.CFrame = base * CFrame.new(0, math.sin(t * 0.5 + ph) * 3, 0) end)
	end
end
function EL.whiteTree(k, cf, s, c, leaf)
	local h = 220 * s
	P(k, "Cyl", V(16 * s, h * 0.6, 16 * s), cf * CFrame.new(0, 40 + h * 0.3, 0), hex("#f4f0ea"):Lerp(k.W.Horizon, 0.3), "SmoothPlastic", 0, "Lichtbaum")
	for j = 0, 2 do
		P(k, "Ball", V(110 * s, 80 * s, 90 * s), cf * CFrame.new((j - 1) * 40 * s, 40 + h * (0.62 + (j % 2) * 0.12), 0), leaf, "SmoothPlastic", 0, "Goldlaub")
	end
	mound(k, cf, 150 * s, 50, c)
end
function EL.lightPillar(k, cf, s, c)
	local p = P(k, "Cyl", V(30 * s, 420, 30 * s), cf * CFrame.new(0, 210, 0), c, "Neon", 0.7, "Lichtsaeule")
	pulse(k, { p }, 0.72, 0.12, 0.35)
end
function EL.goldColumn(k, cf, s, c)
	local h = 200 * s
	P(k, "Cyl", V(22, h, 22), cf * CFrame.new(0, 40 + h / 2, 0), c, "Foil", 0, "Goldsaeule")
	P(k, "Block", V(36, 12, 36), cf * CFrame.new(0, 46 + h, 0), c, "Foil", 0, "Kapitell")
	P(k, "Ball", V(120 * s, 60, 80), cf * CFrame.new(0, 40, 0), WHITE, "SmoothPlastic", 0, "Wolke")
end

-- Regenbogen: Bögen aus durchscheinenden Neon-Streifen
local function rainbow(k, a, r, R0)
	local cols = { "#ff5a5a", "#ffb05a", "#ffe25f", "#7dff8a", "#5ad1ff", "#b07bff" }
	local x, z = polar(a, r)
	local base = facing(k, x, SEA + 40, z)
	for b, hx in ipairs(cols) do
		local R = R0 - b * 14
		for j = 0, 17 do
			local u = (j + 0.5) / 18 * math.pi
			P(k, "Block", V(TAU * R / 36 * 1.15, 12, 1), base * CFrame.new(math.cos(u) * R, math.sin(u) * R, 0) * CFrame.Angles(0, 0, u - math.pi / 2), hex(hx), "Neon", 0.55, "Regenbogen")
		end
	end
end

-- Sturmring (Neptun)
local function stormRing(k, r, speed)
	local storm = collect(k, function()
		for i = 0, 27 do
			local x, z = polar(i / 28 * TAU, r + math.sin(i) * 30)
			P(k, "Ball", V(80, 26, 60), facing(k, x, 20 + math.sin(i * 1.7) * 30, z), hex("#5a8ae8"):Lerp(WHITE, (i % 3) * 0.15), "SmoothPlastic", 0.45, "Sturmwolke")
		end
	end)
	orbit(k, storm, speed, CFrame.Angles(0.06, 0, 0))
end

-- ── Wahrzeichen je Welt (eine ruhige Bewegung pro Welt) ──
local HELD_BUILD = {}

-- Spawn: goldener Münzberg, Münzen fallen wie ein Wasserfall
function HELD_BUILD.spawn(k)
	local cf = heldAt(k)
	local goldC = hex("#ffcf4a")
	prism(k, cf * CFrame.new(0, 200, 0), 380, 420, 200, goldC, "Foil", 0, "Muenzberg")
	prism(k, cf * CFrame.new(150, 110, -10), 220, 240, 150, goldC:Lerp(DARK, 0.1), "Foil", 0, "Muenzberg")
	for i = 1, 14 do
		local coin = P(k, "Cyl", V(18, 3, 18), cf, hex("#ffe07a"), "Neon", 0.1, "Muenze")
		local ph = i / 14
		anim(k, function(t)
			local u = (t * 0.12 + ph) % 1
			coin.CFrame = cf * CFrame.new(-40 + math.sin(i) * 12, 330 - u * 330, -110 - u * 20) * CFrame.Angles(t * 2 + i, 0, 0.3) * UP
			coin.Transparency = u > 0.9 and (u - 0.9) * 10 or 0.1
		end)
	end
	P(k, "Block", V(40, 330, 4), cf * CFrame.new(-40, 165, -104), hex("#ffe07a"), "Neon", 0.75, "Muenzfall")
end

-- Normal: großer Wasserfallberg, der Bach fällt ins Wolkenmeer
function HELD_BUILD.normal(k)
	local cf = heldAt(k)
	-- Berg aus Dreiecken (Fuß 200, Höhe 480): vorn liegt die Flanke bei y = 0 etwa 200, bei y = 300 etwa 80
	-- Studs vor der Mitte; der Wasserfall folgt dieser Schräge knapp davor
	mountain(k, cf * CFrame.new(0, 0, 60), 200, 480, hex("#6d8aa3"), WHITE, "Rock", "Wasserfallberg")
	mountain(k, cf * CFrame.new(-190, 0, 90), 130, 260, hex("#62809a"), nil, "Rock", "Vorberg")
	mountain(k, cf * CFrame.new(200, 0, 70), 150, 320, hex("#6886a0"), WHITE, "Rock", "Vorberg")
	local top, bottom = V(-30, 300, 60 - 80 - 22), V(-30, 0, 60 - 200 - 22)
	local len = (top - bottom).Magnitude
	local slope = math.atan2(top.Z - bottom.Z, top.Y - bottom.Y)
	local fall = P(k, "Block", V(44, len, 3), cf * CFrame.new((top + bottom) / 2) * CFrame.Angles(slope, 0, 0), hex("#bfe8ff"), "Neon", 0.4, "Wasserfall")
	anim(k, function(t) fall.Transparency = 0.38 + math.sin(t * 1.2) * 0.08 end)
	local host = P(k, "Block", V(60, 2, 20), cf * CFrame.new(bottom.X, 10, bottom.Z - 6), WHITE, "SmoothPlastic", 1, "Gischt")
	smoke(k, host, { WHITE, hex("#e8f6ff") }, 22, 2, 6)
end

-- Wald: Weltenbaum, die Krone im Nebel, wiegt sich
function HELD_BUILD.wald(k)
	local cf = heldAt(k, 500)
	local trunkC = hex("#5a3e28")
	P(k, "Cyl", V(70, 560, 70), cf * CFrame.new(0, 280, 0), trunkC, "Wood", 0, "Weltenbaum")
	for sx = -1, 1, 2 do
		P(k, "Cyl", V(28, 200, 28), cf * CFrame.new(sx * 70, 420, 0) * CFrame.Angles(0, 0, -sx * 0.8), trunkC, "Wood", 0, "Ast")
	end
	local crown = collect(k, function()
		for j = 0, 5 do
			local a = j / 6 * TAU
			P(k, "Ball", V(200, 120, 160), cf * CFrame.new(math.cos(a) * 110, 520 + math.sin(a * 2) * 30, math.sin(a) * 50), hex("#2f6a3a"):Lerp(k.W.Horizon, 0.25), "Grass", 0, "Krone")
		end
		P(k, "Ball", V(420, 120, 260), cf * CFrame.new(0, 500, 0), hex("#e6f2ea"), "SmoothPlastic", 0.55, "Nebel")
	end)
	local pivot = cf * CFrame.new(0, 280, 0)
	local list = offsets(crown, pivot)
	anim(k, function(t)
		local base = pivot * CFrame.Angles(0, 0, math.sin(t * 0.25) * 0.012)
		for _, e in ipairs(list) do e.Part.CFrame = base * e.Offset end
	end)
end

-- Stadt: Fernsehturm mit drehendem Licht
function HELD_BUILD.stadt(k)
	local cf = heldAt(k)
	local c = hex("#d8d4e0"):Lerp(k.W.Horizon, 0.2)
	P(k, "Cyl", V(26, 440, 26), cf * CFrame.new(0, 220, 0), c, "Concrete", 0, "Fernsehturm")
	P(k, "Ball", V(80, 60, 80), cf * CFrame.new(0, 380, 0), c, "Metal", 0, "Turmkugel")
	P(k, "Cyl", V(86, 6, 86), cf * CFrame.new(0, 380, 0), hex("#ffd76a"), "Neon", 0.2, "Aussichtsring")
	P(k, "Cyl", V(4, 90, 4), cf * CFrame.new(0, 485, 0), hex("#e0e0e8"), "Metal", 0, "Antenne")
	P(k, "Ball", V(8, 8, 8), cf * CFrame.new(0, 532, 0), hex("#ff4058"), "Neon", 0, "Positionslicht")
	local beam = P(k, "Block", V(320, 6, 6), cf * CFrame.new(0, 410, 0), hex("#fff2c0"), "Neon", 0.7, "Lichtstrahl")
	local base = beam.CFrame
	anim(k, function(t) beam.CFrame = base * CFrame.Angles(0, t * 0.6, 0) * CFrame.new(160, 0, 0) end)
end

-- Eis: Gletscherwand mit blauen Spalten
function HELD_BUILD.eis(k)
	local cf = heldAt(k, 540)
	P(k, "Block", V(520, 360, 60), cf * CFrame.new(0, 180, 0), hex("#e8f6ff"), "Glacier", 0, "Gletscherwand")
	for j = 0, 3 do prism(k, cf * CFrame.new(-210 + j * 140, 380 + (j % 2) * 30, 0), 140, 70 + (j % 2) * 40, 62, WHITE, "Snow", 0, "Gletscherkamm") end
	local cracks = collect(k, function()
		for j = 1, 7 do P(k, "Block", V(6, rnd(k, 120, 260), 2), cf * CFrame.new(-220 + j * 55, rnd(k, 120, 220), -31) * CFrame.Angles(0, 0, rnd(k, -0.2, 0.2)), hex("#5ab8ff"), "Neon", 0.25, "Spalte") end
	end)
	pulse(k, cracks, 0.35, 0.15, 0.3)
end

-- Lava: großer Vulkan, bricht alle 40 Sekunden aus
function HELD_BUILD.lava(k)
	local cf = heldAt(k)
	local rock = hex("#2a1e1a")
	prism(k, cf * CFrame.new(0, 230, 0), 460, 460, 260, rock, "Basalt", 0, "Grosser Vulkan")
	local crater = P(k, "Cyl", V(90, 10, 110), cf * CFrame.new(0, 410, -20), hex("#ff6a1a"), "Neon", 0, "Krater")
	-- Lavaströme laufen innen an den Flanken vom Krater herab (Flanke: Breite 460, Höhe 460)
	local slope = math.atan2(230, 460)
	for s = -1, 1, 2 do
		local top, L = V(s * 18, 400, -131), 300
		local mid = top + V(s * math.sin(slope), -math.cos(slope), 0) * (L / 2)
		P(k, "Block", V(8, L, 2), cf * CFrame.new(mid) * CFrame.Angles(0, 0, s * slope), hex("#ff6a1a"), "Neon", 0.1, "Lavastrom")
	end
	local host = P(k, "Block", V(40, 2, 40), cf * CFrame.new(0, 416, -20), WHITE, "SmoothPlastic", 1, "Ausbruch")
	local e = Instance.new("ParticleEmitter")
	e.Color = ColorSequence.new(hex("#ffd27a"), hex("#ff3a0a"))
	e.LightEmission = 1
	e.Size = NumberSequence.new(10, 2)
	e.Lifetime = NumberRange.new(3, 5)
	e.Speed = NumberRange.new(60, 110)
	e.SpreadAngle = Vector2.new(25, 25)
	e.Acceleration = V(0, -40, 0)
	e.Rate = 0
	e.Parent = host
	smoke(k, host, { Color3.fromRGB(70, 50, 45), Color3.fromRGB(40, 30, 30) }, 36, 1, 14)
	local last = -1
	anim(k, function(t)
		local cycle = t % 40
		crater.Transparency = cycle < 4 and 0 or 0.15 + math.sin(t) * 0.1
		local n = math.floor(t / 40)
		if n ~= last and cycle < 1 then last = n e:Emit(90) end
	end)
end

-- Höhle: Riesenkristall in der Decke, leuchtet nach unten
function HELD_BUILD.hoehle(k)
	local cf = heldAt(k, 420, 120)
	prism(k, cf * CFrame.new(0, 120, 0) * CFrame.Angles(0, 0, math.pi), 160, 300, 110, hex("#b07bff"), "Glass", 0.15, "Riesenkristall")
	local core = P(k, "Block", V(10, 240, 4), cf * CFrame.new(0, 130, -56), hex("#e8d0ff"), "Neon", 0.3, "Kristallkern")
	local beam = P(k, "Cyl", V(80, 260, 80), cf * CFrame.new(0, -150, 0), hex("#c8a8ff"), "Neon", 0.88, "Lichtkegel")
	anim(k, function(t)
		local u = math.sin(t * 0.4)
		core.Transparency = 0.3 + u * 0.15
		beam.Transparency = 0.88 + u * 0.05
	end)
end

-- Candy: Torte als Berg mit Schokoladenfluss
function HELD_BUILD.candy(k)
	local cf = heldAt(k)
	local tiers = { { 420, 120, "#ffb0d8" }, { 320, 110, "#fff4f8" }, { 220, 100, "#ffb0d8" } }
	local y = 0
	for i, t in ipairs(tiers) do
		P(k, "Cyl", V(t[1], t[2], t[1] * 0.6), cf * CFrame.new(0, y + t[2] / 2, 0), hex(t[3]), "SmoothPlastic", 0, "Torte")
		P(k, "Cyl", V(t[1] + 6, 12, t[1] * 0.6 + 6), cf * CFrame.new(0, y + t[2], 0), hex("#fff8fc"), "SmoothPlastic", 0, "Zuckerguss")
		y = y + t[2]
	end
	local cherry = P(k, "Ball", V(50, 50, 50), cf * CFrame.new(0, y + 25, 0), hex("#e0243a"), "SmoothPlastic", 0, "Kirsche")
	cherry.Reflectance = 0.3
	local flow = P(k, "Block", V(40, y, 4), cf * CFrame.new(60, y / 2, -130), hex("#6a3a1e"), "SmoothPlastic", 0, "Schokofluss")
	local base = flow.CFrame
	anim(k, function(t) flow.CFrame = base * CFrame.new(math.sin(t * 0.3) * 3, 0, 0) end)
end

-- Mond: die Erde, groß und halb beleuchtet, dreht sich langsam
function HELD_BUILD.mond(k)
	local pos = skyPos(k, HELD, 0.35, 470)
	local earth = P(k, "Ball", V(200, 200, 200), CFrame.new(pos), hex("#2a6ad1"), "SmoothPlastic", 0, "Erde")
	local land = collect(k, function()
		for j = 1, 6 do
			local a, b = rnd(k, 0, TAU), rnd(k, -0.8, 0.8)
			local d = V(math.cos(b) * math.cos(a), math.sin(b), math.cos(b) * math.sin(a))
			P(k, "Ball", V(rnd(k, 50, 80), rnd(k, 40, 60), 14), CFrame.lookAt(pos + d * 96, pos + d * 200), j % 3 == 0 and WHITE or hex("#3fae5a"), "SmoothPlastic", 0, "Kontinent")
		end
	end)
	local list = offsets(land, CFrame.new(pos))
	anim(k, function(t)
		local base = CFrame.new(pos) * CFrame.Angles(0, t * 0.03, 0)
		for _, e in ipairs(list) do e.Part.CFrame = base * e.Offset end
	end)
	-- Nachtseite: dunkle Halbkugel davor
	P(k, "Ball", V(206, 206, 206), CFrame.lookAt(pos, k.C) * CFrame.new(70, 0, 0), hex("#05060c"), "SmoothPlastic", 0.25, "Nachtseite")
	P(k, "Ball", V(230, 230, 230), CFrame.new(pos), hex("#7ab0ff"), "Neon", 0.9, "Atmosphaere")
end

-- Neptun: großer dunkler Fleck, ein Sturmauge mit Blitzen
function HELD_BUILD.neptun(k)
	local pos = skyPos(k, HELD, 0.3, 520)
	local face = CFrame.lookAt(pos, k.C)
	P(k, "Ball", V(300, 180, 30), face, hex("#0a1440"), "SmoothPlastic", 0.1, "Sturmauge")
	local rings = collect(k, function()
		for j = 1, 3 do P(k, "Ball", V(300 + j * 60, 180 + j * 36, 10), face * CFrame.new(0, 0, 6 + j * 2), hex("#3a6ad8"):Lerp(WHITE, j * 0.1), "Neon", 0.82, "Sturmring") end
	end)
	local list = offsets(rings, face)
	local flash = P(k, "Block", V(6, 120, 2), face * CFrame.new(40, 10, -20) * CFrame.Angles(0, 0, 0.4), hex("#e8f6ff"), "Neon", 1, "Blitz")
	anim(k, function(t)
		local base = face * CFrame.Angles(0, 0, t * 0.05)
		for _, e in ipairs(list) do e.Part.CFrame = base * e.Offset end
		local u = (t * 0.7) % 7
		flash.Transparency = (u < 0.12 or (u > 0.25 and u < 0.33)) and 0 or 1
	end)
end

-- Mars: Olympus Mons, flacher Riesenvulkan
function HELD_BUILD.mars(k)
	local cf = heldAt(k, 560)
	local c = hex("#a84a24")
	prism(k, cf * CFrame.new(0, 130, 0), 760, 260, 220, c, "Sandstone", 0, "Olympus Mons")
	P(k, "Cyl", V(140, 10, 100), cf * CFrame.new(0, 255, -10), c:Lerp(DARK, 0.25), "Sandstone", 0, "Caldera")
	local host = P(k, "Block", V(500, 2, 40), cf * CFrame.new(0, 40, -120), WHITE, "SmoothPlastic", 1, "Staub")
	local e = smoke(k, host, { hex("#d8784a"), hex("#a84a24") }, 30, 1.5, 12)
	e.Acceleration = V(6, 0, 0)
end

-- Saturn: der Planet mit Ring, schräg über dem Horizont; der Ring dreht sich langsam
function HELD_BUILD.saturn(k)
	local pos = skyPos(k, HELD, 0.32, 500)
	P(k, "Ball", V(220, 200, 220), CFrame.new(pos) * CFrame.Angles(0.35, 0, 0.2), hex("#e0c08a"), "SmoothPlastic", 0, "Saturn")
	for j = 1, 3 do P(k, "Ball", V(222, 16, 222), CFrame.new(pos + V(0, -40 + j * 22, 0)) * CFrame.Angles(0.35, 0, 0.2), hex("#c8a060"):Lerp(WHITE, j * 0.1), "SmoothPlastic", 0, "Wolkenband") end
	local ring = collect(k, function()
		for j = 0, 35 do
			local a = j / 36 * TAU
			P(k, "Block", V(46, 3, 24), CFrame.new(pos) * CFrame.Angles(0.35, 0, 0.2) * CFrame.new(math.cos(a) * 190, 0, math.sin(a) * 190) * CFrame.Angles(0, -a, 0), hex("#ffe2a0"):Lerp(hex("#b0905a"), (j % 3) / 3), "SmoothPlastic", 0.15, "Ring")
		end
	end)
	local pivot = CFrame.new(pos) * CFrame.Angles(0.35, 0, 0.2)
	local list = offsets(ring, pivot)
	anim(k, function(t)
		local base = pivot * CFrame.Angles(0, t * 0.02, 0)
		for _, e in ipairs(list) do e.Part.CFrame = base * e.Offset end
	end)
end

-- Alien: Mutterschiff schwebt über dem Horizont
function HELD_BUILD.alien(k)
	local cf = heldAt(k, 520, 160)
	local parts = collect(k, function()
		P(k, "Ball", V(420, 60, 300), cf, hex("#5a5a6a"), "Metal", 0, "Mutterschiff")
		P(k, "Ball", V(160, 80, 120), cf * CFrame.new(0, 30, 0), hex("#7aff5a"), "Glass", 0.3, "Kuppel")
		for j = 0, 13 do
			local a = j / 14 * TAU
			P(k, "Ball", V(14, 8, 14), cf * CFrame.new(math.cos(a) * 200, -8, math.sin(a) * 140), hex("#7aff5a"), "Neon", 0, "Bordlicht")
		end
		P(k, "Cyl", V(120, 300, 90), cf * CFrame.new(0, -170, 0), hex("#7aff5a"), "Neon", 0.9, "Traktorstrahl")
	end)
	bob(k, parts, 8, 0.2, 0, 0.01)
end

-- Sonne: große Protuberanz, pulsiert
function HELD_BUILD.sonne(k)
	local cf = heldAt(k, 540)
	local list = collect(k, function()
		for j = 0, 23 do
			local u = j / 23 * math.pi
			P(k, "Ball", V(60, 60, 60), cf * CFrame.new(math.cos(u) * 230, 40 + math.sin(u) * 330, 0), hex("#fff2a0"):Lerp(hex("#ff6a1a"), (j % 4) / 4), "Neon", 0.15, "Protuberanz")
		end
	end)
	pulse(k, list, 0.3, 0.25, 0.4)
end

-- Korallenriff: Riffwand mit Höhle, ein Wal schwimmt hindurch (Wal aus dem Leben)
function HELD_BUILD.korallenriff(k)
	local cf = heldAt(k)
	local c = hex("#c87a6a")
	for sx = -1, 1, 2 do P(k, "Block", V(180, 380, 90), cf * CFrame.new(sx * 160, 190, 0), c:Lerp(sx > 0 and hex("#ff7a8a") or hex("#ffb05a"), 0.3), "Rock", 0, "Riffwand") end
	P(k, "Block", V(500, 120, 90), cf * CFrame.new(0, 380, 0), c, "Rock", 0, "Riffwand")
	for j = 1, 8 do P(k, "Ball", V(50, 40, 50), cf * CFrame.new(rnd(k, -240, 240), rnd(k, 60, 440), -46), ({ hex("#ff7a8a"), hex("#ffb05a"), hex("#c87aff"), hex("#5ad1c8") })[j % 4 + 1], "SmoothPlastic", 0, "Koralle") end
	local glow = P(k, "Block", V(120, 240, 4), cf * CFrame.new(0, 150, 30), hex("#2ab0c8"), "Neon", 0.6, "Hoehlenlicht")
	pulse(k, { glow }, 0.6, 0.1, 0.3)
end

-- Muschelland: Riesenmuschel öffnet sich, die Perle leuchtet
function HELD_BUILD.muschelland(k)
	local cf = heldAt(k)
	local hinge = cf * CFrame.new(0, 60, 80)
	local c = hex("#ffd0e8")
	P(k, "Ball", V(360, 60, 260), cf * CFrame.new(0, 60, 0), c, "SmoothPlastic", 0, "Riesenmuschel")
	local pearl = P(k, "Ball", V(90, 90, 90), cf * CFrame.new(0, 110, -20), hex("#fff4f8"), "Neon", 0.1, "Perle")
	local top = collect(k, function()
		P(k, "Ball", V(360, 60, 260), cf * CFrame.new(0, 90, 0), c:Lerp(WHITE, 0.15), "SmoothPlastic", 0, "Muscheldeckel")
		for r = -3, 3 do P(k, "Block", V(8, 8, 240), cf * CFrame.new(r * 40, 120, 0), c:Lerp(WHITE, 0.35), "SmoothPlastic", 0, "Rippe") end
	end)
	local list = offsets(top, hinge)
	anim(k, function(t)
		local open = (math.sin(t * 0.2) + 1) / 2
		local base = hinge * CFrame.Angles(-open * 0.6, 0, 0)
		for _, e in ipairs(list) do e.Part.CFrame = base * e.Offset end
		pearl.Transparency = 0.4 - open * 0.35
	end)
end

-- Atlantis: versunkener Tempelberg mit goldener Kuppel
function HELD_BUILD.atlantis(k)
	local cf = heldAt(k)
	local c = hex("#d8e4ea")
	for st = 0, 4 do
		P(k, "Block", V(460 - st * 80, 70, 260 - st * 40), cf * CFrame.new(0, 35 + st * 70, 0), c:Lerp(DARK, (st % 2) * 0.06), "Marble", 0, "Tempelberg")
	end
	for p = -2, 2 do P(k, "Cyl", V(16, 90, 16), cf * CFrame.new(p * 30, 395, -60), c, "Marble", 0, "Saeule") end
	local dome = P(k, "Ball", V(150, 120, 150), cf * CFrame.new(0, 440, 0), hex("#ffd76a"), "Foil", 0, "Goldkuppel")
	dome.Reflectance = 0.3
	local glow = P(k, "Ball", V(190, 160, 190), cf * CFrame.new(0, 440, 0), hex("#ffe7a8"), "Neon", 0.85, "Kuppelschein")
	pulse(k, { glow }, 0.85, 0.06, 0.3)
end

-- Tiefseegraben: Anglerfisch mit Leuchtköder in der Dunkelheit
function HELD_BUILD.tiefseegraben(k)
	local cf = heldAt(k, 500, 30)
	local skin = hex("#0e141c")
	local parts = collect(k, function()
		P(k, "Ball", V(300, 240, 360), cf * CFrame.new(0, 120, 0), skin, "SmoothPlastic", 0, "Anglerfisch")
		for j = -4, 4 do prism(k, cf * CFrame.new(j * 26, 60, -170) * CFrame.Angles(0, 0, math.pi), 16, 40, 12, hex("#d8d8d0"), "SmoothPlastic", 0, "Zahn") end
		for sx = -1, 1, 2 do P(k, "Ball", V(40, 40, 20), cf * CFrame.new(sx * 80, 190, -150), hex("#5affd8"), "Neon", 0.2, "Auge") end
		P(k, "Cyl", V(8, 200, 8), cf * CFrame.new(0, 320, -60) * CFrame.Angles(-0.6, 0, 0), skin, "SmoothPlastic", 0, "Angel")
	end)
	local lure = P(k, "Ball", V(40, 40, 40), cf * CFrame.new(0, 400, -130), hex("#5affd8"), "Neon", 0, "Leuchtkoeder")
	local halo = P(k, "Ball", V(110, 110, 110), cf * CFrame.new(0, 400, -130), hex("#5affd8"), "Neon", 0.85, "Koederschein")
	bob(k, parts, 6, 0.15, 0, 0)
	local base = lure.CFrame
	anim(k, function(t)
		local swing = base * CFrame.new(math.sin(t * 0.5) * 12, math.sin(t * 0.8) * 10, 0)
		lure.CFrame = swing
		halo.CFrame = swing
		halo.Transparency = 0.82 + math.sin(t * 1.6) * 0.06
	end)
end

-- Wolkenburg: Burg auf einer Wolkensäule
function HELD_BUILD.wolkenburg(k)
	local cf = heldAt(k, 520)
	local parts = collect(k, function()
		for st = 0, 5 do
			local sz = 220 - st * 12
			P(k, "Ball", V(sz * 1.3, 90, sz), cf * CFrame.new(rnd(k, -14, 14), 30 + st * 60, 0), WHITE:Lerp(hex("#e8e4ff"), (st % 2) * 0.5), "SmoothPlastic", 0, "Wolkensaeule")
		end
		local top = cf * CFrame.new(0, 360, 0)
		local marble = hex("#f4f2fa")
		P(k, "Block", V(120, 90, 80), top * CFrame.new(0, 45, 0), marble, "Marble", 0, "Burg")
		for sx = -1, 1, 2 do
			P(k, "Cyl", V(40, 140, 40), top * CFrame.new(sx * 80, 70, 0), marble, "Marble", 0, "Burgturm")
			prism(k, top * CFrame.new(sx * 80, 165, 0), 50, 50, 50, hex("#8a9ae8"), "SmoothPlastic", 0, "Turmdach")
		end
		prism(k, top * CFrame.new(0, 125, 0), 90, 70, 70, hex("#8a9ae8"), "SmoothPlastic", 0, "Dach")
		P(k, "Ball", V(16, 16, 16), top * CFrame.new(0, 172, 0), hex("#ffd76a"), "Neon", 0, "Goldkugel")
	end)
	bob(k, parts, 6, 0.12, 0, 0)
end

-- Engelsgarten: Lichtbaum mit goldenem Laub, leuchtet im Takt
function HELD_BUILD.engelsgarten(k)
	local cf = heldAt(k, 500)
	P(k, "Cyl", V(50, 380, 50), cf * CFrame.new(0, 190, 0), hex("#f4f0ea"), "SmoothPlastic", 0, "Lichtbaum")
	for sx = -1, 1, 2 do P(k, "Cyl", V(22, 160, 22), cf * CFrame.new(sx * 60, 320, 0) * CFrame.Angles(0, 0, -sx * 0.7), hex("#f4f0ea"), "SmoothPlastic", 0, "Ast") end
	local leaves = collect(k, function()
		for j = 0, 6 do
			local a = j / 7 * TAU
			P(k, "Ball", V(180, 120, 140), cf * CFrame.new(math.cos(a) * 120, 420 + math.sin(a * 2) * 30, math.sin(a) * 40), hex("#ffd76a"), "Neon", 0.25, "Goldlaub")
		end
	end)
	pulse(k, leaves, 0.3, 0.12, 0.35)
end

-- Götterthron: Thron auf dem höchsten Gipfel, die Sonnenscheibe dahinter glüht
function HELD_BUILD.goetterthron(k)
	local cf = heldAt(k, 540)
	prism(k, cf * CFrame.new(0, 240, 0), 400, 520, 220, hex("#d8c090"), "Rock", 0, "Hoechster Gipfel")
	prism(k, cf * CFrame.new(0, 420, -3), 140, 160, 226, hex("#fff8e8"), "Snow", 0, "Gipfelschnee")
	local top = cf * CFrame.new(0, 500, -20)
	P(k, "Block", V(60, 26, 40), top * CFrame.new(0, 13, 0), hex("#ffcf4a"), "Foil", 0, "Thron")
	P(k, "Block", V(60, 80, 10), top * CFrame.new(0, 50, 20), hex("#ffcf4a"), "Foil", 0, "Thronlehne")
	local disk = P(k, "Cyl", V(120, 4, 120), top * CFrame.new(0, 90, 30) * CFrame.Angles(math.pi / 2, 0, 0), hex("#ffe7a8"), "Neon", 0.2, "Sonnenscheibe")
	pulse(k, { disk }, 0.25, 0.15, 0.3)
end

-- ── Tiefen je Welt (nah, mitte, fern) ──
local LAYERS = {}
LAYERS.spawn = function(k, w)
	islets(k, 5, w.Ground, hex("#7a5a3a"), function(cf, s) P(k, "Block", V(s * 0.8, s * 0.5, s * 0.6), cf * CFrame.new(0, s * 0.25, 0), hex("#e8c890"), "WoodPlanks", 0, "Marktstand") end)
	layer(k, "mitte", 4, 3, { hex("#4f9a46"), hex("#5fae4f") }, function(cf, s, c, i) if i == 1 then EL.windmill(k, cf, s, c) else EL.trees(k, cf, s, c) end end)
	layer(k, "fern", 4, 4, { hex("#c0a890"), hex("#d0b8a0") }, function(cf, s, c) EL.peak(k, cf, s, c, hex("#fff4e8")) end)
end
LAYERS.normal = function(k, w)
	layer(k, "nah", 4, 2, { hex("#5fae4f"), hex("#4f9a46") }, function(cf, s, c) EL.hill(k, cf, s, c) end)
	layer(k, "mitte", 4, 3, { hex("#3f7a3a"), hex("#4a8a44") }, function(cf, s, c, i) if i == 1 then EL.castle(k, cf, s, c) else EL.trees(k, cf, s, c) end end)
	layer(k, "fern", 4, 4, { hex("#5f7f9a"), hex("#6d8aa3") }, function(cf, s, c) EL.peak(k, cf, s, c, WHITE) end)
end
LAYERS.wald = function(k, w)
	layer(k, "nah", 4, 2, { hex("#3a6a3a") }, function(cf, s, c, i) EL.mushroom(k, cf, s, c, i == 0 and hex("#d8322e") or hex("#c88a3a")) end)
	layer(k, "mitte", 3, 5, { hex("#2f5a38"), hex("#355e40") }, function(cf, s, c) EL.trees(k, cf, s, c) end)
	-- Nebelschwaden malt das Himmelsbild (assets/himmel/wald)
	layer(k, "fern", 4, 4, { hex("#3a6a6a"), hex("#4a7a7a") }, function(cf, s, c) EL.ridge(k, cf, s, c) end)
end
LAYERS.stadt = function(k, w)
	layer(k, "nah", 3, 2, { hex("#8a8f99") }, function(cf, s, c) EL.bridge(k, cf, s, c) end)
	layer(k, "mitte", 3, 6, { hex("#5a5560"), hex("#6a6270"), hex("#4a4652") }, function(cf, s, c) EL.tower(k, cf, s, c, hex("#ffd76a")) end)
	layer(k, "fern", 4, 7, { hex("#5a5560"), hex("#6a6270") }, function(cf, s, c) EL.tower(k, cf, s * 0.55, c, hex("#ffe8a0")) end)
end
LAYERS.eis = function(k, w)
	layer(k, "nah", 4, 2, { WHITE }, function(cf, s, c) EL.floe(k, cf, s, c) end)
	layer(k, "mitte", 4, 3, { hex("#cfeeff"), hex("#9fd8ff") }, function(cf, s, c) EL.spike(k, cf, s, c, "Ice", 0.1) end)
	layer(k, "fern", 4, 4, { hex("#dceaf6"), hex("#e8f2fa") }, function(cf, s, c) EL.peak(k, cf, s, c, WHITE, "Glacier") end)
end
LAYERS.lava = function(k, w)
	local lava = hex("#ff6a1a")
	layer(k, "nah", 3, 2, { hex("#2c2420") }, function(cf, s, c) EL.lavaLake(k, cf, s, c, lava) end)
	layer(k, "mitte", 4, 3, { hex("#2a1e1a"), hex("#3a2a24") }, function(cf, s, c, i) if i == 1 then EL.volcano(k, cf, s, c, lava) else EL.basalt(k, cf, s, c) end end)
	layer(k, "fern", 4, 3, { hex("#3a2020") }, function(cf, s, c) EL.smokeWall(k, cf, s, c, hex("#ff3a0a")) end)
end
LAYERS.hoehle = function(k, w)
	layer(k, "nah", 4, 3, { hex("#2a2534"), hex("#352e44") }, function(cf, s, c) EL.stalagmite(k, cf, s, c, hex("#6ae8ff")) end)
	layer(k, "mitte", 4, 3, { hex("#b07bff"), hex("#6ae8ff"), hex("#8a5aff") }, function(cf, s, c) EL.crystal(k, cf, s, c) end)
	-- Höhlenwand rundherum, an einer Stelle eine Öffnung mit Tageslicht
	for i = 0, 17 do
		local a = i / 18 * TAU
		if math.abs(((a - HELD + math.pi) % TAU) - math.pi) > 0.3 then
			local x, z = polar(a, 615)
			EL.caveWall(k, facing(k, x, SEA, z), 1, tint(k, hex("#1e1a28"), 0.5))
		end
	end
	local x, z = polar(HELD + 1.6, 610)
	local opening = P(k, "Ball", V(120, 170, 10), facing(k, x, 40, z), hex("#fff4d8"), "Neon", 0.2, "Tageslicht")
	pulse(k, { opening }, 0.25, 0.08, 0.2)
	for i = 0, 13 do
		local a = i / 14 * TAU + 0.2
		local px, pz = polar(a, 470)
		prism(k, facing(k, px, 330 - 70, pz) * CFrame.Angles(0, 0, math.pi), 70, 140, 50, hex("#2a2534"), "Slate", 0, "Tropfstein")
	end
end
LAYERS.candy = function(k, w)
	layer(k, "nah", 4, 2, { hex("#ff5fb0"), hex("#5fd3ff"), hex("#ffe25f") }, function(cf, s, c) EL.lolli(k, cf, s, c) end)
	layer(k, "mitte", 4, 3, { hex("#ffd0e8"), hex("#c8ecff"), hex("#fff0b0") }, function(cf, s, c) EL.waffle(k, cf, s, c) end)
	layer(k, "fern", 4, 4, { hex("#ffb0d8"), hex("#c8a0ff"), hex("#a0e8d0") }, function(cf, s, c) EL.hill(k, cf, s, c) end)
end
LAYERS.mond = function(k, w)
	layer(k, "nah", 4, 2, { hex("#8a8d96") }, function(cf, s, c) EL.craterRim(k, cf, s, c) end)
	rockBelt(k, 30, { hex("#8a8d96"), hex("#6a6d76") }, 480, 560, -20, 40, "Rock", 0.006)
	nebula(k, { hex("#3a4a8a"), hex("#5a3a8a"), hex("#8a8ab0") }, 6)
end
LAYERS.neptun = function(k, w)
	layer(k, "nah", 4, 3, { hex("#3a6fd1"), hex("#5a9aff") }, function(cf, s, c) EL.spike(k, cf, s, c, "Ice", 0.1) end)
	stormRing(k, 520, 0.05)
	P(k, "Ball", V(90, 90, 90), CFrame.new(skyPos(k, HELD + 1.2, 0.12, 560)), hex("#b8c8e0"):Lerp(k.W.Horizon, 0.5), "SmoothPlastic", 0, "Triton")
end
LAYERS.mars = function(k, w)
	layer(k, "nah", 4, 2, { hex("#c4582e") }, function(cf, s, c) EL.dune(k, cf, s, c) end)
	layer(k, "mitte", 3, 4, { hex("#a84a24"), hex("#8a3a1e"), hex("#c4602e") }, function(cf, s, c) EL.mesa(k, cf, s, c) end)
	moon(k, HELD + 1.0, 0.45, hex("#c8a890"), 36)
	moon(k, HELD - 1.3, 0.3, hex("#a89078"), 22)
end
LAYERS.saturn = function(k, w)
	local big = collect(k, function()
		P(k, "Ball", V(70, 50, 60), at(k, 420, 20, 0), hex("#b0905a"), "Sandstone", 0, "Ringbrocken")
	end)
	orbit(k, big, 0.02)
	rockBelt(k, 60, { hex("#e0c08a"), hex("#b0905a"), hex("#ffe2a0") }, 480, 560, 0, 12, "Sandstone", 0.01, CFrame.Angles(0.1, 0, 0.04))
	nebula(k, { hex("#c8a060"), hex("#8a6a3a") }, 5)
end
LAYERS.alien = function(k, w)
	layer(k, "nah", 4, 3, { hex("#4a2478") }, function(cf, s, c, i) EL.spire(k, cf, s, c, ({ hex("#7aff5a"), hex("#5affd8"), hex("#d97aff") })[i % 3 + 1]) end)
	layer(k, "mitte", 4, 2, { hex("#7a3ab0"), hex("#5a2a90") }, function(cf, s, c) EL.mushroom(k, cf, s, c, hex("#7aff5a"):Lerp(k.W.Horizon, 0.3)) end)
	sun(k, HELD + 0.9, 0.3, hex("#9aff7a"), 50, hex("#7aff5a"))
	sun(k, HELD - 1.1, 0.22, hex("#e0a0ff"), 36, hex("#b07bff"))
end
LAYERS.sonne = function(k, w)
	rockBelt(k, 30, { hex("#a02a08"), hex("#e05a10") }, 380, 460, -60, 30, "CrackedLava", 0.01)
	layer(k, "mitte", 4, 2, { hex("#fff2a0"), hex("#ffb02e") }, function(cf, s, c, i) EL.flare(k, cf, s * (i == 0 and 1 or 0.6), c) end)
	-- Korona-Ring hoch über allem
	local ring = collect(k, function()
		for j = 0, 39 do
			local x, z = polar(j / 40 * TAU, 560)
			P(k, "Block", V(92, 10, 1), facing(k, x, 150 + math.sin(j * 1.3) * 12, z), hex("#ffd27a"), "Neon", 0.75, "Korona")
		end
	end)
	pulse(k, ring, 0.75, 0.1, 0.25)
end
LAYERS.korallenriff = function(k, w)
	layer(k, "nah", 4, 4, { hex("#3a8a4a"), hex("#2f7a42") }, function(cf, s, c) EL.kelp(k, cf, s, c) end)
	layer(k, "mitte", 4, 3, { hex("#ff7a8a"), hex("#ffb05a"), hex("#c87aff"), hex("#5ad1c8") }, function(cf, s, c) EL.coral(k, cf, s, c) end)
	layer(k, "fern", 4, 3, { hex("#2a6a8a") }, function(cf, s, c) EL.reef(k, cf, s, c) end)
end
LAYERS.muschelland = function(k, w)
	layer(k, "nah", 4, 2, { hex("#8a7a6a") }, function(cf, s, c) EL.rockStar(k, cf, s, c) end)
	layer(k, "mitte", 4, 2, { hex("#ffd0e8"), hex("#ffe6c8"), hex("#c8a888") }, function(cf, s, c, i) if i == 0 then EL.shell(k, cf, s, c) else EL.arch(k, cf, s, c) end end)
	layer(k, "fern", 4, 3, { hex("#ffe6c8") }, function(cf, s, c) EL.sandbank(k, cf, s, c) end)
end
LAYERS.atlantis = function(k, w)
	layer(k, "nah", 4, 2, { hex("#d8e4ea") }, function(cf, s, c, i) EL.column(k, cf, s, c, i == 0) end)
	layer(k, "mitte", 3, 2, { hex("#c8d4da") }, function(cf, s, c) EL.ruin(k, cf, s, c) end)
	-- Riesenstatue als Umriss in der Ferne
	local x, z = polar(HELD + 2.2, 615)
	local cf = facing(k, x, SEA, z)
	local c = tint(k, hex("#a8b8c0"), 0.7)
	P(k, "Block", V(90, 220, 60), cf * CFrame.new(0, 110, 0), c, "Marble", 0, "Statue")
	P(k, "Ball", V(60, 70, 60), cf * CFrame.new(0, 255, 0), c, "Marble", 0, "Statue")
	P(k, "Block", V(20, 160, 20), cf * CFrame.new(70, 240, 0) * CFrame.Angles(0, 0, -0.3), c, "Marble", 0, "Statue")
	P(k, "Cyl", V(6, 140, 6), cf * CFrame.new(95, 300, 0), c, "Marble", 0, "Dreizack")
end
LAYERS.tiefseegraben = function(k, w)
	layer(k, "nah", 4, 3, { hex("#10161e"), hex("#161e28") }, function(cf, s, c) EL.cliff(k, cf, s, c, hex("#5affd8")) end)
	layer(k, "mitte", 3, 2, { hex("#1e242c") }, function(cf, s, c) EL.smoker(k, cf, s, c, hex("#ff8a3a")) end)
	stars(k, 60, { hex("#5affd8"), hex("#7ad0ff"), hex("#ff7ae0") }, -0.1)
end
LAYERS.wolkenburg = function(k, w)
	layer(k, "nah", 3, 2, { WHITE }, function(cf, s, c) EL.cloudIsle(k, cf, s, c, hex("#ffd76a")) end)
	layer(k, "mitte", 4, 3, { hex("#e8e4ff"), WHITE }, function(cf, s, c) EL.cloudTower(k, cf, s, c) end)
	rainbow(k, HELD + 1.4, 600, 260)
end
LAYERS.engelsgarten = function(k, w)
	layer(k, "nah", 3, 2, { WHITE }, function(cf, s, c) EL.stairs(k, cf, s, c) end)
	layer(k, "mitte", 4, 3, { hex("#e8f4d8") }, function(cf, s, c) EL.whiteTree(k, cf, s, c, hex("#ffd76a"):Lerp(k.W.Horizon, 0.3)) end)
	layer(k, "fern", 5, 2, { hex("#fff2c0"), WHITE }, function(cf, s, c) EL.lightPillar(k, cf, s, c) end)
end
LAYERS.goetterthron = function(k, w)
	layer(k, "nah", 4, 2, { hex("#ffcf4a") }, function(cf, s, c) EL.goldColumn(k, cf, s, hex("#ffcf4a")) end)
	layer(k, "mitte", 4, 3, { hex("#d8c090"), hex("#c8b080") }, function(cf, s, c) EL.peak(k, cf, s, c, hex("#fff8e8")) end)
	stars(k, 120, { WHITE, hex("#ffe8c8") }, 0.35)
end

-- Fernkulisse einer Welt: Wahrzeichen, Tiefen, Horizontband
local function horizon(k, id)
	if HELD_BUILD[id] then HELD_BUILD[id](k) end
	if LAYERS[id] then LAYERS[id](k, k.W) end
	horizonBand(k)
end

-- ── Leben ──
-- Vogel (oder Fledermaus): Körper und zwei Flügel; gibt eine Stellfunktion zurück
local function flyer(k, color, s, wingColor)
	local body = P(k, "Ball", V(0.8, 0.7, 2) * s, CFrame.new(k.C), color, "SmoothPlastic", 0, "Vogel")
	local wl = P(k, "Block", V(2.2, 0.12, 0.9) * s, CFrame.new(k.C), wingColor or color, "SmoothPlastic", 0, "Fluegel")
	local wr = P(k, "Block", V(2.2, 0.12, 0.9) * s, CFrame.new(k.C), wingColor or color, "SmoothPlastic", 0, "Fluegel")
	return function(cf, flap)
		body.CFrame = cf
		wl.CFrame = cf * CFrame.new(-0.35 * s, 0.1 * s, 0) * CFrame.Angles(0, 0, flap) * CFrame.new(-1.1 * s, 0, 0)
		wr.CFrame = cf * CFrame.new(0.35 * s, 0.1 * s, 0) * CFrame.Angles(0, 0, -flap) * CFrame.new(1.1 * s, 0, 0)
	end
end

-- Schwarm zieht auf einem Kreis um die Insel; maker baut ein Tier und gibt seine Stellfunktion zurück
local function flock(k, n, r, y, speed, spread, maker, flapSpeed, flapAmp)
	local members = {}
	for i = 1, n do
		table.insert(members, { Set = maker(i), Off = V(rnd(k, -spread, spread), rnd(k, -spread * 0.3, spread * 0.3), rnd(k, -spread, spread)), Ph = rnd(k, 0, 6) })
	end
	local a0 = rnd(k, 0, TAU)
	local dir = speed >= 0 and 1 or -1
	anim(k, function(t)
		local a = a0 + t * speed
		local center = k.C + V(math.cos(a) * r, y + math.sin(t * 0.2) * 6, math.sin(a) * r)
		local tangent = V(-math.sin(a), 0, math.cos(a)) * dir
		local frame = CFrame.lookAt(center, center + tangent)
		for _, m in ipairs(members) do
			local cf = frame * CFrame.new(m.Off + V(0, math.sin(t * 0.8 + m.Ph) * 1.5, 0))
			m.Set(cf * CFrame.Angles(0, 0, -0.15 * dir), math.sin(t * flapSpeed + m.Ph) * flapAmp)
		end
	end)
end

local function birds(k, flocks, color, s, wing)
	for f = 1, flocks do
		flock(k, 6, rnd(k, 170, 260), rnd(k, 50, 110), (f % 2 == 0 and -1 or 1) * rnd(k, 0.035, 0.05), 14, function() return flyer(k, color, s or 2, wing) end, 4, 0.45)
	end
end

local function bats(k, flocks, color)
	for f = 1, flocks do
		flock(k, 7, rnd(k, 150, 240), rnd(k, 40, 100), (f % 2 == 0 and -1 or 1) * 0.06, 16, function() return flyer(k, color, 1.6) end, 9, 0.7)
	end
end

-- Schmetterlinge flattern in Achten über der Insel
local function butterflies(k, n, colors)
	for i = 1, n do
		local c = colors[i % #colors + 1]
		local body = P(k, "Block", V(0.25, 0.25, 1.4), CFrame.new(k.C), hex("#2a2030"), "SmoothPlastic", 0, "Schmetterling")
		local wl = P(k, "Block", V(1.4, 0.08, 1.3), CFrame.new(k.C), c, "SmoothPlastic", 0, "Schmetterling")
		local wr = P(k, "Block", V(1.4, 0.08, 1.3), CFrame.new(k.C), c, "SmoothPlastic", 0, "Schmetterling")
		local r, y, ph, sp = rnd(k, 50, 120), rnd(k, 12, 40), rnd(k, 0, 6), rnd(k, 0.08, 0.14)
		anim(k, function(t)
			local a = t * sp + ph
			local p = k.C + V(math.cos(a) * r, y + math.sin(a * 2.3) * 6, math.sin(a * 2) * r * 0.6)
			local q = k.C + V(math.cos(a + 0.05) * r, y + math.sin((a + 0.05) * 2.3) * 6, math.sin((a + 0.05) * 2) * r * 0.6)
			local cf = CFrame.lookAt(p, q)
			local flap = 0.2 + math.abs(math.sin(t * 7 + ph)) * 1.1
			body.CFrame = cf
			wl.CFrame = cf * CFrame.Angles(0, 0, flap) * CFrame.new(-0.7, 0, 0)
			wr.CFrame = cf * CFrame.Angles(0, 0, -flap) * CFrame.new(0.7, 0, 0)
		end)
	end
end

-- Fisch: Körper und Schwanzflosse
local function fishMaker(k, colors, s)
	return function(i)
		local c = colors[i % #colors + 1]
		local body = P(k, "Ball", V(0.9, 1.4, 2.6) * s, CFrame.new(k.C), c, "SmoothPlastic", 0, "Fisch")
		local tail = P(k, "Block", V(0.15, 1.3, 0.9) * s, CFrame.new(k.C), c:Lerp(WHITE, 0.3), "SmoothPlastic", 0, "Flosse")
		return function(cf, wag)
			body.CFrame = cf
			tail.CFrame = cf * CFrame.new(0, 0, 1.3 * s) * CFrame.Angles(0, wag, 0) * CFrame.new(0, 0, 0.4 * s)
		end
	end
end
local function fishSchools(k, n, colors)
	for f = 1, n do
		flock(k, 9, rnd(k, 150, 250), rnd(k, -10, 70), (f % 2 == 0 and -1 or 1) * rnd(k, 0.04, 0.06), 12, fishMaker(k, colors, 1.8), 5, 0.45)
	end
end

-- Wal zieht weit draußen seine Kreise
local function whale(k, color, belly)
	local body = P(k, "Ball", V(24, 20, 70), CFrame.new(k.C), color, "SmoothPlastic", 0, "Wal")
	local under = P(k, "Ball", V(20, 12, 56), CFrame.new(k.C), belly, "SmoothPlastic", 0, "Wal")
	local tail = P(k, "Block", V(34, 3, 12), CFrame.new(k.C), color, "SmoothPlastic", 0, "Wal")
	local finL = P(k, "Block", V(16, 2, 8), CFrame.new(k.C), color, "SmoothPlastic", 0, "Wal")
	local finR = P(k, "Block", V(16, 2, 8), CFrame.new(k.C), color, "SmoothPlastic", 0, "Wal")
	local r, y, a0 = 420, rnd(k, 90, 140), rnd(k, 0, TAU)
	anim(k, function(t)
		local a = a0 + t * 0.02
		local p = k.C + V(math.cos(a) * r, y + math.sin(t * 0.3) * 8, math.sin(a) * r)
		local cf = CFrame.lookAt(p, p + V(-math.sin(a), math.cos(t * 0.3) * 0.08, math.cos(a))) * CFrame.Angles(0, 0, -0.1)
		local beat = math.sin(t * 0.9) * 0.25
		body.CFrame = cf
		under.CFrame = cf * CFrame.new(0, -5, -2)
		tail.CFrame = cf * CFrame.new(0, 0, 34) * CFrame.Angles(beat, 0, 0) * CFrame.new(0, 0, 6)
		finL.CFrame = cf * CFrame.new(-13, -6, -10) * CFrame.Angles(0, 0, 0.4 + beat * 0.5)
		finR.CFrame = cf * CFrame.new(13, -6, -10) * CFrame.Angles(0, 0, -0.4 - beat * 0.5)
	end)
end

-- Quallen steigen langsam auf und ab
local function jellies(k, n, colors)
	for i = 1, n do
		local a, r = rnd(k, 0, TAU), rnd(k, 160, 300)
		local x, z = polar(a, r)
		local c = colors[i % #colors + 1]
		local parts = collect(k, function()
			local cf = at(k, x, rnd(k, 0, 90), z)
			P(k, "Ball", V(10, 7, 10), cf, c, "Neon", 0.35, "Qualle")
			for j = 0, 3 do
				local ang = j / 4 * TAU
				P(k, "Block", V(0.5, 12, 0.5), cf * CFrame.new(math.cos(ang) * 2.5, -8, math.sin(ang) * 2.5), c, "Neon", 0.5, "Tentakel")
			end
		end)
		bob(k, parts, 10, rnd(k, 0.15, 0.25), i, 0.06)
	end
end

-- Heißluftballons
local function balloons(k, n, colors)
	for i = 1, n do
		local a, r = i / n * TAU + 0.6, rnd(k, 230, 320)
		local x, z = polar(a, r)
		local c = colors[i % #colors + 1]
		local parts = collect(k, function()
			local cf = at(k, x, rnd(k, 60, 120), z)
			P(k, "Ball", V(22, 26, 22), cf, c, "SmoothPlastic", 0, "Ballon")
			P(k, "Ball", V(22.4, 6, 22.4), cf * CFrame.new(0, 2, 0), WHITE, "SmoothPlastic", 0, "Ballon")
			P(k, "Block", V(6, 5, 6), cf * CFrame.new(0, -19, 0), hex("#8a5a34"), "Wood", 0, "Korb")
			for s = -1, 1, 2 do
				P(k, "Block", V(0.4, 8, 0.4), cf * CFrame.new(s * 3, -14, 0), hex("#5a3a24"), "SmoothPlastic", 0, "Seil")
			end
		end)
		bob(k, parts, 5, rnd(k, 0.15, 0.25), i, 0.03)
		orbit(k, parts, 0.004)
	end
end

-- Luftschiff kreist über der Stadt
local function airship(k, color)
	local parts = collect(k, function()
		local cf = at(k, 300, 130, 0) * CFrame.Angles(0, math.pi, 0)
		P(k, "Ball", V(16, 16, 64), cf, color, "SmoothPlastic", 0, "Luftschiff")
		P(k, "Block", V(8, 5, 14), cf * CFrame.new(0, -10, 0), hex("#3a3440"), "Metal", 0, "Gondel")
		P(k, "Block", V(1, 14, 10), cf * CFrame.new(0, 6, 28), color:Lerp(Color3.new(0, 0, 0), 0.2), "SmoothPlastic", 0, "Leitwerk")
		P(k, "Block", V(18, 1, 10), cf * CFrame.new(0, 0, 28), color:Lerp(Color3.new(0, 0, 0), 0.2), "SmoothPlastic", 0, "Leitwerk")
		P(k, "Block", V(16.2, 3, 30), cf * CFrame.new(0, 2, 0), hex("#ffd76a"), "Neon", 0.2, "Werbeband")
	end)
	orbit(k, parts, -0.025)
end

-- Satellit auf einer schrägen Umlaufbahn
local function satellite(k)
	local parts = collect(k, function()
		local cf = at(k, 0, 0, 300)
		P(k, "Block", V(6, 6, 9), cf, hex("#d8d8e0"), "Metal", 0, "Satellit")
		for s = -1, 1, 2 do
			P(k, "Block", V(18, 0.6, 7), cf * CFrame.new(s * 12, 0, 0), hex("#2a4a9a"), "Glass", 0, "Solarflaeche")
		end
		P(k, "Cyl", V(4, 2, 4), cf * CFrame.new(0, 4, 0), hex("#ffffff"), "Metal", 0, "Antenne")
		P(k, "Ball", V(1.6, 1.6, 1.6), cf * CFrame.new(0, 6, 0), hex("#ff4058"), "Neon", 0, "Positionslicht")
	end)
	orbit(k, parts, 0.03, CFrame.new(0, 140, 0) * CFrame.Angles(0.35, 0, 0.2))
end

-- ── Atmosphäre-Partikel ──
local function motes(k, opts)
	local host = P(k, "Block", opts.Size or V(560, 220, 560), at(k, 0, opts.Y or 40, 0), WHITE, "SmoothPlastic", 1, "Atmosphaere")
	local e = Instance.new("ParticleEmitter")
	e.Name = opts.Name or "Atmosphaere"
	e.Texture = opts.Texture or "rbxasset://textures/particles/sparkles_main.dds"
	local cols = {}
	for i, c in ipairs(opts.Colors) do table.insert(cols, ColorSequenceKeypoint.new(#opts.Colors == 1 and 0 or (i - 1) / (#opts.Colors - 1), c)) end
	if #cols == 1 then table.insert(cols, ColorSequenceKeypoint.new(1, opts.Colors[1])) end
	e.Color = ColorSequence.new(cols)
	e.Size = NumberSequence.new(opts.Size0 or 1.2, opts.Size1 or 0.6)
	e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.2, opts.Alpha or 0.3), NumberSequenceKeypoint.new(0.8, opts.Alpha or 0.3), NumberSequenceKeypoint.new(1, 1) })
	e.Lifetime = NumberRange.new(opts.Life or 8, (opts.Life or 8) * 1.5)
	e.Speed = NumberRange.new(opts.Speed or 1, (opts.Speed or 1) * 2)
	e.SpreadAngle = Vector2.new(opts.Spread or 180, opts.Spread or 180)
	e.EmissionDirection = opts.Direction or Enum.NormalId.Top
	e.Acceleration = opts.Acceleration or V(0, 0, 0)
	e.Rate = opts.Rate or 20
	e.LightEmission = opts.Light or 1
	e.RotSpeed = NumberRange.new(-30, 30)
	e.Parent = host
end

-- ── Rezepte je Welt: Himmel, Leben, Partikel und Farbstimmung (die Fernkulisse baut horizon) ──
local R = {}

R.spawn = function(k, w)
	sun(k, -0.9, 0.55, hex("#fff3c4"), 44, hex("#ffe08a"))
	-- Wolken malt das Himmelsbild (assets/himmel/spawn); hier nur wenige, durchscheinende
	cloudBank(k, 5, WHITE, 0.35, 100, 170)
	balloons(k, 4, { hex("#ff5a5a"), hex("#ffd76a"), hex("#5ad1ff"), hex("#7dff8a") })
	birds(k, 2, hex("#3a3a48"))
	motes(k, { Colors = { hex("#fff6c0"), hex("#ffffff") }, Rate = 12, Size0 = 0.9, Speed = 0.6, Alpha = 0.35 })
	grade(k, hex("#ffe9c0"), 0.08, 0.04)
end

R.normal = function(k, w)
	sun(k, -0.6, 0.6, hex("#fff6d0"), 46, hex("#ffe9a0"))
	-- Wolken malt das Himmelsbild (assets/himmel/normal); hier nur ein paar zarte, durchscheinende
	cloudBank(k, 5, WHITE, 0.35, 90, 170)
	birds(k, 2, hex("#3a3a48"))
	butterflies(k, 6, { hex("#ffcf4a"), hex("#ff8ac8"), hex("#8ad0ff") })
	motes(k, { Colors = { hex("#fff6c0"), hex("#ffffff") }, Rate = 14, Size0 = 0.8, Speed = 0.5, Alpha = 0.4 })
	grade(k, hex("#fff1d0"), 0.08, 0.04)
end

R.wald = function(k, w)
	sun(k, 0.8, 0.5, hex("#f6ffd8"), 38, hex("#e0ffb0"))
	birds(k, 1, hex("#3a2a20"))
	butterflies(k, 4, { hex("#d9ff7a"), hex("#fff27a") })
	motes(k, { Name = "Blaetter", Texture = "", Colors = { hex("#8fdc5a"), hex("#c9a05a"), hex("#6fbf4a") }, Rate = 10, Size0 = 1.2, Size1 = 1, Speed = 2, Direction = Enum.NormalId.Bottom, Spread = 30, Acceleration = V(1.5, -0.5, 0.8), Y = 120, Size = V(420, 10, 420), Light = 0, Alpha = 0.1, Life = 14 })
	grade(k, hex("#d8ffd0"), 0.06, 0.05)
end

R.stadt = function(k, w)
	sun(k, 0.2, 0.18, hex("#ffc27a"), 70, hex("#ff9a5a"))
	-- Wolken malt das Himmelsbild (assets/himmel/stadt); hier nur wenige, durchscheinende
	cloudBank(k, 5, hex("#ffd2b0"), 0.35, 100, 170)
	airship(k, hex("#d8d4e0"))
	birds(k, 2, hex("#6a6a78"), 1.6)
	motes(k, { Colors = { hex("#ffe6c0") }, Rate = 10, Size0 = 0.8, Speed = 0.6, Light = 0.4, Alpha = 0.5 })
	grade(k, hex("#ffc89a"), 0.06, 0.06)
end

R.eis = function(k, w)
	sun(k, -1.2, 0.3, hex("#f4fbff"), 40, hex("#d8f0ff"))
	aurora(k, { hex("#5affb0"), hex("#7ad0ff"), hex("#b07bff") }, HELD + 1.3, 2.2, 160)
	-- Wolken und Polarlicht malt auch das Himmelsbild (assets/himmel/eis); hier nur wenige Wolkenbänke
	cloudBank(k, 4, hex("#eef8ff"), 0.35, 60, 120)
	birds(k, 1, hex("#ffffff"), 2.2, hex("#e8f2ff"))
	motes(k, { Name = "Schneeflocken", Colors = { WHITE }, Rate = 30, Size0 = 1.4, Size1 = 1.1, Speed = 3, Direction = Enum.NormalId.Bottom, Spread = 20, Acceleration = V(1, 0, 0.5), Y = 160, Size = V(520, 10, 520), Light = 0.3, Alpha = 0.15, Life = 16 })
	grade(k, hex("#d8f0ff"), 0.04, 0.05)
end

R.lava = function(k, w)
	moon(k, 0.9, 0.42, hex("#ff8a5a"), 46)
	bats(k, 2, hex("#1a1214"))
	motes(k, { Name = "Asche", Texture = "", Colors = { hex("#5a5050"), hex("#8a7a70") }, Rate = 18, Size0 = 0.9, Size1 = 0.7, Speed = 2, Direction = Enum.NormalId.Bottom, Spread = 25, Acceleration = V(1, 0, 0), Y = 160, Size = V(500, 10, 500), Light = 0, Alpha = 0.2, Life = 16 })
	grade(k, hex("#ff9a6a"), 0.1, 0.08)
end

R.hoehle = function(k, w)
	stars(k, 90, { hex("#b07bff"), hex("#6ae8ff"), hex("#ff7ae0") }, 0.35)
	bats(k, 3, hex("#141018"))
	motes(k, { Name = "Leuchtsporen", Colors = { hex("#b07bff"), hex("#6ae8ff") }, Rate = 16, Size0 = 1.2, Speed = 0.8, Alpha = 0.25, Life = 10 })
	grade(k, hex("#c8a8ff"), 0.08, 0.06)
end

R.candy = function(k, w)
	sun(k, -0.4, 0.55, hex("#fff6fb"), 44, hex("#ffd0ea"))
	-- Zuckerwatte und schwebende Inseln kommen aus dem Himmelsbild und modelWorlds.js; hier nur wenige Wolken
	cloudBank(k, 5, hex("#ffd8f0"), 0.2, 90, 160)
	birds(k, 2, hex("#ff7ac8"), 1.8, hex("#7ad0ff"))
	butterflies(k, 7, { hex("#ff5fb0"), hex("#5fd3ff"), hex("#ffe25f"), hex("#7aff8a") })
	motes(k, { Colors = { hex("#ffffff"), hex("#ffd0ea") }, Rate = 16, Size0 = 0.9, Speed = 0.6, Alpha = 0.3 })
	grade(k, hex("#ffd0ea"), 0.12, 0.03)
end

local function space(k, w, starColors)
	stars(k, 160, starColors or { WHITE, hex("#cfe0ff"), hex("#ffe8c8") }, 0.05)
end

R.mond = function(k, w)
	space(k, w)
	satellite(k)
	comet(k, hex("#9fd8ff"), 0.5)
	motes(k, { Name = "Sternenstaub", Colors = { WHITE, hex("#cfe0ff") }, Rate = 10, Size0 = 0.7, Speed = 0.3, Alpha = 0.3 })
	grade(k, hex("#c8d4ff"), -0.05, 0.06)
end

R.neptun = function(k, w)
	space(k, w, { WHITE, hex("#9fd8ff") })
	aurora(k, { hex("#5aa8ff"), hex("#7af0ff"), hex("#3a6aff") }, HELD - 1.6, 2.4, 170)
	comet(k, hex("#7af0ff"), 0.6)
	motes(k, { Name = "Eiskristalle", Colors = { hex("#9fd8ff"), WHITE }, Rate = 18, Size0 = 0.8, Speed = 4, Spread = 30, Direction = Enum.NormalId.Left, Alpha = 0.3, Life = 10 })
	grade(k, hex("#a8c8ff"), 0.04, 0.06)
end

R.mars = function(k, w)
	space(k, w, { hex("#ffd8c8"), WHITE })
	satellite(k)
	-- Staubschleier malt das Himmelsbild (assets/himmel/mars)
	motes(k, { Name = "Staubwind", Texture = "", Colors = { hex("#d8653a"), hex("#ff9b6a") }, Rate = 24, Size0 = 1, Size1 = 0.8, Speed = 5, Spread = 15, Direction = Enum.NormalId.Left, Light = 0, Alpha = 0.35, Life = 10 })
	grade(k, hex("#ffb08a"), 0.05, 0.06)
end

R.saturn = function(k, w)
	space(k, w)
	satellite(k)
	motes(k, { Name = "Goldstaub", Colors = { hex("#ffe2a0"), WHITE }, Rate = 12, Size0 = 0.8, Speed = 0.4, Alpha = 0.3 })
	grade(k, hex("#ffe0a8"), 0.05, 0.05)
end

R.alien = function(k, w)
	space(k, w, { WHITE, hex("#c8ffd8"), hex("#e8c8ff") })
	nebula(k, { hex("#7aff5a"), hex("#b07bff"), hex("#5affd8") }, 4)
	jellies(k, 7, { hex("#7aff5a"), hex("#d97aff"), hex("#5affd8") })
	comet(k, hex("#7aff5a"), 0.45)
	motes(k, { Name = "Sporen", Colors = { hex("#7aff5a"), hex("#d97aff") }, Rate = 14, Size0 = 1, Speed = 0.6, Alpha = 0.3 })
	grade(k, hex("#d0ffc8"), 0.1, 0.05)
end

R.sonne = function(k, w)
	motes(k, { Name = "Funken", Colors = { hex("#fff2a0"), hex("#ff6a1a") }, Rate = 26, Size0 = 1.1, Size1 = 0.2, Speed = 6, Spread = 25, Y = -60, Size = V(500, 10, 500), Alpha = 0.15, Life = 7 })
	grade(k, hex("#ffc070"), 0.08, 0.08)
end

local function sea(k, w, shaftColor, n)
	shafts(k, shaftColor, n or 10)
	motes(k, { Name = "Meeresschnee", Colors = { WHITE, hex("#bff0ff") }, Rate = 22, Size0 = 0.7, Size1 = 0.5, Speed = 0.8, Direction = Enum.NormalId.Bottom, Spread = 40, Light = 0.4, Alpha = 0.35, Life = 14, Y = 60 })
end

R.korallenriff = function(k, w)
	sea(k, w, hex("#bff8ff"))
	fishSchools(k, 3, { hex("#ffd24a"), hex("#ff7a5a"), hex("#5ad1ff") })
	whale(k, hex("#3a5a7a"), hex("#c8d8e0"))
	jellies(k, 4, { hex("#ff9ad5"), hex("#bff8ff") })
	grade(k, hex("#a0f0ff"), 0.08, 0.04)
end

R.muschelland = function(k, w)
	sea(k, w, hex("#e0fbff"))
	fishSchools(k, 2, { hex("#ff9ad5"), hex("#ffe6a0"), hex("#9ff3f0") })
	jellies(k, 6, { hex("#ffd0e8"), hex("#c8f0ff") })
	whale(k, hex("#4a6a8a"), hex("#e0e8f0"))
	grade(k, hex("#c8f8ff"), 0.08, 0.03)
end

R.atlantis = function(k, w)
	sea(k, w, hex("#9ff3f0"))
	fishSchools(k, 2, { hex("#ffd76a"), hex("#9ff3f0") })
	jellies(k, 8, { hex("#9ff3f0"), hex("#b07bff") })
	whale(k, hex("#2a4a6a"), hex("#a8c0d0"))
	grade(k, hex("#a0e8f0"), 0.06, 0.05)
end

R.tiefseegraben = function(k, w)
	sea(k, w, hex("#3a8a9a"), 4)
	jellies(k, 10, { hex("#5affd8"), hex("#ff7ae0"), hex("#7ad0ff") })
	fishSchools(k, 1, { hex("#5affd8"), hex("#2a3a4a") })
	grade(k, hex("#80e0d0"), 0.05, 0.1)
end

R.wolkenburg = function(k, w)
	sun(k, -0.5, 0.5, hex("#fff8e8"), 46, hex("#ffe8b0"))
	cloudBank(k, 12, WHITE, 0, 0, 160)
	birds(k, 2, hex("#ffffff"), 2, hex("#ffe7a8"))
	balloons(k, 2, { hex("#ffd76a"), hex("#ffffff") })
	motes(k, { Colors = { WHITE, hex("#fff3c4") }, Rate = 14, Size0 = 0.9, Speed = 0.5, Alpha = 0.3 })
	grade(k, hex("#fff0d8"), 0.06, 0.03)
end

R.engelsgarten = function(k, w)
	sun(k, 0.6, 0.55, hex("#fffaf0"), 50, hex("#fff2c0"))
	cloudBank(k, 9, hex("#fff6e8"), 0.1, 10, 150)
	butterflies(k, 8, { hex("#ffffff"), hex("#ffd76a"), hex("#e8d0ff") })
	birds(k, 1, hex("#ffffff"), 2.2, hex("#fff2c0"))
	motes(k, { Name = "Lichtfunken", Colors = { hex("#fff2a0"), WHITE }, Rate = 18, Size0 = 1, Speed = 0.5, Alpha = 0.25 })
	grade(k, hex("#fff0d0"), 0.05, 0.03)
end

R.goetterthron = function(k, w)
	sun(k, HELD + 0.7, 0.08, hex("#ffb05a"), 80, hex("#ff8a3a"))
	cloudBank(k, 12, hex("#ffd8a8"), 0, -60, 60)
	comet(k, hex("#ffe7a8"), 0.55)
	birds(k, 1, hex("#ffe7a8"), 2.4, hex("#ffcf4a"))
	motes(k, { Name = "Goldfunken", Colors = { hex("#ffe7a8"), hex("#ffcf4a") }, Rate = 14, Size0 = 0.9, Speed = 0.6, Alpha = 0.3 })
	grade(k, hex("#ffd8a0"), 0.08, 0.06)
end

-- ── Juwelnebel (Galaxie 2): ruhiger Sternenhimmel mit Nebelschleiern in den Farben der Edelsteine ──
-- Wenige, große Formen: Sterne, zwei bis drei Nebel, ein Komet oder Mond, feiner Glitzerstaub und eine leichte Tönung.
local function gemSky(k, colors, opts)
	opts = opts or {}
	stars(k, opts.Stars or 140, { WHITE, colors[1]:Lerp(WHITE, 0.6), colors[2]:Lerp(WHITE, 0.5) }, 0.08)
	nebula(k, colors, opts.Nebula or 3)
	if opts.Moon then moon(k, opts.Moon[1], opts.Moon[2], opts.Moon[3], opts.Moon[4]) end
	if opts.Comet then comet(k, colors[1], opts.Comet) end
	motes(k, { Name = "Glitzer", Colors = { WHITE, colors[1]:Lerp(WHITE, 0.4) }, Rate = opts.Motes or 12, Size0 = 0.7, Speed = 0.3, Alpha = 0.3 })
	grade(k, colors[1]:Lerp(WHITE, 0.55), 0.04, 0.05)
end
R.quarzfeld = function(k, w) gemSky(k, { hex("#d8ccff"), hex("#c98bff"), hex("#ffffff") }, { Comet = 0.55 }) end
R.amethystgrotte = function(k, w) gemSky(k, { hex("#c98bff"), hex("#8a4ad8"), hex("#ff8ae0") }, { Nebula = 4 }) end
R.topasduenen = function(k, w)
	sun(k, -0.6, 0.18, hex("#ffd27a"), 70, hex("#ffb02e"))
	gemSky(k, { hex("#ffc46a"), hex("#ff8a3a"), hex("#fff0b8") }, { Stars = 60, Nebula = 2 })
end
R.smaragdwald = function(k, w)
	aurora(k, { hex("#3ee08a"), hex("#b4ffd6"), hex("#5affd8") }, HELD - 1.4, 2.2, 160)
	gemSky(k, { hex("#7ae8b0"), hex("#1ec870"), hex("#d9ff7a") }, { Nebula = 2 })
end
R.jadetempel = function(k, w)
	cloudBank(k, 8, hex("#e8f6e0"), 0.15, 20, 140)
	gemSky(k, { hex("#d8f0c0"), hex("#8ad0a0"), hex("#ffd76a") }, { Stars = 50, Nebula = 1 })
end
R.saphirsee = function(k, w) gemSky(k, { hex("#4a8aff"), hex("#2a5ae8"), hex("#cfe0ff") }, { Moon = { 0.9, 0.42, hex("#cfe0ff"), 60 }, Comet = 0.6 }) end
R.rubinvulkan = function(k, w) gemSky(k, { hex("#ff4a6a"), hex("#a8183a"), hex("#ffb07a") }, { Nebula = 3, Motes = 18 }) end
R.opalwolken = function(k, w)
	cloudBank(k, 10, hex("#ffe2f6"), 0.1, 10, 150)
	rainbow(k, HELD + 1.2, 600, 240)
	gemSky(k, { hex("#ff9ae0"), hex("#5ad8ff"), hex("#fff2a0") }, { Stars = 40, Nebula = 2 })
end
R.diamantkern = function(k, w) gemSky(k, { hex("#8af0ff"), hex("#e8fdff"), hex("#c84ad8") }, { Stars = 200, Nebula = 3, Comet = 0.5 }) end

WorldFx.Recipes = R

-- Umgebung einer Welt bauen; mitte = Mitte der Insel (Himmelskuppel), eltern = Ordner/Model
function WorldFx.Apply(worldId, center, parent)
	local w = WORLDS[worldId]
	local recipe = R[worldId]
	if not w or not recipe then return nil end
	local folder = Instance.new("Folder")
	folder.Name = "Umgebung"
	folder.Parent = parent or workspace
	local seed = 0
	for i = 1, #worldId do seed = seed * 31 + string.byte(worldId, i) end
	local k = { Folder = folder, C = center or V(0, 0, 0), R = Random.new(seed % 2147483647), W = w, Updates = {} }
	recipe(k, w)
	horizon(k, worldId)
	local start = os.clock()
	local connection = RunService.Heartbeat:Connect(function()
		local t = os.clock() - start
		for _, u in ipairs(k.Updates) do u(t) end
	end)
	local handle = { Folder = folder }
	function handle.Destroy()
		connection:Disconnect()
		if k.Grade then k.Grade:Destroy() end
		folder:Destroy()
	end
	return handle
end

return WorldFx
`;
}

// Client-Skript fürs Spiel: baut die Umgebung der Welt, die der Kamera am nächsten ist
export const WORLD_FX_CLIENT = `-- Coinmaster Adventure · Umgebung der Welten (Client)
-- Sucht die Welt-Modelle (Ordner „Einstellungen“ mit WeltId) und baut mit WorldFx die Umgebung der Welt,
-- in der die Kamera gerade ist. Beim Wechsel in eine andere Welt wird die alte Umgebung entfernt.
local RunService = game:GetService("RunService")
local root = game:GetService("ReplicatedStorage"):WaitForChild("CoinmasterAdventure")
local WorldFx = require(root:WaitForChild("WorldFx"))

local worlds = {}
local function scan()
	worlds = {}
	for _, m in ipairs(workspace:GetChildren()) do
		local settings = m:IsA("Model") and m:FindFirstChild("Einstellungen")
		local id = settings and settings:FindFirstChild("WeltId")
		local sky = m:FindFirstChild("Himmel")
		local dome = sky and sky:FindFirstChild("Himmelskuppel")
		if id and dome then
			table.insert(worlds, { Model = m, Id = id.Value, Center = dome.Position })
		end
	end
end

local current, handle = nil, nil
local elapsed, rescan = 1, 0
RunService.Heartbeat:Connect(function(dt)
	elapsed = elapsed + dt
	rescan = rescan - dt
	if elapsed < 1 then return end
	elapsed = 0
	if rescan <= 0 then
		scan()
		rescan = 10
	end
	local cam = workspace.CurrentCamera
	if not cam then return end
	local best, bestDist = nil, math.huge
	for _, w in ipairs(worlds) do
		local d = (w.Center - cam.CFrame.Position).Magnitude
		if d < bestDist then best, bestDist = w, d end
	end
	if best and best ~= current and bestDist < 700 then
		if handle then handle.Destroy() end
		current = best
		handle = WorldFx.Apply(best.Id, best.Center, best.Model)
	end
end)
`;
