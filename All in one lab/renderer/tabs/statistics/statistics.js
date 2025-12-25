/**
 * QAGI Lab - Statistics Tab
 * Descriptive statistics, probability distributions, and hypothesis testing
 */

const StatisticsTab = {
    data: [],
    currentViz: 'histogram',

    init() {
        console.log('Statistics Tab initialized');
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Data Input
        document.getElementById('btn-stats-analyze')?.addEventListener('click', () => this.analyzeData());
        document.getElementById('btn-stats-sample')?.addEventListener('click', () => this.loadSampleData());
        document.getElementById('btn-stats-clear')?.addEventListener('click', () => this.clearData());

        // Custom percentile
        document.getElementById('btn-calc-percentile')?.addEventListener('click', () => this.calcCustomPercentile());

        // Visualization tabs
        document.querySelectorAll('[data-viz]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-viz]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentViz = e.target.dataset.viz;
                this.updateVisualization();
            });
        });

        // Histogram bins slider
        document.getElementById('histogram-bins')?.addEventListener('input', (e) => {
            document.getElementById('bins-value').textContent = e.target.value;
            if (this.currentViz === 'histogram') this.updateVisualization();
        });

        // Distribution panels
        document.querySelectorAll('[data-dist]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-dist]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                document.querySelectorAll('.dist-panel').forEach(p => p.classList.remove('active'));
                document.getElementById(`panel-${e.target.dataset.dist}`)?.classList.add('active');
            });
        });

        // Normal distribution - show/hide upper bound
        document.getElementById('norm-type')?.addEventListener('change', (e) => {
            const bGroup = document.getElementById('norm-b-group');
            bGroup.style.display = e.target.value === 'between' ? 'block' : 'none';
        });

        // Distribution calculations
        document.getElementById('btn-calc-normal')?.addEventListener('click', () => this.calcNormal());
        document.getElementById('btn-calc-t')?.addEventListener('click', () => this.calcT());
        document.getElementById('btn-calc-chi2')?.addEventListener('click', () => this.calcChi2());
        document.getElementById('btn-calc-binomial')?.addEventListener('click', () => this.calcBinomial());
        document.getElementById('btn-calc-poisson')?.addEventListener('click', () => this.calcPoisson());

        // Confidence Interval
        document.getElementById('ci-sigma-known')?.addEventListener('change', (e) => {
            document.getElementById('ci-sigma-group').style.display =
                e.target.value === 'yes' ? 'block' : 'none';
        });
        document.getElementById('btn-calc-ci')?.addEventListener('click', () => this.calcConfidenceInterval());

        // Hypothesis Testing
        document.getElementById('btn-run-ht')?.addEventListener('click', () => this.runHypothesisTest());
    },

    // ==================== DATA ANALYSIS ====================
    loadSampleData() {
        const samples = [
            '23, 45, 67, 34, 56, 78, 89, 45, 67, 23, 56, 78, 90, 34, 67, 45, 78, 56, 34, 89',
            '12.5, 15.3, 18.7, 22.1, 25.8, 19.4, 16.2, 21.5, 24.3, 17.8, 20.6, 23.9, 14.1, 26.7, 18.0',
            '100, 105, 98, 102, 110, 95, 108, 103, 99, 107, 101, 104, 96, 109, 106, 97, 111, 100, 102, 105',
            '2.1, 2.4, 2.2, 1.9, 2.5, 2.3, 2.0, 2.6, 2.1, 2.4, 2.2, 2.3, 1.8, 2.7, 2.5, 2.2, 2.4, 2.1, 2.3, 2.0'
        ];
        document.getElementById('stats-data-input').value = samples[Math.floor(Math.random() * samples.length)];
        this.analyzeData();
    },

    clearData() {
        document.getElementById('stats-data-input').value = '';
        this.data = [];
        this.resetAllResults();
    },

    parseData() {
        const input = document.getElementById('stats-data-input').value;
        const values = input.split(/[,\n\s]+/)
            .map(v => parseFloat(v.trim()))
            .filter(v => !isNaN(v));
        return values;
    },

    analyzeData() {
        this.data = this.parseData();

        if (this.data.length === 0) {
            this.resetAllResults();
            return;
        }

        const sorted = [...this.data].sort((a, b) => a - b);
        const n = this.data.length;
        const sum = this.data.reduce((a, b) => a + b, 0);
        const mean = sum / n;

        // Quick stats
        document.getElementById('stats-count').textContent = n;
        document.getElementById('stats-sum').textContent = this.formatNumber(sum);
        document.getElementById('stats-min').textContent = this.formatNumber(sorted[0]);
        document.getElementById('stats-max').textContent = this.formatNumber(sorted[n - 1]);

        // Central Tendency
        this.updateElement('stats-mean', this.formatNumber(mean));
        this.updateElement('stats-median', this.formatNumber(this.median(sorted)));
        this.updateElement('stats-mode', this.calcMode());
        this.updateElement('stats-geometric-mean', this.formatNumber(this.geometricMean()));
        this.updateElement('stats-harmonic-mean', this.formatNumber(this.harmonicMean()));
        this.updateElement('stats-rms', this.formatNumber(this.rms()));

        // Dispersion
        const variance = this.variance(mean);
        const stdDev = Math.sqrt(variance);
        const sampleVar = n > 1 ? (variance * n) / (n - 1) : 0;
        const sampleStd = Math.sqrt(sampleVar);

        this.updateElement('stats-range', this.formatNumber(sorted[n - 1] - sorted[0]));
        this.updateElement('stats-variance', this.formatNumber(variance));
        this.updateElement('stats-std-dev', this.formatNumber(stdDev));
        this.updateElement('stats-sample-std', this.formatNumber(sampleStd));
        this.updateElement('stats-cv', mean !== 0 ? this.formatNumber((stdDev / Math.abs(mean)) * 100) + '%' : '-');
        this.updateElement('stats-mad', this.formatNumber(this.meanAbsoluteDeviation(mean)));
        this.updateElement('stats-se', this.formatNumber(stdDev / Math.sqrt(n)));

        const q1 = this.percentile(sorted, 25);
        const q3 = this.percentile(sorted, 75);
        this.updateElement('stats-iqr', this.formatNumber(q3 - q1));

        // Quartiles & Percentiles
        this.updateElement('stats-p0', this.formatNumber(sorted[0]));
        this.updateElement('stats-q1', this.formatNumber(q1));
        this.updateElement('stats-q2', this.formatNumber(this.percentile(sorted, 50)));
        this.updateElement('stats-q3', this.formatNumber(q3));
        this.updateElement('stats-p10', this.formatNumber(this.percentile(sorted, 10)));
        this.updateElement('stats-p20', this.formatNumber(this.percentile(sorted, 20)));
        this.updateElement('stats-p80', this.formatNumber(this.percentile(sorted, 80)));
        this.updateElement('stats-p90', this.formatNumber(this.percentile(sorted, 90)));
        this.updateElement('stats-p100', this.formatNumber(sorted[n - 1]));

        // Shape
        const skewness = this.skewness(mean, stdDev);
        const kurtosis = this.kurtosis(mean, stdDev);

        this.updateElement('stats-skewness', this.formatNumber(skewness));
        this.updateElement('stats-kurtosis', this.formatNumber(kurtosis));
        this.updateSkewnessVisual(skewness);
        this.updateKurtosisVisual(kurtosis);
        this.assessDistribution(skewness, kurtosis, sorted, mean, stdDev);

        // Z-scores
        this.updateZScores(mean, stdDev);

        // Visualization
        this.updateVisualization();

        // Animate results
        document.querySelectorAll('.stat-result').forEach(el => {
            el.classList.add('calculated');
            setTimeout(() => el.classList.remove('calculated'), 500);
        });
    },

    // ==================== STATISTICAL CALCULATIONS ====================
    median(sorted) {
        const n = sorted.length;
        if (n % 2 === 0) {
            return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
        }
        return sorted[Math.floor(n / 2)];
    },

    calcMode() {
        const freq = {};
        this.data.forEach(v => freq[v] = (freq[v] || 0) + 1);

        const maxFreq = Math.max(...Object.values(freq));
        const modes = Object.keys(freq).filter(k => freq[k] === maxFreq).map(Number);

        if (modes.length === this.data.length || maxFreq === 1) return 'None';
        if (modes.length > 3) return 'Multimodal';
        return modes.map(m => this.formatNumber(m)).join(', ');
    },

    geometricMean() {
        if (this.data.some(v => v <= 0)) return NaN;
        const product = this.data.reduce((a, b) => a * b, 1);
        return Math.pow(product, 1 / this.data.length);
    },

    harmonicMean() {
        if (this.data.some(v => v === 0)) return NaN;
        const sumReciprocals = this.data.reduce((a, b) => a + 1 / b, 0);
        return this.data.length / sumReciprocals;
    },

    rms() {
        const sumSquares = this.data.reduce((a, b) => a + b * b, 0);
        return Math.sqrt(sumSquares / this.data.length);
    },

    variance(mean) {
        const sumSquaredDiff = this.data.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
        return sumSquaredDiff / this.data.length;
    },

    meanAbsoluteDeviation(mean) {
        const sumAbsDiff = this.data.reduce((a, b) => a + Math.abs(b - mean), 0);
        return sumAbsDiff / this.data.length;
    },

    percentile(sorted, p) {
        const index = (p / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) return sorted[lower];
        return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
    },

    skewness(mean, std) {
        if (std === 0) return 0;
        const n = this.data.length;
        const m3 = this.data.reduce((a, b) => a + Math.pow((b - mean) / std, 3), 0) / n;
        return m3;
    },

    kurtosis(mean, std) {
        if (std === 0) return 0;
        const n = this.data.length;
        const m4 = this.data.reduce((a, b) => a + Math.pow((b - mean) / std, 4), 0) / n;
        return m4 - 3; // Excess kurtosis
    },

    // ==================== VISUAL UPDATES ====================
    updateSkewnessVisual(skewness) {
        const marker = document.getElementById('skew-marker');
        const interp = document.getElementById('skewness-interp');

        // Map skewness to position (capped at ±2)
        const pos = 50 + Math.max(-2, Math.min(2, skewness)) * 20;
        marker.style.left = `${pos}%`;

        if (Math.abs(skewness) < 0.5) {
            interp.textContent = 'Approximately symmetric';
            marker.style.background = 'var(--accent-green)';
        } else if (skewness > 0) {
            interp.textContent = skewness > 1 ? 'Highly right-skewed' : 'Moderately right-skewed';
            marker.style.background = 'var(--accent-yellow)';
        } else {
            interp.textContent = skewness < -1 ? 'Highly left-skewed' : 'Moderately left-skewed';
            marker.style.background = 'var(--accent-yellow)';
        }
    },

    updateKurtosisVisual(kurtosis) {
        const curve = document.getElementById('kurtosis-curve');
        const interp = document.getElementById('kurtosis-interp');

        curve.classList.remove('leptokurtic', 'platykurtic');

        if (kurtosis > 1) {
            curve.classList.add('leptokurtic');
            interp.textContent = 'Leptokurtic (heavy tails)';
        } else if (kurtosis < -1) {
            curve.classList.add('platykurtic');
            interp.textContent = 'Platykurtic (light tails)';
        } else {
            interp.textContent = 'Mesokurtic (normal-like)';
        }
    },

    assessDistribution(skewness, kurtosis, sorted, mean, std) {
        const normalBadge = document.getElementById('dist-normal');
        const symmetricBadge = document.getElementById('dist-symmetric');
        const outliersBadge = document.getElementById('dist-outliers');

        // Check normality (rough assessment)
        const isNormalish = Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 1;
        normalBadge.classList.toggle('active', isNormalish);
        normalBadge.classList.toggle('warning', !isNormalish);

        // Check symmetry
        const isSymmetric = Math.abs(skewness) < 0.5;
        symmetricBadge.classList.toggle('active', isSymmetric);
        symmetricBadge.classList.toggle('warning', !isSymmetric);

        // Check for outliers (IQR method)
        const q1 = this.percentile(sorted, 25);
        const q3 = this.percentile(sorted, 75);
        const iqr = q3 - q1;
        const outliers = this.data.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr);

        outliersBadge.classList.remove('active', 'warning', 'danger');
        if (outliers.length === 0) {
            outliersBadge.classList.add('active');
            outliersBadge.textContent = 'No Outliers';
        } else {
            outliersBadge.classList.add('danger');
            outliersBadge.textContent = `${outliers.length} Outlier${outliers.length > 1 ? 's' : ''}`;
        }
    },

    updateZScores(mean, std) {
        const zContainer = document.getElementById('z-scores-container');
        const outliersContainer = document.getElementById('outliers-container');

        if (std === 0) {
            zContainer.innerHTML = '<div class="z-scores-placeholder">Standard deviation is 0</div>';
            return;
        }

        const zScores = this.data.map((v, i) => ({
            value: v,
            zscore: (v - mean) / std,
            index: i
        }));

        // Z-scores table (show first 20)
        const displayZScores = zScores.slice(0, 20);
        zContainer.innerHTML = displayZScores.map(z => `
            <div class="z-score-row ${Math.abs(z.zscore) > 2 ? 'outlier' : ''}">
                <span class="value">${this.formatNumber(z.value)}</span>
                <span class="zscore">z = ${z.zscore >= 0 ? '+' : ''}${z.zscore.toFixed(3)}</span>
            </div>
        `).join('');

        if (zScores.length > 20) {
            zContainer.innerHTML += `<div class="z-scores-placeholder">... and ${zScores.length - 20} more</div>`;
        }

        // Outliers
        const outliers = zScores.filter(z => Math.abs(z.zscore) > 2);
        if (outliers.length > 0) {
            outliersContainer.innerHTML = outliers.map(z =>
                `<span class="outlier-chip">${this.formatNumber(z.value)} (z=${z.zscore.toFixed(2)})</span>`
            ).join('');
        } else {
            outliersContainer.innerHTML = '<div class="z-scores-placeholder">No outliers detected (|z| > 2)</div>';
        }

        // Sigma counts
        const within1 = zScores.filter(z => Math.abs(z.zscore) <= 1).length;
        const within2 = zScores.filter(z => Math.abs(z.zscore) <= 2).length;
        const within3 = zScores.filter(z => Math.abs(z.zscore) <= 3).length;

        document.getElementById('within-1sigma').textContent =
            `${within1} (${(within1 / this.data.length * 100).toFixed(1)}%) - expected 68.3%`;
        document.getElementById('within-2sigma').textContent =
            `${within2} (${(within2 / this.data.length * 100).toFixed(1)}%) - expected 95.4%`;
        document.getElementById('within-3sigma').textContent =
            `${within3} (${(within3 / this.data.length * 100).toFixed(1)}%) - expected 99.7%`;
    },

    calcCustomPercentile() {
        if (this.data.length === 0) return;
        const p = parseFloat(document.getElementById('custom-percentile').value);
        if (isNaN(p) || p < 0 || p > 100) return;

        const sorted = [...this.data].sort((a, b) => a - b);
        const result = this.percentile(sorted, p);
        document.getElementById('custom-percentile-result').textContent = this.formatNumber(result);
    },

    // ==================== VISUALIZATION ====================
    updateVisualization() {
        if (this.data.length === 0) return;

        const container = document.getElementById('stats-viz-container');

        if (this.currentViz === 'histogram') {
            this.drawHistogram(container);
        } else if (this.currentViz === 'boxplot') {
            this.drawBoxPlot(container);
        } else if (this.currentViz === 'density') {
            this.drawDensity(container);
        }

        // Show/hide histogram controls
        document.getElementById('histogram-controls').style.display =
            this.currentViz === 'histogram' ? 'flex' : 'none';
    },

    drawHistogram(container) {
        const bins = parseInt(document.getElementById('histogram-bins').value) || 10;

        const trace = {
            x: this.data,
            type: 'histogram',
            nbinsx: bins,
            marker: {
                color: 'rgba(0, 212, 255, 0.6)',
                line: { color: 'rgba(0, 212, 255, 1)', width: 1 }
            },
            hovertemplate: 'Range: %{x}<br>Count: %{y}<extra></extra>'
        };

        const layout = this.getPlotLayout('Value', 'Frequency');
        Plotly.newPlot(container, [trace], layout, { responsive: true, displayModeBar: false });
    },

    drawBoxPlot(container) {
        const trace = {
            y: this.data,
            type: 'box',
            name: 'Data',
            boxpoints: 'all',
            jitter: 0.3,
            pointpos: -1.8,
            marker: { color: 'rgba(0, 212, 255, 0.6)', size: 4 },
            line: { color: 'var(--accent-cyan)' },
            fillcolor: 'rgba(0, 212, 255, 0.2)'
        };

        const layout = this.getPlotLayout('', 'Value');
        layout.yaxis.zeroline = false;
        Plotly.newPlot(container, [trace], layout, { responsive: true, displayModeBar: false });
    },

    drawDensity(container) {
        // Kernel Density Estimation (simplified)
        const sorted = [...this.data].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const range = max - min || 1;
        const bandwidth = range / 20;

        const xVals = [];
        const yVals = [];
        const steps = 100;

        for (let i = 0; i <= steps; i++) {
            const x = min - range * 0.1 + (range * 1.2 * i) / steps;
            xVals.push(x);

            let density = 0;
            this.data.forEach(d => {
                const u = (x - d) / bandwidth;
                density += Math.exp(-0.5 * u * u) / (bandwidth * Math.sqrt(2 * Math.PI));
            });
            yVals.push(density / this.data.length);
        }

        const trace = {
            x: xVals,
            y: yVals,
            type: 'scatter',
            mode: 'lines',
            fill: 'tozeroy',
            fillcolor: 'rgba(0, 212, 255, 0.2)',
            line: { color: 'rgba(0, 212, 255, 1)', width: 2 }
        };

        const layout = this.getPlotLayout('Value', 'Density');
        Plotly.newPlot(container, [trace], layout, { responsive: true, displayModeBar: false });
    },

    getPlotLayout(xTitle, yTitle) {
        return {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            margin: { t: 20, r: 20, b: 50, l: 60 },
            xaxis: {
                title: xTitle,
                color: '#888',
                gridcolor: 'rgba(255,255,255,0.05)',
                zerolinecolor: 'rgba(255,255,255,0.1)'
            },
            yaxis: {
                title: yTitle,
                color: '#888',
                gridcolor: 'rgba(255,255,255,0.05)',
                zerolinecolor: 'rgba(255,255,255,0.1)'
            },
            font: { family: 'Inter, sans-serif', color: '#aaa' }
        };
    },

    // ==================== PROBABILITY DISTRIBUTIONS ====================
    calcNormal() {
        const mu = parseFloat(document.getElementById('norm-mean').value);
        const sigma = parseFloat(document.getElementById('norm-std').value);
        const x = parseFloat(document.getElementById('norm-x').value);
        const type = document.getElementById('norm-type').value;

        if (isNaN(mu) || isNaN(sigma) || isNaN(x) || sigma <= 0) return;

        const z = (x - mu) / sigma;
        let prob;

        if (type === 'less') {
            prob = this.normalCDF(z);
        } else if (type === 'greater') {
            prob = 1 - this.normalCDF(z);
        } else {
            const b = parseFloat(document.getElementById('norm-b').value);
            if (isNaN(b)) return;
            const z2 = (b - mu) / sigma;
            prob = this.normalCDF(z2) - this.normalCDF(z);
        }

        const pdf = this.normalPDF(z) / sigma;

        document.getElementById('norm-z-result').textContent = z.toFixed(4);
        document.getElementById('norm-prob-result').textContent = prob.toFixed(6);
        document.getElementById('norm-pdf-result').textContent = pdf.toFixed(6);

        this.drawNormalCurve(mu, sigma, x, type);
    },

    normalCDF(z) {
        // Approximation using error function
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
        const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;

        const sign = z < 0 ? -1 : 1;
        z = Math.abs(z) / Math.sqrt(2);

        const t = 1 / (1 + p * z);
        const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

        return 0.5 * (1 + sign * y);
    },

    normalPDF(z) {
        return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
    },

    drawNormalCurve(mu, sigma, x, type) {
        const container = document.getElementById('normal-curve');
        const xVals = [], yVals = [], fillX = [], fillY = [];

        const minX = mu - 4 * sigma;
        const maxX = mu + 4 * sigma;

        for (let i = 0; i <= 200; i++) {
            const xVal = minX + (maxX - minX) * i / 200;
            xVals.push(xVal);
            yVals.push(this.normalPDF((xVal - mu) / sigma) / sigma);
        }

        const trace = {
            x: xVals,
            y: yVals,
            type: 'scatter',
            mode: 'lines',
            line: { color: 'rgba(0, 212, 255, 1)', width: 2 }
        };

        // Shaded region
        let fillTrace = null;
        if (type === 'less') {
            for (let i = 0; i <= 200; i++) {
                const xVal = minX + (maxX - minX) * i / 200;
                if (xVal <= x) {
                    fillX.push(xVal);
                    fillY.push(this.normalPDF((xVal - mu) / sigma) / sigma);
                }
            }
            fillX.push(x, minX);
            fillY.push(0, 0);
            fillTrace = {
                x: fillX, y: fillY, type: 'scatter', fill: 'toself',
                fillcolor: 'rgba(255, 0, 170, 0.3)', line: { width: 0 }
            };
        }

        const layout = this.getPlotLayout('X', 'Density');
        layout.showlegend = false;

        const traces = fillTrace ? [fillTrace, trace] : [trace];
        Plotly.newPlot(container, traces, layout, { responsive: true, displayModeBar: false });
    },

    calcT() {
        const df = parseFloat(document.getElementById('t-df').value);
        const tVal = parseFloat(document.getElementById('t-value').value);
        const tail = document.getElementById('t-tail').value;

        if (isNaN(df) || isNaN(tVal) || df < 1) return;

        // Approximation for Student's t CDF
        const pValue = this.tCDF(tVal, df, tail);
        const critical = this.tCritical(df, 0.05, tail);

        document.getElementById('t-pvalue-result').textContent = pValue.toFixed(6);
        document.getElementById('t-critical-result').textContent =
            tail === 'two' ? `±${critical.toFixed(4)}` : critical.toFixed(4);
    },

    tCDF(t, df, tail) {
        // Simplified approximation
        const x = df / (df + t * t);
        const prob = 0.5 * this.incompleteBeta(x, df / 2, 0.5);

        if (tail === 'two') return 2 * (t > 0 ? prob : 1 - prob);
        if (tail === 'left') return t > 0 ? 1 - prob : prob;
        return t > 0 ? prob : 1 - prob;
    },

    tCritical(df, alpha, tail) {
        // Approximation - lookup would be more accurate
        const z = tail === 'two' ? 1.96 : 1.645;
        if (df >= 30) return z;

        const criticals = {
            1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
            10: 2.228, 15: 2.131, 20: 2.086, 25: 2.060
        };
        return criticals[df] || z * Math.sqrt(df / (df - 2));
    },

    incompleteBeta(x, a, b) {
        // Simplified approximation
        if (x === 0) return 0;
        if (x === 1) return 1;
        return x ** a * (1 - x) ** b / (a * this.beta(a, b));
    },

    beta(a, b) {
        return (this.gamma(a) * this.gamma(b)) / this.gamma(a + b);
    },

    gamma(n) {
        // Stirling's approximation for gamma function
        if (n < 0.5) return Math.PI / (Math.sin(Math.PI * n) * this.gamma(1 - n));
        n -= 1;
        const g = 7;
        const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
        let x = c[0];
        for (let i = 1; i < g + 2; i++) x += c[i] / (n + i);
        const t = n + g + 0.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x;
    },

    calcChi2() {
        const df = parseFloat(document.getElementById('chi2-df').value);
        const chi2 = parseFloat(document.getElementById('chi2-value').value);
        const type = document.getElementById('chi2-type').value;

        if (isNaN(df) || isNaN(chi2) || df < 1 || chi2 < 0) return;

        const prob = type === 'right' ?
            1 - this.chi2CDF(chi2, df) : this.chi2CDF(chi2, df);

        const critical = this.chi2Critical(df, 0.05);

        document.getElementById('chi2-prob-result').textContent = prob.toFixed(6);
        document.getElementById('chi2-critical-result').textContent = critical.toFixed(4);
    },

    chi2CDF(x, df) {
        // Simplified approximation using incomplete gamma
        return this.incompleteGamma(df / 2, x / 2) / this.gamma(df / 2);
    },

    incompleteGamma(a, x) {
        // Series expansion approximation
        let sum = 0, term = 1 / a;
        for (let n = 0; n < 100; n++) {
            sum += term;
            term *= x / (a + n + 1);
            if (Math.abs(term) < 1e-10) break;
        }
        return Math.pow(x, a) * Math.exp(-x) * sum;
    },

    chi2Critical(df, alpha) {
        // Approximation
        const criticals = {
            1: 3.841, 2: 5.991, 3: 7.815, 4: 9.488, 5: 11.070,
            10: 18.307, 15: 24.996, 20: 31.410, 25: 37.652
        };
        return criticals[df] || df + 2 * Math.sqrt(2 * df);
    },

    calcBinomial() {
        const n = parseInt(document.getElementById('binom-n').value);
        const p = parseFloat(document.getElementById('binom-p').value);
        const k = parseInt(document.getElementById('binom-k').value);
        const type = document.getElementById('binom-type').value;

        if (isNaN(n) || isNaN(p) || isNaN(k) || n < 1 || p < 0 || p > 1 || k < 0 || k > n) return;

        let prob;
        if (type === 'exact') {
            prob = this.binomialPMF(n, k, p);
        } else if (type === 'atmost') {
            prob = 0;
            for (let i = 0; i <= k; i++) prob += this.binomialPMF(n, i, p);
        } else {
            prob = 0;
            for (let i = k; i <= n; i++) prob += this.binomialPMF(n, i, p);
        }

        const expected = n * p;
        const std = Math.sqrt(n * p * (1 - p));

        document.getElementById('binom-prob-result').textContent = prob.toFixed(6);
        document.getElementById('binom-expected-result').textContent = expected.toFixed(4);
        document.getElementById('binom-std-result').textContent = std.toFixed(4);
    },

    binomialPMF(n, k, p) {
        return this.combination(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    },

    combination(n, k) {
        if (k > n || k < 0) return 0;
        if (k === 0 || k === n) return 1;
        let result = 1;
        for (let i = 0; i < k; i++) {
            result = result * (n - i) / (i + 1);
        }
        return result;
    },

    calcPoisson() {
        const lambda = parseFloat(document.getElementById('poisson-lambda').value);
        const k = parseInt(document.getElementById('poisson-k').value);
        const type = document.getElementById('poisson-type').value;

        if (isNaN(lambda) || isNaN(k) || lambda < 0 || k < 0) return;

        let prob;
        if (type === 'exact') {
            prob = this.poissonPMF(lambda, k);
        } else if (type === 'atmost') {
            prob = 0;
            for (let i = 0; i <= k; i++) prob += this.poissonPMF(lambda, i);
        } else {
            prob = 0;
            for (let i = k; i <= k + 100; i++) prob += this.poissonPMF(lambda, i);
        }

        document.getElementById('poisson-prob-result').textContent = prob.toFixed(6);
        document.getElementById('poisson-expected-result').textContent = lambda.toFixed(4);
    },

    poissonPMF(lambda, k) {
        return Math.pow(lambda, k) * Math.exp(-lambda) / this.factorial(k);
    },

    factorial(n) {
        if (n <= 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    },

    // ==================== CONFIDENCE INTERVAL ====================
    calcConfidenceInterval() {
        if (this.data.length < 2) return;

        const level = parseFloat(document.getElementById('ci-level').value);
        const sigmaKnown = document.getElementById('ci-sigma-known').value === 'yes';

        const n = this.data.length;
        const mean = this.data.reduce((a, b) => a + b, 0) / n;

        let sd, criticalValue;

        if (sigmaKnown) {
            sd = parseFloat(document.getElementById('ci-sigma').value);
            // Z critical values
            if (level === 0.90) criticalValue = 1.645;
            else if (level === 0.95) criticalValue = 1.96;
            else criticalValue = 2.576;
        } else {
            // Sample standard deviation
            const sumSqDiff = this.data.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
            sd = Math.sqrt(sumSqDiff / (n - 1));
            // t critical values (approximation for large n)
            criticalValue = this.tCritical(n - 1, 1 - level, 'two');
        }

        const marginOfError = criticalValue * sd / Math.sqrt(n);
        const lower = mean - marginOfError;
        const upper = mean + marginOfError;

        document.getElementById('ci-result').textContent =
            `(${this.formatNumber(lower)}, ${this.formatNumber(upper)})`;
        document.getElementById('ci-margin').textContent =
            `±${this.formatNumber(marginOfError)}`;
        document.getElementById('ci-lower-label').textContent = this.formatNumber(lower);
        document.getElementById('ci-mean-label').textContent = this.formatNumber(mean);
        document.getElementById('ci-upper-label').textContent = this.formatNumber(upper);

        // Update visual
        const range = document.getElementById('ci-range');
        const meanMarker = document.getElementById('ci-mean-marker');
        range.style.width = '60%';
        meanMarker.style.left = '50%';
    },

    // ==================== HYPOTHESIS TESTING ====================
    runHypothesisTest() {
        if (this.data.length < 2) return;

        const mu0 = parseFloat(document.getElementById('ht-null-mean').value);
        const alternative = document.getElementById('ht-alternative').value;
        const alpha = parseFloat(document.getElementById('ht-alpha').value);

        const n = this.data.length;
        const mean = this.data.reduce((a, b) => a + b, 0) / n;
        const sumSqDiff = this.data.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
        const sd = Math.sqrt(sumSqDiff / (n - 1));
        const se = sd / Math.sqrt(n);

        const tStat = (mean - mu0) / se;

        // Calculate p-value
        let pValue;
        const tail = alternative === 'two-sided' ? 'two' :
            (alternative === 'greater' ? 'right' : 'left');
        pValue = this.tCDF(Math.abs(tStat), n - 1, tail);
        if (alternative !== 'two-sided') {
            pValue = alternative === 'greater' ? pValue : 1 - pValue;
        }

        document.getElementById('ht-t-stat').textContent = tStat.toFixed(4);
        document.getElementById('ht-pvalue').textContent =
            pValue < 0.0001 ? '< 0.0001' : pValue.toFixed(4);

        // Conclusion
        const conclusion = document.getElementById('ht-conclusion');
        if (pValue < alpha) {
            conclusion.className = 'hypothesis-result reject';
            conclusion.innerHTML = `<strong>Reject H₀</strong> at α = ${alpha}<br>` +
                `Evidence suggests the population mean is ${alternative === 'greater' ?
                    'greater than' : (alternative === 'less' ? 'less than' : 'different from')} ${mu0}`;
        } else {
            conclusion.className = 'hypothesis-result fail-reject';
            conclusion.innerHTML = `<strong>Fail to reject H₀</strong> at α = ${alpha}<br>` +
                `Insufficient evidence to conclude the mean differs from ${mu0}`;
        }
    },

    // ==================== UTILITIES ====================
    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },

    formatNumber(num) {
        if (isNaN(num) || !isFinite(num)) return '-';
        if (Math.abs(num) >= 1e6 || (Math.abs(num) < 0.001 && num !== 0)) {
            return num.toExponential(4);
        }
        return Number(num.toPrecision(6)).toString();
    },

    resetAllResults() {
        const ids = [
            'stats-count', 'stats-sum', 'stats-min', 'stats-max',
            'stats-mean', 'stats-median', 'stats-mode', 'stats-geometric-mean',
            'stats-harmonic-mean', 'stats-rms', 'stats-range', 'stats-variance',
            'stats-std-dev', 'stats-sample-std', 'stats-cv', 'stats-mad',
            'stats-se', 'stats-iqr', 'stats-skewness', 'stats-kurtosis',
            'stats-p0', 'stats-q1', 'stats-q2', 'stats-q3',
            'stats-p10', 'stats-p20', 'stats-p80', 'stats-p90', 'stats-p100'
        ];
        ids.forEach(id => this.updateElement(id, '-'));

        document.getElementById('stats-count').textContent = '0';
        document.getElementById('z-scores-container').innerHTML =
            '<div class="z-scores-placeholder">Analyze data to see individual z-scores</div>';
        document.getElementById('outliers-container').innerHTML =
            '<div class="z-scores-placeholder">No outliers detected</div>';
        document.getElementById('within-1sigma').textContent = '-';
        document.getElementById('within-2sigma').textContent = '-';
        document.getElementById('within-3sigma').textContent = '-';

        const container = document.getElementById('stats-viz-container');
        if (container) Plotly.purge(container);
    },

    cleanup() {
        const container = document.getElementById('stats-viz-container');
        if (container) Plotly.purge(container);
        const normalCurve = document.getElementById('normal-curve');
        if (normalCurve) Plotly.purge(normalCurve);
    }
};

window.StatisticsTab = StatisticsTab;
