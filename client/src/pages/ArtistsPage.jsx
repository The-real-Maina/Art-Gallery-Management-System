import { useEffect, useState } from 'react';
import { Users, Globe, LoaderCircle } from 'lucide-react';
import api from '../services/api';
import PublicNavbar from '../components/PublicNavbar';

function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await api.get('/artists/public');
        setArtists(res.data.artists || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  return (
    <div style={{ background: '#faf9f6', minHeight: '100vh', paddingBottom: '80px' }}>
      <PublicNavbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px' }}>
        <div className="section-heading" style={{ marginBottom: '40px' }}>
          <div>
            <span className="eyebrow">THE CREATORS</span>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '42px', margin: '10px 0' }}>Meet the <em>artists.</em></h1>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><LoaderCircle size={30} className="animate-spin" style={{ margin: '0 auto', color: '#a47745' }} /></div>
        ) : artists.length === 0 ? (
          <div className="dashboard-empty"><Users size={30} /><h3>No artists to display</h3></div>
        ) : (
          <div className="artists-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', display: 'grid', gap: '20px' }}>
            {artists.map((artist) => (
              <div className="artist-card" key={artist.artist_id || artist.user_id} style={{ background: 'white', padding: '30px', borderRadius: '10px', border: '1px solid #e8e3da', textAlign: 'center' }}>
                <div className="artist-avatar" style={{ width: '80px', height: '80px', background: '#a47745', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 15px' }}>
                  {artist.full_name ? artist.full_name.charAt(0).toUpperCase() : 'A'}
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', margin: '0 0 10px' }}>{artist.full_name || 'Gallery Artist'}</h3>
                <p style={{ fontSize: '13px', color: '#777168', lineHeight: 1.6, marginBottom: '20px' }}>
                  {artist.biography || 'A talented contemporary artist showcasing works at Artisan Gallery.'}
                </p>
                {artist.website && (
                  <a href={artist.website.startsWith('http') ? artist.website : `https://${artist.website}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#a47745', fontWeight: 'bold', fontSize: '13px' }}>
                    <Globe size={16} /> Visit Portfolio
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ArtistsPage;