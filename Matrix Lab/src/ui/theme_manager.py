"""
Theme Manager
Handles theme switching and stylesheet management.
"""

import json
import os
from PySide6.QtWidgets import QApplication


class ThemeManager:
    """Manages application themes and stylesheets."""
    
    THEME_FILE = "theme_preference.json"
    
    LIGHT_THEME = """
    QMainWindow {
        background-color: #f5f5f5;
    }
    
    QWidget {
        background-color: #ffffff;
        color: #333333;
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 10pt;
    }
    
    QMenuBar {
        background-color: #ffffff;
        border-bottom: 1px solid #ddd;
        padding: 4px;
    }
    
    QMenuBar::item {
        padding: 4px 12px;
        background: transparent;
    }
    
    QMenuBar::item:selected {
        background-color: #e3f2fd;
    }
    
    QMenu {
        background-color: #ffffff;
        border: 1px solid #ccc;
    }
    
    QMenu::item:selected {
        background-color: #e3f2fd;
    }
    
    QPushButton {
        background-color: #2196f3;
        color: white;
        border: none;
        padding: 6px 16px;
        border-radius: 4px;
        font-weight: 500;
    }
    
    QPushButton:hover {
        background-color: #1976d2;
    }
    
    QPushButton:pressed {
        background-color: #0d47a1;
    }
    
    QPushButton:disabled {
        background-color: #cccccc;
        color: #666666;
    }
    
    QLineEdit, QTextEdit, QSpinBox, QDoubleSpinBox {
        background-color: #ffffff;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 4px 8px;
    }
    
    QLineEdit:focus, QTextEdit:focus, QSpinBox:focus, QDoubleSpinBox:focus {
        border: 2px solid #2196f3;
    }
    
    QTableWidget {
        background-color: #ffffff;
        gridline-color: #e0e0e0;
        border: 1px solid #ccc;
    }
    
    QTableWidget::item {
        padding: 4px;
    }
    
    QTableWidget::item:selected {
        background-color: #bbdefb;
    }
    
    QHeaderView::section {
        background-color: #f0f0f0;
        padding: 4px;
        border: 1px solid #ddd;
        font-weight: bold;
    }
    
    QListWidget {
        background-color: #ffffff;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    
    QListWidget::item {
        padding: 8px;
        border-bottom: 1px solid #f0f0f0;
    }
    
    QListWidget::item:selected {
        background-color: #e3f2fd;
        color: #1976d2;
    }
    
    QListWidget::item:hover {
        background-color: #f5f5f5;
    }
    
    QGroupBox {
        border: 2px solid #e0e0e0;
        border-radius: 6px;
        margin-top: 12px;
        font-weight: bold;
        padding: 10px;
    }
    
    QGroupBox::title {
        subcontrol-origin: margin;
        subcontrol-position: top left;
        padding: 0 8px;
        background-color: #ffffff;
    }
    
    QTabWidget::pane {
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: #ffffff;
    }
    
    QTabBar::tab {
        background-color: #f0f0f0;
        color: #666;
        padding: 8px 16px;
        border: 1px solid #ccc;
        border-bottom: none;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
    }
    
    QTabBar::tab:selected {
        background-color: #ffffff;
        color: #2196f3;
        font-weight: bold;
    }
    
    QTabBar::tab:hover {
        background-color: #e8e8e8;
    }
    
    QScrollArea {
        border: none;
    }
    
    QScrollBar:vertical {
        background-color: #f0f0f0;
        width: 12px;
        border-radius: 6px;
    }
    
    QScrollBar::handle:vertical {
        background-color: #bbb;
        border-radius: 6px;
        min-height: 20px;
    }
    
    QScrollBar::handle:vertical:hover {
        background-color: #999;
    }
    
    QStatusBar {
        background-color: #f0f0f0;
        border-top: 1px solid #ddd;
    }
    
    QComboBox {
        background-color: #ffffff;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 4px 8px;
    }
    
    QComboBox:focus {
        border: 2px solid #2196f3;
    }
    
    QComboBox::drop-down {
        border: none;
    }
    
    QCheckBox {
        spacing: 8px;
    }
    
    QCheckBox::indicator {
        width: 18px;
        height: 18px;
        border: 2px solid #ccc;
        border-radius: 3px;
    }
    
    QCheckBox::indicator:checked {
        background-color: #2196f3;
        border-color: #2196f3;
    }
    """
    
    DARK_THEME = """
    QMainWindow {
        background-color: #1e1e1e;
    }
    
    QWidget {
        background-color: #2d2d2d;
        color: #e0e0e0;
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 10pt;
    }
    
    QMenuBar {
        background-color: #2d2d2d;
        border-bottom: 1px solid #3d3d3d;
        padding: 4px;
    }
    
    QMenuBar::item {
        padding: 4px 12px;
        background: transparent;
    }
    
    QMenuBar::item:selected {
        background-color: #3d3d3d;
    }
    
    QMenu {
        background-color: #2d2d2d;
        border: 1px solid #3d3d3d;
    }
    
    QMenu::item:selected {
        background-color: #404040;
    }
    
    QPushButton {
        background-color: #0d47a1;
        color: #e0e0e0;
        border: none;
        padding: 6px 16px;
        border-radius: 4px;
        font-weight: 500;
    }
    
    QPushButton:hover {
        background-color: #1565c0;
    }
    
    QPushButton:pressed {
        background-color: #003c8f;
    }
    
    QPushButton:disabled {
        background-color: #404040;
        color: #808080;
    }
    
    QLineEdit, QTextEdit, QSpinBox, QDoubleSpinBox {
        background-color: #1e1e1e;
        color: #e0e0e0;
        border: 1px solid #404040;
        border-radius: 4px;
        padding: 4px 8px;
    }
    
    QLineEdit:focus, QTextEdit:focus, QSpinBox:focus, QDoubleSpinBox:focus {
        border: 2px solid #1976d2;
    }
    
    QTableWidget {
        background-color: #1e1e1e;
        color: #e0e0e0;
        gridline-color: #404040;
        border: 1px solid #404040;
    }
    
    QTableWidget::item {
        padding: 4px;
    }
    
    QTableWidget::item:selected {
        background-color: #1565c0;
    }
    
    QHeaderView::section {
        background-color: #2d2d2d;
        color: #e0e0e0;
        padding: 4px;
        border: 1px solid #404040;
        font-weight: bold;
    }
    
    QListWidget {
        background-color: #1e1e1e;
        color: #e0e0e0;
        border: 1px solid #404040;
        border-radius: 4px;
    }
    
    QListWidget::item {
        padding: 8px;
        border-bottom: 1px solid #2d2d2d;
    }
    
    QListWidget::item:selected {
        background-color: #1565c0;
        color: #e0e0e0;
    }
    
    QListWidget::item:hover {
        background-color: #3d3d3d;
    }
    
    QGroupBox {
        border: 2px solid #404040;
        border-radius: 6px;
        margin-top: 12px;
        font-weight: bold;
        padding: 10px;
        color: #e0e0e0;
    }
    
    QGroupBox::title {
        subcontrol-origin: margin;
        subcontrol-position: top left;
        padding: 0 8px;
        background-color: #2d2d2d;
    }
    
    QTabWidget::pane {
        border: 1px solid #404040;
        border-radius: 4px;
        background-color: #2d2d2d;
    }
    
    QTabBar::tab {
        background-color: #1e1e1e;
        color: #a0a0a0;
        padding: 8px 16px;
        border: 1px solid #404040;
        border-bottom: none;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
    }
    
    QTabBar::tab:selected {
        background-color: #2d2d2d;
        color: #64b5f6;
        font-weight: bold;
    }
    
    QTabBar::tab:hover {
        background-color: #252525;
    }
    
    QScrollArea {
        border: none;
    }
    
    QScrollBar:vertical {
        background-color: #2d2d2d;
        width: 12px;
        border-radius: 6px;
    }
    
    QScrollBar::handle:vertical {
        background-color: #555;
        border-radius: 6px;
        min-height: 20px;
    }
    
    QScrollBar::handle:vertical:hover {
        background-color: #666;
    }
    
    QStatusBar {
        background-color: #1e1e1e;
        color: #a0a0a0;
        border-top: 1px solid #404040;
    }
    
    QComboBox {
        background-color: #1e1e1e;
        color: #e0e0e0;
        border: 1px solid #404040;
        border-radius: 4px;
        padding: 4px 8px;
    }
    
    QComboBox:focus {
        border: 2px solid #1976d2;
    }
    
    QComboBox::drop-down {
        border: none;
    }
    
    QCheckBox {
        spacing: 8px;
        color: #e0e0e0;
    }
    
    QCheckBox::indicator {
        width: 18px;
        height: 18px;
        border: 2px solid #404040;
        border-radius: 3px;
        background-color: #1e1e1e;
    }
    
    QCheckBox::indicator:checked {
        background-color: #1976d2;
        border-color: #1976d2;
    }
    """
    
    def __init__(self):
        """Initialize theme manager with saved preference."""
        self.current_theme = self.load_preference()
    
    def load_preference(self) -> str:
        """Load theme preference from file."""
        if os.path.exists(self.THEME_FILE):
            try:
                with open(self.THEME_FILE, 'r') as f:
                    data = json.load(f)
                    return data.get('theme', 'light')
            except:
                pass
        return 'light'
    
    def save_preference(self, theme: str):
        """Save theme preference to file."""
        try:
            with open(self.THEME_FILE, 'w') as f:
                json.dump({'theme': theme}, f)
        except:
            pass
    
    def apply_theme(self, theme: str = None):
        """
        Apply theme to application.
        
        Args:
            theme: 'light' or 'dark', None to use current
        """
        if theme:
            self.current_theme = theme
            self.save_preference(theme)
        
        stylesheet = self.LIGHT_THEME if self.current_theme == 'light' else self.DARK_THEME
        QApplication.instance().setStyleSheet(stylesheet)
    
    def toggle_theme(self):
        """Toggle between light and dark themes."""
        new_theme = 'dark' if self.current_theme == 'light' else 'light'
        self.apply_theme(new_theme)
    
    def get_current_theme(self) -> str:
        """Get current theme name."""
        return self.current_theme
