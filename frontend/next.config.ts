import type { NextConfig } from "next";

/**
 * Hostnames (sin esquema ni puerto) desde los que se puede acceder al dev
 * server. Next 16 solo permite `localhost`, sus subdominios y el hostname con
 * el que se inició el servidor; cualquier otro origen (por ejemplo la IP de la
 * LAN) queda bloqueado para assets de desarrollo y el WebSocket del HMR.
 *
 * Se puede extender con `ALLOWED_DEV_ORIGINS` (lista separada por comas) en
 * `frontend/.env.local`, por ejemplo:
 *   ALLOWED_DEV_ORIGINS="192.168.0.147,192.168.1.50"
 */
const allowedDevOrigins = Array.from(
  new Set([
    "192.168.0.147",
    ...(process.env.ALLOWED_DEV_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []),
  ]),
);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins,
  webpack: (config, { dev, isServer }) => {
    // Fallback para cuando se corre `next dev --webpack`.
    // El bundler por defecto en Next 16 es Turbopack, así que esto no aplica
    // al `npm run dev` normal; el HMR en Turbopack se habilita con
    // `allowedDevOrigins` (arriba).
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  async rewrites() {
    const apiUrl = process.env.API_URL ?? "http://localhost:3030";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      {
        // Las imágenes del backend se referencian con rutas relativas para que
        // SSR y cliente coincidan (sin hydration mismatch por el host).
        source: "/assets/:path*",
        destination: `${apiUrl}/assets/:path*`,
      },
    ];
  },
  images: {
    // Desarrollo local: el backend corre en localhost:3030.
    // En producción, serví las imágenes desde un dominio público y quitá esto.
    dangerouslyAllowLocalIP: true,
    localPatterns: [{ pathname: "/**", search: "" }],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3030",
        pathname: "/assets/images/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3030",
        pathname: "/assets/images/**",
      },
      {
        protocol: "http",
        hostname: "192.168.0.147",
        port: "3030",
        pathname: "/assets/images/**",
      },
    ],
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
