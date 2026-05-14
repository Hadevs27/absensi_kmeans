Berikut versi **lengkap dan rapi** PRD untuk **Sistem Informasi Absensi Berbasis Web dengan Integrasi Algoritma K‑Means**, siap kamu pakai sebagai dokumen laporan/proyek.

***

## 1. Ringkasan Eksekutif (Executive Summary)

Sistem Informasi Absensi Berbasis Web adalah aplikasi yang dirancang untuk mengelola kehadiran pegawai/guru/mahasiswa secara digital melalui antarmuka web. Sistem ini tidak hanya menyimpan data absensi secara terstruktur, tetapi juga menganalisis pola kehadiran dengan menggunakan algoritma **K‑Means Clustering** untuk mengelompokkan pengguna ke dalam beberapa kelompok berdasarkan kecenderungan absensi (misalnya: rajin, sering terlambat, bolos, dsb). [ejournal.itn.ac](https://ejournal.itn.ac.id/index.php/jati/article/download/9621/5487)

Keluaran sistem meliputi:
- Data absensi harian/bulanan yang terpusat dan mudah dilacak.  
- Label kategori absensi hasil proses K‑Means (clustering) untuk pengguna.  
- Dashboard & laporan yang dapat digunakan untuk pengambilan keputusan institusi atau manajemen SDM. [id.scribd](https://id.scribd.com/document/883001296/Document)

***

## 2. Pernyataan Masalah & Tujuan

### 2.1 Pernyataan Masalah

- Pencatatan absensi masih banyak yang dilakukan secara manual (buku, lembar presensi) sehingga rawan kesalahan, tidak real‑time, dan sulit dianalisis. [repository.dinamika.ac](https://repository.dinamika.ac.id/id/eprint/4551/1/STIKOM%20SURABAYA.pdf)
- Tidak ada sistem analisis pola kehadiran yang terstruktur; keputusan mengenai kedisiplinan pengguna sering bersifat subjektif. [ejournal.unuja.ac](https://ejournal.unuja.ac.id/index.php/jeecom/article/download/9556/pdf)
- Laporan absensi biasanya tersebar dalam file Excel atau kertas, sulit diakses dan diintegrasikan ke satu sumber data. [media.neliti](https://media.neliti.com/media/publications/226208-sistem-informasi-absensi-berbasis-web-un-c54062fa.pdf)

### 2.2 Tujuan

- Membangun sistem informasi absensi berbasis web yang dapat digunakan untuk mencatat kehadiran pegawai/guru/mahasiswa secara real‑time dan terpusat. [ejournal.itn.ac](https://ejournal.itn.ac.id/index.php/jati/article/download/9621/5487)
- Mengintegrasikan algoritma **K‑Means Clustering** untuk mengelompokkan pengguna berdasarkan pola kehadirannya (misalnya jumlah hadir, terlambat, izin, sakit, alfa). [id.scribd](https://id.scribd.com/document/883001296/Document)
- Menyediakan dashboard dan laporan absensi yang informatif untuk admin, manajer, dan institusi terkait.

***

## 3. Kebutuhan Fungsional (Functional Requirements)

### 3.1 Manajemen Akun & Autentikasi

| No | Fitur | Deskripsi |
|----|-------|-----------|
| 1 | Login | Pengguna login dengan username dan password; sistem mengecek role (admin, petugas, pengguna). |
| 2 | Registrasi | Admin dapat menambahkan pengguna baru melalui form (nama, NIP/NIM, role, jadwal, dll). |
| 3 | Reset Password | Sistem menyediakan fitur lupa password untuk mengatur ulang password via email. |
| 4 | Manajemen Hak Akses | Admin dapat mengatur hak akses (apa yang bisa dilihat/ditambah/diubah) berdasarkan role. |

### 3.2 Pencatatan Absensi

| No | Fitur | Deskripsi |
|----|-------|-----------|
| 5 | Absen Masuk/Keluar | Pengguna dapat menekan tombol “Masuk” dan “Keluar” atau mengisi status hadir/keterangan di form. |
| 6 | Pencatatan Otomatis | Sistem mencatat waktu, tanggal, status kehadiran (Hadir, Izin, Sakit, Cuti, Alfa), dan keterangan jika ada. |
| 7 | Mode Absen | Absen harian (harian biasa) atau per sesi (misal per kelas/jam kerja). |
| 8 | Validasi Periode | Sistem hanya menerima absen pada hari aktif dan sesuai jam kerja/kuliah. |

### 3.3 Manajemen Data & Jadwal

| No | Fitur | Deskripsi |
|----|-------|-----------|
| 9 | Kelola Jadwal | Admin dapat mengatur jadwal kerja/kuliah (jam masuk/keluar, hari efektif, libur). |
| 10 | Kelola Hari Libur | Admin dapat menambahkan tanggal libur nasional atau cuti bersama. |
| 11 | Manajemen Pengguna | Admin dapat mengimpor/meng‑*export* data pengguna via CSV/Excel, serta mengedit/hapus data. |

### 3.4 Analisis K‑Means Clustering

| No | Fitur | Deskripsi |
|----|-------|-----------|
| 12 | Agregasi Data | Sistem menghitung untuk setiap pengguna: jumlah hadir, terlambat, izin, sakit, alfa per periode tertentu. |
| 13 | Run K‑Means | Admin dapat menjalankan algoritma K‑Means pada dataset agregat (misalnya untuk 3–5 cluster). |
| 14 | Hasil Cluster | Sistem menampilkan hasil cluster dalam bentuk tabel/id pengguna + label cluster (misal: “Rajin”, “Sering Terlambat”, “Bolos”). |
| 15 | Evaluasi K‑Means | Sistem dapat menampilkan/menyimpan metrik evaluasi (misalnya Silhouette Score, atau jumlah anggota per cluster).  [ejournal.unuja.ac](https://ejournal.unuja.ac.id/index.php/jeecom/article/download/9556/pdf) |
| 16 | Ekspor Hasil | Admin dapat mengunduh hasil clustering ke format CSV/Excel/PDF. |

### 3.5 Dashboard & Laporan

| No | Fitur | Deskripsi |
|----|-------|-----------|
| 17 | Dashboard | Tampilan ringkasan: jumlah kehadiran per hari/bulan, grafik, dan tabel statistik. |
| 18 | Rekap Absensi | Admin/petugas dapat melihat rekap absensi per pengguna, per hari/bulan. |
| 19 | Laporan Cluster | Admin dapat melihat daftar pengguna berdasarkan cluster; dapat di‑filter berdasarkan periode/jenis. |
| 20 | Ekspor Laporan | Sistem dapat meng‑*export* rekap absensi dan cluster ke Excel/PDF. |

### 3.6 Notifikasi & Reminder

| No | Fitur | Deskripsi |
|----|-------|-----------|
| 21 | Notifikasi Absen | Pengguna dapat menerima pengingat untuk absen lewat email/notifikasi web. |
| 22 | Notifikasi Khusus | Admin dapat mengatur notifikasi otomatis untuk pengguna yang sering alfa (misal 3 hari alfa berturut‑turut). |

***

## 4. Kebutuhan Non‑Fungsional (Non‑Functional Requirements)

### 4.1 Kinerja (Performance)

- Respons time halaman utama dan halaman dashboard ≤ 3 detik pada beban normal. [binar.co](https://www.binar.co.id/blog/cara-menggunakan-product-requirement-document-beserta-template-prd)
- Sistem dapat menangani minimal 100 pengguna aktif secara bersamaan. [binus.ac](https://binus.ac.id/bekasi/2025/07/cara-menentukan-product-requirement-document-prd/)

### 4.2 Ketersediaan (Availability)

- Sistem harapan tersedia minimal **99%** dalam sebulan (downtime terbatas). [binus.ac](https://binus.ac.id/bekasi/2025/07/cara-menentukan-product-requirement-document-prd/)

### 4.3 Kemudahan Penggunaan (Usability)

- Antarmuka konsisten, menggunakan bahasa Indonesia sederhana, dan dapat diakses tanpa pelatihan intensif. [glints](https://glints.com/id/lowongan/product-requirement-document-adalah/)
- Desain responsif (bisa diakses dari desktop dan perangkat mobile).  

### 4.4 Keamanan (Security)

- Password disimpan dengan **enkripsi** (bcrypt atau metode serupa). [binus.ac](https://binus.ac.id/bekasi/2025/07/cara-menentukan-product-requirement-document-prd/)
- Hanya pengguna yang berwenang yang dapat mengakses data absensi dan hasil clustering.  
- Logging aktivitas penting (login, perubahan data penting).  

### 4.5 Skalabilitas & Maintainability

- Arsitektur modular agar mudah ditambahkan fitur baru (misalnya integrasi biometrik, API untuk aplikasi lain). [glints](https://glints.com/id/lowongan/product-requirement-document-adalah/)
- Adanya dokumentasi desain dan kode untuk memudahkan pemeliharaan.  

### 4.6 Kepatuhan Data (Privacy)

- Data personal dan absensi hanya dapat diakses oleh pihak yang berwenang. [binus.ac](https://binus.ac.id/bekasi/2025/07/cara-menentukan-product-requirement-document-prd/)
- Tidak ada penjualan atau pengungkapan data kepada pihak ketiga tanpa izin tertulis.  

***

## 5. Alur Pengguna (User Flow)

### 5.1 Alur Admin

1. Admin membuka halaman login → memasukkan username dan password.  
2. Setelah login, admin masuk ke **Dashboard Utama** yang menampilkan ringkasan: jumlah pengguna, kehadiran hari ini, dan cluster terbaru.  
3. Di menu **Pengguna**, admin dapat:
   - Tambah pengguna baru.  
   - Edit/hapus pengguna.  
   - Impor data pengguna via CSV.  
4. Di menu **Jadwal**, admin:
   - Mengatur jam masuk/keluar standar.  
   - Menambahkan hari libur.  
5. Di menu **Analisis K‑Means**, admin:
   - Memilih periode (misal 1 bulan terakhir).  
   - Menentukan jumlah cluster (K).  
   - Menekan “Jalankan K‑Means”.  
   - Melihat hasil cluster dan statistik.  
6. Di menu **Laporan**, admin:
   - Melihat rekap absensi dan rekap clustering.  
   - Mengunduh laporan sebagai Excel/PDF.  

### 5.2 Alur Pegawai/Guru/Mahasiswa

1. Pengguna membuka halaman login.  
2. Setelah login, pengguna masuk ke **Beranda Absen**:
   - Mencatat absensi (masuk/keluar) dengan satu tombol.  
   - Melihat riwayat absensi sendiri (hadir, izin, alfa, dll).  
3. Pengguna dapat melihat **rekap harian/bulanan** versi ringkas.  

### 5.3 Alur Petugas (Opsional)

1. Login → Dashboard → **Rekap Harian**.  
2. Mengonfirmasi/mengubah status absensi jika diperlukan (misal konfirmasi izin/sakit).  
3. Menjalankan atau memantau notifikasi yang dikirim ke pengguna.  

***

## 6. Batasan (Out‑of‑Scope)

- **Tidak termasuk integrasi perangkat biometrik fisik** (fingerprint, facial recognition hardware); sistem hanya menerima input absensi sebagai data, bukan mengoperasikan perangkat keras. [repository.dinamika.ac](https://repository.dinamika.ac.id/id/eprint/4551/1/STIKOM%20SURABAYA.pdf)
- **Tidak termasuk aplikasi mobile native** (Android/iOS); fokus hanya pada aplikasi web yang responsif.  
- **Tidak termasuk sistem GPS real‑time** untuk pelacakan lokasi pegawai lapangan. Verifikasi hanya berdasarkan data yang dimasukkan (form atau QR sederhana). [media.neliti](https://media.neliti.com/media/publications/226208-sistem-informasi-absensi-berbasis-web-un-c54062fa.pdf)
- **Tidak termasuk integrasi dengan sistem payroll/gaji**; analisis K‑Means hanya untuk kehadiran, bukan komponen penggajian. [ejournal.unuja.ac](https://ejournal.unuja.ac.id/index.php/jeecom/article/download/9556/pdf)
- **Tidak termasuk integrasi dengan aplikasi enterprise besar** (misal SIASN, HRIS khusus) kecuali API sederhana untuk export/import data.  

***

## 7. Metrik Keberhasilan

| Metrik | Standar/Kriteria |
|--------|------------------|
| **Tingkat penggunaan harian** | Minimal 70% pengguna aktif melakukan absensi lewat sistem setiap hari kerja.  [binus.ac](https://binus.ac.id/bekasi/2025/07/cara-menentukan-product-requirement-document-prd/) |
| **Waktu rata‑rata absensi** | Waktu rata‑rata untuk menyelesaikan absensi per pengguna ≤ 15 detik. |
| **Kualitas clustering K‑Means** | Silhouette score ≥ 0,5 untuk hasil clustering; atau label cluster dinilai sesuai ekspektasi pembimbing/institusi.  [ejournal.unuja.ac](https://ejournal.unuja.ac.id/index.php/jeecom/article/download/9556/pdf) |
| **Kecepatan akses dashboard** | 90% request halaman dashboard dan API ≤ 3 detik.  [binus.ac](https://binus.ac.id/bekasi/2025/07/cara-menentukan-product-requirement-document-prd/) |
| **Tingkat kepuasan pengguna** | Survei kepuasan: minimal 80% responden menyatakan “puas” atau “sangat puas”.  [glints](https://glints.com/id/lowongan/product-requirement-document-adalah/) |
| **Jumlah error absensi** | Kesalahan input (double absen, status tidak valid) ≤ 5% dari total absensi per bulan. |

***

Jika kamu ingin, saya bisa bantu:
- mengubah format PRD ini ke **teks Word/PDF‑ready** (dengan heading, numbering, daftar isi, dan sub‑sub yang lebih terstruktur), atau  
- menambahkan **acceptance criteria per fitur** dan **use case** untuk bagian K‑Means dan absensi.
