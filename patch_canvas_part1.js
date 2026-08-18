import fs from 'fs';

let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// --- 1. REMOVE PERFECT-FREEHAND ---
code = code.replace(/import \{ getStroke \} from 'perfect-freehand';\n?/, '');
code = code.replace(/import \{ getSvgPathFromStroke \} from '\.\.\/lib\/utils';\n?/, '');

// Fix drawing preview (Line instead of Path)
const drawingPreviewTarget = `<Path ref={drawingLineRef} fill={brushColor} visible={false} listening={false} data="" />`;
const drawingPreviewReplace = `<Line ref={drawingLineRef} stroke={brushColor} strokeWidth={brushSize} tension={0.5} lineCap="round" lineJoin="round" visible={false} listening={false} points={[]} />`;
code = code.replace(drawingPreviewTarget, drawingPreviewReplace);

const drawingPreviewFallback = `<Path ref={drawingLineRef} visible={false} listening={false} data="" />`;
code = code.replace(drawingPreviewFallback, drawingPreviewReplace);

// Update handlePointerMove drawing logic to use Line points instead of SVG path
const moveDrawTarget = `drawingPoints.current = [[pt.x, pt.y, pressure]];
      if (drawingLineRef.current) {
         drawingLineRef.current.setAttr('data', getSvgPathFromStroke(getStroke(drawingPoints.current, { size: brushSize, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })));
         drawingLineRef.current.show();
         drawingLineRef.current.getLayer().batchDraw();
      }`;
const moveDrawReplace = `drawingPoints.current = [[pt.x, pt.y]];
      if (drawingLineRef.current) {
         drawingLineRef.current.setAttr('points', [pt.x, pt.y]);
         drawingLineRef.current.setAttr('stroke', brushColor);
         drawingLineRef.current.setAttr('strokeWidth', brushSize);
         drawingLineRef.current.show();
         drawingLineRef.current.getLayer().batchDraw();
      }`;
code = code.replace(moveDrawTarget, moveDrawReplace);

const moveDrawContinueTarget = `if (tool === 'draw' && drawingPoints.current.length > 0) {
      const pressure = e.evt.pressure ?? 0.5;
      drawingPoints.current.push([pt.x, pt.y, pressure]);
      if (drawingLineRef.current) {
         drawingLineRef.current.setAttr('data', getSvgPathFromStroke(getStroke(drawingPoints.current, { size: brushSize, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })));
         drawingLineRef.current.getLayer().batchDraw();
      }
    }`;
const moveDrawContinueReplace = `if (tool === 'draw' && drawingPoints.current.length > 0) {
      drawingPoints.current.push([pt.x, pt.y]);
      if (drawingLineRef.current) {
         drawingLineRef.current.setAttr('points', drawingPoints.current.flatMap(p => [p[0], p[1]]));
         drawingLineRef.current.getLayer().batchDraw();
      }
    }`;
code = code.replace(moveDrawContinueTarget, moveDrawContinueReplace);

// Replace saved Path rendering with Line
const pathRenderTarget = `} else if (obj.type === 'path') {
                const isSelected = selectedIds.includes(obj.id);
                const pathData = getSvgPathFromStroke(getStroke(obj.points, { size: obj.size || 6, thinning: 0.5, smoothing: 0.5, streamline: 0.5 }));
                return (
                  <Path key={obj.id} id={obj.id} x={obj.x} y={obj.y} data={pathData} fill={obj.fill} stroke="transparent" strokeWidth={20} hitStrokeWidth={20} draggable={(tool === 'select' || tool === 'select-lasso')} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor={isSelected ? "#6366f1" : "transparent"} shadowBlur={isSelected ? 10 : 0} />
                );`;
const pathRenderReplace = `} else if (obj.type === 'path') {
                const isSelected = selectedIds.includes(obj.id);
                const flatPts = obj.points.flatMap(p => [p[0], p[1]]);
                return (
                  <Line key={obj.id} id={obj.id} x={obj.x} y={obj.y} points={flatPts} stroke={obj.fill} strokeWidth={obj.size || 6} tension={0.5} lineCap="round" lineJoin="round" hitStrokeWidth={20} draggable={(tool === 'select' || tool === 'select-lasso')} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor={isSelected ? "#6366f1" : "transparent"} shadowBlur={isSelected ? 10 : 0} />
                );`;
code = code.replace(pathRenderTarget, pathRenderReplace);

// Fix points save in handlePointerUp
const upDrawTarget2 = `if (drawingPoints.current.length > 0) {
      let finalPoints = drawingPoints.current;
      if (finalPoints.length === 1) {
        finalPoints = [finalPoints[0], [finalPoints[0][0] + 0.1, finalPoints[0][1] + 0.1, finalPoints[0][2]]];
      }`;
const upDrawReplace2 = `if (tool === 'draw' && drawingPoints.current.length > 0) {
      let finalPoints = drawingPoints.current;
      if (finalPoints.length === 1) {
        finalPoints = [finalPoints[0], [finalPoints[0][0] + 0.1, finalPoints[0][1] + 0.1]];
      }`;
code = code.replace(upDrawTarget2, upDrawReplace2);

const cleanupDrawTarget = `drawingPoints.current = [];
      if (drawingLineRef.current) {
        drawingLineRef.current.setAttr('data', '');
        drawingLineRef.current.hide();
        drawingLineRef.current.getLayer().batchDraw();
      }`;
const cleanupDrawReplace = `drawingPoints.current = [];
      if (drawingLineRef.current) {
        drawingLineRef.current.setAttr('points', []);
        drawingLineRef.current.hide();
        drawingLineRef.current.getLayer().batchDraw();
      }`;
code = code.replace(cleanupDrawTarget, cleanupDrawReplace);

// --- 2. FIX DRAG LAG ---
const dragMoveTarget = `targetIds.forEach(targetId => {
      if (dragStartPos.current[targetId]) {
        const newX = dragStartPos.current[targetId].x + dx;
        const newY = dragStartPos.current[targetId].y + dy;
        changesMap[targetId] = { x: newX, y: newY };
        if (targetId !== id) {
          const node = e.target.getStage().findOne(\`#\${targetId}\`);
          if (node) node.position({ x: newX, y: newY });
        }
      }
    });

    const now = Date.now();
    if (now - (lastEmitRef.current.drag || 0) > 30) {
      Object.entries(changesMap).forEach(([objId, changes]) => emitEvent({ type: 'UPDATE_OBJECT', id: objId, changes }, false));
      lastEmitRef.current.drag = now;
    }`;
const dragMoveReplace = `targetIds.forEach(targetId => {
      if (dragStartPos.current[targetId]) {
        const newX = dragStartPos.current[targetId].x + dx;
        const newY = dragStartPos.current[targetId].y + dy;
        
        if (targetId !== id) {
          const node = e.target.getStage().findOne(\`#\${targetId}\`);
          if (node) node.position({ x: newX, y: newY });
        }
      }
    });`;
code = code.replace(dragMoveTarget, dragMoveReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
