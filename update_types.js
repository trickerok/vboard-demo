import fs from 'fs';
let code = fs.readFileSync('src/types.ts', 'utf-8');
code = code.replace(
  "points: {x: number, y: number, p: number}[]; fill: string; size?: number }",
  "points: {x: number, y: number, p: number}[]; fill: string; size?: number; isEraser?: boolean }"
);
fs.writeFileSync('src/types.ts', code);
