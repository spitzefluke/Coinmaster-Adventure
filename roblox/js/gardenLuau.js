// Münzbaumgarten für Roblox: GardenData (Bäume, Werkzeug, Regeln), LootBuilder (Bäume in drei
// Wachstumsstufen und Gartenwerkzeug als Modelle) und GardenBuilder (der ganze Garten mit Beeten).
// Die Webseite führt dieselben Module aus (garten/ und rollen/).

const str = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
const num = (n) => (Number.isFinite(n) ? String(Math.round(n * 1000) / 1000) : 'math.huge');
const color = (hex) => `Color3.fromHex(${str(hex)})`;
const list = (items, indent = '\t') => `{\n${items.map((i) => `${indent}${i},`).join('\n')}\n${indent.slice(1)}}`;
const fields = (obj) =>
  '{ ' +
  Object.entries(obj)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k} = ${v}`)
    .join(', ') +
  ' }';

const HEADER = (title) => `-- Coinmaster Adventure · ${title}
-- Automatisch erzeugt von der Coinmaster-Webseite. Änderungen besser dort machen
-- und neu übertragen, sonst gehen sie beim nächsten Import verloren.
`;

const KIND = { water: 'Water', boost: 'Boost', taler: 'Moneten', bed: 'Bed' };

export function gardenDataSource({ GARDEN_RARITIES, TREES, TOOLS, FENCES = [], GARDEN }) {
  const rarities = GARDEN_RARITIES.map((r, i) => fields({ Id: str(r.id), Name: str(r.name), Index: num(i + 1), Chance: num(r.chance), Color: color(r.color), Rainbow: r.rainbow ? 'true' : undefined }));
  const trees = TREES.map((t) =>
    fields({
      Id: str(t.id),
      Type: str('Tree'),
      Name: str(t.name),
      SeedName: str(`${t.name}-Samen`),
      Rarity: str(t.rarity),
      Grow: num(t.grow),
      Cycle: num(t.cycle),
      Yield: num(t.yield),
      Harvests: num(t.harvests),
      FruitName: str(t.fruitName),
      FruitPlural: str(t.fruitPlural),
      FruitShape: str(t.fruitShape),
      Crown: str(t.crown),
      Trunk: color(t.trunk),
      Leaf: color(t.leaf),
      Fruit: color(t.fruit),
      Look: str(t.look),
      Big: t.big ? 'true' : undefined,
      Text: str(t.text),
    }),
  );
  const tools = TOOLS.map((t) =>
    fields({
      Id: str(t.id),
      Type: str('Tool'),
      Name: str(t.name),
      Rarity: str(t.rarity),
      Kind: str(KIND[t.kind]),
      Seconds: t.seconds !== undefined ? num(t.seconds) : undefined,
      Mult: t.mult !== undefined ? num(t.mult) : undefined,
      Amount: t.amount !== undefined ? num(t.amount) : undefined,
      Model: str(t.model),
      Color: color(t.color),
      Rainbow: t.rainbow ? 'true' : undefined,
      Text: str(t.text),
    }),
  );
  const fences = FENCES.map((f) =>
    fields({ Id: str(f.id), Type: str('Fence'), Name: str(f.name), Rarity: str(f.rarity), Standard: f.standard ? 'true' : undefined, Color: color(f.color), Text: str(f.text) }),
  );
  return `${HEADER('Münzbaumgarten')}
-- Den Garten kauft man mit Moneten (Garden.Price). Samen und Werkzeug gibt es aus Münzrollen (RollData);
-- ein Baum steckt als Samen (SeedName) im Inventar und wächst nach dem Säen mit Timer (Grow Sekunden).
-- Geerntet werden keine Moneten, sondern Früchte (FruitName): Sie kommen ins Inventar (Fruits) und
-- lassen sich gegen Samen desselben Baums tauschen (SeedCost Früchte). Verkaufen geht nicht mehr
-- (FruitPrice/MarketMult bleiben nur als Wert-Angabe).
-- Ein Beet (Plot) im Spielstand: { Tree = id, Planted = os.time(), Bonus = 0, Harvested = 0, Boost = 1, BoostEnd = 0, Golden = true? }
--   Bonus     Sekunden, die der Baum durch Gießen schon gewachsen ist
--   Harvested Zeit der letzten Ernte, Boost/BoostEnd Dünger
--   Golden    wächst golden (Chance Garden.GoldenChance beim Säen) und trägt doppelt
-- Werkzeug (Kind): Water = Seconds schneller wachsen (math.huge: sofort fertig), Boost = Mult × Ernte
-- für Seconds, Moneten = Amount Moneten, Bed = ein Beet mehr.
-- Wichtig: Ernten und Benutzen nur auf dem Server rechnen.

local GardenData = {}

GardenData.Rarities = ${list(rarities)}

GardenData.Trees = ${list(trees)}

GardenData.Tools = ${list(tools)}

-- Zäune: Standard = immer da; die anderen kommen aus Münzrollen und bleiben im Inventar (anbringen kostet nichts)
GardenData.Fences = ${fences.length ? list(fences) : '{}'}

GardenData.Garden = { Price = ${num(GARDEN.price)}, StartBeds = ${num(GARDEN.startBeds)}, MaxBeds = ${num(GARDEN.maxBeds)}, MaxRipe = ${num(GARDEN.maxRipe)}, GoldenChance = ${num(GARDEN.goldenChance)}, MarketSlot = ${num(GARDEN.marketSlot)} }

-- Preis für das nächste Beet, wenn man schon beds Beete hat
function GardenData.BedPrice(beds)
	return 15000 * 2 ^ (beds - 4)
end

GardenData.RarityById = {}
for _, r in ipairs(GardenData.Rarities) do
	GardenData.RarityById[r.Id] = r
end
GardenData.TreeIndex = {}
for i, t in ipairs(GardenData.Trees) do
	GardenData.TreeIndex[t.Id] = i
end
GardenData.Loot = {}
GardenData.ById = {}
for _, group in ipairs({ GardenData.Trees, GardenData.Tools, GardenData.Fences }) do
	for _, item in ipairs(group) do
		if not item.Standard then
			table.insert(GardenData.Loot, item)
		end
		GardenData.ById[item.Id] = item
	end
end
GardenData.StandardFence = "holzzaun"

-- Name im Inventar und beim Öffnen: Samen für Bäume, sonst der Name
function GardenData.LootName(item)
	return item.SeedName or item.Name
end

-- Sekunden, bis ein Beet ausgewachsen ist (0, wenn fertig)
function GardenData.GrowLeft(plot, now)
	return math.max(0, GardenData.GrownAt(plot) - now)
end

-- 0 leer, 1 Keimling, 2 Jungbaum, 3 ausgewachsen
function GardenData.Stage(plot, now)
	if not plot then
		return 0
	end
	local tree = GardenData.ById[plot.Tree]
	local p = (now - plot.Planted + plot.Bonus) / tree.Grow
	if p >= 1 then
		return 3
	elseif p >= 0.34 then
		return 2
	end
	return 1
end

function GardenData.GrownAt(plot)
	return plot.Planted - plot.Bonus + GardenData.ById[plot.Tree].Grow
end

-- Ernten, die ein Baum noch hergibt (Harvests minus schon geerntete); danach ist er abgeerntet
function GardenData.HarvestsLeft(plot)
	return math.max(0, GardenData.ById[plot.Tree].Harvests - (plot.Count or 0))
end

-- Wie viele Ernten am Baum hängen (höchstens Garden.MaxRipe und höchstens, was er noch hergibt)
function GardenData.Ripe(plot, now)
	if GardenData.Stage(plot, now) < 3 then
		return 0
	end
	local tree = GardenData.ById[plot.Tree]
	local since = math.max(GardenData.GrownAt(plot), plot.Harvested or 0)
	return math.min(GardenData.Garden.MaxRipe, GardenData.HarvestsLeft(plot), math.floor((now - since) / tree.Cycle))
end

-- Früchte, die eine Ernte jetzt bringt (Dünger und goldene Bäume vervielfachen)
function GardenData.HarvestFruits(plot, now)
	local mult = (plot.BoostEnd or 0) > now and plot.Boost or 1
	return GardenData.Ripe(plot, now) * mult * (plot.Golden and 2 or 1)
end

-- Wachstum 0–1
function GardenData.Progress(plot, now)
	return math.clamp((now - plot.Planted + plot.Bonus) / GardenData.ById[plot.Tree].Grow, 0, 1)
end

-- Phase fürs Aussehen: 1 Keimling, 2 Schössling, 3 Jungbaum, 4 Knospen, 5 ausgewachsen
function GardenData.PhaseOf(progress)
	if progress >= 1 then return 5 elseif progress >= 0.8 then return 4 elseif progress >= 0.34 then return 3 elseif progress >= 0.15 then return 2 end
	return 1
end
GardenData.PhaseNames = { "Keimling", "Schössling", "Jungbaum", "Knospen", "Ausgewachsen" }

-- Marktpreis-Faktor 0,6–1,8 je Baum und Zeitfenster (Ganzzahl-Rechnung wie auf der Webseite)
function GardenData.MarketMult(treeId, now)
	local i = GardenData.TreeIndex[treeId] or 0
	local slot = math.floor(now / GardenData.Garden.MarketSlot)
	local h1 = ((slot % 10007) * 7919 + i * 104729) % 10007
	local h2 = (h1 * h1 + 12345) % 10007
	return (6 + math.floor(h2 * 13 / 10007)) / 10
end
function GardenData.FruitPrice(treeId, now)
	return math.floor(GardenData.ById[treeId].Yield * GardenData.MarketMult(treeId, now) + 0.5)
end
function GardenData.MarketLeft(now)
	return GardenData.Garden.MarketSlot - now % GardenData.Garden.MarketSlot
end
-- So viele Früchte kostet ein Samen desselben Baums
function GardenData.SeedCost(tree)
	return tree.Harvests
end
-- Name eines (goldenen) Baums; ??? schillert statt golden
function GardenData.TreeName(tree, golden)
	if not golden then return tree.Name end
	return (GardenData.RarityById[tree.Rarity].Rainbow and "Schillernder " or "Goldener ") .. tree.Name
end

-- ── Spielstand eines Spielers ──
-- garden = { Owned = bool, Beds = n, Fence = Zaun-Id, Plots = { ["1"] = Plot, … }, Inv = { [id] = Anzahl }, Fruits = { [Baum-Id] = Anzahl }, Receipts = { PurchaseIds } }
-- Plot.Count: wie oft der Baum schon abgeerntet wurde (Grenze: Tree.Harvests)
-- Liegt als JSON im Attribut Garden am Spieler (schreibt nur der Server).

function GardenData.New()
	return { Owned = false, Beds = GardenData.Garden.StartBeds, Fence = "holzzaun", Plots = {}, Inv = {}, Fruits = {}, Receipts = {} }
end

-- Repariert geladene oder fremde Daten (fehlende Felder, falsche Typen, unbekannte Ids)
function GardenData.Clean(g)
	local out = GardenData.New()
	if type(g) ~= "table" then
		return out
	end
	out.Owned = g.Owned == true
	if type(g.Fence) == "string" and GardenData.ById[g.Fence] and GardenData.ById[g.Fence].Type == "Fence" then
		out.Fence = g.Fence
	end
	out.Beds = math.clamp(math.floor(tonumber(g.Beds) or out.Beds), 1, GardenData.Garden.MaxBeds)
	if type(g.Receipts) == "table" then
		for _, r in ipairs(g.Receipts) do
			if type(r) == "string" then table.insert(out.Receipts, r) end
		end
	end
	if type(g.Inv) == "table" then
		for id, n in pairs(g.Inv) do
			n = math.floor(tonumber(n) or 0)
			if GardenData.ById[id] and n > 0 then
				out.Inv[id] = n
			end
		end
	end
	if type(g.Fruits) == "table" then
		for id, n in pairs(g.Fruits) do
			n = math.floor(tonumber(n) or 0)
			if GardenData.ById[id] and GardenData.ById[id].Type == "Tree" and n > 0 then
				out.Fruits[id] = n
			end
		end
	end
	if type(g.Plots) == "table" then
		for key, p in pairs(g.Plots) do
			local i = tonumber(key)
			if i and i >= 1 and i <= out.Beds and type(p) == "table" and GardenData.ById[p.Tree] and GardenData.ById[p.Tree].Type == "Tree" then
				out.Plots[tostring(i)] = {
					Tree = p.Tree, Planted = tonumber(p.Planted) or 0, Bonus = tonumber(p.Bonus) or 0,
					Harvested = tonumber(p.Harvested) or 0, Boost = tonumber(p.Boost) or 1, BoostEnd = tonumber(p.BoostEnd) or 0,
					Count = math.max(0, math.floor(tonumber(p.Count) or 0)),
					Golden = p.Golden == true or nil,
				}
			end
		end
	end
	return out
end

local function take(g, id)
	g.Inv[id] = (g.Inv[id] or 0) - 1
	if g.Inv[id] <= 0 then
		g.Inv[id] = nil
	end
end

local function addFruit(g, id, n)
	g.Fruits[id] = (g.Fruits[id] or 0) + n
end

local function fmtTime(sec)
	sec = math.max(0, math.ceil(sec))
	if sec >= 3600 then
		return math.floor(sec / 3600) .. " h " .. math.floor(sec % 3600 / 60) .. " min"
	elseif sec >= 60 then
		return math.floor(sec / 60) .. " min" .. (sec % 60 > 0 and (" " .. sec % 60 .. " s") or "")
	end
	return sec .. " s"
end
GardenData.FormatTime = fmtTime

-- 480270 → "480.270"
local function fmtNum(n)
	local out = tostring(math.floor(n + 0.5)):reverse():gsub("(%d%d%d)", "%1."):reverse()
	return (out:gsub("^%.", ""))
end
GardenData.FormatNumber = fmtNum

-- 1 Kupferapfel, 3 Kupferäpfel
function GardenData.FruitLabel(tree, n)
	return fmtNum(n) .. " " .. (n == 1 and tree.FruitName or tree.FruitPlural)
end

-- Eine Aktion auf dem Spielstand ausführen. Ändert g, rechnet aber keine Moneten ab:
-- gibt ok, Text und die Moneten-Änderung zurück (negativ = kostet). taler = Moneten, die der Spieler hat.
--   buyGarden · buyBed · plant (Beet, Baum-Id) · use (Werkzeug-Id, Beet) · harvest (Beet oder "all"): Früchte in den Korb · dig (Beet)
--   fence (Zaun-Id): Zaun anbringen (aus dem Inventar oder der Standard-Holzzaun)
--   sell (Baum-Id oder "all"): Früchte zum Marktpreis verkaufen · seed (Baum-Id): Früchte gegen einen Samen tauschen
-- rng (Random, optional): würfelt beim Säen den goldenen Baum
function GardenData.Act(g, action, a, b, now, taler, rng)
	local G = GardenData.Garden
	g.Fruits = g.Fruits or {}
	local bed = tonumber(a)
	local function plotAt(i)
		return i and g.Plots[tostring(i)]
	end
	if action == "buyGarden" then
		if g.Owned then return false, "Du hast schon einen Garten", 0 end
		if taler < G.Price then return false, "Zu wenig Moneten", 0 end
		g.Owned = true
		g.Beds = math.max(g.Beds, G.StartBeds)
		return true, "Der Münzbaumgarten gehört dir!", -G.Price
	end
	if not g.Owned then
		return false, "Kauf zuerst den Garten", 0
	end
	if action == "buyBed" then
		if g.Beds >= G.MaxBeds then return false, "Mehr Beete gehen nicht", 0 end
		local price = GardenData.BedPrice(g.Beds)
		if taler < price then return false, "Zu wenig Moneten", 0 end
		g.Beds = g.Beds + 1
		return true, "Beet " .. g.Beds .. " ist umgegraben", -price
	elseif action == "plant" then
		local tree = GardenData.ById[b]
		if not bed or bed < 1 or bed > g.Beds or bed ~= math.floor(bed) then return false, "Dieses Beet gibt es nicht", 0 end
		if plotAt(bed) then return false, "Das Beet ist schon belegt", 0 end
		if not tree or tree.Type ~= "Tree" or (g.Inv[b] or 0) < 1 then return false, "Diese Samen hast du nicht", 0 end
		take(g, b)
		local golden = (rng or Random.new()):NextNumber() < G.GoldenChance
		g.Plots[tostring(bed)] = { Tree = b, Planted = now, Bonus = 0, Harvested = 0, Boost = 1, BoostEnd = 0, Golden = golden or nil }
		if golden then
			return true, "✨ " .. tree.SeedName .. " in Beet " .. bed .. " gesät: Es wächst ein " .. GardenData.TreeName(tree, true) .. "!", 0
		end
		return true, tree.SeedName .. " in Beet " .. bed .. " gesät", 0
	elseif action == "use" then
		local tool = GardenData.ById[a]
		if not tool or tool.Type ~= "Tool" or (g.Inv[a] or 0) < 1 then return false, "Das hast du nicht", 0 end
		if tool.Kind == "Moneten" then
			take(g, a)
			return true, "+" .. fmtNum(tool.Amount) .. " Moneten aus " .. tool.Name, tool.Amount
		elseif tool.Kind == "Bed" then
			if g.Beds >= G.MaxBeds then return false, "Mehr Beete gehen nicht", 0 end
			take(g, a)
			g.Beds = g.Beds + 1
			return true, tool.Name .. ": Beet " .. g.Beds .. " ist umgegraben", 0
		end
		local i = tonumber(b)
		local plot = plotAt(i)
		if not plot then return false, "Auf dem Beet wächst nichts", 0 end
		if tool.Kind == "Water" then
			local left = GardenData.GrownAt(plot) - now
			if left <= 0 then return false, "Der Baum ist schon ausgewachsen", 0 end
			plot.Bonus = plot.Bonus + math.min(tool.Seconds, left)
			take(g, a)
			return true, "Beet " .. i .. " gegossen" .. (tool.Seconds >= left and ": ausgewachsen!" or (" (" .. fmtTime(tool.Seconds) .. " schneller)")), 0
		elseif tool.Kind == "Boost" then
			plot.Boost = tool.Mult
			plot.BoostEnd = now + tool.Seconds
			take(g, a)
			return true, "Beet " .. i .. " gedüngt: ×" .. tool.Mult .. " Ernte für " .. fmtTime(tool.Seconds), 0
		end
		return false, "Das geht nicht", 0
	elseif action == "harvest" then
		local got, order, gone = {}, {}, {}
		for key, plot in pairs(g.Plots) do
			if a == "all" or key == tostring(bed) then
				local n = GardenData.Ripe(plot, now)
				if n > 0 then
					if not got[plot.Tree] then table.insert(order, plot.Tree) end
					got[plot.Tree] = (got[plot.Tree] or 0) + GardenData.HarvestFruits(plot, now)
					plot.Harvested = now
					plot.Count = (plot.Count or 0) + n
					-- Grenze erreicht: der Baum ist abgeerntet und verschwindet
					if plot.Count >= GardenData.ById[plot.Tree].Harvests then
						table.insert(gone, GardenData.ById[plot.Tree].Name)
						g.Plots[key] = nil
					end
				end
			end
		end
		if #order == 0 then return false, "Noch nichts reif", 0 end
		local parts = {}
		for _, id in ipairs(order) do
			addFruit(g, id, got[id])
			table.insert(parts, "+" .. GardenData.FruitLabel(GardenData.ById[id], got[id]))
		end
		local extra = #gone > 0 and (" · " .. table.concat(gone, ", ") .. " abgeerntet, das Beet ist frei") or ""
		return true, table.concat(parts, ", ") .. " ins Inventar" .. extra, 0
	elseif action == "dig" then
		local plot = plotAt(bed)
		if not plot then return false, "Auf dem Beet wächst nichts", 0 end
		local fruits = GardenData.HarvestFruits(plot, now)
		local tree = GardenData.ById[plot.Tree]
		g.Plots[tostring(bed)] = nil
		local extra = ""
		if fruits > 0 then
			addFruit(g, plot.Tree, fruits)
			extra = " · +" .. GardenData.FruitLabel(tree, fruits) .. " ins Inventar"
		end
		-- nur ein noch nicht ausgewachsener Baum gibt seine Samen zurück (sonst ließe sich die Erntegrenze umgehen)
		if GardenData.Stage(plot, now) < 3 then
			g.Inv[plot.Tree] = (g.Inv[plot.Tree] or 0) + 1
			return true, tree.Name .. " ausgegraben, die " .. tree.SeedName .. " liegen wieder im Inventar" .. extra, 0
		end
		return true, tree.Name .. " ausgerissen, das Beet ist frei" .. extra, 0
	elseif action == "sell" then
		-- Früchte kann man nicht verkaufen: Sie sind Futter für die Haustiere (Pet-EP)
		return false, "Früchte kann man nicht verkaufen. Füttere damit deine Haustiere (Inventar › Haustiere).", 0
	elseif action == "seed" then
		-- Samen ziehen: SeedCost Früchte eines Baums gegen einen Samen desselben Baums
		local tree = GardenData.ById[a]
		if not tree or tree.Type ~= "Tree" then return false, "Diesen Baum gibt es nicht", 0 end
		local cost = GardenData.SeedCost(tree)
		if (g.Fruits[a] or 0) < cost then return false, "Dafür brauchst du " .. GardenData.FruitLabel(tree, cost), 0 end
		g.Fruits[a] = g.Fruits[a] - cost
		if g.Fruits[a] <= 0 then g.Fruits[a] = nil end
		g.Inv[a] = (g.Inv[a] or 0) + 1
		return true, GardenData.FruitLabel(tree, cost) .. " eingetauscht: 1 " .. tree.SeedName, 0
	elseif action == "fence" then
		local fence = GardenData.ById[a]
		if not fence or fence.Type ~= "Fence" then return false, "Diesen Zaun gibt es nicht", 0 end
		if not fence.Standard and (g.Inv[a] or 0) < 1 then return false, "Diesen Zaun hast du nicht", 0 end
		g.Fence = a
		return true, fence.Name .. " angebracht", 0
	end
	return false, "Ungültig", 0
