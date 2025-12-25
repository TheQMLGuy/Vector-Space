"""
Unit tests for input parsers.
"""

import pytest
import numpy as np
from src.input.text_entry import TextEntryWidget
from PySide6.QtWidgets import QApplication


# Create QApplication for widgets
app = QApplication.instance()
if app is None:
    app = QApplication([])


def test_parse_matlab_syntax():
    """Test MATLAB syntax parsing."""
    widget = TextEntryWidget()
    
    # Simple 2x2
    result = widget.parse_matrix("[1 2; 3 4]")
    expected = np.array([[1, 2], [3, 4]])
    np.testing.assert_array_equal(result, expected)
    
    # 3x3
    result = widget.parse_matrix("[1 2 3; 4 5 6; 7 8 9]")
    assert result.shape == (3, 3)


def test_parse_python_syntax():
    """Test Python syntax parsing."""
    widget = TextEntryWidget()
    
    # Simple 2x2
    result = widget.parse_matrix("[[1,2],[3,4]]")
    expected = np.array([[1, 2], [3, 4]])
    np.testing.assert_array_equal(result, expected)
    
    # 3x3
    result = widget.parse_matrix("[[1,2,3],[4,5,6],[7,8,9]]")
    assert result.shape == (3, 3)


def test_parse_invalid_syntax():
    """Test that invalid syntax returns None."""
    widget = TextEntryWidget()
    
    result = widget.parse_matrix("invalid")
    assert result is None
    
    result = widget.parse_matrix("[1, 2, 3")  # Missing bracket
    assert result is None


def test_parse_floats():
    """Test parsing floating point numbers."""
    widget = TextEntryWidget()
    
    result = widget.parse_matrix("[1.5 2.7; 3.2 4.8]")
    assert result is not None
    assert result[0, 0] == pytest.approx(1.5)
    assert result[1, 1] == pytest.approx(4.8)


def test_validators():
    """Test input validators."""
    from src.utils.validators import Validators
    
    # Valid names
    assert Validators.validate_matrix_name("Matrix1") is True
    assert Validators.validate_matrix_name("test_matrix") is True
    assert Validators.validate_matrix_name("_private") is True
    
    # Invalid names
    assert Validators.validate_matrix_name("") is False
    assert Validators.validate_matrix_name("123matrix") is False
    assert Validators.validate_matrix_name("matrix name") is False
    assert Validators.validate_matrix_name("matrix-name") is False
    
    # Numeric validation
    assert Validators.validate_numeric("123") is True
    assert Validators.validate_numeric("12.34") is True
    assert Validators.validate_numeric("-56.78") is True
    assert Validators.validate_numeric("abc") is False
