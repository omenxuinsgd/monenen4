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
    print("Sedang menginisialisasi model PaddleOCR (Optimized for CPU Speed)...")
    
    # KUNCI KECEPATAN: Menggunakan ocr_version='PP-OCRv4' 
    # v5 secara default menggunakan model 'Server' yang berat di CPU.
    # v4 Mobile jauh lebih cepat untuk scanning dokumen di CPU.
    return PaddleOCR(
        lang='ch',
        enable_mkldnn=True,                 # Akselerasi Intel CPU
        cpu_threads=4,                      # Multi-threading
        ocr_version='PP-OCRv4',             # Gunakan v4 agar mendapatkan model mobile yang cepat
        text_detection_model_dir=None,      # Update parameter (sebelumnya det_model_dir)
        text_recognition_model_dir=None,    # Update parameter (sebelumnya rec_model_dir)
        use_textline_orientation=True,      # Deteksi teks miring
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
    
    # Inference menggunakan metode predict (v3.x)
    results = ocr_model.predict(input=image_path)
    
    end_time = time.time()
    print(f"[DONE] Waktu deteksi: {end_time - start_time:.2f} detik")

    if results:
        for res in results:
            # Menampilkan potongan teks di terminal sebagai konfirmasi
            if hasattr(res, 'page_res'): 
                texts = [line['rec_text'] for line in res.page_res]
                print(f"Hasil Teks (Awal): {', '.join(texts[:5])}...") 
            
            # SIMPAN HASIL: Sekarang menyimpan JSON DAN Gambar Output
            try:
                # Membuat folder 'output' jika belum ada
                if not os.path.exists("output"):
                    os.makedirs("output")
                
                res.save_to_json(save_path="output") # Simpan data koordinat & teks
                res.save_to_img(save_path="output")  # Simpan visualisasi (bounding box)
                print(f"[INFO] Hasil disimpan di folder: 'output'")
            except Exception as e:
                print(f"[!] Gagal menyimpan hasil visualisasi: {e}")

if __name__ == "__main__":
    # Inisialisasi engine di luar loop (hanya sekali)
    ocr_engine = inisialisasi_ocr()
    
    # Masukkan daftar file gambar Anda di sini
    daftar_gambar = ["nur_ktp.jpg"] 
    
    print("\nMemulai pemrosesan batch...")
    total_start = time.time()
    
    for img_path in daftar_gambar:
        if os.path.exists(img_path):
            proses_ocr(img_path, ocr_engine)
        else:
            print(f"File {img_path} tidak ditemukan, melewati...")
            
    print(f"\nTotal waktu pemrosesan semua gambar: {time.time() - total_start:.2f} detik")