"""
LaTeX Compiler - PySide6 Application
A desktop application for writing LaTeX code and generating PDFs.
Supports multiple panes side by side for multitasking.
Each pane has its own name and compiles independently in parallel.
"""

import sys
from PySide6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QScrollArea, QPushButton, QLabel, QFrame, QMessageBox,
    QMenuBar, QMenu, QFileDialog, QSplitter
)
from PySide6.QtCore import Qt
from PySide6.QtGui import QAction, QFont

from latex_pane import LatexPane
from styles import MAIN_STYLESHEET, COLORS


class MainWindow(QMainWindow):
    """Main application window."""
    
    def __init__(self):
        super().__init__()
        self.panes = []
        self.pane_counter = 0
        self._setup_ui()
        self._setup_menu()
        self._add_pane()  # Start with one pane
    
    def _setup_ui(self):
        """Set up the main UI."""
        self.setWindowTitle("LaTeX Compiler")
        self.setMinimumSize(800, 600)
        self.resize(1400, 800)
        
        # Central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(10, 10, 10, 10)
        main_layout.setSpacing(10)
        
        # Header with pane controls
        header_layout = QHBoxLayout()
        header_layout.setSpacing(10)
        
        title_label = QLabel("LaTeX Compiler")
        title_label.setStyleSheet(f"font-size: 16px; font-weight: bold; color: {COLORS['accent']};")
        
        # Pane control buttons
        self.add_pane_btn = QPushButton("+ Add Pane")
        self.add_pane_btn.setObjectName("addPaneBtn")
        self.add_pane_btn.clicked.connect(self._add_pane)
        
        self.pane_count_label = QLabel("Panes: 0")
        self.pane_count_label.setStyleSheet(f"color: {COLORS['text_muted']}; font-size: 12px;")
        
        header_layout.addWidget(title_label)
        header_layout.addStretch()
        header_layout.addWidget(self.pane_count_label)
        header_layout.addWidget(self.add_pane_btn)
        
        main_layout.addLayout(header_layout)
        
        # Horizontal splitter for side-by-side panes
        self.splitter = QSplitter(Qt.Orientation.Horizontal)
        self.splitter.setHandleWidth(5)
        
        main_layout.addWidget(self.splitter, 1)
        
        # Status bar
        self.statusBar().showMessage("Ready - Each pane compiles independently in parallel")
    
    def _setup_menu(self):
        """Set up the menu bar."""
        menubar = self.menuBar()
        
        # File menu
        file_menu = menubar.addMenu("&File")
        
        new_action = QAction("&New Document", self)
        new_action.setShortcut("Ctrl+N")
        new_action.triggered.connect(self._new_document)
        file_menu.addAction(new_action)
        
        file_menu.addSeparator()
        
        exit_action = QAction("E&xit", self)
        exit_action.setShortcut("Ctrl+Q")
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        # Edit menu
        edit_menu = menubar.addMenu("&Edit")
        
        add_pane_action = QAction("&Add Pane", self)
        add_pane_action.setShortcut("Ctrl+T")
        add_pane_action.triggered.connect(self._add_pane)
        edit_menu.addAction(add_pane_action)
        
        # Help menu
        help_menu = menubar.addMenu("&Help")
        
        about_action = QAction("&About", self)
        about_action.triggered.connect(self._show_about)
        help_menu.addAction(about_action)
    
    def _add_pane(self):
        """Add a new LaTeX pane."""
        self.pane_counter += 1
        pane = LatexPane(self.pane_counter, self)
        pane.remove_requested.connect(self._remove_pane)
        
        self.splitter.addWidget(pane)
        self.panes.append(pane)
        
        self._update_pane_count()
        self.statusBar().showMessage(f"Added Pane {self.pane_counter} - Each pane has its own name")
    
    def _remove_pane(self, pane: LatexPane):
        """Remove a LaTeX pane."""
        if len(self.panes) <= 1:
            QMessageBox.information(
                self,
                "Cannot Remove",
                "You must have at least one pane.",
                QMessageBox.StandardButton.Ok
            )
            return
        
        reply = QMessageBox.question(
            self,
            "Remove Pane",
            f"Remove '{pane.get_name()}'?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            pane.cleanup()
            self.panes.remove(pane)
            pane.deleteLater()
            self._update_pane_count()
            self.statusBar().showMessage("Pane removed")
    
    def _update_pane_count(self):
        """Update the pane count label."""
        count = len(self.panes)
        self.pane_count_label.setText(f"Panes: {count}")
    
    def _new_document(self):
        """Create a new document."""
        reply = QMessageBox.question(
            self,
            "New Document",
            "This will clear all panes. Continue?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            for pane in self.panes[:]:
                pane.cleanup()
                pane.deleteLater()
            self.panes.clear()
            self.pane_counter = 0
            self._add_pane()
            self.statusBar().showMessage("New document created")
    
    def _show_about(self):
        """Show about dialog."""
        QMessageBox.about(
            self,
            "About LaTeX Compiler",
            """<h3>LaTeX Compiler</h3>
            <p>A desktop application for writing LaTeX code and generating PDFs.</p>
            <p><b>Features:</b></p>
            <ul>
                <li>Multiple panes side by side</li>
                <li>Each pane has its own name</li>
                <li>Parallel compilation (independent per pane)</li>
                <li>Automatic error fixing</li>
            </ul>
            <p><b>Requirements:</b> pdflatex (TeX Live or MiKTeX)</p>
            """
        )
    
    def closeEvent(self, event):
        """Handle window close event."""
        for pane in self.panes:
            pane.cleanup()
        event.accept()


def main():
    """Application entry point."""
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    app.setStyleSheet(MAIN_STYLESHEET)
    
    font = QFont("Segoe UI", 10)
    app.setFont(font)
    
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
