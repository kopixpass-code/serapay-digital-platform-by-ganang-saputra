# SeraPay Digital Platform v3.0

🌐 **Website:** https://gaslur.com  
📚 **Repository:** https://github.com/<username>/serapay-digital-platform  
👨‍💻 **Developer:** Ganang Saputra

Versi terbaru **SeraPay v3.0** menghadirkan peningkatan signifikan pada performa, keamanan, infrastruktur database, serta penambahan berbagai layanan digital baru yang dirancang untuk meningkatkan skalabilitas dan pengalaman pengguna.

---

<table>
<tr>
<td><img src="https://raw.githubusercontent.com/kopixpass-code/serapay-digital-platform-by-ganang-saputra/main/dokumentasi/1.jpg" width="400"></td>
<td><img src="https://raw.githubusercontent.com/kopixpass-code/serapay-digital-platform-by-ganang-saputra/main/dokumentasi/2.jpg" width="400"></td>
</tr>
</table>

## Pencapaian Utama pada Versi 3.0

### Infrastruktur Database Modern

* Migrasi penuh dari penyimpanan berbasis JSON ke MySQL Database.
* Optimalisasi query untuk meningkatkan kecepatan akses data.
* Struktur relasional yang lebih aman dan mudah dikembangkan.
* Dukungan transaksi database yang lebih stabil untuk volume data yang lebih besar.
* Pengurangan risiko korupsi data yang umum terjadi pada penyimpanan berbasis file.

### Peningkatan Keamanan Sistem

* JWT Authentication untuk manajemen sesi pengguna.
* Password hashing menggunakan bcrypt.
* Validasi data pada seluruh endpoint API.
* Pembatasan akses berdasarkan autentikasi pengguna.
* Proteksi terhadap manipulasi data transaksi.
* Session invalidation setelah perubahan password.
* Rate limiting pada endpoint autentikasi.
* Audit log aktivitas login pengguna.
* Verifikasi email sebelum aktivasi akun.
* Perbaikan berbagai celah keamanan pada sistem versi sebelumnya.

### Update Sistem Login dan Verifikasi OTP Email

Versi terbaru menghadirkan sistem autentikasi generasi baru untuk meningkatkan keamanan akun pengguna.

#### Fitur Baru

* Update halaman Login dengan sistem keamanan terbaru.
* Update halaman Registrasi pengguna.
* Update halaman Lupa Password.
* Verifikasi menggunakan OTP Email.
* Pengiriman OTP otomatis menggunakan Nodemailer.
* OTP memiliki masa berlaku terbatas untuk meningkatkan keamanan.
* Pembatasan jumlah percobaan verifikasi OTP.
* Regenerasi OTP secara otomatis apabila kode kedaluwarsa.
* Aktivasi akun menggunakan verifikasi email.
* Enkripsi token verifikasi pada sisi server.

### Performa dan Stabilitas

* Refactoring backend untuk meningkatkan maintainability dan skalabilitas kode.
* Optimasi proses transaksi real-time.
* Migrasi penyimpanan data dari JSON ke MySQL untuk meningkatkan performa dan konsistensi data.
* Pengurangan penggunaan file storage untuk data kritikal.
* Perbaikan bug JavaScript pada sisi frontend dan backend.
* Peningkatan stabilitas layanan saat menangani banyak transaksi secara bersamaan.
* Implementasi sistem monitoring dan kontrol layanan yang lebih terintegrasi.

### Telegram Bot Administration System

SeraPay dilengkapi dengan Telegram Bot khusus administrator yang memungkinkan pengelolaan platform secara jarak jauh tanpa harus membuka dashboard web.

#### Fitur Telegram Bot Admin

* Membalas pesan Live Chat pelanggan langsung dari Telegram.
* Menyetujui atau menolak pengajuan setoran akun.
* Menyetujui atau menolak permintaan withdraw pengguna.
* Deposit saldo pengguna secara manual.
* Monitoring notifikasi transaksi secara real-time.
* Monitoring aktivitas pengguna dan sistem.

