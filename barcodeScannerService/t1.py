import cv2
import numpy as np
import os
import sys
from pyzbar.pyzbar import decode as qr_decode

try:
    from pylibdmtx.pylibdmtx import decode as dm_decode
except ImportError:
    dm_decode = None

def unsharp_mask(image, kernel_size=(5, 5), sigma=1.0, amount=2.0, threshold=0):
    """
    Meningkatkan ketajaman gambar secara signifikan untuk melawan blur.
    """
    blurred = cv2.GaussianBlur(image, kernel_size, sigma)
    sharpened = float(amount + 1) * image - float(amount) * blurred
    sharpened = np.maximum(sharpened, 0)
    sharpened = np.minimum(sharpened, 255)
    sharpened = sharpened.round().astype(np.uint8)
    if threshold > 0:
        low_contrast_mask = np.absolute(image - blurred) < threshold
        np.copyto(sharpened, image, where=low_contrast_mask)
    return sharpened

def improve_contrast(gray):
    """
    Meningkatkan kontras lokal menggunakan CLAHE.
    """
    clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8, 8))
    return clahe.apply(gray)

def get_rotated_roi(img, rect):
    """
    Memotong ROI dan meluruskan rotasi berdasarkan deteksi kontur.
    """
    (x, y), (w, h), angle = rect
    
    # Tambahkan margin ekstra (Quiet Zone) yang besar untuk gambar blur
    margin = 0.3
    w += int(w * margin)
    h += int(h * margin)
    
    M = cv2.getRotationMatrix2D((x, y), angle, 1.0)
    rotated = cv2.warpAffine(img, M, (img.shape[1], img.shape[0]), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    
    res = cv2.getRectSubPix(rotated, (int(w), int(h)), (x, y))
    return res

def detect_barcode_area(img):
    """
    Deteksi area barcode yang ditingkatkan untuk gambar blur.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Gunakan unsharp mask pada tahap deteksi
    gray = unsharp_mask(gray, amount=1.5)
    
    # Deteksi tepi vertikal (batang barcode)
    gradX = cv2.Sobel(gray, ddepth=cv2.CV_32F, dx=1, dy=0, ksize=-1)
    gradY = cv2.Sobel(gray, ddepth=cv2.CV_32F, dx=0, dy=1, ksize=-1)
    gradient = cv2.subtract(gradX, gradY)
    gradient = cv2.convertScaleAbs(gradient)

    # Filter noise
    blurred = cv2.GaussianBlur(gradient, (5, 5), 0)
    
    crops = []
    # Mencoba rentang threshold yang lebih luas
    for thresh_val in [220, 180, 140, 100]:
        (_, thresh) = cv2.threshold(blurred, thresh_val, 255, cv2.THRESH_BINARY)

        # Gunakan kernel morfologi yang lebih lebar untuk menyatukan bar yang blur
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (35, 3))
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        closed = cv2.erode(closed, None, iterations=2)
        closed = cv2.dilate(closed, None, iterations=4)

        cnts, _ = cv2.findContours(closed.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for c in cnts:
            rect = cv2.minAreaRect(c)
            w_rect, h_rect = rect[1]
            
            # Filter kandidat barcode 1D
            if (w_rect > 100 and h_rect > 20) or (h_rect > 100 and w_rect > 20):
                roi = get_rotated_roi(img, rect)
                if roi is not None and roi.size > 0:
                    crops.append(roi)
        
        if len(crops) > 0: break
            
    return crops

def qr_reader(image_path):
    """
    Strategi pemindaian dengan fitur Anti-Blur.
    """
    img = cv2.imread(image_path)
    if img is None:
        print(f"[ERROR] Gambar tidak ditemukan: {image_path}")
        return None

    # Padding putih luas (Quiet Zone)
    img_padded = cv2.copyMakeBorder(img, 100, 100, 100, 100, cv2.BORDER_CONSTANT, value=[255, 255, 255])

    print(f"[INFO] Mencari lokasi barcode pada: {os.path.basename(image_path)}...")
    barcode_crops = detect_barcode_area(img_padded)
    
    for i, crop in enumerate(barcode_crops):
        # Resize potongan gambar
        h, w = crop.shape[:2]
        if h == 0 or w == 0: continue
        
        # Upscaling 3x untuk gambar blur agar detail bar lebih terbaca
        crop_resized = cv2.resize(crop, (w*3, h*3), interpolation=cv2.INTER_CUBIC)
        gray_crop = cv2.cvtColor(crop_resized, cv2.COLOR_BGR2GRAY)
        
        # Tahap pemrosesan agresif untuk setiap potongan
        process_variants = [
            ("Crop-Original", crop_resized),
            ("Crop-Sharpened", unsharp_mask(gray_crop, amount=2.5)),
            ("Crop-CLAHE", improve_contrast(unsharp_mask(gray_crop, amount=1.5))),
            ("Crop-Adaptive", cv2.adaptiveThreshold(gray_crop, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)),
        ]
        
        for name, proc in process_variants:
            results = qr_decode(proc)
            if results:
                data = results[0].data.decode('utf-8')
                print(f"[SUCCESS] {data} terdeteksi melalui {name} (ROI #{i})")
                cv2.imwrite(f"debug_roi_{i}_success.png", proc)
                return data

    # STRATEGI 2: FULL IMAGE BACKUP DENGAN SHARPENING
    print(f"[INFO] Mencoba pemindaian penuh dengan filter penajaman...")
    gray_full = cv2.cvtColor(img_padded, cv2.COLOR_BGR2GRAY)
    
    full_variants = [
        ("Full-ExtremeSharpen", unsharp_mask(gray_full, amount=3.0)),
        ("Full-CLAHE-Sharpen", improve_contrast(unsharp_mask(gray_full, amount=1.5)))
    ]
    
    for name, proc in full_variants:
        results = qr_decode(proc)
        if results:
            data = results[0].data.decode('utf-8')
            print(f"[SUCCESS] {data} terdeteksi melalui {name}")
            return data

    print(f"[FAILED] Barcode 1D/QR tetap tidak terbaca pada {os.path.basename(image_path)}.")
    return None

def dm_reader(image_path):
    """
    Pemindaian Data Matrix menggunakan pylibdmtx.
    """
    if dm_decode is None:
        return None

    img = cv2.imread(image_path)
    if img is None: return None
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    trials = [
        ("DM-Asli", img),
        ("DM-CLAHE", improve_contrast(gray)),
        ("DM-Sharpened", unsharp_mask(gray, amount=2.0)),
        ("DM-Inverted", cv2.bitwise_not(gray))
    ]

    for name, proc in trials:
        results = dm_decode(proc)
        if results:
            data = results[0].data.decode("utf-8")
            print(f"[SUCCESS] Data Matrix: {data} ({name})")
            return data
    return None

if __name__ == "__main__":
    print("\n" + "="*50)
    print("SISTEM PEMINDAI ANTI-BLUR AKTIF")
    print("="*50)
    
    targets = ["book.jpg", "original.jpg", "barcode123.png"]
    results_summary = {}

    for target in targets:
        if os.path.exists(target):
            res = dm_reader(target) if "123" in target else qr_reader(target)
            if not res:
                res = qr_reader(target)
            results_summary[target] = res if res else "GAGAL"
        else:
            results_summary[target] = "FILE TIDAK ADA"

    print("\n" + "="*50)
    print(f"{'NAMA FILE':<20} | {'HASIL PEMBACAAN':<25}")
    print("-" * 50)
    for file, result in results_summary.items():
        print(f"{file:<20} | {result:<25}")
    print("="*50)