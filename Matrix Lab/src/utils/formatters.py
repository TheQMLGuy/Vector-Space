"""
Formatting Utilities
Display formatting for numbers and matrices.
"""

import numpy as np


class Formatters:
    """Static methods for formatting display values."""
    
    @staticmethod
    def format_number(value: float, precision: int = 4) -> str:
        """
        Format number for display with appropriate precision.
        
        Args:
            value: Number to format
            precision: Decimal places
            
        Returns:
            Formatted string
        """
        if value is None:
            return "N/A"
        
        if np.isnan(value) or np.isinf(value):
            return str(value)
        
        # Use scientific notation for very large/small numbers
        if abs(value) >= 1e6 or (abs(value) < 1e-3 and value != 0):
            return f"{value:.{precision}e}"
        
        return f"{value:.{precision}f}".rstrip('0').rstrip('.')
    
    @staticmethod
    def format_complex(value: complex, precision: int = 4) -> str:
        """
        Format complex number for display.
        
        Args:
            value: Complex number
            precision: Decimal places
            
        Returns:
            Formatted string
        """
        real = Formatters.format_number(value.real, precision)
        imag = Formatters.format_number(abs(value.imag), precision)
        sign = '+' if value.imag >= 0 else '-'
        return f"{real} {sign} {imag}i"
    
    @staticmethod
    def format_matrix_shape(matrix: np.ndarray) -> str:
        """
        Format matrix dimensions as string.
        
        Args:
            matrix: NumPy array
            
        Returns:
            String like "3×4"
        """
        return f"{matrix.shape[0]}×{matrix.shape[1]}"
    
    @staticmethod
    def matrix_to_string(matrix: np.ndarray, precision: int = 4) -> str:
        """
        Convert matrix to formatted string.
        
        Args:
            matrix: NumPy array
            precision: Decimal places
            
        Returns:
            Formatted matrix string
        """
        rows = []
        for row in matrix:
            formatted_row = [Formatters.format_number(val, precision) for val in row]
            rows.append("  ".join(formatted_row))
        
        return "\n".join(rows)
