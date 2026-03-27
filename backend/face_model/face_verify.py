from flask import Flask, request, jsonify
import json
import os
from pathlib import Path

import cv2
import numpy as np
from keras_facenet import FaceNet
from mtcnn import MTCNN

app = Flask(__name__)

EMBEDDINGS_PATH = r"C:/Users/Shreenithi/Decentralized-Voting-System/face_recognition/known_embeddings.npy"
LABELS_PATH = r"C:/Users/Shreenithi/Decentralized-Voting-System/face_recognition/known_labels.npy"
THRESHOLD = float(os.environ.get("FACE_MATCH_THRESHOLD", "0.70"))

# Exact voter-id to person mapping
VOTER_FACE_MAP = {
    "718123530480": "person_52",
    "718123530030": "person_51",
    "718123530240": "person_53",
}

known_labels = None
known_embeddings = None
detector = None
embedder = None


def normalize(v):
    norm = np.linalg.norm(v)
    if norm == 0:
        return v
    return v / norm


def load_models():
    global known_labels, known_embeddings, detector, embedder

    if not (os.path.exists(EMBEDDINGS_PATH) and os.path.exists(LABELS_PATH)):
        raise RuntimeError("Model files not found")

    known_embeddings = np.load(EMBEDDINGS_PATH, allow_pickle=True).astype(np.float32)
    known_labels = np.load(LABELS_PATH, allow_pickle=True).astype(str)

    mapping_path = str(Path(LABELS_PATH).with_name("mapping.json"))
    if os.path.exists(mapping_path):
        with open(mapping_path, "r", encoding="utf-8") as f:
            mapping = json.load(f)
            if isinstance(mapping, dict):
                for k, v in mapping.items():
                    VOTER_FACE_MAP[str(k)] = str(v)

    known_embeddings = np.array([normalize(e) for e in known_embeddings], dtype=np.float32)

    detector = MTCNN()
    embedder = FaceNet()

    print(f"Loaded embeddings: {known_embeddings.shape}")
    print(f"Loaded labels: {known_labels.shape}")


def extract_face_from_image_path(image_path, size=(160, 160)):
    img = cv2.imread(image_path)
    if img is None:
        return None, "Could not read image"

    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    faces = detector.detect_faces(rgb)

    if not faces:
        return None, "No face detected"
    if len(faces) != 1:
        return None, "Exactly one face is required"

    # Use the only face
    x, y, w, h = faces[0]["box"]
    x = max(0, x)
    y = max(0, y)
    w = max(0, w)
    h = max(0, h)

    face = rgb[y:y + h, x:x + w]
    if face.size == 0:
        return None, "Invalid face crop"

    return cv2.resize(face, size), None


@app.route("/health", methods=["GET"])
def health():
    loaded = known_embeddings is not None and known_labels is not None
    return jsonify({
        "status": "Face verification service running",
        "model_status": "loaded" if loaded else "not_loaded",
        "embeddings_shape": str(known_embeddings.shape if loaded else None),
    })


@app.route("/verify-face", methods=["POST"])
def verify_face():
    try:
        data = request.json or {}
        image_path = data.get("imagePath")
        voter_id = str(data.get("voterId", "")).strip()

        if not image_path or not voter_id:
            return jsonify({"success": False, "confidence": 0, "message": "Missing imagePath or voterId"}), 400

        if voter_id not in VOTER_FACE_MAP:
            return jsonify({"success": False, "confidence": 0, "message": "Unknown voter id"}), 400

        if known_embeddings is None or known_labels is None:
            return jsonify({"success": False, "confidence": 0, "message": "Models not loaded"}), 503

        face, err = extract_face_from_image_path(image_path)
        if face is None:
            return jsonify({"success": False, "confidence": 0, "message": err}), 400

        emb = embedder.embeddings(np.expand_dims(face, axis=0))[0].astype(np.float32)
        emb = normalize(emb)
        similarities = np.dot(known_embeddings, emb)

        best_index = int(np.argmax(similarities))
        best_score = float(similarities[best_index])
        matched_label = str(known_labels[best_index])
        expected_label = VOTER_FACE_MAP[voter_id]

        exact_match = best_score >= THRESHOLD and matched_label == expected_label
        if exact_match:
            return jsonify({
                "success": True,
                "confidence": best_score,
                "matched_label": matched_label,
                "expected_label": expected_label,
                "message": "Face verification successful",
            })

        return jsonify({
            "success": False,
            "confidence": best_score,
            "matched_label": matched_label,
            "expected_label": expected_label,
            "message": "Invalid voter: face does not match registered voter",
        }), 401
    except Exception as e:
        return jsonify({"success": False, "confidence": 0, "message": f"Error: {str(e)}"}), 500


if __name__ == "__main__":
    load_models()
    print("Face Verification Service Running on http://localhost:5001")
    app.run(host="localhost", port=5001, debug=False, use_reloader=False)
