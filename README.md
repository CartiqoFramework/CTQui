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
| `Progress` | A blocking progress bar; returns `true` on complete, `false` on cancel. |

## Usage

```lua
-- Notification
exports.CTQui:Notify({ title = 'Garage', description = 'Vehicle stored.', type = 'success' })
exports.CTQui:Notify('Quick one-liner') -- string shorthand

-- Text UI
exports.CTQui:ShowTextUI('Press to open', { key = 'E' })
exports.CTQui:HideTextUI()

-- Progress (blocking)
local done = exports.CTQui:Progress({ label = 'Lockpicking…', duration = 5000, canCancel = true })
if done then exports.CTQui:Notify({ description = 'Success!', type = 'success' }) end
```

## Theming

Edit `config.lua` → `Config.Theme` (accent colours, corner radius, font) and
`Config.NotifyPosition` (`top-right` | `top-left` | `bottom-right` | `bottom-left`
| `top-center`). The theme is pushed into the NUI on resource start — pure CSS
variables, so one place restyles everything.

## Demo

In-game: `/ctqui notify success`, `/ctqui textui`, `/ctqui progress`.

## Install

Drop `CTQui` into `resources/`, add `ensure CTQui` to `server.cfg`, then call the
exports from any resource. No dependencies.
