# GeoTag Jayal - Integrated Solutions Portal & Audit Utilities

This project is a multi-page Progressive Web App (PWA) built for Block Jayal, Nagaur, to capture geo-tagged, watermark-stamped, and EXIF-embedded photographs of Gram Panchayat infrastructure installations. It connects securely to Dropbox storage to manage submissions, audits, and deletions.

---

## Folder Structure

```text
GeoTag/
├── bharatnet/                  # BharatNET subproject
│   ├── admin/
│   │   └── index.html          # Admin Dashboard Entry (Vite entry)
│   ├── src/
│   │   ├── App.jsx             # Camera User UI & Admin Logic
│   │   └── main.jsx            # Entry script for BharatNET subproject
│   └── index.html              # User Camera Entry (Vite entry)
├── public/                     # Static assets & PWA configuration
│   ├── manifest.json           # Web App Manifest
│   └── sw.js                   # PWA Service Worker
├── src/                        # Root Portal (Global landing page)
│   ├── App.css                 # CSS styles & Tailwind configuration
│   ├── main.jsx                # Entry script for Portal page
│   └── Portal.jsx              # Portal homepage component
├── index.html                  # Root Portal entry (Vite entry)
├── vite.config.js              # Multi-page Vite configuration
├── package.json                # Project scripts and dependencies
├── PRD.md                      # Product Requirements Document
└── README.md                   # Setup and usage guide
```

---

## Requirements & Setup

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **npm** (comes with Node)

### 2. Install Dependencies
Run the following command in the project root directory:
```bash
npm install
```

### 3. Environment Variables (`.env`)
Create a `.env` file in the project root folder based on `.env.example`:
```env
# Admin Dashboard Authentication Credentials
VITE_ADMIN_USERNAME=your_username
VITE_ADMIN_PASSWORD=your_password

# Dropbox API Credentials (Recommended Refresh Token flow)
VITE_DROPBOX_REFRESH_TOKEN=your_dropbox_refresh_token_here
VITE_DROPBOX_CLIENT_ID=your_dropbox_app_key_here
VITE_DROPBOX_CLIENT_SECRET=your_dropbox_app_secret_here

# Fallback static token (Optional, expires in 4 hours)
VITE_DROPBOX_TOKEN=your_static_token_here
```

---

## Local Development

Start the local Vite development server:
```bash
npm run dev
```
The server will boot by default on `http://localhost:8000/geotagjayal/`.

- **Root Portal:** `http://localhost:8000/geotagjayal/`
- **BharatNET User Camera App:** `http://localhost:8000/geotagjayal/bharatnet/`
- **BharatNET Admin Console:** `http://localhost:8000/geotagjayal/bharatnet/admin`

---

## Production Build & Deployment

To build the static application assets:
```bash
npm run build
```
Vite generates a compiled output folder named `dist/` containing nested directory structures suitable for direct hosting on static hosting platforms like **GitHub Pages**.

### GitHub Pages Routing
Since this is structured as a physical multi-page application (separate folders for `bharatnet/index.html` and `bharatnet/admin/index.html`), refreshing paths directly on GitHub Pages does not result in 404 errors, eliminating the need for client-side spa redirection rules.
