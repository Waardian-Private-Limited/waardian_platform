import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
 
export const size = {
  width: 180,
  height: 180,
};
 
export const contentType = 'image/png';
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0979E0',
            fontSize: 72,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #0979E0 0%, #0D96F3 100%)',
            color: 'white',
            borderRadius: '50%',
          }}
        >
          W
        </div>
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