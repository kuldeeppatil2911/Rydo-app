import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Car, Map as MapIcon, CreditCard } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await axios.get('/admin/stats');
        const bookingsRes = await axios.get('/admin/bookings');
        setStats(statsRes.data);
        setBookings(bookingsRes.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading Admin Data...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Admin Overview</h2>
      
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="glass" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Users size={40} color="var(--primary)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '2rem' }}>{stats?.totalUsers}</h3>
            <p style={{ color: 'var(--text-muted)' }}>Total Users</p>
          </div>
        </div>
        <div className="glass" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Car size={40} color="var(--secondary)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '2rem' }}>{stats?.totalDrivers}</h3>
            <p style={{ color: 'var(--text-muted)' }}>Driver Profiles</p>
          </div>
        </div>
        <div className="glass" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <MapIcon size={40} color="var(--secondary)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '2rem' }}>{stats?.activeRides}</h3>
            <p style={{ color: 'var(--text-muted)' }}>Active Rides</p>
          </div>
        </div>
        <div className="glass" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <CreditCard size={40} color="var(--primary)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '2rem' }}>{stats?.totalPayments}</h3>
            <p style={{ color: 'var(--text-muted)' }}>Paid Transactions</p>
          </div>
        </div>
      </div>

      <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', height: '400px' }}>
        <h3 style={{ marginBottom: '1rem' }}>Revenue Chart (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats?.revenueData}>
            <XAxis dataKey="name" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'white'}} />
            <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Recent Bookings</h3>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem' }}>User</th>
              <th style={{ padding: '1rem' }}>Route</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Driver</th>
              <th style={{ padding: '1rem' }}>Fare / Payment</th>
            </tr>
          </thead>
          <tbody>
            {bookings.slice(0, 10).map((b) => (
              <tr key={b._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem' }}>{b.user?.name}</td>
                <td style={{ padding: '1rem' }}>{b.pickup} &rarr; {b.dropoff}</td>
                <td style={{ padding: '1rem', color: b.status === 'Completed' ? 'var(--secondary)' : 'var(--primary)' }}>{b.status}</td>
                <td style={{ padding: '1rem' }}>
                  {b.driver ? (
                    <>
                      <strong>{b.driver.name}</strong>
                      <div>{b.driver.vehicle} · {b.driver.plate}</div>
                      <div>{b.driver.user?.phone || 'Phone unavailable'}</div>
                    </>
                  ) : 'Unassigned'}
                </td>
                <td style={{ padding: '1rem' }}>{b.fare || 'N/A'} / {b.paymentMode || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
