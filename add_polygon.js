import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// 1. Add polygonPtsRef
code = code.replace(
  "const lassoPtsRef = useRef<number[]>([]);",
  "const lassoPtsRef = useRef<number[]>([]);\n  const polygonPtsRef = useRef<number[]>([]);"
);

// 2. Add handlePointerDown logic
const pDownTarget = `    if (tool === 'rect') {`;
const pDownReplace = `    if (tool === 'polygon') {
      const sx = pt.x, sy = pt.y;
      if (polygonPtsRef.current.length >= 6) {
         const firstX = polygonPtsRef.current[0];
         const firstY = polygonPtsRef.current[1];
         const dx = sx - firstX;
         const dy = sy - firstY;
         if (dx*dx + dy*dy < 400) {
            const id = uuidv4();
            const newObj: CanvasObject = { id, type: 'polygon', x: 0, y: 0, points: [...polygonPtsRef.current], fill: brushColor };
            setObjects(prev => [...prev, newObj]);
            emitEvent({ type: 'ADD_OBJECT', object: newObj });
            polygonPtsRef.current = [];
            if (polygonLineRef.current) {
               polygonLineRef.current.hide();
               polygonLineRef.current.getLayer().batchDraw();
            }
            setTool('select');
            setSelectedIds([id]);
            return;
         }
      }
      polygonPtsRef.current.push(pt.x, pt.y);
      if (polygonLineRef.current) {
         polygonLineRef.current.setAttr('points', polygonPtsRef.current);
         polygonLineRef.current.setAttr('stroke', brushColor);
         polygonLineRef.current.setAttr('strokeWidth', 2);
         polygonLineRef.current.setAttr('fill', brushColor + '40'); // slight fill
         polygonLineRef.current.show();
         polygonLineRef.current.getLayer().batchDraw();
      }
      return;
    }
    if (tool === 'rect') {`;
code = code.replace(pDownTarget, pDownReplace);

// 3. Add handlePointerMove logic
const pMoveTarget = `    if (tool === 'draw' && drawingPoints.current.length > 0) {`;
const pMoveReplace = `    if (tool === 'polygon' && polygonPtsRef.current.length > 0) {
      if (polygonLineRef.current) {
         const pts = [...polygonPtsRef.current, pt.x, pt.y];
         polygonLineRef.current.setAttr('points', pts);
         polygonLineRef.current.getLayer().batchDraw();
      }
      return;
    }
    if (tool === 'draw' && drawingPoints.current.length > 0) {`;
code = code.replace(pMoveTarget, pMoveReplace);

// 4. Update renderer in Layer for 'polygon'
const rendererTarget = `              } else if (obj.type === 'text') {`;
const rendererReplace = `              } else if (obj.type === 'polygon') {
                const isSelected = selectedIds.includes(obj.id);
                return (
                  <Line key={obj.id} id={obj.id} x={obj.x} y={obj.y} points={obj.points} fill={obj.fill} closed={true} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} onTransformEnd={handleTransformEnd} stroke={isSelected ? "#6366f1" : "transparent"} strokeWidth={2} />
                );
              } else if (obj.type === 'text') {`;
code = code.replace(rendererTarget, rendererReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