end

return GardenData
`;
}

const PART = `local function part(className, props, parent)
	local p = Instance.new(className)
	p.Anchored = true
	p.CanCollide = false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for key, value in pairs(props) do
		p[key] = value
	end
	p.Parent = parent
	return p
end

local UP = CFrame.Angles(0, 0, math.rad(90)) -- Zylinder aufrecht
local FRONT = CFrame.Angles(0, math.rad(90), 0) -- Zylinder zeigt nach vorne (−Z)

local function ball(parent, name, size, pos, color, material, transparency)
	return part("Part", { Name = name, Shape = Enum.PartType.Ball, Size = Vector3.new(size, size, size), CFrame = CFrame.new(pos), Color = color, Material = material or Enum.Material.SmoothPlastic, Transparency = transparency or 0 }, parent)
end
`;

export const LOOT_BUILDER = `${HEADER('Bäume und Gartenwerkzeug bauen')}
-- LootBuilder.Tree(tree, stage, ripe, full, look) baut einen Münzbaum in fünf Phasen (look.Phase: Keimling,
-- Schössling, Jungbaum, Knospen, ausgewachsen mit Früchten; ripe = Ernten am Baum; look.Golden = goldene Variante). LootBuilder.Seed(tree) baut die Samentüte, LootBuilder.Tool(tool) Gartenwerkzeug.
-- LootBuilder.Build(item) baut, was aus einer Münzrolle kommt (Samen oder Werkzeug). Der Ursprung liegt am Boden in der Mitte,
-- das Attribut Height gibt die Höhe in Studs an.

local GardenData = require(script.Parent.GardenData)

local LootBuilder = {}

${PART}
local function scaleModel(model, k)
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") then
			local cf = p.CFrame
			p.Size = p.Size * k
			p.CFrame = CFrame.new(cf.Position * k) * (cf - cf.Position)
		end
	end
end

-- Ellipsoid: Block mit Kugel-Mesh (ein Ball-Part bleibt in Roblox immer rund)
local function ellipsoid(parent, name, size, cf, color, material)
	local p = part("Part", { Name = name, Size = size, CFrame = cf, Color = color, Material = material or Enum.Material.SmoothPlastic }, parent)
	local mesh = Instance.new("SpecialMesh")
	mesh.MeshType = Enum.MeshType.Sphere
	mesh.Parent = p
	return p
end

local function measure(model)
	local top = 0
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") then
			top = math.max(top, p.Position.Y + math.max(p.Size.X, p.Size.Y, p.Size.Z) * 0.5)
		end
	end
	model:SetAttribute("Height", top)
end

-- Kronen: geben Mitte und Radius zurück, damit die Münzen auf der Oberfläche hängen
local CROWNS = {}
function CROWNS.bush(m, t, leaf)
	ball(m, "Crown", 3.2, Vector3.new(0, 2.1, 0), t.Leaf, leaf)
	for _, x in ipairs({ -1.2, 1.2 }) do
		ball(m, "Crown", 2.3, Vector3.new(x, 1.6, 0.3), t.Leaf, leaf)
	end
	return Vector3.new(0, 2.1, 0), 1.6, 1.1
end
function CROWNS.round(m, t, leaf, h)
	local s = t.Big and 1.3 or 1
	local c = Vector3.new(0, h + 1.5 * s, 0)
	ball(m, "Crown", 4.4 * s, c, t.Leaf, leaf)
	for i = 0, 3 do
		local a = math.rad(i * 90 + 45)
		ball(m, "Crown", 3 * s, c + Vector3.new(math.cos(a) * 1.7 * s, -0.5 * s, math.sin(a) * 1.7 * s), t.Leaf, leaf)
	end
	return c, 2.3 * s, 0
end
function CROWNS.blossom(m, t, leaf, h)
	local c, r = CROWNS.round(m, t, leaf, h)
	local rng = Random.new(5)
	for i = 1, 16 do
		local a = rng:NextNumber(0, math.pi * 2)
		local y = rng:NextNumber(-0.6, 1.4)
		ball(m, "Bluete", 0.55, c + Vector3.new(math.cos(a) * r, y, math.sin(a) * r), Color3.fromRGB(255, 240, 246))
	end
	return c, r, 0
end
function CROWNS.oval(m, t, leaf, h)
	local c = Vector3.new(0, h + 2.2, 0)
	local crown = part("Part", { Name = "Crown", Size = Vector3.new(3.4, 5.4, 3.4), CFrame = CFrame.new(c), Color = t.Leaf, Material = leaf }, m)
	local mesh = Instance.new("SpecialMesh")
	mesh.MeshType = Enum.MeshType.Sphere
	mesh.Parent = crown
	return c, 1.75, 0
end
function CROWNS.cone(m, t, leaf, h)
	local radii = { 4.4, 3.6, 2.8, 2 }
	for i, r in ipairs(radii) do
		part("Part", { Name = "Crown", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.9, r, r), CFrame = CFrame.new(0, h - 0.6 + i * 1.05, 0) * UP, Color = t.Leaf, Material = leaf }, m)
	end
	ball(m, "Spitze", 1, Vector3.new(0, h + 4.4, 0), t.Fruit, Enum.Material.Neon)
	return Vector3.new(0, h + 1.2, 0), 2, 0
end
function CROWNS.weeping(m, t, leaf, h)
	local c = Vector3.new(0, h + 1.3, 0)
	ball(m, "Crown", 3.8, c, t.Leaf, leaf, 0.15)
	for i = 0, 13 do
		local a = math.rad(i * (360 / 14))
		local r = 1.75
		part("Part", { Name = "Zweig", Size = Vector3.new(0.22, 2.8, 0.22), CFrame = CFrame.new(c + Vector3.new(math.cos(a) * r, -1.6, math.sin(a) * r)) * CFrame.Angles(math.sin(a) * 0.12, 0, -math.cos(a) * 0.12), Color = t.Leaf, Material = leaf, Transparency = 0.2 }, m)
	end
	return c, 1.9, 0
end
function CROWNS.palm(m, t, leaf, h)
	local top = Vector3.new(0.9, h + 1.6, 0)
	for i = 0, 6 do
		local a = math.rad(i * (360 / 7))
		part("Part", { Name = "Wedel", Size = Vector3.new(3.6, 0.16, 0.9), CFrame = CFrame.new(top) * CFrame.Angles(0, -a, 0) * CFrame.new(1.6, -0.3, 0) * CFrame.Angles(0, 0, math.rad(-22)), Color = t.Leaf, Material = leaf }, m)
	end
	local fire = Instance.new("Fire")
	fire.Size = 2
	fire.Heat = 4
	fire.Color = t.Fruit
	fire.SecondaryColor = t.Leaf
	fire.Parent = m:FindFirstChild("Stamm")
	return top + Vector3.new(0, -0.5, 0), 0.8, 0
end
function CROWNS.star(m, t, leaf, h)
	local c = Vector3.new(0, h + 1.6, 0)
	ball(m, "Crown", 4.4, c, t.Leaf, leaf, 0.25)
	ball(m, "Kern", 2, c, Color3.fromRGB(150, 110, 255), Enum.Material.Neon)
	for i = 0, 23 do
		local a = math.rad(i * 15)
		ball(m, "Bahn", 0.2, c + Vector3.new(math.cos(a) * 3.2, math.sin(a * 2) * 0.4, math.sin(a) * 3.2), Color3.fromHSV(0.12 + (i % 4) * 0.03, 0.5, 1), Enum.Material.Neon)
	end
	local s = Instance.new("Sparkles")
	s.SparkleColor = t.Fruit
	s.Parent = m:FindFirstChild("Kern")
	return c, 2.25, 0
end

-- Ellipsoid als Krone (Block mit Kugel-Mesh; in den Kronen-Funktionen gleich nutzbar)
local function blob(m, name, size, cf, color, material, transparency)
	local p = part("Part", { Name = name, Size = size, CFrame = cf, Color = color, Material = material or Enum.Material.SmoothPlastic, Transparency = transparency or 0 }, m)
	local mesh = Instance.new("SpecialMesh")
	mesh.MeshType = Enum.MeshType.Sphere
	mesh.Parent = p
	return p
end
-- Glückspilz: dicker Stiel, roter Hut mit weißen Tupfen, Lamellen darunter
function CROWNS.mushroom(m, t, leaf, h)
	local c = Vector3.new(0, h + 0.45, 0)
	blob(m, "Crown", Vector3.new(3.8, 1.7, 3.8), CFrame.new(c), t.Leaf, leaf)
	part("Part", { Name = "Lamellen", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.2, 3.3, 3.3), CFrame = CFrame.new(0, h + 0.05, 0) * UP, Color = Color3.fromRGB(240, 226, 200), Material = Enum.Material.SmoothPlastic }, m)
	for i = 0, 9 do
		local a = i * 2.39996
		local r = 0.5 + (i % 3) * 0.45
		local y = 0.75 - r * r * 0.2
		ball(m, "Tupfen", 0.42 - (i % 3) * 0.06, c + Vector3.new(math.cos(a) * r, y, math.sin(a) * r), Color3.fromRGB(255, 252, 240))
	end
	return Vector3.new(0, h + 0.15, 0), 1.9, 0
end
-- Wolkenbaum: weiche Wolkenkugeln, darunter fallen Moneten wie Regen
function CROWNS.cloud(m, t, leaf, h)
	local c = Vector3.new(0, h + 1.5, 0)
	for _, o in ipairs({ { 0, 0.3, 0, 3 }, { -1.3, 0, 0.2, 2.3 }, { 1.3, -0.1, -0.1, 2.4 }, { 0.2, -0.2, 1.2, 2.2 }, { -0.2, 0.1, -1.2, 2.3 }, { 0.6, 0.9, 0.3, 1.8 } }) do
		ball(m, "Crown", o[4], c + Vector3.new(o[1], o[2], o[3]), t.Leaf, leaf)
	end
	for i = 0, 5 do
		local a = i * 1.05
		part("Part", { Name = "Regentaler", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.08, 0.36, 0.36), CFrame = CFrame.new(c + Vector3.new(math.cos(a) * 1.2, -1.6 - (i % 3) * 0.45, math.sin(a) * 1.2)) * CFrame.Angles(0, a, math.rad(20)), Color = t.Fruit, Material = Enum.Material.Neon }, m)
	end
	return c, 2.1, 0
end
-- Kristallbaum: Kristallspitzen strahlen aus einem leuchtenden Kern
function CROWNS.crystal(m, t, leaf, h)
	local c = Vector3.new(0, h + 1.4, 0)
	ball(m, "Kern", 1.4, c, t.Fruit, Enum.Material.Neon)
	local rng = Random.new(11)
	for i = 0, 10 do
		local a = i * 2.39996
		local up = rng:NextNumber(-0.3, 1.1)
		local len = rng:NextNumber(1.4, 2.4)
		local dir = Vector3.new(math.cos(a), up, math.sin(a)).Unit
		local mid = c + dir * (len / 2 + 0.3)
		part("Part", { Name = "Crown", Size = Vector3.new(0.45, len, 0.45), CFrame = CFrame.lookAt(mid, mid + dir) * CFrame.Angles(math.rad(90), 0, 0) * CFrame.Angles(0, math.rad(45), 0), Color = t.Leaf, Material = leaf, Transparency = 0.15 }, m)
	end
	local s = Instance.new("Sparkles")
	s.SparkleColor = t.Leaf
	s.Parent = m:FindFirstChild("Kern")
	return c, 1.5, 0
end
-- Planetenbaum: ein Planet mit Ring, zwei Monde kreisen
function CROWNS.planet(m, t, leaf, h)
	local c = Vector3.new(0, h + 1.7, 0)
	ball(m, "Crown", 3.4, c, t.Leaf, leaf)
	for i, y in ipairs({ -0.6, 0.15, 0.85 }) do
		part("Part", { Name = "Streifen", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.18, 3.42 - math.abs(y) * 0.6, 3.42 - math.abs(y) * 0.6), CFrame = CFrame.new(c + Vector3.new(0, y, 0)) * UP, Color = t.Leaf:Lerp(Color3.new(1, 1, 1), 0.25 * i), Material = leaf }, m)
	end
	part("Part", { Name = "Ring", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.06, 5.8, 5.8), CFrame = CFrame.new(c) * CFrame.Angles(0, 0, math.rad(90 - 18)), Color = t.Fruit, Material = Enum.Material.Neon, Transparency = 0.35 }, m)
	ball(m, "Mond", 0.6, c + Vector3.new(2.6, 0.9, 0.6), Color3.fromRGB(220, 220, 235), Enum.Material.Slate)
	ball(m, "Mond", 0.4, c + Vector3.new(-2.2, -0.4, -1.4), Color3.fromRGB(200, 220, 255), Enum.Material.Neon)
	return c, 1.75, 0
end
-- Engelsbaum: weiße Krone, Heiligenschein und zwei Flügel
function CROWNS.angel(m, t, leaf, h)
	local c = Vector3.new(0, h + 1.6, 0)
	ball(m, "Crown", 3.6, c, t.Leaf, leaf)
	for i = 0, 17 do
		local a = math.rad(i * 20)
		ball(m, "Heiligenschein", 0.2, c + Vector3.new(math.cos(a) * 1.1, 2.3, math.sin(a) * 1.1), Color3.fromRGB(255, 224, 120), Enum.Material.Neon)
	end
	for _, side in ipairs({ -1, 1 }) do
		blob(m, "Fluegel", Vector3.new(2.6, 1.3, 0.25), CFrame.new(c + Vector3.new(side * 2.2, 0.5, 0.3)) * CFrame.Angles(0, 0, side * math.rad(-25)), Color3.fromRGB(255, 255, 255), Enum.Material.SmoothPlastic)
		blob(m, "Fluegel", Vector3.new(1.8, 0.9, 0.22), CFrame.new(c + Vector3.new(side * 2.0, -0.1, 0.35)) * CFrame.Angles(0, 0, side * math.rad(-10)), Color3.fromRGB(245, 245, 255), Enum.Material.SmoothPlastic)
	end
	local l = Instance.new("PointLight")
	l.Color = Color3.fromRGB(255, 236, 170)
	l.Brightness = 1.5
	l.Range = 10
	l.Parent = m:FindFirstChild("Crown")
	return c, 1.85, 0
end
-- Regenbogenbaum: geschichtete Krone in allen Farben, leuchtet und funkelt
function CROWNS.rainbow(m, t, leaf, h)
	local c = Vector3.new(0, h + 1.5, 0)
	for i = 0, 6 do
		local w = 3.8 - i * 0.42
		blob(m, "Crown", Vector3.new(w, 0.7, w), CFrame.new(c + Vector3.new(0, -1 + i * 0.5, 0)), Color3.fromHSV(i / 7, 0.65, 1), Enum.Material.Neon)
	end
	ball(m, "Spitze", 0.6, c + Vector3.new(0, 2.6, 0), Color3.new(1, 1, 1), Enum.Material.Neon)
	local s = Instance.new("Sparkles")
	s.SparkleColor = Color3.new(1, 1, 1)
	s.Parent = m:FindFirstChild("Spitze")
	return c, 1.75, 0
end

-- Goldeiche: kurzer, dicker Stamm, sehr breite flache Krone aus mehreren Lappen
function CROWNS.oak(m, t, leaf, h)
	local c = Vector3.new(0, h + 1.3, 0)
	blob(m, "Crown", Vector3.new(5.4, 2.4, 5), CFrame.new(c), t.Leaf, leaf)
	for i = 0, 4 do
		local a = i / 5 * math.pi * 2 + 0.3
		blob(m, "Crown", Vector3.new(3.2, 1.9, 3), CFrame.new(c + Vector3.new(math.cos(a) * 2.3, -0.35 + (i % 2) * 0.45, math.sin(a) * 2.1)), t.Leaf, leaf)
	end
	blob(m, "Crown", Vector3.new(3.6, 1.7, 3.4), CFrame.new(c + Vector3.new(0.3, 1, -0.2)), t.Leaf, leaf)
	return c, 2.7, 0.3
end
-- Ahorngroschen: Zwiebelkrone mit gezackten Blattspitzen rundherum
function CROWNS.maple(m, t, leaf, h)
	local c = Vector3.new(0, h + 1.6, 0)
	blob(m, "Crown", Vector3.new(4.2, 3.4, 4.2), CFrame.new(c), t.Leaf, leaf)
	blob(m, "Crown", Vector3.new(2.8, 2.2, 2.8), CFrame.new(c + Vector3.new(0, 1.5, 0)), t.Leaf, leaf)
	for i = 0, 13 do
		local a = i * 2.39996
		local up = ((i * 0.37) % 1) * 1.6 - 0.5
		local dir = Vector3.new(math.cos(a), up, math.sin(a)).Unit
		local pos = c + dir * 2.05 + Vector3.new(0, up > 0.6 and 0.6 or 0, 0)
		part("Part", { Name = "Laub", Size = Vector3.new(0.85, 0.85, 0.16), CFrame = CFrame.lookAt(pos, pos + dir) * CFrame.Angles(0, 0, math.rad(45)), Color = t.Leaf:Lerp(Color3.fromRGB(200, 40, 20), (i % 3) * 0.12), Material = leaf }, m)
	end
	return c, 2.1, 0
