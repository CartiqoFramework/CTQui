# CTQui

> # ⚠️ NOT PRODUCTION-READY — DO NOT USE ON A LIVE SERVER
>
> CTQui is an early scaffold and has **not** been tested in-game. Use only on a
> throwaway test server, at your own risk, until properly tested and this notice
> is removed.

An **original**, modern NUI kit for FiveM — notifications, a text-UI prompt, and a
blocking progress bar — themable from `config.lua`. Built from scratch for CARTIQO
(not derived from any third-party UI pack).

## Components

| Export | What it does |
| ------ | ------------ |
| `Notify` | Toast notifications (`info` / `success` / `error` / `warning`) with a countdown bar. |
| `ShowTextUI` / `HideTextUI` | A keypress/interaction prompt pill. |
| `ShowControls` / `HideControls` | A persistent keybind/controls panel (`{ label, key }` rows). |
| `Progress` | A blocking progress bar with optional `icon` / `title` / `description` and a live %; returns `true` on complete, `false` on cancel. |
| `OpenRadial` | A radial (wheel) menu; returns the chosen item's `value`. |
| `OpenMenu` | A keyboard-navigable list menu; returns the chosen option's `value` (or `nil`). |
| `OpenContext` | A right-anchored context panel with titled items, right-side values, **status** indicators (`done` / `active` / `locked`) and **submenus** (Esc steps back); returns the chosen item `id`. |
| `Input` | A modal form — `text` / `number` / `password` / `select` / `checkbox` / `toggle` / `slider`, with optional per-field `description`; returns a values table keyed by field `name`. |
| `SkillCheck` | A timing minigame — press the key while the pointer is inside the zone; returns `true` (hit) or `false`. |

The interactive components take NUI focus and block until the player submits or
cancels (Esc / click-outside cancels). Only one is open at a time.

## Usage

```lua
-- Notification
exports.CTQui:Notify({ title = 'Garage', description = 'Vehicle stored.', type = 'success' })
exports.CTQui:Notify('Quick one-liner') -- string shorthand

-- Text UI
exports.CTQui:ShowTextUI('Press to open', { key = 'E' })
exports.CTQui:HideTextUI()

-- Progress (blocking) — with icon, title, description and a live %
local done = exports.CTQui:Progress({
  title = 'Initializing Hack', icon = '💻', description = 'Bypassing security…',
  duration = 5000, canCancel = true,
})
if done then exports.CTQui:Notify({ description = 'Success!', type = 'success' }) end

-- Controls panel (persistent keybind hints)
exports.CTQui:ShowControls({ title = 'Controls', items = {
  { label = 'Move Forward', key = 'W' }, { label = 'Confirm', key = 'SPACE' },
} })
exports.CTQui:HideControls()

-- Radial (wheel) menu — returns the chosen value
local picked = exports.CTQui:OpenRadial({ items = {
  { label = 'Inventory', icon = '🎒', value = 'inv' },
  { label = 'Garage', icon = '🚗', value = 'garage' },
} })

-- List menu (returns the chosen value, or nil)
local choice = exports.CTQui:OpenMenu({
  title = 'Vehicle',
  options = {
    { label = 'Lock / unlock', description = 'Toggle the doors', icon = '🔒', value = 'lock' },
    { label = 'Store vehicle', icon = '🅿️', value = 'store' },
  },
})

-- Context menu (returns the chosen item id)
local id = exports.CTQui:OpenContext({
  title = 'Garage', subtitle = 'Manage your vehicles',
  items = {
    { id = 'take', title = 'Take out vehicle', description = 'Spawn your car', icon = '🚗' },
    { id = 'soon', title = 'Transfer', disabled = true },
  },
})

-- Input dialog (returns a values table keyed by field name, or nil)
local values = exports.CTQui:Input({
  title = 'Character',
  fields = {
    { name = 'firstname', label = 'First name', type = 'text', required = true },
    { name = 'age', label = 'Age', type = 'number' },
    { name = 'gender', label = 'Gender', type = 'select', options = { 'Male', 'Female', 'Other' } },
    { name = 'notify', label = 'Receive notifications', type = 'toggle', default = true },
    { name = 'volume', label = 'Volume', type = 'slider', min = 0, max = 100, default = 50 },
  },
})

-- Skill check (timing minigame) — returns true on a hit
local hit = exports.CTQui:SkillCheck({ key = 'E', durationMs = 2600, zoneDeg = 55 })
exports.CTQui:Notify({ description = hit and 'Success!' or 'Failed', type = hit and 'success' or 'error' })
```

## Icons

Every component that shows an icon (`Notify`, menu/context items, `OpenRadial`,
`Progress`, …) takes an **`icon`** string. CTQui auto-detects what you pass — so
icons are set per-call through the export, never hardcoded:

| You pass | Renders as | Example |
| -------- | ---------- | ------- |
| An **emoji** | text glyph | `icon = '🚗'` |
| A **Font Awesome** class | `<i class="…">` | `icon = 'fa-solid fa-car'` |
| An **image URL / path** | `<img>` | `icon = 'https://…/badge.png'` or `'nui://myres/img/x.png'` |

Detection rule: the string contains `fa-` → Font Awesome; it's a URL or ends in
`.png/.jpg/.gif/.svg/.webp` → image; otherwise → emoji/text.

### Adding or changing an icon

Just change the string you pass — no edits to CTQui needed:

```lua
exports.CTQui:Notify({ title = 'Garage', description = 'Stored', icon = 'fa-solid fa-warehouse' })
exports.CTQui:OpenContext({ title = 'Phone', items = {
  { id = 'msgs', title = 'Messages', icon = 'fa-solid fa-message' },
  { id = 'bank', title = 'Bank',     icon = '💳' },                     -- emoji
  { id = 'app',  title = 'My App',   icon = 'nui://myresource/ui/app.png' }, -- image
} })
```

### Font Awesome setup

Browse icons at **https://fontawesome.com/icons** and copy the **full class** shown
for each icon (e.g. `fa-solid fa-house`, `fa-brands fa-discord`). Free icons work
out of the box; **Pro** icons need your own Pro kit (point `Config.FontAwesomeUrl`
at it).

`Config.FontAwesomeUrl` (in `config.lua`) controls the stylesheet:

- **Default** — loads Font Awesome Free from a CDN (needs internet on the client).
- **Self-host (recommended for production):** download Font Awesome Free, drop its
  `css/` + `webfonts/` into `web/fontawesome/`, add those files to `fxmanifest.lua`
  (`files { 'web/fontawesome/**' }`), and set
  `Config.FontAwesomeUrl = 'fontawesome/css/all.min.css'`.
- **Disable entirely:** set `Config.FontAwesomeUrl = false` (emoji + image icons
  still work).

## Theming

Edit `config.lua` → `Config.Theme` (accent colours, corner radius, font) and
`Config.NotifyPosition` (`top-right` | `top-left` | `bottom-right` | `bottom-left`
| `top-center`). The theme is pushed into the NUI on resource start — pure CSS
variables, so one place restyles everything.

## Demo

In-game: `/ctqui notify success`, `/ctqui textui`, `/ctqui progress`,
`/ctqui controls`, `/ctquimenu`, `/ctquicontext`, `/ctquiinput`, `/ctquiskill`,
`/ctquiradial`.

## Install

Drop `CTQui` into `resources/`, add `ensure CTQui` to `server.cfg`, then call the
exports from any resource. No dependencies.
