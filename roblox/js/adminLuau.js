// Admin Panel für Roblox: Daten (AdminData), das Fenster „Admin“ in GameUI und das Server-Skript CoinmasterAdmin.
// Reiter: Wetter & Welt (Wetter erzwingen, Uhrzeit, Teleport, Welten freischalten), Spieler (Liste, Spielstand,
// Hinreisen, Kicken, Bannen, Zurücksetzen), Server-Events (Ansage, Boosts für alle, Admin Egg) und Banns.
// Reiner Text wie luau.js, damit es auch in Node prüfbar ist.

const str = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
const num = (n) => String(Math.round(n * 1000) / 1000);
const HEADER = (title) => `-- Coinmaster Adventure · ${title}
-- Automatisch erzeugt von der Coinmaster-Webseite. Änderungen besser dort machen
-- und neu übertragen, sonst gehen sie beim nächsten Import verloren.
`;

// Gemeinsame Daten (Client und Server): Zeiten, Uhrzeiten, Bann-Dauern und Boost-Abfrage
export function adminDataSource({ ADMIN }) {
  const list = (a) => a.map(num).join(', ');
  const clocks = ADMIN.clocks.map((c) => `{ Id = ${str(c.id)}, Name = ${str(c.name)}, Hour = ${num(c.hour)} }`);
  const bans = ADMIN.bans.map((b) => `{ Id = ${str(b.id)}, Name = ${str(b.name)}, Minutes = ${num(b.minutes)} }`);
  return `${HEADER('Admin Panel')}
-- Nur Admins sehen das Panel. Wer Admin ist, entscheidet allein der Server (Skript CoinmasterAdmin) und setzt
-- dafür das Attribut Admin am Spieler. Was der Server erzwingt, steht an ReplicatedStorage:
--   AdminWeather, AdminWeatherEnds   erzwungenes Wetter und sein Ende (os.time()), danach wieder der Zeitplan
--   AdminClock                       Uhrzeit für alle (0–24), fehlt = Licht der Welt
--   ServerBoost_<id>                 Boost für alle bis (os.time()), z. B. ServerBoost_glueck

local AdminData = {}

AdminData.Key = ${str(ADMIN.key)} -- Taste zum Öffnen
AdminData.WeatherMinutes = { ${list(ADMIN.weatherMinutes)} }
AdminData.EventMinutes = { ${list(ADMIN.eventMinutes)} }
AdminData.Clocks = {
	${clocks.join(',\n\t')},
}
AdminData.Bans = {
	${bans.join(',\n\t')},
}
AdminData.AnnounceMax = ${num(ADMIN.announceMax)}

local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Ende eines Server-Boosts (os.time()) oder 0
function AdminData.ServerBoostEnds(boostId)
	return ReplicatedStorage:GetAttribute("ServerBoost_" .. boostId) or 0
end

-- Wirkt ein Boost für diesen Spieler? Eigener Boost (Boost_<id>) oder Server-Boost (ServerBoost_<id>).
-- Für das Würfeln beim Finden: z. B. Glück verdoppeln, wenn AdminData.BoostActive(player, "glueck").
function AdminData.BoostActive(player, boostId)
	local now = os.time()
	return (player:GetAttribute("Boost_" .. boostId) or 0) > now or AdminData.ServerBoostEnds(boostId) > now
end

-- In der Liste erlaubt?
function AdminData.Allowed(list, value)
	for _, v in ipairs(list) do
		if v == value then return true end
	end
	return false
end

function AdminData.BanById(id)
	for _, b in ipairs(AdminData.Bans) do
		if b.Id == id then return b end
	end
	return nil
end

-- 18.2 → "18:12"
function AdminData.ClockText(hour)
	local h = math.floor(hour)
	return string.format("%d:%02d", h, math.floor((hour - h) * 60 + 0.5))
end

return AdminData
`;
}

