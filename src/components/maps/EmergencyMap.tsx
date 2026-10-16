import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Facility } from '../../types';
import { Building2, Phone, ShieldCheck, MapPin, ExternalLink, Bed, Droplet } from 'lucide-react';

interface EmergencyMapProps {
  facilities: Facility[];
  selectedFacilityId?: string;
  onSelectFacility?: (facility: Facility) => void;
  userLocation?: { lat: number; lng: number };
  activeRouteDestination?: { lat: number; lng: number };
  height?: string;
}

export const EmergencyMap: React.FC<EmergencyMapProps> = ({
  facilities,
  selectedFacilityId,
  onSelectFacility,
  userLocation = { lat: 18.5284, lng: 73.8743 }, // Pune center default
  activeRouteDestination,
  height = '480px',
}) => {
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(userLocation);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    if (selectedFacilityId) {
      const match = facilities.find((f) => f.id === selectedFacilityId);
      if (match) {
        setSelectedFacility(match);
        setMapCenter(match.coordinates);
      }
    }
  }, [selectedFacilityId, facilities]);

  const handleMarkerClick = (fac: Facility) => {
    setSelectedFacility(fac);
    if (onSelectFacility) {
      onSelectFacility(fac);
    }
  };

  if (!apiKey) {
    return (
      <div
        style={{ height }}
        className="w-full rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center"
      >
        <MapPin className="w-10 h-10 text-teal-600 mb-2" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Interactive Emergency Map
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Google Maps API key is configured. Please verify your connection or use the facility list below.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md"
    >
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={mapCenter}
          defaultZoom={11}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {/* User / Referring Center Pin */}
          {userLocation && (
            <AdvancedMarker position={userLocation} title="Your Location / Referring Center">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 border-2 border-white shadow-lg text-white">
                <MapPin className="w-4 h-4" />
              </div>
            </AdvancedMarker>
          )}

          {/* Hospital Markers */}
          {facilities.map((fac) => {
            const isSelected = selectedFacility?.id === fac.id;
            return (
              <AdvancedMarker
                key={fac.id}
                position={fac.coordinates}
                title={fac.name}
                onClick={() => handleMarkerClick(fac)}
              >
                <Pin
                  background={fac.hasCEmONC ? '#0d9488' : '#3b82f6'}
                  borderColor="#ffffff"
                  glyphColor="#ffffff"
                  scale={isSelected ? 1.3 : 1.0}
                />
              </AdvancedMarker>
            );
          })}

          {/* Selected Facility InfoWindow */}
          {selectedFacility && (
            <InfoWindow
              position={selectedFacility.coordinates}
              onCloseClick={() => setSelectedFacility(null)}
            >
              <div className="p-2 max-w-xs text-slate-900 text-xs space-y-2">
                <div className="flex items-start justify-between gap-2 border-b pb-1.5">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 leading-snug">
                      {selectedFacility.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {selectedFacility.type.replace(/_/g, ' ')} &bull; {selectedFacility.tehsil}
                    </span>
                  </div>
                  {selectedFacility.isVerified && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-100 text-teal-800">
                      <ShieldCheck className="w-3 h-3 text-teal-600" /> Verified
                    </span>
                  )}
                </div>

                {/* Capabilities pills */}
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {selectedFacility.hasCEmONC && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      CEmONC (C-Section)
                    </span>
                  )}
                  {selectedFacility.hasBloodBank && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold flex items-center gap-0.5">
                      <Droplet className="w-2.5 h-2.5" /> Blood Bank
                    </span>
                  )}
                  {selectedFacility.hasSNCU && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                      SNCU / NICU
                    </span>
                  )}
                </div>

                {/* Bed availability */}
                <div className="grid grid-cols-2 gap-1 text-[10px] bg-slate-50 p-1.5 rounded">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Bed className="w-3 h-3 text-teal-600" />
                    Labor: {selectedFacility.laborBedsAvailable} beds
                  </span>
                  <span className="font-semibold text-slate-700">
                    ICU: {selectedFacility.icuBedsAvailable} beds
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t text-[11px]">
                  <a
                    href={`tel:${selectedFacility.phone}`}
                    className="inline-flex items-center gap-1 font-bold text-teal-700 hover:underline"
                  >
                    <Phone className="w-3 h-3" /> Call
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.coordinates.lat},${selectedFacility.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> Directions
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Floating legend overlay */}
      <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-[#172638]/95 backdrop-blur-xs border border-[#DCE7EC] dark:border-[#334155] p-2.5 rounded-xl shadow-lg text-[10px] space-y-1 z-10 pointer-events-auto">
        <div className="font-bold text-[#12304A] dark:text-[#F1F5F9] uppercase tracking-wider mb-1">
          Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#0F766E]" />
          <span className="text-[#64748B] dark:text-[#94A3B8]">CEmONC / First Referral Unit</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#2563EB]" />
          <span className="text-[#64748B] dark:text-[#94A3B8]">District / Sub-District Hospital</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#2563EB] border border-white" />
          <span className="text-[#64748B] dark:text-[#94A3B8]">Referring Center</span>
        </div>
      </div>
    </div>
  );
};
