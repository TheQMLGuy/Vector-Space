"""
Random Matrix Generator Widget
Generates random matrices with customizable parameters.
"""

from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QSpinBox,
                               QLabel, QPushButton, QComboBox, QDoubleSpinBox,
                               QCheckBox, QGroupBox, QFormLayout)
from PySide6.QtCore import Signal
import numpy as np


class RandomGeneratorWidget(QWidget):
    """Widget for generating random matrices."""
    
    matrix_ready = Signal(np.ndarray)
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_ui()
    
    def setup_ui(self):
        """Initialize the UI components."""
        layout = QVBoxLayout(self)
        
        # Dimension controls
        dim_group = QGroupBox("Dimensions")
        dim_layout = QFormLayout()
        
        self.rows_spin = QSpinBox()
        self.rows_spin.setRange(2, 50)
        self.rows_spin.setValue(4)
        dim_layout.addRow("Rows:", self.rows_spin)
        
        self.cols_spin = QSpinBox()
        self.cols_spin.setRange(2, 50)
        self.cols_spin.setValue(4)
        dim_layout.addRow("Columns:", self.cols_spin)
        
        dim_group.setLayout(dim_layout)
        layout.addWidget(dim_group)
        
        # Distribution controls
        dist_group = QGroupBox("Distribution")
        dist_layout = QFormLayout()
        
        self.dist_combo = QComboBox()
        self.dist_combo.addItems([
            "Uniform (0 to 1)",
            "Uniform (Custom Range)",
            "Normal (μ=0, σ=1)",
            "Integer (Custom Range)"
        ])
        self.dist_combo.currentIndexChanged.connect(self.update_range_controls)
        dist_layout.addRow("Type:", self.dist_combo)
        
        # Range controls
        self.min_spin = QDoubleSpinBox()
        self.min_spin.setRange(-1000, 1000)
        self.min_spin.setValue(-10)
        dist_layout.addRow("Min Value:", self.min_spin)
        
        self.max_spin = QDoubleSpinBox()
        self.max_spin.setRange(-1000, 1000)
        self.max_spin.setValue(10)
        dist_layout.addRow("Max Value:", self.max_spin)
        
        dist_group.setLayout(dist_layout)
        layout.addWidget(dist_group)
        
        # Special options
        special_group = QGroupBox("Special Options")
        special_layout = QVBoxLayout()
        
        self.symmetric_check = QCheckBox("Make Symmetric")
        self.symmetric_check.toggled.connect(self.on_symmetric_toggled)
        special_layout.addWidget(self.symmetric_check)
        
        self.diagonal_check = QCheckBox("Diagonal Only")
        special_layout.addWidget(self.diagonal_check)
        
        # Seed option
        seed_layout = QHBoxLayout()
        self.seed_check = QCheckBox("Use Seed:")
        seed_layout.addWidget(self.seed_check)
        
        self.seed_spin = QSpinBox()
        self.seed_spin.setRange(0, 999999)
        self.seed_spin.setValue(42)
        self.seed_spin.setEnabled(False)
        self.seed_check.toggled.connect(self.seed_spin.setEnabled)
        seed_layout.addWidget(self.seed_spin)
        seed_layout.addStretch()
        
        special_layout.addLayout(seed_layout)
        special_group.setLayout(special_layout)
        layout.addWidget(special_group)
        
        # Generate button
        btn_layout = QHBoxLayout()
        btn_layout.addStretch()
        
        generate_btn = QPushButton("Generate Matrix")
        generate_btn.setStyleSheet("font-weight: bold; padding: 8px 20px;")
        generate_btn.clicked.connect(self.generate_matrix)
        btn_layout.addWidget(generate_btn)
        
        layout.addLayout(btn_layout)
        layout.addStretch()
        
        # Initialize controls
        self.update_range_controls()
    
    def update_range_controls(self):
        """Enable/disable range controls based on distribution."""
        dist = self.dist_combo.currentText()
        
        if "Custom Range" in dist:
            self.min_spin.setEnabled(True)
            self.max_spin.setEnabled(True)
        else:
            self.min_spin.setEnabled(False)
            self.max_spin.setEnabled(False)
    
    def on_symmetric_toggled(self, checked: bool):
        """When symmetric is checked, force square matrix."""
        if checked:
            self.cols_spin.setValue(self.rows_spin.value())
            self.cols_spin.setEnabled(False)
        else:
            self.cols_spin.setEnabled(True)
    
    def generate_matrix(self):
        """Generate random matrix based on settings."""
        rows = self.rows_spin.value()
        cols = self.cols_spin.value()
        
        # Set seed if enabled
        if self.seed_check.isChecked():
            np.random.seed(self.seed_spin.value())
        
        # Generate based on distribution
        dist = self.dist_combo.currentText()
        
        if dist == "Uniform (0 to 1)":
            matrix = np.random.rand(rows, cols)
        
        elif dist == "Uniform (Custom Range)":
            min_val = self.min_spin.value()
            max_val = self.max_spin.value()
            matrix = np.random.uniform(min_val, max_val, (rows, cols))
        
        elif dist == "Normal (μ=0, σ=1)":
            matrix = np.random.randn(rows, cols)
        
        elif dist == "Integer (Custom Range)":
            min_val = int(self.min_spin.value())
            max_val = int(self.max_spin.value())
            matrix = np.random.randint(min_val, max_val + 1, (rows, cols)).astype(float)
        
        else:
            matrix = np.random.rand(rows, cols)
        
        # Apply special options
        if self.diagonal_check.isChecked() and rows == cols:
            matrix = np.diag(np.diagonal(matrix))
        
        if self.symmetric_check.isChecked() and rows == cols:
            matrix = (matrix + matrix.T) / 2
        
        self.matrix_ready.emit(matrix)
