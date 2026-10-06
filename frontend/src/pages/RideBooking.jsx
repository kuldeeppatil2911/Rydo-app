import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LocateFixed, Navigation } from 'lucide-react';
import { geocodeLocation } from '../utils/geocoding';

const RideBooking = () => {
  const [formData, setFormData] = useState({
    pickup: '',
    dropoff: '',
    pickupCoords: null,
    dropoffCoords: null,
    rideType: 'Standard',
    paymentMode: 'Cash',
    tripMode: 'Now'
  });
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const nextData = { ...formData, [e.target.name]: e.target.value };
    if (e.target.name === 'pickup') nextData.pickupCoords = null;
    if (e.target.name === 'dropoff') nextData.dropoffCoords = null;
    if (['pickup', 'dropoff', 'rideType'].includes(e.target.name)) setEstimate(null);
    setFormData(nextData);
  };

  const resolveLocations = async () => {
    if (!formData.pickup || !formData.dropoff) return;

    const nextData = { ...formData };
    try {
      if (!nextData.pickupCoords) nextData.pickupCoords = await geocodeLocation(nextData.pickup);
      if (!nextData.dropoffCoords) nextData.dropoffCoords = await geocodeLocation(nextData.dropoff);
    } catch (err) {
      console.error(err);
      setLocationMessage('Map coordinates could not be found. The typed addresses will still be used.');
    }
    setFormData(nextData);
    return nextData;
  };

  const handleEstimate = async () => {
    if (!formData.pickup || !formData.dropoff) return;
    try {
      setLocationMessage('Finding your locations...');
      const resolvedData = await resolveLocations();
      const res = await axios.post('/ride/estimate', resolvedData);
      setEstimate(res.data);
      setLocationMessage(resolvedData.pickupCoords && resolvedData.dropoffCoords ? 'Locations found.' : 'Ride estimate ready. Map coordinates are unavailable for one or both locations.');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setLocationMessage('Your session expired. Please log in again.');
        navigate('/login');
        return;
      }
      setLocationMessage('Could not find one or both locations. You can still continue with the typed addresses.');
      try {
        const res = await axios.post('/ride/estimate', formData);
        setEstimate(res.data);
      } catch (estimateError) {
        console.error(estimateError);
        if (estimateError.response?.status === 401) {
          setLocationMessage('Your session expired. Please log in again.');
          navigate('/login');
          return;
        }
        setLocationMessage('Location search and fare estimation are unavailable. Please try again.');
      }
    }
  };

  const useCurrentLocation = () => {
    setEstimate(null);
    if (!navigator.geolocation) {
      setLocationMessage('Location services are not supported by this browser.');
      return;
    }

    setLocationMessage('Getting your current location...');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const currentCoords = { lat: coords.latitude, lng: coords.longitude };
      try {
        const response = await axios.get('/location/reverse', {
          params: { lat: coords.latitude, lng: coords.longitude }
        });
        setFormData((current) => ({
          ...current,
          pickup: response.data.label || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
          pickupCoords: currentCoords
        }));
        setLocationMessage('Current pickup location selected.');
      } catch (err) {
        setFormData((current) => ({
          ...current,
          pickup: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
          pickupCoords: currentCoords
        }));
        setLocationMessage('Current coordinates selected.');
      }
    }, () => setLocationMessage('Location permission was denied or unavailable.'));
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resolvedData = await resolveLocations();
      const payload = { ...resolvedData, ...estimate };
      
      if (['Card', 'UPI'].includes(formData.paymentMode)) {
        navigate('/checkout', { state: { payload } });
        return;
      }

      // If Cash or UPI, book directly
      const res = await axios.post('/ride/book', payload);
      await axios.post('/payment', { bookingId: res.data.booking._id, method: formData.paymentMode });
      navigate(`/receipt/${res.data.booking._id}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Book a Ride</h2>
      
      <div className="glass" style={{ padding: '2rem' }}>
        <form onSubmit={handleBook}>
          <div className="form-group">
            <label htmlFor="pickup">Pickup Location</label>
            <input type="text" name="pickup" className="glass-input" value={formData.pickup} onChange={handleChange} onBlur={handleEstimate} required />
            <button type="button" className="btn btn-secondary" onClick={useCurrentLocation} style={{ marginTop: '0.5rem', width: 'auto', padding: '9px 14px', fontSize: '0.85rem' }}>
              <LocateFixed size={16} /> Use my current location
            </button>
          </div>
          <div className="form-group">
            <label>Drop-off Location</label>
            <input type="text" name="dropoff" className="glass-input" value={formData.dropoff} onChange={handleChange} onBlur={handleEstimate} required />
          </div>

          <div className="grid-2" style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
              <label>Ride Type</label>
              <select name="rideType" className="glass-input" value={formData.rideType} onChange={handleChange} onBlur={handleEstimate}>
                <option value="Standard" style={{color: 'black'}}>Standard</option>
                <option value="Premium" style={{color: 'black'}}>Premium</option>
                <option value="Carpool" style={{color: 'black'}}>Carpool</option>
              </select>
            </div>
            <div className="form-group">
              <label>Payment Mode</label>
              <select name="paymentMode" className="glass-input" value={formData.paymentMode} onChange={handleChange}>
                <option value="Cash" style={{color: 'black'}}>Cash</option>
                <option value="Card" style={{color: 'black'}}>Card</option>
                <option value="UPI" style={{color: 'black'}}>UPI</option>
              </select>
            </div>
          </div>

          {estimate && (
            <div style={{ background: 'rgba(79, 70, 229, 0.1)', border: '1px solid var(--primary)', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Estimate</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Distance: {estimate.distance}</span>
                <span>Time: {estimate.time}</span>
                <span style={{ fontWeight: 'bold' }}>Fare: {estimate.fare}</span>
              </div>
            </div>
          )}

          {locationMessage && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.75rem' }}>{locationMessage}</p>}

          <button type="submit" className="btn" style={{ marginTop: '2rem' }} disabled={loading || !estimate}>
            <Navigation size={20} /> {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RideBooking;
