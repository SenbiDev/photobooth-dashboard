# Lil Photobooth / Edge Console

Front-end dashboard untuk mengelola runtime configuration dan kesehatan fleet edge Our Lil Photobooth. Dibangun dengan Next.js App Router, TypeScript, Tailwind CSS, dan Lucide icons.

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Autentikasi Arna SSO

Semua halaman console dilindungi dan pengguna tanpa cookie `access_token` diarahkan
ke `/login`. Alurnya mengikuti CMS-SITE: email/password atau Google dapat bercabang
ke MFA, sedangkan passkey memakai bridge `/auth/sso/bridge/begin/` dan callback
`/auth/callback`. Setelah token diterima, aplikasi memeriksa organisasi lalu tenant.

Salin nama variabel dari `.env.example` ke environment lokal dan isi nilainya melalui
mekanisme secret/environment deployment. Jangan commit token, client secret, password,
atau isi `.env`. `NEXT_PUBLIC_GOOGLE_CLIENT_ID` bersifat opsional; tombol Google
disembunyikan ketika tidak dikonfigurasi.

## Service Our Lil Photobooth

Client service memakai `NEXT_PUBLIC_EDGE_API_URL` dengan nilai default
`https://ourlilphotobooth.fastapicloud.dev`. Path kontrak ditambahkan langsung ke
host, misalnya `/campaigns?skip=0&limit=20`, tanpa prefix `/api`. Semua request
memakai bearer `access_token` dari sesi Arna SSO; token tidak disimpan di source code.

Kontrak TypeScript dan adapter UI mengikuti `ourlil-swagger.json`. Modul yang sudah
terhubung meliputi campaign/event, booth, device dan assignment, session, profil
kamera/printer, frame template, voucher/batch, payment, device history, serta laporan.
Queue, media, print, delivery, config history, dan access settings belum memiliki
endpoint pada kontrak tersebut sehingga tetap ditandai sebagai simulasi lokal.

## Struktur

- `app/(console)/`: file `page.tsx` untuk setiap URL dan layout console bersama.
- `components/layout/`: sidebar, topbar, pencarian dan navigasi mobile.
- `components/forms/`: field schema, editor draft, modal create dan konfirmasi.
- `components/devices|queue|history|settings|templates|vouchers/`: komponen domain.
- `components/ui/`: modal, tabel responsif, header, notice dan badge.
- `components/providers/`: bahasa, notifikasi dan state demo persisten.
- `lib/edge-service/`: client, tipe kontrak dan pemetaan field PRD ke payload service.
- `lib/`: adapter konten, validasi, aturan domain, readiness dan mutasi lokal.
- `app/content.json`: satu sumber untuk label EN/ID, isi UI, schema form dan seed fixture.
- `docs/prd-alignment.md`: audit per halaman, rujukan PRD, ide tambahan dan batas integrasi.

Tautan langsung, refresh dan tombol back/forward browser menggunakan Next App Router.
Tidak ada lagi navigasi `setActive`, modal lewat `innerHTML`, atau event handler
yang bergantung pada teks tombol. Komponen interaktif memakai state React.

## Memeriksa perubahan

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

`npm run format` merapikan source melalui Prettier. `lint` menjalankan TypeScript
strict dan pemeriksaan format; belum ada ESLint ruleset tambahan.

Pengujian browser opsional memerlukan agent-browser dan server lokal di port 3000:

```powershell
./tests/browser-smoke.ps1 -Width 320 -Height 800
./tests/browser-smoke.ps1 -Width 1440 -Height 1000
```

## Batas demo dan integrasi

State operasional disimpan di LocalStorage `olp-console:v2`; bahasa di `olp-locale`.
Data dan mutasi yang tersedia pada `ourlil-swagger.json` terhubung ke service produk.
Email delivery, media/upload, queue, print job, config revision, access settings, dan
remote command selain device sync belum memiliki endpoint dan tetap berjalan lokal.
Record lama dari UI sebelumnya tidak dimigrasikan otomatis ke kontrak baru.
Nilai contoh bukan default operasional produksi.

Publikasi config memperbarui **desired revision**, tidak memalsukan **active revision**
atau acknowledgement. Template/alokasi baru tetap menunggu penandatanganan backend.
Ledger read-only, retry mempertahankan idempotency, PAYG QRIS offline ditolak dan
retensi tidak mengizinkan penghapusan data belum terunggah/terekonsiliasi.

Tim backend perlu mengganti adapter kontrak lokal dengan generated schema/SDK serta
otorisasi server, transaksi durable, signature, acknowledgement dan telemetry nyata.
Checkbox re-authentication hanya demonstrasi UI, bukan mekanisme keamanan.

Server development tidak dijalankan sebagai service. Hentikan dengan Ctrl+C pada
terminal yang menjalankannya; refresh/menutup tab browser tidak menghentikan server.

## Sebelum deployment

Audit npm pada 8 September 2026 menemukan 2 kelompok kerentanan high pada dependency
Next.js 14 dan PostCSS transitif. Perbaikannya memerlukan upgrade mayor Next.js;
tidak dijalankan `audit fix --force` dalam refactor ini. Jangan deploy ke produksi
sebelum upgrade dependency, audit ulang, dan integrasi keamanan server.
