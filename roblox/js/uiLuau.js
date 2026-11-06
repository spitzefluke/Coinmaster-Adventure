// Spiel-Oberfläche für Roblox: HUD, Menüleiste, Hinweise und alle Fenster (Shop, Inventar, Welten, Skilltree,
// Einstellungen, Wetter, Belohnungen, Codes, Ranglisten) als ScreenGui.
// GameUI baut alles aus Frames, Buttons und Layouts; die Webseite führt dasselbe Modul aus und zeigt es 1:1.
// Reiner Text wie luau.js, damit es auch in Node prüfbar ist.
import { GAME_UI_MORE } from './uiMoreLuau.js';
import { iconLua, ICON_CELL } from './iconSheet.js';

const ICONS = iconLua();

const str = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
const num = (n) => String(Math.round(n * 1000) / 1000);
const HEADER = (title) => `-- Coinmaster Adventure · ${title}
-- Automatisch erzeugt von der Coinmaster-Webseite. Änderungen besser dort machen
-- und neu übertragen, sonst gehen sie beim nächsten Import verloren.
`;



export function shopDataSource({ BOOSTS, ROBUX }) {
  const boosts = BOOSTS.map((b) => `{ Id = ${str(b.id)}, Name = ${str(b.name)}, Minutes = ${num(b.minutes)}, Price = ${num(b.price)}, Text = ${str(b.text)}, Icon = ${str(b.icon || 'sparkle')} }`);
  const robux = ROBUX.map((r) => `{ Id = ${str(r.id)}, Name = ${str(r.name)}, Text = ${str(r.text)}, Robux = ${num(r.robux)}, Badge = ${r.badge ? str(r.badge) : 'nil'} }`);
  return `${HEADER('Shop')}
-- Boosts kauft man mit Talern, sie laufen eine Zeit lang. Robux-Angebote brauchen im Spiel Developer Products.

local ShopData = {}

ShopData.Boosts = {
	${boosts.join(',\n\t')},
}

ShopData.Robux = {
	${robux.join(',\n\t')},
}

ShopData.BoostById = {}
for _, b in ipairs(ShopData.Boosts) do
	ShopData.BoostById[b.Id] = b
end

return ShopData
`;
}

// Design-System: alle Farben, Schriften, Größen und Bewegungen der Oberfläche an einer Stelle
export const UI_THEME = `${HEADER('Design-System')}
-- Farben, Schriften, Textgrößen, Ecken, Abstände und Bewegungen der Spiel-Oberfläche.
-- Hier ändern, und alle Fenster ändern sich mit.

local UITheme = {}

UITheme.Colors = {
	-- Flächen
	bg = Color3.fromRGB(24, 21, 31), bg2 = Color3.fromRGB(36, 31, 46), deep = Color3.fromRGB(16, 14, 22),
	line = Color3.fromRGB(60, 52, 74), highlight = Color3.fromRGB(58, 48, 30),
	-- Text
	ink = Color3.fromRGB(245, 239, 228), muted = Color3.fromRGB(170, 162, 182),
	-- Gold (Marke)
	gold = Color3.fromRGB(217, 178, 106), goldHi = Color3.fromRGB(255, 220, 140), goldDark = Color3.fromRGB(176, 128, 52),
	goldInk = Color3.fromRGB(42, 30, 10), cream = Color3.fromRGB(255, 240, 200), creamDark = Color3.fromRGB(150, 130, 110),
	-- Aktionen und Zustände
	green = Color3.fromRGB(64, 200, 112), greenHi = Color3.fromRGB(96, 226, 140), greenDeep = Color3.fromRGB(36, 160, 84),
	greenDark = Color3.fromRGB(20, 90, 44), greenInk = Color3.fromRGB(10, 40, 20), mint = Color3.fromRGB(159, 227, 181),
	red = Color3.fromRGB(232, 74, 90), blue = Color3.fromRGB(0, 162, 255), cyan = Color3.fromRGB(56, 240, 255),
	-- Erfahrung
	xp = Color3.fromRGB(160, 120, 255), xpHi = Color3.fromRGB(196, 160, 255), xpDark = Color3.fromRGB(120, 80, 230),
	-- Glanz auf Flächen (UIGradient)
	shade = Color3.fromRGB(150, 150, 150),
}

UITheme.Fonts = {
	Title = Enum.Font.FredokaOne, -- Überschriften, Knöpfe, große Zahlen
	Body = Enum.Font.GothamBold, -- normaler Text
	Text = Enum.Font.Gotham, -- längere Beschreibungen
	Number = Enum.Font.Code, -- Zeiten, Werte, kleine Kennungen
	Emoji = Enum.Font.SourceSans, -- Emoji-Bilder
}

-- Textgrößen: nur diese verwenden
UITheme.Text = { Tiny = 12, Small = 14, Body = 16, Medium = 18, Large = 20, Big = 24, Title = 28, Hero = 34 }

-- Ecken
UITheme.Radius = {
	XS = UDim.new(0, 6), S = UDim.new(0, 12), M = UDim.new(0, 16), L = UDim.new(0, 20), XL = UDim.new(0, 22),
	Round = UDim.new(1, 0),
}

-- Abstände
UITheme.Space = { XS = 4, S = 8, M = 12, L = 16, XL = 24 }

-- Bewegung: drei Dauern, zwei Kurven
--   Fast    Maus drüber, kleine Rückmeldungen
--   Normal  Fenster, Reiter, Balken
--   Pop     Freudiges: Fenster öffnen, Knopf gedrückt, Hinweis erscheint (mit leichtem Überschwingen)
--   Slow    Belohnungen, hochzählende Zahlen
--   Exit    Verschwinden (schneller als Erscheinen)
--   Spin    Glücksrad
--   Float   aufsteigende Zahlen und Funken
--   Fly     Münzen fliegen zum Taler-Feld (werden schneller)
UITheme.Motion = {
	Fast = TweenInfo.new(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
	Normal = TweenInfo.new(0.22, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
	Pop = TweenInfo.new(0.22, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
	Slow = TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
	Exit = TweenInfo.new(0.16, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
	Spin = TweenInfo.new(4.2, Enum.EasingStyle.Quint, Enum.EasingDirection.Out),
	Float = TweenInfo.new(0.9, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), -- „+500“ steigt auf, Funken fliegen
	Fly = TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.In), -- Münzen fliegen zum Taler-Feld
}
UITheme.ExitTime = 0.16

-- Icons: ein Bild mit allen Icons (Datei Icons.png von der Webseite, 8 pro Zeile, je ${ICON_CELL} Pixel).
-- Nach dem Hochladen in Studio die Bild-Id hier eintragen, z. B. "rbxassetid://1234567890".
-- Solange das Feld leer ist, zeigt die Oberfläche statt der Icons Emojis.
UITheme.IconSheet = ""
UITheme.IconCell = Vector2.new(${ICON_CELL}, ${ICON_CELL})
UITheme.Icons = { ${ICONS.cells} }
UITheme.Emoji = { ${ICONS.emoji} }

local TweenService = game:GetService("TweenService")
-- Kurzform: UITheme.Tween(objekt, "Normal", { Eigenschaft = Ziel })
function UITheme.Tween(object, kind, goal)
	local tween = TweenService:Create(object, UITheme.Motion[kind] or UITheme.Motion.Normal, goal)
	tween:Play()
	return tween
end

return UITheme
`;

