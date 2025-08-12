import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AttendanceMarker = () => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const webcamRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Set Axios default headers with token
        const token = localStorage.getItem('auth_token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            setError('No authentication token found. Please log in.');
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
                    setError('Failed to get location: ' + err.message);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            setError('Geolocation is not supported by this browser.');
        }
    }, [navigate]);

    const markAttendance = async () => {
        if (!webcamRef.current || !location) {
            setError('Camera or location not available.');
            return;
        }

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            setError('Failed to capture image.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:8000/api/attendance/mark', {
                image: imageSrc.split(',')[1], // Remove base64 prefix
                latitude: location.latitude,
                longitude: location.longitude,
            });

            setSuccess(response.data.message);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to mark attendance.');
            setSuccess('');
            console.error('Attendance marking failed:', err);
        }
    };

    return (
        <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Mark Attendance</h1>
            {error && <div className="text-red-600 mb-4">{error}</div>}
            {success && <div className="text-green-600 mb-4">{success}</div>}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="mb-4 rounded-lg shadow-md"
                />
                <button
                    onClick={markAttendance}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    Mark Attendance
                </button>
                {location && (
                    <div className="mt-4 text-gray-700">
                        Location: {location.latitude}, {location.longitude}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceMarker;