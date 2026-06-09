/**
 * Resume Builder Pro — script.js
 * Full-featured resume builder with live preview, drag-and-drop,
 * ATS scoring, job matching, and import/export functionality.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════════════════════════ */
const STATE = {
    resumeName: 'Untitled Resume',
    savedId: null,
    currentTemplate: 'classic',
    zoom: 100,
    data: {
        personal: {},
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        achievements: [],
        leadership: [],
        languages: [],
        interests: [],
        interestsRaw: ''
    }
};

/* ═══════════════════════════════════════════════════════════════════════════
   TEMPLATES CONFIG
═══════════════════════════════════════════════════════════════════════════ */
const TEMPLATES = [
    { id: 'classic', name: 'Classic', desc: 'Timeless and professional', icon: '📋', emoji: '📋' },
    { id: 'modern', name: 'Modern', desc: 'Bold and contemporary', icon: '⚡', emoji: '⚡' },
    { id: 'minimal', name: 'Minimal', desc: 'Clean and distraction-free', icon: '◻️', emoji: '◻️' },
    { id: 'executive', name: 'Executive', desc: 'Premium gold accent style', icon: '👔', emoji: '👔' },
    { id: 'creative', name: 'Creative', desc: 'Vibrant and artistic', icon: '🎨', emoji: '🎨' },
    { id: 'tech', name: 'Tech', desc: 'Inspired by developer culture', icon: '💻', emoji: '💻' },
    { id: 'elegant', name: 'Elegant', desc: 'Refined grey tones', icon: '🥂', emoji: '🥂' },
    { id: 'bold', name: 'Bold', desc: 'High-contrast statement', icon: '🔥', emoji: '🔥' },
    { id: 'nature', name: 'Nature', desc: 'Fresh and green energy', icon: '🌿', emoji: '🌿' },
    { id: 'professional', name: 'Professional', desc: 'Corporate and reliable', icon: '🏢', emoji: '🏢' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DOM REFS
═══════════════════════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

/* ═══════════════════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    renderTemplateGrid();
    renderAllRepeatableSections();
    renderSkillTags();
    bindFormInputs();
    bindNav();
    bindSidebarActions();
    bindPreviewZoom();
    bindNameEdit();
    bindDragDrop();
    bindSectionToggles();
    updatePreview();
    bindHamburger();
    bindPreviewToggle();

    // Summary character counter
    const summaryTA = $('summary');
    if (summaryTA) {
        summaryTA.addEventListener('input', () => {
            $('summaryCount').textContent = summaryTA.value.length;
        });
        $('summaryCount').textContent = summaryTA.value.length;
    }

    // Skill input enter key
    const skillInput = $('skillInput');
    if (skillInput) {
        skillInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
        });
        $('addSkillBtn').addEventListener('click', addSkill);
    }
});

/* ═══════════════════════════════════════════════════════════════════════════
   LOCAL STORAGE
═══════════════════════════════════════════════════════════════════════════ */
const LS_KEY = 'resumeBuilderProState';

function saveToLocalStorage() {
    try {
        collectFormData();
        localStorage.setItem(LS_KEY, JSON.stringify({
            resumeName: STATE.resumeName,
            savedId: STATE.savedId,
            currentTemplate: STATE.currentTemplate,
            data: STATE.data
        }));
        flashAutosave();
    } catch (e) { /* Storage full or unavailable */ }
}

function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        Object.assign(STATE, saved);
        applyStateToForm();
    } catch (e) { /* Corrupt data */ }
}

function flashAutosave() {
    const ind = $('autosaveIndicator');
    if (!ind) return;
    ind.style.opacity = '1';
    setTimeout(() => { ind.style.opacity = '0.6'; }, 1200);
}

/* ═══════════════════════════════════════════════════════════════════════════
   FORM DATA COLLECTION
═══════════════════════════════════════════════════════════════════════════ */
function collectFormData() {
    // Personal fields
    const personalFields = ['fullName', 'title', 'email', 'phone', 'location', 'linkedin', 'github', 'portfolio'];
    personalFields.forEach(f => {
        const el = $(f);
        if (el) STATE.data.personal[f] = el.value.trim();
    });

    // Summary
    const summaryEl = $('summary');
    if (summaryEl) STATE.data.summary = summaryEl.value.trim();

    // Interests from text input
    const intEl = $('interestsInput');
    if (intEl) {
        STATE.data.interestsRaw = intEl.value;
        STATE.data.interests = intEl.value.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name }));
    }

    return STATE.data;
}

function applyStateToForm() {
    // Personal
    const personal = STATE.data.personal || {};
    ['fullName', 'title', 'email', 'phone', 'location', 'linkedin', 'github', 'portfolio'].forEach(f => {
        const el = $(f);
        if (el && personal[f] !== undefined) el.value = personal[f];
    });

    // Summary
    const summaryEl = $('summary');
    if (summaryEl) {
        summaryEl.value = STATE.data.summary || '';
        const cnt = $('summaryCount');
        if (cnt) cnt.textContent = summaryEl.value.length;
    }

    // Interests
    const intEl = $('interestsInput');
    if (intEl) intEl.value = STATE.data.interestsRaw || '';

    // Resume name
    const nameDisp = $('resumeNameDisplay');
    if (nameDisp) nameDisp.textContent = STATE.resumeName;

    // Repeatable sections
    renderAllRepeatableSections();
    renderSkillTags();

    // Template
    applyTemplate(STATE.currentTemplate, false);
}

