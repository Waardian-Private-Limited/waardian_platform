import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
 
export const alt = 'Waardian - Revolutionizing Smart Living';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(135deg, #0979E0 0%, #0D96F3 100%)',
          color: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 120,
              height: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              color: '#0979E0',
              fontSize: 72,
              fontWeight: 'bold',
              borderRadius: '50%',
              marginRight: 24,
            }}
          >
            W
          </div>
          <h1 style={{ fontWeight: 'bold' }}>Waardian</h1>
        </div>
        <h2 style={{ fontSize: 36, textAlign: 'center', maxWidth: '80%', marginTop: 0 }}>
          All-in-one society management platform for gated communities
        </h2>
      </div>
    ),
    {
      ...size,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  );
}