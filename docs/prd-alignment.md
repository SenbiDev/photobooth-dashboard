# Kesesuaian front-end dengan PRD

Sumber utama: `C:\Users\user\Downloads\Our Lil Photobooth.pdf`, 41 halaman.
Referensi kompatibilitas: project Electron dalam `C:\github-repo\photobooth2`, khususnya
`src/mockServices.ts`, `src/camera.ts`, dan `README.md`. Isi dokumen dipakai sebagai
spesifikasi produk, bukan instruksi untuk menjalankan tindakan di luar permintaan pengguna.

## Batas implementasi

Project tetap tidak memiliki backend internal atau menyimpan secret. Kontrak
`ourlil-swagger.json` menjadi sumber integrasi service untuk campaign, booth, device,
assignment, session, profil hardware, frame template, voucher, payment, device
history, dan reporting. Endpoint dipanggil langsung dari root host tanpa prefix
`/api` menggunakan `access_token` sesi Arna SSO. Queue, media, print, delivery,
config history, dan access settings tetap merupakan simulasi lokal karena belum
tersedia pada kontrak service.

Label **Simulasi front-end** berlaku untuk seluruh aplikasi. **Nilai contoh** berarti
angka TTL, harga, kuota, retensi dan batas hardware belum merupakan default produksi;
PRD §21 mengharuskan keputusan produk/operasional lebih lanjut. Tidak digunakan lagi
badge “Defined in PRD”.

Schema form lokal dalam `app/content.json` merupakan adapter sementara, **bukan**
schema kanonis PRD §22.8. Backend perlu menyediakan generated JSON Schema/OpenAPI
dari kontrak Pydantic. Validator lokal hanya mencakup semantik yang bisa dibuktikan
dengan data browser; tidak menggantikan validasi otorisasi, signature atau transaksi.

## Audit per halaman

- `/`: ringkasan perangkat, sesi, saldo fixture, antrean retry dan revisi. Angka dihitung
  dari data lokal, bukan statistik acak atau klaim fleet sehat. Rujukan §13.2, §15.
- `/devices`: tiga jalur registry, preflight dan kebijakan penyimpanan; modal register.
  Register menghasilkan `PENDING_ENROLLMENT`, bukan identitas tepercaya otomatis.
  Rujukan §5.2, §11, §14.
- `/devices/registry` dan `/devices/[deviceId]`: daftar perangkat, detail, active/desired
  revision, status dan waktu terakhir terlihat. Pause/resume, refresh config, explicit
  hardware apply dan diagnostics menghasilkan command `PENDING`. Rujukan §5.3, §13.2.
- `/devices/preflight`: delapan pemeriksaan kamera, printer, jaringan, storage,
  pembayaran, waktu, template/signature dan revisi. Loading per pemeriksaan dan rerun
  yang dibersihkan saat pindah halaman. Tidak ada MutationObserver yang memaksa PASS.
  Rujukan §5.3. Hasil hardware/signature adalah fixture, diberi keterangan di halaman.
- `/devices/policy` → `/devices/[deviceId]/policy`: daftar perangkat ditampilkan lebih
  dahulu. Form memiliki ruang kosong minimum, ambang warning/block, retensi dan guard
  data belum tersinkron. Rujukan §8.4, §10.4.
- `/devices/camera`: adapter UVC/DSLR, stable ID, model allowlist, exposure/ISO/shutter/
  aperture/WB/focus/flash, resolusi, orientasi, motion source, pre/post-roll, warmup dan
  timeout. Companion membutuhkan konfirmasi kalibrasi fixture. Rujukan §5.2, §22.4.
- `/devices/printer`: CUPS/IPP default; TSPL/ZPL/ESC-POS sebagai adapter alternatif,
  ukuran dot, DPI, darkness, speed, cut/feed, dithering, offsets dan print entitlement.
  Rujukan §5.2, §9, §22.9.
