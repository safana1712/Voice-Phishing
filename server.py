from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import time

#  Flask looking for HTML files in the CURRENT folder (.)
app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)

# Creating a route for the Homepage
@app.route('/')
def home():
    return app.send_static_file('index.html')

@app.route('/analyze', methods=['POST'])
def analyze_audio():
    print("🔔 Audio received from Frontend!")
    
    if 'file' not in request.files:
        return jsonify({"error": "No file received"}), 400
    
    time.sleep(1) 
    
    # DUMMY LOGIC
    fake_result = random.choice(["Real", "Fake"])
    confidence = random.uniform(0.70, 0.99)
    
    print(f"✅ Prediction sent: {fake_result}")
    
    return jsonify({
        "result": fake_result, 
        "confidence": confidence
    })

if __name__ == '__main__':
    print("🚀 Server is running on http://127.0.0.1:5000")
    app.run(port=5000)