import React, { useState, useEffect, useRef } from 'react';
import * as piexif from 'piexifjs';

const GP_OPTIONS = [
  "Anwliyasar", "Barnel", "Bhawala", "Bugarda", "Chhajoli", "Chhapra",
  "Deh", "Dharna", "Dhehari", "Dotina", "Dugastau", "Dugoli", "Gorau",
  "Gugriyali", "Jalniyasar", "Jayal", "Jhareli", "Jocheena", "Kamediya",
  "Kathoti", "Khatu Kallan", "Kherat", "Khinyala", "Manglod", "Peendiya",
  "Phardod", "Rajod", "Ratanga", "Rohina", "Rotoo", "Sandeela", "Somna",
  "Soneli", "Surpaliya", "Tangla", "Tanwra", "Tarnau"
];

// Helper to convert decimal degrees to EXIF rational DMS format
const degToDmsRational = (deg) => {
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.round((minutesNotTruncated - minutes) * 60 * 100);
  return [
    [degrees, 1],
    [minutes, 1],
    [seconds, 100]
  ];
};

// Helper to attach GPS metadata to JPEG base64 DataURL
const attachGpsMetadata = (dataUrl, lat, lon) => {
  try {
    const latRef = lat >= 0 ? 'N' : 'S';
    const lonRef = lon >= 0 ? 'E' : 'W';

    const gpsData = {};
    gpsData[piexif.GPSIFD.GPSLatitudeRef] = latRef;
    gpsData[piexif.GPSIFD.GPSLatitude] = degToDmsRational(lat);
    gpsData[piexif.GPSIFD.GPSLongitudeRef] = lonRef;
    gpsData[piexif.GPSIFD.GPSLongitude] = degToDmsRational(lon);
    
    // Add date/timestamp to GPS tags
    const now = new Date();
    gpsData[piexif.GPSIFD.GPSDateStamp] = now.toISOString().slice(0, 10).replace(/-/g, ':'); // YYYY:MM:DD

    const exifObj = { GPS: gpsData };
    const exifBytes = piexif.dump(exifObj);
    
    return piexif.insert(exifBytes, dataUrl);
  } catch (error) {
    console.error("Error attaching GPS metadata:", error);
    return dataUrl;
  }
};

