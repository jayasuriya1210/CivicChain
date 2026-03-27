import base64
import json
import os
import sys

import cv2
import numpy as np
from mtcnn import MTCNN
from keras_facenet import FaceNet
from sklearn.metrics.pairwise import cosine_similarity


EMBEDDINGS_PATH = r"C:/Users/Shreenithi/Decentralized-Voting-System/face_recognition/known_embeddings.npy"
LABELS_PATH = r"C:/Users/Shreenithi/Decentralized-Voting-System/face_recognition/known_labels.npy"
MAPPING_PATH = r"C:/Users/Shreenithi/Decentralized-Voting-System/face_recognition/mapping.json"

THRESHOLD = 0.55

DEFAULT_VOTER_FACE_MAP = {
    "718123530480": "person_52",
    "718123530030": "person_51",
    "718123530240": "person_53",
}


def load_mapping():
    mapping = dict(DEFAULT_VOTER_FACE_MAP)
    if os.path.exists(MAPPING_PATH):
        try:
            with open(MAPPING_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    mapping.update({str(k): str(v) for k, v in data.items()})
        except Exception:
            pass
    return mapping


def extract_face_rgb(image_path, detector, size=(160, 160)):
    img = cv2.imread(image_path)
    if img is None:
        return None
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    faces = detector.detect_faces(rgb)
    if not faces:
        return None
    x, y, w, h = faces[0]["box"]
    x = max(0, x)
    y = max(0, y)
    face = rgb[y:y + h, x:x + w]
    if face.size == 0:
        return None
    return cv2.resize(face, size)


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "confidence": 0.0, "message": "Usage: strict_face_match.py <image_path> <voter_id>"}))
        return 1

    image_path = sys.argv[1]
    voter_id = str(sys.argv[2])

    if not os.path.exists(EMBEDDINGS_PATH) or not os.path.exists(LABELS_PATH):
        print(json.dumps({"success": False, "confidence": 0.0, "message": "Model files not found"}))
        return 2

    known_embeddings = np.load(EMBEDDINGS_PATH)
    known_labels = np.load(LABELS_PATH, allow_pickle=True)
    mapping = load_mapping()

    expected_label = mapping.get(voter_id)
    if not expected_label:
        print(json.dumps({"success": False, "confidence": 0.0, "message": "Invalid voter: not mapped"}))
        return 3

    detector = MTCNN()
    embedder = FaceNet()

    face = extract_face_rgb(image_path, detector)
    if face is None:
        print(json.dumps({"success": False, "confidence": 0.0, "message": "No face detected"}))
        return 4

    emb = embedder.embeddings(np.expand_dims(face, axis=0))[0]
    sims = cosine_similarity([emb], known_embeddings)[0]

    best_idx = int(np.argmax(sims))
    score = float(sims[best_idx])
    matched_label = str(known_labels[best_idx])

    exact_match = score >= THRESHOLD and matched_label == expected_label
    if exact_match:
        print(json.dumps({
            "success": True,
            "confidence": score,
            "message": "Face verification successful",
            "matchedLabel": matched_label,
            "expectedLabel": expected_label
        }))
        return 0

    print(json.dumps({
        "success": False,
        "confidence": score,
        "message": "Invalid voter: face does not match registered model",
        "matchedLabel": matched_label,
        "expectedLabel": expected_label
    }))
    return 5


if __name__ == "__main__":
    sys.exit(main())
