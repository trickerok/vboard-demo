import fs from 'fs';

let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// Replace handlePointerDown end
code = code.replace("      }\n      \n  };", "      }\n    }\n  };");

// Replace handlePointerUp before draw check
code = code.replace("      }\n       \n   \n    if (tool === 'draw' && drawingPoints.current.length > 0) {", "      }\n    }\n    if (tool === 'draw' && drawingPoints.current.length > 0) {");
code = code.replace("      }\n       \n    if (tool === 'draw' && drawingPoints.current.length > 0) {", "      }\n    }\n    if (tool === 'draw' && drawingPoints.current.length > 0) {");

fs.writeFileSync('src/components/Canvas.tsx', code);
