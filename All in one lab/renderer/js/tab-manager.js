/**
 * QAGI Lab - Tab Manager
 * Handles dynamic tab loading and switching
 */

class TabManager {
    constructor() {
        this.currentTab = null;
        this.tabs = {};
        this.tabModules = {};
        this.contentContainer = document.getElementById('tab-content');
        this.navItems = document.querySelectorAll('.nav-item');

        this.init();
    }

    init() {
        // Register all tabs
        this.registerTabs();

        // Set up navigation listeners
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabId = item.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Load default tab
        const defaultTab = document.querySelector('.nav-item.active');
        if (defaultTab) {
            this.switchTab(defaultTab.dataset.tab);
        }
    }

    registerTabs() {
        this.tabs = {
            neuralnet: {
                name: 'Neural Network',
                icon: '🕸️',
                module: null,
                loaded: false
            },
            electrical: {
                name: 'Electrical Circuits',
                icon: '⚡',
                module: null,
                loaded: false
            },
            quantum: {
                name: 'Quantum Circuits',
                icon: '🔮',
                module: null,
                loaded: false
            },
            matrices: {
                name: 'Matrices & Vectors',
                icon: '📊',
                module: null,
                loaded: false
            },
            calculus: {
                name: 'Calculus & Graphs',
                icon: '📈',
                module: null,
                loaded: false
            },
            complex: {
                name: 'Complex Numbers',
                icon: '🌀',
                module: null,
                loaded: false
            },
            statistics: {
                name: 'Statistics & Probability',
                icon: '🎲',
                module: null,
                loaded: false
            },
            bitwise: {
                name: 'Bitwise Analysis',
                icon: '💾',
                module: null,
                loaded: false
            },
            neuroscience: {
                name: 'Neuroscience',
                icon: '🧠',
                module: null,
                loaded: false
            }
        };
    }

    async switchTab(tabId) {
        if (this.currentTab === tabId) return;

        // Update navigation UI
        this.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabId);
        });

        // Clean up previous tab if needed
        if (this.currentTab && this.tabs[this.currentTab].module) {
            if (typeof this.tabs[this.currentTab].module.cleanup === 'function') {
                this.tabs[this.currentTab].module.cleanup();
            }
        }

        // Show loading state
        this.contentContainer.innerHTML = `
            <div class="empty-state">
                <div class="spinner"></div>
                <p style="margin-top: 16px; color: var(--text-muted);">Loading ${this.tabs[tabId].name}...</p>
            </div>
        `;

        // Load tab content
        try {
            await this.loadTab(tabId);
            this.currentTab = tabId;
        } catch (error) {
            console.error(`Error loading tab ${tabId}:`, error);
            this.contentContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <p class="empty-state-text">Failed to load ${this.tabs[tabId].name}</p>
                    <button class="btn btn-secondary" onclick="tabManager.switchTab('${tabId}')">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    async loadTab(tabId) {
        const tab = this.tabs[tabId];

        // Load HTML content
        const htmlPath = `tabs/${tabId}/${tabId}.html`;
        const response = await fetch(htmlPath);

        if (!response.ok) {
            throw new Error(`Failed to load ${htmlPath}`);
        }

        const html = await response.text();
        this.contentContainer.innerHTML = html;

        // Load CSS if not already loaded
        const cssId = `tab-css-${tabId}`;
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = `tabs/${tabId}/${tabId}.css`;
            document.head.appendChild(link);
        }

        // Load and initialize JS module
        if (!tab.loaded) {
            const script = document.createElement('script');
            script.src = `tabs/${tabId}/${tabId}.js`;
            script.onload = () => {
                tab.loaded = true;
                // Initialize the module
                const moduleName = tabId.charAt(0).toUpperCase() + tabId.slice(1) + 'Tab';
                if (window[moduleName]) {
                    tab.module = window[moduleName];
                    if (typeof tab.module.init === 'function') {
                        tab.module.init();
                    }
                }
            };
            document.body.appendChild(script);
        } else if (tab.module && typeof tab.module.init === 'function') {
            // Re-initialize if already loaded
            tab.module.init();
        }
    }

    getCurrentTab() {
        return this.currentTab;
    }

    getTabData(tabId) {
        return this.tabs[tabId] || null;
    }
}

// Global instance
let tabManager;