end
-- Frosttanne: schmale, hängende Etagen mit Schneekappen und Eiszapfen
function CROWNS.spruce(m, t, leaf, h)
	local radii = { 4.6, 3.9, 3.2, 2.5, 1.8, 1.1 }
	for i, r in ipairs(radii) do
		local y = h - 0.9 + i * 0.9
		part("Part", { Name = "Crown", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.75, r, r), CFrame = CFrame.new(0, y, 0) * UP, Color = t.Leaf:Lerp(Color3.fromRGB(30, 80, 70), 0.35), Material = leaf }, m)
		part("Part", { Name = "Schnee", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.2, r * 0.82, r * 0.82), CFrame = CFrame.new(0, y + 0.45, 0) * UP, Color = Color3.fromRGB(246, 252, 255), Material = Enum.Material.Snow }, m)
		if i <= 3 then
			for k = 0, 5 do
				local a = k / 6 * math.pi * 2 + i
				part("Part", { Name = "Eiszapfen", Size = Vector3.new(0.12, 0.5, 0.12), CFrame = CFrame.new(math.cos(a) * r * 0.46, y - 0.55, math.sin(a) * r * 0.46), Color = Color3.fromRGB(200, 240, 255), Material = Enum.Material.Glass, Transparency = 0.2 }, m)
			end
		end
	end
	ball(m, "Spitze", 0.6, Vector3.new(0, h + 5.2, 0), Color3.fromRGB(246, 252, 255), Enum.Material.Snow)
	return Vector3.new(0, h + 1.4, 0), 1.9, 0
end

-- Zylinder zwischen zwei Punkten (für Äste, Wurzeln, Stammstücke)
local function limb(m, name, a, b, dia, color, material)
	local mid = (a + b) / 2
	return part("Part", { Name = name, Shape = Enum.PartType.Cylinder, Size = Vector3.new((b - a).Magnitude + dia * 0.3, dia, dia), CFrame = CFrame.lookAt(mid, b) * CFrame.Angles(0, math.rad(90), 0), Color = color, Material = material or Enum.Material.Wood }, m)
end

local function trunk(m, t, h, w, bend)
	if bend then
		-- Palme: gebogener Stamm aus Stücken, dazwischen dunkle Ringe
		local pos = Vector3.new(0, 0, 0)
		for i = 1, 6 do
			local x = 0.9 * (i / 6) ^ 2
			local y = h * i / 6
			local d = w * (1 - i * 0.07)
			limb(m, i == 6 and "Stamm" or "StammTeil", pos, Vector3.new(x, y, 0), d, i % 2 == 0 and t.Trunk or t.Trunk:Lerp(Color3.new(0, 0, 0), 0.15))
			part("Part", { Name = "Ring", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.12, d * 1.12, d * 1.12), CFrame = CFrame.new(Vector3.new(x, y, 0)) * CFrame.Angles(0, 0, math.rad(90) - math.atan(1.8 * (i / 6) * 0.9 / (h / 6) * 0.5)), Color = t.Trunk:Lerp(Color3.new(0, 0, 0), 0.35), Material = Enum.Material.Wood }, m)
			pos = Vector3.new(x, y, 0)
		end
		return
	end
	local bark = t.Trunk:Lerp(Color3.new(0, 0, 0), 0.28)
	-- Stamm in vier Stücken, nach oben schlanker und leicht geschwungen, Knoten an den Übergängen
	local prev = Vector3.new(0, 0, 0)
	for i = 1, 4 do
		local y = h * i / 4
		local nextPos = Vector3.new(math.sin(i * 1.7) * w * 0.07, y, math.cos(i * 1.3) * w * 0.05)
		local d = w * (1.16 - i * 0.1)
		limb(m, i == 1 and "Stamm" or "StammOben", prev, nextPos, d, t.Trunk:Lerp(Color3.new(1, 1, 1), (i - 1) * 0.025))
		ball(m, "StammOben", d * 0.98, nextPos, t.Trunk:Lerp(Color3.new(1, 1, 1), i * 0.025), Enum.Material.Wood)
		prev = nextPos
	end
	-- Fuß: breiter Ansatz
	part("Part", { Name = "Stamm", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.4, w * 1.45, w * 1.45), CFrame = CFrame.new(0, 0.12, 0) * UP, Color = t.Trunk:Lerp(Color3.new(0, 0, 0), 0.08), Material = Enum.Material.Wood }, m)
	-- Rinde: zehn Rippen in hell und dunkel
	for i = 0, 9 do
		local a = i / 10 * math.pi * 2 + 0.2
		local r = w * (0.5 - (i % 3) * 0.015)
		local len = h * (0.35 + ((i * 0.37) % 1) * 0.35)
		local c = i % 2 == 0 and bark or t.Trunk:Lerp(Color3.new(1, 1, 1), 0.08)
		part("Part", { Name = "Rinde", Size = Vector3.new(w * 0.11, len, 0.06), CFrame = CFrame.new(math.cos(a) * r, 0.15 + len / 2 + (i % 3) * 0.12, math.sin(a) * r) * CFrame.Angles(0, -a + math.pi / 2, 0), Color = c, Material = Enum.Material.Wood }, m)
	end
	-- Astloch mit hellem Rand
	if h > 2 then
		local a = 1.1
		local cf = CFrame.new(math.cos(a) * w * 0.47, h * 0.48, math.sin(a) * w * 0.47) * CFrame.Angles(0, -a + math.pi / 2, 0)
		ellipsoid(m, "Astloch", Vector3.new(w * 0.42, w * 0.52, 0.16), cf, t.Trunk:Lerp(Color3.new(1, 1, 1), 0.18), Enum.Material.Wood)
		ellipsoid(m, "Astloch", Vector3.new(w * 0.26, w * 0.36, 0.2), cf * CFrame.new(0, 0, -0.04), Color3.fromRGB(28, 18, 12), Enum.Material.SmoothPlastic)
	end
	-- Moos an der Wetterseite
	for i = 0, 4 do
		local a = 3.6 + i * 0.32
		ellipsoid(m, "Moos", Vector3.new(w * 0.4, w * (0.24 + (i % 2) * 0.1), 0.16), CFrame.new(math.cos(a) * w * 0.52, 0.22 + (i % 3) * 0.22, math.sin(a) * w * 0.52) * CFrame.Angles(0, -a + math.pi / 2, 0), Color3.fromRGB(88 + i * 6, 136, 54), Enum.Material.Grass)
	end
	-- Birke: weiße Rinde mit schwarzen Querstreifen
	if t.Crown == "oval" then
		for i = 0, 9 do
			local a = i * 2.1
			part("Part", { Name = "Birkenstreif", Size = Vector3.new(w * 0.42, 0.09, 0.05), CFrame = CFrame.new(math.cos(a) * w * 0.47, h * (0.1 + i * 0.085), math.sin(a) * w * 0.47) * CFrame.Angles(0, -a + math.pi / 2, 0), Color = Color3.fromRGB(40, 38, 42), Material = Enum.Material.SmoothPlastic }, m)
		end
	end
	-- Wurzeln: sieben, je drei Stücke, die sich in die Erde krümmen und dünner werden
	local root = t.Trunk:Lerp(Color3.new(0, 0, 0), 0.14)
	for i = 0, 6 do
		local a = i / 7 * math.pi * 2 + 0.3
		local dir = Vector3.new(math.cos(a), 0, math.sin(a))
		local len = w * (1.1 + (i % 3) * 0.3)
		local p0 = dir * w * 0.42 + Vector3.new(0, 0.45, 0)
		local p1 = dir * (w * 0.42 + len * 0.45) + Vector3.new(0, 0.18, 0) + Vector3.new(-dir.Z, 0, dir.X) * 0.1
		local p2 = dir * (w * 0.42 + len * 0.8) + Vector3.new(0, 0.05, 0) - Vector3.new(-dir.Z, 0, dir.X) * 0.08
		local p3 = dir * (w * 0.42 + len * 1.05) + Vector3.new(0, -0.05, 0)
		limb(m, "Wurzel", p0, p1, w * 0.36, root)
		ball(m, "Wurzel", w * 0.33, p1, root, Enum.Material.Wood)
		limb(m, "Wurzel", p1, p2, w * 0.24, root:Lerp(Color3.new(0, 0, 0), 0.05))
		limb(m, "Wurzel", p2, p3, w * 0.13, root:Lerp(Color3.new(0, 0, 0), 0.1))
	end
end

-- Ast zwischen zwei Punkten, mit Knoten am Ende (weiche Übergänge)
local function branch(m, t, a, b, dia)
	limb(m, "Ast", a, b, dia, t.Trunk)
	ball(m, "Ast", dia * 0.95, b, t.Trunk, Enum.Material.Wood)
end

-- Laubfarbe mit Abwandlung: k > 0 sonniger (gelblicher, heller), k < 0 schattiger (bläulich, dunkler)
local function leafTone(c, k)
	if k >= 0 then
		return c:Lerp(Color3.fromRGB(255, 246, 170), k)
	end
	return c:Lerp(Color3.fromRGB(16, 40, 34), -k)
end

-- Krone in drei Lagen: dunkler Kern füllt Lücken, facettierte Büschel außen, helle Spitzen oben,
-- einzelne Blätter am Rand brechen die Silhouette auf. Seltenere Bäume bekommen mehr Laub.
local LEAFY = { round = 14, bush = 9, oval = 11, blossom = 12, cone = 6, cloud = 10, angel = 10, weeping = 8, oak = 18, maple = 8, spruce = 5 }
local function foliage(m, t, leaf, center, radius)
	local base = LEAFY[t.Crown]
	if not base then return end
	local rank = GardenData.RarityById[t.Rarity].Index
	local count = math.floor(base * 2.2 + rank * 2 + (t.Big and 6 or 0))
	for _, p in ipairs(m:GetChildren()) do
		if p:IsA("BasePart") and p.Name == "Crown" then
			local dy = p.Position.Y - center.Y
			p.Color = dy < -0.2 and leafTone(t.Leaf, -0.18) or (dy > 0.4 and leafTone(t.Leaf, 0.08) or t.Leaf)
		end
	end
	local rng = Random.new(#t.Id * 7 + count)
	local cone = t.Crown == "cone" or t.Crown == "spruce"
	local function dirAt(i, phiMin, phiMax)
		local a = i * 2.39996 + rng:NextNumber(-0.35, 0.35)
		local phi = rng:NextNumber(phiMin, phiMax) -- 0 = oben, π/2 = seitlich
		return Vector3.new(math.cos(a) * math.sin(phi), math.cos(phi), math.sin(a) * math.sin(phi))
	end
	-- 1) Kern: große, dunkle Kugeln knapp unter der Oberfläche
	if not cone then
		for i = 1, math.floor(count * 0.35) do
			local dir = dirAt(i, 0.5, 2)
			local size = rng:NextNumber(1, 1.5) * (t.Big and 1.2 or 1)
			ellipsoid(m, "Laub", Vector3.new(size, size * 0.8, size), CFrame.new(center + dir * radius * 0.72), leafTone(t.Leaf, -rng:NextNumber(0.18, 0.3)), leaf)
		end
	end
	-- 2) Außen: facettierte Büschel, oben sonnig, unten schattig
	for i = 1, count do
		local dir = dirAt(i, 0.12, cone and 1.7 or 1.75)
		local up = dir.Y
		local k = up > 0.45 and rng:NextNumber(0.06, 0.24) or (up < -0.1 and -rng:NextNumber(0.12, 0.28) or rng:NextNumber(-0.1, 0.1))
		local size = rng:NextNumber(0.5, 0.95) * (t.Big and 1.25 or 1)
		local pos = cone and Vector3.new(center.X + dir.X * radius * (1.2 - math.max(0, up) * 0.8), center.Y + up * radius * 1.6, center.Z + dir.Z * radius * (1.2 - math.max(0, up) * 0.8)) or (center + dir * radius * 0.94)
		part("Part", { Name = "Laub", Size = Vector3.new(size, size * 0.78, size), CFrame = CFrame.new(pos) * CFrame.Angles(rng:NextNumber(0, 6), rng:NextNumber(0, 6), rng:NextNumber(0, 6)), Color = leafTone(t.Leaf, k), Material = leaf }, m)
	end
	-- 3) Helle Spitzen oben (leuchten bei seltenen Bäumen nachts)
	for i = 1, math.floor(count * 0.3) do
		local dir = dirAt(i, 0, 0.7)
		local size = rng:NextNumber(0.35, 0.6)
		local p = part("Part", { Name = "Laub", Size = Vector3.new(size, size * 0.7, size), CFrame = CFrame.new(center + dir * radius * (cone and 1.1 or 1.02) + Vector3.new(0, cone and radius * 0.6 or 0, 0)) * CFrame.Angles(rng:NextNumber(0, 6), rng:NextNumber(0, 6), rng:NextNumber(0, 6)), Color = leafTone(t.Leaf, rng:NextNumber(0.22, 0.36)), Material = leaf }, m)
		p:SetAttribute("Spitze", true)
	end
	-- 4) Einzelne Blätter am Rand, schräg abstehend
	if not cone then
		for i = 1, math.floor(count * 0.45) do
			local dir = dirAt(i, 0.6, 1.9)
			local pos = center + dir * radius * 1.08
			ellipsoid(m, "Laub", Vector3.new(0.46, 0.07, 0.28), CFrame.lookAt(pos, pos + dir) * CFrame.Angles(rng:NextNumber(-0.6, 0.6), 0, rng:NextNumber(0, 6)), leafTone(t.Leaf, rng:NextNumber(-0.1, 0.2)), leaf)
		end
	end
end

-- Frucht an einem Stiel (Form aus tree.FruitShape); reife leuchten und pulsieren, goldene Bäume tragen Gold.
-- Jede Frucht hat einen Glanzpunkt, Stiel und meist ein Blättchen. Die Hauptteile heißen „Frucht“.
local GOLD = Color3.fromRGB(255, 208, 64)
local LEAF_GREEN = Color3.fromRGB(96, 168, 64)
local STEM = Color3.fromRGB(110, 76, 40)
local function shine(m, pos, size)
	local p = ball(m, "Glanz", size, pos, Color3.new(1, 1, 1), Enum.Material.SmoothPlastic, 0.45)
	return p
end
local function fruitLeaf(m, pos, a)
	ellipsoid(m, "Fruchtblatt", Vector3.new(0.32, 0.05, 0.17), CFrame.new(pos) * CFrame.Angles(0, a or 0, math.rad(-28)) * CFrame.new(0.13, 0, 0), LEAF_GREEN)
end
local FRUITS = {}
function FRUITS.apple(m, pos, col, mat)
	ball(m, "Frucht", 0.64, pos, col, mat)
	ball(m, "Frucht", 0.5, pos + Vector3.new(0, -0.14, 0), col:Lerp(Color3.new(0, 0, 0), 0.08), mat)
	part("Part", { Name = "Fruchtgrube", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.04, 0.2, 0.2), CFrame = CFrame.new(pos + Vector3.new(0, 0.31, 0)) * UP, Color = col:Lerp(Color3.new(0, 0, 0), 0.35), Material = Enum.Material.SmoothPlastic }, m)
	part("Part", { Name = "Stiel", Size = Vector3.new(0.05, 0.22, 0.05), CFrame = CFrame.new(pos + Vector3.new(0.02, 0.4, 0)) * CFrame.Angles(0, 0, math.rad(-12)), Color = STEM, Material = Enum.Material.Wood }, m)
	fruitLeaf(m, pos + Vector3.new(0.04, 0.44, 0), 0.4)
	shine(m, pos + Vector3.new(-0.15, 0.14, -0.2), 0.14)
end
function FRUITS.pear(m, pos, col, mat)
	ellipsoid(m, "Frucht", Vector3.new(0.54, 0.6, 0.54), CFrame.new(pos + Vector3.new(0, -0.1, 0)), col, mat)
	ellipsoid(m, "Frucht", Vector3.new(0.36, 0.42, 0.36), CFrame.new(pos + Vector3.new(0, 0.2, 0)), col:Lerp(Color3.new(1, 1, 1), 0.06), mat)
	part("Part", { Name = "Stiel", Size = Vector3.new(0.05, 0.24, 0.05), CFrame = CFrame.new(pos + Vector3.new(0.03, 0.48, 0)) * CFrame.Angles(0, 0, math.rad(-18)), Color = STEM, Material = Enum.Material.Wood }, m)
	fruitLeaf(m, pos + Vector3.new(0.05, 0.52, 0), 1.2)
	shine(m, pos + Vector3.new(-0.13, 0.02, -0.2), 0.12)
end
function FRUITS.berry(m, pos, col, mat)
	for k = 0, 5 do
		local a = k * 1.25
		local r = k == 5 and 0 or 0.16
		local b = ball(m, "Frucht", 0.28 - (k % 2) * 0.03, pos + Vector3.new(math.cos(a) * r, -0.06 * (k % 3) - (k == 5 and 0.18 or 0), math.sin(a) * r), col:Lerp(Color3.new(0, 0, 0), (k % 3) * 0.06), mat)
		b.Reflectance = 0.15
	end
	for k = 0, 2 do
		fruitLeaf(m, pos + Vector3.new(0, 0.16, 0), k * 2.1)
	end
	shine(m, pos + Vector3.new(-0.1, 0.06, -0.15), 0.08)
end
function FRUITS.cone(m, pos, col, mat)
	ellipsoid(m, "Frucht", Vector3.new(0.4, 0.74, 0.4), CFrame.new(pos + Vector3.new(0, -0.1, 0)), col, mat)
	for k = 0, 4 do
		local w = 0.48 - math.abs(k - 1.5) * 0.08
		part("Part", { Name = "Schuppe", Size = Vector3.new(w, 0.07, w), CFrame = CFrame.new(pos + Vector3.new(0, -0.38 + k * 0.15, 0)) * CFrame.Angles(math.rad(8), math.rad(45 * k + 20), 0), Color = col:Lerp(Color3.new(0, 0, 0), 0.22 + (k % 2) * 0.1), Material = mat }, m)
	end
	part("Part", { Name = "Stiel", Size = Vector3.new(0.06, 0.2, 0.06), CFrame = CFrame.new(pos + Vector3.new(0, 0.34, 0)), Color = STEM, Material = Enum.Material.Wood }, m)
end
function FRUITS.acorn(m, pos, col, mat)
	ellipsoid(m, "Frucht", Vector3.new(0.42, 0.56, 0.42), CFrame.new(pos + Vector3.new(0, -0.1, 0)), col, mat)
	ball(m, "Frucht", 0.08, pos + Vector3.new(0, -0.39, 0), col:Lerp(Color3.new(0, 0, 0), 0.3), mat)
	ellipsoid(m, "Huetchen", Vector3.new(0.52, 0.26, 0.52), CFrame.new(pos + Vector3.new(0, 0.15, 0)), Color3.fromRGB(122, 84, 46), Enum.Material.Wood)
	for k = 0, 5 do
		local a = k / 6 * math.pi * 2
		ball(m, "Huetchen", 0.1, pos + Vector3.new(math.cos(a) * 0.21, 0.1, math.sin(a) * 0.21), Color3.fromRGB(100, 68, 36), Enum.Material.Wood)
	end
	part("Part", { Name = "Stiel", Size = Vector3.new(0.06, 0.16, 0.06), CFrame = CFrame.new(pos + Vector3.new(0, 0.32, 0)), Color = STEM, Material = Enum.Material.Wood }, m)
	shine(m, pos + Vector3.new(-0.1, -0.08, -0.16), 0.09)
end
function FRUITS.cherry(m, pos, col, mat)
	for _, side in ipairs({ -1, 1 }) do
		local c = pos + Vector3.new(side * 0.2, -0.16 + side * 0.04, 0)
		ball(m, "Frucht", 0.38, c, col, mat)
		shine(m, c + Vector3.new(-0.08, 0.08, -0.12), 0.08)
		limb(m, "Stiel", c + Vector3.new(0, 0.17, 0), pos + Vector3.new(0, 0.32, 0), 0.04, STEM)
	end
	fruitLeaf(m, pos + Vector3.new(0, 0.32, 0), 2)
