/**
 * QAGI Lab - Matrices Tab
 * Comprehensive matrix operations and analysis
 */

const MatricesTab = {
    matrixA: null,
    matrixB: null,
    currentVisualization: 'heatmap',
    chart: null,

    init() {
        this.initMatrixGrids();
        this.bindEvents();
        this.setupHubEvents();
        this.updateVisualization();
    },

    cleanup() {
        if (this.chart) {
            if (typeof Plotly !== 'undefined') {
                Plotly.purge('visualization-container');
            }
            this.chart = null;
        }
    },

    initMatrixGrids() {
        this.createMatrixGrid('a');
        this.createMatrixGrid('b');
    },

    createMatrixGrid(matrixId) {
        const rowsInput = document.getElementById(`matrix-${matrixId}-rows`);
        const colsInput = document.getElementById(`matrix-${matrixId}-cols`);
        const grid = document.getElementById(`matrix-${matrixId}-grid`);

        if (!rowsInput || !colsInput || !grid) return;

        const rows = parseInt(rowsInput.value) || 3;
        const cols = parseInt(colsInput.value) || 3;

        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${cols}, 60px)`;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const input = document.createElement('input');
                input.type = 'number';
                input.step = 'any';
                input.value = i === j ? '1' : '0'; // Default to identity-like
                input.dataset.row = i;
                input.dataset.col = j;
                input.addEventListener('input', () => this.onMatrixChange(matrixId));
                grid.appendChild(input);
            }
        }

        this.updateMatrixData(matrixId);
    },

    updateMatrixData(matrixId) {
        const grid = document.getElementById(`matrix-${matrixId}-grid`);
        const rowsInput = document.getElementById(`matrix-${matrixId}-rows`);
        const colsInput = document.getElementById(`matrix-${matrixId}-cols`);

        if (!grid || !rowsInput || !colsInput) return;

        const rows = parseInt(rowsInput.value) || 3;
        const cols = parseInt(colsInput.value) || 3;
        const inputs = grid.querySelectorAll('input');

        const matrix = [];
        let idx = 0;
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                row.push(parseFloat(inputs[idx]?.value) || 0);
                idx++;
            }
            matrix.push(row);
        }

        if (matrixId === 'a') {
            this.matrixA = matrix;
        } else {
            this.matrixB = matrix;
        }
    },

    onMatrixChange(matrixId) {
        this.updateMatrixData(matrixId);
        if (matrixId === 'a') {
            this.updateVisualization();
        }
    },

    bindEvents() {
        // Matrix dimension changes
        ['a', 'b'].forEach(id => {
            const rowsInput = document.getElementById(`matrix-${id}-rows`);
            const colsInput = document.getElementById(`matrix-${id}-cols`);

            if (rowsInput) {
                rowsInput.addEventListener('change', () => this.createMatrixGrid(id));
            }
            if (colsInput) {
                colsInput.addEventListener('change', () => this.createMatrixGrid(id));
            }

            // Clear/Random buttons
            const clearBtn = document.getElementById(`btn-matrix-${id}-clear`);
            const randomBtn = document.getElementById(`btn-matrix-${id}-random`);

            if (clearBtn) {
                clearBtn.addEventListener('click', () => this.clearMatrix(id));
            }
            if (randomBtn) {
                randomBtn.addEventListener('click', () => this.randomMatrix(id));
            }
        });

        // Operation buttons
        document.querySelectorAll('.operation-btn').forEach(btn => {
            btn.addEventListener('click', () => this.performOperation(btn.dataset.op));
        });

        // Special matrix buttons
        document.querySelectorAll('.special-btn').forEach(btn => {
            btn.addEventListener('click', () => this.generateSpecialMatrix(btn.dataset.type));
        });

        // Visualization buttons
        document.querySelectorAll('.viz-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.viz-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentVisualization = btn.dataset.viz;
                this.updateVisualization();
            });
        });

        // Analyze button
        const analyzeBtn = document.getElementById('btn-analyze');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzeMatrix());
        }

        // Solve system button
        const solveBtn = document.getElementById('btn-solve-system');
        if (solveBtn) {
            solveBtn.addEventListener('click', () => this.solveLinearSystem());
        }

        // Copy/Export buttons
        const copyBtn = document.getElementById('btn-copy-result');
        const exportBtn = document.getElementById('btn-export-csv');

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyResult());
        }
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCSV());
        }

        // Show/hide scalar input based on operation
        document.querySelectorAll('.operation-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const scalarGroup = document.getElementById('scalar-input-group');
                const powerGroup = document.getElementById('power-input-group');

                if (scalarGroup) {
                    scalarGroup.style.display = btn.dataset.op === 'scalar' ? 'block' : 'none';
                }
                if (powerGroup) {
                    powerGroup.style.display = btn.dataset.op === 'power' ? 'block' : 'none';
                }
            });
        });
    },

    clearMatrix(matrixId) {
        const grid = document.getElementById(`matrix-${matrixId}-grid`);
        if (!grid) return;

        grid.querySelectorAll('input').forEach(input => {
            input.value = '0';
        });
        this.updateMatrixData(matrixId);
        this.updateVisualization();
    },

    randomMatrix(matrixId) {
        const grid = document.getElementById(`matrix-${matrixId}-grid`);
        if (!grid) return;

        grid.querySelectorAll('input').forEach(input => {
            input.value = (Math.random() * 20 - 10).toFixed(2);
        });
        this.updateMatrixData(matrixId);
        this.updateVisualization();
    },

    performOperation(op) {
        this.updateMatrixData('a');
        this.updateMatrixData('b');

        const container = document.getElementById('results-container');
        if (!container) return;

        try {
            let result;
            let resultHtml = '';

            switch (op) {
                case 'add':
                    result = this.addMatrices();
                    resultHtml = this.renderMatrixResult('A + B', result);
                    break;
                case 'subtract':
                    result = this.subtractMatrices();
                    resultHtml = this.renderMatrixResult('A - B', result);
                    break;
                case 'multiply':
                    result = this.multiplyMatrices();
                    resultHtml = this.renderMatrixResult('A × B', result);
                    break;
                case 'scalar':
                    const k = parseFloat(document.getElementById('scalar-value')?.value) || 1;
                    result = this.scalarMultiply(k);
                    resultHtml = this.renderMatrixResult(`${k} × A`, result);
                    break;
                case 'transpose':
                    result = this.transpose();
                    resultHtml = this.renderMatrixResult('Aᵀ', result);
                    break;
                case 'inverse':
                    result = this.inverse();
                    resultHtml = this.renderMatrixResult('A⁻¹', result);
                    break;
                case 'determinant':
                    result = this.determinant();
                    resultHtml = this.renderScalarResult('det(A)', result);
                    break;
                case 'trace':
                    result = this.trace();
                    resultHtml = this.renderScalarResult('tr(A)', result);
                    break;
                case 'rank':
                    result = this.rank();
                    resultHtml = this.renderScalarResult('rank(A)', result);
                    break;
                case 'power':
                    const n = parseInt(document.getElementById('power-value')?.value) || 2;
                    result = this.matrixPower(n);
                    resultHtml = this.renderMatrixResult(`A^${n}`, result);
                    break;
                case 'lu':
                    result = this.luDecomposition();
                    resultHtml = this.renderMultiMatrixResult('LU Decomposition', result);
                    break;
                case 'qr':
                    result = this.qrDecomposition();
                    resultHtml = this.renderMultiMatrixResult('QR Decomposition', result);
                    break;
                case 'eigen':
                    result = this.eigenDecomposition();
                    resultHtml = this.renderEigenResult(result);
                    break;
                case 'svd':
                    result = this.svdDecomposition();
                    resultHtml = this.renderMultiMatrixResult('SVD (A = UΣVᵀ)', result);
                    break;
                case 'cofactor':
                    result = this.cofactorMatrix();
                    resultHtml = this.renderMatrixResult('Cofactor Matrix', result);
                    break;
                case 'adjugate':
                    result = this.adjugateMatrix();
                    resultHtml = this.renderMatrixResult('Adjugate Matrix', result);
                    break;
                case 'rref':
                    result = this.rref();
                    resultHtml = this.renderMatrixResult('Row Reduced Echelon Form', result);
                    break;
                case 'nullspace':
                    result = this.nullSpace();
                    resultHtml = this.renderMultiMatrixResult('Null Space Basis', { 'Basis Vectors': result });
                    break;
                default:
                    resultHtml = '<div class="error-message">⚠️ Unknown operation</div>';
            }

            container.innerHTML = resultHtml;
            this.lastResult = result;

        } catch (error) {
            container.innerHTML = `<div class="error-message">❌ ${error.message}</div>`;
        }
    },

    // Matrix Operations using math.js
    addMatrices() {
        return math.add(this.matrixA, this.matrixB)._data || math.add(this.matrixA, this.matrixB);
    },

    subtractMatrices() {
        return math.subtract(this.matrixA, this.matrixB)._data || math.subtract(this.matrixA, this.matrixB);
    },

    multiplyMatrices() {
        return math.multiply(this.matrixA, this.matrixB)._data || math.multiply(this.matrixA, this.matrixB);
    },

    scalarMultiply(k) {
        return math.multiply(k, this.matrixA)._data || math.multiply(k, this.matrixA);
    },

    transpose() {
        return math.transpose(this.matrixA)._data || math.transpose(this.matrixA);
    },

    inverse() {
        return math.inv(this.matrixA)._data || math.inv(this.matrixA);
    },

    determinant() {
        return math.det(this.matrixA);
    },

    trace() {
        return math.trace(this.matrixA);
    },

    rank() {
        // Calculate rank using SVD
        try {
            const svd = math.svd ? math.svd(this.matrixA) : null;
            if (svd && svd.S) {
                const tolerance = 1e-10;
                return svd.S.filter(s => Math.abs(s) > tolerance).length;
            }
            // Fallback: count non-zero rows in RREF
            const rref = this.rref();
            let rank = 0;
            for (const row of rref) {
                if (row.some(val => Math.abs(val) > 1e-10)) {
                    rank++;
                }
            }
            return rank;
        } catch (e) {
            throw new Error('Unable to compute rank');
        }
    },

    matrixPower(n) {
        let result = this.matrixA;
        for (let i = 1; i < n; i++) {
            result = math.multiply(result, this.matrixA)._data || math.multiply(result, this.matrixA);
        }
        return result;
    },

    luDecomposition() {
        const result = math.lup(this.matrixA);
        return {
            'L (Lower)': result.L._data || result.L,
            'U (Upper)': result.U._data || result.U,
            'P (Permutation)': result.p
        };
    },

    qrDecomposition() {
        const result = math.qr(this.matrixA);
        return {
            'Q (Orthogonal)': result.Q._data || result.Q,
            'R (Upper Triangular)': result.R._data || result.R
        };
    },

    eigenDecomposition() {
        const result = math.eigs(this.matrixA);
        return {
            values: result.values._data || result.values,
            vectors: result.eigenvectors ? result.eigenvectors.map(ev => ({
                value: ev.value,
                vector: ev.vector._data || ev.vector
            })) : null
        };
    },

    svdDecomposition() {
        try {
            // math.js doesn't have built-in SVD, we'll compute via eigendecomposition of A^T * A
            const AtA = math.multiply(math.transpose(this.matrixA), this.matrixA);
            const AAt = math.multiply(this.matrixA, math.transpose(this.matrixA));

            const eigAtA = math.eigs(AtA._data || AtA);
            const eigAAt = math.eigs(AAt._data || AAt);

            // Get singular values (square roots of eigenvalues)
            const singularValues = (eigAtA.values._data || eigAtA.values).map(v =>
                typeof v === 'object' ? Math.sqrt(v.re || 0) : Math.sqrt(Math.abs(v))
            ).sort((a, b) => b - a);

            return {
                'U': eigAAt.eigenvectors ? eigAAt.eigenvectors.slice(0, singularValues.length).map(ev => ev.vector._data || ev.vector) : 'N/A',
                'Σ (Singular Values)': singularValues,
                'V': eigAtA.eigenvectors ? eigAtA.eigenvectors.slice(0, singularValues.length).map(ev => ev.vector._data || ev.vector) : 'N/A'
            };
        } catch (e) {
            throw new Error('SVD computation requires a real matrix');
        }
    },

    cofactorMatrix() {
        const n = this.matrixA.length;
        const m = this.matrixA[0].length;
        if (n !== m) throw new Error('Matrix must be square');

        const cofactor = [];
        for (let i = 0; i < n; i++) {
            cofactor[i] = [];
            for (let j = 0; j < n; j++) {
                const minor = this.getMinor(this.matrixA, i, j);
                const det = n === 1 ? 1 : math.det(minor);
                cofactor[i][j] = Math.pow(-1, i + j) * det;
            }
        }
        return cofactor;
    },

    getMinor(matrix, row, col) {
        return matrix
            .filter((_, i) => i !== row)
            .map(row => row.filter((_, j) => j !== col));
    },

    adjugateMatrix() {
        const cofactor = this.cofactorMatrix();
        return math.transpose(cofactor)._data || math.transpose(cofactor);
    },

    rref() {
        const matrix = this.matrixA.map(row => [...row]); // Deep copy
        const rows = matrix.length;
        const cols = matrix[0].length;
        let lead = 0;

        for (let r = 0; r < rows; r++) {
            if (lead >= cols) return matrix;

            let i = r;
            while (Math.abs(matrix[i][lead]) < 1e-10) {
                i++;
                if (i === rows) {
                    i = r;
                    lead++;
                    if (lead === cols) return matrix;
                }
            }

            // Swap rows i and r
            [matrix[i], matrix[r]] = [matrix[r], matrix[i]];

            // Scale row r
            const lv = matrix[r][lead];
            matrix[r] = matrix[r].map(val => val / lv);

            // Eliminate other rows
            for (let j = 0; j < rows; j++) {
                if (j !== r) {
                    const lv2 = matrix[j][lead];
                    matrix[j] = matrix[j].map((val, k) => val - lv2 * matrix[r][k]);
                }
            }
            lead++;
        }

        return matrix;
    },

    nullSpace() {
        const rref = this.rref();
        const rows = rref.length;
        const cols = rref[0].length;

        // Find pivot columns
        const pivotCols = [];
        let lead = 0;
        for (let r = 0; r < rows && lead < cols; r++) {
            while (lead < cols && Math.abs(rref[r][lead]) < 1e-10) lead++;
            if (lead < cols) pivotCols.push(lead);
            lead++;
        }

        // Free variables are non-pivot columns
        const freeCols = [];
        for (let j = 0; j < cols; j++) {
            if (!pivotCols.includes(j)) freeCols.push(j);
        }

        if (freeCols.length === 0) {
            return [[0]]; // Only trivial solution
        }

        // Build null space vectors
        const nullspace = [];
        for (const freeCol of freeCols) {
            const vec = new Array(cols).fill(0);
            vec[freeCol] = 1;

            for (let i = 0; i < pivotCols.length; i++) {
                vec[pivotCols[i]] = -rref[i][freeCol];
            }
            nullspace.push(vec);
        }

        return nullspace;
    },

    generateSpecialMatrix(type) {
        const size = parseInt(document.getElementById('special-size')?.value) || 3;
        let matrix;

        switch (type) {
            case 'identity':
                matrix = math.identity(size)._data;
                break;
            case 'zeros':
                matrix = math.zeros(size, size)._data;
                break;
            case 'ones':
                matrix = math.ones(size, size)._data;
                break;
            case 'diagonal':
                matrix = [];
                for (let i = 0; i < size; i++) {
                    matrix[i] = [];
                    for (let j = 0; j < size; j++) {
                        matrix[i][j] = i === j ? i + 1 : 0;
                    }
                }
                break;
            case 'hilbert':
                matrix = [];
                for (let i = 0; i < size; i++) {
                    matrix[i] = [];
                    for (let j = 0; j < size; j++) {
                        matrix[i][j] = 1 / (i + j + 1);
                    }
                }
                break;
            case 'pascal':
                matrix = [];
                for (let i = 0; i < size; i++) {
                    matrix[i] = [];
                    for (let j = 0; j < size; j++) {
                        matrix[i][j] = this.binomial(i + j, i);
                    }
                }
                break;
            case 'toeplitz':
                matrix = [];
                const values = Array.from({ length: 2 * size - 1 }, (_, i) => i - size + 1);
                for (let i = 0; i < size; i++) {
                    matrix[i] = [];
                    for (let j = 0; j < size; j++) {
                        matrix[i][j] = Math.abs(i - j);
                    }
                }
                break;
        }

        this.applyMatrixToGrid('a', matrix);
    },

    binomial(n, k) {
        if (k < 0 || k > n) return 0;
        if (k === 0 || k === n) return 1;
        let result = 1;
        for (let i = 0; i < k; i++) {
            result = result * (n - i) / (i + 1);
        }
        return Math.round(result);
    },

    applyMatrixToGrid(matrixId, matrix) {
        const rowsInput = document.getElementById(`matrix-${matrixId}-rows`);
        const colsInput = document.getElementById(`matrix-${matrixId}-cols`);

        if (rowsInput && colsInput) {
            rowsInput.value = matrix.length;
            colsInput.value = matrix[0].length;
        }

        this.createMatrixGrid(matrixId);

        const grid = document.getElementById(`matrix-${matrixId}-grid`);
        const inputs = grid.querySelectorAll('input');

        let idx = 0;
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                if (inputs[idx]) {
                    inputs[idx].value = typeof matrix[i][j] === 'number' ?
                        matrix[i][j].toFixed(4).replace(/\.?0+$/, '') : matrix[i][j];
                }
                idx++;
            }
        }

        this.updateMatrixData(matrixId);
        this.updateVisualization();
    },

    analyzeMatrix() {
        this.updateMatrixData('a');
        const container = document.getElementById('analysis-container');
        if (!container) return;

        try {
            const m = this.matrixA;
            const rows = m.length;
            const cols = m[0].length;
            const isSquare = rows === cols;

            let det = null, trace = null, rank = null;
            let isSymmetric = false, isOrthogonal = false, isPositiveDefinite = false;
            let eigenSummary = null;

            if (isSquare) {
                det = math.det(m);
                trace = math.trace(m);

                // Check symmetric
                isSymmetric = m.every((row, i) =>
                    row.every((val, j) => Math.abs(val - m[j][i]) < 1e-10)
                );

                // Check orthogonal (A * A^T = I)
                try {
                    const AtA = math.multiply(m, math.transpose(m));
                    const identity = math.identity(rows);
                    isOrthogonal = (AtA._data || AtA).every((row, i) =>
                        row.every((val, j) => Math.abs(val - identity._data[i][j]) < 1e-10)
                    );
                } catch (e) {
                    isOrthogonal = false;
                }

                // Check positive definite (all eigenvalues positive)
                try {
                    if (isSymmetric) {
                        const eigs = math.eigs(m);
                        const eigenvalues = eigs.values._data || eigs.values;
                        isPositiveDefinite = eigenvalues.every(v =>
                            (typeof v === 'object' ? v.re : v) > 1e-10
                        );
                        eigenSummary = eigenvalues.map(v =>
                            typeof v === 'object' ? v.re.toFixed(4) : v.toFixed(4)
                        );
                    }
                } catch (e) {
                    isPositiveDefinite = false;
                }
            }

            rank = this.rank();

            // Frobenius norm
            const frobNorm = Math.sqrt(m.flat().reduce((sum, v) => sum + v * v, 0));

            // Condition number (ratio of largest to smallest singular value)
            let condNumber = null;
            if (isSquare) {
                try {
                    const AtA = math.multiply(math.transpose(m), m);
                    const eigs = math.eigs(AtA._data || AtA);
                    const eigenvalues = (eigs.values._data || eigs.values)
                        .map(v => typeof v === 'object' ? Math.abs(v.re) : Math.abs(v))
                        .filter(v => v > 1e-10);
                    if (eigenvalues.length > 0) {
                        const maxSV = Math.sqrt(Math.max(...eigenvalues));
                        const minSV = Math.sqrt(Math.min(...eigenvalues));
                        condNumber = maxSV / minSV;
                    }
                } catch (e) { }
            }

            container.innerHTML = `
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <div class="analysis-label">Dimensions</div>
                        <div class="analysis-value">${rows} × ${cols}</div>
                    </div>
                    <div class="analysis-item">
                        <div class="analysis-label">Rank</div>
                        <div class="analysis-value highlight">${rank}</div>
                    </div>
                    ${isSquare ? `
                        <div class="analysis-item">
                            <div class="analysis-label">Determinant</div>
                            <div class="analysis-value ${det > 0 ? 'positive' : det < 0 ? 'negative' : ''}">${det.toFixed(4)}</div>
                        </div>
                        <div class="analysis-item">
                            <div class="analysis-label">Trace</div>
                            <div class="analysis-value">${trace.toFixed(4)}</div>
                        </div>
                    ` : ''}
                    <div class="analysis-item">
                        <div class="analysis-label">Frobenius Norm</div>
                        <div class="analysis-value">${frobNorm.toFixed(4)}</div>
                    </div>
                    ${condNumber !== null ? `
                        <div class="analysis-item">
                            <div class="analysis-label">Condition Number</div>
                            <div class="analysis-value ${condNumber > 1000 ? 'negative' : ''}">${condNumber.toFixed(2)}</div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="properties-grid">
                    <span class="property-badge ${isSquare ? 'true' : 'false'}">
                        ${isSquare ? '✓' : '✗'} Square
                    </span>
                    ${isSquare ? `
                        <span class="property-badge ${det !== 0 ? 'true' : 'false'}">
                            ${det !== 0 ? '✓' : '✗'} Invertible
                        </span>
                        <span class="property-badge ${isSymmetric ? 'true' : 'false'}">
                            ${isSymmetric ? '✓' : '✗'} Symmetric
                        </span>
                        <span class="property-badge ${isOrthogonal ? 'true' : 'false'}">
                            ${isOrthogonal ? '✓' : '✗'} Orthogonal
                        </span>
                        <span class="property-badge ${isPositiveDefinite ? 'true' : 'false'}">
                            ${isPositiveDefinite ? '✓' : '✗'} Positive Definite
                        </span>
                    ` : ''}
                    <span class="property-badge ${rank === Math.min(rows, cols) ? 'true' : 'false'}">
                        ${rank === Math.min(rows, cols) ? '✓' : '✗'} Full Rank
                    </span>
                </div>
                
                ${eigenSummary ? `
                    <div style="margin-top: 16px;">
                        <h4 style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">Eigenvalues</h4>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${eigenSummary.map((v, i) => `
                                <span style="font-family: var(--font-mono); padding: 4px 8px; background: var(--bg-tertiary); border-radius: var(--radius-sm); font-size: 13px;">
                                    λ${i + 1} = ${v}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            `;

        } catch (error) {
            container.innerHTML = `<div class="error-message">❌ ${error.message}</div>`;
        }
    },

    solveLinearSystem() {
        this.updateMatrixData('a');
        const container = document.getElementById('system-results');
        const vectorInput = document.getElementById('vector-b');

        if (!container || !vectorInput) return;

        try {
            const bStr = vectorInput.value.trim();
            if (!bStr) {
                throw new Error('Please enter vector b values');
            }

            const b = bStr.split(',').map(v => parseFloat(v.trim()));

            if (b.length !== this.matrixA.length) {
                throw new Error(`Vector b must have ${this.matrixA.length} elements (matching matrix rows)`);
            }

            const x = math.lusolve(this.matrixA, b);
            const solution = x._data ? x._data.map(row => row[0]) : x.map(row => row[0]);

            container.innerHTML = `
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div>
                        <h4 style="font-size: 14px; color: var(--text-secondary); margin-bottom: 12px;">Solution Vector x:</h4>
                        <div class="solution-vector">
                            ${solution.map((v, i) => `
                                <div class="solution-cell">x${i + 1} = ${v.toFixed(6)}</div>
                            `).join('')}
                        </div>
                    </div>
                    <div style="margin-left: 40px;">
                        <h4 style="font-size: 14px; color: var(--text-secondary); margin-bottom: 12px;">Verification (Ax):</h4>
                        <div style="font-family: var(--font-mono); font-size: 13px; color: var(--text-muted);">
                            ${math.multiply(this.matrixA, solution).map((v, i) => `
                                <div>Row ${i + 1}: ${v.toFixed(6)} ≈ ${b[i]}</div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

        } catch (error) {
            container.innerHTML = `<div class="error-message">❌ ${error.message}</div>`;
        }
    },

    updateVisualization() {
        const container = document.getElementById('visualization-container');
        if (!container || !this.matrixA) return;

        if (typeof Plotly === 'undefined') {
            container.innerHTML = '<div class="empty-state"><p>Plotly not loaded</p></div>';
            return;
        }

        const data = this.matrixA;

        if (this.currentVisualization === 'heatmap') {
            const trace = {
                z: data,
                type: 'heatmap',
                colorscale: [
                    [0, '#312e81'],
                    [0.25, '#6366f1'],
                    [0.5, '#a855f7'],
                    [0.75, '#ec4899'],
                    [1, '#f43f5e']
                ],
                showscale: true
            };

            const layout = {
                title: {
                    text: 'Matrix A Heatmap',
                    font: { color: '#e2e8f0', size: 16 }
                },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                xaxis: {
                    title: 'Column',
                    color: '#94a3b8',
                    gridcolor: 'rgba(148, 163, 184, 0.1)'
                },
                yaxis: {
                    title: 'Row',
                    color: '#94a3b8',
                    gridcolor: 'rgba(148, 163, 184, 0.1)',
                    autorange: 'reversed'
                },
                margin: { t: 50, r: 50, b: 50, l: 50 }
            };

            Plotly.newPlot(container, [trace], layout, { responsive: true });

        } else if (this.currentVisualization === '3d') {
            const trace = {
                z: data,
                type: 'surface',
                colorscale: [
                    [0, '#312e81'],
                    [0.25, '#6366f1'],
                    [0.5, '#a855f7'],
                    [0.75, '#ec4899'],
                    [1, '#f43f5e']
                ],
                showscale: true
            };

            const layout = {
                title: {
                    text: 'Matrix A 3D Surface',
                    font: { color: '#e2e8f0', size: 16 }
                },
                paper_bgcolor: 'rgba(0,0,0,0)',
                scene: {
                    xaxis: { title: 'Column', color: '#94a3b8', gridcolor: 'rgba(148, 163, 184, 0.2)' },
                    yaxis: { title: 'Row', color: '#94a3b8', gridcolor: 'rgba(148, 163, 184, 0.2)' },
                    zaxis: { title: 'Value', color: '#94a3b8', gridcolor: 'rgba(148, 163, 184, 0.2)' },
                    bgcolor: 'rgba(0,0,0,0)'
                },
                margin: { t: 50, r: 20, b: 20, l: 20 }
            };

            Plotly.newPlot(container, [trace], layout, { responsive: true });
        }

        this.chart = container;
    },

    // Render helpers
    renderMatrixResult(title, matrix) {
        if (!Array.isArray(matrix) || !Array.isArray(matrix[0])) {
            return `<div class="error-message">⚠️ Invalid matrix result</div>`;
        }

        const cols = matrix[0].length;
        return `
            <div class="result-matrix">
                <h4>📊 ${title}</h4>
                <div class="result-matrix-grid" style="grid-template-columns: repeat(${cols}, 1fr);">
                    ${matrix.flat().map(v => `
                        <div class="result-cell">${this.formatNumber(v)}</div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderScalarResult(title, value) {
        return `
            <div class="scalar-result">
                <span class="scalar-result-label">${title} =</span>
                <span class="scalar-result-value">${this.formatNumber(value)}</span>
            </div>
        `;
    },

    renderMultiMatrixResult(title, results) {
        let html = `<h4 style="font-size: 16px; color: var(--text-primary); margin-bottom: 16px;">📊 ${title}</h4>`;
        html += '<div class="multi-result">';

        for (const [name, matrix] of Object.entries(results)) {
            html += `<div class="result-section"><h4>${name}</h4>`;

            if (Array.isArray(matrix) && Array.isArray(matrix[0])) {
                const cols = matrix[0].length;
                html += `
                    <div class="result-matrix-grid" style="grid-template-columns: repeat(${cols}, 1fr); font-size: 12px;">
                        ${matrix.flat().map(v => `<div class="result-cell">${this.formatNumber(v)}</div>`).join('')}
                    </div>
                `;
            } else if (Array.isArray(matrix)) {
                html += `<div style="font-family: var(--font-mono); font-size: 13px;">[${matrix.map(v => this.formatNumber(v)).join(', ')}]</div>`;
            } else {
                html += `<div style="font-family: var(--font-mono); font-size: 13px;">${matrix}</div>`;
            }

            html += '</div>';
        }

        html += '</div>';
        return html;
    },

    renderEigenResult(result) {
        let html = '<div class="eigen-result">';
        html += '<h4 style="font-size: 16px; color: var(--text-primary); margin-bottom: 16px;">📊 Eigendecomposition</h4>';
        html += '<div class="eigenvalue-list">';

        const values = result.values;
        values.forEach((v, i) => {
            const val = typeof v === 'object' ?
                `${v.re.toFixed(4)}${v.im >= 0 ? '+' : ''}${v.im.toFixed(4)}i` :
                v.toFixed(4);

            html += `
                <div class="eigenvalue-item">
                    <span class="eigenvalue-label">λ${i + 1}</span>
                    <span class="eigenvalue-value">${val}</span>
                    ${result.vectors && result.vectors[i] ? `
                        <span class="eigenvector-value">v = [${result.vectors[i].vector.map(x =>
                typeof x === 'object' ? x.re.toFixed(2) : x.toFixed(2)
            ).join(', ')}]</span>
                    ` : ''}
                </div>
            `;
        });

        html += '</div></div>';
        return html;
    },

    formatNumber(n) {
        if (typeof n === 'object' && n !== null) {
            // Complex number
            const re = n.re || 0;
            const im = n.im || 0;
            if (Math.abs(im) < 1e-10) return re.toFixed(4).replace(/\.?0+$/, '');
            return `${re.toFixed(2)}${im >= 0 ? '+' : ''}${im.toFixed(2)}i`;
        }
        if (typeof n !== 'number' || isNaN(n)) return '0';
        if (Math.abs(n) < 1e-10) return '0';
        if (Math.abs(n) > 1e6 || Math.abs(n) < 1e-4) return n.toExponential(3);
        return n.toFixed(4).replace(/\.?0+$/, '');
    },

    copyResult() {
        if (!this.lastResult) return;

        let text;
        if (Array.isArray(this.lastResult)) {
            text = this.lastResult.map(row =>
                Array.isArray(row) ? row.join('\t') : row
            ).join('\n');
        } else {
            text = String(this.lastResult);
        }

        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('btn-copy-result');
            if (btn) {
                const original = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = original, 1500);
            }
        });
    },

    exportCSV() {
        this.updateMatrixData('a');
        const csv = this.matrixA.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'matrix_a.csv';
        a.click();
        URL.revokeObjectURL(url);
    },

    // ==================== DATA HUB INTEGRATION ====================
    setupHubEvents() {
        // Export buttons
        document.getElementById('hub-export-matrix-a')?.addEventListener('click', () => this.hubExportMatrix('a'));
        document.getElementById('hub-export-matrix-b')?.addEventListener('click', () => this.hubExportMatrix('b'));
        document.getElementById('hub-export-eigen')?.addEventListener('click', () => this.hubExportEigen());
        document.getElementById('hub-export-result')?.addEventListener('click', () => this.hubExportResult());

        // Import buttons
        document.getElementById('hub-import-to-a')?.addEventListener('click', () => this.hubImportMatrix('a'));
        document.getElementById('hub-import-to-b')?.addEventListener('click', () => this.hubImportMatrix('b'));

        // Listen for "use data" events from hub
        if (window.QAGIDataHub) {
            QAGIDataHub.subscribe('use-data', (e) => {
                if (e.detail.targetTab === 'matrices') {
                    this.handleHubImport(e.detail.entry);
                }
            });
        }
    },

    hubExportMatrix(id) {
        if (!window.QAGIDataHub) return;
        this.updateMatrixData(id);

        const matrix = id === 'a' ? this.matrixA : this.matrixB;
        if (!matrix || matrix.length === 0) {
            QAGIUtils?.showToast(`Matrix ${id.toUpperCase()} is empty`, 'warning');
            return;
        }

        QAGIDataHub.exportMatrix(
            'matrices',
            matrix,
            `Matrix ${id.toUpperCase()}`,
            `${matrix.length}×${matrix[0].length} matrix`
        );
    },

    hubExportEigen() {
        if (!window.QAGIDataHub) return;
        this.updateMatrixData('a');

        try {
            const result = this.eigenDecomposition();
            const eigenvalues = result.values.map(v =>
                typeof v === 'object' ? { re: v.re, im: v.im } : { re: v, im: 0 }
            );

            QAGIDataHub.exportComplex(
                'matrices',
                eigenvalues,
                'Eigenvalues of Matrix A',
                `${eigenvalues.length} eigenvalues`
            );
        } catch (e) {
            QAGIUtils?.showToast('Failed to compute eigenvalues', 'warning');
        }
    },

    hubExportResult() {
        if (!window.QAGIDataHub || !this.lastResult) {
            QAGIUtils?.showToast('No result to export', 'warning');
            return;
        }

        if (Array.isArray(this.lastResult) && Array.isArray(this.lastResult[0])) {
            QAGIDataHub.exportMatrix('matrices', this.lastResult, 'Matrix Operation Result', 'Last computed result');
        } else if (Array.isArray(this.lastResult)) {
            QAGIDataHub.exportArray('matrices', this.lastResult, 'Matrix Operation Result', 'Last computed result');
        } else {
            QAGIDataHub.exportScalar('matrices', this.lastResult, 'Scalar Result', 'Last computed scalar');
        }
    },

    hubImportMatrix(targetId) {
        if (!window.QAGIDataHub) return;

        const matrices = QAGIDataHub.list('matrices');
        const vectors = QAGIDataHub.list('vectors');
        const all = [...matrices, ...vectors];

        if (all.length === 0) {
            QAGIUtils?.showToast('No matrices in Data Hub. Export from Neural Net or Quantum tab first.', 'info');
            return;
        }

        this.showHubImportModal(all, (entry) => {
            const data = QAGIDataHub.import(entry.dataType, entry.id);
            if (data && Array.isArray(data)) {
                // Ensure it's a 2D array
                const matrix = Array.isArray(data[0]) ? data : [data];
                this.applyMatrixToGrid(targetId, matrix);
                QAGIUtils?.showToast(`Imported to Matrix ${targetId.toUpperCase()}`, 'success');
            }
        });
    },

    showHubImportModal(items, callback) {
        const modal = document.createElement('div');
        modal.className = 'hub-modal-overlay';
        modal.innerHTML = `
            <div class="hub-modal">
                <div class="hub-modal-header">
                    <h4>📥 Import Matrix</h4>
                    <button class="btn-icon hub-import-close">✕</button>
                </div>
                <div class="hub-modal-body" style="max-height: 300px; overflow-y: auto;">
                    ${items.map(item => `
                        <div class="hub-item" data-id="${item.id}" data-type="${item.dataType}" style="cursor: pointer;">
                            <div class="hub-item-icon">${QAGIDataHub.icons[item.dataType] || '📦'}</div>
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
        if (entry.dataType === 'matrices' || entry.dataType === 'vectors') {
            const data = entry.data;
            if (data && Array.isArray(data)) {
                const matrix = Array.isArray(data[0]) ? data : [data];
                this.applyMatrixToGrid('a', matrix);
                QAGIUtils?.showToast('Imported to Matrix A', 'success');
            }
        }
    },

    cleanup() {
        if (this.chart) {
            Plotly.purge?.('visualization-container');
            this.chart = null;
        }
    }
};

// Export for tab manager
window.MatricesTab = MatricesTab;

