import fs from 'fs';

let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// Eraser fix in handlePointerDown
const downEraserTarget = `if (tool === 'eraser') {
      if (e.evt.buttons !== 1) return;
      const pt = getStagePointer(stage);`;
const downEraserReplace = `const performErase = (pt: any) => {
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
    };

    if (tool === 'eraser') {
      const pt = getStagePointer(stage);
      performErase(pt);
      return;
    }`;
code = code.replace(downEraserTarget, downEraserReplace);

// Remove performErase duplicate block in move and just call it
const moveEraserTarget = `if (tool === 'eraser') {
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
const moveEraserReplace = `if (tool === 'eraser') {
      if (e.evt.buttons !== 1) return;
      const pt = getStagePointer(stage);
      performErase(pt);
      return;
    }`;
code = code.replace(moveEraserTarget, moveEraserReplace);

// Background Grid Support - Add CSS and Toolbar buttons
const bgStateTarget = `const [brushSize, setBrushSize] = useState<number>(6);`;
const bgStateReplace = `const [brushSize, setBrushSize] = useState<number>(6);
  const [bgType, setBgType] = useState<'none'|'grid'|'dots'>('dots');`;
code = code.replace(bgStateTarget, bgStateReplace);

// Color Update when selected
const colorBtnTarget = `<button key={c} onClick={() => setBrushColor(c)} className={cn("w-6 h-6 rounded-full border-2", brushColor === c ? "border-indigo-500 scale-110" : "border-transparent")} style={{ backgroundColor: c }} />`;
const colorBtnReplace = `<button key={c} onClick={() => {
                setBrushColor(c);
                if (selectedIds.length > 0) {
                  setObjects(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, fill: c } : o));
                  selectedIds.forEach(id => emitEvent({ type: 'UPDATE_OBJECT', id, changes: { fill: c } }));
                }
              }} className={cn("w-6 h-6 rounded-full border-2 transition-transform", brushColor === c ? "border-indigo-500 scale-125" : "border-zinc-300 hover:scale-110")} style={{ backgroundColor: c }} />`;
code = code.replace(colorBtnTarget, colorBtnReplace);

const toolbarButtonsTarget = `<button onClick={() => setTool('rect')} className={cn("p-2 rounded-lg transition-colors", tool === 'rect' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Square"><Square size={20} /></button>
          <button onClick={() => setTool('polygon')} className={cn("p-2 rounded-lg transition-colors", tool === 'polygon' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Polygon Shape"><Hexagon size={20} /></button>`;
const toolbarButtonsReplace = `<button onClick={() => setTool('rect')} className={cn("p-2 rounded-lg transition-colors", tool === 'rect' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Square"><Square size={20} /></button>`;
code = code.replace(toolbarButtonsTarget, toolbarButtonsReplace);


fs.writeFileSync('src/components/Canvas.tsx', code);
