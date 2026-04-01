import cv2
import os
import time
import matplotlib.pyplot as plt
from PIL import Image

try:
    from paddleocr import PaddleOCR
except ImportError:
    print("Error: PaddleOCR tidak ditemukan.")

def inisialisasi_ocr():
    print("Sedang menginisialisasi model PaddleOCR (Mobile version for Speed)...")
    
    # Perubahan utama: menggunakan model v5 mobile untuk kecepatan maksimal di CPU
    return PaddleOCR(
        lang='ch',
        enable_mkldnn=True,
        cpu_threads=4,
        # Menggunakan versi mobile agar loading & inference lebih cepat daripada versi server
        det_model_dir=None, # Biarkan None untuk otomatis, atau isi path jika ingin manual
        rec_model_dir=None,
        use_textline_orientation=True,
        text_det_thresh=0.3,
        text_det_box_thresh=0.6,
        use_doc_orientation_classify=False,
        use_doc_unwarping=False
    )

def proses_ocr(image_path, ocr_model):
    if not os.path.exists(image_path):
        print(f"Error: File {image_path} tidak ditemukan.")
        return

    print(f"\n[START] Memproses: {image_path}")
    start_time = time.time()
    
    # Inference
    results = ocr_model.predict(input=image_path)
    
    end_time = time.time()
    print(f"[DONE] Waktu deteksi: {end_time - start_time:.2f} detik")

    if results:
        for res in results:
            # Mengambil teks saja untuk efisiensi tampilan terminal
            if hasattr(res, 'page_res'): # Struktur v3.x
                texts = [line['rec_text'] for line in res.page_res]
                print(f"Hasil Teks: {', '.join(texts[:5])}...") 
            
            # Simpan hasil
            res.save_to_json(save_path="output")

if __name__ == "__main__":
    # Inisialisasi HANYA SEKALI di luar loop
    ocr_engine = inisialisasi_ocr()
    
    # CONTOH EFISIENSI: Memproses banyak file dalam satu sesi
    # Masukkan daftar file Anda di sini
    daftar_gambar = ["yor_idcard.png", "loid_idcard.png"] 
    
    print("\nMemulai pemrosesan batch...")
    total_start = time.time()
    
    for img_path in daftar_gambar:
        if os.path.exists(img_path):
            proses_ocr(img_path, ocr_engine)
            
    print(f"\nTotal waktu pemrosesan semua gambar: {time.time() - total_start:.2f} detik")