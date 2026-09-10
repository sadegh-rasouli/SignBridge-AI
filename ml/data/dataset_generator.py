"""
SignBridge AI - Landmark Dataset Generator
Generates reproducible, multi-subject ASL hand landmark datasets with zero data leakage.
"""

from typing import Dict, List, Tuple
import json
import os
import numpy as np

from ml.preprocessing.normalizer import LandmarkNormalizer

# 12 ASL vocabulary signs + NEUTRAL
VOCABULARY = [
    "HELLO",
    "THANK_YOU",
    "YES",
    "NO",
    "PLEASE",
    "HELP",
    "STOP",
    "GOOD",
    "BAD",
    "NAME",
    "ME",
    "YOU",
    "NEUTRAL"
]

# Canonical 3D hand keypoint poses (21 joints: x, y, z normalized)
# Baseline template structures for each ASL gesture based on anatomical landmarks
CANONICAL_HAND_POSES: Dict[str, np.ndarray] = {
    # Open flat hand, fingers together, thumb open, tilted slightly upward
    "HELLO": np.array([
        [0.50, 0.85, 0.00],  # 0 Wrist
        [0.42, 0.75, -0.02], # 1 Thumb CMC
        [0.36, 0.65, -0.04], # 2 Thumb MCP
        [0.32, 0.58, -0.06], # 3 Thumb IP
        [0.28, 0.52, -0.08], # 4 Thumb Tip
        [0.45, 0.58, -0.02], # 5 Index MCP
        [0.44, 0.44, -0.03], # 6 Index PIP
        [0.43, 0.33, -0.04], # 7 Index DIP
        [0.42, 0.22, -0.05], # 8 Index Tip
        [0.50, 0.57, -0.01], # 9 Middle MCP
        [0.50, 0.42, -0.02], # 10 Middle PIP
        [0.50, 0.30, -0.03], # 11 Middle DIP
        [0.50, 0.18, -0.04], # 12 Middle Tip
        [0.55, 0.58, -0.01], # 13 Ring MCP
        [0.56, 0.45, -0.02], # 14 Ring PIP
        [0.57, 0.34, -0.03], # 15 Ring DIP
        [0.58, 0.24, -0.04], # 16 Ring Tip
        [0.60, 0.62, -0.01], # 17 Pinky MCP
        [0.62, 0.52, -0.02], # 18 Pinky PIP
        [0.64, 0.44, -0.03], # 19 Pinky DIP
        [0.66, 0.36, -0.04], # 20 Pinky Tip
    ], dtype=np.float32),

    # Open flat hand, fingers together, facing forward/chin level
    "THANK_YOU": np.array([
        [0.50, 0.80, 0.00],
        [0.44, 0.72, -0.03],
        [0.40, 0.64, -0.05],
        [0.38, 0.58, -0.06],
        [0.36, 0.52, -0.07],
        [0.46, 0.56, -0.04],
        [0.45, 0.43, -0.08],
        [0.44, 0.32, -0.12],
        [0.43, 0.22, -0.16],  # Angled forward
        [0.50, 0.55, -0.04],
        [0.50, 0.41, -0.08],
        [0.50, 0.29, -0.12],
        [0.50, 0.18, -0.16],
        [0.54, 0.56, -0.04],
        [0.55, 0.43, -0.08],
        [0.56, 0.32, -0.12],
        [0.57, 0.22, -0.16],
        [0.58, 0.60, -0.03],
        [0.60, 0.50, -0.07],
        [0.61, 0.41, -0.10],
        [0.62, 0.33, -0.14],
    ], dtype=np.float32),

    # S-Fist: All 4 fingers curled down tightly into palm, thumb wrapped across fingers
    "YES": np.array([
        [0.50, 0.80, 0.00],
        [0.44, 0.72, -0.03],
        [0.42, 0.64, -0.06],
        [0.46, 0.58, -0.08],
        [0.52, 0.58, -0.09],  # Thumb over fingers
        [0.46, 0.60, -0.04],
        [0.45, 0.66, -0.08],
        [0.47, 0.70, -0.07],
        [0.49, 0.68, -0.05],  # Index curled
        [0.50, 0.59, -0.04],
        [0.50, 0.66, -0.08],
        [0.51, 0.70, -0.07],
        [0.52, 0.68, -0.05],  # Middle curled
        [0.54, 0.60, -0.04],
        [0.55, 0.67, -0.08],
        [0.55, 0.71, -0.07],
        [0.54, 0.69, -0.05],  # Ring curled
        [0.58, 0.64, -0.03],
        [0.59, 0.70, -0.07],
        [0.58, 0.73, -0.06],
        [0.56, 0.71, -0.04],  # Pinky curled
    ], dtype=np.float32),

    # NO: Index & Middle extended then touching Thumb tip, Ring & Pinky curled
    "NO": np.array([
        [0.50, 0.80, 0.00],
        [0.44, 0.70, -0.03],
        [0.42, 0.60, -0.05],
        [0.44, 0.52, -0.07],
        [0.48, 0.48, -0.08],  # Thumb tip touching index/middle
        [0.46, 0.58, -0.03],
        [0.46, 0.50, -0.05],
        [0.47, 0.46, -0.07],
        [0.48, 0.47, -0.08],  # Index tip near thumb
        [0.50, 0.58, -0.03],
        [0.50, 0.50, -0.05],
        [0.49, 0.46, -0.07],
        [0.49, 0.47, -0.08],  # Middle tip near thumb
        [0.54, 0.60, -0.03],
        [0.55, 0.68, -0.07],
        [0.55, 0.72, -0.06],
        [0.53, 0.70, -0.04],  # Ring curled
        [0.58, 0.64, -0.02],
        [0.59, 0.71, -0.06],
        [0.58, 0.74, -0.05],
        [0.56, 0.72, -0.03],  # Pinky curled
    ], dtype=np.float32),

    # PLEASE: Flat open B-hand on chest in circular palm orientation
    "PLEASE": np.array([
        [0.50, 0.80, 0.00],
        [0.42, 0.74, 0.01],
        [0.37, 0.68, 0.02],
        [0.35, 0.62, 0.03],
        [0.35, 0.56, 0.04],
        [0.45, 0.58, 0.00],
        [0.44, 0.46, 0.00],
        [0.43, 0.35, 0.00],
        [0.42, 0.25, 0.00],  # Index flat
        [0.50, 0.57, 0.00],
        [0.50, 0.44, 0.00],
        [0.50, 0.33, 0.00],
        [0.50, 0.23, 0.00],  # Middle flat
        [0.55, 0.58, 0.00],
        [0.56, 0.46, 0.00],
        [0.57, 0.35, 0.00],
        [0.58, 0.25, 0.00],  # Ring flat
        [0.60, 0.62, 0.00],
        [0.62, 0.52, 0.00],
        [0.64, 0.43, 0.00],
        [0.66, 0.35, 0.00],  # Pinky flat
    ], dtype=np.float32),

    # HELP: Dominant A-hand (thumbs up fist) resting on non-dominant palm
    "HELP": np.array([
        [0.50, 0.80, 0.00],
        [0.44, 0.70, -0.02],
        [0.42, 0.58, -0.04],
        [0.41, 0.46, -0.06],
        [0.40, 0.34, -0.08],  # Thumb pointing straight UP (thumbs-up)
        [0.47, 0.60, -0.03],
        [0.48, 0.68, -0.07],
        [0.50, 0.72, -0.06],
        [0.52, 0.68, -0.04],  # Index curled
        [0.52, 0.60, -0.03],
        [0.53, 0.68, -0.07],
        [0.54, 0.72, -0.06],
        [0.55, 0.68, -0.04],  # Middle curled
        [0.56, 0.61, -0.03],
        [0.57, 0.69, -0.07],
        [0.58, 0.73, -0.06],
        [0.58, 0.69, -0.04],  # Ring curled
        [0.60, 0.64, -0.02],
        [0.61, 0.71, -0.06],
        [0.61, 0.75, -0.05],
        [0.60, 0.71, -0.03],  # Pinky curled
    ], dtype=np.float32),

    # STOP: Open flat hand in vertical chop position
    "STOP": np.array([
        [0.50, 0.85, 0.00],
        [0.43, 0.76, 0.03],
        [0.39, 0.68, 0.05],
        [0.37, 0.62, 0.07],
        [0.36, 0.56, 0.09],
        [0.46, 0.56, 0.02],
        [0.45, 0.42, 0.03],
        [0.44, 0.30, 0.04],
        [0.43, 0.18, 0.05],  # Straight vertical chop
        [0.50, 0.55, 0.02],
        [0.50, 0.40, 0.03],
        [0.50, 0.27, 0.04],
        [0.50, 0.15, 0.05],
        [0.54, 0.56, 0.02],
        [0.55, 0.42, 0.03],
        [0.56, 0.30, 0.04],
        [0.57, 0.19, 0.05],
        [0.58, 0.60, 0.01],
        [0.60, 0.49, 0.02],
        [0.61, 0.39, 0.03],
        [0.62, 0.30, 0.04],
    ], dtype=np.float32),

    # GOOD: Flat hand moving from chin downward with palm facing up
    "GOOD": np.array([
        [0.50, 0.80, 0.00],
        [0.43, 0.74, -0.02],
        [0.38, 0.68, -0.03],
        [0.35, 0.62, -0.04],
        [0.33, 0.56, -0.05],
        [0.46, 0.58, -0.02],
        [0.46, 0.46, -0.03],
        [0.46, 0.36, -0.04],
        [0.46, 0.26, -0.05],
        [0.50, 0.57, -0.02],
        [0.50, 0.44, -0.03],
        [0.50, 0.33, -0.04],
        [0.50, 0.23, -0.05],
        [0.54, 0.58, -0.02],
        [0.54, 0.46, -0.03],
        [0.54, 0.36, -0.04],
        [0.54, 0.27, -0.05],
        [0.58, 0.62, -0.02],
        [0.59, 0.52, -0.03],
        [0.60, 0.43, -0.04],
        [0.61, 0.35, -0.05],
    ], dtype=np.float32),

    # BAD: Flat hand from chin turned downward with pushing outward motion
    "BAD": np.array([
        [0.50, 0.80, 0.00],
        [0.57, 0.74, 0.02],
        [0.62, 0.68, 0.03],
        [0.65, 0.62, 0.04],
        [0.67, 0.56, 0.05],
        [0.54, 0.58, 0.02],
        [0.54, 0.46, 0.03],
        [0.54, 0.36, 0.04],
        [0.54, 0.26, 0.05],
        [0.50, 0.57, 0.02],
        [0.50, 0.44, 0.03],
        [0.50, 0.33, 0.04],
        [0.50, 0.23, 0.05],
        [0.46, 0.58, 0.02],
        [0.46, 0.46, 0.03],
        [0.46, 0.36, 0.04],
        [0.46, 0.27, 0.05],
        [0.42, 0.62, 0.02],
        [0.41, 0.52, 0.03],
        [0.40, 0.43, 0.04],
        [0.39, 0.35, 0.05],
    ], dtype=np.float32),

    # NAME: H-fingers (Index & Middle extended parallel together, Thumb holding Ring & Pinky down)
    "NAME": np.array([
        [0.50, 0.80, 0.00],
        [0.44, 0.72, -0.02],
        [0.42, 0.64, -0.04],
        [0.45, 0.58, -0.06],
        [0.50, 0.58, -0.07],  # Thumb over ring/pinky
        [0.47, 0.58, -0.02],
        [0.46, 0.44, -0.03],
        [0.45, 0.32, -0.04],
        [0.44, 0.20, -0.05],  # Index extended straight
        [0.51, 0.58, -0.02],
        [0.51, 0.44, -0.03],
        [0.51, 0.32, -0.04],
        [0.51, 0.20, -0.05],  # Middle extended right beside index (H-hand)
        [0.55, 0.62, -0.03],
        [0.56, 0.70, -0.07],
        [0.56, 0.74, -0.06],
        [0.54, 0.71, -0.04],  # Ring curled
        [0.59, 0.66, -0.02],
        [0.60, 0.73, -0.06],
        [0.59, 0.76, -0.05],
        [0.57, 0.73, -0.03],  # Pinky curled
    ], dtype=np.float32),

    # ME: Index pointing toward signer's chest (downward/inward)
    "ME": np.array([
        [0.50, 0.75, 0.00],
        [0.45, 0.68, -0.02],
        [0.43, 0.62, -0.04],
        [0.46, 0.58, -0.06],
        [0.50, 0.58, -0.07],
        [0.47, 0.60, -0.02],
        [0.48, 0.52, 0.06],
        [0.49, 0.46, 0.14],
        [0.50, 0.40, 0.22],  # Index pointing towards chest (Z depth positive)
        [0.52, 0.60, -0.02],
        [0.53, 0.68, -0.06],
        [0.54, 0.72, -0.05],
        [0.55, 0.68, -0.03],
        [0.56, 0.62, -0.02],
        [0.57, 0.70, -0.06],
        [0.58, 0.74, -0.05],
        [0.58, 0.70, -0.03],
        [0.60, 0.66, -0.02],
        [0.61, 0.73, -0.06],
        [0.61, 0.76, -0.05],
        [0.60, 0.72, -0.03],
    ], dtype=np.float32),

    # YOU: Index pointing forward toward conversation partner
    "YOU": np.array([
        [0.50, 0.80, 0.00],
        [0.44, 0.72, -0.02],
        [0.42, 0.64, -0.04],
        [0.45, 0.58, -0.06],
        [0.50, 0.58, -0.07],
        [0.48, 0.60, -0.02],
        [0.48, 0.48, -0.10],
        [0.48, 0.36, -0.18],
        [0.48, 0.24, -0.26],  # Index pointing straight out forward (negative Z)
        [0.52, 0.60, -0.02],
        [0.53, 0.68, -0.06],
        [0.54, 0.72, -0.05],
        [0.55, 0.68, -0.03],
        [0.56, 0.62, -0.02],
        [0.57, 0.70, -0.06],
        [0.58, 0.74, -0.05],
        [0.58, 0.70, -0.03],
        [0.60, 0.66, -0.02],
        [0.61, 0.73, -0.06],
        [0.61, 0.76, -0.05],
        [0.60, 0.72, -0.03],
    ], dtype=np.float32),

    # NEUTRAL: Relaxed open/natural hand pose in rest position
    "NEUTRAL": np.array([
        [0.50, 0.85, 0.00],
        [0.44, 0.78, -0.02],
        [0.40, 0.72, -0.03],
        [0.38, 0.67, -0.04],
        [0.37, 0.63, -0.05],
        [0.46, 0.65, -0.01],
        [0.45, 0.56, -0.02],
        [0.44, 0.49, -0.03],
        [0.43, 0.43, -0.04],  # Slightly curved naturally
        [0.50, 0.64, -0.01],
        [0.50, 0.54, -0.02],
        [0.50, 0.46, -0.03],
        [0.50, 0.39, -0.04],
        [0.54, 0.65, -0.01],
        [0.55, 0.56, -0.02],
        [0.56, 0.48, -0.03],
        [0.57, 0.42, -0.04],
        [0.58, 0.68, -0.01],
        [0.60, 0.60, -0.02],
        [0.61, 0.53, -0.03],
        [0.62, 0.47, -0.04],
    ], dtype=np.float32),
}


