import axios from 'axios';

export async function geocodeLocation(query) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return null;

  const response = await axios.get('/location/search', { params: { q: trimmedQuery } });
  return response.data;
}
