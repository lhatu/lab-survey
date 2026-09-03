import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const minimalPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const pngBuffer = Buffer.from(minimalPngBase64, 'base64');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pngBuffer);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pngBuffer);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngBuffer);

console.log('PWA icons generated in public/');
