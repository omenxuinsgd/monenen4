import cv2
import numpy as np
import time
import os
from pyzbar.pyzbar import decode as qr_decode
from fastapi import FastAPI, File, UploadFile, HTTPException
# Import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Inisialisasi FastAPI
app = FastAPI(title="High-Speed Barcode API")

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

try:
    from pylibdmtx.pylibdmtx import decode as dm_decode
except ImportError:
    dm_decode = None

def improve_contrast(gray):
    """Meningkatkan kontras lokal dengan CLAHE."""
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)

def scan_image_logic(img):
    """
    Logika pemindaian dengan strategi 'Early Exit' untuk efisiensi waktu.
    Urutan: Grayscale -> Fast QR/1D -> Fast DM -> Agresif (jika perlu).
    """
    t_start = time.perf_counter()
    
    # 1. Grayscale (Dasar semua proses)
    t_gray = time.perf_counter()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    print(f"[DEBUG] Grayscale conversion: {(time.perf_counter() - t_gray)*1000:.2f}ms")
    
    # --- TAHAP 1: JALUR CEPAT (Fast Path) ---
    # Mencoba deteksi pada gambar asli (Grayscale)
    t_step = time.perf_counter()
    results = qr_decode(gray)
    if results:
        print(f"[DEBUG] Terdeteksi (Fast Path) dalam {(time.perf_counter() - t_step)*1000:.2f}ms")
        return {"type": results[0].type, "data": results[0].data.decode('utf-8'), "method": "Fast Path"}

    # --- TAHAP 2: DATA MATRIX CEPAT ---
    if dm_decode:
        t_step = time.perf_counter()
        # Data Matrix seringkali lambat, kita coba versi grayscale dasar dulu
        res_dm = dm_decode(gray, max_count=1)
        if res_dm:
            print(f"[DEBUG] Data Matrix Terdeteksi dalam {(time.perf_counter() - t_step)*1000:.2f}ms")
            return {"type": "DATA MATRIX", "data": res_dm[0].data.decode("utf-8"), "method": "DM Fast Path"}

    # --- TAHAP 3: PEMROSESAN AGRESIF (Hanya jika tahap awal gagal) ---
    print("[DEBUG] Jalur cepat gagal. Memulai metode agresif...")
    
    # Percobaan 1: Kontras CLAHE (Sangat efektif untuk barcode pudar)
    t_step = time.perf_counter()
    clahe_img = improve_contrast(gray)
    results = qr_decode(clahe_img)
    if results:
        print(f"[DEBUG] Terdeteksi (CLAHE) dalam {(time.perf_counter() - t_step)*1000:.2f}ms")
        return {"type": results[0].type, "data": results[0].data.decode('utf-8'), "method": "CLAHE"}

    # Percobaan 2: Inversi Warna (Penting untuk barcode pada latar gelap)
    t_step = time.perf_counter()
    inverted = cv2.bitwise_not(gray)
    results = qr_decode(inverted)
    if results:
        print(f"[DEBUG] Terdeteksi (Inverted) dalam {(time.perf_counter() - t_step)*1000:.2f}ms")
        return {"type": results[0].type, "data": results[0].data.decode('utf-8'), "method": "Inverted"}

    # Percobaan 3: Resize (Hanya jika gambar kecil/kurang detail)
    # Jika gambar sudah besar (> 1500px), resize malah memperlambat
    if gray.shape[1] < 1200:
        t_step = time.perf_counter()
        resized = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR)
        results = qr_decode(resized)
        if results:
            print(f"[DEBUG] Terdeteksi (Upscale) dalam {(time.perf_counter() - t_step)*1000:.2f}ms")
            return {"type": results[0].type, "data": results[0].data.decode('utf-8'), "method": "Upscale"}

    print(f"[DEBUG] Gagal mendeteksi setelah {(time.perf_counter() - t_start)*1000:.2f}ms")
    return None

@app.get("/")
async def root():
    return {"status": "online", "engine": "FastAPI Barcode Scanner"}

@app.post("/scan")
async def scan_barcode_api(file: UploadFile = File(...)):
    t_req_start = time.perf_counter()
    
    # 1. Baca gambar langsung dari memori (Menghindari I/O Disk)
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Format gambar tidak valid")

    # 2. Jalankan logika scan
    result = scan_image_logic(img)
    
    # 3. Hitung total waktu request
    t_total = (time.perf_counter() - t_req_start) * 1000
    print(f"[API] Total Waktu Request ({file.filename}): {t_total:.2f}ms\n")

    if result:
        return {
            "status": "success",
            "filename": file.filename,
            "result": result,
            "latency_ms": round(t_total, 2)
        }
    
    return {
        "status": "failed",
        "message": "Barcode/QR/DM tidak terdeteksi",
        "latency_ms": round(t_total, 2)
    }

if __name__ == "__main__":
    # Menjalankan server uvicorn
    # log_level="warning" untuk mengurangi noise log server agar log debug kita terlihat jelas
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")