/* ═══════════════════════════════════════════════════════════════════════════
   FORM INPUT BINDING (live update)
═══════════════════════════════════════════════════════════════════════════ */
function bindFormInputs() {
    // Bind all static inputs/textareas
    document.querySelectorAll('[data-field]').forEach(el => {
        el.addEventListener('input', () => {
            saveToLocalStorage();
            updatePreview();
        });
    });
}

let autoSaveTimer = null;
function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        saveToLocalStorage();
        updatePreview();
    }, 300);
}

/* ═══════════════════════════════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════════════════════════════ */
function bindNav() {
    $$('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const panel = btn.dataset.panel;
            $$('.panel').forEach(p => p.classList.remove('active'));
            $(`panel-${panel}`).classList.add('active');
            if (panel === 'saved') loadSavedList();
        });
    });
}

/* ═══════════════════════════════════════════════════════════════════════════
   HAMBURGER / MOBILE
═══════════════════════════════════════════════════════════════════════════ */
function bindHamburger() {
    const ham = $('hamburger');
    const sidebar = document.querySelector('.sidebar');
    if (!ham || !sidebar) return;
    ham.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', e => {
        if (!sidebar.contains(e.target) && !ham.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

/* ═══════════════════════════════════════════════════════════════════════════
   PREVIEW TOGGLE (mobile)
═══════════════════════════════════════════════════════════════════════════ */
function bindPreviewToggle() {
    const btn = $('previewToggle');
    const previewCol = document.querySelector('.preview-column');
    if (!btn || !previewCol) return;
    btn.addEventListener('click', () => {
        previewCol.classList.toggle('mobile-show');
        btn.textContent = previewCol.classList.contains('mobile-show') ? '✏️ Editor' : '👁 Preview';
    });
}

/* ═══════════════════════════════════════════════════════════════════════════
   NAME EDIT
═══════════════════════════════════════════════════════════════════════════ */
function bindNameEdit() {
    $('nameEditBtn').addEventListener('click', () => {
        $('renameInput').value = STATE.resumeName;
        $('renameModal').style.display = 'flex';
        $('renameInput').focus();
        $('renameInput').select();
    });
    $('renameCancelBtn').addEventListener('click', () => { $('renameModal').style.display = 'none'; });
    $('renameConfirmBtn').addEventListener('click', () => {
        const newName = $('renameInput').value.trim() || 'Untitled Resume';
        STATE.resumeName = newName;
        $('resumeNameDisplay').textContent = newName;
        $('renameModal').style.display = 'none';
        saveToLocalStorage();
    });
    $('renameInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') $('renameConfirmBtn').click();
        if (e.key === 'Escape') $('renameCancelBtn').click();
    });
    $('renameModal').addEventListener('click', e => {
        if (e.target === $('renameModal')) $('renameCancelBtn').click();
    });
}

/* ═══════════════════════════════════════════════════════════════════════════
   PREVIEW ZOOM
═══════════════════════════════════════════════════════════════════════════ */
function bindPreviewZoom() {
    $('zoomOut').addEventListener('click', () => setZoom(STATE.zoom - 10));
    $('zoomIn').addEventListener('click', () => setZoom(STATE.zoom + 10));
}
function setZoom(z) {
    STATE.zoom = Math.min(150, Math.max(40, z));
    document.querySelector('.resume-preview').style.transform = `scale(${STATE.zoom / 100})`;
    $('zoomLevel').textContent = `${STATE.zoom}%`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION TOGGLE (show/hide)
═══════════════════════════════════════════════════════════════════════════ */
function bindSectionToggles() {
    document.querySelectorAll('.toggle-section').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const section = btn.closest('.form-section');
            section.classList.toggle('hidden');
        });
    });
}

