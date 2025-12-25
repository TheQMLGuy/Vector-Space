"""
Validation Utilities
Input validation for matrix operations.
"""

import re


class Validators:
    """Static methods for input validation."""
    
    @staticmethod
    def validate_matrix_name(name: str) -> bool:
        """
        Validate matrix name (alphanumeric + underscores, no spaces).
        
        Args:
            name: Matrix name to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not name or len(name) == 0:
            return False
        
        # Must start with letter or underscore
        if not (name[0].isalpha() or name[0] == '_'):
            return False
        
        # Only alphanumeric and underscores allowed
        pattern = r'^[a-zA-Z_][a-zA-Z0-9_]*$'
        return bool(re.match(pattern, name))
    
    @staticmethod
    def validate_dimensions(rows: int, cols: int, min_size: int = 1, max_size: int = 100) -> bool:
        """
        Validate matrix dimensions.
        
        Args:
            rows: Number of rows
            cols: Number of columns
            min_size: Minimum dimension
            max_size: Maximum dimension
            
        Returns:
            True if valid, False otherwise
        """
        return (min_size <= rows <= max_size and 
                min_size <= cols <= max_size)
    
    @staticmethod
    def validate_numeric(value: str) -> bool:
        """
        Validate if string can be converted to float.
        
        Args:
            value: String to validate
            
        Returns:
            True if numeric, False otherwise
        """
        try:
            float(value)
            return True
        except ValueError:
            return False
