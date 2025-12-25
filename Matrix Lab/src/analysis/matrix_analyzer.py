"""
Matrix Analysis Engine
Computes matrix properties, classifications, and decompositions.
"""

import numpy as np
from scipy import linalg
from typing import Dict, Tuple, Optional, List


class MatrixAnalyzer:
    """Static methods for analyzing matrix properties."""
    
    @staticmethod
    def compute_basic_properties(matrix: np.ndarray) -> Dict:
        """
        Compute basic matrix properties.
        
        Args:
            matrix: Input matrix
            
        Returns:
            Dictionary with determinant, trace, rank, nullity
        """
        try:
            det = np.linalg.det(matrix) if matrix.shape[0] == matrix.shape[1] else None
        except:
            det = None
        
        try:
            trace = np.trace(matrix) if matrix.shape[0] == matrix.shape[1] else None
        except:
            trace = None
        
        try:
            rank = np.linalg.matrix_rank(matrix)
        except:
            rank = None
        
        nullity = min(matrix.shape) - rank if rank is not None else None
        
        return {
            'determinant': det,
            'trace': trace,
            'rank': rank,
            'nullity': nullity,
            'rows': matrix.shape[0],
            'cols': matrix.shape[1]
        }
    
    @staticmethod
    def compute_norms(matrix: np.ndarray) -> Dict:
        """
        Compute various matrix norms.
        
        Args:
            matrix: Input matrix
            
        Returns:
            Dictionary with Frobenius, 1-norm, 2-norm, inf-norm
        """
        return {
            'frobenius': np.linalg.norm(matrix, 'fro'),
            'norm_1': np.linalg.norm(matrix, 1),
            'norm_2': np.linalg.norm(matrix, 2),
            'norm_inf': np.linalg.norm(matrix, np.inf)
        }
    
    @staticmethod
    def compute_condition_number(matrix: np.ndarray) -> Optional[float]:
        """
        Compute condition number.
        
        Args:
            matrix: Input matrix
            
        Returns:
            Condition number or None if not square/singular
        """
        if matrix.shape[0] != matrix.shape[1]:
            return None
        
        try:
            return np.linalg.cond(matrix)
        except:
            return None
    
    @staticmethod
    def compute_eigenanalysis(matrix: np.ndarray) -> Optional[Dict]:
        """
        Compute eigenvalues and eigenvectors.
        
        Args:
            matrix: Input matrix (must be square)
            
        Returns:
            Dictionary with eigenvalues and eigenvectors, or None if not square
        """
        if matrix.shape[0] != matrix.shape[1]:
            return None
        
        try:
            eigenvalues, eigenvectors = np.linalg.eig(matrix)
            return {
                'eigenvalues': eigenvalues,
                'eigenvectors': eigenvectors
            }
        except:
            return None
    
    @staticmethod
    def compute_svd(matrix: np.ndarray) -> Dict:
        """
        Compute Singular Value Decomposition.
        
        Args:
            matrix: Input matrix
            
        Returns:
            Dictionary with singular values
        """
        try:
            U, s, Vh = np.linalg.svd(matrix)
            return {
                'singular_values': s,
                'U': U,
                'Vh': Vh
            }
        except:
            return None
    
    @staticmethod
    def is_symmetric(matrix: np.ndarray, tol: float = 1e-10) -> bool:
        """Check if matrix is symmetric."""
        if matrix.shape[0] != matrix.shape[1]:
            return False
        return np.allclose(matrix, matrix.T, atol=tol)
    
    @staticmethod
    def is_orthogonal(matrix: np.ndarray, tol: float = 1e-10) -> bool:
        """Check if matrix is orthogonal (Q^T Q = I)."""
        if matrix.shape[0] != matrix.shape[1]:
            return False
        
        try:
            product = matrix.T @ matrix
            identity = np.eye(matrix.shape[0])
            return np.allclose(product, identity, atol=tol)
        except:
            return False
    
    @staticmethod
    def is_diagonal(matrix: np.ndarray, tol: float = 1e-10) -> bool:
        """Check if matrix is diagonal."""
        if matrix.shape[0] != matrix.shape[1]:
            return False
        
        # Check if all off-diagonal elements are zero
        return np.allclose(matrix - np.diag(np.diagonal(matrix)), 0, atol=tol)
    
    @staticmethod
    def is_identity(matrix: np.ndarray, tol: float = 1e-10) -> bool:
        """Check if matrix is identity."""
        if matrix.shape[0] != matrix.shape[1]:
            return False
        return np.allclose(matrix, np.eye(matrix.shape[0]), atol=tol)
    
    @staticmethod
    def is_upper_triangular(matrix: np.ndarray, tol: float = 1e-10) -> bool:
        """Check if matrix is upper triangular."""
        if matrix.shape[0] != matrix.shape[1]:
            return False
        return np.allclose(np.tril(matrix, -1), 0, atol=tol)
    
    @staticmethod
    def is_lower_triangular(matrix: np.ndarray, tol: float = 1e-10) -> bool:
        """Check if matrix is lower triangular."""
        if matrix.shape[0] != matrix.shape[1]:
            return False
        return np.allclose(np.triu(matrix, 1), 0, atol=tol)
    
    @staticmethod
    def is_positive_definite(matrix: np.ndarray) -> bool:
        """Check if matrix is positive definite."""
        if matrix.shape[0] != matrix.shape[1]:
            return False
        
        if not MatrixAnalyzer.is_symmetric(matrix):
            return False
        
        try:
            # Try Cholesky decomposition
            np.linalg.cholesky(matrix)
            return True
        except np.linalg.LinAlgError:
            return False
    
    @staticmethod
    def is_invertible(matrix: np.ndarray, tol: float = 1e-10) -> bool:
        """Check if matrix is invertible (non-singular)."""
        if matrix.shape[0] != matrix.shape[1]:
            return False
        
        try:
            det = np.linalg.det(matrix)
            return abs(det) > tol
        except:
            return False
    
    @staticmethod
    def is_toeplitz(matrix: np.ndarray, tol: float = 1e-10) -> bool:
        """
        Check if matrix is Toeplitz (constant diagonals).
        Each descending diagonal from left to right is constant.
        """
        if matrix.shape[0] != matrix.shape[1]:
            return False
        
        n = matrix.shape[0]
        for i in range(n - 1):
            for j in range(n - 1):
                if not np.isclose(matrix[i, j], matrix[i+1, j+1], atol=tol):
                    return False
        return True
    
    @staticmethod
    def is_vandermonde(matrix: np.ndarray, tol: float = 1e-10) -> bool:
        """
        Check if matrix is Vandermonde.
        M[i,j] = alpha[i]^j for some vector alpha
        """
        if matrix.shape[0] < 2 or matrix.shape[1] < 2:
            return False
        
        # Extract potential alpha values from first column
        # (assuming power 0, so all should be 1)
        if not np.allclose(matrix[:, 0], 1, atol=tol):
            return False
        
        # Get alpha from second column (power 1)
        alpha = matrix[:, 1]
        
        # Check if subsequent columns follow Vandermonde pattern
        for j in range(2, matrix.shape[1]):
            expected = alpha ** j
            if not np.allclose(matrix[:, j], expected, atol=tol):
                return False
        
        return True
    
    @staticmethod
    def classify_matrix(matrix: np.ndarray) -> Dict[str, bool]:
        """
        Classify matrix into various types.
        
        Args:
            matrix: Input matrix
            
        Returns:
            Dictionary of boolean classifications
        """
        is_square = matrix.shape[0] == matrix.shape[1]
        
        classification = {
            'square': is_square,
            'symmetric': MatrixAnalyzer.is_symmetric(matrix) if is_square else False,
            'orthogonal': MatrixAnalyzer.is_orthogonal(matrix) if is_square else False,
            'diagonal': MatrixAnalyzer.is_diagonal(matrix) if is_square else False,
            'identity': MatrixAnalyzer.is_identity(matrix) if is_square else False,
            'upper_triangular': MatrixAnalyzer.is_upper_triangular(matrix) if is_square else False,
            'lower_triangular': MatrixAnalyzer.is_lower_triangular(matrix) if is_square else False,
            'positive_definite': MatrixAnalyzer.is_positive_definite(matrix) if is_square else False,
            'invertible': MatrixAnalyzer.is_invertible(matrix) if is_square else False,
            'toeplitz': MatrixAnalyzer.is_toeplitz(matrix) if is_square else False,
            'vandermonde': MatrixAnalyzer.is_vandermonde(matrix)
        }
        
        return classification
    
    @staticmethod
    def analyze_full(matrix: np.ndarray) -> Dict:
        """
        Perform complete analysis of matrix.
        
        Args:
            matrix: Input matrix
            
        Returns:
            Dictionary with all properties and classifications
        """
        result = {
            'basic_properties': MatrixAnalyzer.compute_basic_properties(matrix),
            'norms': MatrixAnalyzer.compute_norms(matrix),
            'condition_number': MatrixAnalyzer.compute_condition_number(matrix),
            'classification': MatrixAnalyzer.classify_matrix(matrix)
        }
        
        # Add eigenanalysis for square matrices
        if matrix.shape[0] == matrix.shape[1]:
            eigen = MatrixAnalyzer.compute_eigenanalysis(matrix)
            if eigen:
                result['eigenanalysis'] = eigen
        
        # Add SVD
        svd = MatrixAnalyzer.compute_svd(matrix)
        if svd:
            result['svd'] = svd
        
        return result
