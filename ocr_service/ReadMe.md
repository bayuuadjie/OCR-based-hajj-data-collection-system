# Layanan OCR (Python + Tesseract)

Berjalan di komputer yang sama dengan server Express. Tidak ada data yang keluar ke internet.

## Pasang (sekali saja, Linux Mint)

```bash
sudo apt install -y tesseract-ocr tesseract-ocr-ind
cd ocr_service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Jalankan

```bash
cd ocr_service
source .venv/bin/activate
uvicorn app:app --host 127.0.0.1 --port 8001 --env-file ../.env
```

Cek: buka http://127.0.0.1:8001/health, harus muncul `{"ok":true,...,"lang":"ind+eng"}`.

## .env (di root project, dipakai Express dan layanan ini)

```
OCR_TOKEN=""
# OCR_URL="http://127.0.0.1:8001"     # opsional, ini sudah default
```

Buat token: `openssl rand -base64 32`

## Kalau label di formulir tidak terbaca

Ubah daftar label (alias) di `extract.py`, bagian `PAGES`. Contoh: formulir menulis
"Nama Orang Tua" -> tambahkan ke alias `namaAyah`. Lihat "Teks mentah hasil OCR" di
halaman Input Data untuk tahu persis tulisan yang dibaca OCR.

## Tips scan

- Lurus dan terang, hindari bayangan. 200-300 dpi sudah cukup.
- Tulisan cetak/ketik terbaca baik. Tulisan tangan hasilnya jauh lebih buruk.