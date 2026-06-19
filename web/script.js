// CTQui NUI controller — receives messages from the client Lua and renders the
// notification stack, text-UI prompt and progress bar. Original implementation.
(function () {
	'use strict';

	const root = document.documentElement;
	const els = {
		notifications: document.getElementById('ctqui-notifications'),
		textui: document.getElementById('ctqui-textui'),
		textuiKey: document.getElementById('ctqui-textui-key'),
		textuiText: document.getElementById('ctqui-textui-text'),
		progress: document.getElementById('ctqui-progress'),
		progressLabel: document.getElementById('ctqui-progress-label'),
		progressFill: document.getElementById('ctqui-progress-fill'),
		progressCancel: document.getElementById('ctqui-progress-cancel'),
	};

	const NOTIFY_GLYPH = { info: 'i', success: '✓', error: '!', warning: '!' };

	function resourceName() {
		return typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'CTQui';
	}
	function post(endpoint, body) {
		fetch(`https://${resourceName()}/${endpoint}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json; charset=UTF-8' },
			body: JSON.stringify(body || {}),
		}).catch(() => {});
	}

	// ── Config / theming ─────────────────────────────────────────────────────
	function applyConfig(data) {
		const t = data.theme || {};
		if (t.accent) root.style.setProperty('--ctqui-accent', t.accent);
		if (t.accent2) root.style.setProperty('--ctqui-accent2', t.accent2);
		if (t.radius) root.style.setProperty('--ctqui-radius', t.radius);
		if (t.font) root.style.setProperty('--ctqui-font', t.font);
		if (data.notifyPosition) {
			els.notifications.className = 'pos-' + data.notifyPosition;
		}
	}

	// ── Notifications ──────────────────────────────────────────────────────────
	function notify(d) {
		const type = ['info', 'success', 'error', 'warning'].includes(d.type) ? d.type : 'info';
		const duration = Number(d.duration) || 4000;

		const toast = document.createElement('div');
		toast.className = `ctqui-toast ${type}`;

		const icon = document.createElement('div');
		icon.className = 'ctqui-toast-icon';
		icon.textContent = d.icon || NOTIFY_GLYPH[type];

		const body = document.createElement('div');
		body.className = 'ctqui-toast-body';
		if (d.title) {
			const title = document.createElement('div');
			title.className = 'ctqui-toast-title';
			title.textContent = d.title;
			body.appendChild(title);
		}
		const desc = document.createElement('div');
		desc.className = 'ctqui-toast-desc';
		desc.textContent = d.description || '';
		body.appendChild(desc);

		const bar = document.createElement('div');
		bar.className = 'ctqui-toast-bar';
		bar.style.transition = `transform ${duration}ms linear`;

		toast.append(icon, body, bar);
		els.notifications.appendChild(toast);

		// Kick off the countdown bar.
		requestAnimationFrame(() => {
			bar.style.transform = 'scaleX(0)';
		});

		const remove = () => {
			toast.classList.add('leaving');
			toast.addEventListener('animationend', () => toast.remove(), { once: true });
		};
		setTimeout(remove, duration);
	}

	// ── Text UI ──────────────────────────────────────────────────────────────
	function showTextUI(d) {
		els.textuiKey.textContent = d.key || '';
		els.textuiText.textContent = d.text || '';
		els.textui.classList.remove('hidden');
	}
	function hideTextUI() {
		els.textui.classList.add('hidden');
	}

	// ── Progress bar ───────────────────────────────────────────────────────────
	let progressTimer = null;
	function progressStart(d) {
		clearTimeout(progressTimer);
		els.progressLabel.textContent = d.label || 'Please wait';
		els.progressCancel.classList.toggle('hidden', d.canCancel === false);
		els.progress.classList.remove('hidden');

		const fill = els.progressFill;
		fill.style.transition = 'none';
		fill.style.width = '0%';
		// Force reflow so the transition restarts cleanly.
		void fill.offsetWidth;
		fill.style.transition = `width ${Number(d.duration) || 3000}ms linear`;
		fill.style.width = '100%';

		progressTimer = setTimeout(() => {
			els.progress.classList.add('hidden');
			post('progress:done', {});
		}, Number(d.duration) || 3000);
	}
	function progressCancel() {
		clearTimeout(progressTimer);
		els.progress.classList.add('hidden');
	}

	// ── Message router ─────────────────────────────────────────────────────────
	window.addEventListener('message', (event) => {
		const msg = event.data || {};
		const data = msg.data || {};
		switch (msg.action) {
			case 'config': return applyConfig(data);
			case 'notify': return notify(data);
			case 'textui:show': return showTextUI(data);
			case 'textui:hide': return hideTextUI();
			case 'progress:start': return progressStart(data);
			case 'progress:cancel': return progressCancel();
		}
	});
})();
