"""
Matrix Storage System
Handles persistent storage of matrices using SQLite database.
"""

import sqlite3
import pickle
import json
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import numpy as np


class MatrixStorage:
    """Manages SQLite database for matrix storage with CRUD operations."""
    
    def __init__(self, db_path: str = "matrix_lab.db"):
        """Initialize storage with database path."""
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self):
        """Create database tables if they don't exist."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS matrices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                data_blob BLOB NOT NULL,
                rows INTEGER NOT NULL,
                cols INTEGER NOT NULL,
                created_date TEXT NOT NULL,
                modified_date TEXT NOT NULL,
                tags TEXT,
                is_favorite INTEGER DEFAULT 0
            )
        """)
        
        conn.commit()
        conn.close()
    
    def save(self, name: str, matrix: np.ndarray, tags: List[str] = None) -> bool:
        """
        Save a matrix to the database.
        
        Args:
            name: Unique name for the matrix
            matrix: NumPy array to save
            tags: Optional list of tags
            
        Returns:
            True if successful, False if name already exists
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Serialize matrix
            data_blob = pickle.dumps(matrix)
            rows, cols = matrix.shape
            now = datetime.now().isoformat()
            tags_json = json.dumps(tags if tags else [])
            
            cursor.execute("""
                INSERT INTO matrices (name, data_blob, rows, cols, created_date, modified_date, tags, is_favorite)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0)
            """, (name, data_blob, rows, cols, now, now, tags_json))
            
            conn.commit()
            conn.close()
            return True
            
        except sqlite3.IntegrityError:
            # Name already exists
            return False
    
    def load(self, name: str) -> Optional[np.ndarray]:
        """
        Load a matrix by name.
        
        Args:
            name: Name of the matrix to load
            
        Returns:
            NumPy array or None if not found
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT data_blob FROM matrices WHERE name = ?", (name,))
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return pickle.loads(result[0])
        return None
    
    def update(self, name: str, matrix: np.ndarray) -> bool:
        """
        Update an existing matrix.
        
        Args:
            name: Name of the matrix to update
            matrix: New matrix data
            
        Returns:
            True if successful, False if not found
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        data_blob = pickle.dumps(matrix)
        rows, cols = matrix.shape
        now = datetime.now().isoformat()
        
        cursor.execute("""
            UPDATE matrices
            SET data_blob = ?, rows = ?, cols = ?, modified_date = ?
            WHERE name = ?
        """, (data_blob, rows, cols, now, name))
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    
    def delete(self, name: str) -> bool:
        """
        Delete a matrix by name.
        
        Args:
            name: Name of the matrix to delete
            
        Returns:
            True if successful, False if not found
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM matrices WHERE name = ?", (name,))
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    
    def list_all(self) -> List[Dict]:
        """
        Get list of all matrices with metadata.
        
        Returns:
            List of dictionaries with matrix metadata
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT name, rows, cols, created_date, modified_date, tags, is_favorite
            FROM matrices
            ORDER BY modified_date DESC
        """)
        
        results = []
        for row in cursor.fetchall():
            results.append({
                'name': row[0],
                'rows': row[1],
                'cols': row[2],
                'created_date': row[3],
                'modified_date': row[4],
                'tags': json.loads(row[5]) if row[5] else [],
                'is_favorite': bool(row[6])
            })
        
        conn.close()
        return results
    
    def search(self, query: str) -> List[Dict]:
        """
        Search matrices by name.
        
        Args:
            query: Search string
            
        Returns:
            List of matching matrix metadata
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT name, rows, cols, created_date, modified_date, tags, is_favorite
            FROM matrices
            WHERE name LIKE ?
            ORDER BY modified_date DESC
        """, (f'%{query}%',))
        
        results = []
        for row in cursor.fetchall():
            results.append({
                'name': row[0],
                'rows': row[1],
                'cols': row[2],
                'created_date': row[3],
                'modified_date': row[4],
                'tags': json.loads(row[5]) if row[5] else [],
                'is_favorite': bool(row[6])
            })
        
        conn.close()
        return results
    
    def toggle_favorite(self, name: str) -> bool:
        """
        Toggle favorite status of a matrix.
        
        Args:
            name: Name of the matrix
            
        Returns:
            New favorite status (True/False), None if not found
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get current status
        cursor.execute("SELECT is_favorite FROM matrices WHERE name = ?", (name,))
        result = cursor.fetchone()
        
        if result is None:
            conn.close()
            return None
        
        new_status = 0 if result[0] else 1
        cursor.execute("UPDATE matrices SET is_favorite = ? WHERE name = ?", (new_status, name))
        
        conn.commit()
        conn.close()
        return bool(new_status)
    
    def get_favorites(self) -> List[Dict]:
        """Get all favorite matrices."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT name, rows, cols, created_date, modified_date, tags, is_favorite
            FROM matrices
            WHERE is_favorite = 1
            ORDER BY modified_date DESC
        """)
        
        results = []
        for row in cursor.fetchall():
            results.append({
                'name': row[0],
                'rows': row[1],
                'cols': row[2],
                'created_date': row[3],
                'modified_date': row[4],
                'tags': json.loads(row[5]) if row[5] else [],
                'is_favorite': bool(row[6])
            })
        
        conn.close()
        return results
    
    def get_by_size(self, rows: int = None, cols: int = None) -> List[Dict]:
        """
        Get matrices filtered by dimensions.
        
        Args:
            rows: Filter by number of rows (None for any)
            cols: Filter by number of columns (None for any)
            
        Returns:
            List of matching matrix metadata
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if rows is not None and cols is not None:
            cursor.execute("""
                SELECT name, rows, cols, created_date, modified_date, tags, is_favorite
                FROM matrices
                WHERE rows = ? AND cols = ?
                ORDER BY modified_date DESC
            """, (rows, cols))
        elif rows is not None:
            cursor.execute("""
                SELECT name, rows, cols, created_date, modified_date, tags, is_favorite
                FROM matrices
                WHERE rows = ?
                ORDER BY modified_date DESC
            """, (rows,))
        elif cols is not None:
            cursor.execute("""
                SELECT name, rows, cols, created_date, modified_date, tags, is_favorite
                FROM matrices
                WHERE cols = ?
                ORDER BY modified_date DESC
            """, (cols,))
        else:
            return self.list_all()
        
        results = []
        for row in cursor.fetchall():
            results.append({
                'name': row[0],
                'rows': row[1],
                'cols': row[2],
                'created_date': row[3],
                'modified_date': row[4],
                'tags': json.loads(row[5]) if row[5] else [],
                'is_favorite': bool(row[6])
            })
        
        conn.close()
        return results
