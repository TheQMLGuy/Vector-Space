"""
Main Window - Enhanced with Tabbed Interface
Application main window with sidebar and tabbed content area.
"""

from PySide6.QtWidgets import (QMainWindow, QWidget, QHBoxLayout, QVBoxLayout,
                               QSplitter, QPushButton, QMessageBox, QStatusBar,
                               QTabWidget)
from PySide6.QtCore import Qt
import numpy as np

from src.storage.matrix_storage import MatrixStorage
from src.ui.sidebar import SidebarWidget
from src.ui.matrix_editor import MatrixEditorWidget
from src.ui.theme_manager import ThemeManager
from src.ui.tabs.analysis_tab import AnalysisTab
from src.ui.tabs.decompositions_tab import DecompositionsTab
from src.ui.tabs.derived_matrices_tab import DerivedMatricesTab
from src.ui.tabs.visualizer_tab import VisualizerTab
from src.input.matrix_input_widget import MatrixInputDialog
from src.utils.validators import Validators
from src.utils.matrix_library import MatrixLibrary
from src.utils.quantum_gates import QuantumMatrices


class MainWindow(QMainWindow):
    """Main application window with enhanced features."""
    
    def __init__(self):
        super().__init__()
        
        # Initialize storage
        self.storage = MatrixStorage()
        
        # Add famous matrices to storage
        MatrixLibrary.add_famous_matrices_to_storage(self.storage)
        
        # Add quantum gates to storage
        QuantumMatrices.add_quantum_gates_to_storage(self.storage)
        
        # Initialize theme manager
        self.theme_manager = ThemeManager()
        
        self.setup_ui()
        self.create_menus()
        
        # Apply saved theme
        self.theme_manager.apply_theme()
    
    def setup_ui(self):
        """Initialize the main UI layout."""
        self.setWindowTitle("Matrix Lab v2.0")
        self.setGeometry(100, 100, 1600, 900)
        
        # Central widget
        central = QWidget()
        self.setCentralWidget(central)
        
        # Main horizontal layout
        main_layout = QHBoxLayout(central)
        
        # Splitter for resizable sections
        splitter = QSplitter(Qt.Horizontal)
        
        # Left sidebar
        self.sidebar = SidebarWidget(self.storage)
        self.sidebar.setMaximumWidth(300)
        self.sidebar.setMinimumWidth(200)
        self.sidebar.matrix_selected.connect(self.load_matrix)
        self.sidebar.matrix_deleted.connect(self.on_matrix_deleted)
        splitter.addWidget(self.sidebar)
        
        # Right side: Tab widget
        right_widget = QWidget()
        right_layout = QVBoxLayout(right_widget)
        right_layout.setContentsMargins(0, 0, 0, 0)
        
        # New Matrix button at top
        new_matrix_btn = QPushButton("➕ New Matrix")
        new_matrix_btn.setStyleSheet("font-size: 11pt; padding: 10px; font-weight: bold;")
        new_matrix_btn.clicked.connect(self.create_new_matrix)
        right_layout.addWidget(new_matrix_btn)
        
        # Tab widget for different views
        self.tab_widget = QTabWidget()
        self.tab_widget.setTabPosition(QTabWidget.North)
        
        # Tab 1: Editor
        editor_tab = QWidget()
        editor_layout = QVBoxLayout(editor_tab)
        
        self.matrix_editor = MatrixEditorWidget()
        self.matrix_editor.matrix_changed.connect(self.on_matrix_changed)
        self.matrix_editor.save_requested.connect(self.save_matrix)
        editor_layout.addWidget(self.matrix_editor)
        
        self.tab_widget.addTab(editor_tab, "Editor")
        
        # Tab 2: Analysis (Enhanced with Insights)
        self.analysis_tab = AnalysisTab()
        self.tab_widget.addTab(self.analysis_tab, "Analysis")
        
        # Tab 3: Decompositions
        self.decompositions_tab = DecompositionsTab()
        self.tab_widget.addTab(self.decompositions_tab, "Decompositions")
        
        # Tab 4: Derived Matrices
        self.derived_matrices_tab = DerivedMatricesTab()
        self.tab_widget.addTab(self.derived_matrices_tab, "Derived Matrices")
        
        # Tab 5: Visualizer
        self.visualizer_tab = VisualizerTab(self.storage)
        self.tab_widget.addTab(self.visualizer_tab, "Visualizer")
        
        right_layout.addWidget(self.tab_widget)
        
        splitter.addWidget(right_widget)
        
        # Set initial splitter sizes
        splitter.setSizes([250, 1350])
        
        main_layout.addWidget(splitter)
        
        # Status bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("Ready - Matrix Lab v2.0 with Insight Engine")
    
    def create_menus(self):
        """Create menu bar."""
        menubar = self.menuBar()
        
        # File menu
        file_menu = menubar.addMenu("File")
        
        new_action = file_menu.addAction("New Matrix")
        new_action.setShortcut("Ctrl+N")
        new_action.triggered.connect(self.create_new_matrix)
        
        file_menu.addSeparator()
        
        exit_action = file_menu.addAction("Exit")
        exit_action.setShortcut("Ctrl+Q")
        exit_action.triggered.connect(self.close)
        
        # View menu
        view_menu = menubar.addMenu("View")
        
        editor_action = view_menu.addAction("Editor Tab")
        editor_action.setShortcut("Ctrl+1")
        editor_action.triggered.connect(lambda: self.tab_widget.setCurrentIndex(0))
        
        analysis_action = view_menu.addAction("Analysis Tab")
        analysis_action.setShortcut("Ctrl+2")
        analysis_action.triggered.connect(lambda: self.tab_widget.setCurrentIndex(1))
        
        decomp_action = view_menu.addAction("Decompositions Tab")
        decomp_action.setShortcut("Ctrl+3")
        decomp_action.triggered.connect(lambda: self.tab_widget.setCurrentIndex(2))
        
        viz_action = view_menu.addAction("Visualizer Tab")
        viz_action.setShortcut("Ctrl+4")
        viz_action.triggered.connect(lambda: self.tab_widget.setCurrentIndex(3))
        
        view_menu.addSeparator()
        
        theme_action = view_menu.addAction("Toggle Theme")
        theme_action.setShortcut("Ctrl+T")
        theme_action.triggered.connect(self.toggle_theme)
        
        refresh_action = view_menu.addAction("Refresh Sidebar")
        refresh_action.setShortcut("F5")
        refresh_action.triggered.connect(self.sidebar.refresh_list)
        
        # Help menu
        help_menu = menubar.addMenu("Help")
        
        about_action = help_menu.addAction("About")
        about_action.triggered.connect(self.show_about)
    
    def create_new_matrix(self):
        """Open dialog to create a new matrix."""
        dialog = MatrixInputDialog(self)
        
        if dialog.exec_():
            matrix = dialog.get_matrix()
            if matrix is not None:
                self.matrix_editor.set_matrix(matrix)
                self.status_bar.showMessage("Matrix created")
                # Switch to editor tab
                self.tab_widget.setCurrentIndex(0)
    
    def load_matrix(self, name: str):
        """Load matrix from storage."""
        matrix = self.storage.load(name)
        
        if matrix is not None:
            self.matrix_editor.set_matrix(matrix, name)
            self.status_bar.showMessage(f"Loaded matrix: {name}")
            # Switch to editor tab
            self.tab_widget.setCurrentIndex(0)
        else:
            QMessageBox.warning(self, "Error", f"Failed to load matrix '{name}'")
    
    def save_matrix(self, name: str, matrix: np.ndarray):
        """Save matrix to storage."""
        # Validate name
        if not Validators.validate_matrix_name(name):
            QMessageBox.warning(
                self,
                "Invalid Name",
                "Matrix name must start with a letter or underscore and contain only alphanumeric characters and underscores."
            )
            return
        
        # Try to save
        success = self.storage.save(name, matrix)
        
        if success:
            self.status_bar.showMessage(f"Saved matrix: {name}")
            self.sidebar.refresh_list()
            self.visualizer_tab.refresh_matrix_list()
        else:
            # Name exists, ask to update
            reply = QMessageBox.question(
                self,
                "Matrix Exists",
                f"Matrix '{name}' already exists. Update it?",
                QMessageBox.Yes | QMessageBox.No
            )
            
            if reply == QMessageBox.Yes:
                self.storage.update(name, matrix)
                self.status_bar.showMessage(f"Updated matrix: {name}")
                self.sidebar.refresh_list()
                self.visualizer_tab.refresh_matrix_list()
    
    def on_matrix_changed(self, matrix: np.ndarray):
        """Update all tabs when matrix changes."""
        # Update analysis tab
        self.analysis_tab.update_analysis(matrix)
        
        # Update decompositions tab
        self.decompositions_tab.set_matrix(matrix)
        
        # Update derived matrices tab
        self.derived_matrices_tab.set_matrix(matrix)
    
    def on_matrix_deleted(self, name: str):
        """Handle matrix deletion."""
        # Clear editor if deleted matrix is currently displayed
        if self.matrix_editor.get_name() == name:
            self.matrix_editor.clear_matrix()
        
        self.status_bar.showMessage(f"Deleted matrix: {name}")
        
        # Refresh visualizer list
        self.visualizer_tab.refresh_matrix_list()
    
    def toggle_theme(self):
        """Toggle between light and dark themes."""
        self.theme_manager.toggle_theme()
        current = self.theme_manager.get_current_theme()
        self.status_bar.showMessage(f"Switched to {current} theme")
    
    def show_about(self):
        """Show about dialog."""
        QMessageBox.about(
            self,
            "About Matrix Lab",
            "<h2>Matrix Lab v2.0</h2>"
            "<p>An interactive linear algebra workbench with natural language insights.</p>"
            "<p><b>Phase 2 Features:</b></p>"
            "<ul>"
            "<li>✨ Insight Engine: Natural language explanations</li>"
            "<li>📊 Transformation Visualizer: Interactive 2D matrix transformations</li>"
            "<li>🧮 Matrix Decompositions: LU, QR, Cholesky, SVD, Eigen</li>"
            "<li>🔍 Enhanced Analysis: Three-lens interpretation system</li>"
            "</ul>"
            "<p>Built with PySide6, NumPy, SciPy, and Matplotlib.</p>"
        )
