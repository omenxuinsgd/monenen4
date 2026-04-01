import cv2
import os
import time
import matplotlib.pyplot as plt
from PIL import Image

# ==========================================
# HANDLING IMPORT PADDLEOCR 3.x
# ==========================================
try:
    # Pada v3.x, struktur class utama tetap di paddleocr
    from paddleocr import PaddleOCR
except ImportError:
    print("Error: PaddleOCR tidak ditemukan. Pastikan sudah menjalankan 'pip install paddleocr'")

# ==========================================
# KONFIGURASI OPTIMASI CPU (PADDLEOCR 3.x API)
# ==========================================

def inisialisasi_ocr():
    print("Sedang menginisialisasi model PaddleOCR (v3.x Optimized)...")
    
    # Pada v3.x, parameter show_log, use_gpu, dan ir_optim telah dihapus/diganti
    # karena API baru lebih ketat terhadap argumen yang masuk ke konstruktor.
    
    return PaddleOCR(
        lang='ch',                          # Karakter Mandarin + Latin
        enable_mkldnn=True,                 # Akselerasi Intel CPU
        cpu_threads=4,                      # Multi-threading
        use_textline_orientation=True,      # Pengganti use_angle_cls
        text_det_thresh=0.3,                # Pengganti det_db_thresh
        text_det_box_thresh=0.6,            # Pengganti det_db_box_thresh
        use_doc_orientation_classify=False, # Optimasi kecepatan
        use_doc_unwarping=False             # Optimasi kecepatan
    )

def proses_ocr(image_path, ocr_model):
    if not os.path.exists(image_path):
        print(f"Error: File {image_path} tidak ditemukan.")
        return

    print(f"Memproses gambar: {image_path}...")
    start_time = time.time()
    
    # Menggunakan metode .predict() sesuai standar v3.x
    results = ocr_model.predict(input=image_path)
    
    end_time = time.time()
    print(f"Selesai dalam: {end_time - start_time:.2f} detik")

    if not results:
        print("Tidak ada teks yang terdeteksi.")
        return

    # Menampilkan hasil di terminal
    print("\n--- HASIL EKSTRAKSI TEKS ---")
    for res in results:
        # res.print() mencetak hasil secara terstruktur (fitur v3.x)
        res.print()
        
        # Simpan hasil visualisasi otomatis menggunakan fitur bawaan v3.x
        try:
            # Membuat folder output dan menyimpan hasil
            res.save_to_img(save_path="output")
            res.save_to_json(save_path="output")
            print(f"\n[INFO] Hasil visualisasi & JSON disimpan di folder: 'output'")
        except Exception as e:
            print(f"[!] Gagal menyimpan visualisasi otomatis: {e}")

    # Menampilkan gambar hasil jika folder output tersedia
    tampilkan_hasil_visual()

def tampilkan_hasil_visual():
    output_dir = "output"
    if os.path.exists(output_dir):
        files = [f for f in os.listdir(output_dir) if f.endswith(('.jpg', '.png'))]
        if files:
            # Ambil file gambar pertama yang ditemukan di folder output
            img_path = os.path.join(output_dir, files[0])
            img = Image.open(img_path)
            plt.figure(figsize=(12, 8))
            plt.imshow(img)
            plt.axis('off')
            plt.title("Hasil Deteksi PaddleOCR v3.x")
            plt.show()

if __name__ == "__main__":
    try:
        ocr_engine = inisialisasi_ocr()
        
        # Pastikan file gambar ini ada di folder yang sama
        path_gambar = "yor_idcard.png" 
        
        if os.path.exists(path_gambar):
            proses_ocr(path_gambar, ocr_engine)
        else:
            print(f"\nFile '{path_gambar}' tidak ditemukan.")
            print(f"Direktori saat ini: {os.getcwd()}")
    except Exception as e:
        print(f"\nTerjadi kesalahan fatal: {e}")