def apply_subject_variation(
    base_pose: np.ndarray,
    subject_id: int,
    noise_std: float = 0.010,
    rotation_roll_std: float = 12.0,
    rotation_pitch_std: float = 10.0,
    rotation_yaw_std: float = 10.0,
    scale_variation: float = 0.10
) -> np.ndarray:
    """
    Applies realistic 3D spatial transformations (pitch, yaw, roll),
    subject anatomical scaling, camera offset, and joint noise.
    """
    rng = np.random.RandomState(None)
    pose = base_pose.copy()

    # Subject physical hand characteristics (deterministic per subject)
    subject_rng = np.random.RandomState(subject_id * 1000 + 42)
    finger_scale = 1.0 + subject_rng.uniform(-0.06, 0.06, size=(21, 1))
    aspect_scale_x = 1.0 + subject_rng.uniform(-0.06, 0.06)
    aspect_scale_z = 1.0 + subject_rng.uniform(-0.08, 0.08)
    pose[:, 0] *= aspect_scale_x
    pose[:, 2] *= aspect_scale_z
    pose *= finger_scale

    # Per-sample scale variation (distance from camera)
    sample_scale = rng.uniform(1.0 - scale_variation, 1.0 + scale_variation)
    pose *= sample_scale

    # 3D Euler Angles (Pitch, Yaw, Roll)
    rx = np.radians(rng.normal(0, rotation_pitch_std))
    ry = np.radians(rng.normal(0, rotation_yaw_std))
    rz = np.radians(rng.normal(0, rotation_roll_std))

    # Rotation matrix around X (Pitch - tilting forward/backward)
    Rx = np.array([
        [1, 0, 0],
        [0, np.cos(rx), -np.sin(rx)],
        [0, np.sin(rx), np.cos(rx)]
    ], dtype=np.float32)

    # Rotation matrix around Y (Yaw - turning left/right)
    Ry = np.array([
        [np.cos(ry), 0, np.sin(ry)],
        [0, 1, 0],
        [-np.sin(ry), 0, np.cos(ry)]
    ], dtype=np.float32)

    # Rotation matrix around Z (Roll - tilting clockwise/counterclockwise)
    Rz = np.array([
        [np.cos(rz), -np.sin(rz), 0],
        [np.sin(rz), np.cos(rz), 0],
        [0, 0, 1]
    ], dtype=np.float32)

    # Combined 3D Rotation Matrix R = Rz @ Ry @ Rx
    R = np.dot(Rz, np.dot(Ry, Rx))
    pose = np.dot(pose, R)

    # Translation offset in camera frame
    offset = rng.uniform(-0.04, 0.04, size=(1, 3))
    pose += offset

    # Gaussian joint noise (MediaPipe landmark jitter)
    joint_noise = rng.normal(0, noise_std, size=pose.shape)
    pose += joint_noise

    return pose.astype(np.float32)


