'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 2rem',
      borderBottom: '1px solid #e0e0e0',
      backgroundColor: '#fff',
    }}>
      {/* ロゴ：テキスト */}
      <div>
        <span style={{
          fontFamily: 'var(--font-space-mono), monospace',
          fontSize: '2rem',
          fontWeight: '700',
          letterSpacing: '0.05em',
        }}>
          <span style={{ color: '#1a6fd4' }}>A</span>
          <span style={{ color: '#FF0000' }}>B</span>
          <span style={{ color: '#1a1a14' }}>3C</span>
        </span>
        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.1rem' }}>
          「選ばれる理由」を見つけるフレームワーク
        </div>
      </div>

      {/* 右上：AB3C説明 ＋ ログインボタン */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {/* AB3C説明テキスト（現在の右上部分） */}
        <div style={{ textAlign: 'right', fontSize: '0.8rem', lineHeight: '1.8' }}>
          <div><span style={{ color: '#1a6fd4', fontWeight: 'bold' }}>A</span> — Advantage（差別的優位点）</div>
          <div><span style={{ color: '#FF0000', fontWeight: 'bold' }}>B</span> — Benefit（お客様が求める価値）</div>
          <div><span style={{ color: '#1a1a14', fontWeight: 'bold' }}>3C</span> — Customer · Competitor · Company</div>
        </div>

        {/* ログインボタン */}
        <div>
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#333' }}>
                {session.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                style={{
                  padding: '0.4rem 1rem',
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                ログアウト
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              style={{
                padding: '0.5rem 1.2rem',
                backgroundColor: '#1a6fd4',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold',
              }}
            >
              Googleでログイン
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
