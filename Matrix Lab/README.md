# Matrix Lab

An interactive PySide6 desktop application for comprehensive matrix analysis, visualization, and management.

## Features

### Phase 1 (Current)
- **Multiple Matrix Input Methods**: Manual table entry, text input (MATLAB/Python syntax), random generation, CSV/Excel import
- **Named Storage System**: Save matrices with custom names, tags, and favorites
- **Matrix Analysis**: Compute determinant, trace, rank, eigenvalues, norms, and more
- **Matrix Classification**: Identify symmetric, orthogonal, diagonal, triangular, and other special matrices
- **Modern UI**: Clean interface with dark/light themes, sidebar navigation, and collapsible properties panel

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd "Matrix Lab"
```

2. Create a virtual environment:
```bash
python -m venv .venv
```

3. Activate the virtual environment:
- Windows:
  ```bash
  .venv\Scripts\activate
  ```
- macOS/Linux:
  ```bash
  source .venv/bin/activate
  ```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

Run the application:
```bash
python main.py
```

### Quick Start

1. **Create a Matrix**: Click "New Matrix" and choose an input method
2. **Save Matrix**: Enter values and click "Save Matrix" with a custom name
3. **View Properties**: Properties panel automatically displays matrix characteristics
4. **Load Matrix**: Double-click any saved matrix in the sidebar to load it

## Development

### Project Structure
```
Matrix Lab/
├── main.py                 # Application entry point
├── src/
│   ├── storage/           # Matrix storage system
│   ├── analysis/          # Matrix analysis engine
│   ├── input/             # Input methods
│   ├── ui/                # User interface components
│   └── utils/             # Utilities
├── tests/                 # Unit tests
└── requirements.txt       # Dependencies
```

### Running Tests
```bash
pytest tests/ -v
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
