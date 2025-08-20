import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Webcam from 'react-webcam';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const AdminPanel = () => {
    const [attendances, setAttendances] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [trainingImage, setTrainingImage] = useState(null);
    const webcamRef = useRef(null);
    const mapRef = useRef(null);
    const navigate = useNavigate();

    // Hospital locations and geofence radius
    const hospitalLocations = [
        { lat: -7.9901595, lon: 112.6205187 },
        { lat: -7.9903000, lon: 112.6206000 },
        { lat: -7.9900000, lon: 112.6207000 },
    ];
    const geofenceRadius = 20; // 20 meters

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'admin') {
            navigate('/attendance');
            return;
        }

        const token = localStorage.getItem('auth_token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true })
                .then(() => console.log('CSRF token fetched'));
        } else {
            navigate('/login');
        }

        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            const attRes = await axios.get('/api/attendance');
            setAttendances(attRes.data);
            const empRes = await axios.get('/api/employees');
            setEmployees(empRes.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && attendances.length > 0) {
            // Initialize Leaflet map
            if (!mapRef.current) {
                mapRef.current = L.map('attendance-map').setView([-7.9901595, 112.6205187], 18);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                }).addTo(mapRef.current);

                // Add hospital location markers and geofence circles
                hospitalLocations.forEach(loc => {
                    L.marker([loc.lat, loc.lon])
                        .addTo(mapRef.current)
                        .bindPopup('Hospital Location');
                    L.circle([loc.lat, loc.lon], {
                        radius: geofenceRadius,
                        color: 'blue',
                        fillOpacity: 0.2,
                    }).addTo(mapRef.current);
                });

                // Add attendance markers
                attendances.forEach(att => {
                    L.marker([att.latitude, att.longitude])
                        .addTo(mapRef.current)
                        .bindPopup(
                            `Employee: ${att.employee?.name || 'Unknown'}<br>` +
                            `Time: ${att.attendance_time}<br>` +
                            `Address: ${att.address}<br>` +
                            `Distance: ${att.distance ? Math.round(att.distance) : 'N/A'}m`
                        );
                });
            }
        }
    }, [attendances, loading]);

    const handleLogout = async () => {
        try {
            await axios.post('/api/logout');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('role');
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const handleTrainModel = async () => {
        if (!selectedEmployee || !trainingImage) {
            alert('Please select an employee and capture an image');
            return;
        }

        try {
            const response = await axios.post('/api/attendance/train', {
                employee_id: selectedEmployee,
                image: trainingImage.split(',')[1],
            });
            alert(response.data.message);
            setTrainingImage(null);
            setSelectedEmployee('');
        } catch (err) {
            alert('Failed to train model: ' + (err.response?.data?.error || err.message));
        }
    };

    const captureImage = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            setTrainingImage(imageSrc);
        } else {
            alert('Failed to capture image');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
                <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                    Logout
                </button>
            </div>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Train Facial Recognition</h2>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Select Employee</label>
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select an employee</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="mb-4 rounded-lg shadow-md"
                        />
                        <button
                            onClick={captureImage}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                        >
                            Capture Image
                        </button>
                    </div>
                    {trainingImage && (
                        <div className="mb-4">
                            <img src={trainingImage} alt="Captured" className="max-w-xs rounded-lg shadow-md" />
                        </div>
                    )}
                    <button
                        onClick={handleTrainModel}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!selectedEmployee || !trainingImage}
                    >
                        Train Model
                    </button>
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Employees</h2>
                <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {employees.length > 0 ? (
                                employees.map((emp) => (
                                    <tr key={emp.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.position}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No employees found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Attendances</h2>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div id="attendance-map" style={{ height: '400px', width: '100%' }}></div>
                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance (m)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {attendances.length > 0 ? (
                                    attendances.map((att) => (
                                        <tr key={att.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{att.employee?.name || 'Unknown'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{att.attendance_time}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{att.address} ({att.latitude}, {att.longitude})</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{att.distance ? Math.round(att.distance) : 'N/A'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No attendances recorded</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AdminPanel;