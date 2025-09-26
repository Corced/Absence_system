import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AttendanceMarker = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [shiftInfo, setShiftInfo] = useState(null);
  const [attendances, setAttendances] = useState([]);
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

    // Fetch shift information
    fetchShiftInfo();
    
    // Fetch attendance history
    fetchMyAttendances();
  }, [navigate]);

  const fetchShiftInfo = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/attendance/my-shift');
      setShiftInfo(response.data);
    } catch (err) {
      console.error('Failed to fetch shift info:', err);
    }
  };

  const fetchMyAttendances = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/attendance/my');
      setAttendances(response.data);
    } catch (err) {
      console.error('Failed to fetch attendances:', err);
    }
  };

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
      // Refresh attendance data after successful marking
      fetchMyAttendances();
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
      // Refresh attendance data after successful clock out
      fetchMyAttendances();
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

  // Format date to Indonesian format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
  };

  // Format time only
  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // Get shift information for a specific attendance date
  const getShiftForDate = (attendanceDate) => {
    if (!shiftInfo) return '-';
    
    // For now, we'll use the current shift info for all dates
    // In a more advanced implementation, you might want to fetch historical shift data
    if (shiftInfo.current_shift) {
      return `${shiftInfo.current_shift.name} (${shiftInfo.current_shift.code})`;
    } else if (shiftInfo.default_shift) {
      return `${shiftInfo.default_shift.name} (${shiftInfo.default_shift.code})`;
    }
    
    return '-';
  };

  // Check if attendance is complete (both clock-in and clock-out)
  const isAttendanceComplete = (attendance) => {
    return attendance.clock_out_time !== null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b w-full px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8">
              <img src="/logorstad.png" alt="RST Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">Sistem Absensi</h1>
              <p className="text-xs sm:text-sm text-gray-600">Rumah Sakit Tentara Dokter Soepraoen</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full flex flex-col lg:flex-row">
        {/* Camera Section */}
        <div className="lg:w-1/2 w-full p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 h-full flex flex-col">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2">Ambil Foto</h2>
              <p className="text-sm sm:text-base text-gray-600">Posisikan wajah Anda di depan kamera</p>
            </div>
            <div className="flex-1 relative">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-full rounded-xl shadow-md object-cover"
              />
              <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded-xl pointer-events-none"></div>
            </div>
            <button
              onClick={markAttendance}
              disabled={loading || !location}
              className={`w-full mt-4 sm:mt-6 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                loading || !location
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sedang memproses...
                </div>
              ) : (
                'Catat Kehadiran'
              )}
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
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sedang memproses...
                </div>
              ) : (
                'Clock Out'
              )}
            </button>
          </div>
        </div>

        {/* Status Section */}
        <div className="lg:w-1/2 w-full p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          {/* Location Status */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 rounded-full p-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
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
              <div className="text-gray-500 text-sm">Sedang mendeteksi lokasi...</div>
            )}
          </div>

          {/* Shift Information */}
          {shiftInfo && (
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-purple-100 rounded-full p-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Informasi Shift Hari Ini</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nama:</span>
                  <span className="font-medium text-gray-800">{shiftInfo.employee_info?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">NIP:</span>
                  <span className="font-medium text-gray-800">{shiftInfo.employee_info?.nip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Posisi:</span>
                  <span className="font-medium text-gray-800">{shiftInfo.employee_info?.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status Hari Ini:</span>
                  <span
                    className={`font-medium ${shiftInfo.is_working_today ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {shiftInfo.is_working_today ? 'Bekerja' : 'Libur'}
                  </span>
                </div>
                {shiftInfo.current_shift && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shift:</span>
                      <span className="font-medium text-gray-800">
                        {shiftInfo.current_shift.name} ({shiftInfo.current_shift.code})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jam Kerja:</span>
                      <span className="font-medium text-gray-800">
                        {shiftInfo.current_shift.start_time} - {shiftInfo.current_shift.end_time}
                      </span>
                    </div>
                  </>
                )}
                {!shiftInfo.current_shift && shiftInfo.default_shift && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shift Default:</span>
                      <span className="font-medium text-gray-800">
                        {shiftInfo.default_shift.name} ({shiftInfo.default_shift.code})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jam Kerja:</span>
                      <span className="font-medium text-gray-800">
                        {shiftInfo.default_shift.start_time} - {shiftInfo.default_shift.end_time}
                      </span>
                    </div>
                  </>
                )}
                {shiftInfo.today_shift_code && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kode Shift Hari Ini:</span>
                    <span className="font-medium text-gray-800">{shiftInfo.today_shift_code}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attendance History Table */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-100 rounded-full p-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Riwayat Kehadiran</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Shift</th>
                    <th className="px-4 py-3">Masuk</th>
                    <th className="px-4 py-3">Pulang</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.length > 0 ? (
                    attendances.map((attendance, index) => (
                      <tr key={attendance.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                          {formatDate(attendance.attendance_time)}
                        </td>
                        <td className="px-4 py-3">
                          {getShiftForDate(attendance.attendance_time)}
                        </td>
                        <td className="px-4 py-3">
                          {formatTime(attendance.attendance_time)}
                        </td>
                        <td className="px-4 py-3">
                          {formatTime(attendance.clock_out_time)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isAttendanceComplete(attendance) 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {isAttendanceComplete(attendance) ? 'Lengkap' : 'Belum Pulang'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                        Belum ada data kehadiran
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-green-700 font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
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
  );
};

export default AttendanceMarker;