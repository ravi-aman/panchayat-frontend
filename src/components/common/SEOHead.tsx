import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PANCHAYAT_BRANDING, getPanchayatTitle, getPanchayatDescription, getPanchayatKeywords } from '../config/branding';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
}

export const SEOHead: React.FC<SEOProps> = ({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  article
}) => {
  const pageTitle = getPanchayatTitle(title);
  const pageDescription = getPanchayatDescription(description);
  const pageKeywords = getPanchayatKeywords(keywords);
  const pageUrl = url ? `${PANCHAYAT_BRANDING.url}${url}` : PANCHAYAT_BRANDING.url;
  const pageImage = image ? `${PANCHAYAT_BRANDING.url}${image}` : `${PANCHAYAT_BRANDING.url}${PANCHAYAT_BRANDING.meta.ogImage}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      <meta name="author" content="Panchayat Team" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="theme-color" content={PANCHAYAT_BRANDING.colors.primary} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={pageUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content={PANCHAYAT_BRANDING.name} />
      <meta property="og:locale" content="en_US" />
      
      {/* Article specific meta tags */}
      {type === 'article' && article && (
        <>
          {article.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
          {article.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
          {article.author && <meta property="article:author" content={article.author} />}
          {article.section && <meta property="article:section" content={article.section} />}
          {article.tags && article.tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={pageUrl} />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="twitter:description" content={pageDescription} />
      <meta property="twitter:image" content={pageImage} />
      <meta property="twitter:site" content={PANCHAYAT_BRANDING.social.twitter} />
      <meta property="twitter:creator" content={PANCHAYAT_BRANDING.social.twitter} />
      
      {/* Additional Meta Tags */}
      <meta name="geo.region" content="IN" />
      <meta name="geo.placename" content="India" />
      <meta name="application-name" content={PANCHAYAT_BRANDING.name} />
      <meta name="apple-mobile-web-app-title" content={PANCHAYAT_BRANDING.name} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="mobile-web-app-capable" content="yes" />
    </Helmet>
  );
};

export default SEOHead;