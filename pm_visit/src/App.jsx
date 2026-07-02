import React, { useState, useEffect, useRef } from 'react';
import * as piexif from 'piexifjs';

const GP_OPTIONS = [
  { gp: "AKORA", kiosk: "HARI RAM KULIYA", code: "K11263956" },
  { gp: "ANWALIYASAR", kiosk: "JASRAM", code: "K112173050" },
  { gp: "BARNEL", kiosk: "RAKESH MEGHWAL", code: "K112180743" },
  { gp: "BHAWLA", kiosk: "ARJUN RAM SEWADA", code: "K112105465" },
  { gp: "BUGARDA", kiosk: "SURESH KURI", code: "K112107601" },
  { gp: "CHHAJOLI", kiosk: "No Kiosk", code: "N/A" },
  { gp: "CHHAPRA", kiosk: "RAMPRASAD", code: "K112183183" },
  { gp: "DEH", kiosk: "MOOLCHAND CHANWARIYA", code: "K112334566" },
  { gp: "DHARNA", kiosk: "SOBHA RAM", code: "K112143755" },
  { gp: "DHEHARI", kiosk: "JITU RAM", code: "K112102197" },
  { gp: "DOTINA", kiosk: "PREMA RAM", code: "K112141833" },
  { gp: "DUGASTAU", kiosk: "No Kiosk", code: "N/A" },
  { gp: "DUGOLI", kiosk: "MANIRAM BASAT", code: "K112123330" },
  { gp: "GORAU", kiosk: "JAY PRAKASH", code: "K112105449" },
  { gp: "GUGRIYALI", kiosk: "RAJESH REWAR", code: "K112233763" },
  { gp: "JALNIYASAR", kiosk: "PUKHA RAJ", code: "K112280104" },
  { gp: "JHARELI", kiosk: "KANA RAM", code: "K112115324" },
  { gp: "JOCHEENA", kiosk: "OM PRAKASH SINWAR", code: "K112105441" },
  { gp: "KAMEDIYA", kiosk: "DINESH MEHRA", code: "K24044390" },
  { gp: "KATHOTI", kiosk: "SURESH SANKHALA", code: "K112113630" },
  { gp: "KHATOO KALAN", kiosk: "HANUMAN RAM", code: "K112105467" },
  { gp: "KHERAT", kiosk: "LOON SINGH", code: "K24024052" },
  { gp: "KHINYALA", kiosk: "DINESH KUMAR RATTAWA", code: "K112105419" },
  { gp: "MANGLOD", kiosk: "ARJUN RAM", code: "K112321040" },
  { gp: "PEENDIYA", kiosk: "SHER SINGH", code: "K112169176" },
  { gp: "PHARDOD", kiosk: "RAJU BIDIYASAR", code: "K112117976" },
  { gp: "RAJOD", kiosk: "NARENDRA REWAR", code: "K112102201" },
  { gp: "RATANGA", kiosk: "DILIP BHAKAR", code: "K112102209" },
  { gp: "ROHINA", kiosk: "VIKRAM TIWARI", code: "K112334441" },
  { gp: "ROTOO", kiosk: "JAY PRAKASH", code: "K112114524" },
  { gp: "SANDEELA", kiosk: "HANUMAN PURI", code: "K112105450" },
  { gp: "SOMNA", kiosk: "SABIR KHILJI", code: "K11261364" },
  { gp: "SONELI", kiosk: "PREMA RAM BHAMBU", code: "K24022787" },
  { gp: "SURPALIYA", kiosk: "HARI RAM KHICHAR", code: "K112105428" },
  { gp: "TANGLA", kiosk: "SHYAM SUNDER SHARMA", code: "K112105452" },
  { gp: "TANWARA", kiosk: "PANKAJ SHARMA", code: "K112218337" },
  { gp: "TARNAU", kiosk: "NAWAL KISHOR", code: "K112149275" }
];

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

