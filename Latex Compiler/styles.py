"""
Application-wide styling for the LaTeX Compiler.
Clean white theme with simple aesthetics.
"""

# Color Palette - Clean White Theme
COLORS = {
    "bg_primary": "#ffffff",       # Main background (white)
    "bg_secondary": "#f5f5f5",     # Secondary background (light gray)
    "bg_tertiary": "#e0e0e0",      # Tertiary/hover background
    "surface": "#fafafa",          # Surface color
    "text_primary": "#212121",     # Primary text (dark)
    "text_secondary": "#616161",   # Secondary text
    "text_muted": "#9e9e9e",       # Muted text
    "accent": "#1976d2",           # Accent blue
    "accent_hover": "#1565c0",     # Accent hover
    "success": "#388e3c",          # Success green
    "warning": "#f57c00",          # Warning orange
    "error": "#d32f2f",            # Error red
    "border": "#e0e0e0",           # Border color
}

# Syntax Highlighting Colors
SYNTAX_COLORS = {
    "command": "#1976d2",          # LaTeX commands (\command)
    "environment": "#388e3c",      # Environment names
    "math": "#7b1fa2",             # Math mode (purple)
    "comment": "#9e9e9e",          # Comments
    "brace": "#e65100",            # Braces {}
    "bracket": "#0097a7",          # Brackets []
    "string": "#c2185b",           # Strings
}

# Main application stylesheet - Simple White Theme
MAIN_STYLESHEET = f"""
QMainWindow, QWidget {{
    background-color: {COLORS["bg_primary"]};
    color: {COLORS["text_primary"]};
    font-family: "Segoe UI", "SF Pro Display", sans-serif;
    font-size: 13px;
}}

QScrollArea {{
    background-color: {COLORS["bg_primary"]};
    border: none;
}}

QScrollBar:vertical {{
    background-color: {COLORS["bg_secondary"]};
    width: 10px;
    margin: 0px;
}}

QScrollBar::handle:vertical {{
    background-color: {COLORS["bg_tertiary"]};
    min-height: 30px;
}}

QScrollBar::handle:vertical:hover {{
    background-color: {COLORS["accent"]};
}}

QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
    height: 0px;
}}

QScrollBar:horizontal {{
    background-color: {COLORS["bg_secondary"]};
    height: 10px;
    margin: 0px;
}}

QScrollBar::handle:horizontal {{
    background-color: {COLORS["bg_tertiary"]};
    min-width: 30px;
}}

QScrollBar::handle:horizontal:hover {{
    background-color: {COLORS["accent"]};
}}

QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {{
    width: 0px;
}}

QLineEdit {{
    background-color: {COLORS["bg_primary"]};
    color: {COLORS["text_primary"]};
    border: 1px solid {COLORS["border"]};
    padding: 8px 12px;
    font-size: 14px;
}}

QLineEdit:focus {{
    border: 2px solid {COLORS["accent"]};
}}

QPushButton {{
    background-color: {COLORS["bg_secondary"]};
    color: {COLORS["text_primary"]};
    border: 1px solid {COLORS["border"]};
    padding: 8px 16px;
    font-weight: 500;
}}

QPushButton:hover {{
    background-color: {COLORS["bg_tertiary"]};
}}

QPushButton:pressed {{
    background-color: {COLORS["accent"]};
    color: white;
}}

QPushButton#compileBtn {{
    background-color: {COLORS["accent"]};
    color: white;
    border: none;
    font-weight: 600;
}}

QPushButton#compileBtn:hover {{
    background-color: {COLORS["accent_hover"]};
}}

QPushButton#downloadBtn {{
    background-color: {COLORS["success"]};
    color: white;
    border: none;
    font-weight: 600;
}}

QPushButton#downloadBtn:hover {{
    background-color: #2e7d32;
}}

QPushButton#downloadBtn:disabled {{
    background-color: {COLORS["bg_tertiary"]};
    color: {COLORS["text_muted"]};
}}

QPushButton#addPaneBtn {{
    background-color: {COLORS["accent"]};
    color: white;
    border: none;
    padding: 8px 16px;
}}

QPushButton#addPaneBtn:hover {{
    background-color: {COLORS["accent_hover"]};
}}

QPlainTextEdit {{
    background-color: {COLORS["bg_primary"]};
    color: {COLORS["text_primary"]};
    border: 1px solid {COLORS["border"]};
    padding: 8px;
    font-family: "Cascadia Code", "Consolas", "Courier New", monospace;
    font-size: 13px;
}}

QPlainTextEdit:focus {{
    border: 2px solid {COLORS["accent"]};
}}

QLabel {{
    color: {COLORS["text_primary"]};
}}

QLabel#paneTitle {{
    font-size: 14px;
    font-weight: 600;
    color: {COLORS["accent"]};
}}

QLabel#statusLabel {{
    font-size: 12px;
    color: {COLORS["text_secondary"]};
    padding: 5px;
}}

QFrame#paneContainer {{
    background-color: {COLORS["bg_primary"]};
    border: 1px solid {COLORS["border"]};
}}

QFrame#previewFrame {{
    background-color: {COLORS["surface"]};
    border: 1px solid {COLORS["border"]};
}}

QSplitter::handle {{
    background-color: {COLORS["border"]};
    width: 3px;
}}

QSplitter::handle:hover {{
    background-color: {COLORS["accent"]};
}}

QMenuBar {{
    background-color: {COLORS["bg_secondary"]};
    color: {COLORS["text_primary"]};
    padding: 2px;
}}

QMenuBar::item:selected {{
    background-color: {COLORS["bg_tertiary"]};
}}

QMenu {{
    background-color: {COLORS["bg_primary"]};
    color: {COLORS["text_primary"]};
    border: 1px solid {COLORS["border"]};
    padding: 5px;
}}

QMenu::item:selected {{
    background-color: {COLORS["accent"]};
    color: white;
}}

QCheckBox {{
    color: {COLORS["text_secondary"]};
    spacing: 5px;
}}

QCheckBox::indicator {{
    width: 16px;
    height: 16px;
    border: 1px solid {COLORS["border"]};
    background-color: {COLORS["bg_primary"]};
}}

QCheckBox::indicator:checked {{
    background-color: {COLORS["accent"]};
    border-color: {COLORS["accent"]};
}}

QStatusBar {{
    background-color: {COLORS["bg_secondary"]};
    color: {COLORS["text_secondary"]};
    border-top: 1px solid {COLORS["border"]};
}}
"""
