"""
LaTeX Pane widget.
A single pane containing LaTeX editor, PDF preview, and action buttons.
Each pane has its own name for independent PDF downloads.
"""

import os
import shutil
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPlainTextEdit,
    QPushButton, QLabel, QFrame, QSplitter, QFileDialog,
    QMessageBox, QCheckBox, QLineEdit
)
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QFont

from syntax_highlighter import LatexSyntaxHighlighter
from pdf_viewer import PdfViewer
from compiler import LatexCompiler
from styles import COLORS


# Default LaTeX template
DEFAULT_TEMPLATE = r"""\documentclass[12pt]{article}
\usepackage[utf8]{inputenc}
\usepackage{amsmath}
\usepackage{graphicx}
\usepackage{geometry}
\geometry{margin=1in}

\title{My Document}
\author{Author}
\date{\today}

\begin{document}

\maketitle

\section{Introduction}
Write your content here...

\end{document}
"""


class LatexPane(QFrame):
    """
    A single LaTeX editing pane with its own name, editor, preview, and controls.
    """
    
    remove_requested = Signal(object)
    
    def __init__(self, pane_id: int, parent=None):
        super().__init__(parent)
        self.pane_id = pane_id
        self.setObjectName("paneContainer")
        self.compiler = LatexCompiler(self, autofix=True)
        self._setup_ui()
        self._connect_signals()
    
    def _setup_ui(self):
        """Set up the UI components."""
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(10, 10, 10, 10)
        main_layout.setSpacing(8)
        
        # Header with name input and close button
        header_layout = QHBoxLayout()
        header_layout.setSpacing(8)
        
        # Pane name input
        name_label = QLabel("Name:")
        name_label.setStyleSheet(f"color: {COLORS['text_secondary']}; font-size: 12px;")
        
        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("Document name...")
        self.name_input.setText(f"Document_{self.pane_id}")
        self.name_input.setMinimumWidth(120)
        self.name_input.setStyleSheet(f"""
            QLineEdit {{
                padding: 5px 8px;
                font-size: 12px;
            }}
        """)
        
        self.autofix_checkbox = QCheckBox("Autofix")
        self.autofix_checkbox.setChecked(True)
        self.autofix_checkbox.setToolTip("Automatically fix common LaTeX errors")
        self.autofix_checkbox.toggled.connect(self._on_autofix_toggled)
        
        self.quick_compile_checkbox = QCheckBox("Quick ⚡")
        self.quick_compile_checkbox.setChecked(True)  # Default to quick mode
        self.quick_compile_checkbox.setToolTip("Fast single-pass compile (disable for references/TOC)")
        self.quick_compile_checkbox.toggled.connect(self._on_quick_mode_toggled)
        self.compiler.set_quick_mode(True)  # Enable quick mode by default
        
        self.close_btn = QPushButton("×")
        self.close_btn.setFixedSize(24, 24)
        self.close_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: transparent;
                color: {COLORS['text_muted']};
                border: none;
                font-size: 18px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                color: {COLORS['error']};
            }}
        """)
        self.close_btn.clicked.connect(self._on_close_clicked)
        
        header_layout.addWidget(name_label)
        header_layout.addWidget(self.name_input, 1)
        header_layout.addWidget(self.autofix_checkbox)
        header_layout.addWidget(self.quick_compile_checkbox)
        header_layout.addWidget(self.close_btn)
        
        main_layout.addLayout(header_layout)
        
        # Splitter for editor and preview (vertical)
        self.splitter = QSplitter(Qt.Orientation.Vertical)
        
        # LaTeX Editor
        editor_widget = QWidget()
        editor_layout = QVBoxLayout(editor_widget)
        editor_layout.setContentsMargins(0, 0, 0, 0)
        editor_layout.setSpacing(4)
        
        editor_label = QLabel("LaTeX Code:")
        editor_label.setStyleSheet(f"color: {COLORS['text_secondary']}; font-size: 11px;")
        editor_layout.addWidget(editor_label)
        
        self.editor = QPlainTextEdit()
        self.editor.setPlainText(DEFAULT_TEMPLATE)
        self.editor.setMinimumHeight(150)
        
        font = QFont("Cascadia Code", 10)
        font.setStyleHint(QFont.StyleHint.Monospace)
        self.editor.setFont(font)
        
        self.highlighter = LatexSyntaxHighlighter(self.editor.document())
        
        editor_layout.addWidget(self.editor)
        
        # Preview area
        preview_widget = QWidget()
        preview_layout = QVBoxLayout(preview_widget)
        preview_layout.setContentsMargins(0, 0, 0, 0)
        preview_layout.setSpacing(4)
        
        preview_label = QLabel("PDF Preview:")
        preview_label.setStyleSheet(f"color: {COLORS['text_secondary']}; font-size: 11px;")
        preview_layout.addWidget(preview_label)
        
        self.pdf_viewer = PdfViewer()
        self.pdf_viewer.setMinimumHeight(200)
        preview_layout.addWidget(self.pdf_viewer)
        
        self.splitter.addWidget(editor_widget)
        self.splitter.addWidget(preview_widget)
        self.splitter.setSizes([250, 350])
        
        main_layout.addWidget(self.splitter, 1)
        
        # Bottom controls
        controls_layout = QHBoxLayout()
        controls_layout.setSpacing(8)
        
        self.status_label = QLabel("Ready")
        self.status_label.setObjectName("statusLabel")
        self.status_label.setWordWrap(True)
        
        self.compile_btn = QPushButton("Compile")
        self.compile_btn.setObjectName("compileBtn")
        self.compile_btn.setFixedWidth(100)
        
        self.download_btn = QPushButton("Download PDF")
        self.download_btn.setObjectName("downloadBtn")
        self.download_btn.setFixedWidth(120)
        self.download_btn.setEnabled(False)
        
        controls_layout.addWidget(self.status_label, 1)
        controls_layout.addWidget(self.compile_btn)
        controls_layout.addWidget(self.download_btn)
        
        main_layout.addLayout(controls_layout)
    
    def _connect_signals(self):
        """Connect signals to slots."""
        self.compile_btn.clicked.connect(self._on_compile)
        self.download_btn.clicked.connect(self._on_download)
        self.compiler.compilation_started.connect(self._on_compilation_started)
        self.compiler.compilation_progress.connect(self._on_compilation_progress)
        self.compiler.compilation_finished.connect(self._on_compilation_finished)
        self.compiler.page_ready.connect(self._on_page_ready)  # Streaming preview!
    
    def _on_autofix_toggled(self, enabled: bool):
        """Handle autofix checkbox toggle."""
        self.compiler.set_autofix(enabled)
    
    def _on_quick_mode_toggled(self, enabled: bool):
        """Handle quick compile checkbox toggle."""
        self.compiler.set_quick_mode(enabled)
    
    def _on_page_ready(self, pdf_path: str, page_count: int):
        """Handle streaming page update - refresh PDF viewer during compilation."""
        if pdf_path and os.path.exists(pdf_path):
            try:
                self.pdf_viewer.load_pdf(pdf_path)
            except:
                pass  # Ignore errors during streaming update
    
    def _on_compile(self):
        """Handle compile button click."""
        latex_code = self.editor.toPlainText()
        if not latex_code.strip():
            self.status_label.setText("No LaTeX code to compile")
            self.status_label.setStyleSheet(f"color: {COLORS['warning']};")
            return
        
        # Use the pane's name for the output file
        doc_name = self.name_input.text().strip() or f"Document_{self.pane_id}"
        # Sanitize filename
        doc_name = "".join(c for c in doc_name if c.isalnum() or c in (' ', '-', '_')).strip()
        doc_name = doc_name.replace(' ', '_')
        
        self.compiler.compile(latex_code, doc_name)
    
    def _on_compilation_started(self):
        """Handle compilation started."""
        self.compile_btn.setEnabled(False)
        self.status_label.setText("Compiling...")
        self.status_label.setStyleSheet(f"color: {COLORS['accent']};")
    
    def _on_compilation_progress(self, message: str):
        """Handle compilation progress updates."""
        self.status_label.setText(message)
        self.status_label.setStyleSheet(f"color: {COLORS['warning']};")
    
    def _on_compilation_finished(self, success: bool, pdf_path: str, error: str, fixes_applied: list):
        """Handle compilation finished."""
        self.compile_btn.setEnabled(True)
        
        if success:
            if fixes_applied:
                self.status_label.setText(f"Success (autofixed {len(fixes_applied)} issue(s))")
            else:
                self.status_label.setText("Compilation successful")
            
            self.status_label.setStyleSheet(f"color: {COLORS['success']};")
            self.pdf_viewer.load_pdf(pdf_path)
            self.download_btn.setEnabled(True)
        else:
            self.status_label.setText("Compilation failed")
            self.status_label.setStyleSheet(f"color: {COLORS['error']};")
            self.download_btn.setEnabled(False)
            
            error_msg = error[:800] if len(error) > 800 else error
            QMessageBox.warning(
                self,
                "Compilation Error",
                f"LaTeX compilation failed:\n\n{error_msg}",
                QMessageBox.StandardButton.Ok
            )
    
    def _on_download(self):
        """Handle download button click."""
        pdf_path = self.compiler.get_last_pdf_path()
        if not pdf_path or not os.path.exists(pdf_path):
            QMessageBox.warning(
                self,
                "No PDF Available",
                "No PDF file available. Please compile first.",
                QMessageBox.StandardButton.Ok
            )
            return
        
        # Use the pane's name for the suggested filename
        doc_name = self.name_input.text().strip() or f"Document_{self.pane_id}"
        # Sanitize filename
        doc_name = "".join(c for c in doc_name if c.isalnum() or c in (' ', '-', '_')).strip()
        
        save_path, _ = QFileDialog.getSaveFileName(
            self,
            "Save PDF",
            f"{doc_name}.pdf",
            "PDF Files (*.pdf)"
        )
        
        if save_path:
            try:
                shutil.copy2(pdf_path, save_path)
                self.status_label.setText(f"Saved: {os.path.basename(save_path)}")
                self.status_label.setStyleSheet(f"color: {COLORS['success']};")
            except Exception as e:
                QMessageBox.critical(
                    self,
                    "Save Error",
                    f"Failed to save PDF:\n{str(e)}",
                    QMessageBox.StandardButton.Ok
                )
    
    def _on_close_clicked(self):
        """Handle close button click."""
        self.remove_requested.emit(self)
    
    def get_name(self) -> str:
        """Get the pane's document name."""
        return self.name_input.text().strip()
    
    def set_name(self, name: str):
        """Set the pane's document name."""
        self.name_input.setText(name)
    
    def get_latex_code(self) -> str:
        """Get the current LaTeX code."""
        return self.editor.toPlainText()
    
    def set_latex_code(self, code: str):
        """Set the LaTeX code."""
        self.editor.setPlainText(code)
    
    def cleanup(self):
        """Clean up resources."""
        self.compiler.cleanup()
