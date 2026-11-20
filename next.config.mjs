/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // Zwingt Next.js, die App als fertige HTML-Dateien zu exportieren
    images: {
    unoptimized: true, // Wichtig, damit Bilder auf dem Desktop ohne Server laden
    },
};

export default nextConfig;
