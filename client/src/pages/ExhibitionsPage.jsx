import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, LoaderCircle } from 'lucide-react';
import api from '../services/api';
import PublicNavbar from '../components/PublicNavbar';

function ExhibitionsPage() {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchExhibitions = async () => {
      try {
        const res = await api.get('/exhibitions/public');
        if (isMounted) setExhibitions(res.data.exhibitions || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchExhibitions();
    return () => { isMounted = false; };
  }, []);

  const formatDate = (start, end) => {
    if (!start || !end) return 'Dates TBA';
    return `${new Date(start).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }).toUpperCase()} — ${new Date(end).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}`;
  };

  return (
    <div style={{ background: '#faf9f6', minHeight: '100vh', paddingBottom: '80px' }}>
      <PublicNavbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px' }}>
        <div className="section-heading" style={{ marginBottom: '40px' }}>
          <div>
            <span className="eyebrow">WHAT'S HAPPENING</span>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '42px', margin: '10px 0' }}>Upcoming <em>exhibitions.</em></h1>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><LoaderCircle size={30} className="animate-spin" style={{ margin: '0 auto', color: '#a47745' }} /></div>
        ) : exhibitions.length === 0 ? (
          <div className="dashboard-empty"><Compass size={30} /><h3>No exhibitions scheduled</h3></div>
        ) : (
          <div className="exhibition-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
            {exhibitions.map((exhibition) => (
              <article className="exhibition-card" key={exhibition.exhibition_id} style={{ height: '350px' }}>
                <img src={exhibition.cover_image || 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1000&q=85'} alt={exhibition.title} />
                <div className="exhibition-overlay">
                  <span>{formatDate(exhibition.start_date, exhibition.end_date)}</span>
                  <h3>{exhibition.title}</h3>
                  <p>{exhibition.description?.substring(0, 100)}...</p>
                  <Link to={`/exhibitions/${exhibition.exhibition_id}`}>Discover exhibition <ArrowRight size={16} /></Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ExhibitionsPage;