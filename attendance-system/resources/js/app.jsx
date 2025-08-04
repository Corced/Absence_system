import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import AttendanceMarker from './components/AttendanceMarker';

const root = createRoot(document.getElementById('app'));
root.render(<AttendanceMarker />);