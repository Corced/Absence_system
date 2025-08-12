import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AttendanceMarker from './components/AttendanceMarker';
import AdminPanel from './components/AdminPanel';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('auth_token'));

    return (
        <Router>
            <Routes>
                <Route
                    path="/login"
                    element={<Login setIsAuthenticated={setIsAuthenticated} />}
                />
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            <Navigate to={localStorage.getItem('role') === 'admin' ? '/admin' : '/attendance'} />
                        ) : (
                            <Login setIsAuthenticated={setIsAuthenticated} />
                        )
                    }
                />
                <Route
                    path="/attendance"
                    element={isAuthenticated ? <AttendanceMarker /> : <Navigate to="/login" />}
                />
                <Route
                    path="/admin"
                    element={isAuthenticated ? <AdminPanel /> : <Navigate to="/login" />}
                />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
};

const root = createRoot(document.getElementById('app'));
root.render(<App />);