// Helper to convert Base64 DataURL to Blob
const dataUrlToBlob = (dataUrl) => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export default function App() {
  // Navigation / Routing
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Main Camera states
  const [gp, setGp] = useState('');
  const [ps] = useState('Jayal');
  const [dropboxToken, setDropboxToken] = useState('');
  const [status, setStatus] = useState({ text: '', type: '' }); // type: 'primary' | 'success' | 'danger' | 'muted'
  const [cameraActive, setCameraActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageBlob, setImageBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [existingGps, setExistingGps] = useState(new Set()); // Tracks GPs already uploaded in Dropbox

  // Admin Dashboard states
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    sessionStorage.getItem('admin_authenticated') === 'true'
  );
  const [submissions, setSubmissions] = useState([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // Lightbox zoom

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const locationRef = useRef({ lat: null, lon: null, address: '' });

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Client-side router navigation utility
  const navigateTo = (path) => {
    let target = path;
    const hasBase = window.location.pathname.startsWith('/geotagjayal');
    if (hasBase && !path.startsWith('/geotagjayal')) {
      target = `/geotagjayal${path.startsWith('/') ? path : '/' + path}`;
    }
    window.history.pushState({}, '', target);
    setCurrentPath(target);
  };

  // Determine active route
  const isAdminPath = currentPath.endsWith('/bharatnet/admin') || currentPath.endsWith('/bharatnet/admin/') || currentPath === '/admin' || currentPath === '/admin/';
  const isBharatNetPath = currentPath.endsWith('/bharatnet') || currentPath.endsWith('/bharatnet/') || currentPath === '/bharatnet' || currentPath === '/bharatnet/';

  // Query Dropbox folder to find existing GP submissions
  const checkExistingSubmissions = async (token) => {
    if (!token) return;
    try {
      const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: '' })
      });
      if (!response.ok) return;
      const data = await response.json();
      const files = data.entries.filter(
        (entry) => entry['.tag'] === 'file' && entry.name.endsWith('.jpg')
      );
      
      const gps = new Set();
      files.forEach((file) => {
        const parts = file.name.split('_');
        if (parts.length > 0) {
          gps.add(parts[0].toLowerCase().trim());
        }
      });
      setExistingGps(gps);
    } catch (e) {
      console.error("Error checking existing GP submissions:", e);
    }
  };

  // Load token from env (using Refresh Token flow if configured)
  useEffect(() => {
    const fetchRefreshedToken = async () => {
      const refreshToken = import.meta.env.VITE_DROPBOX_REFRESH_TOKEN;
      const clientId = import.meta.env.VITE_DROPBOX_CLIENT_ID;

      if (refreshToken && clientId) {
        try {
          const response = await fetch('https://api.dropbox.com/oauth2/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
              client_id: clientId
            })
          });
          if (response.ok) {
            const data = await response.json();
            if (data.access_token) {
              setDropboxToken(data.access_token);
              localStorage.setItem('dropbox_token', data.access_token);
              checkExistingSubmissions(data.access_token);
              return;
            }
          } else {
            console.error("Dropbox token refresh API returned error status:", response.status);
          }
        } catch (e) {
          console.error("Failed to refresh Dropbox token:", e);
        }
      }

      // Fallback to static token or localStorage
      const envToken = import.meta.env.VITE_DROPBOX_TOKEN;
      const savedToken = localStorage.getItem('dropbox_token');
      const activeToken = envToken || savedToken;
      
      if (activeToken) {
        setDropboxToken(activeToken);
        if (envToken && savedToken !== envToken) {
          localStorage.setItem('dropbox_token', envToken);
        }
        checkExistingSubmissions(activeToken);
      }
    };

    fetchRefreshedToken();
  }, []);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Bind stream when video element is rendered
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  // Load submissions when admin dashboard is active
  useEffect(() => {
    if (isAdminPath && isAdminAuthenticated && dropboxToken) {
      fetchSubmissions();
    }
  }, [currentPath, isAdminAuthenticated, dropboxToken]);

  // Fetch from Dropbox
  const fetchSubmissions = async () => {
    setIsSubmissionsLoading(true);
    try {
      const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${dropboxToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: '' })
      });
      if (!response.ok) throw new Error('Failed to retrieve file list from Dropbox');
      const data = await response.json();
      
      const files = data.entries.filter(
        (entry) => entry['.tag'] === 'file' && entry.name.endsWith('.jpg')
      );

      // Sort alphabetically descending (newest first based on timestamp)
      files.sort((a, b) => b.name.localeCompare(a.name));

      const parsedSubmissions = files.map((file) => {
        const parts = file.name.replace('.jpg', '').split('_');
        let gpName = 'Unknown';
        let latitude = 'N/A';
        let longitude = 'N/A';
        let timeStr = 'N/A';

        if (parts.length >= 5) {
          gpName = parts[0];
          latitude = parts[1];
          longitude = parts[2];
          timeStr = `${parts[3]} ${parts[4]?.replace(/-/g, ':') || ''}`;
        } else if (parts.length === 4) {
          gpName = parts[0];
          latitude = parts[1];
          longitude = parts[2];
          timeStr = parts[3]?.replace(/-/g, ':') || 'N/A';
        } else if (parts.length === 3) {
          gpName = parts[0];
          timeStr = `${parts[1]} ${parts[2]?.replace(/-/g, ':') || ''}`;
        } else if (parts.length === 2) {
          gpName = parts[0];
          timeStr = parts[1]?.replace(/-/g, ':') || 'N/A';
        }

        return {
          id: file.id,
          name: file.name,
          path: file.path_lower,
          gp: gpName,
          lat: latitude,
          lon: longitude,
          time: timeStr,
          imageUrl: ''
        };
      });

      // Deduplicate by GP name, keeping the first occurrence (which is the latest due to Z-A sorting)
      const uniqueSubmissions = [];
      const seenGps = new Set();
      for (const sub of parsedSubmissions) {
        const gpKey = sub.gp.trim().toLowerCase();
        if (gpKey && gpKey !== 'unknown') {
          if (!seenGps.has(gpKey)) {
            seenGps.add(gpKey);
            uniqueSubmissions.push(sub);
          }
        } else {
          uniqueSubmissions.push(sub);
        }
      }

      setSubmissions(uniqueSubmissions);

      // Resolve direct temporary image links in parallel
      const linksPromises = uniqueSubmissions.map(async (sub) => {
        try {
          const res = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${dropboxToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: sub.path })
          });
          if (res.ok) {
            const linkData = await res.json();
            return { ...sub, imageUrl: linkData.link, imageError: false };
          } else {
            const errText = await res.text();
            console.error(`Dropbox get_temporary_link failed for path "${sub.path}": Status ${res.status} - ${errText}`);
            return { ...sub, imageError: true };
          }
        } catch (e) {
          console.error('Error fetching image link', e);
          return { ...sub, imageError: true };
        }
      });

      const updatedSubmissions = await Promise.all(linksPromises);
      setSubmissions(updatedSubmissions);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmissionsLoading(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start Camera and Geolocation
  const startCameraAndLocation = () => {
    if (!gp) {
      alert('Please select a Gram Panchayat first.');
      return;
    }

    // Double check that GP hasn't been submitted in background
    if (existingGps.has(gp.toLowerCase().trim())) {
      alert('A submission already exists for this Gram Panchayat.');
      return;
    }

    setIsLoading(true);
    setStatus({ text: 'Requesting GPS location...', type: 'primary' });
    setPreviewUrl('');
    setImageBlob(null);

    if (!navigator.geolocation) {
      setStatus({ text: 'Geolocation is not supported by this browser.', type: 'danger' });
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        
        setStatus({ text: 'Fetching address details...', type: 'primary' });
        const address = await fetchAddress(lat, lon);

        // Save location details for stamping
        locationRef.current = { lat, lon, address };

        initCamera();
      },
      (error) => {
        setStatus({ text: 'Location access denied. Please enable GPS/Location settings.', type: 'danger' });
        setIsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Fetch address from OSM Nominatim with User-Agent header
  const fetchAddress = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        {
          headers: {
            'User-Agent': 'eMitra-GeoTag-Camera/1.0'
          }
        }
      );
      const data = await response.json();
      return data.display_name || 'Address not found';
    } catch (e) {
      return 'Failed to fetch address';
    }
  };

  // Init Webcam stream
  const initCamera = async () => {
    try {
      if (streamRef.current) stopCamera();

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      setCameraActive(true);
      setIsLoading(false);
      setStatus({ text: "Align camera and click 'Take Photo'.", type: 'muted' });
    } catch (err) {
      console.error(err);
      setStatus({ text: 'Failed to access camera. Please check permissions.', type: 'danger' });
      setIsLoading(false);
    }
  };

  // Text wrap utility
  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);
    return lines;
  };

  // Take photo & Stamp Canvas
  const takePhoto = () => {
    if (!streamRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Draw frame
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

    // Font styling
    const fontSize = Math.max(16, videoWidth * 0.03);
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;

    const { lat, lon, address } = locationRef.current;
    const line1 = `GP: ${gp} | PS: ${ps}`;
    const line2 = `Lat: ${lat || 'N/A'}, Long: ${lon || 'N/A'}`;
    const maxTextWidth = videoWidth - 40;
    const wrappedAddress = wrapText(ctx, `Address: ${address || 'N/A'}`, maxTextWidth);
    const allLines = [line1, line2, ...wrappedAddress];

    // Overlay Background Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    const padding = 15;
    const bgHeight = allLines.length * fontSize * 1.4 + padding * 2;
    ctx.fillRect(0, videoHeight - bgHeight, videoWidth, bgHeight);

    // Draw Text lines
    ctx.fillStyle = 'white';
    let startY = videoHeight - bgHeight + fontSize + padding;
    allLines.forEach((line) => {
      ctx.strokeText(line, 20, startY);
      ctx.fillText(line, 20, startY);
      startY += fontSize * 1.4;
    });

    // Export canvas to JPEG Data URL at 85% compression quality
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Attach GPS EXIF Metadata if coordinates are available
    let finalDataUrl = jpegDataUrl;
    if (lat && lon) {
      finalDataUrl = attachGpsMetadata(jpegDataUrl, parseFloat(lat), parseFloat(lon));
    }

    // Convert Data URL back to Blob for uploading and local preview
    const blob = dataUrlToBlob(finalDataUrl);
    setImageBlob(blob);
    setPreviewUrl(finalDataUrl);

    stopCamera();
    setStatus({ text: '', type: '' });
  };

  // Cloud upload
  const uploadToDropbox = async () => {
    if (!dropboxToken) {
      alert("Missing configuration. Access Token could not be loaded.");
      return;
    }
    if (!imageBlob) return;

    setIsUploading(true);
    setStatus({ text: 'Uploading photo...', type: 'primary' });

    // Generate filename with GP, Lat, Lon, and timestamp to prevent overwriting and allow parsing
    const { lat, lon } = locationRef.current;
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
    const fileName = `${gp}_${lat || '0'}_${lon || '0'}_${timestamp}.jpg`;

    try {
      const argStr = JSON.stringify({
        path: `/${fileName}`,
        mode: 'overwrite',
        autorename: false,
        mute: false
      });

      const uploadUrl = `https://content.dropboxapi.com/2/files/upload` +
         `?arg=${encodeURIComponent(argStr)}` +
         `&authorization=${encodeURIComponent(`Bearer ${dropboxToken}`)}` +
         `&reject_cors_preflight=true`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=dropbox-cors-hack'
        },
        body: imageBlob
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Dropbox upload error:", errText);
        throw new Error(errText || 'Upload failed');
      }

      setStatus({ text: `Successfully uploaded ${fileName}!`, type: 'success' });
      localStorage.setItem('geotag_submitted', 'true');
      
      // Update local set of submitted GPs
      const uploadedGp = gp.toLowerCase().trim();
      setExistingGps(prev => {
        const next = new Set(prev);
        next.add(uploadedGp);
        return next;
      });

      // Clear preview states and reset GP dropdown after 3 seconds
      setTimeout(() => {
        setPreviewUrl('');
        setImageBlob(null);
        setGp('');
        setStatus({ text: '', type: '' });
        setIsUploading(false);
        setAlreadySubmitted(true); // Lock this device
      }, 3000);
    } catch (err) {
      console.error(err);
      setStatus({ text: `Upload Error: ${err.message}`, type: 'danger' });
      setIsUploading(false);
    }
  };

  // Admin Login Submit Handler
  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    const envUsername = import.meta.env.VITE_ADMIN_USERNAME;
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (adminUsername === envUsername && adminPassword === envPassword) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
    } else {
      alert('Invalid admin credentials.');
    }
  };

  // Admin Logout Handler
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setAdminUsername('');
    setAdminPassword('');
  };

  // FILTERED SUBMISSIONS BY SEARCH TERM
  const filteredSubmissions = submissions.filter((sub) =>
    sub.gp.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Checks if currently selected GP already has a submission
  const isGpAlreadySubmitted = gp && existingGps.has(gp.toLowerCase().trim());

  // ==========================================
  // RENDER ADMIN ROUTE (BharatNET Admin)
  // ==========================================
  if (isAdminPath) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
        <header className="w-full bg-white border-b border-slate-200/80 px-6 py-4 flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigateTo('/')} 
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              ← Back to Portal
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <h1 className="text-sm sm:text-base font-bold text-slate-900">BharatNET Geo-Tag Dashboard</h1>
            </div>
          </div>
          {isAdminAuthenticated && (
            <button 
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold rounded-lg text-xs transition-all duration-200 flex items-center gap-1 cursor-pointer"
              onClick={handleAdminLogout}
            >
              <span>Logout</span> 🔒
            </button>
          )}
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 flex flex-col">
          {!isAdminAuthenticated ? (
            /* ADMIN LOGIN CARD */
            <div className="max-w-md w-full mx-auto my-auto bg-white rounded-2xl p-8 border border-slate-200/60 shadow-xl shadow-slate-100/50">
              <h2 className="text-2xl font-bold text-center text-slate-900 mb-6">Admin Access Login</h2>
              <form onSubmit={handleAdminLoginSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                    placeholder="Enter admin username"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    placeholder="Enter admin password"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-200/80 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                  Login to Dashboard
                </button>
              </form>
            </div>
          ) : (
            /* ADMIN DASHBOARD VIEW */
            <div className="flex-1 flex flex-col space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="w-full sm:max-w-md">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">🔍</span>
                    <input
                      type="text"
                      placeholder="Filter by Gram Panchayat (GP)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                    />
                  </div>
                </div>
                <button 
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-950 text-white font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  onClick={fetchSubmissions} 
                  disabled={isSubmissionsLoading}
                >
                  {isSubmissionsLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span>Refresh</span>
                    </>
                  )}
                </button>
              </div>

              {isSubmissionsLoading && submissions.length === 0 ? (
                <div className="my-auto py-16 text-center flex flex-col items-center justify-center space-y-4">
                  <svg className="animate-spin h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-slate-500 font-medium">Loading geotag entries from cloud storage...</p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="my-auto py-16 bg-white rounded-2xl border border-slate-200/60 shadow-sm text-center">
                  <span className="text-4xl">📂</span>
                  <p className="text-slate-500 font-medium mt-3">No geo-tag submissions found matching search criteria.</p>
                </div>
              ) : (
                /* RESPONSIVE DATA TABLE */
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gram Panchayat (GP)</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Panchayat Samiti (PS)</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stamped Photo</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">GPS Coordinates</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSubmissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <div className="font-semibold text-slate-900 text-sm">{sub.gp}</div>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <div className="text-slate-500 text-sm">Jayal</div>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <div 
                                className="w-20 h-15 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/60 shadow-inner cursor-zoom-in relative group"
                                onClick={() => sub.imageUrl && setSelectedImage(sub.imageUrl)}
                              >
                                {sub.imageUrl ? (
                                  <>
                                    <img src={sub.imageUrl} alt={sub.gp} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <span className="text-white text-xs">🔍</span>
                                    </div>
                                  </>
                                ) : sub.imageError ? (
                                  <div className="w-full h-full flex flex-col items-center justify-center p-1 text-[9px] text-center text-rose-500 font-medium leading-tight">
                                    <span>⚠️ Preview</span>
                                    <span className="text-[7.5px] text-slate-400">Unavailable</span>
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <div className="font-mono text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-md px-2 py-1 inline-block">
                                {sub.lat}, {sub.lon}
                              </div>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <div className="text-slate-500 text-sm">{sub.time}</div>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap text-right">
                              <a
                                href={`https://www.google.com/maps?q=${sub.lat},${sub.lon}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                <span>🗺️</span>
                                <span>View Map</span>
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* IMAGE ZOOM LIGHTBOX */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 cursor-zoom-out animate-fade-in" 
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl w-full flex items-center justify-center animate-scale-in">
              <img src={selectedImage} alt="Expanded Stamped Preview" className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl border border-slate-800" />
              <button 
                className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors cursor-pointer" 
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <footer className="w-full bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 mt-auto shadow-xs">
          <div>Developed and Maintained by</div>
          <div className="font-bold text-slate-800 mt-1">DoIT&C Block Jayal, Nagaur</div>
        </footer>
      </div>
    );
  }

  // ==========================================
  // RENDER BHARATNET CAMERA ROUTE
  // ==========================================
  if (isBharatNetPath) {
    if (alreadySubmitted) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
          <header className="w-full bg-white border-b border-slate-200/80 py-5 px-6 flex items-center shadow-xs">
            <button 
              onClick={() => navigateTo('/')} 
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer mr-auto"
            >
              ← Portal
            </button>
            <h1 className="text-base font-bold tracking-tight text-slate-900 mr-auto pr-10">BharatNET Geo-Tag</h1>
          </header>
          <main className="flex-1 w-full max-w-md mx-auto px-4 py-8 flex flex-col justify-center">
            <div className="bg-white rounded-2xl p-8 border border-slate-200/60 shadow-xl shadow-slate-100/50 text-center space-y-4 animate-fade-in">
              <div className="text-5xl">✅</div>
              <h2 className="text-2xl font-bold text-slate-900">Submission Complete</h2>
              <p className="text-slate-500 leading-relaxed text-sm">
                Your geo-tagged photo has been successfully submitted. Duplicate submissions from this device are restricted. Thank you!
              </p>
            </div>
          </main>
          <footer className="w-full bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 mt-auto shadow-xs">
            <div>Developed and Maintained by</div>
            <div className="font-bold text-slate-800 mt-1">DoIT&C Block Jayal, Nagaur</div>
          </footer>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
        <header className="w-full bg-white border-b border-slate-200/80 py-5 px-6 flex items-center shadow-xs">
          <button 
            onClick={() => navigateTo('/')} 
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer mr-auto"
          >
            ← Portal
          </button>
          <h1 className="text-base font-bold tracking-tight text-slate-900 mr-auto pr-10">BharatNET Geo-Tag</h1>
        </header>

        <main className="flex-1 w-full max-w-md mx-auto px-4 py-8 flex flex-col justify-center">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-xl shadow-slate-100/50 space-y-5 animate-fade-in">
            {/* Form inputs */}
            <div>
              <label htmlFor="gpSelect" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gram Panchayat (GP)</label>
              <select
                id="gpSelect"
                value={gp}
                onChange={(e) => setGp(e.target.value)}
                disabled={cameraActive || !!previewUrl}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">-- Select Gram Panchayat --</option>
                {GP_OPTIONS.map((opt) => {
                  const isSubmitted = existingGps.has(opt.toLowerCase().trim());
                  return (
                    <option key={opt} value={opt} disabled={isSubmitted}>
                      {opt} {isSubmitted ? '🔒 (Submitted)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Panchayat Samiti (PS)</label>
              <input 
                type="text" 
                value={ps} 
                readOnly 
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed focus:outline-none" 
              />
            </div>

            {/* Action buttons / stream */}
            {!cameraActive && !previewUrl && (
              <button 
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-200/80 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed disabled:shadow-none" 
                onClick={startCameraAndLocation}
                disabled={isLoading || isGpAlreadySubmitted}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Accessing Camera & GPS...</span>
                  </>
                ) : isGpAlreadySubmitted ? (
                  '⚠️ GP Already Submitted'
                ) : (
                  <>
                    <span className="text-lg">📷</span>
                    <span>Start Camera</span>
                  </>
                )}
              </button>
            )}

            {cameraActive && (
              <div className="space-y-4 animate-fade-in text-center">
                <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-inner">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] object-cover" />
                </div>
                <button 
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-md shadow-rose-200 hover:shadow-lg hover:shadow-rose-200/80 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer" 
                  onClick={takePhoto}
                >
                  <span>📸</span>
                  <span>Take Photo</span>
                </button>
              </div>
            )}

            {/* Status Display */}
            {status.text && (
              <div className={`px-4 py-3 rounded-xl text-xs font-semibold text-center mt-4 border ${
                status.type === 'primary' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                status.type === 'danger' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {status.text}
              </div>
            )}

            {/* Block Warning for duplicate GP */}
            {isGpAlreadySubmitted && !previewUrl && !cameraActive && (
              <div className="px-4 py-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-semibold text-center mt-4">
                ⚠️ A photo has already been submitted for this Gram Panchayat. Duplicate submissions are not allowed.
              </div>
            )}

            {/* Photo Preview & Retake / Submit workflow */}
            {previewUrl && (
              <div className="space-y-4 animate-scale-in text-center">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-50">
                  <img src={previewUrl} alt="Stamped Preview" className="w-full aspect-[4/3] object-cover" />
                </div>
                
                {!isUploading ? (
                  <div className="flex flex-col gap-3">
                    <button 
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-200/80 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer" 
                      onClick={uploadToDropbox}
                    >
                      <span>📤</span>
                      <span>Submit</span>
                    </button>
                    <button 
                      className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer" 
                      onClick={startCameraAndLocation}
                    >
                      <span>🔄</span>
                      <span>Retake Photo</span>
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 mt-4">
                    <svg className="animate-spin h-4 w-4 text-indigo-700" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Uploading photo...</span>
                  </div>
                )}
              </div>
            )}

            {/* Hidden Canvas */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </main>

        <footer className="w-full bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 mt-auto shadow-xs">
          <div>Developed and Maintained by</div>
          <div className="font-bold text-slate-800 mt-1">DoIT&C Block Jayal, Nagaur</div>
        </footer>
      </div>
    );
  }

  // ==========================================
  // RENDER LANDING PORTAL ROUTE (Default)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      <header className="w-full bg-white border-b border-slate-200/80 py-6 text-center shadow-xs">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Geo Tag Jayal</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Block Jayal Solutions Portal</p>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-900 tracking-tight">
            Integrated Solutions Portal
          </h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm">
            Select an active utility from the list below to complete inspections or access dashboard management consoles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
          {/* Solution 1: BharatNET GeoTag */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                🌐
              </div>
              <h3 className="text-lg font-bold text-slate-900">BharatNET GeoTag</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Automated high-precision camera capture tool with GPS EXIF embedding for audits of Gram Panchayat BharatNET broadband connections.
              </p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <button 
                onClick={() => navigateTo('/bharatnet')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-200 hover:shadow-lg transition-all duration-200 text-center cursor-pointer"
              >
                Launch Utility 🚀
              </button>
              <button 
                onClick={() => navigateTo('/bharatnet/admin')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs text-center transition-colors cursor-pointer"
              >
                Admin Console 🔑
              </button>
            </div>
          </div>

          {/* Placeholder Solution 2: Future Expansion */}
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 flex flex-col justify-center items-center text-center opacity-70 group">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl mb-3">
              🔒
            </div>
            <h3 className="text-base font-bold text-slate-500">e-Mitra GeoTag</h3>
            <p className="text-slate-400 text-xs max-w-xs mt-1 leading-relaxed">
              Future integration module for tracking local e-Mitra kiosks registration and active node setups.
            </p>
            <span className="mt-4 px-2.5 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-semibold uppercase tracking-wider">
              Coming Soon
            </span>
          </div>
        </div>
      </main>

      <footer className="w-full bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 mt-auto shadow-xs">
        <div>Developed and Maintained by</div>
        <div className="font-bold text-slate-800 mt-1">DoIT&C Block Jayal, Nagaur</div>
      </footer>
    </div>
  );
}
