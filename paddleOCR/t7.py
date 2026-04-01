import os
import time
import io
import base64
import uvicorn
import uuid
import shutil
import json
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse
# Import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR
from PIL import Image
import numpy as np

# ============================================================
# PENYEKATAN LOG TERMINAL (SUPPRESS LOGGING)
# ============================================================
logging.getLogger("ppocr").setLevel(logging.ERROR)
os.environ["PPOCR_LOG_LEVEL"] = "error"

# ============================================================
# OCR SCANNER MODULE CLASS
# ============================================================
class OCRScannerModule:
    def __init__(self):
        self.storage_dir = "ocr_results"
        self.temp_dir = "temp_processing"
        self._setup_dirs()
        
        print("[OCRScannerModule] Sedang menginisialisasi enjin OCR...")
        # Parameter 'show_log' dihapus karena menyebabkan ValueError pada versi 3.x Anda.
        # Pengaturan log sudah ditangani di bagian PENYEKATAN LOG TERMINAL di atas.
        self.engine = PaddleOCR(
            lang='ch',
            enable_mkldnn=True,
            cpu_threads=4,
            ocr_version='PP-OCRv4',
            use_textline_orientation=True
        )

    def _setup_dirs(self):
        for d in [self.storage_dir, self.temp_dir]:
            if not os.path.exists(d):
                os.makedirs(d)

    def extract_text(self, res):
        """Mengekstrak teks daripada hasil PaddleOCR v3.x"""
        texts = []
        if isinstance(res, dict):
            content = res.get('res', res)
            if isinstance(content, dict):
                if 'rec_texts' in content:
                    texts = list(content['rec_texts'])
                elif 'page_res' in content:
                    texts = [line.get('rec_text', '') for line in content['page_res']]
        
        if not texts:
            res_data = getattr(res, 'res', None)
            if isinstance(res_data, dict) and 'rec_texts' in res_data:
                texts = list(res_data['rec_texts'])
            if not texts and hasattr(res, 'page_res'):
                texts = [line.get('rec_text', '') for line in res.page_res]
                
        return [str(t) for t in texts if t]

    def process_image(self, image_bytes):
        """Memproses imej dan mengembalikan hasil berstruktur"""
        request_id = str(uuid.uuid4())
        req_storage = os.path.join(self.storage_dir, request_id)
        req_temp = os.path.join(self.temp_dir, request_id)
        
        os.makedirs(req_storage)
        os.makedirs(req_temp)
        
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            img_np = np.array(img)

            start_t = time.time()
            results = self.engine.predict(input=img_np)
            duration = time.time() - start_t

            all_texts = []
            base64_img = ""

            if results:
                if not isinstance(results, list): results = [results]

                for res in results:
                    page_texts = self.extract_text(res)
                    all_texts.extend(page_texts)
                    
                    res.save_to_img(save_path=req_temp)
                    
                    out_files = [f for f in os.listdir(req_temp) if f.lower().endswith(('.jpg', '.png'))]
                    if out_files:
                        src = os.path.join(req_temp, out_files[0])
                        target = os.path.join(req_storage, "vis.jpg")
                        shutil.copy(src, target)
                        with open(target, "rb") as f:
                            base64_img = base64.b64encode(f.read()).decode('utf-8')

            data = {
                "id": request_id,
                "time": round(duration, 2),
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "texts": all_texts,
                "markdown": "\n\n".join(all_texts),
                "image": f"data:image/jpeg;base64,{base64_img}" if base64_img else None
            }

            with open(os.path.join(req_storage, "result.json"), "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)

            return data

        finally:
            if os.path.exists(req_temp):
                shutil.rmtree(req_temp)

# ============================================================
# API ENDPOINTS & CORS CONFIGURATION
# ============================================================
app = FastAPI(title="Standalone OCRScannerModule")

# Konfigurasi CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Izinkan semua origin. Ganti dengan domain spesifik untuk produksi.
    allow_credentials=True,
    allow_methods=["*"], # Izinkan semua metode (GET, POST, dll)
    allow_headers=["*"], # Izinkan semua header
)

scanner = OCRScannerModule()

