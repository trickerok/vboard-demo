import fs from 'fs';

let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// handleDragEnd emit
const dragEndTarget = `  const handleDragEnd = (e: any, id: string) => {
    if ((tool !== 'select' && tool !== 'select-lasso')) return;
    const targetIds = selectedIds.includes(id) ? selectedIds : [id];
    
    setObjects(prev => prev.map(o => {
      if (targetIds.includes(o.id)) {
        const node = e.target.getStage().findOne(\`#\${o.id}\`);
        if (node) {
           return { ...o, x: node.x(), y: node.y() };
        }
      }
      return o;
    }));
  };`;
const dragEndReplace = `  const handleDragEnd = (e: any, id: string) => {
    if ((tool !== 'select' && tool !== 'select-lasso')) return;
    const targetIds = selectedIds.includes(id) ? selectedIds : [id];
    
    const changesMap: Record<string, {x: number, y: number}> = {};
    setObjects(prev => prev.map(o => {
      if (targetIds.includes(o.id)) {
        const node = e.target.getStage().findOne(\`#\${o.id}\`);
        if (node) {
           changesMap[o.id] = { x: node.x(), y: node.y() };
           return { ...o, x: node.x(), y: node.y() };
        }
      }
      return o;
    }));
    
    Object.entries(changesMap).forEach(([objId, changes]) => emitEvent({ type: 'UPDATE_OBJECT', id: objId, changes }));
  };`;
code = code.replace(dragEndTarget, dragEndReplace);

// Remove polygon code in pointer events completely
const polyDownTarget = `} else if (tool === 'polygon') {
      drawingPoints.current = [[pt.x, pt.y]];
      if (polygonLineRef.current) {
         polygonLineRef.current.setAttr('points', [pt.x, pt.y]);
         polygonLineRef.current.setAttr('fill', brushColor);
         polygonLineRef.current.show();
         polygonLineRef.current.getLayer().batchDraw();
      }
      setSelectedIds([]);
    }`;
code = code.replace(polyDownTarget, '');

const polyMoveTarget = `if (tool === 'polygon' && drawingPoints.current.length > 0) {
      drawingPoints.current.push([pt.x, pt.y]);
      if (polygonLineRef.current) {
         polygonLineRef.current.setAttr('points', drawingPoints.current.flatMap(p => [p[0], p[1]]));
         polygonLineRef.current.getLayer().batchDraw();
      }
      return;
    }`;
code = code.replace(polyMoveTarget, '');

const polyUpTarget = `} else if (polygonLineRef.current && polygonLineRef.current.isVisible()) {
      if (drawingPoints.current.length > 2) {
        const id = uuidv4();
        const flatPoints = drawingPoints.current.flatMap(p => [p[0], p[1]]);
        const newObj: CanvasObject = { id, type: 'polygon', x: 0, y: 0, points: flatPoints, fill: brushColor };
        setObjects(prev => [...prev, newObj]);
        emitEvent({ type: 'ADD_OBJECT', object: newObj });
      }
      drawingPoints.current = [];
      if (polygonLineRef.current) {
        polygonLineRef.current.hide();
        polygonLineRef.current.setAttr('points', []);
        polygonLineRef.current.getLayer().batchDraw();
      }
    }`;
code = code.replace(polyUpTarget, '');

// CSS background
const wrapperClassTarget = `<div className="flex-1 w-full relative bg-zinc-50 overflow-hidden" ref={containerRef}>`;
const wrapperClassReplace = `<div className={cn("flex-1 w-full relative overflow-hidden", bgType === 'none' ? 'bg-zinc-50' : 'bg-zinc-50')} ref={containerRef}
      style={{
        backgroundImage: bgType === 'grid' 
          ? 'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)' 
          : bgType === 'dots' 
          ? 'radial-gradient(circle, rgba(0,0,0,0.1) 1.5px, transparent 1.5px)' 
          : 'none',
        backgroundSize: '40px 40px',
        backgroundPosition: \`\${stagePos.x}px \${stagePos.y}px\`
      }}>`;
code = code.replace(wrapperClassTarget, wrapperClassReplace);

// Background UI controls
const toolbarWrapperTarget = `<div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 pointer-events-none">`;
const toolbarWrapperReplace = `<div className="absolute top-4 right-4 z-10 flex gap-2">
        <div className="flex items-center p-1 bg-white rounded-xl shadow-md border border-zinc-200">
          <button onClick={() => setBgType('none')} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors", bgType === 'none' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50')}>Clear</button>
          <button onClick={() => setBgType('grid')} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors", bgType === 'grid' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50')}>Grid</button>
          <button onClick={() => setBgType('dots')} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors", bgType === 'dots' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50')}>Dots</button>
        </div>
      </div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 pointer-events-none">`;
code = code.replace(toolbarWrapperTarget, toolbarWrapperReplace);

// Also change shape check for color picker from 'polygon' to nothing
const toolCheckTarget = `{(tool === 'draw' || tool === 'rect' || tool === 'polygon') && (`
const toolCheckReplace = `{(tool === 'draw' || tool === 'rect' || selectedIds.length > 0) && (`
code = code.replace(toolCheckTarget, toolCheckReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
