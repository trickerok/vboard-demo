import fs from 'fs';

let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// Fix imports: getStroke
code = code.replace("import { getSvgPathFromStroke } from '../lib/freehand';", "import { getSvgPathFromStroke } from '../lib/freehand';\nimport getStroke from 'perfect-freehand';");

// Fix TS2448: Move selectedIds up
const selTarget = `  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [objects, setObjects] = useState<CanvasObject[]>([]);
      
  useEffect(() => {
    if (trRef.current) {
      const nodes = selectedIds.map(id => trRef.current.getStage().findOne(\`#\${id}\`)).filter(Boolean);`;
      
const selReplace = `  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
      
  useEffect(() => {
    if (trRef.current) {
      const nodes = selectedIds.map(id => trRef.current.getStage().findOne(\`#\${id}\`)).filter(Boolean);`;
code = code.replace(selTarget, selReplace);
code = code.replace("  const [selectedIds, setSelectedIds] = useState<string[]>([]);\n", "");

// Fix duplicate onTransformEnd
code = code.replace("onTransformEnd={handleTransformEnd} onTransformEnd={handleTransformEnd}", "onTransformEnd={handleTransformEnd}");

// Fix weird tool comparison
code = code.replace("if (((tool === 'select' || tool === 'select-lasso') || tool === 'select-lasso')", "if ((tool === 'select' || tool === 'select-lasso')");

code = code.replace("} else if ((tool === 'select' || tool === 'select-lasso') === 'select-lasso') {", "} else if (tool === 'select-lasso') {");

fs.writeFileSync('src/components/Canvas.tsx', code);
