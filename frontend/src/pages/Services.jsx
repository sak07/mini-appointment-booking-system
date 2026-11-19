import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Alert from '../components/Alert';
import { formatPrice } from '../format';

// Services shown as a salon price list: name + description left, duration + price right.
export default function Services() {
  const [services, setServices] = useState(null); // null = still loading
  const [error, setError] = useState('');

  useEffect(() => {
    api('/services')
      .then((res) => setServices(res.data))
      .catch((err) => {
        setError(err.message);
        setServices([]);
      });
  }, []);

  return (
    <div className="page">
      <h1>Book an appointment</h1>
      <p className="muted lead">Choose a service, then pick a time that suits you.</p>

      <Alert>{error}</Alert>
      {services === null && <p className="muted">Loading services...</p>}
      {services?.length === 0 && !error && <p className="muted">No services are available right now. Check back soon.</p>}

      {services?.length > 0 && (
        <ul className="price-list">
          {services.map((s) => (
            <li key={s.id} className="price-row">
              <div className="price-info">
                <Link to={`/services/${s.id}`} className="price-name">{s.name}</Link>
                <p className="muted">{s.description}</p>
              </div>
              <div className="price-meta">
                <span className="duration">{s.duration_minutes} min</span>
                <span className="price">{formatPrice(s.price)}</span>
              </div>
              <Link className="button small" to={`/book/${s.id}`}>Book</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
