import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// 1. Add gridSize state
code = code.replace(
  "const [brushSize, setBrushSize] = useState(SIZES[1]);",
  "const [brushSize, setBrushSize] = useState(SIZES[1]);\n  const [gridSize, setGridSize] = useState(40);"
);

// 2. Replace hardcoded 40 with gridSize
code = code.replace(
  "containerRef.current.style.backgroundSize = bgPattern === 'grid' ? `${40 * scaleX}px ${40 * scaleY}px` : bgPattern === 'dots' ? `${40 * scaleX}px ${40 * scaleY}px` : 'auto';",
  "containerRef.current.style.backgroundSize = bgPattern === 'grid' ? `${gridSize * scaleX}px ${gridSize * scaleY}px` : bgPattern === 'dots' ? `${gridSize * scaleX}px ${gridSize * scaleY}px` : 'auto';"
);
code = code.replace(
  "}, [bgPattern, bgColor, dimensions]);",
  "}, [bgPattern, bgColor, dimensions, gridSize]);"
);

code = code.replace(
  "containerRef.current.style.backgroundSize = `${40 * stage.scaleX()}px ${40 * stage.scaleY()}px`;",
  "containerRef.current.style.backgroundSize = `${gridSize * stage.scaleX()}px ${gridSize * stage.scaleY()}px`;"
);

fs.writeFileSync('src/components/Canvas.tsx', code);
