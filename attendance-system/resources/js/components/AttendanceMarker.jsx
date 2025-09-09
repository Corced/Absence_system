import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AttendanceMarker = () => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const webcamRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Set Axios default headers with token
        const token = localStorage.getItem('auth_token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            setError('Token autentikasi tidak ditemukan. Silakan masuk kembali.');
            navigate('/login');
        }

        // Get geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (err) => {
                    setError('Gagal mendapatkan lokasi: ' + err.message);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            setError('Geolokasi tidak didukung oleh browser ini.');
        }
    }, [navigate]);

const markAttendance = async () => {
    if (!webcamRef.current || !location) {
        setError('Kamera atau lokasi tidak tersedia.');
        return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
        setError('Gagal mengambil gambar.');
        return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
        const response = await axios.post('http://localhost:8000/api/attendance/mark', {
            image: imageSrc.split(',')[1], // Remove base64 prefix
            latitude: location.latitude,
            longitude: location.longitude,
        });

        setSuccess(response.data.message);
    } catch (err) {
        console.log('Full error response:', err.response);
        const errorMessage = err.response?.data?.error || '';
        if (errorMessage.includes('No face detected')) {
            setError('Wajah tidak terdeteksi. Pastikan wajah Anda terlihat jelas di depan kamera.');
        } else if (errorMessage.includes('No match found')) {
            setError('Wajah tidak cocok. Silakan coba lagi.');
        } else if (errorMessage.includes('Recognition failed')) {
            setError('Gagal mengenali wajah. Pastikan pencahayaan cukup dan wajah terlihat jelas.');
        } else if (errorMessage.includes('Shift tidak ditemukan')) {
            setError('❌ Gagal absen: Shift tidak ditemukan untuk karyawan ini!');
        } else if (errorMessage.includes('Jam shift Anda tidak sesuai')) {
            setError('❌ Gagal absen: Jam shift Anda tidak sesuai dengan waktu saat ini!');
        } else {
            setError(errorMessage || 'Gagal mencatat kehadiran.');
        }
        console.error('Attendance marking failed:', err);
    } finally {
        setLoading(false);
    }
};

const clockOut = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
        const response = await axios.post('http://localhost:8000/api/attendance/clock-out', {});
        setSuccess(response.data.message || 'Berhasil clock out');
    } catch (err) {
        const errorMessage = err.response?.data?.error || '';
        setError(errorMessage || 'Gagal clock out.');
    } finally {
        setLoading(false);
    }
};

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8">
                                <img 
                                    src="/logorstad.png" 
                                    alt="RST Logo" 
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">Sistem Absensi</h1>
                                <p className="text-sm text-gray-600">Rumah Sakit Tentara Dokter Soepraoen</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Keluar
                        </button>

                        <button
                            onClick={clockOut}
                            disabled={loading}
                            className={`w-full mt-3 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                                loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5'
                            }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sedang memproses...
                                </div>
                            ) : 'Clock Out'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Camera Section */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Ambil Foto</h2>
                            <p className="text-gray-600">Posisikan wajah Anda di depan kamera</p>
                        </div>
                        
                        <div className="relative">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full rounded-xl shadow-md"
                            />
                            <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded-xl pointer-events-none"></div>
                        </div>

                        <button
                            onClick={markAttendance}
                            disabled={loading || !location}
                            className={`w-full mt-6 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                                loading || !location
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5'
                            }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sedang memproses...
                                </div>
                            ) : 'Catat Kehadiran'}
                        </button>
                    </div>

                    {/* Status Section */}
                    <div className="space-y-6">
                        {/* Location Status */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="bg-blue-100 rounded-full p-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Status Lokasi</h3>
                            </div>
                            
                            {location ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Latitude:</span>
                                        <span className="font-mono text-sm">{location.latitude.toFixed(6)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Longitude:</span>
                                        <span className="font-mono text-sm">{location.longitude.toFixed(6)}</span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-100">
                                        <span className="text-green-600 text-sm font-medium">✓ Lokasi berhasil dideteksi</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 text-sm">
                                    Sedang mendeteksi lokasi...
                                </div>
                            )}
                        </div>

                        {/* Messages */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-red-700 font-medium">{error}</span>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-green-700 font-medium">{success}</span>
                                </div>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                            <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h4 className="font-medium text-blue-800 mb-1">Petunjuk</h4>
                                    <ul className="text-blue-700 text-sm space-y-1">
                                        <li>• Pastikan wajah Anda terlihat jelas</li>
                                        <li>• Pastikan Anda berada di area rumah sakit</li>
                                        <li>• Tunggu hingga lokasi terdeteksi</li>
                                        <li>• Klik "Catat Kehadiran" untuk absen</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceMarker;