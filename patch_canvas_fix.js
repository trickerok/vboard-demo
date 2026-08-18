import fs from 'fs';

let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const target = `    if (tool === 'eraser') {
      const pt = getStagePointer(stage);
      performErase(pt);
      return;
    }
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
               const px = (Array.isArray(p) ? p[0] : p) + (obj.x || 0);
               const py = (Array.isArray(p) ? p[1] : p) + (obj.y || 0);
               const dx = px - pt.x;
               const dy = py - pt.y;
               if (dx*dx + dy*dy <= eraserRadius*eraserRadius) {
                   idsToDelete.add(obj.id);
                   break;
               }
           }
        } else if (obj.type === 'polygon') {
           for (let i = 0; i < obj.points.length; i+=2) {
               const px = obj.points[i] + (obj.x || 0);
               const py = obj.points[i+1] + (obj.y || 0);
               const dx = px - pt.x;
               const dy = py - pt.y;
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

const replace = `    if (tool === 'eraser') {
      const pt = getStagePointer(stage);
      performErase(pt);
      return;
    }`;

if (code.includes(target)) {
    code = code.replace(target, replace);
    fs.writeFileSync('src/components/Canvas.tsx', code);
    console.log("Fixed!");
} else {
    console.log("Not found.");
}
