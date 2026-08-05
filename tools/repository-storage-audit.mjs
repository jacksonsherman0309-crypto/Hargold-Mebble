import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '.');
const ignoredDirectories = new Set(['.git', 'node_modules', '.pnpm-store']);
const largeFileThreshold = Number(process.env.LARGE_FILE_BYTES ?? 5 * 1024 * 1024);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

async function digest(file) {
  const content = await readFile(file);
  return createHash('sha256').update(content).digest('hex');
}

const files = await walk(root);
const records = [];
for (const file of files) {
  const metadata = await stat(file);
  records.push({
    path: path.relative(root, file).replaceAll(path.sep, '/'),
    absolute: file,
    bytes: metadata.size
  });
}

records.sort((a, b) => b.bytes - a.bytes);
const totalBytes = records.reduce((sum, record) => sum + record.bytes, 0);
const largeFiles = records.filter((record) => record.bytes >= largeFileThreshold);

const sizeGroups = new Map();
for (const record of records) {
  if (!sizeGroups.has(record.bytes)) sizeGroups.set(record.bytes, []);
  sizeGroups.get(record.bytes).push(record);
}

const duplicateGroups = [];
for (const candidates of sizeGroups.values()) {
  if (candidates.length < 2 || candidates[0].bytes === 0) continue;
  const hashGroups = new Map();
  for (const candidate of candidates) {
    const sha256 = await digest(candidate.absolute);
    if (!hashGroups.has(sha256)) hashGroups.set(sha256, []);
    hashGroups.get(sha256).push(candidate);
  }
  for (const [sha256, duplicates] of hashGroups) {
    if (duplicates.length > 1) {
      duplicateGroups.push({ sha256, bytes: duplicates[0].bytes, files: duplicates.map(({ path }) => path) });
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  root,
  fileCount: records.length,
  totalBytes,
  totalSize: formatBytes(totalBytes),
  largeFileThreshold,
  largeFiles: largeFiles.map(({ path, bytes }) => ({ path, bytes, size: formatBytes(bytes) })),
  duplicateGroups
};

console.log(JSON.stringify(report, null, 2));
