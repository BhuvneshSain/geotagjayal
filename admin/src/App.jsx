import React, { useState, useEffect } from 'react';

const BHARATNET_GP_OPTIONS = [
  "Akora", "Anwaliyasar", "Barnel", "Bhawla", "Bugarda", "Chhajoli", "Chhapra",
  "Deh", "Dharna", "Dhehari", "Dotina", "Dugastau", "Dugoli", "Gorau",
  "Gugriyali", "Jalniyasar", "Jayal", "Jhareli", "Jocheena", "Kamediya",
  "Kathoti", "Khatoo Kalan", "Kherat", "Khinyala", "Manglod", "Peendiya",
  "Phardod", "Rajod", "Ratanga", "Rohina", "Rotoo", "Sandeela", "Somna",
  "Soneli", "Surpaliya", "Tangla", "Tanwara", "Tarnau"
];

const PM_VISIT_GP_OPTIONS = [
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

export default function App() {
  const [activeProject, setActiveProject] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const proj = params.get('project');
    return proj === 'pm_visit' ? 'pm_visit' : 'bharatnet';
  });

  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    sessionStorage.getItem('admin_authenticated') === 'true'
  );

  const [dropboxToken, setDropboxToken] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [status, setStatus] = useState({ text: '', type: '' });
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'submitted' | 'pending'
  const [sortBy, setSortBy] = useState('gp-asc'); // 'gp-asc' | 'gp-desc' | 'date-desc' | 'date-asc'

  // Update query param when switching tabs
  const handleProjectChange = (project) => {
    setActiveProject(project);
    const url = new URL(window.location);
    url.searchParams.set('project', project);
    window.history.pushState({}, '', url);
  };

  // Get current access token
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
              return;
            }
          }
        } catch (e) {
          console.error("Failed to refresh token:", e);
        }
      }

      // Fallback
      const envToken = import.meta.env.VITE_DROPBOX_TOKEN;
      const savedToken = localStorage.getItem('dropbox_token');
      const activeToken = envToken || savedToken;
      if (activeToken) {
        setDropboxToken(activeToken);
      }
    };

    fetchRefreshedToken();
  }, []);

  // Fetch submissions when token or active project changes
  useEffect(() => {
    if (isAdminAuthenticated && dropboxToken) {
      fetchSubmissions();
    }
  }, [activeProject, isAdminAuthenticated, dropboxToken]);

  const fetchSubmissions = async () => {
    setIsSubmissionsLoading(true);
    setSubmissions([]);
    const path = activeProject === 'pm_visit' ? '/pm_visit' : '';

    try {
      const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${dropboxToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path })
      });

      // Handle folder not created yet gracefully
      if (response.status === 409 || response.status === 404) {
        setSubmissions([]);
        setIsSubmissionsLoading(false);
        return;
      }

      if (response.status === 401) {
        setDropboxToken('');
        localStorage.removeItem('dropbox_token');
        throw new Error('Dropbox token is invalid or expired');
      }

      if (!response.ok) throw new Error('Failed to retrieve file list');
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

        // Match Kiosk fields for pm_visit
        let kioskName = 'N/A';
        let kioskCode = 'N/A';
        if (activeProject === 'pm_visit') {
          const match = PM_VISIT_GP_OPTIONS.find(
            (o) => o.gp.toLowerCase().trim() === gpName.toLowerCase().trim()
          );
          if (match) {
            kioskName = match.kiosk;
            kioskCode = match.code;
          }
        }

        return {
          id: file.id,
          name: file.name,
          path: file.path_lower,
          gp: gpName,
          kioskName,
          kioskCode,
          lat: latitude,
          lon: longitude,
          time: timeStr,
          imageUrl: ''
        };
      });

      // Deduplicate by GP name, keeping the latest one
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

      // Fetch temporary URLs in parallel
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
          }
          return { ...sub, imageError: true };
        } catch (e) {
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

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setAdminUsername('');
    setAdminPassword('');
  };

  const handleDeleteSubmission = async (sub) => {
    const confirmation = window.confirm(`Are you sure you want to delete the geotag submission for Gram Panchayat: ${sub.gp}?`);
    if (!confirmation) return;

    try {
      setIsSubmissionsLoading(true);
      setStatus({ text: 'Deleting submission...', type: 'primary' });

      const response = await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dropboxToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: sub.path })
      });

      if (!response.ok) {
        throw new Error('Delete operation failed');
      }

      await fetchSubmissions();
      alert(`Submission for ${sub.gp} was successfully deleted.`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmissionsLoading(false);
      setStatus({ text: '', type: '' });
    }
  };

  const activeGpOptions = activeProject === 'pm_visit' ? PM_VISIT_GP_OPTIONS : BHARATNET_GP_OPTIONS;
  const activeGpLength = activeGpOptions.length;
  const submittedGpsCount = submissions.filter(s => s.gp !== 'Unknown').length;

  const allRows = (() => {
    const unlistedSubmissions = submissions.filter(s => {
      return !activeGpOptions.some(gpOption => {
        const gpNameStr = typeof gpOption === 'string' ? gpOption : gpOption.gp;
        return s.gp.toLowerCase().trim() === gpNameStr.toLowerCase().trim();
      });
    });

    const listedRows = activeGpOptions.map(gpOption => {
      const gpNameStr = typeof gpOption === 'string' ? gpOption : gpOption.gp;
      const kioskName = typeof gpOption === 'string' ? 'N/A' : gpOption.kiosk;
      const kioskCode = typeof gpOption === 'string' ? 'N/A' : gpOption.code;

      const matched = submissions.find(s => s.gp.toLowerCase().trim() === gpNameStr.toLowerCase().trim());

      if (matched) {
        return {
          ...matched,
          isSubmitted: true,
          kioskName: matched.kioskName !== 'N/A' ? matched.kioskName : kioskName,
          kioskCode: matched.kioskCode !== 'N/A' ? matched.kioskCode : kioskCode
        };
      } else {
        return {
          id: `pending-${gpNameStr}`,
          gp: gpNameStr,
          kioskName,
          kioskCode,
          lat: '—',
          lon: '—',
          time: '—',
          imageUrl: '',
          isSubmitted: false
        };
      }
    });

    return [
      ...listedRows,
      ...unlistedSubmissions.map(s => ({ ...s, isSubmitted: true }))
    ];
  })();

  let processedRows = allRows.filter(row => 
    row.gp.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (statusFilter === 'submitted') {
    processedRows = processedRows.filter(row => row.isSubmitted);
  } else if (statusFilter === 'pending') {
    processedRows = processedRows.filter(row => !row.isSubmitted);
  }

  processedRows.sort((a, b) => {
    if (sortBy === 'gp-asc') {
      return a.gp.localeCompare(b.gp);
    } else if (sortBy === 'gp-desc') {
      return b.gp.localeCompare(a.gp);
    } else if (sortBy === 'date-desc') {
      if (a.time === '—') return 1;
      if (b.time === '—') return -1;
      return b.time.localeCompare(a.time);
    } else if (sortBy === 'date-asc') {
      if (a.time === '—') return 1;
      if (b.time === '—') return -1;
      return a.time.localeCompare(b.time);
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      <header className="w-full bg-white border-b border-slate-200/80 px-6 py-4 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.location.href = '../'}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            ← Back to Portal
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔑</span>
            <h1 className="text-sm sm:text-base font-bold text-slate-900">Unified Geo-Tag Dashboard</h1>
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
          <div className="flex-1 flex flex-col space-y-6 animate-fade-in">
            {/* Dropbox Config Alert Fallback */}
            {!dropboxToken && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800 space-y-3 shadow-xs animate-scale-in">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <h4 className="font-bold text-amber-900">Dropbox API Credentials Missing</h4>
                </div>
                <p className="text-xs leading-relaxed text-amber-700">
                  No valid Dropbox Access Token or Refresh Token was found in the environment configurations or local storage. Please input a temporary Dropbox Access Token (or a Refresh Token) to fetch the submissions:
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch max-w-xl">
                  <input
                    type="password"
                    placeholder="Paste Dropbox token here..."
                    className="flex-1 px-4 py-2 bg-white border border-amber-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-500"
                    id="manualTokenInput"
                  />
                  <button
                    onClick={() => {
                      const inputVal = document.getElementById('manualTokenInput')?.value?.trim();
                      if (inputVal) {
                        localStorage.setItem('dropbox_token', inputVal);
                        setDropboxToken(inputVal);
                        alert('Token saved to local storage! Reloading submissions...');
                      } else {
                        alert('Please enter a valid token string.');
                      }
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Save & Load
                  </button>
                </div>
              </div>
            )}

            {/* Project Selection Tabs */}
            <div className="flex bg-slate-200/60 p-1 rounded-xl w-fit">
              <button
                onClick={() => handleProjectChange('bharatnet')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeProject === 'bharatnet' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                🌐 BharatNET Audits
              </button>
              <button
                onClick={() => handleProjectChange('pm_visit')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeProject === 'pm_visit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                🎥 PM Webcast Crowd
              </button>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs hover:shadow-md transition-all duration-300 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                  📸
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 leading-tight">{submissions.length}</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Total Uploaded Photos</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs hover:shadow-md transition-all duration-300 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                  ✅
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 leading-tight">
                    {submittedGpsCount} <span className="text-sm font-normal text-slate-400">/ {activeGpLength}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Active GPs Stamped</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs hover:shadow-md transition-all duration-300 flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                  ⏳
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 leading-tight">
                    {Math.max(0, activeGpLength - submittedGpsCount)}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Pending Audits</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs hover:shadow-md transition-all duration-300 flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                  🕒
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-bold text-slate-900 leading-tight truncate">
                    {submissions.length > 0 ? submissions[0].gp : 'N/A'}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">Latest Audited GP</div>
                </div>
              </div>
            </div>

            {/* Filter, Sort and Refresh Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">🔍</span>
                  <input
                    type="text"
                    placeholder="Search Gram Panchayat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-200"
                  />
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    {['all', 'submitted', 'pending'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          statusFilter === filter
                            ? 'bg-white text-slate-900 shadow-xs border border-slate-200/40'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                  >
                    <option value="gp-asc">GP Name (A-Z)</option>
                    <option value="gp-desc">GP Name (Z-A)</option>
                    <option value="date-desc">Date (Newest First)</option>
                    <option value="date-asc">Date (Oldest First)</option>
                  </select>
                </div>
              </div>

              <button
                className="w-full lg:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-950 text-white font-semibold rounded-xl text-xs transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                onClick={fetchSubmissions}
                disabled={isSubmissionsLoading}
              >
                {isSubmissionsLoading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
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
                <p className="text-slate-500 font-medium">Loading entries from cloud storage...</p>
              </div>
            ) : processedRows.length === 0 ? (
              <div className="my-auto py-16 bg-white rounded-2xl border border-slate-200/60 shadow-sm text-center">
                <span className="text-4xl">📂</span>
                <p className="text-slate-500 font-medium mt-3">No geotag submissions found matching search criteria.</p>
              </div>
            ) : (
              <>
                {/* DESKTOP TABLE VIEW */}
                <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gram Panchayat (GP)</th>
                          {activeProject === 'pm_visit' && (
                            <>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kiosk Name</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kiosk Code</th>
                            </>
                          )}
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stamped Photo</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">GPS Coordinates</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {processedRows.map((row, idx) => (
                          <tr key={row.id} className={`hover:bg-slate-50/50 transition-colors ${!row.isSubmitted ? 'bg-slate-50/30 text-slate-400/80' : ''}`}>
                            <td className="px-6 py-4.5 whitespace-nowrap text-xs font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap font-semibold text-slate-900 text-sm">
                              <div className="flex items-center gap-2">
                                <span>{row.gp}</span>
                                {!row.isSubmitted && (
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 border border-slate-200 rounded text-[9px] font-bold uppercase tracking-wider select-none">
                                    Pending
                                  </span>
                                )}
                              </div>
                            </td>
                            {activeProject === 'pm_visit' && (
                              <>
                                <td className="px-6 py-4.5 whitespace-nowrap text-slate-600 text-sm">
                                  {row.kioskName}
                                </td>
                                <td className="px-6 py-4.5 whitespace-nowrap text-slate-600 text-sm font-mono">
                                  {row.kioskCode}
                                </td>
                              </>
                            )}
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              {row.isSubmitted ? (
                                <div
                                  className="w-20 h-15 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/60 shadow-inner cursor-zoom-in relative group"
                                  onClick={() => row.imageUrl && setSelectedImage(row.imageUrl)}
                                >
                                  {row.imageUrl ? (
                                    <>
                                      <img src={row.imageUrl} alt={row.gp} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white text-xs">🔍</span>
                                      </div>
                                    </>
                                  ) : row.imageError ? (
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
                              ) : (
                                <div className="w-20 h-15 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-semibold select-none">
                                  —
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              {row.isSubmitted ? (
                                <div className="font-mono text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-md px-2 py-1 inline-block">
                                  {row.lat}, {row.lon}
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs italic">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap text-slate-500 text-sm">
                              {row.time}
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap text-right">
                              {row.isSubmitted ? (
                                <div className="flex items-center justify-end gap-2">
                                  <a
                                    href={`https://www.google.com/maps?q=${row.lat},${row.lon}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-indigo-100"
                                  >
                                    <span>🗺️</span>
                                    <span>View Map</span>
                                  </a>
                                  <button
                                    onClick={() => handleDeleteSubmission(row)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-rose-100"
                                  >
                                    <span>🗑️</span>
                                    <span>Delete</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs font-bold uppercase tracking-wider bg-slate-100/50 px-2.5 py-1 rounded border border-slate-200/50 select-none">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MOBILE CARD VIEW */}
                <div className="block md:hidden space-y-4">
                  {processedRows.map((row, idx) => (
                    row.isSubmitted ? (
                      <div key={row.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs space-y-4 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 rounded-md px-2 py-1 leading-none">
                              #{idx + 1}
                            </span>
                            <h4 className="font-bold text-slate-900 text-base">{row.gp}</h4>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div
                            className="w-24 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-inner shrink-0 cursor-zoom-in relative group"
                            onClick={() => row.imageUrl && setSelectedImage(row.imageUrl)}
                          >
                            {row.imageUrl ? (
                              <img src={row.imageUrl} alt={row.gp} className="w-full h-full object-cover" />
                            ) : row.imageError ? (
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

                          <div className="flex-1 space-y-1.5 min-w-0 text-xs">
                            {activeProject === 'pm_visit' && (
                              <>
                                <div className="text-slate-600"><span className="font-semibold text-slate-500">Kiosk:</span> {row.kioskName}</div>
                                <div className="text-slate-600 font-mono"><span className="font-semibold text-slate-500">Code:</span> {row.kioskCode}</div>
                              </>
                            )}
                            <div className="font-mono text-slate-600 bg-slate-50 border border-slate-100 rounded-md px-2 py-1 inline-block truncate max-w-full">
                              📍 {row.lat}, {row.lon}
                            </div>
                            <div className="text-slate-500 flex items-center gap-1">
                              <span>📅</span>
                              <span className="truncate">{row.time}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <a
                            href={`https://www.google.com/maps?q=${row.lat},${row.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-indigo-100"
                          >
                            <span>🗺️</span>
                            <span>View Map</span>
                          </a>

                          <button
                            onClick={() => handleDeleteSubmission(row)}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 border border-rose-100"
                          >
                            <span>🗑️</span>
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={row.id} className="bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between opacity-80">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 bg-slate-100/80 rounded-md px-2 py-1 leading-none">
                              #{idx + 1}
                            </span>
                            <h4 className="font-bold text-slate-500 text-sm sm:text-base">{row.gp}</h4>
                          </div>
                          {activeProject === 'pm_visit' && (
                            <div className="text-[11px] text-slate-400 leading-normal">
                              <div><span className="font-medium text-slate-400">Kiosk:</span> {row.kioskName}</div>
                              <div className="font-mono mt-0.5"><span className="font-medium text-slate-400">Code:</span> {row.kioskCode}</div>
                            </div>
                          )}
                        </div>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-400 border border-slate-200 rounded-full text-[10px] font-bold uppercase tracking-wider select-none">
                          Pending
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </>
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
