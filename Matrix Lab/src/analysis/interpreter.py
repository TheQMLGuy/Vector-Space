"""
Insight Interpreter
Generates natural language explanations of matrix properties across three lenses:
- Geometric: How the matrix transforms space
- Algebraic: What it means for systems of equations
- Numerical: Stability and computational considerations
"""

import numpy as np
from typing import Dict, List
from src.analysis.matrix_analyzer import MatrixAnalyzer


class InsightInterpreter:
    """Generates human-readable insights from matrix properties."""
    
    @staticmethod
    def generate_geometric_insights(matrix: np.ndarray, analysis: Dict) -> List[str]:
        """
        Generate geometric interpretations (how matrix affects space).
        
        Args:
            matrix: Input matrix
            analysis: Full analysis dict from MatrixAnalyzer
            
        Returns:
            List of insight strings
        """
        insights = []
        
        props = analysis['basic_properties']
        classification = analysis['classification']
        
        # Determinant insights
        if props['determinant'] is not None:
            det = props['determinant']
            
            if np.isclose(det, 0, atol=1e-10):
                insights.append("⚠️ **Dimension Collapse**: This matrix collapses space into a lower dimension. "
                              "Information is lost - you cannot recover the original vector from the transformed one.")
            
            elif np.isclose(abs(det), 1, atol=1e-10):
                if det > 0:
                    insights.append("✓ **Volume Preservation**: This transformation preserves volumes. "
                                  "A unit square remains a unit square (though possibly rotated/sheared).")
                else:
                    insights.append("✓ **Volume Preservation with Flip**: Preserves volume but inverts orientation. "
                                  "This is a reflection - like looking in a mirror.")
            
            elif abs(det) > 1:
                insights.append(f"📐 **Space Expansion**: Areas/volumes are scaled by a factor of {abs(det):.2f}. "
                              f"A unit square becomes a parallelogram with area {abs(det):.2f}.")
            
            else:  # 0 < |det| < 1
                insights.append(f"📐 **Space Compression**: Areas/volumes are scaled down by factor {abs(det):.4f}. "
                              f"Objects shrink under this transformation.")
        
        # Orthogonality insights
        if classification['orthogonal']:
            insights.append("✓ **Rigid Body Motion**: This is a pure rotation and/or reflection. "
                          "Angles and distances are perfectly preserved. No stretching or squashing occurs.")
        
        # Symmetric insights
        if classification['symmetric']:
            insights.append("✓ **Symmetric Transformation**: This matrix represents a pure stretch along "
                          "perpendicular (orthogonal) axes. No rotation component exists.")
        
        # Diagonal insights
        if classification['diagonal']:
            insights.append("✓ **Axis-Aligned Scaling**: This transformation only stretches/compresses along "
                          "the coordinate axes. No rotation or shearing.")
        
        # Identity insights
        if classification['identity']:
            insights.append("✓ **Identity Transformation**: This does absolutely nothing - every vector maps to itself. "
                          "The space remains completely unchanged.")
        
        # Eigenvalue insights (for square matrices)
        if 'eigenanalysis' in analysis and analysis['eigenanalysis']:
            eigenvalues = analysis['eigenanalysis']['eigenvalues']
            
            # Check for real eigenvalues
            real_eigs = [e for e in eigenvalues if np.isreal(e)]
            complex_eigs = [e for e in eigenvalues if not np.isreal(e)]
            
            if len(complex_eigs) > 0:
                insights.append(f"🔄 **Rotation Component**: Found {len(complex_eigs)} complex eigenvalue(s). "
                              "This matrix includes rotation - vectors spiral around the origin.")
            
            if len(real_eigs) > 0:
                insights.append(f"⚡ **Stretching Axes**: The eigenvectors are the 'axles' of transformation. "
                              f"Vectors along these {len(real_eigs)} direction(s) only stretch/compress, never rotate.")
        
        return insights
    
    @staticmethod
    def generate_algebraic_insights(matrix: np.ndarray, analysis: Dict) -> List[str]:
        """
        Generate algebraic interpretations (systems of equations perspective).
        
        Args:
            matrix: Input matrix
            analysis: Full analysis dict
            
        Returns:
            List of insight strings
        """
        insights = []
        
        props = analysis['basic_properties']
        classification = analysis['classification']
        
        rows = props['rows']
        cols = props['cols']
        rank = props['rank']
        nullity = props['nullity']
        
        # Rank-Nullity insights
        if rank == min(rows, cols):
            insights.append("✓ **Full Rank**: The columns are linearly independent and span the entire space. "
                          "Every target vector b is reachable.")
        else:
            insights.append(f"⚠️ **Rank Deficient**: Rank is {rank} but dimension is {min(rows, cols)}. "
                          f"The columns are linearly dependent - some are redundant.")
        
        # Solution uniqueness
        if rows == cols:  # Square matrix
            if classification['invertible']:
                insights.append("✓ **Unique Solution**: For any right-hand side b, the equation Ax = b has "
                              "exactly one solution. The matrix is invertible.")
            else:
                insights.append("⚠️ **No Unique Solution**: The system Ax = b either has no solution or "
                              "infinitely many solutions, depending on b. The matrix is singular.")
        
        elif rows > cols:  # Tall matrix
            if rank == cols:
                insights.append("📊 **Overdetermined System**: More equations than unknowns. "
                              "Solutions might not exist for arbitrary b (least-squares solution recommended).")
            else:
                insights.append("📊 **Overconstrained & Dependent**: More equations than unknowns, "
                              "but some equations are redundant. Typically no exact solution exists.")
        
        else:  # Wide matrix (rows < cols)
            insights.append("📊 **Underdetermined System**: More unknowns than equations. "
                          "Infinitely many solutions exist (if any solution exists at all).")
        
        # Null space insights
        if nullity and nullity > 0:
            insights.append(f"🔍 **Non-Trivial Null Space**: There are {nullity} independent vector(s) that "
                          f"get mapped to zero. The kernel/null space has dimension {nullity}.")
        
        # Diagonalizability (if eigenanalysis available)
        if 'eigenanalysis' in analysis and analysis['eigenanalysis']:
            eigenvalues = analysis['eigenanalysis']['eigenvalues']
            eigenvectors = analysis['eigenanalysis']['eigenvectors']
            
            # Check if eigenvectors are linearly independent
            if rows == cols and rank == rows:
                try:
                    # If eigenvectors form a basis, matrix is diagonalizable
                    eig_rank = np.linalg.matrix_rank(eigenvectors)
                    if eig_rank == rows:
                        insights.append("✓ **Diagonalizable**: Can be decoupled into independent scalar equations. "
                                      "The system can be solved independently in the eigenbasis.")
                except:
                    pass
        
        return insights
    
    @staticmethod
    def generate_numerical_insights(matrix: np.ndarray, analysis: Dict) -> List[str]:
        """
        Generate numerical/computational insights (stability, precision).
        
        Args:
            matrix: Input matrix
            analysis: Full analysis dict
            
        Returns:
            List of insight strings
        """
        insights = []
        
        cond = analysis.get('condition_number')
        classification = analysis['classification']
        
        # Condition number warnings
        if cond is not None:
            if np.isinf(cond):
                insights.append("🚨 **Singular Matrix**: Condition number is infinite. "
                              "The matrix cannot be inverted. Numerical algorithms will fail.")
            
            elif cond > 1e10:
                insights.append(f"🚨 **Extremely Ill-Conditioned**: κ ≈ {cond:.2e}. "
                              "Tiny errors in input cause massive errors in output. "
                              "Do NOT trust floating-point inversion results.")
            
            elif cond > 1000:
                insights.append(f"⚠️ **Ill-Conditioned**: κ ≈ {cond:.2e}. "
                              "The matrix is nearly singular. Expect amplified numerical errors.")
            
            elif cond > 100:
                insights.append(f"⚡ **Moderate Conditioning**: κ ≈ {cond:.2f}. "
                              "Some error amplification expected, but generally safe for computation.")
            
            else:
                insights.append(f"✓ **Well-Conditioned**: κ ≈ {cond:.2f}. "
                              "Numerically stable for inversion and solving linear systems.")
        
        # Symmetry + Definiteness (important for optimization)
        if classification['symmetric'] and classification['positive_definite']:
            insights.append("✓ **Convex Energy Landscape**: This is a symmetric positive definite (SPD) matrix. "
                          "It represents a convex bowl. Optimization algorithms like gradient descent "
                          "will converge to a unique global minimum.")
        
        elif classification['symmetric']:
            insights.append("📐 **Symmetric but Not Positive Definite**: The energy landscape has "
                          "saddle points. Not all optimization algorithms will converge.")
        
        # Sparse vs Dense (future enhancement)
        nonzero_ratio = np.count_nonzero(matrix) / matrix.size
        if nonzero_ratio < 0.3:
            insights.append(f"💾 **Sparse Matrix**: Only {nonzero_ratio*100:.1f}% of entries are non-zero. "
                          "Consider using sparse matrix algorithms for efficiency.")
        
        return insights
    
    @staticmethod
    def generate_all_insights(matrix: np.ndarray) -> Dict[str, List[str]]:
        """
        Generate all insights across all three lenses.
        
        Args:
            matrix: Input matrix
            
        Returns:
            Dictionary with 'geometric', 'algebraic', 'numerical' keys
        """
        # Get full analysis
        analysis = MatrixAnalyzer.analyze_full(matrix)
        
        return {
            'geometric': InsightInterpreter.generate_geometric_insights(matrix, analysis),
            'algebraic': InsightInterpreter.generate_algebraic_insights(matrix, analysis),
            'numerical': InsightInterpreter.generate_numerical_insights(matrix, analysis)
        }
