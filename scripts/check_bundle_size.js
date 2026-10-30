#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const DIST_DIR = path.resolve('dist');
const MAX_GZIP_BYTES = 180 * 1024; // 180 KB

if (!fs.existsSync(DIST_DIR)) {
  console.error(`Dist directory ${DIST_DIR} does not exist. Run build first.`);
  process.exit(1);
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(DIST_DIR);
let totalBytes = 0;
let totalGzipBytes = 0;
let hasExternalUrls = false;

console.log('--- Skipstone Bundle Verification ---');

allFiles.forEach((file) => {
  const relPath = path.relative(DIST_DIR, file);
  // Exclude non-bundled media or icons if any, but include all code/css/fonts/html
  const content = fs.readFileSync(file);
  const size = content.length;
  const gzipped = zlib.gzipSync(content);
  const gzipSize = gzipped.length;

  totalBytes += size;
  totalGzipBytes += gzipSize;

  console.log(`- ${relPath}: ${(size / 1024).toFixed(2)} KB (gzipped: ${(gzipSize / 1024).toFixed(2)} KB)`);

  // Verify no external CDNs or external http/https resource tags in built html/js/css
  if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css')) {
    const text = content.toString('utf-8');
    // Check for CDN links
    const externalMatches = text.match(/(https?:\/\/[a-zA-Z0-9.-]+\.(com|org|net|io|gstatic|googleapis|cloudflare|jsdelivr|unpkg)[^\s"'>]*)/gi);
    if (externalMatches) {
      // Filter out schema.org or benign non-runtime links if needed
      const runtimeExternals = externalMatches.filter(url => 
        !url.includes('http://json-schema.org') && 
        !url.includes('https://w3.org')
      );
      if (runtimeExternals.length > 0) {
        console.warn(`WARNING: Found external URLs in ${relPath}:`, runtimeExternals);
        hasExternalUrls = true;
      }
    }
  }
});

console.log('------------------------------------');
console.log(`Total Raw Size: ${(totalBytes / 1024).toFixed(2)} KB`);
console.log(`Total Gzipped Size: ${(totalGzipBytes / 1024).toFixed(2)} KB / ${(MAX_GZIP_BYTES / 1024).toFixed(2)} KB budget`);

if (totalGzipBytes > MAX_GZIP_BYTES) {
  console.error(`FAILED: Total gzipped bundle size (${(totalGzipBytes / 1024).toFixed(2)} KB) exceeds 180 KB limit!`);
  process.exit(1);
}

if (hasExternalUrls) {
  console.error('FAILED: Found external CDN or runtime network dependencies in production build!');
  process.exit(1);
}

console.log('SUCCESS: Production bundle size and zero-cloud constraints verified.');
process.exit(0);
