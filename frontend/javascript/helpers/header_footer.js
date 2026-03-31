import { mostrarNombreUsuario, bindLogoutButtons } from '../controllers_f/AuthController.js';
import { mostrarEmergenciasHeader } from '../controllers_f/EmergenciasActivasController.js';

const ACCESSIBILITY_KEY = 's5.accessibility.v1';
const DEFAULT_PREFS = { highContrast: false, fontScale: 16 };
const MIN_FONT_SCALE = 14;
const MAX_FONT_SCALE = 20;
const ROOT_FONT_ID = 'app-font-size';

const globalState = window.__s5LayoutState || (window.__s5LayoutState = {
    initPromise: null,
    warnedStorage: false,
    iconButtonsObserver: null
});

const ICON_ONLY_CLASS_LABELS = [
    ['btn-ver', 'Ver detalle'],
    ['btn-editar', 'Editar'],
    ['btn-eliminar', 'Eliminar'],
    ['btn-desasignar-persona', 'Desasignar persona'],
    ['btn-editar-vehiculos', 'Editar vehiculos'],
    ['btn-confirmar', 'Confirmar'],
    ['btn-cancelar', 'Cancelar']
];

const ICON_ONLY_ICON_LABELS = [
    ['bi-eye', 'Ver detalle'],
    ['bi-pencil', 'Editar'],
    ['bi-pencil-square', 'Editar'],
    ['bi-trash', 'Eliminar'],
    ['bi-trash3', 'Eliminar'],
    ['bi-person-dash', 'Desasignar persona']
];

function clampFontScale(value) {
    if (!Number.isFinite(value)) {
        return DEFAULT_PREFS.fontScale;
    }

    return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, Math.round(value)));
}

function normalizePreferences(rawPrefs = {}) {
    return {
        highContrast: rawPrefs.highContrast === true,
        fontScale: clampFontScale(Number(rawPrefs.fontScale))
    };
}

function readStoredPreferencesSafely(rawPrefs) {
    const hasValidContrast = typeof rawPrefs?.highContrast === 'boolean';
    const parsedFontScale = Number(rawPrefs?.fontScale);
    const hasValidFontScale = Number.isFinite(parsedFontScale)
        && Math.round(parsedFontScale) >= MIN_FONT_SCALE
        && Math.round(parsedFontScale) <= MAX_FONT_SCALE;

    if (!hasValidContrast || !hasValidFontScale) {
        return {
            prefs: { ...DEFAULT_PREFS },
            shouldReset: true
        };
    }

    return {
        prefs: {
            highContrast: rawPrefs.highContrast,
            fontScale: Math.round(parsedFontScale)
        },
        shouldReset: false
    };
}

function getStorage() {
    try {
        return window.localStorage;
    } catch (error) {
        if (!globalState.warnedStorage) {
            console.warn('Accessibility preferences unavailable', error);
            globalState.warnedStorage = true;
        }

        return null;
    }
}

export function readAccessibilityPreferences() {
    const storage = getStorage();

    if (!storage) {
        return { ...DEFAULT_PREFS };
    }

    try {
        const saved = storage.getItem(ACCESSIBILITY_KEY);

        if (!saved) {
            return { ...DEFAULT_PREFS };
        }

        const parsedPrefs = JSON.parse(saved);
        const { prefs: safePrefs, shouldReset } = readStoredPreferencesSafely(parsedPrefs);

        if (shouldReset) {
            writeAccessibilityPreferences(safePrefs);
        }

        return safePrefs;
    } catch (error) {
        console.warn('Invalid accessibility preferences, resetting to defaults.', error);
        resetAccessibilityPreferences();
        return { ...DEFAULT_PREFS };
    }
}

export function writeAccessibilityPreferences(prefs) {
    const safePrefs = normalizePreferences(prefs);
    const storage = getStorage();

    if (!storage) {
        return safePrefs;
    }

    try {
        storage.setItem(ACCESSIBILITY_KEY, JSON.stringify(safePrefs));
    } catch (error) {
        console.warn('Could not persist accessibility preferences.', error);
    }

    return safePrefs;
}

function getAccessibilityElements(root = document) {
    const scope = root instanceof Element ? root : document;

    return {
        container: scope.querySelector('[data-accessibility-controls]'),
        contrastButton: scope.querySelector('[data-accessibility-action="contrast"]'),
        decreaseButton: scope.querySelector('[data-accessibility-action="decrease"]'),
        increaseButton: scope.querySelector('[data-accessibility-action="increase"]'),
        resetButton: scope.querySelector('[data-accessibility-action="reset"]'),
        counter: scope.querySelector('[data-accessibility-counter]')
    };
}

