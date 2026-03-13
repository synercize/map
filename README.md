# Netherlands Infrastructure Projects Map

Interactive map visualization of Netherlands infrastructure projects from MIRT 2026.

## Features

- 🗺️ OpenStreetMap integration with React Leaflet
- 📍 Color-coded markers by project status
- 🔍 Filter by region, type, and status
- 📊 Real-time statistics
- 💡 Interactive popups with project details
- 📱 Responsive design

## Installation

```bash
npm install
```

## Run Development Server

```bash
npm run dev
```

The application will open at http://localhost:3000

## Build for Production

```bash
npm run build
```

## Technologies

- React 18
- Vite
- React Leaflet
- OpenStreetMap
- PapaParse (CSV parsing)

## Project Structure

```
synercize-map/
├── public/
│   └── projects.csv          # Project data
├── src/
│   ├── App.jsx               # Main application component
│   ├── App.css               # Styling
│   ├── main.jsx              # Entry point
│   └── utils/
│       └── geocoding.js      # Location coordinates
├── index.html
├── package.json
└── vite.config.js
```
