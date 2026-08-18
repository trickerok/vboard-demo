import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const shapesMainTarget = `          <div className="w-px h-6 bg-zinc-200 mx-1" />
          <button onClick={() => setTool('rect')} className={cn("p-2 rounded-lg transition-colors", tool === 'rect' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Square"><Square size={20} /></button>
          <button onClick={() => setTool('circle')} className={cn("p-2 rounded-lg transition-colors", tool === 'circle' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Circle"><Circle size={20} /></button>
          <button onClick={() => setTool('triangle')} className={cn("p-2 rounded-lg transition-colors", tool === 'triangle' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Triangle"><Triangle size={20} /></button>
          <button onClick={() => setTool('polygon')} className={cn("p-2 rounded-lg transition-colors", tool === 'polygon' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Polygon"><Hexagon size={20} /></button>
          {selectedIds.length > 0 && <button onClick={() => { setObjects(prev => prev.filter(o => !selectedIds.includes(o.id))); emitEvent({ type: 'DELETE_OBJECTS', ids: selectedIds }); setSelectedIds([]); }} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors" title="Delete Selected"><Trash2 size={20} /></button>}`;

const shapesMainReplace = `          <div className="w-px h-6 bg-zinc-200 mx-1" />
          <button onClick={() => setTool(tool === 'circle' ? 'circle' : tool === 'triangle' ? 'triangle' : tool === 'polygon' ? 'polygon' : 'rect')} className={cn("p-2 rounded-lg transition-colors", ['rect', 'circle', 'triangle', 'polygon'].includes(tool) ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Shapes">
            {tool === 'circle' ? <Circle size={20} /> : tool === 'triangle' ? <Triangle size={20} /> : tool === 'polygon' ? <Hexagon size={20} /> : <Square size={20} />}
          </button>
          {selectedIds.length > 0 && <button onClick={() => { setObjects(prev => prev.filter(o => !selectedIds.includes(o.id))); emitEvent({ type: 'DELETE_OBJECTS', ids: selectedIds }); setSelectedIds([]); }} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors" title="Delete Selected"><Trash2 size={20} /></button>}`;

code = code.replace(shapesMainTarget, shapesMainReplace);

const shapesSubTarget = `          <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl shadow-md border border-zinc-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1 mr-1">Fill:</span>`;

const shapesSubReplace = `          <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl shadow-md border border-zinc-200">
            {['rect', 'circle', 'triangle', 'polygon'].includes(tool) && (
               <div className="flex items-center gap-1 mr-2 border-r pr-3 border-zinc-200">
                 <button onClick={() => setTool('rect')} className={cn("p-1.5 rounded-md transition-colors", tool === 'rect' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Square"><Square size={16} /></button>
                 <button onClick={() => setTool('circle')} className={cn("p-1.5 rounded-md transition-colors", tool === 'circle' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Circle"><Circle size={16} /></button>
                 <button onClick={() => setTool('triangle')} className={cn("p-1.5 rounded-md transition-colors", tool === 'triangle' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Triangle"><Triangle size={16} /></button>
                 <button onClick={() => setTool('polygon')} className={cn("p-1.5 rounded-md transition-colors", tool === 'polygon' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Polygon"><Hexagon size={16} /></button>
               </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1 mr-1">Fill:</span>`;

code = code.replace(shapesSubTarget, shapesSubReplace);

const brushSizeDrawTarget = `            {tool === 'draw' && (
              <>
                <div className="w-px h-4 bg-zinc-200 mx-1" />
                {SIZES.map(s => (
                  <button key={s} onClick={() => setBrushSize(s)} className={cn("w-6 h-6 flex items-center justify-center rounded-md", brushSize === s ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")}>
                    <div className="bg-current rounded-full" style={{ width: s, height: s }} />
                  </button>
                ))}
              </>
            )}`;

const brushSizeDrawReplace = `            {tool === 'draw' && (
              <>
                <div className="w-px h-4 bg-zinc-200 mx-1" />
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1 mr-1">Size:</span>
                <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-24 accent-indigo-500" title="Brush Size" />
                <span className="text-xs text-zinc-500 min-w-[20px]">{brushSize}px</span>
              </>
            )}`;

code = code.replace(brushSizeDrawTarget, brushSizeDrawReplace);

const brushSizePixelTarget = `            {eraserMode === 'pixel' && (
              <>
                <div className="w-px h-4 bg-zinc-200 mx-1" />
                {SIZES.map(s => (
                  <button key={s} onClick={() => setBrushSize(s)} className={cn("w-6 h-6 flex items-center justify-center rounded-md", brushSize === s ? "bg-rose-100 text-rose-700" : "text-zinc-500 hover:bg-zinc-100")}>
                    <div className="bg-current rounded-full" style={{ width: s, height: s }} />
                  </button>
                ))}
              </>
            )}`;

const brushSizePixelReplace = `            {eraserMode === 'pixel' && (
              <>
                <div className="w-px h-4 bg-zinc-200 mx-1" />
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1 mr-1">Size:</span>
                <input type="range" min="1" max="100" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-24 accent-rose-500" title="Eraser Size" />
                <span className="text-xs text-zinc-500 min-w-[20px]">{brushSize}px</span>
              </>
            )}`;

code = code.replace(brushSizePixelTarget, brushSizePixelReplace);

const exportMenuTarget = `      <div className="absolute top-4 right-4 z-50 flex items-center gap-1 p-1 bg-white rounded-xl shadow-md border border-zinc-200 pointer-events-auto">
        <button onClick={exportToJPG} className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium text-zinc-600 hover:bg-zinc-100" title="Export JPG"><Download size={16} /> JPG</button>
        <div className="w-px h-4 bg-zinc-200" />
        <button onClick={exportToPDF} className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium text-zinc-600 hover:bg-zinc-100" title="Export PDF"><Download size={16} /> PDF</button>
      </div>`;

const exportMenuReplace = `      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 pointer-events-auto items-end">
         <div className="flex items-center gap-1 p-1 bg-white rounded-xl shadow-md border border-zinc-200">
           <button onClick={exportToJPG} className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium text-zinc-600 hover:bg-zinc-100" title="Export JPG"><Download size={16} /> JPG</button>
           <div className="w-px h-4 bg-zinc-200" />
           <button onClick={exportToPDF} className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium text-zinc-600 hover:bg-zinc-100" title="Export PDF"><Download size={16} /> PDF</button>
         </div>
         {bgPattern !== 'none' && (
           <div className="flex items-center gap-2 p-1.5 px-3 bg-white rounded-xl shadow-md border border-zinc-200 w-auto">
             <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Grid:</span>
             <input type="range" min="10" max="100" step="5" value={gridSize} onChange={(e) => setGridSize(parseInt(e.target.value))} className="w-24 accent-zinc-500" title="Grid Size" />
             <span className="text-xs text-zinc-500 min-w-[24px] text-right">{gridSize}</span>
           </div>
         )}
      </div>`;

code = code.replace(exportMenuTarget, exportMenuReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
