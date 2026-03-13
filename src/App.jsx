import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, WMSTileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Papa from "papaparse";
import "leaflet/dist/leaflet.css";
import "./App.css";
import dataCSV from "./Data.csv?raw";
import descCSV from "./Desc.csv?raw";
import hub1CSV from "./hub1.csv?raw";
import hub2CSV from "./hub2.csv?raw";
import hub3CSV from "./hub3.csv?raw";
import hub4CSV from "./hub4.csv?raw";
import hub5CSV from "./hub5.csv?raw";
import hub6CSV from "./hub6.csv?raw";
import hub7CSV from "./hub7.csv?raw";
import hub8CSV from "./hub8.csv?raw";
import hub9CSV from "./hub9.csv?raw";
import hub10CSV from "./hub10.csv?raw";

const hubCSVs = {
   1: hub1CSV,
   2: hub2CSV,
   3: hub3CSV,
   4: hub4CSV,
   5: hub5CSV,
   6: hub6CSV,
   7: hub7CSV,
   8: hub8CSV,
   9: hub9CSV,
   10: hub10CSV,
};

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
   iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
   iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
   shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// 10 distinct colors for hub assignments
const HUB_COLORS = [
   "#e74c3c", // red
   "#3498db", // blue
   "#2ecc71", // green
   "#f39c12", // orange
   "#9b59b6", // purple
   "#1abc9c", // teal
   "#e67e22", // dark orange
   "#16a085", // dark teal
   "#c0392b", // dark red
   "#8e44ad", // dark purple
];

// Helper: extract the latest numeric year from strings like "2026", "2029 - 2032", "2025-2027", "N/A"
const parseEndYear = (dateStr) => {
   if (!dateStr || dateStr.trim() === "N/A") return null;
   const years = dateStr.match(/\d{4}/g);
   if (!years) return null;
   return Math.max(...years.map(Number));
};

// Helper function to offset overlapping markers
const offsetCoordinates = (projects) => {
   const coordMap = new Map();

   // Group projects by coordinates
   projects.forEach((project, index) => {
      const key = `${project.coordinates[0]},${project.coordinates[1]}`;
      if (!coordMap.has(key)) {
         coordMap.set(key, []);
      }
      coordMap.get(key).push({ ...project, originalIndex: index });
   });

   // Offset overlapping markers in a circle pattern
   const result = [];
   coordMap.forEach((projectsAtLocation, key) => {
      if (projectsAtLocation.length === 1) {
         result.push(projectsAtLocation[0]);
      } else {
         // Multiple projects at same location - create circular offset
         const radius = 0.015; // Offset radius in degrees
         projectsAtLocation.forEach((project, i) => {
            const angle = (2 * Math.PI * i) / projectsAtLocation.length;
            const offsetLat = project.coordinates[0] + radius * Math.cos(angle);
            const offsetLng = project.coordinates[1] + radius * Math.sin(angle);
            result.push({
               ...project,
               coordinates: [offsetLat, offsetLng],
               isOffset: true,
               groupSize: projectsAtLocation.length,
            });
         });
      }
   });

   return result;
};

// Phase colors
const phaseColors = {
   Construction: "#e74c3c",
   Planning: "#3498db",
   Exploration: "#9b59b6",
   Research: "#f39c12",
};

// Custom marker icon — accepts a direct color string
const createCustomIcon = (color) => {
   return L.divIcon({
      className: "custom-marker",
      html: `<div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
   });
};

// Hub location marker (diamond shape, colored by hub)
const createHubIcon = (color) => {
   return L.divIcon({
      className: "hub-marker",
      html: `<div style="
        width: 0;
        height: 0;
        border-left: 13px solid transparent;
        border-right: 13px solid transparent;
        border-bottom: 22px solid ${color};
        filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));
        position: relative;
      "><div style="
        position: absolute;
        top: 3px;
        left: -10px;
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-bottom: 17px solid #1a1a1a;
      "></div></div>`,
      iconSize: [26, 22],
      iconAnchor: [13, 22],
   });
};

