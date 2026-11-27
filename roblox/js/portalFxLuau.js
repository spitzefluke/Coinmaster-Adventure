// Portal-Animationen im Spawn (ModuleScript PortalFx und LocalScript CoinmasterPortalFx).
//
// Die Portale (welten/js/portalDesigns.js) bringen ihre bewegten Teile mit Namen
// „PFX:<welt>:<art>:<tempo>:<stärke>:<drehpunkt x,y,z>:<achse x,y,z>“ mit (roblox/js/worldParts.js). PortalFx sucht sie
// und bewegt sie jedes Bild: spin (drehen), sway (schwingen), bob (schweben), pulse (Durchsichtigkeit pulsiert),
// seq (Licht der Reihe nach an/aus), lock (Kette mit Schloss).
// Gesperrte Welten (nicht im Attribut „Worlds“ des Spielers): Tor grau, Strudel steht still, Kette mit Schloss
// sichtbar. Ohne Attribut (Werkstatt-Vorschau, Spielstand noch nicht geladen) sind alle Portale offen.
// Reiner Text wie luau.js, damit es auch in Node prüfbar ist.

export const PORTAL_FX = `-- Coinmaster Adventure · Portal-Animationen (ModuleScript)
-- Automatisch erzeugt von der Coinmaster-Webseite.
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")

local PortalFx = {}

local function vec(s, default)
	local f = string.split(s or "", ",")
	local x, y, z = tonumber(f[1]), tonumber(f[2]), tonumber(f[3])
	if not (x and y and z) then return default end
	return Vector3.new(x, y, z)
end

local function grey(c)
	local l = 0.3 * c.R + 0.59 * c.G + 0.11 * c.B
	l = 0.25 + l * 0.45
	return Color3.new(l, l, l)
end

-- Portale unter root suchen (Ordner/Model) und animieren; gibt { Stop } zurück
-- opts.MaxRate: höchstens so viele Bewegungen pro Sekunde (Werkstatt-Vorschau: 30); im Spiel jedes Bild
function PortalFx.Start(root, opts)
	root = root or workspace
	local minStep = (opts and opts.MaxRate) and 1 / opts.MaxRate or 0
	-- opts.Split: Gruppen abwechselnd bewegen (Werkstatt: jede Gruppe nur jedes zweite Mal, halbe Rechenzeit)
	local split, tick = (opts and opts.Split) or 1, 0
	local items, byId, locks = {}, {}, {}
	local function remember(id, p)
		byId[id] = byId[id] or {}
		table.insert(byId[id], { Part = p, Color = p.Color, Material = p.Material })
	end
	for _, p in ipairs(root:GetDescendants()) do
		if p:IsA("BasePart") then
			local n = p.Name
			if string.sub(n, 1, 4) == "PFX:" then
				local f = string.split(n, ":")
				local id, kind = f[2], f[3]
				local axis = vec(f[7], Vector3.new(0, 0, 1))
				local it = {
					Part = p, Id = id, Kind = kind, Speed = tonumber(f[4]) or 1, Amp = tonumber(f[5]) or 0,
					Pivot = vec(f[6], p.Position), Axis = axis.Magnitude > 0 and axis.Unit or Vector3.new(0, 0, 1),
					Base = p.CFrame, T = p.Transparency,
				}
				-- gleicher Takt für alle Teile einer Gruppe (Drehpunkt bestimmt den Versatz)
				it.Phase = (it.Pivot.X * 0.37 + it.Pivot.Z * 0.23) % (math.pi * 2)
				if kind == "lock" then
					locks[id] = locks[id] or {}
					table.insert(locks[id], it)
				else
					table.insert(items, it)
					remember(id, p)
				end
			elseif string.sub(n, 1, 11) == "PortalDeko_" then
				remember(string.sub(n, 12), p)
			elseif string.sub(n, 1, 7) == "Portal_" then
				remember(string.sub(n, 8), p)
			end
		end
	end

	-- gekaufte Welten des Spielers; ohne Attribut sind alle offen
	local player = Players.LocalPlayer
	local locked = {}
	local function refresh()
		local list = player and player:GetAttribute("Worlds")
		local owned = nil
		if type(list) == "string" and list ~= "" then
			owned = {}
			for _, w in ipairs(string.split(list, ",")) do owned[w] = true end
			owned.normal = true
		end
		for id, parts in pairs(locks) do
			local isLocked = owned ~= nil and not owned[id]
			locked[id] = isLocked
			for _, it in ipairs(parts) do it.Part.Transparency = isLocked and 0 or 1 end
			for _, e in ipairs(byId[id] or {}) do
				if isLocked then
					e.Part.Color = grey(e.Color)
					if e.Material == Enum.Material.Neon then e.Part.Material = Enum.Material.SmoothPlastic end
				else
					e.Part.Color = e.Color
					e.Part.Material = e.Material
				end
			end
		end
	end
	refresh()
	local changed = nil
	if player then
		local ok, sig = pcall(function() return player:GetAttributeChangedSignal("Worlds") end)
		if ok and sig then changed = sig:Connect(refresh) end
	end

	-- Teile mit gleicher Bewegung (gleicher Drehpunkt, gleiche Art) als Gruppe: die Bewegung wird je Bild nur
	-- einmal gerechnet
	local groups, byKey = {}, {}
	for _, it in ipairs(items) do
		local pv, ax = it.Pivot, it.Axis
		local key = string.format("%s|%s|%.3f|%.3f|%.2f,%.2f,%.2f|%.2f,%.2f,%.2f", it.Id, it.Kind, it.Speed, it.Amp, pv.X, pv.Y, pv.Z, ax.X, ax.Y, ax.Z)
		local gr = byKey[key]
		if not gr then
			gr = { Id = it.Id, Kind = it.Kind, Speed = it.Speed, Amp = it.Amp, Pivot = it.Pivot, Axis = it.Axis, Phase = it.Phase, Items = {} }
			byKey[key] = gr
			table.insert(groups, gr)
		end
		table.insert(gr.Items, it)
	end

	local start = os.clock()
	local acc = 1
	local connection = RunService.Heartbeat:Connect(function(dt)
		acc = acc + (dt or 0.016)
		if acc < minStep then return end
		acc = 0
		local t = os.clock() - start
		local cam = workspace.CurrentCamera
		local eye = cam and cam.CFrame.Position
		tick = tick + 1
		for gi, gr in ipairs(groups) do
			local due = split <= 1 or gi % split == tick % split
			local near = due and (not eye or (gr.Pivot - eye).Magnitude < 180)
			local k = gr.Kind
			if not due then
				-- diesmal nicht dran (opts.Split)
			elseif locked[gr.Id] then
				if not gr.Still then
					gr.Still = true
					for _, it in ipairs(gr.Items) do it.Part.CFrame = it.Base it.Part.Transparency = it.T end
				end
			elseif near then
				gr.Still = false
				if k == "spin" or k == "sway" then
					local a = k == "spin" and t * gr.Speed or math.sin(t * gr.Speed + gr.Phase) * gr.Amp
					local m = CFrame.new(gr.Pivot) * CFrame.fromAxisAngle(gr.Axis, a) * CFrame.new(-gr.Pivot)
					for _, it in ipairs(gr.Items) do it.Part.CFrame = m * it.Base end
				elseif k == "bob" then
					local off = Vector3.new(0, math.sin(t * gr.Speed + gr.Phase) * gr.Amp, 0)
					for _, it in ipairs(gr.Items) do it.Part.CFrame = it.Base + off end
				elseif k == "pulse" then
					local w = gr.Amp * (0.5 + 0.5 * math.sin(t * gr.Speed + gr.Phase))
					for _, it in ipairs(gr.Items) do it.Part.Transparency = math.clamp(it.T + (1 - it.T) * w, 0, 1) end
				elseif k == "seq" then
					-- weich an- und ausblenden statt hart zu schalten
					local on = math.clamp(math.sin(t * gr.Speed - gr.Amp) * 2.5 + 0.5, 0, 1)
					local fade = on * on * (3 - 2 * on)
					for _, it in ipairs(gr.Items) do it.Part.Transparency = math.min(1, it.T + 0.75 * (1 - fade)) end
				end
			end
		end
	end)

	local handle = {}
	function handle.Stop()
		connection:Disconnect()
		if changed then changed:Disconnect() end
		for _, it in ipairs(items) do
			it.Part.CFrame = it.Base
			it.Part.Transparency = it.T
		end
	end
	return handle
end

return PortalFx
`;

// Client-Skript fürs Spiel: startet PortalFx im Spawn (und neu, wenn Teile nachgeladen werden)
export const PORTAL_FX_CLIENT = `-- Coinmaster Adventure · Portal-Animationen (Client)
local root = game:GetService("ReplicatedStorage"):WaitForChild("CoinmasterAdventure")
local PortalFx = require(root:WaitForChild("PortalFx"))

local handle, count = nil, -1
local function countPortals()
	local n = 0
	for _, p in ipairs(workspace:GetDescendants()) do
		if p:IsA("BasePart") and string.sub(p.Name, 1, 4) == "PFX:" then n = n + 1 end
	end
	return n
end
while true do
	local n = countPortals()
	if n ~= count then
		if handle then handle.Stop() end
		count = n
		handle = n > 0 and PortalFx.Start(workspace) or nil
	end
	task.wait(10)
end
`;
