# Excel Import Template untuk Jadwal Karyawan

## Format File Excel

File Excel yang diimpor harus memiliki format berikut:

### Struktur Kolom:
- **Kolom A**: NIP (Nomor Induk Pegawai)
- **Kolom B**: Nama Karyawan
- **Kolom C-AH**: Hari 1-31 (h1, h2, h3, ..., h31)

### Contoh Format:

| NIP | Nama | h1 | h2 | h3 | h4 | h5 | ... | h31 |
|-----|------|----|----|----|----|----|-----|-----|
| 123456 | John Doe | 110 | 110 | 100 | 110 | 110 | ... | 100 |
| 789012 | Jane Smith | 100 | 100 | 110 | 100 | 100 | ... | 110 |

### Kode Shift yang Dapat Digunakan:
- `110` - Shift Pagi
- `100` - Shift Siang  
- `200` - Shift Malam
- `OFF` - Libur
- Atau kode shift lainnya yang sudah didefinisikan di sistem

### Catatan Penting:
1. **Header wajib ada** - Baris pertama harus berisi header
2. **NIP harus valid** - NIP harus ada di database karyawan
3. **Kolom kosong diperbolehkan** - Hari yang tidak diisi akan disimpan sebagai null
4. **File maksimal 10MB** - Ukuran file tidak boleh lebih dari 10MB
5. **Format file** - Hanya file .xlsx dan .xls yang didukung

### Langkah-langkah Import:
1. Buka halaman "Jadwal" di Admin Panel
2. Pilih tahun dan bulan yang akan diisi
3. Klik "Muat Jadwal" untuk memuat data existing
4. Di bagian "Import dari Excel", pilih file Excel
5. Klik "Import Excel" untuk memproses file
6. Sistem akan menampilkan hasil import (berhasil/gagal)

### Troubleshooting:
- **"Employee not found"**: Pastikan NIP di Excel sesuai dengan database
- **"Invalid file format"**: Pastikan file adalah .xlsx atau .xls
- **"File too large"**: Kompres file atau bagi menjadi beberapa file kecil

### Tips:
- Backup data jadwal sebelum import
- Test dengan file kecil terlebih dahulu
- Pastikan format tanggal konsisten
- Gunakan template yang disediakan untuk hasil terbaik