const attachGpsMetadata = (dataUrl, lat, lon) => {
  try {
    const latRef = lat >= 0 ? 'N' : 'S';
    const lonRef = lon >= 0 ? 'E' : 'W';

    const gpsData = {};
    gpsData[piexif.GPSIFD.GPSLatitudeRef] = latRef;
    gpsData[piexif.GPSIFD.GPSLatitude] = degToDmsRational(lat);
    gpsData[piexif.GPSIFD.GPSLongitudeRef] = lonRef;
    gpsData[piexif.GPSIFD.GPSLongitude] = degToDmsRational(lon);

    const now = new Date();
    gpsData[piexif.GPSIFD.GPSDateStamp] = now.toISOString().slice(0, 10).replace(/-/g, ':');

    const exifObj = { GPS: gpsData };
    const exifBytes = piexif.dump(exifObj);

    return piexif.insert(exifBytes, dataUrl);
  } catch (error) {
    console.error("Error attaching GPS metadata:", error);
    return dataUrl;
  }
};

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
  const [gp, setGp] = useState('');
  const [dropboxToken, setDropboxToken] = useState('');
  const [status, setStatus] = useState({ text: '', type: '' });
  const [cameraActive, setCameraActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageBlob, setImageBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(
    localStorage.getItem('pm_visit_submitted') === 'true'
  );
  const [existingGps, setExistingGps] = useState(new Set());

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const locationRef = useRef({ lat: null, lon: null, address: '' });

  // Get matching kiosk info
  const selectedGpData = GP_OPTIONS.find((opt) => opt.gp === gp) || { kiosk: '', code: '' };

  const checkExistingSubmissions = async (token) => {
    if (!token) return;
    try {
      const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: '/pm_visit' })
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
      console.error("Error checking existing submissions:", e);
    }
  };

  useEffect(() => {
    const fetchRefreshedToken = async () => {
      const refreshToken = import.meta.env.VITE_DROPBOX_REFRESH_TOKEN;
      const clientId = import.meta.env.VITE_DROPBOX_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_DROPBOX_CLIENT_SECRET;

      if (refreshToken && clientId && clientSecret) {
        try {
          const response = await fetch('https://corsproxy.io/?https://api.dropbox.com/oauth2/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: refreshToken
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
          }
        } catch (e) {
          console.error("Failed to refresh token:", e);
        }
      }

      const envToken = import.meta.env.VITE_DROPBOX_TOKEN;
      const savedToken = localStorage.getItem('dropbox_token');
      const activeToken = envToken || savedToken;

      if (activeToken) {
        setDropboxToken(activeToken);
        checkExistingSubmissions(activeToken);
      }
    };

    fetchRefreshedToken();
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCameraAndLocation = () => {
    if (!gp) {
      alert('Please select a Gram Panchayat first.');
      return;
    }

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

  const fetchAddress = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        {
          headers: {
            'User-Agent': 'PM-Visit-Webcast-Camera/1.0'
          }
        }
      );
      const data = await response.json();
      return data.display_name || 'Address not found';
    } catch (e) {
      return 'Failed to fetch address';
    }
  };

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
      setStatus({ text: "Align camera to capture crowd attending the webcast, then click 'Take Photo'.", type: 'muted' });
    } catch (err) {
      console.error(err);
      setStatus({ text: 'Failed to access camera. Please check permissions.', type: 'danger' });
      setIsLoading(false);
    }
  };

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

  const takePhoto = () => {
    if (!streamRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

    const fontSize = Math.max(16, videoWidth * 0.03);
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;

    const { lat, lon, address } = locationRef.current;
    const line1 = `PM Live Webcast | GP: ${gp} | Kiosk: ${selectedGpData.kiosk}`;
    const line2 = `Kiosk Code: ${selectedGpData.code} | Lat: ${lat || 'N/A'}, Long: ${lon || 'N/A'}`;
    const maxTextWidth = videoWidth - 40;
    const wrappedAddress = wrapText(ctx, `Address: ${address || 'N/A'}`, maxTextWidth);
    const allLines = [line1, line2, ...wrappedAddress];

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    const padding = 15;
    const bgHeight = allLines.length * fontSize * 1.4 + padding * 2;
    ctx.fillRect(0, videoHeight - bgHeight, videoWidth, bgHeight);

    ctx.fillStyle = 'white';
    let startY = videoHeight - bgHeight + fontSize + padding;
    allLines.forEach((line) => {
      ctx.strokeText(line, 20, startY);
      ctx.fillText(line, 20, startY);
      startY += fontSize * 1.4;
    });

    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    let finalDataUrl = jpegDataUrl;
    if (lat && lon) {
      finalDataUrl = attachGpsMetadata(jpegDataUrl, parseFloat(lat), parseFloat(lon));
    }

    const blob = dataUrlToBlob(finalDataUrl);
    setImageBlob(blob);
    setPreviewUrl(finalDataUrl);

    stopCamera();
    setStatus({ text: '', type: '' });
  };

  const uploadToDropbox = async () => {
    if (!dropboxToken) {
      alert("Missing configuration. Access Token could not be loaded.");
      return;
    }
    if (!imageBlob) return;

    setIsUploading(true);
    setStatus({ text: 'Uploading photo...', type: 'primary' });

    const { lat, lon } = locationRef.current;
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
    const fileName = `${gp}_${lat || '0'}_${lon || '0'}_${timestamp}.jpg`;

    try {
      const argStr = JSON.stringify({
        path: `/pm_visit/${fileName}`,
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
        throw new Error(errText || 'Upload failed');
      }

      setStatus({ text: `Successfully uploaded ${fileName}!`, type: 'success' });
      localStorage.setItem('pm_visit_submitted', 'true');

      const uploadedGp = gp.toLowerCase().trim();
      setExistingGps(prev => {
        const next = new Set(prev);
        next.add(uploadedGp);
        return next;
      });

      setTimeout(() => {
        setPreviewUrl('');
        setImageBlob(null);
        setGp('');
        setStatus({ text: '', type: '' });
        setIsUploading(false);
        setAlreadySubmitted(true);
      }, 3000);
    } catch (err) {
      setStatus({ text: `Upload Error: ${err.message}`, type: 'danger' });
      setIsUploading(false);
    }
  };

  const isGpAlreadySubmitted = gp && existingGps.has(gp.toLowerCase().trim());

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
        <header className="w-full bg-white border-b border-slate-200/80 py-5 px-6 flex items-center shadow-xs">
          <button
            onClick={() => window.location.href = '../'}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer mr-auto"
          >
            ← Portal
          </button>
          <h1 className="text-base font-bold tracking-tight text-slate-900 mr-auto pr-10">Hon'ble PM Visit Webcast</h1>
        </header>
        <main className="flex-1 w-full max-w-md mx-auto px-4 py-8 flex flex-col justify-center">
          <div className="bg-white rounded-2xl p-8 border border-slate-200/60 shadow-xl shadow-slate-100/50 text-center space-y-4 animate-fade-in">
            <div className="text-5xl">✅</div>
            <h2 className="text-2xl font-bold text-slate-900">Submission Complete</h2>
            <p className="text-slate-500 leading-relaxed text-sm">
              Your geotagged photo of the webcast crowd has been successfully submitted. Duplicate submissions from this device are restricted. Thank you!
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
          onClick={() => window.location.href = '../'}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer mr-auto"
        >
          ← Portal
        </button>
        <h1 className="text-base font-bold tracking-tight text-slate-900 mr-auto pr-10">Hon'ble PM Visit Webcast</h1>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-8 flex flex-col justify-center">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-xl shadow-slate-100/50 space-y-5 animate-fade-in">
          <div>
            <label htmlFor="gpSelect" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gram Panchayat (GP)</label>
            <select
              id="gpSelect"
              value={gp}
              onChange={(e) => setGp(e.target.value)}
              disabled={cameraActive || !!previewUrl}
              className="w-full px-4 py-3.5 min-h-[48px] bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">-- Select Gram Panchayat --</option>
              {GP_OPTIONS.map((opt) => {
                const isSubmitted = existingGps.has(opt.gp.toLowerCase().trim());
                return (
                  <option key={opt.gp} value={opt.gp} disabled={isSubmitted}>
                    {opt.gp} {isSubmitted ? '🔒 (Submitted)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kiosk Name</label>
            <input
              type="text"
              value={selectedGpData.kiosk}
              readOnly
              placeholder="Auto-filled BNRGSK Kiosk"
              className="w-full px-4 py-3.5 min-h-[48px] bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed focus:outline-none font-medium placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kiosk Code</label>
            <input
              type="text"
              value={selectedGpData.code}
              readOnly
              placeholder="Auto-filled Code"
              className="w-full px-4 py-3.5 min-h-[48px] bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed focus:outline-none font-mono placeholder-slate-400"
            />
          </div>

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
                <span>Take Photo of Crowd</span>
              </button>
            </div>
          )}

          {status.text && (
            <div className={`px-4 py-3 rounded-xl text-xs font-semibold text-center mt-4 border ${status.type === 'primary' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  status.type === 'danger' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                    'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
              {status.text}
            </div>
          )}

          {isGpAlreadySubmitted && !previewUrl && !cameraActive && (
            <div className="px-4 py-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-semibold text-center mt-4">
              ⚠️ A photo has already been submitted for this Gram Panchayat. Duplicate submissions are not allowed.
            </div>
          )}

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
