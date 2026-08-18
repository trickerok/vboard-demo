import fs from 'fs';
let code = fs.readFileSync('src/types.ts', 'utf-8');

code = code.replace(
  "| { id: string; type: 'polygon'; x: number; y: number; points: number[]; fill: string; stroke?: string; strokeWidth?: number }",
  "| { id: string; type: 'polygon'; x: number; y: number; points: number[]; fill: string; stroke?: string; strokeWidth?: number; radius?: number; sides?: number }"
);

fs.writeFileSync('src/types.ts', code);
