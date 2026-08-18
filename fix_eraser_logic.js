import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// handlePointerDown
const eraseObjDown = `    if (tool === 'eraser') {
      const pt = getStagePointer(stage);
      performErase(pt);
      return;
    }`;
const eraseObjDownReplace = `    if (tool === 'eraser') {
      const pt = getStagePointer(stage);
      if (eraserMode === 'object') {
         performErase(pt);
      } else {
         const pressure = e.evt.pressure ?? 0.5;
         drawingPoints.current = [[pt.x, pt.y]];
         if (drawingLineRef.current) {
            drawingLineRef.current.setAttr('data', getSvgPathFromStroke(getStroke(drawingPoints.current, { size: brushSize, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })));
            drawingLineRef.current.setAttr('fill', '#000000');
            drawingLineRef.current.setAttr('globalCompositeOperation', 'destination-out');
            drawingLineRef.current.show();
            drawingLineRef.current.getLayer().batchDraw();
         }
         setSelectedIds([]);
      }
      return;
    }`;
code = code.replace(eraseObjDown, eraseObjDownReplace);


// handlePointerMove
const eraseObjMove = `    if (tool === 'eraser') {
      const pos = stage.getPointerPosition();
      if (pos) {
        const shape = stage.getIntersection(pos);
        if (shape && shape.attrs.id && shape.attrs.id !== 'lasso-line' && shape.attrs.id !== 'drawing-line' && shape.attrs.id !== 'selection-rect') {
          const id = shape.attrs.id;
          setObjects(prev => prev.filter(o => o.id !== id));
          setSelectedIds(prev => prev.filter(sid => sid !== id));
          emitEvent({ type: 'DELETE_OBJECTS', ids: [id] });
        }
      }
      return;
    }`;
const eraseObjMoveReplace = `    if (tool === 'eraser' && eraserMode === 'object') {
      const pos = stage.getPointerPosition();
      if (pos) {
        const shape = stage.getIntersection(pos);
        if (shape && shape.attrs.id && shape.attrs.id !== 'lasso-line' && shape.attrs.id !== 'drawing-line' && shape.attrs.id !== 'selection-rect') {
          const id = shape.attrs.id;
          setObjects(prev => prev.filter(o => o.id !== id));
          setSelectedIds(prev => prev.filter(sid => sid !== id));
          emitEvent({ type: 'DELETE_OBJECTS', ids: [id] });
        }
      }
      return;
    }
    
    if (tool === 'eraser' && eraserMode === 'pixel' && drawingPoints.current.length > 0) {
      const pressure = e.evt.pressure ?? 0.5;
      if (e.evt.shiftKey && drawingPoints.current.length > 1) {
          drawingPoints.current = [drawingPoints.current[0], [pt.x, pt.y, pressure]];
      } else {
          drawingPoints.current.push([pt.x, pt.y, pressure]);
      }
      if (drawingLineRef.current) {
         drawingLineRef.current.setAttr('data', getSvgPathFromStroke(getStroke(drawingPoints.current, { size: brushSize, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })));
         drawingLineRef.current.getLayer().batchDraw();
      }
      return;
    }`;
code = code.replace(eraseObjMove, eraseObjMoveReplace);

// Fix object eraser on enter
const eraseHover = `  const handleShapePointerEnter = (e: any, id: string) => {
    if (tool === 'eraser' && e.evt.buttons === 1) {`;
const eraseHoverReplace = `  const handleShapePointerEnter = (e: any, id: string) => {
    if (tool === 'eraser' && eraserMode === 'object' && e.evt.buttons === 1) {`;
code = code.replace(eraseHover, eraseHoverReplace);

// Handle draw start `globalCompositeOperation` to source-over
const drawStart = `    if (tool === 'draw') {
      const pressure = e.evt.pressure ?? 0.5;
      drawingPoints.current = [[pt.x, pt.y]];
      if (drawingLineRef.current) {
         drawingLineRef.current.setAttr('data', getSvgPathFromStroke(getStroke(drawingPoints.current, { size: brushSize, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })));
         drawingLineRef.current.setAttr('fill', brushColor);`;
const drawStartReplace = `    if (tool === 'draw') {
      const pressure = e.evt.pressure ?? 0.5;
      drawingPoints.current = [[pt.x, pt.y]];
      if (drawingLineRef.current) {
         drawingLineRef.current.setAttr('data', getSvgPathFromStroke(getStroke(drawingPoints.current, { size: brushSize, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })));
         drawingLineRef.current.setAttr('globalCompositeOperation', 'source-over');
         drawingLineRef.current.setAttr('fill', brushColor);`;
code = code.replace(drawStart, drawStartReplace);


// Handle up - saving the stroke
const drawUp = `    if (tool === 'draw' && drawingPoints.current.length > 0) {
      let finalPoints = drawingPoints.current;
      if (finalPoints.length === 1) {
        finalPoints = [finalPoints[0], [finalPoints[0][0] + 0.1, finalPoints[0][1] + 0.1]];
      }
      const newObj: CanvasObject = {
        id: uuidv4(),
        type: 'path',
        x: 0,
        y: 0,
        points: finalPoints.map(pt => ({ x: pt[0], y: pt[1], p: pt[2] || 0.5 })),
        fill: brushColor,
        size: brushSize
      };`;
const drawUpReplace = `    if ((tool === 'draw' || (tool === 'eraser' && eraserMode === 'pixel')) && drawingPoints.current.length > 0) {
      let finalPoints = drawingPoints.current;
      if (finalPoints.length === 1) {
        finalPoints = [finalPoints[0], [finalPoints[0][0] + 0.1, finalPoints[0][1] + 0.1]];
      }
      const newObj: CanvasObject = {
        id: uuidv4(),
        type: 'path',
        x: 0,
        y: 0,
        points: finalPoints.map(pt => ({ x: pt[0], y: pt[1], p: pt[2] || 0.5 })),
        fill: tool === 'eraser' ? '#000' : brushColor,
        size: brushSize,
        isEraser: tool === 'eraser'
      };`;
code = code.replace(drawUp, drawUpReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