// Teil von GameUI: das Fenster „Admin“. Nutzt die Bausteine aus GAME_UI (new, label, buildWindow, scroller …).
export const GAME_UI_ADMIN = `
-- ══ Admin Panel (nur für Admins: Attribut Admin, das der Server setzt) ══
-- Aktionen gehen über options.Invoke("admin", Aktion, JSON), Daten über options.Query("admin", Art);
-- in Roblox an die RemoteFunction AdminRemote (Server-Skript CoinmasterAdmin). Der Server prüft jede Aktion.
local buildAdmin
do
	local AdminData = require(root:WaitForChild("AdminData"))
	local ACCENT = Color3.fromRGB(255, 96, 104)
	local LEFT, TOP = Enum.TextXAlignment.Left, Enum.TextYAlignment.Top

	local function isAdmin() return attr("Admin", false) == true end
	GameUI.IsAdmin = isAdmin
	local function ask(kind)
		local ok, data = pcall(options.Query, "admin", kind)
		if ok and type(data) == "table" then return data end
		return nil
	end
	local function act(sub, args)
		local ok, text = options.Invoke("admin", sub, HttpService:JSONEncode(args or {}))
		GameUI.Toast(text or (ok and "Erledigt" or "Das geht gerade nicht"), ok and ACCENT or C.red)
		if ok and options.Sound then options.Sound("buy", 1) end
		if not ok and Juice.denied then Juice.denied() end
		GameUI.Refresh("admin")
		return ok
	end
	-- Bestätigung per zweitem Klick (3 Sekunden)
	local function armed(key)
		return ui[key] ~= nil and os.clock() - ui[key] < 3
	end
	local function arm(key)
		ui[key] = os.clock()
		GameUI.Refresh("admin")
		task.delay(3.05, function() GameUI.Refresh("admin") end)
	end
	local function when(t)
		if not t or t == 0 then return "für immer" end
		return "bis " .. os.date("%d.%m. %H:%M", t)
	end

	-- ── Bausteine ──
	local function heading(parent, order, text, hint)
		local h = new("Frame", { Name = "Ueberschrift", Size = UDim2.new(1, 0, 0, 30), BackgroundTransparency = 1, LayoutOrder = order, Parent = parent })
		label({ Size = UDim2.new(0.5, 0, 1, 0), Text = text, Font = FONT, TextSize = T.Medium, TextColor3 = C.gold, TextXAlignment = LEFT, TextYAlignment = Enum.TextYAlignment.Bottom, Parent = h })
		if hint then
			label({ Size = UDim2.new(0.5, 0, 1, 0), Position = UDim2.new(1, 0, 0, 0), AnchorPoint = Vector2.new(1, 0), Text = hint, TextSize = T.Tiny, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Right, TextYAlignment = Enum.TextYAlignment.Bottom, Font = TEXT, Parent = h })
		end
		return h
	end
	local function line(parent, order, height)
		return new("Frame", { Name = "Zeile", Size = UDim2.new(1, 0, 0, height or 36), BackgroundTransparency = 1, LayoutOrder = order, Parent = parent }, {
			new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8), VerticalAlignment = Enum.VerticalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder }),
		})
	end
	local function note(parent, order, text)
		return label({ Size = UDim2.new(1, 0, 0, 18), Text = text, TextSize = T.Tiny, TextColor3 = C.muted, TextXAlignment = LEFT, Font = TEXT, LayoutOrder = order, Parent = parent })
	end
	-- Raster mit fester Spaltenzahl; die Höhe ergibt sich aus der Anzahl
	local function grid(parent, order, count, cols, cellH)
		return new("Frame", { Name = "Raster", Size = UDim2.new(1, 0, 0, math.ceil(count / cols) * (cellH + 8)), BackgroundTransparency = 1, LayoutOrder = order, Parent = parent }, {
			new("UIGridLayout", { CellSize = UDim2.new(1 / cols, -8, 0, cellH), CellPadding = UDim2.new(0, 8, 0, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
		})
	end
	-- Knopf mit Farbe; enabled = false graut ihn aus
	local function button(parent, text, color, enabled, onClick, props)
		local base = { Name = "Knopf", Size = UDim2.new(0, 160, 0, 36), BackgroundColor3 = color, Text = text, Font = FONT, TextSize = T.Body, TextColor3 = Color3.new(1, 1, 1), AutoButtonColor = enabled, Parent = parent }
		for k, v in pairs(props or {}) do base[k] = v end
		local b = new("TextButton", base, { corner(R.S) })
		if not enabled then
			b.BackgroundTransparency = 0.55
			b.TextTransparency = 0.35
		end
		pressable(b, function()
			if enabled then onClick() end
		end)
		return b
	end
	-- Eingabefeld, dessen Text einen Neuaufbau übersteht (ui[key])
	local function field(parent, key, placeholder, props, onEnter)
		local holder = new("Frame", { Name = "Feld", Size = UDim2.new(1, 0, 0, 36), BackgroundColor3 = C.deep, Parent = parent }, {
			corner(R.S),
			stroke(C.line, 1),
		})
		for k, v in pairs(props or {}) do holder[k] = v end
		local box = new("TextBox", { Name = "Eingabe", Size = UDim2.new(1, -20, 1, 0), Position = UDim2.new(0, 10, 0, 0), BackgroundTransparency = 1, Text = ui[key] or "", PlaceholderText = placeholder, PlaceholderColor3 = C.muted, ClearTextOnFocus = false, Font = TEXT, TextSize = T.Small, TextColor3 = C.ink, TextXAlignment = LEFT, Parent = holder })
		box:GetPropertyChangedSignal("Text"):Connect(function() ui[key] = box.Text end)
		if onEnter then
			box.FocusLost:Connect(function(enter)
				if enter then onEnter() end
			end)
		end
		return box, holder
	end

	-- ── Wetter & Welt ──
	ui.adminWeatherMin = AdminData.WeatherMinutes[2] or AdminData.WeatherMinutes[1]
	local function fillWorld(w, list, ticks)
		local wid = ReplicatedStorage:GetAttribute("Weather") or "klar"
		local cur = MutationData.WeatherById[wid] or MutationData.Weather[1]
		local forced = ReplicatedStorage:GetAttribute("AdminWeather")
		local forcedOn = forced ~= nil and forced ~= "" and (ReplicatedStorage:GetAttribute("AdminWeatherEnds") or 0) > os.time()
		local function status()
			local left = (ReplicatedStorage:GetAttribute("WeatherEnds") or os.time()) - os.time()
			return "Jetzt " .. cur.Name .. " · noch " .. mmss(left) .. (forcedOn and " · von einem Admin gesetzt" or " · nach Zeitplan")
		end
		w.sub.Text = status()
		table.insert(ticks, function() w.sub.Text = status() end)

		heading(list, 1, "Wetter", "Gilt für alle auf diesem Server, danach geht der Zeitplan weiter")
		local r = line(list, 2)
		label({ Size = UDim2.new(0, 52, 1, 0), Text = "Dauer", TextSize = T.Small, TextColor3 = C.muted, TextXAlignment = LEFT, LayoutOrder = 1, Parent = r })
		for i, m in ipairs(AdminData.WeatherMinutes) do
			smallButton(r, m .. " min", i + 1, 72, function()
				ui.adminWeatherMin = m
				GameUI.Refresh("admin")
			end, ui.adminWeatherMin == m)
		end
		button(r, "Zurück zum Zeitplan", C.line, forcedOn, function() act("weatherReset") end, { Size = UDim2.new(0, 190, 0, 34), LayoutOrder = 20, TextSize = T.Small })
		local g = grid(list, 3, #MutationData.Weather, 4, 54)
		for i, x in ipairs(MutationData.Weather) do
			local rar = x.Rarity and MutationData.WeatherRarityById[x.Rarity]
			local on = x.Id == wid
			local b = new("TextButton", { Name = x.Id, BackgroundColor3 = on and C.highlight or C.bg2, Text = "", AutoButtonColor = false, LayoutOrder = i, Parent = g }, {
				corner(R.S),
				stroke(on and x.Color or C.line, on and 2 or 1),
			})
			new("Frame", { Size = UDim2.new(0, 12, 0, 12), Position = UDim2.new(0, 12, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), BackgroundColor3 = x.Color, Parent = b }, { corner(R.Round) })
			label({ Size = UDim2.new(1, -40, 0, 20), Position = UDim2.new(0, 32, 0, 8), Text = x.Name, Font = FONT, TextSize = T.Body, TextXAlignment = LEFT, Parent = b })
			label({ Size = UDim2.new(1, -40, 0, 14), Position = UDim2.new(0, 32, 0, 30), Text = rar and rar.Name or "ohne Wetter", TextSize = T.Tiny, Font = MONO, TextColor3 = rar and rar.Color or C.muted, TextXAlignment = LEFT, Parent = b })
			pressable(b, function() act("weather", { Id = x.Id, Minutes = ui.adminWeatherMin }) end)
		end

		heading(list, 4, "Uhrzeit", "Für alle auf diesem Server")
		local clock = ReplicatedStorage:GetAttribute("AdminClock")
		local r2 = line(list, 5)
		smallButton(r2, "Licht der Welt", 1, 130, function() act("clock", { Hour = -1 }) end, clock == nil)
		for i, c in ipairs(AdminData.Clocks) do
			smallButton(r2, c.Name .. " " .. AdminData.ClockText(c.Hour), i + 1, 126, function() act("clock", { Hour = c.Hour }) end, clock ~= nil and math.abs(clock - c.Hour) < 0.01)
		end

		heading(list, 6, "Welten", "Teleport auch in Welten, die du nicht hast")
		local r3 = line(list, 7)
		button(r3, "Alle Welten freischalten", ACCENT, true, function() act("unlockWorlds") end, { Size = UDim2.new(0, 230, 0, 34), TextSize = T.Small, LayoutOrder = 1 })
		label({ Size = UDim2.new(0, 360, 1, 0), Text = "Für dich: alle Welten und Portale", TextSize = T.Tiny, TextColor3 = C.muted, TextXAlignment = LEFT, Font = TEXT, LayoutOrder = 2, Parent = r3 })
		local worlds = {}
		for _, x in ipairs(WorldData.Worlds) do
			if not x.ComingSoon then table.insert(worlds, x) end
		end
		local here = attr("World", "spawn")
		local g2 = grid(list, 8, #worlds, 4, 50)
		for i, x in ipairs(worlds) do
			local planet = WorldData.PlanetById[x.Planet]
			local on = x.Id == here
			local accent = x.Accent or C.gold
			local b = new("TextButton", { Name = x.Id, BackgroundColor3 = on and C.highlight or C.bg2, Text = "", AutoButtonColor = false, LayoutOrder = i, Parent = g2 }, {
				corner(R.S),
				stroke(on and accent or C.line, on and 2 or 1),
			})
			label({ Size = UDim2.new(1, -20, 0, 20), Position = UDim2.new(0, 12, 0, 6), Text = x.Name, Font = FONT, TextSize = T.Body, TextColor3 = on and accent or C.ink, TextXAlignment = LEFT, Parent = b })
			label({ Size = UDim2.new(1, -20, 0, 14), Position = UDim2.new(0, 12, 0, 28), Text = on and "Du bist hier" or (planet and planet.Name or "Treffpunkt"), TextSize = T.Tiny, Font = MONO, TextColor3 = C.muted, TextXAlignment = LEFT, Parent = b })
			pressable(b, function() act("teleport", { World = x.Id }) end)
		end
	end

	-- ── Spieler ──
	ui.adminBanLen = AdminData.Bans[1] and AdminData.Bans[1].Id
	local function banButtons(parent, order, width)
		for i, b in ipairs(AdminData.Bans) do
			local sb = smallButton(parent, b.Name, order + i, width, function()
				ui.adminBanLen = b.Id
				GameUI.Refresh("admin")
			end, ui.adminBanLen == b.Id)
			sb.TextSize = T.Tiny
		end
	end
	local function fillPlayers(w)
		local data = ask("players") or {}
		w.sub.Text = #data .. " Spieler auf diesem Server"
		local sel
		for _, p in ipairs(data) do
			if p.UserId == ui.adminSel then sel = p end
		end
		if not sel then
			sel = data[1]
			ui.adminSel = sel and sel.UserId
		end
		local list = scroller(w, w.body, "Spieler", { Size = UDim2.new(1, -330, 1, 0) }, {
			new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }),
			new("UIPadding", { PaddingRight = UDim.new(0, 12), PaddingBottom = UDim.new(0, 6), PaddingTop = UDim.new(0, 2), PaddingLeft = UDim.new(0, 2) }),
		})
		for i, p in ipairs(data) do
			local on = sel ~= nil and p.UserId == sel.UserId
			local b = new("TextButton", { Name = tostring(p.UserId), Size = UDim2.new(1, 0, 0, 54), BackgroundColor3 = on and C.highlight or C.bg2, Text = "", AutoButtonColor = false, LayoutOrder = i, Parent = list }, {
				corner(R.S),
				stroke(on and C.goldHi or C.line, on and 2 or 1),
			})
			label({ Size = UDim2.new(1, -110, 0, 22), Position = UDim2.new(0, 14, 0, 6), Text = p.DisplayName .. (p.Me and " (du)" or ""), Font = FONT, TextSize = T.Medium, TextXAlignment = LEFT, Parent = b })
			label({ Size = UDim2.new(1, -110, 0, 16), Position = UDim2.new(0, 14, 0, 30), Text = "@" .. p.Name .. " · Level " .. (p.Level or 1) .. " · " .. (p.World or "?") .. " · " .. GameUI.Format(p.Taler or 0) .. " Taler", TextSize = T.Tiny, TextColor3 = C.muted, TextXAlignment = LEFT, Font = TEXT, Parent = b })
			if p.Admin then
				new("TextLabel", { Size = UDim2.new(0, 70, 0, 22), Position = UDim2.new(1, -12, 0.5, 0), AnchorPoint = Vector2.new(1, 0.5), BackgroundColor3 = ACCENT, BackgroundTransparency = 0.75, Text = "ADMIN", TextColor3 = ACCENT, Font = BODY, TextSize = T.Tiny, Parent = b }, { corner(R.Round), stroke(ACCENT, 1) })
			end
			pressable(b, function()
				ui.adminSel = p.UserId
				GameUI.Refresh("admin")
			end)
		end
		if #data == 0 then
			label({ Size = UDim2.new(1, 0, 0, 40), Text = "Keine Spieler gefunden.", TextColor3 = C.muted, Parent = list })
		end

		-- Details und Aktionen zum gewählten Spieler
		-- eigene Bildlaufleiste, falls das Fenster niedrig ist (Handy, kleine Bildschirme)
		local panel = new("Frame", { Name = "Details", Size = UDim2.new(0, 316, 1, 0), Position = UDim2.new(1, -316, 0, 0), BackgroundColor3 = C.bg2, Parent = w.body }, {
			corner(R.L),
			stroke(C.line, 2),
		})
		local side = scroller(w, panel, "Aktionen", { Size = UDim2.new(1, 0, 1, -4), Position = UDim2.new(0, 0, 0, 2), AutomaticCanvasSize = Enum.AutomaticSize.None, CanvasSize = UDim2.new(0, 0, 0, 470), ScrollBarThickness = 6 }, {
			new("UIPadding", { PaddingLeft = UDim.new(0, 14), PaddingRight = UDim.new(0, 14), PaddingTop = UDim.new(0, 12), PaddingBottom = UDim.new(0, 12) }),
		})
		if not sel then return end
		label({ Size = UDim2.new(1, 0, 0, 26), Text = sel.DisplayName, Font = FONT, TextSize = T.Big, TextXAlignment = LEFT, TextScaled = utf8.len(sel.DisplayName) > 18, Parent = side })
		label({ Size = UDim2.new(1, 0, 0, 14), Position = UDim2.new(0, 0, 0, 28), Text = "@" .. sel.Name .. " · UserId " .. tostring(sel.UserId), TextSize = T.Tiny, Font = MONO, TextColor3 = C.muted, TextXAlignment = LEFT, Parent = side })
		local facts = {
			{ "Level", tostring(sel.Level or 1) }, { "Taler", GameUI.Format(sel.Taler or 0) },
			{ "Welt", sel.World or "?" }, { "Welten", tostring(sel.Worlds or 0) },
			{ "Wiedergeburten", tostring(sel.Rebirths or 0) }, { "Münzen", GameUI.Format(sel.Coins or 0) },
			{ "Gefunden", GameUI.Format(sel.Found or 0) }, { "Eier", tostring(sel.Eggs or 0) },
			{ "Auras", tostring(sel.Auras or 0) }, { "Online", (sel.Minutes or 0) .. " min" },
		}
		for i, f in ipairs(facts) do
			local col, rowN = (i - 1) % 2, math.floor((i - 1) / 2)
			local x, y = col * 148, 50 + rowN * 33
			label({ Size = UDim2.new(0, 140, 0, 12), Position = UDim2.new(0, x, 0, y), Text = f[1], TextSize = T.Tiny, TextColor3 = C.muted, TextXAlignment = LEFT, Parent = side })
			label({ Size = UDim2.new(0, 140, 0, 18), Position = UDim2.new(0, x, 0, y + 13), Text = f[2], TextSize = T.Small, TextXAlignment = LEFT, TextScaled = utf8.len(f[2]) > 16, Parent = side })
		end
		local protected = sel.Me or sel.Admin
		local why = sel.Me and "Das bist du" or "Ist Admin"
		local y = 218
		field(side, "adminReason", "Grund (optional, sieht der Spieler)", { Position = UDim2.new(0, 0, 0, y) })
		y = y + 44
		button(side, "Hinreisen", C.blue, not sel.Me, function() act("visit", { UserId = sel.UserId }) end, { Size = UDim2.new(0.5, -4, 0, 34), Position = UDim2.new(0, 0, 0, y), TextSize = T.Small })
		button(side, protected and why or "Kicken", C.red, not protected, function()
			act("kick", { UserId = sel.UserId, Reason = ui.adminReason or "" })
		end, { Size = UDim2.new(0.5, -4, 0, 34), Position = UDim2.new(0.5, 4, 0, y), TextSize = T.Small })
		y = y + 42
		local lens = new("Frame", { Name = "Dauer", Size = UDim2.new(1, 0, 0, 34), Position = UDim2.new(0, 0, 0, y), BackgroundTransparency = 1, Parent = side }, {
			new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 4), SortOrder = Enum.SortOrder.LayoutOrder }),
		})
		banButtons(lens, 0, math.floor((288 - 4 * (#AdminData.Bans - 1)) / #AdminData.Bans))
		y = y + 42
		local len = AdminData.BanById(ui.adminBanLen) or AdminData.Bans[1]
		button(side, protected and why or (armed("adminBanArm") and "Wirklich bannen? Nochmal" or ("Bannen · " .. len.Name)), Color3.fromRGB(150, 28, 44), not protected, function()
			if not armed("adminBanArm") then return arm("adminBanArm") end
			ui.adminBanArm = nil
			act("ban", { UserId = sel.UserId, Ban = len.Id, Reason = ui.adminReason or "" })
		end, { Size = UDim2.new(1, 0, 0, 36), Position = UDim2.new(0, 0, 0, y), TextSize = T.Small })
		y = y + 44
		button(side, armed("adminResetArm") and "Alles löschen? Nochmal" or "Spielstand zurücksetzen", C.line, sel.Ready ~= false, function()
			if not armed("adminResetArm") then return arm("adminResetArm") end
			ui.adminResetArm = nil
			act("reset", { UserId = sel.UserId })
		end, { Size = UDim2.new(1, 0, 0, 36), Position = UDim2.new(0, 0, 0, y), TextSize = T.Small })
	end

	-- ── Server-Events ──
	ui.adminEventMin = AdminData.EventMinutes[1]
	local function fillEvents(w, list, ticks)
		w.sub.Text = "Für alle Spieler auf diesem Server"
		heading(list, 1, "Ansage an alle", "Höchstens " .. AdminData.AnnounceMax .. " Zeichen, Roblox filtert den Text")
		local r = new("Frame", { Name = "Ansage", Size = UDim2.new(1, 0, 0, 40), BackgroundTransparency = 1, LayoutOrder = 2, Parent = list })
		local function send()
			if act("announce", { Text = ui.adminText or "" }) then ui.adminText = "" end
		end
		field(r, "adminText", "z. B. In 5 Minuten gibt es ein Glücks-Event!", { Size = UDim2.new(1, -150, 1, 0) }, send)
		button(r, "Senden", ACCENT, true, send, { Size = UDim2.new(0, 140, 1, 0), Position = UDim2.new(1, 0, 0, 0), AnchorPoint = Vector2.new(1, 0) })

		heading(list, 3, "Boosts für alle", "Wirken zusätzlich zu eigenen Boosts")
		local r2 = line(list, 4)
		label({ Size = UDim2.new(0, 52, 1, 0), Text = "Dauer", TextSize = T.Small, TextColor3 = C.muted, TextXAlignment = LEFT, LayoutOrder = 1, Parent = r2 })
		for i, m in ipairs(AdminData.EventMinutes) do
			smallButton(r2, m .. " min", i + 1, 72, function()
				ui.adminEventMin = m
				GameUI.Refresh("admin")
			end, ui.adminEventMin == m)
		end
		local g = grid(list, 5, #ShopData.Boosts, 3, 144)
		for i, b in ipairs(ShopData.Boosts) do
			local c = card(g, C.line)
			c.LayoutOrder = i
			icon(b.Icon, { Size = UDim2.new(0, 24, 0, 24), Parent = c })
			label({ Size = UDim2.new(1, -32, 0, 24), Position = UDim2.new(0, 32, 0, 0), Text = b.Name, Font = FONT, TextSize = T.Medium, TextXAlignment = LEFT, Parent = c })
			label({ Size = UDim2.new(1, 0, 0, 30), Position = UDim2.new(0, 0, 0, 26), Text = b.Text, TextSize = T.Tiny, TextWrapped = true, TextColor3 = C.muted, TextXAlignment = LEFT, TextYAlignment = TOP, Font = TEXT, Parent = c })
			local st = label({ Size = UDim2.new(1, 0, 0, 16), Position = UDim2.new(0, 0, 0, 62), Text = "", TextSize = T.Small, Font = MONO, TextXAlignment = LEFT, Parent = c })
			local running = AdminData.ServerBoostEnds(b.Id) > os.time()
			local function show()
				local left = AdminData.ServerBoostEnds(b.Id) - os.time()
				st.Text = left > 0 and ("läuft · noch " .. mmss(left)) or "aus"
				st.TextColor3 = left > 0 and C.green or C.muted
			end
			show()
			table.insert(ticks, show)
			button(c, "+" .. ui.adminEventMin .. " min", C.green, true, function()
				act("event", { Boost = b.Id, Minutes = ui.adminEventMin })
			end, { Size = UDim2.new(running and 0.55 or 1, running and -4 or 0, 0, 32), Position = UDim2.new(0, 0, 1, -32), TextSize = T.Small })
			if running then
				button(c, "Beenden", C.line, true, function() act("eventStop", { Boost = b.Id }) end, { Size = UDim2.new(0.45, 0, 0, 32), Position = UDim2.new(1, 0, 1, -32), AnchorPoint = Vector2.new(1, 0), TextSize = T.Small })
			end
		end

		heading(list, 6, "Admin Egg", "Jeder Spieler auf dem Server bekommt eins")
		local r3 = line(list, 7, 40)
		button(r3, armed("adminEggArm") and "Wirklich an alle? Nochmal" or "Admin Egg an alle verteilen", ACCENT, true, function()
			if not armed("adminEggArm") then return arm("adminEggArm") end
			ui.adminEggArm = nil
			act("adminEgg")
		end, { Size = UDim2.new(0, 280, 0, 38), LayoutOrder = 1, TextSize = T.Small })

		heading(list, 8, "Protokoll", "Was Admins auf diesem Server gemacht haben")
		local log = ask("log") or {}
		for i, e in ipairs(log) do
			label({ Size = UDim2.new(1, 0, 0, 18), Text = os.date("%H:%M", e.Time) .. "  " .. e.By .. ": " .. e.Text, TextSize = T.Tiny, Font = MONO, TextColor3 = i == 1 and C.ink or C.muted, TextXAlignment = LEFT, TextTruncate = Enum.TextTruncate.AtEnd, LayoutOrder = 8 + i, Parent = list })
		end
		if #log == 0 then note(list, 9, "Noch nichts.") end
	end

	-- ── Banns ──
	local function fillBans(w, list)
		local bans = ask("bans") or {}
		w.sub.Text = #bans .. " gebannt"
		heading(list, 1, "Per UserId bannen", "Auch für Spieler, die gerade nicht da sind")
		local r = new("Frame", { Name = "Eingabe", Size = UDim2.new(1, 0, 0, 36), BackgroundTransparency = 1, LayoutOrder = 2, Parent = list })
		field(r, "adminBanId", "UserId", { Size = UDim2.new(0, 170, 1, 0) })
		field(r, "adminReason", "Grund (optional, sieht der Spieler)", { Size = UDim2.new(1, -180, 1, 0), Position = UDim2.new(0, 180, 0, 0) })
		local r2 = line(list, 3, 36)
		banButtons(r2, 0, 96)
		local len = AdminData.BanById(ui.adminBanLen) or AdminData.Bans[1]
		button(r2, "Bannen · " .. len.Name, Color3.fromRGB(150, 28, 44), true, function()
			local id = tonumber(ui.adminBanId or "")
			if not id then return GameUI.Toast("Bitte eine UserId (Zahl) eingeben", C.red) end
			if act("ban", { UserId = id, Ban = len.Id, Reason = ui.adminReason or "" }) then ui.adminBanId = "" end
		end, { Size = UDim2.new(0, 200, 0, 34), LayoutOrder = 20, TextSize = T.Small })

		heading(list, 4, "Gebannt")
		for i, b in ipairs(bans) do
			local row = new("Frame", { Name = tostring(b.UserId), Size = UDim2.new(1, 0, 0, 56), BackgroundColor3 = C.bg2, LayoutOrder = 4 + i, Parent = list }, { corner(R.S) })
			label({ Size = UDim2.new(1, -170, 0, 22), Position = UDim2.new(0, 14, 0, 6), Text = (b.Name or "?") .. "  ·  " .. when(b.Until), Font = FONT, TextSize = T.Body, TextXAlignment = LEFT, Parent = row })
			label({ Size = UDim2.new(1, -170, 0, 16), Position = UDim2.new(0, 14, 0, 30), Text = "UserId " .. tostring(b.UserId) .. " · von " .. (b.By or "?") .. ((b.Reason and b.Reason ~= "") and (" · " .. b.Reason) or ""), TextSize = T.Tiny, TextColor3 = C.muted, TextXAlignment = LEFT, TextTruncate = Enum.TextTruncate.AtEnd, Font = TEXT, Parent = row })
			button(row, "Aufheben", C.line, true, function() act("unban", { UserId = b.UserId }) end, { Size = UDim2.new(0, 140, 0, 34), Position = UDim2.new(1, -12, 0.5, 0), AnchorPoint = Vector2.new(1, 0.5), TextSize = T.Small })
		end
		if #bans == 0 then note(list, 5, "Niemand ist gebannt.") end
	end

	local function fillAdmin(w)
		clear(w.body)
		clear(w.tools)
		w.sub.Text = ""
		toolButton(w.tools, "Aktualisieren", 1, true, function() GameUI.Refresh("admin") end)
		if not isAdmin() then
			label({ Size = UDim2.new(1, 0, 0, 40), Text = "Nur für Admins.", TextColor3 = C.muted, Parent = w.body })
			return
		end
		local ticks = {}
		if w.tab == "spieler" then
			fillPlayers(w)
		else
			local list = scroller(w, w.body, "Liste_" .. w.tab, { Size = UDim2.new(1, 8, 1, 0) }, {
				new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
				new("UIPadding", { PaddingRight = UDim.new(0, 14), PaddingBottom = UDim.new(0, 10), PaddingLeft = UDim.new(0, 2), PaddingTop = UDim.new(0, 2) }),
			})
			if w.tab == "events" then
				fillEvents(w, list, ticks)
			elseif w.tab == "banns" then
				fillBans(w, list)
			else
				fillWorld(w, list, ticks)
			end
		end
		w.tick = function()
			for _, f in ipairs(ticks) do f() end
		end
	end

	-- Große Ansage unter der Wetter-Ansage (vom Server über AdminEvent an alle): kind "announce" (Admin) oder "event"
	function GameUI.AdminAnnounce(text, by, kind)
		if not ui.fx or type(text) ~= "string" or text == "" then return end
		local color = kind == "event" and C.goldHi or ACCENT
		local box = new("Frame", { Name = "AdminAnsage", Size = UDim2.new(0.92, 0, 0, 112), Position = UDim2.new(0.5, 0, 0, ui.compact and 64 or 236), AnchorPoint = Vector2.new(0.5, 0), BackgroundColor3 = C.bg, BackgroundTransparency = 0.04, ZIndex = 6, Parent = ui.fx }, {
			corner(R.L),
			stroke(color, 3),
			new("UISizeConstraint", { MaxSize = Vector2.new(600, 112) }),
		})
		local scale = new("UIScale", { Scale = 0.5, Parent = box })
		new("Frame", { Size = UDim2.new(0, 52, 0, 52), Position = UDim2.new(0, 16, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), BackgroundColor3 = color, ZIndex = 6, Parent = box }, {
			corner(R.M),
			icon(kind == "event" and "star" or "shield", { Size = UDim2.new(0, 36, 0, 36), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5), ZIndex = 6 }),
		})
		label({ Size = UDim2.new(1, -100, 0, 16), Position = UDim2.new(0, 84, 0, 14), Text = kind == "event" and "SERVER-EVENT" or GameUI.Upper("Ansage von " .. tostring(by or "Admin")), TextSize = T.Tiny, Font = MONO, TextColor3 = color, TextXAlignment = LEFT, ZIndex = 6, Parent = box })
		label({ Size = UDim2.new(1, -100, 0, 66), Position = UDim2.new(0, 84, 0, 34), Text = text, TextSize = T.Large, Font = FONT, TextWrapped = true, TextXAlignment = LEFT, TextYAlignment = TOP, ZIndex = 6, Parent = box })
		TweenService:Create(scale, M.Pop, { Scale = 1 }):Play()
		if options.Sound then options.Sound("big", 2) end
		task.delay(7, function()
			TweenService:Create(scale, M.Exit, { Scale = 0.85 }):Play()
			TweenService:Create(box, M.Exit, { BackgroundTransparency = 1 }):Play()
			task.delay(Theme.ExitTime + 0.05, function() box:Destroy() end)
		end)
	end

	function buildAdmin(playerGui)
		local tabs = { { "welt", "Wetter & Welt", 150, "cloud" }, { "spieler", "Spieler", 110, "paw" }, { "events", "Server-Events", 150, "star" }, { "banns", "Banns", 96, "lock" } }
		local w = buildWindow(playerGui, "admin", "shield", "Admin", tabs, fillAdmin)
		w.win:FindFirstChildOfClass("UIStroke").Color = ACCENT
		w.deps = { "Admin", "World", "Worlds", "@weather" }
		-- Taste (Standard F2) öffnet das Panel; in der Vorschau übernimmt das die Seite
		pcall(function()
			local UserInputService = game:GetService("UserInputService")
			UserInputService.InputBegan:Connect(function(input, processed)
				if processed or not isAdmin() then return end
				if input.KeyCode == Enum.KeyCode[AdminData.Key] then GameUI.Toggle("admin") end
			end)
		end)
		-- Ansagen und Events vom Server
		local function listen(event)
			if event:IsA("RemoteEvent") then
				event.OnClientEvent:Connect(function(kind, text, by)
					if kind == "announce" or kind == "event" then GameUI.AdminAnnounce(text, by, kind) end
				end)
			end
		end
		local event = root:FindFirstChild("AdminEvent")
		if event then
			listen(event)
		else
			local conn
			conn = root.ChildAdded:Connect(function(child)
				if child.Name == "AdminEvent" then
					conn:Disconnect()
					listen(child)
				end
			end)
		end
		-- Uhrzeit für alle (AdminClock): gegen Weltlicht und Wetter halten
		local Lighting = game:GetService("Lighting")
		RunService.Heartbeat:Connect(function()
			local h = ReplicatedStorage:GetAttribute("AdminClock")
			if type(h) == "number" and Lighting.ClockTime ~= h then
				pcall(function() Lighting.ClockTime = h end)
			end
		end)
	end
end
`;

