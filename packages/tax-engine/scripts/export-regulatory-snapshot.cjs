/**
 * Tras `npm run build`, escribe un JSON inmutable del catálogo normativo vigente.
 * Uso en release: npm run build && npm run export-regulatory-snapshot
 */
const fs = require('fs');
const path = require('path');

const catalog = require('../dist/regulatory/co-ag2026-catalog.js');

const snapshot = catalog.getCoAg2026RegulatoryBundleSnapshot();
const filename = `${snapshot.lawPackageId.replace(/[^a-z0-9.-]/gi, '_')}.json`;
const outDir = path.join(__dirname, '../regulatory/snapshots');
const outPath = path.join(outDir, filename);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log('Regulatory snapshot written:', outPath);
