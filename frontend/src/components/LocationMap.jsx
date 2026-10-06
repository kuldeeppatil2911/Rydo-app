import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';

const defaultCenter = [22.3072, 73.1812];

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
