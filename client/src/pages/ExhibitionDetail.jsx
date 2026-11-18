import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Palette, CalendarDays, MapPin, ArrowLeft, LoaderCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

function ExhibitionDetail() {
  const { id } = useParams();
  const [exhibition, setExhibition] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter State
  const [artistFilter, setArtistFilter] = useState('All');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch exhibition details AND its artworks in parallel
        const [exRes, artRes] = await Promise.all([
          api.get(`/exhibitions/${id}`),
          api.get(`/exhibitions/${id}/artworks`)
        ]);
        
        setExhibition(exRes.data.exhibition);
        setArtworks(artRes.data.artworks || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load exhibition.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) return <div className="dashboard-loading" style={{ minHeight: '100vh' }}><LoaderCircle size={30} className="animate-spin" /> Loading...</div>;
  if (error) return <div className="dashboard-error" style={{ margin: '50px' }}><AlertCircle size={18} /> {error}</div>;
  if (!exhibition) return null;

  // Extract unique artist names for the filter dropdown
  const uniqueArtists = ['All', ...new Set(artworks.map(a => a.artist_name))];
  
  // Filter the artworks
  const filteredArtworks = artistFilter === 'All' 
    ? artworks 
    : artworks.filter(a => a.artist_name === artistFilter);

  return (
    <div className="booking-page">
      <header className="booking-header">
        <Link to="/" className="brand">
          <span className="brand-icon"><Palette size={22} /></span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>
        <Link to="/dashboard" className="dashboard-home-link">My dashboard</Link>
      </header>

      <main className="booking-main" style={{ paddingBottom: '60px' }}>
        <Link to="/" className="booking-back-link">
          <ArrowLeft size={17} /> Back to gallery
        </Link>

        {/* HERO SECTION */}
        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', marginBottom: '40px', minHeight: '300px', display: 'flex', alignItems: 'flex-end' }}>
          <img 
            src={exhibition.cover_image || 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1200&q=85'} 
            alt={exhibition.title} 
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2))' }} />
          
          <div style={{ position: 'relative', zIndex: 1, padding: '40px', color: 'white', width: '100%' }}>
            <span className="eyebrow" style={{ color: '#a47745' }}>CURRENT EXHIBITION</span>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '42px', margin: '10px 0' }}>{exhibition.title}</h1>
            
            <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#e8e3da', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CalendarDays size={16} /> 
                {new Date(exhibition.start_date).toLocaleDateString()} - {new Date(exhibition.end_date).toLocaleDateString()}
              </span>
              {exhibition.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} /> {exhibition.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div style={{ maxWidth: '800px', marginBottom: '50px' }}>
          <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#555' }}>
            {exhibition.description}
          </p>
        </div>

        {/* ARTWORKS SECTION */}
        <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="eyebrow">FEATURED WORKS</span>
            <h2>Artworks in this Exhibition</h2>
          </div>
          
          {/* FILTER BY ARTIST */}
          {artworks.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#777168' }}>Filter by Artist:</label>
              <select 
                value={artistFilter} 
                onChange={e => setArtistFilter(e.target.value)}
                style={{ padding: '10px 15px', border: '1px solid #e8e3da', borderRadius: '6px', background: '#faf9f6', color: '#25231f', fontSize: '14px' }}
              >
                {uniqueArtists.map(artist => <option key={artist} value={artist}>{artist}</option>)}
              </select>
            </div>
          )}
        </div>

        {filteredArtworks.length === 0 ? (
          <div className="dashboard-empty">
            <Palette size={30} />
            <h3>No artworks found</h3>
            <p>{artistFilter === 'All' ? 'This exhibition does not have any approved artworks yet.' : `No artworks by ${artistFilter} in this exhibition.`}</p>
          </div>
        ) : (
          <div className="dashboard-exhibitions-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {filteredArtworks.map((art) => (
              <div key={art.artwork_id} className="dashboard-exhibition-card" style={{ cursor: 'pointer' }}>
                <img src={art.image_url} alt={art.title} style={{ height: '250px' }} />
                <div className="dashboard-exhibition-info">
                  <h3>{art.title}</h3>
                  <p style={{ fontWeight: 'bold', color: '#a47745', marginBottom: '5px' }}>{art.artist_name}</p>
                  <p style={{ fontSize: '12px', color: '#777168' }}>
                    {art.category} {art.medium ? `• ${art.medium}` : ''} {art.creation_year ? `• ${art.creation_year}` : ''}
                  </p>
                  <p style={{ fontSize: '15px', fontWeight: 'bold', marginTop: '10px' }}>
                    KES {Number(art.price).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ExhibitionDetail;