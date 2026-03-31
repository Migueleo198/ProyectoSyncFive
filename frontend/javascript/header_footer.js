(function () {
    if (window.__s5LegacyAccessibilityWrapperLoaded) {
        return;
    }

    window.__s5LegacyAccessibilityWrapperLoaded = true;

    function tryInitAccessibility(container) {
        if (typeof window.initAccessibilityControls !== 'function') {
            return;
        }

        window.initAccessibilityControls(container || document);
    }

    function handleFooterLoaded(event) {
        tryInitAccessibility(event.detail && event.detail.container);
    }

    document.addEventListener('s5:footer-loaded', handleFooterLoaded);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            tryInitAccessibility(document.getElementById('footer-placeholder') || document);
        }, { once: true });
    } else {
        tryInitAccessibility(document.getElementById('footer-placeholder') || document);
    }
})();
