const searchLocation = async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query) return res.status(400).json({ message: 'Location query is required' });

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Rydo/1.0 ride-booking-app' }
    });
    if (!response.ok) return res.status(502).json({ message: 'Location provider unavailable' });

    const results = await response.json();
    if (!results.length) return res.status(404).json({ message: 'Location not found' });

    res.json({
      lat: Number(results[0].lat),
      lng: Number(results[0].lon),
      label: results[0].display_name
    });
  } catch (error) {
    console.error('Location search error:', error.message);
    res.status(502).json({ message: 'Location search failed' });
  }
};

const reverseLocation = async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ message: 'Coordinates are required' });

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`, {
      headers: { 'User-Agent': 'Rydo/1.0 ride-booking-app' }
    });
    if (!response.ok) return res.status(502).json({ message: 'Location provider unavailable' });

    const result = await response.json();
    res.json({ label: result.display_name || `${lat}, ${lng}` });
  } catch (error) {
    console.error('Reverse location error:', error.message);
    res.status(502).json({ message: 'Reverse location lookup failed' });
  }
};

module.exports = { searchLocation, reverseLocation };