// Legend component
const Legend = ({ selectedScenario, hubColorMap }) => {
   if (selectedScenario && hubColorMap && hubColorMap.size > 0) {
      return (
         <div className="legend">
            <h3>Hubs — {selectedScenario}</h3>
            {Array.from(hubColorMap.entries()).map(([hubId, color]) => (
               <div key={hubId} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: color }}></div>
                  <span>Hub {hubId}</span>
               </div>
            ))}
         </div>
      );
   }
   return (
      <div className="legend">
         <h3>Phase Legend</h3>
         {Object.entries(phaseColors).map(([phase, color]) => (
            <div key={phase} className="legend-item">
               <div className="legend-color" style={{ backgroundColor: color }}></div>
               <span>{phase}</span>
            </div>
         ))}
      </div>
   );
};

// Filter component
const FilterPanel = ({ projects, filters, setFilters }) => {
   const types = [...new Set(projects.map((p) => p.Type).filter(Boolean))].sort();
   const phases = [...new Set(projects.map((p) => p.Phase).filter(Boolean))].sort();

   const allEndYears = new Set();
   projects.forEach((p) => {
      const year = parseEndYear(p["End Date"]);
      if (year) allEndYears.add(year);
   });
   const years = [...allEndYears].sort((a, b) => a - b);

   return (
      <div className="filter-panel">
         <h3>Filters</h3>

         <div className="filter-group">
            <label>Type:</label>
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
               <option value="">All Types</option>
               {types.map((type) => (
                  <option key={type} value={type}>
                     {type}
                  </option>
               ))}
            </select>
         </div>

         <div className="filter-group">
            <label>Phase:</label>
            <select value={filters.phase} onChange={(e) => setFilters({ ...filters, phase: e.target.value })}>
               <option value="">All Phases</option>
               {phases.map((phase) => (
                  <option key={phase} value={phase}>
                     {phase}
                  </option>
               ))}
            </select>
         </div>

         <div className="filter-group">
            <label>End Year:</label>
            <select value={filters.endYear} onChange={(e) => setFilters({ ...filters, endYear: e.target.value })}>
               <option value="">All Years</option>
               {years.map((year) => (
                  <option key={year} value={year}>
                     {year}
                  </option>
               ))}
            </select>
         </div>

         <div className="filter-group">
            <label>End Year Range:</label>
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
               <input
                  type="number"
                  placeholder="From"
                  value={filters.yearFrom}
                  onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })}
                  style={{ width: "70px" }}
               />
               <span>-</span>
               <input
                  type="number"
                  placeholder="To"
                  value={filters.yearTo}
                  onChange={(e) => setFilters({ ...filters, yearTo: e.target.value })}
                  style={{ width: "70px" }}
               />
            </div>
         </div>

         <button
            className="clear-filters"
            onClick={() => setFilters({ type: "", phase: "", endYear: "", yearFrom: "", yearTo: "" })}
         >
            Clear Filters
         </button>
      </div>
   );
};

