import React from 'react';

export default function Portal() {
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
              <a 
                href="./bharatnet/"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-200 hover:shadow-lg transition-all duration-200 text-center cursor-pointer"
              >
                Launch Utility 🚀
              </a>
              <a 
                href="./bharatnet/admin"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs text-center transition-colors cursor-pointer"
              >
                Admin Console 🔑
              </a>
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
