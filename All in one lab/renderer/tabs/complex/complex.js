/**
 * QAGI Lab - Complex Numbers Tab
 * Complex number operations, visualization, and analysis
 */

const ComplexTab = {
    complexPlane: null,
    operationPlot: null,
    rootsPlot: null,
    powerPlot: null,
    currentInputMode: 'rectangular',
    currentOperation: 'add',
    selectedAdvOp: null,

    init() {
        this.setupEventListeners();
        this.visualizeComplex();
        this.calculateOperation();
    },

    setupEventListeners() {
        // Input mode toggle
        document.querySelectorAll('.complex-input-modes .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.complex-input-modes .tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentInputMode = btn.dataset.mode;
                this.toggleInputMode();
            });
        });

        // Visualize button
        document.getElementById('btn-visualize')?.addEventListener('click', () => this.visualizeComplex());
        document.getElementById('btn-complex-reset')?.addEventListener('click', () => this.resetVisualizer());

        // Operation selector
        document.querySelectorAll('.op-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentOperation = btn.dataset.op;
            });
        });

        document.getElementById('btn-calculate-op')?.addEventListener('click', () => this.calculateOperation());

        // Advanced operations
        document.querySelectorAll('.adv-op-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.adv-op-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedAdvOp = btn.dataset.op;
                this.calculateAdvanced();
            });
        });

        // Roots of unity
        document.getElementById('roots-of')?.addEventListener('change', (e) => {
            const customInput = document.getElementById('custom-root-input');
            customInput.style.display = e.target.value === 'custom' ? 'grid' : 'none';
        });
        document.getElementById('btn-calc-roots')?.addEventListener('click', () => this.calculateRoots());

        // Powers
        document.getElementById('btn-calc-power')?.addEventListener('click', () => this.calculatePower());

        // Domain coloring
        document.getElementById('btn-plot-function')?.addEventListener('click', () => this.plotDomainColoring());

        // Real-time updates for inputs
        ['complex-real', 'complex-imag', 'complex-mag', 'complex-angle'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.visualizeComplex());
        });
    },

    toggleInputMode() {
        const rectInput = document.getElementById('rectangular-input');
        const polarInput = document.getElementById('polar-input');

        if (this.currentInputMode === 'rectangular') {
            rectInput.style.display = 'block';
            polarInput.style.display = 'none';
        } else {
            rectInput.style.display = 'none';
            polarInput.style.display = 'block';
        }
    },

    // ==================== COMPLEX NUMBER UTILITIES ====================
    getComplexFromInput() {
        if (this.currentInputMode === 'rectangular') {
            const real = parseFloat(document.getElementById('complex-real').value) || 0;
            const imag = parseFloat(document.getElementById('complex-imag').value) || 0;
            return math.complex(real, imag);
        } else {
            const mag = parseFloat(document.getElementById('complex-mag').value) || 0;
            const angle = parseFloat(document.getElementById('complex-angle').value) || 0;
            const angleRad = angle * Math.PI / 180;
            return math.complex({ r: mag, phi: angleRad });
        }
    },

    formatComplex(z, precision = 4) {
        const real = z.re;
        const imag = z.im;

        if (Math.abs(imag) < 1e-10) {
            return `${real.toFixed(precision)}`;
        } else if (Math.abs(real) < 1e-10) {
            return `${imag.toFixed(precision)}i`;
        } else if (imag >= 0) {
            return `${real.toFixed(precision)} + ${imag.toFixed(precision)}i`;
        } else {
            return `${real.toFixed(precision)} - ${Math.abs(imag).toFixed(precision)}i`;
        }
    },

    formatPolar(z, precision = 2) {
        const mag = math.abs(z);
        const angle = math.arg(z) * 180 / Math.PI;
        return `${mag.toFixed(precision)}∠${angle.toFixed(precision)}°`;
    },

    formatExponential(z, precision = 3) {
        const mag = math.abs(z);
        const angle = math.arg(z);
        return `${mag.toFixed(precision)}e^(${angle.toFixed(precision)}i)`;
    },

    // ==================== VISUALIZATION ====================
    visualizeComplex() {
        const z = this.getComplexFromInput();
        const conjugate = math.conj(z);

        // Update info display
        document.getElementById('info-rectangular').textContent = this.formatComplex(z);
        document.getElementById('info-polar').textContent = this.formatPolar(z);
        document.getElementById('info-exponential').textContent = this.formatExponential(z);
        document.getElementById('info-conjugate').textContent = this.formatComplex(conjugate);

        // Sync inputs
        if (this.currentInputMode === 'rectangular') {
            document.getElementById('complex-mag').value = math.abs(z).toFixed(4);
            document.getElementById('complex-angle').value = (math.arg(z) * 180 / Math.PI).toFixed(4);
        } else {
            document.getElementById('complex-real').value = z.re.toFixed(4);
            document.getElementById('complex-imag').value = z.im.toFixed(4);
        }

        this.drawComplexPlane(z, conjugate);
    },

    drawComplexPlane(z, conjugate) {
        const container = document.getElementById('complex-plane');
        if (!container) return;

        const maxVal = Math.max(Math.abs(z.re), Math.abs(z.im), 2) * 1.5;

        const traces = [
            // Origin point
            {
                x: [0],
                y: [0],
                mode: 'markers',
                marker: { size: 8, color: '#888' },
                name: 'Origin',
                showlegend: false
            },
            // Complex number z
            {
                x: [0, z.re],
                y: [0, z.im],
                mode: 'lines+markers',
                line: { color: '#00d4ff', width: 3 },
                marker: { size: 12, color: '#00d4ff' },
                name: `z = ${this.formatComplex(z, 2)}`
            },
            // Conjugate
            {
                x: [0, conjugate.re],
                y: [0, conjugate.im],
                mode: 'lines+markers',
                line: { color: '#ff00aa', width: 2, dash: 'dash' },
                marker: { size: 10, color: '#ff00aa' },
                name: `z̄ = ${this.formatComplex(conjugate, 2)}`
            },
            // Real projection
            {
                x: [z.re, z.re],
                y: [0, z.im],
                mode: 'lines',
                line: { color: '#00ff88', width: 1, dash: 'dot' },
                showlegend: false
            },
            // Imaginary projection
            {
                x: [0, z.re],
                y: [z.im, z.im],
                mode: 'lines',
                line: { color: '#ffdd00', width: 1, dash: 'dot' },
                showlegend: false
            }
        ];

        const layout = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: '#e0e0e0', family: 'Inter' },
            margin: { t: 30, r: 30, b: 40, l: 50 },
            xaxis: {
                title: 'Real',
                range: [-maxVal, maxVal],
                zeroline: true,
                zerolinecolor: '#444',
                gridcolor: '#333',
                tickfont: { size: 10 }
            },
            yaxis: {
                title: 'Imaginary',
                range: [-maxVal, maxVal],
                zeroline: true,
                zerolinecolor: '#444',
                gridcolor: '#333',
                tickfont: { size: 10 },
                scaleanchor: 'x',
                scaleratio: 1
            },
            showlegend: true,
            legend: {
                x: 0,
                y: 1,
                bgcolor: 'rgba(0,0,0,0.5)',
                font: { size: 10 }
            }
        };

        Plotly.newPlot(container, traces, layout, { responsive: true, displayModeBar: false });
    },

    resetVisualizer() {
        document.getElementById('complex-real').value = 3;
        document.getElementById('complex-imag').value = 4;
        document.getElementById('complex-mag').value = 5;
        document.getElementById('complex-angle').value = 53.13;
        this.visualizeComplex();
    },

    // ==================== OPERATIONS ====================
    calculateOperation() {
        const z1Real = parseFloat(document.getElementById('z1-real').value) || 0;
        const z1Imag = parseFloat(document.getElementById('z1-imag').value) || 0;
        const z2Real = parseFloat(document.getElementById('z2-real').value) || 0;
        const z2Imag = parseFloat(document.getElementById('z2-imag').value) || 0;

        const z1 = math.complex(z1Real, z1Imag);
        const z2 = math.complex(z2Real, z2Imag);
        let result;

        switch (this.currentOperation) {
            case 'add':
                result = math.add(z1, z2);
                break;
            case 'subtract':
                result = math.subtract(z1, z2);
                break;
            case 'multiply':
                result = math.multiply(z1, z2);
                break;
            case 'divide':
                result = math.divide(z1, z2);
                break;
            default:
                result = math.add(z1, z2);
        }

        document.getElementById('op-result').textContent = this.formatComplex(result);
        document.getElementById('op-magnitude').textContent = `|z| = ${math.abs(result).toFixed(4)}`;
        document.getElementById('op-angle').textContent = `θ = ${(math.arg(result) * 180 / Math.PI).toFixed(2)}°`;

        this.drawOperationVisual(z1, z2, result);
    },

    drawOperationVisual(z1, z2, result) {
        const container = document.getElementById('operation-visual');
        if (!container) return;

        const maxVal = Math.max(
            Math.abs(z1.re), Math.abs(z1.im),
            Math.abs(z2.re), Math.abs(z2.im),
            Math.abs(result.re), Math.abs(result.im),
            2
        ) * 1.3;

        const traces = [
            {
                x: [0, z1.re],
                y: [0, z1.im],
                mode: 'lines+markers',
                line: { color: '#00d4ff', width: 2 },
                marker: { size: 8 },
                name: 'z₁'
            },
            {
                x: [0, z2.re],
                y: [0, z2.im],
                mode: 'lines+markers',
                line: { color: '#ff00aa', width: 2 },
                marker: { size: 8 },
                name: 'z₂'
            },
            {
                x: [0, result.re],
                y: [0, result.im],
                mode: 'lines+markers',
                line: { color: '#00ff88', width: 3 },
                marker: { size: 10 },
                name: 'Result'
            }
        ];

        const layout = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: '#e0e0e0', size: 10 },
            margin: { t: 20, r: 20, b: 30, l: 40 },
            xaxis: {
                range: [-maxVal, maxVal],
                zeroline: true,
                zerolinecolor: '#444',
                gridcolor: '#333'
            },
            yaxis: {
                range: [-maxVal, maxVal],
                zeroline: true,
                zerolinecolor: '#444',
                gridcolor: '#333',
                scaleanchor: 'x'
            },
            showlegend: true,
            legend: { x: 0, y: 1, font: { size: 9 } }
        };

        Plotly.newPlot(container, traces, layout, { responsive: true, displayModeBar: false });
    },

    // ==================== ADVANCED OPERATIONS ====================
    calculateAdvanced() {
        const real = parseFloat(document.getElementById('adv-real').value) || 0;
        const imag = parseFloat(document.getElementById('adv-imag').value) || 0;
        const z = math.complex(real, imag);
        let result;

        switch (this.selectedAdvOp) {
            case 'sqrt':
                result = math.sqrt(z);
                break;
            case 'square':
                result = math.multiply(z, z);
                break;
            case 'cube':
                result = math.pow(z, 3);
                break;
            case 'reciprocal':
                result = math.divide(1, z);
                break;
            case 'exp':
                result = math.exp(z);
                break;
            case 'ln':
                result = math.log(z);
                break;
            case 'sin':
                result = math.sin(z);
                break;
            case 'cos':
                result = math.cos(z);
                break;
            default:
                return;
        }

        document.getElementById('adv-result-rect').textContent = this.formatComplex(result);
        document.getElementById('adv-result-polar').textContent = this.formatPolar(result);
    },

    // ==================== ROOTS OF UNITY ====================
    calculateRoots() {
        const n = parseInt(document.getElementById('roots-n').value) || 5;
        const rootsOf = document.getElementById('roots-of').value;

        let baseNumber;
        if (rootsOf === 'unity') {
            baseNumber = math.complex(1, 0);
        } else {
            const real = parseFloat(document.getElementById('root-real').value) || 1;
            const imag = parseFloat(document.getElementById('root-imag').value) || 0;
            baseNumber = math.complex(real, imag);
        }

        const roots = [];
        const baseMag = Math.pow(math.abs(baseNumber), 1 / n);
        const baseArg = math.arg(baseNumber);

        for (let k = 0; k < n; k++) {
            const angle = (baseArg + 2 * Math.PI * k) / n;
            const real = baseMag * Math.cos(angle);
            const imag = baseMag * Math.sin(angle);
            roots.push(math.complex(real, imag));
        }

        this.drawRootsVisual(roots, n);
        this.updateRootsList(roots);
    },

    drawRootsVisual(roots, n) {
        const container = document.getElementById('roots-visual');
        if (!container) return;

        // Unit circle
        const circleTheta = [];
        const circleX = [];
        const circleY = [];
        const mag = math.abs(roots[0]);

        for (let i = 0; i <= 100; i++) {
            const theta = (2 * Math.PI * i) / 100;
            circleX.push(mag * Math.cos(theta));
            circleY.push(mag * Math.sin(theta));
        }

        const traces = [
            {
                x: circleX,
                y: circleY,
                mode: 'lines',
                line: { color: '#444', width: 1 },
                showlegend: false
            },
            {
                x: roots.map(r => r.re),
                y: roots.map(r => r.im),
                mode: 'markers+text',
                marker: {
                    size: 12,
                    color: roots.map((_, i) => `hsl(${(i * 360 / n)}, 80%, 60%)`),
                    line: { width: 2, color: '#fff' }
                },
                text: roots.map((_, i) => `ω${this.subscript(i)}`),
                textposition: 'top center',
                textfont: { size: 10, color: '#ccc' },
                name: 'Roots'
            }
        ];

        // Lines from origin to each root
        roots.forEach((r, i) => {
            traces.push({
                x: [0, r.re],
                y: [0, r.im],
                mode: 'lines',
                line: { color: `hsl(${(i * 360 / n)}, 80%, 60%)`, width: 1.5 },
                showlegend: false
            });
        });

        const maxVal = mag * 1.4;
        const layout = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: '#e0e0e0' },
            margin: { t: 20, r: 20, b: 20, l: 20 },
            xaxis: {
                range: [-maxVal, maxVal],
                zeroline: true,
                zerolinecolor: '#555',
                showgrid: false,
                showticklabels: false
            },
            yaxis: {
                range: [-maxVal, maxVal],
                zeroline: true,
                zerolinecolor: '#555',
                showgrid: false,
                showticklabels: false,
                scaleanchor: 'x'
            },
            showlegend: false
        };

        Plotly.newPlot(container, traces, layout, { responsive: true, displayModeBar: false });
    },

    subscript(n) {
        const subscripts = '₀₁₂₃₄₅₆₇₈₉';
        return String(n).split('').map(d => subscripts[parseInt(d)]).join('');
    },

    updateRootsList(roots) {
        const container = document.getElementById('roots-list');
        container.innerHTML = roots.map((r, i) => `
            <div class="root-item">
                <span class="root-index">ω${this.subscript(i)}</span>
                <span class="root-value">${this.formatComplex(r, 4)}</span>
                <span style="color: var(--text-muted);">${this.formatPolar(r)}</span>
            </div>
        `).join('');
    },

    // ==================== POWERS ====================
    calculatePower() {
        const real = parseFloat(document.getElementById('power-real').value) || 1;
        const imag = parseFloat(document.getElementById('power-imag').value) || 1;
        const n = parseInt(document.getElementById('power-n').value) || 4;

        const z = math.complex(real, imag);
        const result = math.pow(z, n);

        document.getElementById('power-result').textContent =
            `${this.formatComplex(result)} = ${this.formatPolar(result)}`;

        this.drawPowerVisual(z, n, result);
    },

    drawPowerVisual(z, n, result) {
        const container = document.getElementById('power-visual');
        if (!container) return;

        const powers = [z];
        let current = z;
        for (let i = 1; i < n; i++) {
            current = math.multiply(current, z);
            powers.push(current);
        }

        const maxVal = Math.max(...powers.map(p => Math.max(Math.abs(p.re), Math.abs(p.im)))) * 1.3;

        const traces = powers.map((p, i) => ({
            x: [0, p.re],
            y: [0, p.im],
            mode: 'lines+markers',
            line: {
                color: i === powers.length - 1 ? '#00ff88' : `hsl(${i * 30}, 70%, 50%)`,
                width: i === powers.length - 1 ? 3 : 1.5
            },
            marker: { size: i === powers.length - 1 ? 10 : 6 },
            name: `z${i === 0 ? '' : this.subscript(i + 1)}`
        }));

        const layout = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: '#e0e0e0', size: 9 },
            margin: { t: 10, r: 10, b: 20, l: 30 },
            xaxis: {
                range: [-maxVal, maxVal],
                zeroline: true,
                zerolinecolor: '#444',
                gridcolor: '#333'
            },
            yaxis: {
                range: [-maxVal, maxVal],
                zeroline: true,
                zerolinecolor: '#444',
                gridcolor: '#333',
                scaleanchor: 'x'
            },
            showlegend: false
        };

        Plotly.newPlot(container, traces, layout, { responsive: true, displayModeBar: false });
    },

    // ==================== DOMAIN COLORING ====================
    plotDomainColoring() {
        const funcName = document.getElementById('func-select').value;
        const xRange = parseFloat(document.getElementById('plot-x-range').value) || 3;
        const yRange = parseFloat(document.getElementById('plot-y-range').value) || 3;
        const resolution = parseInt(document.getElementById('plot-resolution').value) || 200;

        const canvas = document.getElementById('domain-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = resolution;
        canvas.height = resolution;

        const imageData = ctx.createImageData(resolution, resolution);
        const data = imageData.data;

        for (let py = 0; py < resolution; py++) {
            for (let px = 0; px < resolution; px++) {
                const x = (px / resolution - 0.5) * 2 * xRange;
                const y = -(py / resolution - 0.5) * 2 * yRange;

                const z = math.complex(x, y);
                let w;

                try {
                    w = this.evaluateFunction(funcName, z);
                } catch (e) {
                    w = math.complex(0, 0);
                }

                const [r, g, b] = this.complexToColor(w);
                const idx = (py * resolution + px) * 4;
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    },

    evaluateFunction(name, z) {
        switch (name) {
            case 'z': return z;
            case 'z^2': return math.multiply(z, z);
            case 'z^3': return math.pow(z, 3);
            case '1/z': return math.divide(1, z);
            case 'sqrt(z)': return math.sqrt(z);
            case 'exp(z)': return math.exp(z);
            case 'sin(z)': return math.sin(z);
            case 'cos(z)': return math.cos(z);
            default: return z;
        }
    },

    complexToColor(z) {
        const arg = math.arg(z); // -π to π
        const mag = math.abs(z);

        // Hue from argument
        const hue = (arg + Math.PI) / (2 * Math.PI); // 0 to 1

        // Saturation and lightness from magnitude
        const sat = 0.9;
        const light = 1 - Math.pow(0.5, mag * 0.5); // Approaches 1 for large magnitudes

        return this.hslToRgb(hue, sat, Math.min(light, 0.9));
    },

    hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    },

    cleanup() {
        // Cleanup plotly charts
        ['complex-plane', 'operation-visual', 'roots-visual', 'power-visual'].forEach(id => {
            const el = document.getElementById(id);
            if (el) Plotly.purge(el);
        });
    }
};

window.ComplexTab = ComplexTab;
