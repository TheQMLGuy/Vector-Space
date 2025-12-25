/**
 * QAGI Lab - Quantum Circuits Tab
 * Quantum circuit builder and simulator
 */

const QuantumTab = {
    // State
    numQubits: 2,
    circuit: [],
    stateVector: null,
    selectedGate: null,

    // Gate matrices (as complex numbers: [real, imag])
    gates: {
        H: {
            name: 'Hadamard Gate',
            matrix: [
                [[1 / Math.sqrt(2), 0], [1 / Math.sqrt(2), 0]],
                [[1 / Math.sqrt(2), 0], [-1 / Math.sqrt(2), 0]]
            ],
            description: 'Creates an equal superposition from a basis state. Maps |0⟩ to (|0⟩+|1⟩)/√2 and |1⟩ to (|0⟩-|1⟩)/√2.'
        },
        X: {
            name: 'Pauli-X Gate (NOT)',
            matrix: [
                [[0, 0], [1, 0]],
                [[1, 0], [0, 0]]
            ],
            description: 'Bit-flip gate. Rotates the qubit state by π around the X-axis. Maps |0⟩ to |1⟩ and |1⟩ to |0⟩.'
        },
        Y: {
            name: 'Pauli-Y Gate',
            matrix: [
                [[0, 0], [0, -1]],
                [[0, 1], [0, 0]]
            ],
            description: 'Rotates the qubit state by π around the Y-axis. Combines bit-flip with phase flip.'
        },
        Z: {
            name: 'Pauli-Z Gate',
            matrix: [
                [[1, 0], [0, 0]],
                [[0, 0], [-1, 0]]
            ],
            description: 'Phase-flip gate. Rotates the qubit state by π around the Z-axis. Maps |1⟩ to -|1⟩.'
        },
        S: {
            name: 'S Gate (Phase)',
            matrix: [
                [[1, 0], [0, 0]],
                [[0, 0], [0, 1]]
            ],
            description: 'Rotates the qubit state by π/2 around the Z-axis. Also known as the √Z gate.'
        },
        T: {
            name: 'T Gate (π/8)',
            matrix: [
                [[1, 0], [0, 0]],
                [[0, 0], [Math.cos(Math.PI / 4), Math.sin(Math.PI / 4)]]
            ],
            description: 'Rotates the qubit state by π/4 around the Z-axis. Important for universal quantum computation.'
        },
        CNOT: {
            name: 'Controlled-NOT (CNOT)',
            matrix: null, // Special handling
            description: 'Two-qubit gate. Flips the target qubit if the control qubit is |1⟩. Creates entanglement.'
        }
    },

    init() {
        this.initState();
        this.bindEvents();
        this.setupHubEvents();
        this.renderCircuit();
        this.updateStateVectorDisplay();
        this.drawBlochSphere();
        this.updateGateReference('H');
    },

    initState() {
        // Initialize to |00...0⟩ state
        const dim = Math.pow(2, this.numQubits);
        this.stateVector = new Array(dim).fill(null).map((_, i) => i === 0 ? [1, 0] : [0, 0]);

        // Initialize circuit with empty slots
        this.circuit = [];
        for (let q = 0; q < this.numQubits; q++) {
            this.circuit.push(new Array(8).fill(null)); // 8 time steps
        }
    },

    bindEvents() {
        // Add qubit button
        document.getElementById('btn-add-qubit')?.addEventListener('click', () => {
            if (this.numQubits < 5) {
                this.numQubits++;
                this.initState();
                this.renderCircuit();
                this.updateQubitSelectors();
                this.updateStateVectorDisplay();
            }
        });

        // Clear circuit button
        document.getElementById('btn-clear-circuit')?.addEventListener('click', () => {
            this.initState();
            this.renderCircuit();
            this.updateStateVectorDisplay();
            this.drawBlochSphere();
            this.updateEntanglement();
        });

        // Run circuit button
        document.getElementById('btn-run-circuit')?.addEventListener('click', () => {
            this.runCircuit();
        });

        // Gate palette buttons
        document.querySelectorAll('.gate-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.gate-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedGate = btn.dataset.gate;
            });
        });

        // Quick operation buttons
        document.querySelectorAll('.op-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const qubit = parseInt(document.getElementById('op-qubit-select')?.value || 0);
                const gate = btn.dataset.op;
                this.applyGate(gate, qubit);
                this.updateStateVectorDisplay();
                this.drawBlochSphere();
                this.updateEntanglement();
            });
        });

        // Rotation gates
        document.querySelectorAll('[data-rot]').forEach(btn => {
            btn.addEventListener('click', () => {
                const qubit = parseInt(document.getElementById('op-qubit-select')?.value || 0);
                const rotation = btn.dataset.rot;
                const angle = parseFloat(document.getElementById('rotation-angle')?.value || 90);
                this.applyRotation(rotation, qubit, angle * Math.PI / 180);
                this.updateStateVectorDisplay();
                this.drawBlochSphere();
                this.updateEntanglement();
            });
        });

        // Gate reference buttons
        document.querySelectorAll('.gate-ref-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.gate-ref-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateGateReference(btn.dataset.ref);
            });
        });

        // Bell state buttons
        document.querySelectorAll('.bell-state-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.createBellState(btn.dataset.bell);
            });
        });

        // Bloch sphere qubit selector
        document.getElementById('bloch-qubit-select')?.addEventListener('change', () => {
            this.drawBlochSphere();
        });
    },

    renderCircuit() {
        const grid = document.getElementById('circuit-grid');
        if (!grid) return;

        grid.innerHTML = '';

        for (let q = 0; q < this.numQubits; q++) {
            const row = document.createElement('div');
            row.className = 'qubit-row';

            const label = document.createElement('div');
            label.className = 'qubit-label';
            label.textContent = `|q${q}⟩`;
            row.appendChild(label);

            const wire = document.createElement('div');
            wire.className = 'qubit-wire';

            for (let t = 0; t < 8; t++) {
                const slot = document.createElement('div');
                slot.className = 'gate-slot empty';
                slot.dataset.qubit = q;
                slot.dataset.time = t;

                if (this.circuit[q] && this.circuit[q][t]) {
                    slot.classList.remove('empty');
                    const gateEl = document.createElement('div');
                    gateEl.className = 'circuit-gate';
                    gateEl.textContent = this.circuit[q][t];
                    if (this.circuit[q][t] === 'M') {
                        gateEl.classList.add('measure');
                    }
                    slot.appendChild(gateEl);
                }

                slot.addEventListener('click', () => {
                    if (this.selectedGate) {
                        this.placeGate(q, t, this.selectedGate);
                    }
                });

                wire.appendChild(slot);
            }

            row.appendChild(wire);
            grid.appendChild(row);
        }

        this.updateQubitBadge();
    },

    placeGate(qubit, time, gate) {
        if (gate === 'CNOT' && this.numQubits < 2) {
            return; // Need at least 2 qubits for CNOT
        }

        this.circuit[qubit][time] = gate;
        this.renderCircuit();
    },

    runCircuit() {
        // Reset state
        const dim = Math.pow(2, this.numQubits);
        this.stateVector = new Array(dim).fill(null).map((_, i) => i === 0 ? [1, 0] : [0, 0]);

        // Execute gates in order
        for (let t = 0; t < 8; t++) {
            for (let q = 0; q < this.numQubits; q++) {
                const gate = this.circuit[q][t];
                if (gate && gate !== 'M') {
                    if (gate === 'CNOT') {
                        // For now, CNOT with control=q, target=q+1
                        if (q + 1 < this.numQubits) {
                            this.applyCNOT(q, q + 1);
                        }
                    } else {
                        this.applyGate(gate, q);
                    }
                }
            }
        }

        this.updateStateVectorDisplay();
        this.drawBlochSphere();
        this.updateEntanglement();
    },

    // Complex number operations
    complexMult(a, b) {
        return [
            a[0] * b[0] - a[1] * b[1],
            a[0] * b[1] + a[1] * b[0]
        ];
    },

    complexAdd(a, b) {
        return [a[0] + b[0], a[1] + b[1]];
    },

    complexMag(a) {
        return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
    },

    applyGate(gateName, qubit) {
        const gate = this.gates[gateName];
        if (!gate || !gate.matrix) return;

        const dim = Math.pow(2, this.numQubits);
        const newState = new Array(dim).fill(null).map(() => [0, 0]);

        for (let i = 0; i < dim; i++) {
            // Get the qubit's bit value in this basis state
            const bit = (i >> (this.numQubits - 1 - qubit)) & 1;

            for (let newBit = 0; newBit < 2; newBit++) {
                const matrixElement = gate.matrix[newBit][bit];

                // Calculate the new index with the qubit bit changed
                const mask = 1 << (this.numQubits - 1 - qubit);
                let newIndex = (i & ~mask) | (newBit << (this.numQubits - 1 - qubit));

                const contrib = this.complexMult(matrixElement, this.stateVector[i]);
                newState[newIndex] = this.complexAdd(newState[newIndex], contrib);
            }
        }

        this.stateVector = newState;
    },

    applyCNOT(control, target) {
        const dim = Math.pow(2, this.numQubits);
        const newState = new Array(dim).fill(null).map((_, i) => [...this.stateVector[i]]);

        for (let i = 0; i < dim; i++) {
            const controlBit = (i >> (this.numQubits - 1 - control)) & 1;
            const targetBit = (i >> (this.numQubits - 1 - target)) & 1;

            if (controlBit === 1) {
                // Flip the target bit
                const newTargetBit = targetBit ^ 1;
                const targetMask = 1 << (this.numQubits - 1 - target);
                const newIndex = (i & ~targetMask) | (newTargetBit << (this.numQubits - 1 - target));

                // Swap amplitudes
                [newState[i], newState[newIndex]] = [this.stateVector[newIndex], this.stateVector[i]];
            }
        }

        this.stateVector = newState;
    },

    applyRotation(axis, qubit, angle) {
        const cos = Math.cos(angle / 2);
        const sin = Math.sin(angle / 2);

        let matrix;
        switch (axis) {
            case 'RX':
                matrix = [
                    [[cos, 0], [0, -sin]],
                    [[0, -sin], [cos, 0]]
                ];
                break;
            case 'RY':
                matrix = [
                    [[cos, 0], [-sin, 0]],
                    [[sin, 0], [cos, 0]]
                ];
                break;
            case 'RZ':
                matrix = [
                    [[cos, -sin], [0, 0]],
                    [[0, 0], [cos, sin]]
                ];
                break;
            default:
                return;
        }

        // Apply the rotation matrix
        const dim = Math.pow(2, this.numQubits);
        const newState = new Array(dim).fill(null).map(() => [0, 0]);

        for (let i = 0; i < dim; i++) {
            const bit = (i >> (this.numQubits - 1 - qubit)) & 1;

            for (let newBit = 0; newBit < 2; newBit++) {
                const matrixElement = matrix[newBit][bit];
                const mask = 1 << (this.numQubits - 1 - qubit);
                let newIndex = (i & ~mask) | (newBit << (this.numQubits - 1 - qubit));

                const contrib = this.complexMult(matrixElement, this.stateVector[i]);
                newState[newIndex] = this.complexAdd(newState[newIndex], contrib);
            }
        }

        this.stateVector = newState;
    },

    createBellState(type) {
        // Ensure we have at least 2 qubits
        if (this.numQubits < 2) {
            this.numQubits = 2;
            this.initState();
            this.renderCircuit();
            this.updateQubitSelectors();
        } else {
            // Reset to |00⟩
            const dim = Math.pow(2, this.numQubits);
            this.stateVector = new Array(dim).fill(null).map((_, i) => i === 0 ? [1, 0] : [0, 0]);
        }

        const sqrt2 = 1 / Math.sqrt(2);

        switch (type) {
            case 'phi_plus': // (|00⟩ + |11⟩)/√2
                this.applyGate('H', 0);
                this.applyCNOT(0, 1);
                break;
            case 'phi_minus': // (|00⟩ - |11⟩)/√2
                this.applyGate('H', 0);
                this.applyCNOT(0, 1);
                this.applyGate('Z', 0);
                break;
            case 'psi_plus': // (|01⟩ + |10⟩)/√2
                this.applyGate('X', 1);
                this.applyGate('H', 0);
                this.applyCNOT(0, 1);
                break;
            case 'psi_minus': // (|01⟩ - |10⟩)/√2
                this.applyGate('X', 1);
                this.applyGate('H', 0);
                this.applyCNOT(0, 1);
                this.applyGate('Z', 0);
                break;
        }

        this.updateStateVectorDisplay();
        this.drawBlochSphere();
        this.updateEntanglement();
    },

    updateStateVectorDisplay() {
        const container = document.getElementById('state-vector');
        const probsContainer = document.getElementById('measurement-probs');
        if (!container) return;

        const dim = Math.pow(2, this.numQubits);

        // State vector display
        container.innerHTML = this.stateVector.map((amp, i) => {
            const prob = amp[0] * amp[0] + amp[1] * amp[1];
            const basis = i.toString(2).padStart(this.numQubits, '0');
            const ampStr = this.formatComplex(amp);

            return `
                <div class="state-item">
                    <span class="state-basis">|${basis}⟩</span>
                    <div class="state-bar-container">
                        <div class="state-bar" style="width: ${prob * 100}%;"></div>
                    </div>
                    <span class="state-prob">${prob.toFixed(3)}</span>
                    <span class="state-amp">${ampStr}</span>
                </div>
            `;
        }).join('');

        // Measurement probabilities
        if (probsContainer) {
            probsContainer.innerHTML = this.stateVector.map((amp, i) => {
                const prob = amp[0] * amp[0] + amp[1] * amp[1];
                const basis = i.toString(2).padStart(this.numQubits, '0');
                const percentage = (prob * 100).toFixed(1);

                return `
                    <div class="measurement-item">
                        <span class="measurement-label">${basis}</span>
                        <div class="measurement-bar-wrap">
                            <div class="measurement-bar" style="width: ${percentage}%;">
                                ${percentage > 10 ? percentage + '%' : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        this.updateQubitBadge();
    },

    formatComplex(c) {
        const real = c[0];
        const imag = c[1];

        if (Math.abs(imag) < 0.0001) {
            return `(${real.toFixed(3)})`;
        } else if (Math.abs(real) < 0.0001) {
            return `(${imag.toFixed(3)}i)`;
        } else {
            const sign = imag >= 0 ? '+' : '';
            return `(${real.toFixed(2)}${sign}${imag.toFixed(2)}i)`;
        }
    },

    updateQubitBadge() {
        const badge = document.getElementById('qubit-count-badge');
        if (badge) {
            badge.textContent = `${this.numQubits} Qubit${this.numQubits > 1 ? 's' : ''}`;
        }
    },

    updateQubitSelectors() {
        const selectors = ['bloch-qubit-select', 'op-qubit-select'];
        selectors.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.innerHTML = '';
                for (let i = 0; i < this.numQubits; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = `Qubit ${i}`;
                    select.appendChild(option);
                }
            }
        });
    },

    drawBlochSphere() {
        const canvas = document.getElementById('bloch-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(w, h) / 2 - 30;

        // Clear canvas
        ctx.clearRect(0, 0, w, h);

        // Get selected qubit's state
        const qubitIdx = parseInt(document.getElementById('bloch-qubit-select')?.value || 0);
        const { alpha, beta } = this.getQubitState(qubitIdx);

        // Calculate Bloch sphere coordinates
        const theta = 2 * Math.acos(this.complexMag(alpha));
        const phi = Math.atan2(beta[1], beta[0]) - Math.atan2(alpha[1], alpha[0]);

        const x = Math.sin(theta) * Math.cos(phi);
        const y = Math.sin(theta) * Math.sin(phi);
        const z = Math.cos(theta);

        // Draw sphere outline
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 1;

        // Main circle
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // Horizontal ellipse (equator)
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Vertical ellipse
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 0.3, r, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.setLineDash([5, 5]);

        // X axis
        ctx.beginPath();
        ctx.moveTo(cx - r, cy);
        ctx.lineTo(cx + r, cy);
        ctx.stroke();

        // Y axis
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 0.3);
        ctx.lineTo(cx, cy + r * 0.3);
        ctx.stroke();

        // Z axis
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx, cy + r);
        ctx.stroke();

        ctx.setLineDash([]);

        // Draw axis labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '14px JetBrains Mono';
        ctx.fillText('|0⟩', cx + 5, cy - r - 5);
        ctx.fillText('|1⟩', cx + 5, cy + r + 15);
        ctx.fillText('+X', cx + r + 5, cy + 5);
        ctx.fillText('+Y', cx + r * 0.35, cy - r * 0.2);

        // Draw state vector
        const screenX = cx + x * r * 0.8;
        const screenY = cy - z * r * 0.8;

        // Line from center to point
        ctx.strokeStyle = 'rgba(255, 0, 170, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(screenX, screenY);
        ctx.stroke();

        // Point
        ctx.fillStyle = '#ff00aa';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 20);
        gradient.addColorStop(0, 'rgba(255, 0, 170, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 0, 170, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
        ctx.fill();

        // Update coordinate displays
        document.getElementById('bloch-theta').textContent = (theta * 180 / Math.PI).toFixed(1) + '°';
        document.getElementById('bloch-phi').textContent = (phi * 180 / Math.PI).toFixed(1) + '°';
        document.getElementById('bloch-x').textContent = x.toFixed(3);
        document.getElementById('bloch-y').textContent = y.toFixed(3);
        document.getElementById('bloch-z').textContent = z.toFixed(3);

        // Update state notation
        this.updateStateNotation(alpha, beta);
    },

    getQubitState(qubitIdx) {
        // Calculate reduced density matrix for the qubit
        // For simplicity, trace out other qubits
        const dim = Math.pow(2, this.numQubits);
        let alpha = [0, 0]; // amplitude of |0⟩
        let beta = [0, 0];  // amplitude of |1⟩

        for (let i = 0; i < dim; i++) {
            const bit = (i >> (this.numQubits - 1 - qubitIdx)) & 1;
            const amp = this.stateVector[i];

            if (bit === 0) {
                alpha = this.complexAdd(alpha, [amp[0] * amp[0] + amp[1] * amp[1], 0]);
            } else {
                beta = this.complexAdd(beta, [amp[0] * amp[0] + amp[1] * amp[1], 0]);
            }
        }

        // Normalize
        const norm = Math.sqrt(alpha[0] + beta[0]);
        alpha = [Math.sqrt(alpha[0]), 0];
        beta = [Math.sqrt(beta[0]), 0];

        return { alpha, beta };
    },

    updateStateNotation(alpha, beta) {
        const notation = document.getElementById('state-notation');
        if (!notation) return;

        const a = this.complexMag(alpha);
        const b = this.complexMag(beta);

        if (Math.abs(a - 1) < 0.01) {
            notation.textContent = '|ψ⟩ = |0⟩';
        } else if (Math.abs(b - 1) < 0.01) {
            notation.textContent = '|ψ⟩ = |1⟩';
        } else if (Math.abs(a - b) < 0.01) {
            notation.textContent = '|ψ⟩ = (|0⟩ + |1⟩)/√2';
        } else {
            notation.textContent = `|ψ⟩ = ${a.toFixed(2)}|0⟩ + ${b.toFixed(2)}|1⟩`;
        }
    },

    updateGateReference(gateName) {
        const gate = this.gates[gateName];
        if (!gate) return;

        const panel = document.getElementById('gate-info-panel');
        if (!panel) return;

        let matrixHTML = '';
        if (gate.matrix) {
            matrixHTML = `
                <table class="quantum-matrix">
                    ${gate.matrix.map(row => `
                        <tr>${row.map(cell => `<td>${this.formatMatrixCell(cell)}</td>`).join('')}</tr>
                    `).join('')}
                </table>
            `;
        } else {
            matrixHTML = `
                <table class="quantum-matrix">
                    <tr><td>1</td><td>0</td><td>0</td><td>0</td></tr>
                    <tr><td>0</td><td>1</td><td>0</td><td>0</td></tr>
                    <tr><td>0</td><td>0</td><td>0</td><td>1</td></tr>
                    <tr><td>0</td><td>0</td><td>1</td><td>0</td></tr>
                </table>
            `;
        }

        panel.innerHTML = `
            <div class="gate-info-header">
                <span class="gate-symbol">${gateName}</span>
                <span class="gate-name">${gate.name}</span>
            </div>
            <div class="gate-description">${gate.description}</div>
            <div class="gate-matrix">
                <div class="matrix-label">Matrix Representation</div>
                <div class="matrix-display">${matrixHTML}</div>
            </div>
        `;
    },

    formatMatrixCell(cell) {
        const [real, imag] = cell;

        // Check for common values
        const sqrt2Inv = 1 / Math.sqrt(2);

        if (Math.abs(real - 1) < 0.001 && Math.abs(imag) < 0.001) return '1';
        if (Math.abs(real + 1) < 0.001 && Math.abs(imag) < 0.001) return '-1';
        if (Math.abs(real) < 0.001 && Math.abs(imag) < 0.001) return '0';
        if (Math.abs(real) < 0.001 && Math.abs(imag - 1) < 0.001) return 'i';
        if (Math.abs(real) < 0.001 && Math.abs(imag + 1) < 0.001) return '-i';
        if (Math.abs(real - sqrt2Inv) < 0.001 && Math.abs(imag) < 0.001) return '1/√2';
        if (Math.abs(real + sqrt2Inv) < 0.001 && Math.abs(imag) < 0.001) return '-1/√2';

        if (Math.abs(imag) < 0.001) {
            return real.toFixed(2);
        } else if (Math.abs(real) < 0.001) {
            return `${imag.toFixed(2)}i`;
        } else {
            const sign = imag >= 0 ? '+' : '';
            return `${real.toFixed(2)}${sign}${imag.toFixed(2)}i`;
        }
    },

    updateEntanglement() {
        if (this.numQubits < 2) {
            document.getElementById('entanglement-value').textContent = 'N/A';
            document.getElementById('entanglement-bar').style.width = '0%';
            document.getElementById('entanglement-status').textContent = 'Single Qubit';
            return;
        }

        // Calculate entanglement entropy for the first qubit
        // Using von Neumann entropy of the reduced density matrix

        // Calculate reduced density matrix for qubit 0
        let rho00 = 0, rho11 = 0;
        const dim = Math.pow(2, this.numQubits);

        for (let i = 0; i < dim; i++) {
            const bit0 = (i >> (this.numQubits - 1)) & 1;
            const prob = this.stateVector[i][0] ** 2 + this.stateVector[i][1] ** 2;

            if (bit0 === 0) {
                rho00 += prob;
            } else {
                rho11 += prob;
            }
        }

        // Von Neumann entropy: S = -Tr(ρ log₂ ρ)
        let entropy = 0;
        if (rho00 > 0.0001) entropy -= rho00 * Math.log2(rho00);
        if (rho11 > 0.0001) entropy -= rho11 * Math.log2(rho11);

        // Normalize to [0, 1]
        const maxEntropy = 1; // For 2 qubits
        const normalizedEntropy = Math.min(entropy / maxEntropy, 1);

        document.getElementById('entanglement-value').textContent = entropy.toFixed(3);
        document.getElementById('entanglement-bar').style.width = (normalizedEntropy * 100) + '%';

        const status = document.getElementById('entanglement-status');
        if (entropy < 0.01) {
            status.textContent = 'Separable';
            status.className = 'badge badge-cyan';
        } else if (entropy > 0.95) {
            status.textContent = 'Max Entangled';
            status.className = 'badge badge-magenta';
        } else {
            status.textContent = 'Entangled';
            status.className = 'badge badge-green';
        }
    },

    // ==================== DATA HUB INTEGRATION ====================
    setupHubEvents() {
        // Export buttons
        document.getElementById('hub-export-state')?.addEventListener('click', () => this.hubExportState());
        document.getElementById('hub-export-amplitudes')?.addEventListener('click', () => this.hubExportAmplitudes());
        document.getElementById('hub-export-probs')?.addEventListener('click', () => this.hubExportProbabilities());
        document.getElementById('hub-export-gate')?.addEventListener('click', () => this.hubExportGate());

        // Import buttons
        document.getElementById('hub-import-unitary')?.addEventListener('click', () => this.hubImportUnitary());

        // Listen for "use data" events from hub
        if (window.QAGIDataHub) {
            QAGIDataHub.subscribe('use-data', (e) => {
                if (e.detail.targetTab === 'quantum') {
                    this.handleHubImport(e.detail.entry);
                }
            });
        }
    },

    hubExportState() {
        if (!window.QAGIDataHub || !this.stateVector) return;

        QAGIDataHub.exportVector(
            'quantum',
            this.stateVector,
            `Quantum State (${this.numQubits} qubits)`,
            `State vector with ${this.stateVector.length} amplitudes`
        );
    },

    hubExportAmplitudes() {
        if (!window.QAGIDataHub || !this.stateVector) return;

        // Convert to complex number format for Complex tab
        const complexAmps = this.stateVector.map((amp, i) => ({
            basis: i.toString(2).padStart(this.numQubits, '0'),
            re: amp[0],
            im: amp[1]
        }));

        QAGIDataHub.exportComplex(
            'quantum',
            complexAmps,
            `State Amplitudes (${this.numQubits} qubits)`,
            `${complexAmps.length} complex amplitudes`
        );
    },

    hubExportProbabilities() {
        if (!window.QAGIDataHub || !this.stateVector) return;

        const probs = this.stateVector.map(amp => amp[0] ** 2 + amp[1] ** 2);

        QAGIDataHub.exportArray(
            'quantum',
            probs,
            'Measurement Probabilities',
            `${probs.length} probability values`
        );
    },

    hubExportGate() {
        if (!window.QAGIDataHub) return;

        // Export the currently selected gate matrix
        const selectedGate = document.querySelector('.gate-ref-btn.active')?.dataset.ref || 'H';
        const gate = this.gates[selectedGate];

        if (gate && gate.matrix) {
            // Convert complex matrix to real 2D array for matrices tab
            const realMatrix = gate.matrix.map(row =>
                row.map(cell => Math.sqrt(cell[0] ** 2 + cell[1] ** 2))
            );

            QAGIDataHub.exportMatrix(
                'quantum',
                realMatrix,
                `${gate.name} (Magnitudes)`,
                'Quantum gate matrix magnitudes'
            );

            // Also export full complex matrix
            QAGIDataHub.export('quantum', 'complex', gate.matrix, {
                name: `${gate.name} (Complex)`,
                description: 'Full complex quantum gate matrix'
            });
        } else {
            QAGIUtils?.showToast('Select a gate from the reference panel', 'info');
        }
    },

    hubImportUnitary() {
        if (!window.QAGIDataHub) return;

        const matrices = QAGIDataHub.list('matrices');
        if (matrices.length === 0) {
            QAGIUtils?.showToast('No matrices in Data Hub. Export from Matrices tab first.', 'info');
            return;
        }

        // For now, show a message - custom gate import would require more work
        QAGIUtils?.showToast('Custom gate import: Coming soon! Use matrices in the Matrices tab to analyze quantum gates.', 'info');
    },

    handleHubImport(entry) {
        if (entry.dataType === 'complex') {
            QAGIUtils?.showToast('Complex data received. Use Complex tab to visualize.', 'info');
        }
    },

    cleanup() {
        // Cleanup if needed when switching tabs
    }
};

// Make globally available
window.QuantumTab = QuantumTab;