end
function FRUITS.drop(m, pos, col, mat)
	local glass = mat == Enum.Material.Neon and mat or Enum.Material.Glass
	part("Part", { Name = "Frucht", Size = Vector3.new(0.38, 0.38, 0.38), CFrame = CFrame.new(pos + Vector3.new(0, -0.06, 0)) * CFrame.Angles(math.rad(45), 0, math.rad(45)), Color = col, Material = glass, Transparency = 0.1 }, m)
	part("Part", { Name = "Frucht", Size = Vector3.new(0.2, 0.42, 0.2), CFrame = CFrame.new(pos + Vector3.new(0, 0.2, 0)) * CFrame.Angles(0, math.rad(45), 0), Color = col, Material = glass, Transparency = 0.1 }, m)
	ball(m, "Kern", 0.16, pos + Vector3.new(0, -0.04, 0), col:Lerp(Color3.new(1, 1, 1), 0.5), Enum.Material.Neon)
end
function FRUITS.dragon(m, pos, col, mat)
	ellipsoid(m, "Frucht", Vector3.new(0.6, 0.72, 0.6), CFrame.new(pos + Vector3.new(0, -0.06, 0)), col, mat)
	for k = 0, 8 do
		local a = k / 9 * math.pi * 2
		local y = -0.25 + (k % 3) * 0.2
		local dir = Vector3.new(math.cos(a), 0.6, math.sin(a)).Unit
		local at = pos + Vector3.new(math.cos(a) * 0.28, y, math.sin(a) * 0.28)
		ellipsoid(m, "Schuppe", Vector3.new(0.1, 0.06, 0.26), CFrame.lookAt(at, at + dir), Color3.fromRGB(120, 220, 80):Lerp(Color3.fromRGB(255, 230, 90), (k % 3) * 0.2))
	end
	shine(m, pos + Vector3.new(-0.15, 0.1, -0.22), 0.12)
end
function FRUITS.star(m, pos, col, mat)
	-- fünfzackiger Stern aus Zacken um eine Mitte
	for k = 0, 4 do
		local a = k / 5 * math.pi * 2
		part("Part", { Name = "Frucht", Size = Vector3.new(0.14, 0.42, 0.12), CFrame = CFrame.new(pos) * CFrame.Angles(0, 0, a) * CFrame.new(0, 0.2, 0), Color = col, Material = Enum.Material.Neon }, m)
	end
	ball(m, "Frucht", 0.26, pos, col:Lerp(Color3.new(1, 1, 1), 0.4), Enum.Material.Neon)
end
function FRUITS.moon(m, pos, col, mat)
	local c = col:Lerp(Color3.fromRGB(220, 224, 236), 0.5)
	ball(m, "Frucht", 0.6, pos, c, Enum.Material.Slate)
	for k, o in ipairs({ { 0.18, 0.1, -0.2, 0.2 }, { -0.12, -0.12, -0.22, 0.14 }, { 0.05, 0.2, -0.18, 0.1 } }) do
		ball(m, "Krater", o[4], pos + Vector3.new(o[1], o[2], o[3]), c:Lerp(Color3.new(0, 0, 0), 0.3), Enum.Material.Slate)
	end
	part("Part", { Name = "Mondring", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.03, 0.82, 0.82), CFrame = CFrame.new(pos) * CFrame.Angles(0, 0, math.rad(70)), Color = col, Material = Enum.Material.Neon, Transparency = 0.4 }, m)
end

-- Größe je Seltenheit: seltene Bäume werden deutlich größer (Gewöhnlich 1, ??? 1,48), goldene noch etwas mehr
function LootBuilder.SizeOf(tree, golden)
	local rank = GardenData.RarityById[tree.Rarity].Index
	return 1 + (rank - 1) * 0.06 + (golden and 0.08 or 0)
end

-- Schössling: dünner Stiel mit Zweiglein und den ersten Blattbüscheln (Sonderbäume: kleine Vorform)
local function sapling(model, tree, leaf)
	local stem = tree.Leaf:Lerp(tree.Trunk, 0.45)
	part("Part", { Name = "Stamm", Shape = Enum.PartType.Cylinder, Size = Vector3.new(1.5, 0.2, 0.2), CFrame = CFrame.new(0, 0.75, 0) * UP, Color = stem, Material = Enum.Material.Wood }, model)
	local special = ({ mushroom = true, crystal = true, cloud = true, star = true, planet = true, angel = true, rainbow = true })[tree.Crown]
	if tree.Crown == "mushroom" then
		ellipsoid(model, "Crown", Vector3.new(1.3, 0.6, 1.3), CFrame.new(0, 1.55, 0), tree.Leaf, leaf)
	elseif tree.Crown == "crystal" then
		part("Part", { Name = "Crown", Size = Vector3.new(0.4, 0.9, 0.4), CFrame = CFrame.new(0, 1.8, 0) * CFrame.Angles(0, math.rad(45), 0), Color = tree.Leaf, Material = leaf, Transparency = 0.15 }, model)
	elseif tree.Crown == "cloud" then
		for _, o in ipairs({ { 0, 0 }, { -0.4, -0.1 }, { 0.4, -0.05 } }) do
			ball(model, "Crown", 0.75, Vector3.new(o[1], 1.7 + o[2], 0), tree.Leaf, leaf)
		end
	elseif special then
		ball(model, "Knospe", 0.5, Vector3.new(0, 1.7, 0), tree.Fruit, Enum.Material.Neon)
	end
	for k, side in ipairs({ -1, 1 }) do
		local a = Vector3.new(0, 0.7 + k * 0.25, 0)
		local b = a + Vector3.new(side * 0.5, 0.4, side * 0.15)
		local mid = (a + b) / 2
		part("Part", { Name = "Ast", Shape = Enum.PartType.Cylinder, Size = Vector3.new((b - a).Magnitude, 0.1, 0.1), CFrame = CFrame.lookAt(mid, b) * CFrame.Angles(0, math.rad(90), 0), Color = stem, Material = Enum.Material.Wood }, model)
		ellipsoid(model, "Laub", Vector3.new(0.55, 0.36, 0.55), CFrame.new(b), tree.Leaf, leaf)
	end
	if not special then
		ellipsoid(model, "Laub", Vector3.new(0.9, 0.6, 0.9), CFrame.new(0, 1.6, 0), tree.Leaf:Lerp(Color3.new(1, 1, 1), 0.08), leaf)
		ellipsoid(model, "Laub", Vector3.new(0.6, 0.4, 0.6), CFrame.new(0.15, 1.95, 0.1), tree.Leaf:Lerp(Color3.new(1, 1, 1), 0.15), leaf)
	end
end

-- Goldene Variante: Laub und Rinde mit Gold überzogen, funkelt; bei ??? schillernd (Farbe läuft in GardenBuilder.Animate)
local function gild(model, tree)
	local rainbow = GardenData.RarityById[tree.Rarity].Rainbow
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") then
			if p.Name == "Crown" or p.Name == "Laub" or p.Name == "Wedel" or p.Name == "Zweig" then
				if not rainbow then
					p.Color = p.Color:Lerp(GOLD, 0.6)
					p.Material = Enum.Material.Foil
				end
				p:SetAttribute("Schillern", true)
			elseif p.Name == "Stamm" or p.Name == "StammOben" or p.Name == "Ast" or p.Name == "StammTeil" then
				p.Color = p.Color:Lerp(GOLD, 0.35)
			end
		end
	end
	local holder = model:FindFirstChild("Stamm")
	if holder then
		local s = Instance.new("Sparkles")
		s.SparkleColor = rainbow and Color3.new(1, 1, 1) or GOLD
		s.Parent = holder
		local l = Instance.new("PointLight")
		l.Color = GOLD
		l.Brightness = 1.2
		l.Range = 9
		l.Parent = holder
	end
	model:SetAttribute("Golden", true)
end

-- LootBuilder.Tree(tree, stage, ripe, full, look): Münzbaum bauen.
-- look = { Phase = 1–5, Golden = bool } (ohne Phase: Stufe 1 → Keimling, 2 → Jungbaum, 3 → ausgewachsen)
-- Phasen: 1 Keimling, 2 Schössling, 3 Jungbaum, 4 Knospen und Blüten, 5 ausgewachsen mit Früchten.
-- full = true: Jungbaum und Knospen in voller Größe bauen (GardenBuilder skaliert sie beim Wachsen selbst)
function LootBuilder.Tree(tree, stage, ripe, full, look)
	stage = stage or 3
	ripe = ripe or 0
	look = look or {}
	local phase = look.Phase or ({ 1, 3, 5 })[stage] or 5
	local golden = look.Golden
	local model = Instance.new("Model")
	model.Name = GardenData.TreeName(tree, golden)
	model:SetAttribute("Phase", phase)
	local leaf = Enum.Material[tree.Look] or Enum.Material.Grass
	if phase <= 1 then
		-- Keimling: aufgeplatzte Samenschale, gebogener Stiel, zwei Keimblätter und eine Knospe
		ellipsoid(model, "Schale", Vector3.new(0.5, 0.26, 0.4), CFrame.new(0, 0.1, 0), golden and GOLD or tree.Trunk:Lerp(tree.Fruit, 0.3), golden and Enum.Material.Foil or nil)
		part("Part", { Name = "Stamm", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.6, 0.14, 0.14), CFrame = CFrame.new(0, 0.38, 0) * UP, Color = tree.Leaf:Lerp(tree.Trunk, 0.3), Material = Enum.Material.SmoothPlastic }, model)
		part("Part", { Name = "Stiel", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.5, 0.12, 0.12), CFrame = CFrame.new(0.06, 0.85, 0) * CFrame.Angles(0, 0, math.rad(78)), Color = tree.Leaf:Lerp(tree.Trunk, 0.2), Material = Enum.Material.SmoothPlastic }, model)
		for _, side in ipairs({ -1, 1 }) do
			ellipsoid(model, "Blatt", Vector3.new(0.62, 0.14, 0.38), CFrame.new(side * 0.3, 1.12, 0) * CFrame.Angles(0, 0, side * math.rad(-22)), golden and tree.Leaf:Lerp(GOLD, 0.5) or tree.Leaf, leaf)
		end
		ellipsoid(model, "Knospe", Vector3.new(0.24, 0.3, 0.24), CFrame.new(0.08, 1.2, 0), tree.Fruit, Enum.Material.Neon)
		measure(model)
		model:SetAttribute("TreeId", tree.Id)
		return model
	elseif phase == 2 then
		sapling(model, tree, leaf)
		if golden then gild(model, tree) end
		measure(model)
		model:SetAttribute("TreeId", tree.Id)
		return model
	end
	local h = ({ bush = 1.3, cone = 2.2, spruce = 1.4, palm = 4.8, mushroom = 1.9, cloud = 3, crystal = 2.8, angel = 3, rainbow = 3, oak = 2.4, maple = 3.4, oval = 3.8 })[tree.Crown] or 3.2
	local w = ({ bush = 0.5, mushroom = 1.1, oak = 1.35, oval = 0.62, spruce = 0.7 })[tree.Crown] or (tree.Big and 1.05 or 0.75)
	trunk(model, tree, h, w, tree.Crown == "palm")
	local center, radius, low = (CROWNS[tree.Crown] or CROWNS.round)(model, tree, leaf, h)
	-- Äste vom Stamm in die Krone: Hauptäste mit Seitenzweigen, an deren Spitzen kleine Laubbüschel sitzen
	local BRANCHY = { round = 6, blossom = 6, oval = 4, cloud = 5, angel = 4, weeping = 5, oak = 8, maple = 6 }
	if BRANCHY[tree.Crown] then
		local n = BRANCHY[tree.Crown]
		for i = 1, n do
			local a = i / n * math.pi * 2 + 0.5
			local top = Vector3.new(0, h * (0.62 + (i % 3) * 0.1), 0)
			local tip = center + Vector3.new(math.cos(a) * radius * 0.78, -radius * (0.3 - (i % 2) * 0.15), math.sin(a) * radius * 0.78)
			local mid = top:Lerp(tip, 0.5) + Vector3.new(0, 0.25, 0)
			branch(model, tree, top, mid, w * 0.34)
			branch(model, tree, mid, tip, w * 0.24)
			for _, da in ipairs({ -0.7, 0.7 }) do
				local twig = tip + Vector3.new(math.cos(a + da) * 0.6, 0.4, math.sin(a + da) * 0.6)
				branch(model, tree, tip, twig, w * 0.13)
				ellipsoid(model, "Laub", Vector3.new(0.6, 0.44, 0.6), CFrame.new(twig), leafTone(tree.Leaf, 0.05), leaf)
			end
			-- kurzer Seitentrieb unterhalb der Krone
			local side = mid + Vector3.new(math.cos(a + 1.2) * 0.55, 0.15, math.sin(a + 1.2) * 0.55)
			branch(model, tree, mid, side, w * 0.1)
			ellipsoid(model, "Laub", Vector3.new(0.42, 0.3, 0.42), CFrame.new(side), leafTone(tree.Leaf, -0.05), leaf)
		end
	end
	foliage(model, tree, leaf, center, radius)

	if phase >= 4 then
		-- Phase 4: Knospen und erste Blüten · Phase 5: Früchte an kleinen Stielen (mehr, je mehr Ernten warten; die reifen leuchten)
		local count = phase == 4 and 14 or 8 + ripe * 3
		local shape = FRUITS[tree.FruitShape] or FRUITS.apple
		local base = tree.Look == "Neon" and Enum.Material.Neon or Enum.Material.Metal
		local bud = Color3.fromRGB(255, 238, 246):Lerp(tree.Fruit, 0.2)
		for i = 1, count do
			local a = i * 2.39996 -- goldener Winkel
			local y = -0.4 + ((i * 0.618) % 1) * 1.2 - (low or 0) * 0.3
			local out = Vector3.new(math.cos(a), 0, math.sin(a))
			local pos = center + out * (radius + 0.28) + Vector3.new(0, y - 0.15, 0)
			if phase == 4 then
				if i % 3 == 0 then
					-- offene Blüte: fünf Blütenblätter um eine gelbe Mitte
					for k = 0, 4 do
						local b = k / 5 * math.pi * 2
						ellipsoid(model, "Bluete", Vector3.new(0.4, 0.1, 0.28), CFrame.lookAt(pos, pos + out) * CFrame.new(math.cos(b) * 0.26, math.sin(b) * 0.26, 0) * CFrame.Angles(math.rad(90), 0, b), bud)
					end
					ball(model, "Bluete", 0.22, pos + out * 0.05, Color3.fromRGB(255, 214, 80), Enum.Material.Neon)
				else
					ellipsoid(model, "Knospe", Vector3.new(0.4, 0.5, 0.4), CFrame.new(pos), bud)
				end
			else
				local isRipe = i <= ripe * 3
				part("Part", { Name = "Stiel", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.42, 0.06, 0.06), CFrame = CFrame.new(pos + Vector3.new(0, 0.5, 0) - out * 0.12) * UP, Color = tree.Trunk:Lerp(tree.Leaf, 0.5), Material = Enum.Material.Wood }, model)
				local col = golden and GOLD or tree.Fruit
				local before = #model:GetChildren()
				shape(model, pos, isRipe and col:Lerp(Color3.new(1, 1, 1), 0.15) or col, isRipe and Enum.Material.Neon or (golden and Enum.Material.Foil or base))
				-- Teile dieser Frucht markieren: reife pulsieren in GardenBuilder.Animate, alle leuchten nachts
				local kids = model:GetChildren()
				for n = before + 1, #kids do
					local p = kids[n]
					if p.Name == "Frucht" then
						if p.Material == Enum.Material.Metal or p.Material == Enum.Material.Foil then p.Reflectance = 0.22 end
						p:SetAttribute("Reif", isRipe or nil)
					end
				end
			end
		end
		if phase == 5 and ripe > 0 then
			local glow = Instance.new("PointLight")
			glow.Color = tree.Fruit
			glow.Brightness = 1 + ripe * 0.6
			glow.Range = 8
			glow.Parent = model:FindFirstChild("Stamm")
			local sp = Instance.new("Sparkles")
			sp.SparkleColor = tree.Fruit
			sp.Parent = model:FindFirstChild("Stamm")
		end
	end
	if golden then gild(model, tree) end
	-- seltene Bäume sind größer
	scaleModel(model, LootBuilder.SizeOf(tree, golden))
	if not full and phase < 5 then
		scaleModel(model, phase == 3 and 0.6 or 0.9)
	end
	measure(model)
	model:SetAttribute("TreeId", tree.Id)
	return model
end

-- ── Werkzeug ──
-- Jedes Stück bekommt Akzente in der Farbe seiner Seltenheit; ab Episch leuchtet es, ab Legendär funkelt es.
local RANK = { gewoehnlich = 1, selten = 2, episch = 3, legendaer = 4, mythisch = 5, goettlich = 6, kosmisch = 7, himmlisch = 8, geheim = 9 }
local DARK = Color3.fromRGB(28, 22, 34)

local function cyl(parent, name, len, dia, cf, color, material)
	return part("Part", { Name = name, Shape = Enum.PartType.Cylinder, Size = Vector3.new(len, dia, dia), CFrame = cf, Color = color, Material = material or Enum.Material.SmoothPlastic }, parent)
end
local function box(parent, name, size, cf, color, material, transparency)
	return part("Part", { Name = name, Size = size, CFrame = cf, Color = color, Material = material or Enum.Material.SmoothPlastic, Transparency = transparency or 0 }, parent)
end
-- Bogen aus kurzen Stücken (für Griffe): Mitte, Radius, Winkel von–bis (Grad) in der XY-Ebene
local function arc(parent, name, center, radius, from, to, thick, color, material, steps)
	steps = steps or 7
	for i = 0, steps - 1 do
		local a0, a1 = math.rad(from + (to - from) * i / steps), math.rad(from + (to - from) * (i + 1) / steps)
		local p0 = center + Vector3.new(math.cos(a0) * radius, math.sin(a0) * radius, 0)
		local p1 = center + Vector3.new(math.cos(a1) * radius, math.sin(a1) * radius, 0)
		local mid = (p0 + p1) / 2
		local len = (p1 - p0).Magnitude + thick * 0.6
		box(parent, name, Vector3.new(len, thick, thick), CFrame.new(mid) * CFrame.Angles(0, 0, math.atan((p1.Y - p0.Y) / ((p1.X - p0.X) ~= 0 and (p1.X - p0.X) or 0.0001))), color, material)
	end
end

local TOOLS = {}
function TOOLS.can(m, t, accent)
	local metal = t.Rainbow and Enum.Material.SmoothPlastic or (t.Id == "goldkanne" and Enum.Material.Foil or Enum.Material.Metal)
	local c = t.Color
	local body = cyl(m, "Body", 1.35, 1.45, CFrame.new(0, 0.8, 0) * UP, c, metal)
	ellipsoid(m, "Schulter", Vector3.new(1.45, 0.55, 1.45), CFrame.new(0, 1.47, 0), c, metal)
	cyl(m, "Fuss", 0.14, 1.52, CFrame.new(0, 0.12, 0) * UP, c:Lerp(Color3.new(0, 0, 0), 0.25), metal)
	ellipsoid(m, "Oeffnung", Vector3.new(0.55, 0.12, 0.55), CFrame.new(0.15, 1.72, 0), DARK)
	cyl(m, "OeffnungRand", 0.1, 0.66, CFrame.new(0.15, 1.7, 0) * UP, c:Lerp(Color3.new(1, 1, 1), 0.3), metal)
	-- Zierband mit Nieten in der Farbe der Seltenheit
	cyl(m, "Zierband", 0.2, 1.49, CFrame.new(0, 0.8, 0) * UP, accent, Enum.Material.Neon)
	for i = 0, 7 do
		local a = i / 8 * math.pi * 2
		ball(m, "Niete", 0.11, Vector3.new(math.cos(a) * 0.75, 1.15, math.sin(a) * 0.75), c:Lerp(Color3.new(1, 1, 1), 0.45), metal)
	end
	-- Tülle: dick am Körper, dünn nach außen, vorne eine Brause mit Löchern
	local tilt = CFrame.Angles(0, 0, math.rad(-38))
	cyl(m, "Tuelle", 1.1, 0.34, CFrame.new(-0.95, 0.85, 0) * tilt, c, metal)
	cyl(m, "Tuelle2", 1.0, 0.22, CFrame.new(-1.6, 1.36, 0) * tilt, c, metal)
	local rose = CFrame.new(-2.05, 1.72, 0) * tilt
	cyl(m, "Brause", 0.22, 0.62, rose, c:Lerp(Color3.new(0, 0, 0), 0.12), metal)
	for i = 0, 5 do
		local a = i / 6 * math.pi * 2
		ball(m, "Loch", 0.08, (rose * CFrame.new(-0.12, math.cos(a) * 0.17, math.sin(a) * 0.17)).Position, DARK)
	end
	-- Bügel hinten als Bogen
	arc(m, "Griff", Vector3.new(0.38, 1.55, 0), 0.6, -20, 160, 0.18, c, metal, 8)
	-- Wassertropfen aus der Brause
	for i, d in ipairs({ { -2.25, 1.42 }, { -2.33, 1.05 }, { -2.2, 0.72 } }) do
		ellipsoid(m, "Tropfen", Vector3.new(0.16, 0.24, 0.16) * (1 - i * 0.12), CFrame.new(d[1], d[2], 0), Color3.fromRGB(110, 200, 255), Enum.Material.Glass)
	end
	if t.Rainbow then
		for i = 0, 5 do
			cyl(m, "Streifen", 0.18, 1.48, CFrame.new(0, 0.28 + i * 0.22, 0) * UP, Color3.fromHSV(i / 6, 0.7, 1), Enum.Material.Neon)
		end
	end
	return body
