import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

code = code.replace(
  "// Tools and Settings",
  "useEffect(() => {\n    if (tool !== 'polygon') {\n      polygonPtsRef.current = [];\n      if (polygonLineRef.current) {\n        polygonLineRef.current.hide();\n        polygonLineRef.current.getLayer()?.batchDraw();\n      }\n    }\n  }, [tool]);\n\n  // Tools and Settings"
);

fs.writeFileSync('src/components/Canvas.tsx', code);
