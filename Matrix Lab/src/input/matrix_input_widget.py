"""
Matrix Input Widget
Unified widget combining all input methods.
"""

from PySide6.QtWidgets import QWidget, QVBoxLayout, QTabWidget, QDialogButtonBox, QDialog
from PySide6.QtCore import Signal
import numpy as np

from src.input.manual_entry import ManualEntryWidget
from src.input.text_entry import TextEntryWidget
from src.input.random_generator import RandomGeneratorWidget
from src.input.file_import import FileImportWidget


class MatrixInputWidget(QWidget):
    """Tabbed widget combining all matrix input methods."""
    
    matrix_ready = Signal(np.ndarray)
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_ui()
    
    def setup_ui(self):
        """Initialize the UI with tabs for each input method."""
        layout = QVBoxLayout(self)
        
        # Tab widget
        self.tabs = QTabWidget()
        
        # Manual entry tab
        self.manual_widget = ManualEntryWidget()
        self.manual_widget.matrix_ready.connect(self.on_matrix_ready)
        self.tabs.addTab(self.manual_widget, "Manual Entry")
        
        # Text entry tab
        self.text_widget = TextEntryWidget()
        self.text_widget.matrix_ready.connect(self.on_matrix_ready)
        self.tabs.addTab(self.text_widget, "Text Input")
        
        # Random generator tab
        self.random_widget = RandomGeneratorWidget()
        self.random_widget.matrix_ready.connect(self.on_matrix_ready)
        self.tabs.addTab(self.random_widget, "Random")
        
        # File import tab
        self.import_widget = FileImportWidget()
        self.import_widget.matrix_ready.connect(self.on_matrix_ready)
        self.tabs.addTab(self.import_widget, "Import File")
        
        layout.addWidget(self.tabs)
    
    def on_matrix_ready(self, matrix: np.ndarray):
        """Forward matrix_ready signal from any tab."""
        self.matrix_ready.emit(matrix)


class MatrixInputDialog(QDialog):
    """Dialog wrapper for MatrixInputWidget."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.matrix = None
        self.setup_ui()
    
    def setup_ui(self):
        """Setup dialog UI."""
        self.setWindowTitle("New Matrix")
        self.setMinimumSize(600, 500)
        
        layout = QVBoxLayout(self)
        
        # Input widget
        self.input_widget = MatrixInputWidget()
        self.input_widget.matrix_ready.connect(self.on_matrix_ready)
        layout.addWidget(self.input_widget)
        
        # Buttons
        buttons = QDialogButtonBox(QDialogButtonBox.Cancel)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)
    
    def on_matrix_ready(self, matrix: np.ndarray):
        """Store matrix and close dialog."""
        self.matrix = matrix
        self.accept()
    
    def get_matrix(self) -> np.ndarray:
        """Get the created matrix."""
        return self.matrix