#### Command Management

* `/deposit` — Menambahkan saldo pengguna secara manual.
* `/restock` — Menambahkan stok produk secara instan.
* `/stop` — Menonaktifkan sementara layanan setoran akun.
* `/on` — Mengaktifkan kembali layanan setoran akun.
* Command tambahan untuk pengelolaan layanan dan monitoring sistem secara real-time.

Sistem ini membantu administrator melakukan operasional harian dengan lebih cepat, efisien, dan responsif tanpa bergantung pada akses dashboard web.

---

# Fitur Utama

## Manajemen Pengguna

* Registrasi dan Login pengguna
* JWT Authentication
* Enkripsi password menggunakan bcrypt
* Reset dan perubahan password
* Pengelolaan profil pengguna
* Riwayat aktivitas pengguna
* Login menggunakan Email OTP Verification
* Registrasi menggunakan Email OTP Verification
* Lupa Password menggunakan verifikasi OTP Email
* Pengiriman email otomatis menggunakan Nodemailer
* Monitoring aktivitas login pengguna

---

## Marketplace Akun Digital

### Produk yang Tersedia

* Akun Gmail Fresh
* Akun Gmail Used/Bekas
* Akun Facebook Fresh
* Akun Facebook Used/Bekas
* Email Backup
* Email Custom

### Fitur Marketplace

* Sistem stok otomatis
* Monitoring stok real-time
* Pengiriman akun instan setelah pembayaran
* Riwayat pembelian lengkap
* Tracking status transaksi

---

## Sistem Setoran Akun

### Setoran Facebook

Pengguna dapat menjual akun Facebook miliknya langsung melalui platform dengan sistem verifikasi dan pencatatan transaksi otomatis.

### Setoran Gmail

Pengguna dapat melakukan setoran akun Gmail untuk dijual melalui marketplace SeraPay.

### Fitur Setoran

* Pengajuan setoran akun
* Verifikasi data akun
* Monitoring status setoran
* Histori transaksi setoran
* Penarikan saldo hasil penjualan akun

---

## Sistem Saldo dan Withdraw

* Dompet digital internal
* Saldo transaksi pengguna
* Saldo hasil setoran akun
* Riwayat mutasi saldo
* Sistem withdraw otomatis
* Penyimpanan data rekening pengguna
* Pembatasan transaksi harian
* Monitoring histori penarikan dana

---

## Layanan OTP dan Virtual Number

### Virtual Number

* Pembelian nomor virtual otomatis
* Monitoring status nomor
* Verifikasi OTP real-time
* Pengelolaan layanan secara otomatis

### Sewa Nomor

Fitur baru pada versi 3.0:

* Sewa nomor 20 menit
* Sewa nomor 24 jam (1 hari penuh)
* Monitoring OTP secara real-time
* Pengelolaan masa aktif otomatis

---

## Email Rental Service

### Sewa Gmail

Fitur baru yang memungkinkan pengguna menyewa akun Gmail untuk kebutuhan verifikasi dan penerimaan email.

### Sewa Domain Email

Mendukung berbagai domain email tambahan untuk kebutuhan OTP dan verifikasi akun digital.

### Fitur

* Monitoring email masuk real-time
* Sinkronisasi dengan transaksi pengguna
* Riwayat email dan OTP
* Integrasi Gmail API

---

## AI AutoResponder

Fitur unggulan versi 3.0:

* AutoResponder berbasis Artificial Intelligence
* Dukungan multi-bahasa
* Otomatisasi percakapan pelanggan
* Sistem lisensi pengguna
* Pengelolaan masa aktif lisensi
* Respon otomatis untuk customer service
* Integrasi dengan Live Chat Support
* Dukungan context memory dan multi-session chat

### Update AI AutoResponder Terbaru

* Menggunakan Ollama sebagai AI Runtime Engine.
* Menggunakan model **Qwen 2.5 3B** sebagai model utama.
* Mendukung deployment lokal tanpa ketergantungan pada API AI eksternal.
* Biaya operasional AI lebih rendah.
* Waktu respon lebih cepat.
* Mendukung integrasi dengan dashboard admin dan live chat secara real-time.
* Mendukung penggunaan Customer Service AI 24/7.

---

## Sistem Pembayaran

### Payment Gateway

* Integrasi iPaymu Payment Gateway
* QRIS Payment
* Verifikasi pembayaran otomatis
* Update saldo real-time
* Histori transaksi pembayaran

---

## Sistem Refund

* Pengajuan refund oleh pengguna
* Persetujuan refund oleh admin
* Penolakan refund dengan status terintegrasi
* Pengembalian saldo otomatis
* Histori refund lengkap

---

## Dashboard Admin

### Monitoring Sistem

* Manajemen pengguna
* Monitoring transaksi
* Monitoring pembayaran
* Monitoring stok produk
* Pengelolaan layanan digital
* Verifikasi setoran akun
* Persetujuan refund
* Monitoring aktivitas sistem

### Manajemen Data

* Pengelolaan produk digital
* Pengelolaan saldo pengguna
* Pengelolaan lisensi AI
* Pengelolaan virtual number
* Pengelolaan email rental

---

## Komunikasi Real-Time

Menggunakan Socket.IO untuk:

* Notifikasi transaksi langsung
* Update status pesanan real-time
* Monitoring pembayaran secara langsung
* Sinkronisasi data tanpa refresh halaman
* Live update dashboard admin

---

## Live Chat Support

* Chat real-time antara pengguna dan admin
* Riwayat percakapan
* Monitoring aktivitas pelanggan
* Notifikasi pesan masuk
* Integrasi AI AutoResponder berbasis Ollama Qwen 2.5 3B

---

## Sistem Catatan Digital

* Catatan pribadi pengguna
* Penyimpanan data terpusat
* Berbagi catatan melalui tautan publik
* Pengelolaan data transaksi dan aktivitas

---

# Teknologi yang Digunakan

## Backend

* Node.js
* Express.js
* Socket.IO
* MySQL
* JWT Authentication
* bcrypt
* Axios
* Nodemailer
* Ollama API

## Frontend

* HTML5
* CSS3
* JavaScript (ES6+)
* Responsive Mobile Design

## Database

* MySQL Database Server
* Relational Database Design
* Query Optimization

## Integrasi API

* Gmail API
* Google OAuth 2.0
* Telegram Bot API
* iPaymu Payment Gateway
* OTP Provider API
* Virtual Number API
* AI API Integration
* Ollama API

---

# Highlight Kemampuan Teknis

Melalui pengembangan SeraPay v3.0, saya berhasil membangun dan mengelola:

* Full-Stack Web Application Development
* REST API Development
* Authentication & Authorization System
* Email OTP Verification System
* Nodemailer SMTP Integration
* Payment Gateway Integration
* Gmail API Integration
* Real-Time System menggunakan Socket.IO
* Marketplace Management System
* Relational Database Design menggunakan MySQL
* AI AutoResponder Integration
* Ollama Integration
* Qwen 2.5 3B Integration
* Transaction Automation System
* Infrastructure Migration (JSON → MySQL)
* Bug Fixing dan System Optimization
* Security Hardening
* Responsive Web Development

---

# Developer

**Ganang Saputra**

SeraPay Digital Platform dikembangkan sebagai proyek portfolio untuk menunjukkan kemampuan dalam merancang dan membangun aplikasi web skala menengah hingga kompleks yang mencakup pengembangan backend, frontend, database relasional, integrasi API pihak ketiga, sistem real-time, keamanan aplikasi, otomatisasi transaksi digital, serta implementasi fitur berbasis Artificial Intelligence modern menggunakan teknologi Large Language Model (LLM) lokal berbasis Ollama dan Qwen 2.5 3B.
