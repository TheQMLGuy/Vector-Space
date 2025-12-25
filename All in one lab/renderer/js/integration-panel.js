/**
 * QAGI Lab - Integration Panel
 * Floating UI for cross-tab data management
 */

const IntegrationPanel = {
    isOpen: false,
    panelElement: null,
    unsubscribers: [],

    init() {
        this.createPanel();
        this.createToggleButton();
        this.bindEvents();
        this.subscribeToHub();
    },

    createToggleButton() {
        const sidebar = document.querySelector('.sidebar-footer');
        if (!sidebar) return;

        const btn = document.createElement('button');
        btn.id = 'data-hub-toggle';
        btn.className = 'data-hub-toggle';
        btn.innerHTML = `
            <span class="hub-icon">🔄</span>
            <span class="hub-label">Data Hub</span>
            <span class="hub-badge" id="hub-badge">0</span>
        `;
        btn.onclick = () => this.toggle();

        sidebar.insertBefore(btn, sidebar.firstChild);
    },

    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'integration-panel';
        panel.className = 'integration-panel';
        panel.innerHTML = `
            <div class="integration-header">
                <h3>🔄 Data Hub</h3>
                <div class="integration-actions">
                    <button class="btn-icon" id="hub-clear-all" title="Clear all data">🗑️</button>
                    <button class="btn-icon" id="hub-close" title="Close">✕</button>
                </div>
            </div>
            <div class="integration-tabs">
                <button class="int-tab active" data-filter="all">All</button>
                <button class="int-tab" data-filter="matrices">📊</button>
                <button class="int-tab" data-filter="arrays">📋</button>
                <button class="int-tab" data-filter="complex">🌀</button>
                <button class="int-tab" data-filter="vectors">➡️</button>
                <button class="int-tab" data-filter="datasets">📈</button>
            </div>
            <div class="integration-content" id="hub-content">
                <div class="hub-empty">
                    <div class="hub-empty-icon">📭</div>
                    <p>No data in hub yet</p>
                    <p class="hub-empty-hint">Export data from any tab to share it across your workspace</p>
                </div>
            </div>
            <div class="integration-footer">
                <div class="hub-stats" id="hub-stats">0 items</div>
            </div>
        `;

        document.body.appendChild(panel);
        this.panelElement = panel;
    },

    bindEvents() {
        // Close button
        document.getElementById('hub-close')?.addEventListener('click', () => this.close());

        // Clear all button
        document.getElementById('hub-clear-all')?.addEventListener('click', () => {
            if (confirm('Clear all data from the hub?')) {
                QAGIDataHub.clear();
                this.refresh();
            }
        });

        // Filter tabs
        document.querySelectorAll('.int-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.int-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.refresh(e.target.dataset.filter);
            });
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen &&
                !this.panelElement.contains(e.target) &&
                !e.target.closest('#data-hub-toggle')) {
                this.close();
            }
        });

        // Keyboard shortcut (Ctrl+Shift+D)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggle();
            }
        });
    },

    subscribeToHub() {
        const unsub1 = QAGIDataHub.subscribe('data-exported', () => {
            this.updateBadge();
            if (this.isOpen) this.refresh();
        });

        const unsub2 = QAGIDataHub.subscribe('data-removed', () => {
            this.updateBadge();
            if (this.isOpen) this.refresh();
        });

        const unsub3 = QAGIDataHub.subscribe('data-cleared', () => {
            this.updateBadge();
            if (this.isOpen) this.refresh();
        });

        this.unsubscribers.push(unsub1, unsub2, unsub3);
    },

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    },

    open() {
        this.panelElement.classList.add('open');
        this.isOpen = true;
        this.refresh();
    },

    close() {
        this.panelElement.classList.remove('open');
        this.isOpen = false;
    },

    updateBadge() {
        const badge = document.getElementById('hub-badge');
        const counts = QAGIDataHub.getCounts();
        if (badge) {
            badge.textContent = counts.total;
            badge.style.display = counts.total > 0 ? 'flex' : 'none';
        }
    },

    refresh(filter = 'all') {
        const content = document.getElementById('hub-content');
        const stats = document.getElementById('hub-stats');
        if (!content) return;

        let items;
        if (filter === 'all') {
            items = QAGIDataHub.list();
        } else {
            items = QAGIDataHub.list(filter);
        }

        if (items.length === 0) {
            content.innerHTML = `
                <div class="hub-empty">
                    <div class="hub-empty-icon">📭</div>
                    <p>No data in hub yet</p>
                    <p class="hub-empty-hint">Export data from any tab to share it</p>
                </div>
            `;
            stats.textContent = '0 items';
            return;
        }

        content.innerHTML = items.map(item => this.renderItem(item)).join('');
        stats.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;

        // Bind item actions
        content.querySelectorAll('.hub-item-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyItem(btn.dataset.type, btn.dataset.id);
            });
        });

        content.querySelectorAll('.hub-item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteItem(btn.dataset.type, btn.dataset.id);
            });
        });

        content.querySelectorAll('.hub-item').forEach(el => {
            el.addEventListener('click', () => {
                this.showItemDetails(el.dataset.type, el.dataset.id);
            });
        });
    },

    renderItem(item) {
        const typeIcon = QAGIDataHub.icons[item.dataType] || '📦';
        const tabIcon = QAGIDataHub.tabIcons[item.sourceTab] || '📁';
        const timeAgo = this.formatTimeAgo(item.timestamp);

        return `
            <div class="hub-item" data-id="${item.id}" data-type="${item.dataType}">
                <div class="hub-item-icon">${typeIcon}</div>
                <div class="hub-item-info">
                    <div class="hub-item-name">${item.name}</div>
                    <div class="hub-item-meta">
                        <span class="hub-item-source">${tabIcon} ${item.sourceTab}</span>
                        <span class="hub-item-time">${timeAgo}</span>
                    </div>
                </div>
                <div class="hub-item-actions">
                    <button class="btn-icon-sm hub-item-copy" data-id="${item.id}" data-type="${item.dataType}" title="Copy to clipboard">📋</button>
                    <button class="btn-icon-sm hub-item-delete" data-id="${item.id}" data-type="${item.dataType}" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    },

    formatTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return new Date(timestamp).toLocaleDateString();
    },

    copyItem(dataType, id) {
        const entry = QAGIDataHub.getEntry(dataType, id);
        if (!entry) return;

        let text;
        if (Array.isArray(entry.data)) {
            text = JSON.stringify(entry.data, null, 2);
        } else if (typeof entry.data === 'object') {
            text = JSON.stringify(entry.data, null, 2);
        } else {
            text = String(entry.data);
        }

        navigator.clipboard.writeText(text).then(() => {
            QAGIUtils.showToast('Copied to clipboard!', 'success');
        });
    },

    deleteItem(dataType, id) {
        QAGIDataHub.remove(dataType, id);
        this.refresh();
    },

    showItemDetails(dataType, id) {
        const entry = QAGIDataHub.getEntry(dataType, id);
        if (!entry) return;

        // Create modal with details
        const modal = document.createElement('div');
        modal.className = 'hub-modal-overlay';
        modal.innerHTML = `
            <div class="hub-modal">
                <div class="hub-modal-header">
                    <h4>${QAGIDataHub.icons[dataType]} ${entry.metadata.name}</h4>
                    <button class="btn-icon hub-modal-close">✕</button>
                </div>
                <div class="hub-modal-body">
                    <div class="hub-detail-row">
                        <span class="label">Source:</span>
                        <span>${QAGIDataHub.tabIcons[entry.sourceTab]} ${entry.sourceTab}</span>
                    </div>
                    <div class="hub-detail-row">
                        <span class="label">Type:</span>
                        <span>${dataType}</span>
                    </div>
                    ${entry.metadata.description ? `
                        <div class="hub-detail-row">
                            <span class="label">Description:</span>
                            <span>${entry.metadata.description}</span>
                        </div>
                    ` : ''}
                    <div class="hub-detail-row">
                        <span class="label">Created:</span>
                        <span>${new Date(entry.metadata.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="hub-detail-data">
                        <span class="label">Data Preview:</span>
                        <pre>${this.formatDataPreview(entry.data)}</pre>
                    </div>
                </div>
                <div class="hub-modal-footer">
                    <button class="btn btn-secondary hub-modal-close">Close</button>
                    <button class="btn btn-primary" id="hub-modal-use">Use in Current Tab</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind close
        modal.querySelectorAll('.hub-modal-close').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Bind use button
        document.getElementById('hub-modal-use')?.addEventListener('click', () => {
            this.useInCurrentTab(dataType, id);
            modal.remove();
        });
    },

    formatDataPreview(data) {
        if (Array.isArray(data)) {
            if (data.length > 10) {
                const preview = data.slice(0, 5);
                return JSON.stringify(preview, null, 2).slice(0, -2) +
                    `,\n  ... (${data.length - 5} more items)\n]`;
            }
            return JSON.stringify(data, null, 2);
        }
        if (typeof data === 'object') {
            return JSON.stringify(data, null, 2);
        }
        return String(data);
    },

    useInCurrentTab(dataType, id) {
        const entry = QAGIDataHub.getEntry(dataType, id);
        if (!entry) return;

        const currentTab = window.tabManager?.getCurrentTab();
        if (!currentTab) return;

        // Dispatch event that tabs can listen to
        QAGIDataHub.events.dispatchEvent(new CustomEvent('use-data', {
            detail: { entry, targetTab: currentTab }
        }));

        QAGIUtils.showToast(`Importing "${entry.metadata.name}" to ${currentTab}`, 'info');
        this.close();
    },

    cleanup() {
        this.unsubscribers.forEach(fn => fn());
        this.panelElement?.remove();
        document.getElementById('data-hub-toggle')?.remove();
    }
};

// Make globally available
window.IntegrationPanel = IntegrationPanel;
