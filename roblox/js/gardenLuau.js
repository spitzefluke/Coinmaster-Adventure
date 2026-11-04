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

const KIND = { water: 'Water', boost: 'Boost', taler: 'Taler', bed: 'Bed' };

export function gardenDataSource({ GARDEN_RARITIES, TREES, TOOLS, GARDEN }) {
  const rarities = GARDEN_RARITIES.map((r, i) => fields({ Id: str(r.id), Name: str(r.name), Index: num(i + 1), Chance: num(r.chance), Color: color(r.color) }));
  const trees = TREES.map((t) =>
    fields({
      Id: str(t.id),
      Type: str('Tree'),
      Name: str(t.name),
      Rarity: str(t.rarity),
      Grow: num(t.grow),
      Cycle: num(t.cycle),
      Yield: num(t.yield),
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
  return `${HEADER('Münzbaumgarten')}
-- Den Garten kauft man mit Talern (Garden.Price). Bäume und Werkzeug gibt es aus Münzrollen (RollData).
-- Ein Beet (Plot) im Spielstand: { Tree = id, Planted = os.time(), Bonus = 0, Harvested = 0, Boost = 1, BoostEnd = 0 }
--   Bonus     Sekunden, die der Baum durch Gießen schon gewachsen ist
--   Harvested Zeit der letzten Ernte, Boost/BoostEnd Dünger
-- Werkzeug (Kind): Water = Seconds schneller wachsen (math.huge: sofort fertig), Boost = Mult × Ernte
-- für Seconds, Taler = Amount Taler, Bed = ein Beet mehr.
-- Wichtig: Ernten und Benutzen nur auf dem Server rechnen.

local GardenData = {}

GardenData.Rarities = ${list(rarities)}

GardenData.Trees = ${list(trees)}

GardenData.Tools = ${list(tools)}

GardenData.Garden = { Price = ${num(GARDEN.price)}, StartBeds = ${num(GARDEN.startBeds)}, MaxBeds = ${num(GARDEN.maxBeds)}, MaxRipe = ${num(GARDEN.maxRipe)} }

-- Preis für das nächste Beet, wenn man schon beds Beete hat
function GardenData.BedPrice(beds)
	return 15000 * 2 ^ (beds - 4)
end

GardenData.RarityById = {}
for _, r in ipairs(GardenData.Rarities) do
	GardenData.RarityById[r.Id] = r
end
GardenData.Loot = {}
GardenData.ById = {}
for _, group in ipairs({ GardenData.Trees, GardenData.Tools }) do
	for _, item in ipairs(group) do
		table.insert(GardenData.Loot, item)
		GardenData.ById[item.Id] = item
	end
end

-- 0 leer, 1 Setzling, 2 Jungbaum, 3 ausgewachsen
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

-- Wie viele Ernten am Baum hängen (höchstens Garden.MaxRipe)
function GardenData.Ripe(plot, now)
	if GardenData.Stage(plot, now) < 3 then
		return 0
	end
	local tree = GardenData.ById[plot.Tree]
	local since = math.max(GardenData.GrownAt(plot), plot.Harvested or 0)
	return math.min(GardenData.Garden.MaxRipe, math.floor((now - since) / tree.Cycle))
end

function GardenData.HarvestValue(plot, now)
	local mult = (plot.BoostEnd or 0) > now and plot.Boost or 1
	return GardenData.Ripe(plot, now) * GardenData.ById[plot.Tree].Yield * mult
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
-- LootBuilder.Tree(tree, stage, ripe) baut einen Münzbaum (Stufe 1 Setzling, 2 Jungbaum, 3 ausgewachsen;
-- ripe = Ernten am Baum). LootBuilder.Tool(tool) baut Gartenwerkzeug. LootBuilder.Build(item) baut,
-- was aus einer Münzrolle kommt (Bäume ausgewachsen). Der Ursprung liegt am Boden in der Mitte,
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

local function trunk(m, t, h, w, bend)
	if bend then
		-- Palme: gebogener Stamm aus Stücken
		local pos = Vector3.new(0, 0, 0)
		for i = 1, 5 do
			local x = 0.9 * (i / 5) ^ 2
			local y = h * i / 5
			local mid = Vector3.new((pos.X + x) / 2, (pos.Y + y) / 2, 0)
			local len = (Vector3.new(x, y, 0) - pos).Magnitude
			local angle = math.atan((x - pos.X) / (y - pos.Y))
			part("Part", { Name = i == 5 and "Stamm" or "StammTeil", Shape = Enum.PartType.Cylinder, Size = Vector3.new(len + 0.1, w * (1 - i * 0.08), w * (1 - i * 0.08)), CFrame = CFrame.new(mid) * CFrame.Angles(0, 0, -angle) * UP, Color = i % 2 == 0 and t.Trunk or t.Trunk:Lerp(Color3.new(0, 0, 0), 0.2), Material = Enum.Material.Wood }, m)
			pos = Vector3.new(x, y, 0)
		end
		return
	end
	part("Part", { Name = "Stamm", Shape = Enum.PartType.Cylinder, Size = Vector3.new(h, w, w), CFrame = CFrame.new(0, h / 2, 0) * UP, Color = t.Trunk, Material = Enum.Material.Wood }, m)
	-- Wurzeln
	for i = 0, 2 do
		local a = math.rad(i * 120 + 30)
		part("Part", { Name = "Wurzel", Size = Vector3.new(w * 0.9, 0.3, w * 0.45), CFrame = CFrame.new(math.cos(a) * w * 0.6, 0.12, math.sin(a) * w * 0.6) * CFrame.Angles(0, -a, 0), Color = t.Trunk, Material = Enum.Material.Wood }, m)
	end
end

function LootBuilder.Tree(tree, stage, ripe)
	stage = stage or 3
	ripe = ripe or 0
	local model = Instance.new("Model")
	model.Name = tree.Name
	local leaf = Enum.Material[tree.Look] or Enum.Material.Grass
	if stage <= 1 then
		-- Setzling: dünner Stiel mit zwei Blättern
		part("Part", { Name = "Stamm", Shape = Enum.PartType.Cylinder, Size = Vector3.new(1, 0.2, 0.2), CFrame = CFrame.new(0, 0.5, 0) * UP, Color = tree.Trunk, Material = Enum.Material.Wood }, model)
		for _, x in ipairs({ -0.3, 0.3 }) do
			local b = ball(model, "Blatt", 0.6, Vector3.new(x, 1.05, 0), tree.Leaf, leaf)
			b.Size = Vector3.new(0.7, 0.3, 0.45)
		end
		ball(model, "Knospe", 0.35, Vector3.new(0, 1.2, 0), tree.Fruit, Enum.Material.Metal)
		measure(model)
		model:SetAttribute("TreeId", tree.Id)
		return model
	end
	local h = ({ bush = 1.3, cone = 2.2, palm = 4.8 })[tree.Crown] or (tree.Big and 3.6 or 3.2)
	local w = tree.Big and 1.05 or (tree.Crown == "bush" and 0.5 or 0.75)
	trunk(model, tree, h, w, tree.Crown == "palm")
	local center, radius, low = (CROWNS[tree.Crown] or CROWNS.round)(model, tree, leaf, h)

	if stage >= 3 then
		-- Münzen als Früchte: mehr, je mehr Ernten warten; reif leuchten sie
		local count = 8 + ripe * 3
		local fruit = tree.Look == "Neon" and Enum.Material.Neon or Enum.Material.Metal
		for i = 1, count do
			local a = i * 2.39996 -- goldener Winkel
			local y = -0.4 + ((i * 0.618) % 1) * 1.2 - (low or 0) * 0.3
			local pos = center + Vector3.new(math.cos(a) * (radius + 0.05), y, math.sin(a) * (radius + 0.05))
			part("Part", { Name = "Muenze", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.14, 0.72, 0.72), CFrame = CFrame.new(pos) * CFrame.Angles(0, -a, 0), Color = tree.Fruit, Material = fruit, Reflectance = 0.1 }, model)
		end
		if ripe > 0 then
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
	if stage == 2 then
		scaleModel(model, 0.55)
	end
	measure(model)
	model:SetAttribute("TreeId", tree.Id)
	return model
end

local TOOLS = {}
function TOOLS.can(m, t)
	local metal = t.Rainbow and Enum.Material.SmoothPlastic or Enum.Material.Metal
	part("Part", { Name = "Body", Shape = Enum.PartType.Cylinder, Size = Vector3.new(1.5, 1.4, 1.4), CFrame = CFrame.new(0, 0.75, 0) * UP, Color = t.Color, Material = metal }, m)
	part("Part", { Name = "Rand", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.12, 1.5, 1.5), CFrame = CFrame.new(0, 1.5, 0) * UP, Color = t.Color:Lerp(Color3.new(1, 1, 1), 0.3), Material = metal }, m)
	local tilt = CFrame.Angles(0, 0, math.rad(-35))
	part("Part", { Name = "Tuelle", Shape = Enum.PartType.Cylinder, Size = Vector3.new(1.9, 0.24, 0.24), CFrame = CFrame.new(-1.15, 1.15, 0) * tilt, Color = t.Color, Material = metal }, m)
	part("Part", { Name = "Brause", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.22, 0.5, 0.5), CFrame = CFrame.new(-1.95, 1.72, 0) * tilt, Color = t.Color:Lerp(Color3.new(0, 0, 0), 0.15), Material = metal }, m)
	part("Part", { Name = "Griff", Size = Vector3.new(1.1, 0.18, 0.26), CFrame = CFrame.new(0.2, 2.05, 0), Color = t.Color, Material = metal }, m)
	part("Part", { Name = "Griff", Size = Vector3.new(0.18, 0.75, 0.26), CFrame = CFrame.new(0.72, 1.7, 0), Color = t.Color, Material = metal }, m)
	part("Part", { Name = "Griff", Size = Vector3.new(0.18, 0.5, 0.26), CFrame = CFrame.new(-0.32, 1.8, 0), Color = t.Color, Material = metal }, m)
	if t.Rainbow then
		for i = 0, 4 do
			part("Part", { Name = "Streifen", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.22, 1.43, 1.43), CFrame = CFrame.new(0, 0.25 + i * 0.27, 0) * UP, Color = Color3.fromHSV(i / 5, 0.7, 1), Material = Enum.Material.Neon }, m)
		end
		local s = Instance.new("Sparkles")
		s.SparkleColor = Color3.fromRGB(255, 255, 255)
		s.Parent = m:FindFirstChild("Body")
	end
	-- ein Tropfen an der Brause
	ball(m, "Tropfen", 0.22, Vector3.new(-2.1, 1.4, 0), Color3.fromRGB(120, 200, 255), Enum.Material.Glass, 0.2)
	return m:FindFirstChild("Body")
end
function TOOLS.sack(m, t)
	local body = part("Part", { Name = "Body", Size = Vector3.new(1.4, 1.7, 0.95), CFrame = CFrame.new(0, 0.85, 0), Color = t.Color, Material = Enum.Material.Fabric }, m)
	part("Part", { Name = "Etikett", Size = Vector3.new(1.42, 0.55, 0.97), CFrame = CFrame.new(0, 0.95, 0), Color = t.Color:Lerp(Color3.new(1, 1, 1), 0.55), Material = Enum.Material.SmoothPlastic }, m)
	part("Part", { Name = "Hals", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.35, 0.6, 0.6), CFrame = CFrame.new(0, 1.85, 0) * UP, Color = t.Color, Material = Enum.Material.Fabric }, m)
	ball(m, "Zipfel", 0.75, Vector3.new(0, 2.15, 0), t.Color, Enum.Material.Fabric)
	-- Blatt-Symbol vorne
	local leaf = ball(m, "Symbol", 0.4, Vector3.new(0, 0.95, -0.5), Color3.fromRGB(90, 190, 80), t.Id == "zauberduenger" and Enum.Material.Neon or Enum.Material.SmoothPlastic)
	leaf.Size = Vector3.new(0.5, 0.32, 0.12)
	if t.Id == "zauberduenger" then
		local s = Instance.new("Sparkles")
		s.SparkleColor = Color3.fromRGB(220, 160, 255)
		s.Parent = body
	end
	return body
end
function TOOLS.bag(m, t)
	local body = ball(m, "Body", 1.8, Vector3.new(0, 0.9, 0), t.Color, Enum.Material.Fabric)
	part("Part", { Name = "Hals", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.5, 0.6, 0.6), CFrame = CFrame.new(0, 1.85, 0) * UP, Color = t.Color, Material = Enum.Material.Fabric }, m)
	part("Part", { Name = "Band", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.14, 0.68, 0.68), CFrame = CFrame.new(0, 1.75, 0) * UP, Color = Color3.fromRGB(190, 40, 40), Material = Enum.Material.SmoothPlastic }, m)
	for i, p in ipairs({ Vector3.new(-0.3, 0.9, -0.88), Vector3.new(0.35, 0.6, -0.86), Vector3.new(1.2, 0.12, -0.4) }) do
		part("Part", { Name = "Taler", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.12, 0.6, 0.6), CFrame = CFrame.new(p) * (i == 3 and UP or FRONT), Color = Color3.fromRGB(255, 205, 80), Material = Enum.Material.Metal }, m)
	end
	return body
end
function TOOLS.spade(m, t)
	part("Part", { Name = "Stiel", Shape = Enum.PartType.Cylinder, Size = Vector3.new(2.4, 0.2, 0.2), CFrame = CFrame.new(0, 2.15, 0) * UP, Color = Color3.fromRGB(120, 80, 45), Material = Enum.Material.Wood }, m)
	part("Part", { Name = "Griff", Size = Vector3.new(0.8, 0.2, 0.2), CFrame = CFrame.new(0, 3.35, 0), Color = t.Color, Material = Enum.Material.Foil }, m)
	local body = part("Part", { Name = "Body", Size = Vector3.new(0.95, 1.2, 0.12), CFrame = CFrame.new(0, 0.6, 0), Color = t.Color, Material = Enum.Material.Foil }, m)
	part("Part", { Name = "Kante", Size = Vector3.new(0.6, 0.25, 0.14), CFrame = CFrame.new(0, 1.25, 0), Color = t.Color:Lerp(Color3.new(0, 0, 0), 0.2), Material = Enum.Material.Foil }, m)
	local s = Instance.new("Sparkles")
	s.SparkleColor = t.Color
	s.Parent = body
	return body
end
function TOOLS.chest(m, t)
	local wood = Color3.fromRGB(120, 72, 38)
	local body = part("Part", { Name = "Body", Size = Vector3.new(2, 1, 1.3), CFrame = CFrame.new(0, 0.5, 0), Color = wood, Material = Enum.Material.WoodPlanks }, m)
	part("Part", { Name = "Deckel", Size = Vector3.new(2.04, 0.35, 1.34), CFrame = CFrame.new(0, 1.25, 0.25) * CFrame.Angles(math.rad(-25), 0, 0), Color = wood, Material = Enum.Material.WoodPlanks }, m)
	for _, x in ipairs({ -0.7, 0.7 }) do
		part("Part", { Name = "Beschlag", Size = Vector3.new(0.16, 1.02, 1.34), CFrame = CFrame.new(x, 0.5, 0), Color = t.Color, Material = Enum.Material.Foil }, m)
	end
	part("Part", { Name = "Schloss", Size = Vector3.new(0.3, 0.35, 0.1), CFrame = CFrame.new(0, 0.85, -0.68), Color = t.Color, Material = Enum.Material.Foil }, m)
	for i = 0, 8 do
		local a = i * 2.4
		part("Part", { Name = "Taler", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.12, 0.5, 0.5), CFrame = CFrame.new(math.cos(a) * 0.55, 1.05 + (i % 3) * 0.08, math.sin(a) * 0.35) * UP * CFrame.Angles(0, 0, 0.2 * (i % 2)), Color = t.Color, Material = Enum.Material.Neon }, m)
	end
	local l = Instance.new("PointLight")
	l.Color = t.Color
	l.Brightness = 3
	l.Range = 8
	l.Parent = body
	local s = Instance.new("Sparkles")
	s.SparkleColor = t.Color
	s.Parent = body
	return body
end

function LootBuilder.Tool(tool)
	local model = Instance.new("Model")
	model.Name = tool.Name
	local body = (TOOLS[tool.Model] or TOOLS.bag)(model, tool)
	model.PrimaryPart = body
	measure(model)
	model:SetAttribute("ToolId", tool.Id)
	return model
end

-- Was aus einer Münzrolle kommt
function LootBuilder.Build(item)
	if item.Type == "Tree" then
		return LootBuilder.Tree(item, 3, 0)
	end
	return LootBuilder.Tool(item)
end

return LootBuilder
`;

export const GARDEN_BUILDER = `${HEADER('Münzbaumgarten bauen')}
-- GardenBuilder.Build(garden) baut den Garten als Model: Wiese mit Zaun, Tor und Schild, darauf die Beete
-- in Reihen zu je 4. garden = { Beds = Anzahl, Plots = { [i] = { Tree = id, Stage = 1–3, Ripe = n } oder false } }
-- (Stage und Ripe aus GardenData.Stage/Ripe). Beet 1 liegt vorne links (von der Kamera vor dem Tor aus).
-- GardenBuilder.BedPosition(i, beds) gibt die Mitte eines Beets zurück.

local GardenData = require(script.Parent.GardenData)
local LootBuilder = require(script.Parent.LootBuilder)

local GardenBuilder = {}

GardenBuilder.Columns = 4
GardenBuilder.Spacing = 7

${PART}
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

	-- Zaun rundherum, vorne mit Tor in der Mitte
	local function rail(a, b)
		local mid = (a + b) / 2
		local len = (b - a).Magnitude
		local horizontal = math.abs(b.X - a.X) > 0.01
		for _, y in ipairs({ 0.55, 1.15 }) do
			part("Part", { Name = "Latte", Size = horizontal and Vector3.new(len, 0.18, 0.14) or Vector3.new(0.14, 0.18, len), CFrame = CFrame.new(mid.X, y, mid.Z), Color = wood, Material = Enum.Material.Wood }, model)
		end
		local n = math.max(1, math.floor(len / 3))
		for i = 0, n do
			local p = a:Lerp(b, i / n)
			part("Part", { Name = "Pfosten", Size = Vector3.new(0.32, 1.6, 0.32), CFrame = CFrame.new(p.X, 0.8, p.Z), Color = wood:Lerp(Color3.new(0, 0, 0), 0.15), Material = Enum.Material.Wood }, model)
		end
	end
	local hx, hz, gate = width / 2, depth / 2, 1.6
	rail(Vector3.new(-hx, 0, hz), Vector3.new(hx, 0, hz))
	rail(Vector3.new(-hx, 0, -hz), Vector3.new(-hx, 0, hz))
	rail(Vector3.new(hx, 0, -hz), Vector3.new(hx, 0, hz))
	rail(Vector3.new(-hx, 0, -hz), Vector3.new(-gate, 0, -hz))
	rail(Vector3.new(gate, 0, -hz), Vector3.new(hx, 0, -hz))
	for _, x in ipairs({ -gate, gate }) do
		part("Part", { Name = "Torpfosten", Size = Vector3.new(0.45, 3.2, 0.45), CFrame = CFrame.new(x, 1.6, -hz), Color = wood, Material = Enum.Material.Wood }, model)
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
			local t = LootBuilder.Tree(tree, plot.Stage or 1, plot.Ripe or 0)
			moveModel(t, CFrame.new(pos + Vector3.new(0, 0.4, 0)))
			t.Parent = model
		end
	end
	model:SetAttribute("Width", width)
	model:SetAttribute("Depth", depth)
	return model
end

return GardenBuilder
`;
