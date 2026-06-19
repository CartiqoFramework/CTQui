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
		overlay: document.getElementById('ctqui-overlay'),
		controls: document.getElementById('ctqui-controls'),
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
	let progressRAF = null;
	function progressStart(d) {
		clearTimeout(progressTimer);
		if (progressRAF) cancelAnimationFrame(progressRAF);
		const duration = Number(d.duration) || 3000;

		// Build the bar: icon + title + description + live percentage.
		els.progress.innerHTML = '';
		const top = el('div', 'ctqui-progress-top');
		if (d.icon) top.appendChild(el('div', 'ctqui-progress-icon', d.icon));
		const main = el('div', 'ctqui-progress-main');
		main.appendChild(el('div', 'ctqui-progress-title', d.title || d.label || 'Please wait'));
		if (d.description) main.appendChild(el('div', 'ctqui-progress-desc', d.description));
		top.appendChild(main);
		const pct = el('div', 'ctqui-progress-percent', '0%');
		top.appendChild(pct);
		els.progress.appendChild(top);

		const track = el('div', 'ctqui-progress-track');
		const fill = el('div', 'ctqui-progress-fill');
		track.appendChild(fill);
		els.progress.appendChild(track);

		if (d.canCancel !== false) {
			const foot = el('div', 'ctqui-progress-foot');
			foot.appendChild(el('span', 'ctqui-progress-cancel', '[X] cancel'));
			els.progress.appendChild(foot);
		}

		els.progress.classList.remove('hidden');
		fill.style.transition = `width ${duration}ms linear`;
		void fill.offsetWidth;
		fill.style.width = '100%';

		const start = performance.now();
		(function tickPct(now) {
			const p = Math.min(100, Math.round((((now || start) - start) / duration) * 100));
			pct.textContent = p + '%';
			if (p < 100) progressRAF = requestAnimationFrame(tickPct);
		})(start);

		progressTimer = setTimeout(() => {
			els.progress.classList.add('hidden');
			post('progress:done', {});
		}, duration);
	}
	function progressCancel() {
		clearTimeout(progressTimer);
		if (progressRAF) cancelAnimationFrame(progressRAF);
		els.progress.classList.add('hidden');
	}

	// ── Controls panel (persistent keybind hints) ──────────────────────────────
	function showControls(d) {
		els.controls.innerHTML = '';
		const h = el('div', 'ctqui-controls-head');
		h.appendChild(el('div', 'ctqui-controls-title', d.title || 'Controls'));
		if (d.subtitle) h.appendChild(el('div', 'ctqui-controls-sub', d.subtitle));
		els.controls.appendChild(h);
		const list = el('div', 'ctqui-controls-list');
		(d.items || []).forEach((it) => {
			const r = el('div', 'ctqui-control-row');
			r.appendChild(el('span', null, it.label || ''));
			r.appendChild(el('span', 'ctqui-key', String(it.key || '')));
			list.appendChild(r);
		});
		els.controls.appendChild(list);
		els.controls.classList.remove('hidden');
	}
	function hideControls() {
		els.controls.classList.add('hidden');
	}

	// ── Overlay components (menu / context / input / skillcheck) ───────────────
	let menuOptions = [];
	let menuActive = 0;
	let contextStack = [];
	let skillRAF = null;

	function el(tag, cls, text) {
		const e = document.createElement(tag);
		if (cls) e.className = cls;
		if (text != null) e.textContent = text;
		return e;
	}
	function head(title, sub) {
		const h = el('div', 'ctqui-panel-head');
		h.appendChild(el('div', 'ctqui-panel-title', title || ''));
		if (sub) h.appendChild(el('div', 'ctqui-panel-sub', sub));
		return h;
	}
	function showOverlay(panel, anchorRight) {
		els.overlay.innerHTML = '';
		els.overlay.classList.toggle('anchor-right', !!anchorRight);
		els.overlay.appendChild(panel);
		els.overlay.classList.remove('hidden');
		const first = panel.querySelector('input, select');
		if (first) setTimeout(() => first.focus(), 30);
	}
	function clearOverlay() {
		els.overlay.classList.add('hidden');
		els.overlay.classList.remove('anchor-right');
		els.overlay.innerHTML = '';
		menuOptions = [];
		contextStack = [];
		if (skillRAF) cancelAnimationFrame(skillRAF);
		skillRAF = null;
	}
	function submit(value) { clearOverlay(); post('ui:submit', { value }); }
	function cancel() { clearOverlay(); post('ui:cancel', {}); }

	function setMenuActive(i) {
		menuActive = i;
		els.overlay.querySelectorAll('.ctqui-panel-list .ctqui-row').forEach((r, idx) => r.classList.toggle('active', idx === i));
	}

	function row(icon, label, desc, arrow) {
		const r = el('button', 'ctqui-row');
		r.type = 'button';
		if (icon) r.appendChild(el('span', 'ctqui-row-icon', icon));
		const body = el('div', 'ctqui-row-body');
		body.appendChild(el('div', 'ctqui-row-label', label || ''));
		if (desc) body.appendChild(el('div', 'ctqui-row-desc', desc));
		r.appendChild(body);
		if (arrow) r.appendChild(el('span', 'ctqui-row-arrow', '›'));
		return r;
	}

	function openMenu(d) {
		menuOptions = d.options || [];
		menuActive = 0;
		const panel = el('div', 'ctqui-panel');
		panel.appendChild(head(d.title || 'Menu'));
		const list = el('div', 'ctqui-panel-list');
		menuOptions.forEach((o, i) => {
			const r = row(o.icon, o.label, o.description, false);
			r.onclick = () => submit(o.value);
			r.onmouseenter = () => setMenuActive(i);
			list.appendChild(r);
		});
		panel.appendChild(list);
		showOverlay(panel);
		setMenuActive(0);
	}

	function renderContext(level) {
		const panel = el('div', 'ctqui-panel');
		const h = el('div', 'ctqui-panel-head');
		if (contextStack.length > 1) {
			const back = el('button', 'ctqui-back', '‹');
			back.type = 'button';
			back.onclick = () => {
				contextStack.pop();
				renderContext(contextStack[contextStack.length - 1]);
			};
			h.appendChild(back);
		}
		h.appendChild(el('div', 'ctqui-panel-title', level.title || 'Menu'));
		if (level.subtitle) h.appendChild(el('div', 'ctqui-panel-sub', level.subtitle));
		panel.appendChild(h);

		const list = el('div', 'ctqui-panel-list');
		(level.items || []).forEach((it) => {
			const r = row(it.icon, it.title, it.description, false);
			if (it.status) {
				const glyph = it.status === 'done' ? '✓' : it.status === 'locked' ? '🔒' : '●';
				r.appendChild(el('span', 'ctqui-row-status ' + it.status, glyph));
			}
			if (it.value != null) r.appendChild(el('span', 'ctqui-row-value', String(it.value)));
			if (it.menu) r.appendChild(el('span', 'ctqui-row-arrow', '›'));
			if (it.disabled) {
				r.classList.add('disabled');
			} else {
				r.onclick = () => {
					if (it.menu) {
						contextStack.push(it.menu);
						renderContext(it.menu);
					} else {
						submit(it.id);
					}
				};
			}
			list.appendChild(r);
		});
		panel.appendChild(list);
		showOverlay(panel, true);
	}

	function openContext(d) {
		menuOptions = [];
		contextStack = [d];
		renderContext(d);
	}

	function openInput(d) {
		menuOptions = [];
		const panel = el('div', 'ctqui-panel');
		panel.appendChild(head(d.title || 'Input'));
		const form = el('form', 'ctqui-form');
		const desc = (f) => (f.description ? el('div', 'ctqui-field-desc', f.description) : null);
		(d.fields || []).forEach((f, i) => {
			const t = f.type || 'text';
			const wrap = el('div', 'ctqui-field');
			let input;

			if (t === 'toggle') {
				const r = el('div', 'ctqui-toggle-row');
				r.appendChild(labelFor(f));
				input = el('div', 'ctqui-switch' + (f.default ? ' on' : ''));
				input.onclick = () => input.classList.toggle('on');
				r.appendChild(input);
				wrap.appendChild(r);
				const dd = desc(f);
				if (dd) wrap.appendChild(dd);
			} else if (t === 'slider') {
				wrap.appendChild(labelFor(f));
				const dd = desc(f);
				if (dd) wrap.appendChild(dd);
				const sRow = el('div', 'ctqui-slider-row');
				input = el('input', 'ctqui-slider');
				input.type = 'range';
				input.min = f.min != null ? f.min : 0;
				input.max = f.max != null ? f.max : 100;
				input.step = f.step != null ? f.step : 1;
				input.value = f.default != null ? f.default : input.min;
				const suffix = f.suffix != null ? f.suffix : '%';
				const val = el('div', 'ctqui-slider-val', input.value + suffix);
				input.oninput = () => (val.textContent = input.value + suffix);
				sRow.append(input, val);
				wrap.appendChild(sRow);
			} else if (t === 'select') {
				wrap.appendChild(labelFor(f));
				const dd = desc(f);
				if (dd) wrap.appendChild(dd);
				input = el('select', 'ctqui-select');
				(f.options || []).forEach((opt) => {
					const o = el('option', null, String(opt));
					o.value = String(opt);
					input.appendChild(o);
				});
				wrap.appendChild(input);
			} else if (t === 'checkbox') {
				const lab = el('label', 'ctqui-check');
				input = document.createElement('input');
				input.type = 'checkbox';
				input.checked = !!f.default;
				lab.appendChild(input);
				lab.appendChild(document.createTextNode(' ' + (f.label || f.name || '')));
				wrap.appendChild(lab);
				const dd = desc(f);
				if (dd) wrap.appendChild(dd);
			} else {
				wrap.appendChild(labelFor(f));
				const dd = desc(f);
				if (dd) wrap.appendChild(dd);
				input = el('input', 'ctqui-input');
				input.type = t === 'number' ? 'number' : t === 'password' ? 'password' : 'text';
				if (f.placeholder) input.placeholder = f.placeholder;
				if (f.default != null) input.value = String(f.default);
				wrap.appendChild(input);
			}

			input.dataset.name = f.name || 'field' + i;
			input.dataset.ftype = t;
			if (f.required) input.dataset.required = '1';
			form.appendChild(wrap);
		});

		const foot = el('div', 'ctqui-panel-foot');
		const cancelBtn = el('button', 'ctqui-btn', 'Cancel');
		cancelBtn.type = 'button';
		cancelBtn.onclick = cancel;
		const okBtn = el('button', 'ctqui-btn primary', 'Confirm');
		okBtn.type = 'submit';
		foot.append(cancelBtn, okBtn);
		form.appendChild(foot);

		form.onsubmit = (e) => {
			e.preventDefault();
			const values = {};
			let valid = true;
			form.querySelectorAll('[data-name]').forEach((inp) => {
				const ft = inp.dataset.ftype;
				let v;
				if (ft === 'checkbox') v = inp.checked;
				else if (ft === 'toggle') v = inp.classList.contains('on');
				else if (ft === 'number' || ft === 'slider') v = inp.value === '' ? null : Number(inp.value);
				else v = inp.value;
				const empty = v === '' || v == null;
				if (inp.dataset.required && empty) {
					inp.classList.add('invalid');
					valid = false;
				} else {
					inp.classList.remove('invalid');
				}
				values[inp.dataset.name] = v;
			});
			if (valid) submit(values);
		};

		panel.appendChild(form);
		showOverlay(panel);
	}

	function labelFor(f) {
		const lab = el('label', null, f.label || f.name || '');
		if (f.required) lab.appendChild(el('span', 'req', ' *'));
		return lab;
	}

	// ── Skill check (timing minigame) ──────────────────────────────────────────
	function openSkillCheck(d) {
		menuOptions = [];
		const key = String(d.key || 'E');
		const zoneDeg = Math.max(20, Math.min(140, d.zoneDeg || 55));
		const duration = d.durationMs || 2600;
		const zoneStart = Math.random() * (360 - zoneDeg);
		const C = 2 * Math.PI * 66;

		const wrap = el('div', 'ctqui-skill');
		wrap.appendChild(el('div', 'ctqui-skill-title', d.label || 'Skill Check'));
		const ring = el('div', 'ctqui-skill-ring');
		ring.innerHTML =
			'<svg viewBox="0 0 150 150">' +
			'<circle class="ctqui-skill-track" cx="75" cy="75" r="66"></circle>' +
			`<circle class="ctqui-skill-zone" cx="75" cy="75" r="66" stroke-dasharray="${(zoneDeg / 360) * C} ${C}" stroke-dashoffset="${-(zoneStart / 360) * C}"></circle>` +
			`<circle class="ctqui-skill-pointer" id="ctqui-skill-pointer" cx="75" cy="75" r="66" stroke-dasharray="${(4 / 360) * C} ${C}" style="transform-origin:75px 75px"></circle>` +
			'</svg>';
		ring.appendChild(el('div', 'ctqui-skill-key', key.toUpperCase()));
		wrap.appendChild(ring);
		wrap.appendChild(el('div', 'ctqui-skill-hint', `Press ${key.toUpperCase()} inside the zone`));
		showOverlay(wrap);

		const pointer = document.getElementById('ctqui-skill-pointer');
		const start = performance.now();
		const loopMs = duration * 0.55; // time for one full rotation
		let angle = 0;
		let finished = false;

		function finish(win) {
			if (finished) return;
			finished = true;
			if (skillRAF) cancelAnimationFrame(skillRAF);
			skillRAF = null;
			document.removeEventListener('keydown', onKey, true);
			wrap.classList.add(win ? 'win' : 'lose');
			setTimeout(() => {
				clearOverlay();
				post('ui:submit', { value: win });
			}, 350);
		}
		function inZone() {
			const a = ((angle % 360) + 360) % 360;
			const end = zoneStart + zoneDeg;
			return (a >= zoneStart && a <= end) || (end > 360 && a <= end - 360);
		}
		function onKey(e) {
			const k = e.key.toLowerCase();
			if (k === key.toLowerCase() || k === ' ' || k === 'enter') {
				e.preventDefault();
				e.stopPropagation();
				finish(inZone());
			} else if (k === 'escape') {
				e.preventDefault();
				e.stopPropagation();
				finish(false);
			}
		}
		document.addEventListener('keydown', onKey, true);

		function tick(now) {
			angle = ((now - start) / loopMs) * 360;
			pointer.style.transform = `rotate(${angle}deg)`;
			if (now - start >= duration) return finish(false);
			skillRAF = requestAnimationFrame(tick);
		}
		skillRAF = requestAnimationFrame(tick);
	}

	// ── Radial (wheel) menu ────────────────────────────────────────────────────
	function openRadial(d) {
		menuOptions = [];
		const items = d.items || [];
		const wrap = el('div', 'ctqui-radial');
		const cx = 150;
		const cy = 150;
		const r = 110;
		items.forEach((it, i) => {
			const ang = (-90 + (i * 360) / items.length) * (Math.PI / 180);
			const item = el('button', 'ctqui-radial-item');
			item.type = 'button';
			item.style.left = cx + r * Math.cos(ang) + 'px';
			item.style.top = cy + r * Math.sin(ang) + 'px';
			item.appendChild(el('div', 'ctqui-radial-icon', it.icon || '•'));
			item.appendChild(el('div', 'ctqui-radial-label', it.label || ''));
			item.onclick = () => submit(it.value);
			wrap.appendChild(item);
		});
		const center = el('button', 'ctqui-radial-center');
		center.type = 'button';
		center.appendChild(el('small', null, '✕'));
		center.onclick = cancel;
		wrap.appendChild(center);
		showOverlay(wrap);
	}

	// Backdrop click + keyboard (Escape to cancel/back, arrows/Enter for the list menu).
	els.overlay.addEventListener('mousedown', (e) => {
		if (e.target === els.overlay) cancel();
	});
	document.addEventListener('keydown', (e) => {
		if (els.overlay.classList.contains('hidden')) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			// In a context submenu, Escape steps back one level instead of closing.
			if (contextStack.length > 1) {
				contextStack.pop();
				renderContext(contextStack[contextStack.length - 1]);
			} else {
				cancel();
			}
			return;
		}
		if (menuOptions.length === 0) return; // arrows only drive the list menu
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setMenuActive(Math.min(menuOptions.length - 1, menuActive + 1));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setMenuActive(Math.max(0, menuActive - 1));
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const o = menuOptions[menuActive];
			if (o) submit(o.value);
		}
	});

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
			case 'menu:open': return openMenu(data);
			case 'context:open': return openContext(data);
			case 'input:open': return openInput(data);
			case 'skillcheck:open': return openSkillCheck(data);
			case 'radial:open': return openRadial(data);
			case 'controls:show': return showControls(data);
			case 'controls:hide': return hideControls();
			case 'ui:close': return clearOverlay();
		}
	});
})();
