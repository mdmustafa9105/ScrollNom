// Dynamic API Configuration for ScrollNom Three-Laptop Demonstration
// Dynamically resolves hostname so devices on the same LAN (http://<LAN_IP>:3000)
// automatically connect to http://<LAN_IP>:5000/api

const getHostname = () => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return window.location.hostname;
  }
  return 'localhost';
};

export const SERVER_HOST = `http://${getHostname()}:5000`;
export const API_BASE = `http://${getHostname()}:5000/api`;

export const getApiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};
