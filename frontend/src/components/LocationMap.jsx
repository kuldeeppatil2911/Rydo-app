import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';

const defaultCenter = [22.3072, 73.1812];

function FitRouteBounds({ pickupLat, pickupLng, dropoffLat, dropoffLng }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds([[pickupLat, pickupLng], [dropoffLat, dropoffLng]], {
      padding: [40, 40],
      maxZoom: 13
    });
  }, [dropoffLat, dropoffLng, map, pickupLat, pickupLng]);

  return null;
}

function LocationMap({ pickup, dropoff }) {
  const hasRoute = pickup?.lat != null && pickup?.lng != null && dropoff?.lat != null && dropoff?.lng != null;
  const pickupPosition = hasRoute ? [pickup.lat, pickup.lng] : defaultCenter;
  const dropoffPosition = hasRoute ? [dropoff.lat, dropoff.lng] : defaultCenter;
  const center = pickupPosition;

  return (
    <MapContainer
      key={`${pickupPosition.join(',')}-${dropoffPosition.join(',')}`}
      center={center}
      zoom={hasRoute ? 13 : 13}
      scrollWheelZoom={false}
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hasRoute && (
        <FitRouteBounds
          pickupLat={pickup.lat}
          pickupLng={pickup.lng}
          dropoffLat={dropoff.lat}
          dropoffLng={dropoff.lng}
        />
      )}

      <Marker position={pickupPosition}>
        <Popup>{hasRoute ? 'Pickup Location' : 'Default Location: Vadodara'}</Popup>
      </Marker>

      {hasRoute && (
        <>
          <Marker position={dropoffPosition}>
            <Popup>Drop-off Location</Popup>
          </Marker>
          <Polyline pathOptions={{ color: '#6366f1', weight: 4 }} positions={[pickupPosition, dropoffPosition]} />
        </>
      )}
    </MapContainer>
  );
}

export default LocationMap;
