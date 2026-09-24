# Lil Photobooth / Edge Console

Dashboard front-end untuk mengelola resource operasional Our Lil Photobooth.
Project dibangun dengan Next.js App Router, TypeScript, Tailwind CSS, React Query,
React Hook Form, Zod, dan Lucide.

Implementasi saat ini mengutamakan kontrak `ourlil-swagger.json`, kemudian relasi
di `photobooth-digram-io.md`. PRD lama hanya digunakan bila tidak menambah field,
status, atau aksi yang tidak tersedia pada API/ERD.

## Menjalankan project

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` melalui panel browser Codex.

Perintah pemeriksaan:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

`npm run format` merapikan source dengan Prettier. Server development tidak
dijalankan sebagai service; hentikan proses terminalnya dengan `Ctrl+C` setelah
selesai.

## Autentikasi Arna SSO

Semua halaman console dilindungi. Pengguna tanpa cookie `access_token` diarahkan
ke `/login`. Alurnya mengikuti CMS-SITE: email/password atau Google dapat
bercabang ke MFA, sedangkan passkey menggunakan bridge
`/auth/sso/bridge/begin/` dan callback `/auth/callback`. Setelah token diterima,
aplikasi memeriksa organisasi lalu tenant.

Salin nama variabel dari `.env.example` ke environment lokal. Jangan commit token,
client secret, password, atau isi `.env`. `NEXT_PUBLIC_GOOGLE_CLIENT_ID` bersifat
opsional; tombol Google disembunyikan ketika tidak dikonfigurasi.

## Integrasi service

Client memakai `NEXT_PUBLIC_EDGE_API_URL`, dengan nilai default
`https://ourlilphotobooth.fastapicloud.dev`. Resource ditambahkan langsung ke host,
misalnya `/campaigns?skip=0&limit=20`, tanpa prefiks `/api`. Pengecualiannya adalah
file workflow `/api/files/...`, sesuai kontrak Swagger.

Semua request yang terlindungi memakai bearer `access_token` dari sesi Arna SSO.
Token tidak ditulis di source code. UI tidak menggunakan fixture lokal sebagai
fallback bila API gagal.

Resource yang digunakan dashboard:

- Campaigns, booths, dan device assignments.
- Devices serta operasi sync.
- Camera profiles dan printer profiles.
- Frame templates.
- Voucher batches dan vouchers.
- Sessions dan device history.
- Payments dan refund.
- File upload initiation.
- Reports revenue, booth, campaign, session funnel, dan voucher batch.

Istilah Campaigns di UI memetakan resource campaign. Alur deployment mengikuti
campaign → booth → device assignment → device.

## Struktur penting

- `app/(console)/`: route App Router untuk console.
- `components/layout/`: shell, sidebar, topbar, dan navigasi responsif.
- `components/forms/`: form berbasis schema kontrak, editor, dan konfirmasi.
- `components/devices/`, `events/`, `media/`, `profiles/`, `templates/`, dan
  `vouchers/`: komponen per domain.
- `components/service/`: daftar dan detail resource API yang digunakan bersama.
- `components/providers/`: locale, toast, dan provider client.
- `hooks/use-edge-service.ts`: query dan mutation React Query untuk service.
- `lib/edge-service/`: client, tipe, pagination, form contract, dan mapper API.
- `lib/reference-validation.ts`: validasi relasi/tanggal yang masih relevan.
- `app/content.json`: sumber tunggal teks UI English/Indonesia.

## Dokumentasi

- `docs/panduan-penggunaan.md`: alur penggunaan fitur aktif.
- `docs/prd-alignment.md`: batas kesesuaian API, ERD, dan PRD.
- `docs/verification.md`: cakupan dan hasil pemeriksaan.
- `docs/riwayat-penyederhanaan-api-erd-2026-09-23.md`: riwayat perubahan terbaru.

`docs/HANDOVER.md` dan `docs/alur-bisnis-berdasarkan-erd.md` dipertahankan sebagai
catatan historis dan telah diberi penanda agar tidak dianggap sebagai spesifikasi
aktif.

## Batas kontrak saat ini

Queue Center, Config History, Settings operasional, Print, Delivery, device
preflight/policy, event rules terpisah, template bundle validation, dan voucher
readiness tidak ditampilkan karena tidak mempunyai resource atau operasi yang
cocok pada Swagger/ERD saat ini.

Swagger belum mendefinisikan body response 201 untuk `/api/files/upload`. Karena
itu halaman Media hanya menjalankan tahap inisiasi yang dapat dibuktikan oleh
kontrak dan menampilkan response service apa adanya.

Pengujian browser opsional tersedia melalui:

```powershell
./tests/browser-smoke.ps1 -Width 320 -Height 800
./tests/browser-smoke.ps1 -Width 1440 -Height 1000
```

Jangan melakukan mutation ke service produksi untuk smoke test tanpa data uji dan
otorisasi operasional yang jelas.
