import fs from 'fs';
let code = fs.readFileSync('vite.config.ts', 'utf-8');

code = code.replace(
  "hmr: process.env.DISABLE_HMR !== 'true',",
  "hmr: false,"
);

fs.writeFileSync('vite.config.ts', code);
