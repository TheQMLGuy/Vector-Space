"""
ULTIMATE Decompositions Tab
All major matrix decompositions with full matrices.
"""

from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                               QTableWidget, QTableWidgetItem, QScrollArea,
                               QGroupBox, QGridLayout, QPushButton, QApplication)
from PySide6.QtCore import Qt
import numpy as np
from scipy import linalg

from src.utils.formatters import Formatters


class DecompositionsTab(QWidget):
    """All decompositions with PAGE scroll."""
    
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
        label = QLabel("Load a matrix to see decompositions")
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
        
        row = 0
        col = 0
        max_cols = 2
        
        def add(widget):
            nonlocal row, col
            self.main_layout.addWidget(widget, row, col)
            col += 1
            if col >= max_cols:
                col = 0
                row += 1
        
        # Standard decompositions
        add(self.create_lu())
        add(self.create_qr())
        add(self.create_svd())
        add(self.create_eigen())
        add(self.create_cholesky())
        add(self.create_schur())
        
        # Additional decompositions
        add(self.create_hessenberg())
        add(self.create_polar())
        add(self.create_ldl())
    
    def create_lu(self):
        group = QGroupBox("LU Decomposition: PA = LU")
        layout = QHBoxLayout()
        try:
            P, L, U = linalg.lu(self.current_matrix)
            layout.addWidget(self._mat("P", P))
            layout.addWidget(QLabel("·"))
            layout.addWidget(self._mat("A", self.current_matrix))
            layout.addWidget(QLabel("="))
            layout.addWidget(self._mat("L", L))
            layout.addWidget(QLabel("·"))
            layout.addWidget(self._mat("U", U))
        except:
            layout.addWidget(QLabel("Failed"))
        group.setLayout(layout)
        return group
    
    def create_qr(self):
        group = QGroupBox("QR Decomposition: A = QR")
        layout = QHBoxLayout()
        try:
            Q, R = linalg.qr(self.current_matrix)
            layout.addWidget(self._mat("Q", Q))
            layout.addWidget(QLabel("·"))
            layout.addWidget(self._mat("R", R))
        except:
            layout.addWidget(QLabel("Failed"))
        group.setLayout(layout)
        return group
    
    def create_svd(self):
        group = QGroupBox("SVD: A = UΣV^H")
        layout = QHBoxLayout()
        try:
            U, s, Vh = linalg.svd(self.current_matrix)
            Sigma = np.zeros_like(self.current_matrix, dtype=float)
            np.fill_diagonal(Sigma, s)
            layout.addWidget(self._mat("U", U))
            layout.addWidget(QLabel("·"))
            layout.addWidget(self._mat("Σ", Sigma))
            layout.addWidget(QLabel("·"))
            layout.addWidget(self._mat("V^H", Vh))
        except:
            layout.addWidget(QLabel("Failed"))
        group.setLayout(layout)
        return group
    
    def create_eigen(self):
        group = QGroupBox("Eigendecomposition: A = VΛV^(-1)")
        layout = QHBoxLayout()
        m = self.current_matrix
        if m.shape[0] != m.shape[1]:
            layout.addWidget(QLabel("Not square"))
        else:
            try:
                evals, V = linalg.eig(m)
                Lambda = np.diag(evals)
                V_inv = linalg.inv(V)
                layout.addWidget(self._mat("V", V))
                layout.addWidget(QLabel("·"))
                layout.addWidget(self._mat("Λ", Lambda))
                layout.addWidget(QLabel("·"))
                layout.addWidget(self._mat("V^(-1)", V_inv))
            except:
                layout.addWidget(QLabel("Not diagonalizable"))
        group.setLayout(layout)
        return group
    
    def create_cholesky(self):
        group = QGroupBox("Cholesky: A = LL^T")
        layout = QHBoxLayout()
        m = self.current_matrix
        if m.shape[0] != m.shape[1]:
            layout.addWidget(QLabel("Not square"))
        elif not np.allclose(m, m.T):
            layout.addWidget(QLabel("Not symmetric"))
        else:
            try:
                L = linalg.cholesky(m, lower=True)
                layout.addWidget(self._mat("L", L))
                layout.addWidget(QLabel("·"))
                layout.addWidget(self._mat("L^T", L.T))
            except:
                layout.addWidget(QLabel("Not positive definite"))
        group.setLayout(layout)
        return group
    
    def create_schur(self):
        group = QGroupBox("Schur: A = QTQ^H")
        layout = QHBoxLayout()
        m = self.current_matrix
        if m.shape[0] != m.shape[1]:
            layout.addWidget(QLabel("Not square"))
        else:
            try:
                T, Q = linalg.schur(m)
                layout.addWidget(self._mat("Q", Q))
                layout.addWidget(QLabel("·"))
                layout.addWidget(self._mat("T", T))
                layout.addWidget(QLabel("·"))
                layout.addWidget(self._mat("Q^H", Q.conj().T))
            except:
                layout.addWidget(QLabel("Failed"))
        group.setLayout(layout)
        return group
    
    def create_hessenberg(self):
        group = QGroupBox("Hessenberg: A = QHQ^H")
        layout = QHBoxLayout()
        m = self.current_matrix
        if m.shape[0] != m.shape[1]:
            layout.addWidget(QLabel("Not square"))
        else:
            try:
                H, Q = linalg.hessenberg(m, calc_q=True)
                layout.addWidget(self._mat("Q", Q))
                layout.addWidget(QLabel("·"))
                layout.addWidget(self._mat("H", H))
                layout.addWidget(QLabel("·"))
                layout.addWidget(self._mat("Q^H", Q.conj().T))
            except:
                layout.addWidget(QLabel("Failed"))
        group.setLayout(layout)
        return group
    
    def create_polar(self):
        group = QGroupBox("Polar: A = UP")
        layout = QHBoxLayout()
        m = self.current_matrix
        if m.shape[0] != m.shape[1]:
            layout.addWidget(QLabel("Not square"))
        else:
            try:
                U, P = linalg.polar(m)
                layout.addWidget(self._mat("U (unitary)", U))
                layout.addWidget(QLabel("·"))
                layout.addWidget(self._mat("P (pos semi-def)", P))
            except:
                layout.addWidget(QLabel("Failed"))
        group.setLayout(layout)
        return group
    
    def create_ldl(self):
        group = QGroupBox("LDL^T: A = LDL^T")
        layout = QHBoxLayout()
        m = self.current_matrix
        if m.shape[0] != m.shape[1]:
            layout.addWidget(QLabel("Not square"))
        elif not np.allclose(m, m.T):
            layout.addWidget(QLabel("Not symmetric"))
        else:
            try:
                lu, d, perm = linalg.ldl(m)
                layout.addWidget(self._mat("L", lu))
                layout.addWidget(QLabel("·"))
                layout.addWidget(self._mat("D", d))
                layout.addWidget(QLabel("·"))
                layout.addWidget(self._mat("L^T", lu.T))
            except:
                layout.addWidget(QLabel("Failed"))
        group.setLayout(layout)
        return group
    
    def _mat(self, title: str, matrix: np.ndarray):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(2, 2, 2, 2)
        layout.setSpacing(2)
        
        title_label = QLabel(title)
        title_label.setStyleSheet("font-weight: bold; font-size: 9pt;")
        title_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(title_label)
        
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
        
        return widget
