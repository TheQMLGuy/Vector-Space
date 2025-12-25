"""
Complex Number Input Widget
Allows entering complex numbers in format: a+bj or a-bj
"""

from PySide6.QtWidgets import QLineEdit
from PySide6.QtCore import Signal
from PySide6.QtGui import QValidator
import numpy as np


class ComplexValidator(QValidator):
    """Validates complex number input."""
    
    def validate(self, text, pos):
        """Validate complex number format."""
        if not text:
            return QValidator.Acceptable, text, pos
        
        try:
            # Try to parse as complex
            complex(text.replace('i', 'j').replace('I', 'j'))
            return QValidator.Acceptable, text, pos
        except:
            # Allow intermediate states
            if text in ['+', '-', '.', 'j', 'i', 'J', 'I']:
                return QValidator.Intermediate, text, pos
            return QValidator.Intermediate, text, pos
    
    def fixup(self, text):
        """Try to fix invalid input."""
        return text


class ComplexLineEdit(QLineEdit):
    """Line edit for complex numbers."""
    
    valueChanged = Signal()
    
    def __init__(self, default_value=0+0j, parent=None):
        super().__init__(parent)
        
        self.setValidator(ComplexValidator())
        self.setText(self.format_complex(default_value))
        self.textChanged.connect(lambda: self.valueChanged.emit())
        
        self.setPlaceholderText("e.g., 1+2j or 0.5-3i")
    
    def format_complex(self, value):
        """Format complex number for display."""
        if isinstance(value, (int, float)):
            return str(value)
        
        real = value.real
        imag = value.imag
        
        if imag == 0:
            return str(real)
        elif real == 0:
            return f"{imag}j"
        else:
            sign = '+' if imag >= 0 else ''
            return f"{real}{sign}{imag}j"
    
    def value(self):
        """Get complex value."""
        text = self.text().strip()
        if not text:
            return 0+0j
        
        try:
            # Replace i with j for Python
            text = text.replace('i', 'j').replace('I', 'j')
            return complex(text)
        except:
            return 0+0j
    
    def setValue(self, value):
        """Set complex value."""
        self.setText(self.format_complex(value))
