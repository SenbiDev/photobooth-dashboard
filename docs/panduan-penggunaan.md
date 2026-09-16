# Panduan Penggunaan Lil Photobooth / Edge Console

Dokumen ini menjelaskan alur penggunaan dashboard, urutan aksi fitur, dan isi
setiap halaman berdasarkan implementasi project saat ini.

Tanggal peninjauan: 8 September 2026.

Nama tombol ditulis dengan label English dan padanan Indonesia pada bagian utama
agar panduan dapat digunakan dalam kedua bahasa antarmuka.

## Daftar isi

- [1. Tujuan dan batas aplikasi](#1-tujuan-dan-batas-aplikasi)
- [2. Memulai dan mengenali navigasi](#2-memulai-dan-mengenali-navigasi)
- [3. Alur keseluruhan penggunaan](#3-alur-keseluruhan-penggunaan)
- [4. Pola umum pengisian dan publikasi](#4-pola-umum-pengisian-dan-publikasi)
- [5. Overview](#5-overview)
- [6. Devices](#6-devices)
- [7. Events](#7-events)
- [8. Templates](#8-templates)
- [9. Voucher pool](#9-voucher-pool)
- [10. Queue center](#10-queue-center)
- [11. Halaman data operasional](#11-halaman-data-operasional)
- [12. Config history](#12-config-history)
- [13. Settings](#13-settings)
- [14. Insights](#14-insights)
- [15. Halaman loading, error, dan tidak ditemukan](#15-halaman-loading-error-dan-tidak-ditemukan)
- [16. Skenario penggunaan terpandu](#16-skenario-penggunaan-terpandu)
- [17. Arti status dan penanganan kendala](#17-arti-status-dan-penanganan-kendala)
- [18. Batas implementasi dan ide tambahan](#18-batas-implementasi-dan-ide-tambahan)
- [19. Referensi pemeliharaan dokumentasi](#19-referensi-pemeliharaan-dokumentasi)

## 1. Tujuan dan batas aplikasi

Dashboard ini digunakan untuk menyiapkan konfigurasi perangkat photobooth,
acara, template, voucher, kebijakan antrean, dan kontrol operasional.
Dashboard bukan aplikasi tamu untuk mengambil foto atau melakukan pembayaran.

Implementasi operasional memakai dua sumber. Modul yang tersedia pada
`ourlil-swagger.json` membaca dan mengubah data melalui service
`https://ourlilphotobooth.fastapicloud.dev` dengan `access_token` sesi Arna SSO.
Fitur yang belum memiliki endpoint tetap berjalan sebagai simulasi lokal.

Terdapat tiga jenis perilaku yang perlu dibedakan:

1. **Perubahan service:** campaign/event, device, profil hardware, frame template,
   voucher batch, dan aksi yang tersedia pada kontrak dikirim ke service aktif.
2. **Perubahan lokal:** queue, config history, access settings, media, print,
   delivery, serta remote command tanpa endpoint disimpan sebagai simulasi browser.
3. **Pemeriksaan simulasi:** menampilkan loading dan hasil pemeriksaan berdasarkan
   data lokal serta skenario fixture, bukan pemeriksaan hardware langsung.
4. **Data service hanya-baca:** session, device history, voucher ledger, dan laporan
   mengikuti response API; media, print, dan delivery masih memakai contoh lokal.

Data lokal tersimpan di LocalStorage dengan kunci `olp-console:v2`.
Pilihan bahasa tersimpan dengan kunci `olp-locale`.
Penyimpanan terpisah per browser/profile dan origin; `localhost:3000` dan
`localhost:3001` tidak menggunakan penyimpanan yang sama. Jangan mengandalkan
sinkronisasi langsung antar-tab atau memakai LocalStorage sebagai audit yang aman.

Jangan masukkan password, private key, token provider, atau data pribadi asli ke
form demo. Referensi provider/bucket dan fingerprint adalah pengenal, bukan tempat
menyimpan credential. Field alasan dan catatan merupakan teks bebas; jangan
menganggap isinya otomatis disamarkan.

## 2. Memulai dan mengenali navigasi

### 2.1 Menjalankan aplikasi lokal

1. Buka terminal pada folder project.
2. Jika dependency belum tersedia, jalankan `npm install`.
3. Jalankan `npm run dev`.
4. Buka alamat yang ditampilkan terminal, biasanya `http://localhost:3000`.
5. Pengguna tanpa sesi akan diarahkan ke `/login`.
6. Masuk melalui email/password, Google, atau passkey. Login dapat meminta MFA.
7. Setelah token diterima, aplikasi memeriksa organisasi lalu tenant. Jika salah
   satunya belum ada, lengkapi onboarding yang ditampilkan.
8. Setelah akses workspace ditemukan, tunggu hingga dashboard memuat data service.
9. Badge `Live service / Service aktif` menandai data atau aksi yang menggunakan API.
   Peringatan berwarna kuning menandai flow yang masih berupa simulasi lokal.

Jika server memilih port lain, gunakan port tersebut. Refresh atau menutup tab
browser **tidak menghentikan server**. Untuk mengakhiri server, hentikan proses
dari terminal yang menjalankannya dan pastikan port tidak lagi dilayani.

### 2.2 Alur autentikasi

1. **Email/password:** isi kredensial SSO lalu klik Sign in. Jika respons meminta
   MFA, masukkan enam digit dari aplikasi autentikator dan verifikasi.
2. **Google:** tombol muncul hanya jika `NEXT_PUBLIC_GOOGLE_CLIENT_ID` tersedia.
   Credential Google dikirim ke endpoint `/auth/google-login/` dan dapat bercabang
   ke MFA yang sama.
3. **Passkey:** tombol memulai bridge melalui Site API, mengarahkan browser ke SSO,
   lalu kembali ke `/auth/callback?code=...&state=...`. Callback menukar code/state
   menjadi pasangan access/refresh token.
4. Setelah autentikasi, organisasi diperiksa terlebih dahulu, kemudian tenant.
   Akun tanpa organisasi diarahkan ke onboarding organisasi; akun tanpa tenant
   diarahkan ke onboarding tenant.
5. Access token disimpan satu hari dan refresh token tujuh hari di cookie mengikuti
   pola CMS-SITE. Respons API 401 mencoba refresh satu kali; kegagalan refresh
   menghapus sesi dan mengembalikan pengguna ke login.
6. Klik ikon keluar di topbar untuk menghapus cookie sesi dan kembali ke login.

Route login/register/OTP/callback dapat diakses tanpa sesi sesuai tahap alurnya.
Semua route console dan onboarding memerlukan cookie access token. Remember me dan
Forgot password masih mengikuti tampilan CMS-SITE dan belum memiliki perilaku tambahan.

Jangan masukkan atau commit credential ke source code. Konfigurasi URL publik dan
Google client ID disediakan melalui environment; client secret tidak digunakan di UI.

### 2.3 Sidebar dan topbar

- Sidebar membuka Overview, Devices, Events, Templates, Voucher pool, Queue center,
  Sessions, Payments, Media, Print, Delivery, Config history, Settings, dan Insights.
- Pada viewport kecil, buka ikon menu untuk menampilkan navigasi.
- Tombol `EN` dan `ID` mengganti bahasa antarmuka tanpa menghapus data tersimpan.
  Teks yang Anda ketik, ID, kode status, dan kode teknis tidak diterjemahkan otomatis.
- Ikon pencarian membuka pencarian halaman, kartu fitur, dan perangkat berdasarkan
  nama/ID yang ditampilkan. Ini bukan pencarian isi seluruh transaksi.
- Ikon lonceng menampilkan hingga delapan aksi audit lokal terbaru serta tautan
  menuju audit lengkap. Ini bukan notifikasi dari backend.
- Avatar adalah identitas contoh, bukan tombol login atau penggantian akun. Gunakan
  ikon keluar di sebelahnya untuk mengakhiri sesi SSO.
- Pembuatan acara berada di halaman Events; tidak ada tombol `New event` di topbar.

Gunakan tombol kembali pada halaman atau Back/Forward browser untuk berpindah.
Halaman memakai URL Next App Router sehingga dapat dibuka langsung dan di-refresh.
Namun, tidak semua filter/pilihan lokal disimpan ke URL.

### 2.3 Modal dan formulir

Modal dapat ditutup melalui tombol batal, ikon tutup, atau Escape.
Menutup modal tanpa menyimpan membuang isian modal tersebut.
Pada editor halaman, simpan sebelum berpindah record, meninggalkan halaman,
atau refresh; belum tersedia peringatan perubahan yang belum disimpan.

Tanda bintang menunjukkan field wajib. Untuk field beberapa perangkat,
gunakan pilihan jamak bawaan browser; di desktop umumnya Ctrl/Cmd+klik atau
Shift+klik. Pastikan perangkat target masuk ke daftar yang diizinkan.

## 3. Alur keseluruhan penggunaan

### 3.1 Urutan persiapan operasional

Urutan berikut adalah cara meninjau konfigurasi secara sistematis, bukan wizard
yang otomatis menjalankan seluruh proses:

1. **Kenali kondisi awal:** buka Overview untuk melihat perangkat, revisi,
   voucher contoh, dan job yang memenuhi syarat retry.
2. **Tinjau akses dan proteksi:** buka Settings untuk memahami peran, trust
   perangkat, dan retensi data.
3. **Siapkan perangkat:** periksa registry, identitas, profil kamera/printer,
   dan kebijakan storage. Registrasi baru hanya membuat permintaan enrollment.
4. **Siapkan template:** buat atau pilih template, periksa geometri dan output
   profiles, jalankan validasi bundle, lalu tinjau sinkronisasinya.
5. **Siapkan acara:** tentukan perangkat eligible, window, timezone, referensi
   template, aktivasi, harga bila PAYG, dan pengalaman tamu.
6. **Lengkapi aturan:** sesuaikan campaign, kuota, reserve TTL, aturan voucher,
   dan penerimaan offline.
7. **Siapkan distribusi hasil:** tinjau Delivery policy dan kebijakan antrean.
8. **Jika memakai voucher offline:** buat permintaan alokasi eksklusif per
   perangkat, lalu periksa ledger dan readiness.
9. **Tinjau dan publikasikan simulasi:** simpan/validasi draf, tinjau diff dan
   cakupan, kemudian konfirmasi publikasi.
10. **Periksa kesiapan:** lihat desired/active revision, permintaan perangkat,
    preflight, dan status bundle. Pada sistem terintegrasi, tunggu acknowledgement
    edge sebelum menganggap konfigurasi benar-benar aktif.
11. **Pantau operasi:** telusuri Sessions, Payments, Media, Print, Delivery,
    Queue center, dan Insights.
12. **Tangani masalah dan tutup siklus:** retry hanya job yang aman, catat eskalasi
    dead-letter, siapkan rollback bila diperlukan, dan tinjau audit.

Data contoh sudah menyediakan acara, perangkat, template, dan inventori awal.
Gunakan record contoh yang sesuai untuk demonstrasi alur siap-pakai. Anda tidak
dapat menuntaskan enrollment, penandatanganan, atau acknowledgement perangkat
baru hanya dengan dashboard ini.

### 3.2 Alur sesi tamu yang dipantau dashboard

Secara konseptual, operasi photobooth mengikuti urutan berikut:

1. Perangkat memeriksa kesiapan dan konfigurasi yang berlaku.
2. Tamu mendapat hak sesi melalui entitlement acara, voucher, atau pembayaran
   PAYG QRIS yang terverifikasi.
3. Sesi memakai snapshot konfigurasi/template agar perubahan berikutnya tidak
   mengubah sesi yang sedang berjalan.
4. Perangkat menjalankan capture. Voucher dikonsumsi pada
   `FIRST_SUCCESSFUL_STILL`, bukan hanya karena QR dipindai.
5. Pekerjaan media dan cetak diproses sesuai entitlement dan kemampuan perangkat.
6. Jika offline, pekerjaan durable dan rekonsiliasi menunggu koneksi. PAYG QRIS
   offline tetap ditolak; jalur offline bukan persetujuan pembayaran lokal.
7. Pengiriman hasil menunggu prasyarat rekonsiliasi dan unggahan terverifikasi.
8. Cleanup mengikuti masa retensi tanpa menghapus data yang masih dilindungi.

Urutan ini menjelaskan hubungan antarmodul. Tidak ada tombol dashboard untuk
menjalankan sesi tamu lengkap, memotret, membayar, atau mengirim hasil sungguhan.

## 4. Pola umum pengisian dan publikasi

### 4.1 Alur editor bersama

Editor event, campaign, rules, hardware, storage, template, output profiles,
allocation, retry policy, retention, delivery, dan runtime memakai pola berikut:

1. Buka halaman editor dari kartu fitur atau record yang relevan.
2. Jika tersedia pemilih record, pilih record yang ingin ditinjau terlebih dahulu.
3. Lengkapi kelompok field dan tentukan perangkat/cakupan perubahan.
4. Isi alasan audit yang menjelaskan tujuan perubahan.
5. Tinjau panel perbedaan nilai sebelum dan sesudah.
6. Klik `Save draft / Simpan draf` untuk menyimpan perubahan lokal yang valid.
7. Klik `Validate draft / Validasi draf`. Tombol ini juga menyimpan nilai saat itu,
   kemudian memberi status `VALIDATED` jika validasi lokal berhasil.
8. Jika ada kesalahan, perbaiki field yang ditandai lalu validasi ulang.
9. Klik `Publish simulation / Simulasi publikasi` setelah tombol aktif.
10. Periksa cakupan perangkat pada modal, isi/periksa alasan, centang simulasi
    autentikasi ulang administrator, lalu konfirmasi.
11. Verifikasi hasil melalui status draf, riwayat revisi/permintaan, dan audit.

Simpan draf juga menjalankan validasi; form tidak lengkap atau tidak valid belum
tentu dapat disimpan. Mengubah satu field setelah validasi membuat versi yang
sedang ditampilkan belum layak dipublikasikan sampai divalidasi kembali.

`Reset form / Reset formulir` mengembalikan isian ke baseline record/default,
bukan menghapus semua data aplikasi atau melakukan rollback perangkat.
Reset belum menyimpan perubahan reset tersebut; simpan bila memang ingin
mengganti draf tersimpan dengan baseline.

### 4.2 Cakupan dan arti hasil publikasi

- `Selected device / pilot` menargetkan perangkat yang dipilih.
- `All eligible devices` memperluas cakupan sesuai pemilih rollout dan daftar
  eligible yang tersedia pada form/acara. Selalu baca daftar target di konfirmasi.
- Publikasi konfigurasi membuat revisi baru dan memperbarui `desired` pada target.
  Nilai `active` tidak ikut dinaikkan dari browser.
- Publikasi template/alokasi menghasilkan `UNSIGNED_REQUEST` yang menunggu
  backend. Ini tidak menambah saldo voucher atau mengaktifkan bundle.
- Snapshot sesi aktif tidak diubah oleh simulasi publikasi.
- Checkbox autentikasi ulang adalah simulasi UX, bukan login, MFA, atau otorisasi.

Panel diff pada editor domain membandingkan draf dengan record/default lokal;
jangan menganggapnya selalu perbandingan dengan konfigurasi aktif terakhir pada
perangkat. Preview penggabungan layer khusus tersedia di Runtime configuration.

## 5. Overview

**URL:** `/`.

Halaman awal berisi ringkasan jumlah perangkat online dibanding total perangkat,
jumlah sesi contoh, saldo tersedia dari alokasi `SIGNED_FIXTURE`, serta jumlah
job yang memenuhi syarat retry aman. Ada daftar perangkat, revisi terbaru, dan
tiga aksi audit lokal terbaru.

Cara menggunakan:

1. Buka Overview untuk menentukan modul yang perlu ditinjau.
2. Klik tautan pada metrik untuk membuka Devices, Sessions, Voucher pool,
   atau Queue center.
3. Cari perangkat pada daftar ringkas, lalu buka detailnya.
4. Gunakan tautan pengecekan untuk membuka preflight.
5. Gunakan aksi edit di header untuk membuka `/history/configuration`.
6. Buka perbandingan revisi atau audit untuk menelusuri perubahan.

Angka ringkasan berasal dari state/fixture browser, bukan pemantauan fleet langsung.

## 6. Devices

### 6.1 Halaman modul perangkat

**URL:** `/devices`.

Halaman ini menjadi pintu masuk ke registri, preflight, dan kebijakan storage.
Tombol `Register device / Daftarkan perangkat` membuka modal pendaftaran.

Urutan pendaftaran:

1. Klik Register device.
2. Isi identitas: ID unik, nama, lokasi, model edge, dan acara yang sudah tersedia.
3. Tentukan adapter kamera, ID kamera stabil, transport printer, ID printer
   stabil, dan kapasitas storage kosong sebagai fixture.
4. Masukkan fingerprint public key contoh dan kelompok rollout.
5. Klik Simpan draf. Jika ID sudah dipakai atau referensi tidak valid, perbaiki isian.
6. Buka registry dan cari ID baru untuk memeriksa hasilnya.

Hasil: perangkat lokal berstatus `PENDING_ENROLLMENT`, active/desired masih nol,
dan belum dianggap tepercaya. Tidak ada penerbitan sertifikat atau koneksi hardware.
Modal mengumpulkan metadata lebih lengkap daripada ringkasan Device yang saat ini
disimpan; lokasi, model, stable ID hardware, dan kelompok enrollment belum memiliki
alur detail/edit persisten lengkap. Jangan menggunakan form ini sebagai inventaris
hardware produksi.

### 6.2 Device registry

**URL:** `/devices/registry`.

Masuk melalui `Open registry / Buka registri`. Daftar menampilkan ID/nama,
status, active revision, desired revision, dan last seen.

1. Cari perangkat berdasarkan nama atau ID.
2. Baca status dan selisih revisinya.
3. Klik Open pada baris untuk membuka detail perangkat.
4. Gunakan tombol pendaftaran di header jika perlu membuat perangkat contoh baru.

### 6.3 Detail perangkat

**URL:** `/devices/[deviceId]`, misalnya `/devices/LIL-BOOTH-014`.

Detail menampilkan nama, status, storage, active/desired revision, indikasi ACK,
tautan storage/camera/printer/preflight, serta daftar perintah untuk perangkat itu.

Urutan aksi perangkat:

1. Pastikan ID perangkat benar.
2. Pilih salah satu aksi berikut:
   - `Pause new sessions`: meminta jeda penerimaan sesi baru.
   - `Resume new sessions`: meminta penerimaan sesi baru dilanjutkan.
   - `Request config sync`: meminta sinkronisasi konfigurasi.
   - `Apply hardware profile`: meminta penerapan profil hardware secara eksplisit.
   - `Collect diagnostics`: meminta pengumpulan diagnostik.
3. Isi alasan dan centang simulasi autentikasi ulang.
4. Konfirmasi, lalu periksa daftar Commands dan audit.

Seluruh aksi hanya membuat command `PENDING`. Tombol pause/resume tidak langsung
mengubah status perangkat, sync tidak membuat ACK, dan diagnostics tidak
menghasilkan berkas diagnostik sungguhan.

### 6.4 Preflight checklist

**URL:** `/devices/preflight`.

Masuk melalui `Run preflight / Jalankan preflight` atau tautan di detail perangkat.
Parameter `?device=LIL-BOOTH-014` dapat membawa pilihan perangkat awal.

1. Buka halaman; pengecekan otomatis dimulai.
2. Pilih perangkat yang ingin diperiksa.
3. Pilih `Healthy fixture / Fixture sehat` atau `Failure fixture / Fixture gagal`.
   Mengganti perangkat/skenario memulai pemeriksaan baru.
4. Tunggu urutan `PENDING` lalu `RUNNING` dan hasil akhir `PASS` atau `FAILED`.
5. Baca alasan pada kartu gagal serta jumlah pemeriksaan yang lulus.
6. Klik `Rerun checks / Ulangi pengecekan` setelah proses sebelumnya selesai.

Delapan pemeriksaan: kamera, printer, jaringan, storage, pembayaran, waktu,
template, dan konfigurasi. Tombol rerun tidak aktif selama proses berjalan.
Berpindah halaman membatalkan timer pemeriksaan lama.

Fixture sehat bukan tombol untuk memaksa semua PASS. Perangkat degraded dapat
gagal pada printer; perangkat offline pada jaringan/pembayaran; storage di bawah
5 GB pada storage; dan active berbeda dari desired pada config. Perangkat yang
masih enrollment gagal pemeriksaan. Ambang 5 GB di pemeriksa ini adalah nilai
simulasi, bukan pembacaan otomatis seluruh kebijakan storage yang Anda edit.

### 6.5 Daftar kebijakan storage

**URL:** `/devices/policy`.

Masuk melalui `Review policy / Tinjau kebijakan`. Halaman menampilkan daftar
perangkat terlebih dahulu supaya cakupan jelas.

1. Cari perangkat.
2. Periksa status dan revisinya.
3. Klik Open pada baris untuk membuka kebijakan perangkat tersebut.

### 6.6 Detail kebijakan storage perangkat

**URL:** `/devices/[deviceId]/policy`.

Field meliputi retensi media lokal, warning pemakaian disk, persentase blokir
sesi baru, minimum ruang kosong, syarat cleanup, dan proteksi data unreconciled.
ID perangkat yang dibawa dari route dikunci pada form.

1. Pilih perangkat melalui halaman daftar kebijakan.
2. Sesuaikan batas ruang dan retensi.
3. Pastikan persentase blokir lebih tinggi daripada warning.
4. Tetap aktifkan proteksi data yang belum diakui/direkonsiliasi.
5. Simpan, validasi, dan jalankan simulasi publikasi sesuai bagian 4.

Tidak ada penghapusan berkas atau perubahan kapasitas disk nyata.

### 6.7 Camera profile

**URL:** `/devices/camera`.

Masuk melalui tautan adapter kamera pada detail perangkat. Parameter `?device=...`
mengisi dan mengunci perangkat awal pada editor.

Isi form mencakup adapter UVC/DSLR tether, stable ID, model allowlist, ukuran still,
orientasi, mirror, exposure, ISO, shutter, aperture, white balance, focus, warmup,
timeout, flash, sumber motion, kalibrasi companion, pre/post-roll, FPS, dan fallback.

1. Pastikan perangkat dan adapter yang dituju.
2. Isi konfigurasi capture berdasarkan contoh kapabilitas yang ingin disimulasikan.
3. Tentukan motion source; DSLR tether tidak boleh memakai pilihan UVC stream.
4. Jika memakai webcam companion, konfirmasi kalibrasi fixture.
5. Pertahankan audio MVP nonaktif, lalu simpan/validasi/publikasikan simulasi.
6. Kembali ke detail perangkat dan ajukan Apply hardware profile.
7. Buka preflight untuk meninjau pemeriksaan ulang.

Langkah apply dan preflight belum menerapkan atau menguji kamera sebenarnya.

### 6.8 Printer profile

**URL:** `/devices/printer`.

Form berisi transport CUPS/IPP, TSPL, ZPL atau ESC/POS; stable ID; DPI; ukuran
raster dalam dot; media; darkness; speed; dithering; cut/feed; offset kalibrasi;
jumlah salinan; reprint; kewajiban cetak; fallback printer tidak sehat; dan QR klaim.

1. Buka profil dari detail perangkat.
2. Tentukan transport dan parameter raster yang sesuai contoh printer.
3. Sesuaikan entitlement cetak dan pilihan digital-only atau blokir sesi baru
   ketika printer tidak sehat.
4. Simpan, validasi, dan publikasikan simulasi.
5. Ajukan Apply hardware profile dari detail perangkat, kemudian ulangi preflight.

Tidak tersedia test print fisik. Status job `SENT` bukan jaminan kertas tercetak.

## 7. Events

### 7.1 Halaman modul dan Create event

**URL:** `/events`.

Menampilkan kartu Edit event, Review campaign, View rules, serta daftar acara
yang dapat dicari berdasarkan ID/nama.

Urutan membuat acara:

1. Klik `Create event / Buat event`.
2. Isi nama, slug unik, waktu mulai/akhir, timezone IANA seperti `Asia/Jakarta`,
   perangkat eligible, bahasa tamu, dan referensi template.
3. Pilih mode aktivasi: `EVENT_ENTITLEMENT`, `VOUCHER`, atau `PAYG_QRIS`.
4. Isi konfigurasi pembayaran: harga dalam unit terkecil, mata uang, pajak, SKU,
   masa berlaku QR, grace callback, dan referensi provider. PAYG harus mewajibkan
   pembayaran; referensi provider bukan secret/API key.
5. Isi durasi sesi, idle timeout, countdown, jumlah foto, retakes, jeda foto,
   consent, pesan tamu, dan warna brand.
6. Tentukan perangkat target, alasan, dan rollout.
7. Simpan; acara muncul sebagai `DRAFT` pada daftar.
8. Klik Open pada acara tersebut untuk melanjutkan pengeditan/validasi/publikasi.

Pembuatan record tidak otomatis membuat acara aktif pada perangkat.

### 7.2 Event editor

**URL:** `/events/editor`.

Masuk melalui `Edit event / Edit acara`, atau Open pada record yang membawa
`?record=<id>`. Jika masuk melalui kartu, pilih acara yang benar pada dropdown.
Field sama dengan modal create, dengan tambahan panel draf/diff dan aksi publikasi.

1. Pilih acara sebelum mengedit.
2. Periksa window akhir lebih besar daripada awal dan timezone valid.
3. Pastikan perangkat target termasuk daftar eligible.
4. Sesuaikan pengaturan acara dan tinjau perubahannya.
5. Simpan, validasi, publikasikan simulasi, lalu tinjau desired revision/audit.

Publikasi editor menghasilkan revisi konfigurasi lokal, tetapi tidak otomatis
mengubah status record katalog acara dari DRAFT menjadi PUBLISHED atau mengubah
event assignment perangkat. Karena itu, acara baru tidak otomatis membuat
readiness hijau. Pengaktifan dan acknowledgement memerlukan integrasi lanjutan.

### 7.3 Campaign overrides

**URL:** `/events/campaigns`.

Masuk melalui `Review campaign / Tinjau kampanye`. Pilih campaign contoh yang
tersedia. Form berisi nama/kode, acara, window/timezone, perangkat eligible,
referensi template, durasi, kuota, pesan, consent, urutan aktivasi, dan cakupan.

1. Pilih campaign.
2. Periksa acara/perangkat dan rentang waktunya.
3. Sesuaikan override pengalaman tamu. Kuota campaign `0` berarti tanpa batas
   pada field ini; jangan menyamakan semantik nol dengan semua field kuota lain.
4. Pilih urutan voucher, event, atau PAYG terlebih dahulu.
5. Simpan, validasi, dan publikasikan simulasi.

Belum ada tombol Create campaign. Halaman ini mengedit draf campaign yang tersedia,
bukan membangun campaign baru melalui modal.

### 7.4 Entitlement rules

**URL:** `/events/rules`.

Masuk melalui `View rules / Lihat aturan`. Meskipun namanya View, halaman ini
memiliki input dan aksi draf.

1. Pilih acara dan tentukan kuota unlimited atau limited.
2. Atur total sesi, batas per tamu/perangkat/jendela, serta durasi jendela kuota.
3. Tinjau reserve TTL, maksimum redemption, sesi per redemption, hak cetak,
   transferability, dan pelepasan reservasi batal sebelum capture.
4. Tinjau izin entitlement cache, usia cache, clock tolerance, dan konflik.
5. Tentukan scope/alasan, lalu simpan, validasi, dan publikasikan simulasi.

Aturan yang harus tetap dipertahankan: consume pada `FIRST_SUCCESSFUL_STILL`,
duplikat melanjutkan sesi yang sama, PAYG QRIS offline `DENY`, dan konflik masuk
karantina/eskalasi. Halaman tidak menukarkan voucher atau mengubah ledger.

## 8. Templates

### 8.1 Halaman modul dan Add template

**URL:** `/templates`.

Berisi daftar template, pencarian, kartu editor/profiles/validation, dan tautan
Template sync.

Urutan membuat template:

1. Klik `Add template / Tambah template`.
2. Isi nama, ID template, versi, versi schema, ukuran canvas logis, dan latar.
3. Isi JSON slot, placeholder yang diizinkan, safe area, lisensi font,
   referensi aset contoh, dan JSON layer.
4. Isi perangkat target, alasan, dan rollout.
5. Simpan. Kombinasi ID/versi tidak boleh menduplikasi record yang sudah ada;
   versi baru untuk ID yang sudah terpublikasi harus meningkat.
6. Cari record baru lalu klik Open untuk membuka drafnya.

Hasil berupa template `DRAFT`, bukan bundle aset yang sudah ditandatangani.

### 8.2 Frame workspace

**URL:** `/templates/editor`.

Masuk melalui `Open templates / Buka template` atau record tertentu.
Memilih template non-DRAFT tanpa draf tersimpan menyiapkan nomor versi berikutnya.

1. Pilih template dan periksa nomor versi.
2. Sesuaikan canvas, slot foto, dan layer.
3. Pastikan JSON valid. Slot memerlukan ID unik, indeks sumber, posisi, ukuran,
   zIndex, dan fit; geometri harus berada di dalam canvas.
4. Gunakan placeholder yang didukung: `event.name`, `event.date`, `guest.code`,
   `session.sequence`, atau `capturedAt`.
5. Tinjau safe area, metadata font, referensi aset, dan pratinjau skematis.
6. Simpan dan validasi draf, lalu jalankan Validate bundle untuk memeriksa draf
   tersimpan yang sama.
7. Kembali ke editor dan publikasikan simulasi bila hasil telah ditinjau.

Layer dapat berupa asset, text, QR, shape, atau sticker. Pratinjau bukan hasil
render final dan tidak ada drag-and-drop designer/upload bundle pada versi ini.
Publikasi menghasilkan request baru `UNSIGNED_REQUEST`, tanpa mengganti bundle aktif.

### 8.3 Output profiles

**URL:** `/templates/profiles`.

Masuk melalui `View profiles / Lihat profil`. Mengatur ukuran/format digital
JPEG/PNG, kualitas JPEG, lebar preview, coordinate space bersama, ukuran/dither
cetak, ukuran/FPS/durasi video, codec, audio, dan boomerang/memory cap.

1. Tentukan coordinate space yang konsisten dengan template.
2. Isi profil digital dan preview.
3. Isi profil cetak dan motion.
4. Pertahankan codec `H264_YUV420P` dan audio `DISABLED` untuk pilihan MVP ini.
5. Tentukan perangkat/alasan/cakupan, kemudian ikuti alur editor bersama.

Profil ini tidak merender atau mengunduh file JPEG, PNG, maupun MP4.

### 8.4 Bundle admission

**URL:** `/templates/validate`.

Masuk melalui `Validate bundle / Validasi bundle`.

1. Simpan perubahan template di editor terlebih dahulu.
2. Buka halaman validasi, pilih perangkat dan template yang sama.
3. Pilih skenario fixture.
4. Tunggu sembilan pemeriksaan: geometri slot, hash aset, lisensi font,
   placeholder, signature, kompatibilitas, storage, golden render, dan aktivasi atomic.
5. Baca hasil dan penyebab kegagalan; kembali ke editor jika data perlu diperbaiki.
6. Setelah menyimpan perbaikan, jalankan ulang pengecekan.

Geometri/placeholder memanfaatkan validator lokal. Pemeriksaan biner, signature,
hash, dan render memakai fixture, bukan verifikasi kriptografi atau render nyata.
PASS di halaman ini tidak otomatis memberi status VALIDATED pada draf editor;
tetap gunakan Validasi draf sebelum publikasi. Kegagalan tidak mengubah versi aktif.

### 8.5 Template sync

**URL:** `/templates/sync`.

Halaman memperlihatkan per-device desired/active version, waktu sync terakhir,
error terakhir, dan ukuran cache dari fixture.

1. Buka tautan Template sync pada halaman Templates.
2. Tentukan perangkat dari baris tabel.
3. Klik aksi sync atau Prepare rollback.
4. Periksa perangkat/template/versi pada konfirmasi, isi alasan dan centang
   simulasi autentikasi ulang.
5. Konfirmasi, lalu lihat command `PENDING` dan audit.

Target contoh saat ini adalah `sunset-strip`, sync ke v12 atau rollback ke v11.
Belum tersedia pemilih versi bebas. Tabel sinkronisasi tetap berupa fixture;
command tidak mengunduh aset atau memperbarui versi aktif.

## 9. Voucher pool

### 9.1 Halaman modul dan Create allocation

**URL:** `/vouchers`.

Berisi daftar alokasi/request, pencarian, dan kartu allocation, ledger, readiness.

Urutan meminta alokasi:

1. Klik `Create allocation / Buat alokasi`.
2. Isi nama, acara, satu perangkat, pool ID, jumlah voucher, dan versi alokasi.
3. Gunakan versi lebih tinggi daripada seluruh alokasi/request perangkat tersebut.
4. Isi window dan timezone.
5. Tinjau authority `DEVICE_BOUND`, batas offline, sesi per redemption,
   entitlement cetak, reserve TTL, dan consume milestone.
6. Isi alasan/cakupan. Pilih pilot untuk memperjelas target satu perangkat;
   pilihan rollout tidak mengubah request menjadi inventori bersama lintas perangkat.
7. Simpan, lalu periksa request pada daftar.

Batas sesi offline tidak boleh melebihi jumlah voucher yang diminta.
Hasilnya `UNSIGNED_REQUEST`; saldo tersedia tidak bertambah.

### 9.2 Exclusive allocation

**URL:** `/vouchers/allocations`.

Masuk melalui `Open allocation / Buka alokasi` atau Open pada record.
Form berisi field request yang sama dan ringkasan inventori hanya-baca:
available, reserved, consumed, reconciled, dan quarantined.

1. Pilih alokasi yang hendak ditinjau.
2. Periksa event, perangkat eksklusif, window, dan angka inventori.
3. Untuk request versi baru, gunakan versi yang meningkat.
4. Ubah parameter yang diperlukan, lalu simpan dan validasi.
5. Publikasikan simulasi dan periksa request baru/audit.

Counter bertanda tangan tidak dapat diedit dan tidak disalin sebagai saldo baru.
Menekan Publish tidak mint voucher, membuat signature, atau merekonsiliasi konsumsi.

### 9.3 Append-only ledger

**URL:** `/vouchers/ledger`.

Masuk melalui `Inspect ledger / Periksa ledger`. Tabel menampilkan voucher
tersamarkan, sesi, perangkat, state, sequence, backend checkpoint, dan event.

1. Cari ID atau nilai yang relevan.
2. Filter perangkat dan state.
3. Baca hubungan sesi/voucher serta urutan sequence/checkpoint.
4. Bila ada masalah, lanjutkan penelusuran ke Queue center dan audit.

Tidak ada edit, hapus, atau tombol Mark reconciled. Rekonsiliasi memerlukan
acknowledgement backend yang durable dan berurutan; ledger tidak berubah karena
request baru atau retry lokal.

### 9.4 Offline admission / readiness

**URL:** `/vouchers/readiness`.

Masuk melalui `View readiness / Lihat kesiapan`.

1. Pilih perangkat dan skenario.
2. Tunggu pemeriksaan kamera, printer, storage, waktu, template, config,
   inventori, dan event.
3. Baca hasil akhir; gunakan Ulangi pengecekan untuk menjalankan ulang.

Event readiness memakai assignment perangkat, status event `PUBLISHED`, window
sesuai timezone, serta eligible devices. Inventori memerlukan alokasi
`SIGNED_FIXTURE` yang cocok dengan acara/perangkat, masih berlaku, dan bersaldo.
Request baru tidak memenuhi syarat ini.

Pemeriksaan config offline menilai adanya revisi aktif dan trust; berbeda dengan
preflight umum yang membandingkan active dan desired. Koneksi offline sendiri
bukan izin untuk PAYG QRIS. Hasil tetap simulasi, bukan sertifikasi operasi offline.

## 10. Queue center

### 10.1 Halaman modul dan Retry safe jobs

**URL:** `/queue`.

Berisi kartu Inspect queue, Review item, Edit policy, dan tombol
`Retry safe jobs / Ulangi job aman`.

Urutan retry aman:

1. Sebaiknya buka Inspect queue dahulu untuk membaca error dan kondisi perangkat.
2. Klik Retry safe jobs di halaman modul atau tombol retry di daftar antrean.
3. Periksa pilihan awal; semua job eligible sudah dicentang.
4. Hilangkan pilihan job yang tidak ingin diulang. Job tidak eligible dinonaktifkan.
5. Isi alasan retry.
6. Konfirmasi retry, lalu lihat status job pada daftar dan catatan audit.

Syarat eligible pada implementasi ini:

- Job bertanda retryable, tidak memiliki lease aktif, dan belum mencapai batas attempts.
- Status `FAILED_RETRYABLE` atau `PENDING_OFFLINE`.
- Perangkat terkait sudah `TRUSTED` dan berstatus `ONLINE` atau `DEGRADED`.
- Job dead-letter dan job milik perangkat yang masih offline tidak dapat dipilih.

Hasil retry mengubah job menjadi `QUEUED` dan mengosongkan error menjadi `NONE`.
ID job, kunci idempotensi, dan jumlah attempts dipertahankan. Tidak ada worker
yang otomatis mengeksekusi atau menaikkan attempts di demo ini.

### 10.2 Durable queue

**URL:** `/queue/jobs`.

Masuk melalui `Inspect queue / Periksa antrean`. Tabel diurutkan berdasarkan
angka prioritas menaik dan menampilkan ID, jenis, perangkat, status, attempts,
batas attempts, serta prioritas.

1. Cari berdasarkan ID, jenis, perangkat, atau status melalui kolom pencarian.
2. Klik Open pada baris.
3. Baca panel detail di bawah tabel: idempotency key, error, dan status.
4. Jika memenuhi syarat, buka modal retry dan ikuti urutan sebelumnya.

Panel awal menampilkan job pertama yang cocok; klik baris yang benar sebelum
membaca detail. Tidak ada pengeditan payload atau penggantian idempotency key.

### 10.3 Dead-letter review

**URL:** `/queue/review`.

Masuk melalui `Review item / Tinjau item`. Halaman hanya menampilkan job
`DEAD_LETTER`.

1. Cari dan buka item bermasalah.
2. Baca error, status, dan idempotency key.
3. Isi catatan investigasi/eskalasi tanpa memasukkan data sensitif.
4. Klik Simpan draf untuk mencatat catatan tersebut ke audit lokal.
5. Buka audit untuk melihat catatan dengan scope ID job.

Tidak tersedia blind retry atau pengubahan status dead-letter. Menyimpan catatan
bukan pengiriman tiket/pesan kepada tim lain dan tidak menyelesaikan konflik.

### 10.4 Retry policy

**URL:** `/queue/policy`.

Masuk melalui `Edit policy / Edit kebijakan`. Field mencakup nama kebijakan,
max attempts, base/max delay, full jitter, lease timeout, perilaku setelah batas
retry, wait-for-connection, perangkat target, alasan, dan rollout.

1. Tentukan batas percobaan dan jeda; max delay tidak boleh lebih kecil dari base delay.
2. Tinjau full jitter, lease timeout, `DEAD_LETTER`, dan `WAIT_FOR_CONNECTION`.
3. Simpan, validasi, dan publikasikan simulasi.
4. Periksa revisi tujuan dan audit.

Perubahan kebijakan tidak otomatis menghitung ulang properti job fixture yang
sudah ada atau menjalankan scheduler retry sungguhan.

## 11. Halaman data operasional

Kelima katalog berikut memakai pola interaksi yang sama:

1. Buka modul dari sidebar.
2. Cari record dan/atau gunakan filter status.
3. Klik Open pada baris untuk menampilkan detail di panel bawah pada halaman yang sama.
4. Catat ID sesi/perangkat/korelasi untuk mencari data terkait di modul lain.

Panel detail bukan route detail baru. Tautan lintas record tidak otomatis tersedia;
gunakan pencarian pada modul tujuan. Data katalog hanya-baca dan tidak dihasilkan
otomatis oleh aktivitas edit/publish yang Anda lakukan.

### 11.1 Sessions

**URL:** `/sessions`.

Menampilkan ID sesi, perangkat, state, snapshot config/template, mode aktivasi,
dan correlation ID. Gunakan halaman ini sebagai titik awal investigasi sesi.

Contoh state mencakup `MEDIA_UPLOAD_PENDING`, `RECONCILIATION_PENDING`, dan
`COMPLETED`. Snapshot menjelaskan konfigurasi/template yang dipakai sesi tersebut,
bukan otomatis revisi terbaru dashboard. Tidak ada start/cancel sesi dari halaman ini.

### 11.2 Payments

**URL:** `/payments`.

Menampilkan ID pembayaran, hubungan sesi, status, nilai/mata uang, bukti verifikasi
contoh, dan idempotency key.

Cari pembayaran dari ID sesi, kemudian periksa state dan verification. `PAID`
berasal dari fixture backend terverifikasi, bukan persetujuan operator lewat UI.
Pembayaran expired tanpa entitlement tidak boleh dianggap berhasil. Tidak ada
pembuatan QR nyata, force paid, charge, atau refund di halaman ini.

### 11.3 Media catalog

**URL:** `/media`.

Menampilkan ID media, sesi, upload state, variant, checksum contoh, privacy storage,
dan perlindungan cleanup.

Periksa perbedaan `UPLOAD_PENDING` dan `UPLOAD_VERIFIED`, lalu baca apakah media
masih protected atau menunggu retensi. Variant contoh meliputi original still,
framed digital, dan pasangan MP4/manifest. Tidak ada upload, download aset asli,
preview file privat, atau tombol hapus media.

### 11.4 Print jobs

**URL:** `/print`.

Menampilkan ID job, sesi, status, transport, CUPS reference, entitlement, dan
indikasi dukungan konfirmasi.

Cari sesi, buka job, lalu bedakan `SENT` dari `CONFIRMED_IF_SUPPORTED`.
`SENT` tidak membuktikan cetakan fisik selesai. Halaman ini tidak menyediakan
reprint manual atau tombol test print.

### 11.5 Delivery

**URL:** `/delivery`.

Menampilkan ID pengiriman, sesi, status, claim reference tersamarkan, kontak
contoh yang disamarkan, dan prasyarat delivery.

Periksa apakah masih `PENDING_MEDIA` atau sudah `DELIVERED`. Pengiriman menunggu
rekonsiliasi dan upload terverifikasi; jangan menganggap penyimpanan policy sebagai
pengiriman pesan. Aksi edit di header membuka Delivery policy, bukan editor record.
Tidak ada kirim ulang WhatsApp atau pembukaan signed URL nyata.

### 11.6 Delivery policy

**URL:** `/delivery/policy`.

Form mencakup kanal WhatsApp/claim-only, referensi provider, ID template pesan,
TTL klaim, TTL signed link, fallback claim page, locale, bucket privat, prefix,
region, enkripsi, serta cakupan perubahan.

1. Buka Delivery lalu klik edit.
2. Tentukan kanal dan referensi konfigurasi pesan.
3. Isi TTL dan bahasa tamu yang sesuai.
4. Isi referensi private storage tanpa secret; pertahankan akses privat.
5. Tentukan perangkat/alasan/rollout, lalu simpan, validasi, dan publikasikan simulasi.

Tidak ada integrasi provider, pembuatan bucket, enkripsi data, atau pengiriman pesan nyata.

## 12. Config history

### 12.1 Halaman modul dan Compare revisions

**URL:** `/history`.

Berisi kartu View diff, Prepare rollback, Open audit, serta tombol
`Compare revisions / Bandingkan revisi`.

Urutan perbandingan melalui modal:

1. Klik Compare revisions.
2. Pilih revisi Before dan After yang berbeda.
3. Tentukan scope satu perangkat atau semua perangkat.
4. Klik preview untuk membuka halaman diff.

URL hasil membawa `before`, `after`, dan `device`, misalnya
`/history/diff?before=141&after=142&device=LIL-BOOTH-014`.
Perbandingan hanya membaca data; tidak memublikasikan atau mengubah revisi.

### 12.2 Revision comparison

**URL:** `/history/diff`.

Masuk melalui `View diff / Lihat perbedaan` atau modal compare.
Halaman berisi pemilih dua revisi, tabel field sebelum/sesudah, dan acknowledgement
per perangkat.

1. Pilih dua revisi. Untuk perbandingan yang bermakna, pilih schema/domain yang sama.
2. Baca field yang berubah; tidak ada baris berarti nilainya sama.
3. Pilih scope perangkat untuk meninjau tabel active/desired/ack.
4. Bila perlu pemulihan, buka Prepare rollback dari modul Config history.

Scope perangkat memfilter tabel acknowledgement, bukan menghitung ulang diff
effective config khusus perangkat. Pemilih revisi tetap membandingkan snapshot
nilai kedua revisi yang dipilih. Tidak ada tombol untuk memaksa ACK.

### 12.3 Runtime configuration

**URL:** `/history/configuration`.

Masuk melalui aksi edit pada Overview atau buka URL langsung. Halaman ini
menyediakan simulasi prioritas konfigurasi dalam lima objek JSON:

1. Platform defaults sebagai dasar.
2. Device profile overrides menimpa platform.
3. Event overrides menimpa hasil sebelumnya.
4. Campaign overrides menimpa hasil sebelumnya.
5. On-site overrides menimpa hasil sebelumnya selama belum kedaluwarsa.

Field runtime yang didukung preview: `sessionDuration`, `retakes`, `activation`,
`autoPrint`, dan `allowOffline`. `null` berarti mewarisi nilai sebelumnya;
`false` dan `0` tetap override eksplisit jika valid untuk field tersebut.

Urutan penggunaan:

1. Isi JSON platform dan layer yang dibutuhkan; gunakan `{}` untuk layer kosong.
2. Jika on-site override tidak kosong, isi waktu kedaluwarsa di masa depan.
3. Periksa hasil effective config dan diff pada panel kanan/bawah.
4. Isi perangkat target, alasan, dan rollout.
5. Simpan, validasi, publikasikan simulasi, lalu tinjau revisi dan audit.

Preview mengeluarkan layer on-site setelah waktunya habis. Ini simulator lima
field bersama, bukan penggabungan otomatis semua field dari editor event,
camera, printer, dan modul lainnya. Kedaluwarsa pada input ini mengikuti
datetime lokal browser, bukan pemilih timezone acara terpisah.

### 12.4 Prepare rollback

**URL:** `/history/rollback`.

Masuk melalui `Prepare rollback / Siapkan rollback`.

1. Pilih **Before sebagai revisi tujuan pemulihan**.
2. Pilih After sebagai pembanding. Kedua revisi harus berbeda dan memiliki schema sama.
3. Pilih perangkat target atau semua perangkat.
4. Baca diff dan acknowledgement. Pastikan scope tidak terlalu luas.
5. Klik tombol rollback yang menampilkan panah menuju nomor Before.
6. Isi alasan, centang simulasi autentikasi ulang, lalu konfirmasi.
7. Periksa revisi baru, desired revision perangkat target, dan audit.

Rollback membuat nomor revisi baru dengan salinan nilai dari Before. Nomor versi
tidak dimundurkan dan revisi lama tidak ditimpa. Active revision serta snapshot
sesi aktif tetap sama sampai ada penerapan/acknowledgement edge yang nyata.

### 12.5 Change evidence / Audit

**URL:** `/history/audit`.

Masuk melalui `Open audit / Buka audit`, Overview, atau lonceng notifikasi.
Tabel menampilkan ID audit, actor, aksi, scope, alasan, dan waktu.

1. Lakukan aksi lokal, misalnya simpan draf, buat request, atau beri catatan job.
2. Buka audit dan cari scope/ID/aksi/alasan yang relevan.
3. Baca entri terbaru untuk memverifikasi hasil aksi.
4. Jika diperlukan, klik export untuk mengunduh hasil filter sebagai
   `photobooth-masked-audit.json`.

Tidak ada edit/hapus audit melalui UI. Namun, LocalStorage dapat diedit pengguna;
append-only di antarmuka bukan jaminan integritas audit server.
Ekspor adalah ide tambahan. Nama file menyebut masked, tetapi alasan/catatan
bebas diekspor apa adanya; jangan memasukkan informasi sensitif sejak awal.

## 13. Settings

### 13.1 Halaman modul dan Invite operator

**URL:** `/settings`.

Berisi kartu Manage roles, Review trust, Edit retention, daftar operator, dan
tombol `Invite operator / Undang operator`.

Urutan undangan simulasi:

1. Klik Invite operator dari Settings atau halaman Roles.
2. Isi nama tampilan dan email contoh.
3. Pilih `ADMINISTRATOR`, `OPERATOR`, `SUPPORT`, atau `ENGINEER`.
4. Pilih acara, perangkat yang diizinkan, TTL undangan, kebutuhan persetujuan,
   dan alasan.
5. Centang simulasi autentikasi ulang administrator.
6. Simpan, lalu periksa daftar anggota dan audit.

Email disamarkan sebelum record disimpan. Hasil saat ini berstatus `DRAFT`, bukan
bukti email terkirim atau akun aktif. Alur undangan, TTL, dan matriks peran rinci
ditandai sebagai ide tambahan, meskipun kebutuhan RBAC sendiri berasal dari PRD.

### 13.2 Scoped roles

**URL:** `/settings/roles`.

Masuk melalui `Manage roles / Kelola peran` atau Open pada daftar operator.
Halaman menampilkan matriks izin contoh dan daftar anggota beserta role, email
tersamarkan, perangkat yang diizinkan, dan status.

1. Tinjau matriks untuk memahami contoh pembagian akses.
2. Cocokkan role dan scope pada daftar anggota.
3. Gunakan Invite operator untuk menambahkan penugasan contoh baru.

Matriks saat ini mengizinkan semua role untuk melihat, retry, dan diagnostics;
pause untuk administrator/operator; publish dan rollback untuk administrator/
engineer; revoke dan invite untuk administrator.
Matriks bersifat hanya-baca, bukan permission editor. Open dari daftar operator
membuka halaman Roles bersama, bukan editor detail operator tertentu.
Tidak ada login, pergantian akun, atau enforcement izin server.

### 13.3 Device trust

**URL:** `/settings/trust`.

Masuk melalui `Review trust / Tinjau trust`. Daftar memperlihatkan perangkat,
trust status, fingerprint tersamarkan, serta panel sertifikat perangkat terpilih.

1. Klik Open pada perangkat yang hendak ditinjau.
2. Periksa fingerprint, certificate ID, dan masa berlaku contoh.
3. Pilih rotate atau revoke.
4. Isi alasan dan centang simulasi autentikasi ulang, lalu konfirmasi.
5. Periksa daftar command trust dan audit.

Hasil berupa command `PENDING`, termasuk untuk perangkat offline. Tidak ada
sertifikat nyata yang dirotasi/dicabut dan trust tidak langsung berubah.

### 13.4 Retention safety

**URL:** `/settings/retention`.

Masuk melalui `Edit retention / Edit retensi`. Mengatur retensi media, aset
terkirim, audit, deletion grace, warning disk, masking PII, syarat cleanup,
proteksi data unacknowledged, dan cakupan perubahan.

1. Tinjau jendela retensi sesuai contoh kebijakan yang ingin diuji.
2. Pertahankan masking PII dan proteksi data belum diakui.
3. Pastikan aturan cleanup tetap mensyaratkan upload terverifikasi serta retensi habis.
4. Isi perangkat/alasan/rollout, lalu simpan, validasi, dan publikasikan simulasi.

Berbeda dari kebijakan storage per perangkat yang berfokus pada kapasitas disk,
halaman ini merangkum retensi beberapa jenis data. Keduanya tetap draf konfigurasi;
tidak menjalankan cleanup atau menghapus audit/media dalam browser maupun edge.

## 14. Insights

**URL:** `/insights`.

Menampilkan rasio sesi completed, pembayaran paid, media upload verified,
delivery delivered, serta perbandingan active/desired perangkat.

1. Baca jumlah berhasil dibanding total fixture pada setiap kartu.
2. Klik Open untuk membuka katalog yang mendasari metrik.
3. Tinjau perangkat dengan active berbeda dari desired.
4. Lanjutkan ke Devices, Queue center, atau Config history untuk investigasi.

Halaman belum memiliki date-range analytics atau telemetri langsung.
Latensi capture/render, clock drift, CPU/memori, dan restart belum terintegrasi.
Progress acknowledgement bukan persentase download; nilainya menggambarkan
apakah active dan desired sudah sama pada data lokal.

## 15. Halaman loading, error, dan tidak ditemukan

- **Loading:** tampil saat perpindahan route atau pemuatan state awal. Tunggu sampai
  isi tampil; loading ini berbeda dari simulasi pemeriksaan preflight/bundle.
- **Error halaman:** menyediakan aksi mencoba kembali dan tautan ke Overview.
  Mencoba kembali bukan penghapusan state aplikasi.
- **URL tidak ditemukan:** halaman fallback menyediakan tautan ke Overview.
- **ID perangkat tidak dikenal:** detail menampilkan informasi tidak ditemukan
  dan tautan kembali ke registry atau daftar policy yang sesuai.

Jangan menganggap semua path `/devices/<teks>` sebagai perangkat valid.
Gunakan ID yang benar-benar ada di registry browser tersebut.

## 16. Skenario penggunaan terpandu

### 16.1 Demo perubahan acara pada perangkat contoh

1. Buka Devices → Open registry → `LIL-BOOTH-014`.
2. Catat active dan desired revision saat ini.
3. Buka Events → Edit event dan pilih acara contoh yang mencakup perangkat itu.
4. Ubah satu nilai yang valid, misalnya countdown, lalu isi alasan.
5. Pilih pilot dan pastikan target `LIL-BOOTH-014` termasuk eligible devices.
6. Simpan draf, validasi draf, lalu publikasikan simulasi dan konfirmasi.
7. Buka Config history → Compare revisions, pilih dua revisi dengan schema
   yang sama bila tersedia, kemudian baca diff.
8. Kembali ke detail perangkat: desired bertambah, active tetap.
9. Jalankan preflight: config dapat FAILED karena acknowledgement belum tersedia.
10. Buka audit untuk melihat bukti perubahan lokal.

Hasil yang diharapkan bukan semua indikator langsung hijau, melainkan draf,
revisi tujuan, dan audit yang konsisten tanpa memalsukan ACK perangkat.

### 16.2 Demo template dan bundle

1. Buka Templates → Add template.
2. Isi ID unik, versi awal, nama, geometri/layer valid, dan alasan.
3. Simpan lalu buka record baru.
4. Simpan/validasi perubahan editor.
5. Buka Validate bundle, pilih template baru, perangkat, dan skenario fixture.
6. Tinjau hasil, lalu coba Failure fixture untuk melihat hasil gagal dan rerun.
7. Kembali ke editor, pastikan draf valid, lalu publikasikan simulasi.
8. Periksa request UNSIGNED_REQUEST pada daftar template.

Jangan menganggap Template sync langsung menampilkan template baru; tabelnya
masih berisi distribusi `sunset-strip` contoh.

### 16.3 Demo permintaan voucher offline

1. Buka Voucher pool → Open allocation dan periksa versi alokasi perangkat contoh.
2. Kembali lalu Create allocation dengan versi lebih tinggi dan window valid.
3. Pilih satu perangkat/acara, isi jumlah, batas offline, dan alasan.
4. Simpan dan periksa request UNSIGNED_REQUEST.
5. Buka ledger untuk meninjau inventori/riwayat contoh yang sudah ada.
6. Buka readiness dan pilih perangkat yang sama.

Saldo dan ledger tidak bertambah karena request baru. Readiness menilai alokasi
SIGNED_FIXTURE yang sudah tersedia, bukan otomatis request tersebut.

### 16.4 Demo penanganan antrean bermasalah

1. Buka Queue center → Inspect queue.
2. Cari perangkat/job yang bermasalah dan baca detail error.
3. Buka Retry safe jobs, batasi pilihan ke job eligible yang ingin diuji, dan isi alasan.
4. Konfirmasi; verifikasi status QUEUED dan attempts tetap.
5. Untuk DEAD_LETTER, buka Review item, pilih job, lalu simpan catatan eskalasi.
6. Periksa audit untuk aksi retry dan catatan.

Tidak ada pengiriman tiket atau pekerjaan backend yang berjalan setelah simulasi ini.

### 16.5 Demo rollback terbatas

1. Buka Config history → Prepare rollback.
2. Pilih Before sebagai target pemulihan dan After sebagai pembanding dengan schema sama.
3. Pilih satu perangkat pilot.
4. Tinjau diff, konfirmasi target, isi alasan, dan konfirmasi autentikasi ulang simulasi.
5. Pastikan revisi baru dibuat dan desired perangkat berubah.
6. Periksa active revision tetap serta audit rollback tercatat.

## 17. Arti status dan penanganan kendala

### 17.1 Status utama

- `DRAFT`: record/draf lokal belum dipublikasikan; bukan konfigurasi aktif.
- `VALIDATED`: nilai draf saat itu lulus validasi lokal.
- `PUBLISHED` pada draf: simulasi publikasi sudah dilakukan; tidak membuktikan edge aktif.
- `UNSIGNED_REQUEST`: permintaan template/alokasi menunggu penandatanganan backend.
- `SIGNED_FIXTURE`: inventori bertanda tangan versi contoh, bukan signature produksi.
- `PENDING_ENROLLMENT`: perangkat belum menyelesaikan enrollment/trust.
- `PENDING`: permintaan atau pemeriksaan menunggu; baca konteks kartu/tabel.
- `RUNNING`: simulasi pemeriksaan sedang berjalan.
- `PASS` / `FAILED`: hasil pemeriksaan, bukan status pembayaran atau job worker.
- `QUEUED`: job telah dijadwalkan ulang secara lokal, belum berhasil dieksekusi.
- `DEAD_LETTER`: job memerlukan investigasi, bukan kandidat retry aman.
- `ACK` / `ACKNOWLEDGED`: indikator kesamaan active/desired pada fixture/state,
  bukan tanda tangan acknowledgement yang diverifikasi browser.

### 17.2 Kendala yang umum

**Tombol publikasi tidak aktif:** lengkapi field/alasan/scope, jalankan Validasi
draf, dan jangan mengubah nilainya lagi sebelum publikasi. Setelah perubahan,
validasi ulang. Template/alokasi juga membutuhkan versi yang memenuhi aturan.

**Form tidak bisa disimpan:** baca pesan di bawah field. Periksa required field,
rentang angka, urutan tanggal, timezone, JSON, ID duplikat, versi meningkat,
dan keanggotaan perangkat dalam eligible devices.

**Pengecekan belum PASS/FAILED:** tunggu urutan loading selesai. RUNNING/PENDING
sementara adalah bagian simulasi, bukan kegagalan tampilan.

**Fixture sehat masih gagal:** periksa status perangkat, storage, active/desired,
window acara, trust, dan inventori bertanda tangan. Skenario sehat tidak
menghapus masalah yang sudah ada pada data perangkat.

**Tanggal contoh kedaluwarsa:** readiness memakai waktu saat pemeriksaan dan
timezone acara/alokasi. Nilai seed bukan data operasional yang diperbarui harian;
setelah window contoh habis, hasil dapat gagal. Editor tidak memalsukan status
aktif/signature untuk mengatasi hal ini.

**Job tidak dapat dicentang:** periksa koneksi/trust perangkat, lease, status,
retryable flag, dan batas attempts. Gunakan Review item untuk dead-letter.

**Revisi active tidak berubah setelah publish/sync:** ini batas yang disengaja;
dashboard belum menerima acknowledgement dari edge.

**Data tidak berubah pada katalog/Insights:** katalog sesi/pembayaran/media/cetak/
delivery merupakan fixture hanya-baca, bukan hasil eksekusi proses yang Anda buat.

**Data hilang setelah pindah browser/port:** penyimpanan lokal terpisah per origin.
Pastikan alamat/profile sama dan LocalStorage diizinkan. Peringatan penyimpanan
berarti persistensi tidak dapat dijamin; tidak ada cloud backup.

## 18. Batas implementasi dan ide tambahan

Bagian yang ditandai sebagai ide tambahan di UI mencakup pemilih skenario
sehat/gagal, matriks role yang persis ini, alur/TTL undangan operator, dan ekspor
audit. Dasar fitur seperti RBAC, audit, dan preflight tetap merujuk kebutuhan PRD;
label tambahan berlaku pada rincian UX yang tidak dirinci di PRD.

Batas penting lainnya:

- Backend produk, database operasional, endpoint pembayaran, email, WhatsApp,
  kamera/printer nyata, upload aset, dan remote command belum terhubung. Endpoint
  Arna SSO/Site API hanya dipakai untuk autentikasi dan onboarding akun/workspace.
- Data contoh, nilai TTL/harga/kuota, dan ambang hardware bukan default produksi.
- Validator lokal bukan schema kanonis/backend authorization dan tidak menjamin
  referensi aset/provider/template benar-benar tersedia di sistem lain.
- Pembuatan/publikasi record tidak otomatis menyambungkan seluruh siklus bisnis;
  katalog entity, draft, revision, command, dan fixture memiliki fungsi terpisah.
- Editor tanpa katalog record tersendiri memakai baseline/default dan draf lokal;
  bukan registry lengkap semua policy aktif per perangkat/acara.
- Belum ada CRUD lengkap untuk campaign, pengeditan izin, penyelesaian enrollment,
  acknowledgement manual, rekonsiliasi manual, atau eksekusi cleanup.
- Semua actor audit memakai identitas operator contoh; role matrix bukan kontrol
  akses yang benar-benar ditegakkan.
- Tidak ada jaminan integritas data lokal, autentikasi ulang nyata, signature,
  durable transaction, atau perlindungan credential yang siap produksi.

Panduan ini mendeskripsikan fungsi yang tersedia, bukan menyatakan seluruh fitur
PRD sudah terimplementasi end-to-end. Lihat dokumen audit PRD untuk rujukan per
domain, perbedaan dengan Electron, dan kebutuhan integrasi backend.

## 19. Referensi pemeliharaan dokumentasi

Panduan disusun dari route `app/(console)`, komponen halaman/form, schema dan
label `app/content.json`, serta aturan lokal pada `lib/domain.ts`,
`lib/mutations.ts`, `lib/readiness.ts`, dan `lib/reference-validation.ts`.
Ini peninjauan implementasi, bukan pengujian ulang semua aksi di browser.

Dokumen terkait di repository:

- `README.md`: instalasi, struktur folder, pemeriksaan, dan batas deployment.
- `docs/prd-alignment.md`: pemetaan halaman terhadap PRD dan ide tambahan.
- `docs/verification.md`: catatan verifikasi implementasi sebelumnya.

Saat route, field, status, atau efek aksi berubah, perbarui bagian halaman terkait,
skenario terpandu, dan batas simulasi dalam panduan ini. Jangan mengganti istilah
request/pending menjadi sukses sebelum integrasi benar-benar memberikan bukti hasil.
