"""
Unit tests for MatrixStorage class.
"""

import pytest
import numpy as np
import os
from src.storage.matrix_storage import MatrixStorage


@pytest.fixture
def storage():
    """Create a test storage instance with temporary database."""
    db_path = "test_matrix_lab.db"
    
    # Clean up if exists
    if os.path.exists(db_path):
        os.remove(db_path)
    
    storage = MatrixStorage(db_path)
    yield storage
    
    # Cleanup after test
    if os.path.exists(db_path):
        os.remove(db_path)


def test_save_and_load(storage):
    """Test saving and loading a matrix."""
    matrix = np.array([[1, 2], [3, 4]])
    
    # Save
    success = storage.save("test_matrix", matrix)
    assert success is True
    
    # Load
    loaded = storage.load("test_matrix")
    assert loaded is not None
    np.testing.assert_array_equal(loaded, matrix)


def test_duplicate_name(storage):
    """Test that duplicate names are rejected."""
    matrix = np.array([[1, 2], [3, 4]])
    
    storage.save("test_matrix", matrix)
    success = storage.save("test_matrix", matrix)
    
    assert success is False


def test_update(storage):
    """Test updating an existing matrix."""
    matrix1 = np.array([[1, 2], [3, 4]])
    matrix2 = np.array([[5, 6], [7, 8]])
    
    storage.save("test_matrix", matrix1)
    success = storage.update("test_matrix", matrix2)
    
    assert success is True
    
    loaded = storage.load("test_matrix")
    np.testing.assert_array_equal(loaded, matrix2)


def test_delete(storage):
    """Test deleting a matrix."""
    matrix = np.array([[1, 2], [3, 4]])
    
    storage.save("test_matrix", matrix)
    success = storage.delete("test_matrix")
    
    assert success is True
    
    loaded = storage.load("test_matrix")
    assert loaded is None


def test_list_all(storage):
    """Test listing all matrices."""
    matrix1 = np.array([[1, 2], [3, 4]])
    matrix2 = np.array([[5, 6, 7], [8, 9, 10]])
    
    storage.save("matrix_1", matrix1)
    storage.save("matrix_2", matrix2)
    
    all_matrices = storage.list_all()
    
    assert len(all_matrices) == 2
    assert any(m['name'] == 'matrix_1' for m in all_matrices)
    assert any(m['name'] == 'matrix_2' for m in all_matrices)


def test_search(storage):
    """Test searching for matrices."""
    matrix = np.array([[1, 2], [3, 4]])
    
    storage.save("test_matrix_1", matrix)
    storage.save("test_matrix_2", matrix)
    storage.save("other_matrix", matrix)
    
    results = storage.search("test")
    
    assert len(results) == 2


def test_toggle_favorite(storage):
    """Test toggling favorite status."""
    matrix = np.array([[1, 2], [3, 4]])
    
    storage.save("test_matrix", matrix)
    
    # Toggle to favorite
    status = storage.toggle_favorite("test_matrix")
    assert status is True
    
    # Toggle back
    status = storage.toggle_favorite("test_matrix")
    assert status is False


def test_get_favorites(storage):
    """Test getting only favorite matrices."""
    matrix = np.array([[1, 2], [3, 4]])
    
    storage.save("matrix_1", matrix)
    storage.save("matrix_2", matrix)
    
    storage.toggle_favorite("matrix_1")
    
    favorites = storage.get_favorites()
    
    assert len(favorites) == 1
    assert favorites[0]['name'] == 'matrix_1'
