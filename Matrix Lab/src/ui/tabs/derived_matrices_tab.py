"""
ULTIMATE Derived Matrices Tab
All possible derived matrices: powers, roots, inverses, transforms, decomposition components.
"""

from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                               QTableWidget, QTableWidgetItem, QScrollArea,
                               QGroupBox, QGridLayout, QPushButton, QApplication)
from PySide6.QtCore import Qt
import numpy as np
from scipy import linalg

from src.utils.formatters import Formatters


class DerivedMatricesTab(QWidget):
    """Ultimate derived matrices tab."""
    
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
            QScrollBar:vertical { width: 12px; background: #f0f0f0; border-radius: 6px; }
            QScrollBar::handle:vertical { background: #2196f3; border-radius: 6px; min-height: 30px; }
        """)
        
        container = QWidget()
        self.main_layout = QGridLayout(container)
        self.main_layout.setSpacing(12)
        
        scroll.setWidget(container)
        main_layout.addWidget(scroll)
        
        self.show_empty_state()
    
    def show_empty_state(self):
        self._clear()
        label = QLabel("Load a matrix to see derived matrices")
        label.setStyleSheet("color: #999; font-size: 12pt;")
        label.setAlignment(Qt.AlignCenter)
        self.main_layout.addWidget(label, 0, 0)
    
    def _clear(self):
        while self.main_layout.count():
            item = self.main_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
    
    def set_matrix(self, matrix: np.ndarray):
        self.current_matrix = matrix
        self._clear()
        
        row_idx = 0
        col_idx = 0
        max_cols = 4
        
        def add(title, mat):
            nonlocal row_idx, col_idx
            self._add_matrix(title, mat, row_idx, col_idx)
            col_idx += 1
            if col_idx >= max_cols:
                col_idx = 0
                row_idx += 1
        
        m = matrix
        r, c = m.shape
        sq = (r == c)
        
        # ============ POWERS ============
        if sq:
            add("A^2", m @ m)
            add("A^3", m @ m @ m)
            add("A^4", np.linalg.matrix_power(m, 4))
            add("A^5", np.linalg.matrix_power(m, 5))
        
        # ============ TRANSPOSES & BASICS ============
        add("A^T", m.T)
        add("A^H (Conj Trans)", m.conj().T)
        add("|A| (Absolute)", np.abs(m))
        add("Re(A)", m.real)
        add("Im(A)", m.imag)
        
        # ============ SYMMETRIC/SKEW ============
        if sq:
            add("Sym(A)", 0.5 * (m + m.T))
            add("Skew(A)", 0.5 * (m - m.T))
        
        # ============ INVERSES ============
        if sq:
            try:
                add("A^(-1)", np.linalg.inv(m))
            except: pass
        
        # Moore-Penrose Pseudoinverse
        try:
            add("A^+ (Pseudoinverse)", np.linalg.pinv(m))
        except: pass
        
        # ============ GRAM MATRICES ============
        add("A^H A (Gram)", m.conj().T @ m)
        add("A A^H", m @ m.conj().T)
        
        # ============ POLAR DECOMPOSITION ============
        if sq:
            try:
                U, P = linalg.polar(m)
                add("U (Polar Unitary)", U)
                add("P (Polar Positive)", P)
            except: pass
        
        # ============ CAYLEY TRANSFORM ============
        if sq:
            try:
                I = np.eye(r)
                cayley = (I - m) @ np.linalg.inv(I + m)
                add("Cayley (I-A)(I+A)^-1", cayley)
            except: pass
        
        # ============ COFACTOR & ADJUGATE ============
        if sq and r <= 8:
            try:
                cofactor = np.zeros_like(m, dtype=complex)
                for i in range(r):
                    for j in range(c):
                        minor = np.delete(np.delete(m, i, 0), j, 1)
                        cofactor[i, j] = ((-1) ** (i + j)) * np.linalg.det(minor)
                add("Cofactor", cofactor)
                add("Adjugate (Cof^T)", cofactor.T)
            except: pass
        
        # ============ COMMUTATORS ============
        if sq:
            add("[A, A^T]", m @ m.T - m.T @ m)
            add("{A, A^T}", m @ m.T + m.T @ m)
        
        # ============ NEAREST MATRICES ============
        if sq:
            # Nearest symmetric (already have)
            # Nearest positive definite
            try:
                evals, evecs = np.linalg.eigh(0.5 * (m + m.conj().T))
                evals_pos = np.maximum(evals, 1e-10)
                nearest_pd = evecs @ np.diag(evals_pos) @ evecs.conj().T
                add("Nearest Pos Def", nearest_pd)
            except: pass
        
        # Low-rank approximation (rank-1)
        try:
            U, s, Vh = np.linalg.svd(m)
            rank1 = s[0] * np.outer(U[:, 0], Vh[0, :].conj())
            add("Rank-1 Approx", rank1)
            
            if len(s) >= 2:
                rank2 = s[0] * np.outer(U[:, 0], Vh[0, :].conj()) + s[1] * np.outer(U[:, 1], Vh[1, :].conj())
                add("Rank-2 Approx", rank2)
        except: pass
        
        # ============ RESOLVENT ============
        if sq:
            for z in [0.1, 1, 1j, -1]:
                try:
                    resolvent = np.linalg.inv(z * np.eye(r) - m)
                    z_str = f"{z}" if not isinstance(z, complex) else f"{z.real}{z.imag:+g}j"
                    add(f"(zI-A)^-1, z={z_str}", resolvent)
                except: pass
        
        # ============ MATRIX FUNCTIONS ============
        if sq and r <= 20:
            funcs = [
                ("exp(A)", linalg.expm),
                ("sin(A)", linalg.sinm),
                ("cos(A)", linalg.cosm),
                ("sqrt(A)", linalg.sqrtm),
                ("log(A)", linalg.logm),
                ("sinh(A)", linalg.sinhm),
                ("cosh(A)", linalg.coshm),
                ("tanh(A)", linalg.tanhm),
            ]
            for name, func in funcs:
                try:
                    add(name, func(m))
                except: pass
        
        # ============ SVD COMPONENTS ============
        try:
            U, s, Vh = np.linalg.svd(m)
            Sigma = np.zeros_like(m, dtype=float)
            np.fill_diagonal(Sigma, s)
            add("U (left singular)", U)
            add("Sigma", Sigma)
            add("V^H (right singular)", Vh)
        except: pass
        
        # ============ EIGEN COMPONENTS ============
        if sq:
            try:
                evals, evecs = np.linalg.eig(m)
                add("V (eigenvectors)", evecs)
                add("Lambda (diag)", np.diag(evals))
            except: pass

    def _add_matrix(self, title: str, matrix: np.ndarray, row: int, col: int):
        group = QGroupBox(title)
        layout = QVBoxLayout()
        layout.setSpacing(3)
        layout.setContentsMargins(5, 5, 5, 5)
        
        table = QTableWidget()
        rows, cols = matrix.shape
        table.setRowCount(rows)
        table.setColumnCount(cols)
        table.horizontalHeader().setVisible(False)
        table.verticalHeader().setVisible(False)
        table.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        table.setVerticalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        
        for i in range(rows):
            for j in range(cols):
                val = matrix[i, j]
                if np.iscomplexobj(val) and abs(val.imag) > 1e-10:
                    text = f"{val.real:.2g}{val.imag:+.2g}j"
                else:
                    text = f"{val.real:.3g}" if hasattr(val, 'real') else f"{val:.3g}"
                item = QTableWidgetItem(text)
                item.setTextAlignment(Qt.AlignCenter)
                table.setItem(i, j, item)
        
        table.resizeColumnsToContents()
        table.resizeRowsToContents()
        
        w = sum([table.columnWidth(i) for i in range(cols)]) + 10
        h = sum([table.rowHeight(i) for i in range(rows)]) + 5
        table.setFixedSize(w, h)
        
        layout.addWidget(table)
        
        copy_btn = QPushButton("Copy")
        copy_btn.setMaximumWidth(50)
        copy_btn.setStyleSheet("font-size: 8pt;")
        copy_btn.clicked.connect(lambda: QApplication.clipboard().setText(Formatters.matrix_to_string(matrix)))
        layout.addWidget(copy_btn, alignment=Qt.AlignCenter)
        
        group.setLayout(layout)
        self.main_layout.addWidget(group, row, col)
