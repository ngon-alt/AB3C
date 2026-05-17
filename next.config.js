/** @type {import('next').NextConfig} */
// Updated: 2025-04-07 to force rebuild
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'ab3c-analyzer.vercel.app',
          },
        ],
        destination: 'https://senryaku.ai/:path*',
        permanent: true,
      },
    ];
  },
  // pptxgenjs はブラウザ／Node 両対応のため node:fs / node:https / node:stream 等を
  // 条件付きで import している。クライアント側バンドルでは不要なので空モジュールに差し替える。
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        https: false,
        http: false,
        stream: false,
        zlib: false,
        crypto: false,
        path: false,
        os: false,
        url: false,
      };
      // node: スキーマ付き import を空モジュールへ差し替え
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );
    }
    return config;
  },
};
module.exports = nextConfig;