function syncAccessibilityUI(root, prefs) {
    const elements = getAccessibilityElements(root);

    if (!elements.container) {
        return prefs;
    }

    const counterText = `${prefs.fontScale}px`;

    if (elements.contrastButton) {
        elements.contrastButton.setAttribute('aria-pressed', String(prefs.highContrast));
        elements.contrastButton.classList.toggle('is-active', prefs.highContrast);
        elements.contrastButton.setAttribute(
            'aria-label',
            prefs.highContrast ? 'Desactivar alto contraste' : 'Activar alto contraste'
        );
    }

    if (elements.counter) {
        elements.counter.textContent = counterText;
        elements.counter.setAttribute('aria-label', `Tamano de texto actual ${counterText}`);
        elements.counter.setAttribute('aria-valuenow', String(prefs.fontScale));
        elements.counter.setAttribute('aria-valuemin', String(MIN_FONT_SCALE));
        elements.counter.setAttribute('aria-valuemax', String(MAX_FONT_SCALE));
    }

    if (elements.decreaseButton) {
        elements.decreaseButton.disabled = prefs.fontScale <= MIN_FONT_SCALE;
    }

    if (elements.increaseButton) {
        elements.increaseButton.disabled = prefs.fontScale >= MAX_FONT_SCALE;
    }

    if (elements.resetButton) {
        const isDefaultState = prefs.highContrast === DEFAULT_PREFS.highContrast
            && prefs.fontScale === DEFAULT_PREFS.fontScale;
        elements.resetButton.disabled = isDefaultState;
    }

    return prefs;
}

export function applyAccessibilityPreferences(prefs, root = document) {
    const safePrefs = normalizePreferences(prefs);
    const html = document.documentElement;
    html.id = ROOT_FONT_ID;
    html.style.fontSize = `${safePrefs.fontScale}px`;
    document.body.classList.toggle('high-contrast', safePrefs.highContrast);
    syncAccessibilityUI(root, safePrefs);
    return safePrefs;
}

function ensureAccessibilityPreferencesApplied(root = document) {
    return applyAccessibilityPreferences(readAccessibilityPreferences(), root);
}

export function resetAccessibilityPreferences(root = document) {
    const storage = getStorage();

    if (storage) {
        try {
            storage.removeItem(ACCESSIBILITY_KEY);
        } catch (error) {
            console.warn('Could not clear accessibility preferences.', error);
        }
    }

    return applyAccessibilityPreferences(DEFAULT_PREFS, root);
}

function updateAccessibilityPreferences(updater, root = document) {
    const currentPrefs = readAccessibilityPreferences();
    const nextPrefs = normalizePreferences(updater(currentPrefs));
    const storedPrefs = writeAccessibilityPreferences(nextPrefs);
    return applyAccessibilityPreferences(storedPrefs, root);
}

export function initAccessibilityControls(root = document) {
    const elements = getAccessibilityElements(root);

    if (!elements.container) {
        return null;
    }

    if (elements.container.dataset.accessibilityInitialized === 'true') {
        return ensureAccessibilityPreferencesApplied(root);
    }

    elements.container.dataset.accessibilityInitialized = 'true';

    if (elements.contrastButton) {
        elements.contrastButton.addEventListener('click', () => {
            updateAccessibilityPreferences(currentPrefs => ({
                ...currentPrefs,
                highContrast: !currentPrefs.highContrast
            }), root);
        });
    }

    if (elements.decreaseButton) {
        elements.decreaseButton.addEventListener('click', () => {
            updateAccessibilityPreferences(currentPrefs => ({
                ...currentPrefs,
                fontScale: currentPrefs.fontScale - 1
            }), root);
        });
    }

    if (elements.increaseButton) {
        elements.increaseButton.addEventListener('click', () => {
            updateAccessibilityPreferences(currentPrefs => ({
                ...currentPrefs,
                fontScale: currentPrefs.fontScale + 1
            }), root);
        });
    }

    if (elements.resetButton) {
        elements.resetButton.addEventListener('click', () => {
            resetAccessibilityPreferences(root);
        });
    }

    return ensureAccessibilityPreferencesApplied(root);
}

function getButtonVisibleText(button) {
    return button.textContent.replace(/\s+/g, ' ').trim();
}

function isIconOnlyActionButton(button) {
    if (!(button instanceof HTMLButtonElement)) {
        return false;
    }

    return getButtonVisibleText(button) === '' && Boolean(button.querySelector('i, svg, .bi'));
}