end
function TOOLS.sack(m, t, accent)
	local magic = t.Id == "zauberduenger"
	local c = t.Color
	local body = ellipsoid(m, "Body", Vector3.new(1.55, 1.75, 1.05), CFrame.new(0, 0.9, 0), c, Enum.Material.Fabric)
	-- zusammengebundener Hals mit Kordel und Zipfeln
	ellipsoid(m, "Hals", Vector3.new(0.7, 0.45, 0.55), CFrame.new(0, 1.82, 0), c, Enum.Material.Fabric)
	cyl(m, "Kordel", 0.12, 0.62, CFrame.new(0, 1.82, 0) * UP, Color3.fromRGB(196, 160, 98), Enum.Material.Fabric)
	for i, a in ipairs({ -35, 0, 35 }) do
		ellipsoid(m, "Zipfel", Vector3.new(0.3, 0.5, 0.26), CFrame.new(math.sin(math.rad(a)) * 0.22, 2.12, 0) * CFrame.Angles(0, 0, math.rad(-a)), c:Lerp(Color3.new(1, 1, 1), 0.08 * i), Enum.Material.Fabric)
	end
	-- Etikett vorne: helles Feld mit Blatt und Rand in der Farbe der Seltenheit
	local label = CFrame.new(0, 0.95, -0.5)
	box(m, "Etikett", Vector3.new(1.0, 0.7, 0.06), label, Color3.fromRGB(246, 238, 214))
	box(m, "EtikettRand", Vector3.new(1.08, 0.78, 0.04), label * CFrame.new(0, 0, 0.02), accent, Enum.Material.Neon)
	for _, side in ipairs({ -1, 1 }) do
		ellipsoid(m, "Blatt", Vector3.new(0.3, 0.16, 0.05), label * CFrame.new(side * 0.13, 0.08, -0.04) * CFrame.Angles(0, 0, side * math.rad(30)), magic and Color3.fromRGB(220, 140, 255) or Color3.fromRGB(96, 190, 80), magic and Enum.Material.Neon or Enum.Material.SmoothPlastic)
	end
	box(m, "Stiel", Vector3.new(0.05, 0.22, 0.05), label * CFrame.new(0, -0.1, -0.04), Color3.fromRGB(80, 120, 50))
	-- verstreute Körner davor
	local rng = Random.new(#t.Id)
	for i = 1, 9 do
		ball(m, "Korn", 0.1, Vector3.new(rng:NextNumber(-0.8, 0.8), 0.05, rng:NextNumber(-0.95, -0.55)), magic and Color3.fromHSV(0.78 + rng:NextNumber(0, 0.1), 0.6, 1) or Color3.fromRGB(150, 120, 70), magic and Enum.Material.Neon or Enum.Material.SmoothPlastic)
	end
	return body
end
function TOOLS.bag(m, t, accent)
	local c = t.Color
	local body = ellipsoid(m, "Body", Vector3.new(1.75, 1.55, 1.55), CFrame.new(0, 0.8, 0), c, Enum.Material.Fabric)
	ellipsoid(m, "Hals", Vector3.new(0.65, 0.4, 0.65), CFrame.new(0, 1.62, 0), c, Enum.Material.Fabric)
	for i = 0, 4 do
		local a = i / 5 * math.pi * 2
		ellipsoid(m, "Rueschen", Vector3.new(0.32, 0.42, 0.32), CFrame.new(math.cos(a) * 0.22, 1.92, math.sin(a) * 0.22) * CFrame.Angles(math.sin(a) * 0.4, 0, -math.cos(a) * 0.4), c:Lerp(Color3.new(1, 1, 1), 0.1), Enum.Material.Fabric)
	end
	cyl(m, "Kordel", 0.12, 0.7, CFrame.new(0, 1.66, 0) * UP, Color3.fromRGB(196, 44, 52), Enum.Material.Fabric)
	-- Schleife
	for _, side in ipairs({ -1, 1 }) do
		ellipsoid(m, "Schleife", Vector3.new(0.34, 0.22, 0.08), CFrame.new(side * 0.2, 1.62, -0.38) * CFrame.Angles(0, 0, side * math.rad(20)), Color3.fromRGB(214, 52, 60))
	end
	-- großes Moneten-Zeichen vorne
	local front = CFrame.new(0, 0.85, -0.78)
	cyl(m, "Zeichen", 0.06, 0.62, front * FRONT, accent, Enum.Material.Neon)
	cyl(m, "ZeichenInnen", 0.08, 0.42, front * CFrame.new(0, 0, -0.01) * FRONT, Color3.fromRGB(255, 214, 90), Enum.Material.Metal)
	-- Moneten daneben: ein kleiner Stapel und zwei schräge
	for i = 0, 3 do
		cyl(m, "Moneten", 0.1, 0.5, CFrame.new(1.05, 0.06 + i * 0.1, -0.35) * UP * CFrame.Angles(math.rad(i * 25), 0, 0), Color3.fromRGB(255, 205, 80), Enum.Material.Metal)
	end
	cyl(m, "Moneten", 0.1, 0.5, CFrame.new(-0.95, 0.2, -0.6) * CFrame.Angles(0, math.rad(60), math.rad(70)), Color3.fromRGB(255, 205, 80), Enum.Material.Metal)
	cyl(m, "Moneten", 0.1, 0.5, CFrame.new(0.55, 0.06, -0.95) * UP, Color3.fromRGB(255, 205, 80), Enum.Material.Metal)
	return body
end
function TOOLS.spade(m, t, accent)
	local wood = Color3.fromRGB(132, 88, 50)
	cyl(m, "Stiel", 2.2, 0.2, CFrame.new(0, 2.2, 0) * UP, wood, Enum.Material.Wood)
	-- T-Griff mit goldenen Kappen
	cyl(m, "Griff", 0.85, 0.2, CFrame.new(0, 3.35, 0), wood, Enum.Material.Wood)
	for _, x in ipairs({ -0.45, 0.45 }) do
		ball(m, "Kappe", 0.26, Vector3.new(x, 3.35, 0), t.Color, Enum.Material.Foil)
	end
	-- Manschette mit Steinen in der Farbe der Seltenheit
	cyl(m, "Manschette", 0.35, 0.3, CFrame.new(0, 1.2, 0) * UP, t.Color, Enum.Material.Foil)
	for i = 0, 3 do
		local a = i / 4 * math.pi * 2
		ball(m, "Stein", 0.1, Vector3.new(math.cos(a) * 0.16, 1.2, math.sin(a) * 0.16), accent, Enum.Material.Neon)
	end
	-- Blatt: gerade Fläche mit runder Spitze, oben eine Trittkante
	local body = box(m, "Body", Vector3.new(1, 0.85, 0.1), CFrame.new(0, 0.62, 0), t.Color, Enum.Material.Foil)
	ellipsoid(m, "Spitze", Vector3.new(1, 0.7, 0.1), CFrame.new(0, 0.2, 0), t.Color, Enum.Material.Foil)
	box(m, "Kante", Vector3.new(1.06, 0.12, 0.2), CFrame.new(0, 1.06, 0), t.Color:Lerp(Color3.new(0, 0, 0), 0.2), Enum.Material.Foil)
	box(m, "Glanz", Vector3.new(0.12, 0.7, 0.02), CFrame.new(-0.25, 0.6, -0.06) * CFrame.Angles(0, 0, math.rad(12)), Color3.new(1, 1, 1), Enum.Material.Neon, 0.4)
	return body
end
function TOOLS.chest(m, t, accent)
	local wood = Color3.fromRGB(122, 70, 36)
	local gold = t.Color
	local body = box(m, "Body", Vector3.new(2, 1, 1.3), CFrame.new(0, 0.5, 0), wood, Enum.Material.WoodPlanks)
	-- gewölbter Deckel, geöffnet nach hinten geklappt
	local hinge = CFrame.new(0, 1.0, 0.65)
	local lid = hinge * CFrame.Angles(math.rad(-38), 0, 0) * CFrame.new(0, 0.1, -0.65)
	cyl(m, "Deckel", 2.02, 1.1, lid, wood, Enum.Material.WoodPlanks)
	for _, x in ipairs({ -0.7, 0.7 }) do
		cyl(m, "DeckelBand", 0.16, 1.14, lid * CFrame.new(x, 0, 0), gold, Enum.Material.Foil)
		box(m, "Beschlag", Vector3.new(0.16, 1.02, 1.34), CFrame.new(x, 0.5, 0), gold, Enum.Material.Foil)
	end
	-- Ecken und Schloss
	for _, x in ipairs({ -0.98, 0.98 }) do
		box(m, "Ecke", Vector3.new(0.1, 0.3, 0.3), CFrame.new(x, 0.15, -0.6), gold, Enum.Material.Foil)
	end
	box(m, "Schloss", Vector3.new(0.34, 0.4, 0.1), CFrame.new(0, 0.82, -0.68), gold, Enum.Material.Foil)
	ball(m, "Schlossstein", 0.16, Vector3.new(0, 0.82, -0.74), accent, Enum.Material.Neon)
	-- Schatz: Berg aus Moneten, Edelsteine, ein paar Moneten fallen heraus
	ellipsoid(m, "Schatz", Vector3.new(1.85, 0.65, 1.15), CFrame.new(0, 1.0, 0), gold, Enum.Material.Neon)
	local rng = Random.new(9)
	for i = 0, 10 do
		local a = i * 2.4
		cyl(m, "Moneten", 0.08, 0.36, CFrame.new(math.cos(a) * 0.6 * rng:NextNumber(0.3, 1), 1.18 + rng:NextNumber(0, 0.12), math.sin(a) * 0.35 * rng:NextNumber(0.3, 1)) * UP * CFrame.Angles(rng:NextNumber(-0.5, 0.5), 0, rng:NextNumber(-0.4, 0.4)), Color3.fromRGB(255, 226, 120), Enum.Material.Metal)
	end
	for i, col in ipairs({ Color3.fromRGB(255, 70, 110), Color3.fromRGB(80, 200, 255), Color3.fromRGB(120, 255, 140) }) do
		ball(m, "Edelstein", 0.24, Vector3.new(-0.6 + i * 0.35, 1.28, -0.15 + (i % 2) * 0.2), col, Enum.Material.Neon)
	end
	for i = 0, 2 do
		cyl(m, "Moneten", 0.08, 0.38, CFrame.new(-0.4 + i * 0.4, 0.05 + (i % 2) * 0.05, -0.95) * UP, Color3.fromRGB(255, 214, 100), Enum.Material.Metal)
	end
	return body
end

function LootBuilder.Tool(tool)
	local model = Instance.new("Model")
	model.Name = tool.Name
	local rarity = GardenData.RarityById[tool.Rarity]
	local rank = RANK[tool.Rarity] or 1
	local accent = rarity and rarity.Color or tool.Color
	local body = (TOOLS[tool.Model] or TOOLS.bag)(model, tool, accent)
	model.PrimaryPart = body
	if rank >= 3 then
		local glow = Instance.new("PointLight")
		glow.Color = accent
		glow.Brightness = 0.6 + rank * 0.35
		glow.Range = 5 + rank
		glow.Parent = body
	end
	if rank >= 4 then
		local sp = Instance.new("Sparkles")
		sp.SparkleColor = accent
		sp.Parent = body
	end
	measure(model)
	model:SetAttribute("ToolId", tool.Id)
	return model
end

-- Samentüte eines Baums: bauchige Papiertüte in den Farben des Baums, Rand in der Farbe der Seltenheit,
-- vorne ein Bild des Baums auf hellem Feld, oben eingerissen mit herausrieselnden Samen, davor ein Häufchen.
-- Seltene Samen leuchten (ab Episch) und funkeln (ab Legendär).
function LootBuilder.Seed(tree)
	local model = Instance.new("Model")
	model.Name = tree.SeedName or (tree.Name .. "-Samen")
	local rank = RANK[tree.Rarity] or 1
	local rarity = GardenData.RarityById[tree.Rarity]
	local accent = rarity and rarity.Color or tree.Fruit
	local paper = tree.Leaf:Lerp(Color3.new(1, 1, 1), 0.35)
	local tilt = CFrame.new(0, 1.12, 0) * CFrame.Angles(math.rad(-6), 0, 0)
	local body = box(model, "Body", Vector3.new(1.5, 2, 0.24), tilt, paper)
	model.PrimaryPart = body
	ellipsoid(model, "Bauch", Vector3.new(1.42, 1.8, 0.36), tilt * CFrame.new(0, -0.05, 0.08), paper)
	-- Rand in der Farbe der Seltenheit (vier Leisten)
	local front = tilt * CFrame.new(0, 0, -0.13)
	local edge = rank >= 3 and Enum.Material.Neon or Enum.Material.Foil
	for k, e in ipairs({ { 0, 0.97, 1.5, 0.07 }, { 0, -0.97, 1.5, 0.07 }, { -0.72, 0, 0.07, 2 }, { 0.72, 0, 0.07, 2 } }) do
		-- ???: Rand in Regenbogenfarben
		local c = rarity and rarity.Rainbow and Color3.fromHSV(k / 4, 0.7, 1) or accent
		box(model, "Rand", Vector3.new(e[3], e[4], 0.04), front * CFrame.new(e[1], e[2], 0), c, edge)
	end
	-- oben gefalzt und eingerissen (Zacken), Samen rieseln heraus
	box(model, "Falz", Vector3.new(1.52, 0.3, 0.3), tilt * CFrame.new(0, 0.86, 0), tree.Trunk)
	for i = 0, 5 do
		box(model, "Zacke", Vector3.new(0.2, 0.2, 0.28), tilt * CFrame.new(-0.62 + i * 0.25, 1.02, 0) * CFrame.Angles(0, 0, math.rad(45)), tree.Trunk)
	end
	local seedColor = tree.Trunk:Lerp(tree.Fruit, 0.35)
	local seedMat = rank >= 4 and Enum.Material.Neon or Enum.Material.SmoothPlastic
	for i, o in ipairs({ { 0.42, 1.1 }, { 0.56, 1.13 }, { 0.49, 1.22 } }) do
		ellipsoid(model, "Rieseln", Vector3.new(0.17, 0.12, 0.14), tilt * CFrame.new(o[1], o[2], -0.04) * CFrame.Angles(0, 0, i), seedColor, seedMat)
	end
	-- Bild: Baum mit Münzen auf hellem Feld, darüber eine Sonne
	local pic = front * CFrame.new(0, 0.05, -0.02)
	box(model, "Bildfeld", Vector3.new(1.12, 1.15, 0.04), pic, Color3.fromRGB(250, 244, 226))
	box(model, "Boden", Vector3.new(1.12, 0.18, 0.05), pic * CFrame.new(0, -0.48, -0.01), Color3.fromRGB(120, 170, 80))
	box(model, "Bildstamm", Vector3.new(0.14, 0.42, 0.05), pic * CFrame.new(0, -0.24, -0.02), tree.Trunk)
	ellipsoid(model, "Bildkrone", Vector3.new(0.72, 0.6, 0.08), pic * CFrame.new(0, 0.14, -0.03), tree.Leaf, rank >= 3 and Enum.Material.Neon or Enum.Material.SmoothPlastic)
	for i = -1, 1 do
		cyl(model, "Bildmuenze", 0.04, 0.16, pic * CFrame.new(i * 0.2, 0.1 + math.abs(i) * 0.09, -0.08) * FRONT, tree.Fruit, Enum.Material.Neon)
	end
	ball(model, "Sonne", 0.2, (pic * CFrame.new(0.38, 0.4, -0.03)).Position, Color3.fromRGB(255, 210, 90), Enum.Material.Neon)
	-- Banderole unten mit Edelstein in der Farbe der Seltenheit
	box(model, "Band", Vector3.new(1.52, 0.24, 0.32), tilt * CFrame.new(0, -0.8, 0), tree.Fruit, rank >= 3 and Enum.Material.Neon or Enum.Material.SmoothPlastic)
	box(model, "Stein", Vector3.new(0.22, 0.22, 0.08), front * CFrame.new(0, -0.8, -0.06) * CFrame.Angles(0, 0, math.rad(45)), accent, Enum.Material.Neon)
	-- Glanzstreifen schräg über die Tüte
	box(model, "Glanz", Vector3.new(0.14, 1.9, 0.02), front * CFrame.new(-0.42, 0, -0.05) * CFrame.Angles(0, 0, math.rad(-14)), Color3.new(1, 1, 1), Enum.Material.Neon, 0.75)
	-- Häufchen Samen davor
	local rng = Random.new(#tree.Id)
	for i = 1, 6 do
		ellipsoid(model, "Samen", Vector3.new(0.26, 0.17, 0.2), CFrame.new(-0.55 + i * 0.17 + rng:NextNumber(-0.05, 0.05), 0.09 + (i % 3 == 0 and 0.12 or 0), -0.6 - rng:NextNumber(0, 0.25)) * CFrame.Angles(0, rng:NextNumber(0, 3), rng:NextNumber(-0.3, 0.3)), seedColor, seedMat)
	end
	if rank >= 3 then
		local glow = Instance.new("PointLight")
		glow.Color = accent
		glow.Brightness = 0.6 + rank * 0.3
		glow.Range = 5 + rank
		glow.Parent = body
	end
	if rank >= 4 then
		local sp = Instance.new("Sparkles")
		sp.SparkleColor = accent
		sp.Parent = body
	end
	measure(model)
	model:SetAttribute("TreeId", tree.Id)
	model:SetAttribute("Seed", true)
	return model
end

-- ── Zäune ──
-- Jeder Stil hat Pfosten (post) und eine Füllung zwischen zwei Pfosten (fill), every = Pfostenabstand.
-- Ein Abschnitt liegt im Raum „run“: Ursprung am Startpfosten, x entlang des Zauns, y nach oben.
local function runFrame(a, b)
	local horizontal = math.abs(b.X - a.X) > math.abs(b.Z - a.Z)
	local dir = horizontal and (b.X >= a.X and 1 or -1) or (b.Z >= a.Z and 1 or -1)
	local yaw = horizontal and (dir > 0 and 0 or math.pi) or (dir > 0 and -math.pi / 2 or math.pi / 2)
	return CFrame.new(a) * CFrame.Angles(0, yaw, 0), (b - a).Magnitude
end
local function shade(c, k) return c:Lerp(Color3.new(0, 0, 0), k) end

local FENCE = {}
FENCE.holzzaun = {
	every = 3,
	post = function(m, cf, h)
		box(m, "Pfosten", Vector3.new(0.32, h, 0.32), cf * CFrame.new(0, h / 2, 0), Color3.fromRGB(128, 88, 52), Enum.Material.Wood)
	end,
	fill = function(m, cf, len)
		for _, y in ipairs({ 0.55, 1.15 }) do
			box(m, "Latte", Vector3.new(len, 0.18, 0.14), cf * CFrame.new(len / 2, y, 0), Color3.fromRGB(150, 104, 62), Enum.Material.Wood)
		end
	end,
}
FENCE.lattenzaun = {
	every = 3,
	post = function(m, cf, h)
		box(m, "Pfosten", Vector3.new(0.34, h, 0.34), cf * CFrame.new(0, h / 2, 0), Color3.fromRGB(246, 244, 238))
		ball(m, "Kappe", 0.3, (cf * CFrame.new(0, h + 0.1, 0)).Position, Color3.fromRGB(236, 232, 222))
	end,
	fill = function(m, cf, len)
		for _, y in ipairs({ 0.4, 1.0 }) do
			box(m, "Riegel", Vector3.new(len, 0.14, 0.1), cf * CFrame.new(len / 2, y, 0.06), Color3.fromRGB(226, 222, 212))
		end
		local n = math.max(1, math.floor(len / 0.5))
		for i = 1, n - 1 do
			local x = len * i / n
			box(m, "Latte", Vector3.new(0.26, 1.2, 0.07), cf * CFrame.new(x, 0.65, -0.03), Color3.fromRGB(250, 248, 242))
			box(m, "Spitze", Vector3.new(0.19, 0.19, 0.07), cf * CFrame.new(x, 1.25, -0.03) * CFrame.Angles(0, 0, math.rad(45)), Color3.fromRGB(250, 248, 242))
		end
	end,
}
FENCE.steinmauer = {
	every = 4,
	post = function(m, cf, h)
		box(m, "Saeule", Vector3.new(0.72, h * 0.8, 0.72), cf * CFrame.new(0, h * 0.4, 0), Color3.fromRGB(132, 136, 146), Enum.Material.Slate)
		box(m, "Deckstein", Vector3.new(0.86, 0.16, 0.86), cf * CFrame.new(0, h * 0.8 + 0.08, 0), Color3.fromRGB(104, 108, 118), Enum.Material.Slate)
	end,
	fill = function(m, cf, len)
		local rng = Random.new(math.floor(len * 10))
		for row = 0, 1 do
			local x = row == 1 and -0.45 or 0
			while x < len do
				local l = math.min(0.9, len - math.max(x, 0))
				local x0 = math.max(x, 0)
				if l > 0.1 then
					box(m, "Stein", Vector3.new(l - 0.04, 0.4, 0.48), cf * CFrame.new(x0 + l / 2, 0.21 + row * 0.42, 0), Color3.fromRGB(120, 124, 134):Lerp(Color3.fromRGB(160, 156, 150), rng:NextNumber(0, 0.6)), Enum.Material.Slate)
				end
				x = x + 0.9
			end
		end
		box(m, "Moos", Vector3.new(len, 0.1, 0.52), cf * CFrame.new(len / 2, 0.89, 0), Color3.fromRGB(96, 150, 70), Enum.Material.Grass)
	end,
}
FENCE.bambuszaun = {
	every = 3,
	post = function(m, cf, h)
		cyl(m, "Rohr", h + 0.3, 0.36, cf * CFrame.new(0, (h + 0.3) / 2, 0) * UP, Color3.fromRGB(150, 186, 80))
		cyl(m, "Knoten", 0.08, 0.4, cf * CFrame.new(0, 1.0, 0) * UP, Color3.fromRGB(110, 140, 56))
	end,
	fill = function(m, cf, len)
		local n = math.max(1, math.floor(len / 0.42))
		for i = 1, n - 1 do
			local x = len * i / n
			local h = i % 2 == 0 and 1.55 or 1.35
			local c = Color3.fromRGB(141, 184, 74):Lerp(Color3.fromRGB(190, 200, 100), (i % 3) * 0.2)
			cyl(m, "Rohr", h, 0.27, cf * CFrame.new(x, h / 2, 0) * UP, c)
			cyl(m, "Knoten", 0.06, 0.31, cf * CFrame.new(x, h * 0.55, 0) * UP, shade(c, 0.25))
		end
		box(m, "Schnur", Vector3.new(len, 0.07, 0.34), cf * CFrame.new(len / 2, 1.05, 0), Color3.fromRGB(150, 110, 60), Enum.Material.Fabric)
	end,
}
FENCE.eisengitter = {
	every = 2.5,
	post = function(m, cf, h)
		box(m, "Pfosten", Vector3.new(0.28, h + 0.2, 0.28), cf * CFrame.new(0, (h + 0.2) / 2, 0), Color3.fromRGB(36, 36, 44), Enum.Material.Metal)
		box(m, "Laternenfuss", Vector3.new(0.36, 0.08, 0.36), cf * CFrame.new(0, h + 0.24, 0), Color3.fromRGB(200, 160, 70), Enum.Material.Foil)
		ball(m, "Laterne", 0.3, (cf * CFrame.new(0, h + 0.45, 0)).Position, Color3.fromRGB(255, 214, 120), Enum.Material.Neon)
	end,
	fill = function(m, cf, len)
		for _, y in ipairs({ 0.25, 1.45 }) do
			box(m, "Querstange", Vector3.new(len, 0.1, 0.1), cf * CFrame.new(len / 2, y, 0), Color3.fromRGB(36, 36, 44), Enum.Material.Metal)
		end
		local n = math.max(1, math.floor(len / 0.42))
		for i = 1, n - 1 do
			local x = len * i / n
			cyl(m, "Stab", 1.55, 0.08, cf * CFrame.new(x, 0.85, 0) * UP, Color3.fromRGB(36, 36, 44), Enum.Material.Metal)
			ball(m, "Spitze", 0.14, (cf * CFrame.new(x, 1.66, 0)).Position, Color3.fromRGB(230, 186, 80), Enum.Material.Foil)
		end
	end,
}
FENCE.kristallzaun = {
	every = 2.4,
	post = function(m, cf, h, i)
		box(m, "Kristall", Vector3.new(0.4, h + 0.2, 0.4), cf * CFrame.new(0, (h + 0.2) / 2, 0) * CFrame.Angles(0, math.rad(45), 0), Color3.fromRGB(150, 230, 255), Enum.Material.Glass, 0.25)
		local core = box(m, "Kern", Vector3.new(0.12, h, 0.12), cf * CFrame.new(0, h / 2, 0), Color3.fromRGB(120, 230, 255), Enum.Material.Neon)
		box(m, "Splitter", Vector3.new(0.22, 0.5, 0.22), cf * CFrame.new(0, h + 0.4, 0) * CFrame.Angles(math.rad(45), math.rad(45), 0), Color3.fromRGB(200, 245, 255), Enum.Material.Glass, 0.15)
		if (i or 0) % 2 == 0 then
			local sp = Instance.new("Sparkles")
			sp.SparkleColor = Color3.fromRGB(160, 240, 255)
			sp.Parent = core
		end
	end,
	fill = function(m, cf, len)
		for _, y in ipairs({ 0.6, 1.2 }) do
			box(m, "Lichtband", Vector3.new(len, 0.08, 0.08), cf * CFrame.new(len / 2, y, 0), Color3.fromRGB(110, 225, 255), Enum.Material.Neon, 0.2)
		end
	end,
}
FENCE.lavazaun = {
	every = 3,
	post = function(m, cf, h, i)
		local post = box(m, "Pfosten", Vector3.new(0.46, h, 0.46), cf * CFrame.new(0, h / 2, 0), Color3.fromRGB(46, 36, 34), Enum.Material.Basalt)
		box(m, "Glutader", Vector3.new(0.08, h - 0.2, 0.48), cf * CFrame.new(0, h / 2, 0), Color3.fromRGB(255, 110, 40), Enum.Material.Neon)
		if (i or 0) % 2 == 0 then
			local fire = Instance.new("Fire")
			fire.Size = 1.6
			fire.Heat = 4
			fire.Color = Color3.fromRGB(255, 140, 40)
			fire.SecondaryColor = Color3.fromRGB(255, 60, 20)
			fire.Parent = post
		end
	end,
	fill = function(m, cf, len)
		box(m, "Mauer", Vector3.new(len, 0.72, 0.34), cf * CFrame.new(len / 2, 0.36, 0), Color3.fromRGB(80, 40, 30), Enum.Material.CrackedLava)
		box(m, "Glut", Vector3.new(len, 0.06, 0.36), cf * CFrame.new(len / 2, 0.73, 0), Color3.fromRGB(255, 120, 40), Enum.Material.Neon)
	end,
}
FENCE.sternenzaun = {
	every = 3,
	post = function(m, cf, h)
		box(m, "Pfosten", Vector3.new(0.3, h + 0.2, 0.3), cf * CFrame.new(0, (h + 0.2) / 2, 0), Color3.fromRGB(30, 24, 70))
		for _, r in ipairs({ 0, 45 }) do
			box(m, "Stern", Vector3.new(0.34, 0.34, 0.08), cf * CFrame.new(0, h + 0.5, 0) * CFrame.Angles(0, 0, math.rad(r)), Color3.fromRGB(255, 236, 140), Enum.Material.Neon)
		end
	end,
	fill = function(m, cf, len)
		for k, y in ipairs({ 0.5, 0.95, 1.4 }) do
			box(m, "Lichtband", Vector3.new(len, 0.06, 0.06), cf * CFrame.new(len / 2, y, 0), Color3.fromHSV(0.68 + k * 0.04, 0.55, 1), Enum.Material.Neon, 0.15)
		end
		local rng = Random.new(math.floor(len * 7))
		for x = 0.6, len - 0.3, 0.8 do
			ball(m, "Funkel", 0.1, (cf * CFrame.new(x, rng:NextNumber(0.4, 1.5), 0)).Position, Color3.fromRGB(255, 244, 200), Enum.Material.Neon)
		end
	end,
}

FENCE.wolkenzaun = {
	every = 3,
	post = function(m, cf, h)
		cyl(m, "Pfosten", h, 0.26, cf * CFrame.new(0, h / 2, 0) * UP, Color3.fromRGB(240, 200, 100), Enum.Material.Foil)
		ball(m, "Kappe", 0.36, (cf * CFrame.new(0, h + 0.12, 0)).Position, Color3.fromRGB(255, 240, 180), Enum.Material.Neon)
	end,
	fill = function(m, cf, len)
		box(m, "Kette", Vector3.new(len, 0.07, 0.07), cf * CFrame.new(len / 2, 0.4, 0), Color3.fromRGB(240, 200, 100), Enum.Material.Foil)
		local n = math.max(1, math.floor(len / 0.9))
		for i = 0, n do
			local x = len * (i + 0.5) / (n + 1)
			ball(m, "Wolke", 0.85 + (i % 2) * 0.3, (cf * CFrame.new(x, 1.0 + (i % 2) * 0.15, 0)).Position, Color3.fromRGB(250, 252, 255))
		end
	end,
}
FENCE.regenbogenzaun = {
	every = 3,
	post = function(m, cf, h, i)
		box(m, "Pfosten", Vector3.new(0.3, h + 0.2, 0.3), cf * CFrame.new(0, (h + 0.2) / 2, 0), Color3.new(1, 1, 1), Enum.Material.Glass, 0.2)
		ball(m, "Kappe", 0.4, (cf * CFrame.new(0, h + 0.4, 0)).Position, Color3.fromHSV(((i or 0) % 7) / 7, 0.6, 1), Enum.Material.Neon)
	end,
	fill = function(m, cf, len)
		-- sechs Bänder übereinander in den Farben des Regenbogens
		for k = 0, 5 do
			box(m, "Band", Vector3.new(len, 0.12, 0.08), cf * CFrame.new(len / 2, 0.35 + k * 0.22, 0), Color3.fromHSV(k / 6, 0.7, 1), Enum.Material.Neon)
		end
	end,
}

-- Zaun von a nach b (Bodenpunkte); Pfosten im Abstand des Stils, n = feste Anzahl Felder (optional)
function LootBuilder.FenceRun(parent, fenceId, a, b, n)
	local st = FENCE[fenceId] or FENCE.holzzaun
	local cf, len = runFrame(a, b)
	n = n or math.max(1, math.floor(len / st.every + 0.5))
	for i = 0, n do
		st.post(parent, cf * CFrame.new(len * i / n, 0, 0), 1.6, i)
	end
	for i = 0, n - 1 do
		st.fill(parent, cf * CFrame.new(len * i / n, 0, 0), len / n)
	end
end

-- einzelner Pfosten in einem Stil (z. B. die hohen Torpfosten)
function LootBuilder.FencePost(parent, fenceId, pos, h, i)
	local st = FENCE[fenceId] or FENCE.holzzaun
	st.post(parent, CFrame.new(pos), h, i or 0)
end

-- Zaun als Schatz aus der Rolle: ein Stück auf einem Rasenstreifen
function LootBuilder.Fence(fence)
	local model = Instance.new("Model")
	model.Name = fence.Name
	local base = box(model, "Rasen", Vector3.new(3.8, 0.14, 1.1), CFrame.new(0, 0.07, 0), Color3.fromRGB(96, 156, 66), Enum.Material.Grass)
	model.PrimaryPart = base
	local holder = Instance.new("Model")
	LootBuilder.FenceRun(holder, fence.Id, Vector3.new(-1.6, 0.14, 0), Vector3.new(1.6, 0.14, 0), 2)
	for _, p in ipairs(holder:GetChildren()) do
		p.Parent = model
	end
	local rarity = GardenData.RarityById[fence.Rarity]
	local rank = RANK[fence.Rarity] or 1
	if rank >= 3 then
		local glow = Instance.new("PointLight")
		glow.Color = rarity.Color
		glow.Brightness = 0.6 + rank * 0.3
		glow.Range = 6 + rank
		glow.Parent = base
	end
	measure(model)
	model:SetAttribute("FenceId", fence.Id)
	return model
end

-- Was aus einer Münzrolle kommt: Samen für Bäume, Zaunstück für Zäune, sonst das Werkzeug
function LootBuilder.Build(item)
	if item.Type == "Tree" then
		return LootBuilder.Seed(item)
	elseif item.Type == "Fence" then
		return LootBuilder.Fence(item)
	end
	return LootBuilder.Tool(item)
end

return LootBuilder
`;

export const GARDEN_BUILDER = `${HEADER('Münzbaumgarten bauen')}
-- GardenBuilder.Build(garden) baut den Garten als Model: Wiese mit Zaun, Tor und Schild, darauf die Beete
-- in Reihen zu je 4. garden = { Beds = Anzahl, Fence = Zaun-Id, Plots = { [i] = { Tree = id, Stage = 1–3, Ripe = n, Progress = 0–1, Golden = bool } oder false } }
-- (Stage und Ripe aus GardenData.Stage/Ripe; aus Progress folgt die Phase, GardenData.PhaseOf). Beet 1 liegt vorne links (von der Kamera vor dem Tor aus).
-- Über wachsenden Bäumen schwebt ein Timer; GardenBuilder.SetTimer(model, i, text, fortschritt) zählt ihn weiter.
-- Animation: GardenBuilder.Animate(model, zeit, dt) jedes Bild aufrufen. Bäume wachsen dann stufenlos mit dem
-- Fortschritt (Plot.Progress bzw. SetTimer), wiegen sich im Wind, wachsende atmen leicht und lassen Blättchen
-- aufsteigen. Plot.Fresh = true: Das Beet hat gerade eine neue Stufe erreicht, der Baum ploppt mit Funken auf.
-- Tag und Nacht: Animate liest Lighting.ClockTime. Nachts leuchten Früchte (bei Legendär+ auch die Laubspitzen),
-- ein Licht in der Krone geht an und Glühwürmchen kommen heraus.
-- Zaunwechsel: garden.FenceFrom = alter Zaun → der alte versinkt, der neue wächst vom Tor aus rundherum (in Animate).
-- GardenBuilder.BedPosition(i, beds) gibt die Mitte eines Beets zurück.

local GardenData = require(script.Parent.GardenData)
local LootBuilder = require(script.Parent.LootBuilder)

local GardenBuilder = {}

-- Animations-Daten je gebautem Garten (schwache Schlüssel: verschwindet mit dem Model)
local animated = setmetatable({}, { __mode = "k" })
local fenceAnim = setmetatable({}, { __mode = "k" }) -- Zaunwechsel

-- Teile eines Baums relativ zu seinem Fußpunkt merken; gibt eine Funktion zum Setzen (Ort, Größe) zurück.
-- Früchte schaukeln, reife pulsieren. Größen werden nur gesetzt, wenn sich die Größe ändert (spart Arbeit je Bild).
local function rigTree(tree, base)
	local parts = {}
	for n, p in ipairs(tree:GetDescendants()) do
		if p:IsA("BasePart") then
			local fruit = p.Name == "Frucht"
			table.insert(parts, { Part = p, Offset = base:ToObjectSpace(p.CFrame), Size = p.Size, Spin = fruit and n * 0.7 or nil, Pulse = fruit and p:GetAttribute("Reif") and n or nil })
		end
	end
	local lastK = nil
	return function(cf, k, t)
		local resize = lastK == nil or math.abs(k - lastK) > 0.0005
		lastK = k
		local kk = math.max(k, 0.01)
		for _, e in ipairs(parts) do
			local o = e.Offset
			if e.Pulse and t then
				e.Part.Size = e.Size * kk * (1 + math.sin(t * 3.2 + e.Pulse) * 0.09)
			elseif resize then
				e.Part.Size = e.Size * kk
			end
			if e.Spin and t then
				e.Part.CFrame = cf * CFrame.new(o.Position * k) * CFrame.Angles(math.sin(t * 2.1 + e.Spin) * 0.18, 0, math.cos(t * 1.7 + e.Spin) * 0.18) * o.Rotation
			else
				e.Part.CFrame = cf * CFrame.new(o.Position * k) * o.Rotation
			end
		end
	end
end

-- Nacht 0–1 aus der Uhrzeit (Lighting.ClockTime): ab 17 Uhr dunkler, 20–5 Uhr ganz Nacht, bis 7 Uhr wieder Tag
local Lighting = game:GetService("Lighting")
local function nightFactor()
	local h = Lighting.ClockTime % 24
	if h >= 20 or h < 5 then return 1 end
	if h >= 17 then return (h - 17) / 3 end
	if h < 7 then return 1 - (h - 5) / 2 end
	return 0
end
GardenBuilder.NightFactor = nightFactor

-- Zielgröße eines Baums aus Phase (1–5) und Fortschritt (0–1 bis ausgewachsen)
local function growScale(phase, progress)
	if phase <= 1 then
		return 0.55 + 0.75 * math.clamp(progress / 0.15, 0, 1) -- Keimling wird größer
	elseif phase == 2 then
		return 0.7 + 0.5 * math.clamp((progress - 0.15) / 0.19, 0, 1) -- Schössling
	elseif phase == 3 then
		return 0.42 + 0.48 * math.clamp((progress - 0.34) / 0.46, 0, 1) -- Jungbaum
	elseif phase == 4 then
		return 0.9 + 0.1 * math.clamp((progress - 0.8) / 0.2, 0, 1) -- Knospen, fast ausgewachsen
	end
	return 1
end

GardenBuilder.Columns = 4
GardenBuilder.Spacing = 7

${PART}
-- Seltenheits-Effekte am Beet (wachsen nicht mit): ab Episch Lichtpunkte, ab Legendär Aura und Licht,
-- ab Göttlich ein Leuchtring im Beet; ??? schillert in allen Farben (Farbe setzt Animate)
local function rarityFx(model, tree, base, height, entry)
	local rarity = GardenData.RarityById[tree.Rarity]
	local rank = rarity.Index
	if rank < 2 then return end
	local color = rarity.Color
	local function emitter(parent, props)
		local e = Instance.new("ParticleEmitter")
		e.Texture = "rbxasset://textures/particles/sparkles_main.dds"
		e.LightEmission = 1
		for key, value in pairs(props) do e[key] = value end
		e.Parent = parent
		return e
	end
	-- Glühwürmchen schwirren um alle Bäume ab Selten (seltener = mehr)
	local swarm = part("Part", { Name = "Gluehwuermchen", Size = Vector3.new(4, height * 0.8, 4), Transparency = 1, CFrame = base * CFrame.new(0, height * 0.5, 0) }, model)
	emitter(swarm, { Color = ColorSequence.new(Color3.fromRGB(230, 255, 140), color), Lifetime = NumberRange.new(3, 5), Speed = NumberRange.new(0.3, 0.8), SpreadAngle = Vector2.new(180, 180), Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.3, 0.22), NumberSequenceKeypoint.new(0.7, 0.18), NumberSequenceKeypoint.new(1, 0) }), Rate = 0.6 + rank * 0.35, RotSpeed = NumberRange.new(-40, 40), Acceleration = Vector3.new(0, 0.15, 0) })
	if rank < 3 then return end
	local holder = part("Part", { Name = "Aura", Size = Vector3.new(3, height * 0.6, 3), Transparency = 1, CFrame = base * CFrame.new(0, height * 0.55, 0) }, model)
	local motes = emitter(holder, { Color = ColorSequence.new(color, Color3.new(1, 1, 1)), Lifetime = NumberRange.new(2, 3.2), Speed = NumberRange.new(0.2, 0.7), SpreadAngle = Vector2.new(180, 180), Size = NumberSequence.new(0.28, 0), Rate = 2 + rank, Acceleration = Vector3.new(0, 0.4, 0) })
	entry.Fx = { motes }
	if rank >= 4 then
		local glow = emitter(holder, { Color = ColorSequence.new(color), Lifetime = NumberRange.new(1.5, 2.5), Speed = NumberRange.new(0, 0.2), SpreadAngle = Vector2.new(180, 180), Size = NumberSequence.new(1.4, 0), Transparency = NumberSequence.new(0.7, 1), Rate = 2 + rank * 0.5 })
		table.insert(entry.Fx, glow)
		local l = Instance.new("PointLight")
		l.Color = color
		l.Brightness = 1 + (rank - 4) * 0.4
		l.Range = 9 + rank
		l.Parent = holder
		entry.Light = l
	end
	if rank >= 6 then
		-- Leuchtring: Neon-Scheibe, deren Mitte von Erde verdeckt wird
		local ringCf = base * CFrame.new(0, 0.03, 0) * CFrame.Angles(0, 0, math.rad(90))
		local ring = part("Part", { Name = "Leuchtring", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.06, 4.7, 4.7), CFrame = ringCf, Color = color, Material = Enum.Material.Neon, Transparency = 0.25 }, model)
		part("Part", { Name = "RingMitte", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.07, 4.1, 4.1), CFrame = ringCf, Color = Color3.fromRGB(96, 64, 40), Material = Enum.Material.Pebble }, model)
		entry.Ring = ring
	end
	entry.Rainbow = rarity.Rainbow
