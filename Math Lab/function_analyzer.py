import sys
import traceback
from dataclasses import dataclass
from typing import List, Tuple, Optional

import numpy as np
import sympy as sp
import html

from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QApplication,
    QMainWindow,
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QGridLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QDoubleSpinBox,
    QSpinBox,
    QTabWidget,
    QTableWidget,
    QTableWidgetItem,
    QMessageBox,
    QTextEdit,
    QGroupBox,
    QFileDialog,
    QCheckBox,
)

from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure


@dataclass
class AnalysisInput:
    mode: str  # 'function' | 'interpolation' | 'regression'
    expression_text: Optional[str]
    data_points: List[Tuple[float, float]]
    regression_degree: int
    taylor_point: float
    taylor_order: int
    x_min: float
    x_max: float
    num_samples: int
    compute_taylor: bool
    compute_fourier: bool
    compute_laplace: bool


class MatplotlibCanvas(FigureCanvas):
    def __init__(self) -> None:
        self.figure = Figure(figsize=(8, 5), tight_layout=True)
        super().__init__(self.figure)
        self.axes = self.figure.add_subplot(111)

    def clear(self) -> None:
        self.axes.clear()


class FunctionAnalyzerWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("Function Analyzer - PySide6")
        self.setMinimumSize(1200, 800)

        # SymPy symbols
        self.x = sp.symbols('x', real=True)
        self.w = sp.symbols('w', real=True)
        self.s = sp.symbols('s', real=True)
        # Small cache for lambdify results
        self._lamb_cache: dict[str, object] = {}

        central = QWidget()
        self.setCentralWidget(central)

        root_layout = QHBoxLayout()
        central.setLayout(root_layout)

        # Left: Controls
        controls = self._build_controls_panel()
        root_layout.addWidget(controls, stretch=0)

        # Right: Output (Text + Plot)
        right_panel = QVBoxLayout()
        root_layout.addLayout(right_panel, stretch=1)

        # Results text
        self.results_text = QTextEdit()
        self.results_text.setReadOnly(True)
        self.results_text.setMinimumHeight(250)
        right_panel.addWidget(self.results_text, stretch=0)

        # Plot canvas
        self.canvas = MatplotlibCanvas()
        right_panel.addWidget(self.canvas, stretch=1)

    # ---------------------------- UI BUILDERS ----------------------------
    def _build_controls_panel(self) -> QWidget:
        panel = QWidget()
        layout = QVBoxLayout()
        panel.setLayout(layout)

        # Tabs for input mode
        self.tabs = QTabWidget()
        self.tabs.addTab(self._build_function_tab(), "Function")
        self.tabs.addTab(self._build_interpolation_tab(), "Interpolation")
        self.tabs.addTab(self._build_regression_tab(), "Regression")
        layout.addWidget(self.tabs)

        # Taylor settings
        taylor_group = QGroupBox("Taylor Expansion Settings")
        taylor_layout = QGridLayout()
        taylor_group.setLayout(taylor_layout)
        self.taylor_point_input = QDoubleSpinBox()
        self.taylor_point_input.setRange(-1e6, 1e6)
        self.taylor_point_input.setValue(0.0)
        self.taylor_order_input = QSpinBox()
        self.taylor_order_input.setRange(1, 50)
        self.taylor_order_input.setValue(4)
        taylor_layout.addWidget(QLabel("Expansion point a:"), 0, 0)
        taylor_layout.addWidget(self.taylor_point_input, 0, 1)
        taylor_layout.addWidget(QLabel("Order n:"), 1, 0)
        taylor_layout.addWidget(self.taylor_order_input, 1, 1)
        layout.addWidget(taylor_group)

        # Analysis options
        options_group = QGroupBox("Analysis Options")
        options_layout = QGridLayout()
        options_group.setLayout(options_layout)
        self.cb_taylor = QCheckBox("Compute Taylor")
        self.cb_taylor.setChecked(True)
        self.cb_fourier = QCheckBox("Compute Fourier")
        self.cb_fourier.setChecked(False)
        self.cb_laplace = QCheckBox("Compute Laplace")
        self.cb_laplace.setChecked(False)
        options_layout.addWidget(self.cb_taylor, 0, 0)
        options_layout.addWidget(self.cb_fourier, 0, 1)
        options_layout.addWidget(self.cb_laplace, 0, 2)
        layout.addWidget(options_group)

        # Plot settings
        plot_group = QGroupBox("Plot Settings")
        plot_layout = QGridLayout()
        plot_group.setLayout(plot_layout)
        self.xmin_input = QDoubleSpinBox()
        self.xmin_input.setRange(-1e6, 1e6)
        self.xmin_input.setValue(-10.0)
        self.xmax_input = QDoubleSpinBox()
        self.xmax_input.setRange(-1e6, 1e6)
        self.xmax_input.setValue(10.0)
        self.num_samples_input = QSpinBox()
        self.num_samples_input.setRange(50, 100000)
        self.num_samples_input.setValue(400)
        plot_layout.addWidget(QLabel("x min:"), 0, 0)
        plot_layout.addWidget(self.xmin_input, 0, 1)
        plot_layout.addWidget(QLabel("x max:"), 1, 0)
        plot_layout.addWidget(self.xmax_input, 1, 1)
        plot_layout.addWidget(QLabel("Samples:"), 2, 0)
        plot_layout.addWidget(self.num_samples_input, 2, 1)
        layout.addWidget(plot_group)

        # Actions
        actions_row = QHBoxLayout()
        self.analyze_button = QPushButton("Analyze")
        self.analyze_button.clicked.connect(self.on_analyze_clicked)
        actions_row.addWidget(self.analyze_button)

        self.load_csv_button = QPushButton("Load CSV (x,y)")
        self.load_csv_button.clicked.connect(self.on_load_csv)
        actions_row.addWidget(self.load_csv_button)

        actions_row.addStretch(1)
        layout.addLayout(actions_row)

        layout.addStretch(1)
        return panel

    def _build_function_tab(self) -> QWidget:
        tab = QWidget()
        layout = QGridLayout()
        tab.setLayout(layout)

        self.function_input = QLineEdit()
        self.function_input.setPlaceholderText("e.g. sin(x)**2 + x*exp(-x)")
        layout.addWidget(QLabel("f(x) ="), 0, 0)
        layout.addWidget(self.function_input, 0, 1)

        return tab

    def _build_interpolation_tab(self) -> QWidget:
        tab = QWidget()
        layout = QVBoxLayout()
        tab.setLayout(layout)

        self.interp_table = QTableWidget(5, 2)
        self.interp_table.setHorizontalHeaderLabels(["x", "y"])
        layout.addWidget(self.interp_table)

        buttons_row = QHBoxLayout()
        add_row_btn = QPushButton("Add Row")
        add_row_btn.clicked.connect(lambda: self.interp_table.setRowCount(self.interp_table.rowCount() + 1))
        rem_row_btn = QPushButton("Remove Row")
        rem_row_btn.clicked.connect(lambda: self.interp_table.setRowCount(max(1, self.interp_table.rowCount() - 1)))
        buttons_row.addWidget(add_row_btn)
        buttons_row.addWidget(rem_row_btn)
        buttons_row.addStretch(1)
        layout.addLayout(buttons_row)

        return tab

    def _build_regression_tab(self) -> QWidget:
        tab = QWidget()
        layout = QVBoxLayout()
        tab.setLayout(layout)

        # Data table
        self.reg_table = QTableWidget(5, 2)
        self.reg_table.setHorizontalHeaderLabels(["x", "y"])
        layout.addWidget(self.reg_table)

        # Controls
        controls = QGridLayout()
        layout.addLayout(controls)

        self.reg_degree_input = QSpinBox()
        self.reg_degree_input.setRange(1, 20)
        self.reg_degree_input.setValue(2)
        controls.addWidget(QLabel("Polynomial degree:"), 0, 0)
        controls.addWidget(self.reg_degree_input, 0, 1)

        # Buttons
        buttons_row = QHBoxLayout()
        add_row_btn = QPushButton("Add Row")
        add_row_btn.clicked.connect(lambda: self.reg_table.setRowCount(self.reg_table.rowCount() + 1))
        rem_row_btn = QPushButton("Remove Row")
        rem_row_btn.clicked.connect(lambda: self.reg_table.setRowCount(max(1, self.reg_table.rowCount() - 1)))
        buttons_row.addWidget(add_row_btn)
        buttons_row.addWidget(rem_row_btn)
        buttons_row.addStretch(1)
        layout.addLayout(buttons_row)

        return tab

    # ---------------------------- EVENT HANDLERS ----------------------------
    def on_load_csv(self) -> None:
        # Load CSV into current table in Interpolation or Regression tab
        current_index = self.tabs.currentIndex()
        if current_index not in (1, 2):
            QMessageBox.information(self, "Load CSV", "Switch to Interpolation or Regression tab to load data.")
            return
        file_path, _ = QFileDialog.getOpenFileName(self, "Open CSV", "", "CSV Files (*.csv);;All Files (*)")
        if not file_path:
            return
        try:
            data = np.genfromtxt(file_path, delimiter=',', dtype=float)
            if data.ndim == 1:
                data = data.reshape(-1, 2)
            if data.shape[1] < 2:
                raise ValueError("CSV must have at least two columns: x,y")
            table = self.interp_table if current_index == 1 else self.reg_table
            table.setRowCount(len(data))
            for i, (xv, yv) in enumerate(data[:, :2]):
                table.setItem(i, 0, QTableWidgetItem(str(xv)))
                table.setItem(i, 1, QTableWidgetItem(str(yv)))
        except Exception as exc:
            QMessageBox.critical(self, "CSV Error", f"Failed to read CSV:\n{exc}")

    def on_analyze_clicked(self) -> None:
        try:
            analysis_input = self._gather_input()
        except ValueError as exc:
            QMessageBox.warning(self, "Input Error", str(exc))
            return
        try:
            self._run_analysis(analysis_input)
        except Exception as exc:
            tb = traceback.format_exc()
            QMessageBox.critical(self, "Analysis Error", f"{exc}\n\n{tb}")

    # ---------------------------- INPUT GATHERING ----------------------------
    def _gather_input(self) -> AnalysisInput:
        mode = self.tabs.tabText(self.tabs.currentIndex()).lower()

        expr_text: Optional[str] = None
        data_points: List[Tuple[float, float]] = []
        regression_degree = self.reg_degree_input.value()

        if mode == 'function':
            expr_text = self.function_input.text().strip()
            if not expr_text:
                raise ValueError("Please enter a function expression in the Function tab.")
        elif mode == 'interpolation':
            data_points = self._read_xy_table(self.interp_table)
            if len(data_points) < 2:
                raise ValueError("Provide at least two (x,y) points for interpolation.")
        elif mode == 'regression':
            data_points = self._read_xy_table(self.reg_table)
            if len(data_points) < 2:
                raise ValueError("Provide at least two (x,y) points for regression.")
        else:
            raise ValueError(f"Unknown mode: {mode}")

        x_min = float(self.xmin_input.value())
        x_max = float(self.xmax_input.value())
        if x_max <= x_min:
            raise ValueError("x max must be greater than x min.")

        return AnalysisInput(
            mode=mode,
            expression_text=expr_text,
            data_points=data_points,
            regression_degree=regression_degree,
            taylor_point=float(self.taylor_point_input.value()),
            taylor_order=int(self.taylor_order_input.value()),
            x_min=x_min,
            x_max=x_max,
            num_samples=int(self.num_samples_input.value()),
            compute_taylor=self.cb_taylor.isChecked(),
            compute_fourier=self.cb_fourier.isChecked(),
            compute_laplace=self.cb_laplace.isChecked(),
        )

    def _read_xy_table(self, table: QTableWidget) -> List[Tuple[float, float]]:
        points: List[Tuple[float, float]] = []
        for row in range(table.rowCount()):
            x_item = table.item(row, 0)
            y_item = table.item(row, 1)
            if x_item is None or y_item is None:
                continue
            x_text = x_item.text().strip()
            y_text = y_item.text().strip()
            if x_text == '' or y_text == '':
                continue
            try:
                points.append((float(x_text), float(y_text)))
            except ValueError:
                # skip invalid rows
                continue
        return points

    # ---------------------------- CORE ANALYSIS ----------------------------
    def _run_analysis(self, analysis_input: AnalysisInput) -> None:
        x = self.x
        safe_locals = self._build_sympy_locals()

        # Build sympy expression for f(x)
        if analysis_input.mode == 'function':
            f_expr = sp.sympify(analysis_input.expression_text, locals=safe_locals)
        elif analysis_input.mode == 'interpolation':
            pts = [(sp.Float(px), sp.Float(py)) for px, py in analysis_input.data_points]
            f_expr = sp.interpolate(pts, x)
        elif analysis_input.mode == 'regression':
            degree = max(1, int(analysis_input.regression_degree))
            xs = np.array([p[0] for p in analysis_input.data_points], dtype=float)
            ys = np.array([p[1] for p in analysis_input.data_points], dtype=float)
            coeffs = np.polyfit(xs, ys, deg=degree)  # highest power first
            # Convert to sympy polynomial: c0*x^n + ... + cn
            f_expr = sum(sp.Float(c) * x**p for p, c in zip(range(degree, -1, -1), coeffs))
        else:
            raise ValueError("Unsupported mode")

        # Simplify for better symbolic processing
        f_expr = sp.simplify(f_expr)

        # Odd/Even classification
        odd_even = self._classify_odd_even(f_expr)

        # Taylor series
        taylor_series = "(skipped)" if not analysis_input.compute_taylor else \
            self._compute_taylor_series(f_expr, analysis_input.taylor_point, analysis_input.taylor_order)

        # Fourier transform (symbolic if possible)
        fourier_text = "(skipped)" if not analysis_input.compute_fourier else \
            self._compute_fourier_transform_text(f_expr)

        # Laplace transform (symbolic if possible)
        if analysis_input.compute_laplace:
            laplace_main_text, laplace_cond_text = self._compute_laplace_transform_parts(f_expr)
        else:
            laplace_main_text, laplace_cond_text = "(skipped)", None

        # Derivative and Integral (symbolic preferred)
        derivative_expr, derivative_text = self._compute_derivative(f_expr)
        integral_expr, integral_text = self._compute_integral(f_expr)

        # Plot numeric curves
        self._plot_all(f_expr, derivative_expr, integral_expr, analysis_input)

        # Render results text
        self._render_results_text(
            f_expr=f_expr,
            odd_even=odd_even,
            taylor_series=taylor_series,
            derivative_text=derivative_text,
            integral_text=integral_text,
            fourier_text=fourier_text,
            laplace_main_text=laplace_main_text,
            laplace_cond_text=laplace_cond_text,
        )

    def _build_sympy_locals(self) -> dict:
        # Allow common functions and constants
        return {
            'x': self.x,
            'pi': sp.pi,
            'E': sp.E,
            'I': sp.I,
            # Elementary
            'sin': sp.sin,
            'cos': sp.cos,
            'tan': sp.tan,
            'asin': sp.asin,
            'acos': sp.acos,
            'atan': sp.atan,
            'exp': sp.exp,
            'log': sp.log,
            'sqrt': sp.sqrt,
            'abs': sp.Abs,
            # Special/Signals
            'Heaviside': sp.Heaviside,
            'DiracDelta': sp.DiracDelta,
            'sign': sp.sign,
            # Piecewise
            'Piecewise': sp.Piecewise,
            # Hyperbolic
            'sinh': sp.sinh,
            'cosh': sp.cosh,
            'tanh': sp.tanh,
        }

    def _classify_odd_even(self, f_expr: sp.Expr) -> str:
        x = self.x
        try:
            is_even = sp.simplify(f_expr.subs(x, -x) - f_expr) == 0
            is_odd = sp.simplify(f_expr.subs(x, -x) + f_expr) == 0
            if is_even and is_odd:
                return "both (zero function)"
            if is_even:
                return "even"
            if is_odd:
                return "odd"
            return "neither"
        except Exception:
            return "undetermined"

    def _compute_taylor_series(self, f_expr: sp.Expr, a: float, n: int) -> str:
        x = self.x
        try:
            series_expr = sp.series(f_expr, x, sp.Float(a), n).removeO()
            return sp.sstr(series_expr)
        except Exception as exc:
            return f"(could not compute series: {exc})"

    def _compute_fourier_transform_text(self, f_expr: sp.Expr) -> str:
        x, w = self.x, self.w
        try:
            Fw = sp.fourier_transform(f_expr, x, w)
            return sp.sstr(Fw)
        except Exception as exc:
            return f"(could not compute Fourier transform: {exc})"

    def _compute_laplace_transform_parts(self, f_expr: sp.Expr) -> Tuple[str, Optional[str]]:
        x, s = self.x, self.s
        try:
            Ls = sp.laplace_transform(f_expr, x, s, noconds=False)
            # SymPy returns (F(s), convergence cond, dict?) depending on version
            if isinstance(Ls, tuple) and len(Ls) >= 1:
                Fs = Ls[0]
                conds = Ls[1] if len(Ls) > 1 else None
                main_text = sp.sstr(Fs)
                cond_text = sp.sstr(conds) if conds is not None else None
                return main_text, cond_text
            return sp.sstr(Ls), None
        except Exception as exc:
            return f"(could not compute Laplace transform: {exc})", None

    def _compute_derivative(self, f_expr: sp.Expr) -> Tuple[Optional[sp.Expr], str]:
        x = self.x
        try:
            d_expr = sp.diff(f_expr, x)
            d_expr = sp.simplify(d_expr)
            return d_expr, sp.sstr(d_expr)
        except Exception as exc:
            return None, f"(could not compute derivative: {exc})"

    def _compute_integral(self, f_expr: sp.Expr) -> Tuple[Optional[sp.Expr], str]:
        x = self.x
        try:
            F_expr = sp.integrate(f_expr, x)
            if isinstance(F_expr, sp.Integral):
                # Not evaluated analytically
                return None, "(integral not expressible in elementary terms; numeric integral will be plotted)"
            F_expr = sp.simplify(F_expr)
            return F_expr, sp.sstr(F_expr)
        except Exception as exc:
            return None, f"(could not compute integral: {exc})"

    # ---------------------------- PLOTTING ----------------------------
    def _plot_all(
        self,
        f_expr: sp.Expr,
        derivative_expr: Optional[sp.Expr],
        integral_expr: Optional[sp.Expr],
        analysis_input: AnalysisInput,
    ) -> None:
        x = self.x
        x_min, x_max = analysis_input.x_min, analysis_input.x_max
        num = analysis_input.num_samples

        xx = np.linspace(x_min, x_max, num=num)
        f_num = self._safe_lambdify_evaluate(f_expr, xx)

        # Derivative numeric
        if derivative_expr is not None:
            d_num = self._safe_lambdify_evaluate(derivative_expr, xx)
        else:
            d_num = self._numeric_derivative(xx, f_num)

        # Integral numeric
        if integral_expr is not None:
            F_num = self._safe_lambdify_evaluate(integral_expr, xx)
        else:
            F_num = self._numeric_cumulative_integral(xx, f_num)

        self.canvas.clear()
        ax = self.canvas.axes

        # Avoid plotting crazy values
        def finite_mask(arr: np.ndarray) -> np.ndarray:
            return np.isfinite(arr)

        mask_f = finite_mask(f_num)
        mask_d = finite_mask(d_num)
        mask_F = finite_mask(F_num)

        if mask_f.any():
            ax.plot(xx[mask_f], f_num[mask_f], label='f(x)', color='#1f77b4')
        if mask_d.any():
            ax.plot(xx[mask_d], d_num[mask_d], label="f'(x)", color='#d62728', alpha=0.9)
        if mask_F.any():
            ax.plot(xx[mask_F], F_num[mask_F], label='∫ f(x) dx', color='#2ca02c', alpha=0.9)

        ax.set_xlim(x_min, x_max)
        ax.set_xlabel('x')
        ax.set_ylabel('value')
        ax.grid(True, alpha=0.3)
        ax.legend()
        self.canvas.draw_idle()

    def _safe_lambdify_evaluate(self, expr: sp.Expr, x_values: np.ndarray) -> np.ndarray:
        x = self.x
        try:
            key = sp.sstr(expr)
            f = self._lamb_cache.get(key)
            if f is None:
                f = sp.lambdify(x, expr, modules=['numpy'])
                self._lamb_cache[key] = f
            y = f(x_values)
            y = np.array(y, dtype=float)
        except Exception:
            # Attempt piecewise safe evaluation
            y = np.full_like(x_values, np.nan, dtype=float)
            for i, xv in enumerate(x_values):
                try:
                    y[i] = float(expr.subs(x, float(xv)).evalf())
                except Exception:
                    y[i] = np.nan
        return y

    def _numeric_derivative(self, x: np.ndarray, y: np.ndarray) -> np.ndarray:
        try:
            return np.gradient(y, x)
        except Exception:
            return np.full_like(y, np.nan)

    def _numeric_cumulative_integral(self, x: np.ndarray, y: np.ndarray) -> np.ndarray:
        # Trapezoidal cumulative integral with F(x0) = 0
        F = np.zeros_like(y, dtype=float)
        try:
            dx = np.diff(x)
            avg = 0.5 * (y[1:] + y[:-1])
            F[1:] = np.cumsum(dx * avg)
            return F
        except Exception:
            return np.full_like(y, np.nan)

    # ---------------------------- PRETTY/HTML HELPERS ----------------------------
    def _to_pretty_text(self, value: object) -> str:
        try:
            if isinstance(value, sp.Basic):
                return sp.pretty(value, use_unicode=True)
            if isinstance(value, str):
                if value.startswith('('):
                    return value
                expr = sp.sympify(value, locals=self._build_sympy_locals())
                return sp.pretty(expr, use_unicode=True)
            return str(value)
        except Exception:
            return str(value)

    def _row_html(self, label: str, value_text: str) -> str:
        return (
            f"<tr><td class='label'>{html.escape(label)}</td>"
            f"<td><pre class='kv'>{html.escape(value_text)}</pre></td></tr>"
        )

    # ---------------------------- RENDER TEXT ----------------------------
    def _render_results_text(
        self,
        f_expr: sp.Expr,
        odd_even: str,
        taylor_series: str,
        derivative_text: str,
        integral_text: str,
        fourier_text: str,
        laplace_main_text: str,
        laplace_cond_text: Optional[str],
    ) -> None:
        styles = (
            "<style>"
            ".label{font-weight:600; padding-right:10px; vertical-align:top;}"
            "table.kv{border-collapse:collapse; width:100%;}"
            "table.kv td{border:none; padding:2px 0;}"
            ".kv{font-family:'DejaVu Sans Mono','Consolas',monospace; white-space:pre-wrap; margin:0;}"
            "</style>"
        )

        rows: List[str] = []
        rows.append(self._row_html("Input f(x)", self._to_pretty_text(f_expr)))
        rows.append(self._row_html("Odd/Even", odd_even))
        rows.append(self._row_html("Taylor expansion", self._to_pretty_text(taylor_series)))
        rows.append(self._row_html("Derivative", self._to_pretty_text(derivative_text)))
        rows.append(self._row_html("Integral", self._to_pretty_text(integral_text)))
        rows.append(self._row_html("Fourier transform F(ω)", self._to_pretty_text(fourier_text)))
        # Laplace main
        rows.append(self._row_html("Laplace transform F(s)", self._to_pretty_text(laplace_main_text)))
        if laplace_cond_text:
            rows.append(self._row_html("Laplace conditions", laplace_cond_text))

        html_text = styles + "<table class='kv'>" + "".join(rows) + "</table>"
        self.results_text.setHtml(html_text)


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Function Analyzer - PySide6")
    parser.add_argument("--check", action="store_true", help="Run a quick UI construction check and exit")
    args = parser.parse_args()

    app = QApplication(sys.argv)
    window = FunctionAnalyzerWindow()
    window.show()

    if args.check:
        # Short timer to close immediately
        from PySide6.QtCore import QTimer
        QTimer.singleShot(200, app.quit)
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main()) 