/* ═══════════════════════════════════════════════════════════════════════════
   DRAG-AND-DROP SECTION REORDER
═══════════════════════════════════════════════════════════════════════════ */
function bindDragDrop() {
    const list = $('sectionList');
    if (!list) return;
    let dragged = null;

    list.addEventListener('dragstart', e => {
        const sec = e.target.closest('.form-section');
        if (!sec) return;
        dragged = sec;
        sec.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    list.addEventListener('dragend', () => {
        if (dragged) { dragged.classList.remove('dragging'); dragged = null; }
        $$('.form-section.drag-over').forEach(s => s.classList.remove('drag-over'));
    });
    list.addEventListener('dragover', e => {
        e.preventDefault();
        const over = e.target.closest('.form-section');
        if (!over || over === dragged) return;
        $$('.form-section.drag-over').forEach(s => s.classList.remove('drag-over'));
        over.classList.add('drag-over');
    });
    list.addEventListener('drop', e => {
        e.preventDefault();
        const over = e.target.closest('.form-section');
        if (!over || !dragged || over === dragged) return;
        const rect = over.getBoundingClientRect();
        const after = e.clientY > rect.top + rect.height / 2;
        if (after) over.after(dragged); else over.before(dragged);
        over.classList.remove('drag-over');
        updatePreview();
    });

    // Make sections draggable via drag handle
    $$('.form-section').forEach(sec => {
        sec.setAttribute('draggable', true);
    });
}

/* ═══════════════════════════════════════════════════════════════════════════
   SKILLS
═══════════════════════════════════════════════════════════════════════════ */
function addSkill() {
    const input = $('skillInput');
    const val = input.value.trim();
    if (!val) return;
    const existing = STATE.data.skills.map(s => (typeof s === 'string' ? s : s.name).toLowerCase());
    if (existing.includes(val.toLowerCase())) { input.value = ''; return; }
    STATE.data.skills.push({ name: val });
    input.value = '';
    renderSkillTags();
    scheduleAutoSave();
    updatePreview();
}

function removeSkill(idx) {
    STATE.data.skills.splice(idx, 1);
    renderSkillTags();
    scheduleAutoSave();
    updatePreview();
}

function renderSkillTags() {
    const container = $('skillTags');
    if (!container) return;
    container.innerHTML = '';
    STATE.data.skills.forEach((s, i) => {
        const name = typeof s === 'string' ? s : s.name;
        const tag = document.createElement('div');
        tag.className = 'skill-tag';
        tag.innerHTML = `<span>${esc(name)}</span><button class="skill-tag-remove" data-idx="${i}">✕</button>`;
        container.appendChild(tag);
    });
    container.querySelectorAll('.skill-tag-remove').forEach(btn => {
        btn.addEventListener('click', () => removeSkill(+btn.dataset.idx));
    });
}

/* ═══════════════════════════════════════════════════════════════════════════
   REPEATABLE SECTIONS
═══════════════════════════════════════════════════════════════════════════ */
function renderAllRepeatableSections() {
    renderRepList('experience', renderExpItem);
    renderRepList('education', renderEduItem);
    renderRepList('projects', renderProjectItem);
    renderRepList('certifications', renderCertItem);
    renderRepList('achievements', renderAchItem);
    renderRepList('leadership', renderLeadItem);
    renderRepList('languages', renderLangItem);

    // Bind add buttons
    document.querySelectorAll('.btn-add-item').forEach(btn => {
        // Remove old listeners by cloning
        const clone = btn.cloneNode(true);
        btn.parentNode.replaceChild(clone, btn);
        clone.addEventListener('click', () => addRepItem(clone.dataset.type));
    });
}

function renderRepList(type, renderFn) {
    const container = $(`${type}List`);
    if (!container) return;
    container.innerHTML = '';
    (STATE.data[type] || []).forEach((item, idx) => {
        const el = renderFn(item, idx, type);
        container.appendChild(el);
    });
}

function addRepItem(type) {
    const defaults = {
        experience: { company: '', title: '', startDate: '', endDate: '', current: false, location: '', description: '' },
        education: { institution: '', degree: '', field: '', graduationDate: '', gpa: '' },
        projects: { name: '', technologies: '', url: '', description: '' },
        certifications: { name: '', issuer: '', date: '' },
        achievements: { description: '' },
        leadership: { role: '', organization: '', description: '' },
        languages: { name: '', level: '' },
    };
    if (!STATE.data[type]) STATE.data[type] = [];
    STATE.data[type].push({ ...(defaults[type] || {}) });
    renderRepList(type, getRendererFor(type));
    bindAddButtons();
    scheduleAutoSave();
    updatePreview();
}

function getRendererFor(type) {
    const map = {
        experience: renderExpItem, education: renderEduItem, projects: renderProjectItem,
        certifications: renderCertItem, achievements: renderAchItem,
        leadership: renderLeadItem, languages: renderLangItem
    };
    return map[type] || (() => document.createElement('div'));
}

function bindAddButtons() {
    document.querySelectorAll('.btn-add-item').forEach(btn => {
        const clone = btn.cloneNode(true);
        btn.parentNode.replaceChild(clone, btn);
        clone.addEventListener('click', () => addRepItem(clone.dataset.type));
    });
}

function removeRepItem(type, idx) {
    STATE.data[type].splice(idx, 1);
    renderRepList(type, getRendererFor(type));
    bindAddButtons();
    scheduleAutoSave();
    updatePreview();
}

/* ── Item change handler ── */
function onRepItemChange(type, idx, field, value) {
    if (!STATE.data[type][idx]) return;
    STATE.data[type][idx][field] = value;
    scheduleAutoSave();
    updatePreview();
}

/* ── Render helpers ── */
function makeRepShell(label, type, idx) {
    const div = document.createElement('div');
    div.className = 'rep-item';
    div.innerHTML = `<div class="rep-item-header"><span>${label} #${idx + 1}</span><button class="btn-remove-item" title="Remove">🗑</button></div>`;
    div.querySelector('.btn-remove-item').addEventListener('click', () => removeRepItem(type, idx));
    return div;
}

function addField(container, labelText, type, idx, field, inputType, placeholder, val) {
    const wrap = document.createElement('div');
    wrap.className = `field-group${inputType === 'textarea' ? ' full-width' : ''}`;
    const lbl = document.createElement('label');
    lbl.textContent = labelText;
    let inp;
    if (inputType === 'textarea') {
        inp = document.createElement('textarea');
        inp.rows = 3;
    } else if (inputType === 'checkbox') {
        inp = document.createElement('input');
        inp.type = 'checkbox';
        inp.checked = !!val;
        inp.style.width = 'auto';
        inp.style.marginTop = '6px';
    } else if (inputType === 'select') {
        inp = document.createElement('select');
        ['', 'Native', 'Fluent', 'Advanced', 'Intermediate', 'Beginner'].forEach(opt => {
            const o = document.createElement('option');
            o.value = opt; o.textContent = opt || '-- Select Level --';
            if (val === opt) o.selected = true;
            inp.appendChild(o);
        });
    } else {
        inp = document.createElement('input');
        inp.type = inputType || 'text';
        inp.placeholder = placeholder || '';
    }
    if (inputType !== 'checkbox' && inputType !== 'select') {
        inp.value = val || '';
        inp.placeholder = placeholder || '';
    }
    inp.addEventListener(inputType === 'checkbox' ? 'change' : 'input', () => {
        onRepItemChange(type, idx, field, inputType === 'checkbox' ? inp.checked : inp.value);
    });
    wrap.appendChild(lbl);
    wrap.appendChild(inp);
    return wrap;
}

function addGrid(container, ...fields) {
    const grid = document.createElement('div');
    grid.className = 'field-grid';
    fields.forEach(f => grid.appendChild(f));
    container.appendChild(grid);
}

function renderExpItem(item, idx, type) {
    const shell = makeRepShell('Experience', type, idx);
    const body = document.createElement('div');
    body.style.display = 'contents';
    addGrid(body,
        addField(body, 'Company', type, idx, 'company', 'text', 'Google, Amazon…', item.company),
        addField(body, 'Job Title', type, idx, 'title', 'text', 'Software Engineer', item.title),
        addField(body, 'Start Date', type, idx, 'startDate', 'month', '', item.startDate),
        addField(body, 'End Date', type, idx, 'endDate', 'month', '', item.endDate),
        addField(body, 'Location', type, idx, 'location', 'text', 'Remote / NYC', item.location),
        addField(body, 'Currently Working Here', type, idx, 'current', 'checkbox', '', item.current)
    );
    const descField = addField(body, 'Description (use bullet points)', type, idx, 'description', 'textarea', '• Led a team of…', item.description);
    descField.classList.add('full-width');
    body.appendChild(descField);
    shell.appendChild(body);
    return shell;
}

function renderEduItem(item, idx, type) {
    const shell = makeRepShell('Education', type, idx);
    const body = document.createElement('div');
    addGrid(body,
        addField(body, 'Institution', type, idx, 'institution', 'text', 'MIT, Stanford…', item.institution),
        addField(body, 'Degree', type, idx, 'degree', 'text', 'B.Sc., M.Sc.…', item.degree),
        addField(body, 'Field of Study', type, idx, 'field', 'text', 'Computer Science', item.field),
        addField(body, 'Graduation Date', type, idx, 'graduationDate', 'month', '', item.graduationDate),
        addField(body, 'GPA (optional)', type, idx, 'gpa', 'text', '3.9 / 4.0', item.gpa)
    );
    shell.appendChild(body);
    return shell;
}

function renderProjectItem(item, idx, type) {
    const shell = makeRepShell('Project', type, idx);
    const body = document.createElement('div');
    addGrid(body,
        addField(body, 'Project Name', type, idx, 'name', 'text', 'My Awesome Project', item.name),
        addField(body, 'Technologies', type, idx, 'technologies', 'text', 'React, Node, AWS', item.technologies),
        addField(body, 'Project URL', type, idx, 'url', 'text', 'github.com/…', item.url)
    );
    const descField = addField(body, 'Description', type, idx, 'description', 'textarea', '• Built a…', item.description);
    descField.classList.add('full-width');
    body.appendChild(descField);
    shell.appendChild(body);
    return shell;
}

function renderCertItem(item, idx, type) {
    const shell = makeRepShell('Certification', type, idx);
    const body = document.createElement('div');
    addGrid(body,
        addField(body, 'Certification Name', type, idx, 'name', 'text', 'AWS Certified…', item.name),
        addField(body, 'Issuing Organization', type, idx, 'issuer', 'text', 'Amazon, Google…', item.issuer),
        addField(body, 'Issue Date', type, idx, 'date', 'month', '', item.date)
    );
    shell.appendChild(body);
    return shell;
}

function renderAchItem(item, idx, type) {
    const shell = makeRepShell('Achievement', type, idx);
    const descField = addField(null, 'Description', type, idx, 'description', 'text', 'Increased revenue by 30%…', item.description);
    shell.appendChild(descField);
    return shell;
}

function renderLeadItem(item, idx, type) {
    const shell = makeRepShell('Leadership', type, idx);
    const body = document.createElement('div');
    addGrid(body,
        addField(body, 'Role', type, idx, 'role', 'text', 'President, Captain…', item.role),
        addField(body, 'Organization', type, idx, 'organization', 'text', 'Student Council…', item.organization)
    );
    const descField = addField(body, 'Description', type, idx, 'description', 'textarea', 'Led 50+ volunteers…', item.description);
    descField.classList.add('full-width');
    body.appendChild(descField);
    shell.appendChild(body);
    return shell;
}

function renderLangItem(item, idx, type) {
    const shell = makeRepShell('Language', type, idx);
    const body = document.createElement('div');
    addGrid(body,
        addField(body, 'Language', type, idx, 'name', 'text', 'English, Spanish…', item.name),
        addField(body, 'Proficiency', type, idx, 'level', 'select', '', item.level)
    );
    shell.appendChild(body);
    return shell;
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE PREVIEW RENDERER
═══════════════════════════════════════════════════════════════════════════ */
function updatePreview() {
    collectFormData();
    const preview = $('resumePreview');
    if (!preview) return;

    const d = STATE.data;
    const p = d.personal || {};
    const tpl = STATE.currentTemplate;

    // Apply template class
    preview.className = `resume-preview tpl-${tpl}`;

    let html = '';

    const hasContent = Object.values(p).some(v => v) || d.summary || d.skills.length ||
        d.experience.length || d.education.length || d.projects.length;

    if (!hasContent) {
        preview.innerHTML = `<div class="rv-empty">🖊 Start filling in your details on the left<br>to see your resume come to life here</div>`;
        return;
    }

    // ── Header ──
    html += `<div class="rv-header">`;
    if (p.fullName) html += `<div class="rv-name">${esc(p.fullName)}</div>`;
    if (p.title) html += `<div class="rv-title" style="color:var(--rv-accent)">${esc(p.title)}</div>`;

    const contactParts = [];
    if (p.email) contactParts.push(`<span>✉ ${esc(p.email)}</span>`);
    if (p.phone) contactParts.push(`<span>✆ ${esc(p.phone)}</span>`);
    if (p.location) contactParts.push(`<span>⌖ ${esc(p.location)}</span>`);
    if (p.linkedin) contactParts.push(`<span>in ${esc(p.linkedin)}</span>`);
    if (p.github) contactParts.push(`<span>⌨ ${esc(p.github)}</span>`);
    if (p.portfolio) contactParts.push(`<span>⊕ ${esc(p.portfolio)}</span>`);
    if (contactParts.length) {
        html += `<div class="rv-contact">${contactParts.join('')}</div>`;
    }
    html += `</div>`;
    html += `<hr class="rv-divider"/>`;

    // ── Summary ──
    if (d.summary) {
        html += sectionHtml('Professional Summary');
        html += `<p class="rv-paragraph">${esc(d.summary)}</p>`;
        html += `</div>`;
    }

    // ── Experience ──
    if (d.experience.length) {
        html += sectionHtml('Work Experience');
        d.experience.forEach(exp => {
            const dateStr = exp.startDate ? `${formatDate(exp.startDate)} – ${exp.current ? 'Present' : formatDate(exp.endDate)}` : '';
            html += `<div style="margin-bottom:10px">`;
            html += `<div class="rv-row"><span class="rv-company">${esc(exp.company)}</span><span class="rv-date">${esc(dateStr)}</span></div>`;
            if (exp.title) {
                const loc = exp.location ? ` — ${exp.location}` : '';
                html += `<div class="rv-subtitle">${esc(exp.title)}${esc(loc)}</div>`;
            }
            if (exp.description) {
                const lines = exp.description.split('\n').map(l => l.trim().replace(/^[•\-\*]\s*/, '')).filter(Boolean);
                if (lines.length) {
                    html += `<ul class="rv-bullets">` + lines.map(l => `<li>${esc(l)}</li>`).join('') + `</ul>`;
                }
            }
            html += `</div>`;
        });
        html += `</div>`;
    }

    // ── Education ──
    if (d.education.length) {
        html += sectionHtml('Education');
        d.education.forEach(edu => {
            const degField = [edu.degree, edu.field].filter(Boolean).join(', ');
            const gpaStr = edu.gpa ? ` | GPA: ${edu.gpa}` : '';
            html += `<div style="margin-bottom:8px">`;
            html += `<div class="rv-row"><span class="rv-company">${esc(edu.institution)}</span><span class="rv-date">${esc(formatDate(edu.graduationDate))}</span></div>`;
            if (degField) html += `<div class="rv-subtitle">${esc(degField)}${esc(gpaStr)}</div>`;
            html += `</div>`;
        });
        html += `</div>`;
    }

    // ── Skills ──
    if (d.skills.length) {
        html += sectionHtml('Skills');
        html += `<div class="rv-skills-wrap">`;
        d.skills.forEach(s => {
            const name = typeof s === 'string' ? s : s.name;
            html += `<span class="rv-skill-tag">${esc(name)}</span>`;
        });
        html += `</div></div>`;
    }

    // ── Projects ──
    if (d.projects.length) {
        html += sectionHtml('Projects');
        d.projects.forEach(proj => {
            html += `<div style="margin-bottom:10px">`;
            html += `<div class="rv-row"><span class="rv-company">${esc(proj.name)}</span>`;
            if (proj.url) html += `<span class="rv-date">${esc(proj.url)}</span>`;
            html += `</div>`;
            if (proj.technologies) html += `<div class="rv-subtitle">${esc(proj.technologies)}</div>`;
            if (proj.description) {
                const lines = proj.description.split('\n').map(l => l.trim().replace(/^[•\-\*]\s*/, '')).filter(Boolean);
                if (lines.length) html += `<ul class="rv-bullets">` + lines.map(l => `<li>${esc(l)}</li>`).join('') + `</ul>`;
            }
            html += `</div>`;
        });
        html += `</div>`;
    }

    // ── Certifications ──
    if (d.certifications.length) {
        html += sectionHtml('Certifications');
        d.certifications.forEach(cert => {
            const issuerStr = cert.issuer ? ` — ${cert.issuer}` : '';
            const dateStr = cert.date ? ` (${formatDate(cert.date)})` : '';
            html += `<div class="rv-certitem"><b>${esc(cert.name)}</b>${esc(issuerStr)}${esc(dateStr)}</div>`;
        });
        html += `</div>`;
    }

    // ── Achievements ──
    if (d.achievements.length) {
        html += sectionHtml('Achievements');
        html += `<ul class="rv-bullets">`;
        d.achievements.forEach(a => {
            const text = typeof a === 'string' ? a : a.description;
            if (text) html += `<li>${esc(text)}</li>`;
        });
        html += `</ul></div>`;
    }

    // ── Leadership ──
    if (d.leadership.length) {
        html += sectionHtml('Leadership');
        d.leadership.forEach(lead => {
            const orgStr = lead.organization ? ` — ${lead.organization}` : '';
            html += `<div style="margin-bottom:8px">`;
            html += `<div class="rv-company">${esc(lead.role)}${esc(orgStr)}</div>`;
            if (lead.description) html += `<p class="rv-paragraph" style="margin-top:2px">${esc(lead.description)}</p>`;
            html += `</div>`;
        });
        html += `</div>`;
    }

    // ── Languages ──
    if (d.languages.length) {
        html += sectionHtml('Languages');
        const langs = d.languages.map(l => l.level ? `${l.name} (${l.level})` : l.name).filter(Boolean);
        html += `<div class="rv-langitem">${esc(langs.join(' • '))}</div>`;
        html += `</div>`;
    }

    // ── Interests ──
    if (d.interests.length) {
        html += sectionHtml('Interests');
        html += `<div class="rv-certitem">${esc(d.interests.map(i => i.name || i).join(' • '))}</div>`;
        html += `</div>`;
    }

    preview.innerHTML = html;
}

function sectionHtml(title) {
    return `<div class="rv-section"><div class="rv-section-title">${esc(title)}</div>`;
}

function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const [year, month] = dateStr.split('-');
        if (!year) return dateStr;
        if (month) {
            const d = new Date(+year, +month - 1);
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        return year;
    } catch { return dateStr; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEMPLATE GRID
═══════════════════════════════════════════════════════════════════════════ */
function renderTemplateGrid() {
    const grid = $('templateGrid');
    if (!grid) return;
    grid.innerHTML = '';
    TEMPLATES.forEach(tpl => {
        const card = document.createElement('div');
        card.className = `template-card${STATE.currentTemplate === tpl.id ? ' active' : ''}`;
        card.innerHTML = `
      <div class="template-thumb tpl-thumb-${tpl.id}">
        <span style="font-size:40px;position:relative;z-index:1">${tpl.emoji}</span>
      </div>
      <div class="template-info">
        <div class="template-name">${tpl.name}</div>
        <div class="template-desc">${tpl.desc}</div>
        ${STATE.currentTemplate === tpl.id ? '<div class="template-active-badge">✓ Active</div>' : ''}
      </div>`;
        card.addEventListener('click', () => applyTemplate(tpl.id));
        grid.appendChild(card);
    });
}

function applyTemplate(tplId, save = true) {
    STATE.currentTemplate = tplId;
    updatePreview();
    if (save) {
        saveToLocalStorage();
        renderTemplateGrid();
        showToast(`✨ Template "${TEMPLATES.find(t => t.id === tplId)?.name}" applied`, 'success');
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR ACTIONS (Save / PDF / DOCX)
═══════════════════════════════════════════════════════════════════════════ */
function bindSidebarActions() {
    $('btnSave').addEventListener('click', saveToServer);
    $('btnPDF').addEventListener('click', exportPDF);
    $('btnDOCX').addEventListener('click', exportDOCX);
}

async function saveToServer() {
    collectFormData();
    const btn = $('btnSave');
    setLoading(btn, true, '💾 Save');
    try {
        const res = await fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: STATE.savedId,
                name: STATE.resumeName,
                template: STATE.currentTemplate,
                data: STATE.data
            })
        });
        const json = await res.json();
        if (json.id) {
            STATE.savedId = json.id;
            saveToLocalStorage();
            showToast('💾 Resume saved to database!', 'success');
        } else {
            showToast('❌ Save failed: ' + (json.error || 'Unknown error'), 'error');
        }
    } catch (e) {
        showToast('❌ Network error: ' + e.message, 'error');
    } finally {
        setLoading(btn, false, '💾 Save');
    }
}

async function exportPDF() {
    collectFormData();
    const btn = $('btnPDF');
    setLoading(btn, true, '📄 PDF');
    try {
        const res = await fetch('/export-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: STATE.data, template: STATE.currentTemplate })
        });
        if (!res.ok) throw new Error(await res.text());
        const blob = await res.blob();
        downloadBlob(blob, `${STATE.resumeName.replace(/\s+/g, '_')}_Resume.pdf`);
        showToast('📄 PDF exported successfully!', 'success');
    } catch (e) {
        showToast('❌ PDF export failed: ' + e.message, 'error');
    } finally {
        setLoading(btn, false, '📄 PDF');
    }
}

async function exportDOCX() {
    collectFormData();
    const btn = $('btnDOCX');
    setLoading(btn, true, '📝 DOCX');
    try {
        const res = await fetch('/export-docx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: STATE.data, template: STATE.currentTemplate })
        });
        if (!res.ok) throw new Error(await res.text());
        const blob = await res.blob();
        downloadBlob(blob, `${STATE.resumeName.replace(/\s+/g, '_')}_Resume.docx`);
        showToast('📝 DOCX exported successfully!', 'success');
    } catch (e) {
        showToast('❌ DOCX export failed: ' + e.message, 'error');
    } finally {
        setLoading(btn, false, '📝 DOCX');
    }
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

function setLoading(btn, loading, label) {
    if (loading) {
        btn.innerHTML = `<span class="spinner"></span> Loading…`;
        btn.disabled = true;
    } else {
        btn.innerHTML = label;
        btn.disabled = false;
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
   ATS SCORE
═══════════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const btn = $('btnAnalyzeATS');
    if (btn) btn.addEventListener('click', analyzeATS);

    const jobBtn = $('btnAnalyzeJob');
    if (jobBtn) jobBtn.addEventListener('click', analyzeJobMatch);
});

async function analyzeATS() {
    collectFormData();
    const btn = $('btnAnalyzeATS');
    setLoading(btn, true, '🔍 Analyze My Resume');
    try {
        const res = await fetch('/ats-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: STATE.data })
        });
        const json = await res.json();
        renderATSResults(json.score, json.breakdown);
        $('atsResults').style.display = 'block';
    } catch (e) {
        showToast('❌ ATS analysis failed: ' + e.message, 'error');
    } finally {
        setLoading(btn, false, '🔍 Analyze My Resume');
    }
}