end

local function moveModel(model, offset)
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") then
			p.CFrame = offset * p.CFrame
		end
	end
end

function GardenBuilder.BedPosition(i, beds)
	local cols = GardenBuilder.Columns
	local rows = math.ceil(beds / cols)
	local row = math.floor((i - 1) / cols)
	local col = (i - 1) % cols
	local s = GardenBuilder.Spacing
	-- die Kamera schaut von vorne (−Z): +X liegt links, Reihe 1 vorne
	return Vector3.new(((cols - 1) / 2 - col) * s, 0, (row - (rows - 1) / 2) * s)
end

local function sign(parent, text, cf, size, bg, fg)
	local board = part("Part", { Name = "Schild", Size = size, CFrame = cf, Color = bg, Material = Enum.Material.WoodPlanks }, parent)
	local gui = Instance.new("SurfaceGui")
	gui.Face = Enum.NormalId.Front
	gui.CanvasSize = Vector2.new(size.X * 50, size.Y * 50)
	gui.Parent = board
	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.Size = UDim2.fromScale(1, 1)
	label.Font = Enum.Font.GothamBlack
	label.TextScaled = true
	label.TextColor3 = fg
	label.Text = text
	label.Parent = gui
	return board
end

function GardenBuilder.Build(garden)
	local anim = {}
	local beds = garden.Beds
	local cols = GardenBuilder.Columns
	local rows = math.max(1, math.ceil(beds / cols))
	local s = GardenBuilder.Spacing
	local width, depth = cols * s + 3, rows * s + 3
	local model = Instance.new("Model")
	model.Name = "Muenzbaumgarten"

	local wood = Color3.fromRGB(150, 104, 62)
	local ground = part("Part", { Name = "Wiese", Size = Vector3.new(width, 1, depth), CFrame = CFrame.new(0, -0.5, 0), Color = Color3.fromRGB(88, 150, 62), Material = Enum.Material.Grass }, model)
	model.PrimaryPart = ground
	-- Weg vom Tor
	part("Part", { Name = "Weg", Size = Vector3.new(2.6, 1, 4), CFrame = CFrame.new(0, -0.48, -depth / 2 - 1.5), Color = Color3.fromRGB(196, 170, 120), Material = Enum.Material.Sand }, model)

	-- Zaun rundherum im gewählten Stil (garden.Fence), vorne mit Tor in der Mitte. Eigenes Model „Zaun“,
	-- damit ein Wechsel animiert werden kann (garden.FenceFrom = vorheriger Zaun).
	local hx, hz, gate = width / 2, depth / 2, 1.6
	local function buildFence(fenceId, name)
		local f = Instance.new("Model")
		f.Name = name
		LootBuilder.FenceRun(f, fenceId, Vector3.new(-hx, 0, hz), Vector3.new(hx, 0, hz))
		LootBuilder.FenceRun(f, fenceId, Vector3.new(-hx, 0, -hz), Vector3.new(-hx, 0, hz))
		LootBuilder.FenceRun(f, fenceId, Vector3.new(hx, 0, -hz), Vector3.new(hx, 0, hz))
		LootBuilder.FenceRun(f, fenceId, Vector3.new(-hx, 0, -hz), Vector3.new(-gate, 0, -hz))
		LootBuilder.FenceRun(f, fenceId, Vector3.new(gate, 0, -hz), Vector3.new(hx, 0, -hz))
		for i, x in ipairs({ -gate, gate }) do
			LootBuilder.FencePost(f, fenceId, Vector3.new(x, 0, -hz), 3.2, i)
		end
		f.Parent = model
		return f
	end
	local fenceId = garden.Fence or "holzzaun"
	local fence = buildFence(fenceId, "Zaun")
	if garden.FenceFrom and garden.FenceFrom ~= fenceId then
		-- Wechsel: der alte Zaun versinkt, der neue wächst vom Tor aus rundherum aus dem Boden
		local old = buildFence(garden.FenceFrom, "AlterZaun")
		local function entries(f, delayed)
			local list = {}
			for _, p in ipairs(f:GetDescendants()) do
				if p:IsA("BasePart") then
					-- Abstand vom Tor rund um den Garten (0 am Tor, 1 hinten)
					local x, z = p.Position.X, -p.Position.Z
					local a = z ~= 0 and math.atan(x / z) or (x >= 0 and math.pi / 2 or -math.pi / 2)
					if z < 0 then a = a + (x >= 0 and math.pi or -math.pi) end
					local along = math.abs(a) / math.pi
					-- Effekte am Teil (Feuer, Funkeln, Licht): beim alten sofort aus, beim neuen erst, wenn er auftaucht
					local fx = {}
					for _, c in ipairs(p:GetChildren()) do
						if c:IsA("Fire") or c:IsA("Sparkles") or c:IsA("ParticleEmitter") or c:IsA("PointLight") then
							table.insert(fx, c)
							c.Enabled = false
						end
					end
					table.insert(list, { Part = p, CF = p.CFrame, T = p.Transparency, Delay = delayed and along * 1.4 or along * 0.5, Fx = fx })
					if delayed then
						p.CFrame = p.CFrame * CFrame.new(0, -2.4, 0)
						p.Transparency = 1
					end
				end
			end
			return list
		end
		local burst = part("Part", { Name = "ZaunFunken", Size = Vector3.new(0.2, 0.2, 0.2), Transparency = 1, CFrame = CFrame.new(0, 0.5, -hz) }, model)
		local sparks = Instance.new("ParticleEmitter")
		sparks.Texture = "rbxasset://textures/particles/sparkles_main.dds"
		local fc = GardenData.ById[fenceId] and GardenData.ById[fenceId].Color or Color3.new(1, 1, 1)
		sparks.Color = ColorSequence.new(fc, Color3.new(1, 1, 1))
		sparks.LightEmission = 1
		sparks.Lifetime = NumberRange.new(0.6, 1.2)
		sparks.Speed = NumberRange.new(4, 9)
		sparks.SpreadAngle = Vector2.new(70, 70)
		sparks.Size = NumberSequence.new(0.4, 0)
		sparks.Rate = 0
		sparks.Parent = burst
		fenceAnim[model] = { New = entries(fence, true), Old = entries(old, false), OldModel = old, Burst = sparks, Start = nil }
	end
	sign(model, "Münzbaumgarten", CFrame.new(0, 3.3, -hz), Vector3.new(4.4, 1, 0.2), wood, Color3.fromRGB(255, 222, 120))

	for i = 1, beds do
		local pos = GardenBuilder.BedPosition(i, beds)
		part("Part", { Name = "Beet" .. i, Size = Vector3.new(5, 0.4, 5), CFrame = CFrame.new(pos + Vector3.new(0, 0.2, 0)), Color = Color3.fromRGB(96, 64, 40), Material = Enum.Material.Pebble }, model)
		for _, e in ipairs({ { 0, -2.6, 5.4, 0.3 }, { 0, 2.6, 5.4, 0.3 }, { -2.6, 0, 0.3, 5.4 }, { 2.6, 0, 0.3, 5.4 } }) do
			part("Part", { Name = "Rahmen", Size = Vector3.new(e[3], 0.55, e[4]), CFrame = CFrame.new(pos + Vector3.new(e[1], 0.27, e[2])), Color = wood, Material = Enum.Material.WoodPlanks }, model)
		end
		sign(model, tostring(i), CFrame.new(pos + Vector3.new(2.1, 0.75, -2.75)), Vector3.new(0.7, 0.6, 0.12), Color3.fromRGB(240, 226, 196), Color3.fromRGB(70, 46, 28))
		local plot = garden.Plots and garden.Plots[i]
		if plot and plot.Tree then
			local tree = GardenData.ById[plot.Tree]
			local stage = plot.Stage or 1
			local progress = plot.Progress or (stage >= 3 and 1 or 0)
			local phase = stage >= 3 and 5 or math.min(4, GardenData.PhaseOf(progress))
			local t = LootBuilder.Tree(tree, stage, plot.Ripe or 0, true, { Phase = phase, Golden = plot.Golden })
			local base = CFrame.new(pos + Vector3.new(0, 0.4, 0))
			moveModel(t, base)
			t.Parent = model
			-- für die Animation merken
			local entry = { Place = rigTree(t, base), Base = base, Stage = stage, Look = phase, Progress = progress, Shown = growScale(phase, progress), Phase = i * 1.7, Fresh = plot.Fresh, Born = nil, Height = t:GetAttribute("Height") or 2 }
			entry.Place(base, entry.Shown)
			anim[i] = entry
			rarityFx(model, tree, base, entry.Height, entry)
			-- Nacht: Früchte (und bei Legendär+ die hellen Laubspitzen) leuchten, ein Licht in der Krone, Glühwürmchen
			do
				local rank = GardenData.RarityById[tree.Rarity].Index
				local glow = {}
				for _, p in ipairs(t:GetDescendants()) do
					if p:IsA("BasePart") and (p.Name == "Frucht" or (rank >= 4 and p:GetAttribute("Spitze"))) then
						table.insert(glow, { Part = p, Material = p.Material })
					end
				end
				local holder = part("Part", { Name = "Nacht", Size = Vector3.new(3.4, entry.Height * 0.7, 3.4), Transparency = 1, CFrame = base * CFrame.new(0, entry.Height * 0.6, 0) }, model)
				local light = Instance.new("PointLight")
				light.Color = rank >= 4 and GardenData.RarityById[tree.Rarity].Color or tree.Fruit
				light.Brightness = 0
				light.Range = 9 + rank
				light.Parent = holder
				local flies = Instance.new("ParticleEmitter")
				flies.Texture = "rbxasset://textures/particles/sparkles_main.dds"
				flies.Color = ColorSequence.new(Color3.fromRGB(220, 255, 120), Color3.fromRGB(255, 236, 140))
				flies.LightEmission = 1
				flies.Lifetime = NumberRange.new(3, 6)
				flies.Speed = NumberRange.new(0.2, 0.7)
				flies.SpreadAngle = Vector2.new(180, 180)
				flies.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.25, 0.2), NumberSequenceKeypoint.new(0.75, 0.16), NumberSequenceKeypoint.new(1, 0) })
				flies.Rate = 0
				flies.Parent = holder
				entry.Night = { Glow = glow, Light = light, Flies = flies, MaxRate = 1.5 + rank * 0.4, Power = 1 + rank * 0.18 + ((plot.Ripe or 0) > 0 and 0.6 or 0), Lit = false }
			end
			-- schillernde (goldene ???) Bäume: Laub läuft durch alle Farben
			if plot.Golden and GardenData.RarityById[tree.Rarity].Rainbow then
				entry.Shimmer = {}
				for _, p in ipairs(t:GetDescendants()) do
					if p:IsA("BasePart") and p:GetAttribute("Schillern") then table.insert(entry.Shimmer, p) end
				end
			end
			-- ab Jungbaum fallen ab und zu Blätter und treiben im Wind davon (der Ahorn im Herbst mehr)
			if phase >= 3 and tree.Crown ~= "crystal" and tree.Crown ~= "star" and tree.Crown ~= "planet" and tree.Crown ~= "rainbow" then
				local crownAt = part("Part", { Name = "Blattfall", Size = Vector3.new(3, 0.5, 3), Transparency = 1, CFrame = base * CFrame.new(0, entry.Height * 0.62, 0) }, model)
				local fall = Instance.new("ParticleEmitter")
				fall.Texture = "rbxasset://textures/particles/sparkles_main.dds"
				local lc = plot.Golden and Color3.fromRGB(255, 208, 64) or tree.Leaf
				fall.Color = ColorSequence.new(lc, lc:Lerp(Color3.fromRGB(150, 90, 40), 0.35))
				fall.LightEmission = 0.1
				fall.Lifetime = NumberRange.new(3, 5)
				fall.Speed = NumberRange.new(0.2, 0.6)
				fall.SpreadAngle = Vector2.new(180, 180)
				fall.Acceleration = Vector3.new(0.9, -1.1, 0.3)
				fall.RotSpeed = NumberRange.new(-120, 120)
				fall.Rotation = NumberRange.new(0, 360)
				fall.Size = NumberSequence.new(0.26, 0.18)
				fall.Rate = tree.Crown == "maple" and 1.6 or 0.5
				fall.Parent = crownAt
			end
			-- reif: Funkeln fällt aus der Krone und ein paar Früchte liegen schon im Beet
			if (plot.Ripe or 0) > 0 then
				local rain = part("Part", { Name = "Muenzregen", Size = Vector3.new(2.6, 0.2, 2.6), Transparency = 1, CFrame = base * CFrame.new(0, entry.Height * 0.6, 0) }, model)
				local drop = Instance.new("ParticleEmitter")
				drop.Texture = "rbxasset://textures/particles/sparkles_main.dds"
				drop.Color = ColorSequence.new(tree.Fruit, Color3.fromRGB(255, 240, 180))
				drop.LightEmission = 0.8
				drop.Lifetime = NumberRange.new(1, 1.5)
				drop.Speed = NumberRange.new(0, 0.6)
				drop.SpreadAngle = Vector2.new(20, 20)
				drop.Acceleration = Vector3.new(0, -9, 0)
				drop.Size = NumberSequence.new(0.34, 0.2)
				drop.Rate = 1.5 + plot.Ripe * 1.5
				drop.Parent = rain
				local rng = Random.new(i * 13)
				for c = 1, plot.Ripe * 2 do
					local a = rng:NextNumber(0, math.pi * 2)
					local r = rng:NextNumber(0.9, 1.9)
					part("Part", { Name = "Bodenfrucht", Shape = Enum.PartType.Ball, Size = Vector3.new(0.42, 0.42, 0.42), CFrame = base * CFrame.new(math.cos(a) * r, 0.2, math.sin(a) * r), Color = plot.Golden and Color3.fromRGB(255, 208, 64) or tree.Fruit, Material = Enum.Material.Neon }, model)
				end
			end
			local fx = part("Part", { Name = "Wachsen" .. i, Size = Vector3.new(0.2, 0.2, 0.2), Transparency = 1, CFrame = base * CFrame.new(0, 0.3, 0) }, model)
			if stage < 3 then
				-- Blättchen steigen auf, solange der Baum wächst
				local leaves = Instance.new("ParticleEmitter")
				leaves.Texture = "rbxasset://textures/particles/sparkles_main.dds"
				leaves.Color = ColorSequence.new(tree.Leaf, tree.Leaf:Lerp(Color3.new(1, 1, 1), 0.5))
				leaves.LightEmission = 0.5
				leaves.Lifetime = NumberRange.new(1.2, 2)
				leaves.Speed = NumberRange.new(0.8, 1.8)
				leaves.SpreadAngle = Vector2.new(30, 30)
				leaves.Size = NumberSequence.new(0.22, 0)
				leaves.Rate = 3
				leaves.Parent = fx
			end
			if plot.Fresh then
				-- neue Stufe erreicht: Funken
				local pop = Instance.new("ParticleEmitter")
				pop.Texture = "rbxasset://textures/particles/sparkles_main.dds"
				pop.Color = ColorSequence.new(tree.Fruit, Color3.new(1, 1, 1))
				pop.LightEmission = 1
				pop.Lifetime = NumberRange.new(0.5, 1)
				pop.Speed = NumberRange.new(4, 8)
				pop.SpreadAngle = Vector2.new(180, 180)
				pop.Drag = 3
				pop.Size = NumberSequence.new(0.35, 0)
				pop.Rate = 0
				pop.Parent = fx
				pop:Emit(stage >= 3 and 40 or 20)
			end
			-- Wachstums-Timer über dem Beet, solange der Baum wächst (Text setzt GardenBuilder.SetTimer)
			if (plot.Stage or 1) < 3 then
				local holder = part("Part", { Name = "Timer" .. i, Size = Vector3.new(0.2, 0.2, 0.2), Transparency = 1, CFrame = base * CFrame.new(0, entry.Height * entry.Shown + 1, 0) }, model)
				entry.Timer = holder
				local gui = Instance.new("BillboardGui")
				gui.Name = "Timer"
				gui.Size = UDim2.new(3.4, 0, 1.15, 0)
				gui.AlwaysOnTop = true
				gui.Parent = holder
				local bg = Instance.new("Frame")
				bg.Size = UDim2.fromScale(1, 1)
				bg.BackgroundColor3 = Color3.fromRGB(24, 21, 31)
				bg.BackgroundTransparency = 0.15
				bg.Parent = gui
				local corner = Instance.new("UICorner")
				corner.CornerRadius = UDim.new(0.3, 0)
				corner.Parent = bg
				local stroke = Instance.new("UIStroke")
				stroke.Color = GardenData.RarityById[tree.Rarity].Color
				stroke.Thickness = 2
				stroke.Parent = bg
				local text = Instance.new("TextLabel")
				text.Name = "Zeit"
				text.BackgroundTransparency = 1
				text.Size = UDim2.new(1, 0, 0.62, 0)
				text.Font = Enum.Font.GothamBlack
				text.TextScaled = true
				text.TextColor3 = Color3.new(1, 1, 1)
				text.Text = plot.Timer or ""
				text.Parent = bg
				local bar = Instance.new("Frame")
				bar.Name = "Balken"
				bar.Position = UDim2.new(0.08, 0, 0.7, 0)
				bar.Size = UDim2.new(0.84, 0, 0.16, 0)
				bar.BackgroundColor3 = Color3.fromRGB(60, 52, 74)
				bar.Parent = bg
				local fill = Instance.new("Frame")
				fill.Name = "Fuellung"
				fill.Size = UDim2.new(plot.Progress or 0, 0, 1, 0)
				fill.BackgroundColor3 = Color3.fromRGB(111, 191, 74)
				fill.Parent = bar
			end
		end
	end
	model:SetAttribute("Width", width)
	model:SetAttribute("Depth", depth)
	animated[model] = anim
	return model
