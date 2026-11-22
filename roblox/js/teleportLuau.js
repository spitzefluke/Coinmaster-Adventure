// Teleport-Animation (ModuleScript TeleportFx): Abflug am Portal und Ankunft auf der Zielinsel.
//
//   Abflug  (Depart):  Ein Strudel aus Lichtkugeln dreht sich immer schneller ins Portal, Lichtfunken werden
//                      eingesaugt, Strahlen kreisen um die Mitte, ein Lichtkern wächst und platzt als Blitz auf.
//   Ankunft (Arrive):  Eine Lichtsäule schlägt ein, eine Druckwelle läuft über den Boden, Funken springen hoch,
//                      ein Ring aus Lichtkugeln steigt spiralförmig an der Säule auf und verglimmt.
//
// Beide Teile bauen nur Effekt-Teile (nicht kollidierend) in einem Ordner und räumen sie selbst wieder weg.
// Das Spiel ruft sie im Client auf (CoinmasterJuice: beim Teleport am alten und am neuen Ort), die
// Welten-Werkstatt in der Vorschau. Reiner Text wie luau.js, damit es auch in Node prüfbar ist.

export const TELEPORT_FX = `-- Coinmaster Adventure · Teleport-Animation (ModuleScript)
-- Automatisch erzeugt von der Coinmaster-Webseite.
local RunService = game:GetService("RunService")

local TeleportFx = {}
local V = Vector3.new
local TAU = math.pi * 2
local WHITE = Color3.new(1, 1, 1)
local VERTICAL = CFrame.Angles(0, 0, math.pi / 2) -- Zylinder stehen in Roblox quer (Achse X)

TeleportFx.DEPART_TIME = 1.25 -- bis zum Blitz
TeleportFx.ARRIVE_TIME = 1.6

local function folder(parent)
	local f = Instance.new("Folder")
	f.Name = "TeleportFx"
	f.Parent = parent or workspace
	return f
end

local function part(f, shape, size, cf, color, transparency, name)
	local p = Instance.new("Part")
	p.Name = name or "Teleport"
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.CastShadow = false
	p.Material = Enum.Material.Neon
	p.Color = color
	p.Transparency = transparency or 0
	if shape == "Cyl" then
		p.Shape = Enum.PartType.Cylinder
	end
	p.Size = size
	p.CFrame = cf
	if shape == "Ball" then
		local m = Instance.new("SpecialMesh")
		m.MeshType = Enum.MeshType.Sphere
		m.Parent = p
	end
	p.Parent = f
	return p
end

-- Ablauf über die Zeit: fn(k) mit k von 0 bis 1, danach done()
local function run(duration, fn, done)
	local t0 = os.clock()
	local c
	c = RunService.Heartbeat:Connect(function()
		local k = math.min(1, (os.clock() - t0) / duration)
		fn(k)
		if k >= 1 then
			c:Disconnect()
			if done then done() end
		end
	end)
	return c
end

local function emitter(f, cf, size, props)
	local holder = part(f, "Block", size, cf, WHITE, 1, "Funkenquelle")
	local e = Instance.new("ParticleEmitter")
	e.Texture = "rbxasset://textures/particles/sparkles_main.dds"
	e.LightEmission = 1
	e.Rate = 0
	for k, v in pairs(props) do e[k] = v end
	e.Parent = holder
	return e
end

local function lerp(a, b, k) return a + (b - a) * k end
local function easeIn(k) return k * k end
local function easeOut(k) return 1 - (1 - k) * (1 - k) end

-- Abflug: center = CFrame der Portalscheibe (LookVector zeigt zum Spieler), color = Farbe der Zielwelt,
-- radius = Radius der Scheibe in Studs. Ruft onFlash(), wenn der Blitz aufplatzt (dort teleportiert das Spiel).
function TeleportFx.Depart(center, color, radius, onFlash, parent)
	radius = radius or 6
	local f = folder(parent)
	local light = color:Lerp(WHITE, 0.55)
	-- Strudel: drei Arme aus Lichtkugeln, die sich nach innen drehen
	local orbs = {}
	for arm = 0, 2 do
		for i = 0, 7 do
			local p = part(f, "Ball", V(1, 1, 1), center, i % 2 == 0 and light or color, 0.4, "Strudel")
			table.insert(orbs, { Part = p, A = arm / 3 * TAU + i * 0.32, R = 1 - i * 0.09 })
		end
	end
	-- Strahlen, die um die Mitte kreisen
	local rays = {}
	for i = 0, 5 do
		table.insert(rays, part(f, "Block", V(0.25, 1, 0.1), center, light, 1, "Strahl"))
	end
	local core = part(f, "Ball", V(1, 1, 1), center, WHITE, 0.5, "Lichtkern")
	local ring = part(f, "Cyl", V(0.2, radius * 2, radius * 2), center * CFrame.Angles(0, math.pi / 2, 0), color, 1, "Portalring")
	-- Funken werden aus der Umgebung ins Portal gesaugt
	local suck = emitter(f, center, V(radius * 3, radius * 3, radius * 3), {
		Color = ColorSequence.new(light, color), Size = NumberSequence.new(0.5, 0.1),
		Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.2, 0), NumberSequenceKeypoint.new(1, 0.3) }),
		Lifetime = NumberRange.new(0.5, 0.8), Speed = NumberRange.new(radius * 2.5, radius * 4),
		Shape = Enum.ParticleEmitterShape.Sphere, ShapeInOut = Enum.ParticleEmitterShapeInOut.Inward, ShapeStyle = Enum.ParticleEmitterShapeStyle.Surface,
	})
	suck.Rate = 70
	local spin = 0
	local last = os.clock()
	run(TeleportFx.DEPART_TIME, function(k)
		local now = os.clock()
		local dt = now - last
		last = now
		spin = spin + dt * lerp(2, 14, easeIn(k))
		for _, o in ipairs(orbs) do
			local r = radius * o.R * lerp(1.15, 0.05, easeIn(k))
			local a = o.A + spin
			o.Part.CFrame = center * CFrame.new(math.cos(a) * r, math.sin(a) * r * 1.3, -0.3)
			local s = lerp(0.6, 1.3, k) * (0.6 + o.R * 0.6)
			o.Part.Size = V(s, s, s)
			o.Part.Transparency = lerp(0.5, 0, k)
		end
		for i, ray in ipairs(rays) do
			local a = i / #rays * TAU + spin * 0.4
			local len = radius * lerp(0.2, 1.6, easeOut(k))
			ray.Size = V(lerp(0.15, 0.5, k), len, 0.1)
			ray.CFrame = center * CFrame.Angles(0, 0, a) * CFrame.new(0, len / 2, -0.2)
			ray.Transparency = lerp(1, 0.25, easeOut(k))
		end
		local c = lerp(1, radius * 1.1, easeIn(k))
		core.Size = V(c, c * 1.3, c)
		core.Transparency = lerp(0.6, 0, k)
		ring.Transparency = lerp(1, 0.55, k)
	end, function()
		suck.Rate = 0
		for _, o in ipairs(orbs) do o.Part:Destroy() end
		for _, r in ipairs(rays) do r:Destroy() end
		ring:Destroy()
		if onFlash then onFlash() end
		-- Blitz: der Kern platzt als Lichtkugel auf und verblasst
		local burst = emitter(f, center, V(1, 1, 1), {
			Color = ColorSequence.new(WHITE, color), Size = NumberSequence.new(0.8, 0.1),
			Transparency = NumberSequence.new(0, 1), Lifetime = NumberRange.new(0.4, 0.9), Speed = NumberRange.new(radius * 3, radius * 6),
			SpreadAngle = Vector2.new(180, 180), Drag = 2,
		})
		burst:Emit(60)
		run(0.45, function(k)
			local c = lerp(radius * 1.1, radius * 3.2, easeOut(k))
			core.Size = V(c, c * 1.3, c)
			core.Transparency = lerp(0, 1, k)
		end, function()
			task.delay(1, function() f:Destroy() end)
		end)
	end)
	return f
end

-- Ankunft: feet = Position der Füße (Boden), color = Farbe der Welt
function TeleportFx.Arrive(feet, color, parent)
	local f = folder(parent)
	local light = color:Lerp(WHITE, 0.6)
	local base = CFrame.new(feet)
	local H = 70
	local column = part(f, "Cyl", V(H, 10, 10), base * CFrame.new(0, H / 2, 0) * VERTICAL, light, 0.1, "Lichtsaeule")
	local inner = part(f, "Cyl", V(H, 4, 4), base * CFrame.new(0, H / 2, 0) * VERTICAL, WHITE, 0, "Lichtsaeule")
	local wave = part(f, "Cyl", V(0.3, 4, 4), base * CFrame.new(0, 0.2, 0) * VERTICAL, color, 0.2, "Druckwelle")
	local wave2 = part(f, "Cyl", V(0.25, 2, 2), base * CFrame.new(0, 0.25, 0) * VERTICAL, light, 0.3, "Druckwelle")
	local orbs = {}
	for i = 0, 9 do
		table.insert(orbs, { Part = part(f, "Ball", V(1.2, 1.2, 1.2), base, i % 2 == 0 and light or color, 0.1, "Lichtkugel"), A = i / 10 * TAU })
	end
	local sparks = emitter(f, base * CFrame.new(0, 0.5, 0), V(4, 1, 4), {
		Color = ColorSequence.new(WHITE, color), Size = NumberSequence.new(0.6, 0.1),
		Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.7, 0.2), NumberSequenceKeypoint.new(1, 1) }),
		Lifetime = NumberRange.new(0.6, 1.2), Speed = NumberRange.new(18, 36), SpreadAngle = Vector2.new(35, 35),
		Acceleration = V(0, -40, 0), EmissionDirection = Enum.NormalId.Top,
	})
	sparks:Emit(70)
	run(TeleportFx.ARRIVE_TIME, function(k)
		-- Säule: schlägt breit ein, wird schmal und verblasst von unten nach oben
		local w = lerp(12, 2, easeOut(k))
		column.Size = V(H, w, w)
		column.Transparency = lerp(0.15, 1, easeIn(k))
		local wi = lerp(5, 0.5, easeOut(k))
		inner.Size = V(H, wi, wi)
		inner.Transparency = lerp(0, 1, k)
		-- Druckwellen auf dem Boden
		local r = lerp(4, 46, easeOut(math.min(1, k * 1.6)))
		wave.Size = V(0.3, r, r)
		wave.Transparency = lerp(0.2, 1, math.min(1, k * 1.6))
		local r2 = lerp(2, 30, easeOut(k))
		wave2.Size = V(0.25, r2, r2)
		wave2.Transparency = lerp(0.3, 1, k)
		-- Lichtkugeln steigen spiralförmig an der Säule auf
		for _, o in ipairs(orbs) do
			local a = o.A + k * 7
			local rr = lerp(7, 3, k)
			o.Part.CFrame = base * CFrame.new(math.cos(a) * rr, lerp(0.5, 26, easeOut(k)), math.sin(a) * rr)
			o.Part.Transparency = lerp(0.05, 1, easeIn(k))
		end
	end, function()
		task.delay(1.2, function() f:Destroy() end)
	end)
	return f
end

return TeleportFx
`;
