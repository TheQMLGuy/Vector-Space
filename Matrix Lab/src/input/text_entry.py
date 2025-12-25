"""
Text Entry Widget
Parses matrix from text input supporting MATLAB and Python syntax.
"""

from PySide6.QtWidgets import (QWidget, QVBoxLayout, QTextEdit, QPushButton,
                               QLabel, QHBoxLayout)
from PySide6.QtCore import Signal
from PySide6.QtGui import QFont
import numpy as np
import re


class TextEntryWidget(QWidget):
    """Widget for text-based matrix input."""
    
    matrix_ready = Signal(np.ndarray)
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_ui()
    
    def setup_ui(self):
        """Initialize the UI components."""
        layout = QVBoxLayout(self)
        
        # Instructions
        info_label = QLabel(
            "Enter matrix using MATLAB syntax: [1 2 3; 4 5 6; 7 8 9]\n"
            "Or Python syntax: [[1,2,3],[4,5,6],[7,8,9]]"
        )
        info_label.setStyleSheet("font-size: 10pt; color: #666;")
        layout.addWidget(info_label)
        
        # Text editor
        self.text_edit = QTextEdit()
        self.text_edit.setPlaceholderText("[1 2; 3 4]")
        self.text_edit.setMaximumHeight(200)
        font = QFont("Courier New", 11)
        self.text_edit.setFont(font)
        layout.addWidget(self.text_edit)
        
        # Error label
        self.error_label = QLabel("")
        self.error_label.setStyleSheet("color: red; font-weight: bold;")
        layout.addWidget(self.error_label)
        
        # Buttons
        btn_layout = QHBoxLayout()
        
        clear_btn = QPushButton("Clear")
        clear_btn.clicked.connect(self.clear_text)
        btn_layout.addWidget(clear_btn)
        
        example_matlab_btn = QPushButton("Example (MATLAB)")
        example_matlab_btn.clicked.connect(self.insert_matlab_example)
        btn_layout.addWidget(example_matlab_btn)
        
        example_python_btn = QPushButton("Example (Python)")
        example_python_btn.clicked.connect(self.insert_python_example)
        btn_layout.addWidget(example_python_btn)
        
        btn_layout.addStretch()
        
        parse_btn = QPushButton("Parse & Use Matrix")
        parse_btn.setStyleSheet("font-weight: bold;")
        parse_btn.clicked.connect(self.parse_and_emit)
        btn_layout.addWidget(parse_btn)
        
        layout.addLayout(btn_layout)
        layout.addStretch()
    
    def parse_matrix(self, text: str) -> np.ndarray:
        """
        Parse matrix from text supporting MATLAB and Python syntax.
        
        Args:
            text: Input text string
            
        Returns:
            NumPy array or None if parsing fails
        """
        text = text.strip()
        
        # Try MATLAB syntax: [1 2 3; 4 5 6]
        if text.startswith('[') and ';' in text:
            return self.parse_matlab_syntax(text)
        
        # Try Python syntax: [[1,2,3],[4,5,6]]
        elif text.startswith('[['):
            return self.parse_python_syntax(text)
        
        # Try simple bracket syntax: [1 2 3]
        elif text.startswith('[') and ']' in text:
            return self.parse_matlab_syntax(text)
        
        return None
    
    def parse_matlab_syntax(self, text: str) -> np.ndarray:
        """Parse MATLAB-style matrix syntax."""
        try:
            # Remove outer brackets
            text = text.strip('[]').strip()
            
            # Split by semicolons for rows
            rows = text.split(';')
            
            matrix_data = []
            for row in rows:
                # Split by spaces or commas
                values = re.split(r'[\s,]+', row.strip())
                values = [v for v in values if v]  # Remove empty strings
                
                row_data = [float(v) for v in values]
                matrix_data.append(row_data)
            
            return np.array(matrix_data)
        except:
            return None
    
    def parse_python_syntax(self, text: str) -> np.ndarray:
        """Parse Python-style matrix syntax."""
        try:
            # Use eval (safe for numeric lists only)
            matrix_data = eval(text)
            return np.array(matrix_data, dtype=float)
        except:
            return None
    
    def parse_and_emit(self):
        """Parse text and emit matrix if valid."""
        text = self.text_edit.toPlainText()
        
        if not text.strip():
            self.error_label.setText("Error: Empty input")
            return
        
        matrix = self.parse_matrix(text)
        
        if matrix is None:
            self.error_label.setText("Error: Invalid matrix syntax")
        elif matrix.size == 0:
            self.error_label.setText("Error: Empty matrix")
        else:
            self.error_label.setText("")
            self.matrix_ready.emit(matrix)
    
    def clear_text(self):
        """Clear text editor."""
        self.text_edit.clear()
        self.error_label.setText("")
    
    def insert_matlab_example(self):
        """Insert MATLAB syntax example."""
        self.text_edit.setPlainText("[1 2 3; 4 5 6; 7 8 9]")
    
    def insert_python_example(self):
        """Insert Python syntax example."""
        self.text_edit.setPlainText("[[1,2,3],[4,5,6],[7,8,9]]")
