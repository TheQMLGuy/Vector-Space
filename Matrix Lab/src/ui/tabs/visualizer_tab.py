"""
ULTIMATE Transformation Visualizer Tab
Multiple visualization modes: Vector transformation, Eigenvalue plot, Heatmaps, Sparsity.
"""

from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QDoubleSpinBox,
                               QLabel, QPushButton, QComboBox, QCheckBox, QGroupBox,
                               QFormLayout, QTabWidget)
from PySide6.QtCore import Signal
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg
from matplotlib.figure import Figure
from matplotlib.patches import Circle
import matplotlib.cm as cm

from src.storage.matrix_storage import MatrixStorage


class VisualizerTab(QWidget):
    """Ultimate visualizer with multiple plot modes."""
    
    def __init__(self, storage: MatrixStorage, parent=None):
        super().__init__(parent)
        self.storage = storage
        self.current_matrix = None
        self.input_vector = np.array([1.0, 0.0])
        
        self.setup_ui()
        self.refresh_matrix_list()
    
    def setup_ui(self):
        layout = QHBoxLayout(self)
        
        # Left panel - Controls
        controls_widget = QWidget()
        controls_widget.setMaximumWidth(280)
        controls_layout = QVBoxLayout(controls_widget)
        
        # Matrix selector
        matrix_group = QGroupBox("Matrix Selection")
        matrix_layout = QVBoxLayout()
        
        self.matrix_combo = QComboBox()
        self.matrix_combo.currentTextChanged.connect(self.on_matrix_changed)
        matrix_layout.addWidget(self.matrix_combo)
        
        matrix_group.setLayout(matrix_layout)
        controls_layout.addWidget(matrix_group)
        
        # Manual matrix entry
        manual_group = QGroupBox("Manual Entry (2×2)")
        manual_layout = QFormLayout()
        
        from src.ui.complex_input import ComplexLineEdit
        self.a11 = ComplexLineEdit(1+0j)
        self.a12 = ComplexLineEdit(0+0j)
        self.a21 = ComplexLineEdit(0+0j)
        self.a22 = ComplexLineEdit(1+0j)
        
        manual_layout.addRow("a₁₁:", self.a11)
        manual_layout.addRow("a₁₂:", self.a12)
        manual_layout.addRow("a₂₁:", self.a21)
        manual_layout.addRow("a₂₂:", self.a22)
        
        apply_btn = QPushButton("Apply")
        apply_btn.clicked.connect(self.apply_manual_matrix)
        manual_layout.addRow(apply_btn)
        
        manual_group.setLayout(manual_layout)
        controls_layout.addWidget(manual_group)
        
        # Vector input
        vector_group = QGroupBox("Input Vector")
        vector_layout = QFormLayout()
        
        self.x_spin = QDoubleSpinBox()
        self.x_spin.setRange(-10, 10)
        self.x_spin.setValue(1.0)
        self.x_spin.setSingleStep(0.1)
        self.x_spin.valueChanged.connect(self.on_vector_changed)
        vector_layout.addRow("X:", self.x_spin)
        
        self.y_spin = QDoubleSpinBox()
        self.y_spin.setRange(-10, 10)
        self.y_spin.setValue(0.0)
        self.y_spin.setSingleStep(0.1)
        self.y_spin.valueChanged.connect(self.on_vector_changed)
        vector_layout.addRow("Y:", self.y_spin)
        
        vector_group.setLayout(vector_layout)
        controls_layout.addWidget(vector_group)
        
        # Display options
        options_group = QGroupBox("Options")
        options_layout = QVBoxLayout()
        
        self.show_grid_check = QCheckBox("Transformed Grid")
        self.show_grid_check.setChecked(True)
        self.show_grid_check.toggled.connect(self.update_all_plots)
        options_layout.addWidget(self.show_grid_check)
        
        self.show_basis_check = QCheckBox("Basis Vectors")
        self.show_basis_check.setChecked(True)
        self.show_basis_check.toggled.connect(self.update_all_plots)
        options_layout.addWidget(self.show_basis_check)
        
        self.show_unit_circle_check = QCheckBox("Unit Circle")
        self.show_unit_circle_check.setChecked(False)
        self.show_unit_circle_check.toggled.connect(self.update_all_plots)
        options_layout.addWidget(self.show_unit_circle_check)
        
        options_group.setLayout(options_layout)
        controls_layout.addWidget(options_group)
        
        controls_layout.addStretch()
        
        # Output display
        output_group = QGroupBox("Output (A·v)")
        output_layout = QFormLayout()
        self.output_x_label = QLabel("0.00")
        self.output_x_label.setStyleSheet("color: #f44336; font-weight: bold;")
        output_layout.addRow("X:", self.output_x_label)
        self.output_y_label = QLabel("0.00")
        self.output_y_label.setStyleSheet("color: #f44336; font-weight: bold;")
        output_layout.addRow("Y:", self.output_y_label)
        output_group.setLayout(output_layout)
        controls_layout.addWidget(output_group)
        
        layout.addWidget(controls_widget)
        
        # Right panel - Tabbed plots
        self.plot_tabs = QTabWidget()
        
        # Tab 1: Transformation
        self.transform_widget = QWidget()
        transform_layout = QVBoxLayout(self.transform_widget)
        self.transform_figure = Figure(figsize=(7, 7))
        self.transform_canvas = FigureCanvasQTAgg(self.transform_figure)
        self.transform_ax = self.transform_figure.add_subplot(111)
        transform_layout.addWidget(self.transform_canvas)
        self.plot_tabs.addTab(self.transform_widget, "Transformation")
        
        # Tab 2: Eigenvalue Plot
        self.eigen_widget = QWidget()
        eigen_layout = QVBoxLayout(self.eigen_widget)
        self.eigen_figure = Figure(figsize=(7, 7))
        self.eigen_canvas = FigureCanvasQTAgg(self.eigen_figure)
        self.eigen_ax = self.eigen_figure.add_subplot(111)
        eigen_layout.addWidget(self.eigen_canvas)
        self.plot_tabs.addTab(self.eigen_widget, "Eigenvalues")
        
        # Tab 3: Gershgorin Discs
        self.gersh_widget = QWidget()
        gersh_layout = QVBoxLayout(self.gersh_widget)
        self.gersh_figure = Figure(figsize=(7, 7))
        self.gersh_canvas = FigureCanvasQTAgg(self.gersh_figure)
        self.gersh_ax = self.gersh_figure.add_subplot(111)
        gersh_layout.addWidget(self.gersh_canvas)
        self.plot_tabs.addTab(self.gersh_widget, "Gershgorin")
        
        # Tab 4: Heatmap
        self.heat_widget = QWidget()
        heat_layout = QVBoxLayout(self.heat_widget)
        self.heat_figure = Figure(figsize=(7, 7))
        self.heat_canvas = FigureCanvasQTAgg(self.heat_figure)
        self.heat_ax = self.heat_figure.add_subplot(111)
        heat_layout.addWidget(self.heat_canvas)
        self.plot_tabs.addTab(self.heat_widget, "Heatmap")
        
        # Tab 5: Sparsity
        self.sparse_widget = QWidget()
        sparse_layout = QVBoxLayout(self.sparse_widget)
        self.sparse_figure = Figure(figsize=(7, 7))
        self.sparse_canvas = FigureCanvasQTAgg(self.sparse_figure)
        self.sparse_ax = self.sparse_figure.add_subplot(111)
        sparse_layout.addWidget(self.sparse_canvas)
        self.plot_tabs.addTab(self.sparse_widget, "Sparsity")
        
        layout.addWidget(self.plot_tabs, stretch=1)
        
        self.update_all_plots()
    
    def refresh_matrix_list(self):
        self.matrix_combo.clear()
        self.matrix_combo.addItem("-- Select Matrix --")
        self.matrix_combo.addItem("Rotation 45°")
        self.matrix_combo.addItem("Rotation 90°")
        self.matrix_combo.addItem("Reflection (Y-axis)")
        self.matrix_combo.addItem("Shear (X)")
        self.matrix_combo.addItem("Scale 2x")
        self.matrix_combo.addItem("Identity")
        
        matrices = self.storage.list_all()
        for mat_info in matrices:
            name = mat_info['name']
            rows = mat_info['rows']
            cols = mat_info['cols']
            self.matrix_combo.addItem(f"{name} ({rows}×{cols})")
    
    def on_matrix_changed(self, text: str):
        if text == "-- Select Matrix --":
            self.current_matrix = None
        elif text == "Rotation 45°":
            theta = np.pi / 4
            self.current_matrix = np.array([[np.cos(theta), -np.sin(theta)], [np.sin(theta), np.cos(theta)]])
        elif text == "Rotation 90°":
            theta = np.pi / 2
            self.current_matrix = np.array([[np.cos(theta), -np.sin(theta)], [np.sin(theta), np.cos(theta)]])
        elif text == "Reflection (Y-axis)":
            self.current_matrix = np.array([[-1, 0], [0, 1]])
        elif text == "Shear (X)":
            self.current_matrix = np.array([[1, 1], [0, 1]])
        elif text == "Scale 2x":
            self.current_matrix = np.array([[2, 0], [0, 2]])
        elif text == "Identity":
            self.current_matrix = np.eye(2)
        else:
            name = text.split(' (')[0]
            matrix = self.storage.load(name)
            self.current_matrix = matrix if matrix is not None else None
        
        self.update_all_plots()
    
    def on_vector_changed(self):
        self.input_vector = np.array([self.x_spin.value(), self.y_spin.value()])
        self.update_all_plots()
    
    def apply_manual_matrix(self):
        self.current_matrix = np.array([
            [self.a11.value(), self.a12.value()],
            [self.a21.value(), self.a22.value()]
        ], dtype=complex)
        self.matrix_combo.setCurrentIndex(0)
        self.update_all_plots()
    
    def update_all_plots(self):
        self.update_transformation_plot()
        self.update_eigenvalue_plot()
        self.update_gershgorin_plot()
        self.update_heatmap_plot()
        self.update_sparsity_plot()
    
    def update_transformation_plot(self):
        ax = self.transform_ax
        ax.clear()
        
        limit = 5
        ax.set_xlim(-limit, limit)
        ax.set_ylim(-limit, limit)
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3, linestyle='--', linewidth=0.5)
        ax.axhline(y=0, color='k', linewidth=0.5)
        ax.axvline(x=0, color='k', linewidth=0.5)
        ax.set_title('2D Transformation', fontweight='bold')
        
        if self.current_matrix is None or self.current_matrix.shape != (2, 2):
            ax.text(0, 0, 'Select a 2x2 matrix', ha='center', va='center', fontsize=12, color='gray')
            self.transform_canvas.draw()
            return
        
        m = self.current_matrix.real  # Use real part for 2D vis
        
        # Transformed grid
        if self.show_grid_check.isChecked():
            for i in range(-5, 6):
                for line in [np.array([[i, y] for y in np.linspace(-5, 5, 30)]),
                             np.array([[x, i] for x in np.linspace(-5, 5, 30)])]:
                    transformed = np.array([m @ p for p in line])
                    ax.plot(transformed[:, 0], transformed[:, 1], 'cyan', linewidth=0.8, alpha=0.5)
        
        # Basis vectors
        if self.show_basis_check.isChecked():
            ti = m @ np.array([1, 0])
            tj = m @ np.array([0, 1])
            ax.arrow(0, 0, ti[0], ti[1], head_width=0.15, head_length=0.1, fc='green', ec='green', linewidth=2)
            ax.arrow(0, 0, tj[0], tj[1], head_width=0.15, head_length=0.1, fc='orange', ec='orange', linewidth=2)
        
        # Unit circle
        if self.show_unit_circle_check.isChecked():
            theta = np.linspace(0, 2*np.pi, 100)
            circle = np.array([np.cos(theta), np.sin(theta)])
            ax.plot(circle[0], circle[1], 'purple', linestyle='--', linewidth=1, alpha=0.3)
            transformed = m @ circle
            ax.plot(transformed[0], transformed[1], 'purple', linewidth=2, alpha=0.7)
        
        # Input/output vectors
        ax.arrow(0, 0, self.input_vector[0], self.input_vector[1], head_width=0.2, head_length=0.15, fc='blue', ec='blue', linewidth=2)
        output = m @ self.input_vector
        ax.arrow(0, 0, output[0], output[1], head_width=0.2, head_length=0.15, fc='red', ec='red', linewidth=2)
        
        self.output_x_label.setText(f"{output[0]:.4f}")
        self.output_y_label.setText(f"{output[1]:.4f}")
        
        self.transform_canvas.draw()
    
    def update_eigenvalue_plot(self):
        ax = self.eigen_ax
        ax.clear()
        
        if self.current_matrix is None or self.current_matrix.shape[0] != self.current_matrix.shape[1]:
            ax.text(0.5, 0.5, 'Load a square matrix', ha='center', va='center', transform=ax.transAxes)
            self.eigen_canvas.draw()
            return
        
        m = self.current_matrix
        evals = np.linalg.eigvals(m)
        
        ax.scatter(evals.real, evals.imag, s=100, c='red', edgecolors='darkred', linewidth=2, zorder=5, label='Eigenvalues')
        
        # Unit circle
        theta = np.linspace(0, 2*np.pi, 100)
        ax.plot(np.cos(theta), np.sin(theta), 'gray', linestyle='--', linewidth=1, alpha=0.5, label='Unit Circle')
        
        ax.axhline(y=0, color='k', linewidth=0.5)
        ax.axvline(x=0, color='k', linewidth=0.5)
        ax.set_xlabel('Real')
        ax.set_ylabel('Imaginary')
        ax.set_title('Eigenvalue Plot', fontweight='bold')
        ax.set_aspect('equal')
        ax.legend(loc='upper right')
        ax.grid(True, alpha=0.3)
        
        self.eigen_canvas.draw()
    
    def update_gershgorin_plot(self):
        ax = self.gersh_ax
        ax.clear()
        
        if self.current_matrix is None or self.current_matrix.shape[0] != self.current_matrix.shape[1]:
            ax.text(0.5, 0.5, 'Load a square matrix', ha='center', va='center', transform=ax.transAxes)
            self.gersh_canvas.draw()
            return
        
        m = self.current_matrix
        n = m.shape[0]
        evals = np.linalg.eigvals(m)
        
        colors = cm.tab10(np.linspace(0, 1, n))
        
        # Draw Gershgorin discs
        for i in range(n):
            center = m[i, i]
            radius = np.sum(np.abs(m[i, :])) - abs(center)
            circle = Circle((center.real, center.imag), radius, fill=False, color=colors[i], linewidth=2, label=f'D{i+1}')
            ax.add_patch(circle)
        
        # Plot eigenvalues
        ax.scatter(evals.real, evals.imag, s=80, c='black', marker='x', linewidth=2, zorder=10, label='Eigenvalues')
        
        ax.axhline(y=0, color='k', linewidth=0.5)
        ax.axvline(x=0, color='k', linewidth=0.5)
        ax.set_xlabel('Real')
        ax.set_ylabel('Imaginary')
        ax.set_title('Gershgorin Discs', fontweight='bold')
        ax.set_aspect('equal')
        ax.legend(loc='upper right', fontsize=8)
        ax.grid(True, alpha=0.3)
        ax.autoscale()
        
        self.gersh_canvas.draw()
    
    def update_heatmap_plot(self):
        ax = self.heat_ax
        ax.clear()
        
        if self.current_matrix is None:
            ax.text(0.5, 0.5, 'Load a matrix', ha='center', va='center', transform=ax.transAxes)
            self.heat_canvas.draw()
            return
        
        m = np.abs(self.current_matrix)
        im = ax.imshow(m, cmap='viridis', aspect='auto')
        ax.set_title('Element Magnitude Heatmap', fontweight='bold')
        ax.set_xlabel('Column')
        ax.set_ylabel('Row')
        
        # Add colorbar
        self.heat_figure.colorbar(im, ax=ax, shrink=0.8)
        
        self.heat_canvas.draw()
    
    def update_sparsity_plot(self):
        ax = self.sparse_ax
        ax.clear()
        
        if self.current_matrix is None:
            ax.text(0.5, 0.5, 'Load a matrix', ha='center', va='center', transform=ax.transAxes)
            self.sparse_canvas.draw()
            return
        
        m = self.current_matrix
        binary = (np.abs(m) > 1e-10).astype(float)
        
        ax.imshow(binary, cmap='binary', aspect='auto')
        ax.set_title(f'Sparsity Pattern (nnz={np.count_nonzero(m)}, sparsity={100*(1-np.count_nonzero(m)/m.size):.1f}%)', fontweight='bold')
        ax.set_xlabel('Column')
        ax.set_ylabel('Row')
        
        self.sparse_canvas.draw()
