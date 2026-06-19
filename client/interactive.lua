-- CTQui focus-based components: list menu, context menu (with submenus), input
-- dialog (text / number / select / checkbox / toggle / slider) and a skill-check
-- minigame. Each takes NUI focus and blocks (on a coroutine) until the player
-- submits or cancels, returning the result. Only one is open at a time.
local activeResolve

-- cursor = whether the NUI takes the mouse cursor (menus/inputs yes; skillcheck no).
local function openInteractive(action, data, cursor)
	if activeResolve then return nil end
	local p = promise.new()
	activeResolve = p
	SetNuiFocus(true, cursor ~= false)
	SendNUIMessage({ action = action, data = data or {} })
	local result = Citizen.Await(p)
	return result
end

local function resolve(value)
	SetNuiFocus(false, false)
	if activeResolve then
		activeResolve:resolve(value)
		activeResolve = nil
	end
end

-- OpenMenu({ title, options = { { label, description?, icon?, value }, … } }) -> value | nil
exports('OpenMenu', function(data) return openInteractive('menu:open', data, true) end)

-- OpenContext({ title, subtitle?, items = { { id, title, description?, icon?, value?, disabled?, menu? }, … } }) -> id | nil
-- An item with `menu` (a nested items array) opens a submenu instead of returning.
exports('OpenContext', function(data) return openInteractive('context:open', data, true) end)

-- Input({ title, fields = { { name, label, type, description?, placeholder?, required?, options?, default?, min?, max?, step? }, … } }) -> { [name] = value } | nil
-- types: 'text' | 'number' | 'password' | 'select' | 'checkbox' | 'toggle' | 'slider'
exports('Input', function(data) return openInteractive('input:open', data, true) end)

-- SkillCheck({ key?, durationMs?, zoneDeg?, label? }) -> boolean (true = hit the zone)
exports('SkillCheck', function(data) return openInteractive('skillcheck:open', data, false) end)

-- OpenRadial({ title?, items = { { label, icon?, value }, … } }) -> value | nil
exports('OpenRadial', function(data) return openInteractive('radial:open', data, true) end)

-- Force-close whatever is open (returns nil / false to the caller).
exports('CloseUI', function()
	SendNUIMessage({ action = 'ui:close' })
	resolve(nil)
end)

RegisterNUICallback('ui:submit', function(body, cb)
	resolve(body and body.value)
	cb('ok')
end)
RegisterNUICallback('ui:cancel', function(_, cb)
	resolve(nil)
	cb('ok')
end)

-- ── Demo commands (remove in production) ────────────────────────────────────
RegisterCommand('ctquimenu', function()
	local choice = exports.CTQui:OpenMenu({
		title = 'Vehicle',
		options = {
			{ label = 'Lock / unlock', description = 'Toggle the doors', icon = '🔒', value = 'lock' },
			{ label = 'Engine', description = 'Start or stop', icon = '⚙️', value = 'engine' },
			{ label = 'Store vehicle', icon = '🅿️', value = 'store' },
		},
	})
	exports.CTQui:Notify({ description = choice and ('Picked: ' .. choice) or 'Menu cancelled', type = choice and 'success' or 'info' })
end, false)

RegisterCommand('ctquicontext', function()
	local id = exports.CTQui:OpenContext({
		title = 'Garage',
		subtitle = 'Manage your vehicles',
		items = {
			{ id = 'take', title = 'Acquire equipment', description = 'Done', icon = '🧰', status = 'done' },
			{ id = 'hack', title = 'Hack security system', description = 'In progress', icon = '🔐', status = 'active' },
			{ id = 'fav', title = 'Favourites', value = '3', icon = '⭐' },
			{ id = 'soon', title = 'Access the vault', description = 'Locked', icon = '🔒', status = 'locked', disabled = true },
			{ id = 'more', title = 'More options', icon = '⋯', menu = {
				title = 'More options',
				items = {
					{ id = 'rename', title = 'Rename vehicle', icon = '✏️' },
					{ id = 'sell', title = 'Sell vehicle', description = 'Get 50% back', icon = '💰' },
				},
			} },
		},
	})
	exports.CTQui:Notify({ description = id and ('Context: ' .. id) or 'Closed', type = 'info' })
end, false)

RegisterCommand('ctquiinput', function()
	local values = exports.CTQui:Input({
		title = 'User Profile',
		fields = {
			{ name = 'username', label = 'Username', type = 'text', description = 'Enter your username below', placeholder = 'Your name', required = true },
			{ name = 'age', label = 'Age', type = 'number', placeholder = '18', default = 18 },
			{ name = 'country', label = 'Country', type = 'select', description = 'Select your country', options = { 'Denmark', 'Germany', 'United States' } },
			{ name = 'notify', label = 'Receive notifications', type = 'toggle', default = true },
			{ name = 'volume', label = 'Volume', type = 'slider', min = 0, max = 100, default = 50 },
		},
	})
	if values then
		exports.CTQui:Notify({ title = 'Saved', description = ('%s · vol %s'):format(values.username or '?', tostring(values.volume or '?')), type = 'success' })
	else
		exports.CTQui:Notify({ description = 'Input cancelled', type = 'info' })
	end
end, false)

RegisterCommand('ctquiskill', function()
	local ok = exports.CTQui:SkillCheck({ key = 'E', durationMs = 2600, zoneDeg = 55, label = 'Skill Check' })
	exports.CTQui:Notify({ description = ok and 'Success!' or 'Failed', type = ok and 'success' or 'error' })
end, false)

RegisterCommand('ctquiradial', function()
	local v = exports.CTQui:OpenRadial({
		title = 'Actions',
		items = {
			{ label = 'Inventory', icon = '🎒', value = 'inv' },
			{ label = 'Phone', icon = '📱', value = 'phone' },
			{ label = 'Garage', icon = '🚗', value = 'garage' },
			{ label = 'Job', icon = '💼', value = 'job' },
			{ label = 'Settings', icon = '⚙️', value = 'settings' },
		},
	})
	exports.CTQui:Notify({ description = v and ('Radial: ' .. v) or 'Closed', type = 'info' })
end, false)
