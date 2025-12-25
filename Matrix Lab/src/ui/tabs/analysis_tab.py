"""
ULTIMATE Analysis Tab
Maximum mathematical analysis with all advanced features.
"""

from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QGroupBox,
                               QLabel, QGridLayout, QTableWidget,
                               QTableWidgetItem, QScrollArea)
from PySide6.QtCore import Qt
import numpy as np
from scipy import linalg

from src.utils.formatters import Formatters


class AnalysisTab(QWidget):
    """Ultimate mathematical analysis."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.current_matrix = None
        self.setup_ui()
    
    def setup_ui(self):
        main_layout = QVBoxLayout(self)
        
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        scroll.setVerticalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        scroll.setStyleSheet("""
            QScrollArea { border: none; }
            QScrollBar:vertical { width: 12px; background: #f5f5f5; }
            QScrollBar::handle:vertical { background: #2196f3; border-radius: 6px; min-height: 30px; }
        """)
        
        container = QWidget()
        content_layout = QHBoxLayout(container)
        content_layout.setSpacing(12)
        
        # 5 Columns for maximum analysis
        self.cols = []
        for i in range(5):
            widget = QWidget()
            layout = QVBoxLayout(widget)
            layout.setContentsMargins(0,0,0,0)
            layout.setAlignment(Qt.AlignTop)
            content_layout.addWidget(widget, 1)
            self.cols.append(layout)
        
        scroll.setWidget(container)
        main_layout.addWidget(scroll)
        
    def clear_all(self):
        for layout in self.cols:
            while layout.count():
                item = layout.takeAt(0)
                if item.widget():
                    item.widget().deleteLater()
    
    def add_group(self, col_idx, group):
        self.cols[col_idx].addWidget(group)
        
    def update_analysis(self, matrix: np.ndarray):
        self.current_matrix = matrix
        self.clear_all()
        
        # Column 0: Fundamentals
        self.add_fundamental(0)
        self.add_classification(0)
        self.add_structure(0)
        
        # Column 1: Eigenanalysis
        self.add_characteristic_equation(1)
        self.add_eigenvalues_table(1)
        self.add_eigenvectors_table(1)
        self.add_gershgorin_discs(1)
        
        # Column 2: SVD & Norms
        self.add_svd_table(2)
        self.add_norms(2)
        self.add_conditioning(2)
        self.add_numerical_rank(2)
        
        # Column 3: Advanced Spectral
        self.add_spectral_analysis(3)
        self.add_numerical_stability(3)
        self.add_geometry(3)
        
        # Column 4: Theory & Applications
        self.add_control_theory(4)
        self.add_graph_theory(4)
        self.add_information_theory(4)
        self.add_special_properties(4)
        
        for layout in self.cols:
            layout.addStretch()

    # ===================== COLUMN 0 =====================
    
    def add_fundamental(self, col):
        group = QGroupBox("Fundamental")
        grid = QGridLayout()
        m = self.current_matrix
        r, c = m.shape
        row = 0
        
        self._add(grid, row, "Shape", f"{r} x {c}"); row += 1
        self._add(grid, row, "Rank", np.linalg.matrix_rank(m)); row += 1
        self._add(grid, row, "Nullity", min(r,c) - np.linalg.matrix_rank(m)); row += 1
        
        if r == c:
            det = np.linalg.det(m)
            self._add(grid, row, "Determinant", Formatters.format_number(det)); row += 1
            self._add(grid, row, "Trace", Formatters.format_number(np.trace(m))); row += 1
            self._add(grid, row, "Invertible", "Yes" if abs(det) > 1e-10 else "No"); row += 1
        
        group.setLayout(grid)
        self.add_group(col, group)

    def add_classification(self, col):
        group = QGroupBox("Classification")
        grid = QGridLayout()
        m = self.current_matrix
        r, c = m.shape
        row = 0
        
        if r == c:
            self._add(grid, row, "Symmetric", "Yes" if np.allclose(m, m.T) else "No"); row += 1
            self._add(grid, row, "Hermitian", "Yes" if np.allclose(m, m.conj().T) else "No"); row += 1
            self._add(grid, row, "Orthogonal", "Yes" if np.allclose(m.T @ m, np.eye(r)) else "No"); row += 1
            self._add(grid, row, "Unitary", "Yes" if np.allclose(m.conj().T @ m, np.eye(r)) else "No"); row += 1
            self._add(grid, row, "Normal", "Yes" if np.allclose(m @ m.conj().T, m.conj().T @ m) else "No"); row += 1
            
            if np.allclose(m, m.conj().T):
                evals = np.linalg.eigvalsh(m)
                if np.all(evals > 1e-10): deft = "Pos Def"
                elif np.all(evals >= -1e-10): deft = "Pos Semi-Def"
                elif np.all(evals < -1e-10): deft = "Neg Def"
                else: deft = "Indefinite"
                self._add(grid, row, "Definiteness", deft); row += 1
        
        group.setLayout(grid)
        self.add_group(col, group)

    def add_structure(self, col):
        group = QGroupBox("Structure")
        grid = QGridLayout()
        m = self.current_matrix
        r, c = m.shape
        row = 0
        
        # Sparsity
        nnz = np.count_nonzero(m)
        self._add(grid, row, "Sparsity", f"{(1 - nnz/m.size)*100:.1f}%"); row += 1
        
        # Bandwidth
        upper_bw = lower_bw = 0
        for i in range(r):
            for j in range(c):
                if abs(m[i,j]) > 1e-10:
                    if j > i: upper_bw = max(upper_bw, j-i)
                    if i > j: lower_bw = max(lower_bw, i-j)
        self._add(grid, row, "Bandwidth", f"{lower_bw + upper_bw + 1}"); row += 1
        
        # Diagonal dominance
        if r == c:
            diag = np.abs(np.diag(m))
            off_diag = np.sum(np.abs(m), axis=1) - diag
            self._add(grid, row, "Diag Dominant", "Yes" if np.all(diag >= off_diag) else "No"); row += 1
        
        group.setLayout(grid)
        self.add_group(col, group)

    # ===================== COLUMN 1 =====================
    
    def add_characteristic_equation(self, col):
        group = QGroupBox("Characteristic Polynomial")
        layout = QVBoxLayout()
        m = self.current_matrix
        
        if m.shape[0] == m.shape[1]:
            coeffs = np.poly(m)
            n = len(coeffs) - 1
            terms = []
            for i, c in enumerate(coeffs):
                power = n - i
                c_val = c.real if abs(c.imag) < 1e-10 else c
                if abs(c_val) < 1e-10: continue
                if power == 0: term = f"{c_val:+.3g}"
                elif power == 1: term = f"{c_val:+.3g}λ"
                else: term = f"{c_val:+.3g}λ^{power}"
                terms.append(term)
            poly_str = " ".join(terms) if terms else "0"
            if poly_str.startswith("+"): poly_str = poly_str[2:]
            
            label = QLabel(f"p(λ) = {poly_str}")
            label.setWordWrap(True)
            label.setStyleSheet("font-family: 'Courier New'; font-size: 9pt;")
            layout.addWidget(label)
        
        group.setLayout(layout)
        self.add_group(col, group)

    def add_eigenvalues_table(self, col):
        group = QGroupBox("Eigenvalues")
        layout = QVBoxLayout()
        m = self.current_matrix
        
        if m.shape[0] == m.shape[1]:
            evals = np.linalg.eigvals(m)
            idx = np.argsort(np.abs(evals))[::-1]
            evals = evals[idx]
            
            table = QTableWidget()
            table.setColumnCount(3)
            table.setHorizontalHeaderLabels(["#", "Value", "|λ|"])
            table.setRowCount(len(evals))
            table.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
            table.setVerticalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
            
            for i, e in enumerate(evals):
                table.setItem(i, 0, QTableWidgetItem(f"λ{i+1}"))
                if abs(e.imag) < 1e-10:
                    table.setItem(i, 1, QTableWidgetItem(f"{e.real:.5g}"))
                else:
                    table.setItem(i, 1, QTableWidgetItem(f"{e.real:.3g}{e.imag:+.3g}j"))
                table.setItem(i, 2, QTableWidgetItem(f"{abs(e):.5g}"))
            
            self._fit_table(table, len(evals))
            layout.addWidget(table)
        
        group.setLayout(layout)
        self.add_group(col, group)

    def add_eigenvectors_table(self, col):
        group = QGroupBox("Eigenvectors")
        layout = QVBoxLayout()
        m = self.current_matrix
        
        if m.shape[0] == m.shape[1]:
            _, evecs = np.linalg.eig(m)
            n = m.shape[0]
            
            table = QTableWidget()
            table.setColumnCount(n + 1)
            table.setHorizontalHeaderLabels([""] + [f"v{i+1}" for i in range(n)])
            table.setRowCount(n)
            table.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
            table.setVerticalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
            
            for i in range(n):
                table.setItem(i, 0, QTableWidgetItem(f"[{i+1}]"))
                for j in range(n):
                    v = evecs[i, j]
                    text = f"{v.real:.2g}" if abs(v.imag) < 1e-10 else f"{v.real:.2g}{v.imag:+.2g}j"
                    table.setItem(i, j+1, QTableWidgetItem(text))
            
            self._fit_table(table, n)
            layout.addWidget(table)
        
        group.setLayout(layout)
        self.add_group(col, group)

    def add_gershgorin_discs(self, col):
        group = QGroupBox("Gershgorin Discs")
        layout = QVBoxLayout()
        m = self.current_matrix
        
        if m.shape[0] == m.shape[1]:
            n = m.shape[0]
            table = QTableWidget()
            table.setColumnCount(3)
            table.setHorizontalHeaderLabels(["#", "Center", "Radius"])
            table.setRowCount(n)
            table.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
            table.setVerticalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
            
            for i in range(n):
                center = m[i, i]
                radius = np.sum(np.abs(m[i, :])) - abs(center)
                table.setItem(i, 0, QTableWidgetItem(f"D{i+1}"))
                table.setItem(i, 1, QTableWidgetItem(Formatters.format_number(center)))
                table.setItem(i, 2, QTableWidgetItem(f"{radius:.4g}"))
            
            self._fit_table(table, n)
            layout.addWidget(table)
        
        group.setLayout(layout)
        self.add_group(col, group)

    # ===================== COLUMN 2 =====================
    
    def add_svd_table(self, col):
        group = QGroupBox("Singular Values")
        layout = QVBoxLayout()
        m = self.current_matrix
        
        _, s, _ = np.linalg.svd(m)
        total_energy = np.sum(s**2)
        
        table = QTableWidget()
        table.setColumnCount(3)
        table.setHorizontalHeaderLabels(["#", "σ", "Energy%"])
        table.setRowCount(len(s))
        table.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        table.setVerticalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        
        for i, sv in enumerate(s):
            table.setItem(i, 0, QTableWidgetItem(f"σ{i+1}"))
            table.setItem(i, 1, QTableWidgetItem(f"{sv:.5g}"))
            energy = (sv**2 / total_energy * 100) if total_energy > 0 else 0
            table.setItem(i, 2, QTableWidgetItem(f"{energy:.1f}%"))
        
        self._fit_table(table, len(s))
        layout.addWidget(table)
        
        group.setLayout(layout)
        self.add_group(col, group)

    def add_norms(self, col):
        group = QGroupBox("Norms")
        grid = QGridLayout()
        m = self.current_matrix
        row = 0
        
        self._add(grid, row, "Frobenius", f"{np.linalg.norm(m, 'fro'):.5g}"); row += 1
        self._add(grid, row, "Spectral", f"{np.linalg.norm(m, 2):.5g}"); row += 1
        self._add(grid, row, "Nuclear", f"{np.sum(np.linalg.svd(m, compute_uv=False)):.5g}"); row += 1
        self._add(grid, row, "L1", f"{np.linalg.norm(m, 1):.5g}"); row += 1
        self._add(grid, row, "L-inf", f"{np.linalg.norm(m, np.inf):.5g}"); row += 1
        
        group.setLayout(grid)
        self.add_group(col, group)

    def add_conditioning(self, col):
        group = QGroupBox("Conditioning")
        grid = QGridLayout()
        m = self.current_matrix
        row = 0
        
        if m.shape[0] == m.shape[1]:
            try:
                cond = np.linalg.cond(m)
                self._add(grid, row, "κ(A)", f"{cond:.4g}"); row += 1
                self._add(grid, row, "log₁₀(κ)", f"{np.log10(cond):.2f}"); row += 1
                
                s = np.linalg.svd(m, compute_uv=False)
                self._add(grid, row, "σ_min", f"{s[-1]:.5g}"); row += 1
                
                if cond < 10: status = "Excellent"
                elif cond < 1e4: status = "Good"
                elif cond < 1e8: status = "Moderate"
                else: status = "Poor"
                self._add(grid, row, "Status", status); row += 1
            except:
                self._add(grid, row, "Status", "Singular")
        
        group.setLayout(grid)
        self.add_group(col, group)

    def add_numerical_rank(self, col):
        group = QGroupBox("Numerical Rank")
        grid = QGridLayout()
        m = self.current_matrix
        row = 0
        
        s = np.linalg.svd(m, compute_uv=False)
        for tol in [1e-6, 1e-10, 1e-14]:
            rank = np.sum(s > tol * s[0]) if len(s) > 0 else 0
            self._add(grid, row, f"tol={tol:.0e}", rank); row += 1
        
        group.setLayout(grid)
        self.add_group(col, group)

    # ===================== COLUMN 3 =====================
    
    def add_spectral_analysis(self, col):
        group = QGroupBox("Spectral Analysis")
        grid = QGridLayout()
        m = self.current_matrix
        row = 0
        
        if m.shape[0] == m.shape[1]:
            evals = np.linalg.eigvals(m)
            mags = np.abs(evals)
            
            self._add(grid, row, "ρ(A)", f"{np.max(mags):.5g}"); row += 1
            
            if len(evals) > 1:
                gap = np.max(mags) - np.sort(mags)[-2]
                self._add(grid, row, "Spectral Gap", f"{gap:.5g}"); row += 1
            
            # Spectral condition
            nonzero = mags[mags > 1e-10]
            if len(nonzero) > 0:
                spec_cond = np.max(nonzero) / np.min(nonzero)
                self._add(grid, row, "κ_spec", f"{spec_cond:.4g}"); row += 1
            
            # Eigenvalue spread
            self._add(grid, row, "Spread", f"{np.max(mags) - np.min(mags):.5g}"); row += 1
        
        group.setLayout(grid)
        self.add_group(col, group)

    def add_numerical_stability(self, col):
        group = QGroupBox("Numerical Stability")
        grid = QGridLayout()
        m = self.current_matrix
        row = 0
        
        if m.shape[0] == m.shape[1]:
            # LU growth factor estimate
            try:
                _, L, U = linalg.lu(m)
                growth = np.max(np.abs(U)) / np.max(np.abs(m)) if np.max(np.abs(m)) > 0 else 0
                self._add(grid, row, "LU Growth", f"{growth:.4g}"); row += 1
            except: pass
            
            # QR orthogonality check
            try:
                Q, _ = linalg.qr(m)
                orth_error = np.linalg.norm(Q.conj().T @ Q - np.eye(Q.shape[1]), 'fro')
                self._add(grid, row, "QR Error", f"{orth_error:.2e}"); row += 1
            except: pass
        
        group.setLayout(grid)
        self.add_group(col, group)

    def add_geometry(self, col):
        group = QGroupBox("Geometry")
        grid = QGridLayout()
        m = self.current_matrix
        row = 0
        
        if m.shape[0] == m.shape[1]:
            # Volume scaling
            det = np.linalg.det(m)
            self._add(grid, row, "Volume Scale", f"{abs(det):.5g}"); row += 1
            
            # Singular value spread (distortion)
            s = np.linalg.svd(m, compute_uv=False)
            if len(s) > 0 and s[-1] > 1e-10:
                distortion = s[0] / s[-1]
                self._add(grid, row, "Distortion", f"{distortion:.4g}"); row += 1
            
            # Check if conformal (angle preserving) - orthogonal scaled
            scale = np.linalg.norm(m, 'fro') / np.sqrt(m.shape[0])
            if scale > 1e-10:
                normed = m / scale
                is_orth = np.allclose(normed.T @ normed, np.eye(m.shape[0]), atol=0.1)
                self._add(grid, row, "Conformal", "~Yes" if is_orth else "No"); row += 1
        
        group.setLayout(grid)
        self.add_group(col, group)

    # ===================== COLUMN 4 =====================
    
    def add_control_theory(self, col):
        group = QGroupBox("Control/Stability")
        grid = QGridLayout()
        m = self.current_matrix
        row = 0
        
        if m.shape[0] == m.shape[1]:
            evals = np.linalg.eigvals(m)
            
            max_real = np.max(evals.real)
            self._add(grid, row, "Hurwitz", "Yes" if max_real < -1e-10 else "No"); row += 1
            
            max_mod = np.max(np.abs(evals))
            self._add(grid, row, "Schur", "Yes" if max_mod < 1 - 1e-10 else "No"); row += 1
            
            self._add(grid, row, "Max Re(λ)", f"{max_real:.5g}"); row += 1
            self._add(grid, row, "Max |λ|", f"{max_mod:.5g}"); row += 1
        
        group.setLayout(grid)
        self.add_group(col, group)

    def add_graph_theory(self, col):
        group = QGroupBox("Graph Theory")
        grid = QGridLayout()
        m = self.current_matrix
        row = 0
        
        if m.shape[0] == m.shape[1]:
            # Check stochastic
            row_sums = np.sum(m, axis=1)
            is_stochastic = np.allclose(row_sums, 1) and np.all(m >= 0)
            self._add(grid, row, "Stochastic", "Yes" if is_stochastic else "No"); row += 1
            
            if is_stochastic:
                # Stationary distribution (left eigenvector for λ=1)
                evals, evecs = np.linalg.eig(m.T)
                idx = np.argmin(np.abs(evals - 1))
                stationary = np.abs(evecs[:, idx])
                stationary = stationary / np.sum(stationary)
                self._add(grid, row, "Stationary", "Computed"); row += 1
            
            # Check Laplacian
            if np.allclose(row_sums, 0):
                self._add(grid, row, "Laplacian", "Yes"); row += 1
        
        group.setLayout(grid)
        self.add_group(col, group)

    def add_information_theory(self, col):
        group = QGroupBox("Information Theory")
        grid = QGridLayout()
        m = self.current_matrix
        row = 0
        
        s = np.linalg.svd(m, compute_uv=False)
        s_norm = s / np.sum(s) if np.sum(s) > 0 else s
        s_pos = s_norm[s_norm > 1e-12]
        
        # Entropy of singular value distribution
        if len(s_pos) > 0:
            entropy = -np.sum(s_pos * np.log2(s_pos))
            self._add(grid, row, "SV Entropy", f"{entropy:.4g} bits"); row += 1
        
        # Effective dimension
        if len(s) > 0 and np.sum(s**2) > 0:
            p = s**2 / np.sum(s**2)
            eff_dim = np.exp(-np.sum(p[p > 1e-12] * np.log(p[p > 1e-12])))
            self._add(grid, row, "Eff. Dim", f"{eff_dim:.2f}"); row += 1
        
        # Coherence (max off-diagonal in col-normalized)
        norms = np.linalg.norm(m, axis=0)
        norms[norms < 1e-10] = 1
        normed = m / norms
        gram = np.abs(normed.conj().T @ normed)
        np.fill_diagonal(gram, 0)
        coherence = np.max(gram)
        self._add(grid, row, "Coherence", f"{coherence:.4g}"); row += 1
        
        group.setLayout(grid)
        self.add_group(col, group)

    def add_special_properties(self, col):
        group = QGroupBox("Special")
        grid = QGridLayout()
        m = self.current_matrix
        row = 0
        
        if m.shape[0] == m.shape[1]:
            r = m.shape[0]
            
            self._add(grid, row, "Non-negative", "Yes" if np.all(m >= 0) else "No"); row += 1
            self._add(grid, row, "Nilpotent", "Yes" if np.allclose(np.linalg.matrix_power(m, r), 0) else "No"); row += 1
            self._add(grid, row, "Idempotent", "Yes" if np.allclose(m @ m, m) else "No"); row += 1
            self._add(grid, row, "Involutory", "Yes" if np.allclose(m @ m, np.eye(r)) else "No"); row += 1
        
        group.setLayout(grid)
        self.add_group(col, group)

    # ===================== HELPERS =====================
    
    def _add(self, grid, row, name, value):
        name_lbl = QLabel(f"{name}:")
        name_lbl.setStyleSheet("font-weight: bold; font-size: 8pt;")
        val_lbl = QLabel(str(value))
        val_lbl.setStyleSheet("font-family: 'Courier New'; color: #2196f3; font-size: 8pt;")
        grid.addWidget(name_lbl, row, 0)
        grid.addWidget(val_lbl, row, 1)

    def _fit_table(self, table, nrows):
        table.resizeColumnsToContents()
        table.resizeRowsToContents()
        height = table.horizontalHeader().height() + sum([table.rowHeight(i) for i in range(nrows)]) + 5
        table.setFixedHeight(height)
