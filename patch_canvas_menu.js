import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const toolbarTarget = `          <button onClick={() => setTool('rect')} className={cn("p-2 rounded-lg transition-colors", tool === 'rect' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Square"><Square size={20} /></button>
          <button onClick={() => setTool('circle')} className={cn("p-2 rounded-lg transition-colors", tool === 'circle' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Circle"><Circle size={20} /></button>
          <button onClick={() => setTool('triangle')} className={cn("p-2 rounded-lg transition-colors", tool === 'triangle' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Triangle"><Triangle size={20} /></button>
          <button onClick={() => setTool('polygon')} className={cn("p-2 rounded-lg transition-colors", tool === 'polygon' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Polygon"><Hexagon size={20} /></button>`;

const toolbarReplace = `          <div className="relative">
            <button 
              onClick={() => {
                if (['rect', 'circle', 'triangle', 'polygon'].includes(tool)) {
                  setShowShapeMenu(!showShapeMenu);
                } else {
                  setTool('rect');
                  setShowShapeMenu(true);
                }
              }} 
              className={cn("p-2 rounded-lg transition-colors flex items-center gap-1", ['rect', 'circle', 'triangle', 'polygon'].includes(tool) ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} 
              title="Shapes"
            >
              {tool === 'circle' ? <Circle size={20} /> : tool === 'triangle' ? <Triangle size={20} /> : tool === 'polygon' ? <Hexagon size={20} /> : <Square size={20} />}
            </button>
            {showShapeMenu && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-zinc-200 p-1 flex gap-1 z-50">
                <button onClick={() => { setTool('rect'); setShowShapeMenu(false); }} className={cn("p-2 rounded-lg transition-colors", tool === 'rect' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Square"><Square size={20} /></button>
                <button onClick={() => { setTool('circle'); setShowShapeMenu(false); }} className={cn("p-2 rounded-lg transition-colors", tool === 'circle' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Circle"><Circle size={20} /></button>
                <button onClick={() => { setTool('triangle'); setShowShapeMenu(false); }} className={cn("p-2 rounded-lg transition-colors", tool === 'triangle' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Triangle"><Triangle size={20} /></button>
                <button onClick={() => { setTool('polygon'); setShowShapeMenu(false); }} className={cn("p-2 rounded-lg transition-colors", tool === 'polygon' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Polygon"><Hexagon size={20} /></button>
              </div>
            )}
          </div>`;

code = code.replace(toolbarTarget, toolbarReplace);

const colorsMenuTarget = `            {COLORS.map(c => (
              <button key={c} onClick={() => {
                setBrushColor(c);
                if (selectedIds.length > 0) {
                  setObjects(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, fill: c } : o));
                  selectedIds.forEach(id => emitEvent({ type: 'UPDATE_OBJECT', id, changes: { fill: c } }));
                }
              }} className={cn("w-6 h-6 rounded-full border-2 transition-transform", brushColor === c ? "border-indigo-500 scale-125" : "border-zinc-300 hover:scale-110")} style={{ backgroundColor: c }} />
            ))}
            {tool === 'draw' && (`;

const colorsMenuReplace = `            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1 mr-1">Fill:</span>
              {COLORS.map(c => (
                <button key={c} onClick={() => {
                  setBrushColor(c);
                  if (selectedIds.length > 0) {
                    setObjects(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, fill: c } : o));
                    selectedIds.forEach(id => emitEvent({ type: 'UPDATE_OBJECT', id, changes: { fill: c } }));
                  }
                }} className={cn("w-6 h-6 rounded-full border-2 transition-transform", brushColor === c ? "border-indigo-500 scale-125" : "border-zinc-300 hover:scale-110")} style={{ backgroundColor: c }} />
              ))}
              <div className="relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-transform overflow-hidden cursor-pointer" style={{ borderColor: brushColor === customColor ? '#6366f1' : '#d4d4d8', backgroundColor: customColor, transform: brushColor === customColor ? 'scale(1.25)' : 'scale(1)' }}>
                 <input type="color" value={customColor} onChange={(e) => {
                    const c = e.target.value;
                    setCustomColor(c);
                    setBrushColor(c);
                    if (selectedIds.length > 0) {
                      setObjects(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, fill: c } : o));
                      selectedIds.forEach(id => emitEvent({ type: 'UPDATE_OBJECT', id, changes: { fill: c } }));
                    }
                 }} className="absolute inset-[-10px] w-10 h-10 opacity-0 cursor-pointer" title="Custom Color" />
              </div>
            </div>
            
            {(['rect', 'circle', 'triangle', 'polygon', 'select', 'select-lasso'].includes(tool) || selectedIds.length > 0) && (
              <>
                <div className="w-px h-6 bg-zinc-200 mx-2" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1 mr-1">Stroke:</span>
                  <button onClick={() => {
                      setStrokeColor('transparent');
                      if (selectedIds.length > 0) {
                        setObjects(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, stroke: 'transparent', strokeWidth: 0 } : o));
                        selectedIds.forEach(id => emitEvent({ type: 'UPDATE_OBJECT', id, changes: { stroke: 'transparent', strokeWidth: 0 } }));
                      }
                    }} 
                    className={cn("w-6 h-6 rounded-full border-2 transition-transform relative overflow-hidden", strokeColor === 'transparent' ? "border-indigo-500 scale-125" : "border-zinc-300 hover:scale-110")} 
                    style={{ backgroundColor: 'white' }}
                  >
                     <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-rose-500 -rotate-45 -translate-y-1/2" />
                  </button>
                  {COLORS.map(c => (
                    <button key={c} onClick={() => {
                      setStrokeColor(c);
                      if (selectedIds.length > 0) {
                        setObjects(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, stroke: c, strokeWidth: 4 } : o));
                        selectedIds.forEach(id => emitEvent({ type: 'UPDATE_OBJECT', id, changes: { stroke: c, strokeWidth: 4 } }));
                      }
                    }} className={cn("w-6 h-6 rounded-full border-2 transition-transform", strokeColor === c ? "border-indigo-500 scale-125" : "border-zinc-300 hover:scale-110")} style={{ backgroundColor: c }} />
                  ))}
                  <div className="relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-transform overflow-hidden cursor-pointer" style={{ borderColor: strokeColor !== 'transparent' && !COLORS.includes(strokeColor) ? '#6366f1' : '#d4d4d8', backgroundColor: strokeColor !== 'transparent' && !COLORS.includes(strokeColor) ? strokeColor : '#8b5cf6', transform: strokeColor !== 'transparent' && !COLORS.includes(strokeColor) ? 'scale(1.25)' : 'scale(1)' }}>
                     <input type="color" value={strokeColor !== 'transparent' ? strokeColor : '#8b5cf6'} onChange={(e) => {
                        const c = e.target.value;
                        setStrokeColor(c);
                        if (selectedIds.length > 0) {
                          setObjects(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, stroke: c, strokeWidth: 4 } : o));
                          selectedIds.forEach(id => emitEvent({ type: 'UPDATE_OBJECT', id, changes: { stroke: c, strokeWidth: 4 } }));
                        }
                     }} className="absolute inset-[-10px] w-10 h-10 opacity-0 cursor-pointer" title="Custom Stroke Color" />
                  </div>
                </div>
              </>
            )}
            
            {tool === 'draw' && (`;

code = code.replace(colorsMenuTarget, colorsMenuReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
