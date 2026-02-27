# GetAbsen AI Service

Face Recognition microservice using InsightFace.

---

## Installation

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt

---

## Run Service

uvicorn main:app --reload --port 8001

---

## Health Check

GET /health

---

## Generate Embedding

POST /embedding
Content-Type: multipart/form-data
Body: image file

### Success Response

{
  "success": true,
  "embedding": [...]
}

### Error Response

{
  "success": false,
  "message": "No face detected"
}

---

## Recommendation

- 1 face per image
- Good lighting
- Minimum resolution 640x480
- Threshold cosine similarity recommended: 0.6
