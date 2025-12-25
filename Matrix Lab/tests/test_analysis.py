"""
Unit tests for MatrixAnalyzer class.
"""

import pytest
import numpy as np
from src.analysis.matrix_analyzer import MatrixAnalyzer


def test_basic_properties_square():
    """Test basic properties for square matrix."""
    matrix = np.array([[1, 2], [3, 4]])
    
    props = MatrixAnalyzer.compute_basic_properties(matrix)
    
    assert props['rows'] == 2
    assert props['cols'] == 2
    assert props['determinant'] is not None
    assert props['trace'] == 5
    assert props['rank'] == 2


def test_basic_properties_rectangular():
    """Test basic properties for rectangular matrix."""
    matrix = np.array([[1, 2, 3], [4, 5, 6]])
    
    props = MatrixAnalyzer.compute_basic_properties(matrix)
    
    assert props['rows'] == 2
    assert props['cols'] == 3
    assert props['determinant'] is None  # Not square
    assert props['trace'] is None  # Not square


def test_norms():
    """Test norm calculations."""
    matrix = np.array([[1, 2], [3, 4]])
    
    norms = MatrixAnalyzer.compute_norms(matrix)
    
    assert 'frobenius' in norms
    assert 'norm_1' in norms
    assert 'norm_2' in norms
    assert 'norm_inf' in norms
    assert all(v > 0 for v in norms.values())


def test_is_symmetric():
    """Test symmetric matrix detection."""
    symmetric = np.array([[1, 2], [2, 1]])
    not_symmetric = np.array([[1, 2], [3, 4]])
    
    assert MatrixAnalyzer.is_symmetric(symmetric) is True
    assert MatrixAnalyzer.is_symmetric(not_symmetric) is False


def test_is_diagonal():
    """Test diagonal matrix detection."""
    diagonal = np.array([[1, 0], [0, 2]])
    not_diagonal = np.array([[1, 2], [3, 4]])
    
    assert MatrixAnalyzer.is_diagonal(diagonal) is True
    assert MatrixAnalyzer.is_diagonal(not_diagonal) is False


def test_is_identity():
    """Test identity matrix detection."""
    identity = np.eye(3)
    not_identity = np.array([[1, 0], [0, 2]])
    
    assert MatrixAnalyzer.is_identity(identity) is True
    assert MatrixAnalyzer.is_identity(not_identity) is False


def test_is_orthogonal():
    """Test orthogonal matrix detection."""
    # Rotation matrix (orthogonal)
    theta = np.pi / 4
    rotation = np.array([
        [np.cos(theta), -np.sin(theta)],
        [np.sin(theta), np.cos(theta)]
    ])
    
    not_orthogonal = np.array([[1, 2], [3, 4]])
    
    assert MatrixAnalyzer.is_orthogonal(rotation) is True
    assert MatrixAnalyzer.is_orthogonal(not_orthogonal) is False


def test_is_triangular():
    """Test triangular matrix detection."""
    upper = np.array([[1, 2, 3], [0, 4, 5], [0, 0, 6]])
    lower = np.array([[1, 0, 0], [2, 3, 0], [4, 5, 6]])
    neither = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    
    assert MatrixAnalyzer.is_upper_triangular(upper) is True
    assert MatrixAnalyzer.is_lower_triangular(lower) is True
    assert MatrixAnalyzer.is_upper_triangular(neither) is False
    assert MatrixAnalyzer.is_lower_triangular(neither) is False


def test_is_positive_definite():
    """Test positive definite detection."""
    # Positive definite matrix
    pos_def = np.array([[2, -1], [-1, 2]])
    
    # Not positive definite
    not_pos_def = np.array([[1, 2], [2, 1]])
    
    assert MatrixAnalyzer.is_positive_definite(pos_def) is True
    assert MatrixAnalyzer.is_positive_definite(not_pos_def) is False


def test_is_invertible():
    """Test invertible matrix detection."""
    invertible = np.array([[1, 2], [3, 4]])
    singular = np.array([[1, 2], [2, 4]])
    
    assert MatrixAnalyzer.is_invertible(invertible) is True
    assert MatrixAnalyzer.is_invertible(singular) is False


def test_eigenanalysis():
    """Test eigenvalue/eigenvector computation."""
    matrix = np.array([[1, 2], [2, 1]])
    
    eigen = MatrixAnalyzer.compute_eigenanalysis(matrix)
    
    assert eigen is not None
    assert 'eigenvalues' in eigen
    assert 'eigenvectors' in eigen
    assert len(eigen['eigenvalues']) == 2


def test_eigenanalysis_non_square():
    """Test eigenanalysis returns None for non-square matrix."""
    matrix = np.array([[1, 2, 3], [4, 5, 6]])
    
    eigen = MatrixAnalyzer.compute_eigenanalysis(matrix)
    
    assert eigen is None


def test_classify_identity():
    """Test classification of identity matrix."""
    identity = np.eye(3)
    
    classification = MatrixAnalyzer.classify_matrix(identity)
    
    assert classification['square'] is True
    assert classification['symmetric'] is True
    assert classification['diagonal'] is True
    assert classification['identity'] is True
    assert classification['orthogonal'] is True
    assert classification['invertible'] is True


def test_analyze_full():
    """Test full analysis."""
    matrix = np.array([[1, 2], [3, 4]])
    
    analysis = MatrixAnalyzer.analyze_full(matrix)
    
    assert 'basic_properties' in analysis
    assert 'norms' in analysis
    assert 'classification' in analysis
    assert 'eigenanalysis' in analysis
