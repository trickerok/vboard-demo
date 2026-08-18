import fs from 'fs';
const code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');
console.log(code.match(/onPointerDown={\(e\) => handleShapePointerDown\(e, obj\.id\)}/g).length);
