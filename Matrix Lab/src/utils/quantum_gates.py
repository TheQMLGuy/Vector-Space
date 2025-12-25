"""
Quantum Computing Famous Matrices
"""

import numpy as np


class QuantumMatrices:
    """Famous quantum gates and matrices."""
    
    @staticmethod
    def get_quantum_gates():
        """
        Get dictionary of quantum gates.
        
        Returns:
            Dict[str, np.ndarray]: Name -> Gate mapping
        """
        return {
            # Single qubit gates
            "Pauli_X": np.array([[0, 1], [1, 0]], dtype=complex),
            "Pauli_Y": np.array([[0, -1j], [1j, 0]], dtype=complex),
            "Pauli_Z": np.array([[1, 0], [0, -1]], dtype=complex),
            
            "Hadamard": (1/np.sqrt(2)) * np.array([[1, 1], [1, -1]], dtype=complex),
            
            "Phase_S": np.array([[1, 0], [0, 1j]], dtype=complex),
            "Phase_T": np.array([[1, 0], [0, np.exp(1j*np.pi/4)]], dtype=complex),
            
            "SqrtNOT": 0.5 * np.array([[1+1j, 1-1j], [1-1j, 1+1j]], dtype=complex),
            
            # Rotation gates
            "Rx_45": np.array([
                [np.cos(np.pi/8), -1j*np.sin(np.pi/8)],
                [-1j*np.sin(np.pi/8), np.cos(np.pi/8)]
            ], dtype=complex),
            
            "Ry_45": np.array([
                [np.cos(np.pi/8), -np.sin(np.pi/8)],
                [np.sin(np.pi/8), np.cos(np.pi/8)]
            ], dtype=complex),
            
            # Two-qubit gates (4x4)
            "CNOT": np.array([
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 1],
                [0, 0, 1, 0]
            ], dtype=complex),
            
            "SWAP": np.array([
                [1, 0, 0, 0],
                [0, 0, 1, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 1]
            ], dtype=complex),
        }
    
    @staticmethod
    def add_quantum_gates_to_storage(storage):
        """
        Add quantum gates to storage.
        
        Args:
            storage: MatrixStorage instance
        """
        gates = QuantumMatrices.get_quantum_gates()
        
        for name, gate in gates.items():
            existing = storage.load(name)
            if existing is None:
                # Store real part only (storage limitation)
                storage.save(name, gate.real, tags=["quantum"])
