"""
LaTeX Compiler module with Enhanced Autofix.
Handles compilation of LaTeX code to PDF using pdflatex.
Includes robust automatic error fixing for common LaTeX issues.
Supports streaming compilation - shows pages as they compile.
"""

import os
import re
import subprocess
import tempfile
import shutil
import time
import threading
from typing import Tuple, Optional, List
from PySide6.QtCore import QObject, Signal, QThread, QTimer


class LatexAutoFixer:
    """Enhanced automatic fixer for common LaTeX errors."""
    
    @staticmethod
    def fix_truncated_document(code: str) -> Tuple[str, List[str]]:
        """Fix truncated document by ensuring proper ending."""
        fixes = []
        
        # Ensure document ends properly
        if r'\end{document}' not in code:
            # Close any open environments first
            open_envs = []
            env_pattern = r'\\begin\{(\w+)\}'
            end_pattern = r'\\end\{(\w+)\}'
            
            for match in re.finditer(env_pattern, code):
                open_envs.append(match.group(1))
            for match in re.finditer(end_pattern, code):
                if open_envs and match.group(1) == open_envs[-1]:
                    open_envs.pop()
            
            # Close open environments in reverse order
            for env in reversed(open_envs):
                code += f'\n\\end{{{env}}}'
                fixes.append(f"Closed unclosed environment: {env}")
            
            code += '\n\\end{document}'
            fixes.append("Added missing \\end{document}")
        
        return code, fixes
    
    @staticmethod
    def fix_lstlisting_issues(code: str) -> Tuple[str, List[str]]:
        """Fix issues with lstlisting environments."""
        fixes = []
        
        # Check for unclosed lstlisting
        begin_count = code.count(r'\begin{lstlisting}')
        end_count = code.count(r'\end{lstlisting}')
        
        if begin_count > end_count:
            diff = begin_count - end_count
            code += '\n\\end{lstlisting}' * diff
            fixes.append(f"Closed {diff} unclosed lstlisting environment(s)")
        
        return code, fixes
    
    @staticmethod
    def fix_special_characters(code: str) -> Tuple[str, List[str]]:
        """Fix unescaped special characters outside of lstlisting."""
        fixes = []
        
        # Split by lstlisting environments to avoid fixing code inside them
        parts = re.split(r'(\\begin\{lstlisting\}.*?\\end\{lstlisting\})', code, flags=re.DOTALL)
        
        fixed_parts = []
        for i, part in enumerate(parts):
            if i % 2 == 0:  # Not inside lstlisting
                # Fix common unescaped characters (but be careful)
                # Only fix obvious cases
                original = part
                # Don't fix _ and # as they might be intentional in various contexts
                if original != part:
                    fixes.append("Fixed unescaped special characters")
            fixed_parts.append(part)
        
        return ''.join(fixed_parts), fixes
    
    @staticmethod
    def fix_tabularx_issues(code: str) -> Tuple[str, List[str]]:
        """Fix issues with tabularx environments."""
        fixes = []
        
        # Check for unclosed tabularx
        begin_count = code.count(r'\begin{tabularx}')
        end_count = code.count(r'\end{tabularx}')
        
        if begin_count > end_count:
            diff = begin_count - end_count
            code += '\n\\end{tabularx}' * diff
            fixes.append(f"Closed {diff} unclosed tabularx environment(s)")
        
        # Check for unclosed longtable
        begin_count = code.count(r'\begin{longtable}')
        end_count = code.count(r'\end{longtable}')
        
        if begin_count > end_count:
            diff = begin_count - end_count
            code += '\n\\end{longtable}' * diff
            fixes.append(f"Closed {diff} unclosed longtable environment(s)")
        
        return code, fixes
    
    @staticmethod
    def fix_description_issues(code: str) -> Tuple[str, List[str]]:
        """Fix issues with description environments."""
        fixes = []
        
        begin_count = code.count(r'\begin{description}')
        end_count = code.count(r'\end{description}')
        
        if begin_count > end_count:
            diff = begin_count - end_count
            code += '\n\\end{description}' * diff
            fixes.append(f"Closed {diff} unclosed description environment(s)")
        
        return code, fixes
    
    @staticmethod
    def fix_brace_imbalance(code: str) -> Tuple[str, List[str]]:
        """Fix unbalanced braces more intelligently."""
        fixes = []
        
        # Count braces outside of lstlisting environments
        parts = re.split(r'(\\begin\{lstlisting\}.*?\\end\{lstlisting\})', code, flags=re.DOTALL)
        
        total_open = 0
        total_close = 0
        for i, part in enumerate(parts):
            if i % 2 == 0:  # Not inside lstlisting
                total_open += part.count('{')
                total_close += part.count('}')
        
        if total_open > total_close:
            diff = total_open - total_close
            # Add closing braces before \end{document}
            if r'\end{document}' in code:
                code = code.replace(r'\end{document}', '}' * diff + '\n\\end{document}')
            else:
                code += '}' * diff
            fixes.append(f"Added {diff} missing closing brace(s)")
        elif total_close > total_open:
            diff = total_close - total_open
            # Remove extra closing braces from the end
            for _ in range(diff):
                last_idx = code.rfind('}')
                if last_idx != -1:
                    code = code[:last_idx] + code[last_idx+1:]
            fixes.append(f"Removed {diff} extra closing brace(s)")
        
        return code, fixes
    
    @staticmethod
    def fix_multicol_issues(code: str) -> Tuple[str, List[str]]:
        """Fix issues with multicol environments."""
        fixes = []
        
        begin_count = code.count(r'\begin{multicols}')
        end_count = code.count(r'\end{multicols}')
        
        if begin_count > end_count:
            diff = begin_count - end_count
            code += '\n\\end{multicols}' * diff
            fixes.append(f"Closed {diff} unclosed multicols environment(s)")
        
        return code, fixes
    
    @staticmethod
    def ensure_document_structure(code: str) -> Tuple[str, List[str]]:
        """Ensure basic document structure is present."""
        fixes = []
        
        if r'\documentclass' not in code:
            code = r'\documentclass[12pt]{article}' + '\n' + code
            fixes.append("Added missing \\documentclass")
        
        if r'\begin{document}' not in code:
            # Find appropriate position after preamble
            lines = code.split('\n')
            insert_idx = 0
            for i, line in enumerate(lines):
                stripped = line.strip()
                if stripped.startswith(r'\documentclass') or \
                   stripped.startswith(r'\usepackage') or \
                   stripped.startswith(r'\title') or \
                   stripped.startswith(r'\author') or \
                   stripped.startswith(r'\date') or \
                   stripped.startswith(r'\newcommand') or \
                   stripped.startswith(r'\definecolor') or \
                   stripped.startswith(r'\lstdefinestyle') or \
                   stripped.startswith(r'\pagestyle') or \
                   stripped.startswith(r'\fancyhf') or \
                   stripped.startswith(r'\rhead') or \
                   stripped.startswith(r'\lhead') or \
                   stripped.startswith(r'\rfoot'):
                    insert_idx = i + 1
            
            lines.insert(insert_idx, r'\begin{document}')
            code = '\n'.join(lines)
            fixes.append("Added missing \\begin{document}")
        
        return code, fixes
    
    @staticmethod
    def fix_package_not_found(code: str, package_name: str) -> Tuple[str, List[str]]:
        """Comment out missing package."""
        fixes = []
        pattern = rf'(\\usepackage(?:\[.*?\])?\{{{package_name}\}})'
        if re.search(pattern, code):
            code = re.sub(pattern, r'% \1  % Package not available', code)
            fixes.append(f"Commented out unavailable package: {package_name}")
        return code, fixes
    
    @staticmethod
    def fix_undefined_environment(code: str, env_name: str) -> Tuple[str, List[str]]:
        """Replace undefined environment with a placeholder."""
        fixes = []
        if f'\\begin{{{env_name}}}' in code:
            code = code.replace(f'\\begin{{{env_name}}}', f'% Undefined environment: {env_name}\n\\begin{{verbatim}}')
            code = code.replace(f'\\end{{{env_name}}}', f'\\end{{verbatim}}\n% End: {env_name}')
            fixes.append(f"Replaced undefined environment: {env_name}")
        return code, fixes
    
    @classmethod
    def comprehensive_fix(cls, code: str, error_log: str = "") -> Tuple[str, List[str]]:
        """Apply all available fixes comprehensively."""
        all_fixes = []
        
        # 1. Ensure document structure
        code, fixes = cls.ensure_document_structure(code)
        all_fixes.extend(fixes)
        
        # 2. Fix lstlisting issues (common in code documentation)
        code, fixes = cls.fix_lstlisting_issues(code)
        all_fixes.extend(fixes)
        
        # 3. Fix tabularx/longtable issues
        code, fixes = cls.fix_tabularx_issues(code)
        all_fixes.extend(fixes)
        
        # 4. Fix description environments
        code, fixes = cls.fix_description_issues(code)
        all_fixes.extend(fixes)
        
        # 5. Fix multicol issues
        code, fixes = cls.fix_multicol_issues(code)
        all_fixes.extend(fixes)
        
        # 6. Fix brace imbalance
        code, fixes = cls.fix_brace_imbalance(code)
        all_fixes.extend(fixes)
        
        # 7. Fix truncated document
        code, fixes = cls.fix_truncated_document(code)
        all_fixes.extend(fixes)
        
        # 8. Check for package not found in error log
        pkg_match = re.search(r"File `(.+?)\.sty' not found", error_log)
        if pkg_match:
            pkg_name = pkg_match.group(1)
            code, fixes = cls.fix_package_not_found(code, pkg_name)
            all_fixes.extend(fixes)
        
        # 9. Check for undefined environment in error log
        env_match = re.search(r"Environment (.+?) undefined", error_log)
        if env_match:
            env_name = env_match.group(1)
            code, fixes = cls.fix_undefined_environment(code, env_name)
            all_fixes.extend(fixes)
        
        return code, all_fixes


