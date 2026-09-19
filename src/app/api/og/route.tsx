import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'Briefy.live — Clear, Verified News & Analysis';
    const category = searchParams.get('category') || 'Breaking News';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 80px',
            backgroundColor: '#0a0d14',
            backgroundImage: 'radial-gradient(circle at 25% 25%, #182234 0%, #0a0d14 70%)',
            color: '#ffffff',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffffff' }}>Briefy</span>
              <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#ef4444' }}>.</span>
              <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6' }}>live</span>
            </div>
            <div
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '20px',
                fontWeight: 600,
                color: '#60a5fa',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              {category}
            </div>
          </div>

          {/* Title / Headline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                fontSize: title.length > 80 ? '42px' : '52px',
                fontWeight: 'bold',
                lineHeight: 1.25,
                color: '#f8fafc',
                maxWidth: '1000px',
              }}
            >
              {title}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '24px',
            }}
          >
            <span style={{ fontSize: '20px', color: '#94a3b8' }}>
              Multi-source synthesized reporting & essential context
            </span>
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#38bdf8' }}>
              briefy.live
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch {
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