@app.post("/api/scan")
async def scan_document(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Sila muat naik imej sahaja.")
    
    content = await file.read()
    result = scanner.process_image(content)
    return result

@app.get("/api/history")
async def get_history():
    history = []
    if os.path.exists(scanner.storage_dir):
        for req_id in os.listdir(scanner.storage_dir):
            json_p = os.path.join(scanner.storage_dir, req_id, "result.json")
            if os.path.exists(json_p):
                with open(json_p, "r", encoding="utf-8") as f:
                    history.append(json.load(f))
    history.sort(key=lambda x: x['timestamp'], reverse=True)
    return history

@app.get("/", response_class=HTMLResponse)
async def ui():
    return """
    <!DOCTYPE html>
    <html lang="ms">
    <head>
        <meta charset="UTF-8">
        <title>OCR Scanner Module - Standalone UI</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0f172a; color: #f1f5f9; }
            .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
            .tab-btn.active { border-color: #6366f1; color: #818cf8; background: rgba(99, 102, 241, 0.1); }
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        </style>
    </head>
    <body class="h-screen flex flex-col overflow-hidden">
        <div class="px-8 py-4 glass border-b border-slate-800 flex justify-between items-center">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold">OCR</div>
                <h1 class="text-xl font-bold tracking-tight">ScannerModule <span class="text-indigo-400 text-xs font-normal">v3.x Standalone</span></h1>
            </div>
            <div class="flex gap-4">
                <button onclick="loadHistory()" class="px-4 py-2 rounded-lg hover:bg-slate-800 text-sm transition">Sejarah</button>
                <div class="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20 flex items-center">CPU MKLDNN Aktif</div>
            </div>
        </div>

        <main class="flex-1 flex overflow-hidden">
            <div class="w-[45%] p-8 flex flex-col gap-6 border-r border-slate-800 bg-slate-900/50">
                <div class="flex flex-col gap-4">
                    <label class="group cursor-pointer flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-700 rounded-2xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all">
                        <div class="flex flex-col items-center gap-2">
                            <svg class="w-10 h-10 text-slate-500 group-hover:text-indigo-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                            <span class="text-sm text-slate-400">Pilih atau Seret Gambar Dokumen</span>
                        </div>
                        <input type="file" id="fileInp" class="hidden" accept="image/*">
                    </label>
                    <div id="fileInfo" class="hidden text-xs text-indigo-400 bg-indigo-400/10 px-3 py-2 rounded-lg border border-indigo-400/20"></div>
                </div>

                <div class="flex-1 relative glass rounded-2xl overflow-hidden flex items-center justify-center bg-slate-950/50">
                    <img id="prevImg" class="max-w-full max-h-full object-contain hidden" />
                    <div id="prevPlaceholder" class="text-slate-600 flex flex-col items-center gap-2">
                        <svg class="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <span class="text-sm opacity-50 italic">Pratonton Imej</span>
                    </div>
                </div>

                <button id="scanBtn" class="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    Mulakan Imbasan
                </button>
            </div>

            <div class="flex-1 flex flex-col bg-slate-950/30">
                <div class="flex border-b border-slate-800 bg-slate-900/80">
                    <button onclick="setTab('txt')" id="tabTxt" class="tab-btn active flex-1 py-4 text-sm font-semibold border-b-2 border-transparent">Pratonton Markdown</button>
                    <button onclick="setTab('vis')" id="tabVis" class="tab-btn flex-1 py-4 text-sm font-semibold border-b-2 border-transparent">Visualisasi</button>
                    <button onclick="setTab('src')" id="tabSrc" class="tab-btn flex-1 py-4 text-sm font-semibold border-b-2 border-transparent">Sumber Mentah</button>
                </div>

                <div class="flex-1 p-8 overflow-y-auto">
                    <div id="paneTxt" class="pane space-y-4">
                        <div id="resMD" class="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 min-h-[300px] leading-relaxed text-slate-300">
                            <span class="opacity-30 italic">Hasil teks akan muncul di sini...</span>
                        </div>
                    </div>
                    <div id="paneVis" class="pane hidden">
                        <div class="bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
                            <img id="resVis" class="w-full rounded-xl" />
                        </div>
                    </div>
                    <div id="paneSrc" class="pane hidden">
                        <pre id="resRaw" class="bg-slate-950 p-6 rounded-2xl text-xs text-emerald-400 overflow-x-auto border border-slate-800 font-mono"></pre>
                    </div>
                </div>
            </div>
        </main>

        <div id="loader" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 hidden">
            <div class="flex flex-col items-center gap-4">
                <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <div class="text-indigo-400 font-medium animate-pulse">Memproses Dokumen...</div>
            </div>
        </div>

        <script>
            const inp = document.getElementById('fileInp');
            const prev = document.getElementById('prevImg');
            const holder = document.getElementById('prevPlaceholder');
            const info = document.getElementById('fileInfo');
            const btn = document.getElementById('scanBtn');
            const loader = document.getElementById('loader');

            inp.onchange = (e) => {
                const f = e.target.files[0];
                if(f) {
                    info.textContent = `Fail: ${f.name} (${(f.size/1024).toFixed(1)} KB)`;
                    info.classList.remove('hidden');
                    const r = new FileReader();
                    r.onload = (ev) => {
                        prev.src = ev.target.result;
                        prev.classList.remove('hidden');
                        holder.classList.add('hidden');
                    };
                    r.readAsDataURL(f);
                }
            };

            btn.onclick = async () => {
                const f = inp.files[0];
                if(!f) return alert('Sila pilih gambar!');
                
                const fd = new FormData();
                fd.append('file', f);

                loader.classList.remove('hidden');
                try {
                    const r = await fetch('/api/scan', { method: 'POST', body: fd });
                    const res = await r.json();
                    render(res);
                } catch(e) {
                    alert('Ralat pemprosesan!');
                } finally {
                    loader.classList.add('hidden');
                }
            };

            function render(d) {
                document.getElementById('resMD').innerHTML = d.texts.join('<br>');
                document.getElementById('resVis').src = d.image;
                document.getElementById('resRaw').textContent = JSON.stringify(d, null, 2);
                setTab('txt');
            }

            function setTab(t) {
                document.querySelectorAll('.pane').forEach(p => p.classList.add('hidden'));
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.getElementById('pane' + t.charAt(0).toUpperCase() + t.slice(1)).classList.remove('hidden');
                document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1)).classList.add('active');
            }

            async function loadHistory() {
                const r = await fetch('/api/history');
                const h = await r.json();
                if(h.length > 0) render(h[0]);
                else alert('Tiada sejarah imbasan dijumpai.');
            }
        </script>
    </body>
    </html>
    """

if __name__ == "__main__":
    print("[Standalone Service] Menjalankan pelayan pada http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)