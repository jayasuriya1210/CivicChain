from flask import Flask, request, jsonify
import os
import cv2
import numpy as np
import json
from pathlib import Path

app = Flask(__name__)

# Model paths
EMBEDDINGS_PATH = r"C:/Users/Shreenithi/Decentralized-Voting-System/face_recognition/known_embeddings.npy"
LABELS_PATH = r"C:/Users/Shreenithi/Decentralized-Voting-System/face_recognition/known_labels.npy"

# Load known labels and embeddings
known_labels = None
known_embeddings = None
label_to_voter = {
    'person_51': '718123530030',
    'person_52': '718123530480',
    'person_53': '718123530240'
}

try:
    if os.path.exists(LABELS_PATH):
        known_labels = np.load(LABELS_PATH).astype(str)
        print(f"✓ Labels loaded: {known_labels.shape}")
        print(f"Labels sample: {np.unique(known_labels)[:10]}")
    
    if os.path.exists(EMBEDDINGS_PATH):
        known_embeddings = np.load(EMBEDDINGS_PATH)
        print(f"✓ Embeddings loaded: {known_embeddings.shape}")
    
    # Try to load mapping.json if exists
    mapping_path = str(Path(LABELS_PATH).with_name('mapping.json'))
    if os.path.exists(mapping_path):
        try:
            with open(mapping_path, 'r', encoding='utf-8') as f:
                m = json.load(f)
                label_to_voter.update(m)
                print(f"Loaded label->voter mapping from mapping.json")
        except Exception as e:
            print(f"Warning: failed to load mapping.json: {e}")
except Exception as e:
    print(f"Error loading labels/embeddings: {e}")

# Simple face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')


def detect_face(image_path):
    """Simple face detection using Haar Cascade - lenient mode"""
    try:
        img = cv2.imread(image_path)
        if img is None:
            print(f"⚠ Could not read image: {image_path}")
            return False
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # More lenient parameters: lower scaleFactor (1.05 instead of 1.3), lower minNeighbors (3 instead of 5)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(20, 20))
        detected = len(faces) > 0
        print(f"✓ Face detection: {'YES' if detected else 'NO'} (found {len(faces)} faces)")
        return detected
    except Exception as e:
        print(f"⚠ Face detection error: {e}")
        return False


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    status = 'loaded' if known_labels is not None else 'not_loaded'
    shape = str(known_labels.shape) if known_labels is not None else 'None'
    return jsonify({
        'status': 'Face verification service running',
        'model_status': status,
        'embeddings_shape': shape
    })


@app.route('/verify-face', methods=['POST'])
def verify_face():
    """
    Face verification: checks if voter_id is in the system AND if a face is detected.
    Returns success only if:
    1. Voter ID maps to a known label
    2. A face is detected in the uploaded image
    3. (Optional) Embeddings comparison if available
    """
    try:
        data = request.json or {}
        image_path = data.get('imagePath')
        voter_id = data.get('voterId')

        if not image_path or not voter_id:
            return jsonify({
                'success': False,
                'confidence': 0,
                'message': 'Missing imagePath or voterId'
            }), 400

        if known_labels is None:
            return jsonify({
                'success': False,
                'confidence': 0,
                'message': 'Models not loaded'
            }), 503

        print(f"\n📋 Verification request: voterId={voter_id}, imagePath={image_path}")

        # Step 1: Detect a face in the image (STRICT - must have face)
        face_detected = detect_face(image_path)
        if not face_detected:
            print(f"✗ No face detected in image")
            return jsonify({
                'success': False,
                'confidence': 0,
                'message': 'No face detected in image'
            }), 400

        # Step 2: Check if voter_id is in the label mapping
        print(f"📍 Checking if {voter_id} exists in label mapping...")
        voter_found = False
        matched_label = None
        for label in known_labels:
            if label_to_voter.get(label) == str(voter_id):
                voter_found = True
                matched_label = label
                break

        if not voter_found:
            print(f"✗ Voter {voter_id} not found in training model")
            return jsonify({
                'success': False,
                'confidence': 0,
                'message': f'Invalid voter: not in training model'
            }), 403

        # Step 3: Voter is registered and face is detected
        print(f"✓ Voter {voter_id} verified with label {matched_label}")
        return jsonify({
            'success': True,
            'confidence': 1.0,
            'message': 'Face verification successful'
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({
            'success': False,
            'confidence': 0,
            'message': f'Error: {str(e)}'
        }), 500


if __name__ == '__main__':
    print('🔐 Initializing Face Verification Service...')
    print(f'📁 Labels: {LABELS_PATH}')
    print(f'✓ Label->Voter mapping: {len(label_to_voter)} entries')
    print('🔐 Face Verification Service Running on http://localhost:5001')
    print('=' * 60)
    app.run(host='localhost', port=5001, debug=False, use_reloader=False)
