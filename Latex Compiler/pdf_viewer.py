"""
PDF Viewer widget for displaying PDF previews.
Uses PyMuPDF (fitz) to render PDF pages as high-quality images.
"""

import fitz  # PyMuPDF
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QScrollArea,
    QPushButton, QFrame
)
from PySide6.QtCore import Qt
from PySide6.QtGui import QPixmap, QImage
from styles import COLORS


class PdfViewer(QWidget):
    """Widget for displaying PDF pages with high-quality rendering."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.doc = None
        self.current_page = 0
        self.total_pages = 0
        self.zoom = 2.0  # Higher zoom for better quality
        self._setup_ui()
    
    def _setup_ui(self):
        """Set up the UI components."""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(5)
        
        # Page navigation bar
        nav_layout = QHBoxLayout()
        nav_layout.setSpacing(8)
        
        self.prev_btn = QPushButton("◀")
        self.prev_btn.setFixedWidth(40)
        self.prev_btn.clicked.connect(self.prev_page)
        
        self.page_label = QLabel("0 / 0")
        self.page_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.page_label.setMinimumWidth(60)
        
        self.next_btn = QPushButton("▶")
        self.next_btn.setFixedWidth(40)
        self.next_btn.clicked.connect(self.next_page)
        
        self.zoom_out_btn = QPushButton("−")
        self.zoom_out_btn.setFixedWidth(32)
        self.zoom_out_btn.clicked.connect(self.zoom_out)
        
        self.zoom_label = QLabel("200%")
        self.zoom_label.setFixedWidth(45)
        self.zoom_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        self.zoom_in_btn = QPushButton("+")
        self.zoom_in_btn.setFixedWidth(32)
        self.zoom_in_btn.clicked.connect(self.zoom_in)
        
        nav_layout.addWidget(self.prev_btn)
        nav_layout.addWidget(self.page_label)
        nav_layout.addWidget(self.next_btn)
        nav_layout.addStretch()
        nav_layout.addWidget(self.zoom_out_btn)
        nav_layout.addWidget(self.zoom_label)
        nav_layout.addWidget(self.zoom_in_btn)
        
        layout.addLayout(nav_layout)
        
        # Scroll area for the PDF page
        self.scroll_area = QScrollArea()
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        self.page_container = QWidget()
        self.page_layout = QVBoxLayout(self.page_container)
        self.page_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        self.page_label_img = QLabel()
        self.page_label_img.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.page_label_img.setText("No PDF loaded")
        self.page_label_img.setStyleSheet(f"color: {COLORS['text_muted']};")
        
        self.page_layout.addWidget(self.page_label_img)
        self.scroll_area.setWidget(self.page_container)
        
        layout.addWidget(self.scroll_area)
        
        self._update_nav_buttons()
    
    def load_pdf(self, pdf_path: str):
        """Load a PDF file for display."""
        try:
            if self.doc:
                self.doc.close()
            
            self.doc = fitz.open(pdf_path)
            self.total_pages = len(self.doc)
            self.current_page = 0
            self._render_page()
            self._update_nav_buttons()
        except Exception as e:
            self.page_label_img.setText(f"Error loading PDF: {str(e)}")
            self.page_label_img.setStyleSheet(f"color: {COLORS['error']};")
    
    def _render_page(self):
        """Render the current page with high quality."""
        if not self.doc or self.total_pages == 0:
            return
        
        try:
            page = self.doc[self.current_page]
            
            # Use higher DPI for better quality (72 * zoom factor)
            # zoom=2.0 gives 144 DPI, zoom=3.0 gives 216 DPI
            mat = fitz.Matrix(self.zoom, self.zoom)
            
            # Render with alpha channel for better quality
            pix = page.get_pixmap(matrix=mat, alpha=False)
            
            # Convert to QImage with proper format
            if pix.n == 4:  # RGBA
                img = QImage(
                    pix.samples,
                    pix.width,
                    pix.height,
                    pix.stride,
                    QImage.Format.Format_RGBA8888
                )
            else:  # RGB
                img = QImage(
                    pix.samples,
                    pix.width,
                    pix.height,
                    pix.stride,
                    QImage.Format.Format_RGB888
                )
            
            # Convert to QPixmap and display
            pixmap = QPixmap.fromImage(img)
            self.page_label_img.setPixmap(pixmap)
            self.page_label_img.setStyleSheet("")
            
            # Update page label
            self.page_label.setText(f"{self.current_page + 1} / {self.total_pages}")
            
        except Exception as e:
            self.page_label_img.setText(f"Error rendering: {str(e)}")
            self.page_label_img.setStyleSheet(f"color: {COLORS['error']};")
    
    def _update_nav_buttons(self):
        """Update navigation button states."""
        self.prev_btn.setEnabled(self.current_page > 0)
        self.next_btn.setEnabled(self.current_page < self.total_pages - 1)
        self.zoom_label.setText(f"{int(self.zoom * 100)}%")
    
    def prev_page(self):
        """Go to previous page."""
        if self.current_page > 0:
            self.current_page -= 1
            self._render_page()
            self._update_nav_buttons()
    
    def next_page(self):
        """Go to next page."""
        if self.current_page < self.total_pages - 1:
            self.current_page += 1
            self._render_page()
            self._update_nav_buttons()
    
    def zoom_in(self):
        """Zoom in."""
        if self.zoom < 4.0:
            self.zoom += 0.5
            self._render_page()
            self._update_nav_buttons()
    
    def zoom_out(self):
        """Zoom out."""
        if self.zoom > 1.0:
            self.zoom -= 0.5
            self._render_page()
            self._update_nav_buttons()
    
    def clear(self):
        """Clear the viewer."""
        if self.doc:
            self.doc.close()
            self.doc = None
        self.total_pages = 0
        self.current_page = 0
        self.page_label_img.setPixmap(QPixmap())
        self.page_label_img.setText("No PDF loaded")
        self.page_label_img.setStyleSheet(f"color: {COLORS['text_muted']};")
        self.page_label.setText("0 / 0")
        self._update_nav_buttons()
    
    def closeEvent(self, event):
        """Clean up when closing."""
        if self.doc:
            self.doc.close()
        super().closeEvent(event)
