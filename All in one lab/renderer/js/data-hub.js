/**
 * QAGI Lab - Data Hub
 * Central data store and event bus for cross-tab communication
 */

const QAGIDataHub = {
    // ==================== DATA STORE ====================
    store: {
        matrices: [],      // 2D arrays / matrices
        arrays: [],        // 1D data arrays
        scalars: [],       // Single numeric values
        functions: [],     // Mathematical function strings
        complex: [],       // Complex numbers { re, im }
        datasets: [],      // Labeled datasets for ML/stats
        vectors: []        // State vectors, eigenvectors
    },

    // Event system for cross-tab notifications
    events: new EventTarget(),

    // ==================== EXPORT DATA ====================
    /**
     * Export data to the hub from a tab
     * @param {string} sourceTab - Tab ID exporting the data
     * @param {string} dataType - Type: 'matrices', 'arrays', 'scalars', 'functions', 'complex', 'datasets', 'vectors'
     * @param {*} data - The actual data
     * @param {object} metadata - Additional info { name, description, ... }
     * @returns {string} - ID of the stored data
     */
    export(sourceTab, dataType, data, metadata = {}) {
        if (!this.store[dataType]) {
            console.error(`Unknown data type: ${dataType}`);
            return null;
        }

        const id = this._generateId();
        const entry = {
            id,
            sourceTab,
            dataType,
            data: this._deepClone(data),
            metadata: {
                name: metadata.name || `${dataType}_${id.slice(0, 6)}`,
                description: metadata.description || '',
                timestamp: Date.now(),
                ...metadata
            }
        };

        this.store[dataType].push(entry);

        // Dispatch event for listeners
        this.events.dispatchEvent(new CustomEvent('data-exported', {
            detail: { entry, dataType }
        }));

        // Show toast notification
        if (window.QAGIUtils) {
            QAGIUtils.showToast(`Exported "${entry.metadata.name}" to Data Hub`, 'success');
        }

        console.log(`[DataHub] Exported ${dataType}:`, entry);
        return id;
    },

    // ==================== IMPORT DATA ====================
    /**
     * Get data from the hub
     * @param {string} dataType - Type to search
     * @param {string} id - Optional specific ID
     * @returns {*} - Data entry or array of entries
     */
    import(dataType, id = null) {
        if (!this.store[dataType]) {
            console.error(`Unknown data type: ${dataType}`);
            return null;
        }

        if (id) {
            const entry = this.store[dataType].find(e => e.id === id);
            return entry ? this._deepClone(entry.data) : null;
        }

        return this.store[dataType].map(e => this._deepClone(e));
    },

    /**
     * Get a specific entry by ID (with metadata)
     */
    getEntry(dataType, id) {
        if (!this.store[dataType]) return null;
        return this.store[dataType].find(e => e.id === id) || null;
    },

    /**
     * Get the most recent entry of a type
     */
    getLatest(dataType) {
        if (!this.store[dataType] || this.store[dataType].length === 0) return null;
        const entries = this.store[dataType];
        return this._deepClone(entries[entries.length - 1]);
    },

    // ==================== LIST & QUERY ====================
    /**
     * List all entries of a type
     */
    list(dataType = null) {
        if (dataType) {
            return (this.store[dataType] || []).map(e => ({
                id: e.id,
                name: e.metadata.name,
                sourceTab: e.sourceTab,
                timestamp: e.metadata.timestamp,
                description: e.metadata.description
            }));
        }

        // List all
        const all = [];
        for (const type of Object.keys(this.store)) {
            for (const entry of this.store[type]) {
                all.push({
                    id: entry.id,
                    dataType: type,
                    name: entry.metadata.name,
                    sourceTab: entry.sourceTab,
                    timestamp: entry.metadata.timestamp
                });
            }
        }
        return all.sort((a, b) => b.timestamp - a.timestamp);
    },

    /**
     * Get count of items per type
     */
    getCounts() {
        const counts = {};
        for (const type of Object.keys(this.store)) {
            counts[type] = this.store[type].length;
        }
        counts.total = Object.values(counts).reduce((a, b) => a + b, 0);
        return counts;
    },

    // ==================== DELETE & CLEAR ====================
    /**
     * Remove a specific entry
     */
    remove(dataType, id) {
        if (!this.store[dataType]) return false;
        const idx = this.store[dataType].findIndex(e => e.id === id);
        if (idx === -1) return false;

        const removed = this.store[dataType].splice(idx, 1)[0];
        this.events.dispatchEvent(new CustomEvent('data-removed', {
            detail: { entry: removed, dataType }
        }));
        return true;
    },

    /**
     * Clear all data of a type, or all data
     */
    clear(dataType = null) {
        if (dataType) {
            this.store[dataType] = [];
        } else {
            for (const type of Object.keys(this.store)) {
                this.store[type] = [];
            }
        }
        this.events.dispatchEvent(new CustomEvent('data-cleared', {
            detail: { dataType }
        }));
    },

    // ==================== EVENT SUBSCRIPTION ====================
    /**
     * Subscribe to hub events
     * Events: 'data-exported', 'data-removed', 'data-cleared'
     */
    subscribe(eventName, callback) {
        this.events.addEventListener(eventName, callback);
        return () => this.events.removeEventListener(eventName, callback);
    },

    // ==================== TAB-SPECIFIC HELPERS ====================

    // --- Matrices ---
    exportMatrix(sourceTab, matrix, name, description = '') {
        return this.export(sourceTab, 'matrices', matrix, { name, description, rows: matrix.length, cols: matrix[0]?.length });
    },

    importMatrix(id) {
        return this.import('matrices', id);
    },

    // --- Arrays ---
    exportArray(sourceTab, array, name, description = '') {
        return this.export(sourceTab, 'arrays', array, { name, description, length: array.length });
    },

    importArray(id) {
        return this.import('arrays', id);
    },

    // --- Complex Numbers ---
    exportComplex(sourceTab, complex, name, description = '') {
        // complex can be { re, im } or array of { re, im }
        return this.export(sourceTab, 'complex', complex, { name, description });
    },

    importComplex(id) {
        return this.import('complex', id);
    },

    // --- Scalars ---
    exportScalar(sourceTab, value, name, description = '') {
        return this.export(sourceTab, 'scalars', value, { name, description });
    },

    // --- Vectors (state vectors, eigenvectors) ---
    exportVector(sourceTab, vector, name, description = '') {
        return this.export(sourceTab, 'vectors', vector, { name, description, length: vector.length });
    },

    importVector(id) {
        return this.import('vectors', id);
    },

    // --- Datasets ---
    exportDataset(sourceTab, inputs, outputs, name, description = '') {
        return this.export(sourceTab, 'datasets', { inputs, outputs }, { name, description, samples: inputs.length });
    },

    // --- Functions ---
    exportFunction(sourceTab, funcStr, name, description = '') {
        return this.export(sourceTab, 'functions', funcStr, { name, description });
    },

    // ==================== UTILITIES ====================
    _generateId() {
        return 'dh_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    },

    _deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(item => this._deepClone(item));
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this._deepClone(obj[key]);
            }
        }
        return cloned;
    },

    // ==================== ICON MAPPINGS ====================
    icons: {
        matrices: '📊',
        arrays: '📋',
        scalars: '🔢',
        functions: 'ƒ',
        complex: '🌀',
        datasets: '📈',
        vectors: '➡️'
    },

    tabIcons: {
        neuralnet: '🕸️',
        electrical: '⚡',
        quantum: '🔮',
        matrices: '📊',
        calculus: '📈',
        complex: '🌀',
        statistics: '🎲',
        bitwise: '💾'
    }
};

// Freeze structure (not data)
Object.freeze(QAGIDataHub.icons);
Object.freeze(QAGIDataHub.tabIcons);

// Make globally available
window.QAGIDataHub = QAGIDataHub;

console.log('[QAGI] Data Hub initialized');
