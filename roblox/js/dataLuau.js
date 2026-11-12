// Speichern in Roblox: ModuleScript PlayerData (ServerScriptService > CoinmasterServer) und das Skript,
// das es startet. Spielstand als Profil im DataStore mit Session-Lock, Autosave, Speichern beim Verlassen
// und beim Herunterfahren, Versionsnummer für spätere Umbauten. Dazu das Münz-Inventar als Stapel, das der
// Client über das RemoteEvent InventoryEvent bekommt (erst alles, danach nur Änderungen).
// Reiner Text wie luau.js, damit es auch in Node prüfbar ist.

export const PLAYER_DATA = `-- Coinmaster Adventure · Spielstand (Server)
-- Automatisch erzeugt von der Coinmaster-Webseite. Änderungen besser dort machen
-- und neu übertragen, sonst gehen sie beim nächsten Import verloren.
--
-- Ein Profil pro Spieler im DataStore "CoinmasterAdventure" (Schlüssel "Spieler_<UserId>"):
--   { Version, Taler, Attributes = { ... }, Coins = { [Schlüssel] = Stapel }, Lock, Saved }
-- Während des Spiels steht der Stand an den Spielern: Taler in leaderstats.Taler, alles andere als
-- Attribute (Liste KEEP unten), Münzen als Stapel hier im Modul.
--
-- Session-Lock: Ein Server „besitzt“ das Profil, solange er es geladen hat. Ein zweiter Server wartet,
-- bis der erste gespeichert und freigegeben hat (oder der Lock älter als 15 Minuten ist).
-- In Studio ohne „API-Zugriff“ (Game Settings > Security) läuft das Spiel ohne Speichern weiter.

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local PlayerData = {}

PlayerData.VERSION = 1
PlayerData.STORE = "CoinmasterAdventure"
PlayerData.AUTOSAVE = 120 -- Sekunden
PlayerData.LOCK_TIMEOUT = 900 -- Sekunden

-- Attribute, die gespeichert werden (dazu alle mit Egg_, Boost_ und Set_ am Anfang). Garden: Münzbaumgarten als JSON
local KEEP = {
	"Level", "XP", "World", "Worlds", "Portals", "Rebirths", "Supernovas", "Aura", "OwnedAuras", "Skills",
	"DailyDay", "DailyStreak", "WheelDay", "Group", "Codes", "CoinsFound", "Garden",
}
local KEEP_PREFIX = { "Egg_", "Boost_", "Set_", "Gem_", "GemValue_" } -- Gem_: Edelsteine (Anzahl, Gesamtwert)

-- Startwerte für neue Spieler
local DEFAULTS = {
	Level = 1, XP = 0, World = "spawn", Worlds = "normal", Portals = "p1", Rebirths = 0, Supernovas = 0, Skills = "kern:1",
	CoinsFound = 0,
}

-- Neues Profil
function PlayerData.NewProfile()
	local attributes = {}
	for k, v in pairs(DEFAULTS) do attributes[k] = v end
	return { Version = PlayerData.VERSION, Taler = 0, Attributes = attributes, Coins = {}, Saved = 0 }
end

-- Ältere Profile auf den neuesten Stand bringen (hier kommen später Umbauten hin)
function PlayerData.Migrate(data)
	if type(data) ~= "table" then return PlayerData.NewProfile() end
	data.Attributes = data.Attributes or {}
	data.Coins = data.Coins or {}
	data.Taler = tonumber(data.Taler) or 0
	data.Version = data.Version or 1
	-- Beispiel für später: if data.Version < 2 then ... data.Version = 2 end
	for k, v in pairs(DEFAULTS) do
		if data.Attributes[k] == nil then data.Attributes[k] = v end
	end
	return data
end

-- Mit Wiederholung, falls der DataStore kurz nicht antwortet (1, 2, 4 Sekunden Pause)
local function retry(fn)
	local err
	for attempt = 1, 4 do
		local ok, result = pcall(fn)
		if ok then return true, result end
		err = result
		if attempt < 4 then task.wait(2 ^ (attempt - 1)) end
	end
	return false, err
end

-- Profil laden und sperren. Gibt profile oder nil, Grund zurück.
-- store: DataStore (oder ein Ersatz mit UpdateAsync), jobId: dieser Server
function PlayerData.LoadProfile(store, key, jobId, now)
	now = now or os.time
	for _ = 1, 6 do
		local locked = false
		local ok, result = retry(function()
			return store:UpdateAsync(key, function(old)
				if old and old.Lock and old.Lock.Job ~= jobId and now() - (old.Lock.Time or 0) < PlayerData.LOCK_TIMEOUT then
					locked = true
					return nil -- nichts ändern, anderer Server hat es noch
				end
				local data = PlayerData.Migrate(old)
				data.Lock = { Job = jobId, Time = now() }
				return data
			end)
		end)
		if not ok then return nil, "DataStore: " .. tostring(result) end
		if not locked and result then return result end
		task.wait(5)
	end
	return nil, "Spielstand ist noch auf einem anderen Server offen"
end

-- Profil speichern (release = Lock freigeben). Speichert nur, wenn dieser Server den Lock hat.
function PlayerData.SaveProfile(store, key, profile, jobId, release, now)
	now = now or os.time
	local lost = false
	local ok, err = retry(function()
		return store:UpdateAsync(key, function(old)
			if old and old.Lock and old.Lock.Job ~= jobId then
				lost = true
				return nil
			end
			profile.Saved = now()
			profile.Version = PlayerData.VERSION
			profile.Lock = (not release) and { Job = jobId, Time = now() } or nil
			return profile
		end)
	end)
	if not ok then return false, "DataStore: " .. tostring(err) end
	if lost then return false, "Lock verloren" end
	return true
end

-- ── Münzen als Stapel ──
-- Schlüssel "<Münz-Id>|<Mutation>", Stapel { i = Münz-Id, m = Mutation oder nil, n = Anzahl,
-- v = Wert aller Münzen zusammen, t = Zeit des neuesten Funds }

function PlayerData.CoinKey(coinId, mutation)
	return tostring(coinId) .. "|" .. (mutation or "")
end

local function addTo(coins, coinId, mutation, value, count, time)
	local key = PlayerData.CoinKey(coinId, mutation)
	local s = coins[key]
	if not s then
		s = { i = coinId, m = mutation, n = 0, v = 0, t = 0 }
		coins[key] = s
	end
	s.n = s.n + count
	s.v = math.floor((s.v + value * count) * 100 + 0.5) / 100
	s.t = math.max(s.t, time or os.time())
	return key, s
end
-- Anzahl bis zu count abziehen; gibt (genommen, Wert) zurück
local function takeFrom(coins, key, count)
	local s = coins[key]
	if not s or s.n <= 0 then return 0, 0 end
	count = math.clamp(math.floor(count), 0, s.n)
	local value = math.floor(s.v / s.n * count * 100 + 0.5) / 100
	s.n = s.n - count
	s.v = math.max(0, s.v - value)
	if s.n == 0 then coins[key] = nil end
	return count, value
end
PlayerData._addTo = addTo
PlayerData._takeFrom = takeFrom

-- ── Laufzeit ──
local profiles = {} -- [player] = profile
local readyEvents = {}
local noSave = false
local store = nil
local root = nil
local inventoryEvent = nil

local function keyOf(player) return "Spieler_" .. player.UserId end

local function talerValue(player)
	local stats = player:FindFirstChild("leaderstats")
	local t = stats and stats:FindFirstChild("Taler")
	return t and t.Value or 0
end

local function keep(name)
	for _, k in ipairs(KEEP) do
		if k == name then return true end
	end
	for _, p in ipairs(KEEP_PREFIX) do
		if string.sub(name, 1, #p) == p then return true end
	end
	return false
end

-- Stand vom Spieler ins Profil übernehmen (vor dem Speichern)
local function collect(player, profile)
	profile.Taler = talerValue(player)
	local attributes = {}
	for name, value in pairs(player:GetAttributes()) do
		if keep(name) then attributes[name] = value end
	end
	profile.Attributes = attributes
end

local function stackList(coins)
	local list = {}
	for key, s in pairs(coins) do
		table.insert(list, { k = key, i = s.i, m = s.m, n = s.n, v = s.v, t = s.t })
	end
	return list
end

local function coinCount(profile)
	local n = 0
	for _, s in pairs(profile.Coins) do n = n + s.n end
	return n
end

-- Werte, die sich aus anderen ergeben: EP bis zum nächsten Level, Skillpunkte, Plätze, Eier-Rabatt
local SkillData
local function derived(player)
	local profile = profiles[player]
	if not profile then return end
	SkillData = SkillData or require(root:WaitForChild("SkillData"))
	-- Level-Aufstieg
	local level, xp = player:GetAttribute("Level") or 1, player:GetAttribute("XP") or 0
	local need = math.floor(40 * level ^ 1.45 + 0.5)
	while xp >= need do
		xp = xp - need
		level = level + 1
		need = math.floor(40 * level ^ 1.45 + 0.5)
	end
	if level ~= player:GetAttribute("Level") then player:SetAttribute("Level", level) end
	if xp ~= player:GetAttribute("XP") then player:SetAttribute("XP", xp) end
	player:SetAttribute("XPMax", need)
	local levels = SkillData.Parse(player:GetAttribute("Skills") or "kern:1")
	player:SetAttribute("Points", math.max(0, SkillData.FreePoints(levels, level)))
	local slots = 30 + SkillData.Effect(levels, "beutel")
	player:SetAttribute("Slots", slots)
	player:SetAttribute("EggDiscount", SkillData.Effect(levels, "feilscher"))
	player:SetAttribute("InventoryFull", coinCount(profile) >= slots)
end

local function apply(player, profile)
	local stats = player:FindFirstChild("leaderstats") or Instance.new("Folder")
	stats.Name = "leaderstats"
	local taler = stats:FindFirstChild("Taler") or Instance.new("NumberValue")
	taler.Name = "Taler"
	taler.Value = profile.Taler
	taler.Parent = stats
	stats.Parent = player
	for name, value in pairs(profile.Attributes) do
		player:SetAttribute(name, value)
	end
	derived(player)
	local busy = false
	player.AttributeChanged:Connect(function(name)
		if busy or (name ~= "Level" and name ~= "XP" and name ~= "Skills") then return end
		busy = true
		derived(player)
		busy = false
	end)
end

PlayerData._profiles = profiles -- nur für Tests

function PlayerData.IsReady(player)
	return profiles[player] ~= nil
end
-- Wartet, bis der Spielstand geladen ist (höchstens timeout Sekunden)
function PlayerData.WaitReady(player, timeout)
	local start = os.clock()
	while not profiles[player] and player.Parent and os.clock() - start < (timeout or 30) do
		task.wait(0.1)
	end
	return profiles[player] ~= nil
end

-- Münzen
function PlayerData.Coins(player)
	local profile = profiles[player]
	return profile and profile.Coins or {}
end
function PlayerData.CoinCount(player)
	local profile = profiles[player]
	return profile and coinCount(profile) or 0
end
local function sendSet(player, key)
	local profile = profiles[player]
	if not profile or not inventoryEvent then return end
	local s = profile.Coins[key]
	inventoryEvent:FireClient(player, "set", key, s and { k = key, i = s.i, m = s.m, n = s.n, v = s.v, t = s.t } or nil)
	derived(player)
end
function PlayerData.AddCoins(player, coinId, mutation, value, count)
	local profile = profiles[player]
	if not profile then return false end
	local key = addTo(profile.Coins, coinId, mutation, value, count or 1, os.time())
	player:SetAttribute("CoinsFound", (player:GetAttribute("CoinsFound") or 0) + (count or 1))
	sendSet(player, key)
	return true
end
function PlayerData.TakeCoins(player, key, count)
	local profile = profiles[player]
	if not profile then return 0, 0 end
	local n, value = takeFrom(profile.Coins, key, count)
	if n > 0 then sendSet(player, key) end
	return n, value
end
function PlayerData.SendInventory(player)
	local profile = profiles[player]
	if profile and inventoryEvent then
		inventoryEvent:FireClient(player, "full", stackList(profile.Coins))
	end
end

-- Spielstand auf Anfang (Admin Panel): Taler, Fortschritt und Münzen wie bei einem neuen Spieler.
-- Einstellungen (Set_) bleiben. Andere Skripte mit eigenem Stand hören auf PlayerData.Resetted (z. B. der Garten).
PlayerData.Resetted = Instance.new("BindableEvent")
function PlayerData.Reset(player)
	local profile = profiles[player]
	if not profile then return false end
	local fresh = PlayerData.NewProfile()
	for name in pairs(player:GetAttributes()) do
		if keep(name) and string.sub(name, 1, 4) ~= "Set_" then player:SetAttribute(name, nil) end
	end
	profile.Coins = fresh.Coins
	profile.Taler = fresh.Taler
	local stats = player:FindFirstChild("leaderstats")
	local taler = stats and stats:FindFirstChild("Taler")
	if taler then taler.Value = fresh.Taler end
	for name, value in pairs(fresh.Attributes) do
		player:SetAttribute(name, value)
	end
	collect(player, profile)
	derived(player)
	PlayerData.SendInventory(player)
	PlayerData.Resetted:Fire(player)
	return true
end

function PlayerData.Save(player, release)
	local profile = profiles[player]
	if not profile or noSave then return true end
	collect(player, profile)
	local ok, err = PlayerData.SaveProfile(store, keyOf(player), profile, game.JobId, release)
	if not ok then warn("Coinmaster: Speichern für " .. player.Name .. " fehlgeschlagen: " .. tostring(err)) end
	return ok
end

local function onJoin(player)
	local profile, err
	if noSave then
		profile = PlayerData.NewProfile()
	else
		profile, err = PlayerData.LoadProfile(store, keyOf(player), game.JobId)
	end
	if not player.Parent then
		-- schon wieder weg: Lock freigeben
		if profile and not noSave then PlayerData.SaveProfile(store, keyOf(player), profile, game.JobId, true) end
		return
	end
	if not profile then
		player:Kick("Dein Spielstand konnte nicht geladen werden (" .. tostring(err) .. "). Bitte gleich nochmal beitreten.")
		return
	end
	profiles[player] = profile
	apply(player, profile)
	PlayerData.SendInventory(player)
end

local function onLeave(player)
	if profiles[player] then
		PlayerData.Save(player, true)
		profiles[player] = nil
	end
end

function PlayerData.Start()
	root = ReplicatedStorage:WaitForChild("CoinmasterAdventure")
	inventoryEvent = root:FindFirstChild("InventoryEvent")
	if not inventoryEvent then
		inventoryEvent = Instance.new("RemoteEvent")
		inventoryEvent.Name = "InventoryEvent"
		inventoryEvent.Parent = root
	end
	-- Client fragt beim Start nach dem ganzen Inventar
	inventoryEvent.OnServerEvent:Connect(function(player, request)
		if request == "full" then PlayerData.SendInventory(player) end
	end)
	local ok, result = pcall(function()
		return DataStoreService:GetDataStore(PlayerData.STORE)
	end)
	if ok and result then
		store = result
		-- In Studio ohne API-Zugriff schlägt schon der erste Aufruf fehl
		local test = pcall(function() return store:GetAsync("Test") end)
		if not test then
			noSave = true
			warn("Coinmaster: Kein DataStore-Zugriff (in Studio: Game Settings > Security > API-Zugriff). Es wird nicht gespeichert.")
		end
	else
		noSave = true
		warn("Coinmaster: DataStore nicht erreichbar, es wird nicht gespeichert.")
	end
	Players.PlayerAdded:Connect(onJoin)
	Players.PlayerRemoving:Connect(onLeave)
	for _, player in ipairs(Players:GetPlayers()) do
		task.spawn(onJoin, player)
	end
	-- Autosave
	task.spawn(function()
		while true do
			task.wait(PlayerData.AUTOSAVE)
			for player in pairs(profiles) do
				task.spawn(PlayerData.Save, player, false)
			end
		end
	end)
	-- Beim Herunterfahren alles speichern (höchstens etwa 25 Sekunden)
	game:BindToClose(function()
		local open = 0
		for player in pairs(profiles) do
			open = open + 1
			task.spawn(function()
				PlayerData.Save(player, true)
				open = open - 1
			end)
		end
		local start = os.clock()
		while open > 0 and os.clock() - start < 25 do
			task.wait(0.1)
		end
	end)
end

return PlayerData
`;

export const PLAYER_DATA_START = `-- Coinmaster Adventure · Spielstand laden und speichern (Server)
local ServerScriptService = game:GetService("ServerScriptService")
local PlayerData = require(ServerScriptService:WaitForChild("CoinmasterServer"):WaitForChild("PlayerData"))
PlayerData.Start()
`;
