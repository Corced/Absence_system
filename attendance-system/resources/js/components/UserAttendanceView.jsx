import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserAttendanceView = () => {
  const [attendances, setAttendances] = useState([]);
  const [shiftInfo, setShiftInfo] = useState(null);
  const [tomorrowShift, setTomorrowShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      navigate('/login');
      return;
    }

    fetchUserData();
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch attendance data, shift info, and tomorrow's shift in parallel
      const [attendanceResponse, shiftResponse] = await Promise.all([
        axios.get('http://localhost:8000/api/attendance/my'),
        axios.get('http://localhost:8000/api/attendance/my-shift')
      ]);

      setAttendances(attendanceResponse.data);
      setShiftInfo(shiftResponse.data);
      
      // Fetch tomorrow's shift and profile image in parallel
      await Promise.all([
        fetchTomorrowShift(),
        fetchProfileImage(shiftResponse.data.employee_info?.id)
      ]);
      
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setError('Gagal memuat data kehadiran');
    } finally {
      setLoading(false);
    }
  };

  const fetchTomorrowShift = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/attendance/tomorrow-shift');
      const data = response.data;
      
      if (data.tomorrow_shift) {
        setTomorrowShift(data.tomorrow_shift);
      }
    } catch (err) {
      console.error('Failed to fetch tomorrow shift:', err);
    }
  };

  const fetchProfileImage = async (employeeId) => {
    if (!employeeId) return;
    
    try {
      // First, get a list of available images for the employee
      const response = await axios.get(`http://localhost:5000/photos/employee_${employeeId}/`);
      if (response.data && response.data.length > 0) {
        const firstImage = response.data[0];
        const imageUrl = `http://localhost:5000/photos/employee_${employeeId}/${firstImage}`;
        setProfileImage(imageUrl);
      }
    } catch (err) {
      console.log('No profile image found for employee', employeeId);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('id-ID', options);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const calculateWorkHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return '-';
    
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}j ${diffMinutes}m`;
  };

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

  const isAttendanceComplete = (attendance) => {
    return attendance.clock_out_time !== null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data kehadiran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b w-full px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8">
              <img src="/logorstad.png" alt="RST Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">Riwayat Kehadiran</h1>
              <p className="text-xs sm:text-sm text-gray-600">Rumah Sakit Tentara Dokter Soepraoen</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/attendance')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base"
            >
              Kembali ke Absensi
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* User Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-green-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-4 border-green-200">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {shiftInfo?.employee_info?.name || 'Nama Karyawan'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">NIP:</span>
                  <span className="ml-2 font-medium text-gray-800">{shiftInfo?.employee_info?.nip || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Posisi:</span>
                  <span className="ml-2 font-medium text-gray-800">{shiftInfo?.employee_info?.position || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status Hari Ini:</span>
                  <span className={`ml-2 font-medium ${shiftInfo?.is_working_today ? 'text-green-600' : 'text-red-600'}`}>
                    {shiftInfo?.is_working_today ? 'Bekerja' : 'Libur'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current and Tomorrow Shift Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Current Shift */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 rounded-full p-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Shift Hari Ini</h3>
            </div>
            {shiftInfo?.current_shift ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nama Shift:</span>
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
                <div className="flex justify-between">
                  <span className="text-gray-600">Timezone:</span>
                  <span className="font-medium text-gray-800">{shiftInfo.current_shift.timezone}</span>
                </div>
              </div>
            ) : shiftInfo?.default_shift ? (
              <div className="space-y-3">
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
                <div className="flex justify-between">
                  <span className="text-gray-600">Timezone:</span>
                  <span className="font-medium text-gray-800">{shiftInfo.default_shift.timezone}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Tidak ada shift yang ditetapkan</p>
            )}
          </div>

          {/* Tomorrow Shift */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-100 rounded-full p-2">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Shift Besok</h3>
            </div>
            {tomorrowShift ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nama Shift:</span>
                  <span className="font-medium text-gray-800">
                    {tomorrowShift.name} ({tomorrowShift.code})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jam Kerja:</span>
                  <span className="font-medium text-gray-800">
                    {tomorrowShift.start_time} - {tomorrowShift.end_time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timezone:</span>
                  <span className="font-medium text-gray-800">{tomorrowShift.timezone}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Tidak ada shift yang dijadwalkan untuk besok</p>
            )}
          </div>
        </div>

        {/* Attendance History Table */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-green-100 rounded-full p-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Riwayat Kehadiran</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Shift</th>
                  <th className="px-6 py-4">Masuk</th>
                  <th className="px-6 py-4">Pulang</th>
                  <th className="px-6 py-4">Durasi Kerja</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendances.length > 0 ? (
                  attendances.map((attendance, index) => (
                    <tr key={attendance.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        <div>
                          <div className="font-semibold">{formatDateOnly(attendance.attendance_time)}</div>
                          <div className="text-xs text-gray-500">{formatDate(attendance.attendance_time)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getShiftForDate(attendance.attendance_time)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-mono">{formatTime(attendance.attendance_time)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {attendance.clock_out_time ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="font-mono">{formatTime(attendance.clock_out_time)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm">
                          {calculateWorkHours(attendance.attendance_time, attendance.clock_out_time)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p>Belum ada data kehadiran</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAttendanceView;