# Sistem Absensi dengan Pengenalan Wajah dan GPS

Sistem absensi modern yang menggunakan teknologi pengenalan wajah (Face Recognition) dan GPS untuk memastikan kehadiran karyawan di area Rumah Sakit Tentara Dokter Soepraoen.

## 🚀 Fitur Utama

### 👤 Pengenalan Wajah
- Sistem AI yang dapat mengenali wajah karyawan
- Pelatihan model untuk karyawan baru
- Keamanan tinggi dengan verifikasi biometrik

### 📍 Verifikasi Lokasi
- GPS tracking untuk memastikan kehadiran di area rumah sakit
- Geofencing dengan radius 1000 meter
- Validasi alamat otomatis

### 👨‍💼 Panel Admin
- Dashboard dengan statistik kehadiran
- Manajemen data karyawan
- Riwayat kehadiran lengkap
- Pelatihan model AI

### 📱 Antarmuka Responsif
- Desain modern dan mudah digunakan
- Bahasa Indonesia
- Kompatibel dengan semua perangkat

## 🛠️ Teknologi yang Digunakan

### Backend
- **Laravel 11** - Framework PHP modern
- **MySQL** - Database relasional
- **Laravel Sanctum** - Autentikasi API

### Frontend
- **React 18** - Library JavaScript
- **Tailwind CSS** - Framework CSS utility-first
- **Axios** - HTTP client

### AI & Machine Learning
- **Python Flask API** - Backend untuk pengenalan wajah
- **OpenCV** - Computer vision
- **Face Recognition** - Library pengenalan wajah

## 📋 Persyaratan Sistem

- PHP 8.1+
- Node.js 18+
- MySQL 8.0+
- Python 3.8+
- Webcam untuk pengenalan wajah
- GPS untuk verifikasi lokasi

## 🚀 Cara Instalasi

### 1. Clone Repository
```bash
git clone [repository-url]
cd attendance-system
```

### 2. Install Dependencies Backend
```bash
composer install
cp .env.example .env
php artisan key:generate
```

### 3. Setup Database
```bash
php artisan migrate
php artisan db:seed
```

### 4. Install Dependencies Frontend
```bash
npm install
npm run build
```

### 5. Setup Python API
```bash
cd flask-api
pip install -r requirements.txt
python app.py
```

### 6. Jalankan Laravel
```bash
php artisan serve
```

## 📱 Cara Penggunaan

### Untuk Karyawan
1. **Login** dengan email dan password
2. **Izinkan akses kamera** dan lokasi
3. **Posisikan wajah** di depan kamera
4. **Klik "Catat Kehadiran"**
5. **Tunggu konfirmasi** kehadiran berhasil

### Untuk Admin
1. **Login** dengan akun admin
2. **Dashboard** - Lihat statistik kehadiran
3. **Data Kehadiran** - Riwayat kehadiran karyawan
4. **Karyawan** - Kelola data karyawan
5. **Pelatihan** - Latih model AI untuk karyawan baru

## 🔒 Keamanan

- **Autentikasi Multi-Faktor** dengan token
- **Validasi Lokasi** dengan GPS dan geofencing
- **Verifikasi Wajah** untuk mencegah kecurangan
- **Log Aktivitas** lengkap untuk audit

## 📊 Struktur Database

### Tabel Utama
- `users` - Data pengguna sistem
- `employees` - Data karyawan
- `attendances` - Data kehadiran

### Relasi
- User → Employee (One-to-One)
- Employee → Attendance (One-to-Many)

## 🌐 API Endpoints

### Autentikasi
- `POST /api/login` - Login pengguna
- `POST /api/logout` - Logout pengguna

### Kehadiran
- `POST /api/attendance/mark` - Catat kehadiran
- `GET /api/attendance` - Ambil data kehadiran
- `POST /api/attendance/train` - Latih model AI

### Karyawan
- `GET /api/employees` - Ambil data karyawan

## 🎯 Fitur Khusus

### Geofencing
- Radius 1000 meter dari lokasi rumah sakit
- Koordinat: -7.9901595, 112.6205187
- Validasi otomatis lokasi kehadiran

### Pengenalan Wajah
- Model AI yang dapat dilatih
- Akurasi tinggi dengan dataset berkualitas
- Pelatihan berkelanjutan untuk performa optimal

## 📈 Monitoring & Analytics

- **Statistik Kehadiran** real-time
- **Laporan Harian** kehadiran karyawan
- **Analisis Tren** kehadiran
- **Dashboard Interaktif** untuk admin

## 🐛 Troubleshooting

### Masalah Umum
1. **Kamera tidak berfungsi** - Pastikan izin kamera diaktifkan
2. **GPS tidak terdeteksi** - Periksa izin lokasi browser
3. **Login gagal** - Verifikasi kredensial dan koneksi database
4. **Model AI error** - Restart Python Flask API

### Log & Debug
- Log Laravel: `storage/logs/laravel.log`
- Log Python: Console output Flask API
- Browser Console: Error JavaScript

## 🤝 Kontribusi

1. Fork repository
2. Buat branch fitur baru
3. Commit perubahan
4. Push ke branch
5. Buat Pull Request

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

## 📞 Kontak

Untuk pertanyaan atau dukungan teknis:
- Email: [email@example.com]
- Telepon: [nomor-telepon]
- Alamat: Rumah Sakit Tentara Dokter Soepraoen

---

**Dikembangkan dengan ❤️ untuk RST Dokter Soepraoen**
