"""
Properties Panel Component
Displays matrix properties and classifications in collapsible sections.
"""

from PySide6.QtWidgets import (QWidget, QVBoxLayout, QGroupBox, QLabel,
                               QScrollArea, QGridLayout)
from PySide6.QtCore import Qt
import numpy as np

from src.analysis.matrix_analyzer import MatrixAnalyzer
from src.utils.formatters import Formatters


class PropertiesPanelWidget(QWidget):
    """Widget for displaying matrix properties."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_ui()
    
    def setup_ui(self):
        """Initialize the UI components."""
        # Scroll area for all properties
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        
        # Container widget
        container = QWidget()
        layout = QVBoxLayout(container)
        layout.setSpacing(10)
        
        # Basic Properties section
        self.basic_group = QGroupBox("Basic Properties")
        self.basic_layout = QGridLayout()
        self.basic_group.setLayout(self.basic_layout)
        layout.addWidget(self.basic_group)
        
        # Matrix Type section
        self.type_group = QGroupBox("Matrix Type")
        self.type_layout = QVBoxLayout()
        self.type_group.setLayout(self.type_layout)
        layout.addWidget(self.type_group)
        
        # Norms section
        self.norms_group = QGroupBox("Norms")
        self.norms_layout = QGridLayout()
        self.norms_group.setLayout(self.norms_layout)
        layout.addWidget(self.norms_group)
        
        # Eigenanalysis section
        self.eigen_group = QGroupBox("Eigenanalysis")
        self.eigen_layout = QVBoxLayout()
        self.eigen_group.setLayout(self.eigen_layout)
        layout.addWidget(self.eigen_group)
        
        # SVD section
        self.svd_group = QGroupBox("Singular Values")
        self.svd_layout = QVBoxLayout()
        self.svd_group.setLayout(self.svd_layout)
        layout.addWidget(self.svd_group)
        
        layout.addStretch()
        
        scroll.setWidget(container)
        
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.addWidget(scroll)
        
        # Show empty state
        self.show_empty_state()
    
    def show_empty_state(self):
        """Display empty state when no matrix is loaded."""
        self.clear_section(self.basic_layout)
        label = QLabel("No matrix loaded")
        label.setStyleSheet("color: #999; font-style: italic;")
        self.basic_layout.addWidget(label, 0, 0)
        
        self.clear_section(self.type_layout)
        self.clear_section(self.norms_layout)
        self.clear_section(self.eigen_layout)
        self.clear_section(self.svd_layout)
    
    def clear_section(self, layout):
        """Clear all widgets from a layout."""
        while layout.count():
            item = layout.takeAt(0)
            widget = item.widget()
            if widget:
                widget.deleteLater()
    
    def update_properties(self, matrix: np.ndarray):
        """
        Update all property displays for the given matrix.
        
        Args:
            matrix: NumPy array to analyze
        """
        # Get full analysis
        analysis = MatrixAnalyzer.analyze_full(matrix)
        
        # Update basic properties
        self.update_basic_properties(analysis['basic_properties'])
        
        # Update matrix type
        self.update_matrix_type(analysis['classification'])
        
        # Update norms
        self.update_norms(analysis['norms'], analysis.get('condition_number'))
        
        # Update eigenanalysis (if square)
        if 'eigenanalysis' in analysis:
            self.update_eigenanalysis(analysis['eigenanalysis'])
        else:
            self.clear_section(self.eigen_layout)
            label = QLabel("Not available (matrix not square)")
            label.setStyleSheet("color: #999; font-style: italic;")
            self.eigen_layout.addWidget(label)
        
        # Update SVD
        if 'svd' in analysis and analysis['svd']:
            self.update_svd(analysis['svd'])
        else:
            self.clear_section(self.svd_layout)
    
    def update_basic_properties(self, props: dict):
        """Update basic properties section."""
        self.clear_section(self.basic_layout)
        
        row = 0
        
        # Dimensions
        self.add_property(self.basic_layout, row, "Dimensions:",
                         f"{props['rows']}×{props['cols']}")
        row += 1
        
        # Determinant
        if props['determinant'] is not None:
            det_str = Formatters.format_number(props['determinant'])
            self.add_property(self.basic_layout, row, "Determinant:", det_str)
            row += 1
        
        # Trace
        if props['trace'] is not None:
            trace_str = Formatters.format_number(props['trace'])
            self.add_property(self.basic_layout, row, "Trace:", trace_str)
            row += 1
        
        # Rank
        if props['rank'] is not None:
            self.add_property(self.basic_layout, row, "Rank:", str(props['rank']))
            row += 1
        
        # Nullity
        if props['nullity'] is not None:
            self.add_property(self.basic_layout, row, "Nullity:", str(props['nullity']))
            row += 1
    
    def update_matrix_type(self, classification: dict):
        """Update matrix type section."""
        self.clear_section(self.type_layout)
        
        # List all true classifications
        true_types = [name.replace('_', ' ').title() 
                      for name, value in classification.items() if value]
        
        if not true_types:
            label = QLabel("No special classifications")
            label.setStyleSheet("color: #999; font-style: italic;")
            self.type_layout.addWidget(label)
        else:
            for type_name in true_types:
                label = QLabel(f"✓ {type_name}")
                label.setStyleSheet("color: #4caf50; font-weight: bold;")
                self.type_layout.addWidget(label)
    
    def update_norms(self, norms: dict, cond: float = None):
        """Update norms section."""
        self.clear_section(self.norms_layout)
        
        row = 0
        
        self.add_property(self.norms_layout, row, "Frobenius:",
                         Formatters.format_number(norms['frobenius']))
        row += 1
        
        self.add_property(self.norms_layout, row, "1-Norm:",
                         Formatters.format_number(norms['norm_1']))
        row += 1
        
        self.add_property(self.norms_layout, row, "2-Norm:",
                         Formatters.format_number(norms['norm_2']))
        row += 1
        
        self.add_property(self.norms_layout, row, "∞-Norm:",
                         Formatters.format_number(norms['norm_inf']))
        row += 1
        
        if cond is not None:
            self.add_property(self.norms_layout, row, "Condition Number:",
                            Formatters.format_number(cond))
    
    def update_eigenanalysis(self, eigen: dict):
        """Update eigenanalysis section."""
        self.clear_section(self.eigen_layout)
        
        eigenvalues = eigen['eigenvalues']
        
        # Display eigenvalues
        eigen_label = QLabel("Eigenvalues:")
        eigen_label.setStyleSheet("font-weight: bold; margin-bottom: 4px;")
        self.eigen_layout.addWidget(eigen_label)
        
        for i, val in enumerate(eigenvalues):
            if np.iscomplex(val):
                val_str = Formatters.format_complex(val)
            else:
                val_str = Formatters.format_number(val.real)
            
            label = QLabel(f"λ_{i+1} = {val_str}")
            label.setStyleSheet("margin-left: 16px;")
            self.eigen_layout.addWidget(label)
    
    def update_svd(self, svd: dict):
        """Update SVD section."""
        self.clear_section(self.svd_layout)
        
        singular_values = svd['singular_values']
        
        for i, val in enumerate(singular_values):
            val_str = Formatters.format_number(val)
            label = QLabel(f"σ_{i+1} = {val_str}")
            self.svd_layout.addWidget(label)
    
    def add_property(self, layout: QGridLayout, row: int, name: str, value: str):
        """Helper to add a property row."""
        name_label = QLabel(name)
        name_label.setStyleSheet("font-weight: bold;")
        
        value_label = QLabel(value)
        value_label.setStyleSheet("color: #1976d2;")
        
        layout.addWidget(name_label, row, 0)
        layout.addWidget(value_label, row, 1)
