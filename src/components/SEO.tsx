import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

const SITE_NAME = 'MarketBeacon Pro';
const DEFAULT_DESC = 'India\'s institutional stock research tool. Institutional Audit Scores, ABCD Tranche Logic & real-time screening. For educational purposes only.';
const DEFAULT_IMAGE = 'https://marketbeaconpro.com/og-preview.svg';
const BASE_URL = 'https://marketbeaconpro.com';

export default function SEO({ title, description, image, url }: SEOProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const desc = description || DEFAULT_DESC;
  const img = image || DEFAULT_IMAGE;
  const path = url || '/';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:url" content={`${BASE_URL}${path}`} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
