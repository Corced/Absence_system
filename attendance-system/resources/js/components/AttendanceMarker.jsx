import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

const AttendanceMarker = () => {
  const webcamRef = useRef(null);
  const [locationStatus, setLocationStatus] = useState('Not requested');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const captureAndVerify = async () => {
    setError('');
    setVerificationStatus('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLocationStatus('Requesting location...');
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocationStatus('Location acquired');

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
          setError('Failed to capture image');
          setLoading(false);
          return;
        }

        try {
          const base64Image = imageSrc.replace(/^data:image\/jpeg;base64,/, '');
          console.log('Sending:', {
            image: base64Image.slice(0, 30) + '...',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });

          const response = await axios.post('/api/attendance/mark', {
            image: base64Image,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }, {
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
          });

          const { status, message } = response.data;
          setVerificationStatus(
            status === 'verified'
              ? '✅ Verified!'
              : `❌ ${message || 'Not recognized'}`
          );
        } catch (err) {
          console.error('Verification error:', err);
          if (err.response?.status === 401) {
            setError('Session expired. Please log in again.');
          } else {
            setError(err.response?.data?.error || 'Face verification failed');
          }
        } finally {
          setLoading(false);
        }
      },
      (geoErr) => {
        setLocationStatus('Location access denied');
        setError('Please allow location access to verify identity');
        setLoading(false);
      }
    );
  };

  const retrainModel = async () => {
    try {
      const res = await axios.post('/api/attendance/train', {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      alert(res.data.message || 'Model retrained');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        alert('Session expired. Please log in again to retrain the model.');
      } else {
        alert('Failed to retrain model');
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="rounded-lg shadow-md"
      />
      <p className="mt-2 text-sm text-gray-600">{locationStatus}</p>
      {loading && <p className="text-blue-500">Processing...</p>}
      {error && (
        <p className="text-red-500 text-sm">
          {error}
          {error.includes('Session expired') && (
            <button 
              onClick={() => window.location.href = '/login'}
              className="ml-2 text-blue-500 underline"
            >
              Go to Login
            </button>
          )}
        </p>
      )}
      {verificationStatus && <p className="text-green-600 font-semibold">{verificationStatus}</p>}

      <button
        onClick={captureAndVerify}
        disabled={loading}
        className={`mt-4 ${
          loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-bold py-2 px-4 rounded`}
      >
        {loading ? 'Verifying...' : 'Verify Face'}
      </button>

      <button
        onClick={retrainModel}
        className="mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Retrain Model
      </button>
    </div>
  );
};

export default AttendanceMarker;