function renderATSResults(score, breakdown) {
    // Animate score circle
    const fill = $('scoreFill');
    const circumference = 314;
    const pct = Math.min(score, 100) / 100;
    const offset = circumference * (1 - pct);

    // Color based on score
    let strokeColor, ratingText, ratingColor;
    if (score >= 80) { strokeColor = '#43e0c2'; ratingText = '🌟 Excellent'; ratingColor = '#43e0c2'; }
    else if (score >= 60) { strokeColor = '#6c63ff'; ratingText = '👍 Good'; ratingColor = '#6c63ff'; }
    else if (score >= 40) { strokeColor = '#ffa500'; ratingText = '⚠️ Fair'; ratingColor = '#ffa500'; }
    else { strokeColor = '#ff6584'; ratingText = '❌ Needs Work'; ratingColor = '#ff6584'; }

    fill.style.stroke = strokeColor;
    fill.style.strokeDashoffset = circumference; // reset
    setTimeout(() => { fill.style.strokeDashoffset = offset; }, 50);

    // Animate number
    let current = 0;
    const target = score;
    const numEl = $('scoreNumber');
    const interval = setInterval(() => {
        current = Math.min(current + 2, target);
        numEl.textContent = current;
        if (current >= target) clearInterval(interval);
    }, 20);

    $('scoreRating').textContent = ratingText;
    $('scoreRating').style.color = ratingColor;

    // Breakdown
    const breakdownEl = $('atsBreakdown');
    breakdownEl.innerHTML = '';
    (breakdown || []).forEach((cat, i) => {
        const pctCat = cat.max > 0 ? (cat.score / cat.max * 100) : 0;
        const color = pctCat >= 70 ? '#43e0c2' : pctCat >= 40 ? '#6c63ff' : '#ff6584';
        const div = document.createElement('div');
        div.className = 'ats-cat';
        div.style.animationDelay = `${i * 0.08}s`;
        div.innerHTML = `
      <div class="ats-cat-header">
        <span class="ats-cat-icon">${cat.icon}</span>
        <span class="ats-cat-name">${cat.category}</span>
        <span class="ats-cat-score">${cat.score}/${cat.max}</span>
      </div>
      <div class="ats-progress">
        <div class="ats-progress-fill" style="width:0%;background:${color}" data-target="${pctCat}"></div>
      </div>
      <div class="ats-details">
        ${(cat.details || []).map(d => `<div class="ats-detail">${esc(d)}</div>`).join('')}
      </div>`;
        breakdownEl.appendChild(div);
    });
    // Animate progress bars
    setTimeout(() => {
        breakdownEl.querySelectorAll('.ats-progress-fill').forEach(bar => {
            bar.style.width = bar.dataset.target + '%';
        });
    }, 100);
}

