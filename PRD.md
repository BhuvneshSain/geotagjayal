# Product Requirements Document (PRD) - GeoTag Jayal Portal

## 1. Project Overview & Background
In Block Jayal, Nagaur, tracking infrastructure audits (such as BharatNET broadband installations) requires high-accuracy documentation. Field workers must verify that connections at Gram Panchayats (GPs) are active, and they must submit photos stamped with GPS coordinates to verify physical site presence. 

To solve this, the **GeoTag Jayal Portal** provides:
1. **A central landing portal** to choose between different utility flows (BharatNET, PM Visit Webcast, and future e-Mitra integrations).
2. **A mobile-first audit app (BharatNET)** that uses the device camera and GPS, captures high-precision location coordinates, reverse-geocodes them, overlays location data on the photo canvas, and writes GPS EXIF metadata directly into the image file.
3. **A mobile-first crowd verification app (PM Visit Webcast)** that stamps coordinates, reverse-geocodes addresses, overlays GP BNRGSK Kiosk details, and uploads crowd verification photos.
4. **A unified admin management console** that monitors both BharatNET and PM Visit Webcast submissions, displays real-time block metrics, provides status filters (All/Submitted/Pending), sort tools, and allows deletion.
5. **Offline support** and direct home-screen installation by transforming the client into a Progressive Web App (PWA).

---

## 2. Key Objectives & Success Metrics
- **Ease of Access:** Support direct mobile installation (PWA) and operate on low-bandwidth cellular networks.
- **Data Integrity:** Prevent spoofing of GP selections by locking submissions from devices that have already submitted, checking existing files dynamically, and embedding hard EXIF coordinates.
- **Administrative Transparency:** Allow admins to track progress with real-time statistics (total Audited GPs vs Pending), and filter/search submissions.
- **Mobile Friendliness:** All views must render flawlessly on small mobile viewports (e.g. 360px width) up to desktop resolutions.

---

## 3. Technology Stack
- **Frontend Core:** HTML5, CSS3, React 18, Vite.
- **Styling:** Tailwind CSS v4.0.
- **Storage & Backend:** Serverless architecture backed by Dropbox API v2.
  - File storage, list folder, dynamic temporary image links, and deletions occur directly via client-to-Dropbox secure API calls.
  - Token refresh bypasses CORS via a basic-auth secure request to `corsproxy.io` using the OAuth2 client ID and secret.
- **EXIF Metadata Injection:** `piexifjs` for inserting GPS tags (Latitude, LatitudeRef, Longitude, LongitudeRef, DateStamp) into JPEG images.
- **Geocoding:** OpenStreetMap Nominatim reverse geocoding API.
- **PWA Capabilities:** Web App Manifest (`manifest.json`) and Service Worker (`sw.js`).

---

## 4. Feature Requirements

### 4.1. Root Portal
- Serves as the index page (`/geotagjayal/`).
- Clean, premium 3-column grid of options matching modern CSS styling.
- Consolidated "Admin Portal" navigation link in the header.

### 4.2. BharatNET User Audit Tool (`/geotagjayal/bharatnet/`)
- **GP Selection:** User must select from a pre-defined list of 37 Gram Panchayats. GPs that are already uploaded are marked with a lock `🔒 (Submitted)` and disabled.
- **GPS & Address Verification:** Captures device coordinates via the Geolocation API (high accuracy). Reverse geocodes latitude/longitude into a descriptive address using OSM Nominatim.
- **Camera Stream:** Centered, auto-scaling live camera feed with an environment facing mode (rear camera).
- **Watermarked Canvas Stamping:** Stuffs GP name, Panchayat Samiti, coordinates, and full address on a black semi-transparent overlay at the bottom of the captured JPEG.
- **EXIF GPS Embedding:** Injects latitude and longitude directly into the JPEG EXIF header.
- **Dropbox Secure Upload:** Converts canvas output to binary blob and uploads it via chunk-less API request under the root Dropbox directory with unique names.
- **Device Submission Lock:** Once a photo is successfully submitted, sets `geotag_submitted` to prevent multiple submissions from the same device.

### 4.3. PM Visit Webcast User Audit Tool (`/geotagjayal/pm_visit/`)
- **GP & BNRGSK Selection:** Selects from 37 Gram Panchayats (35 from the BNRGSK list, plus `CHHAJOLI` and `DUGASTAU` with no kiosks).
- **Dynamic Kiosk Info Display:** Dynamically displays the corresponding BNRGSK **Kiosk Name** and **Kiosk Code** fields when a GP is selected.
- **Camera & Stamping:** Watermarks the photo with `PM Live Webcast | GP: {gp} | Kiosk: {kioskName}` and `Kiosk Code: {kioskCode} | Lat, Long`.
- **Dropbox Secure Partition:** Uploads crowd verification images under the isolated `/pm_visit` directory in Dropbox.
- **Device Submission Lock:** Employs a dedicated `pm_visit_submitted` localStorage key to prevent duplicates.

### 4.4. Unified Admin Console (`/geotagjayal/admin/`)
- **Consolidated Credentials:** Log in once using static block environment credentials.
- **Switchable Subproject Tabs:** Toggle between **BharatNET Audits** and **PM Webcast Crowd** verification sheets. Toggles query parameters dynamically (e.g. `?project=pm_visit`).
- **Interactive Metric Panels:** Real-time statistics: Total uploaded photos, Stamped GPs done vs pending (e.g. out of 38 or 37), and Latest GP uploaded.
- **Auditing Grid Layout with Status Filters**:
  - **All / Submitted / Pending filters**: Displays the entire list of Jayal GPs. Submitted GPs display image previews and coordinates. Pending GPs are styled with a grayed-out layout to clearly show outstanding audits.
  - **Sort Controls**: Dropdown to sort by GP Name (A-Z or Z-A) or Date (Newest or Oldest First).
  - **Action buttons**: Direct maps coordinate mapping (Google Maps link) and deletion triggers via Dropbox API `/files/delete_v2`.

### 4.5. Progressive Web App (PWA)
- Custom manifest configuration for installability, theme settings, and device orientation.
- Service worker caching static assets including `/admin/` and `/pm_visit/` entry paths to allow loading the camera and portal tools offline.

---

## 5. Security & Privacy
- **Dropbox API Access Control:** Uses OAuth2 Refresh Token flow to dynamically retrieve temporary short-lived access tokens, ensuring long-term credentials are secure.
- **Sensitive Settings:** Client credentials and admin passwords are stored in environment files and injected securely during Vite build compilation.
