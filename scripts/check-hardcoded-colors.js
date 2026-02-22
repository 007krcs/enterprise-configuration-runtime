#!/usr/bin/env node

const { execSync } = require('child_process');
const { readFileSync, existsSync } = require('fs');
const { resolve } = require('path');

const args = process.argv.slice(2);
const checkAll = args.includes('--all');
const scopeArg = args.find((arg) => arg.startsWith('--scope='));
const scopeRoot = scopeArg ? scopeArg.split('=')[1] : 'apps/builder';
const allowedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss'];
const skipPatterns = [
  'node_modules',
  'dist',
  '.next',
  'apps/builder/src/app/globals.css', // central design tokens
];

function runGit(command) {
  return execSync(command, { encoding: 'utf-8' }).split('\n').filter(Boolean);
}

function resolveFiles() {
  if (checkAll) {
    return runGit('git ls-files');
  }
  const tracked = runGit('git diff --name-only --diff-filter=ACMRT HEAD');
  const untracked = runGit('git ls-files --others --exclude-standard');
  return Array.from(new Set([...tracked, ...untracked]));
}

const files = resolveFiles().filter((file) => {
  if (!file.startsWith(scopeRoot)) return false;
  if (!allowedExtensions.some((ext) => file.endsWith(ext))) return false;
  if (!existsSync(file)) return false;
  return !skipPatterns.some((pattern) => file.includes(pattern));
});

const hexRegex = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?/;
const flagged = [];

for (const file of files) {
  const content = readFileSync(resolve(file), 'utf-8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    const sanitized = line.replace(/var\([^)]*\)/g, '');
    if (hexRegex.test(sanitized)) {
      flagged.push({ file, line: index + 1, snippet: line.trim() });
    }
  });
}

if (flagged.length) {
  console.log('Hard-coded color tokens detected:');
  flagged.forEach(({ file, line, snippet }) => {
    console.log(`${file}:${line}  ${snippet}`);
  });
  process.exitCode = 1;
} else {
  console.log('No hard-coded colors detected in checked files.');
}
