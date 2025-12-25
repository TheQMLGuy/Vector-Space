/**
 * QAGI Lab - Calculus & Graphs Tab
 * Interactive calculus tools with graphing capabilities
 */

const CalculusTab = {
    functionCount: 1,
    functionColors: ['#00d4ff', '#ff00aa', '#00ff88', '#ffaa00', '#aa00ff', '#ff4444'],

    init() {
        this.bindEvents();
        this.plotMainGraph();
    },

    cleanup() {
        // Clean up Plotly graphs to prevent memory leaks
        const graphs = ['main-graph', 'derivative-graph', 'integral-graph', 'taylor-graph',
            'critical-graph', 'parametric-graph', 'polar-graph'];
        graphs.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.data) {
                Plotly.purge(el);
            }
        });
    },

    bindEvents() {
        // Function plotter
        document.getElementById('btn-plot')?.addEventListener('click', () => this.plotMainGraph());
        document.getElementById('btn-add-function')?.addEventListener('click', () => this.addFunction());
        document.getElementById('btn-clear-graph')?.addEventListener('click', () => this.clearAllFunctions());

        // Derivative
        document.getElementById('btn-derivative')?.addEventListener('click', () => this.calculateDerivative());

        // Integral
        document.getElementById('btn-integrate')?.addEventListener('click', () => this.calculateIntegral());

        // Limits
        document.getElementById('btn-limit')?.addEventListener('click', () => this.evaluateLimit());

        // Taylor Series
        document.getElementById('btn-taylor')?.addEventListener('click', () => this.calculateTaylor());

        // Critical Points
        document.getElementById('btn-critical')?.addEventListener('click', () => this.findCriticalPoints());

        // Parametric
        document.getElementById('btn-parametric')?.addEventListener('click', () => this.plotParametric());

        // Polar
        document.getElementById('btn-polar')?.addEventListener('click', () => this.plotPolar());
    },

    // ==========================================
    // FUNCTION PLOTTER
    // ==========================================

    addFunction() {
        this.functionCount++;
        const container = document.getElementById('functions-container');
        const colorIndex = (this.functionCount - 1) % this.functionColors.length;

        const row = document.createElement('div');
        row.className = 'function-input-row';
        row.dataset.index = this.functionCount - 1;
        row.innerHTML = `
            <div class="input-group" style="flex: 1;">
                <label class="input-label">f${this.getSubscript(this.functionCount)}(x) =</label>
                <input type="text" class="input input-mono function-expr" placeholder="e.g., cos(x), x^3, log(x)">
            </div>
            <div class="color-picker-wrapper">
                <input type="color" class="function-color" value="${this.functionColors[colorIndex]}">
            </div>
            <button class="btn btn-sm btn-secondary btn-remove-function">×</button>
        `;

        row.querySelector('.btn-remove-function').addEventListener('click', () => {
            row.remove();
            this.renumberFunctions();
        });

        container.appendChild(row);
    },

    getSubscript(num) {
        const subscripts = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
        return String(num).split('').map(d => subscripts[parseInt(d)]).join('');
    },

    renumberFunctions() {
        const rows = document.querySelectorAll('.function-input-row');
        rows.forEach((row, i) => {
            row.dataset.index = i;
            row.querySelector('.input-label').textContent = `f${this.getSubscript(i + 1)}(x) =`;
        });
        this.functionCount = rows.length;
    },

    clearAllFunctions() {
        const container = document.getElementById('functions-container');
        container.innerHTML = `
            <div class="function-input-row" data-index="0">
                <div class="input-group" style="flex: 1;">
                    <label class="input-label">f₁(x) =</label>
                    <input type="text" class="input input-mono function-expr" placeholder="e.g., sin(x), x^2, exp(-x)" value="">
                </div>
                <div class="color-picker-wrapper">
                    <input type="color" class="function-color" value="#00d4ff">
                </div>
                <button class="btn btn-sm btn-secondary btn-remove-function" style="visibility: hidden;">×</button>
            </div>
        `;
        this.functionCount = 1;
        Plotly.purge('main-graph');
    },

    plotMainGraph() {
        const xMin = parseFloat(document.getElementById('x-min').value) || -10;
        const xMax = parseFloat(document.getElementById('x-max').value) || 10;
        const yMin = parseFloat(document.getElementById('y-min').value) || -5;
        const yMax = parseFloat(document.getElementById('y-max').value) || 5;

        const rows = document.querySelectorAll('.function-input-row');
        const traces = [];

        const x = this.linspace(xMin, xMax, 500);

        rows.forEach((row, i) => {
            const expr = row.querySelector('.function-expr').value.trim();
            const color = row.querySelector('.function-color').value;

            if (expr) {
                try {
                    const compiled = math.compile(expr);
                    const y = x.map(xi => {
                        try {
                            const result = compiled.evaluate({ x: xi });
                            return isFinite(result) ? result : null;
                        } catch {
                            return null;
                        }
                    });

                    traces.push({
                        x: x,
                        y: y,
                        type: 'scatter',
                        mode: 'lines',
                        name: `f${this.getSubscript(i + 1)}(x) = ${expr}`,
                        line: { color: color, width: 2 }
                    });
                } catch (e) {
                    console.error(`Error parsing f${i + 1}:`, e);
                }
            }
        });

        const layout = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'rgba(15, 15, 35, 0.8)',
            font: { color: '#e0e0e0', family: 'Inter, sans-serif' },
            xaxis: {
                title: 'x',
                range: [xMin, xMax],
                gridcolor: 'rgba(255,255,255,0.1)',
                zerolinecolor: 'rgba(0, 212, 255, 0.5)',
                zerolinewidth: 2
            },
            yaxis: {
                title: 'y',
                range: [yMin, yMax],
                gridcolor: 'rgba(255,255,255,0.1)',
                zerolinecolor: 'rgba(0, 212, 255, 0.5)',
                zerolinewidth: 2
            },
            margin: { t: 30, r: 30, b: 50, l: 50 },
            showlegend: traces.length > 1,
            legend: { x: 1, xanchor: 'right', y: 1, bgcolor: 'rgba(0,0,0,0.5)' }
        };

        Plotly.newPlot('main-graph', traces, layout, { responsive: true });
    },

    // ==========================================
    // DERIVATIVE CALCULATOR
    // ==========================================

    calculateDerivative() {
        const funcStr = document.getElementById('deriv-function').value.trim();
        const point = parseFloat(document.getElementById('deriv-point').value);

        if (!funcStr) return;

        try {
            // Symbolic derivative using math.js
            const derivative = math.derivative(funcStr, 'x');
            const derivStr = derivative.toString();

            document.getElementById('deriv-symbolic').textContent = `f'(x) = ${derivStr}`;

            // Evaluate at point
            const compiled = math.compile(derivStr);
            const value = compiled.evaluate({ x: point });
            document.getElementById('deriv-value').textContent = `f'(${point}) = ${value.toFixed(6)}`;

            // Plot function and derivative
            this.plotDerivativeGraph(funcStr, derivStr, point);
        } catch (e) {
            document.getElementById('deriv-symbolic').textContent = 'Error: ' + e.message;
            document.getElementById('deriv-value').textContent = '-';
        }
    },

    plotDerivativeGraph(funcStr, derivStr, point) {
        const x = this.linspace(-5, 5, 200);
        const compiledF = math.compile(funcStr);
        const compiledD = math.compile(derivStr);

        const yFunc = x.map(xi => {
            try { return compiledF.evaluate({ x: xi }); }
            catch { return null; }
        });

        const yDeriv = x.map(xi => {
            try { return compiledD.evaluate({ x: xi }); }
            catch { return null; }
        });

        const traces = [
            {
                x: x, y: yFunc,
                type: 'scatter', mode: 'lines',
                name: 'f(x)', line: { color: '#00d4ff', width: 2 }
            },
            {
                x: x, y: yDeriv,
                type: 'scatter', mode: 'lines',
                name: "f'(x)", line: { color: '#ff00aa', width: 2, dash: 'dash' }
            },
            {
                x: [point], y: [compiledD.evaluate({ x: point })],
                type: 'scatter', mode: 'markers',
                name: `f'(${point})`,
                marker: { color: '#00ff88', size: 10, symbol: 'circle' }
            }
        ];

        const layout = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'rgba(15, 15, 35, 0.8)',
            font: { color: '#e0e0e0', size: 10 },
            xaxis: { gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(0, 212, 255, 0.5)' },
            yaxis: { gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(0, 212, 255, 0.5)' },
            margin: { t: 10, r: 10, b: 30, l: 40 },
            showlegend: true,
            legend: { x: 0, y: 1, bgcolor: 'rgba(0,0,0,0.5)', font: { size: 10 } }
        };

        Plotly.newPlot('derivative-graph', traces, layout, { responsive: true });
    },

    // ==========================================
    // INTEGRAL CALCULATOR
    // ==========================================

    calculateIntegral() {
        const funcStr = document.getElementById('integral-function').value.trim();
        const a = parseFloat(document.getElementById('integral-lower').value);
        const b = parseFloat(document.getElementById('integral-upper').value);
        const method = document.getElementById('integral-method').value;

        if (!funcStr || isNaN(a) || isNaN(b)) return;

        try {
            const compiled = math.compile(funcStr);
            const f = x => compiled.evaluate({ x });

            let result;
            const n = 1000; // Number of intervals

            switch (method) {
                case 'simpson':
                    result = this.simpsonRule(f, a, b, n);
                    break;
                case 'trapezoidal':
                    result = this.trapezoidalRule(f, a, b, n);
                    break;
                case 'midpoint':
                    result = this.midpointRule(f, a, b, n);
                    break;
                case 'romberg':
                    result = this.rombergIntegration(f, a, b);
                    break;
                default:
                    result = this.simpsonRule(f, a, b, n);
            }

            document.getElementById('integral-result').textContent = result.toFixed(8);
            this.plotIntegralGraph(funcStr, a, b);
        } catch (e) {
            document.getElementById('integral-result').textContent = 'Error: ' + e.message;
        }
    },

    simpsonRule(f, a, b, n) {
        if (n % 2 !== 0) n++;
        const h = (b - a) / n;
        let sum = f(a) + f(b);

        for (let i = 1; i < n; i++) {
            sum += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
        }

        return (h / 3) * sum;
    },

    trapezoidalRule(f, a, b, n) {
        const h = (b - a) / n;
        let sum = 0.5 * (f(a) + f(b));

        for (let i = 1; i < n; i++) {
            sum += f(a + i * h);
        }

        return h * sum;
    },

    midpointRule(f, a, b, n) {
        const h = (b - a) / n;
        let sum = 0;

        for (let i = 0; i < n; i++) {
            sum += f(a + (i + 0.5) * h);
        }

        return h * sum;
    },

    rombergIntegration(f, a, b, maxIter = 10, tol = 1e-10) {
        const R = [];

        for (let i = 0; i <= maxIter; i++) {
            R.push(new Array(i + 1).fill(0));
        }

        R[0][0] = this.trapezoidalRule(f, a, b, 1);

        for (let i = 1; i <= maxIter; i++) {
            R[i][0] = this.trapezoidalRule(f, a, b, Math.pow(2, i));

            for (let j = 1; j <= i; j++) {
                const factor = Math.pow(4, j);
                R[i][j] = (factor * R[i][j - 1] - R[i - 1][j - 1]) / (factor - 1);
            }

            if (i > 0 && Math.abs(R[i][i] - R[i - 1][i - 1]) < tol) {
                return R[i][i];
            }
        }

        return R[maxIter][maxIter];
    },

    plotIntegralGraph(funcStr, a, b) {
        const xRange = this.linspace(Math.min(a, b) - 1, Math.max(a, b) + 1, 200);
        const xFill = this.linspace(a, b, 100);
        const compiled = math.compile(funcStr);

        const yRange = xRange.map(x => {
            try { return compiled.evaluate({ x }); }
            catch { return null; }
        });

        const yFill = xFill.map(x => {
            try { return compiled.evaluate({ x }); }
            catch { return 0; }
        });

        const traces = [
            {
                x: [...xFill, b, a],
                y: [...yFill, 0, 0],
                type: 'scatter',
                fill: 'toself',
                fillcolor: 'rgba(0, 255, 136, 0.3)',
                line: { color: 'transparent' },
                name: 'Area'
            },
            {
                x: xRange, y: yRange,
                type: 'scatter', mode: 'lines',
                name: 'f(x)', line: { color: '#00d4ff', width: 2 }
            }
        ];

        const layout = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'rgba(15, 15, 35, 0.8)',
            font: { color: '#e0e0e0', size: 10 },
            xaxis: { gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(0, 212, 255, 0.5)' },
            yaxis: { gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(0, 212, 255, 0.5)' },
            margin: { t: 10, r: 10, b: 30, l: 40 },
            showlegend: false
        };

        Plotly.newPlot('integral-graph', traces, layout, { responsive: true });
    },

    // ==========================================
    // LIMITS
    // ==========================================

    evaluateLimit() {
        const funcStr = document.getElementById('limit-function').value.trim();
        const pointStr = document.getElementById('limit-point').value.trim();
        const direction = document.getElementById('limit-direction').value;

        if (!funcStr) return;

        try {
            const compiled = math.compile(funcStr);
            let point;

            if (pointStr.toLowerCase() === 'inf' || pointStr === '∞') {
                point = Infinity;
            } else if (pointStr.toLowerCase() === '-inf' || pointStr === '-∞') {
                point = -Infinity;
            } else {
                point = parseFloat(pointStr);
            }

            const leftLimit = this.numericalLimit(compiled, point, 'left');
            const rightLimit = this.numericalLimit(compiled, point, 'right');

            document.getElementById('limit-left').textContent = this.formatLimit(leftLimit);
            document.getElementById('limit-right').textContent = this.formatLimit(rightLimit);

            if (direction === 'left') {
                document.getElementById('limit-result').textContent = this.formatLimit(leftLimit);
            } else if (direction === 'right') {
                document.getElementById('limit-result').textContent = this.formatLimit(rightLimit);
            } else {
                // Two-sided limit exists if left = right
                if (Math.abs(leftLimit - rightLimit) < 1e-6) {
                    document.getElementById('limit-result').textContent = this.formatLimit(leftLimit);
                } else {
                    document.getElementById('limit-result').textContent = 'DNE';
                }
            }
        } catch (e) {
            document.getElementById('limit-result').textContent = 'Error: ' + e.message;
        }
    },

    numericalLimit(compiled, point, direction) {
        const steps = [0.1, 0.01, 0.001, 0.0001, 0.00001, 0.000001];
        let lastValue = null;

        for (const h of steps) {
            const x = direction === 'left' ? point - h : point + h;
            try {
                const value = compiled.evaluate({ x });
                if (!isFinite(value)) {
                    return value > 0 ? Infinity : -Infinity;
                }
                lastValue = value;
            } catch {
                return NaN;
            }
        }

        return lastValue;
    },

    formatLimit(value) {
        if (!isFinite(value)) {
            return value > 0 ? '+∞' : '-∞';
        }
        if (isNaN(value)) {
            return 'Undefined';
        }
        return value.toFixed(6);
    },

    // ==========================================
    // TAYLOR SERIES
    // ==========================================

    calculateTaylor() {
        const funcStr = document.getElementById('taylor-function').value.trim();
        const a = parseFloat(document.getElementById('taylor-point').value);
        const n = parseInt(document.getElementById('taylor-terms').value);
        const evalX = parseFloat(document.getElementById('taylor-eval').value);

        if (!funcStr) return;

        try {
            // Build Taylor polynomial
            const terms = [];
            let currentFunc = funcStr;
            const compiled = math.compile(funcStr);
            const fa = compiled.evaluate({ x: a });

            // First term: f(a)
            terms.push(fa);

            // Successive derivatives
            for (let i = 1; i < n; i++) {
                try {
                    currentFunc = math.derivative(currentFunc, 'x').toString();
                    const derivCompiled = math.compile(currentFunc);
                    const derivValue = derivCompiled.evaluate({ x: a });
                    terms.push(derivValue / this.factorial(i));
                } catch {
                    break;
                }
            }

            // Format polynomial string
            let polyStr = '';
            terms.forEach((coef, i) => {
                if (Math.abs(coef) < 1e-10) return;

                const sign = coef >= 0 && i > 0 ? ' + ' : (coef < 0 ? ' - ' : '');
                const absCoef = Math.abs(coef);
                const coefStr = absCoef === 1 && i > 0 ? '' : absCoef.toFixed(4);

                if (i === 0) {
                    polyStr += coef.toFixed(4);
                } else if (i === 1) {
                    polyStr += `${sign}${coefStr}(x${a >= 0 ? ' - ' + a : ' + ' + Math.abs(a)})`;
                } else {
                    polyStr += `${sign}${coefStr}(x${a >= 0 ? ' - ' + a : ' + ' + Math.abs(a)})^${i}`;
                }
            });

            document.getElementById('taylor-polynomial').textContent = polyStr || '0';

            // Evaluate approximation
            let approx = 0;
            terms.forEach((coef, i) => {
                approx += coef * Math.pow(evalX - a, i);
            });

            const actual = compiled.evaluate({ x: evalX });

            document.getElementById('taylor-approx').textContent = approx.toFixed(8);
            document.getElementById('taylor-actual').textContent = actual.toFixed(8);

            // Plot
            this.plotTaylorGraph(funcStr, terms, a);
        } catch (e) {
            document.getElementById('taylor-polynomial').textContent = 'Error: ' + e.message;
        }
    },

    factorial(n) {
        if (n <= 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    },

    plotTaylorGraph(funcStr, terms, a) {
        const x = this.linspace(a - 3, a + 3, 200);
        const compiled = math.compile(funcStr);

        const yActual = x.map(xi => {
            try { return compiled.evaluate({ x: xi }); }
            catch { return null; }
        });

        const yTaylor = x.map(xi => {
            let sum = 0;
            terms.forEach((coef, i) => {
                sum += coef * Math.pow(xi - a, i);
            });
            return sum;
        });

        const traces = [
            {
                x: x, y: yActual,
                type: 'scatter', mode: 'lines',
                name: 'f(x)', line: { color: '#00d4ff', width: 2 }
            },
            {
                x: x, y: yTaylor,
                type: 'scatter', mode: 'lines',
                name: 'Taylor Polynomial', line: { color: '#ff00aa', width: 2, dash: 'dash' }
            },
            {
                x: [a], y: [compiled.evaluate({ x: a })],
                type: 'scatter', mode: 'markers',
                name: `Expansion point (${a})`,
                marker: { color: '#00ff88', size: 10 }
            }
        ];

        const layout = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'rgba(15, 15, 35, 0.8)',
            font: { color: '#e0e0e0', size: 10 },
            xaxis: { gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(0, 212, 255, 0.5)' },
            yaxis: { gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(0, 212, 255, 0.5)', range: [-5, 5] },
            margin: { t: 20, r: 20, b: 40, l: 50 },
            showlegend: true,
            legend: { x: 0, y: 1, bgcolor: 'rgba(0,0,0,0.5)' }
        };

        Plotly.newPlot('taylor-graph', traces, layout, { responsive: true });
    },

    // ==========================================
    // CRITICAL POINTS
    // ==========================================

    findCriticalPoints() {
        const funcStr = document.getElementById('critical-function').value.trim();
        const start = parseFloat(document.getElementById('critical-start').value);
        const end = parseFloat(document.getElementById('critical-end').value);

        if (!funcStr) return;

        try {
            const derivative = math.derivative(funcStr, 'x');
            const secondDerivative = math.derivative(derivative, 'x');
            const derivStr = derivative.toString();
            const secondDerivStr = secondDerivative.toString();

            const compiledF = math.compile(funcStr);
            const compiledD = math.compile(derivStr);
            const compiledD2 = math.compile(secondDerivStr);

            // Find zeros of derivative using bisection
            const criticalX = this.findDerivativeZeros(compiledD, start, end);

            const pointsList = document.getElementById('critical-points-list');
            pointsList.innerHTML = '';

            const annotations = [];

            criticalX.forEach(x => {
                const y = compiledF.evaluate({ x });
                const d2 = compiledD2.evaluate({ x });

                let type, className;
                if (d2 > 0.001) {
                    type = 'Local Minimum';
                    className = 'minimum';
                } else if (d2 < -0.001) {
                    type = 'Local Maximum';
                    className = 'maximum';
                } else {
                    type = 'Inflection Point';
                    className = 'inflection';
                }

                const card = document.createElement('div');
                card.className = `critical-point-card ${className}`;
                card.innerHTML = `
                    <div class="critical-point-type ${className}">${type}</div>
                    <div class="critical-point-coords">(${x.toFixed(4)}, ${y.toFixed(4)})</div>
                `;
                pointsList.appendChild(card);

                annotations.push({ x, y, type, className });
            });

            if (criticalX.length === 0) {
                pointsList.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">No critical points found in the given range</p>';
            }

            this.plotCriticalGraph(funcStr, start, end, annotations);
        } catch (e) {
            document.getElementById('critical-points-list').innerHTML =
                `<p style="color: #ff4444;">Error: ${e.message}</p>`;
        }
    },

    findDerivativeZeros(compiledD, start, end, tol = 1e-6) {
        const zeros = [];
        const step = (end - start) / 100;

        for (let x = start; x < end; x += step) {
            const y1 = compiledD.evaluate({ x });
            const y2 = compiledD.evaluate({ x: x + step });

            // Sign change indicates a zero
            if (y1 * y2 < 0) {
                // Bisection method to find exact zero
                let a = x, b = x + step;
                while (b - a > tol) {
                    const mid = (a + b) / 2;
                    const yMid = compiledD.evaluate({ x: mid });
                    if (y1 * yMid < 0) {
                        b = mid;
                    } else {
                        a = mid;
                        y1 = yMid;
                    }
                }
                zeros.push((a + b) / 2);
            }
        }

        return zeros;
    },

    plotCriticalGraph(funcStr, start, end, annotations) {
        const x = this.linspace(start, end, 300);
        const compiled = math.compile(funcStr);

        const y = x.map(xi => {
            try { return compiled.evaluate({ x: xi }); }
            catch { return null; }
        });

        const traces = [
            {
                x: x, y: y,
                type: 'scatter', mode: 'lines',
                name: 'f(x)', line: { color: '#00d4ff', width: 2 }
            }
        ];

        // Add critical points
        annotations.forEach(point => {
            const color = point.className === 'maximum' ? '#00ff88' :
                point.className === 'minimum' ? '#ff00aa' : '#ffaa00';
            traces.push({
                x: [point.x], y: [point.y],
                type: 'scatter', mode: 'markers',
                name: point.type,
                marker: { color: color, size: 12, symbol: 'diamond' }
            });
        });

        const layout = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'rgba(15, 15, 35, 0.8)',
            font: { color: '#e0e0e0', size: 10 },
            xaxis: { gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(0, 212, 255, 0.5)' },
            yaxis: { gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(0, 212, 255, 0.5)' },
            margin: { t: 10, r: 20, b: 40, l: 50 },
            showlegend: true,
            legend: { x: 0, y: 1, bgcolor: 'rgba(0,0,0,0.5)', font: { size: 10 } }
        };

        Plotly.newPlot('critical-graph', traces, layout, { responsive: true });
    },

    // ==========================================
    // PARAMETRIC CURVES
    // ==========================================

    plotParametric() {
        const xExpr = document.getElementById('param-x').value.trim();
        const yExpr = document.getElementById('param-y').value.trim();
        const tMin = parseFloat(document.getElementById('param-t-min').value);
        const tMax = parseFloat(document.getElementById('param-t-max').value);

        if (!xExpr || !yExpr) return;

        try {
            const compiledX = math.compile(xExpr);
            const compiledY = math.compile(yExpr);
            const t = this.linspace(tMin, tMax, 500);

            const x = t.map(ti => compiledX.evaluate({ t: ti }));
            const y = t.map(ti => compiledY.evaluate({ t: ti }));

            const trace = {
                x: x, y: y,
                type: 'scatter', mode: 'lines',
                line: { color: '#00d4ff', width: 2 },
                name: `(${xExpr}, ${yExpr})`
            };

            const layout = {
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'rgba(15, 15, 35, 0.8)',
                font: { color: '#e0e0e0', size: 10 },
                xaxis: {
                    gridcolor: 'rgba(255,255,255,0.1)',
                    zerolinecolor: 'rgba(0, 212, 255, 0.5)',
                    scaleanchor: 'y',
                    scaleratio: 1
                },
                yaxis: { gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(0, 212, 255, 0.5)' },
                margin: { t: 10, r: 10, b: 30, l: 40 },
                showlegend: false
            };

            Plotly.newPlot('parametric-graph', [trace], layout, { responsive: true });
        } catch (e) {
            console.error('Parametric plot error:', e);
        }
    },

    // ==========================================
    // POLAR CURVES
    // ==========================================

    plotPolar() {
        const rExpr = document.getElementById('polar-r').value.trim().replace(/theta/g, 'θ');
        const thetaMin = parseFloat(document.getElementById('polar-theta-min').value);
        const thetaMax = parseFloat(document.getElementById('polar-theta-max').value);

        if (!rExpr) return;

        try {
            // Replace theta with a variable math.js understands
            const expr = rExpr.replace(/θ/g, 'theta');
            const compiled = math.compile(expr);
            const theta = this.linspace(thetaMin, thetaMax, 500);

            const r = theta.map(t => compiled.evaluate({ theta: t }));

            // Convert to Cartesian
            const x = r.map((ri, i) => ri * Math.cos(theta[i]));
            const y = r.map((ri, i) => ri * Math.sin(theta[i]));

            const trace = {
                x: x, y: y,
                type: 'scatter', mode: 'lines',
                line: { color: '#ff00aa', width: 2 }
            };

            const layout = {
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'rgba(15, 15, 35, 0.8)',
                font: { color: '#e0e0e0', size: 10 },
                xaxis: {
                    gridcolor: 'rgba(255,255,255,0.1)',
                    zerolinecolor: 'rgba(0, 212, 255, 0.5)',
                    scaleanchor: 'y',
                    scaleratio: 1
                },
                yaxis: { gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(0, 212, 255, 0.5)' },
                margin: { t: 10, r: 10, b: 30, l: 40 },
                showlegend: false
            };

            Plotly.newPlot('polar-graph', [trace], layout, { responsive: true });
        } catch (e) {
            console.error('Polar plot error:', e);
        }
    },

    // ==========================================
    // UTILITIES
    // ==========================================

    linspace(start, end, num) {
        const step = (end - start) / (num - 1);
        return Array.from({ length: num }, (_, i) => start + i * step);
    }
};

// Export for tab manager
window.CalculusTab = CalculusTab;
