fx_version 'cerulean'
game 'gta5'

name 'CTQui'
author 'CARTIQO'
description 'CTQui — an original, modern NUI kit for FiveM: notifications, progress bars and text UI.'
version '0.1.0'

ui_page 'web/index.html'

shared_script 'config.lua'
client_scripts {
	'client/main.lua',
	'client/interactive.lua',
}

files {
	'web/index.html',
	'web/style.css',
	'web/script.js',
}
