"""
ULTIMATE Matrix Library
Comprehensive collection of famous, test, and generated matrices.
"""

import numpy as np
from scipy import linalg


class MatrixLibrary:
    """Complete matrix library with generators."""
    
    @staticmethod
    def get_famous_matrices():
        """Get dictionary of famous matrices."""
        return {
            # Pauli Matrices
            "Pauli_X": np.array([[0, 1], [1, 0]], dtype=complex),
            "Pauli_Y": np.array([[0, -1j], [1j, 0]], dtype=complex),
            "Pauli_Z": np.array([[1, 0], [0, -1]], dtype=complex),
            "Hadamard_2x2": (1/np.sqrt(2)) * np.array([[1, 1], [1, -1]]),
            
            # Hilbert Matrices (ill-conditioned)
            "Hilbert_3x3": MatrixLibrary.hilbert(3),
            "Hilbert_4x4": MatrixLibrary.hilbert(4),
            "Hilbert_5x5": MatrixLibrary.hilbert(5),
            
            # Pascal Matrices
            "Pascal_3x3": MatrixLibrary.pascal(3),
            "Pascal_4x4": MatrixLibrary.pascal(4),
            
            # Fourier
            "Fourier_4x4": MatrixLibrary.fourier(4),
            
            # Vandermonde
            "Vandermonde_4x4": MatrixLibrary.vandermonde([1, 2, 3, 4]),
            
            # Toeplitz
            "Toeplitz_4x4": MatrixLibrary.toeplitz([4, 3, 2, 1]),
            
            # Circulant
            "Circulant_4x4": MatrixLibrary.circulant([1, 2, 3, 4]),
            
            # Frank matrix (eigenvalues known)
            "Frank_4x4": MatrixLibrary.frank(4),
            
            # Companion matrix
            "Companion_x3+2x2+3x+4": MatrixLibrary.companion([1, 2, 3, 4]),
        }
    
    # ==================== GENERATORS ====================
    
    @staticmethod
    def hilbert(n):
        """Hilbert matrix H[i,j] = 1/(i+j+1)."""
        return np.array([[1/(i+j+1) for j in range(n)] for i in range(n)])
    
    @staticmethod
    def pascal(n):
        """Pascal matrix (binomial coefficients)."""
        P = np.zeros((n, n))
        for i in range(n):
            for j in range(n):
                if j == 0:
                    P[i, j] = 1
                elif i == 0:
                    P[i, j] = 1
                else:
                    P[i, j] = P[i-1, j] + P[i, j-1]
        return P
    
    @staticmethod
    def fourier(n):
        """Discrete Fourier Transform matrix."""
        omega = np.exp(-2j * np.pi / n)
        return np.array([[omega**(i*j) for j in range(n)] for i in range(n)]) / np.sqrt(n)
    
    @staticmethod
    def vandermonde(nodes):
        """Vandermonde matrix from nodes."""
        n = len(nodes)
        return np.array([[x**i for i in range(n)] for x in nodes])
    
    @staticmethod
    def toeplitz(first_col, first_row=None):
        """Toeplitz matrix (constant diagonals)."""
        if first_row is None:
            first_row = first_col
        n = len(first_col)
        m = len(first_row)
        T = np.zeros((n, m))
        for i in range(n):
            for j in range(m):
                if i >= j:
                    T[i, j] = first_col[i - j]
                else:
                    T[i, j] = first_row[j - i]
        return T
    
    @staticmethod
    def circulant(first_row):
        """Circulant matrix (each row is rotated version of previous)."""
        n = len(first_row)
        C = np.zeros((n, n))
        for i in range(n):
            for j in range(n):
                C[i, j] = first_row[(j - i) % n]
        return C
    
    @staticmethod
    def frank(n):
        """Frank matrix (known eigenvalues, used for testing)."""
        F = np.zeros((n, n))
        for i in range(n):
            for j in range(n):
                if j >= i - 1:
                    F[i, j] = n - max(i, j)
        return F
    
    @staticmethod
    def companion(coeffs):
        """Companion matrix for polynomial with given coefficients."""
        n = len(coeffs) - 1
        C = np.zeros((n, n))
        C[0, :] = -np.array(coeffs[1:]) / coeffs[0]
        for i in range(1, n):
            C[i, i-1] = 1
        return C
    
    @staticmethod
    def hankel(first_row, last_col=None):
        """Hankel matrix (anti-diagonal constant)."""
        n = len(first_row)
        if last_col is None:
            last_col = np.zeros(n)
            last_col[0] = first_row[-1]
        full = np.concatenate([first_row, last_col[1:]])
        H = np.zeros((n, n))
        for i in range(n):
            for j in range(n):
                H[i, j] = full[i + j]
        return H
    
    # ==================== RANDOM GENERATORS ====================
    
    @staticmethod
    def random_normal(n, m=None, mean=0, std=1):
        """Random matrix with Gaussian entries."""
        if m is None:
            m = n
        return np.random.normal(mean, std, (n, m))
    
    @staticmethod
    def random_uniform(n, m=None, low=0, high=1):
        """Random matrix with uniform entries."""
        if m is None:
            m = n
        return np.random.uniform(low, high, (n, m))
    
    @staticmethod
    def random_integer(n, m=None, low=0, high=10):
        """Random matrix with integer entries."""
        if m is None:
            m = n
        return np.random.randint(low, high, (n, m)).astype(float)
    
    @staticmethod
    def random_sparse(n, m=None, density=0.3):
        """Random sparse matrix."""
        if m is None:
            m = n
        mat = np.random.randn(n, m)
        mask = np.random.random((n, m)) > density
        mat[mask] = 0
        return mat
    
    @staticmethod
    def random_symmetric(n):
        """Random symmetric matrix."""
        A = np.random.randn(n, n)
        return (A + A.T) / 2
    
    @staticmethod
    def random_positive_definite(n):
        """Random positive definite matrix."""
        A = np.random.randn(n, n)
        return A @ A.T + np.eye(n)
    
    @staticmethod
    def random_orthogonal(n):
        """Random orthogonal matrix (via QR of random)."""
        A = np.random.randn(n, n)
        Q, _ = np.linalg.qr(A)
        return Q
    
    @staticmethod
    def random_unitary(n):
        """Random unitary matrix."""
        A = np.random.randn(n, n) + 1j * np.random.randn(n, n)
        Q, _ = np.linalg.qr(A)
        return Q
    
    @staticmethod
    def random_stochastic(n):
        """Random row-stochastic matrix."""
        A = np.abs(np.random.randn(n, n))
        return A / A.sum(axis=1, keepdims=True)
    
    # ==================== SPECIAL STRUCTURE ====================
    
    @staticmethod
    def rotation_2d(theta):
        """2D rotation matrix by angle theta (radians)."""
        c, s = np.cos(theta), np.sin(theta)
        return np.array([[c, -s], [s, c]])
    
    @staticmethod
    def rotation_3d_x(theta):
        """3D rotation around X-axis."""
        c, s = np.cos(theta), np.sin(theta)
        return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
    
    @staticmethod
    def rotation_3d_y(theta):
        """3D rotation around Y-axis."""
        c, s = np.cos(theta), np.sin(theta)
        return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
    
    @staticmethod
    def rotation_3d_z(theta):
        """3D rotation around Z-axis."""
        c, s = np.cos(theta), np.sin(theta)
        return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
    
    @staticmethod
    def scaling(factors):
        """Diagonal scaling matrix."""
        return np.diag(factors)
    
    @staticmethod
    def shear_2d(k_x=0, k_y=0):
        """2D shear matrix."""
        return np.array([[1, k_x], [k_y, 1]])
    
    @staticmethod
    def projection_2d(axis='x'):
        """2D projection onto axis."""
        if axis == 'x':
            return np.array([[1, 0], [0, 0]])
        else:
            return np.array([[0, 0], [0, 1]])
    
    @staticmethod
    def add_famous_matrices_to_storage(storage):
        """Add all famous matrices to storage."""
        famous = MatrixLibrary.get_famous_matrices()
        for name, matrix in famous.items():
            existing = storage.load(name)
            if existing is None:
                storage.save(name, matrix.real if not np.iscomplexobj(matrix) else matrix, tags=["famous"])
