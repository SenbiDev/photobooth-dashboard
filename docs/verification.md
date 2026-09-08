# Verifikasi refactor

Dilakukan pada 8 September 2026.

## Otomatis

- `npm run build`: berhasil; seluruh route App Router dikompilasi.
- `npm run lint`: TypeScript strict dan pemeriksaan Prettier.
- `npm test`: 18 tes domain/kontrak lulus.
- `git diff --check`: tidak ada kesalahan whitespace.
- Browser smoke: 42 URL pada 320×800 dan 42 URL pada 1440×1000; seluruh halaman
  memiliki judul, tanpa teks `undefined` dan tanpa overflow horizontal dokumen.

Tes domain mencakup route yang benar, pasangan locale, schema field/default,
null inheritance, override expiry, QRIS offline, retensi, geometri template,
idempotent retry, backoff cap, lifecycle publish, scope perangkat, signature fixture
readiness, monotonic allocation, immutable template dan masking alamat undangan.
Request alokasi tidak menyalin counter signed inventory atau menambah saldo.

## Pemeriksaan interaksi dan visual

- Tampilan desktop, ponsel 390px dan tablet 768px diperiksa melalui screenshot.
- Modal Create event: field wajib, simpan dummy dan tampil di daftar.
- Pilihan bahasa Indonesia tetap aktif setelah refresh; pemeriksaan desktop dilakukan
  dalam bahasa Inggris.
- Preflight: loading awal, rerun loading, hasil fixture sehat 8/8, serta fixture
  kegagalan menampilkan Failed untuk pemeriksaan yang gagal.
- Publikasi: tombol terkunci sebelum validasi; konfirmasi meminta alasan dan
  re-auth simulation. Desired revision menjadi #143, active tetap #142, ack Pending.
- Modal retry: job queued/active lease/offline/dead-letter tidak bisa dipilih;
  perangkat degraded dengan koneksi masih dapat retry job aman. Transisi retry dan
  preservasi attempts/idempotency diperiksa oleh tes domain.

Pengujian browser berlangsung di server lokal. Beberapa pengulangan UI dilakukan
setelah Fast Refresh karena perubahan source mereset dialog saat development;
timeout pada sesi uji tidak digunakan sebagai bukti bahwa fitur sudah lulus.

## Bukan yang sudah diverifikasi

Tidak menguji perangkat fisik, backend API, signature kriptografi, email/WhatsApp,
settlement pembayaran, durable ledger, actual deletion atau keamanan produksi.
Audit dependency masih melaporkan dua kelompok kerentanan high, lihat README dan
`prd-alignment.md`. Matriks ini bukan klaim implementasi seluruh acceptance criteria
edge/backend dalam PRD.
