// Spielgefühl für Bewegung und Kamera (LocalScript CoinmasterJuice): Staub beim Springen und Landen, Kamera
// federt und wackelt bei harten Landungen, das Sichtfeld wird beim schnellen Laufen weiter, ein Teleport blitzt
// auf. „Animationen überspringen“ (Attribut Set_skipAnimations) schaltet alles ab.
// Reiner Text wie luau.js, damit es auch in Node prüfbar ist.

export const JUICE_CLIENT = `-- Coinmaster Adventure · Spielgefühl: Bewegung und Kamera (Client)
-- Automatisch erzeugt von der Coinmaster-Webseite.
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local BASE_FOV = 70
local kickUntil = 0 -- solange ein Kamera-Stoß läuft, regelt das Laufen das Sichtfeld nicht

local function calm()
	return player:GetAttribute("Set_skipAnimations") == true
end
local function few()
	return player:GetAttribute("Set_fewerParticles") == true
end

-- Staubwolke an den Füßen
local function dustAt(root)
	local a = Instance.new("Attachment")
	a.Name = "Staub"
	a.Position = Vector3.new(0, -2.8, 0)
	a.Parent = root
	local e = Instance.new("ParticleEmitter")
	e.Texture = "rbxasset://textures/particles/smoke_main.dds"
	e.Color = ColorSequence.new(Color3.fromRGB(230, 220, 200))
	e.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.8), NumberSequenceKeypoint.new(1, 2.6) })
	e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.35), NumberSequenceKeypoint.new(1, 1) })
	e.Lifetime = NumberRange.new(0.4, 0.8)
	e.Speed = NumberRange.new(4, 9)
	e.SpreadAngle = Vector2.new(80, 10)
	e.EmissionDirection = Enum.NormalId.Top
	e.Acceleration = Vector3.new(0, -4, 0)
	e.Drag = 4
	e.Rate = 0
	e.Parent = a
	local sparks = Instance.new("ParticleEmitter")
	sparks.Texture = "rbxasset://textures/particles/sparkles_main.dds"
	sparks.LightEmission = 1
	sparks.Color = ColorSequence.new(Color3.fromRGB(255, 230, 150), Color3.fromRGB(255, 255, 255))
	sparks.Size = NumberSequence.new(0.5, 0)
	sparks.Lifetime = NumberRange.new(0.5, 0.9)
	sparks.Speed = NumberRange.new(8, 16)
	sparks.SpreadAngle = Vector2.new(180, 180)
	sparks.Rate = 0
	sparks.Parent = a
	return e, sparks
end

-- Kamera kurz wackeln (über Humanoid.CameraOffset, damit die Steuerung bleibt)
local shakeToken
local function shake(humanoid, strength, duration)
	if calm() then return end
	local token = {}
	shakeToken = token
	task.spawn(function()
		local start = os.clock()
		while shakeToken == token do
			local k = (os.clock() - start) / duration
			if k >= 1 then break end
			local s = strength * (1 - k) * (1 - k)
			humanoid.CameraOffset = Vector3.new((math.random() - 0.5) * s, (math.random() - 0.5) * s, 0)
			RunService.RenderStepped:Wait()
		end
		humanoid.CameraOffset = Vector3.new()
	end)
end

local function fovKick(to, back, time)
	local cam = workspace.CurrentCamera
	if not cam or calm() then return end
	cam.FieldOfView = to
	kickUntil = os.clock() + (time or 0.45)
	TweenService:Create(cam, TweenInfo.new(time or 0.45, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { FieldOfView = back or BASE_FOV }):Play()
end

-- Weißer Blitz über den ganzen Bildschirm (Teleport)
local function flash(color)
	local gui = player:FindFirstChildOfClass("PlayerGui")
	if not gui or calm() then return end
	local sg = Instance.new("ScreenGui")
	sg.Name = "TeleportBlitz"
	sg.IgnoreGuiInset = true
	sg.DisplayOrder = 30
	sg.Parent = gui
	local f = Instance.new("Frame")
	f.Size = UDim2.new(1, 0, 1, 0)
	f.BackgroundColor3 = color or Color3.new(1, 1, 1)
	f.BackgroundTransparency = 0.1
	f.BorderSizePixel = 0
	f.Parent = sg
	TweenService:Create(f, TweenInfo.new(0.6, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), { BackgroundTransparency = 1 }):Play()
	task.delay(0.65, function() sg:Destroy() end)
end

local function onCharacter(character)
	local humanoid = character:WaitForChild("Humanoid")
	local root = character:WaitForChild("HumanoidRootPart")
	local dust, sparks = dustAt(root)
	local lastPos = root.Position
	local fallSpeed = 0

	humanoid.StateChanged:Connect(function(_, new)
		if calm() then return end
		if new == Enum.HumanoidStateType.Jumping then
			dust:Emit(few() and 3 or 6)
			fovKick(BASE_FOV + 5, BASE_FOV, 0.4)
		elseif new == Enum.HumanoidStateType.Landed then
			local hard = math.clamp((fallSpeed - 25) / 60, 0, 1)
			dust:Emit(math.floor((few() and 4 or 8) + hard * (few() and 8 or 20)))
			if hard > 0 then
				shake(humanoid, 0.4 + hard * 1.4, 0.25 + hard * 0.25)
				fovKick(BASE_FOV - 4 * hard, BASE_FOV, 0.35)
			end
		end
	end)

	RunService.RenderStepped:Connect(function(dt)
		if not root.Parent then return end
		local v = root.AssemblyLinearVelocity
		if v.Y < 0 then fallSpeed = -v.Y elseif humanoid.FloorMaterial ~= Enum.Material.Air then fallSpeed = 0 end
		-- Teleport: großer Sprung in einem Bild
		local moved = (root.Position - lastPos).Magnitude
		lastPos = root.Position
		if moved > 150 then
			flash(Color3.fromRGB(255, 244, 214))
			fovKick(BASE_FOV - 25, BASE_FOV, 0.7)
			sparks:Emit(few() and 15 or 40)
			return
		end
		-- schnelles Laufen weitet das Sichtfeld etwas
		local cam = workspace.CurrentCamera
		if cam and not calm() and os.clock() > kickUntil then
			local speed = Vector3.new(v.X, 0, v.Z).Magnitude
			local target = BASE_FOV + math.clamp((speed - 16) / 24, 0, 1) * 8
			cam.FieldOfView = cam.FieldOfView + (target - cam.FieldOfView) * math.min(1, dt * 4)
		end
	end)
end

if player.Character then task.spawn(onCharacter, player.Character) end
player.CharacterAdded:Connect(onCharacter)
`;
