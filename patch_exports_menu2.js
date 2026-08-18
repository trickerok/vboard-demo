import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const menuTarget = `          <div className="relative" onMouseLeave={() => setShowShapeMenu(false)}>
            <div 
              onMouseEnter={() => setShowShapeMenu(true)}
              onClick={() => {
                if (!['rect', 'circle', 'triangle', 'polygon'].includes(tool)) {
                  setTool('rect');
                }
              }} 
              className={cn("p-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer", ['rect', 'circle', 'triangle', 'polygon'].includes(tool) ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} 
              title="Shapes (Hover to select)"
            >
              {tool === 'circle' ? <Circle size={20} /> : tool === 'triangle' ? <Triangle size={20} /> : tool === 'polygon' ? <Hexagon size={20} /> : <Square size={20} />}
            </div>
            {showShapeMenu && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-zinc-200 p-1 flex gap-1 z-50">
                <button onClick={() => { setTool('rect'); setShowShapeMenu(false); }} className={cn("p-2 rounded-lg transition-colors", tool === 'rect' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Square"><Square size={20} /></button>
                <button onClick={() => { setTool('circle'); setShowShapeMenu(false); }} className={cn("p-2 rounded-lg transition-colors", tool === 'circle' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Circle"><Circle size={20} /></button>
                <button onClick={() => { setTool('triangle'); setShowShapeMenu(false); }} className={cn("p-2 rounded-lg transition-colors", tool === 'triangle' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Triangle"><Triangle size={20} /></button>
                <button onClick={() => { setTool('polygon'); setShowShapeMenu(false); }} className={cn("p-2 rounded-lg transition-colors", tool === 'polygon' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Polygon"><Hexagon size={20} /></button>
              </div>
            )}
          </div>`;

const menuReplace = `          <button onClick={() => setTool('rect')} className={cn("p-2 rounded-lg transition-colors", tool === 'rect' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Square"><Square size={20} /></button>
          <button onClick={() => setTool('circle')} className={cn("p-2 rounded-lg transition-colors", tool === 'circle' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Circle"><Circle size={20} /></button>
          <button onClick={() => setTool('triangle')} className={cn("p-2 rounded-lg transition-colors", tool === 'triangle' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Triangle"><Triangle size={20} /></button>
          <button onClick={() => setTool('polygon')} className={cn("p-2 rounded-lg transition-colors", tool === 'polygon' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Polygon"><Hexagon size={20} /></button>`;
code = code.replace(menuTarget, menuReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
