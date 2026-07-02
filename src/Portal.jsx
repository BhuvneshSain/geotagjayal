import React from 'react';

export default function Portal() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      <header className="w-full bg-white border-b border-slate-200/80 py-5 px-6 flex justify-between items-center shadow-xs">
        <div className="text-left">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Geo Tag Jayal</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Block Jayal Solutions Portal</p>
        </div>
        <a 
          href="./admin/"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-950 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <span>🔑</span>
          <span>Admin Portal</span>
        </a>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-900 tracking-tight">
            Integrated Solutions Portal
          </h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm">
            Select an active utility flow below to complete GPS-stamped photo submissions or access dashboard metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
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
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <a 
                href="./bharatnet/"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-200 hover:shadow-lg transition-all duration-200 text-center cursor-pointer"
              >
                Launch Utility 🚀
              </a>
            </div>
          </div>

          {/* Solution 2: Honeble PM Visit Live Webcast */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                🎥
              </div>
              <h3 className="text-lg font-bold text-slate-900">PM Visit Webcast</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                GPS geotagging camera for verification of crowd attendance at local BNRGSK Rajiv Gandhi Seva Kendras for the Hon'ble PM webcast.
              </p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <a 
                href="./pm_visit/"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-200 hover:shadow-lg transition-all duration-200 text-center cursor-pointer"
              >
                Launch Utility 🚀
              </a>
            </div>
          </div>

          {/* Placeholder Solution 3: e-Mitra GeoTag */}
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 flex flex-col justify-between items-center text-center opacity-70 group">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl mb-3">
                🔒
              </div>
              <h3 className="text-base font-bold text-slate-500">e-Mitra GeoTag</h3>
              <p className="text-slate-400 text-xs max-w-xs mt-1 leading-relaxed">
                Future integration module for tracking local e-Mitra kiosks registration and active node setups.
              </p>
            </div>
            <span className="mt-6 px-2.5 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-semibold uppercase tracking-wider">
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