// Server: prüft, wer Admin ist, und führt die Aktionen aus dem Panel aus
export function adminServerSource({ ADMIN_IDS = [] }) {
  const ids = ADMIN_IDS.map((id) => `[${Math.floor(Number(id))}] = true`).filter((s) => !s.includes('NaN'));
  return `-- Coinmaster Adventure · Admin Panel (Server)
-- Automatisch erzeugt von der Coinmaster-Webseite. Admins trägt man dort in spiel/js/admin.js ein (ADMIN_IDS)
-- oder ohne neuen Import in Studio: ServerStorage > Ordner „CoinmasterAdmins“ mit IntValues (Value = UserId).
-- Der Besitzer des Spiels ist immer Admin (bei Gruppenspielen der Gruppen-Besitzer), in Studio alle (zum Testen).
--
-- RemoteFunction AdminRemote: ("query", Art) → Tabelle, ("do", Aktion, JSON) → ok, Text.
-- RemoteEvent AdminEvent: ("announce" | "event", Text, Name) an alle Clients.
-- Wetter, Uhrzeit und Server-Boosts als Attribute an ReplicatedStorage (siehe Modul AdminData).
-- Banns im DataStore "CoinmasterBans" (Schlüssel "Liste"), alle 60 Sekunden neu gelesen.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")
local DataStoreService = game:GetService("DataStoreService")
local TextService = game:GetService("TextService")
local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")
local root = ReplicatedStorage:WaitForChild("CoinmasterAdventure")
local AdminData = require(root:WaitForChild("AdminData"))
local ShopData = require(root:WaitForChild("ShopData"))
local WorldData = require(root:WaitForChild("WorldData"))
local MutationData = require(root:WaitForChild("MutationData"))
local EggData = require(root:WaitForChild("EggData"))
local PlayerData = require(game:GetService("ServerScriptService"):WaitForChild("CoinmasterServer"):WaitForChild("PlayerData"))

local ADMIN_IDS = { ${ids.join(', ')} }
local STUDIO_ADMINS = true -- in Studio sind alle Spieler Admins (zum Testen)

-- ── Wer ist Admin? ──
local function listed(userId)
	if ADMIN_IDS[userId] then return true end
	local folder = ServerStorage:FindFirstChild("CoinmasterAdmins")
	if folder then
		for _, v in ipairs(folder:GetChildren()) do
			if (v:IsA("IntValue") or v:IsA("NumberValue")) and v.Value == userId then return true end
		end
	end
	return game.CreatorType == Enum.CreatorType.User and game.CreatorId ~= 0 and userId == game.CreatorId
end
local groupRank = {}
local function isAdmin(player)
	if STUDIO_ADMINS and RunService:IsStudio() then return true end
	if listed(player.UserId) then return true end
	if game.CreatorType == Enum.CreatorType.Group and game.CreatorId ~= 0 then
		if groupRank[player] == nil then
			local ok, rank = pcall(function() return player:GetRankInGroup(game.CreatorId) end)
			groupRank[player] = ok and rank or 0
		end
		return groupRank[player] >= 255
	end
	return false
end

local function remoteOf(className, name)
	local r = root:FindFirstChild(name)
	if not r then
		r = Instance.new(className)
		r.Name = name
		r.Parent = root
	end
	return r
end
local remote = remoteOf("RemoteFunction", "AdminRemote")
local event = remoteOf("RemoteEvent", "AdminEvent")

-- ── Protokoll (nur dieser Server) ──
local log = {}
local function note(admin, text)
	table.insert(log, 1, { Time = os.time(), By = admin.Name, Text = text })
	if #log > 40 then table.remove(log) end
	print("[Admin] " .. admin.Name .. ": " .. text)
end

-- ── Banns ──
local BAN_KEY = "Liste"
local banStore = nil
do
	local ok, s = pcall(function() return DataStoreService:GetDataStore("CoinmasterBans") end)
	if ok then banStore = s end
end
local bans = {} -- [tostring(UserId)] = { Name, Until (0 = für immer), Reason, By, At }
local function clean(t)
	local now = os.time()
	for k, b in pairs(t) do
		if type(b) ~= "table" or ((b.Until or 0) ~= 0 and b.Until <= now) then t[k] = nil end
	end
	return t
end
local function banOf(userId)
	local b = bans[tostring(userId)]
	if b and ((b.Until or 0) == 0 or b.Until > os.time()) then return b end
	return nil
end
local function banMessage(b)
	local text = "Du bist auf diesem Spiel gebannt (" .. ((b.Until or 0) == 0 and "für immer" or ("bis " .. os.date("!%d.%m.%Y %H:%M UTC", b.Until))) .. ")."
	if b.Reason and b.Reason ~= "" then text = text .. " Grund: " .. b.Reason end
	return text
end
local function kickBanned()
	for _, p in ipairs(Players:GetPlayers()) do
		local b = banOf(p.UserId)
		if b then p:Kick(banMessage(b)) end
	end
end
local function loadBans()
	if not banStore then return end
	local ok, data = pcall(function() return banStore:GetAsync(BAN_KEY) end)
	if ok and type(data) == "table" then bans = clean(data) end
end
-- Liste ändern: im DataStore (alle Server) oder, wenn der nicht geht, nur hier
local function changeBans(fn)
	if banStore then
		local ok, data = pcall(function()
			return banStore:UpdateAsync(BAN_KEY, function(old)
				local t = clean(type(old) == "table" and old or {})
				fn(t)
				return t
			end)
		end)
		if ok and type(data) == "table" then
			bans = data
			return true
		end
		warn("Coinmaster Admin: Banns konnten nicht gespeichert werden (" .. tostring(data) .. "), sie gelten nur auf diesem Server.")
	end
	fn(bans)
	return false
end

-- ── Helfer ──
local function talerOf(player)
	local stats = player:FindFirstChild("leaderstats")
	local t = stats and stats:FindFirstChild("Taler")
	return t and t.Value or 0
end
local function count(list)
	local n = 0
	for _ in string.gmatch(list or "", "[^,]+") do n = n + 1 end
	return n
end
local function eggs(player)
	local n = 0
	for name, value in pairs(player:GetAttributes()) do
		if string.sub(name, 1, 4) == "Egg_" and type(value) == "number" then n = n + value end
	end
	return n
end
local function playerById(userId)
	for _, p in ipairs(Players:GetPlayers()) do
		if p.UserId == userId then return p end
	end
	return nil
end
local function cut(text, max)
	text = tostring(text or ""):gsub("^%s+", ""):gsub("%s+$", "")
	if utf8.len(text) and utf8.len(text) > max then
		text = string.sub(text, 1, utf8.offset(text, max + 1) - 1)
	end
	return text
end
-- Texte, die andere sehen, muss Roblox filtern
local function filter(admin, text)
	local ok, result = pcall(function()
		return TextService:FilterStringAsync(text, admin.UserId, Enum.TextFilterContext.PublicChat):GetNonChatStringForBroadcastAsync()
	end)
	if ok then return result end
	if RunService:IsStudio() then return text end
	return nil
end
local function placeCharacter(player, cframe)
	local character = player.Character
	if character and character:FindFirstChild("HumanoidRootPart") then
		character:PivotTo(cframe + Vector3.new(0, 5, 0))
		return true
	end
	return false
end
-- in eine Welt setzen: Modell „Welt_<Name>“, dort der Spawn oder die Mitte (wie CoinmasterShop)
local function teleport(player, world)
	player:SetAttribute("World", world.Id)
	local model = workspace:FindFirstChild("Welt_" .. world.Name:gsub("%s+", ""), true)
	if not model then return end
	local spawn = model:FindFirstChild("Spawn") or model:FindFirstChild("Teleport")
	if spawn and #spawn:GetChildren() > 0 then
		placeCharacter(player, spawn:GetChildren()[1].CFrame)
	else
		placeCharacter(player, (model:GetBoundingBox()))
	end
end
local joined = {}

-- ── Daten fürs Panel ──
local QUERIES = {}
function QUERIES.players(admin)
	local list = {}
	for _, p in ipairs(Players:GetPlayers()) do
		local world = WorldData.ById[p:GetAttribute("World") or "spawn"]
		table.insert(list, {
			UserId = p.UserId, Name = p.Name, DisplayName = p.DisplayName, Me = p == admin, Admin = isAdmin(p),
			Ready = PlayerData.IsReady(p), Level = p:GetAttribute("Level") or 1, Taler = math.floor(talerOf(p)),
			World = world and world.Name or "?", Worlds = count(p:GetAttribute("Worlds")), Rebirths = p:GetAttribute("Rebirths") or 0,
			Coins = PlayerData.CoinCount(p), Found = p:GetAttribute("CoinsFound") or 0, Eggs = eggs(p),
			Auras = count(p:GetAttribute("OwnedAuras")), Minutes = math.floor((os.time() - (joined[p] or os.time())) / 60),
		})
	end
	table.sort(list, function(a, b)
		if a.Me ~= b.Me then return a.Me end
		return string.lower(a.DisplayName) < string.lower(b.DisplayName)
	end)
	return list
end
function QUERIES.bans()
	local list = {}
	for id, b in pairs(clean(bans)) do
		table.insert(list, { UserId = tonumber(id), Name = b.Name, Until = b.Until or 0, Reason = b.Reason, By = b.By, At = b.At or 0 })
	end
	table.sort(list, function(a, b) return a.At > b.At end)
	return list
end
function QUERIES.log()
	return log
end

-- ── Aktionen ──
local ACTIONS = {}
function ACTIONS.weather(admin, a)
	local w = MutationData.WeatherById[a.Id]
	if not w or not AdminData.Allowed(AdminData.WeatherMinutes, a.Minutes) then return false, "Ungültig" end
	ReplicatedStorage:SetAttribute("AdminWeatherEnds", os.time() + a.Minutes * 60)
	ReplicatedStorage:SetAttribute("AdminWeather", w.Id)
	note(admin, w.Name .. " für " .. a.Minutes .. " min")
	return true, w.Name .. " für " .. a.Minutes .. " Minuten"
end
function ACTIONS.weatherReset(admin)
	ReplicatedStorage:SetAttribute("AdminWeather", nil)
	ReplicatedStorage:SetAttribute("AdminWeatherEnds", nil)
	note(admin, "Wetter zurück zum Zeitplan")
	return true, "Wetter wieder nach Zeitplan"
end
function ACTIONS.clock(admin, a)
	if a.Hour == -1 then
		ReplicatedStorage:SetAttribute("AdminClock", nil)
		note(admin, "Uhrzeit: Licht der Welt")
		return true, "Uhrzeit wieder wie in der Welt"
	end
	for _, c in ipairs(AdminData.Clocks) do
		if c.Hour == a.Hour then
			ReplicatedStorage:SetAttribute("AdminClock", c.Hour)
			note(admin, "Uhrzeit: " .. c.Name)
			return true, "Uhrzeit: " .. c.Name .. " (" .. AdminData.ClockText(c.Hour) .. ")"
		end
	end
	return false, "Ungültig"
end
function ACTIONS.teleport(admin, a)
	local world = WorldData.ById[a.World]
	if not world or world.ComingSoon then return false, "Diese Welt gibt es nicht" end
	teleport(admin, world)
	return true, "Teleportiert nach " .. world.Name
end
function ACTIONS.unlockWorlds(admin)
	local worlds, portals = {}, {}
	for _, w in ipairs(WorldData.Worlds) do
		if not w.ComingSoon and w.Planet ~= "hub" then table.insert(worlds, w.Id) end
	end
	for _, p in ipairs(WorldData.Planets) do
		if not p.ComingSoon and p.Id ~= "hub" then table.insert(portals, p.Id) end
	end
	admin:SetAttribute("Worlds", table.concat(worlds, ","))
	admin:SetAttribute("Portals", table.concat(portals, ","))
	note(admin, "alle Welten freigeschaltet (für sich)")
	return true, "Alle " .. #worlds .. " Welten freigeschaltet"
end
-- Ziel auf diesem Server; Admins (außer sich selbst) sind geschützt
local function target(admin, a, allowSelf)
	local p = playerById(tonumber(a.UserId) or 0)
	if not p then return nil, "Spieler ist nicht (mehr) auf dem Server" end
	if p == admin and not allowSelf then return nil, "Das bist du" end
	if p ~= admin and isAdmin(p) and not allowSelf then return nil, "Admins kann man nicht kicken oder bannen" end
	return p
end
function ACTIONS.visit(admin, a)
	local p = playerById(tonumber(a.UserId) or 0)
	if not p or p == admin then return false, "Spieler ist nicht da" end
	local hrp = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
	if not hrp then return false, p.DisplayName .. " hat gerade keine Figur" end
	if p:GetAttribute("World") then admin:SetAttribute("World", p:GetAttribute("World")) end
	placeCharacter(admin, hrp.CFrame * CFrame.new(0, 0, 4))
	return true, "Zu " .. p.DisplayName .. " gereist"
end
function ACTIONS.kick(admin, a)
	local p, err = target(admin, a)
	if not p then return false, err end
	local reason = cut(a.Reason, 120)
	note(admin, p.Name .. " gekickt" .. (reason ~= "" and (" (" .. reason .. ")") or ""))
	p:Kick("Ein Admin hat dich vom Server entfernt." .. (reason ~= "" and (" Grund: " .. reason) or ""))
	return true, p.DisplayName .. " gekickt"
end
function ACTIONS.ban(admin, a)
	local userId = math.floor(tonumber(a.UserId) or 0)
	local len = AdminData.BanById(a.Ban)
	if userId == 0 or not len then return false, "Ungültig" end
	local p = playerById(userId)
	if p then
		local _, err = target(admin, a)
		if err then return false, err end
	elseif userId < 0 or listed(userId) then
		return false, "Diese UserId kann man nicht bannen"
	end
	local name = p and p.Name
	if not name then
		local ok, n = pcall(function() return Players:GetNameFromUserIdAsync(userId) end)
		if not ok then return false, "Diese UserId gibt es nicht" end
		name = n
	end
	local reason = cut(a.Reason, 120)
	local entry = { Name = name, Until = len.Minutes == 0 and 0 or os.time() + len.Minutes * 60, Reason = reason, By = admin.Name, At = os.time() }
	local everywhere = changeBans(function(t) t[tostring(userId)] = entry end)
	note(admin, name .. " gebannt (" .. len.Name .. ")" .. (reason ~= "" and (": " .. reason) or ""))
	if p then p:Kick(banMessage(entry)) end
	return true, name .. " gebannt (" .. len.Name .. ")" .. (everywhere and "" or " · nur auf diesem Server")
end
function ACTIONS.unban(admin, a)
	local key = tostring(math.floor(tonumber(a.UserId) or 0))
	local b = bans[key]
	if not b then return false, "Nicht gebannt" end
	changeBans(function(t) t[key] = nil end)
	note(admin, (b.Name or key) .. " entbannt")
	return true, (b.Name or key) .. " ist nicht mehr gebannt"
end
function ACTIONS.reset(admin, a)
	local p, err = target(admin, a, true)
	if not p then return false, err end
	if not PlayerData.Reset(p) then return false, "Spielstand lädt noch" end
	note(admin, "Spielstand von " .. p.Name .. " zurückgesetzt")
	return true, "Spielstand von " .. p.DisplayName .. " zurückgesetzt"
end
function ACTIONS.announce(admin, a)
	local text = cut(a.Text, AdminData.AnnounceMax)
	if text == "" then return false, "Bitte einen Text eingeben" end
	local filtered = filter(admin, text)
	if not filtered then return false, "Der Text konnte nicht geprüft werden" end
	event:FireAllClients("announce", filtered, admin.DisplayName)
	note(admin, "Ansage: " .. filtered)
	return true, "Ansage gesendet"
end
function ACTIONS.event(admin, a)
	local boost = ShopData.BoostById[a.Boost]
	if not boost or not AdminData.Allowed(AdminData.EventMinutes, a.Minutes) then return false, "Ungültig" end
	local key = "ServerBoost_" .. boost.Id
	ReplicatedStorage:SetAttribute(key, math.max(os.time(), ReplicatedStorage:GetAttribute(key) or 0) + a.Minutes * 60)
	event:FireAllClients("event", boost.Name .. " für alle! " .. boost.Text .. " (+" .. a.Minutes .. " Minuten)", admin.DisplayName)
	note(admin, boost.Name .. " für alle +" .. a.Minutes .. " min")
	return true, boost.Name .. " für alle gestartet"
end
function ACTIONS.eventStop(admin, a)
	local boost = ShopData.BoostById[a.Boost]
	if not boost then return false, "Ungültig" end
	ReplicatedStorage:SetAttribute("ServerBoost_" .. boost.Id, nil)
	note(admin, boost.Name .. " für alle beendet")
	return true, boost.Name .. " beendet"
end
function ACTIONS.adminEgg(admin)
	local egg = EggData.ById.admin
	if not egg then return false, "Das Admin Egg gibt es nicht" end
	local n = 0
	for _, p in ipairs(Players:GetPlayers()) do
		if PlayerData.IsReady(p) then
			p:SetAttribute("Egg_admin", (p:GetAttribute("Egg_admin") or 0) + 1)
			n = n + 1
		end
	end
	event:FireAllClients("event", "Jeder bekommt ein " .. egg.Name .. "! Schau ins Inventar.", admin.DisplayName)
	note(admin, egg.Name .. " an " .. n .. " Spieler verteilt")
	return true, egg.Name .. " an " .. n .. " Spieler verteilt"
end

local lastCall = {}
remote.OnServerInvoke = function(player, kind, name, payload)
	if not isAdmin(player) then return false, "Nur für Admins" end
	local now = os.clock()
	if lastCall[player] and now - lastCall[player] < 0.2 then return false, "Zu schnell" end
	lastCall[player] = now
	if type(name) ~= "string" or #name > 40 then return false, "Ungültig" end
	if kind == "query" then
		local q = QUERIES[name]
		return q and q(player) or nil
	end
	if kind ~= "do" or not ACTIONS[name] then return false, "Ungültig" end
	local args = {}
	if payload ~= nil then
		if type(payload) ~= "string" or #payload > 2000 then return false, "Ungültig" end
		local ok, t = pcall(function() return HttpService:JSONDecode(payload) end)
		if not ok or type(t) ~= "table" then return false, "Ungültig" end
		args = t
	end
	local ok, res, text = pcall(ACTIONS[name], player, args)
	if not ok then
		warn("Coinmaster Admin: " .. tostring(res))
		return false, "Fehler auf dem Server"
	end
	return res, text
end

local function onJoin(player)
	joined[player] = os.time()
	local b = banOf(player.UserId)
	if b then
		player:Kick(banMessage(b))
		return
	end
	if isAdmin(player) then player:SetAttribute("Admin", true) end
end
Players.PlayerAdded:Connect(onJoin)
Players.PlayerRemoving:Connect(function(player)
	lastCall[player] = nil
	groupRank[player] = nil
	joined[player] = nil
end)
loadBans()
for _, player in ipairs(Players:GetPlayers()) do
	task.spawn(onJoin, player)
end
-- Banns von anderen Servern übernehmen, abgelaufene Server-Boosts aufräumen
task.spawn(function()
	while true do
		task.wait(60)
		loadBans()
		kickBanned()
		for _, b in ipairs(ShopData.Boosts) do
			local key = "ServerBoost_" .. b.Id
			if (ReplicatedStorage:GetAttribute(key) or math.huge) <= os.time() then ReplicatedStorage:SetAttribute(key, nil) end
		end
	end
end)
`;
}