/* ═══════════════════════════════════════════════════════════════════════════
   JOB MATCH
═══════════════════════════════════════════════════════════════════════════ */
async function analyzeJobMatch() {
    collectFormData();
    const jd = $('jobDescInput').value.trim();
    if (!jd) { showToast('⚠️ Please paste a job description first', 'error'); return; }

    const btn = $('btnAnalyzeJob');
    setLoading(btn, true, '🎯 Analyze Match');
    try {
        const res = await fetch('/job-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: STATE.data, job_description: jd })
        });
        const json = await res.json();
        renderJobMatchResults(json);
        $('jobResults').style.display = 'block';
    } catch (e) {
        showToast('❌ Job match analysis failed: ' + e.message, 'error');
    } finally {
        setLoading(btn, false, '🎯 Analyze Match');
    }
}

function renderJobMatchResults(result) {
    const pct = result.match_percentage || 0;

    // Gauge
    const gaugeFill = $('gaugeFill');
    let gaugeColor;
    if (pct >= 70) gaugeColor = 'linear-gradient(180deg,#43e0c2,#00b894)';
    else if (pct >= 40) gaugeColor = 'linear-gradient(180deg,#6c63ff,#a29bfe)';
    else gaugeColor = 'linear-gradient(180deg,#ff6584,#d63031)';
    gaugeFill.style.background = gaugeColor;
    // Rotate semi-circle gauge
    const rotation = -90 + (pct / 100) * 180;
    gaugeFill.style.transform = `rotate(${rotation}deg)`;
    $('gaugePct').textContent = pct + '%';

    $('matchVerdict').textContent = result.recommendation || '';

    // Keywords
    const secEl = $('keywordSections');
    secEl.innerHTML = '';

    if (result.matched_keywords?.length) {
        secEl.innerHTML += keywordGroupHtml('✅ Matched Keywords', result.matched_keywords, 'matched');
    }
    if (result.missing_technical?.length) {
        secEl.innerHTML += keywordGroupHtml('🔧 Missing Technical Skills', result.missing_technical, 'missing-tech');
    }
    if (result.missing_soft_skills?.length) {
        secEl.innerHTML += keywordGroupHtml('💡 Missing Keywords', result.missing_soft_skills, 'missing');
    }
}

