import fs from 'fs';
let code = fs.readFileSync('src/types.ts', 'utf-8');
code = code.replace("points: number[][];", "points: {x: number, y: number, p: number}[];");
fs.writeFileSync('src/types.ts', code);