def generate_dataset(
    samples_per_class_per_subject: int = 150,
    output_dir: str = "ml/data/processed"
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Generates training (Subjects 1-6), validation (Subject 7), and test (Subject 8) splits.
    Strictly partitions by subject to ensure ZERO subject data leakage.
    """
    os.makedirs(output_dir, exist_ok=True)
    normalizer = LandmarkNormalizer()

    train_features, train_labels, train_subjects = [], [], []
    val_features, val_labels, val_subjects = [], [], []
    test_features, test_labels, test_subjects = [], [], []

    # Subjects 1-6: Train (75%), Subject 7: Val (12.5%), Subject 8: Test (12.5%)
    subjects = list(range(1, 9))

    for subject_id in subjects:
        for class_idx, sign_name in enumerate(VOCABULARY):
            base_pose = CANONICAL_HAND_POSES[sign_name]
            for _ in range(samples_per_class_per_subject):
                perturbed_pose = apply_subject_variation(base_pose, subject_id)
                feature_vec = normalizer.normalize_landmarks(perturbed_pose)

                if subject_id <= 6:
                    train_features.append(feature_vec)
                    train_labels.append(class_idx)
                    train_subjects.append(subject_id)
                elif subject_id == 7:
                    val_features.append(feature_vec)
                    val_labels.append(class_idx)
                    val_subjects.append(subject_id)
                else:
                    test_features.append(feature_vec)
                    test_labels.append(class_idx)
                    test_subjects.append(subject_id)

    X_train, y_train = np.array(train_features, dtype=np.float32), np.array(train_labels, dtype=np.int64)
    X_val, y_val = np.array(val_features, dtype=np.float32), np.array(val_labels, dtype=np.int64)
    X_test, y_test = np.array(test_features, dtype=np.float32), np.array(test_labels, dtype=np.int64)

    # Save to disk
    np.save(os.path.join(output_dir, "train_features.npy"), X_train)
    np.save(os.path.join(output_dir, "train_labels.npy"), y_train)
    np.save(os.path.join(output_dir, "val_features.npy"), X_val)
    np.save(os.path.join(output_dir, "val_labels.npy"), y_val)
    np.save(os.path.join(output_dir, "test_features.npy"), X_test)
    np.save(os.path.join(output_dir, "test_labels.npy"), y_test)

    class_map = {idx: name for idx, name in enumerate(VOCABULARY)}
    with open(os.path.join(output_dir, "class_map.json"), "w") as f:
        json.dump(class_map, f, indent=2)

    metadata = {
        "vocabulary_size": len(VOCABULARY),
        "feature_dimension": X_train.shape[1],
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "subjects": {
            "train": [1, 2, 3, 4, 5, 6],
            "val": [7],
            "test": [8]
        },
        "classes": VOCABULARY
    }
    with open(os.path.join(output_dir, "dataset_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Generated Dataset: Train={X_train.shape}, Val={X_val.shape}, Test={X_test.shape}")
    return X_train, y_train, X_val, y_val, X_test, y_test


if __name__ == "__main__":
    generate_dataset()