- `/events` dan `/events/editor`: modal create dan editor scope/window/timezone,
  eligible devices, aktivasi, harga/tax/SKU/provider reference, expiry QR, grace,
  consent, durasi, idle/countdown/retakes/shots, branding serta template reference.
  Rujukan §5.1–5.3, §6, §11. Tidak mengotorisasi pembayaran melalui UI.
- `/events/campaigns`: scope acara/perangkat, window, urutan aktivasi dan override
  pengalaman tamu. Rujukan §5.1–5.2.
- `/events/rules`: kuota, reserve TTL, consume milestone, sesi per redemption, print
  entitlement, transferability, cache age, clock tolerance dan konflik. Konsumsi
  ditetapkan pada `FIRST_SUCCESSFUL_STILL`; duplikat melanjutkan sesi yang sama.
  PAYG QRIS offline selalu `DENY`. Rujukan §6, §10.4.
- `/templates` dan `/templates/editor`: create/edit draft versi immutable, logical
  coordinate space, slot JSON, layer JSON, safe area, font-license metadata dan
  placeholder allowlist. Validasi menolak slot di luar canvas, ID slot duplikat,
  referensi placeholder tidak diizinkan dan layer tidak valid. Rujukan §22.6–22.7.
  Pratinjau visual diberi label skematis; bukan hasil render gambar final.
- `/templates/profiles`: output digital, preview, thermal dan motion memakai coordinate
  space bersama. H.264/yuv420p, audio MVP nonaktif, batas durasi/memori boomerang.
  Rujukan §22.5–22.6. Tidak menjanjikan format proprietary Apple Live Photo.
- `/templates/validate`: semantik meninjau draf terpilih; hash aset, signature,
  kompatibilitas, golden render dan kesiapan aktivasi memakai fixture eksplisit.
  Kegagalan tidak mengganti versi aktif. Rujukan §22.6–22.7.
- `/templates/sync`: per-device desired/active version, lastSync, lastError, cache size,
  retry dan rollback request. Tidak mengubah pointer active dari UI. Rujukan §22.7.
- `/vouchers` dan `/vouchers/allocations`: modal request, scope eksklusif satu perangkat,
  versi monotonik, window, reserve TTL, batas sesi dan print entitlement. Counter
  inventori bertanda tangan hanya-baca. Request baru tidak menambah saldo atau membuat
  signature. Rujukan §10.4, §11.
- `/vouchers/ledger`: filter ID/perangkat/status dan jejak append-only dengan token
  tersamarkan, sequence serta backend checkpoint. Tidak ada tombol “mark reconciled”.
  Rujukan §10.4; rekonsiliasi hanya setelah durable contiguous backend acknowledgement.
- `/vouchers/readiness`: config, event scope/window, template, waktu, storage, kamera,
  printer dan signed inventory. Alokasi request/expired tidak dianggap siap.
  Rujukan §10.4.
- `/queue` dan `/queue/jobs`: modal retry aman, filter job, prioritas, status, attempts,
  idempotency dan error. Job offline/active lease/dead-letter ditolak dari retry aman.
  Requeue mempertahankan job ID dan idempotency; attempts tidak naik sebelum eksekusi
  worker. Rujukan §10.2–10.4.
- `/queue/review`: dead-letter dapat diperiksa dan diberi catatan eskalasi audit;
  blind retry untuk konflik/version gap dihapus. Payload sensitif tidak ditampilkan.
  Rujukan §10.4, §16.
- `/queue/policy`: bounded exponential backoff, full jitter, lease timeout, batas
  percobaan, wait-for-connection dan dead-letter. Angka bukan SLO produksi. §10.2–10.4.
- `/history`, `/history/diff`: modal compare dua revisi, URL parameter baseline/target/
  device, diff nilai sebenarnya dan acknowledgement per perangkat yang hanya-baca.
  Tidak ada “acknowledge remaining” manual. Rujukan §5.1, §22.8.
