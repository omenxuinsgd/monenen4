import os
import time
import io
import base64
import uvicorn
import uuid
import shutil
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from paddleocr import PaddleOCR
from PIL import Image
import numpy as np
from fastapi.middleware.cors import CORSMiddleware


# ==========================================
# KONFIGURASI APP & OCR
# ==========================================
app = FastAPI(title="PaddleOCR Background Service", version="1.3")

origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Direktori utama untuk penyimpanan hasil permanen
STORAGE_DIR = "ocr_results"
if not os.path.exists(STORAGE_DIR):
    os.makedirs(STORAGE_DIR)

# Direktori sementara untuk proses visualisasi
TEMP_BASE_DIR = "temp_processing"
if not os.path.exists(TEMP_BASE_DIR):
    os.makedirs(TEMP_BASE_DIR)

print("Sedang menginisialisasi model PaddleOCR (CPU Optimized)...")
ocr_engine = PaddleOCR(
    lang='ch',
    enable_mkldnn=True,
    cpu_threads=4,
    ocr_version='PP-OCRv4',
    use_textline_orientation=True,
    text_det_thresh=0.3,
    text_det_box_thresh=0.6,
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    text_detection_model_dir=None,
    text_recognition_model_dir=None
)

def get_text_from_result(res):
    """Ekstraksi teks dari hasil PaddleOCR v3.x."""
    texts = []
    if isinstance(res, dict):
        res_content = res.get('res', res)
        if isinstance(res_content, dict):
            if 'rec_texts' in res_content:
                texts = list(res_content['rec_texts'])
            elif 'page_res' in res_content:
                texts = [line.get('rec_text', '') for line in res_content['page_res']]
    
    if not texts:
        res_data = getattr(res, 'res', None)
        if isinstance(res_data, dict) and 'rec_texts' in res_data:
            texts = list(res_data['rec_texts'])
        if not texts and hasattr(res, 'page_res'):
            texts = [line.get('rec_text', '') for line in res.page_res]
            
    return [str(t) for t in texts if t]

def convert_to_markdown(all_extracted_texts):
    """Mengonversi daftar teks menjadi format Markdown."""
    if not all_extracted_texts:
        return ""
    return "\n\n".join(all_extracted_texts)

@app.post("/parse-document")
async def parse_document(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar.")

    request_id = str(uuid.uuid4())
    # Folder permanen untuk request ini
    request_storage_path = os.path.join(STORAGE_DIR, request_id)
    # Folder sementara untuk proses visualisasi
    request_temp_dir = os.path.join(TEMP_BASE_DIR, request_id)
    
    os.makedirs(request_storage_path)
    os.makedirs(request_temp_dir)
    
    try:
        contents = await file.read()
        image_pil = Image.open(io.BytesIO(contents)).convert('RGB')
        image_np = np.array(image_pil)

        start_time = time.time()
        results = ocr_engine.predict(input=image_np)
        process_time = time.time() - start_time

        all_text = []
        base64_visual = ""

        if results:
            if not isinstance(results, list):
                results = [results]

            for res in results:
                page_texts = get_text_from_result(res)
                all_text.extend(page_texts)

                # Simpan visualisasi ke folder temp
                res.save_to_img(save_path=request_temp_dir)
                
                output_files = [f for f in os.listdir(request_temp_dir) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
                if output_files:
                    source_file = os.path.join(request_temp_dir, output_files[0])
                    # Simpan juga ke folder permanen
                    target_visual_path = os.path.join(request_storage_path, "visualization.jpg")
                    shutil.copy(source_file, target_visual_path)
                    
                    with open(target_visual_path, "rb") as img_file:
                        base64_visual = base64.b64encode(img_file.read()).decode('utf-8')

        markdown_content = convert_to_markdown(all_text)

        response_data = {
            "status": "success",
            "request_id": request_id,
            "process_time_seconds": round(process_time, 2),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "data": {
                "text": all_text,
                "markdown_source": markdown_content,
                "visualization_base64": f"data:image/jpeg;base64,{base64_visual}" if base64_visual else None
            }
        }

        # Simpan hasil JSON ke folder permanen
        json_save_path = os.path.join(request_storage_path, "result.json")
        with open(json_save_path, "w", encoding="utf-8") as f:
            json.dump(response_data, f, ensure_ascii=False, indent=4)

        return response_data

    except Exception as e:
        import traceback
        print(f"Error detail: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan: {str(e)}")
    
    finally:
        # Bersihkan folder sementara (folder permanen tetap ada)
        if os.path.exists(request_temp_dir):
            shutil.rmtree(request_temp_dir)

@app.get("/get-result/{request_id}")
async def get_result(request_id: str):
    """Endpoint untuk mengambil hasil OCR yang sudah tersimpan berdasarkan request_id."""
    json_path = os.path.join(STORAGE_DIR, request_id, "result.json")
    
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail="Hasil tidak ditemukan. Pastikan request_id benar.")
    
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    return data

@app.get("/health")
async def health_check():
    return {
        "status": "ready", 
        "model": "PP-OCRv4 Mobile",
        "storage_path": os.path.abspath(STORAGE_DIR)
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)