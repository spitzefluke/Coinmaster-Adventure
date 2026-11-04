// Roblox-API in Lua für die Vorschau. Läuft in fengari (Lua 5.3) und spricht über wenige
// JS-Funktionen (__js_*) mit der Engine. Gleiche Namen und Regeln wie in Roblox, damit der
// Luau-Code aus dem Installer hier unverändert läuft.
export const RUNTIME_LUA = String.raw`
local JS_new, JS_set, JS_get, JS_parent, JS_call, JS_bulk, JS_print = __js_new, __js_set, __js_get, __js_parent, __js_call, __js_bulk, __js_print
local floor, sqrt, sin, cos, abs, atan2 = math.floor, math.sqrt, math.sin, math.cos, math.abs, math.atan
local unpack = table.unpack

-- ── Kleinkram, den Luau zusätzlich kennt ──
function math.clamp(x, a, b) if x < a then return a elseif x > b then return b end return x end
function math.round(x) return floor(x + 0.5) end
function math.sign(x) if x > 0 then return 1 elseif x < 0 then return -1 end return 0 end
function math.noise(x, y, z) return (sin((x or 0) * 12.9898 + (y or 0) * 78.233 + (z or 0) * 37.719) * 0.5) end
function table.find(t, v) for i, x in ipairs(t) do if x == v then return i end end return nil end
function table.clear(t) for k in pairs(t) do t[k] = nil end end
function table.clone(t) local c = {} for k, v in pairs(t) do c[k] = v end return c end
function string.split(s, sep)
	local out, pat = {}, "([^" .. (sep or ","):gsub("%p", "%%%0") .. "]*)"
	for part in (s .. (sep or ",")):gmatch(pat .. (sep or ","):gsub("%p", "%%%0")) do table.insert(out, part) end
	return out
end
local clockStart = 0
__now = 0
os.clock = function() return __now end
function tick() return __now end
function time() return __now end
function print(...) local t = {} for i = 1, select("#", ...) do t[i] = tostring((select(i, ...))) end JS_print(table.concat(t, " ")) end
function warn(...) print("Warnung:", ...) end

local TYPES = setmetatable({}, { __mode = "k" })
function typeof(v)
	local t = type(v)
	if t == "table" then
		local mt = getmetatable(v)
		if mt and mt.__type then return mt.__type end
	end
	if t == "userdata" then return "userdata" end
	return t
end

-- ── Vector3 ──
local V3 = { __type = "Vector3" }
V3.__index = function(v, k)
	if k == "Magnitude" then return sqrt(v.X * v.X + v.Y * v.Y + v.Z * v.Z) end
	if k == "Unit" then local m = sqrt(v.X * v.X + v.Y * v.Y + v.Z * v.Z) if m == 0 then return v end return Vector3.new(v.X / m, v.Y / m, v.Z / m) end
	if k == "x" then return v.X elseif k == "y" then return v.Y elseif k == "z" then return v.Z end
	return V3[k]
end
local function v3(x, y, z) return setmetatable({ X = x or 0, Y = y or 0, Z = z or 0 }, V3) end
V3.__add = function(a, b) return v3(a.X + b.X, a.Y + b.Y, a.Z + b.Z) end
V3.__sub = function(a, b) return v3(a.X - b.X, a.Y - b.Y, a.Z - b.Z) end
V3.__mul = function(a, b)
	if type(a) == "number" then return v3(b.X * a, b.Y * a, b.Z * a) end
	if type(b) == "number" then return v3(a.X * b, a.Y * b, a.Z * b) end
	return v3(a.X * b.X, a.Y * b.Y, a.Z * b.Z)
end
V3.__div = function(a, b)
	if type(b) == "number" then return v3(a.X / b, a.Y / b, a.Z / b) end
	return v3(a.X / b.X, a.Y / b.Y, a.Z / b.Z)
end
V3.__unm = function(a) return v3(-a.X, -a.Y, -a.Z) end
V3.__eq = function(a, b) return a.X == b.X and a.Y == b.Y and a.Z == b.Z end
V3.__tostring = function(v) return ("%g, %g, %g"):format(v.X, v.Y, v.Z) end
function V3.Lerp(a, b, t) return v3(a.X + (b.X - a.X) * t, a.Y + (b.Y - a.Y) * t, a.Z + (b.Z - a.Z) * t) end
function V3.Dot(a, b) return a.X * b.X + a.Y * b.Y + a.Z * b.Z end
function V3.Cross(a, b) return v3(a.Y * b.Z - a.Z * b.Y, a.Z * b.X - a.X * b.Z, a.X * b.Y - a.Y * b.X) end
function V3.Abs(a) return v3(abs(a.X), abs(a.Y), abs(a.Z)) end
function V3.Max(a, b) return v3(math.max(a.X, b.X), math.max(a.Y, b.Y), math.max(a.Z, b.Z)) end
function V3.Min(a, b) return v3(math.min(a.X, b.X), math.min(a.Y, b.Y), math.min(a.Z, b.Z)) end
Vector3 = { new = v3, zero = v3(0, 0, 0), one = v3(1, 1, 1), xAxis = v3(1, 0, 0), yAxis = v3(0, 1, 0), zAxis = v3(0, 0, 1) }

-- ── CFrame (Position + Rotationsmatrix zeilenweise wie in Roblox) ──
local CF = { __type = "CFrame" }
local function cf(x, y, z, a, b, c, d, e, f, g, h, i)
	return setmetatable({ x, y, z, a or 1, b or 0, c or 0, d or 0, e or 1, f or 0, g or 0, h or 0, i or 1 }, CF)
end
CF.__index = function(m, k)
	if k == "Position" or k == "p" then return v3(m[1], m[2], m[3]) end
	if k == "X" then return m[1] elseif k == "Y" then return m[2] elseif k == "Z" then return m[3] end
	if k == "LookVector" then return v3(-m[6], -m[9], -m[12]) end
	if k == "RightVector" then return v3(m[4], m[7], m[10]) end
	if k == "UpVector" then return v3(m[5], m[8], m[11]) end
	if k == "XVector" then return v3(m[4], m[7], m[10]) end
	if k == "YVector" then return v3(m[5], m[8], m[11]) end
	if k == "ZVector" then return v3(m[6], m[9], m[12]) end
	if k == "Rotation" then return cf(0, 0, 0, m[4], m[5], m[6], m[7], m[8], m[9], m[10], m[11], m[12]) end
	return CF[k]
end
CF.__mul = function(a, b)
	if getmetatable(b) == V3 then
		return v3(a[4] * b.X + a[5] * b.Y + a[6] * b.Z + a[1], a[7] * b.X + a[8] * b.Y + a[9] * b.Z + a[2], a[10] * b.X + a[11] * b.Y + a[12] * b.Z + a[3])
	end
	local a4, a5, a6, a7, a8, a9, a10, a11, a12 = a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12]
	local b4, b5, b6, b7, b8, b9, b10, b11, b12 = b[4], b[5], b[6], b[7], b[8], b[9], b[10], b[11], b[12]
	return setmetatable({
		a4 * b[1] + a5 * b[2] + a6 * b[3] + a[1], a7 * b[1] + a8 * b[2] + a9 * b[3] + a[2], a10 * b[1] + a11 * b[2] + a12 * b[3] + a[3],
		a4 * b4 + a5 * b7 + a6 * b10, a4 * b5 + a5 * b8 + a6 * b11, a4 * b6 + a5 * b9 + a6 * b12,
		a7 * b4 + a8 * b7 + a9 * b10, a7 * b5 + a8 * b8 + a9 * b11, a7 * b6 + a8 * b9 + a9 * b12,
		a10 * b4 + a11 * b7 + a12 * b10, a10 * b5 + a11 * b8 + a12 * b11, a10 * b6 + a11 * b9 + a12 * b12,
	}, CF)
end
CF.__add = function(a, v) return cf(a[1] + v.X, a[2] + v.Y, a[3] + v.Z, a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12]) end
CF.__sub = function(a, v) return cf(a[1] - v.X, a[2] - v.Y, a[3] - v.Z, a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12]) end
CF.__eq = function(a, b) for i = 1, 12 do if a[i] ~= b[i] then return false end end return true end
CF.__tostring = function(m) local t = {} for i = 1, 12 do t[i] = ("%g"):format(m[i]) end return table.concat(t, ", ") end
function CF.Inverse(m)
	-- Rotation ist orthonormal: Transponierte
	local r4, r5, r6, r7, r8, r9, r10, r11, r12 = m[4], m[7], m[10], m[5], m[8], m[11], m[6], m[9], m[12]
	local x, y, z = m[1], m[2], m[3]
	return cf(-(r4 * x + r5 * y + r6 * z), -(r7 * x + r8 * y + r9 * z), -(r10 * x + r11 * y + r12 * z), r4, r5, r6, r7, r8, r9, r10, r11, r12)
end
function CF.ToWorldSpace(a, b) return a * b end
function CF.ToObjectSpace(a, b) return a:Inverse() * b end
function CF.PointToWorldSpace(a, v) return a * v end
function CF.PointToObjectSpace(a, v) return a:Inverse() * v end
function CF.VectorToWorldSpace(a, v) return v3(a[4] * v.X + a[5] * v.Y + a[6] * v.Z, a[7] * v.X + a[8] * v.Y + a[9] * v.Z, a[10] * v.X + a[11] * v.Y + a[12] * v.Z) end
function CF.GetComponents(m) return unpack(m, 1, 12) end
CF.components = CF.GetComponents
local function toQuat(m)
	local t = m[4] + m[8] + m[12]
	local w, x, y, z
	if t > 0 then local s = sqrt(t + 1) * 2 w = 0.25 * s x = (m[11] - m[9]) / s y = (m[6] - m[10]) / s z = (m[7] - m[5]) / s
	elseif m[4] > m[8] and m[4] > m[12] then local s = sqrt(1 + m[4] - m[8] - m[12]) * 2 w = (m[11] - m[9]) / s x = 0.25 * s y = (m[5] + m[7]) / s z = (m[6] + m[10]) / s
	elseif m[8] > m[12] then local s = sqrt(1 + m[8] - m[4] - m[12]) * 2 w = (m[6] - m[10]) / s x = (m[5] + m[7]) / s y = 0.25 * s z = (m[9] + m[11]) / s
	else local s = sqrt(1 + m[12] - m[4] - m[8]) * 2 w = (m[7] - m[5]) / s x = (m[6] + m[10]) / s y = (m[9] + m[11]) / s z = 0.25 * s end
	return w, x, y, z
end
local function fromQuat(px, py, pz, w, x, y, z)
	return cf(px, py, pz, 1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w), 2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w), 2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y))
end
function CF.Lerp(a, b, t)
	local aw, ax, ay, az = toQuat(a)
	local bw, bx, by, bz = toQuat(b)
	local d = aw * bw + ax * bx + ay * by + az * bz
	if d < 0 then bw, bx, by, bz, d = -bw, -bx, -by, -bz, -d end
	local w, x, y, z = aw + (bw - aw) * t, ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t
	local n = sqrt(w * w + x * x + y * y + z * z)
	return fromQuat(a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t, w / n, x / n, y / n, z / n)
end
function CF.ToEulerAnglesXYZ(m)
	local ry = math.asin(math.clamp(m[6], -1, 1))
	local rx, rz
	if abs(m[6]) < 0.9999 then rx = atan2(-m[9], m[12]) rz = atan2(-m[5], m[4]) else rx = atan2(m[11], m[8]) rz = 0 end
	return rx, ry, rz
end
local function angles(rx, ry, rz)
	-- Roblox: CFrame.Angles(rx, ry, rz) = Rx * Ry * Rz
	local cx, sx, cy, sy, cz, sz = cos(rx), sin(rx), cos(ry), sin(ry), cos(rz), sin(rz)
	return cf(0, 0, 0,
		cy * cz, -cy * sz, sy,
		cx * sz + sx * sy * cz, cx * cz - sx * sy * sz, -sx * cy,
		sx * sz - cx * sy * cz, sx * cz + cx * sy * sz, cx * cy)
end
local function lookAt(at, target, up)
	up = up or v3(0, 1, 0)
	local f = (target - at)
	if f.Magnitude < 1e-9 then return cf(at.X, at.Y, at.Z) end
	f = f.Unit
	local r = f:Cross(up)
	if r.Magnitude < 1e-6 then r = f:Cross(v3(0, 0, 1)) end
	r = r.Unit
	local u = r:Cross(f)
	return cf(at.X, at.Y, at.Z, r.X, u.X, -f.X, r.Y, u.Y, -f.Y, r.Z, u.Z, -f.Z)
end
CFrame = {
	new = function(a, b, c, ...)
		if a == nil then return cf(0, 0, 0) end
		if type(a) == "table" then
			if b then return lookAt(a, b) end
			return cf(a.X, a.Y, a.Z)
		end
		if select("#", ...) >= 9 then return cf(a, b, c, ...) end
		if select("#", ...) == 4 then local qx, qy, qz, qw = ... return fromQuat(a, b, c, qw, qx, qy, qz) end
		return cf(a, b, c)
	end,
	Angles = angles,
	fromEulerAnglesXYZ = angles,
	fromEulerAnglesYXZ = function(rx, ry, rz) return angles(0, ry, 0) * angles(rx, 0, 0) * angles(0, 0, rz) end,
	fromOrientation = function(rx, ry, rz) return angles(0, ry, 0) * angles(rx, 0, 0) * angles(0, 0, rz) end,
	fromAxisAngle = function(axis, a)
		local u = axis.Unit
		local c, s, t = cos(a), sin(a), 1 - cos(a)
		return cf(0, 0, 0, t * u.X * u.X + c, t * u.X * u.Y - s * u.Z, t * u.X * u.Z + s * u.Y, t * u.X * u.Y + s * u.Z, t * u.Y * u.Y + c, t * u.Y * u.Z - s * u.X, t * u.X * u.Z - s * u.Y, t * u.Y * u.Z + s * u.X, t * u.Z * u.Z + c)
	end,
	lookAt = lookAt,
	fromMatrix = function(p, x, y, z)
		z = z or x:Cross(y)
		return cf(p.X, p.Y, p.Z, x.X, y.X, z.X, x.Y, y.Y, z.Y, x.Z, y.Z, z.Z)
	end,
	identity = cf(0, 0, 0),
}

-- ── Farben, Bereiche, Sequenzen, UDim ──
local C3 = { __type = "Color3" }
C3.__index = function(c, k)
	if k == "r" then return c.R elseif k == "g" then return c.G elseif k == "b" then return c.B end
	return C3[k]
end
local function c3(r, g, b) return setmetatable({ R = r or 0, G = g or 0, B = b or 0 }, C3) end
C3.__eq = function(a, b) return a.R == b.R and a.G == b.G and a.B == b.B end
function C3.Lerp(a, b, t) return c3(a.R + (b.R - a.R) * t, a.G + (b.G - a.G) * t, a.B + (b.B - a.B) * t) end
function C3.ToHSV(c)
	local r, g, b = c.R, c.G, c.B
	local mx, mn = math.max(r, g, b), math.min(r, g, b)
	local d = mx - mn
	local h = 0
	if d > 0 then
		if mx == r then h = ((g - b) / d) % 6 elseif mx == g then h = (b - r) / d + 2 else h = (r - g) / d + 4 end
		h = h / 6
	end
	return h, mx == 0 and 0 or d / mx, mx
end
function C3.ToHex(c) return ("%02X%02X%02X"):format(floor(c.R * 255 + 0.5), floor(c.G * 255 + 0.5), floor(c.B * 255 + 0.5)) end
Color3 = {
	new = c3,
	fromRGB = function(r, g, b) return c3((r or 0) / 255, (g or 0) / 255, (b or 0) / 255) end,
	fromHex = function(h)
		h = h:gsub("#", "")
		return c3(tonumber(h:sub(1, 2), 16) / 255, tonumber(h:sub(3, 4), 16) / 255, tonumber(h:sub(5, 6), 16) / 255)
	end,
	fromHSV = function(h, s, v)
		local i = floor(h * 6) % 6
		local f = h * 6 - floor(h * 6)
		local p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
		if i == 0 then return c3(v, t, p) elseif i == 1 then return c3(q, v, p) elseif i == 2 then return c3(p, v, t)
		elseif i == 3 then return c3(p, q, v) elseif i == 4 then return c3(t, p, v) end
		return c3(v, p, q)
	end,
}
local NR = { __type = "NumberRange" }
NR.__index = NR
NumberRange = { new = function(a, b) return setmetatable({ Min = a, Max = b or a }, NR) end }
local NSK = { __type = "NumberSequenceKeypoint" }
NSK.__index = NSK
NumberSequenceKeypoint = { new = function(t, v, e) return setmetatable({ Time = t, Value = v, Envelope = e or 0 }, NSK) end }
local NSQ = { __type = "NumberSequence" }
NSQ.__index = NSQ
NumberSequence = { new = function(a, b)
	if type(a) == "table" then return setmetatable({ Keypoints = a }, NSQ) end
	return setmetatable({ Keypoints = { NumberSequenceKeypoint.new(0, a), NumberSequenceKeypoint.new(1, b or a) } }, NSQ)
end }
local CSK = { __type = "ColorSequenceKeypoint" }
CSK.__index = CSK
ColorSequenceKeypoint = { new = function(t, c) return setmetatable({ Time = t, Value = c }, CSK) end }
local CSQ = { __type = "ColorSequence" }
CSQ.__index = CSQ
ColorSequence = { new = function(a, b)
	if getmetatable(a) == C3 then return setmetatable({ Keypoints = { ColorSequenceKeypoint.new(0, a), ColorSequenceKeypoint.new(1, b or a) } }, CSQ) end
	return setmetatable({ Keypoints = a }, CSQ)
end }
local V2 = { __type = "Vector2" }
V2.__index = function(v, k) if k == "Magnitude" then return sqrt(v.X * v.X + v.Y * v.Y) end return V2[k] end
V2.__add = function(a, b) return Vector2.new(a.X + b.X, a.Y + b.Y) end
V2.__sub = function(a, b) return Vector2.new(a.X - b.X, a.Y - b.Y) end
V2.__mul = function(a, b) if type(b) == "number" then return Vector2.new(a.X * b, a.Y * b) end return Vector2.new(a.X * b.X, a.Y * b.Y) end
Vector2 = { new = function(x, y) return setmetatable({ X = x or 0, Y = y or 0 }, V2) end }
Vector2.zero = Vector2.new(0, 0)
local UD = { __type = "UDim" }
UD.__index = UD
UDim = { new = function(s, o) return setmetatable({ Scale = s or 0, Offset = o or 0 }, UD) end }
local UD2 = { __type = "UDim2" }
UD2.__index = function(u, k) if k == "X" then return u._x elseif k == "Y" then return u._y end return UD2[k] end
local function udim2(xs, xo, ys, yo) return setmetatable({ _x = UDim.new(xs, xo), _y = UDim.new(ys, yo), xs = xs or 0, xo = xo or 0, ys = ys or 0, yo = yo or 0 }, UD2) end
UD2.__add = function(a, b) return udim2(a.xs + b.xs, a.xo + b.xo, a.ys + b.ys, a.yo + b.yo) end
function UD2.Lerp(a, b, t) return udim2(a.xs + (b.xs - a.xs) * t, a.xo + (b.xo - a.xo) * t, a.ys + (b.ys - a.ys) * t, a.yo + (b.yo - a.yo) * t) end
UDim2 = { new = udim2, fromScale = function(x, y) return udim2(x, 0, y, 0) end, fromOffset = function(x, y) return udim2(0, x, 0, y) end }
local TI = { __type = "TweenInfo" }
TI.__index = TI
TweenInfo = { new = function(t, style, dir, repeats, reverses, delay) return setmetatable({ Time = t or 1, EasingStyle = style, EasingDirection = dir, RepeatCount = repeats or 0, Reverses = reverses or false, DelayTime = delay or 0 }, TI) end }

-- ── Enum: jede Enum-Art und jedes Element entsteht bei Bedarf ──
local EI = { __type = "EnumItem" }
EI.__index = EI
EI.__tostring = function(e) return "Enum." .. e.EnumType .. "." .. e.Name end
local enumCache = {}
Enum = setmetatable({}, { __index = function(_, kind)
	local items = setmetatable({}, { __index = function(t, name)
		local item = setmetatable({ Name = name, EnumType = kind, Value = 0 }, EI)
		rawset(t, name, item)
		return item
	end })
	rawset(Enum, kind, items)
	return items
end })

-- ── Random ──
local RND = { __type = "Random" }
RND.__index = RND
Random = { new = function(seed)
	local s = floor(abs(seed or (__now * 1000 + 1))) % 2147483646 + 1
	return setmetatable({ s = s }, RND)
end }
local function nextR(r) r.s = (r.s * 16807) % 2147483647 return r.s / 2147483647 end
function RND.NextNumber(r, a, b) a = a or 0 b = b or 1 return a + (b - a) * nextR(r) end
function RND.NextInteger(r, a, b) return a + floor(nextR(r) * (b - a + 1)) end

-- ── Werte zur Engine: flach als Zahlen ──
local function send(id, key, v)
	local t = type(v)
	if t == "number" then return JS_set(id, key, "n", v)
	elseif t == "string" then return JS_set(id, key, "s", v)
	elseif t == "boolean" then return JS_set(id, key, "b", v)
	elseif v == nil then return JS_set(id, key, "nil")
	end
	local mt = getmetatable(v)
	if mt == V3 then return JS_set(id, key, "V3", v.X, v.Y, v.Z)
	elseif mt == CF then return JS_set(id, key, "CF", unpack(v, 1, 12))
	elseif mt == C3 then return JS_set(id, key, "C3", v.R, v.G, v.B)
	elseif mt == NR then return JS_set(id, key, "NR", v.Min, v.Max)
	elseif mt == NSQ then
		local f = {}
		for _, k in ipairs(v.Keypoints) do f[#f + 1] = k.Time f[#f + 1] = k.Value end
		return JS_set(id, key, "NS", unpack(f))
	elseif mt == CSQ then
		local f = {}
		for _, k in ipairs(v.Keypoints) do f[#f + 1] = k.Time f[#f + 1] = k.Value.R f[#f + 1] = k.Value.G f[#f + 1] = k.Value.B end
		return JS_set(id, key, "CS", unpack(f))
	elseif mt == V2 then return JS_set(id, key, "V2", v.X, v.Y)
	elseif mt == UD2 then return JS_set(id, key, "U2", v.xs, v.xo, v.ys, v.yo)
	elseif mt == UD then return JS_set(id, key, "U", v.Scale, v.Offset)
	elseif mt == EI then return JS_set(id, key, "E", v.Name)
	elseif rawget(v, "__id") then return JS_set(id, key, "I", rawget(v, "__id"))
	end
	return JS_set(id, key, "nil")
end
-- Werte aus der Engine (Standardwerte, die Lua noch nicht kennt)
local byId = setmetatable({}, { __mode = "v" })
local function receive(kind, ...)
	if kind == "n" or kind == "s" or kind == "b" then return (...) end
	if kind == "V3" then return v3(...) end
	if kind == "CF" then return cf(...) end
	if kind == "C3" then return c3(...) end
	if kind == "NR" then return NumberRange.new(...) end
	if kind == "V2" then return Vector2.new(...) end
	if kind == "U2" then return udim2(...) end
	if kind == "U" then return UDim.new(...) end
	if kind == "E" then return { Name = (...), __type = "EnumItem" } end
	if kind == "NS" then
		local a = { ... }
		local k = {}
		for i = 1, #a, 2 do k[#k + 1] = NumberSequenceKeypoint.new(a[i], a[i + 1]) end
		return setmetatable({ Keypoints = k }, NSQ)
	end
	if kind == "CS" then
		local a = { ... }
		local k = {}
		for i = 1, #a, 4 do k[#k + 1] = ColorSequenceKeypoint.new(a[i], c3(a[i + 1], a[i + 2], a[i + 3])) end
		return setmetatable({ Keypoints = k }, CSQ)
	end
	if kind == "I" then return byId[(...)] end
	return nil
end

-- ── Signale ──
local SIG = { __type = "RBXScriptSignal" }
SIG.__index = SIG
local function signal() return setmetatable({ list = {} }, SIG) end
function SIG.Connect(s, fn)
	local c = { Connected = true }
	function c.Disconnect() c.Connected = false for i, f in ipairs(s.list) do if f == c then table.remove(s.list, i) break end end end
	c.fn = fn
	table.insert(s.list, c)
	return c
end
function SIG.Once(s, fn) local c c = s:Connect(function(...) c:Disconnect() fn(...) end) return c end
function SIG.Wait(s) local co = coroutine.running() local c c = s:Connect(function(...) c:Disconnect() coroutine.resume(co, ...) end) return coroutine.yield() end
function SIG.Fire(s, ...)
	local copy = { unpack(s.list) }
	for _, c in ipairs(copy) do
		if c.Connected then
			local ok, err = pcall(c.fn, ...)
			if not ok then print("Fehler:", err) end
		end
	end
end
__signal = signal

-- ── Instanzen ──
local INST = { __type = "Instance" }
local methods = {}
local SIGNAL_PROPS = { AttributeChanged = true, Changed = true, ChildAdded = true, ChildRemoved = true, Touched = true, AncestryChanged = true, Destroying = true, Activated = true, MouseButton1Click = true, MouseButton1Down = true, MouseButton1Up = true, MouseEnter = true, MouseLeave = true, MouseWheelForward = true, MouseWheelBackward = true }
INST.__index = function(self, k)
	local m = methods[k]
	if m then return m end
	local props = rawget(self, "__props")
	local v = props[k]
	if v ~= nil then return v end
	if k == "ClassName" then return rawget(self, "__class") end
	if k == "Parent" then return rawget(self, "__parent") end
	if SIGNAL_PROPS[k] then local s = signal() props[k] = s return s end
	for _, c in ipairs(rawget(self, "__children")) do if rawget(c, "__props").Name == k then return c end end
	local special = rawget(self, "__get")
	if special then local r = special(self, k) if r ~= nil then return r end end
	local kindAndValues = { JS_get(rawget(self, "__id"), k) }
	if kindAndValues[1] == nil or kindAndValues[1] == "none" then return nil end
	local r = receive(unpack(kindAndValues))
	if type(r) == "table" and getmetatable(r) ~= INST then props[k] = r end
	return r
end
local attrSignals = setmetatable({}, { __mode = "k" })
INST.__newindex = function(self, k, v)
	if k == "Parent" then return methods.__setParent(self, v) end
	local props = rawget(self, "__props")
	local old = props[k]
	props[k] = v
	local hook = rawget(self, "__set")
	if hook and hook(self, k, v) then return end
	send(rawget(self, "__id"), k, v)
	local changed = rawget(props, "Changed")
	if changed and old ~= v then changed:Fire(k) end
	local ps = rawget(self, "__propSignals")
	if ps and ps[k] and old ~= v then ps[k]:Fire() end
end
INST.__tostring = function(self) return rawget(self, "__props").Name end
INST.__eq = function(a, b) return rawequal(a, b) end

local function wrap(id, cls, name)
	local self = setmetatable({ __id = id, __class = cls, __props = { Name = name or cls }, __children = {}, __attrs = {} }, INST)
	byId[id] = self
	return self
end
__wrap = wrap

local SERVICES = {}
function methods.__setParent(self, p)
	local old = rawget(self, "__parent")
	if old == p then return end
	if old then
		local list = rawget(old, "__children")
		for i, c in ipairs(list) do if c == self then table.remove(list, i) break end end
		local s = rawget(rawget(old, "__props"), "ChildRemoved")
		if s then s:Fire(self) end
	end
	rawset(self, "__parent", p)
	if p then
		table.insert(rawget(p, "__children"), self)
		local s = rawget(rawget(p, "__props"), "ChildAdded")
		if s then s:Fire(self) end
	end
	if not rawget(self, "__virtual") then JS_parent(rawget(self, "__id"), p and rawget(p, "__id") or 0) end
	local s = rawget(rawget(self, "__props"), "AncestryChanged")
	if s then s:Fire(self, p) end
end
function methods.FindFirstChild(self, name, recursive)
	for _, c in ipairs(rawget(self, "__children")) do if rawget(c, "__props").Name == name then return c end end
	if recursive then for _, c in ipairs(rawget(self, "__children")) do local r = c:FindFirstChild(name, true) if r then return r end end end
	return nil
end
function methods.WaitForChild(self, name)
	local c = self:FindFirstChild(name)
	if c then return c end
	if coroutine.isyieldable() then
		for _ = 1, 600 do
			task.wait()
			c = self:FindFirstChild(name)
			if c then return c end
		end
	end
	return nil
end
function methods.FindFirstChildOfClass(self, cls) for _, c in ipairs(rawget(self, "__children")) do if rawget(c, "__class") == cls then return c end end return nil end
function methods.FindFirstChildWhichIsA(self, cls) for _, c in ipairs(rawget(self, "__children")) do if c:IsA(cls) then return c end end return nil end
function methods.FindFirstAncestor(self, name) local p = rawget(self, "__parent") while p do if p.Name == name then return p end p = rawget(p, "__parent") end return nil end
function methods.FindFirstAncestorOfClass(self, cls) local p = rawget(self, "__parent") while p do if rawget(p, "__class") == cls then return p end p = rawget(p, "__parent") end return nil end
function methods.FindFirstAncestorWhichIsA(self, cls) local p = rawget(self, "__parent") while p do if p:IsA(cls) then return p end p = rawget(p, "__parent") end return nil end
function methods.GetChildren(self) return { unpack(rawget(self, "__children")) } end
function methods.GetDescendants(self)
	local out = {}
	local function walk(i) for _, c in ipairs(rawget(i, "__children")) do out[#out + 1] = c walk(c) end end
	walk(self)
	return out
end
function methods.IsDescendantOf(self, other) local p = rawget(self, "__parent") while p do if p == other then return true end p = rawget(p, "__parent") end return false end
function methods.IsAncestorOf(self, other) return other:IsDescendantOf(self) end
local PART = { Part = true, WedgePart = true, SpawnLocation = true, MeshPart = true, TrussPart = true, Seat = true }
local GUI = { Frame = true, TextLabel = true, TextButton = true, ImageLabel = true, ImageButton = true, ScrollingFrame = true }
local VALUES = { IntValue = true, NumberValue = true, StringValue = true, BoolValue = true, Color3Value = true, ObjectValue = true, Vector3Value = true, CFrameValue = true }
function methods.IsA(self, cls)
	local c = rawget(self, "__class")
	if c == cls or cls == "Instance" then return true end
	if cls == "BasePart" or cls == "PVInstance" then return PART[c] == true or (cls == "PVInstance" and c == "Model") end
	if cls == "GuiObject" or cls == "GuiBase2d" then return GUI[c] == true end
	if cls == "LayerCollector" then return c == "ScreenGui" or c == "BillboardGui" or c == "SurfaceGui" end
	if cls == "ValueBase" then return VALUES[c] == true end
	if cls == "Light" then return c == "PointLight" or c == "SpotLight" or c == "SurfaceLight" end
	if cls == "LuaSourceContainer" then return c == "Script" or c == "LocalScript" or c == "ModuleScript" end
	return false
end
function methods.Destroy(self)
	if rawget(self, "__destroyed") then return end
	rawset(self, "__destroyed", true)
	local s = rawget(rawget(self, "__props"), "Destroying")
	if s then s:Fire() end
	for _, c in ipairs(self:GetChildren()) do c:Destroy() end
	self.Parent = nil
end
function methods.ClearAllChildren(self) for _, c in ipairs(self:GetChildren()) do c:Destroy() end end
function methods.SetAttribute(self, k, v)
	local a = rawget(self, "__attrs")
	local old = a[k]
	a[k] = v
	local s = attrSignals[self] and attrSignals[self][k]
	if s and old ~= v then s:Fire() end
	local all = rawget(rawget(self, "__props"), "AttributeChanged")
	if all and old ~= v then all:Fire(k) end
end
function methods.GetAttribute(self, k) return rawget(self, "__attrs")[k] end
function methods.GetAttributes(self) return table.clone(rawget(self, "__attrs")) end
function methods.GetAttributeChangedSignal(self, k)
	attrSignals[self] = attrSignals[self] or {}
	attrSignals[self][k] = attrSignals[self][k] or signal()
	return attrSignals[self][k]
end
function methods.GetPropertyChangedSignal(self, k)
	local ps = rawget(self, "__propSignals")
	if not ps then ps = {} rawset(self, "__propSignals", ps) end
	ps[k] = ps[k] or signal()
	return ps[k]
end
function methods.Clone(self)
	local c = Instance.new(rawget(self, "__class"))
	for k, v in pairs(rawget(self, "__props")) do
		if getmetatable(v) ~= SIG and k ~= "Parent" then
			if getmetatable(v) == INST then
				-- Verweise innerhalb des Klons werden unten umgebogen
				rawget(c, "__props")[k] = v
			else
				c[k] = v
			end
		end
	end
	for k, v in pairs(rawget(self, "__attrs")) do rawget(c, "__attrs")[k] = v end
	for _, ch in ipairs(rawget(self, "__children")) do
		local cc = ch:Clone()
		cc.Parent = c
	end
	return c
end
function methods.GetFullName(self) local n = self.Name local p = rawget(self, "__parent") while p and not SERVICES[p] do n = p.Name .. "." .. n p = rawget(p, "__parent") end return n end
function methods.Emit(self, n) JS_call(rawget(self, "__id"), "Emit", n or 1) end
function methods.Clear(self) JS_call(rawget(self, "__id"), "Clear", 0) end
function methods.GetPivot(self)
	if PART[rawget(self, "__class")] then return self.CFrame end
	local pp = rawget(rawget(self, "__props"), "PrimaryPart")
	if pp then return pp.CFrame end
	local pivot = rawget(rawget(self, "__props"), "WorldPivot")
	if pivot then return pivot end
	for _, d in ipairs(self:GetDescendants()) do if PART[rawget(d, "__class")] then return d.CFrame end end
	return CFrame.new()
end
function methods.PivotTo(self, target)
	if PART[rawget(self, "__class")] then self.CFrame = target return end
	local from = self:GetPivot()
	local delta = target * from:Inverse()
	for _, d in ipairs(self:GetDescendants()) do
		if PART[rawget(d, "__class")] then d.CFrame = delta * d.CFrame end
	end
	rawget(self, "__props").WorldPivot = target
end
function methods.SetPrimaryPartCFrame(self, target) self:PivotTo(target) end
function methods.GetBoundingBox(self)
	local mn, mx = nil, nil
	for _, d in ipairs(self:GetDescendants()) do
		if PART[rawget(d, "__class")] then
			local p, s = d.CFrame.Position, d.Size / 2
			mn = mn and mn:Min(p - s) or p - s
			mx = mx and mx:Max(p + s) or p + s
		end
	end
	if not mn then return CFrame.new(), Vector3.zero end
	return CFrame.new((mn + mx) / 2), mx - mn
end
function methods.GetMass() return 1 end
function methods.BreakJoints() end
function methods.MakeJoints() end
function methods.GetService(self, name) return SERVICES[name] or __service(name) end
methods.FindService = methods.GetService

-- Scripts laufen nicht (der Installer legt sie nur an); Source wird gemerkt
Instance = {
	new = function(cls, parent)
		local id = JS_new(cls)
		local self = wrap(id, cls)
		if parent then self.Parent = parent end
		return self
	end,
}

-- ── Aufgaben: task.spawn, task.delay, task.wait ──
local waiting = {}
local function resume(co, ...)
	local ok, err = coroutine.resume(co, ...)
	if not ok then print("Fehler:", debug.traceback(co, err)) end
end
task = {}
function task.spawn(fn, ...)
	local co = type(fn) == "thread" and fn or coroutine.create(fn)
	resume(co, ...)
	return co
end
function task.defer(fn, ...) local args = { ... } table.insert(waiting, { at = __now, co = coroutine.create(function() fn(unpack(args)) end) }) end
function task.delay(t, fn, ...)
	local args = { ... }
	local co = coroutine.create(function() fn(unpack(args)) end)
	table.insert(waiting, { at = __now + (t or 0), co = co })
	return co
end
function task.wait(t)
	local co = coroutine.running()
	local start = __now
	table.insert(waiting, { at = __now + (t or 0), co = co, start = start })
	coroutine.yield()
	return __now - start
end
function task.cancel(co) for i = #waiting, 1, -1 do if waiting[i].co == co then table.remove(waiting, i) end end end
wait = task.wait
spawn = task.spawn
delay = task.delay

-- ── Tweens ──
local tweens = {}
local EASE = {
	Linear = function(t) return t end,
	Sine = function(t) return 1 - cos(t * math.pi / 2) end,
	Quad = function(t) return t * t end,
	Cubic = function(t) return t * t * t end,
	Quart = function(t) return t ^ 4 end,
	Quint = function(t) return t ^ 5 end,
	Exponential = function(t) return t == 0 and 0 or 2 ^ (10 * t - 10) end,
	Back = function(t) return 2.70158 * t * t * t - 1.70158 * t * t end,
	Bounce = function(t)
		t = 1 - t
		local n, d = 7.5625, 2.75
		local r
		if t < 1 / d then r = n * t * t elseif t < 2 / d then t = t - 1.5 / d r = n * t * t + 0.75 elseif t < 2.5 / d then t = t - 2.25 / d r = n * t * t + 0.9375 else t = t - 2.625 / d r = n * t * t + 0.984375 end
		return 1 - r
	end,
	Elastic = function(t) if t == 0 or t == 1 then return t end return -(2 ^ (10 * t - 10)) * sin((t * 10 - 10.75) * (2 * math.pi) / 3) end,
	Circular = function(t) return 1 - sqrt(1 - t * t) end,
}
local function ease(info, t)
	local f = EASE[info.EasingStyle and info.EasingStyle.Name or "Quad"] or EASE.Quad
	local dir = info.EasingDirection and info.EasingDirection.Name or "Out"
	if dir == "In" then return f(t) end
	if dir == "Out" then return 1 - f(1 - t) end
	if t < 0.5 then return f(t * 2) / 2 end
	return 1 - f((1 - t) * 2) / 2
end
local function lerpValue(a, b, k)
	if type(a) == "number" then return a + (b - a) * k end
	if type(a) == "boolean" then return k < 1 and a or b end
	local mt = getmetatable(a)
	if mt == V3 or mt == CF or mt == C3 or mt == UD2 then return a:Lerp(b, k) end
	if mt == V2 then return Vector2.new(a.X + (b.X - a.X) * k, a.Y + (b.Y - a.Y) * k) end
	if mt == UD then return UDim.new(a.Scale + (b.Scale - a.Scale) * k, a.Offset + (b.Offset - a.Offset) * k) end
	return k < 1 and a or b
end
local TW = { __type = "Instance" }
TW.__index = TW
function TW.Play(tw)
	tw.start = __now
	tw.from = {}
	for k in pairs(tw.goal) do tw.from[k] = tw.inst[k] end
	tw.PlaybackState = Enum.PlaybackState.Playing
	-- gleiche Eigenschaften älterer Tweens übernehmen (wie in Roblox)
	for other in pairs(tweens) do
		if other ~= tw and other.inst == tw.inst then
			for k in pairs(tw.goal) do other.goal[k] = nil end
		end
	end
	tweens[tw] = true
end
function TW.Cancel(tw) tweens[tw] = nil end
function TW.Pause(tw) tweens[tw] = nil end
function TW.Destroy(tw) tweens[tw] = nil end
local TweenService = { Create = function(_, inst, info, goal)
	local tw = setmetatable({ inst = inst, info = info, goal = goal }, TW)
	tw.Completed = signal()
	return tw
end }
TweenService.GetValue = function(_, t, style, dir) return ease({ EasingStyle = style, EasingDirection = dir }, t) end
local function stepTweens()
	for tw in pairs(tweens) do
		local info = tw.info
		local t = (__now - tw.start - (info.DelayTime or 0)) / math.max(1e-3, info.Time)
		if t >= 0 then
			local done = t >= 1
			local k = ease(info, math.min(1, t))
			if info.Reverses then local u = math.min(1, t) k = ease(info, u < 0.5 and u * 2 or (1 - u) * 2) end
			for key, target in pairs(tw.goal) do
				if not rawget(tw.inst, "__destroyed") then tw.inst[key] = lerpValue(tw.from[key], target, k) end
			end
			if done then
				if info.RepeatCount ~= 0 then
					tw.start = __now
					if info.RepeatCount > 0 then info.RepeatCount = info.RepeatCount - 1 end
				else
					tweens[tw] = nil
					tw.PlaybackState = Enum.PlaybackState.Completed
					tw.Completed:Fire(Enum.PlaybackState.Completed)
				end
			end
		end
	end
end

-- ── JSON (HttpService) ──
function __jsonEncode(v)
	local t = type(v)
	if v == nil then return "null"
	elseif t == "boolean" then return v and "true" or "false"
	elseif t == "number" then
		if v ~= v or v == math.huge or v == -math.huge then return "null" end
		if math.type and math.type(v) == "integer" then return tostring(v) end
		if v == math.floor(v) and math.abs(v) < 1e15 then return string.format("%d", v) end
		return string.format("%.14g", v)
	elseif t == "string" then
		return '"' .. v:gsub('[%c"\\]', function(c)
			local map = { ['"'] = '\\"', ['\\'] = '\\\\', ['\n'] = '\\n', ['\r'] = '\\r', ['\t'] = '\\t' }
			return map[c] or string.format("\\u%04x", c:byte())
		end) .. '"'
	elseif t == "table" then
		local n = #v
		if n > 0 or next(v) == nil then
			local out = {}
			for i = 1, n do out[i] = __jsonEncode(v[i]) end
			return "[" .. table.concat(out, ",") .. "]"
		end
		local out = {}
		for k, val in pairs(v) do out[#out + 1] = __jsonEncode(tostring(k)) .. ":" .. __jsonEncode(val) end
		return "{" .. table.concat(out, ",") .. "}"
	end
	error("JSONEncode: " .. t .. " geht nicht")
end
function __jsonDecode(text)
	local pos = 1
	local function ws() pos = text:find("[^ \t\r\n]", pos) or #text + 1 end
	local value
	local function str()
		local out, i = {}, pos + 1
		while true do
			local c = text:sub(i, i)
			if c == "" then error("JSONDecode: Text endet im String") end
			if c == '"' then break end
			if c == "\\" then
				local e = text:sub(i + 1, i + 1)
				local map = { b = "\b", f = "\f", n = "\n", r = "\r", t = "\t" }
				if e == "u" then
					local code = tonumber(text:sub(i + 2, i + 5), 16)
					out[#out + 1] = utf8.char(code)
					i = i + 6
				else
					out[#out + 1] = map[e] or e
					i = i + 2
				end
			else
				out[#out + 1] = c
				i = i + 1
			end
		end
		pos = i + 1
		return table.concat(out)
	end
	function value()
		ws()
		local c = text:sub(pos, pos)
		if c == "{" then
			local obj = {}
			pos = pos + 1
			ws()
			if text:sub(pos, pos) == "}" then pos = pos + 1 return obj end
			while true do
				ws()
				local k = str()
				ws()
				pos = pos + 1 -- :
				obj[k] = value()
				ws()
				local d = text:sub(pos, pos)
				pos = pos + 1
				if d == "}" then return obj end
			end
		elseif c == "[" then
			local arr = {}
			pos = pos + 1
			ws()
			if text:sub(pos, pos) == "]" then pos = pos + 1 return arr end
			local n = 0
			while true do
				n = n + 1
				arr[n] = value()
				ws()
				local d = text:sub(pos, pos)
				pos = pos + 1
				if d == "]" then return arr end
			end
		elseif c == '"' then return str()
		elseif text:sub(pos, pos + 3) == "true" then pos = pos + 4 return true
		elseif text:sub(pos, pos + 4) == "false" then pos = pos + 5 return false
		elseif text:sub(pos, pos + 3) == "null" then pos = pos + 4 return nil
		end
		local num = text:match("^-?%d+%.?%d*[eE]?[-+]?%d*", pos)
		if not num or num == "" then error("JSONDecode: unerwartet bei " .. pos) end
		pos = pos + #num
		return tonumber(num)
	end
	return value()
end

-- ── Dienste ──
local RunService = { RenderStepped = signal(), Heartbeat = signal(), Stepped = signal(), PreRender = signal(), PostSimulation = signal() }
function RunService.IsStudio() return true end
function RunService.IsClient() return true end
function RunService.IsServer() return true end
function RunService.IsRunning() return true end
function RunService.BindToRenderStep(_, name, prio, fn) RunService.__bound = RunService.__bound or {} RunService.__bound[name] = RunService.RenderStepped:Connect(fn) end
function RunService.UnbindFromRenderStep(_, name) local c = RunService.__bound and RunService.__bound[name] if c then c:Disconnect() end end

function __service(name)
	if SERVICES[name] then return SERVICES[name] end
	local s
	if name == "TweenService" then s = TweenService
	elseif name == "RunService" then s = RunService
	elseif name == "Debris" then s = { AddItem = function(_, inst, t) task.delay(t or 10, function() inst:Destroy() end) end }
	elseif name == "Players" then s = __players
	elseif name == "HttpService" then s = { GenerateGUID = function() return tostring(math.random(1, 1e9)) end, JSONEncode = function(_, v) return __jsonEncode(v) end, JSONDecode = function(_, text) return __jsonDecode(text) end }
	elseif name == "CollectionService" then
		local tags = {}
		s = { AddTag = function(_, i, t) tags[t] = tags[t] or {} tags[t][i] = true end, HasTag = function(_, i, t) return tags[t] and tags[t][i] or false end, GetTagged = function(_, t) local o = {} for i in pairs(tags[t] or {}) do o[#o + 1] = i end return o end, GetInstanceAddedSignal = function() return signal() end, GetInstanceRemovedSignal = function() return signal() end, RemoveTag = function(_, i, t) if tags[t] then tags[t][i] = nil end end }
	elseif name == "SoundService" or name == "ContentProvider" or name == "MarketplaceService" or name == "DataStoreService" or name == "TextChatService" or name == "UserInputService" or name == "ChangeHistoryService" or name == "StarterGui" then
		s = setmetatable({}, { __index = function() return function() end end })
	else
		s = wrap(-1, name, name)
		rawset(s, "__virtual", true)
	end
	SERVICES[name] = s
	return s
end

-- Welt: workspace und Lighting kommen von JS (feste Ids 1 und 2)
workspace = wrap(1, "Workspace", "Workspace")
Workspace = workspace
local Lighting = wrap(2, "Lighting", "Lighting")
SERVICES.Workspace = workspace
SERVICES.Lighting = Lighting
SERVICES.ReplicatedStorage = wrap(3, "ReplicatedStorage", "ReplicatedStorage")
SERVICES.ServerScriptService = wrap(4, "ServerScriptService", "ServerScriptService")
SERVICES.ServerStorage = wrap(5, "ServerStorage", "ServerStorage")
SERVICES.StarterPlayer = wrap(6, "StarterPlayer", "StarterPlayer")
local sps = wrap(7, "StarterPlayerScripts", "StarterPlayerScripts")
methods.__setParent(sps, SERVICES.StarterPlayer)
SERVICES.StarterGui = wrap(8, "StarterGui", "StarterGui")
game = setmetatable({ __id = 0, __class = "DataModel", __props = { Name = "Game" }, __children = {}, __attrs = {}, __virtual = true }, INST)
rawset(workspace, "__get", function(self, k)
	if k == "CurrentCamera" then return __camera end
end)
function methods.BulkMoveTo(self, parts, cframes)
	local flat = {}
	local n = 0
	for i, p in ipairs(parts) do
		local c = cframes[i]
		rawget(p, "__props").CFrame = c
		flat[n + 1] = rawget(p, "__id")
		for j = 1, 12 do flat[n + 1 + j] = c[j] end
		n = n + 13
	end
	JS_bulk(flat)
end
function methods.Raycast() return nil end
function methods.GetPartBoundsInBox() return {} end
function methods.GetPartBoundsInRadius() return {} end

-- Kamera: Lua-Tabelle, JS setzt CFrame und Sichtfeld jedes Bild
__camera = setmetatable({ __props = { Name = "Camera", CFrame = CFrame.new(), FieldOfView = 70 }, __children = {}, __attrs = {}, __class = "Camera", __virtual = true, __id = -2 }, INST)
rawset(__camera, "__set", function() return true end)
function __setCam(fov, ...)
	local c = rawget(__camera, "__props")
	c.CFrame = CFrame.new(...)
	c.FieldOfView = fov
end

-- Spieler: ein lokaler Spieler mit PlayerGui (ScreenGuis landen in einer eigenen Ebene)
local playerGui = wrap(9, "PlayerGui", "PlayerGui")
local localPlayer = setmetatable({ __props = { Name = "Spieler", UserId = 1, DisplayName = "Spieler" }, __children = {}, __attrs = {}, __class = "Player", __virtual = true, __id = -3 }, INST)
rawset(localPlayer, "__set", function() return true end)
methods.__setParent(playerGui, localPlayer)
rawget(localPlayer, "__props").CharacterAdded = signal()
rawget(localPlayer, "__props").CharacterRemoving = signal()
rawget(localPlayer, "__props").Chatted = signal()
__players = { LocalPlayer = localPlayer, PlayerAdded = signal(), PlayerRemoving = signal() }
function __players.GetPlayers() return { localPlayer } end
function __players.GetPlayerFromCharacter(_, c) if localPlayer.Character == c then return localPlayer end return nil end
SERVICES.Players = __players

-- ── require und Skripte ──
local loaded = {}
function require(m)
	if loaded[m] ~= nil then return loaded[m] end
	local src = rawget(rawget(m, "__props"), "Source")
	assert(src, "require: kein Quelltext in " .. tostring(m))
	local env = setmetatable({ script = m }, { __index = _G })
	local fn, err = load(src, "=" .. m.Name, "t", env)
	assert(fn, err)
	loaded[m] = fn()
	return loaded[m]
end
-- GUI-Ereignis aus JS (Klick, Maus drüber) an die Instanz weitergeben
function __fireGui(id, name)
	local inst = byId[id]
	if not inst then return end
	local s = rawget(rawget(inst, "__props"), name)
	if s then s:Fire() end
end
-- Wert, den JS geändert hat (z. B. CanvasPosition beim Scrollen), in Lua nachziehen
function __syncProp(id, key, x, y)
	local inst = byId[id]
	if inst then rawget(inst, "__props")[key] = Vector2.new(x, y) end
end
-- Attribut am lokalen Spieler oder an ReplicatedStorage setzen (Spielstand der Vorschau)
function __setAttr(name, value)
	__players.LocalPlayer:SetAttribute(name, value)
end
function __setRSAttr(name, value)
	SERVICES.ReplicatedStorage:SetAttribute(name, value)
end

-- ModuleScript unter ReplicatedStorage > CoinmasterAdventure anlegen (wie der Installer)
function __addModule(name, src, folderName)
	local rs = SERVICES.ReplicatedStorage
	local folder = rs:FindFirstChild(folderName or "CoinmasterAdventure")
	if not folder then
		folder = Instance.new("Folder")
		folder.Name = folderName or "CoinmasterAdventure"
		folder.Parent = rs
	end
	local old = folder:FindFirstChild(name)
	if old then loaded[old] = nil old:Destroy() end
	local m = Instance.new("ModuleScript")
	m.Name = name
	rawget(m, "__props").Source = src
	m.Parent = folder
	return m
end

-- Ein Skript (Script/LocalScript) wie in Roblox in einer eigenen Koroutine starten
function __runScript(name, src, parent)
	local holder = Instance.new("Script")
	rawget(holder, "__props").Name = name
	rawget(holder, "__props").Source = src
	if parent then holder.Parent = parent end
	local env = setmetatable({ script = holder }, { __index = _G })
	local fn, err = load(src, "=" .. name, "t", env)
	if not fn then print("Fehler:", err) return end
	task.spawn(fn)
	return holder
end

-- ── Ein Bild: Uhr, wartende Aufgaben, Tweens, Signale ──
function __frame(dt)
	__now = __now + dt
	local due = {}
	for i = #waiting, 1, -1 do
		if waiting[i].at <= __now then due[#due + 1] = waiting[i] table.remove(waiting, i) end
	end
	for i = #due, 1, -1 do resume(due[i].co, __now - (due[i].start or due[i].at)) end
	stepTweens()
	RunService.Stepped:Fire(__now, dt)
	RunService.PreRender:Fire(dt)
	RunService.RenderStepped:Fire(dt)
	RunService.Heartbeat:Fire(dt)
	RunService.PostSimulation:Fire(dt)
end
`;
