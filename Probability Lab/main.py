import sys
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QTabWidget, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QLineEdit, QPushButton, QScrollArea, QFrame
)
from PyQt5.QtCore import Qt
import string

# ================= Feature Registration =================
FEATURES_REGISTRY = []
def register_feature(tab_name):
    def decorator(func):
        FEATURES_REGISTRY.append({"tab": tab_name, "function": func})
        return func
    return decorator

class FeatureTab(QWidget):
    def __init__(self, feature_func):
        super().__init__()
        layout = QVBoxLayout()
        feature_func(layout)
        self.setLayout(layout)

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Modular Feature App")
        self.resize(1000, 700)
        self.tabs = QTabWidget()
        self.setCentralWidget(self.tabs)
        self.load_features()

    def load_features(self):
        for feature in FEATURES_REGISTRY:
            tab_name, func = feature['tab'], feature['function']
            tab = FeatureTab(func)
            self.tabs.addTab(tab, tab_name)

# ============================================================
# =================== User Feature ===========================
# ============================================================
@register_feature("Sample Space Tree (Boxes)")
def sample_space_boxes(layout):
    layout.addWidget(QLabel("Sample Space Tree with Node Boxes"))
    layout.addWidget(QLabel("Input 1: Number of possibilities per element (e.g., 2 for coin: Heads/Tails)"))
    layout.addWidget(QLabel("Input 2: Number of elements (e.g., 3 for 3 coins)"))

    possibilities_input = QLineEdit()
    possibilities_input.setPlaceholderText("Number of possibilities of each element")
    elements_input = QLineEdit()
    elements_input.setPlaceholderText("Number of elements")
    run_button = QPushButton("Generate Tree")

    scroll_area = QScrollArea()
    scroll_area.setWidgetResizable(True)
    container = QWidget()
    container_layout = QVBoxLayout()
    container.setLayout(container_layout)
    scroll_area.setWidget(container)

    tree_layout = QVBoxLayout()
    container_layout.addLayout(tree_layout)

    def clear_layout(layout):
        while layout.count():
            item = layout.takeAt(0)
            widget = item.widget()
            if widget:
                widget.deleteLater()
            sub_layout = item.layout()
            if sub_layout:
                clear_layout(sub_layout)

    # ---------- Recursive Tree Builder ----------
    def build_tree_layout(labels, depth, level, color_val):
        if depth == 0:
            return None

        # Horizontal container: info box on left, nodes on right
        level_layout = QHBoxLayout()

        # Info box for this level
        info_box = QLabel(f"Level {level}\n{len(labels) ** level} boxes")
        info_box.setFrameStyle(QFrame.Box)
        info_box.setAlignment(Qt.AlignCenter)
        info_box.setFixedWidth(100)  # Keep narrow on left
        info_box.setStyleSheet(f"background:rgb({230-(level*10)},{230-(level*10)},255);"
                            "border:1px solid #333; padding:5px;")
        level_layout.addWidget(info_box)

        # Node container for this level
        nodes_layout = QHBoxLayout()
        for label in labels:
            node_container = QVBoxLayout()
            node_label = QLabel(label)
            node_label.setFrameStyle(QFrame.Box)
            node_label.setAlignment(Qt.AlignCenter)
            node_label.setStyleSheet(f"background:rgb({color_val},{255-color_val},{255});"
                                    "border:1px solid #333; padding:3px;")
            node_container.addWidget(node_label)

            # Recursively build child nodes
            child_layout = build_tree_layout(labels, depth - 1, level + 1, color_val - 20)
            if child_layout:
                node_container.addLayout(child_layout)

            nodes_layout.addLayout(node_container)

        # Add nodes layout to the right of info box
        level_layout.addLayout(nodes_layout)
        return level_layout

    def generate_tree():
        try:
            n_possibilities = int(possibilities_input.text())
            n_elements = int(elements_input.text())
        except ValueError:
            return

        labels = list(string.ascii_lowercase[:n_possibilities])
        clear_layout(tree_layout)

        # === Layout split: info boxes left, nodes right ===
        main_layout = QHBoxLayout()
        info_column = QVBoxLayout()
        tree_column = QVBoxLayout()
        main_layout.addLayout(info_column, 1)
        main_layout.addLayout(tree_column, 5)

        # --- Build info boxes (one per level) ---
        for level in range(1, n_elements+1):
            info_box = QLabel(f"Level {level}\n{n_possibilities**level} boxes")
            info_box.setFrameStyle(QFrame.Box)
            info_box.setAlignment(Qt.AlignCenter)
            info_box.setFixedWidth(100)
            info_box.setStyleSheet("background:rgb(230,230,255); border:1px solid #333; padding:5px;")
            info_column.addWidget(info_box)

        # --- Recursive tree build (only nodes) ---
        def build_nodes(depth, color_val):
            if depth == 0:
                return None
            row_layout = QHBoxLayout()
            for label in labels:
                node_container = QVBoxLayout()
                node_label = QLabel(label)
                node_label.setFrameStyle(QFrame.Box)
                node_label.setAlignment(Qt.AlignCenter)
                node_label.setStyleSheet(f"background:rgb({color_val},{255-color_val},{255});"
                                        "border:1px solid #333; padding:3px;")
                node_container.addWidget(node_label)
                child_layout = build_nodes(depth-1, color_val-20)
                if child_layout:
                    node_container.addLayout(child_layout)
                row_layout.addLayout(node_container)
            return row_layout

        nodes_layout = build_nodes(n_elements, 230)
        if nodes_layout:
            tree_column.addLayout(nodes_layout)

        tree_layout.addLayout(main_layout)

    run_button.clicked.connect(generate_tree)

    layout.addWidget(possibilities_input)
    layout.addWidget(elements_input)
    layout.addWidget(run_button)
    layout.addWidget(scroll_area)

# ============================================================
# ==================== Main ================================
# ============================================================
if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())