function inferIconOnlyButtonLabel(button) {
    if (button.hasAttribute('aria-label')) {
        return button.getAttribute('aria-label');
    }

    const title = button.getAttribute('title');

    if (title) {
        return title.trim();
    }

    for (const [className, label] of ICON_ONLY_CLASS_LABELS) {
        if (button.classList.contains(className)) {
            return label;
        }
    }

    const icon = button.querySelector('i');

    if (!icon) {
        return '';
    }

    for (const [className, label] of ICON_ONLY_ICON_LABELS) {
        if (icon.classList.contains(className)) {
            return label;
        }
    }

    return '';
}

function applyIconOnlyButtonAccessibility(root = document) {
    const scope = root instanceof Element || root instanceof Document ? root : document;
    const buttons = [];

    if (scope instanceof HTMLButtonElement) {
        buttons.push(scope);
    }

    if (scope.querySelectorAll) {
        buttons.push(...scope.querySelectorAll('button'));
    }

    buttons.forEach(button => {
        if (!isIconOnlyActionButton(button)) {
            return;
        }

        const label = inferIconOnlyButtonLabel(button);

        if (!label) {
            return;
        }

        if (!button.hasAttribute('aria-label')) {
            button.setAttribute('aria-label', label);
        }

        if (!button.getAttribute('title')) {
            button.setAttribute('title', label);
        }
    });
}

function initIconOnlyButtonAccessibility() {
    if (globalState.iconButtonsObserver || !document.body) {
        applyIconOnlyButtonAccessibility(document);
        return;
    }

    applyIconOnlyButtonAccessibility(document);

    globalState.iconButtonsObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    applyIconOnlyButtonAccessibility(node);
                }
            });
        });
    });

    globalState.iconButtonsObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Carga HTML en un contenedor usando getPath de config.js
async function cargarHTML(id, fileName) {
    const container = document.getElementById(id);

    if (!container) {
        return null;
    }

    try {
        const url = getPath('includes', fileName);
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`Error al cargar ${url}: ${res.status}`);
        }

        container.innerHTML = await res.text();

        container.querySelectorAll('img[data-resize]').forEach(img => {
            img.style.height = img.dataset.height || 'auto';
            img.style.width = img.dataset.width || 'auto';
        });

        if (fileName === 'header.html') {
            mostrarNombreUsuario();
            mostrarEmergenciasHeader();
            cargarFotoHeader();
        }

        if (fileName === 'sidebar.html') {
            bindLogoutButtons();
        }

        if (fileName === 'footer.html') {
            initAccessibilityControls(container);
            document.dispatchEvent(new CustomEvent('s5:footer-loaded', {
                detail: { container }
            }));
        }

        return container;
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="alert alert-danger">Error al cargar ${fileName}</div>`;
        return null;
    }
}

async function cargarFotoHeader() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');

    if (!user?.foto_perfil) {
        return;
    }

    try {
        const { API_BASE_PATH } = await import('../../config/apiConfig.js');
        const response = await fetch(`${API_BASE_PATH}/storage/fotos/${user.foto_perfil}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            return;
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const iconEl = document.querySelector('#header-placeholder .header-user .bi-person-circle');

        if (iconEl) {
            const img = document.createElement('img');
            img.src = objectUrl;
            img.alt = 'Foto de perfil';
            img.className = 'header-profile-pic';
            iconEl.replaceWith(img);
        }
    } catch (_) {
        // Si falla silenciosamente, el icono por defecto permanece
    }
}

async function initLayout() {
    if (globalState.initPromise) {
        return globalState.initPromise;
    }

    globalState.initPromise = (async () => {
        await cargarHTML('header-placeholder', 'header.html');
        await cargarHTML('sidebar-placeholder', 'sidebar.html');
        await cargarHTML('footer-placeholder', 'footer.html');
        ensureAccessibilityPreferencesApplied(document);
        initIconOnlyButtonAccessibility();
        return true;
    })();

    return globalState.initPromise;
}

window.initAccessibilityControls = initAccessibilityControls;
window.applyAccessibilityPreferences = applyAccessibilityPreferences;
window.readAccessibilityPreferences = readAccessibilityPreferences;
window.writeAccessibilityPreferences = writeAccessibilityPreferences;
window.resetAccessibilityPreferences = resetAccessibilityPreferences;
window.initLayout = initLayout;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLayout, { once: true });
} else {
    initLayout();
}
