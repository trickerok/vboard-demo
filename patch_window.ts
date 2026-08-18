import fs from 'fs';
let code = fs.readFileSync('src/types.ts', 'utf-8');

if (!code.includes('interface Window')) {
code += `
declare global {
  interface Window {
    lastCursorEmit: number;
  }
}
`;
fs.writeFileSync('src/types.ts', code);
}
