// Spiel-Oberfläche für Roblox (Etappe 1): HUD, Menüleiste, Hinweise und Shop als ScreenGui.
// GameUI baut alles aus Frames, Buttons und Layouts; die Webseite führt dasselbe Modul aus und zeigt es 1:1.
// Reiner Text wie luau.js, damit es auch in Node prüfbar ist.

const str = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
const num = (n) => String(Math.round(n * 1000) / 1000);
const HEADER = (title) => `-- Coinmaster Adventure · ${title}
-- Automatisch erzeugt von der Coinmaster-Webseite. Änderungen besser dort machen
-- und neu übertragen, sonst gehen sie beim nächsten Import verloren.
`;

const EMOJI = { clover: '🍀', star: '⭐', cloud: '☁️' };

export function shopDataSource({ BOOSTS, ROBUX }) {
  const boosts = BOOSTS.map((b) => `{ Id = ${str(b.id)}, Name = ${str(b.name)}, Minutes = ${num(b.minutes)}, Price = ${num(b.price)}, Text = ${str(b.text)}, Icon = ${str(EMOJI[b.icon] || '✨')} }`);
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

export const GAME_UI = `${HEADER('Spiel-Oberfläche')}
-- GameUI.Start(options) baut die Oberfläche im PlayerGui des lokalen Spielers (LocalScript).
-- Spielstand kommt aus Attributen am Spieler: Taler (sonst leaderstats.Taler), Level, XP, XPMax, Points,
-- WorldName, WorldPlanet, Aura, OwnedAuras, Egg_<id> (Anzahl), Boost_<id> (Ende als os.time()),
-- EggDiscount (Prozent). Das Wetter steht an ReplicatedStorage (Weather, WeatherEnds).
-- Inventar: Coins (JSON-Liste { i = Münz-Id, m = Mutation, b = Fundbonus, t = Fundzeit }), Slots.
-- Welten: World (aktuelle Welt), Worlds und Portals (Ids mit Komma), Rebirths.
-- Garten: Garden (JSON, siehe GardenData), Aktionen garden… und openRoll gehen an GardenRemote.
-- options.PlayRoll(rollId, ids)            zeigt eine geöffnete Rolle (Standard: RollFx vor dem Spieler)
-- options.Invoke(action, a, b) → ok, text   Käufe und Aktionen (buyEgg, buyBoost, aura, robux, sell, sellNormal,
--                                           buyWorld, teleport, portal, rebirth); Standard: RemoteFunctions
-- options.OnAction(name, arg)               Menü-Knöpfe für Fenster, die es hier noch nicht gibt
-- options.DevTools                          zeigt Test-Knöpfe (nur Vorschau, z. B. „+ Test-Taler“)

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

-- ── Farben und Bausteine ──
local C = {
	bg = Color3.fromRGB(24, 21, 31), bg2 = Color3.fromRGB(36, 31, 46), line = Color3.fromRGB(60, 52, 74),
	gold = Color3.fromRGB(217, 178, 106), goldHi = Color3.fromRGB(255, 220, 140), ink = Color3.fromRGB(245, 239, 228),
	muted = Color3.fromRGB(170, 162, 182), green = Color3.fromRGB(64, 200, 112), red = Color3.fromRGB(232, 74, 90),
	blue = Color3.fromRGB(0, 162, 255),
}
local FONT = Enum.Font.FredokaOne
local BODY = Enum.Font.GothamBold

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
local function corner(r) return new("UICorner", { CornerRadius = r or UDim.new(0, 14) }) end
local function stroke(color, thickness, mode)
	return new("UIStroke", { Color = color, Thickness = thickness or 2, ApplyStrokeMode = mode or Enum.ApplyStrokeMode.Border })
end
local function label(props)
	local base = { BackgroundTransparency = 1, Font = BODY, TextColor3 = C.ink, TextScaled = false, TextSize = 16 }
	for k, v in pairs(props) do base[k] = v end
	return new("TextLabel", base)
end
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

local function mmss(seconds)
	seconds = math.max(0, math.floor(seconds))
	return string.format("%d:%02d", math.floor(seconds / 60), seconds % 60)
end

-- Knopf mit Hover-Vergrößerung und Klick-Wippe
local function pressable(button, onClick)
	local scale = new("UIScale", { Scale = 1, Parent = button })
	button.MouseEnter:Connect(function()
		TweenService:Create(scale, TweenInfo.new(0.12), { Scale = 1.06 }):Play()
	end)
	button.MouseLeave:Connect(function()
		TweenService:Create(scale, TweenInfo.new(0.12), { Scale = 1 }):Play()
	end)
	button.Activated:Connect(function()
		scale.Scale = 0.92
		TweenService:Create(scale, TweenInfo.new(0.18, Enum.EasingStyle.Back), { Scale = 1.06 }):Play()
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
		corner(UDim.new(0, 12)),
		stroke(color, 2),
		label({ Size = UDim2.new(1, -24, 1, 0), Position = UDim2.new(0, 12, 0, 0), Text = text, TextColor3 = C.ink, TextSize = 16, TextWrapped = true, Font = BODY }),
	})
	TweenService:Create(pill, TweenInfo.new(0.25, Enum.EasingStyle.Back), { Size = UDim2.new(0, 420, 0, 44) }):Play()
	task.delay(3.6, function()
		TweenService:Create(pill, TweenInfo.new(0.3), { BackgroundTransparency = 1, Size = UDim2.new(0, 420, 0, 0) }):Play()
		task.delay(0.32, function()
			pill:Destroy()
		end)
	end)
end

-- ── HUD ──
local function buildHud(playerGui)
	local gui = new("ScreenGui", { Name = "CoinmasterHUD", ResetOnSpawn = false, Parent = playerGui })

	-- Spieler: Level-Abzeichen, Name, Skillpunkte, Erfahrung
	local level = new("TextButton", { Name = "Level", Size = UDim2.new(0, 64, 0, 64), Position = UDim2.new(0, 16, 0, 8), BackgroundColor3 = C.gold, Text = "", AutoButtonColor = false, Parent = gui }, {
		corner(UDim.new(1, 0)),
		stroke(C.bg, 4),
		gradient(C.goldHi, Color3.fromRGB(176, 128, 52)),
	})
	ui.levelText = label({ Size = UDim2.new(1, 0, 1, 0), Text = "1", Font = FONT, TextSize = 30, TextColor3 = Color3.fromRGB(42, 30, 10), Parent = level })
	pressable(level, function() options.OnAction("skills") end)
	local info = new("Frame", { Name = "Spieler", Size = UDim2.new(0, 250, 0, 58), Position = UDim2.new(0, 72, 0, 11), BackgroundColor3 = C.bg, BackgroundTransparency = 0.12, Parent = gui }, {
		corner(UDim.new(0, 14)),
		new("UIPadding", { PaddingLeft = UDim.new(0, 16), PaddingRight = UDim.new(0, 10), PaddingTop = UDim.new(0, 6), PaddingBottom = UDim.new(0, 6) }),
	})
	ui.name = label({ Size = UDim2.new(1, 0, 0, 20), Text = player.DisplayName, TextXAlignment = Enum.TextXAlignment.Left, TextSize = 17, Font = FONT, Parent = info })
	ui.points = new("TextButton", { Name = "Skillpunkte", Size = UDim2.new(0, 112, 0, 20), Position = UDim2.new(1, -112, 0, 0), BackgroundColor3 = C.green, Text = "+1 Skillpunkt", Font = BODY, TextSize = 12, TextColor3 = Color3.fromRGB(10, 40, 20), Visible = false, Parent = info }, { corner(UDim.new(1, 0)) })
	pressable(ui.points, function() options.OnAction("skills") end)
	local bar = new("Frame", { Name = "EP", Size = UDim2.new(1, 0, 0, 10), Position = UDim2.new(0, 0, 0, 24), BackgroundColor3 = C.bg2, Parent = info }, { corner(UDim.new(1, 0)) })
	ui.xpFill = new("Frame", { Size = UDim2.new(0.2, 0, 1, 0), BackgroundColor3 = Color3.fromRGB(160, 120, 255), Parent = bar }, { corner(UDim.new(1, 0)), gradient(Color3.fromRGB(196, 160, 255), Color3.fromRGB(120, 80, 230)) })
	ui.xpText = label({ Size = UDim2.new(1, 0, 0, 14), Position = UDim2.new(0, 0, 0, 36), Text = "", TextSize = 11, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Font = Enum.Font.Code, Parent = info })

	-- Welt oben in der Mitte
	ui.world = new("Frame", { Name = "Welt", Size = UDim2.new(0, 220, 0, 38), Position = UDim2.new(0.5, 0, 0, 10), AnchorPoint = Vector2.new(0.5, 0), BackgroundColor3 = C.bg, BackgroundTransparency = 0.12, Parent = gui }, {
		corner(UDim.new(1, 0)),
		stroke(C.gold, 2),
	})
	ui.worldText = label({ Size = UDim2.new(1, -20, 1, 0), Position = UDim2.new(0, 10, 0, 0), Text = "Spawn", Font = FONT, TextSize = 20, Parent = ui.world })

	-- Taler, Wetter, Boosts oben rechts
	local right = new("Frame", { Name = "Rechts", Size = UDim2.new(0, 320, 0, 220), Position = UDim2.new(1, -16, 0, 8), AnchorPoint = Vector2.new(1, 0), BackgroundTransparency = 1, Parent = gui }, {
		new("UIListLayout", { Padding = UDim.new(0, 8), HorizontalAlignment = Enum.HorizontalAlignment.Right, SortOrder = Enum.SortOrder.LayoutOrder }),
	})
	local coins = new("Frame", { Name = "Taler", Size = UDim2.new(0, 220, 0, 52), BackgroundColor3 = C.bg, BackgroundTransparency = 0.08, LayoutOrder = 1, Parent = right }, {
		corner(UDim.new(1, 0)),
		stroke(C.gold, 3),
		label({ Size = UDim2.new(0, 46, 1, 0), Position = UDim2.new(0, 6, 0, 0), Text = "🪙", TextSize = 30, Font = Enum.Font.SourceSans }),
		label({ Name = "Einheit", Size = UDim2.new(0, 50, 1, 0), Position = UDim2.new(1, -60, 0, 2), Text = "Taler", TextSize = 13, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Right }),
	})
	ui.taler = label({ Size = UDim2.new(1, -116, 1, 0), Position = UDim2.new(0, 52, 0, 0), Text = "0", Font = FONT, TextSize = 28, TextColor3 = C.goldHi, TextXAlignment = Enum.TextXAlignment.Left, Parent = coins })
	ui.weather = new("TextButton", { Name = "Wetter", Size = UDim2.new(0, 300, 0, 36), BackgroundColor3 = C.bg, BackgroundTransparency = 0.12, Text = "", AutoButtonColor = false, LayoutOrder = 2, Parent = right }, { corner(UDim.new(1, 0)) })
	ui.weatherStroke = stroke(C.blue, 2)
	ui.weatherStroke.Parent = ui.weather
	ui.weatherText = label({ Size = UDim2.new(1, -20, 1, 0), Position = UDim2.new(0, 10, 0, 0), Text = "", TextSize = 14, Parent = ui.weather })
	pressable(ui.weather, function() options.OnAction("wetter") end)
	ui.boosts = new("Frame", { Name = "Boosts", Size = UDim2.new(0, 220, 0, 100), BackgroundTransparency = 1, LayoutOrder = 3, Parent = right }, {
		new("UIListLayout", { Padding = UDim.new(0, 6), HorizontalAlignment = Enum.HorizontalAlignment.Right }),
	})

	-- Menü links
	local menu = new("Frame", { Name = "Menue", Size = UDim2.new(0, 84, 0, 566), Position = UDim2.new(0, 16, 0.5, 20), AnchorPoint = Vector2.new(0, 0.5), BackgroundTransparency = 1, Parent = gui }, {
		new("UIListLayout", { Padding = UDim.new(0, 10), SortOrder = Enum.SortOrder.LayoutOrder }),
	})
	ui.badges = {}
	local entries = {
		{ "welten", "🌍", "Welten" }, { "skills", "🌳", "Skills" }, { "inventar", "🎒", "Inventar" },
		{ "shop", "🛒", "Shop" }, { "garten", "🌱", "Garten" }, { "index", "📖", "Index" }, { "einstellungen", "⚙️", "Optionen" },
	}
	for i, e in ipairs(entries) do
		local b = new("TextButton", { Name = e[1], Size = UDim2.new(0, 72, 0, 70), BackgroundColor3 = C.bg, BackgroundTransparency = 0.08, Text = "", LayoutOrder = i, Parent = menu }, {
			corner(UDim.new(0, 16)),
			stroke(C.gold, 2),
			label({ Size = UDim2.new(1, 0, 0, 38), Position = UDim2.new(0, 0, 0, 6), Text = e[2], TextSize = 30, Font = Enum.Font.SourceSans }),
			label({ Size = UDim2.new(1, 0, 0, 18), Position = UDim2.new(0, 0, 1, -22), Text = e[3], TextSize = 12, Font = BODY }),
		})
		local badge = new("TextLabel", { Name = "Zahl", Size = UDim2.new(0, 24, 0, 24), Position = UDim2.new(1, -14, 0, -8), BackgroundColor3 = C.red, Text = "", Font = BODY, TextSize = 13, TextColor3 = Color3.new(1, 1, 1), Visible = false, ZIndex = 2, Parent = b }, { corner(UDim.new(1, 0)), stroke(C.bg, 2) })
		ui.badges[e[1]] = badge
		pressable(b, function()
			if e[1] == "shop" or e[1] == "inventar" or e[1] == "welten" or e[1] == "garten" then
				GameUI.Toggle(e[1])
			else
				options.OnAction(e[1])
			end
		end)
	end

	-- Suchen unten in der Mitte
	ui.find = new("TextButton", { Name = "Suchen", Size = UDim2.new(0, 270, 0, 64), Position = UDim2.new(0.5, 0, 1, -34), AnchorPoint = Vector2.new(0.5, 1), BackgroundColor3 = C.green, Text = "🔍  Münze suchen", Font = FONT, TextSize = 26, TextColor3 = Color3.new(1, 1, 1), Parent = gui }, {
		corner(UDim.new(0, 18)),
		stroke(Color3.fromRGB(20, 90, 44), 3),
		gradient(Color3.fromRGB(96, 226, 140), Color3.fromRGB(36, 160, 84)),
	})
	new("UIStroke", { Color = Color3.fromRGB(20, 90, 44), Thickness = 2, Parent = ui.find })
	pressable(ui.find, function() options.OnAction("find") end)
	ui.findHint = label({ Size = UDim2.new(0, 320, 0, 18), Position = UDim2.new(0.5, 0, 1, -12), AnchorPoint = Vector2.new(0.5, 1), Text = "", TextSize = 12, TextColor3 = C.ink, TextStrokeTransparency = 0.5, Font = BODY, Parent = gui })

	-- Hinweise
	ui.toasts = new("Frame", { Name = "Hinweise", Size = UDim2.new(0, 420, 0, 200), Position = UDim2.new(0.5, 0, 1, -118), AnchorPoint = Vector2.new(0.5, 1), BackgroundTransparency = 1, Parent = gui }, {
		new("UIListLayout", { Padding = UDim.new(0, 6), HorizontalAlignment = Enum.HorizontalAlignment.Center, VerticalAlignment = Enum.VerticalAlignment.Bottom, SortOrder = Enum.SortOrder.LayoutOrder }),
	})
	return gui
end

local function refreshHud()
	if not ui.taler then return end
	ui.taler.Text = GameUI.Format(taler())
	local lvl, xp, xpMax = attr("Level", 1), attr("XP", 0), attr("XPMax", 100)
	ui.levelText.Text = tostring(lvl)
	ui.xpFill.Size = UDim2.new(math.clamp(xp / math.max(1, xpMax), 0.02, 1), 0, 1, 0)
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
		ui.weatherText.Text = "☁️ " .. w.Name .. (m and (" · " .. m.Name .. " " .. m.Chance .. " %") or "") .. "  " .. mmss(left)
		ui.weatherStroke.Color = w.Color
	end
	-- aktive Boosts
	for _, c in ipairs(ui.boosts:GetChildren()) do
		if c:IsA("GuiObject") then c:Destroy() end
	end
	for _, b in ipairs(ShopData.Boosts) do
		local left = attr("Boost_" .. b.Id, 0) - os.time()
		if left > 0 then
			new("Frame", { Size = UDim2.new(0, 200, 0, 28), BackgroundColor3 = C.bg, BackgroundTransparency = 0.12, Parent = ui.boosts }, {
				corner(UDim.new(1, 0)),
				stroke(C.green, 2),
				label({ Size = UDim2.new(1, -16, 1, 0), Position = UDim2.new(0, 8, 0, 0), Text = b.Icon .. " " .. b.Name .. "  " .. mmss(left), TextSize = 13 }),
			})
		end
	end
end

-- ── Shop ──
local TABS = { { "eier", "🥚 Eier" }, { "boosts", "⚡ Boosts" }, { "auras", "✨ Auras" }, { "robux", "💎 Robux" } }

local function card(parent, accent)
	return new("Frame", { Size = UDim2.new(0, 100, 0, 100), BackgroundColor3 = C.bg2, Parent = parent }, {
		corner(UDim.new(0, 16)),
		stroke(accent or C.line, 2),
		new("UIPadding", { PaddingLeft = UDim.new(0, 12), PaddingRight = UDim.new(0, 12), PaddingTop = UDim.new(0, 12), PaddingBottom = UDim.new(0, 12) }),
	})
end
local function actionButton(parent, text, color, enabled, onClick)
	local b = new("TextButton", { Name = "Kaufen", Size = UDim2.new(1, 0, 0, 40), Position = UDim2.new(0, 0, 1, -40), BackgroundColor3 = color, Text = text, Font = FONT, TextSize = 17, TextColor3 = Color3.new(1, 1, 1), AutoButtonColor = enabled, Parent = parent }, {
		corner(UDim.new(0, 12)),
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
local function result(ok, text, color)
	GameUI.Toast(text or (ok and "Gekauft" or "Das geht gerade nicht"), ok and (color or C.gold) or C.red)
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
			-- Ei: Oval mit Glanz
			local shape = new("Frame", { Size = UDim2.new(0, 64, 0, 82), Position = UDim2.new(0.5, 0, 0, 0), AnchorPoint = Vector2.new(0.5, 0), BackgroundColor3 = egg.Color, Parent = c }, {
				corner(UDim.new(0.5, 0)),
				stroke(egg.Glow, 3),
				new("UIGradient", { Rotation = 35, Color = ColorSequence.new(Color3.new(1, 1, 1), Color3.fromRGB(150, 150, 150)) }),
			})
			label({ Size = UDim2.new(1, 0, 0, 22), Position = UDim2.new(0, 0, 0, 88), Text = egg.Name, Font = FONT, TextSize = 20, Parent = c })
			local owned = attr("Egg_" .. egg.Id, 0)
			label({ Size = UDim2.new(1, 0, 0, 16), Position = UDim2.new(0, 0, 0, 112), Text = egg.RankName .. (owned > 0 and (" · im Inventar: " .. owned) or ""), TextSize = 12, TextColor3 = egg.Glow, Parent = c })
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
				actionButton(c, "🔒 " .. egg.Availability, C.line, false, function() end)
			end
			shape.Name = "Ei"
		end
	elseif windows.shop.tab == "boosts" then
		for i, b in ipairs(ShopData.Boosts) do
			local c = card(list)
			c.LayoutOrder = i
			label({ Size = UDim2.new(1, 0, 0, 52), Text = b.Icon, TextSize = 42, Font = Enum.Font.SourceSans, Parent = c })
			label({ Size = UDim2.new(1, 0, 0, 22), Position = UDim2.new(0, 0, 0, 56), Text = b.Name, Font = FONT, TextSize = 20, Parent = c })
			label({ Size = UDim2.new(1, 0, 0, 52), Position = UDim2.new(0, 0, 0, 80), Text = b.Text, TextSize = 12, TextColor3 = C.muted, TextWrapped = true, Font = Enum.Font.Gotham, Parent = c })
			local left = attr("Boost_" .. b.Id, 0) - os.time()
			label({ Size = UDim2.new(1, 0, 0, 16), Position = UDim2.new(0, 0, 0, 134), Text = b.Minutes .. " Minuten" .. (left > 0 and (" · noch " .. mmss(left)) or ""), TextSize = 12, TextColor3 = left > 0 and C.green or C.muted, Font = Enum.Font.Code, Parent = c })
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
				corner(UDim.new(1, 0)),
				stroke(r.Color, 3),
				new("UIGradient", { Rotation = 45, Color = ColorSequence.new(keys) }),
			})
			label({ Size = UDim2.new(1, 0, 0, 20), Position = UDim2.new(0, 0, 0, 50), Text = a.Name, Font = FONT, TextSize = 18, Parent = c })
			label({ Size = UDim2.new(1, 0, 0, 14), Position = UDim2.new(0, 0, 0, 72), Text = r.Name, TextSize = 11, TextColor3 = r.Color, Parent = c })
			label({ Size = UDim2.new(1, 0, 0, 16), Position = UDim2.new(0, 0, 0, 88), Text = "+" .. a.Bonus.Value .. " % " .. (AuraData.BonusNames[a.Bonus.Type] or ""), TextSize = 13, TextColor3 = Color3.fromRGB(159, 227, 181), Font = Enum.Font.Code, Parent = c })
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
			label({ Size = UDim2.new(1, 0, 0, 52), Text = r.Id == "release" and "🥚" or r.Id == "vip" and "⭐" or "🪙", TextSize = 42, Font = Enum.Font.SourceSans, Parent = c })
			label({ Size = UDim2.new(1, 0, 0, 22), Position = UDim2.new(0, 0, 0, 56), Text = r.Name, Font = FONT, TextSize = 20, Parent = c })
			label({ Size = UDim2.new(1, 0, 0, 52), Position = UDim2.new(0, 0, 0, 80), Text = r.Text, TextSize = 12, TextColor3 = C.muted, TextWrapped = true, Font = Enum.Font.Gotham, Parent = c })
			if r.Badge then
				new("TextLabel", { Size = UDim2.new(0, 80, 0, 22), Position = UDim2.new(1, 6, 0, -18), AnchorPoint = Vector2.new(1, 0), BackgroundColor3 = C.red, Text = r.Badge, Font = BODY, TextSize = 12, TextColor3 = Color3.new(1, 1, 1), ZIndex = 2, Parent = c }, { corner(UDim.new(1, 0)) })
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

local function buildWindow(playerGui, key, icon, title, tabs, fill)
	local w = { key = key, tabs = tabs, fill = fill, buttons = {}, tab = tabs[1][1] }
	local gui = new("ScreenGui", { Name = "Coinmaster" .. title, ResetOnSpawn = false, DisplayOrder = 5, Enabled = false, Parent = playerGui })
	local dim = new("TextButton", { Name = "Abdunkeln", Size = UDim2.new(1, 0, 1, 0), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0.45, Text = "", AutoButtonColor = false, Parent = gui })
	dim.Activated:Connect(function() GameUI.Close(key) end)
	local win = new("Frame", { Name = "Fenster", Size = UDim2.new(0.84, 0, 0.84, 0), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundColor3 = C.bg, Parent = gui }, {
		corner(UDim.new(0, 22)),
		stroke(C.gold, 3),
		new("UISizeConstraint", { MaxSize = Vector2.new(980, 640) }),
	})
	w.scale = new("UIScale", { Scale = 1, Parent = win })
	local head = new("Frame", { Name = "Kopf", Size = UDim2.new(1, -40, 0, 64), Position = UDim2.new(0, 20, 0, 14), BackgroundTransparency = 1, Parent = win })
	new("Frame", { Size = UDim2.new(0, 56, 0, 56), BackgroundColor3 = C.gold, Parent = head }, {
		corner(UDim.new(0, 14)),
		gradient(C.goldHi, Color3.fromRGB(176, 128, 52)),
		label({ Size = UDim2.new(1, 0, 1, 0), Text = icon, TextSize = 30, Font = Enum.Font.SourceSans }),
	})
	label({ Size = UDim2.new(0.5, 0, 0, 34), Position = UDim2.new(0, 70, 0, 2), Text = title, Font = FONT, TextSize = 34, TextXAlignment = Enum.TextXAlignment.Left, Parent = head })
	w.sub = label({ Size = UDim2.new(0.6, 0, 0, 18), Position = UDim2.new(0, 70, 0, 38), Text = "", TextSize = 13, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Font = Enum.Font.Code, Parent = head })
	-- Werkzeuge rechts im Kopf (z. B. „Zum Spawn“)
	w.tools = new("Frame", { Name = "Werkzeuge", Size = UDim2.new(0, 360, 0, 38), Position = UDim2.new(1, -58, 0, 8), AnchorPoint = Vector2.new(1, 0), BackgroundTransparency = 1, Parent = head }, {
		new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, HorizontalAlignment = Enum.HorizontalAlignment.Right, Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
	})
	local close = new("TextButton", { Name = "Schliessen", Size = UDim2.new(0, 46, 0, 46), Position = UDim2.new(1, 0, 0, 4), AnchorPoint = Vector2.new(1, 0), BackgroundColor3 = C.red, Text = "✕", Font = BODY, TextSize = 22, TextColor3 = Color3.new(1, 1, 1), Parent = head }, { corner(UDim.new(0, 12)) })
	pressable(close, function() GameUI.Close(key) end)
	local row = new("Frame", { Name = "Reiter", Size = UDim2.new(1, -40, 0, 40), Position = UDim2.new(0, 20, 0, 88), BackgroundTransparency = 1, Parent = win }, {
		new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
	})
	for i, t in ipairs(tabs) do
		local b = new("TextButton", { Name = t[1], Size = UDim2.new(0, t[3] or 132, 1, 0), BackgroundColor3 = C.bg2, Text = t[2], Font = FONT, TextSize = 18, TextColor3 = C.ink, LayoutOrder = i, Parent = row }, { corner(UDim.new(1, 0)) })
		w.buttons[t[1]] = b
		pressable(b, function()
			w.tab = t[1]
			w.keep = {}
			if w.onTab then w.onTab(t[1]) end
			GameUI.Refresh(key)
		end)
	end
	w.body = new("Frame", { Name = "Inhalt", Size = UDim2.new(1, -40, 1, -150), Position = UDim2.new(0, 20, 0, 140), BackgroundTransparency = 1, Parent = win })
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

function GameUI.Refresh(key)
	local w = windows[key]
	if not w or not w.gui.Enabled then return end
	for _, t in ipairs(w.tabs) do
		local on = t[1] == w.tab
		w.buttons[t[1]].BackgroundColor3 = on and C.gold or C.bg2
		w.buttons[t[1]].TextColor3 = on and Color3.fromRGB(42, 30, 10) or C.ink
	end
	-- Bildlauf merken, dann neu füllen
	for _, d in ipairs(w.body:GetDescendants()) do
		if d:IsA("ScrollingFrame") then w.keep[d.Name] = d.CanvasPosition end
	end
	w.fill(w)
end
local function refreshWindows()
	for key in pairs(windows) do
		GameUI.Refresh(key)
	end
end

function GameUI.Open(key, tab)
	local w = windows[key]
	if not w then return end
	for other, o in pairs(windows) do
		if other ~= key then o.gui.Enabled = false end
	end
	if tab and w.buttons[tab] then
		w.tab = tab
	elseif w.defaultTab and not w.gui.Enabled then
		w.tab = w.defaultTab()
	end
	w.keep = {}
	if w.onTab then w.onTab(w.tab) end
	w.gui.Enabled = true
	w.scale.Scale = 0.85
	TweenService:Create(w.scale, TweenInfo.new(0.22, Enum.EasingStyle.Back), { Scale = 1 }):Play()
	GameUI.Refresh(key)
end
function GameUI.Close(key)
	if key == nil then
		for _, w in pairs(windows) do w.gui.Enabled = false end
	elseif windows[key] then
		windows[key].gui.Enabled = false
	end
end
function GameUI.IsOpen(key)
	if key == nil then
		for _, w in pairs(windows) do
			if w.gui.Enabled then return true end
		end
		return false
	end
	return windows[key] ~= nil and windows[key].gui.Enabled
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
	local w = buildWindow(playerGui, "shop", "🛒", "Shop", TABS, fillShop)
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

-- Münzen aus dem Attribut Coins (JSON), mit Wert und Stufe
local function coinEntries()
	local ok, list = pcall(function()
		return HttpService:JSONDecode(attr("Coins", "[]"))
	end)
	local out = {}
	if not ok or type(list) ~= "table" then return out end
	for index, e in ipairs(list) do
		local coin = CoinData.Coins[e.i]
		if coin then
			local tier = CoinData.TierById[coin.Tier]
			local mutation = e.m and MutationData.ById[e.m] or nil
			table.insert(out, {
				Index = index, Coin = coin, Tier = tier, Mutation = mutation, At = e.t or 0,
				Value = CoinData.EntryValue(e.i, mutation and mutation.Multiplier or 1, e.b),
			})
		end
	end
	return out
end

local function firstLetter(text)
	return text:match("^[%z\\1-\\127\\194-\\244][\\128-\\191]*") or "?"
end

-- Münze aus Frames: Metall-Verlauf, Rand in Stufenfarbe, innerer Ring, Anfangsbuchstabe
local function coinDisc(parent, entry, size, position)
	local metal = entry.Coin.Metal
	local disc = new("Frame", { Name = "Muenze", Size = UDim2.new(0, size, 0, size), Position = position, AnchorPoint = Vector2.new(0.5, 0), BackgroundColor3 = Color3.new(1, 1, 1), Parent = parent }, {
		corner(UDim.new(1, 0)),
		stroke(entry.Tier.Color, math.max(2, size / 22)),
		new("UIGradient", { Rotation = 45, Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, metal.Light), ColorSequenceKeypoint.new(0.5, metal.Mid), ColorSequenceKeypoint.new(1, metal.Dark) }) }),
	})
	new("Frame", { Name = "Ring", Size = UDim2.new(0.72, 0, 0.72, 0), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundTransparency = 1, Parent = disc }, {
		corner(UDim.new(1, 0)),
		stroke(metal.Dark, math.max(1, size / 40)),
	})
	label({ Size = UDim2.new(1, 0, 1, 0), Text = firstLetter(entry.Coin.Name), Font = FONT, TextSize = size * 0.42, TextColor3 = metal.Dark, Parent = disc })
	if entry.Mutation then
		new("Frame", { Name = "Mutation", Size = UDim2.new(0, size * 0.26, 0, size * 0.26), Position = UDim2.new(0.86, 0, 0.02, 0), AnchorPoint = Vector2.new(0.5, 0), BackgroundColor3 = entry.Mutation.Color, ZIndex = 2, Parent = disc }, {
			corner(UDim.new(1, 0)),
			stroke(C.bg, 2),
		})
	end
	return disc
end

local function pill(parent, text, color, y)
	local width = math.max(60, utf8.len(text) * 8 + 22)
	return new("TextLabel", { Size = UDim2.new(0, width, 0, 22), Position = UDim2.new(0.5, 0, 0, y), AnchorPoint = Vector2.new(0.5, 0), BackgroundColor3 = color, BackgroundTransparency = 0.75, Text = text, TextColor3 = color, Font = BODY, TextSize = 12, Parent = parent }, {
		corner(UDim.new(1, 0)),
		stroke(color, 1),
	})
end

local function smallButton(parent, text, order, width, onClick, on)
	local b = new("TextButton", { Size = UDim2.new(0, width, 0, 34), BackgroundColor3 = on and C.gold or C.bg2, Text = text, Font = BODY, TextSize = 13, TextColor3 = on and Color3.fromRGB(42, 30, 10) or C.ink, LayoutOrder = order, Parent = parent }, {
		corner(UDim.new(0, 10)),
		stroke(C.line, 1),
	})
	pressable(b, onClick)
	return b
end

local function sell(indices, w)
	if #indices == 0 then return end
	local ok, text = options.Invoke("sell", table.concat(indices, ","))
	if result(ok, text) then
		ui.invSel = nil
		GameUI.Refresh("inventar")
	end
end

local function fillCoins(w, entries)
	local cap = attr("Slots", 30)
	local full = #entries >= cap
	local main = new("Frame", { Name = "Muenzen", Size = UDim2.new(1, -276, 1, 0), BackgroundTransparency = 1, Parent = w.body })
	local bar = new("Frame", { Name = "Werkzeuge", Size = UDim2.new(1, 0, 0, 36), BackgroundTransparency = 1, Parent = main }, {
		new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, VerticalAlignment = Enum.VerticalAlignment.Center, Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
	})
	label({ Size = UDim2.new(0, 130, 1, 0), Text = #entries .. " / " .. cap .. " Plätze" .. (full and " · voll" or ""), Font = FONT, TextSize = 17, TextColor3 = full and C.red or C.ink, TextXAlignment = Enum.TextXAlignment.Left, LayoutOrder = 1, Parent = bar })
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
		return a.Index > b.Index
	end)

	if #list == 0 then
		label({ Size = UDim2.new(1, 0, 0, 80), Position = UDim2.new(0, 0, 0, 60), Text = #entries > 0 and "Keine Münze passt zum Filter." or "Noch keine Münzen. Mit „Münze suchen“ findest du welche.", TextColor3 = C.muted, TextSize = 15, TextWrapped = true, Parent = main })
	else
		local grid = scroller(w, main, "Raster", { Size = UDim2.new(1, 8, 1, -46), Position = UDim2.new(0, 0, 0, 46) }, {
			new("UIGridLayout", { CellSize = UDim2.new(0, 104, 0, 128), CellPadding = UDim2.new(0, 10, 0, 10), SortOrder = Enum.SortOrder.LayoutOrder }),
			new("UIPadding", { PaddingTop = UDim.new(0, 4), PaddingBottom = UDim.new(0, 8), PaddingLeft = UDim.new(0, 2), PaddingRight = UDim.new(0, 12) }),
		})
		for order, e in ipairs(list) do
			local selected = ui.invSel == e.Index
			local cell = new("TextButton", { Name = "Muenze" .. e.Index, BackgroundColor3 = C.bg2, Text = "", AutoButtonColor = false, LayoutOrder = order, Parent = grid }, {
				corner(UDim.new(0, 14)),
				stroke(selected and C.goldHi or e.Tier.Color, selected and 3 or 1.5),
			})
			coinDisc(cell, e, 62, UDim2.new(0.5, 0, 0, 8))
			label({ Size = UDim2.new(1, -10, 0, 18), Position = UDim2.new(0, 5, 0, 76), Text = e.Coin.Name, TextScaled = true, Font = BODY, Parent = cell })
			label({ Size = UDim2.new(1, -10, 0, 18), Position = UDim2.new(0, 5, 0, 98), Text = GameUI.Format(e.Value), TextSize = 13, Font = Enum.Font.Code, TextColor3 = C.goldHi, Parent = cell })
			pressable(cell, function()
				ui.invSel = e.Index
				GameUI.Refresh("inventar")
			end)
		end
	end

	-- Seitenleiste: gewählte Münze und Verkaufen
	local side = new("Frame", { Name = "Auswahl", Size = UDim2.new(0, 262, 1, 0), Position = UDim2.new(1, -262, 0, 0), BackgroundColor3 = C.bg2, Parent = w.body }, {
		corner(UDim.new(0, 18)),
		stroke(C.line, 2),
		new("UIPadding", { PaddingLeft = UDim.new(0, 14), PaddingRight = UDim.new(0, 14), PaddingTop = UDim.new(0, 14), PaddingBottom = UDim.new(0, 14) }),
	})
	local sel = nil
	for _, e in ipairs(entries) do
		if e.Index == ui.invSel then sel = e end
	end
	if sel then
		coinDisc(side, sel, 84, UDim2.new(0.5, 0, 0, 0))
		pill(side, sel.Tier.Name, sel.Tier.Color, 90)
		label({ Size = UDim2.new(1, 0, 0, 24), Position = UDim2.new(0, 0, 0, 116), Text = sel.Coin.Name, Font = FONT, TextScaled = true, Parent = side })
		local y = 144
		if sel.Mutation then
			pill(side, sel.Mutation.Name .. " ×" .. tostring(sel.Mutation.Multiplier):gsub("%.", ","), sel.Mutation.Color, y)
			y = y + 28
		end
		label({ Size = UDim2.new(1, 0, 0, 32), Position = UDim2.new(0, 0, 0, y), Text = sel.Coin.Text, TextSize = 12, TextWrapped = true, TextColor3 = C.muted, Font = Enum.Font.Gotham, Parent = side })
		label({ Size = UDim2.new(1, 0, 0, 18), Position = UDim2.new(0, 0, 0, y + 34), Text = "Wert: " .. GameUI.Format(sel.Value) .. " Taler" .. (sel.At > 0 and ("  ·  " .. os.date("%d.%m.%y", sel.At)) or ""), TextSize = 13, TextColor3 = C.goldHi, Parent = side })
		local b = actionButton(side, "Verkaufen · " .. GameUI.Format(sel.Value), C.green, true, function() sell({ sel.Index }, w) end)
		b.Position = UDim2.new(0, 0, 1, -110)
	else
		label({ Size = UDim2.new(1, 0, 0, 50), Position = UDim2.new(0, 0, 0, 30), Text = "🪙", TextSize = 40, Font = Enum.Font.SourceSans, Parent = side })
		label({ Size = UDim2.new(1, 0, 0, 60), Position = UDim2.new(0, 0, 0, 84), Text = "Wähle eine Münze, um sie dir anzusehen oder zu verkaufen.", TextSize = 14, TextWrapped = true, TextColor3 = C.muted, Parent = side })
	end
	local normal = {}
	for _, e in ipairs(entries) do
		if e.Tier.Index == 1 and not e.Mutation then table.insert(normal, e.Index) end
	end
	local all = actionButton(side, "Alle normalen verkaufen (" .. #normal .. ")", C.blue, #normal > 0, function() sell(normal, w) end)
	all.Position = UDim2.new(0, 0, 1, -62)
	all.TextSize = 15
	label({ Size = UDim2.new(1, 0, 0, 16), Position = UDim2.new(0, 0, 1, -16), Text = "Münzen mit Mutation bleiben im Inventar.", TextSize = 11, TextColor3 = C.muted, Font = Enum.Font.Gotham, Parent = side })
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
				corner(UDim.new(0, 16)),
				stroke(egg.Glow, 2),
			})
			new("Frame", { Name = "Ei", Size = UDim2.new(0, 40, 0, 52), Position = UDim2.new(0, 18, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), BackgroundColor3 = egg.Color, Parent = row }, {
				corner(UDim.new(0.5, 0)),
				stroke(egg.Glow, 2),
				new("UIGradient", { Rotation = 35, Color = ColorSequence.new(Color3.new(1, 1, 1), Color3.fromRGB(150, 150, 150)) }),
			})
			label({ Size = UDim2.new(0.6, 0, 0, 24), Position = UDim2.new(0, 76, 0, 12), Text = egg.Name, Font = FONT, TextSize = 20, TextXAlignment = Enum.TextXAlignment.Left, Parent = row })
			label({ Size = UDim2.new(0.6, 0, 0, 18), Position = UDim2.new(0, 76, 0, 38), Text = egg.RankName, TextSize = 13, TextColor3 = egg.Glow, TextXAlignment = Enum.TextXAlignment.Left, Parent = row })
			label({ Size = UDim2.new(0, 90, 1, 0), Position = UDim2.new(1, -106, 0, 0), Text = "×" .. n, Font = FONT, TextSize = 28, TextColor3 = C.goldHi, TextXAlignment = Enum.TextXAlignment.Right, Parent = row })
		end
	end
	if not any then
		label({ Size = UDim2.new(1, 0, 0, 40), Text = "Noch keine Eier. Im Shop gibt es welche.", TextSize = 15, TextColor3 = C.muted, Parent = list })
	end
	label({ Size = UDim2.new(1, -190, 0, 40), Position = UDim2.new(0, 0, 1, -40), Text = "Eier schlüpfen im Spiel nach einer Brutzeit.", TextSize = 13, TextWrapped = true, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Font = Enum.Font.Gotham, Parent = w.body })
	local shop = new("TextButton", { Name = "ZumShop", Size = UDim2.new(0, 170, 0, 40), Position = UDim2.new(1, 0, 1, 0), AnchorPoint = Vector2.new(1, 1), BackgroundColor3 = C.green, Text = "🛒 Eier kaufen", Font = FONT, TextSize = 17, TextColor3 = Color3.new(1, 1, 1), Parent = w.body }, { corner(UDim.new(0, 12)) })
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
	w.sub.Text = #entries .. " Münzen · " .. eggs .. " Eier"
	if w.tab == "eier" then
		fillEggs(w)
	elseif w.tab == "tiere" then
		label({ Size = UDim2.new(1, -80, 0, 80), Position = UDim2.new(0, 40, 0, 60), Text = "Hier erscheinen deine geschlüpften Haustiere mit ihrem Bonus, sobald das Schlüpfen im Spiel läuft.", TextSize = 16, TextWrapped = true, TextColor3 = C.muted, Parent = w.body })
	else
		fillCoins(w, entries)
	end
end

local function buildInventory(playerGui)
	buildWindow(playerGui, "inventar", "🎒", "Inventar", { { "muenzen", "🪙 Münzen" }, { "eier", "🥚 Eier" }, { "tiere", "🐾 Haustiere", 150 } }, fillInventory)
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
	local b = new("TextButton", { Size = UDim2.new(0, 132, 1, 0), BackgroundColor3 = C.bg2, Text = text, Font = BODY, TextSize = 13, TextColor3 = C.ink, AutoButtonColor = enabled, LayoutOrder = order, Parent = parent }, {
		corner(UDim.new(0, 10)),
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
		corner(UDim.new(0, 12)),
	})
	if world.ComingSoon then
		img.BackgroundColor3 = C.line
		label({ Size = UDim2.new(1, 0, 1, 0), Text = "?", Font = FONT, TextSize = 46, TextColor3 = C.muted, Parent = img })
		label({ Size = UDim2.new(1, 0, 0, 16), Position = UDim2.new(0, 0, 0, 98), Text = "···", TextSize = 12, TextColor3 = C.muted, Font = Enum.Font.Code, Parent = c })
		label({ Size = UDim2.new(1, 0, 0, 24), Position = UDim2.new(0, 0, 0, 116), Text = "Coming soon", Font = FONT, TextSize = 20, Parent = c })
		label({ Size = UDim2.new(1, 0, 0, 30), Position = UDim2.new(0, 0, 0, 142), Text = "Kommt mit einem späteren Update.", TextSize = 12, TextWrapped = true, TextColor3 = C.muted, Font = Enum.Font.Gotham, Parent = c })
		actionButton(c, "🔒 Bald", C.line, false, function() end)
		return c
	end
	new("UIGradient", { Rotation = 120, Color = ColorSequence.new(world.Ground, accent), Parent = img })
	label({ Size = UDim2.new(1, 0, 1, 0), Text = world.Planet == "hub" and "🏛️" or "🌍", TextSize = 40, Font = Enum.Font.SourceSans, Parent = img })
	if here then
		new("TextLabel", { Size = UDim2.new(0, 100, 0, 22), Position = UDim2.new(0, 8, 0, 8), BackgroundColor3 = C.gold, Text = "Du bist hier", Font = BODY, TextSize = 12, TextColor3 = Color3.fromRGB(42, 30, 10), Parent = img }, { corner(UDim.new(1, 0)) })
	end
	label({ Size = UDim2.new(1, 0, 0, 16), Position = UDim2.new(0, 0, 0, 98), Text = "Welt " .. number, TextSize = 12, TextColor3 = C.muted, Font = Enum.Font.Code, Parent = c })
	label({ Size = UDim2.new(1, 0, 0, 24), Position = UDim2.new(0, 0, 0, 116), Text = world.Name, Font = FONT, TextScaled = true, Parent = c })
	local luck = world.Luck > 0 and ("+" .. decimal(world.Luck * 100) .. " %") or "±0 %"
	label({ Size = UDim2.new(1, 0, 0, 18), Position = UDim2.new(0, 0, 0, 146), Text = "🍀 " .. luck .. "    💎 ×" .. decimal(world.Value), TextSize = 13, TextColor3 = Color3.fromRGB(159, 227, 181), Font = Enum.Font.Code, Parent = c })
	local why = WorldData.CanBuy(st, world.Id)
	if here then
		actionButton(c, "✔ Hier bist du", C.line, false, function() end)
	elseif owned then
		actionButton(c, "🌀 Teleportieren", C.blue, true, function()
			if result(options.Invoke("teleport", world.Id)) then GameUI.Close("welten") end
		end)
	elseif not why or why == "Zu wenig Taler" then
		local b = actionButton(c, "Kaufen · " .. GameUI.Format(world.Price), C.green, true, function()
			local now = worldState()
			local reason = WorldData.CanBuy(now, world.Id)
			if reason == "Zu wenig Taler" then
				result(false, "Dafür fehlen noch " .. GameUI.Format(math.ceil(world.Price - now.Taler)) .. " Taler")
			elseif result(options.Invoke("buyWorld", world.Id)) then
				GameUI.Close("welten")
			end
		end)
		if why then b.BackgroundTransparency = 0.45 end
	else
		local b = actionButton(c, "🔒 " .. why, C.line, false, function() end)
		b.TextScaled = true
	end
	return c
end

local function portalBanner(parent, st, planet)
	if not planet.Portal or st.Portals[planet.Id] then return 0 end
	local banner = new("Frame", { Name = "Portal", Size = UDim2.new(1, -12, 0, 112), Position = UDim2.new(0, 0, 0, 86), BackgroundColor3 = C.bg2, Parent = parent }, {
		corner(UDim.new(0, 18)),
		stroke(planet.Color, 2),
	})
	new("Frame", { Size = UDim2.new(0, 70, 0, 70), Position = UDim2.new(0, 18, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), BackgroundColor3 = planet.Color, BackgroundTransparency = 0.6, Parent = banner }, {
		corner(UDim.new(1, 0)),
		stroke(planet.Color, 2),
		label({ Size = UDim2.new(1, 0, 1, 0), Text = planet.ComingSoon and "🔒" or (planet.Id == "p2" and "🚀" or "🌀"), TextSize = 36, Font = Enum.Font.SourceSans }),
	})
	if planet.ComingSoon then
		label({ Size = UDim2.new(1, -130, 0, 26), Position = UDim2.new(0, 106, 0, 24), Text = planet.Name .. " · Coming soon", Font = FONT, TextSize = 22, TextXAlignment = Enum.TextXAlignment.Left, Parent = banner })
		label({ Size = UDim2.new(1, -130, 0, 40), Position = UDim2.new(0, 106, 0, 52), Text = planet.Text .. " Kommt mit einem späteren Update.", TextSize = 13, TextWrapped = true, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Font = Enum.Font.Gotham, Parent = banner })
		return 124
	end
	label({ Size = UDim2.new(1, -340, 0, 26), Position = UDim2.new(0, 106, 0, 10), Text = planet.Portal.Name .. " nach " .. planet.Name, Font = FONT, TextSize = 22, TextXAlignment = Enum.TextXAlignment.Left, Parent = banner })
	label({ Size = UDim2.new(1, -340, 0, 18), Position = UDim2.new(0, 106, 0, 36), Text = planet.Portal.Text, TextSize = 13, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Font = Enum.Font.Gotham, Parent = banner })
	for i, check in ipairs(WorldData.PortalChecks(st, planet.Id)) do
		label({ Size = UDim2.new(1, -340, 0, 18), Position = UDim2.new(0, 106, 0, 40 + i * 22), Text = (check[2] and "✔ " or "🔒 ") .. check[1], TextSize = 13, TextColor3 = check[2] and C.green or C.ink, TextXAlignment = Enum.TextXAlignment.Left, Parent = banner })
	end
	local why = WorldData.CanOpenPortal(st, planet.Id)
	local holder = new("Frame", { Size = UDim2.new(0, 210, 0, 44), Position = UDim2.new(1, -20, 0.5, 22), AnchorPoint = Vector2.new(1, 0.5), BackgroundTransparency = 1, Parent = banner })
	actionButton(holder, why and "Noch verschlossen" or (planet.Portal.Name .. " starten"), C.green, why == nil, function()
		result(options.Invoke("portal", planet.Id), nil, planet.Color)
	end)
	return 124
end

local function fillPlanet(w, planet, st)
	new("Frame", { Name = "Planet", Size = UDim2.new(1, 0, 0, 78), BackgroundTransparency = 1, Parent = w.body }, {
		label({ Size = UDim2.new(1, 0, 0, 16), Text = string.upper(planet.Name), TextSize = 12, TextColor3 = planet.Color, TextXAlignment = Enum.TextXAlignment.Left, Font = Enum.Font.Code }),
		label({ Size = UDim2.new(1, 0, 0, 30), Position = UDim2.new(0, 0, 0, 16), Text = planet.Title, Font = FONT, TextSize = 26, TextXAlignment = Enum.TextXAlignment.Left }),
		label({ Size = UDim2.new(1, 0, 0, 30), Position = UDim2.new(0, 0, 0, 46), Text = planet.Text, TextSize = 13, TextWrapped = true, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, Font = Enum.Font.Gotham }),
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
		corner(UDim.new(0, 12)),
		label({ Size = UDim2.new(1, -20, 0, 16), Position = UDim2.new(0, 10, 0, 8), Text = title, TextSize = 12, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left }),
		label({ Size = UDim2.new(1, -20, 0, 26), Position = UDim2.new(0, 10, 0, 26), Text = value, Font = FONT, TextSize = 22, TextColor3 = color or C.ink, TextXAlignment = Enum.TextXAlignment.Left }),
	})
end

local function fillRebirth(w, st)
	local cost = WorldData.RebirthCost(st.Rebirths)
	local hero = new("Frame", { Name = "Wiedergeburten", Size = UDim2.new(0, 210, 1, 0), BackgroundColor3 = C.bg2, Parent = w.body }, {
		corner(UDim.new(0, 18)),
		stroke(C.goldHi, 2),
		gradient(Color3.fromRGB(255, 240, 200), Color3.fromRGB(150, 130, 110)),
		label({ Size = UDim2.new(1, 0, 0, 60), Position = UDim2.new(0, 0, 0.5, -96), Text = "♻️", TextSize = 50, Font = Enum.Font.SourceSans }),
		label({ Size = UDim2.new(1, 0, 0, 70), Position = UDim2.new(0, 0, 0.5, -34), Text = tostring(st.Rebirths), Font = FONT, TextSize = 64, TextColor3 = C.goldHi }),
		label({ Size = UDim2.new(1, 0, 0, 20), Position = UDim2.new(0, 0, 0.5, 40), Text = "Wiedergeburt" .. (st.Rebirths == 1 and "" or "en"), TextSize = 14, TextColor3 = C.muted }),
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
		corner(UDim.new(1, 0)),
		stroke(C.line, 1),
	})
	new("Frame", { Size = UDim2.new(math.max(pct, 0.02), 0, 1, 0), BackgroundColor3 = C.gold, Parent = bar }, { corner(UDim.new(1, 0)), gradient(C.goldHi, Color3.fromRGB(176, 128, 52)) })
	label({ Size = UDim2.new(1, 0, 0, 18), Position = UDim2.new(0, 0, 0, 168), Text = GameUI.Format(math.floor(st.Taler)) .. " von " .. GameUI.Format(cost) .. " Taler", TextSize = 13, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Font = Enum.Font.Code, Parent = main })
	local rules = {
		{ "✕ Deine Taler sind danach weg", C.red },
		{ "✔ Welten, Portale, Münzen, Eier, Level und Skills bleiben", C.ink },
		{ "✔ Jede Münze ist für immer " .. math.floor(WorldData.Rebirth.Bonus * 100 + 0.5) .. " % mehr wert", C.ink },
	}
	for i, r in ipairs(rules) do
		label({ Size = UDim2.new(1, 0, 0, 20), Position = UDim2.new(0, 0, 0, 180 + i * 24), Text = r[1], TextSize = 14, TextColor3 = r[2], TextXAlignment = Enum.TextXAlignment.Left, Parent = main })
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
		result(options.Invoke("rebirth"), nil, C.goldHi)
		GameUI.Refresh("welten")
	end)
	b.Size = UDim2.new(1, 0, 1, 0)
	b.Position = UDim2.new(0, 0, 0, 0)
	b.TextSize = 20
end

local function fillWorlds(w)
	clear(w.body)
	clear(w.tools)
	local st = worldState()
	local here = WorldData.ById[attr("World", "spawn")]
	local inHub = not here or here.Planet == "hub"
	local planet = here and WorldData.PlanetById[here.Planet]
	w.sub.Text = (inHub and "Spawn" or (planet.Name .. " · " .. here.Name)) .. " · " .. GameUI.Format(st.Taler) .. " Taler"
	toolButton(w.tools, inHub and "Im Spawn" or "🏛️ Zum Spawn", 1, not inHub, function()
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
	table.insert(tabs, { "wiedergeburt", "♻️ Wiedergeburt", 170 })
	local w = buildWindow(playerGui, "welten", "🌍", "Welten", tabs, fillWorlds)
	-- Standard-Reiter: Planet der aktuellen Welt
	w.defaultTab = function()
		local here = WorldData.ById[attr("World", "spawn")]
		return (here and here.Planet ~= "hub") and here.Planet or WorldData.Planets[1].Id
	end
end
function GameUI.OpenWorlds(tab) GameUI.Open("welten", tab) end
-- ── Münzbaumgarten: Beete, Sachen aus Münzrollen, Rollen kaufen ──
-- Spielstand aus dem Attribut Garden (JSON, schreibt der Server). Aktionen über Invoke:
-- gardenBuy, gardenBed, gardenPlant (Beet, Baum), gardenUse (Werkzeug, Beet), gardenHarvest (Beet | "all"),
-- gardenDig (Beet), openRoll (Rolle) → ok, Text, Ids. Danach spielt GameUI.PlayRoll die Animation.
local GARDEN_TABS = { { "beete", "🌳 Beete" }, { "sachen", "🎒 Sachen" }, { "rollen", "📜 Rollen" } }
local STAGE_NAMES = { "Setzling", "Jungbaum", "Ausgewachsen" }
local LOOT_ICON = { bush = "🌿", round = "🌳", oval = "🌳", cone = "🌲", blossom = "🌸", weeping = "🌳", palm = "🌴", star = "🌌", can = "💧", sack = "🌱", bag = "💰", spade = "⚒️", chest = "💎" }
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
		table.insert(parts, p and (p.Tree .. GardenData.Stage(p, now) .. GardenData.Ripe(p, now) .. ((p.BoostEnd or 0) > now and "d" or "")) or "-")
	end
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

local function fillGarden(w)
	ui.gardenLive = {}
	clear(w.body)
	clear(w.tools)
	local g = gardenState()
	local now = os.time()
	local money = taler()
	ui.gardenSig = gardenSignature(g, now)
	w.sub.Text = GameUI.Format(money) .. " Taler · " .. (g.Owned and (g.Beds .. " Beete") or "noch kein Garten")
	if g.Owned then
		local go = new("TextButton", { Name = "Besuchen", Size = UDim2.new(0, 150, 1, 0), BackgroundColor3 = C.blue, Text = "🚪 Zum Garten", Font = FONT, TextSize = 16, TextColor3 = Color3.new(1, 1, 1), LayoutOrder = 1, Parent = w.tools }, { corner(UDim.new(1, 0)) })
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
				corner(UDim.new(0, 8)),
				stroke(roll.Glow, 2),
				new("Frame", { Size = UDim2.new(1, 0, 0, 18), Position = UDim2.new(0, 0, 0.5, -9), BackgroundColor3 = roll.Band, BorderSizePixel = 0 }),
			})
			text(c, 70, 22, roll.Name, 20, C.ink, FONT)
			text(c, 94, 16, roll.RankName .. " · " .. roll.Items .. " Sachen", 12, roll.Glow)
			local guarantee = roll.Guarantee and ("Garantie ab " .. GardenData.RarityById[roll.Guarantee].Name) or "Ohne Garantie"
			text(c, 114, 32, guarantee .. " · Glück ×" .. roll.Luck, 12, C.muted, Enum.Font.Gotham)
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
		text(c, 0, 52, "🌳", 44, C.ink, Enum.Font.SourceSans)
		text(c, 56, 22, "Münzbaumgarten", 20, C.ink, FONT)
		text(c, 80, 70, GardenData.Garden.StartBeds .. " Beete für Münzbäume aus Münzrollen. Ausgewachsen tragen sie Taler.", 12, C.muted, Enum.Font.Gotham)
		actionButton(c, "Kaufen · " .. GameUI.Format(GardenData.Garden.Price), C.green, money >= GardenData.Garden.Price, function()
			gardenDo("gardenBuy")
		end)
		return
	end

	if w.tab == "sachen" then
		local n = 0
		for _, item in ipairs(GardenData.Loot) do
			local count = g.Inv[item.Id] or 0
			if count > 0 then
				n = n + 1
				local r = GardenData.RarityById[item.Rarity]
				local c = card(list, ui.gardenSel == item.Id and C.goldHi or r.Color)
				c.LayoutOrder = n
				text(c, 0, 46, lootIcon(item), 38, C.ink, Enum.Font.SourceSans)
				text(c, 50, 22, item.Name .. "  ×" .. count, 18, C.ink, FONT)
				text(c, 74, 16, r.Name .. (item.Type == "Tree" and " · Münzbaum" or " · Werkzeug"), 12, r.Color)
				local info = item.Type == "Tree" and (GameUI.Format(item.Yield) .. " Taler alle " .. GardenData.FormatTime(item.Cycle) .. " · wächst " .. GardenData.FormatTime(item.Grow)) or item.Text
				text(c, 94, 48, info, 12, C.muted, Enum.Font.Gotham)
				if item.Kind == "Taler" or item.Kind == "Bed" then
					actionButton(c, "Benutzen", C.blue, true, function() gardenDo("gardenUse", item.Id) end)
				else
					local verb = item.Type == "Tree" and "Pflanzen" or (item.Kind == "Water" and "Gießen" or "Düngen")
					actionButton(c, ui.gardenSel == item.Id and "Abwählen" or verb, ui.gardenSel == item.Id and C.line or C.green, true, function()
						if ui.gardenSel == item.Id then
							ui.gardenSel = nil
							GameUI.Refresh("garten")
						else
							ui.gardenSel = item.Id
							GameUI.Toast(item.Name .. " gewählt: jetzt ein Beet antippen", r.Color)
							GameUI.Open("garten", "beete")
						end
					end)
				end
			end
		end
		if n == 0 then
			local c = card(list)
			text(c, 0, 52, "📜", 44, C.ink, Enum.Font.SourceSans)
			text(c, 56, 22, "Noch leer", 20, C.ink, FONT)
			text(c, 80, 70, "Öffne Münzrollen, um Bäume, Gießkannen und Dünger zu bekommen.", 12, C.muted, Enum.Font.Gotham)
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
	local top = new("TextButton", { Name = "AllesErnten", Size = UDim2.new(0, 150, 1, 0), BackgroundColor3 = any and C.green or C.line, Text = "🧺 Alles ernten", Font = FONT, TextSize = 16, TextColor3 = Color3.new(1, 1, 1), LayoutOrder = 2, Parent = w.tools }, { corner(UDim.new(1, 0)) })
	pressable(top, function() if any then gardenDo("gardenHarvest", "all") end end)
	for i = 1, g.Beds do
		local plot = g.Plots[tostring(i)]
		local tree = plot and GardenData.ById[plot.Tree]
		local r = tree and GardenData.RarityById[tree.Rarity]
		local c = card(list, r and r.Color or Color3.fromRGB(110, 80, 50))
		c.LayoutOrder = i
		text(c, 0, 16, "BEET " .. i, 12, C.muted, Enum.Font.Code)
		if not plot then
			text(c, 20, 52, "🟫", 40, C.ink, Enum.Font.SourceSans)
			text(c, 76, 22, "Leer", 20, C.ink, FONT)
			if sel and sel.Type == "Tree" then
				actionButton(c, "Pflanzen: " .. sel.Name, C.green, true, function() gardenDo("gardenPlant", tostring(i), sel.Id) end)
			else
				text(c, 102, 40, "Wähle unter „Sachen“ einen Baum zum Pflanzen.", 12, C.muted, Enum.Font.Gotham)
			end
		else
			local stage = GardenData.Stage(plot, now)
			local ripe = GardenData.Ripe(plot, now)
			text(c, 20, 46, lootIcon(tree), stage == 1 and 26 or (stage == 2 and 34 or 42), C.ink, Enum.Font.SourceSans)
			text(c, 68, 22, tree.Name, 19, C.ink, FONT)
			text(c, 90, 16, r.Name .. " · " .. STAGE_NAMES[stage], 12, r.Color)
			local live = text(c, 108, 16, "", 12, C.muted, Enum.Font.Code)
			if stage < 3 then
				local bar = new("Frame", { Size = UDim2.new(1, 0, 0, 8), Position = UDim2.new(0, 0, 0, 130), BackgroundColor3 = C.bg, Parent = c }, { corner(UDim.new(1, 0)) })
				local fillBar = new("Frame", { Size = UDim2.new(0, 0, 1, 0), BackgroundColor3 = C.green, Parent = bar }, { corner(UDim.new(1, 0)) })
				table.insert(ui.gardenLive, function(t)
					live.Text = "fertig in " .. GardenData.FormatTime(GardenData.GrownAt(plot) - t)
					fillBar.Size = UDim2.new(math.clamp((t - plot.Planted + plot.Bonus) / tree.Grow, 0, 1), 0, 1, 0)
				end)
			else
				local dots = {}
				for k = 1, GardenData.Garden.MaxRipe do
					table.insert(dots, k <= ripe and "🪙" or "⚪")
				end
				text(c, 128, 18, table.concat(dots, " "), 14, C.ink, Enum.Font.SourceSans)
				table.insert(ui.gardenLive, function(t)
					local since = math.max(GardenData.GrownAt(plot), plot.Harvested or 0)
					local r2 = GardenData.Ripe(plot, t)
					live.Text = r2 >= GardenData.Garden.MaxRipe and "voll, bitte ernten" or ("nächste in " .. GardenData.FormatTime(tree.Cycle - (t - since) % tree.Cycle))
				end)
			end
			if (plot.BoostEnd or 0) > now then
				local boost = text(c, 148, 16, "", 12, Color3.fromRGB(184, 224, 122), Enum.Font.Code)
				table.insert(ui.gardenLive, function(t)
					boost.Text = "Dünger ×" .. plot.Boost .. " · " .. GardenData.FormatTime(plot.BoostEnd - t)
				end)
			end
			-- Knöpfe: Auswahl anwenden, ernten oder ausgraben
			local canUse = sel and sel.Type == "Tool" and ((sel.Kind == "Water" and stage < 3) or sel.Kind == "Boost")
			if canUse then
				actionButton(c, (sel.Kind == "Water" and "Gießen: " or "Düngen: ") .. sel.Name, C.blue, true, function() gardenDo("gardenUse", sel.Id, tostring(i)) end)
			elseif ripe > 0 then
				actionButton(c, "Ernten · +" .. GameUI.Format(GardenData.HarvestValue(plot, now)), C.green, true, function() gardenDo("gardenHarvest", tostring(i)) end)
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
		text(c, 0, 52, "➕", 40, C.ink, Enum.Font.SourceSans)
		text(c, 56, 22, "Neues Beet", 20, C.ink, FONT)
		text(c, 80, 40, "Beet " .. (g.Beds + 1) .. " von " .. GardenData.Garden.MaxBeds, 12, C.muted, Enum.Font.Gotham)
		actionButton(c, "Kaufen · " .. GameUI.Format(price), C.green, money >= price, function() gardenDo("gardenBed") end)
	end
	for _, fn in ipairs(ui.gardenLive) do fn(now) end
end

local function buildGarden(playerGui)
	buildWindow(playerGui, "garten", "🌳", "Garten", GARDEN_TABS, fillGarden)
end
function GameUI.OpenGarden(tab) GameUI.Open("garten", tab) end

-- Jede Sekunde: Countdowns weiterzählen, bei neuer Stufe oder Ernte neu aufbauen
local function tickGarden()
	if not GameUI.IsOpen("garten") or windows.garten.tab == "rollen" then return end
	local now = os.time()
	if gardenSignature(gardenState(), now) ~= ui.gardenSig then
		GameUI.Refresh("garten")
	else
		for _, fn in ipairs(ui.gardenLive) do fn(now) end
	end
end

-- Animation einer geöffneten Rolle vor dem Spieler (RollFx). ids: Sachen mit Komma.
-- In der Webseiten-Vorschau übernimmt das options.PlayRoll.
function GameUI.PlayRoll(rollId, ids)
	if options.PlayRoll then
		return options.PlayRoll(rollId, ids)
	end
	local list = {}
	for id in string.gmatch(ids or "", "[%w-]+") do
		table.insert(list, id)
	end
	local character = player.Character
	local hrp = character and character:FindFirstChild("HumanoidRootPart")
	if not hrp then return end
	local RollFx = require(root:WaitForChild("RollFx"))
	local front = hrp.CFrame * CFrame.new(0, -3, -12)
	-- Vorderseite (−Z) der Animation zeigt zum Spieler
	local origin = CFrame.lookAt(front.Position, Vector3.new(hrp.Position.X, front.Position.Y, hrp.Position.Z))
	task.spawn(function()
		local fx = RollFx.Play(rollId, list, { CFrame = origin })
		task.wait(5)
		fx.Folder:Destroy()
	end)
end

-- Standard-Verbindungen in Roblox: Käufe über RemoteFunctions, fremde Fenster als BindableEvent
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
		local map = { gardenBuy = "buyGarden", gardenBed = "buyBed", gardenPlant = "plant", gardenUse = "use", gardenHarvest = "harvest", gardenDig = "dig" }
		return remote:InvokeServer(map[action] or action, a, b)
	end
	local remote = root:FindFirstChild("ShopRemote")
	if not remote then return false, "ShopRemote fehlt" end
	return remote:InvokeServer(action, a, b)
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
	options.PlayRoll = opts.PlayRoll
	local playerGui = player:WaitForChild("PlayerGui")
	buildHud(playerGui)
	buildShop(playerGui)
	buildInventory(playerGui)
	buildWorlds(playerGui)
	buildGarden(playerGui)
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
	player:GetAttributeChangedSignal("Coins"):Connect(function()
		ui.invSel = nil
	end)
	local stats = player:FindFirstChild("leaderstats")
	if stats and stats:FindFirstChild("Taler") then
		stats.Taler.Changed:Connect(changed)
	end
	-- Countdowns jede Sekunde
	task.spawn(function()
		while true do
			task.wait(1)
			refreshHud()
			tickGarden()
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
-- Münzen stehen als JSON im Attribut Coins, Welten und Portale als Ids mit Komma in Worlds und Portals,
-- die aktuelle Welt in World, Wiedergeburten in Rebirths. Speichern (DataStore) fehlt noch.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local HttpService = game:GetService("HttpService")
local root = ReplicatedStorage:WaitForChild("CoinmasterAdventure")
local EggData = require(root:WaitForChild("EggData"))
local ShopData = require(root:WaitForChild("ShopData"))
local CoinData = require(root:WaitForChild("CoinData"))
local MutationData = require(root:WaitForChild("MutationData"))
local WorldData = require(root:WaitForChild("WorldData"))

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
sellCoins = function(player, action, id)
	local ok, list = pcall(function()
		return HttpService:JSONDecode(player:GetAttribute("Coins") or "[]")
	end)
	if not ok or type(list) ~= "table" then return false, "Inventar unlesbar" end
	local pick = {}
	if action == "sellNormal" then
		for i, e in ipairs(list) do
			local coin = CoinData.Coins[e.i]
			if coin and CoinData.TierById[coin.Tier].Index == 1 and not e.m then pick[i] = true end
		end
	else
		for n in string.gmatch(id, "%d+") do
			pick[tonumber(n)] = true
		end
	end
	local keep, total, count = {}, 0, 0
	for i, e in ipairs(list) do
		if pick[i] then
			local m = e.m and MutationData.ById[e.m]
			total = total + CoinData.EntryValue(e.i, m and m.Multiplier or 1, e.b)
			count = count + 1
		else
			table.insert(keep, e)
		end
	end
	if count == 0 then return false, "Keine Münze gewählt" end
	local taler = talerOf(player)
	if not taler then return false, "Keine Taler gefunden (leaderstats.Taler fehlt)" end
	taler.Value = taler.Value + total
	player:SetAttribute("Coins", HttpService:JSONEncode(keep))
	return true, count .. " Münze" .. (count > 1 and "n" or "") .. " für " .. math.floor(total + 0.5) .. " Taler verkauft"
end

remote.OnServerInvoke = function(player, action, id)
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
		return sellCoins(player, action, id)
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
