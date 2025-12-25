"""
File Import Widget
Imports matrices from CSV and Excel files.
"""

from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
                               QLabel, QFileDialog, QTableWidget, QTableWidgetItem)
from PySide6.QtCore import Signal
import numpy as np
import pandas as pd


class FileImportWidget(QWidget):
    """Widget for importing matrices from files."""
    
    matrix_ready = Signal(np.ndarray)
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.current_file = None
        self.preview_data = None
        self.setup_ui()
    
    def setup_ui(self):
        """Initialize the UI components."""
        layout = QVBoxLayout(self)
        
        # File selection
        file_layout = QHBoxLayout()
        
        browse_btn = QPushButton("Browse File...")
        browse_btn.clicked.connect(self.browse_file)
        file_layout.addWidget(browse_btn)
        
        self.file_label = QLabel("No file selected")
        self.file_label.setStyleSheet("color: #666;")
        file_layout.addWidget(self.file_label)
        file_layout.addStretch()
        
        layout.addLayout(file_layout)
        
        # Preview table
        preview_label = QLabel("Preview:")
        preview_label.setStyleSheet("font-weight: bold; margin-top: 10px;")
        layout.addWidget(preview_label)
        
        self.preview_table = QTableWidget()
        self.preview_table.setMaximumHeight(250)
        self.preview_table.setEnabled(False)
        layout.addWidget(self.preview_table)
        
        # Info label
        self.info_label = QLabel("")
        self.info_label.setStyleSheet("color: #666; font-style: italic;")
        layout.addWidget(self.info_label)
        
        # Import button
        btn_layout = QHBoxLayout()
        btn_layout.addStretch()
        
        self.import_btn = QPushButton("Import Matrix")
        self.import_btn.setStyleSheet("font-weight: bold;")
        self.import_btn.setEnabled(False)
        self.import_btn.clicked.connect(self.import_matrix)
        btn_layout.addWidget(self.import_btn)
        
        layout.addLayout(btn_layout)
        layout.addStretch()
    
    def browse_file(self):
        """Open file dialog to select CSV or Excel file."""
        file_path, _ = QFileDialog.getOpenFileName(
            self,
            "Select Matrix File",
            "",
            "Data Files (*.csv *.xlsx *.xls);;CSV Files (*.csv);;Excel Files (*.xlsx *.xls);;All Files (*.*)"
        )
        
        if file_path:
            self.current_file = file_path
            self.load_preview(file_path)
    
    def load_preview(self, file_path: str):
        """Load and display file preview."""
        try:
            # Read file based on extension
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path, header=None)
            elif file_path.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file_path, header=None)
            else:
                self.file_label.setText("Unsupported file format")
                return
            
            # Convert to numeric, coerce errors to NaN
            df = df.apply(pd.to_numeric, errors='coerce')
            
            # Check for NaN values
            if df.isnull().any().any():
                self.info_label.setText("⚠ Warning: Non-numeric values detected and will be replaced with 0")
                df = df.fillna(0)
            else:
                self.info_label.setText("")
            
            # Store data
            self.preview_data = df.values
            
            # Update UI
            self.file_label.setText(f"File: {file_path.split('/')[-1]}")
            self.display_preview(df)
            self.import_btn.setEnabled(True)
            
        except Exception as e:
            self.file_label.setText(f"Error: {str(e)}")
            self.preview_table.setRowCount(0)
            self.preview_table.setColumnCount(0)
            self.import_btn.setEnabled(False)
    
    def display_preview(self, df: pd.DataFrame):
        """Display data in preview table."""
        rows, cols = df.shape
        
        # Limit preview size
        preview_rows = min(rows, 10)
        preview_cols = min(cols, 10)
        
        self.preview_table.setRowCount(preview_rows)
        self.preview_table.setColumnCount(preview_cols)
        
        # Populate table
        for i in range(preview_rows):
            for j in range(preview_cols):
                value = df.iloc[i, j]
                item = QTableWidgetItem(str(value))
                self.preview_table.setItem(i, j, item)
        
        # Set headers
        self.preview_table.setHorizontalHeaderLabels([str(i) for i in range(preview_cols)])
        self.preview_table.setVerticalHeaderLabels([str(i) for i in range(preview_rows)])
        
        # Show dimension info
        if rows > preview_rows or cols > preview_cols:
            self.info_label.setText(
                f"Full size: {rows}×{cols} (showing {preview_rows}×{preview_cols} preview)"
            )
    
    def import_matrix(self):
        """Import matrix and emit signal."""
        if self.preview_data is not None:
            matrix = self.preview_data.astype(float)
            self.matrix_ready.emit(matrix)
