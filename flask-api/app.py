import cv2
import os
import numpy as np
from flask import Flask, request, jsonify
import shutil

app = Flask(__name__)
recognizer = cv2.face.LBPHFaceRecognizer_create()
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
PHOTOS_DIR = 'photos'

def train_recognizer(employee_id=None):
    print(f"⚙️ Training recognizer for {'all employees' if employee_id is None else f'employee_{employee_id}'}...")
    faces, ids = [], []

    # Create photos directory if it doesn't exist
    if not os.path.exists(PHOTOS_DIR):
        os.makedirs(PHOTOS_DIR)

    # If employee_id is specified, train only for that employee
    if employee_id:
        person_path = os.path.join(PHOTOS_DIR, f'employee_{employee_id}')
        if not os.path.isdir(person_path):
            print(f"❌ Directory not found: {person_path}")
            return False

        for img_name in os.listdir(person_path):
            img_path = os.path.join(person_path, img_name)
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                print(f"❌ Could not read image: {img_path}")
                continue
            faces.append(img)
            ids.append(int(employee_id) - 1)  # Adjust ID to zero-based
            print(f"✅ Loaded image: {img_path}")
    else:
        # Train for all employees
        for person_name in os.listdir(PHOTOS_DIR):
            if not person_name.startswith('employee_'):
                continue
            try:
                person_id = int(person_name.replace('employee_', '')) - 1  # Zero-based ID
                person_path = os.path.join(PHOTOS_DIR, person_name)
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
            except ValueError:
                print(f"🚫 Invalid employee directory: {person_name}")
                continue

    if len(faces) == 0:
        print("❌ No images found for training")
        return False

    recognizer.train(faces, np.array(ids))
    recognizer.save('trainer.yml')
    print(f"🎉 Training complete — {len(faces)} images trained across {len(set(ids))} employee(s)")
    return True

# Train on start for all employees
train_recognizer()

@app.route('/recognize', methods=['POST'])
def recognize():
    print("🔵 Request received at /recognize")

    if 'image' not in request.files:
        print("❌ No image in request.files")
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    img_bytes = file.read()

    # Decode image
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

    if img is None:
        print("❌ Failed to decode image")
        return jsonify({'error': 'Failed to decode image'}), 400

    print("📸 Image successfully decoded")

    # Face detection
    faces = face_cascade.detectMultiScale(img, scaleFactor=1.3, minNeighbors=5)
    print(f"🔍 Detected {len(faces)} face(s)")

    if len(faces) == 0:
        print("❌ No faces detected in image")
        return jsonify({'error': 'No face detected'}), 404

    for (x, y, w, h) in faces:
        face_img = img[y:y + h, x:x + w]
        id, confidence = recognizer.predict(face_img)
        print(f"🧠 Prediction: ID={id}, Confidence={confidence}")

        if confidence < 100:
            identity = f'employee_{id + 1}'  # Adjust to 1-based ID
            print(f"✅ Match found: {identity}")
            return jsonify({'identity': identity}), 200
        else:
            print(f"❌ Prediction confidence too low: {confidence}")

    print("❌ No face matched in the loop — returning 404")
    return jsonify({'error': 'No match found'}), 404

@app.route('/train', methods=['POST'])
def retrain():
    print("🔁 Retraining requested")
    employee_id = request.form.get('employee_id')
    image_file = request.files.get('image')

    if not employee_id:
        # Train all employees if no ID provided
        success = train_recognizer()
        return jsonify({'message': 'Model retrained for all employees' if success else 'No images found for training'}), 200 if success else 400

    if not image_file:
        print("❌ No image provided for training")
        return jsonify({'error': 'No image provided'}), 400

    # Save image to employee directory
    employee_dir = os.path.join(PHOTOS_DIR, f'employee_{employee_id}')
    if os.path.exists(employee_dir):
        shutil.rmtree(employee_dir)  # Clear old photos
    os.makedirs(employee_dir)

    img_bytes = image_file.read()
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
    if img is None:
        print("❌ Failed to decode training image")
        return jsonify({'error': 'Failed to decode image'}), 400

    # Save image
    img_path = os.path.join(employee_dir, f'employee_{employee_id}_{int(time.time())}.jpg')
    cv2.imwrite(img_path, img)
    print(f"✅ Saved training image: {img_path}")

    # Train for this employee
    success = train_recognizer(employee_id)
    return jsonify({'message': f'Model trained for employee_{employee_id}' if success else 'No valid images found for training'}), 200 if success else 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)