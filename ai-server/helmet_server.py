import requests
from datetime import datetime
from flask import Flask, request, jsonify
from PIL import Image
import io
import torch
import open_clip

app = Flask(__name__)

# ==========================
# GOOGLE SHEETS WEBHOOK
# ==========================
GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_SCRIPT_URL"
# ==========================
# DEVICE
# ==========================
device = "cuda" if torch.cuda.is_available() else "cpu"

# ==========================
# LOAD CLIP MODEL
# ==========================
model, _, preprocess = open_clip.create_model_and_transforms(
    'ViT-B-32',
    pretrained='laion2b_s34b_b79k'
)

tokenizer = open_clip.get_tokenizer('ViT-B-32')

model.to(device)

# ==========================
# DETECT ROUTE
# ==========================
@app.route('/detect', methods=['POST'])
def detect_helmet():

    try:

        # ==========================
        # CHECK IMAGE
        # ==========================
        if 'image' not in request.files:

            return jsonify({
                "helmet": False
            })

        file = request.files['image']

        image = Image.open(
            io.BytesIO(file.read())
        ).convert("RGB")

        # ==========================
        # CLIP PREPROCESS
        # ==========================
        image_input = preprocess(image).unsqueeze(0).to(device)

        text = tokenizer([
            "a construction worker wearing a safety helmet",
            "a person without a helmet"
        ]).to(device)

        # ==========================
        # CLIP INFERENCE
        # ==========================
        with torch.no_grad():

            image_features = model.encode_image(image_input)

            text_features = model.encode_text(text)

            image_features /= image_features.norm(
                dim=-1,
                keepdim=True
            )

            text_features /= text_features.norm(
                dim=-1,
                keepdim=True
            )

            similarity = (
                100.0 *
                image_features @ text_features.T
            ).softmax(dim=-1)

        helmet_score = similarity[0][0].item()

        no_helmet_score = similarity[0][1].item()

        print("Helmet Score:",
              helmet_score)

        print("No Helmet Score:",
              no_helmet_score)

        # ==========================
        # EXTRA HELMET VALIDATION
        # ==========================
        width, height = image.size

        top_region = image.crop(
            (0, 0, width, height // 3)
        )

        pixels = list(top_region.getdata())

        bright_pixels = 0

        for pixel in pixels:

            r, g, b = pixel

            if (
                r > 170 and
                g > 170 and
                b > 170
            ):

                bright_pixels += 1

        brightness_ratio = (
            bright_pixels / len(pixels)
        )

        print("Brightness Ratio:",
              brightness_ratio)

        # ==========================
        # FINAL DECISION
        # ==========================
        helmet_detected = (
            helmet_score > no_helmet_score
            and brightness_ratio > 0.12
        )

        print("Helmet Detected:",
              helmet_detected)

        # ==========================
        # GOOGLE SHEETS LOGGING
        # ==========================
        if helmet_detected:

            attendance_data = {

                "name": "Ronak",
                "uid": "00 04 9D 42",

                "time": datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),

                "status": "Present",

                "ppe": "Helmet OK"
            }

            try:

                response = requests.post(
                    GOOGLE_SCRIPT_URL,
                    json=attendance_data
                )

                print("Sheets Response:",
                      response.text)

                print("Google Sheets Updated")

            except Exception as e:

                print("Sheets Error:", e)

        # ==========================
        # RETURN RESPONSE
        # ==========================
        return jsonify({
            "helmet": helmet_detected
        })

    except Exception as e:

        print("ERROR:", e)

        return jsonify({
            "helmet": False
        })

# ==========================
# RUN SERVER
# ==========================
if __name__ == '__main__':

    app.run(
        host='0.0.0.0',
        port=5000)