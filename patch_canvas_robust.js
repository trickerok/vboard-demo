import fs from 'fs';

let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// 1. Fix Eraser in handlePointerMove
const moveTarget = `    if (tool === 'eraser') {
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

const moveReplace = `    if (tool === 'eraser') {
      if (e.evt.buttons !== 1) return;
      const pt = getStagePointer(stage);
      const eraserRadius = 15 / stage.scaleX();
      const idsToDelete = new Set<string>();
      
      objects.forEach(obj => {
        if (obj.type === 'rect') {
           if (pt.x >= obj.x && pt.x <= obj.x + (obj.width || 0) && pt.y >= obj.y && pt.y <= obj.y + (obj.height || 0)) {
               idsToDelete.add(obj.id);
           }
        } else if (obj.type === 'text') {
           if (pt.x >= obj.x && pt.x <= obj.x + 300 && pt.y >= obj.y && pt.y <= obj.y + 100) {
               idsToDelete.add(obj.id);
           }
        } else if (obj.type === 'path') {
           for (let i = 0; i < obj.points.length; i++) {
               const p = obj.points[i];
               const px = Array.isArray(p) ? p[0] : p;
               const py = Array.isArray(p) ? p[1] : p;
               const dx = px - pt.x;
               const dy = py - pt.y;
               if (dx*dx + dy*dy <= eraserRadius*eraserRadius) {
                   idsToDelete.add(obj.id);
                   break;
               }
           }
        } else if (obj.type === 'polygon') {
           for (let i = 0; i < obj.points.length; i+=2) {
               const dx = obj.points[i] - pt.x;
               const dy = obj.points[i+1] - pt.y;
               if (dx*dx + dy*dy <= eraserRadius*eraserRadius) {
                   idsToDelete.add(obj.id);
                   break;
               }
           }
        }
      });
      
      if (idsToDelete.size > 0) {
         const arr = Array.from(idsToDelete);
         setObjects(prev => prev.filter(o => !idsToDelete.has(o.id)));
         setSelectedIds(prev => prev.filter(id => !idsToDelete.has(id)));
         emitEvent({ type: 'DELETE_OBJECTS', ids: arr });
      }
      return;
    }`;
code = code.replace(moveTarget, moveReplace);


// 2. Fix handlePointerUp to always clean up drawing line
const upDrawTarget = `    if (tool === 'draw' && drawingPoints.current.length > 0) {
      let finalPoints = drawingPoints.current;`;
const upDrawReplace = `    if (drawingPoints.current.length > 0) {
      let finalPoints = drawingPoints.current;`;
code = code.replace(upDrawTarget, upDrawReplace);

const upPolygonTarget = `} else if (tool === 'polygon' && drawingPoints.current.length > 0) {`;
const upPolygonReplace = `} else if (polygonLineRef.current && polygonLineRef.current.isVisible()) {`;
// Wait, is it better to just check if tool === 'polygon' or if drawingPoints.current.length > 0?
// Actually if I replace the polygon check to use isVisible() it's safer.
// Let's manually do it.
code = code.replace(upPolygonTarget, upPolygonReplace);


// 3. Add onPointerLeave to Stage
const stageTarget = `onPointerUp={handlePointerUp}`;
const stageReplace = `onPointerUp={handlePointerUp}
          onPointerLeave={(e) => {
             if (e.evt.buttons === 1) {
                handlePointerUp(e);
             } else {
                // Hard cleanup if we missed it
                drawingPoints.current = [];
                if (drawingLineRef.current) {
                   drawingLineRef.current.setAttr('data', '');
                   drawingLineRef.current.hide();
                }
             }
          }}`;
code = code.replace(stageTarget, stageReplace);

// 4. Restore fill=brushColor to drawingLineRef
const nativeLayerTarget = `{/* Native Layer Drawing for Speed */}
            <Path ref={drawingLineRef} visible={false} listening={false} data="" />`;
const nativeLayerReplace = `{/* Native Layer Drawing for Speed */}
            <Path ref={drawingLineRef} fill={brushColor} visible={false} listening={false} data="" />`;
code = code.replace(nativeLayerTarget, nativeLayerReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
