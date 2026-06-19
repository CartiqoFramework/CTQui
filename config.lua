Config = {}

-- Theme is sent to the NUI on resource start. Pure CSS variables — restyle the
-- whole kit from here.
Config.Theme = {
	accent = '#a855f7', -- primary accent (CARTIQO purple)
	accent2 = '#7c3aed', -- gradient partner
	radius = '14px', -- corner rounding
	font = 'Inter, "Segoe UI", system-ui, sans-serif',
}

-- Where toast notifications stack: 'top-right' | 'top-left' | 'bottom-right' |
-- 'bottom-left' | 'top-center'.
Config.NotifyPosition = 'top-right'

-- Default notification lifetime (ms).
Config.NotifyDuration = 4000

-- Icons. Any component's `icon` field accepts an emoji ('🚗'), a Font Awesome
-- class ('fa-solid fa-car') or an image URL/path. This is the stylesheet used for
-- Font Awesome classes. Swap it to self-host (recommended — see README), or set
-- to false to disable Font Awesome entirely (emoji + images still work).
Config.FontAwesomeUrl = 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css'

Config.Debug = false
