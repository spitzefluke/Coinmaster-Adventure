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
-- options.Invoke(action, a, b) → ok, text   Käufe (buyEgg, buyBoost, aura, robux); Standard: RemoteFunctions
-- options.OnAction(name, arg)               Menü-Knöpfe für Fenster, die es hier noch nicht gibt

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local root = script.Parent
local EggData = require(root:WaitForChild("EggData"))
local ShopData = require(root:WaitForChild("ShopData"))
local AuraData = require(root:WaitForChild("AuraData"))
local MutationData = require(root:WaitForChild("MutationData"))

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
	local menu = new("Frame", { Name = "Menue", Size = UDim2.new(0, 84, 0, 486), Position = UDim2.new(0, 16, 0.5, 20), AnchorPoint = Vector2.new(0, 0.5), BackgroundTransparency = 1, Parent = gui }, {
		new("UIListLayout", { Padding = UDim.new(0, 10), SortOrder = Enum.SortOrder.LayoutOrder }),
	})
	ui.badges = {}
	local entries = {
		{ "welten", "🌍", "Welten" }, { "skills", "🌳", "Skills" }, { "inventar", "🎒", "Inventar" },
		{ "shop", "🛒", "Shop" }, { "index", "📖", "Index" }, { "einstellungen", "⚙️", "Optionen" },
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
			if e[1] == "shop" then
				GameUI.OpenShop()
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
local function result(ok, text)
	GameUI.Toast(text or (ok and "Gekauft" or "Das geht gerade nicht"), ok and C.gold or C.red)
end

local function fillShop()
	local list = ui.shopList
	for _, c in ipairs(list:GetChildren()) do
		if c:IsA("GuiObject") then c:Destroy() end
	end
	local money = taler()
	ui.shopSub.Text = GameUI.Format(money) .. " Taler verfügbar"
	for _, t in ipairs(TABS) do
		local on = t[1] == ui.shopTab
		ui.tabs[t[1]].BackgroundColor3 = on and C.gold or C.bg2
		ui.tabs[t[1]].TextColor3 = on and Color3.fromRGB(42, 30, 10) or C.ink
	end
	local grid = list:FindFirstChildOfClass("UIGridLayout")
	grid.CellSize = ui.shopTab == "auras" and UDim2.new(0, 200, 0, 200) or UDim2.new(0, 200, 0, 236)
	if ui.shopTab == "eier" then
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
	elseif ui.shopTab == "boosts" then
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
	elseif ui.shopTab == "auras" then
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

local function buildShop(playerGui)
	local gui = new("ScreenGui", { Name = "CoinmasterShop", ResetOnSpawn = false, DisplayOrder = 5, Enabled = false, Parent = playerGui })
	local dim = new("TextButton", { Name = "Abdunkeln", Size = UDim2.new(1, 0, 1, 0), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0.45, Text = "", AutoButtonColor = false, Parent = gui })
	dim.Activated:Connect(function() GameUI.CloseShop() end)
	local win = new("Frame", { Name = "Fenster", Size = UDim2.new(0.84, 0, 0.84, 0), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundColor3 = C.bg, Parent = gui }, {
		corner(UDim.new(0, 22)),
		stroke(C.gold, 3),
		new("UISizeConstraint", { MaxSize = Vector2.new(980, 640) }),
	})
	ui.shopScale = new("UIScale", { Scale = 1, Parent = win })
	local head = new("Frame", { Name = "Kopf", Size = UDim2.new(1, -40, 0, 64), Position = UDim2.new(0, 20, 0, 14), BackgroundTransparency = 1, Parent = win })
	new("Frame", { Size = UDim2.new(0, 56, 0, 56), BackgroundColor3 = C.gold, Parent = head }, {
		corner(UDim.new(0, 14)),
		gradient(C.goldHi, Color3.fromRGB(176, 128, 52)),
		label({ Size = UDim2.new(1, 0, 1, 0), Text = "🛒", TextSize = 30, Font = Enum.Font.SourceSans }),
	})
	label({ Size = UDim2.new(1, -140, 0, 34), Position = UDim2.new(0, 70, 0, 2), Text = "Shop", Font = FONT, TextSize = 34, TextXAlignment = Enum.TextXAlignment.Left, Parent = head })
	ui.shopSub = label({ Size = UDim2.new(1, -140, 0, 18), Position = UDim2.new(0, 70, 0, 38), Text = "", TextSize = 13, TextColor3 = C.muted, TextXAlignment = Enum.TextXAlignment.Left, Font = Enum.Font.Code, Parent = head })
	local close = new("TextButton", { Name = "Schliessen", Size = UDim2.new(0, 46, 0, 46), Position = UDim2.new(1, 0, 0, 4), AnchorPoint = Vector2.new(1, 0), BackgroundColor3 = C.red, Text = "✕", Font = BODY, TextSize = 22, TextColor3 = Color3.new(1, 1, 1), Parent = head }, { corner(UDim.new(0, 12)) })
	pressable(close, function() GameUI.CloseShop() end)
	local tabs = new("Frame", { Name = "Reiter", Size = UDim2.new(1, -40, 0, 40), Position = UDim2.new(0, 20, 0, 88), BackgroundTransparency = 1, Parent = win }, {
		new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
	})
	ui.tabs = {}
	for i, t in ipairs(TABS) do
		local b = new("TextButton", { Name = t[1], Size = UDim2.new(0, 132, 1, 0), BackgroundColor3 = C.bg2, Text = t[2], Font = FONT, TextSize = 18, TextColor3 = C.ink, LayoutOrder = i, Parent = tabs }, { corner(UDim.new(1, 0)) })
		ui.tabs[t[1]] = b
		pressable(b, function()
			ui.shopTab = t[1]
			ui.shopList.CanvasPosition = Vector2.new(0, 0)
			fillShop()
		end)
	end
	ui.shopList = new("ScrollingFrame", { Name = "Inhalt", Size = UDim2.new(1, -24, 1, -150), Position = UDim2.new(0, 12, 0, 140), BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 8, ScrollBarImageColor3 = C.gold, AutomaticCanvasSize = Enum.AutomaticSize.Y, CanvasSize = UDim2.new(0, 0, 0, 0), Parent = win }, {
		new("UIGridLayout", { CellSize = UDim2.new(0, 200, 0, 236), CellPadding = UDim2.new(0, 12, 0, 12), HorizontalAlignment = Enum.HorizontalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder }),
		new("UIPadding", { PaddingTop = UDim.new(0, 12), PaddingBottom = UDim.new(0, 12), PaddingLeft = UDim.new(0, 8), PaddingRight = UDim.new(0, 8) }),
	})
	ui.shopTab = "eier"
	ui.shop = gui
	return gui
end

function GameUI.OpenShop(tab)
	if not ui.shop then return end
	if tab then ui.shopTab = tab end
	ui.shop.Enabled = true
	ui.shopScale.Scale = 0.85
	TweenService:Create(ui.shopScale, TweenInfo.new(0.22, Enum.EasingStyle.Back), { Scale = 1 }):Play()
	fillShop()
end
function GameUI.CloseShop()
	if ui.shop then ui.shop.Enabled = false end
end
function GameUI.IsShopOpen()
	return ui.shop ~= nil and ui.shop.Enabled
end

-- Standard-Verbindungen in Roblox: Käufe über RemoteFunctions, fremde Fenster als BindableEvent
local function defaultInvoke(action, a, b)
	if action == "aura" then
		local remote = root:FindFirstChild("AuraRemote")
		if remote then return remote:InvokeServer(a, b) end
		return false, "AuraRemote fehlt"
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
	local playerGui = player:WaitForChild("PlayerGui")
	buildHud(playerGui)
	buildShop(playerGui)
	refreshHud()
	-- Änderungen am Spielstand: HUD und offenen Shop neu füllen
	local pending = false
	local function changed()
		if pending then return end
		pending = true
		task.defer(function()
			pending = false
			refreshHud()
			if GameUI.IsShopOpen() then fillShop() end
		end)
	end
	player.AttributeChanged:Connect(changed)
	ReplicatedStorage:GetAttributeChangedSignal("Weather"):Connect(changed)
	local stats = player:FindFirstChild("leaderstats")
	if stats and stats:FindFirstChild("Taler") then
		stats.Taler.Changed:Connect(changed)
	end
	-- Countdowns jede Sekunde
	task.spawn(function()
		while true do
			task.wait(1)
			refreshHud()
		end
	end)
	return GameUI
end

return GameUI
`;

// Server: Eier und Boosts kaufen (Taler aus leaderstats.Taler), Ergebnis als Attribute am Spieler
export const SHOP_SERVER = `-- Coinmaster Adventure · Shop (Server)
-- Kauft Eier und Boosts über die RemoteFunction ShopRemote. Der Server prüft Preis und Taler.
-- Ein gekauftes Ei zählt das Attribut Egg_<id> hoch, ein Boost setzt Boost_<id> auf sein Ende (os.time()).
-- Speichern (DataStore) fehlt noch.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local root = ReplicatedStorage:WaitForChild("CoinmasterAdventure")
local EggData = require(root:WaitForChild("EggData"))
local ShopData = require(root:WaitForChild("ShopData"))

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

remote.OnServerInvoke = function(player, action, id)
	local now = os.clock()
	if lastCall[player] and now - lastCall[player] < 0.25 then
		return false, "Zu schnell"
	end
	lastCall[player] = now
	if type(action) ~= "string" or type(id) ~= "string" or #id > 40 then
		return false, "Ungültig"
	end
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
