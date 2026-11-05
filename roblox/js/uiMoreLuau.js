// Spiel-Oberfläche für Roblox (Etappe 3): Daten für Skilltree und Belohnungen, die Fenster Skilltree,
// Einstellungen, Wetter, Belohnungen, Codes und Ranglisten (Teil von GameUI) und das Server-Skript dazu.
// Reiner Text wie luau.js, damit es auch in Node prüfbar ist.

const str = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
const num = (n) => (Number.isFinite(n) ? String(Math.round(n * 1000) / 1000) : 'math.huge');
const color = (hex) => `Color3.fromHex(${str(hex)})`;
const HEADER = (title) => `-- Coinmaster Adventure · ${title}
-- Automatisch erzeugt von der Coinmaster-Webseite. Änderungen besser dort machen
-- und neu übertragen, sonst gehen sie beim nächsten Import verloren.
`;


export function skillDataSource({ BRANCHES, SKILLS, pointsForLevel }) {
  const branches = BRANCHES.map((b) => `{ Id = ${str(b.id)}, Name = ${str(b.name)}, Color = ${color(b.color)}, Text = ${str(b.text)} }`);
  const skills = SKILLS.map((k) => {
    const effects = Array.from({ length: k.max }, (_, i) => str(k.format((i + 1) * k.per)));
    return `{ Id = ${str(k.id)}, Branch = ${k.branch ? str(k.branch) : 'nil'}, Name = ${str(k.name)}, Max = ${num(k.max)}, Cost = ${num(k.cost)}, X = ${num(k.x)}, Y = ${num(k.y)}, Req = ${k.req ? str(k.req) : 'nil'}, Per = ${num(k.per)}, Icon = ${str(k.icon || 'star')}, Text = ${str(k.text)}, Effects = { ${effects.join(', ')} } }`;
  });
  // Punkte je Level als Tabelle bis Level 200 prüfen: die Regel steht hier als Funktion
  const every5 = pointsForLevel(5), normal = pointsForLevel(2);
  return `${HEADER('Skilltree')}
-- Jeder Skill hat Stufen; eine Stufe kostet Cost Skillpunkte. Lernbar erst, wenn der Vorgänger (Req)
-- mindestens Stufe 1 hat. Per = Wirkung pro Stufe, Effects[n] = Text für Stufe n, Icon = Name in UITheme.Icons.
-- X, Y: Platz im Baum (Kern bei 0, 0). Am Spieler stehen die Stufen im Attribut Skills ("kern:1,beutel:2").

local SkillData = {}

SkillData.Branches = {
	${branches.join(',\n\t')},
}

SkillData.Skills = {
	${skills.join(',\n\t')},
}

SkillData.ById = {}
for _, k in ipairs(SkillData.Skills) do
	SkillData.ById[k.Id] = k
end
SkillData.BranchById = {}
for _, b in ipairs(SkillData.Branches) do
	SkillData.BranchById[b.Id] = b
end

-- Skillpunkte: jedes Level einer, jedes fünfte mehr; dazu ein Startpunkt
function SkillData.PointsForLevel(n)
	return n % 5 == 0 and ${num(every5)} or ${num(normal)}
end
function SkillData.PointsUpTo(level)
	local p = 0
	for n = 2, level do
		p = p + SkillData.PointsForLevel(n)
	end
	return p
end

function SkillData.Parse(text)
	local levels = {}
	for id, n in string.gmatch(text or "", "([%w_]+):(%d+)") do
		levels[id] = tonumber(n)
	end
	return levels
end
function SkillData.Format(levels)
	local out = {}
	for _, k in ipairs(SkillData.Skills) do
		if (levels[k.Id] or 0) > 0 then table.insert(out, k.Id .. ":" .. levels[k.Id]) end
	end
	return table.concat(out, ",")
end

function SkillData.Spent(levels)
	local sum = 0
	for _, k in ipairs(SkillData.Skills) do
		sum = sum + (levels[k.Id] or 0) * k.Cost
	end
	return sum
end
function SkillData.FreePoints(levels, level)
	return SkillData.PointsUpTo(level) + 1 - SkillData.Spent(levels)
end
-- Wirkung eines Skills (Stufe × Per)
function SkillData.Effect(levels, id)
	return (levels[id] or 0) * SkillData.ById[id].Per
end

-- Grund, warum die nächste Stufe nicht geht, sonst nil
function SkillData.CanLearn(levels, level, id)
	local k = SkillData.ById[id]
	if not k then return "Diesen Skill gibt es nicht" end
	if (levels[id] or 0) >= k.Max then return "Höchste Stufe erreicht" end
	if k.Req and (levels[k.Req] or 0) < 1 then return "Erst „" .. SkillData.ById[k.Req].Name .. "“ lernen" end
	if SkillData.FreePoints(levels, level) < k.Cost then
		return "Braucht " .. k.Cost .. " Skillpunkt" .. (k.Cost > 1 and "e" or "")
	end
	return nil
end

-- Sichtbar: Kern, gelernt oder Vorgänger gelernt
function SkillData.IsVisible(levels, id)
	local k = SkillData.ById[id]
	return not k.Req or (levels[id] or 0) > 0 or (levels[k.Req] or 0) > 0
end

return SkillData
`;
}

const prize = (p) =>
  '{ ' +
  [p.taler && `Taler = ${num(p.taler)}`, p.boost && `Boost = ${str(p.boost)}, Minutes = ${num(p.minutes)}`, p.egg && `Egg = ${str(p.egg)}`, p.xp && `XP = ${num(p.xp)}`, p.w && `Weight = ${num(p.w)}`, p.color && `Color = ${color(p.color)}`]
    .filter(Boolean)
    .join(', ') +
  ' }';

export function rewardDataSource({ DAILY, WHEEL, GROUP_BONUS, BOARDS }) {
  return `${HEADER('Belohnungen und Ranglisten')}
-- Tägliches Geschenk (sieben Tage, wer einen Tag auslässt, fängt bei Tag 1 an), Glücksrad (einmal am Tag),
-- Gruppen-Bonus (einmalig) und die Ranglisten. Ein Gewinn ist { Taler } | { Boost, Minutes } | { Egg } | { XP }.
-- Am Spieler: DailyDay, DailyStreak, WheelDay (Tag als "Jahr-Monat-Tag"), Group, Codes (eingelöste Codes).
-- Die Codes selbst stehen nur im Server-Skript CoinmasterPlayer.

local root = script.Parent
local ShopData = require(root:WaitForChild("ShopData"))
local EggData = require(root:WaitForChild("EggData"))

local RewardData = {}

RewardData.Daily = {
	${DAILY.map(prize).join(',\n\t')},
}

RewardData.Wheel = {
	${WHEEL.map(prize).join(',\n\t')},
}

RewardData.GroupBonus = ${prize(GROUP_BONUS)}

RewardData.Boards = {
	${BOARDS.map((b) => `{ Id = ${str(b.id)}, Label = ${str(b.label)}, Color = ${color(b.color)} }`).join(',\n\t')},
}

-- Zahl mit Tausenderpunkten
local function dots(n)
	local s = tostring(math.floor(n + 0.5))
	local out = s:reverse():gsub("(%d%d%d)", "%1."):reverse()
	return (out:gsub("^%.", ""))
end

function RewardData.PrizeText(p)
	if p.Taler then return dots(p.Taler) .. " Taler" end
	if p.Boost then
		local b = ShopData.BoostById[p.Boost]
		return (b and b.Name or p.Boost) .. " (" .. p.Minutes .. " Min.)"
	end
	if p.Egg then
		local e = EggData.ById[p.Egg]
		return e and e.Name or p.Egg
	end
	if p.XP then return p.XP .. " EP" end
	return "–"
end
-- Icon-Name (UITheme.Icons) zu einem Gewinn
function RewardData.PrizeIcon(p)
	if p.Taler then return "coins" end
	if p.Boost then return p.Boost == "xp" and "star" or "clover" end
	if p.Egg then return "egg" end
	return "sparkle"
end

-- Kalendertag (Ortszeit) als Text, z. B. "2026-11-4"
function RewardData.DayKey(t)
	local d = os.date("*t", t or os.time())
	return string.format("%d-%d-%d", d.year, d.month, d.day)
end
function RewardData.SecondsToMidnight(t)
	local d = os.date("*t", t or os.time())
	return 86400 - (d.hour * 3600 + d.min * 60 + d.sec)
end

-- Stand der Serie: { ClaimedToday, Streak, Next } (Next = Index des nächsten Geschenks, ab 1)
function RewardData.DailyStatus(lastDay, streak)
	local today = RewardData.DayKey()
	local claimed = lastDay == today
	local keeps = claimed or lastDay == RewardData.DayKey(os.time() - 86400)
	local s = keeps and (streak or 0) or 0
	return { ClaimedToday = claimed, Streak = s, Next = s % #RewardData.Daily + 1 }
end

-- Glücksrad: Index des Gewinns nach Gewicht
function RewardData.RollWheel(random)
	local total = 0
	for _, p in ipairs(RewardData.Wheel) do
		total = total + p.Weight
	end
	local r = (random or Random.new()):NextNumber() * total
	for i, p in ipairs(RewardData.Wheel) do
		r = r - p.Weight
		if r <= 0 then return i end
	end
	return #RewardData.Wheel
end

return RewardData
`;
}