end

-- Ganzen Garten an einen Ort setzen (cf * jetziger Ort); die Animation zieht mit
function GardenBuilder.Move(model, cf)
	moveModel(model, cf)
	local anim = animated[model]
	if anim then
		for _, e in pairs(anim) do
			e.Base = cf * e.Base
		end
	end
	local fa = fenceAnim[model]
	if fa then
		for _, list in ipairs({ fa.New, fa.Old }) do
			for _, e in ipairs(list) do
				e.CF = cf * e.CF
			end
		end
	end
end

-- Zaunwechsel abspielen: alter Zaun versinkt und verblasst, neuer wächst in einer Welle mit Überschwingen
local function animateFence(model, t)
	local fa = fenceAnim[model]
	if not fa then return end
	fa.Start = fa.Start or t
	local age = t - fa.Start
	if not fa.Burst.Parent then return end
	if not fa.Popped then
		fa.Popped = true
		fa.Burst:Emit(40)
	end
	for _, e in ipairs(fa.Old) do
		local k = math.clamp((age - e.Delay) / 0.45, 0, 1)
		e.Part.CFrame = e.CF * CFrame.new(0, -2.2 * k * k, 0)
		e.Part.Transparency = e.T + (1 - e.T) * k
	end
	local done = true
	for _, e in ipairs(fa.New) do
		local k = math.clamp((age - 0.35 - e.Delay) / 0.4, 0, 1)
		if k < 1 then done = false end
		local back = 1 + 2.7 * (k - 1) ^ 3 + 1.7 * (k - 1) ^ 2 -- Überschwingen wie Back-Out
		e.Part.CFrame = e.CF * CFrame.new(0, -2.4 * (1 - back), 0)
		if k > 0.6 and not e.Lit then
			e.Lit = true
			for _, c in ipairs(e.Fx) do c.Enabled = true end
		end
		e.Part.Transparency = e.T + (1 - e.T) * (1 - math.min(1, k * 2))
	end
	if done and age > 2.5 then
		for _, e in ipairs(fa.New) do
			e.Part.CFrame = e.CF
			e.Part.Transparency = e.T
			for _, c in ipairs(e.Fx) do c.Enabled = true end
		end
		if fa.OldModel.Parent then fa.OldModel:Destroy() end
		fenceAnim[model] = nil
	end
