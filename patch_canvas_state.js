import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const stateTarget = `  const [tool, setTool] = useState<'select' | 'select-lasso' | 'pan' | 'draw' | 'eraser' | 'text' | 'rect' | 'polygon' | 'circle' | 'triangle'>('select');
  const [brushColor, setBrushColor] = useState(COLORS[0]);`;

const stateReplace = `  const [tool, setTool] = useState<'select' | 'select-lasso' | 'pan' | 'draw' | 'eraser' | 'text' | 'rect' | 'polygon' | 'circle' | 'triangle'>('select');
  const [brushColor, setBrushColor] = useState(COLORS[0]);
  const [customColor, setCustomColor] = useState('#8b5cf6');
  const [strokeColor, setStrokeColor] = useState('transparent');
  const [showShapeMenu, setShowShapeMenu] = useState(false);`;

code = code.replace(stateTarget, stateReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
