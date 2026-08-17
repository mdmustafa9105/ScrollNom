import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin, Search, Locate, Check, Loader2, Navigation } from 'lucide-react';

// Reverse geocode using OpenStreetMap Nominatim
const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`, {
      headers: { 'Accept-Language': 'en' }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

// Forward geocode (search location)
const searchAddress = async (query) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=6&addressdetails=1`, {
      headers: { 'Accept-Language': 'en' }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
};

export const DeliveryMapModal = ({ isOpen, onClose, onConfirmAddress, currentAddress }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [position, setPosition] = useState([12.9716, 77.5946]); // Bengaluru default
  const [address, setAddress] = useState({
    label: currentAddress?.label || 'Home',
    street: currentAddress?.street || 'Locating address...',
    area: currentAddress?.area || 'Bengaluru, Karnataka',
    full: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [addressLabel, setAddressLabel] = useState(currentAddress?.label || 'Home');
  const [locatingUser, setLocatingUser] = useState(false);
  const searchTimeout = useRef(null);

  // Initialize and clean up Leaflet map directly
  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure modal DOM container is fully mounted and sized
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Clean up previous map instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Create Leaflet Map Instance
      const map = L.map(mapContainerRef.current, {
        center: position,
        zoom: 15,
        zoomControl: false
      });

      // Google-like clean OSM tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Custom Delivery Pin HTML icon
      const customPin = L.divIcon({
        html: `
          <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
            <div style="width:38px; height:38px; background:linear-gradient(135deg, #FF5743, #E6402C); border-radius:50% 50% 50% 0; transform:rotate(-45deg); display:flex; align-items:center; justify-content:center; box-shadow:0 6px 16px rgba(255,87,67,0.5); border:3px solid #fff;">
              <span style="transform:rotate(45deg); font-size:18px;">📍</span>
            </div>
            <div style="position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:10px; height:5px; background:rgba(0,0,0,0.25); border-radius:50%; filter:blur(1px);"></div>
          </div>
        `,
        className: 'custom-delivery-pin',
        iconSize: [44, 44],
        iconAnchor: [22, 44]
      });

      // Create Draggable Marker
      const marker = L.marker(position, {
        draggable: true,
        icon: customPin
      }).addTo(map);

      // Handle marker dragend
      marker.on('dragend', () => {
        const latlng = marker.getLatLng();
        const newCoords = [latlng.lat, latlng.lng];
        setPosition(newCoords);
        fetchAddress(latlng.lat, latlng.lng);
      });

      // Handle click anywhere on map
      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        const newCoords = [e.latlng.lat, e.latlng.lng];
        setPosition(newCoords);
        fetchAddress(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Force map to recalculate container size
      map.invalidateSize();

      // Trigger initial location check / reverse geocode
      if (navigator.geolocation) {
        setLocatingUser(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = [pos.coords.latitude, pos.coords.longitude];
            setPosition(coords);
            if (mapInstanceRef.current && markerRef.current) {
              mapInstanceRef.current.setView(coords, 16);
              markerRef.current.setLatLng(coords);
            }
            fetchAddress(coords[0], coords[1]);
            setLocatingUser(false);
          },
          () => {
            fetchAddress(position[0], position[1]);
            setLocatingUser(false);
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      } else {
        fetchAddress(position[0], position[1]);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Reverse geocoding helper
  const fetchAddress = async (lat, lng) => {
    setIsGeocoding(true);
    const data = await reverseGeocode(lat, lng);
    if (data && data.address) {
      const a = data.address;
      const street = [a.road, a.house_number, a.neighbourhood, a.suburb].filter(Boolean).join(', ');
      const area = [a.city || a.town || a.village || a.county, a.state].filter(Boolean).join(', ');
      setAddress({
        label: addressLabel,
        street: street || data.display_name?.split(',').slice(0, 2).join(', ') || 'Custom Location',
        area: area || 'India',
        full: data.display_name || ''
      });
    }
    setIsGeocoding(false);
  };

  // Search autocomplete
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchAddress(query);
      setSearchResults(results);
      setIsSearching(false);
    }, 350);
  };

  // Select Search Result
  const selectLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const coords = [lat, lng];

    setPosition(coords);
    setSearchResults([]);
    setSearchQuery('');

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo(coords, 16, { duration: 1 });
      markerRef.current.setLatLng(coords);
    }

    fetchAddress(lat, lng);
  };

  // GPS Locate Current User
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo(coords, 16, { duration: 1 });
          markerRef.current.setLatLng(coords);
        }
        fetchAddress(coords[0], coords[1]);
        setLocatingUser(false);
      },
      () => setLocatingUser(false),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleConfirm = () => {
    if (onConfirmAddress) {
      onConfirmAddress({
        label: addressLabel,
        street: address.street,
        area: address.area,
        lat: position[0],
        lng: position[1]
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  const labels = ['Home', 'Work', 'Hotel', 'Other'];

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px] max-h-[90vh]">
        
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-brand-coral/10 flex items-center justify-center text-brand-coral">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-brand-charcoal">Select Delivery Location</h3>
              <p className="text-[11px] text-brand-charcoal-muted">Choose your address on map</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SEARCH BOX */}
        <div className="px-4 py-2.5 bg-white relative z-20 border-b border-gray-100">
          <div className="flex items-center bg-gray-50 rounded-2xl px-3.5 py-2.5 border border-gray-200 focus-within:border-brand-coral focus-within:bg-white transition-all space-x-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search area, landmark, street..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 text-xs bg-transparent outline-none text-brand-charcoal placeholder-gray-400 font-medium"
            />
            {isSearching && <Loader2 className="w-4 h-4 text-brand-coral animate-spin shrink-0" />}
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto z-30 divide-y divide-gray-50 animate-fade-in">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => selectLocation(item)}
                  className="w-full text-left px-4 py-3 hover:bg-brand-coral/5 transition-colors flex items-start space-x-2.5"
                >
                  <MapPin className="w-4 h-4 text-brand-coral shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-brand-charcoal truncate">{item.display_name?.split(',')[0]}</p>
                    <p className="text-[10px] text-gray-400 truncate">{item.display_name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MAP CONTAINER */}
        <div className="flex-1 relative bg-gray-100 min-h-[220px]">
          <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '100%' }} />

          {/* Map floating prompt */}
          <div className="absolute top-3 left-3 right-3 z-[500] pointer-events-none flex justify-center">
            <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-gray-100 flex items-center space-x-1.5 text-[11px] font-semibold text-brand-charcoal">
              <Navigation className="w-3.5 h-3.5 text-brand-coral" />
              <span>Tap anywhere or drag pin to adjust</span>
            </div>
          </div>

          {/* GPS Locate Me Button */}
          <button
            onClick={handleLocateMe}
            className="absolute bottom-4 right-4 z-[500] w-11 h-11 bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center text-brand-coral hover:bg-gray-50 transition-all cursor-pointer"
            title="Use current GPS location"
          >
            {locatingUser ? (
              <Loader2 className="w-5 h-5 animate-spin text-brand-coral" />
            ) : (
              <Locate className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* BOTTOM ADDRESS PANEL */}
        <div className="p-4 bg-white border-t border-gray-100 space-y-3 z-10">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-brand-coral/10 flex items-center justify-center text-brand-coral shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              {isGeocoding ? (
                <div className="flex items-center space-x-2 py-1">
                  <Loader2 className="w-3.5 h-3.5 text-brand-coral animate-spin" />
                  <span className="text-xs text-brand-charcoal-muted">Fetching exact address...</span>
                </div>
              ) : (
                <>
                  <h4 className="font-bold text-sm text-brand-charcoal truncate">{address.street}</h4>
                  <p className="text-xs text-brand-charcoal-muted truncate">{address.area}</p>
                </>
              )}
            </div>
          </div>

          {/* Label selector */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-50">
            <span className="text-[11px] font-bold text-brand-charcoal-muted uppercase">Tag Address:</span>
            <div className="flex space-x-1.5">
              {labels.map((lbl) => (
                <button
                  key={lbl}
                  onClick={() => setAddressLabel(lbl)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    addressLabel === lbl
                      ? 'bg-brand-coral text-white shadow-soft'
                      : 'bg-gray-100 text-brand-charcoal hover:bg-gray-200'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 bg-brand-coral text-white font-extrabold text-sm rounded-2xl shadow-coral hover:bg-brand-coral-hover transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>CONFIRM LOCATION</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default DeliveryMapModal;
