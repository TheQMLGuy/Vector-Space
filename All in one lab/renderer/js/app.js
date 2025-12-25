/**
 * QAGI Lab - Main Application
 * Entry point for the renderer process
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('QAGI Lab initializing...');

    // Check if libraries are loaded
    if (typeof math === 'undefined') {
        console.warn('Math.js not loaded from node_modules, loading from CDN...');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.2.1/math.min.js');
    }

    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded from node_modules, loading from CDN...');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js');
    }

    if (typeof Plotly === 'undefined') {
        console.warn('Plotly not loaded from node_modules, loading from CDN...');
        await loadScript('https://cdn.plot.ly/plotly-2.27.1.min.js');
    }

    // Configure Chart.js defaults
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
        Chart.defaults.font.family = 'Inter, sans-serif';
    }

    // Initialize tab manager
    tabManager = new TabManager();

    // Initialize integration panel (Data Hub UI)
    if (window.IntegrationPanel) {
        IntegrationPanel.init();
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Log version info
    if (window.versions) {
        console.log(`Running on Electron ${window.versions.electron()}`);
        console.log(`Node ${window.versions.node()}`);
        console.log(`Chrome ${window.versions.chrome()}`);
    }

    console.log('QAGI Lab initialized successfully!');
});

/**
 * Load a script dynamically
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + number to switch tabs
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '8') {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        const tabs = ['electrical', 'quantum', 'matrices', 'calculus', 'complex', 'statistics', 'bitwise', 'neuroscience'];
        if (tabs[tabIndex]) {
            tabManager.switchTab(tabs[tabIndex]);
        }
    }

    // Ctrl/Cmd + R to refresh current tab (for development)
    if ((e.ctrlKey || e.metaKey) && e.key === 'r' && !e.shiftKey) {
        // Let Electron handle the refresh
    }
}

/**
 * Global error handler
 */
window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error('Global error:', { msg, url, lineNo, columnNo, error });
    return false;
};

/**
 * Unhandled promise rejection handler
 */
window.onunhandledrejection = function (event) {
    console.error('Unhandled promise rejection:', event.reason);
};
