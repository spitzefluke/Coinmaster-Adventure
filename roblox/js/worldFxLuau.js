// Umgebung der Welten für Roblox (Modul WorldFx): Himmel und Licht, Fernkulisse, Atmosphäre-Partikel und Leben
// rund um jede Insel. Alles aus Parts, ruhig animiert (ziehende Wolken, kreisende Vögel und Fische,
// schwebende Inseln, wogendes Polarlicht). Läuft auf dem Client: WorldFx.Apply(weltId, mitte, eltern).
// Reiner Text wie luau.js, damit es auch in Node prüfbar ist.

const str = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

// Farben je Welt für das Modul (aus worlds.js)
function worldTable(WORLDS) {
  return WORLDS.filter((w) => !w.soon)
    .map((w) => {
      const n = parseInt(w.sky[0].slice(1), 16);
      const lin = (v) => Math.pow(v / 255, 2.2); // wie THREE.Color (linear)
      const night = 0.3 * lin(n >> 16) + 0.59 * lin((n >> 8) & 255) + 0.11 * lin(n & 255) < 0.2;
      return `\t[${str(w.id)}] = { Planet = ${str(w.planet)}, Top = Color3.fromHex(${str(w.sky[0])}), Horizon = Color3.fromHex(${str(w.sky[1])}), Accent = Color3.fromHex(${str(w.accent)}), Ground = Color3.fromHex(${str(w.ground)}), Rock = Color3.fromHex(${str(w.rock)}), Side = Color3.fromHex(${str(w.side)}), Night = ${night}, Water = ${!!w.water} },`;
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
local RIM = 585 -- Fernkulisse kurz vor der Himmelskuppel (Radius 640)
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
		local az, el = rnd(k, 0, TAU), math.asin(rnd(math.sin(minEl or 0.1), 0.98))
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

-- ── Fernkulisse ──
local function tint(k, c, amount) return c:Lerp(k.W.Horizon, amount) end

-- Bergkette am Kuppelrand; cap = Schneekappe
local function mountains(k, n, colors, cap, minH, maxH)
	for i = 0, n - 1 do
		local a = i / n * TAU + rnd(k, -0.12, 0.12)
		local r = RIM + rnd(k, -20, 15)
		local x, z = polar(a, r)
		local h, w = rnd(k, minH or 230, maxH or 360), rnd(k, 150, 240)
		local c = tint(k, colors[i % #colors + 1], 0.25)
		prism(k, facing(k, x, SEA - 10 + h / 2, z), w, h, w * 0.5, c, "Rock", 0, "Berg")
		if cap then
			local ch = h * 0.3
			prism(k, facing(k, x, SEA - 10 + h - ch / 2, z) * CFrame.new(0, 0.5, -2), w * 0.3 + 2, ch + 1, w * 0.5 + 4, cap, "Snow", 0, "Schneekappe")
		end
		-- Vorberg daneben
		local a2 = a + rnd(k, 0.12, 0.2)
		local x2, z2 = polar(a2, r - 40)
		local h2 = h * rnd(k, 0.45, 0.65)
		prism(k, facing(k, x2, SEA - 10 + h2 / 2, z2), w * 0.8, h2, w * 0.4, tint(k, colors[(i + 1) % #colors + 1], 0.15), "Rock", 0, "Berg")
	end
end

-- runde Hügel, die aus dem Wolkenmeer ragen (mit Tannen-Silhouetten)
local function hills(k, n, colors, trees, r0)
	for i = 0, n - 1 do
		local a = i / n * TAU + rnd(k, -0.15, 0.15)
		local r = (r0 or RIM - 40) + rnd(k, -30, 20)
		local x, z = polar(a, r)
		local w, h = rnd(k, 160, 260), rnd(k, 120, 200)
		local c = tint(k, colors[i % #colors + 1], 0.2)
		P(k, "Ball", V(w, h, w * 0.8), facing(k, x, SEA + h * 0.1, z), c, "Grass", 0, "Huegel")
		if trees then
			for j = 1, 5 do
				local off = (j - 3) * w * 0.14
				local th = rnd(k, 20, 34)
				local top = SEA + h * 0.1 + h * 0.5 * math.sqrt(math.max(0, 1 - (off / (w * 0.5)) ^ 2)) - 6
				prism(k, facing(k, x, top + th / 2, z) * CFrame.new(off, 0, -w * 0.2), th * 0.6, th, th * 0.5, tint(k, trees, 0.2), "Grass", 0, "Tanne")
			end
		end
	end
end

-- Wolkenbänke ziehen langsam um die Insel
local function cloudBank(k, n, color, transparency, y0, y1)
	local parts = collect(k, function()
		for i = 0, n - 1 do
			local a = i / n * TAU + rnd(k, -0.2, 0.2)
			local r = rnd(k, 380, 520)
			local y = rnd(k, y0 or 30, y1 or 150)
			local x, z = polar(a, r)
			local cf = facing(k, x, y, z)
			for j = 0, 3 do
				local s = rnd(k, 34, 60)
				P(k, "Ball", V(s * 1.6, s * 0.8, s), cf * CFrame.new((j - 1.5) * s * 0.7, rnd(k, -6, 8), rnd(k, -8, 8)), color, "SmoothPlastic", transparency or 0, "Wolkenbank")
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

local function skyline(k, n, colors, windows)
	for i = 0, n - 1 do
		local a = i / n * TAU + rnd(k, -0.05, 0.05)
		local r = RIM + rnd(k, -25, 10)
		local x, z = polar(a, r)
		local w, h = rnd(k, 34, 64), rnd(k, 130, 270)
		local cf = facing(k, x, SEA + h / 2, z)
		local c = tint(k, colors[i % #colors + 1], 0.3)
		P(k, "Block", V(w, h, w * 0.8), cf, c, "Concrete", 0, "Hochhaus")
		if i % 3 == 0 then P(k, "Cyl", V(3, 40, 3), cf * CFrame.new(0, h / 2 + 20, 0), c, "Metal", 0, "Antenne") end
		for row = 1, math.floor(h / 40) do
			if (row + i) % 2 == 0 then
				P(k, "Block", V(w * 0.8, 4, 1), cf * CFrame.new(0, h / 2 - row * 36, -w * 0.4 - 0.6), windows, "Neon", 0.25, "Fenster")
			end
		end
	end
end

local function volcanoes(k, n, rock, lava)
	for i = 0, n - 1 do
		local a = i / n * TAU + 0.4 + rnd(k, -0.2, 0.2)
		local x, z = polar(a, RIM - 10)
		local h, w = rnd(k, 260, 340), rnd(k, 230, 300)
		local cf = facing(k, x, SEA + h / 2, z)
		prism(k, cf, w, h, w * 0.6, tint(k, rock, 0.15), "Basalt", 0, "Vulkan")
		-- abgeflachte Spitze mit Glut und Lavaströmen
		P(k, "Cyl", V(w * 0.22, 8, w * 0.3), cf * CFrame.new(0, h / 2 - h * 0.12, -w * 0.05), lava, "Neon", 0, "Glut")
		-- Lavaströme laufen innen an den Flanken vom Krater herab
		local slope = math.atan2(w / 2, h)
		for s = -1, 1, 2 do
			local L = h * 0.42
			local top = V(s * w * 0.04, h * 0.36, -w * 0.31)
			local dir = V(s * math.sin(slope), -math.cos(slope), 0)
			local mid = top + dir * (L / 2)
			P(k, "Block", V(5, L, 2), cf * CFrame.new(mid) * CFrame.Angles(0, 0, s * slope), lava, "Neon", 0.15, "Lavastrom")
		end
		local smoke = P(k, "Block", V(30, 4, 30), cf * CFrame.new(0, h / 2, -w * 0.05), WHITE, "SmoothPlastic", 1, "Rauchquelle")
		local e = Instance.new("ParticleEmitter")
		e.Texture = "rbxasset://textures/particles/smoke_main.dds"
		e.Color = ColorSequence.new(Color3.fromRGB(70, 50, 45), Color3.fromRGB(40, 30, 30))
		e.Size = NumberSequence.new(30, 80)
		e.Transparency = NumberSequence.new(0.55, 1)
		e.Lifetime = NumberRange.new(10, 14)
		e.Speed = NumberRange.new(6, 10)
		e.SpreadAngle = Vector2.new(12, 12)
		e.Rate = 1.2
		e.Acceleration = V(3, 0, 0)
		e.Parent = smoke
	end
end

-- Spitzen aus Eis oder Kristall; down = von der Decke hängend
local function spikes(k, n, colors, material, transparency, down, r0, minH, maxH)
	for i = 0, n - 1 do
		local a = i / n * TAU + rnd(k, -0.1, 0.1)
		local x, z = polar(a, (r0 or RIM) + rnd(k, -30, 20))
		local h, w = rnd(k, minH or 150, maxH or 300), rnd(k, 50, 100)
		local c = colors[i % #colors + 1]
		if down then
			prism(k, facing(k, x, 330 - h / 2, z) * CFrame.Angles(0, 0, math.pi), w, h, w * 0.6, c, material, transparency, "Tropfstein")
		else
			prism(k, facing(k, x, SEA + h / 2, z), w, h, w * 0.6, c, material, transparency, "Spitze")
			prism(k, facing(k, x, SEA + h * 0.3, z) * CFrame.new(w * 0.45, 0, -4), w * 0.5, h * 0.6, w * 0.4, c:Lerp(WHITE, 0.15), material, transparency, "Spitze")
		end
	end
end

-- Tafelberge (Mars)
local function mesas(k, n, colors)
	for i = 0, n - 1 do
		local a = i / n * TAU + rnd(k, -0.1, 0.1)
		local x, z = polar(a, RIM - 10)
		local w, h = rnd(k, 140, 240), rnd(k, 170, 240)
		local cf = facing(k, x, SEA + h / 2, z)
		for s = 0, 2 do
			local ws = w * (1 - s * 0.18)
			P(k, "Block", V(ws, h / 3 + 1, ws * 0.6), cf * CFrame.new(0, -h / 3 + s * h / 3, 0), tint(k, colors[(i + s) % #colors + 1], 0.2), "Sandstone", 0, "Tafelberg")
		end
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

-- Leuchtsäulen aus fremden Pflanzen (Alien)
local function spires(k, n, stem, bulbs)
	for i = 0, n - 1 do
		local a = i / n * TAU + rnd(k, -0.1, 0.1)
		local x, z = polar(a, RIM - 20)
		local h = rnd(k, 200, 330)
		local cf = facing(k, x, SEA + h / 2, z)
		P(k, "Cyl", V(16, h, 16), cf, tint(k, stem, 0.15), "SmoothPlastic", 0, "Stiel")
		local bulb = P(k, "Ball", V(70, 50, 70), cf * CFrame.new(0, h / 2 + 10, 0), bulbs[i % #bulbs + 1], "Neon", 0.15, "Leuchtknolle")
		pulse(k, { bulb }, 0.2, 0.12, 0.6)
		for j = 1, 2 do
			P(k, "Ball", V(26, 20, 26), cf * CFrame.new(j % 2 == 0 and 30 or -30, -h * 0.15 * j, 0), bulbs[(i + j) % #bulbs + 1], "Neon", 0.3, "Leuchtknolle")
		end
	end
end

-- Sonnenbögen: leuchtende Protuberanzen, die pulsieren
local function flares(k, n, colors)
	for i = 0, n - 1 do
		local a = i / n * TAU + 0.5
		local x, z = polar(a, RIM - 40)
		local R = rnd(k, 80, 130)
		local base = facing(k, x, SEA + 40, z)
		local list = collect(k, function()
			for j = 0, 15 do
				local u = j / 15 * math.pi
				P(k, "Ball", V(26, 26, 26), base * CFrame.new(math.cos(u) * R, math.sin(u) * R * 1.3, 0), colors[j % #colors + 1], "Neon", 0.2, "Sonnenbogen")
			end
		end)
		pulse(k, list, 0.35, 0.25, 0.5)
	end
end

-- Unterwasser: Korallentürme
local function corals(k, n, colors)
	for i = 0, n - 1 do
		local a = i / n * TAU + rnd(k, -0.1, 0.1)
		local x, z = polar(a, RIM - 30 + rnd(k, -25, 15))
		local h = rnd(k, 150, 280)
		local cf = facing(k, x, SEA + h / 2, z)
		local c = tint(k, colors[i % #colors + 1], 0.2)
		P(k, "Cyl", V(40, h, 40), cf, c, "SmoothPlastic", 0, "Koralle")
		for j = 1, 4 do
			local side = j % 2 == 0 and 1 or -1
			local y = -h / 2 + h * j / 5
			P(k, "Cyl", V(16, 60, 16), cf * CFrame.new(side * 32, y, 0) * CFrame.Angles(0, 0, -side * 0.6), c, "SmoothPlastic", 0, "Koralle")
			P(k, "Ball", V(26, 26, 26), cf * CFrame.new(side * 52, y + 22, 0), c:Lerp(WHITE, 0.25), "SmoothPlastic", 0, "Koralle")
		end
		P(k, "Ball", V(60, 40, 60), cf * CFrame.new(0, h / 2, 0), c:Lerp(WHITE, 0.15), "SmoothPlastic", 0, "Koralle")
	end
end

-- Seetang wogt langsam
local function kelp(k, n, color)
	for i = 1, n do
		local a, r = rnd(k, 0, TAU), rnd(k, 430, 560)
		local x, z = polar(a, r)
		local h = rnd(k, 140, 260)
		local parts = collect(k, function()
			for s = 0, 4 do
				P(k, "Block", V(10, h / 5 + 2, 3), facing(k, x, SEA + s * h / 5 + h / 10, z), tint(k, color, 0.2), "Grass", 0, "Seetang")
			end
		end)
		local base = facing(k, x, SEA, z)
		local list = offsets(parts, base)
		local ph = rnd(k, 0, 6)
		anim(k, function(t)
			for j, e in ipairs(list) do
				local bend = math.sin(t * 0.4 + ph + j * 0.4) * 0.05 * j
				e.Part.CFrame = base * CFrame.Angles(0, 0, bend) * e.Offset
			end
		end)
	end
end

-- Riesenmuscheln (Muschelland)
local function shells(k, n, colors)
	for i = 0, n - 1 do
		local a = i / n * TAU + rnd(k, -0.1, 0.1)
		local x, z = polar(a, RIM - 30)
		local s = rnd(k, 120, 190)
		local cf = facing(k, x, SEA + s * 0.4, z) * CFrame.Angles(-0.5, 0, 0)
		local c = tint(k, colors[i % #colors + 1], 0.15)
		P(k, "Ball", V(s * 1.4, s * 0.25, s), cf, c, "SmoothPlastic", 0, "Muschel")
		for r = -3, 3 do
			P(k, "Block", V(6, 6, s * 0.95), cf * CFrame.Angles(0, r * 0.32, 0) * CFrame.new(0, s * 0.1, 0), c:Lerp(WHITE, 0.3), "SmoothPlastic", 0, "Rippe")
		end
		local pearl = P(k, "Ball", V(s * 0.25, s * 0.25, s * 0.25), cf * CFrame.new(0, s * 0.2, -s * 0.25), hex("#fff4f8"), "Glass", 0, "Perle")
		pearl.Reflectance = 0.4
	end
end

-- versunkene Ruinen (Atlantis)
local function ruins(k, n, stone, gold)
	for i = 0, n - 1 do
		local a = i / n * TAU + rnd(k, -0.08, 0.08)
		local x, z = polar(a, RIM - 30)
		local h = rnd(k, 150, 260)
		local cf = facing(k, x, SEA + h / 2, z)
		local c = tint(k, stone, 0.2)
		if i % 3 == 0 then
			-- Tempelfront: Säulen, Gebälk, Giebel
			for s = -2, 2 do P(k, "Cyl", V(16, h, 16), cf * CFrame.new(s * 34, 0, 0), c, "Marble", 0, "Saeule") end
			P(k, "Block", V(180, 18, 30), cf * CFrame.new(0, h / 2 + 9, 0), c, "Marble", 0, "Gebaelk")
			prism(k, cf * CFrame.new(0, h / 2 + 40, 0), 180, 46, 26, c, "Marble", 0, "Giebel")
			P(k, "Ball", V(30, 30, 30), cf * CFrame.new(0, h / 2 + 75, 0), gold, "Foil", 0, "Kuppel")
		else
			-- abgebrochene Säulen
			for s = 0, 2 do
				local hh = h * rnd(k, 0.4, 1)
				P(k, "Cyl", V(18, hh, 18), cf * CFrame.new((s - 1) * 40, -h / 2 + hh / 2, rnd(k, -10, 10)) * CFrame.Angles(0, 0, rnd(k, -0.08, 0.08)), c, "Marble", 0, "Saeule")
			end
		end
	end
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

-- ── Rezepte je Welt ──
local R = {}

R.spawn = function(k, w)
	sun(k, -0.9, 0.55, hex("#fff3c4"), 44, hex("#ffe08a"))
	cloudBank(k, 9, WHITE, 0)
	mountains(k, 12, { hex("#6f8fa8"), hex("#7f9bb5") }, hex("#ffffff"), 200, 320)
	islets(k, 6, w.Ground, hex("#7a5a3a"), function(cf, s) prism(k, cf * CFrame.new(0, s * 0.6, 0), s * 0.7, s * 1.2, s * 0.6, hex("#3f7a3f"), "Grass", 0, "Baum") end)
	balloons(k, 4, { hex("#ff5a5a"), hex("#ffd76a"), hex("#5ad1ff"), hex("#7dff8a") })
	birds(k, 2, hex("#3a3a48"))
	motes(k, { Colors = { hex("#fff6c0"), hex("#ffffff") }, Rate = 12, Size0 = 0.9, Speed = 0.6, Alpha = 0.35 })
	grade(k, hex("#ffe9c0"), 0.08, 0.04)
end

R.normal = function(k, w)
	sun(k, -0.6, 0.6, hex("#fff6d0"), 46, hex("#ffe9a0"))
	cloudBank(k, 10, WHITE, 0)
	mountains(k, 13, { hex("#5f7f9a"), hex("#6d8aa3"), hex("#57768f") }, hex("#f4f8ff"))
	hills(k, 10, { hex("#4f9a46"), hex("#5fae4f") }, hex("#2f6a3a"), RIM - 120)
	islets(k, 4, w.Ground, hex("#7a5a3a"))
	birds(k, 2, hex("#3a3a48"))
	butterflies(k, 6, { hex("#ffcf4a"), hex("#ff8ac8"), hex("#8ad0ff") })
	motes(k, { Colors = { hex("#fff6c0"), hex("#ffffff") }, Rate = 14, Size0 = 0.8, Speed = 0.5, Alpha = 0.4 })
	grade(k, hex("#fff1d0"), 0.08, 0.04)
end

R.wald = function(k, w)
	sun(k, 0.8, 0.5, hex("#f6ffd8"), 38, hex("#e0ffb0"))
	cloudBank(k, 8, hex("#e6f2ea"), 0.35, 0, 80)
	mountains(k, 12, { hex("#355e48"), hex("#2f5640") }, nil, 220, 330)
	hills(k, 12, { hex("#2f6a3a"), hex("#3a7a44") }, hex("#1f4a2c"), RIM - 110)
	birds(k, 1, hex("#3a2a20"))
	butterflies(k, 4, { hex("#d9ff7a"), hex("#fff27a") })
	motes(k, { Name = "Blaetter", Texture = "", Colors = { hex("#8fdc5a"), hex("#c9a05a"), hex("#6fbf4a") }, Rate = 10, Size0 = 1.2, Size1 = 1, Speed = 2, Direction = Enum.NormalId.Bottom, Spread = 30, Acceleration = V(1.5, -0.5, 0.8), Y = 120, Size = V(420, 10, 420), Light = 0, Alpha = 0.1, Life = 14 })
	grade(k, hex("#d8ffd0"), 0.06, 0.05)
end

R.stadt = function(k, w)
	sun(k, 0.2, 0.18, hex("#ffc27a"), 70, hex("#ff9a5a"))
	cloudBank(k, 9, hex("#ffd2b0"), 0.1, 40, 170)
	skyline(k, 30, { hex("#5a5560"), hex("#6a6270"), hex("#4a4652") }, hex("#ffd76a"))
	airship(k, hex("#d8d4e0"))
	birds(k, 2, hex("#6a6a78"), 1.6)
	motes(k, { Colors = { hex("#ffe6c0") }, Rate = 10, Size0 = 0.8, Speed = 0.6, Light = 0.4, Alpha = 0.5 })
	grade(k, hex("#ffc89a"), 0.06, 0.06)
end

R.eis = function(k, w)
	sun(k, -1.2, 0.3, hex("#f4fbff"), 40, hex("#d8f0ff"))
	aurora(k, { hex("#5affb0"), hex("#7ad0ff"), hex("#b07bff") }, 1.6, 2.2, 160)
	mountains(k, 12, { hex("#9cc4e4"), hex("#b8d8f0") }, hex("#ffffff"), 230, 340)
	spikes(k, 10, { hex("#cfeeff"), hex("#9fd8ff") }, "Ice", 0.15, false, RIM - 110, 80, 160)
	cloudBank(k, 7, hex("#eef8ff"), 0.2, 20, 110)
	birds(k, 1, hex("#ffffff"), 2.2, hex("#e8f2ff"))
	motes(k, { Name = "Schneeflocken", Colors = { WHITE }, Rate = 30, Size0 = 1.4, Size1 = 1.1, Speed = 3, Direction = Enum.NormalId.Bottom, Spread = 20, Acceleration = V(1, 0, 0.5), Y = 160, Size = V(520, 10, 520), Light = 0.3, Alpha = 0.15, Life = 16 })
	grade(k, hex("#d8f0ff"), 0.04, 0.05)
end

R.lava = function(k, w)
	moon(k, 0.9, 0.42, hex("#ff8a5a"), 46)
	volcanoes(k, 5, hex("#2c2420"), hex("#ff6a1a"))
	mountains(k, 10, { hex("#2a1e1a"), hex("#3a2a24") }, nil, 180, 280)
	bats(k, 2, hex("#1a1214"))
	motes(k, { Name = "Asche", Texture = "", Colors = { hex("#5a5050"), hex("#8a7a70") }, Rate = 18, Size0 = 0.9, Size1 = 0.7, Speed = 2, Direction = Enum.NormalId.Bottom, Spread = 25, Acceleration = V(1, 0, 0), Y = 160, Size = V(500, 10, 500), Light = 0, Alpha = 0.2, Life = 16 })
	grade(k, hex("#ff9a6a"), 0.1, 0.08)
end

R.hoehle = function(k, w)
	stars(k, 90, { hex("#b07bff"), hex("#6ae8ff"), hex("#ff7ae0") }, 0.35)
	spikes(k, 16, { hex("#2a2534"), hex("#352e44") }, "Slate", 0, true, 470, 120, 240)
	spikes(k, 12, { hex("#b07bff"), hex("#6ae8ff"), hex("#8a5aff") }, "Glass", 0.2, false, RIM - 40, 160, 300)
	bats(k, 3, hex("#141018"))
	motes(k, { Name = "Leuchtsporen", Colors = { hex("#b07bff"), hex("#6ae8ff") }, Rate = 16, Size0 = 1.2, Speed = 0.8, Alpha = 0.25, Life = 10 })
	grade(k, hex("#c8a8ff"), 0.08, 0.06)
end

R.candy = function(k, w)
	sun(k, -0.4, 0.55, hex("#fff6fb"), 44, hex("#ffd0ea"))
	cloudBank(k, 10, hex("#ffd8f0"), 0, 30, 150)
	cloudBank(k, 6, hex("#c8ecff"), 0, 60, 170)
	hills(k, 14, { hex("#ffb0d8"), hex("#c8a0ff"), hex("#a0e8d0"), hex("#ffe0a0") }, nil, RIM - 30)
	for i = 0, 7 do
		local a = i / 8 * TAU + 0.2
		local x, z = polar(a, RIM - 90)
		local h = rnd(k, 160, 240)
		local cf = facing(k, x, SEA + h / 2, z)
		P(k, "Cyl", V(8, h, 8), cf, WHITE, "SmoothPlastic", 0, "Lollistiel")
		local disc = P(k, "Cyl", V(80, 14, 80), cf * CFrame.new(0, h / 2 + 34, 0) * CFrame.Angles(math.pi / 2, 0, 0), ({ hex("#ff5fb0"), hex("#5fd3ff"), hex("#ffe25f") })[i % 3 + 1], "SmoothPlastic", 0, "Lolli")
		P(k, "Cyl", V(50, 15, 50), disc.CFrame * UP:Inverse(), WHITE, "SmoothPlastic", 0, "Lolli")
	end
	islets(k, 4, w.Ground, hex("#c88b5a"))
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
	nebula(k, { hex("#3a4a8a"), hex("#5a3a8a") }, 3)
	rockBelt(k, 36, { hex("#8a8d96"), hex("#6a6d76") }, 320, 460, -30, 30, "Rock", 0.008)
	satellite(k)
	comet(k, hex("#9fd8ff"), 0.5)
	motes(k, { Name = "Sternenstaub", Colors = { WHITE, hex("#cfe0ff") }, Rate = 10, Size0 = 0.7, Speed = 0.3, Alpha = 0.3 })
	grade(k, hex("#c8d4ff"), -0.05, 0.06)
end

R.neptun = function(k, w)
	space(k, w, { WHITE, hex("#9fd8ff") })
	aurora(k, { hex("#5aa8ff"), hex("#7af0ff"), hex("#3a6aff") }, -1.2, 2.6, 170)
	spikes(k, 12, { hex("#3a6fd1"), hex("#5a9aff") }, "Ice", 0.1, false, RIM - 20, 180, 320)
	-- Sturmwirbel: ein Ring aus Wolken dreht sich um die Insel
	local storm = collect(k, function()
		for i = 0, 27 do
			local a = i / 28 * TAU
			local x, z = polar(a, 420 + math.sin(i) * 30)
			P(k, "Ball", V(80, 26, 60), facing(k, x, 20 + math.sin(i * 1.7) * 30, z), hex("#5a8ae8"):Lerp(WHITE, (i % 3) * 0.15), "SmoothPlastic", 0.45, "Sturmwolke")
		end
	end)
	orbit(k, storm, 0.03, CFrame.Angles(0.06, 0, 0))
	comet(k, hex("#7af0ff"), 0.6)
	motes(k, { Name = "Eiskristalle", Colors = { hex("#9fd8ff"), WHITE }, Rate = 18, Size0 = 0.8, Speed = 4, Spread = 30, Direction = Enum.NormalId.Left, Alpha = 0.3, Life = 10 })
	grade(k, hex("#a8c8ff"), 0.04, 0.06)
end

R.mars = function(k, w)
	space(k, w, { hex("#ffd8c8"), WHITE })
	mesas(k, 12, { hex("#a84a24"), hex("#8a3a1e"), hex("#c4602e") })
	satellite(k)
	-- Staubschleier in Bodennähe
	cloudBank(k, 8, hex("#d8784a"), 0.55, -60, 10)
	motes(k, { Name = "Staubwind", Texture = "", Colors = { hex("#d8653a"), hex("#ff9b6a") }, Rate = 24, Size0 = 1, Size1 = 0.8, Speed = 5, Spread = 15, Direction = Enum.NormalId.Left, Light = 0, Alpha = 0.35, Life = 10 })
	grade(k, hex("#ffb08a"), 0.05, 0.06)
end

R.saturn = function(k, w)
	space(k, w)
	-- der große Gesteinsring des Saturn, leicht gekippt
	rockBelt(k, 70, { hex("#e0c08a"), hex("#b0905a"), hex("#ffe2a0") }, 330, 470, 0, 10, "Sandstone", 0.012, CFrame.Angles(0.12, 0, 0.05))
	nebula(k, { hex("#8a6a3a"), hex("#5a3a6a") }, 3)
	satellite(k)
	motes(k, { Name = "Goldstaub", Colors = { hex("#ffe2a0"), WHITE }, Rate = 12, Size0 = 0.8, Speed = 0.4, Alpha = 0.3 })
	grade(k, hex("#ffe0a8"), 0.05, 0.05)
end

R.alien = function(k, w)
	space(k, w, { WHITE, hex("#c8ffd8"), hex("#e8c8ff") })
	nebula(k, { hex("#7aff5a"), hex("#b07bff"), hex("#5affd8") }, 5)
	spires(k, 11, hex("#4a2478"), { hex("#7aff5a"), hex("#5affd8"), hex("#d97aff") })
	jellies(k, 7, { hex("#7aff5a"), hex("#d97aff"), hex("#5affd8") })
	comet(k, hex("#7aff5a"), 0.45)
	motes(k, { Name = "Sporen", Colors = { hex("#7aff5a"), hex("#d97aff") }, Rate = 14, Size0 = 1, Speed = 0.6, Alpha = 0.3 })
	grade(k, hex("#d0ffc8"), 0.1, 0.05)
end

R.sonne = function(k, w)
	flares(k, 6, { hex("#fff2a0"), hex("#ffb02e"), hex("#ff6a1a") })
	rockBelt(k, 34, { hex("#a02a08"), hex("#e05a10") }, 330, 460, -20, 25, "CrackedLava", 0.01)
	motes(k, { Name = "Funken", Colors = { hex("#fff2a0"), hex("#ff6a1a") }, Rate = 26, Size0 = 1.1, Size1 = 0.2, Speed = 6, Spread = 25, Y = -60, Size = V(500, 10, 500), Alpha = 0.15, Life = 7 })
	grade(k, hex("#ffc070"), 0.08, 0.08)
end

local function sea(k, w, shaftColor)
	shafts(k, shaftColor, 10)
	motes(k, { Name = "Meeresschnee", Colors = { WHITE, hex("#bff0ff") }, Rate = 22, Size0 = 0.7, Size1 = 0.5, Speed = 0.8, Direction = Enum.NormalId.Bottom, Spread = 40, Light = 0.4, Alpha = 0.35, Life = 14, Y = 60 })
end

R.korallenriff = function(k, w)
	sea(k, w, hex("#bff8ff"))
	corals(k, 14, { hex("#ff7a8a"), hex("#ffb05a"), hex("#c87aff"), hex("#5ad1c8") })
	kelp(k, 14, hex("#3a8a4a"))
	fishSchools(k, 3, { hex("#ffd24a"), hex("#ff7a5a"), hex("#5ad1ff") })
	whale(k, hex("#3a5a7a"), hex("#c8d8e0"))
	jellies(k, 4, { hex("#ff9ad5"), hex("#bff8ff") })
	grade(k, hex("#a0f0ff"), 0.08, 0.04)
end

R.muschelland = function(k, w)
	sea(k, w, hex("#e0fbff"))
	shells(k, 10, { hex("#ffd0e8"), hex("#ffe6c8"), hex("#f0c8ff") })
	kelp(k, 10, hex("#4a9a6a"))
	fishSchools(k, 2, { hex("#ff9ad5"), hex("#ffe6a0"), hex("#9ff3f0") })
	jellies(k, 6, { hex("#ffd0e8"), hex("#c8f0ff") })
	whale(k, hex("#4a6a8a"), hex("#e0e8f0"))
	grade(k, hex("#c8f8ff"), 0.08, 0.03)
end

R.atlantis = function(k, w)
	sea(k, w, hex("#9ff3f0"))
	ruins(k, 12, hex("#d8e4ea"), hex("#ffd76a"))
	kelp(k, 10, hex("#2a6a5a"))
	fishSchools(k, 2, { hex("#ffd76a"), hex("#9ff3f0") })
	jellies(k, 8, { hex("#9ff3f0"), hex("#b07bff") })
	whale(k, hex("#2a4a6a"), hex("#a8c0d0"))
	grade(k, hex("#a0e8f0"), 0.06, 0.05)
end

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
