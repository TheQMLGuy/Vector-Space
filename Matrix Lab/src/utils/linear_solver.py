"""
Linear System Solver
Solve Ax = b with analysis.
"""

import numpy as np
from scipy import linalg


class LinearSolver:
    """Solve linear systems with detailed analysis."""
    
    @staticmethod
    def solve(A, b, method='auto'):
        """
        Solve Ax = b with error analysis.
        
        Args:
            A: Coefficient matrix
            b: Right-hand side vector or matrix
            method: 'auto', 'lu', 'qr', 'svd', 'lstsq'
            
        Returns:
            dict with solution and analysis
        """
        result = {
            'success': False,
            'x': None,
            'method': method,
            'residual_norm': None,
            'relative_error_bound': None,
            'condition_number': None,
        }
        
        try:
            # Compute condition number
            result['condition_number'] = np.linalg.cond(A)
            
            m, n = A.shape
            
            if method == 'auto':
                if m == n:
                    method = 'lu'
                else:
                    method = 'lstsq'
            
            if method == 'lu' and m == n:
                x = linalg.solve(A, b)
            elif method == 'qr':
                Q, R = linalg.qr(A)
                x = linalg.solve_triangular(R, Q.T @ b)
            elif method == 'svd':
                x = np.linalg.lstsq(A, b, rcond=None)[0]
            else:  # lstsq
                x, residuals, rank, s = np.linalg.lstsq(A, b, rcond=None)
            
            result['x'] = x
            result['success'] = True
            
            # Compute residual
            residual = A @ x - b
            result['residual'] = residual
            result['residual_norm'] = np.linalg.norm(residual)
            
            # Relative residual
            b_norm = np.linalg.norm(b)
            if b_norm > 0:
                result['relative_residual'] = result['residual_norm'] / b_norm
            
            # Error bound estimate
            result['relative_error_bound'] = result['condition_number'] * result['relative_residual'] if b_norm > 0 else None
            
        except Exception as e:
            result['error'] = str(e)
        
        return result
    
    @staticmethod
    def solve_least_squares(A, b):
        """
        Solve min ||Ax - b||_2 (least squares).
        
        Returns:
            dict with solution and analysis
        """
        result = {
            'success': False,
            'x': None,
            'residual_norm': None,
            'rank': None,
        }
        
        try:
            x, residuals, rank, s = np.linalg.lstsq(A, b, rcond=None)
            
            result['x'] = x
            result['success'] = True
            result['rank'] = rank
            result['singular_values'] = s
            
            residual = A @ x - b
            result['residual'] = residual
            result['residual_norm'] = np.linalg.norm(residual)
            
            # Effective rank
            tol = 1e-10 * s[0] if len(s) > 0 else 0
            result['effective_rank'] = np.sum(s > tol)
            
        except Exception as e:
            result['error'] = str(e)
        
        return result
    
    @staticmethod
    def solve_sylvester(A, B, C):
        """
        Solve Sylvester equation AX + XB = C.
        
        Returns:
            dict with solution matrix X
        """
        result = {'success': False, 'X': None}
        
        try:
            X = linalg.solve_sylvester(A, B, C)
            result['X'] = X
            result['success'] = True
            
            # Verification
            residual = A @ X + X @ B - C
            result['residual_norm'] = np.linalg.norm(residual, 'fro')
            
        except Exception as e:
            result['error'] = str(e)
        
        return result
    
    @staticmethod
    def solve_lyapunov(A, Q):
        """
        Solve continuous Lyapunov equation AX + XA^H = Q.
        
        Returns:
            dict with solution matrix X
        """
        result = {'success': False, 'X': None}
        
        try:
            X = linalg.solve_lyapunov(A, Q)
            result['X'] = X
            result['success'] = True
            
            residual = A @ X + X @ A.conj().T - Q
            result['residual_norm'] = np.linalg.norm(residual, 'fro')
            
        except Exception as e:
            result['error'] = str(e)
        
        return result