- `/history/configuration`: editor layer platform → device → event → campaign →
  on-site override; `null` mewarisi, `false`/`0` tetap eksplisit. Override kedaluwarsa
  dikeluarkan dari preview. Simulator effective-config ini mencakup lima field runtime
  bersama; form domain lain menampilkan diff draft masing-masing. §5.1, §22.8.
- `/history/rollback`: target immutable, cakupan perangkat, alasan dan simulasi
  re-authentication. Membuat desired revision baru; active revision tidak berubah
  sebelum edge acknowledgement. Sesi aktif mempertahankan snapshot. §5.1, §22.7.
- `/history/audit`: catatan aksi lokal append-only, actor, reason, scope, waktu;
  filter dan ekspor data audit. Ekspor adalah ide UX tambahan. §11, §14 untuk audit.
- `/settings`, `/settings/roles`: matriks izin dan penugasan terbatas; dialog undangan.
  PRD §14 mewajibkan RBAC, **tetapi matriks peran, alur undangan dan TTL undangan yang
  persis ini merupakan ide tambahan**, ditandai di UI. Re-auth checkbox hanya simulasi.
- `/settings/trust`: registry identitas tersamarkan, rotate/revoke request dengan
  alasan dan re-auth simulation. Perangkat offline tetap menunggu, tidak langsung
  berstatus revoked/rotated. Rujukan §14, §22.10.
- `/settings/retention`: media/delivered/audit windows, deletion grace, masking wajib,
  dan proteksi data unreconciled. Cleanup mensyaratkan verified upload **dan** retensi
  habis. Rujukan §8.4, §10.4, §14, §22.7.
- `/sessions`, `/payments`, `/media`, `/print`, `/delivery`: katalog, pencarian, filter
  status dan detail read-only sesuai §11–13. Detail sesi menyimpan snapshot/correlation
  reference; pembayaran PAID hanya fixture backend terverifikasi. SENT tidak berarti
  bukti cetak fisik. Pengiriman menunggu rekonsiliasi dan media terverifikasi.
- `/delivery/policy`: channel/provider/template reference, claim TTL, signed-link TTL,
  fallback, locale, private bucket/prefix/region dan encryption. Tidak ada secret atau
  signed URL nyata dalam browser. Rujukan §5.2, §9.3, §14.
- `/insights`: counter sesi/pembayaran/upload/delivery dan acknowledgement sesuai §15,
  sehingga **tidak lagi ditandai seluruhnya sebagai fitur di luar PRD**. Latency,
  CPU/memori, clock drift dan restart telemetry belum terintegrasi dan ditandai.

## Keputusan fase dan perbedaan dengan Electron

- Ketentuan normatif §22.12 memperinci pilot Canon EOS 80D + companion webcam;
  gunakan ketentuan rinci ini untuk membaca pembagian fase sebelumnya di §19.
  Electron yang diunggah masih memakai mock service dan UVC browser capture; tidak
  membuktikan dukungan DSLR, worker native, signature atau durable backend.
- DSLR_MOVIE, arbitrary shell/scripts, proprietary Apple Live Photo, face-aware crop,
  dan background AI tidak diaktifkan. Tidak ditampilkan sebagai fitur MVP siap pakai.
- Backend redelivery manual tahap P1 tidak disamarkan sebagai retry bebas pada UI.

## Integrasi yang masih wajib

Canonical schema/SDK, server RBAC dan re-authentication, device enrollment/certificates,
signed manifests, capability probes, media rendering/upload/checksum, private storage,
durable payment/voucher transactions, ordered reconciliation, actual commands/ack,
retention execution dan telemetry. LocalStorage dapat diedit pengguna; bukan audit
store yang aman atau pengganti server authorization.

## Catatan dependency

Audit npm pada 8 September 2026 mendeteksi **2 kelompok kerentanan high** pada Next.js
14.2.35 dan PostCSS transitifnya. Fix otomatis yang ditawarkan adalah upgrade mayor
Next.js. Upgrade mayor tidak dilakukan diam-diam dalam refactor UI ini. Jangan
mempublikasikan aplikasi ke jaringan produksi sebelum upgrade dan audit ulang.