export const GAME_UI = `${HEADER('Spiel-Oberfläche')}
-- GameUI.Start(options) baut die Oberfläche im PlayerGui des lokalen Spielers (LocalScript).
-- Spielstand kommt aus Attributen am Spieler: Taler (sonst leaderstats.Taler), Level, XP, XPMax, Points,
-- WorldName, WorldPlanet, Aura, OwnedAuras, Egg_<id> (Anzahl), Boost_<id> (Ende als os.time()),
-- EggDiscount (Prozent). Das Wetter steht an ReplicatedStorage (Weather, WeatherEnds).
-- Inventar: Münzen als Stapel über das RemoteEvent InventoryEvent ("full", Liste) und ("set", Schlüssel, Stapel);
-- in der Vorschau ruft die Seite GameUI.ApplyInventory direkt auf. Plätze im Attribut Slots.
-- Welten: World (aktuelle Welt), Worlds und Portals (Ids mit Komma), Rebirths.
-- Garten: Garden (JSON, siehe GardenData), Aktionen garden… und openRoll gehen an GardenRemote.
-- options.PlayRoll(rollId, itemId)         zeigt eine geöffnete Rolle mit Rollband (Standard: RollFx vor dem Spieler)
-- options.Invoke(action, a, b) → ok, text   Käufe und Aktionen (buyEgg, buyBoost, aura, robux, sell, sellNormal,
--                                           buyWorld, teleport, portal, rebirth); Standard: RemoteFunctions
-- options.OnAction(name, arg)               Menü-Knöpfe für Fenster, die es hier noch nicht gibt
-- options.Query(kind, arg) → table          Daten: forecast (Wettervorhersage), board (Rangliste)
-- options.Sound(kind, level)               Klang zu Effekten (z. B. "found", Stufe 1–4), optional
-- GameUI.Found(info)                        zeigt einen Fund je nach Seltenheit (Hinweis bis große Ansage)
-- options.DevTools                          zeigt Test-Knöpfe (nur Vorschau, z. B. „+ Test-Taler“)
-- Skills (Attribut Skills), Belohnungen (DailyDay, DailyStreak, WheelDay, Group, Codes) und
-- Einstellungen (Set_sfx, Set_music, Set_quality, Set_fewerParticles, Set_skipAnimations, Set_shortNumbers)
-- gehen über die RemoteFunction PlayerRemote (Server-Skript CoinmasterPlayer).

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local root = script.Parent
local EggData = require(root:WaitForChild("EggData"))
local ShopData = require(root:WaitForChild("ShopData"))
local AuraData = require(root:WaitForChild("AuraData"))
local MutationData = require(root:WaitForChild("MutationData"))
local CoinData = require(root:WaitForChild("CoinData"))
local WorldData = require(root:WaitForChild("WorldData"))
local GardenData = require(root:WaitForChild("GardenData"))
local RollData = require(root:WaitForChild("RollData"))
local HttpService = game:GetService("HttpService")

local GameUI = {}

-- ── Design-System (Modul UITheme): Farben, Schriften, Textgrößen, Ecken, Abstände, Bewegung ──
local Theme = require(root:WaitForChild("UITheme"))
local C, T, R, S, M = Theme.Colors, Theme.Text, Theme.Radius, Theme.Space, Theme.Motion
local FONT, BODY, TEXT, MONO, EMOJI = Theme.Fonts.Title, Theme.Fonts.Body, Theme.Fonts.Text, Theme.Fonts.Number, Theme.Fonts.Emoji

local function new(class, props, children)
	local inst = Instance.new(class)
	for key, value in pairs(props or {}) do
		if key ~= "Parent" then
			inst[key] = value
		end
	end
	for _, child in ipairs(children or {}) do
		child.Parent = inst
	end
	if props and props.Parent then
		inst.Parent = props.Parent
	end
	return inst
end
local function corner(r) return new("UICorner", { CornerRadius = r or R.M }) end
local function stroke(color, thickness, mode)
	return new("UIStroke", { Color = color, Thickness = thickness or 2, ApplyStrokeMode = mode or Enum.ApplyStrokeMode.Border })
end
local function label(props)
	local base = { BackgroundTransparency = 1, Font = BODY, TextColor3 = C.ink, TextScaled = false, TextSize = T.Body }
	for k, v in pairs(props) do base[k] = v end
	return new("TextLabel", base)
end
-- Icon aus dem Icon-Bild (UITheme.IconSheet); ohne hochgeladenes Bild das passende Emoji
local function icon(name, props)
	local cell = Theme.Icons[name]
	local base
	local class
	if Theme.IconSheet ~= "" and cell then
		class = "ImageLabel"
		base = { Name = "Icon", BackgroundTransparency = 1, Image = Theme.IconSheet, ImageRectOffset = cell, ImageRectSize = Theme.IconCell, ScaleType = Enum.ScaleType.Fit }
	else
		class = "TextLabel"
		base = { Name = "Icon", BackgroundTransparency = 1, Text = Theme.Emoji[name] or "•", Font = Enum.Font.SourceSans, TextScaled = true, TextColor3 = Color3.new(1, 1, 1) }
	end
	for k, v in pairs(props or {}) do base[k] = v end
	return new(class, base)
end
GameUI.Icon = icon

local function gradient(top, bottom)
	return new("UIGradient", { Rotation = 90, Color = ColorSequence.new(top, bottom) })
end

-- Zahlen: 1.250 · 12,5K · 3,4 Mio. · 1,2 Mrd.
function GameUI.Format(n)
	n = n or 0
	local units = { { 1e12, " Bio." }, { 1e9, " Mrd." }, { 1e6, " Mio." }, { 1e4, "K" } }
	for _, u in ipairs(units) do
		if math.abs(n) >= u[1] then
			local v = n / (u[1] == 1e4 and 1e3 or u[1])
			local text = string.format(v >= 100 and "%.0f" or "%.1f", v):gsub("%.0$", ""):gsub("%.", ",")
			return text .. u[2]
		end
	end
	local s = tostring(math.floor(n + 0.5))
	local out = s:reverse():gsub("(%d%d%d)", "%1."):reverse()
	return (out:gsub("^%.", ""))
end

-- Großbuchstaben auch für ä, ö, ü (string.upper kennt nur A–Z)
function GameUI.Upper(text)
	return (string.upper(text):gsub("ä", "Ä"):gsub("ö", "Ö"):gsub("ü", "Ü"))
end

local function mmss(seconds)
	seconds = math.max(0, math.floor(seconds))
	return string.format("%d:%02d", math.floor(seconds / 60), seconds % 60)
end

-- Spielgefühl („Juice“): die Effekte stehen weiter unten bei den Funden; hier schon bekannt, damit Knöpfe,
-- Fenster und Käufe sie aufrufen können. Juice.calm() = „Animationen überspringen“ ist an.
local Juice = { calm = function() return false end }
local SPRING = TweenInfo.new(0.42, Enum.EasingStyle.Elastic, Enum.EasingDirection.Out, 0, false, 0)
local SQUASH = TweenInfo.new(0.07, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

-- Knopf mit Hover-Vergrößerung, Eindrücken beim Drücken und Federn beim Loslassen
local function pressable(button, onClick)
	local scale = new("UIScale", { Scale = 1, Parent = button })
	local hover = false
	button.MouseEnter:Connect(function()
		hover = true
		TweenService:Create(scale, M.Fast, { Scale = 1.07 }):Play()
	end)
	button.MouseLeave:Connect(function()
		hover = false
		TweenService:Create(scale, M.Fast, { Scale = 1 }):Play()
	end)
	button.MouseButton1Down:Connect(function()
		if Juice.calm() then return end
		TweenService:Create(scale, SQUASH, { Scale = 0.88 }):Play()
	end)
	button.Activated:Connect(function()
		if Juice.calm() then
			scale.Scale = hover and 1.07 or 1
		else
			scale.Scale = 0.86
			TweenService:Create(scale, SPRING, { Scale = hover and 1.07 or 1 }):Play()
			if Juice.tap then Juice.tap(button) end
		end
		onClick()
	end)
	return button
end

-- ── Zustand ──
local player = Players.LocalPlayer
local options = {}
local ui = {}
local windows = {} -- Shop, Inventar, Welten

local function attr(name, default)
	local v = player:GetAttribute(name)
	if v == nil then return default end
	return v
end
local function taler()
	local v = player:GetAttribute("Taler")
	if v then return v end
	local stats = player:FindFirstChild("leaderstats")
	local t = stats and stats:FindFirstChild("Taler")
	return t and t.Value or 0
end

-- ── Hinweise oben in der Mitte ──
function GameUI.Toast(text, color)
	if not ui.toasts then return end
	color = color or C.gold
	local pill = new("Frame", { Name = "Hinweis", Size = UDim2.new(0, 420, 0, 0), BackgroundColor3 = C.bg, BackgroundTransparency = 0.08, LayoutOrder = math.floor(os.clock() * 1000), ClipsDescendants = true, Parent = ui.toasts }, {
		corner(R.S),
		stroke(color, 2),
		label({ Size = UDim2.new(1, -24, 1, 0), Position = UDim2.new(0, 12, 0, 0), Text = text, TextColor3 = C.ink, TextSize = T.Body, TextWrapped = true, Font = BODY }),
	})
	TweenService:Create(pill, M.Pop, { Size = UDim2.new(0, 420, 0, 44) }):Play()
	task.delay(3.6, function()
		TweenService:Create(pill, M.Exit, { BackgroundTransparency = 1, Size = UDim2.new(0, 420, 0, 0) }):Play()
		task.delay(Theme.ExitTime + 0.02, function()
			pill:Destroy()
		end)
	end)
end

-- ── HUD ──
local function buildHud(playerGui)
	-- ScreenInsets: Inhalte bleiben aus Notch und abgerundeten Ecken heraus
	local gui = new("ScreenGui", { Name = "CoinmasterHUD", ResetOnSpawn = false, ScreenInsets = Enum.ScreenInsets.CoreUISafeInsets, Parent = playerGui })

	-- Spieler: Level-Abzeichen, Name, Skillpunkte, Erfahrung
	local level = new("TextButton", { Name = "Level", Size = UDim2.new(0, 64, 0, 64), Position = UDim2.new(0, 16, 0, 8), BackgroundColor3 = C.gold, Text = "", AutoButtonColor = false, Parent = gui }, {
		corner(R.Round),
		stroke(C.bg, 4),
		gradient(C.goldHi, C.goldDark),
	})
	ui.levelText = label({ Size = UDim2.new(1, 0, 1, 0), Text = "1", Font = FONT, TextSize = 30, TextColor3 = C.goldInk, Parent = level })
	pressable(level, function() GameUI.Toggle("skills") end)
	ui.levelBadge = level
	local info = new("Frame", { Name = "Spieler", Size = UDim2.new(0, 250, 0, 58), Position = UDim2.new(0, 72, 0, 11), BackgroundColor3 = C.bg, BackgroundTransparency = 0.12, Parent = gui }, {
		corner(R.M),
		new("UIPadding", { PaddingLeft = UDim.new(0, 16), PaddingRight = UDim.new(0, 10), PaddingTop = UDim.new(0, 6), PaddingBottom = UDim.new(0, 6) }),
	})
	ui.name = label({ Size = UDim2.new(1, 0, 0, 20), Text = player.DisplayName, TextXAlignment = Enum.TextXAlignment.Left, TextSize = T.Medium, Font = FONT, Parent = info })
	ui.points = new("TextButton", { Name = "Skillpunkte", Size = UDim2.new(0, 112, 0, 20), Position = UDim2.new(1, -112, 0, 0), BackgroundColor3 = C.green, Text = "+1 Skillpunkt", Font = BODY, TextSize = T.Tiny, TextColor3 = C.greenInk, Visible = false, Parent = info }, { corner(R.Round) })
	pressable(ui.points, function() GameUI.Toggle("skills") end)
	local bar = new("Frame", { Name = "EP", Size = UDim2.new(1, 0, 0, 10), Position = UDim2.new(0, 0, 0, 24), BackgroundColor3 = C.bg2, Parent = info }, { corner(R.Round) })
	ui.xpFill = new("Frame", { Size = UDim2.new(0.2, 0, 1, 0), BackgroundColor3 = C.xp, Parent = bar }, { corner(R.Round), gradient(C.xpHi, C.xpDark) })
	ui.xpText = label({ Size = UDim2.new(1, 0, 0, 14), Position = UDim2.new(0, 0, 0, 36), Text = "", TextSize = T.Tiny, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Font = MONO, Parent = info })

	-- Welt oben in der Mitte
	ui.world = new("Frame", { Name = "Welt", Size = UDim2.new(0, 220, 0, 38), Position = UDim2.new(0.5, 0, 0, 10), AnchorPoint = Vector2.new(0.5, 0), BackgroundColor3 = C.bg, BackgroundTransparency = 0.12, Parent = gui }, {
		corner(R.Round),
		stroke(C.gold, 2),
	})
	ui.worldText = label({ Size = UDim2.new(1, -20, 1, 0), Position = UDim2.new(0, 10, 0, 0), Text = "Spawn", Font = FONT, TextSize = T.Large, Parent = ui.world })

	-- Taler, Wetter, Boosts oben rechts
	ui.info = info
	local right = new("Frame", { Name = "Rechts", Size = UDim2.new(0, 320, 0, 220), Position = UDim2.new(1, -16, 0, 8), AnchorPoint = Vector2.new(1, 0), BackgroundTransparency = 1, Parent = gui }, {
		new("UIListLayout", { Padding = UDim.new(0, 8), HorizontalAlignment = Enum.HorizontalAlignment.Right, SortOrder = Enum.SortOrder.LayoutOrder }),
	})
	local coins = new("Frame", { Name = "Taler", Size = UDim2.new(0, 220, 0, 52), BackgroundColor3 = C.bg, BackgroundTransparency = 0.08, LayoutOrder = 1, Parent = right }, {
		corner(R.Round),
		stroke(C.gold, 3),
		icon("coin", { Size = UDim2.new(0, 36, 0, 36), Position = UDim2.new(0, 10, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5) }),
		label({ Name = "Einheit", Size = UDim2.new(0, 50, 1, 0), Position = UDim2.new(1, -60, 0, 2), Text = "Taler", TextSize = T.Small, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Right }),
	})
	ui.talerPill = coins
	ui.talerScale = new("UIScale", { Scale = 1, Parent = coins })
	ui.taler = label({ Size = UDim2.new(1, -116, 1, 0), Position = UDim2.new(0, 52, 0, 0), Text = "0", Font = FONT, TextSize = T.Title, TextColor3 = C.goldHi, TextXAlignment = Enum.TextXAlignment.Left, Parent = coins })
	ui.weather = new("TextButton", { Name = "Wetter", Size = UDim2.new(0, 300, 0, 36), BackgroundColor3 = C.bg, BackgroundTransparency = 0.12, Text = "", AutoButtonColor = false, LayoutOrder = 2, Parent = right }, { corner(R.Round) })
	ui.weatherStroke = stroke(C.blue, 2)
	ui.weatherStroke.Parent = ui.weather
	icon("cloud", { Size = UDim2.new(0, 22, 0, 22), Position = UDim2.new(0, 12, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), Parent = ui.weather })
	ui.weatherText = label({ Size = UDim2.new(1, -48, 1, 0), Position = UDim2.new(0, 38, 0, 0), Text = "", TextSize = T.Small, Parent = ui.weather })
	pressable(ui.weather, function() GameUI.Toggle("wetter") end)
	ui.boosts = new("Frame", { Name = "Boosts", Size = UDim2.new(0, 220, 0, 100), BackgroundTransparency = 1, LayoutOrder = 3, Parent = right }, {
		new("UIListLayout", { Padding = UDim.new(0, 6), HorizontalAlignment = Enum.HorizontalAlignment.Right, SortOrder = Enum.SortOrder.LayoutOrder }),
	})

	-- Menü links
	local menu = new("Frame", { Name = "Menue", Size = UDim2.new(0, 84, 0, 486), Position = UDim2.new(0, 16, 0.5, 20), AnchorPoint = Vector2.new(0, 0.5), BackgroundTransparency = 1, Parent = gui })
	ui.menu = menu
	ui.menuLayout = new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder, Parent = menu })
	ui.menuScale = new("UIScale", { Scale = 1, Parent = menu })
	ui.badges = {}
	-- 7 Knöpfe à 62 + 6 × 8 Abstand = 482: passt in dieselbe Höhe wie früher 6 Knöpfe
	local entries = {
		{ "welten", "globe", "Welten" }, { "skills", "tree", "Skills" }, { "inventar", "bag", "Inventar" },
		{ "shop", "shop", "Shop" }, { "garten", "sprout", "Garten" }, { "index", "book", "Index" }, { "einstellungen", "gear", "Optionen" },
	}
	for i, e in ipairs(entries) do
		local b = new("TextButton", { Name = e[1], Size = UDim2.new(0, 72, 0, 62), BackgroundColor3 = C.bg, BackgroundTransparency = 0.08, Text = "", LayoutOrder = i, Parent = menu }, {
			corner(R.M),
			stroke(C.gold, 2),
			icon(e[2], { Size = UDim2.new(0, 32, 0, 32), Position = UDim2.new(0.5, 0, 0, 6), AnchorPoint = Vector2.new(0.5, 0) }),
			label({ Size = UDim2.new(1, 0, 0, 16), Position = UDim2.new(0, 0, 1, -20), Text = e[3], TextSize = T.Tiny, Font = BODY }),
		})
		local badge = new("TextLabel", { Name = "Zahl", Size = UDim2.new(0, 24, 0, 24), Position = UDim2.new(1, -14, 0, -8), BackgroundColor3 = C.red, Text = "", Font = BODY, TextSize = T.Small, TextColor3 = Color3.new(1, 1, 1), Visible = false, ZIndex = 2, Parent = b }, { corner(R.Round), stroke(C.bg, 2) })
		ui.badges[e[1]] = badge
		pressable(b, function()
			if windows[e[1]] then
				GameUI.Toggle(e[1])
			else
				options.OnAction(e[1])
			end
		end)
	end

	-- Suchen unten in der Mitte
	ui.find = new("TextButton", { Name = "Suchen", Size = UDim2.new(0, 270, 0, 64), Position = UDim2.new(0.5, 0, 1, -34), AnchorPoint = Vector2.new(0.5, 1), BackgroundColor3 = C.green, Text = "", Parent = gui }, {
		corner(R.L),
		stroke(C.greenDark, 3),
		gradient(C.greenHi, C.greenDeep),
	})
	icon("search", { Size = UDim2.new(0, 32, 0, 32), Position = UDim2.new(0, 28, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), Parent = ui.find })
	ui.findLabel = label({ Size = UDim2.new(1, -86, 1, 0), Position = UDim2.new(0, 70, 0, 0), Text = "Münze suchen", Font = FONT, TextSize = T.Title, TextColor3 = Color3.new(1, 1, 1), TextXAlignment = Enum.TextXAlignment.Left, Parent = ui.find })
	new("UIStroke", { Color = C.greenDark, Thickness = 2, Parent = ui.find })
	pressable(ui.find, function() options.OnAction("find") end)
	ui.findHint = label({ Size = UDim2.new(0, 320, 0, 18), Position = UDim2.new(0.5, 0, 1, -12), AnchorPoint = Vector2.new(0.5, 1), Text = "", TextSize = T.Tiny, TextColor3 = C.ink, TextStrokeTransparency = 0.5, Font = BODY, Parent = gui })

	-- Hinweise
	ui.toasts = new("Frame", { Name = "Hinweise", Size = UDim2.new(0, 420, 0, 200), Position = UDim2.new(0.5, 0, 1, -118), AnchorPoint = Vector2.new(0.5, 1), BackgroundTransparency = 1, Parent = gui }, {
		new("UIListLayout", { Padding = UDim.new(0, 6), HorizontalAlignment = Enum.HorizontalAlignment.Center, VerticalAlignment = Enum.VerticalAlignment.Bottom, SortOrder = Enum.SortOrder.LayoutOrder }),
	})
	return gui
end

local function refreshHud()
	if not ui.taler then return end
	GameUI._showTaler(taler())
	local lvl, xp, xpMax = attr("Level", 1), attr("XP", 0), attr("XPMax", 100)
	ui.levelText.Text = tostring(lvl)
	GameUI._showXp(xp / math.max(1, xpMax), lvl)
	ui.xpText.Text = GameUI.Format(math.floor(xp)) .. " / " .. GameUI.Format(xpMax) .. " EP bis Level " .. (lvl + 1)
	local pts = attr("Points", 0)
	ui.points.Visible = pts > 0
	ui.points.Text = "+" .. pts .. " Skillpunkt" .. (pts > 1 and "e" or "")
	ui.badges.skills.Visible = pts > 0
	ui.badges.skills.Text = tostring(pts)
	ui.badges.inventar.Visible = attr("InventoryFull", false)
	ui.badges.inventar.Text = "!"
	local planet = attr("WorldPlanet", "")
	ui.worldText.Text = (planet ~= "" and (planet .. " · ") or "") .. attr("WorldName", "Spawn")
	ui.world.Size = UDim2.new(0, math.max(160, #ui.worldText.Text * 11 + 30), 0, 38)
	ui.findHint.Text = attr("FindHint", "")
	-- Wetter mit Countdown
	local wid = ReplicatedStorage:GetAttribute("Weather") or "klar"
	local w = MutationData.WeatherById[wid]
	if w then
		local m = MutationData.ForWeather(wid)
		local left = (ReplicatedStorage:GetAttribute("WeatherEnds") or os.time()) - os.time()
		ui.weatherText.Text = w.Name .. (m and (" · " .. m.Name .. " " .. m.Chance .. " %") or "") .. "  " .. mmss(left)
		ui.weatherStroke.Color = w.Color
	end
	-- aktive Boosts: Zeilen bleiben stehen, nur die Zeit ändert sich
	ui.boostRows = ui.boostRows or {}
	for i, b in ipairs(ShopData.Boosts) do
		local left = attr("Boost_" .. b.Id, 0) - os.time()
		local row = ui.boostRows[b.Id]
		if left > 0 then
			if not row then
				local frame = new("Frame", { Name = b.Id, Size = UDim2.new(0, 200, 0, 28), BackgroundColor3 = C.bg, BackgroundTransparency = 0.12, LayoutOrder = i, Parent = ui.boosts }, {
					corner(R.Round),
					stroke(C.green, 2),
				})
				icon(b.Icon, { Size = UDim2.new(0, 20, 0, 20), Position = UDim2.new(0, 8, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), Parent = frame })
				row = { frame = frame, text = label({ Size = UDim2.new(1, -40, 1, 0), Position = UDim2.new(0, 32, 0, 0), Text = "", TextSize = T.Small, Parent = frame }) }
				ui.boostRows[b.Id] = row
				local scale = new("UIScale", { Scale = 0.6, Parent = frame })
				TweenService:Create(scale, M.Pop, { Scale = 1 }):Play()
			end
			row.text.Text = b.Name .. "  " .. mmss(left)
		elseif row then
			row.frame:Destroy()
			ui.boostRows[b.Id] = nil
		end
	end
end

-- ── Shop ──
local TABS = { { "eier", "Eier", 110, "egg" }, { "boosts", "Boosts", 120, "bolt" }, { "auras", "Auras", 110, "sparkle" }, { "robux", "Robux", 116, "robux" } }

local function card(parent, accent)
	return new("Frame", { Size = UDim2.new(0, 100, 0, 100), BackgroundColor3 = C.bg2, Parent = parent }, {
		corner(R.M),
		stroke(accent or C.line, 2),
		new("UIPadding", { PaddingLeft = UDim.new(0, 12), PaddingRight = UDim.new(0, 12), PaddingTop = UDim.new(0, 12), PaddingBottom = UDim.new(0, 12) }),
	})
end
local function actionButton(parent, text, color, enabled, onClick)
	local b = new("TextButton", { Name = "Kaufen", Size = UDim2.new(1, 0, 0, 40), Position = UDim2.new(0, 0, 1, -40), BackgroundColor3 = color, Text = text, Font = FONT, TextSize = T.Medium, TextColor3 = Color3.new(1, 1, 1), AutoButtonColor = enabled, Parent = parent }, {
		corner(R.S),
	})
	if not enabled then
		b.BackgroundTransparency = 0.45
		b.TextTransparency = 0.3
	end
	pressable(b, function()
		if enabled then onClick() end
	end)
	return b
end
-- big: großer Moment (Welt gekauft, Portal, Wiedergeburt) mit Ansage
local function result(ok, text, color, big)
	GameUI.Toast(text or (ok and "Gekauft" or "Das geht gerade nicht"), ok and (color or C.gold) or C.red)
	if ok and Juice.bought then Juice.bought(color or C.gold, big, text) end
	if not ok and Juice.denied then Juice.denied() end
	return ok
end

local function fillShop()
	local list = ui.shopList
	for _, c in ipairs(list:GetChildren()) do
		if c:IsA("GuiObject") then c:Destroy() end
	end
	local money = taler()
	windows.shop.sub.Text = GameUI.Format(money) .. " Taler verfügbar"
	local grid = list:FindFirstChildOfClass("UIGridLayout")
	grid.CellSize = windows.shop.tab == "auras" and UDim2.new(0, 200, 0, 200) or UDim2.new(0, 200, 0, 236)
	if windows.shop.tab == "eier" then
		local discount = attr("EggDiscount", 0)
		for i, egg in ipairs(EggData.Eggs) do
			local c = card(list, egg.Glow)
			c.LayoutOrder = i
			-- Ei als 3D-Modell (EggBuilder), sonst ein Oval
			GameUI.EggView(c, egg, UDim2.new(0, 110, 0, 86), UDim2.new(0.5, 0, 0, -2))
			label({ Size = UDim2.new(1, 0, 0, 22), Position = UDim2.new(0, 0, 0, 88), Text = egg.Name, Font = FONT, TextSize = T.Large, Parent = c })
			local owned = attr("Egg_" .. egg.Id, 0)
			label({ Size = UDim2.new(1, 0, 0, 16), Position = UDim2.new(0, 0, 0, 112), Text = egg.RankName .. (owned > 0 and (" · im Inventar: " .. owned) or ""), TextSize = T.Tiny, TextColor3 = egg.Glow, Parent = c })
			if egg.Price and egg.Price.Currency == "Coins" then
				local price = math.floor(egg.Price.Amount * (1 - discount / 100) + 0.5)
				actionButton(c, "Kaufen · " .. GameUI.Format(price), C.green, money >= price, function()
					result(options.Invoke("buyEgg", egg.Id))
				end)
			elseif egg.Price then
				actionButton(c, "R$ " .. egg.Price.Amount, C.green, true, function()
					result(options.Invoke("robux", egg.Id))
				end)
			else
				actionButton(c, egg.Availability, C.line, false, function() end)
			end
		end
	elseif windows.shop.tab == "boosts" then
		for i, b in ipairs(ShopData.Boosts) do
			local c = card(list)
			c.LayoutOrder = i
			icon(b.Icon, { Size = UDim2.new(0, 48, 0, 48), Position = UDim2.new(0.5, 0, 0, 2), AnchorPoint = Vector2.new(0.5, 0), Parent = c })
			label({ Size = UDim2.new(1, 0, 0, 22), Position = UDim2.new(0, 0, 0, 56), Text = b.Name, Font = FONT, TextSize = T.Large, Parent = c })
			label({ Size = UDim2.new(1, 0, 0, 52), Position = UDim2.new(0, 0, 0, 80), Text = b.Text, TextSize = T.Tiny, TextColor3 = C.muted, TextWrapped = true, Font = TEXT, Parent = c })
			local left = attr("Boost_" .. b.Id, 0) - os.time()
			label({ Size = UDim2.new(1, 0, 0, 16), Position = UDim2.new(0, 0, 0, 134), Text = b.Minutes .. " Minuten" .. (left > 0 and (" · noch " .. mmss(left)) or ""), TextSize = T.Tiny, TextColor3 = left > 0 and C.green or C.muted, Font = MONO, Parent = c })
			actionButton(c, (left > 0 and "Verlängern · " or "Kaufen · ") .. GameUI.Format(b.Price), C.green, money >= b.Price, function()
				result(options.Invoke("buyBoost", b.Id))
			end)
		end
	elseif windows.shop.tab == "auras" then
		local owned = AuraData.ParseOwned(attr("OwnedAuras", ""))
		local equipped = attr("Aura", "")
		for i, a in ipairs(AuraData.Auras) do
			local r = AuraData.RarityById[a.Rarity]
			local c = card(list, r.Color)
			c.LayoutOrder = i
			-- Farbkreis aus den Aura-Farben
			local keys = {}
			for n, col in ipairs(a.Look.Colors) do
				table.insert(keys, ColorSequenceKeypoint.new(#a.Look.Colors == 1 and 0 or (n - 1) / (#a.Look.Colors - 1), col))
			end
			if #keys == 1 then table.insert(keys, ColorSequenceKeypoint.new(1, a.Look.Colors[1])) end
			new("Frame", { Name = "Farbe", Size = UDim2.new(0, 46, 0, 46), Position = UDim2.new(0.5, 0, 0, 0), AnchorPoint = Vector2.new(0.5, 0), BackgroundColor3 = Color3.new(1, 1, 1), Parent = c }, {
				corner(R.Round),
				stroke(r.Color, 3),
				new("UIGradient", { Rotation = 45, Color = ColorSequence.new(keys) }),
			})
			label({ Size = UDim2.new(1, 0, 0, 20), Position = UDim2.new(0, 0, 0, 50), Text = a.Name, Font = FONT, TextSize = T.Medium, Parent = c })
			label({ Size = UDim2.new(1, 0, 0, 14), Position = UDim2.new(0, 0, 0, 72), Text = r.Name, TextSize = T.Tiny, TextColor3 = r.Color, Parent = c })
			label({ Size = UDim2.new(1, 0, 0, 16), Position = UDim2.new(0, 0, 0, 88), Text = "+" .. a.Bonus.Value .. " % " .. (AuraData.BonusNames[a.Bonus.Type] or ""), TextSize = T.Small, TextColor3 = C.mint, Font = MONO, Parent = c })
			if equipped == a.Id then
				actionButton(c, "Ablegen", C.line, true, function() result(options.Invoke("aura", "unequip", a.Id)) end)
			elseif owned[a.Id] then
				actionButton(c, "Anlegen", C.blue, true, function() result(options.Invoke("aura", "equip", a.Id)) end)
			else
				actionButton(c, "Kaufen · " .. GameUI.Format(a.Price), C.green, money >= a.Price, function() result(options.Invoke("aura", "buy", a.Id)) end)
			end
		end
	else
		for i, r in ipairs(ShopData.Robux) do
			local c = card(list)
			c.LayoutOrder = i
			icon(r.Id == "release" and "egg" or r.Id == "vip" and "star" or "coins", { Size = UDim2.new(0, 48, 0, 48), Position = UDim2.new(0.5, 0, 0, 2), AnchorPoint = Vector2.new(0.5, 0), Parent = c })
			label({ Size = UDim2.new(1, 0, 0, 22), Position = UDim2.new(0, 0, 0, 56), Text = r.Name, Font = FONT, TextSize = T.Large, Parent = c })
			label({ Size = UDim2.new(1, 0, 0, 52), Position = UDim2.new(0, 0, 0, 80), Text = r.Text, TextSize = T.Tiny, TextColor3 = C.muted, TextWrapped = true, Font = TEXT, Parent = c })
			if r.Badge then
				new("TextLabel", { Size = UDim2.new(0, 80, 0, 22), Position = UDim2.new(1, 6, 0, -18), AnchorPoint = Vector2.new(1, 0), BackgroundColor3 = C.red, Text = r.Badge, Font = BODY, TextSize = T.Tiny, TextColor3 = Color3.new(1, 1, 1), ZIndex = 2, Parent = c }, { corner(R.Round) })
			end
			actionButton(c, "R$ " .. r.Robux, C.green, true, function() result(options.Invoke("robux", r.Id)) end)
		end
	end
end

-- ── Fenster: Gerüst mit Kopf, Reitern und Inhalt (Shop, Inventar, Welten) ──
local function clear(frame)
	for _, c in ipairs(frame:GetChildren()) do
		if c:IsA("GuiObject") then c:Destroy() end
	end
end

local function buildWindow(playerGui, key, iconName, title, tabs, fill)
	local w = { key = key, tabs = tabs, fill = fill, buttons = {}, tabLabels = {}, tab = tabs[1] and tabs[1][1] }
	local gui = new("ScreenGui", { Name = "Coinmaster" .. title, ResetOnSpawn = false, DisplayOrder = 5, Enabled = false, Parent = playerGui })
	local dim = new("TextButton", { Name = "Abdunkeln", Size = UDim2.new(1, 0, 1, 0), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0.45, Text = "", AutoButtonColor = false, Parent = gui })
	w.dim = dim
	dim.Activated:Connect(function() GameUI.Close(key) end)
	local win = new("Frame", { Name = "Fenster", Size = UDim2.new(0.84, 0, 0.84, 0), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundColor3 = C.bg, Parent = gui }, {
		corner(R.XL),
		stroke(C.gold, 3),
	})
	w.win = win
	w.limit = new("UISizeConstraint", { MaxSize = Vector2.new(980, 640), Parent = win })
	w.baseScale = 1 -- am Handy kleiner, damit mehr hineinpasst
	w.scale = new("UIScale", { Scale = 1, Parent = win })
	local head = new("Frame", { Name = "Kopf", Size = UDim2.new(1, -40, 0, 64), Position = UDim2.new(0, 20, 0, 14), BackgroundTransparency = 1, Parent = win })
	new("Frame", { Size = UDim2.new(0, 56, 0, 56), BackgroundColor3 = C.gold, Parent = head }, {
		corner(R.M),
		gradient(C.goldHi, C.goldDark),
		icon(iconName, { Size = UDim2.new(0, 40, 0, 40), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5) }),
	})
	label({ Size = UDim2.new(0.5, 0, 0, 34), Position = UDim2.new(0, 70, 0, 2), Text = title, Font = FONT, TextSize = T.Hero, TextXAlignment = Enum.TextXAlignment.Left, Parent = head })
	w.sub = label({ Size = UDim2.new(0.6, 0, 0, 18), Position = UDim2.new(0, 70, 0, 38), Text = "", TextSize = T.Small, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Font = MONO, Parent = head })
	-- Werkzeuge rechts im Kopf (z. B. „Zum Spawn“)
	w.tools = new("Frame", { Name = "Werkzeuge", Size = UDim2.new(0, 360, 0, 38), Position = UDim2.new(1, -58, 0, 8), AnchorPoint = Vector2.new(1, 0), BackgroundTransparency = 1, Parent = head }, {
		new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, HorizontalAlignment = Enum.HorizontalAlignment.Right, Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
	})
	local close = new("TextButton", { Name = "Schliessen", Size = UDim2.new(0, 46, 0, 46), Position = UDim2.new(1, 0, 0, 4), AnchorPoint = Vector2.new(1, 0), BackgroundColor3 = C.red, Text = "✕", Font = BODY, TextSize = T.Big, TextColor3 = Color3.new(1, 1, 1), Parent = head }, { corner(R.S) })
	pressable(close, function() GameUI.Close(key) end)
	local row = new("Frame", { Name = "Reiter", Size = UDim2.new(1, -40, 0, 40), Position = UDim2.new(0, 20, 0, 88), BackgroundTransparency = 1, Parent = win }, {
		new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
	})
	for i, t in ipairs(tabs) do
		local b = new("TextButton", { Name = t[1], Size = UDim2.new(0, (t[3] or 132) + (t[4] and 24 or 0), 1, 0), BackgroundColor3 = C.bg2, Text = t[4] and "" or t[2], Font = FONT, TextSize = T.Medium, TextColor3 = C.ink, LayoutOrder = i, Parent = row }, { corner(R.Round) })
		if t[4] then
			-- Icon links, Text daneben
			icon(t[4], { Size = UDim2.new(0, 24, 0, 24), Position = UDim2.new(0, 14, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), Parent = b })
			w.tabLabels[t[1]] = label({ Size = UDim2.new(1, -50, 1, 0), Position = UDim2.new(0, 42, 0, 0), Text = t[2], Font = FONT, TextSize = T.Medium, TextXAlignment = Enum.TextXAlignment.Left, Parent = b })
		end
		w.buttons[t[1]] = b
		pressable(b, function()
			w.tab = t[1]
			w.keep = {}
			if w.onTab then w.onTab(t[1]) end
			GameUI.Refresh(key)
		end)
	end
	-- ohne Reiter beginnt der Inhalt direkt unter dem Kopf
	local top = #tabs > 0 and 140 or 92
	w.body = new("Frame", { Name = "Inhalt", Size = UDim2.new(1, -40, 1, -top - 10), Position = UDim2.new(0, 20, 0, top), BackgroundTransparency = 1, Parent = win })
	w.gui = gui
	w.keep = {}
	windows[key] = w
	return w
end

-- Bildlauf, der beim Neuaufbau (gleicher Reiter) an seiner Stelle bleibt
local function scroller(w, parent, name, props, children)
	local base = { Name = name, BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 8, ScrollBarImageColor3 = C.gold, AutomaticCanvasSize = Enum.AutomaticSize.Y, CanvasSize = UDim2.new(0, 0, 0, 0), Parent = parent }
	for k, v in pairs(props) do base[k] = v end
	local sf = new("ScrollingFrame", base, children)
	sf.CanvasPosition = w.keep[name] or Vector2.new(0, 0)
	return sf
end

-- ── Neu füllen: nur wenn nötig, höchstens einmal pro Bild ──
-- w.deps: wovon ein Fenster abhängt (Attribute, "Präfix_", "@taler", "@inventory", "@weather").
-- Ändern sich andere Werte, bleibt das Fenster stehen. Countdowns ändern nur ihren Text (w.tick).
local invVersion = 0
local function signature(w)
	if not w.deps then return "" end
	local parts = {}
	for _, d in ipairs(w.deps) do
		if d == "@taler" then
			table.insert(parts, tostring(taler()))
		elseif d == "@inventory" then
			table.insert(parts, tostring(invVersion))
		elseif d == "@weather" then
			table.insert(parts, tostring(ReplicatedStorage:GetAttribute("Weather")))
		elseif string.sub(d, -1) == "_" then
			local keys = {}
			for name, value in pairs(player:GetAttributes()) do
				if string.sub(name, 1, #d) == d then table.insert(keys, name .. "=" .. tostring(value)) end
			end
			table.sort(keys)
			table.insert(parts, table.concat(keys, ";"))
		else
			table.insert(parts, tostring(player:GetAttribute(d)))
		end
	end
	return table.concat(parts, "|")
end

local function rebuild(w)
	for _, t in ipairs(w.tabs) do
		local on = t[1] == w.tab
		w.buttons[t[1]].BackgroundColor3 = on and C.gold or C.bg2
		w.buttons[t[1]].TextColor3 = on and C.goldInk or C.ink
		if w.tabLabels[t[1]] then w.tabLabels[t[1]].TextColor3 = on and C.goldInk or C.ink end
	end
	-- Bildlauf merken, dann neu füllen
	for _, d in ipairs(w.body:GetDescendants()) do
		if d:IsA("ScrollingFrame") then w.keep[d.Name] = d.CanvasPosition end
	end
	w.sig = signature(w)
	w.tick = nil
	w.builds = (w.builds or 0) + 1
	w.fill(w)
end

local queued = {}
local function schedule(w, force)
	if force then w.force = true end
	if queued[w] then return end
	queued[w] = true
	task.defer(function()
		queued[w] = nil
		local open = w.gui.Enabled and not w.closing
		if open and not w.busy and (w.force or signature(w) ~= w.sig) then
			rebuild(w)
		end
		w.force = false
	end)
end

-- Fenster neu füllen (nach einer Aktion im Fenster); mehrere Aufrufe im selben Bild zählen einmal
function GameUI.Refresh(key)
	local w = windows[key]
	if w then schedule(w, true) end
end
-- Spielstand hat sich geändert: nur Fenster, deren Daten betroffen sind
local function refreshWindows()
	for _, w in pairs(windows) do
		if w.gui.Enabled then schedule(w, false) end
	end
end
-- Countdowns in offenen Fenstern (jede Sekunde)
local function tickWindows()
	for _, w in pairs(windows) do
		if w.gui.Enabled and not w.closing and w.tick then
			local ok, err = pcall(w.tick)
			if not ok then warn("GameUI tick: " .. tostring(err)) end
		end
	end
end

function GameUI.Open(key, tab)
	local w = windows[key]
	if not w then return end
	for other, o in pairs(windows) do
		if other ~= key then
			o.gui.Enabled = false
			o.closing = false
		end
	end
	local wasOpen = w.gui.Enabled and not w.closing
	if tab and w.buttons[tab] then
		w.tab = tab
	elseif w.defaultTab and not wasOpen then
		w.tab = w.defaultTab()
	end
	w.keep = {}
	if w.onTab then w.onTab(w.tab) end
	w.closing = false
	w.gui.Enabled = true
	if not wasOpen then
		w.dim.BackgroundTransparency = 1
		TweenService:Create(w.dim, M.Normal, { BackgroundTransparency = 0.45 }):Play()
		if Juice.calm() then
			w.scale.Scale = w.baseScale
		else
			-- springt aus der Mitte auf und federt nach, dabei kippt es kurz
			w.scale.Scale = 0.6 * w.baseScale
			TweenService:Create(w.scale, TweenInfo.new(0.5, Enum.EasingStyle.Elastic, Enum.EasingDirection.Out, 0, false, 0), { Scale = w.baseScale }):Play()
			local frame = w.scale.Parent
			if frame and frame:IsA("GuiObject") then
				frame.Rotation = -4
				TweenService:Create(frame, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Rotation = 0 }):Play()
			end
		end
	end
	rebuild(w)
end
-- Schließen mit kurzer Animation (schneller als das Öffnen)
local function hide(w)
	if not w.gui.Enabled or w.closing then return end
	w.closing = true
	TweenService:Create(w.scale, M.Exit, { Scale = 0.9 * w.baseScale }):Play()
	TweenService:Create(w.dim, M.Exit, { BackgroundTransparency = 1 }):Play()
	task.delay(Theme.ExitTime, function()
		if w.closing then
			w.gui.Enabled = false
			w.closing = false
		end
	end)
end
function GameUI.Close(key)
	if key == nil then
		for _, w in pairs(windows) do hide(w) end
	elseif windows[key] then
		hide(windows[key])
	end
end
-- wie oft ein Fenster neu gebaut wurde (zum Prüfen)
function GameUI.Builds(key)
	return windows[key] and windows[key].builds or 0
end
function GameUI.IsOpen(key)
	if key == nil then
		for _, w in pairs(windows) do
			if w.gui.Enabled and not w.closing then return true end
		end
		return false
	end
	local w = windows[key]
	return w ~= nil and w.gui.Enabled and not w.closing
end
function GameUI.Toggle(key, tab)
	if GameUI.IsOpen(key) and not tab then
		GameUI.Close(key)
	else
		GameUI.Open(key, tab)
	end
end

-- ── Shop ──
local function buildShop(playerGui)
	local w = buildWindow(playerGui, "shop", "shop", "Shop", TABS, fillShop)
	ui.shopList = new("ScrollingFrame", { Name = "Inhalt", Size = UDim2.new(1, 16, 1, 0), Position = UDim2.new(0, -8, 0, 0), BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 8, ScrollBarImageColor3 = C.gold, AutomaticCanvasSize = Enum.AutomaticSize.Y, CanvasSize = UDim2.new(0, 0, 0, 0), Parent = w.body }, {
		new("UIGridLayout", { CellSize = UDim2.new(0, 200, 0, 236), CellPadding = UDim2.new(0, 12, 0, 12), HorizontalAlignment = Enum.HorizontalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder }),
		new("UIPadding", { PaddingTop = UDim.new(0, 12), PaddingBottom = UDim.new(0, 12), PaddingLeft = UDim.new(0, 8), PaddingRight = UDim.new(0, 8) }),
	})
	w.onTab = function()
		ui.shopList.CanvasPosition = Vector2.new(0, 0)
	end
end
function GameUI.OpenShop(tab) GameUI.Open("shop", tab) end
function GameUI.CloseShop() GameUI.Close("shop") end
function GameUI.IsShopOpen() return GameUI.IsOpen("shop") end

-- ── Inventar ──
local SORTS = { { "neu", "Neueste zuerst" }, { "wert", "Höchster Wert" }, { "selten", "Seltenste" }, { "name", "Name" } }
ui.invSort, ui.invTier, ui.invMut = 1, 0, false

-- Münz-Inventar: Stapel vom Server (InventoryEvent: erst alles, danach nur Änderungen)
-- Stapel { k = Schlüssel, i = Münz-Id, m = Mutation, n = Anzahl, v = Wert aller zusammen, t = neuester Fund }
local inventory = {}
function GameUI.ApplyInventory(kind, a, b)
	if kind == "full" then
		if type(a) == "string" then a = HttpService:JSONDecode(a) end
		inventory = {}
		for _, st in ipairs(a or {}) do inventory[st.k] = st end
	elseif kind == "set" then
		if type(b) == "string" then b = HttpService:JSONDecode(b) end
		inventory[a] = b
	end
	if ui.invSel and not inventory[ui.invSel] then ui.invSel = nil end
	invVersion = invVersion + 1
	refreshWindows()
end

local function coinEntries()
	local out = {}
	for key, st in pairs(inventory) do
		local coin = CoinData.Coins[st.i]
		if coin and st.n > 0 then
			table.insert(out, {
				Key = key, Coin = coin, Tier = CoinData.TierById[coin.Tier], Mutation = st.m and MutationData.ById[st.m] or nil,
				At = st.t or 0, Count = st.n, Total = st.v, Value = math.floor(st.v / st.n * 100 + 0.5) / 100,
			})
		end
	end
	return out
end
local function coinTotal(entries)
	local n = 0
	for _, e in ipairs(entries) do n = n + e.Count end
	return n
end

local function firstLetter(text)
	return text:match("^[%z\\1-\\127\\194-\\244][\\128-\\191]*") or "?"
end

-- Münze aus Frames: Metall-Verlauf, Rand in Stufenfarbe, innerer Ring, Anfangsbuchstabe
local function coinDisc(parent, entry, size, position)
	local metal = entry.Coin.Metal
	local disc = new("Frame", { Name = "Muenze", Size = UDim2.new(0, size, 0, size), Position = position, AnchorPoint = Vector2.new(0.5, 0), BackgroundColor3 = Color3.new(1, 1, 1), Parent = parent }, {
		corner(R.Round),
		stroke(entry.Tier.Color, math.max(2, size / 22)),
		new("UIGradient", { Rotation = 45, Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, metal.Light), ColorSequenceKeypoint.new(0.5, metal.Mid), ColorSequenceKeypoint.new(1, metal.Dark) }) }),
	})
	new("Frame", { Name = "Ring", Size = UDim2.new(0.72, 0, 0.72, 0), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundTransparency = 1, Parent = disc }, {
		corner(R.Round),
		stroke(metal.Dark, math.max(1, size / 40)),
	})
	label({ Size = UDim2.new(1, 0, 1, 0), Text = firstLetter(entry.Coin.Name), Font = FONT, TextSize = size * 0.42, TextColor3 = metal.Dark, Parent = disc })
	if entry.Mutation then
		new("Frame", { Name = "Mutation", Size = UDim2.new(0, size * 0.26, 0, size * 0.26), Position = UDim2.new(0.86, 0, 0.02, 0), AnchorPoint = Vector2.new(0.5, 0), BackgroundColor3 = entry.Mutation.Color, ZIndex = 2, Parent = disc }, {
			corner(R.Round),
			stroke(C.bg, 2),
		})
	end
	return disc
end

local function pill(parent, text, color, y)
	local width = math.max(60, utf8.len(text) * 8 + 22)
	return new("TextLabel", { Size = UDim2.new(0, width, 0, 22), Position = UDim2.new(0.5, 0, 0, y), AnchorPoint = Vector2.new(0.5, 0), BackgroundColor3 = color, BackgroundTransparency = 0.75, Text = text, TextColor3 = color, Font = BODY, TextSize = T.Tiny, Parent = parent }, {
		corner(R.Round),
		stroke(color, 1),
	})
end

local function smallButton(parent, text, order, width, onClick, on)
	local b = new("TextButton", { Size = UDim2.new(0, width, 0, 34), BackgroundColor3 = on and C.gold or C.bg2, Text = text, Font = BODY, TextSize = T.Small, TextColor3 = on and C.goldInk or C.ink, LayoutOrder = order, Parent = parent }, {
		corner(R.S),
		stroke(C.line, 1),
	})
	pressable(b, onClick)
	return b
end

local function sell(key, count, button)
	local ok, text
	if key == nil then
		ok, text = options.Invoke("sellNormal")
	else
		ok, text = options.Invoke("sell", key, count)
	end
	if result(ok, text) then
		if button then GameUI.FlyCoins(button, math.min(8, (count or 6) + 2)) end
		GameUI.Refresh("inventar")
	end
end

local function fillCoins(w, entries)
	local cap = attr("Slots", 30)
	local total = coinTotal(entries)
	local full = total >= cap
	local main = new("Frame", { Name = "Muenzen", Size = UDim2.new(1, -276, 1, 0), BackgroundTransparency = 1, Parent = w.body })
	local bar = new("Frame", { Name = "Werkzeuge", Size = UDim2.new(1, 0, 0, 36), BackgroundTransparency = 1, Parent = main }, {
		new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, VerticalAlignment = Enum.VerticalAlignment.Center, Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
	})
	label({ Size = UDim2.new(0, 130, 1, 0), Text = total .. " / " .. cap .. " Plätze" .. (full and " · voll" or ""), Font = FONT, TextSize = T.Medium, TextColor3 = full and C.red or C.ink, TextXAlignment = Enum.TextXAlignment.Left, LayoutOrder = 1, Parent = bar })
	smallButton(bar, "↕ " .. SORTS[ui.invSort][2], 2, 150, function()
		ui.invSort = ui.invSort % #SORTS + 1
		w.keep = {}
		GameUI.Refresh("inventar")
	end)
	local tierName = ui.invTier == 0 and "Alle Stufen" or CoinData.Tiers[ui.invTier].Name
	smallButton(bar, "◆ " .. tierName, 3, 130, function()
		ui.invTier = (ui.invTier + 1) % (#CoinData.Tiers + 1)
		w.keep = {}
		GameUI.Refresh("inventar")
	end)
	smallButton(bar, (ui.invMut and "☑" or "☐") .. " Nur Mutationen", 4, 140, function()
		ui.invMut = not ui.invMut
		w.keep = {}
		GameUI.Refresh("inventar")
	end, ui.invMut)

	-- filtern und sortieren
	local list = {}
	for _, e in ipairs(entries) do
		if (ui.invTier == 0 or e.Tier.Index == ui.invTier) and (not ui.invMut or e.Mutation) then
			table.insert(list, e)
		end
	end
	local by = SORTS[ui.invSort][1]
	table.sort(list, function(a, b)
		if by == "wert" and a.Value ~= b.Value then return a.Value > b.Value end
		if by == "selten" and a.Tier.Index ~= b.Tier.Index then return a.Tier.Index > b.Tier.Index end
		if by == "selten" and a.Value ~= b.Value then return a.Value > b.Value end
		if by == "name" and a.Coin.Name ~= b.Coin.Name then return a.Coin.Name < b.Coin.Name end
		if a.At ~= b.At then return a.At > b.At end
		return a.Key > b.Key
	end)

	if #list == 0 then
		label({ Size = UDim2.new(1, 0, 0, 80), Position = UDim2.new(0, 0, 0, 60), Text = #entries > 0 and "Keine Münze passt zum Filter." or "Noch keine Münzen. Mit „Münze suchen“ findest du welche.", TextColor3 = C.muted, TextSize = T.Body, TextWrapped = true, Parent = main })
	else
		local grid = scroller(w, main, "Raster", { Size = UDim2.new(1, 8, 1, -46), Position = UDim2.new(0, 0, 0, 46) }, {
			new("UIGridLayout", { CellSize = UDim2.new(0, 104, 0, 128), CellPadding = UDim2.new(0, 10, 0, 10), SortOrder = Enum.SortOrder.LayoutOrder }),
			new("UIPadding", { PaddingTop = UDim.new(0, 4), PaddingBottom = UDim.new(0, 8), PaddingLeft = UDim.new(0, 2), PaddingRight = UDim.new(0, 12) }),
		})
		for order, e in ipairs(list) do
			local selected = ui.invSel == e.Key
			local cell = new("TextButton", { Name = "Muenze" .. order, BackgroundColor3 = C.bg2, Text = "", AutoButtonColor = false, LayoutOrder = order, Parent = grid }, {
				corner(R.M),
				stroke(selected and C.goldHi or e.Tier.Color, selected and 3 or 1.5),
			})
			coinDisc(cell, e, 62, UDim2.new(0.5, 0, 0, 8))
			label({ Size = UDim2.new(1, -10, 0, 18), Position = UDim2.new(0, 5, 0, 76), Text = e.Coin.Name, TextScaled = true, Font = BODY, Parent = cell })
			label({ Size = UDim2.new(1, -10, 0, 18), Position = UDim2.new(0, 5, 0, 98), Text = GameUI.Format(e.Value), TextSize = T.Small, Font = MONO, TextColor3 = C.goldHi, Parent = cell })
			if e.Count > 1 then
				new("TextLabel", { Name = "Anzahl", Size = UDim2.new(0, 34, 0, 20), Position = UDim2.new(1, -4, 0, 4), AnchorPoint = Vector2.new(1, 0), BackgroundColor3 = C.bg, Text = "×" .. e.Count, Font = BODY, TextSize = T.Tiny, TextColor3 = C.ink, ZIndex = 3, Parent = cell }, { corner(R.Round), stroke(e.Tier.Color, 1) })
			end
			pressable(cell, function()
				ui.invSel = e.Key
				GameUI.Refresh("inventar")
			end)
		end
	end

	-- Seitenleiste: gewählte Münze und Verkaufen
	local side = new("Frame", { Name = "Auswahl", Size = UDim2.new(0, 262, 1, 0), Position = UDim2.new(1, -262, 0, 0), BackgroundColor3 = C.bg2, Parent = w.body }, {
		corner(R.L),
		stroke(C.line, 2),
		new("UIPadding", { PaddingLeft = UDim.new(0, 14), PaddingRight = UDim.new(0, 14), PaddingTop = UDim.new(0, 14), PaddingBottom = UDim.new(0, 14) }),
	})
	local sel = nil
	for _, e in ipairs(entries) do
		if e.Key == ui.invSel then sel = e end
	end
	if sel then
		GameUI.CoinView(side, sel, 92, UDim2.new(0.5, 0, 0, -6), true)
		pill(side, sel.Tier.Name, sel.Tier.Color, 90)
		label({ Size = UDim2.new(1, 0, 0, 24), Position = UDim2.new(0, 0, 0, 116), Text = sel.Coin.Name, Font = FONT, TextScaled = true, Parent = side })
		local y = 144
		if sel.Mutation then
			pill(side, sel.Mutation.Name .. " ×" .. tostring(sel.Mutation.Multiplier):gsub("%.", ","), sel.Mutation.Color, y)
			y = y + 28
		end
		label({ Size = UDim2.new(1, 0, 0, 32), Position = UDim2.new(0, 0, 0, y), Text = sel.Coin.Text, TextSize = T.Tiny, TextWrapped = true, TextColor3 = C.muted, Font = TEXT, Parent = side })
		label({ Size = UDim2.new(1, 0, 0, 18), Position = UDim2.new(0, 0, 0, y + 34), Text = (sel.Count > 1 and (sel.Count .. " Stück · je ") or "Wert: ") .. GameUI.Format(sel.Value) .. " Taler", TextSize = T.Small, TextColor3 = C.goldHi, Parent = side })
		-- eine verkaufen oder den ganzen Stapel
		local row = new("Frame", { Name = "Verkaufen", Size = UDim2.new(1, 0, 0, 40), Position = UDim2.new(0, 0, 1, -110), BackgroundTransparency = 1, Parent = side })
		local one = new("Frame", { Size = UDim2.new(sel.Count > 1 and 0.5 or 1, sel.Count > 1 and -4 or 0, 1, 0), BackgroundTransparency = 1, Parent = row })
		local b
		b = actionButton(one, "Verkaufen · " .. GameUI.Format(sel.Value), C.green, true, function() sell(sel.Key, 1, b) end)
		b.Size = UDim2.new(1, 0, 1, 0)
		if sel.Count > 1 then b.TextSize = T.Small end
		if sel.Count > 1 then
			local stack = new("Frame", { Size = UDim2.new(0.5, -4, 1, 0), Position = UDim2.new(0.5, 4, 0, 0), BackgroundTransparency = 1, Parent = row })
			local all
			all = actionButton(stack, "Alle ×" .. sel.Count .. " · " .. GameUI.Format(sel.Total), C.green, true, function() sell(sel.Key, sel.Count, all) end)
			all.Size = UDim2.new(1, 0, 1, 0)
			all.TextSize = T.Small
		end
	else
		icon("coin", { Size = UDim2.new(0, 46, 0, 46), Position = UDim2.new(0.5, 0, 0, 32), AnchorPoint = Vector2.new(0.5, 0), Parent = side })
		label({ Size = UDim2.new(1, 0, 0, 60), Position = UDim2.new(0, 0, 0, 84), Text = "Wähle eine Münze, um sie dir anzusehen oder zu verkaufen.", TextSize = T.Small, TextWrapped = true, TextColor3 = C.muted, Parent = side })
	end
	local normal = 0
	for _, e in ipairs(entries) do
		if e.Tier.Index == 1 and not e.Mutation then normal = normal + e.Count end
	end
	local all
	all = actionButton(side, "Alle normalen verkaufen (" .. normal .. ")", C.blue, normal > 0, function() sell(nil, normal, all) end)
	all.Position = UDim2.new(0, 0, 1, -62)
	all.TextSize = T.Body
	label({ Size = UDim2.new(1, 0, 0, 16), Position = UDim2.new(0, 0, 1, -16), Text = "Münzen mit Mutation bleiben im Inventar.", TextSize = T.Tiny, TextColor3 = C.muted, Font = TEXT, Parent = side })
end

local function fillEggs(w)
	local list = scroller(w, w.body, "Eier", { Size = UDim2.new(1, 8, 1, -50) }, {
		new("UIListLayout", { Padding = UDim.new(0, 10), SortOrder = Enum.SortOrder.LayoutOrder }),
		new("UIPadding", { PaddingRight = UDim.new(0, 14) }),
	})
	local any = false
	for i, egg in ipairs(EggData.Eggs) do
		local n = attr("Egg_" .. egg.Id, 0)
		if n > 0 then
			any = true
			local row = new("Frame", { Name = egg.Id, Size = UDim2.new(1, 0, 0, 70), BackgroundColor3 = C.bg2, LayoutOrder = i, Parent = list }, {
				corner(R.M),
				stroke(egg.Glow, 2),
			})
			GameUI.EggView(row, egg, UDim2.new(0, 62, 0, 62), UDim2.new(0, 40, 0.5, -31), 1.35)
			label({ Size = UDim2.new(0.6, 0, 0, 24), Position = UDim2.new(0, 76, 0, 12), Text = egg.Name, Font = FONT, TextSize = T.Large, TextXAlignment = Enum.TextXAlignment.Left, Parent = row })
			label({ Size = UDim2.new(0.6, 0, 0, 18), Position = UDim2.new(0, 76, 0, 38), Text = egg.RankName, TextSize = T.Small, TextColor3 = egg.Glow, TextXAlignment = Enum.TextXAlignment.Left, Parent = row })
			label({ Size = UDim2.new(0, 90, 1, 0), Position = UDim2.new(1, -106, 0, 0), Text = "×" .. n, Font = FONT, TextSize = T.Title, TextColor3 = C.goldHi, TextXAlignment = Enum.TextXAlignment.Right, Parent = row })
		end
	end
	if not any then
		label({ Size = UDim2.new(1, 0, 0, 40), Text = "Noch keine Eier. Im Shop gibt es welche.", TextSize = T.Body, TextColor3 = C.muted, Parent = list })
	end
	label({ Size = UDim2.new(1, -190, 0, 40), Position = UDim2.new(0, 0, 1, -40), Text = "Eier schlüpfen im Spiel nach einer Brutzeit.", TextSize = T.Small, TextWrapped = true, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Font = TEXT, Parent = w.body })
	local shop = new("TextButton", { Name = "ZumShop", Size = UDim2.new(0, 170, 0, 40), Position = UDim2.new(1, 0, 1, 0), AnchorPoint = Vector2.new(1, 1), BackgroundColor3 = C.green, Text = "Eier kaufen", Font = FONT, TextSize = T.Medium, TextColor3 = Color3.new(1, 1, 1), Parent = w.body }, { corner(R.S) })
	pressable(shop, function() GameUI.Open("shop", "eier") end)
end

local function fillInventory(w)
	clear(w.body)
	clear(w.tools)
	local entries = coinEntries()
	local eggs = 0
	for _, egg in ipairs(EggData.Eggs) do
		eggs = eggs + attr("Egg_" .. egg.Id, 0)
	end
	w.sub.Text = coinTotal(entries) .. " Münzen · " .. eggs .. " Eier"
	if w.tab == "eier" then
		fillEggs(w)
	elseif w.tab == "tiere" then
		label({ Size = UDim2.new(1, -80, 0, 80), Position = UDim2.new(0, 40, 0, 60), Text = "Hier erscheinen deine geschlüpften Haustiere mit ihrem Bonus, sobald das Schlüpfen im Spiel läuft.", TextSize = T.Body, TextWrapped = true, TextColor3 = C.muted, Parent = w.body })
	else
		fillCoins(w, entries)
	end
end

local function buildInventory(playerGui)
	buildWindow(playerGui, "inventar", "bag", "Inventar", { { "muenzen", "Münzen", 120, "coin" }, { "eier", "Eier", 100, "egg" }, { "tiere", "Haustiere", 136, "paw" } }, fillInventory)
end
function GameUI.OpenInventory(tab) GameUI.Open("inventar", tab) end

-- ── Welten ──
local function worldState()
	return {
		Owned = WorldData.ParseList(attr("Worlds", "")),
		Portals = WorldData.ParseList(attr("Portals", "p1")),
		Taler = taler(),
		Rebirths = attr("Rebirths", 0),
	}
end
local function decimal(n)
	local text = string.format("%.2f", n):gsub("0+$", ""):gsub("%.$", "")
	return (text:gsub("%.", ","))
end

local function toolButton(parent, text, order, enabled, onClick)
	local b = new("TextButton", { Size = UDim2.new(0, 132, 1, 0), BackgroundColor3 = C.bg2, Text = text, Font = BODY, TextSize = T.Small, TextColor3 = C.ink, AutoButtonColor = enabled, LayoutOrder = order, Parent = parent }, {
		corner(R.S),
		stroke(C.line, 1),
	})
	if not enabled then b.TextTransparency = 0.5 end
	pressable(b, function()
		if enabled then onClick() end
	end)
	return b
end

local function worldCard(parent, st, world, number, order, here)
	local owned = WorldData.Owns(st, world.Id)
	local accent = world.Accent or C.line
	local c = card(parent, here and C.goldHi or (owned and accent or C.line))
	c.Name = world.Id
	c.LayoutOrder = order
	local img = new("Frame", { Name = "Bild", Size = UDim2.new(1, 0, 0, 92), BackgroundColor3 = Color3.new(1, 1, 1), Parent = c }, {
		corner(R.S),
	})
	if world.ComingSoon then
		img.BackgroundColor3 = C.line
		label({ Size = UDim2.new(1, 0, 1, 0), Text = "?", Font = FONT, TextSize = 46, TextColor3 = C.muted, Parent = img })
		label({ Size = UDim2.new(1, 0, 0, 16), Position = UDim2.new(0, 0, 0, 98), Text = "···", TextSize = T.Tiny, TextColor3 = C.muted, Font = MONO, Parent = c })
		label({ Size = UDim2.new(1, 0, 0, 24), Position = UDim2.new(0, 0, 0, 116), Text = "Coming soon", Font = FONT, TextSize = T.Large, Parent = c })
		label({ Size = UDim2.new(1, 0, 0, 30), Position = UDim2.new(0, 0, 0, 142), Text = "Kommt mit einem späteren Update.", TextSize = T.Tiny, TextWrapped = true, TextColor3 = C.muted, Font = TEXT, Parent = c })
		actionButton(c, "Bald", C.line, false, function() end)
		return c
	end
	new("UIGradient", { Rotation = 120, Color = ColorSequence.new(world.Ground, accent), Parent = img })
	GameUI.WorldView(img, world)
	if here then
		new("TextLabel", { Size = UDim2.new(0, 100, 0, 22), Position = UDim2.new(0, 8, 0, 8), BackgroundColor3 = C.gold, Text = "Du bist hier", Font = BODY, TextSize = T.Tiny, TextColor3 = C.goldInk, Parent = img }, { corner(R.Round) })
	end
	label({ Size = UDim2.new(1, 0, 0, 16), Position = UDim2.new(0, 0, 0, 98), Text = "Welt " .. number, TextSize = T.Tiny, TextColor3 = C.muted, Font = MONO, Parent = c })
	label({ Size = UDim2.new(1, 0, 0, 24), Position = UDim2.new(0, 0, 0, 116), Text = world.Name, Font = FONT, TextScaled = true, Parent = c })
	local luck = world.Luck > 0 and ("+" .. decimal(world.Luck * 100) .. " %") or "±0 %"
	label({ Size = UDim2.new(1, 0, 0, 18), Position = UDim2.new(0, 0, 0, 146), Text = "🍀 " .. luck .. "    💎 ×" .. decimal(world.Value), TextSize = T.Small, TextColor3 = C.mint, Font = MONO, Parent = c })
	local why = WorldData.CanBuy(st, world.Id)
	if here then
		actionButton(c, "✔ Hier bist du", C.line, false, function() end)
	elseif owned then
		actionButton(c, "Teleportieren", C.blue, true, function()
			if result(options.Invoke("teleport", world.Id)) then GameUI.Close("welten") end
		end)
	elseif not why or why == "Zu wenig Taler" then
		local b = actionButton(c, "Kaufen · " .. GameUI.Format(world.Price), C.green, true, function()
			local now = worldState()
			local reason = WorldData.CanBuy(now, world.Id)
			if reason == "Zu wenig Taler" then
				result(false, "Dafür fehlen noch " .. GameUI.Format(math.ceil(world.Price - now.Taler)) .. " Taler")
			elseif result(options.Invoke("buyWorld", world.Id), nil, world.Accent or C.gold, "Neue Welt!") then
				GameUI.Close("welten")
			end
		end)
		if why then b.BackgroundTransparency = 0.45 end
	else
		local b = actionButton(c, why, C.line, false, function() end)
		b.TextScaled = true
	end
	return c
end

local function portalBanner(parent, st, planet)
	if not planet.Portal or st.Portals[planet.Id] then return 0 end
	local banner = new("Frame", { Name = "Portal", Size = UDim2.new(1, -12, 0, 112), Position = UDim2.new(0, 0, 0, 86), BackgroundColor3 = C.bg2, Parent = parent }, {
		corner(R.L),
		stroke(planet.Color, 2),
	})
	new("Frame", { Size = UDim2.new(0, 70, 0, 70), Position = UDim2.new(0, 18, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), BackgroundColor3 = planet.Color, BackgroundTransparency = 0.6, Parent = banner }, {
		corner(R.Round),
		stroke(planet.Color, 2),
		icon(planet.ComingSoon and "lock" or (planet.Id == "p2" and "rocket" or "portal"), { Size = UDim2.new(0, 40, 0, 40), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5) }),
	})
	if planet.ComingSoon then
		label({ Size = UDim2.new(1, -130, 0, 26), Position = UDim2.new(0, 106, 0, 24), Text = planet.Name .. " · Coming soon", Font = FONT, TextSize = T.Big, TextXAlignment = Enum.TextXAlignment.Left, Parent = banner })
		label({ Size = UDim2.new(1, -130, 0, 40), Position = UDim2.new(0, 106, 0, 52), Text = planet.Text .. " Kommt mit einem späteren Update.", TextSize = T.Small, TextWrapped = true, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Font = TEXT, Parent = banner })
		return 124
	end
	label({ Size = UDim2.new(1, -340, 0, 26), Position = UDim2.new(0, 106, 0, 10), Text = planet.Portal.Name .. " nach " .. planet.Name, Font = FONT, TextSize = T.Big, TextXAlignment = Enum.TextXAlignment.Left, Parent = banner })
	label({ Size = UDim2.new(1, -340, 0, 18), Position = UDim2.new(0, 106, 0, 36), Text = planet.Portal.Text, TextSize = T.Small, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Font = TEXT, Parent = banner })
	for i, check in ipairs(WorldData.PortalChecks(st, planet.Id)) do
		label({ Size = UDim2.new(1, -340, 0, 18), Position = UDim2.new(0, 106, 0, 40 + i * 22), Text = (check[2] and "✔ " or "🔒 ") .. check[1], TextSize = T.Small, TextColor3 = check[2] and C.green or C.ink, TextXAlignment = Enum.TextXAlignment.Left, Parent = banner })
	end
	local why = WorldData.CanOpenPortal(st, planet.Id)
	local holder = new("Frame", { Size = UDim2.new(0, 210, 0, 44), Position = UDim2.new(1, -20, 0.5, 22), AnchorPoint = Vector2.new(1, 0.5), BackgroundTransparency = 1, Parent = banner })
	actionButton(holder, why and "Noch verschlossen" or (planet.Portal.Name .. " starten"), C.green, why == nil, function()
		result(options.Invoke("portal", planet.Id), nil, planet.Color, "Portal offen!")
	end)
	return 124
end

local function fillPlanet(w, planet, st)
	new("Frame", { Name = "Planet", Size = UDim2.new(1, 0, 0, 78), BackgroundTransparency = 1, Parent = w.body }, {
		label({ Size = UDim2.new(1, 0, 0, 16), Text = GameUI.Upper(planet.Name), TextSize = T.Tiny, TextColor3 = planet.Color, TextXAlignment = Enum.TextXAlignment.Left, Font = MONO }),
		label({ Size = UDim2.new(1, 0, 0, 30), Position = UDim2.new(0, 0, 0, 16), Text = planet.Title, Font = FONT, TextSize = T.Title, TextXAlignment = Enum.TextXAlignment.Left }),
		label({ Size = UDim2.new(1, 0, 0, 30), Position = UDim2.new(0, 0, 0, 46), Text = planet.Text, TextSize = T.Small, TextWrapped = true, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, Font = TEXT }),
	})
	local top = 86 + portalBanner(w.body, st, planet)
	local grid = scroller(w, w.body, "Welten" .. planet.Id, { Size = UDim2.new(1, 8, 1, -top), Position = UDim2.new(0, -4, 0, top) }, {
		new("UIGridLayout", { CellSize = UDim2.new(0, 200, 0, 236), CellPadding = UDim2.new(0, 12, 0, 12), HorizontalAlignment = Enum.HorizontalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder }),
		new("UIPadding", { PaddingTop = UDim.new(0, 4), PaddingBottom = UDim.new(0, 12), PaddingLeft = UDim.new(0, 4), PaddingRight = UDim.new(0, 12) }),
	})
	local here = attr("World", "spawn")
	local n = 0
	for order, world in ipairs(WorldData.Worlds) do
		if world.Planet == planet.Id then
			if not world.ComingSoon then n = n + 1 end
			local c = worldCard(grid, st, world, n, order, here == world.Id)
			if not st.Portals[planet.Id] then
				-- Planet noch zu: Karten gedämpft
				c.BackgroundTransparency = 0.4
			end
		end
	end
end

local function fact(parent, title, value, color, order)
	return new("Frame", { BackgroundColor3 = C.bg2, LayoutOrder = order, Parent = parent }, {
		corner(R.S),
		label({ Size = UDim2.new(1, -20, 0, 16), Position = UDim2.new(0, 10, 0, 8), Text = title, TextSize = T.Tiny, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left }),
		label({ Size = UDim2.new(1, -20, 0, 26), Position = UDim2.new(0, 10, 0, 26), Text = value, Font = FONT, TextSize = T.Big, TextColor3 = color or C.ink, TextXAlignment = Enum.TextXAlignment.Left }),
	})
end

local function fillRebirth(w, st)
	local cost = WorldData.RebirthCost(st.Rebirths)
	local hero = new("Frame", { Name = "Wiedergeburten", Size = UDim2.new(0, 210, 1, 0), BackgroundColor3 = C.bg2, Parent = w.body }, {
		corner(R.L),
		stroke(C.goldHi, 2),
		gradient(C.cream, C.creamDark),
		icon("rebirth", { Size = UDim2.new(0, 56, 0, 56), Position = UDim2.new(0.5, 0, 0.5, -94), AnchorPoint = Vector2.new(0.5, 0) }),
		label({ Size = UDim2.new(1, 0, 0, 70), Position = UDim2.new(0, 0, 0.5, -34), Text = tostring(st.Rebirths), Font = FONT, TextSize = 64, TextColor3 = C.goldHi }),
		label({ Size = UDim2.new(1, 0, 0, 20), Position = UDim2.new(0, 0, 0.5, 40), Text = "Wiedergeburt" .. (st.Rebirths == 1 and "" or "en"), TextSize = T.Small, TextColor3 = C.muted }),
	})
	hero.BackgroundTransparency = 0
	local main = new("Frame", { Size = UDim2.new(1, -230, 1, 0), Position = UDim2.new(0, 230, 0, 0), BackgroundTransparency = 1, Parent = w.body })
	local facts = new("Frame", { Size = UDim2.new(1, 0, 0, 132), BackgroundTransparency = 1, Parent = main }, {
		new("UIGridLayout", { CellSize = UDim2.new(0.5, -6, 0, 60), CellPadding = UDim2.new(0, 12, 0, 12), SortOrder = Enum.SortOrder.LayoutOrder }),
	})
	fact(facts, "Münzwert jetzt", "×" .. decimal(WorldData.RebirthMultiplier(st.Rebirths)), nil, 1)
	fact(facts, "Nach der Wiedergeburt", "×" .. decimal(WorldData.RebirthMultiplier(st.Rebirths + 1)), C.green, 2)
	fact(facts, "Kosten", GameUI.Format(cost) .. " Taler", C.goldHi, 3)
	for _, p in ipairs(WorldData.Planets) do
		if p.Portal and not p.ComingSoon and p.Portal.Rebirths > st.Rebirths then
			fact(facts, p.Portal.Name, "ab " .. p.Portal.Rebirths .. " Wiedergeburt" .. (p.Portal.Rebirths > 1 and "en" or ""), nil, 4)
			break
		end
	end
	local pct = math.clamp(st.Taler / cost, 0, 1)
	local bar = new("Frame", { Name = "Fortschritt", Size = UDim2.new(1, 0, 0, 16), Position = UDim2.new(0, 0, 0, 146), BackgroundColor3 = C.bg2, Parent = main }, {
		corner(R.Round),
		stroke(C.line, 1),
	})
	new("Frame", { Size = UDim2.new(math.max(pct, 0.02), 0, 1, 0), BackgroundColor3 = C.gold, Parent = bar }, { corner(R.Round), gradient(C.goldHi, C.goldDark) })
	label({ Size = UDim2.new(1, 0, 0, 18), Position = UDim2.new(0, 0, 0, 168), Text = GameUI.Format(math.floor(st.Taler)) .. " von " .. GameUI.Format(cost) .. " Taler", TextSize = T.Small, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Font = MONO, Parent = main })
	local rules = {
		{ "✕ Deine Taler sind danach weg", C.red },
		{ "✔ Welten, Portale, Münzen, Eier, Level und Skills bleiben", C.ink },
		{ "✔ Jede Münze ist für immer " .. math.floor(WorldData.Rebirth.Bonus * 100 + 0.5) .. " % mehr wert", C.ink },
	}
	for i, r in ipairs(rules) do
		label({ Size = UDim2.new(1, 0, 0, 20), Position = UDim2.new(0, 0, 0, 180 + i * 24), Text = r[1], TextSize = T.Small, TextColor3 = r[2], TextXAlignment = Enum.TextXAlignment.Left, Parent = main })
	end
	local ready = st.Taler >= cost
	local holder = new("Frame", { Size = UDim2.new(0, 320, 0, 52), Position = UDim2.new(0, 0, 1, 0), AnchorPoint = Vector2.new(0, 1), BackgroundTransparency = 1, Parent = main })
	local armed = ui.rebirthArmed and os.clock() - ui.rebirthArmed < 3
	local text = not ready and ("Noch " .. GameUI.Format(math.ceil(cost - st.Taler)) .. " Taler") or (armed and "Sicher? Nochmal klicken" or "Wiedergeboren werden")
	local b = actionButton(holder, text, armed and C.red or C.gold, ready, function()
		if not (ui.rebirthArmed and os.clock() - ui.rebirthArmed < 3) then
			-- erst bestätigen lassen
			ui.rebirthArmed = os.clock()
			GameUI.Refresh("welten")
			task.delay(3, function() GameUI.Refresh("welten") end)
			return
		end
		ui.rebirthArmed = nil
		result(options.Invoke("rebirth"), nil, C.goldHi, "Wiedergeboren!")
		GameUI.Refresh("welten")
	end)
	b.Size = UDim2.new(1, 0, 1, 0)
	b.Position = UDim2.new(0, 0, 0, 0)
	b.TextSize = T.Large
end

local function fillWorlds(w)
	clear(w.body)
	clear(w.tools)
	local st = worldState()
	local here = WorldData.ById[attr("World", "spawn")]
	local inHub = not here or here.Planet == "hub"
	local planet = here and WorldData.PlanetById[here.Planet]
	w.sub.Text = (inHub and "Spawn" or (planet.Name .. " · " .. here.Name)) .. " · " .. GameUI.Format(st.Taler) .. " Taler"
	toolButton(w.tools, inHub and "Im Spawn" or "Zum Spawn", 1, not inHub, function()
		if result(options.Invoke("teleport", "spawn")) then GameUI.Close("welten") end
	end)
	if options.DevTools then
		toolButton(w.tools, "+ Test-Taler", 2, true, function()
			result(options.Invoke("testTaler"), nil, C.blue)
		end)
	end
	if w.tab == "wiedergeburt" then
		fillRebirth(w, st)
	else
		fillPlanet(w, WorldData.PlanetById[w.tab] or WorldData.Planets[1], st)
	end
end

local function buildWorlds(playerGui)
	local tabs = {}
	for _, p in ipairs(WorldData.Planets) do
		table.insert(tabs, { p.Id, p.Name, 120 })
	end
	table.insert(tabs, { "wiedergeburt", "Wiedergeburt", 160, "rebirth" })
	local w = buildWindow(playerGui, "welten", "globe", "Welten", tabs, fillWorlds)
	-- Standard-Reiter: Planet der aktuellen Welt
	w.defaultTab = function()
		local here = WorldData.ById[attr("World", "spawn")]
		return (here and here.Planet ~= "hub") and here.Planet or WorldData.Planets[1].Id
	end
end
function GameUI.OpenWorlds(tab) GameUI.Open("welten", tab) end
${GAME_UI_MORE}

-- ══ Anordnung je nach Bildschirm: am Handy Menü unten links, „Münze suchen“ groß unten rechts,
-- Fenster fast vollflächig und etwas kleiner skaliert. Gilt bei weniger als 900 × 560 Punkten. ══
local function applyLayout()
	local camera = workspace.CurrentCamera
	local vp = camera and camera.ViewportSize or Vector2.new(1280, 720)
	local compact = vp.X < 900 or vp.Y < 560
	local tiny = vp.Y < 430
	local narrow = vp.X < 600 -- hochkant (z. B. Vorschau am Handy)
	local key = tostring(compact) .. tostring(tiny) .. tostring(narrow) .. (narrow and tostring(math.floor(vp.X)) or "")
	if ui.layoutKey == key then return end
	ui.layoutKey = key
	ui.compact, ui.tiny = compact, tiny
	GameUI.Compact = compact
	-- Menü
	if compact then
		ui.menuLayout.FillDirection = Enum.FillDirection.Horizontal
		ui.menu.Size = UDim2.new(0, 7 * 72 + 6 * 8, 0, 62)
		ui.menu.Position = UDim2.new(0, 12, 1, -10)
		ui.menu.AnchorPoint = Vector2.new(0, 1)
		ui.menuScale.Scale = tiny and 0.78 or 0.88
		if narrow then
			-- ganze Breite nutzen
			ui.menuScale.Scale = math.min(0.88, (vp.X - 24) / (7 * 72 + 6 * 8))
		end
	else
		ui.menuLayout.FillDirection = Enum.FillDirection.Vertical
		ui.menu.Size = UDim2.new(0, 84, 0, 486)
		ui.menu.Position = UDim2.new(0, 16, 0.5, 20)
		ui.menu.AnchorPoint = Vector2.new(0, 0.5)
		ui.menuScale.Scale = 1
	end
	-- Münze suchen: groß unten rechts, gut mit dem Daumen erreichbar
	if narrow then
		-- über dem Menü in der Mitte
		ui.find.Size = UDim2.new(0, 220, 0, 56)
		ui.find.Position = UDim2.new(0.5, 0, 1, -(62 * ui.menuScale.Scale + 22))
		ui.find.AnchorPoint = Vector2.new(0.5, 1)
		ui.findHint.Visible = false
	elseif compact then
		ui.find.Size = UDim2.new(0, 210, 0, 60)
		ui.find.Position = UDim2.new(1, -12, 1, -10)
		ui.find.AnchorPoint = Vector2.new(1, 1)
		ui.findHint.Visible = false
	else
		ui.find.Size = UDim2.new(0, 270, 0, 64)
		ui.find.Position = UDim2.new(0.5, 0, 1, -34)
		ui.find.AnchorPoint = Vector2.new(0.5, 1)
		ui.findHint.Visible = true
	end
	ui.findLabel.TextSize = compact and T.Large or T.Title
	ui.findLabel.Position = UDim2.new(0, compact and 62 or 70, 0, 0)
	-- schmal: Welt-Name und Spieler-Feld ausblenden (das Level-Abzeichen bleibt)
	ui.world.Visible = not narrow
	ui.info.Visible = not narrow
	-- Kopfzeile schmaler
	ui.info.Size = UDim2.new(0, compact and 200 or 250, 0, 58)
	ui.xpText.Visible = not tiny
	ui.toasts.Position = compact and UDim2.new(0.5, 0, 1, -86) or UDim2.new(0.5, 0, 1, -118)
	ui.toasts.Size = UDim2.new(0, compact and 360 or 420, 0, 200)
	-- Fenster
	for _, w in pairs(windows) do
		if compact then
			w.limit.MaxSize = Vector2.new(math.huge, math.huge)
			w.baseScale = tiny and 0.78 or 0.9
			-- skaliert wird um die Mitte, also das Fenster um den Faktor größer machen
			w.win.Size = UDim2.new(1 / w.baseScale, -16 / w.baseScale, 1 / w.baseScale, -16 / w.baseScale)
		else
			w.win.Size = UDim2.new(0.84, 0, 0.84, 0)
			w.limit.MaxSize = Vector2.new(980, 640)
			w.baseScale = 1
		end
		if w.gui.Enabled and not w.closing then w.scale.Scale = w.baseScale end
	end
end
GameUI.ApplyLayout = applyLayout

-- ══ Spielgefühl: Zahlen zählen hoch, Münzen fliegen, Funde nach Seltenheit ══
local function setting(name, default)
	local v = player:GetAttribute("Set_" .. name)
	if v == nil then return default end
	return v
end
-- Zahl über die Zeit verändern (Quad Out); ein neuer Aufruf mit demselben Schlüssel ersetzt den alten
local counters = {}
local function animate(key, from, to, duration, apply)
	local token = {}
	counters[key] = token
	task.spawn(function()
		local start = os.clock()
		while counters[key] == token do
			local k = math.min(1, (os.clock() - start) / duration)
			apply(from + (to - from) * (1 - (1 - k) * (1 - k)))
			if k >= 1 then break end
			task.wait()
		end
	end)
end
local function centerOf(object)
	return object.AbsolutePosition + object.AbsoluteSize * 0.5
end


-- ══ 3D-Vorschauen: Modelle in einem ViewportFrame ══
-- Die Kamera rahmt das Modell nach seiner Größe ein. Drehen nur, wo es etwas bringt (gewählte Münze,
-- Fundkarte), damit das Spiel am Handy flüssig bleibt. Partikel zeigt ein ViewportFrame in Roblox nicht.
local builders = {}
local function builder(name)
	if builders[name] == nil then
		local module = root:FindFirstChild(name)
		local ok, result = pcall(function() return module and require(module) end)
		builders[name] = ok and result or false
	end
	return builders[name] or nil
end

-- options: Side = "X" (Münzen zeigen ihre Seite entlang X) oder "Z" (Modelle schauen nach −Z),
-- Spin = Grad pro Sekunde, Tilt = Blick von oben in Grad, Zoom = Abstand (1 = knapp)
function GameUI.ModelView(parent, props, model, opt)
	opt = opt or {}
	local base = { Name = "Vorschau", BackgroundTransparency = 1, Ambient = Color3.fromRGB(190, 185, 200), LightColor = Color3.fromRGB(255, 245, 230), LightDirection = Vector3.new(-0.4, -1, -0.6), Parent = parent }
	for k, v in pairs(props) do base[k] = v end
	local vf = new("ViewportFrame", base)
	local camera = Instance.new("Camera")
	camera.FieldOfView = 30
	camera.Parent = vf
	vf.CurrentCamera = camera
	local pivot = model:GetPivot()
	model.Parent = vf
	local box, size = model:GetBoundingBox()
	local center = box.Position
	local spin = opt.Spin and not setting("skipAnimations", false)
	-- beim Drehen zählt die Diagonale der Grundfläche
	local wide = spin and math.sqrt(size.X * size.X + size.Z * size.Z) or math.max(size.X, size.Z)
	local radius = math.max(size.Y, wide) * 0.5
	local dist = radius / math.tan(math.rad(camera.FieldOfView / 2)) * (opt.Zoom or 1.15)
	local dir = opt.Side == "X" and Vector3.new(1, 0, 0) or Vector3.new(0, 0, -1)
	local tilt = math.rad(opt.Tilt or 12)
	camera.CFrame = CFrame.lookAt(center + (dir * math.cos(tilt) + Vector3.new(0, math.sin(tilt), 0)) * dist, center)
	if spin then
		local angle = 0
		local connection
		connection = RunService.RenderStepped:Connect(function(dt)
			if not vf.Parent then
				connection:Disconnect()
				return
			end
			angle = angle + math.rad(opt.Spin) * dt
			model:PivotTo(CFrame.new(center) * CFrame.Angles(0, angle, 0) * CFrame.new(-center) * pivot)
		end)
		vf.Destroying:Connect(function() connection:Disconnect() end)
	end
	return vf
end

-- Münze aus CoinBuilder (mit Mutation), sonst die flache Münze aus Frames
function GameUI.CoinView(parent, entry, size, position, spin)
	local CoinBuilder = builder("CoinBuilder")
	local ok, model = false, nil
	if CoinBuilder then ok, model = pcall(CoinBuilder.Build, entry.Coin) end
	if not ok or not model then return coinDisc(parent, entry, size, position) end
	local MutationFx = entry.Mutation and builder("MutationFx")
	if MutationFx then pcall(MutationFx.Apply, model, entry.Mutation.Id) end
	return GameUI.ModelView(parent, { Size = UDim2.new(0, size, 0, size), Position = position, AnchorPoint = Vector2.new(0.5, 0), ZIndex = 3 }, model, { Side = "X", Spin = spin and 60 or nil, Tilt = 6, Zoom = 1.02 })
end

-- Ei aus EggBuilder (mit Sockel), sonst ein Oval
function GameUI.EggView(parent, egg, size, position, zoom)
	local EggBuilder = builder("EggBuilder")
	local ok, model = false, nil
	if EggBuilder then ok, model = pcall(EggBuilder.Build, egg) end
	if ok and model then
		return GameUI.ModelView(parent, { Name = "Ei", Size = size, Position = position, AnchorPoint = Vector2.new(0.5, 0) }, model, { Tilt = 14, Zoom = zoom or 1.05 })
	end
	return new("Frame", { Name = "Ei", Size = UDim2.new(0, 46, 0, 58), Position = position, AnchorPoint = Vector2.new(0.5, 0), BackgroundColor3 = egg.Color, Parent = parent }, {
		corner(UDim.new(0.5, 0)),
		stroke(egg.Glow, 2),
		new("UIGradient", { Rotation = 35, Color = ColorSequence.new(Color3.new(1, 1, 1), C.shade) }),
	})
end

-- Welt als kleine Insel in ihren Farben: Wiese, Erdsockel, Bäume und ein Haus (wenige Teile)
function GameUI.WorldView(parent, world)
	local model = Instance.new("Model")
	model.Name = world.Id
	local function part(props)
		local p = Instance.new("Part")
		p.Anchored = true
		p.TopSurface = Enum.SurfaceType.Smooth
		p.BottomSurface = Enum.SurfaceType.Smooth
		for k, v in pairs(props) do p[k] = v end
		p.Parent = model
		return p
	end
	local ground = world.Ground or C.green
	local accent = world.Accent or C.gold
	local round = CFrame.Angles(0, 0, math.rad(90)) -- Zylinder liegen in Roblox entlang X
	part({ Name = "Wiese", Shape = Enum.PartType.Cylinder, Size = Vector3.new(1.2, 12, 12), Color = ground, Material = Enum.Material.Grass, CFrame = CFrame.new(0, 0, 0) * round })
	part({ Name = "Erde", Shape = Enum.PartType.Cylinder, Size = Vector3.new(2.4, 10.4, 10.4), Color = ground:Lerp(Color3.fromRGB(90, 60, 40), 0.7), Material = Enum.Material.Slate, CFrame = CFrame.new(0, -1.7, 0) * round })
	part({ Name = "Fels", Shape = Enum.PartType.Cylinder, Size = Vector3.new(2, 6.4, 6.4), Color = Color3.fromRGB(80, 64, 54), Material = Enum.Material.Slate, CFrame = CFrame.new(0, -3.7, 0) * round })
	part({ Name = "Haus", Size = Vector3.new(2.4, 2, 2.4), Color = Color3.fromRGB(240, 232, 214), Material = Enum.Material.SmoothPlastic, CFrame = CFrame.new(1.4, 1.6, 0.6) })
	part({ Name = "Dach", Size = Vector3.new(2.8, 1.2, 2.8), Color = accent, Material = Enum.Material.SmoothPlastic, CFrame = CFrame.new(1.4, 3.2, 0.6) * CFrame.Angles(0, math.rad(45), 0) })
	for i, at in ipairs({ Vector3.new(-3, 0, -2), Vector3.new(-2.2, 0, 2.6), Vector3.new(3.4, 0, -3) }) do
		part({ Name = "Stamm", Size = Vector3.new(0.5, 1.6, 0.5), Color = Color3.fromRGB(110, 76, 50), Material = Enum.Material.Wood, CFrame = CFrame.new(at + Vector3.new(0, 1.4, 0)) })
		part({ Name = "Krone", Shape = Enum.PartType.Ball, Size = Vector3.new(2.2, 2.2, 2.2) * (i == 2 and 0.8 or 1), Color = i == 3 and accent or ground:Lerp(Color3.new(0, 0, 0), 0.25), Material = Enum.Material.Grass, CFrame = CFrame.new(at + Vector3.new(0, 2.9, 0)) })
	end
	model.PrimaryPart = model:FindFirstChild("Wiese")
	return GameUI.ModelView(parent, { Size = UDim2.new(1, 0, 1, 0) }, model, { Tilt = 32, Zoom = 1.0 })
end

-- Taler: zählen hoch oder runter, bei Gewinn steigt „+1.250“ auf und das Feld wippt
function GameUI._showTaler(target)
	if ui.talerTarget == nil or setting("skipAnimations", false) then
		ui.talerTarget, ui.talerShown = target, target
		ui.taler.Text = GameUI.Format(target)
		return
	end
	if target == ui.talerTarget then return end
	local gain = target - ui.talerTarget
	ui.talerTarget = target
	local function run()
		local from = ui.talerShown or target
		animate("taler", from, target, math.abs(gain) > 0 and 0.6 or 0.01, function(v)
			ui.talerShown = v
			ui.taler.Text = GameUI.Format(v)
		end)
		if gain > 0 then
			ui.talerScale.Scale = 1
			ui.taler.TextColor3 = Color3.new(1, 1, 1)
			TweenService:Create(ui.taler, M.Slow, { TextColor3 = C.goldHi }):Play()
			TweenService:Create(ui.talerScale, M.Pop, { Scale = 1.08 + math.min(0.12, math.log10(math.max(10, gain)) * 0.015) }):Play()
			task.delay(0.25, function() TweenService:Create(ui.talerScale, M.Normal, { Scale = 1 }):Play() end)
			GameUI.FloatText("+" .. GameUI.Format(gain), ui.talerPill.AbsolutePosition + Vector2.new(-70, ui.talerPill.AbsoluteSize.Y * 0.5), C.green)
		end
	end
	-- warten, bis fliegende Münzen angekommen sind
	local wait = (ui.talerHold or 0) - os.clock()
	if wait > 0 then task.delay(wait, run) else run() end
end

-- EP-Balken gleitet; bei einem neuen Level erst voll, dann von vorn
function GameUI._showXp(fraction, level)
	fraction = math.clamp(fraction, 0.02, 1)
	local size = UDim2.new(fraction, 0, 1, 0)
	if ui.xpLevel == nil or setting("skipAnimations", false) then
		ui.xpFill.Size = size
	elseif level > ui.xpLevel then
		Juice.levelUp(level)
		TweenService:Create(ui.xpFill, M.Normal, { Size = UDim2.new(1, 0, 1, 0) }):Play()
		task.delay(0.24, function()
			ui.xpFill.Size = UDim2.new(0.02, 0, 1, 0)
			TweenService:Create(ui.xpFill, M.Slow, { Size = size }):Play()
		end)
	elseif ui.xpFraction ~= fraction then
		TweenService:Create(ui.xpFill, M.Slow, { Size = size }):Play()
	end
	ui.xpLevel, ui.xpFraction = level, fraction
end

-- Text, der aufsteigt und verblasst (Bildschirm-Punkt wie AbsolutePosition)
function GameUI.FloatText(text, at, color)
	if not ui.fx then return end
	local t = label({ Size = UDim2.new(0, 200, 0, 30), Position = UDim2.new(0, at.X, 0, at.Y), AnchorPoint = Vector2.new(0.5, 0.5), Text = text, Font = FONT, TextSize = T.Large, TextColor3 = color or C.goldHi, ZIndex = 5, Parent = ui.fx })
	stroke(C.bg, 2, Enum.ApplyStrokeMode.Contextual).Parent = t
	-- erst gut lesbar aufsteigen, dann verblassen
	TweenService:Create(t, M.Float, { Position = UDim2.new(0, at.X, 0, at.Y - 40) }):Play()
	task.delay(0.55, function()
		TweenService:Create(t, M.Normal, { TextTransparency = 1 }):Play()
	end)
	task.delay(0.8, function() t:Destroy() end)
end

-- Münzen fliegen von einem Knopf zum Taler-Feld
function GameUI.FlyCoins(from, count)
	if not ui.fx or setting("skipAnimations", false) then return end
	local start = typeof(from) == "Vector2" and from or centerOf(from)
	local goal = centerOf(ui.talerPill) - Vector2.new(70, 0)
	count = math.clamp(count or 5, 1, 8)
	ui.talerHold = os.clock() + 0.5 + count * 0.04
	for i = 1, count do
		local offset = Vector2.new(math.random(-24, 24), math.random(-14, 14))
		local coin = new("Frame", { Name = "Muenze", Size = UDim2.new(0, 22, 0, 22), Position = UDim2.new(0, start.X + offset.X, 0, start.Y + offset.Y), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundColor3 = C.goldHi, ZIndex = 6, Parent = ui.fx }, {
			corner(R.Round),
			stroke(C.goldDark, 2),
			new("UIGradient", { Rotation = 45, Color = ColorSequence.new(C.cream, C.goldDark) }),
		})
		task.delay((i - 1) * 0.04, function()
			TweenService:Create(coin, M.Fly, { Position = UDim2.new(0, goal.X, 0, goal.Y), Size = UDim2.new(0, 14, 0, 14) }):Play()
			task.delay(0.52, function() coin:Destroy() end)
		end)
	end
end

-- Kurz aufblitzen (ganzer Bildschirm)
local function flash(color, strength)
	if not ui.flashGui then return end
	local f = new("Frame", { Size = UDim2.new(1, 0, 1, 0), BackgroundColor3 = color, BackgroundTransparency = 1 - strength, BorderSizePixel = 0, Parent = ui.flashGui })
	TweenService:Create(f, M.Float, { BackgroundTransparency = 1 }):Play()
	task.delay(0.95, function() f:Destroy() end)
end
-- Funken fliegen aus der Mitte
local function burst(color, count)
	if not ui.fx then return end
	for _ = 1, count do
		local angle = math.random() * math.pi * 2
		local dist = math.random(140, 280)
		local spark = label({ Size = UDim2.new(0, 30, 0, 30), Position = UDim2.new(0.5, 0, 0.42, 0), AnchorPoint = Vector2.new(0.5, 0.5), Text = "✦", TextSize = math.random(18, 30), TextColor3 = math.random() < 0.5 and color or C.goldHi, Font = EMOJI, ZIndex = 4, Parent = ui.fx })
		TweenService:Create(spark, M.Float, { Position = UDim2.new(0.5, math.cos(angle) * dist, 0.42, math.sin(angle) * dist), Rotation = math.random(-180, 180), TextTransparency = 1 }):Play()
		task.delay(0.95, function() spark:Destroy() end)
	end
end
-- Große Ansage in der Mitte
local function banner(title, sub, color, hold)
	if not ui.fx then return end
	local box = new("Frame", { Name = "Ansage", Size = UDim2.new(0, 600, 0, 110), Position = UDim2.new(0.5, 0, 0.36, 0), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundTransparency = 1, ZIndex = 5, Parent = ui.fx })
	local scale = new("UIScale", { Scale = 0.3, Parent = box })
	local big = label({ Size = UDim2.new(1, 0, 0, 70), Text = title, Font = FONT, TextSize = 64, TextColor3 = color, ZIndex = 5, Parent = box })
	stroke(C.bg, 4, Enum.ApplyStrokeMode.Contextual).Parent = big
	local small = label({ Size = UDim2.new(1, 0, 0, 30), Position = UDim2.new(0, 0, 0, 74), Text = sub, Font = FONT, TextSize = T.Big, TextColor3 = C.ink, ZIndex = 5, Parent = box })
	stroke(C.bg, 3, Enum.ApplyStrokeMode.Contextual).Parent = small
	TweenService:Create(scale, M.Pop, { Scale = 1 }):Play()
	task.delay(hold, function()
		TweenService:Create(scale, M.Exit, { Scale = 1.15 }):Play()
		TweenService:Create(big, M.Exit, { TextTransparency = 1 }):Play()
		TweenService:Create(small, M.Exit, { TextTransparency = 1 }):Play()
		task.delay(Theme.ExitTime + 0.05, function() box:Destroy() end)
	end)
end
-- Karte mit Münze, die über „Münze suchen“ erscheint; ein Glanz läuft darüber
local function foundCard(entry, text, value, hold)
	if not ui.fx then return end
	local card = new("Frame", { Name = "Fund", Size = UDim2.new(0, 380, 0, 84), Position = UDim2.new(0.5, 0, 1, -112), AnchorPoint = Vector2.new(0.5, 1), BackgroundColor3 = C.bg, ZIndex = 3, Parent = ui.fx }, {
		corner(R.L),
		stroke(entry.Mutation and entry.Mutation.Color or entry.Tier.Color, 3),
	})
	local scale = new("UIScale", { Scale = 0.6, Parent = card })
	GameUI.CoinView(card, entry, 72, UDim2.new(0, 46, 0, 6), true)
	label({ Size = UDim2.new(1, -200, 0, 28), Position = UDim2.new(0, 86, 0, 12), Text = entry.Coin.Name, Font = FONT, TextSize = T.Large, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 3, Parent = card })
	label({ Size = UDim2.new(1, -200, 0, 20), Position = UDim2.new(0, 86, 0, 44), Text = text, TextSize = T.Small, TextColor3 = entry.Mutation and entry.Mutation.Color or entry.Tier.Color, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 3, Parent = card })
	label({ Size = UDim2.new(0, 104, 1, 0), Position = UDim2.new(1, -116, 0, 0), Text = "+" .. GameUI.Format(value), Font = FONT, TextSize = T.Large, TextColor3 = C.goldHi, TextXAlignment = Enum.TextXAlignment.Right, ZIndex = 3, Parent = card })
	-- Glanz: heller Streifen im Verlauf, der von links nach rechts wandert
	local shine = new("Frame", { Name = "Glanz", Size = UDim2.new(1, 0, 1, 0), BackgroundColor3 = Color3.new(1, 1, 1), ZIndex = 4, Parent = card }, { corner(R.L) })
	local gradient = new("UIGradient", { Rotation = 20, Offset = Vector2.new(-1, 0), Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.42, 1), NumberSequenceKeypoint.new(0.5, 0.55),
		NumberSequenceKeypoint.new(0.58, 1), NumberSequenceKeypoint.new(1, 1),
	}), Parent = shine })
	TweenService:Create(scale, M.Pop, { Scale = 1 }):Play()
	task.delay(0.15, function()
		animate(gradient, -1, 1, 0.7, function(x) gradient.Offset = Vector2.new(x, 0) end)
	end)
	task.delay(hold, function()
		TweenService:Create(scale, M.Exit, { Scale = 0.01 }):Play()
		task.delay(Theme.ExitTime + 0.05, function() card:Destroy() end)
	end)
end

-- ══ Juice: Wackeln, Konfetti, Strahlen, Münzregen, Zeitlupe ══
-- Alles aus Frames im Effekt-Gui; „Animationen überspringen“ schaltet es ab, „Weniger Partikel“ halbiert.
Juice.calm = function() return setting("skipAnimations", false) end
local function few() return setting("fewerParticles", false) end

-- Bildschirm wackeln: HUD-Teile und Kamera kurz versetzen, klingt schnell ab
local shakeToken
function Juice.shake(strength, duration)
	if Juice.calm() or not ui.hud then return end
	local token = {}
	shakeToken = token
	local items = {}
	for _, g in ipairs(ui.hud:GetChildren()) do
		if g:IsA("GuiObject") then table.insert(items, { G = g, P = g.Position }) end
	end
	local cam = workspace.CurrentCamera
	task.spawn(function()
		local start = os.clock()
		while shakeToken == token do
			local k = (os.clock() - start) / duration
			if k >= 1 then break end
			local s = strength * (1 - k) * (1 - k)
			local dx, dy = (math.random() - 0.5) * 2 * s, (math.random() - 0.5) * 2 * s
			for _, e in ipairs(items) do e.G.Position = e.P + UDim2.new(0, dx, 0, dy) end
			if cam and player.Character then cam.CFrame = cam.CFrame * CFrame.new(dx * 0.012, dy * 0.012, 0) end
			task.wait()
		end
		for _, e in ipairs(items) do e.G.Position = e.P end
	end)
end

-- Konfetti fällt von oben über den Bildschirm
local CONFETTI = { Color3.fromRGB(255, 90, 165), Color3.fromRGB(255, 224, 122), Color3.fromRGB(90, 209, 255), Color3.fromRGB(125, 255, 138), Color3.fromRGB(180, 156, 255) }
function Juice.confetti(count, colors)
	if Juice.calm() or not ui.fx then return end
	colors = colors or CONFETTI
	count = few() and math.floor(count / 2) or count
	for i = 1, count do
		local x = math.random()
		local piece = new("Frame", { Name = "Konfetti", Size = UDim2.new(0, math.random(8, 14), 0, math.random(5, 9)), Position = UDim2.new(x, 0, 0, -20), BackgroundColor3 = colors[i % #colors + 1], BorderSizePixel = 0, Rotation = math.random(0, 360), ZIndex = 7, Parent = ui.fx })
		local t = 1.4 + math.random() * 1.2
		task.delay(math.random() * 0.35, function()
			TweenService:Create(piece, TweenInfo.new(t, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { Position = UDim2.new(x + (math.random() - 0.5) * 0.25, 0, 1, 20), Rotation = piece.Rotation + math.random(-540, 540) }):Play()
			task.delay(t * 0.7, function() TweenService:Create(piece, TweenInfo.new(t * 0.3), { BackgroundTransparency = 1 }):Play() end)
			task.delay(t + 0.05, function() piece:Destroy() end)
		end)
	end
end

-- Strahlenkranz hinter einem Punkt (dreht sich und verblasst)
function Juice.rays(at, color, size, hold)
	if Juice.calm() or not ui.fx then return end
	local holder = new("Frame", { Name = "Strahlen", Size = UDim2.new(0, size, 0, size), Position = UDim2.new(0, at.X, 0, at.Y), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundTransparency = 1, ZIndex = 2, Parent = ui.fx })
	local scale = new("UIScale", { Scale = 0.2, Parent = holder })
	for i = 0, 11 do
		new("Frame", { Size = UDim2.new(0, size * 0.09, 0, size * 0.5), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 1), Rotation = i * 30, BackgroundColor3 = color, BackgroundTransparency = 0.55, BorderSizePixel = 0, ZIndex = 2, Parent = holder }, {
			new("UIGradient", { Rotation = 90, Transparency = NumberSequence.new(0, 1) }),
		})
	end
	TweenService:Create(scale, M.Pop, { Scale = 1 }):Play()
	TweenService:Create(holder, TweenInfo.new(hold + 0.4, Enum.EasingStyle.Linear), { Rotation = 90 }):Play()
	task.delay(hold, function()
		TweenService:Create(scale, M.Exit, { Scale = 1.3 }):Play()
		for _, r in ipairs(holder:GetChildren()) do
			if r:IsA("Frame") then TweenService:Create(r, M.Exit, { BackgroundTransparency = 1 }):Play() end
		end
		task.delay(0.3, function() holder:Destroy() end)
	end)
end

-- Münzregen: goldene Münzen fallen und drehen sich
function Juice.coinRain(count)
	if Juice.calm() or not ui.fx then return end
	count = few() and math.floor(count / 2) or count
	for i = 1, count do
		local x = math.random()
		local coin = new("Frame", { Name = "Muenzregen", Size = UDim2.new(0, 26, 0, 26), Position = UDim2.new(x, 0, 0, -30), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundColor3 = C.goldHi, ZIndex = 6, Parent = ui.fx }, {
			corner(R.Round), stroke(C.goldDark, 2), new("UIGradient", { Rotation = 45, Color = ColorSequence.new(C.cream, C.goldDark) }),
		})
		local t = 1 + math.random() * 0.8
		task.delay(math.random() * 0.6, function()
			TweenService:Create(coin, TweenInfo.new(t, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { Position = UDim2.new(x, 0, 1, 30), Size = UDim2.new(0, 8, 0, 26) }):Play()
			task.delay(t + 0.05, function() coin:Destroy() end)
		end)
	end
end

-- Zeitlupe: Bild wird dunkel, alles hält kurz an, dann geht es weiter
function Juice.slowmo(color, hold)
	if Juice.calm() or not ui.flashGui then return end
	local veil = new("Frame", { Name = "Zeitlupe", Size = UDim2.new(1, 0, 1, 0), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 1, BorderSizePixel = 0, Parent = ui.flashGui }, {
		new("UIGradient", { Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.5, 0.6), NumberSequenceKeypoint.new(1, 0) }), Rotation = 90 }),
	})
	TweenService:Create(veil, TweenInfo.new(0.25), { BackgroundTransparency = 0.45 }):Play()
	local cam = workspace.CurrentCamera
	local fov = cam and cam.FieldOfView
	if cam and player.Character then TweenService:Create(cam, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), { FieldOfView = fov - 12 }):Play() end
	task.delay(hold, function()
		TweenService:Create(veil, TweenInfo.new(0.5), { BackgroundTransparency = 1 }):Play()
		if cam and fov and player.Character then TweenService:Create(cam, TweenInfo.new(0.6, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { FieldOfView = fov }):Play() end
		task.delay(0.55, function() veil:Destroy() end)
	end)
end

-- Wippen eines Elements (UIScale vorhanden oder neu)
function Juice.punch(object, amount)
	if Juice.calm() or not object then return end
	local scale = object:FindFirstChildOfClass("UIScale") or new("UIScale", { Scale = 1, Parent = object })
	scale.Scale = 1 + (amount or 0.18)
	TweenService:Create(scale, SPRING, { Scale = 1 }):Play()
end

-- Kleiner Funkenkranz um einen Knopf beim Drücken
function Juice.tap(button)
	if not ui.fx or few() then return end
	local c = centerOf(button)
	for i = 1, 5 do
		local a = i / 5 * math.pi * 2 + math.random() * 0.6
		local d = math.max(button.AbsoluteSize.X, button.AbsoluteSize.Y) * 0.5 + 10
		local dot = new("Frame", { Size = UDim2.new(0, 6, 0, 6), Position = UDim2.new(0, c.X + math.cos(a) * d * 0.6, 0, c.Y + math.sin(a) * d * 0.6), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundColor3 = C.goldHi, BorderSizePixel = 0, ZIndex = 8, Parent = ui.fx }, { corner(R.Round) })
		TweenService:Create(dot, TweenInfo.new(0.35, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), { Position = UDim2.new(0, c.X + math.cos(a) * d, 0, c.Y + math.sin(a) * d), Size = UDim2.new(0, 2, 0, 2), BackgroundTransparency = 1 }):Play()
		task.delay(0.4, function() dot:Destroy() end)
	end
end

-- Kauf geklappt: Glanz, Konfetti, bei großen Momenten Ansage, Blitz und Wackeln
function Juice.bought(color, big, text)
	if Juice.calm() then return end
	if options.Sound then options.Sound(big and "big" or "buy", big and 3 or 1) end
	if big then
		flash(color, 0.45)
		Juice.shake(10, 0.45)
		Juice.confetti(70)
		Juice.rays(Vector2.new(ui.fx.AbsoluteSize.X * 0.5, ui.fx.AbsoluteSize.Y * 0.36), color, 520, 1.6)
		banner(GameUI.Upper(big), text or "", color, 1.8)
	else
		Juice.confetti(26)
		Juice.punch(ui.talerPill, 0.12)
	end
end
-- Kauf ging nicht: Taler-Feld schüttelt den Kopf
function Juice.denied()
	if Juice.calm() or not ui.talerPill then return end
	local p = ui.talerPill.Position
	task.spawn(function()
		for i = 1, 6 do
			ui.talerPill.Position = p + UDim2.new(0, (i % 2 == 0 and -1 or 1) * (8 - i), 0, 0)
			task.wait(0.03)
		end
		ui.talerPill.Position = p
	end)
end
-- Level-Aufstieg: Abzeichen springt, Goldregen, Konfetti
function Juice.levelUp(level)
	if Juice.calm() then return end
	if options.Sound then options.Sound("levelup", 3) end
	Juice.punch(ui.levelBadge, 0.6)
	flash(C.goldHi, 0.3)
	Juice.confetti(60, { C.goldHi, C.gold, Color3.new(1, 1, 1), C.xp })
	if ui.levelBadge then
		Juice.rays(centerOf(ui.levelBadge), C.goldHi, 220, 1.2)
	end
	if options.LevelBanner ~= false then banner("LEVEL " .. level .. "!", "Neue Skillpunkte warten", C.goldHi, 1.8) end
end

-- Fund anzeigen: je seltener, desto größer
--   Stufe 1 (Normal, Selten): Hinweis
--   Stufe 2 (Sehr selten, Episch): Karte mit Glanz
--   Stufe 3 (Legendär bis Engelsgleich): dazu Blitz, Funken und Ansage
--   Stufe 4 (Göttlich und seltener): alles größer und länger
--   Eine Mutation hebt um eine Stufe. „Animationen überspringen“: nur der Hinweis; „Weniger Partikel“: weniger Funken.
-- info = { CoinId, Mutation, Count, Value, Xp, Upgraded }
function GameUI.Found(info)
	local coin = CoinData.Coins[info.CoinId]
	if not coin then return end
	local tier = CoinData.TierById[coin.Tier]
	local mutation = info.Mutation and MutationData.ById[info.Mutation] or nil
	local level = tier.Index <= 2 and 1 or (tier.Index <= 4 and 2 or (tier.Index <= 7 and 3 or 4))
	if mutation then level = math.min(4, level + 1) end
	local count = info.Count or 1
	local value = (info.Value or 0) * count
	local line = tier.Name .. (mutation and (" · " .. mutation.Name) or "") .. (count > 1 and " · ×" .. count or "") .. (info.Upgraded and " · Goldene Hand!" or "") .. " · +" .. (info.Xp or 0) .. " EP"
	local color = mutation and mutation.Color or tier.Color
	if options.Sound then options.Sound("found", level) end
	if setting("skipAnimations", false) then
		GameUI.Toast(coin.Name .. " · " .. line .. " · " .. GameUI.Format(value) .. " Taler", color)
		return
	end
	-- jeder Fund: der Knopf springt, Münzen fliegen zum Taler-Feld, die Zahl steigt auf
	Juice.punch(ui.find, 0.14 + level * 0.05)
	GameUI.FlyCoins(ui.find, 2 + level * 2)
	if level == 1 then
		GameUI.Toast(coin.Name .. " · " .. line .. " · " .. GameUI.Format(value) .. " Taler", color)
		GameUI.FloatText("+" .. GameUI.Format(value), centerOf(ui.find) - Vector2.new(0, 46), color)
		return
	end
	local entry = { Coin = coin, Tier = tier, Mutation = mutation }
	foundCard(entry, line, value, level == 2 and 1.8 or (level == 3 and 2.4 or 3.2))
	Juice.shake(level == 2 and 4 or (level == 3 and 10 or 16), level == 4 and 0.7 or 0.4)
	if level >= 3 then
		local few = setting("fewerParticles", false)
		flash(color, level == 3 and 0.35 or 0.6)
		burst(color, few and (level == 3 and 4 or 8) or (level == 3 and 14 or 26))
		Juice.rays(Vector2.new(ui.fx.AbsoluteSize.X * 0.5, ui.fx.AbsoluteSize.Y * 0.36), color, level == 3 and 420 or 620, level == 3 and 1.6 or 2.4)
		banner(GameUI.Upper(tier.Name) .. "!", coin.Name .. (mutation and (" · " .. mutation.Name) or ""), color, level == 3 and 1.6 or 2.4)
	end
	if level == 4 then
		-- Göttlich und seltener: kurz Zeitlupe, dann regnet es Münzen
		Juice.slowmo(color, 0.9)
		task.delay(0.5, function() Juice.coinRain(40) end)
	end
end

-- Standard-Verbindungen in Roblox: Käufe über RemoteFunctions, fremde Fenster als BindableEvent
-- ── Münzbaumgarten: Beete, Sachen aus Münzrollen, Rollen kaufen ──
-- Spielstand aus dem Attribut Garden (JSON, schreibt der Server). Aktionen über Invoke:
-- gardenBuy, gardenBed, gardenPlant (Beet, Baum), gardenUse (Werkzeug, Beet), gardenHarvest (Beet | "all"),
-- gardenDig (Beet), gardenFence (Zaun), gardenSell (Baum | "all"), gardenSeed (Baum),
-- openRoll (Rolle) → ok, Text, Id. Danach spielt GameUI.PlayRoll die Rollanimation.
-- Tab „Korb“: Früchte aus der Ernte, Marktpreis (wechselt alle 10 Minuten), verkaufen oder Samen ziehen.
-- Name einer Seltenheit; ??? bekommt einen Regenbogen davor
local function rarityName(r)
	return (r.Rainbow and "🌈 " or "") .. r.Name
end
local GARDEN_TABS = { { "beete", "Beete", 104, "sprout" }, { "korb", "Korb", 96, "tree" }, { "sachen", "Sachen", 110, "bag" }, { "rollen", "Rollen", 110, "coins" } }
local LOOT_ICON = { bush = "🌿", round = "🌳", oval = "🌳", cone = "🌲", spruce = "🌲", oak = "🌳", maple = "🍁", blossom = "🌸", weeping = "🌳", palm = "🌴", star = "🌌", mushroom = "🍄", cloud = "☁️", crystal = "💎", planet = "🪐", angel = "😇", rainbow = "🌈", can = "💧", sack = "🌱", bag = "💰", spade = "⚒️", chest = "💎" }
local FRUIT_ICON = { apple = "🍎", pear = "🍐", berry = "🫐", cone = "🌰", acorn = "🌰", cherry = "🍒", drop = "💧", dragon = "🐉", star = "⭐", moon = "🌕" }
local function fruitIcon(tree)
	return FRUIT_ICON[tree.FruitShape] or "🍎"
end
ui.gardenSel = nil -- ausgewählte Sache (Baum, Kanne, Dünger), die auf ein Beet soll
ui.gardenLive = {}

local function gardenState()
	local ok, g = pcall(function()
		return HttpService:JSONDecode(attr("Garden", "null"))
	end)
	return GardenData.Clean(ok and g or nil)
end
local function lootIcon(item)
	return LOOT_ICON[item.Crown or item.Model] or "🌳"
end
local function gardenSignature(g, now)
	local parts = { tostring(g.Owned), g.Beds, ui.gardenSel or "" }
	for i = 1, g.Beds do
		local p = g.Plots[tostring(i)]
		table.insert(parts, p and (p.Tree .. GardenData.PhaseOf(GardenData.Progress(p, now)) .. GardenData.Ripe(p, now) .. ((p.BoostEnd or 0) > now and "d" or "") .. (p.Golden and "g" or "")) or "-")
	end
	-- Korb: Früchte und Marktpreis-Fenster
	for _, t in ipairs(GardenData.Trees) do
		if g.Fruits[t.Id] then table.insert(parts, t.Id .. g.Fruits[t.Id]) end
	end
	table.insert(parts, tostring(math.floor(now / GardenData.Garden.MarketSlot)))
	return table.concat(parts, ",")
end
local function gardenDo(action, a, b)
	local ok, text = options.Invoke(action, a, b)
	if ok and (action == "gardenPlant" or action == "gardenUse") then
		ui.gardenSel = nil
	end
	result(ok, text, C.green)
	GameUI.Refresh("garten")
end

local fillGarden
local function gardenTick(w)
	return function()
		if w.tab == "rollen" then return end
		local now = os.time()
		if gardenSignature(gardenState(), now) ~= ui.gardenSig then
			GameUI.Refresh("garten")
		else
			for _, fn in ipairs(ui.gardenLive) do fn(now) end
		end
	end
end
fillGarden = function(w)
	ui.gardenLive = {}
	w.tick = gardenTick(w)
	clear(w.body)
	clear(w.tools)
	local g = gardenState()
	local now = os.time()
	local money = taler()
	ui.gardenSig = gardenSignature(g, now)
	w.sub.Text = GameUI.Format(money) .. " Taler · " .. (g.Owned and (g.Beds .. " Beete") or "noch kein Garten")
	if g.Owned then
		local go = new("TextButton", { Name = "Besuchen", Size = UDim2.new(0, 150, 1, 0), BackgroundColor3 = C.blue, Text = "🚪 Zum Garten", Font = FONT, TextSize = 16, TextColor3 = Color3.new(1, 1, 1), LayoutOrder = 1, Parent = w.tools }, { corner(R.Round) })
		pressable(go, function()
			GameUI.Close("garten")
			options.OnAction("gartenBesuchen")
		end)
	end
	local list = scroller(w, w.body, "Liste", { Size = UDim2.new(1, 16, 1, 0), Position = UDim2.new(0, -8, 0, 0) }, {
		new("UIGridLayout", { CellSize = UDim2.new(0, 200, 0, 236), CellPadding = UDim2.new(0, 12, 0, 12), HorizontalAlignment = Enum.HorizontalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder }),
		new("UIPadding", { PaddingTop = UDim.new(0, 12), PaddingBottom = UDim.new(0, 12), PaddingLeft = UDim.new(0, 8), PaddingRight = UDim.new(0, 8) }),
	})
	local function text(c, y, h, t, size, color, font)
		return label({ Size = UDim2.new(1, 0, 0, h), Position = UDim2.new(0, 0, 0, y), Text = t, TextSize = size, TextColor3 = color or C.ink, TextWrapped = true, Font = font or BODY, Parent = c })
	end

	if w.tab == "rollen" then
		for i, roll in ipairs(RollData.Rolls) do
			local c = card(list, roll.Glow)
			c.LayoutOrder = i
			-- Rolle: Papier mit Banderole
			new("Frame", { Name = "Rolle", Size = UDim2.new(0, 34, 0, 64), Position = UDim2.new(0.5, 0, 0, 0), AnchorPoint = Vector2.new(0.5, 0), BackgroundColor3 = roll.Paper, Parent = c }, {
				corner(R.S),
				stroke(roll.Glow, 2),
				new("Frame", { Size = UDim2.new(1, 0, 0, 18), Position = UDim2.new(0, 0, 0.5, -9), BackgroundColor3 = roll.Band, BorderSizePixel = 0 }),
			})
			text(c, 70, 22, roll.Name, 20, C.ink, FONT)
			text(c, 94, 16, roll.RankName .. " · 1 Sache", 12, roll.Glow)
			local guarantee = roll.Guarantee and ("Mindestens " .. GardenData.RarityById[roll.Guarantee].Name) or "Alles möglich"
			text(c, 114, 32, guarantee .. " · Glück ×" .. roll.Luck, 12, C.muted, TEXT)
			if roll.Price.Currency == "Coins" then
				actionButton(c, "Öffnen · " .. GameUI.Format(roll.Price.Amount), C.green, money >= roll.Price.Amount, function()
					local ok, msg, ids = options.Invoke("openRoll", roll.Id)
					if ok and ids then
						GameUI.Close("garten")
						GameUI.PlayRoll(roll.Id, ids)
					end
					result(ok, msg, roll.Glow)
				end)
			else
				actionButton(c, "R$ " .. roll.Price.Amount, C.green, true, function()
					local ok, msg, ids = options.Invoke("openRoll", roll.Id)
					if ok and ids then
						GameUI.Close("garten")
						GameUI.PlayRoll(roll.Id, ids)
					end
					result(ok, msg, roll.Glow)
				end)
			end
		end
		return
	end

	if not g.Owned then
		local c = card(list, C.gold)
		text(c, 0, 52, "🌳", 44, C.ink, EMOJI)
		text(c, 56, 22, "Münzbaumgarten", 20, C.ink, FONT)
		text(c, 80, 70, GardenData.Garden.StartBeds .. " Beete für Münzbäume aus Münzrollen. Ausgewachsen tragen sie Früchte, die du am Markt verkaufst.", 12, C.muted, TEXT)
		actionButton(c, "Kaufen · " .. GameUI.Format(GardenData.Garden.Price), C.green, money >= GardenData.Garden.Price, function()
			gardenDo("gardenBuy")
		end)
		return
	end

	if w.tab == "korb" then
		-- Marktstand: alle Früchte auf einmal verkaufen
		local total, any = 0, false
		for id, n in pairs(g.Fruits) do
			total = total + n * GardenData.FruitPrice(id, now)
			any = true
		end
		local all = new("TextButton", { Name = "AllesVerkaufen", Size = UDim2.new(0, 230, 1, 0), BackgroundColor3 = any and C.green or C.line, Text = "💰 Alles verkaufen · +" .. GameUI.Format(total), Font = FONT, TextSize = 15, TextColor3 = Color3.new(1, 1, 1), LayoutOrder = 2, Parent = w.tools }, { corner(R.Round) })
		pressable(all, function() if any then gardenDo("gardenSell", "all") end end)
		local n = 0
		for _, tree in ipairs(GardenData.Trees) do
			local count = g.Fruits[tree.Id] or 0
			if count > 0 then
				n = n + 1
				local r = GardenData.RarityById[tree.Rarity]
				local c = card(list, r.Color)
				c.LayoutOrder = n
				local mult = GardenData.MarketMult(tree.Id, now)
				local price = GardenData.FruitPrice(tree.Id, now)
				local fname = (count == 1 and tree.FruitName or tree.FruitPlural)
				text(c, 0, 40, fruitIcon(tree), 34, C.ink, EMOJI)
				text(c, 44, 20, fname, #fname > 14 and 14 or 17, C.ink, FONT)
				text(c, 66, 16, "×" .. GameUI.Format(count) .. " · " .. rarityName(r), 12, r.Color)
				local trend = mult > 1 and ("▲ " .. math.floor((mult - 1) * 100 + 0.5) .. " %") or (mult < 1 and ("▼ " .. math.floor((1 - mult) * 100 + 0.5) .. " %") or "Grundpreis")
				text(c, 84, 18, GameUI.Format(price) .. " Taler/Stück", 12, C.ink, MONO)
				text(c, 104, 16, trend, 12, mult > 1 and C.green or (mult < 1 and C.red or C.muted), MONO)
				local cost = GardenData.SeedCost(tree)
				local seedBtn = actionButton(c, "🌱 Samen ziehen · " .. cost, C.blue, count >= cost, function() gardenDo("gardenSeed", tree.Id) end)
				seedBtn.Position = UDim2.new(0, 0, 1, -86)
				seedBtn.TextSize = 14
				local sellBtn = actionButton(c, "Verkaufen · +" .. GameUI.Format(count * price), C.green, true, function() gardenDo("gardenSell", tree.Id) end)
				sellBtn.TextSize = 14
			end
		end
		-- Hinweis mit Countdown bis zu neuen Preisen
		local info = card(list, C.line)
		info.LayoutOrder = 1000
		text(info, 0, 46, "🏪", 38, C.ink, EMOJI)
		text(info, 50, 22, "Marktstand", 20, C.ink, FONT)
		local live = text(info, 76, 34, "", 13, C.ink, MONO)
		text(info, 112, 80, n == 0 and "Der Korb ist leer. Ernte ausgewachsene Bäume, dann landen ihre Früchte hier." or "Preise schwanken zwischen 60 % und 180 % des Grundpreises. Ein Samen kostet so viele Früchte, wie der Baum Ernten hat.", 12, C.muted, TEXT)
		table.insert(ui.gardenLive, function(t)
			live.Text = "Neue Preise in " .. GardenData.FormatTime(GardenData.MarketLeft(t))
		end)
		for _, fn in ipairs(ui.gardenLive) do fn(now) end
		return
	end

	if w.tab == "sachen" then
		local n = 0
		-- anderer Zaun angebracht: Holzzaun zum Zurückwechseln
		local items = {}
		if g.Fence ~= GardenData.StandardFence then
			table.insert(items, GardenData.ById[GardenData.StandardFence])
		end
		for _, item in ipairs(GardenData.Loot) do
			table.insert(items, item)
		end
		for _, item in ipairs(items) do
			local count = item.Standard and 1 or (g.Inv[item.Id] or 0)
			if count > 0 and item.Type == "Fence" then
				n = n + 1
				local r = GardenData.RarityById[item.Rarity]
				local on = g.Fence == item.Id
				local c = card(list, on and C.goldHi or r.Color)
				c.LayoutOrder = n
				text(c, 0, 46, "🏡", 38, C.ink, EMOJI)
				text(c, 50, 22, item.Name .. (item.Standard and "" or ("  ×" .. count)), 17, C.ink, FONT)
				text(c, 74, 16, rarityName(r) .. " · Zaun", 12, r.Color)
				text(c, 94, 48, item.Text, 12, C.muted, TEXT)
				actionButton(c, on and "Angebracht" or "Anbringen", on and C.line or C.green, not on, function() gardenDo("gardenFence", item.Id) end)
			elseif count > 0 then
				n = n + 1
				local r = GardenData.RarityById[item.Rarity]
				local c = card(list, ui.gardenSel == item.Id and C.goldHi or r.Color)
				c.LayoutOrder = n
				text(c, 0, 46, item.Type == "Tree" and "🌱" or lootIcon(item), 38, C.ink, EMOJI)
				text(c, 50, 22, GardenData.LootName(item) .. "  ×" .. count, 17, C.ink, FONT)
				text(c, 74, 16, rarityName(r) .. (item.Type == "Tree" and " · Samen" or " · Werkzeug"), 12, r.Color)
				local info = item.Type == "Tree" and ("Wächst in " .. GardenData.FormatTime(item.Grow) .. " zum " .. item.Name .. ", dann " .. item.FruitPlural .. " alle " .. GardenData.FormatTime(item.Cycle) .. ", " .. item.Harvests .. "× ernten") or item.Text
				text(c, 94, 48, info, 12, C.muted, TEXT)
				if item.Kind == "Taler" or item.Kind == "Bed" then
					actionButton(c, "Benutzen", C.blue, true, function() gardenDo("gardenUse", item.Id) end)
				else
					local verb = item.Type == "Tree" and "Säen" or (item.Kind == "Water" and "Gießen" or "Düngen")
					actionButton(c, ui.gardenSel == item.Id and "Abwählen" or verb, ui.gardenSel == item.Id and C.line or C.green, true, function()
						if ui.gardenSel == item.Id then
							ui.gardenSel = nil
							GameUI.Refresh("garten")
						else
							ui.gardenSel = item.Id
							GameUI.Toast(GardenData.LootName(item) .. " gewählt: jetzt ein Beet antippen", r.Color)
							GameUI.Open("garten", "beete")
						end
					end)
				end
			end
		end
		if n == 0 then
			local c = card(list)
			text(c, 0, 52, "📜", 44, C.ink, EMOJI)
			text(c, 56, 22, "Noch leer", 20, C.ink, FONT)
			text(c, 80, 70, "Öffne Münzrollen, um Bäume, Gießkannen und Dünger zu bekommen.", 12, C.muted, TEXT)
			actionButton(c, "Zu den Rollen", C.green, true, function() GameUI.Open("garten", "rollen") end)
		end
		return
	end

	-- Beete
	local sel = ui.gardenSel and GardenData.ById[ui.gardenSel]
	local any = false
	for i = 1, g.Beds do
		local plot = g.Plots[tostring(i)]
		if plot and GardenData.Ripe(plot, now) > 0 then any = true end
	end
	local top = new("TextButton", { Name = "AllesErnten", Size = UDim2.new(0, 150, 1, 0), BackgroundColor3 = any and C.green or C.line, Text = "🧺 Alles ernten", Font = FONT, TextSize = 16, TextColor3 = Color3.new(1, 1, 1), LayoutOrder = 2, Parent = w.tools }, { corner(R.Round) })
	pressable(top, function() if any then gardenDo("gardenHarvest", "all") end end)
	for i = 1, g.Beds do
		local plot = g.Plots[tostring(i)]
		local tree = plot and GardenData.ById[plot.Tree]
		local r = tree and GardenData.RarityById[tree.Rarity]
		local c = card(list, r and r.Color or Color3.fromRGB(110, 80, 50))
		c.LayoutOrder = i
		text(c, 0, 16, "BEET " .. i, 12, C.muted, MONO)
		if not plot then
			text(c, 20, 52, "🟫", 40, C.ink, EMOJI)
			text(c, 76, 22, "Leer", 20, C.ink, FONT)
			if sel and sel.Type == "Tree" then
				actionButton(c, "Säen: " .. GardenData.LootName(sel), C.green, true, function() gardenDo("gardenPlant", tostring(i), sel.Id) end)
			else
				text(c, 102, 40, "Wähle unter „Sachen“ Samen zum Säen.", 12, C.muted, TEXT)
			end
		else
			local stage = GardenData.Stage(plot, now)
			local phase = GardenData.PhaseOf(GardenData.Progress(plot, now))
			local ripe = GardenData.Ripe(plot, now)
			text(c, 20, 46, (plot.Golden and "✨" or "") .. (phase <= 2 and "🌱" or lootIcon(tree)), ({ 24, 30, 36, 40, 42 })[phase], C.ink, EMOJI)
			local treeName = GardenData.TreeName(tree, plot.Golden)
			text(c, 68, 22, treeName, #treeName > 15 and 15 or 19, plot.Golden and C.goldHi or C.ink, FONT)
			local left = GardenData.HarvestsLeft(plot)
			text(c, 90, 16, rarityName(r) .. (phase < 5 and (" · " .. GardenData.PhaseNames[phase]) or ""), 12, r.Color)
			local live = text(c, 108, 16, "", 12, C.muted, MONO)
			if stage < 3 then
				local bar = new("Frame", { Size = UDim2.new(1, 0, 0, 8), Position = UDim2.new(0, 0, 0, 130), BackgroundColor3 = C.bg, Parent = c }, { corner(R.Round) })
				local fillBar = new("Frame", { Size = UDim2.new(0, 0, 1, 0), BackgroundColor3 = C.green, Parent = bar }, { corner(R.Round) })
				live.TextColor3 = C.ink
				table.insert(ui.gardenLive, function(t)
					live.Text = "⏳ " .. GardenData.FormatTime(GardenData.GrowLeft(plot, t))
					fillBar.Size = UDim2.new(math.clamp((t - plot.Planted + plot.Bonus) / tree.Grow, 0, 1), 0, 1, 0)
				end)
			else
				local dots = {}
				for k = 1, GardenData.Garden.MaxRipe do
					table.insert(dots, k <= ripe and fruitIcon(tree) or "⚪")
				end
				text(c, 128, 18, table.concat(dots, " ") .. "   noch " .. left .. "×", 14, left <= 2 and C.red or C.ink, EMOJI)
				table.insert(ui.gardenLive, function(t)
					local since = math.max(GardenData.GrownAt(plot), plot.Harvested or 0)
					local r2 = GardenData.Ripe(plot, t)
					live.Text = r2 >= GardenData.Garden.MaxRipe and "voll, bitte ernten" or ("nächste in " .. GardenData.FormatTime(tree.Cycle - (t - since) % tree.Cycle))
				end)
			end
			if (plot.BoostEnd or 0) > now then
				local boost = text(c, 148, 16, "", 12, Color3.fromRGB(184, 224, 122), MONO)
				table.insert(ui.gardenLive, function(t)
					boost.Text = "Dünger ×" .. plot.Boost .. " · " .. GardenData.FormatTime(plot.BoostEnd - t)
				end)
			end
			-- Knöpfe: Auswahl anwenden, ernten oder ausgraben
			local canUse = sel and sel.Type == "Tool" and ((sel.Kind == "Water" and stage < 3) or sel.Kind == "Boost")
			if canUse then
				actionButton(c, (sel.Kind == "Water" and "Gießen: " or "Düngen: ") .. sel.Name, C.blue, true, function() gardenDo("gardenUse", sel.Id, tostring(i)) end)
			elseif ripe > 0 then
				local b = actionButton(c, "Ernten · +" .. GardenData.FruitLabel(tree, GardenData.HarvestFruits(plot, now)), C.green, true, function() gardenDo("gardenHarvest", tostring(i)) end)
				b.TextSize = 14
			else
				local dig = actionButton(c, "Ausgraben", C.line, true, function() gardenDo("gardenDig", tostring(i)) end)
				dig.TextSize = 14
			end
		end
	end
	if g.Beds < GardenData.Garden.MaxBeds then
		local price = GardenData.BedPrice(g.Beds)
		local c = card(list, C.line)
		c.LayoutOrder = 1000
		text(c, 0, 52, "➕", 40, C.ink, EMOJI)
		text(c, 56, 22, "Neues Beet", 20, C.ink, FONT)
		text(c, 80, 40, "Beet " .. (g.Beds + 1) .. " von " .. GardenData.Garden.MaxBeds, 12, C.muted, TEXT)
		actionButton(c, "Kaufen · " .. GameUI.Format(price), C.green, money >= price, function() gardenDo("gardenBed") end)
	end
	for _, fn in ipairs(ui.gardenLive) do fn(now) end
end

local function buildGarden(playerGui)
	local w = buildWindow(playerGui, "garten", "sprout", "Garten", GARDEN_TABS, fillGarden)
	-- Neu bauen, wenn sich Garten oder Taler ändern; jede Sekunde nur Countdowns, bei neuer Stufe oder Ernte neu
	w.deps = { "Garden", "@taler" }
end
function GameUI.OpenGarden(tab) GameUI.Open("garten", tab) end

-- Animation einer geöffneten Rolle vor dem Spieler (RollFx). ids: Sachen mit Komma.
-- In der Webseiten-Vorschau übernimmt das options.PlayRoll.
function GameUI.PlayRoll(rollId, itemId)
	if options.PlayRoll then
		return options.PlayRoll(rollId, itemId)
	end
	itemId = string.match(itemId or "", "[%w-]+")
	if not itemId then return end
	local character = player.Character
	local hrp = character and character:FindFirstChild("HumanoidRootPart")
	if not hrp then return end
	local RollFx = require(root:WaitForChild("RollFx"))
	-- etwas weiter weg, damit das ganze Rollband ins Bild passt
	local front = hrp.CFrame * CFrame.new(0, -3, -16)
	-- Vorderseite (−Z) der Animation zeigt zum Spieler
	local origin = CFrame.lookAt(front.Position, Vector3.new(hrp.Position.X, front.Position.Y, hrp.Position.Z))
	task.spawn(function()
		local fx = RollFx.Play(rollId, itemId, { CFrame = origin })
		task.wait(4)
		fx.Folder:Destroy()
	end)
end

local PLAYER_ACTIONS = { learn = true, resetSkills = true, daily = true, spin = true, group = true, code = true, setting = true, resetSettings = true }
local function defaultInvoke(action, a, b)
	if action == "aura" then
		local remote = root:FindFirstChild("AuraRemote")
		if remote then return remote:InvokeServer(a, b) end
		return false, "AuraRemote fehlt"
	end
	if action == "openRoll" or action:sub(1, 6) == "garden" then
		local remote = root:FindFirstChild("GardenRemote")
		if not remote then return false, "GardenRemote fehlt" end
		-- gardenBuy → buyGarden usw. (Namen wie in GardenData.Act)
		local map = { gardenBuy = "buyGarden", gardenBed = "buyBed", gardenPlant = "plant", gardenUse = "use", gardenHarvest = "harvest", gardenDig = "dig", gardenFence = "fence", gardenSell = "sell", gardenSeed = "seed" }
		return remote:InvokeServer(map[action] or action, a, b)
	end
	if PLAYER_ACTIONS[action] then
		local remote = root:FindFirstChild("PlayerRemote")
		if remote then return remote:InvokeServer(action, a, b) end
		return false, "PlayerRemote fehlt"
	end
	local remote = root:FindFirstChild("ShopRemote")
	if not remote then return false, "ShopRemote fehlt" end
	return remote:InvokeServer(action, a, b)
end
-- Daten für Fenster: Wettervorhersage (aus der Uhrzeit, wie der Server), Ranglisten vom Server
local function defaultQuery(kind, arg)
	if kind == "forecast" then
		local Gacha = require(root:WaitForChild("Gacha"))
		local out, d, t = {}, MutationData.WeatherDuration, os.time()
		for i = 0, 8 do
			local w, left = Gacha.CurrentWeather(t + i * d)
			local ends = t + i * d + left
			table.insert(out, { Id = w.Id, Starts = ends - d, Ends = ends })
		end
		return out
	end
	local remote = root:FindFirstChild("PlayerRemote")
	if remote then return remote:InvokeServer(kind, arg) end
	return nil
end
local function defaultAction(name, arg)
	local event = root:FindFirstChild("UIAction")
	if event then
		event:Fire(name, arg)
	end
end

function GameUI.Start(opts)
	opts = opts or {}
	options.Invoke = opts.Invoke or defaultInvoke
	options.OnAction = opts.OnAction or defaultAction
	options.DevTools = opts.DevTools == true
	options.Query = opts.Query or defaultQuery
	options.CodeHint = opts.CodeHint
	options.Sound = opts.Sound
	options.LevelBanner = opts.LevelBanner
	options.PlayRoll = opts.PlayRoll
	local playerGui = player:WaitForChild("PlayerGui")
	ui.hud = buildHud(playerGui)
	-- Ebenen für Effekte: über allen Fenstern; der Blitz deckt auch die Roblox-Leiste ab
	ui.flashGui = new("ScreenGui", { Name = "CoinmasterBlitz", ResetOnSpawn = false, IgnoreGuiInset = true, DisplayOrder = 19, Parent = playerGui })
	ui.fx = new("ScreenGui", { Name = "CoinmasterEffekte", ResetOnSpawn = false, DisplayOrder = 20, Parent = playerGui })
	buildShop(playerGui)
	buildInventory(playerGui)
	buildWorlds(playerGui)
	buildMore(playerGui)
	buildGarden(playerGui)
	local DEPS = {
		shop = { "@taler", "EggDiscount", "Egg_", "Boost_", "OwnedAuras", "Aura" },
		inventar = { "Slots", "Egg_", "@inventory" },
		welten = { "@taler", "World", "Worlds", "Portals", "Rebirths" },
		skills = { "Skills", "Level" },
		einstellungen = { "Set_" },
		wetter = { "Skills", "@weather" },
		belohnung = { "DailyDay", "DailyStreak", "WheelDay", "Group" },
		codes = { "Codes" },
		ranglisten = { "@taler", "Level", "Rebirths", "CoinsFound" },
	}
	for key, deps in pairs(DEPS) do
		if windows[key] then windows[key].deps = deps end
	end
	-- Anordnung nach Bildschirmgröße, auch beim Drehen oder Ändern der Fenstergröße
	applyLayout()
	if workspace.CurrentCamera then
		workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(applyLayout)
	end
	refreshHud()
	-- Änderungen am Spielstand: HUD und offenen Shop neu füllen
	local pending = false
	local function changed()
		if pending then return end
		pending = true
		task.defer(function()
			pending = false
			refreshHud()
			refreshWindows()
		end)
	end
	player.AttributeChanged:Connect(changed)
	ReplicatedStorage:GetAttributeChangedSignal("Weather"):Connect(changed)
	-- Münzen vom Server: erst alles, danach nur Änderungen
	local inventoryEvent = root:WaitForChild("InventoryEvent", 10)
	if inventoryEvent and inventoryEvent:IsA("RemoteEvent") then
		inventoryEvent.OnClientEvent:Connect(GameUI.ApplyInventory)
		inventoryEvent:FireServer("full")
	end
	local stats = player:FindFirstChild("leaderstats")
	if stats and stats:FindFirstChild("Taler") then
		stats.Taler.Changed:Connect(changed)
	end
	-- Countdowns jede Sekunde
	task.spawn(function()
		while true do
			task.wait(1)
			refreshHud()
			tickWindows()
		end
	end)
	return GameUI
end

return GameUI
`;

