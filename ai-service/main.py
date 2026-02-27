from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import insightface
import numpy as np
import cv2
import os

app = FastAPI()

# Load model sekali saat startup
face_app = insightface.app.FaceAnalysis()
face_app.prepare(ctx_id=0)  # 0 = GPU, -1 = CPU

@app.get("/health")
def health():
    return {"status": "AI Service Running"}

@app.post("/embedding")
async def generate_embedding(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Invalid image file"}
            )

        faces = face_app.get(img)

        if len(faces) == 0:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "No face detected"}
            )

        if len(faces) > 1:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Multiple faces detected"}
            )

        embedding = faces[0].embedding.tolist()

        return {
            "success": True,
            "embedding": embedding
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": str(e)}
        )
        