function keywordGroupHtml(title, keywords, cls) {
    const tags = keywords.map(k => `<span class="keyword-tag ${cls}">${esc(k)}</span>`).join('');
    return `<div class="keyword-group"><div class="keyword-group-title">${title}</div><div class="keyword-tags">${tags}</div></div>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SAVED RESUMES LIST
═══════════════════════════════════════════════════════════════════════════ */
async function loadSavedList() {
    const listEl = $('savedList');
    listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p>Loading…</p></div>';
    try {
        const res = await fetch('/resumes');
        const resumes = await res.json();
        if (!resumes.length) {
            listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">📂</div><p>No saved resumes yet.<br/>Build one and hit Save!</p></div>`;
            return;
        }
        listEl.innerHTML = '';
        resumes.forEach(r => {
            const div = document.createElement('div');
            div.className = 'saved-item';
            const updated = new Date(r.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            div.innerHTML = `
        <div class="saved-item-icon">📄</div>
        <div class="saved-item-info">
          <div class="saved-item-name">${esc(r.name)}</div>
          <div class="saved-item-meta">Template: ${esc(r.template)} · Updated ${updated}</div>
        </div>
        <div class="saved-item-actions">
          <button class="btn-icon load" title="Load" data-id="${r.id}">📂</button>
          <button class="btn-icon delete" title="Delete" data-id="${r.id}">🗑</button>
        </div>`;
            div.querySelector('.btn-icon.load').addEventListener('click', () => loadResume(r.id));
            div.querySelector('.btn-icon.delete').addEventListener('click', () => deleteResume(r.id, div));
            listEl.appendChild(div);
        });
    } catch (e) {
        listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><p>Failed to load resumes</p></div>`;
    }
}

async function loadResume(id) {
    try {
        const res = await fetch(`/load/${id}`);
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        STATE.savedId = json.id;
        STATE.resumeName = json.name;
        STATE.currentTemplate = json.template || 'classic';
        STATE.data = json.data;
        applyStateToForm();
        updatePreview();
        saveToLocalStorage();
        // Switch to builder panel
        $$('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-panel="builder"]').classList.add('active');
        $$('.panel').forEach(p => p.classList.remove('active'));
        $('panel-builder').classList.add('active');
        showToast(`📂 Loaded: ${json.name}`, 'success');
    } catch (e) {
        showToast('❌ Failed to load: ' + e.message, 'error');
    }
}

async function deleteResume(id, itemEl) {
    if (!confirm('Delete this resume? This cannot be undone.')) return;
    try {
        const res = await fetch(`/delete/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.message) {
            itemEl.style.animation = 'fadeSlideIn 0.2s ease reverse';
            setTimeout(() => itemEl.remove(), 200);
            showToast('🗑 Resume deleted', 'success');
            if (STATE.savedId === id) { STATE.savedId = null; saveToLocalStorage(); }
        }
    } catch (e) {
        showToast('❌ Delete failed: ' + e.message, 'error');
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOAST NOTIFICATION
═══════════════════════════════════════════════════════════════════════════ */
let toastTimer = null;
function showToast(msg, type = '') {
    const t = $('toast');
    t.textContent = msg;
    t.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = 'toast'; }, 3500);
}