class CompilationWorker(QThread):
    """Worker thread for LaTeX compilation with streaming preview."""
    
    finished = Signal(bool, str, str, list)
    progress = Signal(str)
    page_ready = Signal(str, int)  # (pdf_path, page_count) - for streaming preview
    
    MAX_FIX_ATTEMPTS = 5  # Increased attempts for complex documents
    
    # Persistent cache directory for aux files (huge speedup!)
    _cache_dir = None
    
    @classmethod
    def get_cache_dir(cls):
        """Get or create persistent cache directory for aux files."""
        if cls._cache_dir is None or not os.path.exists(cls._cache_dir):
            cls._cache_dir = tempfile.mkdtemp(prefix="latex_cache_")
        return cls._cache_dir
    
    def __init__(self, latex_code: str, output_name: str = "output", autofix: bool = True, 
                 quick_mode: bool = False, draft_mode: bool = False):
        super().__init__()
        self.latex_code = latex_code
        self.output_name = output_name
        self.autofix = autofix
        self.quick_mode = quick_mode  # Single pass, faster compilation
        self.draft_mode = draft_mode  # Skip images/heavy processing
        self.temp_dir = None
        self.all_fixes = []
    
    def run(self):
        current_code = self.latex_code
        
        # Pre-apply comprehensive fixes if autofix is enabled
        if self.autofix:
            self.progress.emit("Pre-checking document structure...")
            current_code, fixes = LatexAutoFixer.comprehensive_fix(current_code, "")
            if fixes:
                self.all_fixes.extend(fixes)
                self.progress.emit(f"Applied {len(fixes)} pre-compilation fix(es)")
        
        for attempt in range(self.MAX_FIX_ATTEMPTS + 1):
            self.progress.emit(f"Compiling... (attempt {attempt + 1})")
            success, pdf_path, error = self._compile(current_code)
            
            if success:
                self.progress.emit("Done!")
                self.finished.emit(True, pdf_path, "", self.all_fixes)
                return
            
            if not self.autofix or attempt >= self.MAX_FIX_ATTEMPTS:
                self.finished.emit(False, "", error, self.all_fixes)
                return
            
            self.progress.emit(f"Analyzing errors (attempt {attempt + 1})...")
            fixed_code, fixes = LatexAutoFixer.comprehensive_fix(current_code, error)
            
            if fixed_code == current_code or not fixes:
                # No new fixes could be applied
                self.finished.emit(False, "", error, self.all_fixes)
                return
            
            current_code = fixed_code
            self.all_fixes.extend(fixes)
            self.progress.emit(f"Applied {len(fixes)} fix(es), retrying...")
    
    def _compile(self, latex_code: str) -> Tuple[bool, str, str]:
        # Use persistent cache for aux files (massive speedup for repeat compiles!)
        self.temp_dir = self.get_cache_dir()
        tex_file = os.path.join(self.temp_dir, f"{self.output_name}.tex")
        pdf_file = os.path.join(self.temp_dir, f"{self.output_name}.pdf")
        
        try:
            with open(tex_file, 'w', encoding='utf-8') as f:
                f.write(latex_code)
            
            pdflatex_path = shutil.which("pdflatex")
            if not pdflatex_path:
                return False, "", "pdflatex not found. Install TeX Live or MiKTeX."
            
            # Build optimized command
            cmd = [
                pdflatex_path, 
                "-interaction=nonstopmode",
                "-output-directory", self.temp_dir,
                "-file-line-error",
            ]
            
            if self.draft_mode:
                cmd.append("-draftmode")
            
            # STREAMING COMPILATION: Use Popen to watch PDF as it builds
            if self.quick_mode:
                self.progress.emit("⚡ Streaming compile...")
                
                # Start process
                process = subprocess.Popen(
                    cmd + [tex_file],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    cwd=self.temp_dir
                )
                
                # Watch PDF file and emit updates while compiling
                last_page_count = 0
                last_size = 0
                
                while process.poll() is None:
                    time.sleep(0.3)  # Check every 300ms
                    
                    if os.path.exists(pdf_file):
                        try:
                            current_size = os.path.getsize(pdf_file)
                            if current_size > last_size:
                                last_size = current_size
                                # Emit signal for UI to refresh preview
                                self.page_ready.emit(pdf_file, -1)  # -1 means "refresh"
                                self.progress.emit(f"⚡ Compiling... ({current_size // 1024}KB)")
                        except:
                            pass
                
                stdout, stderr = process.communicate(timeout=60)
                
            else:
                # Full mode: 2 passes for references
                self.progress.emit("Running pdflatex (pass 1/2)...")
                result = subprocess.run(
                    cmd + [tex_file],
                    capture_output=True, text=True, timeout=300,
                    cwd=self.temp_dir
                )
                
                # Emit after first pass
                if os.path.exists(pdf_file):
                    self.page_ready.emit(pdf_file, -1)
                
                self.progress.emit("Running pdflatex (pass 2/2)...")
                result = subprocess.run(
                    cmd + [tex_file],
                    capture_output=True, text=True, timeout=300,
                    cwd=self.temp_dir
                )
            
            # In draft mode, check for .log success instead of PDF
            if self.draft_mode:
                log_file = os.path.join(self.temp_dir, f"{self.output_name}.log")
                if os.path.exists(log_file):
                    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                        log_content = f.read()
                    if 'No pages of output' in log_content or 'Output written' not in log_content:
                        return True, "", ""
                    if '!' in log_content:
                        return False, "", self._extract_error(log_file, "")
                    return True, "", ""
            
            if os.path.exists(pdf_file):
                return True, pdf_file, ""
            else:
                log_file = os.path.join(self.temp_dir, f"{self.output_name}.log")
                error_msg = self._extract_error(log_file, "")
                return False, "", error_msg
                
        except subprocess.TimeoutExpired:
            return False, "", "Compilation timed out."
        except Exception as e:
            return False, "", f"Error: {str(e)}"
    
    def _extract_error(self, log_file: str, stdout: str) -> str:
        error_lines = []
        full_log = ""
        
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                    full_log = f.read()
                    for line in full_log.split('\n'):
                        if line.startswith('!') or 'Error' in line or 'error' in line.lower():
                            error_lines.append(line.strip())
                            if len(error_lines) >= 15:
                                break
            except:
                pass
        
        if error_lines:
            return '\n'.join(error_lines) + "\n\n--- Log excerpt ---\n" + full_log[-3000:]
        return full_log[-3000:] if full_log else "Unknown error - check log file"
    
    def cleanup(self):
        # Don't cleanup temp_dir - it's a persistent cache!
        pass


