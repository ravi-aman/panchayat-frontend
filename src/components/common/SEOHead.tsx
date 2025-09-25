import React, { useEffect } from 'react';
import { PANCHAYAT_BRANDING, getPanchayatTitle, getPanchayatDescription, getPanchayatKeywords } from '../../config/branding';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
}

export const SEOHead: React.FC<SEOProps> = ({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website'
}) => {
  const pageTitle = getPanchayatTitle(title);
  const pageDescription = getPanchayatDescription(description);
  const pageKeywords = getPanchayatKeywords(keywords);
  const pageUrl = url ? `${PANCHAYAT_BRANDING.url}${url}` : PANCHAYAT_BRANDING.url;
  const pageImage = image ? `${PANCHAYAT_BRANDING.url}${image}` : `${PANCHAYAT_BRANDING.url}${PANCHAYAT_BRANDING.meta.ogImage}`;

  useEffect(() => {
    // Update document title
    document.title = pageTitle;
    
    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Primary Meta Tags
    updateMetaTag('description', pageDescription);
    updateMetaTag('keywords', pageKeywords);
    updateMetaTag('theme-color', PANCHAYAT_BRANDING.colors.primary);
    
    // Open Graph Tags
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', pageUrl, true);
    updateMetaTag('og:title', pageTitle, true);
    updateMetaTag('og:description', pageDescription, true);
    updateMetaTag('og:image', pageImage, true);
    updateMetaTag('og:site_name', PANCHAYAT_BRANDING.name, true);
    
    // Twitter Tags
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:url', pageUrl, true);
    updateMetaTag('twitter:title', pageTitle, true);
    updateMetaTag('twitter:description', pageDescription, true);
    updateMetaTag('twitter:image', pageImage, true);
    updateMetaTag('twitter:site', PANCHAYAT_BRANDING.social.twitter, true);

  }, [pageTitle, pageDescription, pageKeywords, pageUrl, pageImage, type]);

  return null; // This component doesn't render anything
};

export default SEOHead;