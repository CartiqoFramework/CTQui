-- CTQui client: a thin bridge between other resources and the NUI. Everything is
-- exposed as exports so any resource can call exports.CTQui:Notify{...}, etc.
local function send(action, data)
	SendNUIMessage({ action = action, data = data or {} })
end

-- Push the theme into the NUI once it's loaded.
AddEventHandler('onClientResourceStart', function(res)
	if res ~= GetCurrentResourceName() then return end
	Wait(50)
	send('config', { theme = Config.Theme, notifyPosition = Config.NotifyPosition })
end)

-- ── Notifications ───────────────────────────────────────────────────────────
-- data = { title?, description, type? ('info'|'success'|'error'|'warning'), duration?, icon? }
local function notify(data)
	if type(data) == 'string' then data = { description = data } end
	send('notify', {
		title = data.title,
		description = data.description or '',
		type = data.type or 'info',
		duration = data.duration or Config.NotifyDuration,
		icon = data.icon,
	})
end
exports('Notify', notify)

-- ── Text UI (keypress hint / interaction prompt) ────────────────────────────
-- ShowTextUI(text, { key?, icon? })  ·  HideTextUI()
local textUiOpen = false
local function showTextUI(text, opts)
	opts = opts or {}
	textUiOpen = true
	send('textui:show', { text = text or '', key = opts.key, icon = opts.icon })
end
local function hideTextUI()
	if not textUiOpen then return end
	textUiOpen = false
	send('textui:hide')
end
exports('ShowTextUI', showTextUI)
exports('HideTextUI', hideTextUI)
exports('IsTextUIOpen', function() return textUiOpen end)

-- ── Controls panel (persistent keybind hints) ───────────────────────────────
-- ShowControls({ title?, items = { { label, key }, … } })  ·  HideControls()
local function showControls(data)
	send('controls:show', { title = data.title, items = data.items or {} })
end
local function hideControls()
	send('controls:hide')
end
exports('ShowControls', showControls)
exports('HideControls', hideControls)

-- ── Progress bar (blocking) ─────────────────────────────────────────────────
-- Progress({ label, duration, canCancel? }) -> boolean (true = completed, false = cancelled)
local progressActive = false
local progressResolve

local function progress(data)
	if progressActive then return false end
	progressActive = true
	local p = promise.new()
	progressResolve = p

	SetNuiFocus(false, false) -- progress is non-interactive; ESC cancel handled by a key thread
	send('progress:start', {
		label = data.label or 'Please wait',
		title = data.title,
		icon = data.icon,
		description = data.description,
		duration = data.duration or 3000,
		canCancel = data.canCancel ~= false,
	})

	-- Allow cancel with the X key (INPUT_FRONTEND_CANCEL = 177) when permitted.
	if data.canCancel ~= false then
		CreateThread(function()
			while progressActive do
				if IsControlJustPressed(0, 177) then
					send('progress:cancel')
					if progressResolve then progressResolve:resolve(false) end
					progressActive = false
					break
				end
				Wait(0)
			end
		end)
	end

	local result = Citizen.Await(p)
	progressActive = false
	progressResolve = nil
	return result
end
exports('Progress', progress)

-- NUI tells us when the bar finished naturally.
RegisterNUICallback('progress:done', function(_, cb)
	if progressResolve then progressResolve:resolve(true) end
	cb('ok')
end)

-- ── Demo command (remove in production) ─────────────────────────────────────
RegisterCommand('ctqui', function(_, args)
	local what = args[1] or 'notify'
	if what == 'notify' then
		notify({ title = 'CTQui', description = 'This is a CTQui notification.', type = args[2] or 'info' })
	elseif what == 'textui' then
		showTextUI('Press to interact', { key = 'E' })
		SetTimeout(3000, hideTextUI)
	elseif what == 'progress' then
		local ok = progress({
			title = 'Initializing Hack',
			icon = '💻',
			description = 'Bypassing security protocols…',
			duration = 5000,
			canCancel = true,
		})
		notify({ description = ok and 'Completed!' or 'Cancelled.', type = ok and 'success' or 'error' })
	elseif what == 'controls' then
		showControls({
			title = 'Controls',
			items = {
				{ label = 'Move Forward', key = 'W' },
				{ label = 'Move Left', key = 'A' },
				{ label = 'Confirm', key = 'SPACE' },
				{ label = 'Cancel', key = 'X' },
			},
		})
		SetTimeout(6000, hideControls)
	end
end, false)
