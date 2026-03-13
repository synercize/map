// Approximate coordinates for Dutch cities and locations
export const locationCoordinates = {
    // Cities
    'Amsterdam': [52.3676, 4.9041],
    'Rotterdam': [51.9225, 4.47917],
    'Utrecht': [52.0907, 5.1214],
    'Den Haag': [52.0705, 4.3007],
    'Groningen': [53.2194, 6.5665],
    'Eindhoven': [51.4416, 5.4697],
    'Nijmegen': [51.8126, 5.8372],
    'Leiden': [52.1601, 4.4970],
    'Almere': [52.3508, 5.2647],
    'Apeldoorn': [52.2112, 5.9699],
    'Arnhem': [51.9851, 5.8987],
    'Tilburg': [51.5555, 5.0913],
    'Breda': [51.5719, 4.7683],
    'Den Bosch': [51.6978, 5.3037],
    'Amersfoort': [52.1561, 5.3878],
    'Hoorn': [52.6426, 5.0597],
    'Lelystad': [52.5084, 5.4750],
    'Terneuzen': [51.3347, 3.8258],
    'Katwijk': [52.2056, 4.4178],
    'Rijswijk': [52.0380, 4.3261],
    'Dordrecht': [51.8133, 4.6900],
    'Boxtel': [51.5908, 5.3286],
    'Vught': [51.6539, 5.2883],
    'Barneveld': [52.1388, 5.5876],
    'Gorinchem': [51.8303, 4.9742],
    'Enschede': [52.2215, 6.8937],
    'Roermond': [51.1942, 5.9874],
    'Winterswijk': [51.9694, 6.7194],
    'Appingedam': [53.3217, 6.8581],
    'Zuidbroek': [53.1808, 6.8647],
    'IJmuiden': [52.4617, 4.6145],

    // Special locations
    'Afsluitdijk': [53.0564, 5.1995],
    'Schiphol': [52.3105, 4.7683],
    'Amsterdam Zuidas': [52.3356, 4.8739],
    'Amsterdam Centraal': [52.3789, 4.9003],
    'Rotterdam North': [51.9500, 4.4792],
    'Port of Rotterdam': [51.9244, 4.4777],
    'Metropoolregio Amsterdam': [52.3676, 4.9041],
    'Limburg': [51.4427, 6.0608],
    'Noord-Brabant/Utrecht': [51.9, 5.3],
    'Twente': [52.25, 6.75],
    'Nijmegen/Eindhoven corridor': [51.65, 5.65],
    'IJssel': [52.5, 6.0],
    'Friesland/Groningen': [53.2, 6.2],
    'Wadden Sea': [53.4, 5.5],
    'Zuid-Nederland': [51.5, 5.5],
    'National': [52.2, 5.5],
    'National Corridors': [52.2, 5.5],

    // Compound locations (take first city)
    'Schiphol/Amsterdam/Almere': [52.3105, 4.7683],
    'Amsterdam/Hoorn': [52.3676, 4.9041],
    'Almere/Lelystad': [52.3508, 5.2647],
    'Katwijk/Leiden': [52.2056, 4.4178],
    'Rijswijk/Rotterdam': [52.0380, 4.3261],
    'Rotterdam/Den Haag': [51.9225, 4.47917],
    'Leiden-Dordrecht': [52.1601, 4.4970],
    'Den Haag/Binckhorst': [52.0705, 4.3007],
    'Apeldoorn/Twente': [52.2112, 5.9699],
    'Arnhem/Nijmegen': [51.9851, 5.8987],
    'Tilburg/Breda': [51.5555, 5.0913],
    'Nijmegen-Roermond': [51.8126, 5.8372],
    'Ravenstein-Lith': [51.8, 5.55],
    'Arnhem-Winterswijk': [51.9851, 5.8987],
    'Lelystad-Groningen': [52.5084, 5.4750],
    'Enschede-Groningen': [52.2215, 6.8937],
    'Lemmer-Delfzijl': [52.85, 6.0],
};

export function getCoordinates(location) {
    // Try exact match first
    if (locationCoordinates[location]) {
        return locationCoordinates[location];
    }

    // Try to find a partial match
    const locationLower = location.toLowerCase();
    for (const [key, coords] of Object.entries(locationCoordinates)) {
        if (locationLower.includes(key.toLowerCase())) {
            return coords;
        }
    }

    // Default to center of Netherlands
    return [52.2, 5.5];
}
