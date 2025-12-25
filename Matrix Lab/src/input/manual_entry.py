"""
Manual Entry Widget
Provides table-based matrix input with adjustable dimensions.
"""

from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QTableWidget,
                               QTableWidgetItem, QSpinBox, QLabel, QPushButton)
from PySide6.QtCore import Signal
from PySide6.QtGui import QColor
import numpy as np


class ManualEntryWidget(QWidget):
    """Widget for manual table entry of matrix values."""
    
    matrix_ready = Signal(np.ndarray)  # Emitted when matrix is valid
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_ui()
    
    def setup_ui(self):
        """Initialize the UI components."""
        layout = QVBoxLayout(self)
        
        # Dimension controls
        dim_layout = QHBoxLayout()
        dim_layout.addWidget(QLabel("Rows:"))
        self.rows_spin = QSpinBox()
        self.rows_spin.setRange(2, 10)
        self.rows_spin.setValue(3)
        self.rows_spin.valueChanged.connect(self.update_table_size)
        dim_layout.addWidget(self.rows_spin)
        
        dim_layout.addWidget(QLabel("Columns:"))
        self.cols_spin = QSpinBox()
        self.cols_spin.setRange(2, 10)
        self.cols_spin.setValue(3)
        self.cols_spin.valueChanged.connect(self.update_table_size)
        dim_layout.addWidget(self.cols_spin)
        
        dim_layout.addStretch()
        layout.addLayout(dim_layout)
        
        # Table widget
        self.table = QTableWidget(3, 3)
        self.table.setMaximumHeight(300)
        self.table.itemChanged.connect(self.validate_cell)
        layout.addWidget(self.table)
        
        # Buttons
        btn_layout = QHBoxLayout()
        
        clear_btn = QPushButton("Clear")
        clear_btn.clicked.connect(self.clear_table)
        btn_layout.addWidget(clear_btn)
        
        fill_zeros_btn = QPushButton("Fill Zeros")
        fill_zeros_btn.clicked.connect(self.fill_zeros)
        btn_layout.addWidget(fill_zeros_btn)
        
        fill_identity_btn = QPushButton("Fill Identity")
        fill_identity_btn.clicked.connect(self.fill_identity)
        btn_layout.addWidget(fill_identity_btn)
        
        btn_layout.addStretch()
        
        use_btn = QPushButton("Use Matrix")
        use_btn.setStyleSheet("font-weight: bold;")
        use_btn.clicked.connect(self.emit_matrix)
        btn_layout.addWidget(use_btn)
        
        layout.addLayout(btn_layout)
        
        # Initialize table
        self.update_table_size()
    
    def update_table_size(self):
        """Update table dimensions based on spinbox values."""
        rows = self.rows_spin.value()
        cols = self.cols_spin.value()
        
        self.table.setRowCount(rows)
        self.table.setColumnCount(cols)
        
        # Set headers
        self.table.setHorizontalHeaderLabels([str(i) for i in range(cols)])
        self.table.setVerticalHeaderLabels([str(i) for i in range(rows)])
        
        # Initialize empty cells
        for i in range(rows):
            for j in range(cols):
                if not self.table.item(i, j):
                    item = QTableWidgetItem("")
                    self.table.setItem(i, j, item)
    
    def validate_cell(self, item: QTableWidgetItem):
        """Validate cell input as numeric."""
        text = item.text()
        
        if text == "":
            item.setBackground(QColor(255, 255, 255))
            return
        
        try:
            float(text)
            item.setBackground(QColor(200, 255, 200))  # Light green
        except ValueError:
            item.setBackground(QColor(255, 200, 200))  # Light red
    
    def get_matrix(self) -> np.ndarray:
        """
        Extract matrix from table.
        
        Returns:
            NumPy array or None if invalid
        """
        rows = self.table.rowCount()
        cols = self.table.columnCount()
        
        matrix = np.zeros((rows, cols))
        
        for i in range(rows):
            for j in range(cols):
                item = self.table.item(i, j)
                if item is None or item.text() == "":
                    return None
                
                try:
                    matrix[i, j] = float(item.text())
                except ValueError:
                    return None
        
        return matrix
    
    def emit_matrix(self):
        """Emit matrix_ready signal if valid."""
        matrix = self.get_matrix()
        if matrix is not None:
            self.matrix_ready.emit(matrix)
    
    def clear_table(self):
        """Clear all table entries."""
        for i in range(self.table.rowCount()):
            for j in range(self.table.columnCount()):
                item = self.table.item(i, j)
                if item:
                    item.setText("")
                    item.setBackground(QColor(255, 255, 255))
    
    def fill_zeros(self):
        """Fill table with zeros."""
        for i in range(self.table.rowCount()):
            for j in range(self.table.columnCount()):
                item = self.table.item(i, j)
                if not item:
                    item = QTableWidgetItem("0")
                    self.table.setItem(i, j, item)
                else:
                    item.setText("0")
    
    def fill_identity(self):
        """Fill table with identity matrix (if square)."""
        rows = self.table.rowCount()
        cols = self.table.columnCount()
        
        for i in range(rows):
            for j in range(cols):
                value = "1" if i == j else "0"
                item = self.table.item(i, j)
                if not item:
                    item = QTableWidgetItem(value)
                    self.table.setItem(i, j, item)
                else:
                    item.setText(value)
