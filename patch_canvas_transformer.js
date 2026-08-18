import fs from 'fs';

let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const importTarget = `import { Stage, Layer, Rect, Path, Group, Line } from 'react-konva';`;
const importReplace = `import { Stage, Layer, Rect, Path, Group, Line, Transformer } from 'react-konva';`;
code = code.replace(importTarget, importReplace);

// add Transformer ref
const refsTarget = `const containerRef = useRef<HTMLDivElement>(null);`;
const refsReplace = `const containerRef = useRef<HTMLDivElement>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (trRef.current) {
      const nodes = selectedIds.map(id => trRef.current.getStage().findOne(\`#\${id}\`)).filter(Boolean);
      trRef.current.nodes(nodes);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedIds, objects]);`;
code = code.replace(refsTarget, refsReplace);

// add handleTransformEnd
const handleTransformTarget = `const handleDragEnd = (e: any, id: string) => {`;
const handleTransformReplace = `const handleTransformEnd = (e: any) => {
    const node = e.target;
    const id = node.id();
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    
    const changes = {
       x: node.x(),
       y: node.y(),
       width: Math.max(5, (node.width() || 100) * scaleX),
       height: Math.max(5, (node.height() || 100) * scaleY)
    };
    
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...changes } : o));
    emitEvent({ type: 'UPDATE_OBJECT', id, changes });
  };

  const handleDragEnd = (e: any, id: string) => {`;
code = code.replace(handleTransformTarget, handleTransformReplace);

// add onTransformEnd to Rect and Text
const rectTarget = `onDragEnd={(e) => handleDragEnd(e, obj.id)}`;
const rectReplace = `onDragEnd={(e) => handleDragEnd(e, obj.id)} onTransformEnd={handleTransformEnd}`;
code = code.replace(rectTarget, rectReplace);
code = code.replace(rectTarget, rectReplace);

// add transformer to Layer
const layerEndTarget = `</Layer>`;
const layerEndReplace = `  {(tool === 'select' || tool === 'select-lasso') && <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10 ? oldBox : newBox} />}
          </Layer>`;
code = code.replace(layerEndTarget, layerEndReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
