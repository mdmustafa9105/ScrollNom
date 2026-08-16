// Location & Serviceability Helper Service for ScrollNom Delivery Engine

// Default Hyderabad Coordinates for Prototype (Paradise Biryani, Secunderabad & Banjara Hills)
export const DEFAULT_RESTAURANT_LOCATION = {
  latitude: 17.4435,
  longitude: 78.4891,
  name: 'Paradise Biryani Palace',
  address: 'SD Road, Secunderabad, Hyderabad'
};

export const DEFAULT_CUSTOMER_LOCATION = {
  latitude: 17.4375,
  longitude: 78.4482,
  address: 'Road No. 12, Banjara Hills, Hyderabad'
};

// Maximum Serviceability Radius in Kilometers
export const MAX_SERVICEABILITY_RADIUS_KM = 12.0;

// Haversine formula to compute distance in km between two GPS coordinates
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Verify if destination coordinates are within serviceable radius from restaurant
export const isServiceable = (pickupLat, pickupLng, deliveryLat, deliveryLng) => {
  const dist = calculateDistanceKm(pickupLat, pickupLng, deliveryLat, deliveryLng);
  return {
    serviceable: dist <= MAX_SERVICEABILITY_RADIUS_KM,
    distanceKm: parseFloat(dist.toFixed(2)),
    maxRadiusKm: MAX_SERVICEABILITY_RADIUS_KM
  };
};

// Calculate ETA in minutes based on distance (assuming avg speed ~25 km/h + 10 mins prep time)
export const calculateETA = (distanceKm, speedKmh = 25) => {
  const travelHours = distanceKm / speedKmh;
  const travelMinutes = Math.round(travelHours * 60);
  return Math.max(12, travelMinutes + 8);
};

// Interpolate rider location step along route ratio t (0 <= t <= 1)
export const interpolateLocation = (startLat, startLng, endLat, endLng, t) => {
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    latitude: parseFloat((startLat + (endLat - startLat) * clampedT).toFixed(6)),
    longitude: parseFloat((startLng + (endLng - startLng) * clampedT).toFixed(6))
  };
};
