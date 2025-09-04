
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="Sistem Absensi dengan Pengenalan Wajah dan GPS - RST Dokter Soepraoen">
    <meta name="keywords" content="absensi, kehadiran, pengenalan wajah, GPS, rumah sakit">
    @ViteReactRefresh
    <title>Sistem Absensi - RST Dokter Soepraoen</title>
    @vite(['resources/js/app.jsx', 'resources/css/app.css'])
</head>
<body>
    <div id="app"></div>
</body>
</html>