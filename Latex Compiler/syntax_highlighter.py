"""
LaTeX Syntax Highlighter for QPlainTextEdit.
Provides syntax highlighting for LaTeX commands, environments, math mode, etc.
"""

from PySide6.QtCore import QRegularExpression
from PySide6.QtGui import QSyntaxHighlighter, QTextCharFormat, QColor, QFont
from styles import SYNTAX_COLORS


class LatexSyntaxHighlighter(QSyntaxHighlighter):
    """Syntax highlighter for LaTeX code."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.highlighting_rules = []
        self._setup_rules()
    
    def _setup_rules(self):
        """Set up syntax highlighting rules."""
        
        # Comments (% to end of line)
        comment_format = QTextCharFormat()
        comment_format.setForeground(QColor(SYNTAX_COLORS["comment"]))
        comment_format.setFontItalic(True)
        self.highlighting_rules.append((
            QRegularExpression(r"%[^\n]*"),
            comment_format
        ))
        
        # LaTeX commands (\command)
        command_format = QTextCharFormat()
        command_format.setForeground(QColor(SYNTAX_COLORS["command"]))
        command_format.setFontWeight(QFont.Weight.Bold)
        self.highlighting_rules.append((
            QRegularExpression(r"\\[a-zA-Z@]+\*?"),
            command_format
        ))
        
        # Environment names (begin{...}, end{...})
        env_format = QTextCharFormat()
        env_format.setForeground(QColor(SYNTAX_COLORS["environment"]))
        env_format.setFontWeight(QFont.Weight.Bold)
        self.highlighting_rules.append((
            QRegularExpression(r"\\(begin|end)\{[a-zA-Z*]+\}"),
            env_format
        ))
        
        # Braces {}
        brace_format = QTextCharFormat()
        brace_format.setForeground(QColor(SYNTAX_COLORS["brace"]))
        self.highlighting_rules.append((
            QRegularExpression(r"[\{\}]"),
            brace_format
        ))
        
        # Brackets []
        bracket_format = QTextCharFormat()
        bracket_format.setForeground(QColor(SYNTAX_COLORS["bracket"]))
        self.highlighting_rules.append((
            QRegularExpression(r"[\[\]]"),
            bracket_format
        ))
        
        # Math mode (inline $...$)
        math_format = QTextCharFormat()
        math_format.setForeground(QColor(SYNTAX_COLORS["math"]))
        self.highlighting_rules.append((
            QRegularExpression(r"\$[^\$]+\$"),
            math_format
        ))
        
        # Math mode (display $$...$$)
        self.highlighting_rules.append((
            QRegularExpression(r"\$\$[^\$]+\$\$"),
            math_format
        ))
        
        # Special characters
        special_format = QTextCharFormat()
        special_format.setForeground(QColor(SYNTAX_COLORS["string"]))
        self.highlighting_rules.append((
            QRegularExpression(r"[&~^_#]"),
            special_format
        ))
    
    def highlightBlock(self, text):
        """Apply syntax highlighting to a block of text."""
        for pattern, format in self.highlighting_rules:
            match_iterator = pattern.globalMatch(text)
            while match_iterator.hasNext():
                match = match_iterator.next()
                self.setFormat(match.capturedStart(), match.capturedLength(), format)
