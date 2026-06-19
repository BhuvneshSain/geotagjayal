# Product Requirements Document (PRD) - GeoTag Jayal Portal

## 1. Project Overview & Background
In Block Jayal, Nagaur, tracking infrastructure audits (such as BharatNET broadband installations) requires high-accuracy documentation. Field workers must verify that connections at Gram Panchayats (GPs) are active, and they must submit photos stamped with GPS coordinates to verify physical site presence. 

To solve this, the **GeoTag Jayal Portal** provides:
1. **A central landing portal** to choose between different utility flows (e.g. BharatNET, future e-Mitra integrations).
2. **A mobile-first audit app (BharatNET)** that uses the device camera and GPS, captures high-precision location coordinates, reverse-geocodes them, overlays location data on the photo canvas, and writes GPS EXIF metadata directly into the image file.
3. **An admin management console** that monitors submitted audits, displays insights, provides image lightbox expansion, and allows deletion of invalid submissions.
4. **Offline support** and direct home-screen installation by transforming the client into a Progressive Web App (PWA).

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
- Clean, premium grid of options.
- Dynamic hover states and mobile-responsive spacing.

### 4.2. BharatNET User Audit Tool (`/geotagjayal/bharatnet/`)
- **GP Selection:** User must select from a pre-defined list of 37 Gram Panchayats. GPs that are already uploaded are marked with a lock `🔒 (Submitted)` and disabled.
- **GPS & Address Verification:** Captures device coordinates via the Geolocation API (high accuracy). reverse geocodes latitude/longitude into a descriptive address using OSM Nominatim.
- **Camera Stream:** Centered, auto-scaling live camera feed with an environment facing mode (rear camera).
- **Watermarked Canvas Stamping:** Stuffs GP name, Panchayat Samiti, coordinates, and full address on a black semi-transparent overlay at the bottom of the captured JPEG.
- **EXIF GPS Embedding:** Injects latitude and longitude directly into the JPEG EXIF header.
- **Dropbox Secure Upload:** Converts canvas output to binary blob and uploads it via chunk-less API request with unique names containing coordinates and timestamp.
- **Device Submission Lock:** Once a photo is successfully submitted, sets a local flag to prevent multiple submissions from the same device.

### 4.3. BharatNET Admin Console (`/geotagjayal/bharatnet/admin`)
- **Credential Check:** Protected client-side dashboard with static environment credentials.
- **Insights/Metrics Grid:** Real-time statistics block:
  - **Total Submissions:** Total audited locations.
  - **Active GPs:** Unique GP names verified.
  - **Pending GPs:** Number of remaining GPs (out of 37).
  - **Latest Audited GP:** Latest Gram Panchayat submission name.
- **Responsive Submissions Table/List:**
  - **Desktop View:** Standard responsive data table with Serial Number (`#`), GP Name, PS Name, Image Thumbnail (zoom-able), coordinates, timestamp, Google Maps link, and delete button.
  - **Mobile View:** Table hides and renders a collection of card components, displaying all properties and actions clearly without horizontal table overflow.
- **Submission Deletion:** A confirmation-based delete button. Triggers file deletion via Dropbox API (`/files/delete_v2`) and pulls refreshed listings.

### 4.4. Progressive Web App (PWA)
- Custom manifest configuration for installability, theme settings, and device orientation.
- Service worker caching static assets (`index.html`, JavaScript, CSS stylesheets, icons, fonts) to allow loading the camera and portal tools offline.

---

## 5. Security & Privacy
- **Dropbox API Access Control:** Uses OAuth2 Refresh Token flow to dynamically retrieve temporary short-lived access tokens, ensuring long-term credentials are secure.
- **Sensitive Settings:** Client credentials and admin passwords are stored in environment files and injected securely during Vite build compilation.