end

-- Fortschritt eines Beets (0–1) setzen; der Baum wächst in Animate sanft auf die neue Größe
function GardenBuilder.SetProgress(model, i, progress)
	local anim = animated[model]
	if anim and anim[i] then
		anim[i].Progress = progress
	end
end

-- Nachtlicht eines Baums setzen (night 0–1)
local function applyNight(e, night, t)
	local nt = e.Night
	if not nt then return end
	nt.Light.Brightness = night * nt.Power * (1 + math.sin(t * 1.5 + e.Phase) * 0.12)
	nt.Flies.Rate = night * nt.MaxRate
	local lit = night > 0.5
	if lit ~= nt.Lit then
		nt.Lit = lit
		for _, g in ipairs(nt.Glow) do
			g.Part.Material = lit and Enum.Material.Neon or g.Material
		end
	end
end

-- Nur Tag und Nacht anwenden, ohne Bewegung (für „weniger Bewegung“)
function GardenBuilder.UpdateNight(model)
	local anim = animated[model]
	if not anim then return end
	local night = nightFactor()
	for _, e in pairs(anim) do applyNight(e, night, 0) end
end

-- Jedes Bild aufrufen: Bäume wachsen sanft, wiegen sich, wachsende atmen; neue Stufen ploppen auf
function GardenBuilder.Animate(model, t, dt)
	animateFence(model, t)
	local anim = animated[model]
	if not anim then return end
	local night = nightFactor()
	for _, e in pairs(anim) do
		applyNight(e, night, t)
		local target = growScale(e.Look, e.Progress)
		e.Shown = e.Shown + (target - e.Shown) * math.min(1, (dt or 0.03) * 3)
		local k = e.Shown
		if e.Fresh then
			e.Born = e.Born or t
			local age = (t - e.Born) / 0.5
			if age < 1 then
				-- Überschwingen wie Back-Out, von 60 % auf 100 %
				local back = 1 + 2.7 * (age - 1) ^ 3 + 1.7 * (age - 1) ^ 2
				k = k * (0.6 + 0.4 * back)
			else
				e.Fresh = false
			end
		end
		local growing = e.Stage < 3
		local sway = growing and 1.5 or 1
		if growing then
			k = k * (1 + math.sin(t * 2.2 + e.Phase) * 0.02)
		end
		-- Wind: sanftes Wiegen, dazu ab und zu eine Böe, die über den Garten zieht
		local gust = math.max(0, math.sin(t * 0.35 + e.Base.Position.X * 0.08)) ^ 3
		local lean = gust * 0.06
		local rot = CFrame.Angles(math.sin(t * 1.3 + e.Phase) * 0.03 * sway, 0, math.cos(t * 1.1 + e.Phase) * 0.04 * sway - lean + math.sin(t * 6 + e.Phase) * 0.012 * gust)
		e.Place(e.Base * rot, k, t)
		if e.Shimmer then
			for n, p in ipairs(e.Shimmer) do
				p.Color = Color3.fromHSV((t * 0.2 + n * 0.07) % 1, 0.55, 1)
			end
		end
		-- ???: Ring, Lichtpunkte und Licht laufen durch alle Farben
		if e.Rainbow then
			local hue = Color3.fromHSV((t * 0.25 + e.Phase) % 1, 0.7, 1)
			if e.Ring then e.Ring.Color = hue end
			if e.Light then e.Light.Color = hue end
			if e.Fx and math.floor(t * 10) % 3 == 0 then
				for _, f in ipairs(e.Fx) do f.Color = ColorSequence.new(hue, Color3.new(1, 1, 1)) end
			end
		end
		if e.Timer then
			-- der Timer schwebt über der Spitze und wächst mit
			e.Timer.CFrame = e.Base * CFrame.new(0, e.Height * e.Shown + 1, 0)
		end
	end
end

-- Timer eines Beets setzen (Text wie "2 min 5 s", Fortschritt 0–1), ohne den Garten neu zu bauen
function GardenBuilder.SetTimer(model, i, text, progress)
	local holder = model:FindFirstChild("Timer" .. i)
	local gui = holder and holder:FindFirstChild("Timer")
	if not gui then return end
	local bg = gui:FindFirstChildOfClass("Frame")
	bg.Zeit.Text = "⏳ " .. text
	bg.Balken.Fuellung.Size = UDim2.new(math.clamp(progress, 0, 1), 0, 1, 0)
	GardenBuilder.SetProgress(model, i, progress)
end

return GardenBuilder
`;

// Server: Garten und Münzrollen. RemoteFunction GardenRemote, Spielstand im DataStore.
export const GARDEN_SERVER = `-- Coinmaster Adventure · Münzbaumgarten und Münzrollen (Server)
-- RemoteFunction GardenRemote: openRoll (Rollen-Id → ok, Text, Id der gewonnenen Sache) sowie die Garten-Aktionen aus GardenData.Act
-- (buyGarden, buyBed, plant, use, harvest, dig). Der Server prüft alles und würfelt selbst.
-- Der Garten steht als JSON im Attribut Garden am Spieler. Gespeichert wird er mit dem ganzen Spielstand
-- (ServerScriptService > CoinmasterServer > PlayerData); Aufträge gibt es erst, wenn der Spielstand geladen ist.
-- Moneten kommen aus leaderstats.Moneten (legt PlayerData an).
-- Robux-Rollen brauchen ein Developer Product: Id in ROLL_PRODUCTS eintragen.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local HttpService = game:GetService("HttpService")
local MarketplaceService = game:GetService("MarketplaceService")
local root = ReplicatedStorage:WaitForChild("CoinmasterAdventure")
local GardenData = require(root:WaitForChild("GardenData"))
local RollData = require(root:WaitForChild("RollData"))
local PlayerData = require(game:GetService("ServerScriptService"):WaitForChild("CoinmasterServer"):WaitForChild("PlayerData"))

-- Developer Products für Robux-Rollen: [ProductId] = "stern"
local ROLL_PRODUCTS = {}

local remote = root:FindFirstChild("GardenRemote")
if not remote then
	remote = Instance.new("RemoteFunction")
	remote.Name = "GardenRemote"
	remote.Parent = root
end
-- Server → Client: Robux-Rolle gekauft, Animation zeigen
local rollEvent = root:FindFirstChild("RollOpened")
if not rollEvent then
	rollEvent = Instance.new("RemoteEvent")
	rollEvent.Name = "RollOpened"
	rollEvent.Parent = root
end

local gardens = {} -- [player] = { Data = garden, Loaded = bool }
local lastCall = {}

local function talerOf(player)
	local stats = player:FindFirstChild("leaderstats")
	local taler = stats and stats:FindFirstChild("Moneten")
	if taler and (taler:IsA("IntValue") or taler:IsA("NumberValue")) then
		return taler
	end
	return nil
end

local function publish(player)
	local entry = gardens[player]
	if entry then
		player:SetAttribute("Garden", HttpService:JSONEncode(entry.Data))
	end
end

-- Garten aus dem geladenen Spielstand übernehmen
local function onJoin(player)
	gardens[player] = { Data = GardenData.New(), Loaded = false }
	if not PlayerData.WaitReady(player, 120) then return end
	local entry = gardens[player]
	if not entry then return end -- schon wieder weg
	local ok, saved = pcall(function()
		return HttpService:JSONDecode(player:GetAttribute("Garden") or "null")
	end)
	entry.Data = GardenData.Clean(ok and saved or nil)
	entry.Loaded = true
	publish(player)
end

Players.PlayerAdded:Connect(onJoin)
-- Admin Panel: Spielstand zurückgesetzt → neuer, leerer Garten
if PlayerData.Resetted then
	PlayerData.Resetted.Event:Connect(function(player)
		local entry = gardens[player]
		if entry then
			entry.Data = GardenData.New()
			publish(player)
		end
	end)
end
Players.PlayerRemoving:Connect(function(player)
	gardens[player] = nil
	lastCall[player] = nil
end)
for _, p in ipairs(Players:GetPlayers()) do
	task.spawn(onJoin, p)
end

-- Rolle öffnen: eine Sache würfeln und ins Inventar legen; gibt ihre Id und die Sache zurück
local function openRoll(player, entry, roll)
	local item = RollData.Open(roll.Id)
	entry.Data.Inv[item.Id] = (entry.Data.Inv[item.Id] or 0) + 1
	publish(player)
	return item.Id, item
end

remote.OnServerInvoke = function(player, action, a, b)
	local clock = os.clock()
	if lastCall[player] and clock - lastCall[player] < 0.2 then
		return false, "Zu schnell"
	end
	lastCall[player] = clock
	if type(action) ~= "string" or (a ~= nil and (type(a) ~= "string" or #a > 64)) or (b ~= nil and (type(b) ~= "string" or #b > 64)) then
		return false, "Ungültig"
	end
	local entry = gardens[player]
	if not entry or not entry.Loaded then
		return false, "Dein Spielstand lädt noch"
	end
	local taler = talerOf(player)
	if not taler then
		return false, "Keine Moneten gefunden (leaderstats.Moneten fehlt)"
	end
	if action == "openRoll" then
		local roll = RollData.ById[a or ""]
		if not roll or not roll.Price then return false, "Diese Rolle gibt es nicht" end
		if roll.Price.Currency ~= "Coins" then
			for productId, rollId in pairs(ROLL_PRODUCTS) do
				if rollId == roll.Id then
					MarketplaceService:PromptProductPurchase(player, productId)
					return false, "Kauf in Roblox bestätigen"
				end
			end
			return false, "Robux-Rollen brauchen ein Developer Product"
		end
		if taler.Value < roll.Price.Amount then return false, "Zu wenig Moneten" end
		taler.Value = taler.Value - roll.Price.Amount
		local id, item = openRoll(player, entry, roll)
		return true, roll.Name .. ": " .. GardenData.LootName(item) .. "!", id
	end
	local ok, text, delta = GardenData.Act(entry.Data, action, a, b, os.time(), taler.Value)
	if ok then
		if delta ~= 0 then
			taler.Value = taler.Value + delta
		end
		publish(player)
	end
	return ok, text
end

-- Robux-Rollen. Achtung: ProcessReceipt darf im ganzen Spiel nur ein Skript setzen. Darum wird es
-- nur gesetzt, wenn oben Produkte eingetragen sind. Jeder Kauf wird mit seiner PurchaseId gemerkt,
-- damit er auch bei einer Wiederholung durch Roblox nur einmal zählt.
if next(ROLL_PRODUCTS) then
	MarketplaceService.ProcessReceipt = function(receipt)
		local rollId = ROLL_PRODUCTS[receipt.ProductId]
		local player = Players:GetPlayerByUserId(receipt.PlayerId)
		local entry = player and gardens[player]
		if not rollId or not entry or not entry.Loaded then
			return Enum.ProductPurchaseDecision.NotProcessedYet
		end
		local receipts = entry.Data.Receipts
		if not table.find(receipts, receipt.PurchaseId) then
			table.insert(receipts, receipt.PurchaseId)
			while #receipts > 50 do
				table.remove(receipts, 1)
			end
			local id = openRoll(player, entry, RollData.ById[rollId])
			rollEvent:FireClient(player, rollId, id)
		end
		-- erst bestätigen, wenn der Spielstand mit dem Kauf gespeichert ist
		if not PlayerData.Save(player) then
			return Enum.ProductPurchaseDecision.NotProcessedYet
		end
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end
end
`;

// Client: baut den eigenen Garten in die Welt und zeigt Robux-Rollen
export const GARDEN_CLIENT = `-- Coinmaster Adventure · Münzbaumgarten (Client)
-- Baut den Garten des Spielers aus dem Attribut Garden mit GardenBuilder (nur für ihn sichtbar).
-- Platz: ein Part „GartenPlatz“ im Workspace (seine Oberseite ist der Boden), sonst neben dem Spawn.
-- Wachsen und Reifen werden jede Sekunde geprüft; neu gebaut wird nur, wenn sich etwas ändert (neue Phase, reif, geerntet).
-- Über wachsenden Bäumen zählt ein Timer die Zeit bis „ausgewachsen“ herunter. Die Bäume wachsen animiert
-- (GardenBuilder.Animate jedes Bild), eine neue Stufe ploppt mit Funken auf.
-- „Zum Garten“ im Garten-Fenster teleportiert hierher (UIAction gartenBesuchen).

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")
local root = ReplicatedStorage:WaitForChild("CoinmasterAdventure")
local GardenData = require(root:WaitForChild("GardenData"))
local GardenBuilder = require(root:WaitForChild("GardenBuilder"))
local player = Players.LocalPlayer

local function place()
	local spot = workspace:FindFirstChild("GartenPlatz", true)
	if spot and spot:IsA("BasePart") then
		return spot.CFrame * CFrame.new(0, spot.Size.Y / 2, 0)
	end
	return CFrame.new(0, 0, -160)
end

local model, signature = nil, ""
local lastStage = {} -- Stufe je Beet beim letzten Bau (für das Aufploppen bei neuer Stufe)
local lastFence = nil -- Zaun beim letzten Bau (für die Wechsel-Animation)
local function update()
	local ok, g = pcall(function()
		return HttpService:JSONDecode(player:GetAttribute("Garden") or "null")
	end)
	g = GardenData.Clean(ok and g or nil)
	if not g.Owned then
		if model then model:Destroy() model = nil signature = "" end
		return
	end
	local now = os.time()
	local plots, parts = {}, { tostring(g.Beds), g.Fence }
	for i = 1, g.Beds do
		local p = g.Plots[tostring(i)]
		if p then
			local tree = GardenData.ById[p.Tree]
			local progress = 1 - GardenData.GrowLeft(p, now) / tree.Grow
			plots[i] = { Tree = p.Tree, Stage = GardenData.Stage(p, now), Ripe = GardenData.Ripe(p, now), Progress = progress, Golden = p.Golden, Look = GardenData.PhaseOf(progress) }
			table.insert(parts, p.Tree .. plots[i].Look .. plots[i].Ripe .. (p.Golden and "g" or ""))
		else
			plots[i] = false
			table.insert(parts, "-")
		end
	end
	local sig = table.concat(parts, ",")
	if sig ~= signature or not model then
		local first = model == nil
		signature = sig
		for i = 1, g.Beds do
			local key = plots[i] and (plots[i].Tree .. plots[i].Look) or "-"
			if plots[i] and not first and lastStage[i] ~= key then
				plots[i].Fresh = true -- neue Stufe: aufploppen
			end
			lastStage[i] = key
		end
		if model then model:Destroy() end
		-- neuer Zaun: alter versinkt, neuer wächst aus dem Boden
		local fenceFrom = (not first and lastFence and lastFence ~= g.Fence) and lastFence or nil
		lastFence = g.Fence
		model = GardenBuilder.Build({ Beds = g.Beds, Plots = plots, Fence = g.Fence, FenceFrom = fenceFrom })
		model.Name = "MeinGarten"
		GardenBuilder.Move(model, place())
		model.Parent = workspace
	end
	-- Timer über wachsenden Bäumen jede Sekunde weiterzählen
	for i = 1, g.Beds do
		local p = g.Plots[tostring(i)]
		if p and plots[i] and plots[i].Stage < 3 then
			local tree = GardenData.ById[p.Tree]
			local left = GardenData.GrowLeft(p, now)
			GardenBuilder.SetTimer(model, i, GardenData.FormatTime(left), 1 - left / tree.Grow)
		end
	end
end

player:GetAttributeChangedSignal("Garden"):Connect(update)
-- jedes Bild: Bäume wachsen sanft und wiegen sich
RunService.Heartbeat:Connect(function(dt)
	if model then
		GardenBuilder.Animate(model, os.clock(), dt)
	end
end)
task.spawn(function()
	while true do
		update()
		task.wait(1)
	end
end)

-- Teleport vor das Gartentor
local action = root:WaitForChild("UIAction", 10)
if action then
	action.Event:Connect(function(name)
		if name ~= "gartenBesuchen" then return end
		local character = player.Character
		if not character then return end
		local depth = (model and model:GetAttribute("Depth")) or 10
		character:PivotTo(place() * CFrame.new(0, 4, -depth / 2 - 6) * CFrame.Angles(0, math.pi, 0))
	end)
end

-- Robux-Rolle gekauft: Animation zeigen
local rollEvent = root:WaitForChild("RollOpened", 10)
if rollEvent then
	local GameUI = require(root:WaitForChild("GameUI"))
	rollEvent.OnClientEvent:Connect(function(rollId, itemId)
		GameUI.PlayRoll(rollId, itemId)
	end)
end
`;