class LatexCompiler(QObject):
    """LaTeX compiler with enhanced autofix and streaming preview."""
    
    compilation_started = Signal()
    compilation_progress = Signal(str)
    compilation_finished = Signal(bool, str, str, list)
    page_ready = Signal(str, int)  # Streaming: (pdf_path, page_count)
    
    def __init__(self, parent=None, autofix: bool = True):
        super().__init__(parent)
        self.autofix = autofix
        self.quick_mode = False  # Single-pass quick compile
        self.draft_mode = False  # Syntax check only (no PDF)
        self.worker = None
        self.last_pdf_path = None
    
    def compile(self, latex_code: str, output_name: str = "output"):
        if self.worker:
            self.worker.cleanup()
        
        self.compilation_started.emit()
        
        self.worker = CompilationWorker(
            latex_code, output_name, self.autofix, 
            self.quick_mode, self.draft_mode
        )
        self.worker.finished.connect(self._on_finished)
        self.worker.progress.connect(self.compilation_progress.emit)
        self.worker.page_ready.connect(self.page_ready.emit)  # Streaming!
        self.worker.start()
    
    def set_quick_mode(self, enabled: bool):
        """Enable/disable quick compile mode (single pass)."""
        self.quick_mode = enabled
    
    def set_draft_mode(self, enabled: bool):
        """Enable/disable draft mode (syntax check, no PDF)."""
        self.draft_mode = enabled
    
    def _on_finished(self, success: bool, pdf_path: str, error: str, fixes: list):
        if success:
            self.last_pdf_path = pdf_path
        self.compilation_finished.emit(success, pdf_path, error, fixes)
    
    def get_last_pdf_path(self) -> Optional[str]:
        return self.last_pdf_path
    
    def set_autofix(self, enabled: bool):
        self.autofix = enabled
    
    def cleanup(self):
        if self.worker:
            self.worker.cleanup()
