import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

code = code.replace("import getStroke from 'perfect-freehand';\nimport getStroke from 'perfect-freehand';", "import getStroke from 'perfect-freehand';");

code = code.replace("const [objects, setObjects] = useState<CanvasObject[]>([]);", "const [objects, setObjects] = useState<CanvasObject[]>([]);\n  const [selectedIds, setSelectedIds] = useState<string[]>([]);");

fs.writeFileSync('src/components/Canvas.tsx', code);
