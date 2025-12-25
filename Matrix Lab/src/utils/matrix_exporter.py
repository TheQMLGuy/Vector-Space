"""
Matrix Export Utilities
Export matrices to various formats.
"""

import numpy as np


class MatrixExporter:
    """Export matrices to various formats."""
    
    @staticmethod
    def to_csv(matrix, filename=None, delimiter=','):
        """Export matrix to CSV format."""
        content = '\n'.join([delimiter.join([str(x) for x in row]) for row in matrix])
        if filename:
            with open(filename, 'w') as f:
                f.write(content)
        return content
    
    @staticmethod
    def to_latex(matrix, env='bmatrix', precision=4):
        """
        Export matrix to LaTeX format.
        
        Args:
            matrix: NumPy array
            env: 'bmatrix', 'pmatrix', 'vmatrix', etc.
            precision: Decimal places
            
        Returns:
            LaTeX string
        """
        rows, cols = matrix.shape
        lines = []
        lines.append(f"\\begin{{{env}}}")
        
        for i in range(rows):
            row_str = " & ".join([f"{matrix[i,j]:.{precision}g}" for j in range(cols)])
            lines.append(row_str + " \\\\")
        
        lines.append(f"\\end{{{env}}}")
        return '\n'.join(lines)
    
    @staticmethod
    def to_numpy_string(matrix):
        """Export as NumPy array literal."""
        return f"np.array({matrix.tolist()})"
    
    @staticmethod
    def to_mathematica(matrix):
        """Export to Mathematica format."""
        rows = []
        for row in matrix:
            row_str = ", ".join([str(x) for x in row])
            rows.append("{" + row_str + "}")
        return "{" + ", ".join(rows) + "}"
    
    @staticmethod
    def to_matlab(matrix, var_name='A'):
        """Export to MATLAB format."""
        rows = []
        for row in matrix:
            row_str = " ".join([str(x) for x in row])
            rows.append(row_str)
        return f"{var_name} = [" + "; ".join(rows) + "];"
    
    @staticmethod
    def to_python_list(matrix):
        """Export as Python nested list."""
        return str(matrix.tolist())
    
    @staticmethod
    def to_markdown_table(matrix, precision=4):
        """Export as Markdown table."""
        rows, cols = matrix.shape
        lines = []
        
        # Header
        header = "| " + " | ".join([f"Col {j+1}" for j in range(cols)]) + " |"
        lines.append(header)
        lines.append("|" + "|".join(["---"] * cols) + "|")
        
        # Data
        for i in range(rows):
            row_str = "| " + " | ".join([f"{matrix[i,j]:.{precision}g}" for j in range(cols)]) + " |"
            lines.append(row_str)
        
        return '\n'.join(lines)
    
    @staticmethod
    def save_npy(matrix, filename):
        """Save as NumPy binary file."""
        np.save(filename, matrix)
    
    @staticmethod
    def save_npz(matrices_dict, filename):
        """Save multiple matrices to compressed NumPy file."""
        np.savez_compressed(filename, **matrices_dict)
