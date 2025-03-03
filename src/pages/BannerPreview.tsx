``import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, UserPlus, Palette } from 'lucide-react';
import { defaultBanners } from '../components/ProfileBanner';
import type { BannerStyle } from '../components/ProfileBanner';
import { BannerGradient } from '../components/BannerGradient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { doc, updateDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';

export function BannerPreview() {
  const { bannerId } = useParams<{ bannerId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const banner = defaultBanners.find(b => b.id === bannerId);

  useEffect(() => {
    // Set meta tags for social sharing
    const bannerName = banner?.name || 'Custom Banner';
    document.title = `${bannerName} - Trade Ya Profile Banner`;

    const metaTags = [
      {
        property: 'og:title',
        content: `${bannerName} - Trade Ya Profile Banner`
      },
      {
        property: 'og:description',
        content: 'Check out this awesome profile banner on Trade Ya!'
      },
      {
        property: 'og:type',
        content: 'website'
      },
      {
        property: 'twitter:card',
        content: 'summary_large_image'
      }
    ];

    // Add meta tags
    metaTags.forEach(tag => {
      let element = document.querySelector(`meta[property="${tag.property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', tag.property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', tag.content);
    });

    // Cleanup
    return () => {
      metaTags.forEach(tag => {
        const element = document.querySelector(`meta[property="${tag.property}"]`);
        if (element) {
          element.remove();
        }
      });
    };
  }, [banner]);

  const handleUseBanner = async () => {
    if (!user || !banner) return;
    
    setLoading(true);
    try {
      const db = await getDb();
      await updateDoc(doc(db, 'users', user.uid), {
        selectedBanner: banner.id,
        updatedAt: new Date()
      });
      showToast('Banner applied successfully!', 'success');
      navigate(`/profile`);
    } catch (err) {
      console.error('Failed to apply banner:', err);
      showToast('Failed to apply banner. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!banner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass-panel max-w-2xl mx-auto p-8 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-display font-semibold text-gray-900 mb-2">
            Banner Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            This banner doesn't exist or has been removed.
          </p>
          <Link 
            to="/" 
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="glass-panel max-w-2xl mx-auto overflow-hidden w-fit">
        {/* Banner Preview */}
        <div className="profile-banner relative">
          <BannerGradient style={banner.style} /> 
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-display font-semibold text-gray-900 mb-2">
            {banner.name}
          </h1>
          <p className="text-gray-600 mb-6">
            {banner.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              Required Level: {banner.levelRequired}
            </div>
            {user ? (
              <div className="space-x-4">
                <Link to="/profile" className="btn-secondary flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Profile
                </Link>
                <button
                  onClick={handleUseBanner}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Palette className="h-4 w-4" />
                      Use This Banner
                    </>
                  )}
                </button>
              </div>
            ) : (
              <Link
                to="/signup"
                className="btn-primary flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Join to Use This Banner
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