export function playerServerSource({ CODES }) {
  const codes = Object.entries(CODES).map(([k, p]) => `${k} = ${prize(p)}`);
  return `-- Coinmaster Adventure · Skills, Belohnungen, Codes, Einstellungen, Ranglisten (Server)
-- Alles über die RemoteFunction PlayerRemote; der Server prüft jede Aktion. Gespeichert wird über PlayerData.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local root = ReplicatedStorage:WaitForChild("CoinmasterAdventure")
local SkillData = require(root:WaitForChild("SkillData"))
local RewardData = require(root:WaitForChild("RewardData"))
local PlayerData = require(game:GetService("ServerScriptService"):WaitForChild("CoinmasterServer"):WaitForChild("PlayerData"))

-- Codes nur hier auf dem Server, damit sie niemand aus dem Spiel auslesen kann
local CODES = {
	${codes.join(',\n\t')},
}

-- Einstellungen und erlaubte Werte
local SETTINGS = {
	sfx = "number", music = "number", quality = { niedrig = true, mittel = true, hoch = true },
	fewerParticles = "boolean", skipAnimations = "boolean", shortNumbers = "boolean",
}
local DEFAULTS = { sfx = 80, music = 60, quality = "mittel", fewerParticles = false, skipAnimations = false, shortNumbers = true }

local remote = root:FindFirstChild("PlayerRemote")
if not remote then
	remote = Instance.new("RemoteFunction")
	remote.Name = "PlayerRemote"
	remote.Parent = root
end

local function talerOf(player)
	local stats = player:FindFirstChild("leaderstats")
	return stats and stats:FindFirstChild("Taler")
end

-- Gewinn gutschreiben
local function grant(player, p)
	if p.Taler then
		local t = talerOf(player)
		if t then t.Value = t.Value + p.Taler end
	end
	if p.Boost then
		local key = "Boost_" .. p.Boost
		player:SetAttribute(key, math.max(os.time(), player:GetAttribute(key) or 0) + p.Minutes * 60)
	end
	if p.Egg then
		local key = "Egg_" .. p.Egg
		player:SetAttribute(key, (player:GetAttribute(key) or 0) + 1)
	end
	if p.XP then
		player:SetAttribute("XP", (player:GetAttribute("XP") or 0) + p.XP)
	end
end

-- Rangliste: alle Spieler auf dem Server (für alle Server bräuchte es einen OrderedDataStore)
local BOARD_VALUE = {
	taler = function(p) local t = talerOf(p) return t and t.Value or 0 end,
	coins = function(p) return p:GetAttribute("CoinsFound") or 0 end,
	rebirths = function(p) return p:GetAttribute("Rebirths") or 0 end,
	level = function(p) return p:GetAttribute("Level") or 1 end,
}
local function board(player, id)
	local value = BOARD_VALUE[id] or BOARD_VALUE.taler
	local rows = {}
	for _, p in ipairs(Players:GetPlayers()) do
		table.insert(rows, { Name = p.DisplayName, Value = value(p), Me = p == player })
	end
	table.sort(rows, function(a, b) return a.Value > b.Value end)
	local place, mine = 1, 0
	for i, r in ipairs(rows) do
		if r.Me then place, mine = i, r.Value end
	end
	local top = {}
	for i = 1, math.min(10, #rows) do top[i] = rows[i] end
	return { Rows = top, Place = place, Mine = mine }
end

local lastCall = {}
remote.OnServerInvoke = function(player, action, a, b)
	if not PlayerData.IsReady(player) then return false, "Spielstand lädt noch" end
	local now = os.clock()
	if lastCall[player] and now - lastCall[player] < 0.2 then
		return false, "Zu schnell"
	end
	lastCall[player] = now
	if type(action) ~= "string" then return false, "Ungültig" end
	if action == "board" then
		return board(player, tostring(a))
	elseif action == "learn" then
		local levels = SkillData.Parse(player:GetAttribute("Skills") or "kern:1")
		local why = SkillData.CanLearn(levels, player:GetAttribute("Level") or 1, tostring(a))
		if why then return false, why end
		levels[a] = (levels[a] or 0) + 1
		player:SetAttribute("Skills", SkillData.Format(levels))
		return true, SkillData.ById[a].Name .. " auf Stufe " .. levels[a]
	elseif action == "resetSkills" then
		player:SetAttribute("Skills", "kern:1")
		return true, "Alle Skillpunkte zurückerstattet"
	elseif action == "daily" then
		local st = RewardData.DailyStatus(player:GetAttribute("DailyDay"), player:GetAttribute("DailyStreak"))
		if st.ClaimedToday then return false, "Heute schon abgeholt" end
		local p = RewardData.Daily[st.Next]
		grant(player, p)
		player:SetAttribute("DailyDay", RewardData.DayKey())
		player:SetAttribute("DailyStreak", st.Streak + 1)
		return true, "Tag " .. st.Next .. ": " .. RewardData.PrizeText(p) .. "!"
	elseif action == "spin" then
		if player:GetAttribute("WheelDay") == RewardData.DayKey() then return false, "Heute schon gedreht" end
		local i = RewardData.RollWheel()
		grant(player, RewardData.Wheel[i])
		player:SetAttribute("WheelDay", RewardData.DayKey())
		return true, "Glücksrad: " .. RewardData.PrizeText(RewardData.Wheel[i]) .. "!", i
	elseif action == "group" then
		if player:GetAttribute("Group") then return false, "Schon beigetreten" end
		-- Gruppen-Id hier eintragen, dann prüft das Spiel die Mitgliedschaft
		local GROUP_ID = 0
		if GROUP_ID > 0 and not player:IsInGroup(GROUP_ID) then
			return false, "Tritt zuerst der Gruppe auf Roblox bei"
		end
		player:SetAttribute("Group", true)
		grant(player, RewardData.GroupBonus)
		return true, "Willkommen in der Gruppe! +" .. RewardData.PrizeText(RewardData.GroupBonus)
	elseif action == "code" then
		local code = string.upper(tostring(a or "")):gsub("^%s+", ""):gsub("%s+$", ""):gsub("Ü", "UE"):gsub("ü", "UE")
		if code == "" then return false, "Bitte einen Code eingeben" end
		local p = CODES[code]
		if not p then return false, "Diesen Code gibt es nicht" end
		local used = {}
		for c in string.gmatch(player:GetAttribute("Codes") or "", "[^,]+") do used[c] = true end
		if used[code] then return false, "Diesen Code hast du schon eingelöst" end
		local text = player:GetAttribute("Codes") or ""
		player:SetAttribute("Codes", text == "" and code or (text .. "," .. code))
		grant(player, p)
		return true, "Code " .. code .. ": " .. RewardData.PrizeText(p) .. "!"
	elseif action == "setting" then
		local kind = SETTINGS[a]
		if not kind then return false, "Ungültig" end
		if kind == "number" then
			b = math.clamp(math.floor((tonumber(b) or 0) / 5 + 0.5) * 5, 0, 100)
		elseif kind == "boolean" then
			b = b == true
		elseif not kind[b] then
			return false, "Ungültig"
		end
		player:SetAttribute("Set_" .. a, b)
		return true
	elseif action == "resetSettings" then
		for k, v in pairs(DEFAULTS) do
			player:SetAttribute("Set_" .. k, v)
		end
		return true, "Einstellungen zurückgesetzt"
	end
	return false, "Ungültig"
end

-- fehlende Einstellungen nach dem Laden mit Standardwerten füllen
local function fill(player)
	if not PlayerData.WaitReady(player, 60) then return end
	for k, v in pairs(DEFAULTS) do
		if player:GetAttribute("Set_" .. k) == nil then player:SetAttribute("Set_" .. k, v) end
	end
end
Players.PlayerAdded:Connect(fill)
for _, player in ipairs(Players:GetPlayers()) do
	task.spawn(fill, player)
end
Players.PlayerRemoving:Connect(function(player)
	lastCall[player] = nil
end)
`;
}

// Teil von GameUI: die Fenster aus Etappe 3. Nutzt die Bausteine aus GAME_UI (new, label, buildWindow …).
export const GAME_UI_MORE = `
-- ══ Skilltree, Einstellungen, Wetter, Belohnungen, Codes, Ranglisten ══
local buildMore
do
	local SkillData = require(root:WaitForChild("SkillData"))
	local RewardData = require(root:WaitForChild("RewardData"))

	local function levels() return SkillData.Parse(attr("Skills", "kern:1")) end
	local function query(kind, arg)
		local ok, data = pcall(options.Query, kind, arg)
		if ok and type(data) == "table" then return data end
		return nil
	end
	local function clock(seconds)
		seconds = math.max(0, math.floor(seconds))
		return string.format("%02d:%02d:%02d", math.floor(seconds / 3600), math.floor(seconds % 3600 / 60), seconds % 60)
	end
	-- Bestätigung per zweitem Klick (3 Sekunden)
	local function armed(key)
		return ui[key] ~= nil and os.clock() - ui[key] < 3
	end
	local function arm(key, window)
		ui[key] = os.clock()
		GameUI.Refresh(window)
		task.delay(3.05, function() GameUI.Refresh(window) end)
	end

	-- ── Skilltree ──
	ui.skillSel = "kern"
	ui.skillZoom = 1
	local ZOOMS = { 1, 1.5, 2, 2.6 }

	local function fillSkills(w)
		clear(w.body)
		clear(w.tools)
		local lv, level = levels(), attr("Level", 1)
		w.sub.Text = SkillData.FreePoints(lv, level) .. " Skillpunkte frei · Level " .. level
		toolButton(w.tools, armed("skillReset") and "Wirklich? Nochmal" or "Zurücksetzen", 1, SkillData.Spent(lv) > 0, function()
			if not armed("skillReset") then return arm("skillReset", "skills") end
			ui.skillReset = nil
			result(options.Invoke("resetSkills"))
		end)
		if not SkillData.IsVisible(lv, ui.skillSel) then ui.skillSel = "kern" end

		-- Baum: Flächen und Linien in Anteilen einer Fläche mit festem Seitenverhältnis
		local area = new("Frame", { Name = "Baum", Size = UDim2.new(1, -290, 1, 0), BackgroundColor3 = C.deep, ClipsDescendants = true, Parent = w.body }, {
			corner(R.L),
			stroke(C.line, 2),
		})
		local vis, hidden = {}, 0
		local minX, maxX, minY, maxY = 0, 0, 0, 0
		for _, k in ipairs(SkillData.Skills) do
			if SkillData.IsVisible(lv, k.Id) then
				table.insert(vis, k)
				minX, maxX = math.min(minX, k.X), math.max(maxX, k.X)
				minY, maxY = math.min(minY, k.Y), math.max(maxY, k.Y)
			else
				hidden = hidden + 1
			end
		end
		minX, maxX, minY, maxY = minX - 2.2, maxX + 2.2, minY - 0.9, maxY + 0.9
		local spanX, spanY = maxX - minX, maxY - minY
		local aspect = spanX / spanY
		local function fx(x) return (x - minX) / spanX end
		local function fy(y) return (y - minY) / spanY end
		local sel = SkillData.ById[ui.skillSel]
		local z = ui.skillZoom
		local tree = new("Frame", { Name = "Flaeche", Size = UDim2.new(z, 0, z, 0), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = z > 1 and Vector2.new(fx(sel.X), fy(sel.Y)) or Vector2.new(0.5, 0.5), BackgroundTransparency = 1, Parent = area }, {
			new("UIAspectRatioConstraint", { AspectRatio = aspect }),
		})
		local ns = 0.62 / spanX -- Knotengröße als Anteil der Breite
		-- Linien
		for _, k in ipairs(vis) do
			if k.Req then
				local r = SkillData.ById[k.Req]
				local x1, y1, x2, y2 = fx(r.X), fy(r.Y), fx(k.X), fy(k.Y)
				local dx, dy = x2 - x1, (y2 - y1) / aspect
				local branch = k.Branch and SkillData.BranchById[k.Branch]
				local on, open = (lv[k.Id] or 0) > 0, (lv[k.Req] or 0) > 0
				new("Frame", { Name = "Linie", Size = UDim2.new(math.sqrt(dx * dx + dy * dy), 0, 0, on and 6 or 4), Position = UDim2.new((x1 + x2) / 2, 0, (y1 + y2) / 2, 0), AnchorPoint = Vector2.new(0.5, 0.5), Rotation = math.deg(math.atan2(dy, dx)), BackgroundColor3 = (on or open) and branch.Color or C.line, BackgroundTransparency = on and 0 or (open and 0.5 or 0.2), BorderSizePixel = 0, Parent = tree })
			end
		end
		-- Ast-Namen außen hinter der sichtbaren Spitze
		for _, b in ipairs(SkillData.Branches) do
			local first
			for _, k in ipairs(SkillData.Skills) do
				if k.Branch == b.Id and k.Req == "kern" then first = k end
			end
			local dx, dy = first.X > 0 and 1 or (first.X < 0 and -1 or 0), first.Y > 0 and 1 or (first.Y < 0 and -1 or 0)
			local far, sum, n = -math.huge, 0, 0
			for _, k in ipairs(vis) do
				if k.Branch == b.Id then far = math.max(far, k.X * dx + k.Y * dy) end
			end
			for _, k in ipairs(vis) do
				if k.Branch == b.Id and k.X * dx + k.Y * dy > far - 0.01 then
					sum, n = sum + (dx ~= 0 and k.Y or k.X), n + 1
				end
			end
			if n > 0 then
				local across = sum / n
				local x, y, ax, ay, align
				if dx ~= 0 then
					x, y, ax, ay = far * dx + 0.5 * dx, across, dx > 0 and 0 or 1, 0.5
					align = dx > 0 and Enum.TextXAlignment.Left or Enum.TextXAlignment.Right
				else
					x, y, ax, ay = across, far * dy + 0.62 * dy, 0.5, dy > 0 and 0 or 1
					align = Enum.TextXAlignment.Center
				end
				label({ Name = "Ast", Size = UDim2.new(0, 150, 0, 20), Position = UDim2.new(fx(x), 0, fy(y), 0), AnchorPoint = Vector2.new(ax, ay), Text = b.Name, Font = FONT, TextSize = T.Body, TextColor3 = b.Color, TextXAlignment = align, ZIndex = 2, Parent = tree })
			end
		end
		-- Knoten
		for _, k in ipairs(vis) do
			local n = lv[k.Id] or 0
			local branch = k.Branch and SkillData.BranchById[k.Branch]
			local col = branch and branch.Color or C.gold
			local locked = k.Req ~= nil and (lv[k.Req] or 0) < 1
			local learnable = k.Cost > 0 and SkillData.CanLearn(lv, level, k.Id) == nil
			local selected = k.Id == ui.skillSel
			local node = new("TextButton", { Name = k.Id, Size = UDim2.new(ns, 0, ns * aspect, 0), Position = UDim2.new(fx(k.X), 0, fy(k.Y), 0), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundColor3 = n >= k.Max and col or (n > 0 and col:Lerp(C.bg2, 0.55) or C.bg2), Text = "", AutoButtonColor = false, ZIndex = 3, Parent = tree }, {
				corner(R.Round),
				stroke(selected and C.goldHi or (learnable and C.green or col), selected and 4 or 3),
			})
			if locked and n == 0 then node.BackgroundTransparency = 0.3 end
			icon((locked and n == 0) and "lock" or k.Icon, { Size = UDim2.new(0.62, 0, 0.62, 0), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5), ZIndex = 3, Parent = node })
			label({ Size = UDim2.new(2, 0, 0, 16), Position = UDim2.new(0.5, 0, 1, 4), AnchorPoint = Vector2.new(0.5, 0), Text = n .. "/" .. k.Max, TextSize = T.Tiny, Font = MONO, TextColor3 = n > 0 and C.ink or C.muted, ZIndex = 3, Parent = node })
			pressable(node, function()
				ui.skillSel = k.Id
				GameUI.Refresh("skills")
			end)
		end
		if hidden > 0 then
			label({ Size = UDim2.new(0, 240, 0, 18), Position = UDim2.new(0, 14, 1, -28), Text = hidden .. " Skill" .. (hidden > 1 and "s" or "") .. " noch verborgen", TextSize = T.Tiny, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 4, Parent = area })
		end
		-- Zoom: vergrößert um den gewählten Skill
		local zoom = new("Frame", { Name = "Zoom", Size = UDim2.new(0, 38, 0, 128), Position = UDim2.new(1, -12, 0, 12), AnchorPoint = Vector2.new(1, 0), BackgroundTransparency = 1, ZIndex = 4, Parent = area }, {
			new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }),
		})
		local zi = 1
		for i, v in ipairs(ZOOMS) do
			if v == z then zi = i end
		end
		for i, b in ipairs({ { "+", math.min(#ZOOMS, zi + 1) }, { "−", math.max(1, zi - 1) }, { "⤢", 1 } }) do
			local btn = smallButton(zoom, b[1], i, 38, function()
				ui.skillZoom = ZOOMS[b[2]]
				GameUI.Refresh("skills")
			end)
			btn.Size = UDim2.new(0, 38, 0, 38)
			btn.TextSize = T.Large
			btn.ZIndex = 4
		end

		-- Details zum gewählten Skill
		local k, n = sel, lv[sel.Id] or 0
		local branch = k.Branch and SkillData.BranchById[k.Branch]
		local col = branch and branch.Color or C.gold
		local side = new("Frame", { Name = "Details", Size = UDim2.new(0, 276, 1, 0), Position = UDim2.new(1, -276, 0, 0), BackgroundColor3 = C.bg2, Parent = w.body }, {
			corner(R.L),
			stroke(C.line, 2),
			new("UIPadding", { PaddingLeft = UDim.new(0, 16), PaddingRight = UDim.new(0, 16), PaddingTop = UDim.new(0, 16), PaddingBottom = UDim.new(0, 16) }),
		})
		label({ Size = UDim2.new(1, 0, 0, 14), Text = GameUI.Upper(branch and branch.Name or "Kern"), TextSize = T.Tiny, Font = MONO, TextColor3 = col, TextXAlignment = Enum.TextXAlignment.Left, Parent = side })
		icon(k.Icon, { Size = UDim2.new(0, 28, 0, 28), Position = UDim2.new(0, 0, 0, 17), Parent = side })
		label({ Size = UDim2.new(1, -36, 0, 30), Position = UDim2.new(0, 36, 0, 16), Text = k.Name, Font = FONT, TextSize = T.Big, TextXAlignment = Enum.TextXAlignment.Left, Parent = side })
		label({ Size = UDim2.new(1, 0, 0, 36), Position = UDim2.new(0, 0, 0, 48), Text = k.Text, TextSize = T.Small, TextWrapped = true, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, Font = TEXT, Parent = side })
		local pips = new("Frame", { Name = "Stufen", Size = UDim2.new(1, 0, 0, 10), Position = UDim2.new(0, 0, 0, 92), BackgroundTransparency = 1, Parent = side }, {
			new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }),
		})
		for i = 1, k.Max do
			new("Frame", { Size = UDim2.new(0, 30, 1, 0), BackgroundColor3 = i <= n and col or C.line, LayoutOrder = i, Parent = pips }, { corner(R.Round) })
		end
		local facts = { { "Jetzt", n > 0 and k.Effects[n] or "Noch nicht gelernt" } }
		if n < k.Max then table.insert(facts, { "Nächste Stufe", k.Effects[n + 1] }) end
		if k.Cost > 0 then table.insert(facts, { "Kosten", k.Cost .. " Skillpunkt" .. (k.Cost > 1 and "e" or "") .. " pro Stufe" }) end
		if k.Req then table.insert(facts, { "Braucht", SkillData.ById[k.Req].Name }) end
		for i, f in ipairs(facts) do
			local y = 112 + (i - 1) * 42
			label({ Size = UDim2.new(1, 0, 0, 14), Position = UDim2.new(0, 0, 0, y), Text = f[1], TextSize = T.Tiny, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Parent = side })
			label({ Size = UDim2.new(1, 0, 0, 20), Position = UDim2.new(0, 0, 0, y + 15), Text = f[2], TextSize = T.Small, TextXAlignment = Enum.TextXAlignment.Left, TextScaled = #f[2] > 30, Parent = side })
		end
		if k.Cost > 0 then
			local why = SkillData.CanLearn(lv, level, k.Id)
			local b = actionButton(side, why or ("Lernen · " .. k.Cost .. " Punkt" .. (k.Cost > 1 and "e" or "")), C.green, why == nil, function()
				result(options.Invoke("learn", k.Id), nil, col)
			end)
			b.TextScaled = why ~= nil
		end
	end

	-- ── Einstellungen ──
	local function setting(key, value)
		local ok, text = options.Invoke("setting", key, value)
		if not ok then result(false, text) end
		GameUI.Refresh("einstellungen")
	end
	local function settingRow(parent, order, iconName, title, hint)
		local row = new("Frame", { Size = UDim2.new(1, 0, 0, 64), BackgroundColor3 = C.bg2, LayoutOrder = order, Parent = parent }, { corner(R.M) })
		icon(iconName, { Size = UDim2.new(0, 32, 0, 32), Position = UDim2.new(0, 16, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), Parent = row })
		label({ Size = UDim2.new(1, -330, 0, 22), Position = UDim2.new(0, 62, 0, 10), Text = title, Font = FONT, TextSize = T.Medium, TextXAlignment = Enum.TextXAlignment.Left, Parent = row })
		label({ Size = UDim2.new(1, -330, 0, 18), Position = UDim2.new(0, 62, 0, 34), Text = hint, TextSize = T.Tiny, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Font = TEXT, Parent = row })
		return new("Frame", { Name = "Regler", Size = UDim2.new(0, 250, 1, 0), Position = UDim2.new(1, -14, 0, 0), AnchorPoint = Vector2.new(1, 0), BackgroundTransparency = 1, Parent = row })
	end
	local function heading(parent, order, text)
		label({ Size = UDim2.new(1, 0, 0, 28), Text = text, Font = FONT, TextSize = T.Medium, TextColor3 = C.gold, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Bottom, LayoutOrder = order, Parent = parent })
	end
	local function toggle(control, key)
		local on = attr("Set_" .. key, false) == true
		local b = new("TextButton", { Name = "Schalter", Size = UDim2.new(0, 60, 0, 32), Position = UDim2.new(1, 0, 0.5, 0), AnchorPoint = Vector2.new(1, 0.5), BackgroundColor3 = on and C.green or C.line, Text = "", AutoButtonColor = false, Parent = control }, { corner(R.Round) })
		new("Frame", { Size = UDim2.new(0, 26, 0, 26), Position = UDim2.new(0, on and 31 or 3, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), BackgroundColor3 = Color3.new(1, 1, 1), Parent = b }, { corner(R.Round) })
		pressable(b, function() setting(key, not on) end)
	end
	local function stepper(control, key, default)
		local v = attr("Set_" .. key, default)
		local minus = smallButton(control, "−", 1, 36, function() setting(key, math.max(0, v - 10)) end)
		minus.Position = UDim2.new(0, 0, 0.5, -17)
		local bar = new("Frame", { Size = UDim2.new(0, 112, 0, 10), Position = UDim2.new(0, 46, 0.5, -5), BackgroundColor3 = C.bg, Parent = control }, { corner(R.Round) })
		new("Frame", { Size = UDim2.new(math.max(0.03, v / 100), 0, 1, 0), BackgroundColor3 = C.gold, Parent = bar }, { corner(R.Round) })
		local plus = smallButton(control, "+", 2, 36, function() setting(key, math.min(100, v + 10)) end)
		plus.Position = UDim2.new(0, 168, 0.5, -17)
		label({ Size = UDim2.new(0, 46, 1, 0), Position = UDim2.new(1, 0, 0, 0), AnchorPoint = Vector2.new(1, 0), Text = v .. " %", TextSize = T.Small, Font = MONO, TextXAlignment = Enum.TextXAlignment.Right, Parent = control })
	end
	local function segmented(control, key, values)
		local current = attr("Set_" .. key, values[2])
		for i, v in ipairs(values) do
			local on = v == current
			local b = smallButton(control, v:sub(1, 1):upper() .. v:sub(2), i, 78, function() setting(key, v) end, on)
			b.Position = UDim2.new(0, 250 - (#values - i + 1) * 82, 0.5, -17)
		end
	end

	local function fillSettings(w)
		clear(w.body)
		w.sub.Text = "Deine Einstellungen in diesem Spiel"
		local list = scroller(w, w.body, "Liste", { Size = UDim2.new(1, 8, 1, 0) }, {
			new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
			new("UIPadding", { PaddingRight = UDim.new(0, 14), PaddingBottom = UDim.new(0, 10) }),
		})
		heading(list, 1, "Ton")
		stepper(settingRow(list, 2, "sound", "Effekte", "Klänge beim Finden, Kaufen und Lernen"), "sfx", 80)
		stepper(settingRow(list, 3, "music", "Musik", "Lautstärke der Hintergrundmusik"), "music", 60)
		heading(list, 4, "Grafik")
		segmented(settingRow(list, 5, "sparkle", "Qualität", "Niedrig schont schwache Geräte"), "quality", { "niedrig", "mittel", "hoch" })
		toggle(settingRow(list, 6, "wind", "Weniger Partikel", "Ruhigere Spielwelt mit weniger Glitzern"), "fewerParticles")
		heading(list, 7, "Spiel")
		toggle(settingRow(list, 8, "skip", "Animationen überspringen", "Entdecken und Schlüpfen in Kurzfassung"), "skipAnimations")
		toggle(settingRow(list, 9, "numbers", "Kurze Zahlen", "Große Beträge als 12,5K statt 12.500"), "shortNumbers")
		heading(list, 10, "Zurücksetzen")
		local row = new("Frame", { Size = UDim2.new(1, 0, 0, 44), BackgroundTransparency = 1, LayoutOrder = 11, Parent = list }, {
			new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 10), SortOrder = Enum.SortOrder.LayoutOrder }),
		})
		local def = new("Frame", { Size = UDim2.new(0, 260, 1, 0), BackgroundTransparency = 1, LayoutOrder = 1, Parent = row })
		actionButton(def, "Einstellungen zurücksetzen", C.line, true, function() result(options.Invoke("resetSettings")) end).Size = UDim2.new(1, 0, 1, 0)
		if options.DevTools then
			local reset = new("Frame", { Size = UDim2.new(0, 330, 1, 0), BackgroundTransparency = 1, LayoutOrder = 2, Parent = row })
			actionButton(reset, armed("saveReset") and "Wirklich alles verlieren? Nochmal" or "Test: Spielstand neu beginnen", C.red, true, function()
				if not armed("saveReset") then return arm("saveReset", "einstellungen") end
				ui.saveReset = nil
				result(options.Invoke("resetSave"))
			end).Size = UDim2.new(1, 0, 1, 0)
		end
	end

	-- ── Wetter ──
	local function fillWeather(w)
		clear(w.body)
		clear(w.tools)
		local wid = ReplicatedStorage:GetAttribute("Weather") or "klar"
		local now = MutationData.WeatherById[wid] or MutationData.Weather[1]
		local left = (ReplicatedStorage:GetAttribute("WeatherEnds") or os.time()) - os.time()
		w.sub.Text = now.Name .. " · wechselt in " .. mmss(left)
		if options.DevTools then
			toolButton(w.tools, "Test: Wetter", 1, true, function() result(options.Invoke("testWeather"), nil, C.blue) end)
		end
		local bonus = SkillData.Effect(levels(), "wetter")
		if w.tab == "alle" then
			local total = 0
			for _, x in ipairs(MutationData.Weather) do total = total + x.Weight end
			local grid = scroller(w, w.body, "Alle", { Size = UDim2.new(1, 8, 1, 0) }, {
				new("UIGridLayout", { CellSize = UDim2.new(0, 214, 0, 178), CellPadding = UDim2.new(0, 10, 0, 10), SortOrder = Enum.SortOrder.LayoutOrder }),
				new("UIPadding", { PaddingRight = UDim.new(0, 14), PaddingBottom = UDim.new(0, 10) }),
			})
			for i, x in ipairs(MutationData.Weather) do
				local m = MutationData.ForWeather(x.Id)
				local c = card(grid, x.Color)
				c.LayoutOrder = i
				label({ Size = UDim2.new(1, 0, 0, 22), Text = x.Name, Font = FONT, TextSize = T.Large, TextColor3 = x.Color, TextXAlignment = Enum.TextXAlignment.Left, Parent = c })
				label({ Size = UDim2.new(1, 0, 0, 14), Position = UDim2.new(0, 0, 0, 24), Text = math.floor(x.Weight / total * 100 + 0.5) .. " % der Zeit", TextSize = T.Tiny, Font = MONO, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Parent = c })
				label({ Size = UDim2.new(1, 0, 0, 46), Position = UDim2.new(0, 0, 0, 42), Text = x.Text, TextSize = T.Tiny, TextWrapped = true, TextColor3 = C.ink, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, Font = TEXT, Parent = c })
				label({ Size = UDim2.new(1, 0, 0, 18), Position = UDim2.new(0, 0, 0, 92), Text = m and (m.Name .. " · " .. (m.Chance + bonus) .. " % · ×" .. tostring(m.Multiplier):gsub("%.", ",")) or "Keine Mutation", TextSize = T.Small, TextColor3 = m and m.Color or C.muted, TextXAlignment = Enum.TextXAlignment.Left, Parent = c })
				if m then
					label({ Size = UDim2.new(1, 0, 0, 30), Position = UDim2.new(0, 0, 0, 112), Text = m.Effect, TextSize = T.Tiny, TextWrapped = true, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, Font = TEXT, Parent = c })
				end
			end
			w.tick = function()
				w.sub.Text = now.Name .. " · wechselt in " .. mmss((ReplicatedStorage:GetAttribute("WeatherEnds") or os.time()) - os.time())
			end
			return
		end
		local list = query("forecast") or {}
		local firstTime, firstEnds
		local rows = scroller(w, w.body, "Vorhersage", { Size = UDim2.new(1, 8, 1, -40) }, {
			new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }),
			new("UIPadding", { PaddingRight = UDim.new(0, 14) }),
		})
		for i, f in ipairs(list) do
			local x = MutationData.WeatherById[f.Id]
			if x then
				local m = MutationData.ForWeather(x.Id)
				local row = new("Frame", { Size = UDim2.new(1, 0, 0, 46), BackgroundColor3 = C.bg2, BackgroundTransparency = i == 1 and 0 or 0.4, LayoutOrder = i, Parent = rows }, { corner(R.S) })
				if i == 1 then stroke(x.Color, 2).Parent = row end
				local time = label({ Size = UDim2.new(0, 110, 1, 0), Position = UDim2.new(0, 14, 0, 0), Text = i == 1 and ("noch " .. mmss(f.Ends - os.time())) or os.date("%H:%M", f.Starts), TextSize = T.Small, Font = MONO, TextColor3 = i == 1 and C.ink or C.muted, TextXAlignment = Enum.TextXAlignment.Left, Parent = row })
				if i == 1 then firstTime, firstEnds = time, f.Ends end
				new("Frame", { Size = UDim2.new(0, 14, 0, 14), Position = UDim2.new(0, 128, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), BackgroundColor3 = x.Color, Parent = row }, { corner(R.Round) })
				label({ Size = UDim2.new(1, -170, 1, 0), Position = UDim2.new(0, 156, 0, 0), Text = x.Name .. (m and ("  ·  " .. m.Name .. " " .. (m.Chance + bonus) .. " % (×" .. tostring(m.Multiplier):gsub("%.", ",") .. ")") or ""), TextSize = T.Body, TextXAlignment = Enum.TextXAlignment.Left, Parent = row })
			end
		end
		-- jede Sekunde nur die Zeiten
		w.tick = function()
			local ends = ReplicatedStorage:GetAttribute("WeatherEnds") or os.time()
			w.sub.Text = now.Name .. " · wechselt in " .. mmss(ends - os.time())
			if firstTime then firstTime.Text = "noch " .. mmss(firstEnds - os.time()) end
		end
		label({ Size = UDim2.new(1, 0, 0, 32), Position = UDim2.new(0, 0, 1, -32), Text = "Die Vorhersage ist sicher: Das Wetter ergibt sich aus der Uhrzeit und ist für alle gleich.", TextSize = T.Tiny, TextWrapped = true, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Font = TEXT, Parent = w.body })
	end

	-- ── Belohnungen ──
	local function shortPrize(p)
		return (RewardData.PrizeText(p):gsub(" Taler", ""):gsub(" %(.*%)", ""))
	end
	local function fillDaily(w, st)
		label({ Size = UDim2.new(1, 0, 0, 22), Text = "Hol dir jeden Tag ein Geschenk. Wer einen Tag auslässt, fängt wieder bei Tag 1 an.", TextSize = T.Small, TextXAlignment = Enum.TextXAlignment.Left, Parent = w.body })
		local days = new("Frame", { Name = "Tage", Size = UDim2.new(1, 0, 0, 170), Position = UDim2.new(0, 0, 0, 36), BackgroundTransparency = 1, Parent = w.body }, {
			new("UIGridLayout", { CellSize = UDim2.new(0, 120, 0, 160), CellPadding = UDim2.new(0, 10, 0, 10), HorizontalAlignment = Enum.HorizontalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder }),
		})
		for i, p in ipairs(RewardData.Daily) do
			local done = i < st.Next or (st.ClaimedToday and st.Next == 1 and st.Streak > 0)
			local today = i == st.Next and not st.ClaimedToday
			local c = card(days, today and C.goldHi or (done and C.green or C.line))
			c.LayoutOrder = i
			if today then c.BackgroundColor3 = C.highlight end
			label({ Size = UDim2.new(1, 0, 0, 16), Text = "Tag " .. i, TextSize = T.Tiny, Font = MONO, TextColor3 = C.muted, Parent = c })
			icon(RewardData.PrizeIcon(p), { Size = UDim2.new(0, 42, 0, 42), Position = UDim2.new(0.5, 0, 0, 22), AnchorPoint = Vector2.new(0.5, 0), Parent = c })
			label({ Size = UDim2.new(1, 0, 0, 40), Position = UDim2.new(0, 0, 0, 70), Text = RewardData.PrizeText(p), TextSize = T.Small, TextWrapped = true, Parent = c })
			if done then
				label({ Size = UDim2.new(1, 0, 0, 20), Position = UDim2.new(0, 0, 1, -20), Text = "✔", TextSize = T.Medium, TextColor3 = C.green, Parent = c })
			end
		end
		ui.dailyFoot = label({ Size = UDim2.new(1, -300, 0, 44), Position = UDim2.new(0, 0, 1, -44), Text = "Serie: " .. st.Streak .. " Tag" .. (st.Streak == 1 and "" or "e") .. (st.ClaimedToday and ("  ·  nächstes Geschenk in " .. clock(RewardData.SecondsToMidnight())) or ""), TextSize = T.Small, TextXAlignment = Enum.TextXAlignment.Left, Parent = w.body })
		local holder = new("Frame", { Size = UDim2.new(0, 280, 0, 46), Position = UDim2.new(1, 0, 1, 0), AnchorPoint = Vector2.new(1, 1), BackgroundTransparency = 1, Parent = w.body })
		actionButton(holder, st.ClaimedToday and "Morgen wieder" or ("Tag " .. st.Next .. " abholen"), C.green, not st.ClaimedToday, function()
			result(options.Invoke("daily"), nil, C.goldHi)
		end).Size = UDim2.new(1, 0, 1, 0)
	end

	ui.wheelAngle = 0
	local function fillWheel(w)
		local count = #RewardData.Wheel
		local seg = 360 / count
		local box = new("Frame", { Name = "Glücksrad", Size = UDim2.new(0, 330, 0, 330), Position = UDim2.new(0, 10, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), BackgroundTransparency = 1, Parent = w.body })
		local wheel = new("Frame", { Name = "Rad", Size = UDim2.new(0, 300, 0, 300), Position = UDim2.new(0.5, 0, 0.5, 6), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundColor3 = C.bg, Rotation = ui.wheelAngle, Parent = box }, {
			corner(R.Round),
		})
		-- Felder aus schmalen Speichen: jede Speiche ist eine gedrehte Leiste, die äußere Hälfte gefärbt
		local spokes = 10
		for i, p in ipairs(RewardData.Wheel) do
			for j = 0, spokes - 1 do
				local spoke = new("Frame", { Size = UDim2.new(0, 16, 1, -4), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5), Rotation = (i - 1) * seg + (j + 0.5) * seg / spokes, BackgroundTransparency = 1, Parent = wheel })
				new("Frame", { Size = UDim2.new(1, 0, 0.5, 0), BackgroundColor3 = p.Color, BorderSizePixel = 0, Parent = spoke })
			end
			local holder = new("Frame", { Size = UDim2.new(0, 40, 1, 0), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5), Rotation = (i - 0.5) * seg, BackgroundTransparency = 1, ZIndex = 2, Parent = wheel })
			label({ Size = UDim2.new(0, 70, 0, 18), Position = UDim2.new(0.5, 0, 0, 34), AnchorPoint = Vector2.new(0.5, 0.5), Text = shortPrize(p), TextSize = T.Small, Font = BODY, TextColor3 = C.goldInk, ZIndex = 2, Parent = holder })
		end
		new("Frame", { Name = "Rand", Size = UDim2.new(1, 8, 1, 8), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundTransparency = 1, ZIndex = 3, Parent = wheel }, {
			corner(R.Round),
			stroke(C.gold, 6),
		})
		new("Frame", { Name = "Mitte", Size = UDim2.new(0, 46, 0, 46), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundColor3 = C.gold, ZIndex = 3, Parent = wheel }, {
			corner(R.Round),
			stroke(C.bg, 3),
			gradient(C.goldHi, C.goldDark),
		})
		new("Frame", { Name = "Zeiger", Size = UDim2.new(0, 24, 0, 24), Position = UDim2.new(0.5, 0, 0, 2), AnchorPoint = Vector2.new(0.5, 0.5), Rotation = 45, BackgroundColor3 = C.red, ZIndex = 4, Parent = box }, { stroke(C.bg, 3) })

		local side = new("Frame", { Size = UDim2.new(1, -370, 1, 0), Position = UDim2.new(0, 370, 0, 0), BackgroundTransparency = 1, Parent = w.body })
		label({ Size = UDim2.new(1, 0, 0, 30), Text = "Glücksrad", Font = FONT, TextSize = T.Title, TextXAlignment = Enum.TextXAlignment.Left, Parent = side })
		label({ Size = UDim2.new(1, 0, 0, 36), Position = UDim2.new(0, 0, 0, 34), Text = "Einmal am Tag gratis drehen. Das seltene rote Feld bringt die meisten Taler.", TextSize = T.Small, TextWrapped = true, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, Font = TEXT, Parent = side })
		for i, p in ipairs(RewardData.Wheel) do
			local y = 76 + (i - 1) * 26
			new("Frame", { Size = UDim2.new(0, 14, 0, 14), Position = UDim2.new(0, 0, 0, y + 3), BackgroundColor3 = p.Color, Parent = side }, { corner(R.XS) })
			label({ Size = UDim2.new(1, -24, 0, 20), Position = UDim2.new(0, 24, 0, y), Text = RewardData.PrizeText(p), TextSize = T.Small, TextXAlignment = Enum.TextXAlignment.Left, Parent = side })
		end
		local ready = attr("WheelDay", "") ~= RewardData.DayKey()
		local holder = new("Frame", { Size = UDim2.new(1, 0, 0, 48), Position = UDim2.new(0, 0, 1, 0), AnchorPoint = Vector2.new(0, 1), BackgroundTransparency = 1, Parent = side })
		ui.wheelButton = actionButton(holder, ready and "Drehen!" or ("Wieder in " .. clock(RewardData.SecondsToMidnight())), C.green, ready and not w.busy, function()
			if w.busy then return end
			local ok, text, index = options.Invoke("spin")
			if not ok or not index then return result(false, text) end
			local target = 360 * 6 - ((index - 1) * seg + seg / 2) + (math.random() - 0.5) * seg * 0.6
			local function done()
				w.busy = false
				ui.wheelAngle = target % 360
				result(true, text, RewardData.Wheel[index].Color)
				GameUI.Refresh("belohnung")
			end
			if attr("Set_skipAnimations", false) then return done() end
			w.busy = true
			wheel.Rotation = ui.wheelAngle % 360
			TweenService:Create(wheel, M.Spin, { Rotation = target }):Play()
			task.delay(4.3, done)
		end)
		ui.wheelButton.Size = UDim2.new(1, 0, 1, 0)
	end

	local function fillGroup(w)
		local c = card(w.body, C.blue)
		c.Size = UDim2.new(0, 480, 0, 280)
		c.Position = UDim2.new(0.5, 0, 0.5, 0)
		c.AnchorPoint = Vector2.new(0.5, 0.5)
		icon("star", { Size = UDim2.new(0, 52, 0, 52), Position = UDim2.new(0.5, 0, 0, 2), AnchorPoint = Vector2.new(0.5, 0), Parent = c })
		label({ Size = UDim2.new(1, 0, 0, 30), Position = UDim2.new(0, 0, 0, 60), Text = "Coinmaster-Gruppe", Font = FONT, TextSize = T.Title, Parent = c })
		label({ Size = UDim2.new(1, -20, 0, 60), Position = UDim2.new(0, 10, 0, 96), Text = "Tritt der Gruppe bei und bekomme einmalig " .. RewardData.PrizeText(RewardData.GroupBonus) .. ". Das Spiel prüft, ob du Mitglied bist.", TextSize = T.Small, TextWrapped = true, TextColor3 = C.muted, Font = TEXT, Parent = c })
		local joined = attr("Group", false) == true
		actionButton(c, joined and "✔ Schon beigetreten" or "Gruppe beitreten", C.blue, not joined, function()
			result(options.Invoke("group"), nil, C.blue)
		end)
	end

	local function fillRewards(w)
		clear(w.body)
		clear(w.tools)
		local st = RewardData.DailyStatus(attr("DailyDay", ""), attr("DailyStreak", 0))
		w.sub.Text = st.ClaimedToday and ("Nächstes Geschenk in " .. clock(RewardData.SecondsToMidnight())) or "Heute wartet ein Geschenk"
		if options.DevTools then
			toolButton(w.tools, "Test: nächster Tag", 1, true, function() result(options.Invoke("testDay"), nil, C.blue) end)
		end
		-- jede Sekunde nur die Uhren; um Mitternacht neu füllen
		ui.dailyFoot, ui.wheelButton = nil, nil
		local day = RewardData.DayKey()
		w.tick = function()
			if RewardData.DayKey() ~= day then return GameUI.Refresh("belohnung") end
			local left = clock(RewardData.SecondsToMidnight())
			if st.ClaimedToday then w.sub.Text = "Nächstes Geschenk in " .. left end
			if ui.dailyFoot and st.ClaimedToday then
				ui.dailyFoot.Text = "Serie: " .. st.Streak .. " Tag" .. (st.Streak == 1 and "" or "e") .. "  ·  nächstes Geschenk in " .. left
			end
			if ui.wheelButton and not w.busy and attr("WheelDay", "") == RewardData.DayKey() then
				ui.wheelButton.Text = "Wieder in " .. left
			end
		end
		if w.tab == "rad" then
			fillWheel(w)
		elseif w.tab == "gruppe" then
			fillGroup(w)
		else
			fillDaily(w, st)
		end
	end

	-- ── Codes ──
	ui.codeText = ""
	local function fillCodes(w)
		clear(w.body)
		local used = {}
		for c in string.gmatch(attr("Codes", ""), "[^,]+") do table.insert(used, c) end
		w.sub.Text = #used .. " Code" .. (#used == 1 and "" or "s") .. " eingelöst"
		label({ Size = UDim2.new(1, 0, 0, 24), Text = "Code eingeben", Font = FONT, TextSize = T.Large, TextXAlignment = Enum.TextXAlignment.Left, Parent = w.body })
		local field = new("Frame", { Name = "Feld", Size = UDim2.new(1, -176, 0, 52), Position = UDim2.new(0, 0, 0, 32), BackgroundColor3 = C.bg2, Parent = w.body }, {
			corner(R.M),
			stroke(C.gold, 2),
		})
		local box = new("TextBox", { Name = "Code", Size = UDim2.new(1, -32, 1, 0), Position = UDim2.new(0, 16, 0, 0), BackgroundTransparency = 1, Text = ui.codeText, PlaceholderText = "z. B. COINMASTER", PlaceholderColor3 = C.muted, ClearTextOnFocus = false, Font = BODY, TextSize = T.Large, TextColor3 = C.ink, TextXAlignment = Enum.TextXAlignment.Left, Parent = field })
		local function redeem()
			local ok, text = options.Invoke("code", box.Text)
			ui.codeMsg = { text or "", ok }
			if ok then
				ui.codeText = ""
				result(true, text, C.cyan)
			end
			GameUI.Refresh("codes")
		end
		box:GetPropertyChangedSignal("Text"):Connect(function() ui.codeText = box.Text end)
		box.FocusLost:Connect(function(enter)
			if enter then redeem() end
		end)
		local b = new("TextButton", { Name = "Einloesen", Size = UDim2.new(0, 160, 0, 52), Position = UDim2.new(1, 0, 0, 32), AnchorPoint = Vector2.new(1, 0), BackgroundColor3 = C.green, Text = "Einlösen", Font = FONT, TextSize = T.Large, TextColor3 = Color3.new(1, 1, 1), Parent = w.body }, { corner(R.M) })
		pressable(b, redeem)
		if ui.codeMsg then
			label({ Size = UDim2.new(1, 0, 0, 22), Position = UDim2.new(0, 0, 0, 94), Text = ui.codeMsg[1], TextSize = T.Body, TextColor3 = ui.codeMsg[2] and C.green or C.red, TextXAlignment = Enum.TextXAlignment.Left, Parent = w.body })
		end
		label({ Size = UDim2.new(1, 0, 0, 40), Position = UDim2.new(0, 0, 0, 124), Text = "Neue Codes gibt es zu Updates und Feiertagen. Groß- und Kleinschreibung ist egal." .. (options.CodeHint and ("  " .. options.CodeHint) or ""), TextSize = T.Small, TextWrapped = true, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, Font = TEXT, Parent = w.body })
		if #used > 0 then
			local list = new("Frame", { Name = "Eingeloest", Size = UDim2.new(1, 0, 1, -176), Position = UDim2.new(0, 0, 0, 176), BackgroundTransparency = 1, Parent = w.body }, {
				new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }),
			})
			label({ Size = UDim2.new(1, 0, 0, 22), Text = "Eingelöst", Font = FONT, TextSize = T.Medium, TextColor3 = C.gold, TextXAlignment = Enum.TextXAlignment.Left, LayoutOrder = 0, Parent = list })
			for i, c in ipairs(used) do
				label({ Size = UDim2.new(1, 0, 0, 20), Text = "✔ " .. c, TextSize = T.Small, Font = MONO, TextColor3 = C.green, TextXAlignment = Enum.TextXAlignment.Left, LayoutOrder = i, Parent = list })
			end
		end
	end

	-- ── Ranglisten ──
	local function fillBoards(w)
		clear(w.body)
		w.sub.Text = "Die besten Spieler"
		local b
		for _, x in ipairs(RewardData.Boards) do
			if x.Id == w.tab then b = x end
		end
		b = b or RewardData.Boards[1]
		local data = query("board", b.Id) or { Rows = {}, Place = 1, Mine = 0 }
		local list = scroller(w, w.body, "Liste", { Size = UDim2.new(1, 8, 1, 0) }, {
			new("UIListLayout", { Padding = UDim.new(0, 3), SortOrder = Enum.SortOrder.LayoutOrder }),
			new("UIPadding", { PaddingRight = UDim.new(0, 14), PaddingBottom = UDim.new(0, 6) }),
		})
		local inTop = false
		local function row(order, place, name, value, me)
			local r = new("Frame", { Size = UDim2.new(1, 0, 0, 30), BackgroundColor3 = me and C.highlight or C.bg2, BackgroundTransparency = me and 0 or (order % 2 == 0 and 0.3 or 0), LayoutOrder = order, Parent = list }, { corner(R.S) })
			if me then stroke(C.goldHi, 2).Parent = r end
			new("TextLabel", { Size = UDim2.new(0, 40, 0, 22), Position = UDim2.new(0, 6, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), BackgroundColor3 = place <= 3 and b.Color or C.line, Text = GameUI.Format(place), Font = BODY, TextSize = T.Small, TextColor3 = place <= 3 and C.goldInk or C.ink, Parent = r }, { corner(R.Round) })
			label({ Size = UDim2.new(0.6, 0, 1, 0), Position = UDim2.new(0, 60, 0, 0), Text = name, Font = FONT, TextSize = T.Medium, TextXAlignment = Enum.TextXAlignment.Left, Parent = r })
			label({ Size = UDim2.new(0.35, 0, 1, 0), Position = UDim2.new(1, -14, 0, 0), AnchorPoint = Vector2.new(1, 0), Text = GameUI.Format(value), TextSize = T.Body, Font = MONO, TextColor3 = b.Color, TextXAlignment = Enum.TextXAlignment.Right, Parent = r })
		end
		for i, r in ipairs(data.Rows or {}) do
			if r.Me then inTop = true end
			row(i, i, r.Me and "Du" or r.Name, r.Value, r.Me)
		end
		if not inTop then
			label({ Size = UDim2.new(1, 0, 0, 14), Text = "···", TextSize = T.Small, TextColor3 = C.muted, LayoutOrder = 50, Parent = list })
			row(51, data.Place or 0, "Du", data.Mine or 0, true)
		end
		local rows = data.Rows or {}
		local note = inTop and ("Du bist auf Platz " .. data.Place .. ". Stark!") or (#rows >= 10 and (("Bis Platz 10 fehlen dir noch " .. GameUI.Format(math.max(0, rows[10].Value - (data.Mine or 0) + 1)) .. "."):gsub("%.%.$", ".")) or "")
		if options.DevTools then note = note .. " Die anderen Namen sind Beispiel-Spieler." end
		label({ Size = UDim2.new(1, 0, 0, 30), Text = note, TextSize = T.Small, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Font = TEXT, LayoutOrder = 60, Parent = list })
	end

	function buildMore(playerGui)
		buildWindow(playerGui, "skills", "tree", "Skilltree", {}, fillSkills)
		buildWindow(playerGui, "einstellungen", "gear", "Einstellungen", {}, fillSettings)
		buildWindow(playerGui, "wetter", "cloud", "Wetter", { { "vorhersage", "Vorhersage", 150 }, { "alle", "Alle Wetter", 150 } }, fillWeather)
		buildWindow(playerGui, "belohnung", "gift", "Belohnungen", { { "taeglich", "Täglich", 110, "gift" }, { "rad", "Glücksrad", 130, "sparkle" }, { "gruppe", "Gruppe", 110, "star" } }, fillRewards)
		buildWindow(playerGui, "codes", "key", "Codes", {}, fillCodes)
		local tabs = {}
		for _, b in ipairs(RewardData.Boards) do
			table.insert(tabs, { b.Id, b.Label, b.Id == "rebirths" and 170 or 132 })
		end
		buildWindow(playerGui, "ranglisten", "trophy", "Ranglisten", tabs, fillBoards)
	end
end
`;
