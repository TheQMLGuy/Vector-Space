"""
Matrix Lab - Main Entry Point
Interactive PySide6 application for matrix analysis and management.
"""

import sys
from PySide6.QtWidgets import QApplication

from src.ui.main_window import MainWindow


def main():
    """Application entry point."""
    app = QApplication(sys.argv)
    
    # Set application metadata
    app.setApplicationName("Matrix Lab")
    app.setOrganizationName("Matrix Lab")
    app.setApplicationVersion("1.0.0")
    
    # Create and show main window
    window = MainWindow()
    window.show()
    
    # Run event loop
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
