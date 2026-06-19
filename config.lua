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

Config.Debug = false
