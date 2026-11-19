import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import Alert from '../components/Alert';
import BackLink from '../components/BackLink';
import { formatPrice } from '../format';

export default function ServiceDetails() {
  const { id } = useParams(); // the :id in /services/:id
  const [service, setService] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/services/${id}`)
      .then((res) => setService(res.data))
      .catch((err) => setError(err.status === 404 ? "This service doesn't exist or is no longer offered." : err.message));
  }, [id]);

  return (
    <div className="page narrow">
      <BackLink to="/">Back to services</BackLink>

      <Alert>{error}</Alert>
      {!service && !error && <p className="muted">Loading...</p>}

      {service && (
        <>
          <h1>{service.name}</h1>
          <p className="lead">{service.description}</p>

          <dl className="facts">
            <div>
              <dt>Duration</dt>
              <dd>{service.duration_minutes} minutes</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{formatPrice(service.price)}</dd>
            </div>
          </dl>

          <Link className="button" to={`/book/${service.id}`}>Choose a time</Link>
        </>
      )}
    </div>
  );
}
