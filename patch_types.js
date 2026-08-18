import fs from 'fs';
let code = fs.readFileSync('src/types.ts', 'utf-8');

code = code.replace(
  "| { id: string; type: 'rect'; x: number; y: number; width: number; height: number; fill: string }",
  "| { id: string; type: 'rect'; x: number; y: number; width: number; height: number; fill: string; stroke?: string; strokeWidth?: number }"
).replace(
  "| { id: string; type: 'circle'; x: number; y: number; radius: number; fill: string }",
  "| { id: string; type: 'circle'; x: number; y: number; radius: number; fill: string; stroke?: string; strokeWidth?: number }"
).replace(
  "| { id: string; type: 'triangle'; x: number; y: number; radius: number; fill: string }",
  "| { id: string; type: 'triangle'; x: number; y: number; radius: number; fill: string; stroke?: string; strokeWidth?: number }"
).replace(
  "| { id: string; type: 'polygon'; x: number; y: number; points: number[]; fill: string }",
  "| { id: string; type: 'polygon'; x: number; y: number; points: number[]; fill: string; stroke?: string; strokeWidth?: number }"
);

fs.writeFileSync('src/types.ts', code);
