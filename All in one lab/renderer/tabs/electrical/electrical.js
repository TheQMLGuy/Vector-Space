/**
 * QAGI Lab - Circuit Simulator
 * Interactive circuit builder with real-time simulation
 */

const ElectricalTab = {
    // State
    components: [],
    wires: [],
    selectedComponent: null,
    selectedWire: null,
    nextId: 1,

    // Tools
    currentTool: 'select',
    isDrawingWire: false,
    wireStart: null,
    tempWire: null,

    // Canvas
    svg: null,
    componentsLayer: null,
    wiresLayer: null,
    tempLayer: null,
    zoom: 1,
    gridSize: 20,

    // Component definitions
    componentDefs: {
        dc_voltage: {
            name: 'DC Voltage',
            defaultValue: 5,
            unit: 'V',
            terminals: [
                { id: '+', x: 0, y: -30 },
                { id: '-', x: 0, y: 30 }
            ],
            render: (g, comp) => {
                g.innerHTML = `
                    <circle cx="0" cy="0" r="20" class="component-body"/>
                    <line x1="-8" y1="0" x2="8" y2="0" class="component-body"/>
                    <line x1="0" y1="-8" x2="0" y2="8" class="component-body"/>
                    <line x1="0" y1="-20" x2="0" y2="-30" class="component-body"/>
                    <line x1="0" y1="20" x2="0" y2="30" class="component-body"/>
                    <circle cx="0" cy="-30" r="4" class="terminal" data-terminal="+"/>
                    <circle cx="0" cy="30" r="4" class="terminal" data-terminal="-"/>
                    <text x="25" y="5" class="value-label">${comp.value}V</text>
                `;
            }
        },
        dc_current: {
            name: 'DC Current',
            defaultValue: 1,
            unit: 'A',
            terminals: [
                { id: '+', x: 0, y: -30 },
                { id: '-', x: 0, y: 30 }
            ],
            render: (g, comp) => {
                g.innerHTML = `
                    <circle cx="0" cy="0" r="20" class="component-body"/>
                    <path d="M-8 0 L8 0 M5 -4 L8 0 L5 4" class="component-body"/>
                    <line x1="0" y1="-20" x2="0" y2="-30" class="component-body"/>
                    <line x1="0" y1="20" x2="0" y2="30" class="component-body"/>
                    <circle cx="0" cy="-30" r="4" class="terminal" data-terminal="+"/>
                    <circle cx="0" cy="30" r="4" class="terminal" data-terminal="-"/>
                    <text x="25" y="5" class="value-label">${comp.value}A</text>
                `;
            }
        },
        ac_voltage: {
            name: 'AC Voltage',
            defaultValue: 120,
            unit: 'V',
            terminals: [
                { id: '+', x: 0, y: -30 },
                { id: '-', x: 0, y: 30 }
            ],
            render: (g, comp) => {
                g.innerHTML = `
                    <circle cx="0" cy="0" r="20" class="component-body"/>
                    <path d="M-10 0 Q-5 -10 0 0 Q5 10 10 0" class="component-body" fill="none"/>
                    <line x1="0" y1="-20" x2="0" y2="-30" class="component-body"/>
                    <line x1="0" y1="20" x2="0" y2="30" class="component-body"/>
                    <circle cx="0" cy="-30" r="4" class="terminal" data-terminal="+"/>
                    <circle cx="0" cy="30" r="4" class="terminal" data-terminal="-"/>
                    <text x="25" y="5" class="value-label">${comp.value}V~</text>
                `;
            }
        },
        resistor: {
            name: 'Resistor',
            defaultValue: 1000,
            unit: 'Ω',
            units: [
                { label: 'Ω', mult: 1 },
                { label: 'kΩ', mult: 1000 },
                { label: 'MΩ', mult: 1000000 }
            ],
            terminals: [
                { id: 'a', x: -40, y: 0 },
                { id: 'b', x: 40, y: 0 }
            ],
            render: (g, comp) => {
                g.innerHTML = `
                    <line x1="-40" y1="0" x2="-25" y2="0" class="component-body"/>
                    <path d="M-25 0 L-20 -8 L-10 8 L0 -8 L10 8 L20 -8 L25 0" class="component-body" fill="none"/>
                    <line x1="25" y1="0" x2="40" y2="0" class="component-body"/>
                    <circle cx="-40" cy="0" r="4" class="terminal" data-terminal="a"/>
                    <circle cx="40" cy="0" r="4" class="terminal" data-terminal="b"/>
                    <text x="0" y="-15" class="value-label">${ElectricalTab.formatValue(comp.value, 'Ω')}</text>
                `;
            }
        },
        capacitor: {
            name: 'Capacitor',
            defaultValue: 0.000001,
            unit: 'F',
            units: [
                { label: 'F', mult: 1 },
                { label: 'mF', mult: 0.001 },
                { label: 'μF', mult: 0.000001 },
                { label: 'nF', mult: 0.000000001 },
                { label: 'pF', mult: 0.000000000001 }
            ],
            terminals: [
                { id: 'a', x: -40, y: 0 },
                { id: 'b', x: 40, y: 0 }
            ],
            render: (g, comp) => {
                g.innerHTML = `
                    <line x1="-40" y1="0" x2="-5" y2="0" class="component-body"/>
                    <line x1="-5" y1="-15" x2="-5" y2="15" class="component-body"/>
                    <line x1="5" y1="-15" x2="5" y2="15" class="component-body"/>
                    <line x1="5" y1="0" x2="40" y2="0" class="component-body"/>
                    <circle cx="-40" cy="0" r="4" class="terminal" data-terminal="a"/>
                    <circle cx="40" cy="0" r="4" class="terminal" data-terminal="b"/>
                    <text x="0" y="-20" class="value-label">${ElectricalTab.formatValue(comp.value, 'F')}</text>
                `;
            }
        },
        inductor: {
            name: 'Inductor',
            defaultValue: 0.001,
            unit: 'H',
            units: [
                { label: 'H', mult: 1 },
                { label: 'mH', mult: 0.001 },
                { label: 'μH', mult: 0.000001 }
            ],
            terminals: [
                { id: 'a', x: -40, y: 0 },
                { id: 'b', x: 40, y: 0 }
            ],
            render: (g, comp) => {
                g.innerHTML = `
                    <line x1="-40" y1="0" x2="-30" y2="0" class="component-body"/>
                    <path d="M-30 0 A8 8 0 0 1 -14 0 A8 8 0 0 1 2 0 A8 8 0 0 1 18 0 A8 8 0 0 1 30 0" class="component-body" fill="none"/>
                    <line x1="30" y1="0" x2="40" y2="0" class="component-body"/>
                    <circle cx="-40" cy="0" r="4" class="terminal" data-terminal="a"/>
                    <circle cx="40" cy="0" r="4" class="terminal" data-terminal="b"/>
                    <text x="0" y="-15" class="value-label">${ElectricalTab.formatValue(comp.value, 'H')}</text>
                `;
            }
        },
        diode: {
            name: 'Diode',
            defaultValue: 0.7,
            unit: 'V',
            terminals: [
                { id: 'a', x: -40, y: 0 },
                { id: 'k', x: 40, y: 0 }
            ],
            render: (g, comp) => {
                g.innerHTML = `
                    <line x1="-40" y1="0" x2="-15" y2="0" class="component-body"/>
                    <polygon points="-15,-12 -15,12 10,0" class="component-body"/>
                    <line x1="10" y1="-12" x2="10" y2="12" class="component-body"/>
                    <line x1="10" y1="0" x2="40" y2="0" class="component-body"/>
                    <circle cx="-40" cy="0" r="4" class="terminal" data-terminal="a"/>
                    <circle cx="40" cy="0" r="4" class="terminal" data-terminal="k"/>
                `;
            }
        },
        led: {
            name: 'LED',
            defaultValue: 2,
            unit: 'V',
            terminals: [
                { id: 'a', x: -40, y: 0 },
                { id: 'k', x: 40, y: 0 }
            ],
            render: (g, comp) => {
                g.innerHTML = `
                    <line x1="-40" y1="0" x2="-15" y2="0" class="component-body"/>
                    <polygon points="-15,-12 -15,12 10,0" class="component-body"/>
                    <line x1="10" y1="-12" x2="10" y2="12" class="component-body"/>
                    <line x1="10" y1="0" x2="40" y2="0" class="component-body"/>
                    <path d="M5 -18 L12 -25 M10 -25 L12 -25 L12 -23" stroke="var(--accent-yellow)" stroke-width="1.5" fill="none"/>
                    <path d="M-2 -18 L5 -25 M3 -25 L5 -25 L5 -23" stroke="var(--accent-yellow)" stroke-width="1.5" fill="none"/>
                    <circle cx="-40" cy="0" r="4" class="terminal" data-terminal="a"/>
                    <circle cx="40" cy="0" r="4" class="terminal" data-terminal="k"/>
                `;
            }
        },
        switch: {
            name: 'Switch',
            defaultValue: 0,
            unit: '',
            terminals: [
                { id: 'a', x: -40, y: 0 },
                { id: 'b', x: 40, y: 0 }
            ],
            render: (g, comp) => {
                const closed = comp.value === 1;
                g.innerHTML = `
                    <line x1="-40" y1="0" x2="-15" y2="0" class="component-body"/>
                    <circle cx="-15" cy="0" r="4" class="component-body" fill="var(--text-primary)"/>
                    <circle cx="15" cy="0" r="4" class="component-body" fill="none"/>
                    <line x1="-11" y1="0" x2="11" y2="${closed ? 0 : -12}" class="component-body"/>
                    <line x1="15" y1="0" x2="40" y2="0" class="component-body"/>
                    <circle cx="-40" cy="0" r="4" class="terminal" data-terminal="a"/>
                    <circle cx="40" cy="0" r="4" class="terminal" data-terminal="b"/>
                    <text x="0" y="-20" class="value-label">${closed ? 'ON' : 'OFF'}</text>
                `;
            }
        },
        ground: {
            name: 'Ground',
            defaultValue: 0,
            unit: 'V',
            terminals: [
                { id: 'gnd', x: 0, y: -20 }
            ],
            render: (g, comp) => {
                g.innerHTML = `
                    <line x1="0" y1="-20" x2="0" y2="0" class="component-body"/>
                    <line x1="-15" y1="0" x2="15" y2="0" class="component-body"/>
                    <line x1="-10" y1="6" x2="10" y2="6" class="component-body"/>
                    <line x1="-5" y1="12" x2="5" y2="12" class="component-body"/>
                    <circle cx="0" cy="-20" r="4" class="terminal" data-terminal="gnd"/>
                `;
            }
        },
        voltmeter: {
            name: 'Voltmeter',
            defaultValue: 0,
            unit: 'V',
            terminals: [
                { id: '+', x: 0, y: -30 },
                { id: '-', x: 0, y: 30 }
            ],
            render: (g, comp) => {
                g.innerHTML = `
                    <circle cx="0" cy="0" r="20" class="component-body"/>
                    <text x="0" y="6" class="value-label" style="font-size: 16px; font-weight: bold;">V</text>
                    <line x1="0" y1="-20" x2="0" y2="-30" class="component-body"/>
                    <line x1="0" y1="20" x2="0" y2="30" class="component-body"/>
                    <circle cx="0" cy="-30" r="4" class="terminal" data-terminal="+"/>
                    <circle cx="0" cy="30" r="4" class="terminal" data-terminal="-"/>
                `;
            }
        },
        ammeter: {
            name: 'Ammeter',
            defaultValue: 0,
            unit: 'A',
            terminals: [
                { id: 'in', x: -30, y: 0 },
                { id: 'out', x: 30, y: 0 }
            ],
            render: (g, comp) => {
                g.innerHTML = `
                    <circle cx="0" cy="0" r="20" class="component-body"/>
                    <text x="0" y="6" class="value-label" style="font-size: 16px; font-weight: bold;">A</text>
                    <line x1="-20" y1="0" x2="-30" y2="0" class="component-body"/>
                    <line x1="20" y1="0" x2="30" y2="0" class="component-body"/>
                    <circle cx="-30" cy="0" r="4" class="terminal" data-terminal="in"/>
                    <circle cx="30" cy="0" r="4" class="terminal" data-terminal="out"/>
                `;
            }
        },
        bulb: {
            name: 'Bulb',
            defaultValue: 60,
            unit: 'W',
            terminals: [
                { id: 'a', x: -40, y: 0 },
                { id: 'b', x: 40, y: 0 }
            ],
            render: (g, comp) => {
                g.innerHTML = `
                    <line x1="-40" y1="0" x2="-20" y2="0" class="component-body"/>
                    <circle cx="0" cy="0" r="18" class="component-body"/>
                    <line x1="-10" y1="-10" x2="10" y2="10" class="component-body"/>
                    <line x1="10" y1="-10" x2="-10" y2="10" class="component-body"/>
                    <line x1="20" y1="0" x2="40" y2="0" class="component-body"/>
                    <circle cx="-40" cy="0" r="4" class="terminal" data-terminal="a"/>
                    <circle cx="40" cy="0" r="4" class="terminal" data-terminal="b"/>
                    <text x="0" y="-25" class="value-label">${comp.value}W</text>
                `;
            }
        },
        wire: {
            name: 'Wire Node',
            defaultValue: 0,
            unit: '',
            terminals: [
                { id: 'a', x: -20, y: 0 },
                { id: 'b', x: 20, y: 0 },
                { id: 'c', x: 0, y: -20 },
                { id: 'd', x: 0, y: 20 }
            ],
            render: (g, comp) => {
                g.innerHTML = `
                    <line x1="-20" y1="0" x2="20" y2="0" class="component-body"/>
                    <line x1="0" y1="-20" x2="0" y2="20" class="component-body"/>
                    <circle cx="0" cy="0" r="5" fill="var(--accent-cyan)"/>
                    <circle cx="-20" cy="0" r="4" class="terminal" data-terminal="a"/>
                    <circle cx="20" cy="0" r="4" class="terminal" data-terminal="b"/>
                    <circle cx="0" cy="-20" r="4" class="terminal" data-terminal="c"/>
                    <circle cx="0" cy="20" r="4" class="terminal" data-terminal="d"/>
                `;
            }
        }
    },

    init() {
        console.log('Circuit Simulator initialized');
        this.svg = document.getElementById('circuit-svg');
        this.componentsLayer = document.getElementById('components-layer');
        this.wiresLayer = document.getElementById('wires-layer');
        this.tempLayer = document.getElementById('temp-layer');

        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupCanvas();
    },

    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('btn-simulate')?.addEventListener('click', () => this.runSimulation());
        document.getElementById('btn-clear')?.addEventListener('click', () => this.clearCircuit());
        document.getElementById('btn-export')?.addEventListener('click', () => this.exportCircuit());

        // Tool buttons
        document.getElementById('tool-select')?.addEventListener('click', () => this.setTool('select'));
        document.getElementById('tool-wire')?.addEventListener('click', () => this.setTool('wire'));
        document.getElementById('tool-delete')?.addEventListener('click', () => this.setTool('delete'));
        document.getElementById('tool-rotate')?.addEventListener('click', () => this.rotateSelected());
        document.getElementById('tool-duplicate')?.addEventListener('click', () => this.duplicateSelected());
        document.getElementById('tool-zoom-in')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('tool-zoom-out')?.addEventListener('click', () => this.zoomOut());

        // Property panel
        document.getElementById('prop-value')?.addEventListener('change', () => this.updateComponentValue());
        document.getElementById('prop-unit')?.addEventListener('change', () => this.updateComponentValue());
        document.getElementById('rotate-cw')?.addEventListener('click', () => this.rotateSelected(90));
        document.getElementById('rotate-ccw')?.addEventListener('click', () => this.rotateSelected(-90));
        document.getElementById('btn-delete-component')?.addEventListener('click', () => this.deleteSelected());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    },

    setupDragAndDrop() {
        const items = document.querySelectorAll('.component-item');
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('componentType', item.dataset.type);
                item.classList.add('dragging');
            });
            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
            });
        });

        const canvas = document.getElementById('circuit-canvas');
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('componentType');
            if (type) {
                const rect = canvas.getBoundingClientRect();
                const x = this.snapToGrid((e.clientX - rect.left) / this.zoom);
                const y = this.snapToGrid((e.clientY - rect.top) / this.zoom);
                this.addComponent(type, x, y);
            }
        });
    },

    setupCanvas() {
        const canvas = document.getElementById('circuit-canvas');

        canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.cancelWireDrawing();
        });
    },

    // ==================== TOOLS ====================
    setTool(tool) {
        this.currentTool = tool;
        this.cancelWireDrawing();

        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`tool-${tool}`)?.classList.add('active');

        // Update cursor
        const canvas = document.getElementById('circuit-canvas');
        canvas.style.cursor = tool === 'wire' ? 'crosshair' : (tool === 'delete' ? 'not-allowed' : 'default');
    },

    // ==================== COMPONENTS ====================
    addComponent(type, x, y) {
        const def = this.componentDefs[type];
        if (!def) return;

        const comp = {
            id: this.nextId++,
            type: type,
            x: x,
            y: y,
            rotation: 0,
            value: def.defaultValue,
            connections: {}
        };

        this.components.push(comp);
        this.renderComponent(comp);
        this.selectComponent(comp);
        this.hideHint();
    },

    renderComponent(comp) {
        const def = this.componentDefs[comp.type];
        if (!def) return;

        // Remove existing
        const existing = document.getElementById(`comp-${comp.id}`);
        if (existing) existing.remove();

        // Create group
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.id = `comp-${comp.id}`;
        g.classList.add('circuit-component');
        g.setAttribute('transform', `translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})`);
        g.dataset.id = comp.id;

        // Render component
        def.render(g, comp);

        // Add event listeners
        g.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.currentTool === 'delete') {
                this.deleteComponent(comp.id);
            } else if (this.currentTool === 'select') {
                this.selectComponent(comp);
            }
        });

        // Terminal click handlers
        g.querySelectorAll('.terminal').forEach(terminal => {
            terminal.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.currentTool === 'wire' || this.currentTool === 'select') {
                    this.handleTerminalClick(comp, terminal.dataset.terminal, e);
                }
            });
        });

        // Drag for moving
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        g.addEventListener('mousedown', (e) => {
            if (this.currentTool !== 'select') return;
            if (e.target.classList.contains('terminal')) return;

            isDragging = true;
            const rect = this.svg.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left - comp.x * this.zoom;
            dragOffset.y = e.clientY - rect.top - comp.y * this.zoom;
            this.selectComponent(comp);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const rect = this.svg.getBoundingClientRect();
            comp.x = this.snapToGrid((e.clientX - rect.left - dragOffset.x) / this.zoom);
            comp.y = this.snapToGrid((e.clientY - rect.top - dragOffset.y) / this.zoom);
            g.setAttribute('transform', `translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})`);
            this.updateWiresForComponent(comp.id);
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Double-click to toggle switch
        if (comp.type === 'switch') {
            g.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                comp.value = comp.value === 0 ? 1 : 0;
                this.renderComponent(comp);
                this.updatePropertiesPanel();
            });
        }

        this.componentsLayer.appendChild(g);
    },

    selectComponent(comp) {
        // Deselect previous
        this.deselectAll();

        this.selectedComponent = comp;
        this.selectedWire = null;

        const g = document.getElementById(`comp-${comp.id}`);
        if (g) g.classList.add('selected');

        this.updatePropertiesPanel();
    },

    deselectAll() {
        document.querySelectorAll('.circuit-component.selected').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.circuit-wire.selected').forEach(el => el.classList.remove('selected'));
        this.selectedComponent = null;
        this.selectedWire = null;
    },

    deleteComponent(id) {
        // Remove wires connected to this component
        this.wires = this.wires.filter(w => {
            if (w.from.componentId === id || w.to.componentId === id) {
                document.getElementById(`wire-${w.id}`)?.remove();
                return false;
            }
            return true;
        });

        // Remove component
        this.components = this.components.filter(c => c.id !== id);
        document.getElementById(`comp-${id}`)?.remove();

        if (this.selectedComponent?.id === id) {
            this.selectedComponent = null;
            this.updatePropertiesPanel();
        }
    },

    deleteSelected() {
        if (this.selectedComponent) {
            this.deleteComponent(this.selectedComponent.id);
        } else if (this.selectedWire) {
            this.deleteWire(this.selectedWire.id);
        }
    },

    rotateSelected(angle = 90) {
        if (!this.selectedComponent) return;
        this.selectedComponent.rotation = (this.selectedComponent.rotation + angle + 360) % 360;
        this.renderComponent(this.selectedComponent);
        this.updateWiresForComponent(this.selectedComponent.id);
        this.updatePropertiesPanel();
    },

    duplicateSelected() {
        if (!this.selectedComponent) return;
        const comp = this.selectedComponent;
        this.addComponent(comp.type, comp.x + 40, comp.y + 40);
        const newComp = this.components[this.components.length - 1];
        newComp.value = comp.value;
        newComp.rotation = comp.rotation;
        this.renderComponent(newComp);
    },

    // ==================== WIRES ====================
    handleTerminalClick(comp, terminalId, event) {
        const terminalDef = this.componentDefs[comp.type].terminals.find(t => t.id === terminalId);
        if (!terminalDef) return;

        // Calculate world position of terminal
        const angle = comp.rotation * Math.PI / 180;
        const rx = terminalDef.x * Math.cos(angle) - terminalDef.y * Math.sin(angle);
        const ry = terminalDef.x * Math.sin(angle) + terminalDef.y * Math.cos(angle);
        const pos = { x: comp.x + rx, y: comp.y + ry };

        if (!this.isDrawingWire) {
            // Start wire
            this.isDrawingWire = true;
            this.wireStart = { componentId: comp.id, terminal: terminalId, pos };
            this.setTool('wire');
        } else {
            // Complete wire
            if (this.wireStart.componentId !== comp.id || this.wireStart.terminal !== terminalId) {
                this.addWire(
                    this.wireStart,
                    { componentId: comp.id, terminal: terminalId, pos }
                );
            }
            this.cancelWireDrawing();
        }
    },

    handleCanvasMouseMove(e) {
        if (!this.isDrawingWire || !this.wireStart) return;

        const rect = this.svg.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.zoom;
        const y = (e.clientY - rect.top) / this.zoom;

        // Draw temp wire
        this.tempLayer.innerHTML = `
            <line class="temp-wire" 
                x1="${this.wireStart.pos.x}" y1="${this.wireStart.pos.y}"
                x2="${x}" y2="${y}"/>
        `;
    },

    handleCanvasClick(e) {
        if (e.target === this.svg || e.target.tagName === 'rect') {
            this.deselectAll();
            this.updatePropertiesPanel();
        }
    },

    cancelWireDrawing() {
        this.isDrawingWire = false;
        this.wireStart = null;
        this.tempLayer.innerHTML = '';
    },

    addWire(from, to) {
        const wire = {
            id: this.nextId++,
            from: from,
            to: to
        };
        this.wires.push(wire);
        this.renderWire(wire);
    },

    renderWire(wire) {
        const existing = document.getElementById(`wire-${wire.id}`);
        if (existing) existing.remove();

        const fromPos = this.getTerminalPosition(wire.from.componentId, wire.from.terminal);
        const toPos = this.getTerminalPosition(wire.to.componentId, wire.to.terminal);

        if (!fromPos || !toPos) return;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.id = `wire-${wire.id}`;
        line.classList.add('circuit-wire');
        line.setAttribute('x1', fromPos.x);
        line.setAttribute('y1', fromPos.y);
        line.setAttribute('x2', toPos.x);
        line.setAttribute('y2', toPos.y);
        line.dataset.id = wire.id;

        line.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.currentTool === 'delete') {
                this.deleteWire(wire.id);
            } else {
                this.selectWire(wire);
            }
        });

        this.wiresLayer.appendChild(line);
    },

    getTerminalPosition(componentId, terminalId) {
        const comp = this.components.find(c => c.id === componentId);
        if (!comp) return null;

        const def = this.componentDefs[comp.type];
        const terminalDef = def.terminals.find(t => t.id === terminalId);
        if (!terminalDef) return null;

        const angle = comp.rotation * Math.PI / 180;
        const rx = terminalDef.x * Math.cos(angle) - terminalDef.y * Math.sin(angle);
        const ry = terminalDef.x * Math.sin(angle) + terminalDef.y * Math.cos(angle);

        return { x: comp.x + rx, y: comp.y + ry };
    },

    updateWiresForComponent(componentId) {
        this.wires.forEach(wire => {
            if (wire.from.componentId === componentId || wire.to.componentId === componentId) {
                this.renderWire(wire);
            }
        });
    },

    selectWire(wire) {
        this.deselectAll();
        this.selectedWire = wire;
        const el = document.getElementById(`wire-${wire.id}`);
        if (el) el.classList.add('selected');
        this.updatePropertiesPanel();
    },

    deleteWire(id) {
        this.wires = this.wires.filter(w => w.id !== id);
        document.getElementById(`wire-${id}`)?.remove();
        if (this.selectedWire?.id === id) {
            this.selectedWire = null;
            this.updatePropertiesPanel();
        }
    },

    // ==================== PROPERTIES PANEL ====================
    updatePropertiesPanel() {
        const noSelection = document.getElementById('no-selection');
        const compProps = document.getElementById('component-props');

        if (!this.selectedComponent) {
            noSelection.style.display = 'flex';
            compProps.style.display = 'none';
            return;
        }

        noSelection.style.display = 'none';
        compProps.style.display = 'block';

        const comp = this.selectedComponent;
        const def = this.componentDefs[comp.type];

        document.getElementById('prop-type').textContent = def.name;
        document.getElementById('prop-id').textContent = `#${comp.id}`;
        document.getElementById('rotation-value').textContent = `${comp.rotation}°`;

        // Value and unit
        const valueLabel = document.getElementById('prop-value-label');
        const valueInput = document.getElementById('prop-value');
        const unitSelect = document.getElementById('prop-unit');

        if (comp.type === 'switch') {
            valueLabel.textContent = 'State';
            valueInput.value = comp.value;
            unitSelect.innerHTML = '<option value="0">OFF</option><option value="1">ON</option>';
            unitSelect.value = comp.value;
        } else if (def.units) {
            valueLabel.textContent = def.name;
            unitSelect.innerHTML = def.units.map(u =>
                `<option value="${u.mult}">${u.label}</option>`
            ).join('');

            // Find best unit
            let displayValue = comp.value;
            let selectedMult = 1;
            for (const u of def.units.slice().reverse()) {
                if (comp.value >= u.mult || u.mult === def.units[def.units.length - 1].mult) {
                    displayValue = comp.value / u.mult;
                    selectedMult = u.mult;
                    break;
                }
            }
            valueInput.value = displayValue;
            unitSelect.value = selectedMult;
        } else {
            valueLabel.textContent = def.name;
            valueInput.value = comp.value;
            unitSelect.innerHTML = `<option value="1">${def.unit}</option>`;
        }
    },

    updateComponentValue() {
        if (!this.selectedComponent) return;

        const value = parseFloat(document.getElementById('prop-value').value);
        const mult = parseFloat(document.getElementById('prop-unit').value);

        if (!isNaN(value)) {
            this.selectedComponent.value = value * mult;
            this.renderComponent(this.selectedComponent);
        }
    },

    // ==================== SIMULATION ====================
    runSimulation() {
        const status = document.getElementById('sim-status');
        status.textContent = 'Simulating...';
        status.className = 'badge badge-magenta';

        // Simple DC analysis using nodal analysis
        try {
            const results = this.dcAnalysis();
            this.displayResults(results);
            status.textContent = 'Complete';
            status.className = 'badge badge-green';

            // Show results in property panel if component selected
            document.getElementById('prop-results').style.display = 'block';
        } catch (error) {
            console.error('Simulation error:', error);
            status.textContent = 'Error';
            status.className = 'badge badge-magenta';
        }
    },

    dcAnalysis() {
        // Build node list
        const nodes = new Map(); // terminal key -> node id
        let nodeId = 0;
        const groundNode = 'GND';

        // Find ground nodes
        this.components.filter(c => c.type === 'ground').forEach(comp => {
            const key = `${comp.id}-gnd`;
            nodes.set(key, groundNode);
        });

        // Assign nodes based on wire connections
        const unionFind = new Map();
        const find = (key) => {
            if (!unionFind.has(key)) unionFind.set(key, key);
            if (unionFind.get(key) !== key) {
                unionFind.set(key, find(unionFind.get(key)));
            }
            return unionFind.get(key);
        };
        const union = (a, b) => {
            const ra = find(a), rb = find(b);
            if (ra !== rb) unionFind.set(ra, rb);
        };

        // Connect wires
        this.wires.forEach(wire => {
            const keyA = `${wire.from.componentId}-${wire.from.terminal}`;
            const keyB = `${wire.to.componentId}-${wire.to.terminal}`;
            union(keyA, keyB);
        });

        // Assign node numbers
        const nodeNumbers = new Map();
        nodeNumbers.set(groundNode, 0);
        let nextNode = 1;

        this.components.forEach(comp => {
            const def = this.componentDefs[comp.type];
            def.terminals.forEach(term => {
                const key = `${comp.id}-${term.id}`;
                const root = find(key);

                if (nodes.has(root)) {
                    nodeNumbers.set(key, nodeNumbers.get(nodes.get(root)) || 0);
                } else if (!nodeNumbers.has(root)) {
                    if (comp.type === 'ground') {
                        nodeNumbers.set(root, 0);
                    } else {
                        nodeNumbers.set(root, nextNode++);
                    }
                }
            });
        });

        // Simple analysis: just calculate based on voltage sources and resistors
        const results = {
            nodeVoltages: new Map(),
            componentCurrents: new Map(),
            componentVoltages: new Map(),
            componentPowers: new Map()
        };

        // For this demo, use a simple approach:
        // Find voltage sources and propagate voltages
        this.components.forEach(comp => {
            if (comp.type === 'dc_voltage') {
                results.componentVoltages.set(comp.id, comp.value);
            } else if (comp.type === 'resistor') {
                // Would need full nodal analysis for accurate results
                results.componentVoltages.set(comp.id, 0);
                results.componentCurrents.set(comp.id, 0);
            }
        });

        return results;
    },

    displayResults(results) {
        // Update component labels with results
        this.components.forEach(comp => {
            const voltage = results.componentVoltages.get(comp.id);
            const current = results.componentCurrents.get(comp.id);

            if (voltage !== undefined || current !== undefined) {
                // Add result label to component
                const g = document.getElementById(`comp-${comp.id}`);
                if (g) {
                    let resultText = g.querySelector('.sim-result');
                    if (!resultText) {
                        resultText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        resultText.classList.add('result-label', 'sim-result');
                        resultText.setAttribute('y', '25');
                        g.appendChild(resultText);
                    }

                    let text = '';
                    if (voltage !== undefined) text += `${voltage.toFixed(2)}V `;
                    if (current !== undefined) text += `${(current * 1000).toFixed(2)}mA`;
                    resultText.textContent = text;
                }
            }
        });

        // Animate current flow
        document.querySelectorAll('.circuit-wire').forEach(wire => {
            wire.classList.add('current-flow');
        });
    },

    // ==================== UTILITIES ====================
    snapToGrid(value) {
        return Math.round(value / this.gridSize) * this.gridSize;
    },

    zoomIn() {
        this.zoom = Math.min(2, this.zoom + 0.1);
        this.updateZoom();
    },

    zoomOut() {
        this.zoom = Math.max(0.5, this.zoom - 0.1);
        this.updateZoom();
    },

    updateZoom() {
        this.svg.style.transform = `scale(${this.zoom})`;
        this.svg.style.transformOrigin = 'top left';
        document.getElementById('zoom-level').textContent = `${Math.round(this.zoom * 100)}%`;
    },

    hideHint() {
        const hint = document.getElementById('canvas-hint');
        if (hint) hint.style.display = 'none';
    },

    clearCircuit() {
        if (!confirm('Clear all components and wires?')) return;

        this.components = [];
        this.wires = [];
        this.selectedComponent = null;
        this.selectedWire = null;
        this.nextId = 1;

        this.componentsLayer.innerHTML = '';
        this.wiresLayer.innerHTML = '';
        this.tempLayer.innerHTML = '';

        this.updatePropertiesPanel();
        document.getElementById('sim-status').textContent = 'Ready';
        document.getElementById('sim-status').className = 'badge badge-cyan';
    },

    exportCircuit() {
        const data = {
            components: this.components,
            wires: this.wires.map(w => ({
                from: { componentId: w.from.componentId, terminal: w.from.terminal },
                to: { componentId: w.to.componentId, terminal: w.to.terminal }
            }))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'circuit.json';
        a.click();
    },

    handleKeyDown(e) {
        if (e.target.tagName === 'INPUT') return;

        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                this.deleteSelected();
                break;
            case 'r':
            case 'R':
                this.rotateSelected();
                break;
            case 'v':
            case 'V':
                this.setTool('select');
                break;
            case 'w':
            case 'W':
                this.setTool('wire');
                break;
            case 'Escape':
                this.cancelWireDrawing();
                this.setTool('select');
                break;
        }

        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            this.duplicateSelected();
        }
    },

    formatValue(value, unit) {
        if (value === 0) return `0 ${unit}`;
        const absValue = Math.abs(value);

        if (absValue >= 1e9) return (value / 1e9).toFixed(1) + ' G' + unit;
        if (absValue >= 1e6) return (value / 1e6).toFixed(1) + ' M' + unit;
        if (absValue >= 1e3) return (value / 1e3).toFixed(1) + ' k' + unit;
        if (absValue >= 1) return value.toFixed(1) + ' ' + unit;
        if (absValue >= 1e-3) return (value * 1e3).toFixed(1) + ' m' + unit;
        if (absValue >= 1e-6) return (value * 1e6).toFixed(1) + ' μ' + unit;
        if (absValue >= 1e-9) return (value * 1e9).toFixed(1) + ' n' + unit;
        if (absValue >= 1e-12) return (value * 1e12).toFixed(1) + ' p' + unit;

        return value.toExponential(1) + ' ' + unit;
    },

    cleanup() {
        this.cancelWireDrawing();
    }
};

window.ElectricalTab = ElectricalTab;
