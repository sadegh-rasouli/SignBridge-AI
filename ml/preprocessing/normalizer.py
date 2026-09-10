"""
SignBridge AI - Landmark Normalization & Feature Engineering Engine
Converts raw 21 3D MediaPipe hand landmarks into invariant 84-dimensional feature vectors.
"""

from typing import List, Dict, Any, Tuple
import math
import numpy as np


class LandmarkNormalizer:
    """
    Transforms 21 3D hand landmarks into scale- and translation-invariant feature vectors.
    """

    HAND_CONNECTIONS = [
        (0, 1), (1, 2), (2, 3), (3, 4),        # Thumb
        (0, 5), (5, 6), (6, 7), (7, 8),        # Index finger
        (0, 9), (9, 10), (10, 11), (11, 12),   # Middle finger
        (0, 13), (13, 14), (14, 15), (15, 16), # Ring finger
        (0, 17), (17, 18), (18, 19), (19, 20), # Pinky
        (5, 9), (9, 13), (13, 17)              # Palm base
    ]

    FINGERTIP_INDICES = [4, 8, 12, 16, 20]     # Thumb, Index, Middle, Ring, Pinky tips
    MCP_INDICES = [1, 5, 9, 13, 17]            # MCP knuckle joints

    def __init__(self):
        pass

    def normalize_landmarks(self, landmarks: List[Dict[str, float]] | np.ndarray) -> np.ndarray:
        """
        Normalize 21 3D landmarks into an 84-dimensional feature vector.
        
        Args:
            landmarks: List of 21 dicts with 'x', 'y', 'z' keys or (21, 3) ndarray.
            
        Returns:
            np.ndarray of shape (84,) containing normalized coordinates + geometric features.
        """
        if isinstance(landmarks, list):
            coords = np.array([[lm['x'], lm['y'], lm.get('z', 0.0)] for lm in landmarks], dtype=np.float32)
        else:
            coords = np.array(landmarks, dtype=np.float32)

        if coords.shape != (21, 3):
            raise ValueError(f"Expected landmarks array of shape (21, 3), got {coords.shape}")

        # Step 1: Translation Invariance - Shift origin to Landmark 0 (Wrist)
        wrist = coords[0].copy()
        centered = coords - wrist

        # Step 2: Scale Invariance - Normalize by maximum Euclidean distance to any landmark
        distances_from_wrist = np.linalg.norm(centered, axis=1)
        max_dist = np.max(distances_from_wrist[1:])  # Exclude wrist itself (0.0)
        scale_factor = max_dist if max_dist > 1e-6 else 1.0
        normalized_coords = centered / scale_factor

        # Flatten 21 * 3 = 63 coordinates
        coord_features = normalized_coords.flatten()

        # Step 3: Geometric Features (21 additional spatial/angular features)
        # 5 fingertip-to-wrist distances
        tip_wrist_dists = np.linalg.norm(normalized_coords[self.FINGERTIP_INDICES], axis=1)
        
        # 4 adjacent fingertip-to-fingertip distances (thumb-index, index-middle, middle-ring, ring-pinky)
        inter_tip_dists = np.array([
            np.linalg.norm(normalized_coords[self.FINGERTIP_INDICES[i]] - normalized_coords[self.FINGERTIP_INDICES[i+1]])
            for i in range(4)
        ], dtype=np.float32)

        # 4 tip-to-thumb distances (index-thumb, middle-thumb, ring-thumb, pinky-thumb)
        thumb_tip = normalized_coords[4]
        tip_thumb_dists = np.array([
            np.linalg.norm(normalized_coords[idx] - thumb_tip) for idx in [8, 12, 16, 20]
        ], dtype=np.float32)

        # 5 finger extension ratios (distance from MCP to TIP / total segment length)
        extension_ratios = []
        for tip_idx, mcp_idx in zip(self.FINGERTIP_INDICES, self.MCP_INDICES):
            mcp_to_tip = np.linalg.norm(normalized_coords[tip_idx] - normalized_coords[mcp_idx])
            extension_ratios.append(mcp_to_tip)
        extension_ratios = np.array(extension_ratios, dtype=np.float32)

        # 3 palm width/aspect features
        palm_width = np.linalg.norm(normalized_coords[5] - normalized_coords[17])
        palm_height = np.linalg.norm(normalized_coords[9] - normalized_coords[0])
        palm_ratio = np.array([palm_width, palm_height, palm_width / (palm_height + 1e-6)], dtype=np.float32)

        # Combine: 63 coords + 5 + 4 + 4 + 5 + 3 = 84 features
        feature_vector = np.concatenate([
            coord_features,
            tip_wrist_dists,
            inter_tip_dists,
            tip_thumb_dists,
            extension_ratios,
            palm_ratio
        ])

        return feature_vector.astype(np.float32)