// Server: Eier und Boosts kaufen, Münzen verkaufen, Welten, Portale, Wiedergeburt (Taler aus leaderstats.Taler)
export const SHOP_SERVER = `-- Coinmaster Adventure · Shop, Inventar und Welten (Server)
-- Alles über die RemoteFunction ShopRemote; der Server prüft Preis, Taler und Regeln (WorldData).
-- Ein gekauftes Ei zählt das Attribut Egg_<id> hoch, ein Boost setzt Boost_<id> auf sein Ende (os.time()).
-- Münzen liegen als Stapel im Spielstand (PlayerData), Welten und Portale als Ids mit Komma in Worlds und
-- Portals, die aktuelle Welt in World, Wiedergeburten in Rebirths. Gespeichert wird über PlayerData.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local HttpService = game:GetService("HttpService")
local root = ReplicatedStorage:WaitForChild("CoinmasterAdventure")
local EggData = require(root:WaitForChild("EggData"))
local ShopData = require(root:WaitForChild("ShopData"))
local CoinData = require(root:WaitForChild("CoinData"))
local MutationData = require(root:WaitForChild("MutationData"))
local WorldData = require(root:WaitForChild("WorldData"))
local PlayerData = require(game:GetService("ServerScriptService"):WaitForChild("CoinmasterServer"):WaitForChild("PlayerData"))

local remote = root:FindFirstChild("ShopRemote")
if not remote then
	remote = Instance.new("RemoteFunction")
	remote.Name = "ShopRemote"
	remote.Parent = root
end
if not root:FindFirstChild("UIAction") then
	local e = Instance.new("BindableEvent")
	e.Name = "UIAction"
	e.Parent = root
end

local lastCall = {}
local teleport, sellCoins
local function talerOf(player)
	local stats = player:FindFirstChild("leaderstats")
	local taler = stats and stats:FindFirstChild("Taler")
	if taler and (taler:IsA("IntValue") or taler:IsA("NumberValue")) then
		return taler
	end
	return nil
end
local function pay(player, price)
	local taler = talerOf(player)
	if not taler then
		return false, "Keine Taler gefunden (leaderstats.Taler fehlt)"
	end
	if taler.Value < price then
		return false, "Zu wenig Taler"
	end
	taler.Value = taler.Value - price
	return true
end

local function stateOf(player)
	local taler = talerOf(player)
	return {
		Owned = WorldData.ParseList(player:GetAttribute("Worlds")),
		Portals = WorldData.ParseList(player:GetAttribute("Portals") or "p1"),
		Taler = taler and taler.Value or 0,
		Rebirths = player:GetAttribute("Rebirths") or 0,
	}
end

-- Spieler in eine Welt setzen: Modell „Welt_<Name>“ aus der .rbxmx-Datei, dort der Spawn oder die Mitte
teleport = function(player, world)
	player:SetAttribute("World", world.Id)
	local model = workspace:FindFirstChild("Welt_" .. world.Name:gsub("%s+", ""), true)
	local character = player.Character
	local rootPart = character and character:FindFirstChild("HumanoidRootPart")
	if not model or not rootPart then return end
	local target = nil
	local spawn = model:FindFirstChild("Spawn") or model:FindFirstChild("Teleport")
	if spawn and #spawn:GetChildren() > 0 then
		target = spawn:GetChildren()[1].CFrame
	else
		target = model:GetBoundingBox()
	end
	character:PivotTo(target + Vector3.new(0, 5, 0))
end

-- Münzen verkaufen: id = Positionen in der Liste (1-basiert, mit Komma) oder sellNormal für alle normalen ohne Mutation
sellCoins = function(player, action, key, count)
	local picks = {}
	if action == "sellNormal" then
		for k, st in pairs(PlayerData.Coins(player)) do
			local coin = CoinData.Coins[st.i]
			if coin and CoinData.TierById[coin.Tier].Index == 1 and not st.m then picks[k] = st.n end
		end
	else
		picks[key] = math.max(1, math.floor(tonumber(count) or 1))
	end
	local total, n = 0, 0
	for k, c in pairs(picks) do
		local took, value = PlayerData.TakeCoins(player, k, c)
		n, total = n + took, total + value
	end
	if n == 0 then return false, "Keine Münze gewählt" end
	local taler = talerOf(player)
	if not taler then return false, "Keine Taler gefunden (leaderstats.Taler fehlt)" end
	taler.Value = taler.Value + total
	return true, n .. " Münze" .. (n > 1 and "n" or "") .. " für " .. math.floor(total + 0.5) .. " Taler verkauft"
end

remote.OnServerInvoke = function(player, action, id, extra)
	if not PlayerData.IsReady(player) then return false, "Spielstand lädt noch" end
	local now = os.clock()
	if lastCall[player] and now - lastCall[player] < 0.25 then
		return false, "Zu schnell"
	end
	lastCall[player] = now
	if type(action) ~= "string" or (id ~= nil and (type(id) ~= "string" or #id > 2000)) then
		return false, "Ungültig"
	end
	id = id or ""
	if action == "buyEgg" then
		local egg = EggData.ById[id]
		if not egg or not egg.Price or egg.Price.Currency ~= "Coins" then
			return false, "Dieses Ei gibt es nicht für Taler"
		end
		local discount = math.clamp(player:GetAttribute("EggDiscount") or 0, 0, 90)
		local ok, err = pay(player, math.floor(egg.Price.Amount * (1 - discount / 100) + 0.5))
		if not ok then return false, err end
		player:SetAttribute("Egg_" .. id, (player:GetAttribute("Egg_" .. id) or 0) + 1)
		return true, egg.Name .. " gekauft"
	elseif action == "buyBoost" then
		local boost = ShopData.BoostById[id]
		if not boost then
			return false, "Diesen Boost gibt es nicht"
		end
		local ok, err = pay(player, boost.Price)
		if not ok then return false, err end
		local from = math.max(os.time(), player:GetAttribute("Boost_" .. id) or 0)
		player:SetAttribute("Boost_" .. id, from + boost.Minutes * 60)
		return true, boost.Name .. " aktiv"
	elseif action == "robux" then
		return false, "Robux-Angebote brauchen ein Developer Product"
	elseif action == "sell" or action == "sellNormal" then
		return sellCoins(player, action, id, extra)
	elseif action == "buyWorld" then
		local why = WorldData.CanBuy(stateOf(player), id)
		if why then return false, why end
		local world = WorldData.ById[id]
		local ok, err = pay(player, world.Price)
		if not ok then return false, err end
		player:SetAttribute("Worlds", (player:GetAttribute("Worlds") or "") .. "," .. id)
		teleport(player, world)
		return true, world.Name .. " freigeschaltet!"
	elseif action == "teleport" then
		local world = WorldData.ById[id]
		if not world or not WorldData.Owns(stateOf(player), id) then
			return false, "Diese Welt hast du noch nicht"
		end
		teleport(player, world)
		return true, "Teleportiert nach " .. world.Name
	elseif action == "portal" then
		local why = WorldData.CanOpenPortal(stateOf(player), id)
		if why then return false, why end
		local planet = WorldData.PlanetById[id]
		player:SetAttribute("Portals", (player:GetAttribute("Portals") or "p1") .. "," .. id)
		return true, planet.Portal.Name .. " bereit: " .. planet.Name .. " ist offen!"
	elseif action == "rebirth" then
		local n = player:GetAttribute("Rebirths") or 0
		local taler = talerOf(player)
		local cost = WorldData.RebirthCost(n)
		if not taler or taler.Value < cost then
			return false, "Zu wenig Taler"
		end
		taler.Value = 0
		player:SetAttribute("Rebirths", n + 1)
		return true, "Wiedergeburt " .. (n + 1) .. "! Münzwert jetzt ×" .. WorldData.RebirthMultiplier(n + 1)
	end
	return false, "Ungültig"
end

Players.PlayerRemoving:Connect(function(player)
	lastCall[player] = nil
end)
`;

// Client: startet die Oberfläche
export const UI_CLIENT = `-- Coinmaster Adventure · Oberfläche (Client)
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local root = ReplicatedStorage:WaitForChild("CoinmasterAdventure")
local GameUI = require(root:WaitForChild("GameUI"))
GameUI.Start()
`;
