/**
 * QAGI Lab - Neural Network Lab
 * Full-featured with activation functions, weight editing, tooltips, history tracking
 */

const NeuralnetTab = {
    // Network structure
    layers: [],
    weights: [],
    biases: [],

    // Training state
    isTraining: false,
    isPaused: false,

    // History for visualization
    lossHistory: [],
    weightHistory: [],
    biasHistory: [],

    // Charts
    lossChart: null,
    editChart: null,
    weightCharts: [],
    biasCharts: [],

    // Canvas
    canvas: null,
    ctx: null,
    connections: [],

    // Editor state
    editType: null,
    editIndices: null,

    // Datasets
    datasets: {
        xor: { name: 'XOR', desc: 'Output 1 when inputs differ', inputs: [[0, 0], [0, 1], [1, 0], [1, 1]], outputs: [[0], [1], [1], [0]] },
        and: { name: 'AND', desc: 'Output 1 when both are 1', inputs: [[0, 0], [0, 1], [1, 0], [1, 1]], outputs: [[0], [0], [0], [1]] },
        or: { name: 'OR', desc: 'Output 1 when any is 1', inputs: [[0, 0], [0, 1], [1, 0], [1, 1]], outputs: [[0], [1], [1], [1]] },
        nand: { name: 'NAND', desc: 'Opposite of AND', inputs: [[0, 0], [0, 1], [1, 0], [1, 1]], outputs: [[1], [1], [1], [0]] },
        xnor: { name: 'XNOR', desc: 'Output 1 when inputs same', inputs: [[0, 0], [0, 1], [1, 0], [1, 1]], outputs: [[1], [0], [0], [1]] }
    },

    init() {
        console.log('Neural Network Lab initialized');
        this.setupCanvas();
        this.setupEventListeners();
        this.setupHubEvents();
        this.buildNetwork([2, 4, 1]);
        this.initLossChart();
        this.showDataset('xor');
    },

    setupCanvas() {
        this.canvas = document.getElementById('network-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            this.canvas.addEventListener('mousemove', e => this.onMouseMove(e));
            this.canvas.addEventListener('mouseleave', () => this.hideTooltip());
        }
    },

    resizeCanvas() {
        if (!this.canvas) return;
        const c = this.canvas.parentElement;
        this.canvas.width = c.clientWidth;
        this.canvas.height = c.clientHeight || 200;
        this.drawNetwork();
    },

    setupEventListeners() {
        // Build
        document.getElementById('btn-build')?.addEventListener('click', () => {
            const cfg = document.getElementById('layer-config').value;
            const layers = cfg.split(',').map(n => parseInt(n.trim())).filter(n => n > 0);
            if (layers.length >= 2) this.buildNetwork(layers);
        });

        // Randomize
        document.getElementById('btn-randomize')?.addEventListener('click', () => this.buildNetwork([...this.layers]));

        // Train/Pause/Stop
        document.getElementById('btn-train')?.addEventListener('click', () => this.train());
        document.getElementById('btn-pause')?.addEventListener('click', () => {
            this.isPaused = !this.isPaused;
            document.getElementById('btn-pause').textContent = this.isPaused ? '▶' : '⏸';
        });
        document.getElementById('btn-stop')?.addEventListener('click', () => { this.isTraining = false; });

        // Test
        document.getElementById('btn-test')?.addEventListener('click', () => this.runTest());

        // Dataset change
        document.getElementById('dataset-select')?.addEventListener('change', e => {
            const v = e.target.value;
            document.getElementById('custom-data-box').style.display = v === 'custom' ? 'block' : 'none';
            if (v !== 'custom') this.showDataset(v);
        });

        // Export
        document.getElementById('btn-export')?.addEventListener('click', () => this.exportData());

        // Modal
        document.getElementById('edit-close')?.addEventListener('click', () => this.closeModal());
        document.getElementById('edit-modal')?.addEventListener('click', e => { if (e.target.id === 'edit-modal') this.closeModal(); });
        document.getElementById('edit-save')?.addEventListener('click', () => this.saveEdit());
        document.getElementById('edit-zero')?.addEventListener('click', () => document.getElementById('edit-value').value = '0');
        document.getElementById('edit-one')?.addEventListener('click', () => document.getElementById('edit-value').value = '1');
        document.getElementById('edit-neg')?.addEventListener('click', () => document.getElementById('edit-value').value = '-1');
        document.getElementById('edit-rand')?.addEventListener('click', () => document.getElementById('edit-value').value = (Math.random() * 2 - 1).toFixed(4));
    },

    showDataset(name) {
        const d = this.datasets[name];
        if (!d) return;
        let html = `<div class="problem-title">${d.name}</div><div class="problem-desc">${d.desc}</div>`;
        html += '<table class="truth-table"><tr><th>A</th><th>B</th><th>Out</th></tr>';
        d.inputs.forEach((inp, i) => {
            html += `<tr><td>${inp[0]}</td><td>${inp[1]}</td><td class="out-${d.outputs[i][0]}">${d.outputs[i][0]}</td></tr>`;
        });
        html += '</table>';
        document.getElementById('problem-box').innerHTML = html;
    },

    getActivation() {
        return document.getElementById('activation-select')?.value || 'sigmoid';
    },

    getInitMethod() {
        return document.getElementById('init-select')?.value || 'xavier';
    },

    // Activation functions
    activate(x, type) {
        switch (type) {
            case 'sigmoid': return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
            case 'tanh': return Math.tanh(x);
            case 'relu': return Math.max(0, x);
            case 'leaky_relu': return x > 0 ? x : 0.01 * x;
            default: return 1 / (1 + Math.exp(-x));
        }
    },

    activateDeriv(a, type) {
        switch (type) {
            case 'sigmoid': return a * (1 - a);
            case 'tanh': return 1 - a * a;
            case 'relu': return a > 0 ? 1 : 0;
            case 'leaky_relu': return a > 0 ? 1 : 0.01;
            default: return a * (1 - a);
        }
    },

    buildNetwork(sizes) {
        this.layers = sizes;
        this.weights = [];
        this.biases = [];
        this.lossHistory = [];
        this.weightHistory = [];
        this.biasHistory = [];

        const init = this.getInitMethod();

        for (let l = 0; l < sizes.length - 1; l++) {
            const fanIn = sizes[l], fanOut = sizes[l + 1];
            let limit;

            if (init === 'xavier') limit = Math.sqrt(6 / (fanIn + fanOut));
            else if (init === 'he') limit = Math.sqrt(2 / fanIn);
            else if (init === 'uniform') limit = 1;
            else limit = 0;

            const w = [], b = [];
            for (let i = 0; i < fanOut; i++) {
                const row = [];
                for (let j = 0; j < fanIn; j++) {
                    row.push(init === 'zero' ? 0 : (Math.random() * 2 - 1) * limit);
                }
                w.push(row);
                b.push(0);
            }
            this.weights.push(w);
            this.biases.push(b);
        }

        this.saveSnapshot();
        this.updateInfo();
        this.createWeightCards();
        this.createBiasCards();
        this.drawNetwork();
        this.updateLossChart();
        this.updatePredictions();
        this.resetUI();
    },

    saveSnapshot() {
        this.weightHistory.push(JSON.parse(JSON.stringify(this.weights)));
        this.biasHistory.push(JSON.parse(JSON.stringify(this.biases)));
    },

    updateInfo() {
        let neurons = 0, wCount = 0, bCount = 0;
        this.layers.forEach(n => neurons += n);
        this.weights.forEach(l => l.forEach(r => { wCount += r.length; bCount++; }));

        document.getElementById('info-layers').textContent = this.layers.length;
        document.getElementById('info-neurons').textContent = neurons;
        document.getElementById('info-weights').textContent = wCount;
        document.getElementById('info-biases').textContent = bCount;

        // Update layer filter
        const filter = document.getElementById('weight-layer-filter');
        if (filter) {
            filter.innerHTML = '<option value="all">All Layers</option>';
            for (let i = 0; i < this.weights.length; i++) {
                filter.innerHTML += `<option value="${i}">Layer ${i + 1}→${i + 2}</option>`;
            }
        }
    },

    resetUI() {
        document.getElementById('epoch-display').textContent = '0 / 0';
        document.getElementById('loss-display').textContent = '-';
        document.getElementById('accuracy-display').textContent = '-';
        document.getElementById('progress-bar').style.width = '0%';
    },

    // Forward pass
    forward(input) {
        const act = this.getActivation();
        let current = [...input];

        for (let l = 0; l < this.weights.length; l++) {
            const next = [];
            for (let i = 0; i < this.weights[l].length; i++) {
                let sum = this.biases[l][i];
                for (let j = 0; j < current.length; j++) {
                    sum += this.weights[l][i][j] * current[j];
                }
                next.push(this.activate(sum, act));
            }
            current = next;
        }
        return current;
    },

    // Training
    async train() {
        if (this.isTraining) return;
        this.isTraining = true;
        this.isPaused = false;
        document.getElementById('btn-pause').textContent = '⏸';

        const data = this.getData();
        const epochs = parseInt(document.getElementById('epochs').value) || 1000;
        const lr = parseFloat(document.getElementById('learning-rate').value) || 1.0;
        const act = this.getActivation();

        document.getElementById('training-status').className = 'status training';
        document.getElementById('training-status').innerHTML = '<span class="status-dot yellow"></span><span>Training</span>';

        this.lossHistory = [];
        this.weightHistory = [];
        this.biasHistory = [];
        this.saveSnapshot();

        for (let epoch = 0; epoch < epochs && this.isTraining; epoch++) {
            while (this.isPaused && this.isTraining) await new Promise(r => setTimeout(r, 100));
            if (!this.isTraining) break;

            const loss = this.trainEpoch(data, lr, act);
            this.lossHistory.push(loss);
            this.saveSnapshot();

            if (epoch % 20 === 0 || epoch === epochs - 1) {
                const acc = this.calcAccuracy(data);
                document.getElementById('epoch-display').textContent = `${epoch + 1} / ${epochs}`;
                document.getElementById('loss-display').textContent = loss.toFixed(6);
                document.getElementById('accuracy-display').textContent = `${(acc * 100).toFixed(1)}%`;
                document.getElementById('progress-bar').style.width = `${((epoch + 1) / epochs) * 100}%`;

                this.updateLossChart();
                this.updateWeightCards();
                this.updateBiasCards();
                this.drawNetwork();
                this.updatePredictions();
                await new Promise(r => setTimeout(r, 1));
            }
        }

        this.isTraining = false;
        document.getElementById('training-status').className = 'status';
        document.getElementById('training-status').innerHTML = '<span class="status-dot green"></span><span>Done</span>';

        this.updateLossChart();
        this.updateWeightCards();
        this.updateBiasCards();
        this.updatePredictions();
    },

    trainEpoch(data, lr, act) {
        let totalLoss = 0;

        for (let s = 0; s < data.inputs.length; s++) {
            const input = data.inputs[s];
            const target = data.outputs[s];

            // Forward with storage
            const as = [input];
            let current = [...input];

            for (let l = 0; l < this.weights.length; l++) {
                const a = [];
                for (let i = 0; i < this.weights[l].length; i++) {
                    let sum = this.biases[l][i];
                    for (let j = 0; j < current.length; j++) sum += this.weights[l][i][j] * current[j];
                    a.push(this.activate(sum, act));
                }
                as.push(a);
                current = a;
            }

            const output = as[as.length - 1];
            for (let k = 0; k < output.length; k++) totalLoss += (output[k] - target[k]) ** 2;

            // Backprop
            let delta = output.map((o, i) => (o - target[i]) * this.activateDeriv(o, act));

            for (let l = this.weights.length - 1; l >= 0; l--) {
                const prev = as[l];

                for (let i = 0; i < this.weights[l].length; i++) {
                    this.biases[l][i] -= lr * delta[i];
                    for (let j = 0; j < this.weights[l][i].length; j++) {
                        this.weights[l][i][j] -= lr * delta[i] * prev[j];
                    }
                }

                if (l > 0) {
                    const newDelta = [];
                    for (let j = 0; j < this.weights[l][0].length; j++) {
                        let sum = 0;
                        for (let i = 0; i < this.weights[l].length; i++) sum += this.weights[l][i][j] * delta[i];
                        newDelta.push(sum * this.activateDeriv(as[l][j], act));
                    }
                    delta = newDelta;
                }
            }
        }

        return totalLoss / data.inputs.length;
    },

    calcAccuracy(data) {
        let correct = 0;
        for (let i = 0; i < data.inputs.length; i++) {
            const out = this.forward(data.inputs[i]);
            const pred = out[0] > 0.5 ? 1 : 0;
            if (pred === data.outputs[i][0]) correct++;
        }
        return correct / data.inputs.length;
    },

    getData() {
        const sel = document.getElementById('dataset-select').value;
        if (sel === 'custom') {
            try {
                const json = JSON.parse(document.getElementById('custom-data').value);
                return { inputs: json.map(d => d.in), outputs: json.map(d => d.out) };
            } catch (e) { return this.datasets.xor; }
        }
        return this.datasets[sel] || this.datasets.xor;
    },

    // Charts
    initLossChart() {
        const ctx = document.getElementById('loss-chart')?.getContext('2d');
        if (!ctx) return;
        if (this.lossChart) this.lossChart.destroy();

        this.lossChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [{ data: [], borderColor: '#ff00aa', fill: false, borderWidth: 2, pointRadius: 0, tension: 0.1 }] },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: true, title: { display: true, text: 'Epoch', color: '#888' }, ticks: { color: '#888' } },
                    y: { display: true, title: { display: true, text: 'Loss', color: '#888' }, ticks: { color: '#888' }, min: 0 }
                }
            }
        });
    },

    updateLossChart() {
        if (!this.lossChart) return;
        this.lossChart.data.labels = this.lossHistory.map((_, i) => i);
        this.lossChart.data.datasets[0].data = this.lossHistory;
        this.lossChart.update('none');
    },

    // Weight cards
    createWeightCards() {
        this.weightCharts.forEach(c => c.chart?.destroy());
        this.weightCharts = [];
        const container = document.getElementById('weights-container');
        if (!container) return;
        container.innerHTML = '';

        this.weights.forEach((layer, l) => {
            const sep = document.createElement('div');
            sep.className = 'layer-sep';
            sep.textContent = `Layer ${l + 1} → ${l + 2}`;
            container.appendChild(sep);

            layer.forEach((neuron, i) => {
                neuron.forEach((w, j) => {
                    this.addWeightCard(container, l, i, j, w);
                });
            });
        });
    },

    addWeightCard(container, l, i, j, val) {
        const card = document.createElement('div');
        card.className = 'weight-card';
        card.innerHTML = `
            <div class="weight-card-header">
                <span class="weight-card-name">W[${l}][${i}][${j}]</span>
                <span class="weight-card-value ${val >= 0 ? 'positive' : 'negative'}" id="wv-${l}-${i}-${j}">${val.toFixed(3)}</span>
            </div>
            <div class="weight-card-chart"><canvas id="wc-${l}-${i}-${j}"></canvas></div>
        `;
        card.onclick = () => this.openEdit('weight', l, i, j);
        container.appendChild(card);

        requestAnimationFrame(() => {
            const ctx = document.getElementById(`wc-${l}-${i}-${j}`)?.getContext('2d');
            if (ctx) {
                const chart = new Chart(ctx, {
                    type: 'line',
                    data: { labels: [0], datasets: [{ data: [val], borderColor: '#00d4ff', borderWidth: 1, pointRadius: 0 }] },
                    options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
                });
                this.weightCharts.push({ l, i, j, chart });
            }
        });
    },

    updateWeightCards() {
        const labels = this.weightHistory.map((_, i) => i);
        this.weightCharts.forEach(({ l, i, j, chart }) => {
            const data = this.weightHistory.map(h => h[l][i][j]);
            chart.data.labels = labels;
            chart.data.datasets[0].data = data;
            chart.update('none');

            const v = this.weights[l][i][j];
            const el = document.getElementById(`wv-${l}-${i}-${j}`);
            if (el) { el.textContent = v.toFixed(3); el.className = `weight-card-value ${v >= 0 ? 'positive' : 'negative'}`; }
        });
    },

    // Bias cards
    createBiasCards() {
        this.biasCharts.forEach(c => c.chart?.destroy());
        this.biasCharts = [];
        const container = document.getElementById('biases-container');
        if (!container) return;
        container.innerHTML = '';

        this.biases.forEach((layer, l) => {
            const sep = document.createElement('div');
            sep.className = 'layer-sep bias';
            sep.textContent = `Layer ${l + 2} Biases`;
            container.appendChild(sep);

            layer.forEach((b, i) => {
                this.addBiasCard(container, l, i, b);
            });
        });
    },

    addBiasCard(container, l, i, val) {
        const card = document.createElement('div');
        card.className = 'weight-card bias-card';
        card.innerHTML = `
            <div class="weight-card-header">
                <span class="weight-card-name">b[${l}][${i}]</span>
                <span class="weight-card-value ${val >= 0 ? 'positive' : 'negative'}" id="bv-${l}-${i}">${val.toFixed(3)}</span>
            </div>
            <div class="weight-card-chart"><canvas id="bc-${l}-${i}"></canvas></div>
        `;
        card.onclick = () => this.openEdit('bias', l, i);
        container.appendChild(card);

        requestAnimationFrame(() => {
            const ctx = document.getElementById(`bc-${l}-${i}`)?.getContext('2d');
            if (ctx) {
                const chart = new Chart(ctx, {
                    type: 'line',
                    data: { labels: [0], datasets: [{ data: [val], borderColor: '#ff00aa', borderWidth: 1, pointRadius: 0 }] },
                    options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
                });
                this.biasCharts.push({ l, i, chart });
            }
        });
    },

    updateBiasCards() {
        const labels = this.biasHistory.map((_, i) => i);
        this.biasCharts.forEach(({ l, i, chart }) => {
            const data = this.biasHistory.map(h => h[l][i]);
            chart.data.labels = labels;
            chart.data.datasets[0].data = data;
            chart.update('none');

            const v = this.biases[l][i];
            const el = document.getElementById(`bv-${l}-${i}`);
            if (el) { el.textContent = v.toFixed(3); el.className = `weight-card-value ${v >= 0 ? 'positive' : 'negative'}`; }
        });
    },

    // Edit modal
    openEdit(type, l, i, j) {
        this.editType = type;
        this.editIndices = { l, i, j };

        const val = type === 'weight' ? this.weights[l][i][j] : this.biases[l][i];
        const history = type === 'weight' ? this.weightHistory.map(h => h[l][i][j]) : this.biasHistory.map(h => h[l][i]);

        document.getElementById('edit-title').textContent = type === 'weight' ? `Weight W[${l}][${i}][${j}]` : `Bias b[${l}][${i}]`;
        document.getElementById('edit-value').value = val.toFixed(6);
        document.getElementById('edit-modal').classList.add('active');

        // Mini chart
        const ctx = document.getElementById('edit-chart')?.getContext('2d');
        if (ctx) {
            if (this.editChart) this.editChart.destroy();
            this.editChart = new Chart(ctx, {
                type: 'line',
                data: { labels: history.map((_, i) => i), datasets: [{ data: history, borderColor: type === 'weight' ? '#00d4ff' : '#ff00aa', fill: false, borderWidth: 2, pointRadius: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'Epoch', color: '#888' } }, y: { title: { display: true, text: 'Value', color: '#888' } } } }
            });
        }
    },

    saveEdit() {
        const val = parseFloat(document.getElementById('edit-value').value);
        if (isNaN(val)) return;

        const { l, i, j } = this.editIndices;
        if (this.editType === 'weight') {
            this.weights[l][i][j] = val;
        } else {
            this.biases[l][i] = val;
        }

        this.saveSnapshot();
        this.updateWeightCards();
        this.updateBiasCards();
        this.drawNetwork();
        this.updatePredictions();
        this.closeModal();
    },

    closeModal() {
        document.getElementById('edit-modal').classList.remove('active');
        if (this.editChart) { this.editChart.destroy(); this.editChart = null; }
    },

    // Network visualization
    drawNetwork() {
        if (!this.ctx) return;
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);
        if (this.layers.length === 0) return;

        const lx = w / (this.layers.length + 1);
        this.connections = [];
        const pos = this.layers.map((n, l) => {
            const sp = Math.min(35, (h - 30) / Math.max(n, 1));
            const sy = (h - (n - 1) * sp) / 2;
            return Array(n).fill(0).map((_, i) => ({ x: lx * (l + 1), y: sy + i * sp }));
        });

        // Draw connections
        this.weights.forEach((layer, l) => {
            layer.forEach((neuron, i) => {
                neuron.forEach((wt, j) => {
                    const from = pos[l][j], to = pos[l + 1][i];
                    this.connections.push({ l, i, j, from, to, w: wt });
                    const int = Math.min(Math.abs(wt) * 2, 1);
                    ctx.strokeStyle = wt > 0 ? `rgba(0,255,136,${0.2 + int * 0.6})` : `rgba(255,0,170,${0.2 + int * 0.6})`;
                    ctx.lineWidth = 1 + int * 2;
                    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
                });
            });
        });

        // Draw neurons
        pos.forEach((layer, l) => {
            layer.forEach(p => {
                ctx.fillStyle = l === 0 ? '#00d4ff' : (l === this.layers.length - 1 ? '#ff00aa' : '#1a1a25');
                ctx.strokeStyle = l === 0 ? '#00d4ff' : (l === this.layers.length - 1 ? '#ff00aa' : '#00d4ff');
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            });
        });
    },

    onMouseMove(e) {
        const r = this.canvas.getBoundingClientRect();
        const mx = e.clientX - r.left, my = e.clientY - r.top;

        const hit = this.connections.find(c => {
            const { from: f, to: t } = c;
            const A = mx - f.x, B = my - f.y, C = t.x - f.x, D = t.y - f.y;
            const len = C * C + D * D;
            const tt = Math.max(0, Math.min(1, (A * C + B * D) / len));
            return Math.sqrt((mx - (f.x + tt * C)) ** 2 + (my - (f.y + tt * D)) ** 2) < 6;
        });

        const tip = document.getElementById('tooltip');
        if (hit) {
            tip.style.display = 'block';
            tip.style.left = (e.clientX - r.left + 12) + 'px';
            tip.style.top = (e.clientY - r.top - 10) + 'px';
            tip.innerHTML = `<b>W[${hit.l}][${hit.i}][${hit.j}]</b><br>Value: <span style="color:${hit.w >= 0 ? '#00ff88' : '#ff00aa'}">${hit.w.toFixed(4)}</span>`;
        } else {
            tip.style.display = 'none';
        }
    },

    hideTooltip() {
        document.getElementById('tooltip').style.display = 'none';
    },

    // Test
    runTest() {
        const input = document.getElementById('test-input').value.split(',').map(n => parseFloat(n.trim()));
        if (input.length !== this.layers[0]) {
            document.getElementById('test-output').textContent = 'Invalid input';
            return;
        }
        const out = this.forward(input);
        document.getElementById('test-output').textContent = out.map(v => v.toFixed(4)).join(', ');
        document.getElementById('test-interpretation').textContent = out[0] > 0.5 ? 'Classified as 1' : 'Classified as 0';
    },

    updatePredictions() {
        const data = this.getData();
        let html = '<table class="predictions-table"><tr><th>Input</th><th>Target</th><th>Prediction</th><th>Error</th></tr>';

        data.inputs.forEach((inp, i) => {
            const out = this.forward(inp);
            const pred = out[0];
            const target = data.outputs[i][0];
            const err = Math.abs(pred - target);
            const cls = err < 0.5 ? 'correct' : 'wrong';
            html += `<tr><td>[${inp.join(', ')}]</td><td>${target}</td><td class="${cls}">${pred.toFixed(4)}</td><td>${err.toFixed(4)}</td></tr>`;
        });

        html += '</table>';
        document.getElementById('predictions-table').innerHTML = html;
    },

    exportData() {
        const data = {
            layers: this.layers,
            weights: this.weights,
            biases: this.biases,
            lossHistory: this.lossHistory,
            weightHistory: this.weightHistory,
            biasHistory: this.biasHistory
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'neural-network-data.json';
        a.click();
    },

    // ==================== DATA HUB INTEGRATION ====================
    setupHubEvents() {
        // Export buttons
        document.getElementById('hub-export-weights')?.addEventListener('click', () => this.hubExportWeights());
        document.getElementById('hub-export-loss')?.addEventListener('click', () => this.hubExportLoss());
        document.getElementById('hub-export-accuracy')?.addEventListener('click', () => this.hubExportAccuracy());
        document.getElementById('hub-export-all')?.addEventListener('click', () => this.hubExportAll());

        // Import buttons
        document.getElementById('hub-import-weights')?.addEventListener('click', () => this.hubImportWeights());
        document.getElementById('hub-import-dataset')?.addEventListener('click', () => this.hubImportDataset());

        // Listen for "use data" events from hub
        if (window.QAGIDataHub) {
            QAGIDataHub.subscribe('use-data', (e) => {
                if (e.detail.targetTab === 'neuralnet') {
                    this.handleHubImport(e.detail.entry);
                }
            });
        }
    },

    hubExportWeights() {
        if (!window.QAGIDataHub || this.weights.length === 0) {
            QAGIUtils?.showToast('No weights to export', 'warning');
            return;
        }

        // Export each layer as a separate matrix
        this.weights.forEach((layer, l) => {
            QAGIDataHub.exportMatrix(
                'neuralnet',
                layer,
                `NN Layer ${l + 1}→${l + 2} Weights`,
                `Weight matrix from layer ${l + 1} to ${l + 2} (${layer.length}×${layer[0].length})`
            );
        });
    },

    hubExportLoss() {
        if (!window.QAGIDataHub || this.lossHistory.length === 0) {
            QAGIUtils?.showToast('No loss history to export', 'warning');
            return;
        }

        QAGIDataHub.exportArray(
            'neuralnet',
            this.lossHistory,
            'Training Loss History',
            `MSE loss over ${this.lossHistory.length} epochs`
        );
    },

    hubExportAccuracy() {
        if (!window.QAGIDataHub) return;

        // Calculate accuracy at each snapshot
        const data = this.getData();
        const accHistory = this.weightHistory.map((_, i) => {
            // Temporarily set weights/biases to snapshot
            const origW = this.weights;
            const origB = this.biases;
            this.weights = this.weightHistory[i];
            this.biases = this.biasHistory[i];
            const acc = this.calcAccuracy(data);
            this.weights = origW;
            this.biases = origB;
            return acc;
        });

        QAGIDataHub.exportArray(
            'neuralnet',
            accHistory,
            'Accuracy History',
            `Accuracy over ${accHistory.length} snapshots`
        );
    },

    hubExportAll() {
        if (!window.QAGIDataHub) return;

        const networkData = {
            layers: this.layers,
            weights: this.weights,
            biases: this.biases,
            activation: this.getActivation(),
            lossHistory: this.lossHistory
        };

        QAGIDataHub.export(
            'neuralnet',
            'datasets',
            networkData,
            { name: 'Complete Neural Network', description: `${this.layers.join('-')} network with trained weights` }
        );
    },

    hubImportWeights() {
        if (!window.QAGIDataHub) return;

        const matrices = QAGIDataHub.list('matrices');
        if (matrices.length === 0) {
            QAGIUtils?.showToast('No matrices in Data Hub. Export from Matrices tab first.', 'info');
            return;
        }

        // Show selection modal
        this.showHubImportModal('matrices', matrices, (entry) => {
            const matrix = QAGIDataHub.importMatrix(entry.id);
            if (matrix && this.weights.length > 0) {
                // Try to match matrix dimensions with first layer
                const targetRows = this.weights[0].length;
                const targetCols = this.weights[0][0].length;

                if (matrix.length === targetRows && matrix[0].length === targetCols) {
                    this.weights[0] = matrix;
                    this.saveSnapshot();
                    this.updateWeightCards();
                    this.drawNetwork();
                    this.updatePredictions();
                    QAGIUtils?.showToast('Weights imported to layer 1', 'success');
                } else {
                    QAGIUtils?.showToast(`Matrix size mismatch. Expected ${targetRows}×${targetCols}, got ${matrix.length}×${matrix[0]?.length}`, 'warning');
                }
            }
        });
    },

    hubImportDataset() {
        if (!window.QAGIDataHub) return;

        const datasets = QAGIDataHub.list('datasets');
        const arrays = QAGIDataHub.list('arrays');
        const all = [...datasets, ...arrays];

        if (all.length === 0) {
            QAGIUtils?.showToast('No datasets in Data Hub. Export from Statistics tab first.', 'info');
            return;
        }

        this.showHubImportModal('datasets', all, (entry) => {
            const data = QAGIDataHub.import(entry.dataType || 'datasets', entry.id);
            if (data && data.inputs && data.outputs) {
                // Valid dataset format
                document.getElementById('dataset-select').value = 'custom';
                document.getElementById('custom-data-box').style.display = 'block';
                const formatted = data.inputs.map((inp, i) => ({ in: inp, out: data.outputs[i] }));
                document.getElementById('custom-data').value = JSON.stringify(formatted, null, 2);
                QAGIUtils?.showToast('Dataset imported as custom data', 'success');
            } else {
                QAGIUtils?.showToast('Invalid dataset format', 'warning');
            }
        });
    },

    showHubImportModal(type, items, callback) {
        const modal = document.createElement('div');
        modal.className = 'hub-modal-overlay';
        modal.innerHTML = `
            <div class="hub-modal">
                <div class="hub-modal-header">
                    <h4>📥 Import ${type}</h4>
                    <button class="btn-icon hub-import-close">✕</button>
                </div>
                <div class="hub-modal-body" style="max-height: 300px; overflow-y: auto;">
                    ${items.map(item => `
                        <div class="hub-item" data-id="${item.id}" data-type="${item.dataType || type}" style="cursor: pointer;">
                            <div class="hub-item-icon">${QAGIDataHub.icons[item.dataType || type] || '📦'}</div>
                            <div class="hub-item-info">
                                <div class="hub-item-name">${item.name}</div>
                                <div class="hub-item-meta">
                                    <span>${QAGIDataHub.tabIcons[item.sourceTab] || '📁'} ${item.sourceTab}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.hub-import-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        modal.querySelectorAll('.hub-item').forEach(el => {
            el.addEventListener('click', () => {
                const entry = items.find(i => i.id === el.dataset.id);
                if (entry) {
                    callback(entry);
                    modal.remove();
                }
            });
        });
    },

    handleHubImport(entry) {
        // Handle imports triggered from the integration panel "Use" button
        if (entry.dataType === 'matrices') {
            const matrix = entry.data;
            if (matrix && this.weights.length > 0) {
                if (matrix.length === this.weights[0].length && matrix[0].length === this.weights[0][0].length) {
                    this.weights[0] = JSON.parse(JSON.stringify(matrix));
                    this.saveSnapshot();
                    this.updateWeightCards();
                    this.drawNetwork();
                    this.updatePredictions();
                    QAGIUtils?.showToast('Matrix imported as layer 1 weights', 'success');
                }
            }
        } else if (entry.dataType === 'arrays' && entry.data.length > 0) {
            // Could be used as bias values or analyzed
            QAGIUtils?.showToast('Array data received from hub', 'info');
        }
    },

    cleanup() {
        this.isTraining = false;
    }
};

window.NeuralnetTab = NeuralnetTab;

