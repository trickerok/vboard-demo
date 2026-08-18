import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

code = code.replace("const handlePointerMove = (e: any) => {", "}\n\n  const handlePointerMove = (e: any) => {");
code = code.replace("if (tool === 'draw' && drawingPoints.current.length > 0) {", "}\n\n    if (tool === 'draw' && drawingPoints.current.length > 0) {");

fs.writeFileSync('src/components/Canvas.tsx', code);
