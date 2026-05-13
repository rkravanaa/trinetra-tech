#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>

#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0

#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

const char *ssid = " ******";
const char *password = " *****";

const char* serverName = "http://xxxx.xxx.x.xxx:xxxxx/detect";

void setup() {

  Serial.begin(9600);

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;

  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;

  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;

  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;

  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;

  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    config.frame_size = FRAMESIZE_QVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  } else {
    config.frame_size = FRAMESIZE_QQVGA;
    config.jpeg_quality = 16;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);

  if (err != ESP_OK) {
    Serial.println("Camera init failed");
    return;
  }

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("Waiting for RFID trigger...");
}

void loop() {

  if (Serial.available()) {

    String command = Serial.readStringUntil('\n');

    command.trim();

    if (command == "CAPTURE") {

      Serial.println("Capturing Image...");

      captureAndSendImage();
    }
  }
}

void captureAndSendImage() {

  camera_fb_t * fb = esp_camera_fb_get();

  if (!fb) {
    Serial.println("Capture failed");
    return;
  }

  HTTPClient http;

  http.begin(serverName);

  String boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";

  http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);

  String head = "--" + boundary + "\r\n";
  head += "Content-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\r\n";
  head += "Content-Type: image/jpeg\r\n\r\n";

  String tail = "\r\n--" + boundary + "--\r\n";

  uint32_t imageLen = fb->len;
  uint32_t totalLen = head.length() + imageLen + tail.length();

  uint8_t * buffer = (uint8_t *)malloc(totalLen);

  memcpy(buffer, head.c_str(), head.length());
  memcpy(buffer + head.length(), fb->buf, imageLen);
  memcpy(buffer + head.length() + imageLen, tail.c_str(), tail.length());

  int httpResponseCode = http.POST(buffer, totalLen);

  if (httpResponseCode > 0) {

    String response = http.getString();

    response.trim();

    Serial.print("AI RAW RESPONSE: ");
    Serial.println(response);

    if (response.indexOf("\"helmet\":true") != -1) {

      Serial.println("GRANTED");

    } else if (response.indexOf("\"helmet\":false") != -1) {

      Serial.println("DENIED");

    } else {

      Serial.println("DENIED");
    }

  } else {

    Serial.println("HTTP Error");
  }

  free(buffer);

  http.end();

  esp_camera_fb_return(fb);
}