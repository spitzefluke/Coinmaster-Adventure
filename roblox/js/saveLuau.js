// Spielstand speichern für Roblox: ein ModuleScript (PlayerData) in ServerScriptService, das den ganzen
// Spielstand eines Spielers im DataStore hält, und ein Script, das es startet.
// Reiner Text wie luau.js, damit es auch in Node prüfbar ist.

export const PLAYER_DATA = `-- Coinmaster Adventure · Spielstand speichern (ModuleScript, nur Server)
-- Automatisch erzeugt von der Coinmaster-Webseite. Änderungen besser dort machen
-- und neu übertragen, sonst gehen sie beim nächsten Import verloren.
--
-- Hält den ganzen Spielstand im DataStore „CoinmasterPlayer“ (Schlüssel p_<UserId>):
--   Taler   leaderstats.Taler (legt dieses Modul an)
--   Attrs   alle Attribute am Spieler aus PlayerData.Keys und mit den Präfixen aus PlayerData.Prefixes
--           (Münzen, Welten, Portale, Wiedergeburten, Eier, Boosts, Auras, Garten …)
-- Ablauf: Beim Beitreten laden (mit Sitzungssperre), dann Attribut DataLoaded = true. Erst danach
-- nehmen Shop, Auras und Garten Aufträge an. Gespeichert wird beim Verlassen, jede Minute und beim
-- Herunterfahren des Servers.
-- Sitzungssperre: Ist der Spielstand noch auf einem anderen Server offen (z. B. schneller Serverwechsel),
-- wird bis zu 30 Sekunden gewartet. Eine Sperre ohne Speichern seit 5 Minuten gilt als verwaist.
-- Klappt das Laden nicht, wird der Spieler mit einer Nachricht getrennt, damit nichts überschrieben wird.
-- Neue Werte speichern: Namen in PlayerData.Keys eintragen (oder ein Präfix in PlayerData.Prefixes).
-- World (wo man gerade ist) wird nicht gespeichert: Nach dem Beitreten steht man im Spawn.
-- In Studio ohne DataStore-Zugang wird niemand getrennt: Man spielt dann ohne Speichern (Warnung im Output).
-- In Studio: Game Settings > Security > „Enable Studio Access to API Services“.

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")

local PlayerData = {}

PlayerData.Version = 1
PlayerData.Keys = {
	"Coins", "Slots", "Worlds", "Portals", "Rebirths", "Aura", "OwnedAuras", "Garden",
	"Level", "XP", "Points", "Skills", "EggDiscount",
}
PlayerData.Prefixes = { "Egg_", "Boost_" }
PlayerData.AutosaveSeconds = 60
PlayerData.LockSeconds = 300

local JOB = game.JobId ~= "" and game.JobId or ("studio-" .. tostring(os.time()))
local storeOk, store = pcall(function()
	return DataStoreService:GetDataStore("CoinmasterPlayer")
end)
if not storeOk then
	warn("[Spielstand] DataStore nicht erreichbar: " .. tostring(store))
	store = nil
end

local sessions = {} -- [player] = { Loaded, Dirty, Saving, LastSave, Connections }

local function persisted(name)
	if table.find(PlayerData.Keys, name) then
		return true
	end
	for _, prefix in ipairs(PlayerData.Prefixes) do
		if name:sub(1, #prefix) == prefix then
			return true
		end
	end
	return false
end
PlayerData.IsPersisted = persisted

local function key(player)
	return "p_" .. player.UserId
end

-- bis zu drei Versuche mit wachsender Pause
local function retry(fn)
	local ok, result
	for attempt = 1, 3 do
		ok, result = pcall(fn)
		if ok then
			return true, result
		end
		if attempt < 3 then
			task.wait(attempt * 2)
		end
	end
	return false, result
end

function PlayerData.Taler(player)
	local stats = player:FindFirstChild("leaderstats")
	if not stats then
		stats = Instance.new("Folder")
		stats.Name = "leaderstats"
		stats.Parent = player
	end
	local taler = stats:FindFirstChild("Taler")
	if not taler then
		taler = Instance.new("NumberValue")
		taler.Name = "Taler"
		taler.Parent = stats
	end
	return taler
end

function PlayerData.IsLoaded(player)
	local s = sessions[player]
	return s ~= nil and s.Loaded
end

-- Wartet, bis der Spielstand geladen ist (höchstens timeout Sekunden). true, wenn geladen.
function PlayerData.WaitLoaded(player, timeout)
	local start = os.clock()
	while player.Parent and not PlayerData.IsLoaded(player) do
		if os.clock() - start > (timeout or 30) then
			return false
		end
		task.wait(0.2)
	end
	return PlayerData.IsLoaded(player)
end

-- Ein früher gespeicherter Garten (DataStore „CoinmasterGarden“) wird einmal übernommen
local function migrateGarden(player, data)
	local ok, old = pcall(function()
		return DataStoreService:GetDataStore("CoinmasterGarden"):GetAsync("g_" .. player.UserId)
	end)
	if ok and type(old) == "table" and type(old.Garden) == "table" then
		local HttpService = game:GetService("HttpService")
		data.Attrs.Garden = HttpService:JSONEncode(old.Garden)
		if tonumber(old.Taler) and (data.Taler or 0) == 0 then
			data.Taler = tonumber(old.Taler)
		end
	end
end

local function load(player)
	if not store then
		return {}, "kein DataStore"
	end
	for attempt = 1, 7 do
		local locked, data = false, nil
		local ok, err = retry(function()
			store:UpdateAsync(key(player), function(old)
				old = type(old) == "table" and old or {}
				local lock = old.Lock
				if lock and lock.Job ~= JOB and os.time() - (tonumber(lock.Time) or 0) < PlayerData.LockSeconds then
					locked = true
					return nil -- nichts ändern
				end
				locked = false
				old.Lock = { Job = JOB, Time = os.time() }
				data = old
				return old
			end)
		end)
		if not ok then
			return nil, tostring(err)
		end
		if not locked then
			return data
		end
		task.wait(5)
		if not player.Parent then
			return nil, "weg"
		end
	end
	return nil, "gesperrt"
end

-- Sperre freigeben, ohne etwas zu speichern (wer schon beim Laden wieder geht)
local function releaseLock(player)
	if not store then return end
	pcall(function()
		store:UpdateAsync(key(player), function(old)
			if type(old) == "table" and old.Lock and old.Lock.Job == JOB then
				old.Lock = nil
				return old
			end
			return nil
		end)
	end)
end

local function onJoin(player)
	if sessions[player] then return end
	local session = { Loaded = false, Dirty = false, Saving = false, LastSave = os.time(), Connections = {} }
	sessions[player] = session
	local taler = PlayerData.Taler(player)
	local data, err = load(player)
	if not player.Parent then
		sessions[player] = nil
		if data then
			releaseLock(player)
		end
		return
	end
	if not data and RunService:IsStudio() and err ~= "gesperrt" then
		warn("[Spielstand] In Studio ohne Speichern weiter (" .. tostring(err) .. "). Für echtes Speichern: Game Settings > Security > Enable Studio Access to API Services")
		data = { V = PlayerData.Version }
		session.NoSave = true
	end
	if not data then
		warn("[Spielstand] Laden fehlgeschlagen für " .. player.Name .. ": " .. tostring(err))
		sessions[player] = nil
		if err == "gesperrt" then
			player:Kick("Dein Spielstand ist noch auf einem anderen Server geöffnet. Bitte gleich nochmal beitreten.")
		else
			player:Kick("Dein Spielstand konnte nicht geladen werden. Bitte später nochmal beitreten.")
		end
		return
	end
	data.Attrs = type(data.Attrs) == "table" and data.Attrs or {}
	if data.V == nil and store then
		migrateGarden(player, data)
	end
	-- Werte setzen, bevor DataLoaded kommt; nur bekannte Namen
	taler.Value = tonumber(data.Taler) or 0
	for name, value in pairs(data.Attrs) do
		if persisted(name) and (type(value) == "string" or type(value) == "number" or type(value) == "boolean") then
			player:SetAttribute(name, value)
		end
	end
	table.insert(session.Connections, player.AttributeChanged:Connect(function(name)
		if persisted(name) then
			session.Dirty = true
		end
	end))
	table.insert(session.Connections, taler.Changed:Connect(function()
		session.Dirty = true
	end))
	session.Loaded = true
	session.Dirty = data.V == nil -- neue Spieler gleich einmal speichern
	player:SetAttribute("DataLoaded", true)
end

-- Speichert den Spielstand. release = Sperre freigeben (beim Verlassen). Gibt true zurück, wenn gespeichert.
function PlayerData.Save(player, release)
	local session = sessions[player]
	if not session or not session.Loaded or not store or session.NoSave then
		return false
	end
	while session.Saving do
		task.wait(0.1)
	end
	session.Saving = true
	local attrs = {}
	for name, value in pairs(player:GetAttributes()) do
		if persisted(name) then
			attrs[name] = value
		end
	end
	local payload = {
		V = PlayerData.Version,
		Taler = PlayerData.Taler(player).Value,
		Attrs = attrs,
		Saved = os.time(),
		Lock = not release and { Job = JOB, Time = os.time() } or nil,
	}
	local wasDirty = session.Dirty
	session.Dirty = false
	local stolen = false
	local ok, err = retry(function()
		store:UpdateAsync(key(player), function(old)
			-- hat ein anderer Server die Sperre übernommen, nichts überschreiben
			if type(old) == "table" and old.Lock and old.Lock.Job ~= JOB then
				stolen = true
				return nil
			end
			stolen = false
			return payload
		end)
	end)
	session.Saving = false
	if stolen then
		-- der Spielstand ist auf einem anderen Server offen: hier nicht mehr speichern und trennen
		warn("[Spielstand] " .. player.Name .. " ist auf einem anderen Server, hier wird nicht mehr gespeichert")
		session.NoSave = true
		if player.Parent then
			player:Kick("Du bist auf einem anderen Server eingeloggt.")
		end
		return false
	end
	if not ok then
		session.Dirty = session.Dirty or wasDirty
		warn("[Spielstand] Speichern fehlgeschlagen für " .. player.Name .. ": " .. tostring(err))
		return false
	end
	session.LastSave = os.time()
	return true
end

local function onLeave(player)
	local session = sessions[player]
	if not session or session.Leaving then return end
	session.Leaving = true
	if session.Loaded then
		PlayerData.Save(player, true)
	end
	for _, c in ipairs(session.Connections) do
		c:Disconnect()
	end
	sessions[player] = nil
end

local started = false
function PlayerData.Start()
	if started then return PlayerData end
	started = true
	Players.PlayerAdded:Connect(onJoin)
	Players.PlayerRemoving:Connect(onLeave)
	for _, p in ipairs(Players:GetPlayers()) do
		task.spawn(onJoin, p)
	end
	-- jede Minute: geänderte Spielstände speichern und die Sperre auffrischen
	task.spawn(function()
		while true do
			task.wait(PlayerData.AutosaveSeconds)
			for player, session in pairs(sessions) do
				if session.Loaded and not session.NoSave and (session.Dirty or os.time() - session.LastSave >= PlayerData.LockSeconds / 2) then
					task.spawn(PlayerData.Save, player)
				end
			end
		end
	end)
	game:BindToClose(function()
		for _, p in ipairs(Players:GetPlayers()) do
			task.spawn(onLeave, p)
		end
		-- warten, bis alle gespeichert sind (Roblox gibt höchstens 30 Sekunden)
		local start = os.clock()
		while next(sessions) ~= nil and os.clock() - start < 25 do
			task.wait(0.2)
		end
	end)
	return PlayerData
end

return PlayerData
`;

export const SAVE_SERVER = `-- Coinmaster Adventure · Spielstand (Server)
-- Startet das Speichern (ModuleScript CoinmasterPlayerData daneben). Siehe dort.
local PlayerData = require(script.Parent:WaitForChild("CoinmasterPlayerData"))
PlayerData.Start()
`;
