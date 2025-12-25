"""
Matrix Editor Component
Displays and edits the current matrix in the main workspace.
"""

from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QTableWidget,
                               QTableWidgetItem, QPushButton, QLabel, QLineEdit,
                               QInputDialog, QMessageBox)
from PySide6.QtCore import Signal, Qt
from PySide6.QtGui import QFont
import numpy as np

from src.utils.formatters import Formatters


class MatrixEditorWidget(QWidget):
    """Widget for displaying and editing matrices."""
    
    matrix_changed = Signal(np.ndarray)  # Emitted when matrix is modified
    save_requested = Signal(str, np.ndarray)  # Emitted when save is requested
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.current_matrix = None
        self.current_name = None
        self.setup_ui()
    
    def setup_ui(self):
        """Initialize the UI components."""
        layout = QVBoxLayout(self)
        
        # Header with current matrix name
        header_layout = QHBoxLayout()
        
        name_label = QLabel("Current Matrix:")
        name_label.setStyleSheet("font-weight: bold;")
        header_layout.addWidget(name_label)
        
        self.matrix_name_label = QLabel("None")
        self.matrix_name_label.setStyleSheet("font-size: 12pt; color: #2196f3;")
        header_layout.addWidget(self.matrix_name_label)
        
        header_layout.addStretch()
        
        self.dim_label = QLabel("")
        self.dim_label.setStyleSheet("color: #666; font-style: italic;")
        header_layout.addWidget(self.dim_label)
        
        layout.addLayout(header_layout)
        
        # Matrix display table
        self.table = QTableWidget()
        self.table.setEditTriggers(QTableWidget.NoEditTriggers)  # Read-only
        font = QFont("Courier New", 10)
        self.table.setFont(font)
        layout.addWidget(self.table)
        
        # Action buttons
        btn_layout = QHBoxLayout()
        
        clear_btn = QPushButton("Clear")
        clear_btn.clicked.connect(self.clear_matrix)
        btn_layout.addWidget(clear_btn)
        
        btn_layout.addStretch()
        
        self.save_btn = QPushButton("Save Matrix")
        self.save_btn.setStyleSheet("font-weight: bold;")
        self.save_btn.clicked.connect(self.request_save)
        self.save_btn.setEnabled(False)
        btn_layout.addWidget(self.save_btn)
        
        layout.addLayout(btn_layout)
    
    def set_matrix(self, matrix: np.ndarray, name: str = None):
        """
        Display a matrix.
        
        Args:
            matrix: NumPy array to display
            name: Optional name of the matrix
        """
        self.current_matrix = matrix
        self.current_name = name
        
        # Update name label
        if name:
            self.matrix_name_label.setText(name)
        else:
            self.matrix_name_label.setText("Unnamed")
        
        # Update dimension label
        self.dim_label.setText(Formatters.format_matrix_shape(matrix))
        
        # Populate table
        rows, cols = matrix.shape
        self.table.setRowCount(rows)
        self.table.setColumnCount(cols)
        
        for i in range(rows):
            for j in range(cols):
                value = matrix[i, j]
                formatted = Formatters.format_number(value, precision=6)
                item = QTableWidgetItem(formatted)
                item.setTextAlignment(Qt.AlignCenter)
                self.table.setItem(i, j, item)
        
        # Set headers
        self.table.setHorizontalHeaderLabels([str(i) for i in range(cols)])
        self.table.setVerticalHeaderLabels([str(i) for i in range(rows)])
        
        # Resize columns to content
        self.table.resizeColumnsToContents()
        
        # Enable save button
        self.save_btn.setEnabled(True)
        
        # Emit signal
        self.matrix_changed.emit(matrix)
    
    def get_matrix(self) -> np.ndarray:
        """Get current matrix."""
        return self.current_matrix
    
    def get_name(self) -> str:
        """Get current matrix name."""
        return self.current_name
    
    def clear_matrix(self):
        """Clear the current matrix."""
        reply = QMessageBox.question(
            self,
            "Confirm Clear",
            "Clear current matrix?",
            QMessageBox.Yes | QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            self.current_matrix = None
            self.current_name = None
            self.matrix_name_label.setText("None")
            self.dim_label.setText("")
            self.table.setRowCount(0)
            self.table.setColumnCount(0)
            self.save_btn.setEnabled(False)
    
    def request_save(self):
        """Request to save current matrix."""
        if self.current_matrix is None:
            return
        
        # Ask for name
        default_name = self.current_name if self.current_name else ""
        
        name, ok = QInputDialog.getText(
            self,
            "Save Matrix",
            "Enter matrix name:",
            text=default_name
        )
        
        if ok and name:
            self.save_requested.emit(name, self.current_matrix)
            self.current_name = name
            self.matrix_name_label.setText(name)
