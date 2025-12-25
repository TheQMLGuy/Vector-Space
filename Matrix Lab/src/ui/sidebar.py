"""
Sidebar Component
Displays saved matrices with search, filter, and category views.
"""

from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QListWidget,
                               QListWidgetItem, QPushButton, QLineEdit, QLabel,
                               QButtonGroup, QRadioButton, QMessageBox, QMenu)
from PySide6.QtCore import Signal, Qt
from PySide6.QtGui import QIcon

from src.storage.matrix_storage import MatrixStorage


class SidebarWidget(QWidget):
    """Sidebar for browsing and managing saved matrices."""
    
    matrix_selected = Signal(str)  # Emitted when matrix is double-clicked
    matrix_deleted = Signal(str)   # Emitted when matrix is deleted
    
    def __init__(self, storage: MatrixStorage, parent=None):
        super().__init__(parent)
        self.storage = storage
        self.current_category = "recent"
        self.setup_ui()
        self.refresh_list()
    
    def setup_ui(self):
        """Initialize the UI components."""
        layout = QVBoxLayout(self)
        layout.setSpacing(10)
        
        # Title
        title = QLabel("Saved Matrices")
        title.setStyleSheet("font-size: 14pt; font-weight: bold; padding: 8px;")
        layout.addWidget(title)
        
        # Search bar
        self.search_bar = QLineEdit()
        self.search_bar.setPlaceholderText("Search matrices...")
        self.search_bar.textChanged.connect(self.on_search)
        layout.addWidget(self.search_bar)
        
        # Category buttons
        cat_label = QLabel("Categories:")
        cat_label.setStyleSheet("font-weight: bold; margin-top: 8px;")
        layout.addWidget(cat_label)
        
        self.category_group = QButtonGroup()
        
        recent_radio = QRadioButton("Recent")
        recent_radio.setChecked(True)
        recent_radio.toggled.connect(lambda: self.set_category("recent"))
        self.category_group.addButton(recent_radio)
        layout.addWidget(recent_radio)
        
        favorites_radio = QRadioButton("Favorites")
        favorites_radio.toggled.connect(lambda: self.set_category("favorites"))
        self.category_group.addButton(favorites_radio)
        layout.addWidget(favorites_radio)
        
        all_radio = QRadioButton("All")
        all_radio.toggled.connect(lambda: self.set_category("all"))
        self.category_group.addButton(all_radio)
        layout.addWidget(all_radio)
        
        # Matrix list
        self.list_widget = QListWidget()
        self.list_widget.itemDoubleClicked.connect(self.on_item_double_clicked)
        self.list_widget.setContextMenuPolicy(Qt.CustomContextMenu)
        self.list_widget.customContextMenuRequested.connect(self.show_context_menu)
        layout.addWidget(self.list_widget)
        
        # Action buttons
        btn_layout = QHBoxLayout()
        
        refresh_btn = QPushButton("Refresh")
        refresh_btn.clicked.connect(self.refresh_list)
        btn_layout.addWidget(refresh_btn)
        
        delete_btn = QPushButton("Delete")
        delete_btn.clicked.connect(self.delete_selected)
        btn_layout.addWidget(delete_btn)
        
        layout.addLayout(btn_layout)
    
    def set_category(self, category: str):
        """Switch category view."""
        self.current_category = category
        self.refresh_list()
    
    def refresh_list(self):
        """Refresh the matrix list based on current category."""
        self.list_widget.clear()
        
        # Get matrices based on category
        if self.current_category == "favorites":
            matrices = self.storage.get_favorites()
        elif self.current_category == "all":
            matrices = self.storage.list_all()
        else:  # recent
            matrices = self.storage.list_all()
        
        # Populate list
        for matrix_info in matrices:
            name = matrix_info['name']
            rows = matrix_info['rows']
            cols = matrix_info['cols']
            is_fav = matrix_info['is_favorite']
            
            # Create display text
            fav_icon = "★ " if is_fav else ""
            item_text = f"{fav_icon}{name} ({rows}×{cols})"
            
            item = QListWidgetItem(item_text)
            item.setData(Qt.UserRole, name)  # Store actual name
            self.list_widget.addItem(item)
    
    def on_search(self, query: str):
        """Filter list based on search query."""
        if not query:
            self.refresh_list()
            return
        
        self.list_widget.clear()
        matrices = self.storage.search(query)
        
        for matrix_info in matrices:
            name = matrix_info['name']
            rows = matrix_info['rows']
            cols = matrix_info['cols']
            is_fav = matrix_info['is_favorite']
            
            fav_icon = "★ " if is_fav else ""
            item_text = f"{fav_icon}{name} ({rows}×{cols})"
            
            item = QListWidgetItem(item_text)
            item.setData(Qt.UserRole, name)
            self.list_widget.addItem(item)
    
    def on_item_double_clicked(self, item: QListWidgetItem):
        """Load matrix when double-clicked."""
        name = item.data(Qt.UserRole)
        self.matrix_selected.emit(name)
    
    def show_context_menu(self, position):
        """Show context menu for list items."""
        item = self.list_widget.itemAt(position)
        if not item:
            return
        
        name = item.data(Qt.UserRole)
        
        menu = QMenu()
        
        load_action = menu.addAction("Load Matrix")
        favorite_action = menu.addAction("Toggle Favorite")
        menu.addSeparator()
        delete_action = menu.addAction("Delete")
        delete_action.setStyleSheet("color: red;")
        
        action = menu.exec_(self.list_widget.mapToGlobal(position))
        
        if action == load_action:
            self.matrix_selected.emit(name)
        elif action == favorite_action:
            self.storage.toggle_favorite(name)
            self.refresh_list()
        elif action == delete_action:
            self.delete_matrix(name)
    
    def delete_selected(self):
        """Delete currently selected matrix."""
        item = self.list_widget.currentItem()
        if not item:
            return
        
        name = item.data(Qt.UserRole)
        self.delete_matrix(name)
    
    def delete_matrix(self, name: str):
        """Delete matrix with confirmation."""
        reply = QMessageBox.question(
            self,
            "Confirm Delete",
            f"Delete matrix '{name}'?",
            QMessageBox.Yes | QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            self.storage.delete(name)
            self.refresh_list()
            self.matrix_deleted.emit(name)
