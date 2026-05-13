import requests
from datetime import datetime

GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvPydc_c5x711CQ-B7bAV7QSKbM6iZxuJeWMuopqwt8HdHHpxoOwMh8o6ZmqkYcB3vZA/exec"

attendance_data = {

    "name": "Ronak",
    "uid": "00 04 9D 42",
    "time": datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    ),
    "status": "Present",
    "ppe": "Helmet OK"
}

response = requests.post(
    GOOGLE_SCRIPT_URL,
    json=attendance_data
)

print("STATUS:",
      response.status_code)

print("RESPONSE:",
      response.text)