function App() {
   const [projects, setProjects] = useState([]);
   const [filteredProjects, setFilteredProjects] = useState([]);
   const [filters, setFilters] = useState({
      type: "",
      phase: "",
      endYear: "",
      yearFrom: "",
      yearTo: "",
   });
   const [loading, setLoading] = useState(true);
   const [showTable, setShowTable] = useState(false);

   // CEMT Classes with Colors
   const cemtClasses = [
      { label: "0", color: "#95a5a6" }, // Grey
      { label: "I", color: "#81c784" }, // Light Green
      { label: "II", color: "#4caf50" }, // Green
      { label: "III", color: "#2e7d32" }, // Dark Green
      { label: "IV", color: "#64b5f6" }, // Light Blue
      { label: "Va", color: "#2196f3" }, // Blue
      { label: "Vb", color: "#1565c0" }, // Dark Blue
      { label: "VIa", color: "#ba68c8" }, // Light Purple
      { label: "VIb", color: "#9c27b0" }, // Purple
      { label: "VIc", color: "#7b1fa2" }, // Dark Purple
   ];

   const [showWaterways, setShowWaterways] = useState(true);
   const [selectedScenario, setSelectedScenario] = useState(3); // Default to 3 hubs
   const [hubAssignments, setHubAssignments] = useState({}); // projectName → hubId
   const [uniqueHubs, setUniqueHubs] = useState([]); // [{id, lat, lon, totalDemand}]
   // Initialize with ALL classes selected
   const [cemtFilters, setCemtFilters] = useState(cemtClasses.map((c) => c.label));

   const handleCemtToggle = (value) => {
      setCemtFilters((prev) => {
         if (prev.includes(value)) {
            return prev.filter((c) => c !== value);
         }
         return [...prev, value];
      });
   };

   useEffect(() => {
      if (!selectedScenario) {
         setHubAssignments({});
         setUniqueHubs([]);
         return;
      }
      const results = Papa.parse(hubCSVs[selectedScenario], { header: true, skipEmptyLines: true });
      const assignments = {};
      const hubMap = {};
      results.data.forEach((row) => {
         const hubId = parseInt(row.hub_assigned);
         assignments[row.Name] = hubId;
         if (!hubMap[hubId]) {
            hubMap[hubId] = {
               id: hubId,
               lat: parseFloat(row.hub_lat),
               lon: parseFloat(row.hub_lon),
               totalDemand: parseInt(row.hub_total_demand) || 0,
            };
         }
      });
      setHubAssignments(assignments);
      setUniqueHubs(Object.values(hubMap).sort((a, b) => a.id - b.id));
   }, [selectedScenario]);

   useEffect(() => {
      const dataResults = Papa.parse(dataCSV, { header: true, skipEmptyLines: true });
      const descResults = Papa.parse(descCSV, { header: true, skipEmptyLines: true });

      const descMap = {};
      descResults.data.forEach((d) => {
         descMap[d.Name] = d.Description;
      });

      const projectsWithCoords = dataResults.data
         .map((p) => ({
            ...p,
            coordinates: [parseFloat(p.Latitude), parseFloat(p.Longitude)],
            Description: descMap[p.Name] || "",
         }))
         .filter((p) => !isNaN(p.coordinates[0]) && !isNaN(p.coordinates[1]));

      setProjects(projectsWithCoords);
      setFilteredProjects(projectsWithCoords);
      setLoading(false);
   }, []);

   useEffect(() => {
      // Apply filters
      let filtered = projects;

      if (filters.type) {
         filtered = filtered.filter((p) => p.Type === filters.type);
      }
      if (filters.phase) {
         filtered = filtered.filter((p) => p.Phase === filters.phase);
      }
      if (filters.endYear) {
         const year = parseInt(filters.endYear);
         filtered = filtered.filter((p) => parseEndYear(p["End Date"]) === year);
      }
      if (filters.yearFrom || filters.yearTo) {
         filtered = filtered.filter((p) => {
            const year = parseEndYear(p["End Date"]);
            if (!year) return false;
            const from = filters.yearFrom ? parseInt(filters.yearFrom) : -Infinity;
            const to = filters.yearTo ? parseInt(filters.yearTo) : Infinity;
            return year >= from && year <= to;
         });
      }

      // Apply offset to overlapping markers
      const filteredWithOffset = offsetCoordinates(filtered);
      setFilteredProjects(filteredWithOffset);
   }, [filters, projects]);

   if (loading) {
      return <div className="loading">Loading projects...</div>;
   }

   // Derive hub color map
   const hubColorMap = new Map(uniqueHubs.map((h, i) => [h.id, HUB_COLORS[i % HUB_COLORS.length]]));

   // Construct CQL Filter and Key for Waterways
   let waterwaysCqlFilter = null;
   if (cemtFilters.length === cemtClasses.length) {
      // All classes selected -> No filter (Show All efficient)
      waterwaysCqlFilter = null;
   } else if (cemtFilters.length === 0) {
      // No classes selected -> Filter to nothing
      waterwaysCqlFilter = "1=2";
   } else {
      // Subset selected
      waterwaysCqlFilter = `classification IN ('${cemtFilters.join("','")}')`;
   }

   // Key to force re-render when params change
   const waterwaysLayerKey = `waterways-${cemtFilters.sort().join("-")}-${showWaterways}`;

   return (
      <div className="App">
         {showTable && (
            <div className="table-modal">
               <div className="table-container">
                  <div className="table-header">
                     <h2>Projects List ({filteredProjects.length} projects)</h2>
                     <button className="close-table-btn" onClick={() => setShowTable(false)}>
                        ✕
                     </button>
                  </div>
                  <div className="table-wrapper">
                     <table>
                        <thead>
                           <tr>
                              <th>Name</th>
                              <th>Type</th>
                              <th>Phase</th>
                              <th>Start</th>
                              <th>End</th>
                              <th>Description</th>
                           </tr>
                        </thead>
                        <tbody>
                           {filteredProjects.map((project, index) => (
                              <tr key={index}>
                                 <td>{project.Name}</td>
                                 <td>{project.Type}</td>
                                 <td>{project.Phase}</td>
                                 <td>{project["Start Date"]}</td>
                                 <td>{project["End Date"]}</td>
                                 <td>{project.Description}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         <div className="content">
            <div className="sidebar">
               <header style={{ borderRadius: "8px", marginBottom: "10px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }}>
                  <h4>Netherlands Infrastructure Projects</h4>
                  <p>MIRT 2026</p>
                  <button className="show-table-btn" onClick={() => setShowTable(!showTable)}>
                     {showTable ? "Hide" : "Show"} Projects Table
                  </button>
               </header>

               <div className="filter-panel" style={{ marginBottom: "15px" }}>
                  <div
                     style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                     }}
                  >
                     <h3 style={{ margin: 0 }}>Waterways (CEMT)</h3>
                     <label
                        className="switch"
                        style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}
                     >
                        <input
                           type="checkbox"
                           checked={showWaterways}
                           onChange={(e) => setShowWaterways(e.target.checked)}
                           style={{ cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "12px" }}>{showWaterways ? "On" : "Off"}</span>
                     </label>
                  </div>

                  {showWaterways && (
                     <div className="cemt-filters">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                           {cemtClasses.map((cls) => {
                              const isSelected = cemtFilters.includes(cls.label);
                              return (
                                 <button
                                    key={cls.label}
                                    // onClick={() => handleCemtToggle(cls.label)}
                                    style={{
                                       padding: "4px 8px",
                                       borderRadius: "4px",
                                       border: isSelected ? `2px solid ${cls.color}` : "1px solid #ddd",
                                       backgroundColor: isSelected ? cls.color : "#f8f9fa",
                                       color: isSelected ? "white" : "#999",
                                       cursor: "pointer",
                                       fontSize: "12px",
                                       flex: "1 0 30px",
                                       textAlign: "center",
                                       fontWeight: isSelected ? "bold" : "normal",
                                       boxShadow: isSelected ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                                       opacity: isSelected ? 1 : 0.6,
                                    }}
                                 >
                                    {cls.label}
                                 </button>
                              );
                           })}
                        </div>
                        {/* <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                                    <button 
                                        onClick={() => setCemtFilters(cemtClasses.map(c => c.label))}
                                        style={{
                                            flex: 1,
                                            padding: '4px', 
                                            fontSize: '11px', 
                                            backgroundColor: '#eee', 
                                            border: 'none', 
                                            borderRadius: '4px',
                                            cursor: 'pointer' 
                                        }}
                                    >
                                        Show All
                                    </button>
                                    <button 
                                        onClick={() => setCemtFilters([])}
                                        style={{
                                            flex: 1,
                                            padding: '4px', 
                                            fontSize: '11px', 
                                            backgroundColor: '#eee', 
                                            border: 'none', 
                                            borderRadius: '4px',
                                            cursor: 'pointer' 
                                        }}
                                    >
                                        Hide All
                                    </button>
                                </div> */}
                     </div>
                  )}
               </div>

               <div className="filter-panel" style={{ marginBottom: "15px" }}>
                  <h3 style={{ margin: 0, marginBottom: "10px" }}>Hub numbers</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                     {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <button
                           key={n}
                           onClick={() => setSelectedScenario(selectedScenario === n ? null : n)}
                           style={{
                              padding: "5px 9px",
                              borderRadius: "4px",
                              border: selectedScenario === n ? "2px solid #2c3e50" : "1px solid #ddd",
                              backgroundColor: selectedScenario === n ? "#2c3e50" : "#f8f9fa",
                              color: selectedScenario === n ? "white" : "#666",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: selectedScenario === n ? "bold" : "normal",
                              minWidth: "32px",
                              textAlign: "center",
                           }}
                        >
                           {n}
                        </button>
                     ))}
                  </div>
                  {selectedScenario && (
                     <p style={{ fontSize: "11px", color: "#888", margin: "6px 0 0" }}>
                        {uniqueHubs.length} hub{uniqueHubs.length !== 1 ? "s" : ""} · click again to deselect
                     </p>
                  )}
               </div>

               <FilterPanel projects={projects} filters={filters} setFilters={setFilters} />
               <Legend selectedScenario={selectedScenario} hubColorMap={hubColorMap} />
               <div className="stats">
                  <h3>Statistics</h3>
                  <p>
                     Total Projects: <strong>{projects.length}</strong>
                  </p>
                  <p>
                     Showing: <strong>{filteredProjects.length}</strong>
                  </p>
               </div>
            </div>

            <div className="map-container">
               <MapContainer center={[52.1326, 5.2913]} zoom={8} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                     attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                     url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />

                  {showWaterways && (
                     <WMSTileLayer
                        key={waterwaysLayerKey}
                        url="https://service.pdok.nl/rws/vnds/wms/v2_0"
                        layers="l_navigability"
                        format="image/png"
                        transparent={true}
                        styles="bevaarbaarheid"
                        attribution='&copy; <a href="https://www.pdok.nl">PDOK</a>'
                        params={{
                           cql_filter: waterwaysCqlFilter,
                        }}
                     />
                  )}

                  {filteredProjects.map((project, index) => {
                     const markerColor =
                        selectedScenario && hubAssignments[project.Name] != null
                           ? hubColorMap.get(hubAssignments[project.Name]) || "#34495e"
                           : phaseColors[project.Phase] || "#34495e";
                     return (
                        <Marker key={index} position={project.coordinates} icon={createCustomIcon(markerColor)}>
                           <Popup>
                              <div className="popup-content">
                                 <h3>{project.Name}</h3>
                                 {project.isOffset && (
                                    <p style={{ color: "#e67e22", fontSize: "12px", marginBottom: "8px" }}>
                                       📍 {project.groupSize} projects at this location
                                    </p>
                                 )}
                                 <p>
                                    <strong>Type:</strong> {project.Type}
                                 </p>
                                 <p>
                                    <strong>Phase:</strong> {project.Phase}
                                 </p>
                                 <p>
                                    <strong>Start:</strong> {project["Start Date"]}
                                 </p>
                                 <p>
                                    <strong>End:</strong> {project["End Date"]}
                                 </p>
                                 {project.Description && (
                                    <p style={{ fontSize: "12px", marginTop: "8px", color: "#555" }}>
                                       {project.Description}
                                    </p>
                                 )}
                              </div>
                           </Popup>
                        </Marker>
                     );
                  })}

                  {selectedScenario &&
                     uniqueHubs.map((hub) => (
                        <Marker
                           key={`hub-${hub.id}`}
                           position={[hub.lat, hub.lon]}
                           icon={createHubIcon(hubColorMap.get(hub.id) || "#2c3e50")}
                        >
                           <Popup>
                              <div className="popup-content">
                                 <h3>Hub {hub.id}</h3>
                                 <p>
                                    <strong>Total Demand:</strong> {hub.totalDemand.toLocaleString()} tons
                                 </p>
                                 <p>
                                    <strong>Location:</strong> {hub.lat.toFixed(4)}, {hub.lon.toFixed(4)}
                                 </p>
                              </div>
                           </Popup>
                        </Marker>
                     ))}
               </MapContainer>
            </div>
         </div>
      </div>
   );
}

export default App;
