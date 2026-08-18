import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const targetEffect = `  useEffect(() => {
    if (tool !== 'polygon') {
      polygonPtsRef.current = [];
      if (polygonLineRef.current) {
        polygonLineRef.current.hide();
        polygonLineRef.current.getLayer()?.batchDraw();
      }
    }
  }, [tool]);`;

code = code.replace(targetEffect, '');
code = code.replace('// Handle Resize', targetEffect + '\n\n  // Handle Resize');

fs.writeFileSync('src/components/Canvas.tsx', code);
