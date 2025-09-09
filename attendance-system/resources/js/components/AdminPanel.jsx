import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Webcam from 'react-webcam';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const AdminPanel = () => {
    const [attendances, setAttendances] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [trainingImage, setTrainingImage] = useState(null);
    const [trainingLoading, setTrainingLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [mapInitialized, setMapInitialized] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [calendarView, setCalendarView] = useState('month');
    const [statusFilter, setStatusFilter] = useState('all');
    const webcamRef = useRef(null);
    const mapRef = useRef(null);
    const attendanceTableRef = useRef(null);
    const navigate = useNavigate();

    // Hospital locations and geofence radius
    const hospitalLocations = [
        { lat: -7.9901595, lon: 112.6205187 },
        { lat: -7.9903000, lon: 112.6206000 },
        { lat: -7.9900000, lon: 112.6207000 },
    ];
    const geofenceRadius = 200; // 200 meters

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'admin') {
            navigate('/attendance');
            return;
        }

        const token = localStorage.getItem('auth_token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            navigate('/login');
        }

        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            const [attRes, empRes] = await Promise.all([
                axios.get('/api/attendance'),
                axios.get('/api/employees')
            ]);
            setAttendances(attRes.data);
            setEmployees(empRes.data);
        } catch (err) {
            console.error('Gagal mengambil data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Initialize map when attendance tab is active
    useEffect(() => {
        if (activeTab === 'attendance' && attendances.length > 0 && !mapInitialized) {
            initializeMap();
        }
    }, [activeTab, attendances, mapInitialized]);

    const initializeMap = () => {
        if (mapRef.current) return;

        mapRef.current = L.map('attendance-map').setView([-7.9901595, 112.6205187], 16);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapRef.current);

        hospitalLocations.forEach((loc, index) => {
            L.marker([loc.lat, loc.lon])
                .addTo(mapRef.current)
                .bindPopup(`<b>Lokasi Rumah Sakit ${index + 1}</b><br>Lat: ${loc.lat}<br>Lon: ${loc.lon}`)
                .openPopup();

            L.circle([loc.lat, loc.lon], {
                radius: geofenceRadius,
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                weight: 2,
            }).addTo(mapRef.current);
        });

        attendances.forEach((att) => {
            if (att.latitude && att.longitude) {
                const employee = employees.find(emp => emp.id === att.employee_id);
                const marker = L.marker([att.latitude, att.longitude])
                    .addTo(mapRef.current)
                    .bindPopup(`
                        <div class="text-sm">
                            <b>${employee ? employee.name : 'Tidak diketahui'}</b><br>
                            <b>Waktu:</b> ${new Date(att.attendance_time).toLocaleString('id-ID')}<br>
                            <b>Alamat:</b> ${att.address || 'Tidak tersedia'}<br>
                            <b>Jarak:</b> ${att.distance ? Math.round(att.distance) + 'm' : 'N/A'}
                        </div>
                    `);

                if (att.distance && att.distance <= geofenceRadius) {
                    marker.setIcon(L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    }));
                } else {
                    marker.setIcon(L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    }));
                }
            }
        });

        setMapInitialized(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const trainModel = async () => {
        if (!selectedEmployee || !trainingImage) {
            alert('Pilih karyawan dan ambil foto terlebih dahulu');
            return;
        }

        setTrainingLoading(true);
        try {
            const imageSrc = webcamRef.current.getScreenshot();
            const response = await axios.post('/api/attendance/train', {
                employee_id: selectedEmployee,
                image: imageSrc.split(',')[1],
            });
            alert(response.data.message || 'Pelatihan berhasil');
            setTrainingImage(null);
            setSelectedEmployee('');
        } catch (err) {
            alert('Gagal melatih model: ' + (err.response?.data?.error || err.message));
        } finally {
            setTrainingLoading(false);
        }
    };

    const formatDuration = (startIso, endIso) => {
        if (!startIso || !endIso) return '-';
        const start = new Date(startIso);
        const end = new Date(endIso);
        const diffMs = Math.max(0, end - start);
        const totalMinutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}j ${minutes}m`;
    };

    const filteredAttendances = attendances.filter(att => {
        if (statusFilter === 'clocked_out') return !!att.clock_out_time;
        if (statusFilter === 'open') return !att.clock_out_time;
        return true;
    });

    const exportToExcel = () => {
        const data = filteredAttendances.map(att => ({
            'Nama': employees.find(emp => emp.id === att.employee_id)?.name || 'Tidak diketahui',
            'Clock In Tanggal': new Date(att.attendance_time).toLocaleDateString('id-ID'),
            'Clock In Waktu': new Date(att.attendance_time).toLocaleTimeString('id-ID'),
            'Clock Out Tanggal': att.clock_out_time ? new Date(att.clock_out_time).toLocaleDateString('id-ID') : '-',
            'Clock Out Waktu': att.clock_out_time ? new Date(att.clock_out_time).toLocaleTimeString('id-ID') : '-',
            'Durasi': att.clock_out_time ? formatDuration(att.attendance_time, att.clock_out_time) : '-',
            'Lokasi': att.address || 'Tidak tersedia',
            'Latitude': att.latitude || '-',
            'Longitude': att.longitude || '-',
            'Jarak (m)': att.distance ? Math.round(att.distance) : '-',
            'Status Area': att.distance && att.distance <= geofenceRadius ? 'Dalam Area' : 'Di Luar Area',
            'Status Clock Out': att.clock_out_time ? 'Sudah Clock Out' : 'Belum Clock Out'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data Kehadiran');
        
        const colWidths = [
            { wch: 20 }, // Nama
            { wch: 15 }, // Clock In Tanggal
            { wch: 12 }, // Clock In Waktu
            { wch: 17 }, // Clock Out Tanggal
            { wch: 12 }, // Clock Out Waktu
            { wch: 10 }, // Durasi
            { wch: 40 }, // Lokasi
            { wch: 12 }, // Latitude
            { wch: 12 }, // Longitude
            { wch: 10 }, // Jarak
            { wch: 15 }, // Status Area
            { wch: 16 }  // Status Clock Out
        ];
        ws['!cols'] = colWidths;

        XLSX.writeFile(wb, `Data_Kehadiran_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`);
    };

    const exportToPDF = async () => {
        if (!attendanceTableRef.current) return;

        const canvas = await html2canvas(attendanceTableRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`Data_Kehadiran_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.pdf`);
    };

    const getTodayAttendances = () => {
        const today = new Date().toDateString();
        return attendances.filter(att => 
            new Date(att.attendance_time).toDateString() === today
        );
    };

    const getEmployeeName = (employeeId) => {
        const employee = employees.find(emp => emp.id === employeeId);
        return employee ? employee.name : 'Tidak diketahui';
    };

    const getAttendanceChartData = () => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        const attendanceCounts = last7Days.map(date => {
            return attendances.filter(att => 
                att.attendance_time.startsWith(date)
            ).length;
        });

        return {
            labels: last7Days.map(date => {
                const d = new Date(date);
                return d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: 'Kehadiran',
                data: attendanceCounts,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
            }]
        };
    };

    const getEmployeeAttendanceData = () => {
        const employeeAttendanceCounts = employees.map(emp => {
            const count = attendances.filter(att => att.employee_id === emp.id).length;
            return { name: emp.name, count };
        }).sort((a, b) => b.count - a.count).slice(0, 10);

        return {
            labels: employeeAttendanceCounts.map(emp => emp.name),
            datasets: [{
                label: 'Jumlah Kehadiran',
                data: employeeAttendanceCounts.map(emp => emp.count),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                    'rgba(14, 165, 233, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                ],
                borderColor: [
                    'rgb(59, 130, 246)',
                    'rgb(16, 185, 129)',
                    'rgb(245, 158, 11)',
                    'rgb(239, 68, 68)',
                    'rgb(139, 92, 246)',
                    'rgb(236, 72, 153)',
                    'rgb(34, 197, 94)',
                    'rgb(251, 146, 60)',
                    'rgb(14, 165, 233)',
                    'rgb(168, 85, 247)',
                ],
                borderWidth: 2,
            }]
        };
    };

    const getAttendanceStatusData = () => {
        const todayAttendances = getTodayAttendances();
        const withinGeofence = todayAttendances.filter(att => 
            att.distance && att.distance <= geofenceRadius
        ).length;
        const outsideGeofence = todayAttendances.filter(att => 
            att.distance && att.distance > geofenceRadius
        ).length;
        const noDistance = todayAttendances.length - withinGeofence - outsideGeofence;

        return {
            labels: ['Dalam Area', 'Di Luar Area', 'Tidak Ada Data'],
            datasets: [{
                data: [withinGeofence, outsideGeofence, noDistance],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(156, 163, 175, 0.8)',
                ],
                borderColor: [
                    'rgb(16, 185, 129)',
                    'rgb(239, 68, 68)',
                    'rgb(156, 163, 175)',
                ],
                borderWidth: 2,
            }]
        };
    };

    const getCalendarData = () => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        
        const calendarData = [];
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarData.push({
                date: null,
                present: 0,
                absent: 0,
                total: 0,
                presentEmployees: [],
                absentEmployees: [],
                isEmpty: true
            });
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = date.toLocaleDateString('en-CA');
            
            const dayAttendances = attendances.filter(att => 
                att.attendance_time.startsWith(dateString)
            );
            
            const presentEmployees = [...new Set(dayAttendances.map(att => att.employee_id))];
            const absentEmployees = employees.filter(emp => !presentEmployees.includes(emp.id));
            
            calendarData.push({
                date: date,
                present: presentEmployees.length,
                absent: absentEmployees.length,
                total: employees.length,
                presentEmployees: presentEmployees.map(id => getEmployeeName(id)),
                absentEmployees: absentEmployees.map(emp => emp.name),
                isEmpty: false
            });
        }
        
        return calendarData;
    };

    const getEmployeesForDate = (date) => {
        const dateString = date.toLocaleDateString('en-CA');
        const dayAttendances = attendances.filter(att => 
            att.attendance_time.startsWith(dateString)
        );
        
        const presentEmployees = [...new Set(dayAttendances.map(att => att.employee_id))];
        const absentEmployees = employees.filter(emp => !presentEmployees.includes(emp.id));
        
        return {
            present: presentEmployees.map(id => getEmployeeName(id)),
            absent: absentEmployees.map(emp => emp.name)
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10">
                                <img 
                                    src="/logorstad.png" 
                                    alt="RST Logo" 
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">Panel Admin</h1>
                                <p className="text-sm text-gray-600">Sistem Absensi RST Dokter Soepraoen</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Keluar
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                        { id: 'attendance', label: 'Data Kehadiran', icon: '📅' },
                        { id: 'employees', label: 'Karyawan', icon: '👥' },
                        { id: 'training', label: 'Pelatihan', icon: '🎯' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                            }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pb-8">
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <div className="flex items-center">
                                    <div className="bg-blue-100 rounded-full p-3">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Karyawan</p>
                                        <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <div className="flex items-center">
                                    <div className="bg-green-100 rounded-full p-3">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Kehadiran Hari Ini</p>
                                        <p className="text-2xl font-bold text-gray-900">{getTodayAttendances().length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <div className="flex items-center">
                                    <div className="bg-purple-100 rounded-full p-3">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Kehadiran</p>
                                        <p className="text-2xl font-bold text-gray-900">{attendances.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Ringkasan Hari Ini</h3>
                                <button
                                    onClick={fetchData}
                                    className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                    🔄 Refresh
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{getTodayAttendances().length}</div>
                                    <div className="text-sm text-gray-600">Total Hadir</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {getTodayAttendances().filter(att => att.distance && att.distance <= geofenceRadius).length}
                                    </div>
                                    <div className="text-sm text-gray-600">Dalam Area</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">
                                        {getTodayAttendances().filter(att => att.distance && att.distance > geofenceRadius).length}
                                    </div>
                                    <div className="text-sm text-gray-600">Di Luar Area</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-600">
                                        {employees.length - getTodayAttendances().length}
                                    </div>
                                    <div className="text-sm text-gray-600">Belum Hadir</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tren Kehadiran 7 Hari Terakhir</h3>
                                <div className="h-64">
                                    <Line 
                                        data={getAttendanceChartData()}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    display: false
                                                },
                                                tooltip: {
                                                    mode: 'index',
                                                    intersect: false,
                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                    titleColor: 'white',
                                                    bodyColor: 'white',
                                                    borderColor: 'rgba(59, 130, 246, 0.5)',
                                                    borderWidth: 1
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    ticks: {
                                                        stepSize: 1
                                                    },
                                                    grid: {
                                                        color: 'rgba(0, 0, 0, 0.1)'
                                                    }
                                                },
                                                x: {
                                                    grid: {
                                                        display: false
                                                    }
                                                }
                                            },
                                            interaction: {
                                                mode: 'nearest',
                                                axis: 'x',
                                                intersect: false
                                            },
                                            elements: {
                                                point: {
                                                    radius: 4,
                                                    hoverRadius: 6
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Karyawan Berdasarkan Kehadiran</h3>
                                <div className="h-64">
                                    <Bar 
                                        data={getEmployeeAttendanceData()}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    display: false
                                                },
                                                tooltip: {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                    titleColor: 'white',
                                                    bodyColor: 'white',
                                                    borderColor: 'rgba(16, 185, 129, 0.5)',
                                                    borderWidth: 1,
                                                    callbacks: {
                                                        label: function(context) {
                                                            return `Kehadiran: ${context.parsed.y}`;
                                                        }
                                                    }
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    ticks: {
                                                        stepSize: 1
                                                    },
                                                    grid: {
                                                        color: 'rgba(0, 0, 0, 0.1)'
                                                    }
                                                },
                                                x: {
                                                    grid: {
                                                        display: false
                                                    }
                                                }
                                            },
                                            elements: {
                                                bar: {
                                                    borderRadius: 4
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Status Kehadiran Hari Ini</h3>
                                <div className="h-64">
                                    <Doughnut 
                                        data={getAttendanceStatusData()}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                    labels: {
                                                        padding: 20,
                                                        usePointStyle: true
                                                    }
                                                },
                                                tooltip: {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                    titleColor: 'white',
                                                    bodyColor: 'white',
                                                    borderColor: 'rgba(139, 92, 246, 0.5)',
                                                    borderWidth: 1,
                                                    callbacks: {
                                                        label: function(context) {
                                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                                                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                                                        }
                                                    }
                                                }
                                            },
                                            elements: {
                                                arc: {
                                                    borderWidth: 2
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Kalender Kehadiran</h3>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setCalendarView('month')}
                                            className={`px-3 py-1 text-sm rounded-lg ${
                                                calendarView === 'month' 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            Bulan
                                        </button>
                                        <button
                                            onClick={() => setCalendarView('week')}
                                            className={`px-3 py-1 text-sm rounded-lg ${
                                                calendarView === 'week' 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            Minggu
                                        </button>
                                        <button
                                            onClick={() => setSelectedDate(new Date())}
                                            className="px-3 py-1 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        >
                                            Hari Ini
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={(date) => setSelectedDate(date)}
                                        dateFormat="MMMM yyyy"
                                        showMonthYearPicker
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-blue-800 font-medium">
                                            Ringkasan {selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                        </span>
                                        <span className="text-blue-600">
                                            {getCalendarData().filter(day => !day.isEmpty && day.present > 0).length} hari dengan kehadiran
                                        </span>
                                    </div>
                                </div>

                                {calendarView === 'month' ? (
                                    <div className="grid grid-cols-7 gap-1 text-xs">
                                        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                                            <div key={day} className="p-2 text-center font-medium text-gray-500 bg-gray-50 rounded">
                                                {day}
                                            </div>
                                        ))}
                                        {getCalendarData().map((dayData, index) => (
                                            <div 
                                                key={index} 
                                                className={`p-2 text-center border rounded ${
                                                    dayData.isEmpty 
                                                        ? 'bg-transparent border-transparent' 
                                                        : dayData.present > 0 
                                                            ? 'bg-green-50 border-green-200 cursor-pointer hover:bg-green-100' 
                                                            : 'bg-gray-50 border-gray-200 cursor-pointer hover:bg-gray-100'
                                                }`}
                                                onClick={dayData.isEmpty ? undefined : () => {
                                                    const employees = getEmployeesForDate(dayData.date);
                                                    const presentList = employees.present.length > 0 ? employees.present.join('\n') : 'Tidak ada';
                                                    const absentList = employees.absent.length > 0 ? employees.absent.join('\n') : 'Tidak ada';
                                                    
                                                    alert(`📅 Tanggal: ${dayData.date.toLocaleDateString('id-ID')}\n\n✅ Hadir (${employees.present.length}):\n${presentList}\n\n❌ Tidak Hadir (${employees.absent.length}):\n${absentList}`);
                                                }}
                                            >
                                                {!dayData.isEmpty && (
                                                    <>
                                                        <div className="font-medium text-gray-900">{dayData.date.getDate()}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {dayData.present}/{dayData.total}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {getCalendarData().slice(0, 7).map((dayData, index) => (
                                            <div 
                                                key={index}
                                                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                                                    dayData.isEmpty 
                                                        ? 'bg-gray-100 border-gray-200' 
                                                        : dayData.present > 0 
                                                            ? 'bg-green-50 border-green-200' 
                                                            : 'bg-gray-50 border-gray-200'
                                                }`}
                                                onClick={dayData.isEmpty ? undefined : () => {
                                                    const employees = getEmployeesForDate(dayData.date);
                                                    const presentList = employees.present.length > 0 ? employees.present.join('\n') : 'Tidak ada';
                                                    const absentList = employees.absent.length > 0 ? employees.absent.join('\n') : 'Tidak ada';
                                                    
                                                    alert(`📅 Tanggal: ${dayData.date.toLocaleDateString('id-ID')}\n\n✅ Hadir (${employees.present.length}):\n${presentList}\n\n❌ Tidak Hadir (${employees.absent.length}):\n${absentList}`);
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="font-medium text-gray-900">
                                                        {dayData.isEmpty 
                                                            ? 'Tidak ada data' 
                                                            : dayData.date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
                                                        }
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {dayData.isEmpty ? '-' : `${dayData.present}/${dayData.total} hadir`}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Peta Lokasi Kehadiran</h3>
                                <p className="text-sm text-gray-600">
                                    Peta menunjukkan lokasi kehadiran karyawan dengan geofencing area rumah sakit
                                </p>
                            </div>
                            <div 
                                id="attendance-map" 
                                className="w-full h-96 rounded-xl border border-gray-200"
                                style={{ minHeight: '400px' }}
                            ></div>
                            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                                    <span>Dalam area (&le;200m)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                                    <span>Di luar area (&gt;200m)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                                    <span>Lokasi Rumah Sakit</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm">
  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">Data Kehadiran</h2>
      <p className="text-gray-600 mt-1">Riwayat kehadiran semua karyawan</p>
    </div>
    <div className="flex space-x-3 items-center">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
      >
        <option value="all">Semua</option>
        <option value="open">Belum Clock Out</option>
        <option value="clocked_out">Sudah Clock Out</option>
      </select>
      <button
        onClick={exportToExcel}
        disabled={filteredAttendances.length === 0}
        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
          filteredAttendances.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
        <span>Export to Excel</span>
      </button>
      <button
        onClick={exportToPDF}
        disabled={filteredAttendances.length === 0}
        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
          filteredAttendances.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-red-600 text-white hover:bg-red-700'
        }`}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6zm7 1.5L18.5 9H13V3.5zM9 13h6v2H9v-2zm0 4h6v2H9v-2z"/>
        </svg>
        <span>Export to PDF</span>
      </button>
    </div>
  </div>
  <div className="overflow-x-auto no-oklch-colors" ref={attendanceTableRef}>
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durasi</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jarak</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Area</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Clock Out</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {filteredAttendances.slice(0, 50).map((attendance, index) => {
          const isWithinGeofence = attendance.distance && attendance.distance <= geofenceRadius;
          return (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {getEmployeeName(attendance.employee_id)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(attendance.attendance_time).toLocaleString('id-ID')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {attendance.clock_out_time ? new Date(attendance.clock_out_time).toLocaleString('id-ID') : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {attendance.clock_out_time ? formatDuration(attendance.attendance_time, attendance.clock_out_time) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {attendance.address || 'Tidak tersedia'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {attendance.distance ? `${Math.round(attendance.distance)}m` : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isWithinGeofence 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isWithinGeofence ? '✓ Dalam area' : '✗ Di luar area'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  attendance.clock_out_time
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {attendance.clock_out_time ? 'Sudah Clock Out' : 'Belum Clock Out'}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>
                    </div>
                )}

                {activeTab === 'employees' && (
                    <div className="bg-white rounded-2xl shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">Daftar Karyawan</h2>
                            <p className="text-gray-600 mt-1">Informasi semua karyawan terdaftar</p>
                        </div>
                        <div className="p-6">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {employees.map((employee) => (
                                    <div key={employee.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
                                                <span className="text-blue-600 font-semibold text-sm">
                                                    {employee.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">{employee.name}</h3>
                                                <p className="text-sm text-gray-500">{employee.position}</p>
                                                <p className="text-xs text-gray-400">{employee.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'training' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Pelatihan Model AI</h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Pengaturan Pelatihan</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Pilih Karyawan
                                        </label>
                                        <select
                                            value={selectedEmployee}
                                            onChange={(e) => setSelectedEmployee(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Pilih karyawan...</option>
                                            {employees.map((emp) => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.name} - {emp.position}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Foto untuk Pelatihan
                                        </label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                            {trainingImage ? (
                                                <div className="space-y-2">
                                                    <img src={trainingImage} alt="Training" className="mx-auto rounded-lg max-w-full h-48 object-cover" />
                                                    <button
                                                        onClick={() => setTrainingImage(null)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        Hapus foto
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    <p className="mt-2 text-sm text-gray-600">Klik tombol di bawah untuk mengambil foto</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setTrainingImage(webcamRef.current?.getScreenshot())}
                                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Ambil Foto
                                    </button>

                                    <button
                                        onClick={trainModel}
                                        disabled={!selectedEmployee || !trainingImage || trainingLoading}
                                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                                            !selectedEmployee || !trainingImage || trainingLoading
                                                ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                        }`}
                                    >
                                        {trainingLoading ? 'Sedang melatih...' : 'Mulai Pelatihan'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Kamera</h3>
                                <div className="relative">
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="w-full rounded-lg shadow-md"
                                    />
                                    <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded-lg pointer-events-none"></div>
                                </div>
                                <p className="text-sm text-gray-600 mt-2 text-center">
                                    Posisikan wajah dengan jelas untuk hasil terbaik
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;