import fs from 'fs';

let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// 1. In handlePointerDown, there is `lassoLineRef.current.getLayer().batchDraw();` then some spaces, then `};`.
// We need to insert `}` right before `};`.
// But wait, there is `const handlePointerMove = (e: any) => {` right after it.
code = code.replace(/lassoLineRef\.current\.getLayer\(\)\.batchDraw\(\);\s*\}\s*\}\s*\};\s*const handlePointerMove/g, "lassoLineRef.current.getLayer().batchDraw();\n        }\n      }\n    }\n  };\n\n  const handlePointerMove");

// 2. In handlePointerUp, there is `lassoLineRef.current.getLayer().batchDraw();` then some spaces, then `if (tool === 'draw' && drawingPoints.current.length > 0) {`
code = code.replace(/lassoLineRef\.current\.getLayer\(\)\.batchDraw\(\);\s*\}\s*if \(tool === 'draw' && drawingPoints\.current\.length > 0\)/g, "lassoLineRef.current.getLayer().batchDraw();\n      }\n    }\n\n    if (tool === 'draw' && drawingPoints.current.length > 0)");

fs.writeFileSync('src/components/Canvas.tsx', code);
