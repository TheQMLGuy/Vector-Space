## Function Analyzer (PySide6)

A single-file PySide6 dashboard to analyze a function (like a lightweight Wolfram Alpha for single-variable functions).

Features:
- Odd/Even classification
- Taylor expansion around a point
- Fourier transform (symbolic if possible)
- Laplace transform (symbolic if possible)
- Plot of f(x), f'(x), and ∫f(x)dx
- Three input modes: Function expression, Interpolation (points), Regression (polynomial LS fit)

### Setup

```bash
# Windows (PowerShell)
python -m venv .venv
.\.venv\Scripts\python -m pip install -U pip
.\.venv\Scripts\pip install -r requirements.txt
```

### Run

```bash
# Launch the GUI
.\.venv\Scripts\python function_analyzer.py

# Quick check (builds UI and quits)
.\.venv\Scripts\python function_analyzer.py --check
```

### Notes
- Expressions are parsed by SymPy. Examples: `sin(x)`, `exp(-x)`, `x^2` (use `x**2` in Python syntax), `abs(x)`, `Heaviside(x)`.
- For Interpolation, paste or load CSV `x,y` pairs; a polynomial interpolant is constructed.
- For Regression, choose polynomial degree; least-squares fit is converted into a symbolic polynomial.
- If symbolic integral is not available, the plot shows a numerical cumulative integral instead. 