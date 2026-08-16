import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';
import { Bike, Navigation, CheckCircle2, Phone, MapPin, RefreshCw, Play, ShieldCheck } from 'lucide-react';

export const RiderOpsPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDeliveries = async () => {
    try {
      const res = await fetch(`${API_BASE}/rider/deliveries`);
      if (res.ok) {
        const json = await res.json();
        setDeliveries(json.data || []);
      }
    } catch (err) {
      console.error('[RIDER OPS FETCH ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (deliveryId, newStatus, extraLat = null, extraLng = null) => {
    setActionLoading(deliveryId);
    try {
      const body = { status: newStatus };
      if (extraLat !== null) body.latitude = extraLat;
      if (extraLng !== null) body.longitude = extraLng;

      const res = await fetch(`${API_BASE}/delivery/${deliveryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        await fetchDeliveries();
      }
    } catch (err) {
      console.error('[RIDER STATUS UPDATE ERROR]', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Step GPS location towards customer destination
  const handleStepGPS = async (delivery) => {
    const pLat = delivery.pickupLocation?.latitude || 17.4435;
    const pLng = delivery.pickupLocation?.longitude || 78.4891;
    const dLat = delivery.deliveryLocation?.latitude || 17.4375;
    const dLng = delivery.deliveryLocation?.longitude || 78.4482;
    const cLat = delivery.riderLocation?.latitude || pLat;
    const cLng = delivery.riderLocation?.longitude || pLng;

    // Advance latitude & longitude 25% closer to destination
    const nextLat = parseFloat((cLat + (dLat - cLat) * 0.35).toFixed(6));
    const nextLng = parseFloat((cLng + (dLng - cLng) * 0.35).toFixed(6));

    await handleUpdateStatus(delivery.deliveryId, 'out_for_delivery', nextLat, nextLng);
  };

  return (
    <div className="min-h-screen bg-brand-charcoal text-white p-4 lg:p-8 space-y-6 animate-fade-in">
      
      {/* RIDER APP HEADER */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center text-brand-teal">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold font-heading">Rider Partner App (Vikram Singh)</h1>
              <span className="bg-brand-teal/20 text-brand-teal text-xs font-bold px-2.5 py-0.5 rounded-full border border-brand-teal/30">
                LAPTOP 3 • RIDER APP
              </span>
            </div>
            <p className="text-xs text-white/70">Real-Time Delivery & GPS Telemetry (Connected to Shared SQLite DB)</p>
          </div>
        </div>

        <button
          onClick={fetchDeliveries}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Jobs</span>
        </button>
      </div>

      {/* DELIVERIES LIST */}
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between text-xs text-white/70">
          <h2 className="text-lg font-bold font-heading text-white">Assigned Delivery Jobs ({deliveries.length})</h2>
          <span>Rider ID: rdr_101</span>
        </div>

        {loading && deliveries.length === 0 ? (
          <div className="p-12 text-center text-white/60 text-sm bg-white/5 rounded-3xl border border-white/10 animate-pulse">
            Checking active delivery jobs...
          </div>
        ) : deliveries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deliveries.map((del) => (
              <div
                key={del.deliveryId}
                className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4 shadow-xl relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] text-brand-gold font-bold uppercase tracking-wider">
                      Delivery ID
                    </span>
                    <h3 className="font-extrabold text-sm text-white">{del.deliveryId}</h3>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                    del.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    'bg-brand-teal/20 text-brand-teal border border-brand-teal/30'
                  }`}>
                    {del.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Pickup & Dropoff Telemetry */}
                <div className="space-y-2 text-xs bg-black/40 p-3 rounded-2xl border border-white/5">
                  <div className="flex items-center space-x-2">
                    <span className="text-brand-coral font-bold">Pickup:</span>
                    <span className="text-white/90">{del.pickupLocation?.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-brand-teal font-bold">Dropoff:</span>
                    <span className="text-white/90">{del.deliveryLocation?.address}</span>
                  </div>
                  <div className="pt-1 text-[11px] text-white/60 flex items-center justify-between border-t border-white/10">
                    <span>GPS: {del.riderLocation?.latitude}, {del.riderLocation?.longitude}</span>
                    <span>ETA: {del.etaMinutes} mins</span>
                  </div>
                </div>

                {/* RIDER ACTION BUTTONS */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-white/60 font-bold uppercase">Rider Telemetry Action Controls</p>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded border border-emerald-500/30">
                      GPS ACTIVE
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(del.deliveryId, 'rider_assigned')}
                      disabled={actionLoading === del.deliveryId}
                      className="py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      1. Accept Job
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(del.deliveryId, 'picked_up')}
                      disabled={actionLoading === del.deliveryId}
                      className="py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      2. Confirm Pickup
                    </button>

                    <button
                      onClick={() => handleStepGPS(del)}
                      disabled={actionLoading === del.deliveryId}
                      className="py-2.5 bg-brand-teal text-white hover:bg-brand-teal/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 col-span-2 shadow-soft"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>3. START DELIVERY / OUT FOR DELIVERY (GPS TELEMETRY)</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(del.deliveryId, 'delivered')}
                      disabled={actionLoading === del.deliveryId || del.status === 'delivered'}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all col-span-2 ${
                        del.status === 'delivered'
                          ? 'bg-emerald-600 text-white opacity-90'
                          : 'bg-brand-coral hover:bg-brand-coral-hover text-white shadow-coral'
                      }`}
                    >
                      4. MARK DELIVERED 🎉
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-white/60 text-sm bg-white/5 rounded-3xl border border-white/10 font-semibold space-y-2">
            <Bike className="w-8 h-8 mx-auto text-brand-teal/60 mb-2" />
            <p className="text-base font-extrabold text-white">No active deliveries</p>
            <p className="text-xs text-white/60">Place a customer order on Laptop 1 to trigger real delivery dispatch here!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderOpsPage;
