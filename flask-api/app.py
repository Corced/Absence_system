import cv2
import os
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)
recognizer = cv2.face.LBPHFaceRecognizer_create()
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def train_recognizer():
    print("⚙️ Training recognizer...")
    faces, ids = [], []

    for person_id, person_name in enumerate(os.listdir('photos')):
        person_path = os.path.join('photos', person_name)
        if not os.path.isdir(person_path):
            print(f"🚫 Skipping non-directory: {person_path}")
            continue

        for img_name in os.listdir(person_path):
            img_path = os.path.join(person_path, img_name)
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                print(f"❌ Could not read image: {img_path}")
                continue
            faces.append(img)
            ids.append(person_id)
            print(f"✅ Loaded image: {img_path}")

    if len(faces) == 0:
        print("❌ No images found for training")
        return

    recognizer.train(faces, np.array(ids))
    recognizer.save('trainer.yml')
    print(f"🎉 Training complete — {len(faces)} images trained across {len(set(ids))} employee(s)")

# Train once on start
train_recognizer()

@app.route('/recognize', methods=['POST'])
def recognize():
    print("🔵 Request received at /recognize")

    if 'image' not in request.files:
        print("❌ No image in request")
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    img_bytes = file.read()

    # Decode image from bytes
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

    if img is None:
        print("❌ Failed to decode image")
        return jsonify({'error': 'Failed to decode image'}), 400

    print("📸 Image successfully decoded")

    # Detect face(s)
    faces = face_cascade.detectMultiScale(img, 1.3, 5)
    print(f"🔍 Detected {len(faces)} face(s)")

    for (x, y, w, h) in faces:
        face_img = img[y:y + h, x:x + w]
        id, confidence = recognizer.predict(face_img)
        print(f"🧠 Prediction: ID={id}, Confidence={confidence}")

        if confidence < 100:
            identity = f'employee_{id + 1}'  # Adjust ID to match Laravel side
            print(f"✅ Match found: {identity}")
            return jsonify({'identity': identity})

    print("❌ No face matched")
    return jsonify({'error': 'No match found'}), 404

@app.route('/train', methods=['POST'])
def retrain():
    print("🔁 Retraining requested")
    train_recognizer()
    return jsonify({'message': 'Model retrained'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
