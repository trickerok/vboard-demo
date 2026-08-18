import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// 1. Add state
code = code.replace(
  "const [editingId, setEditingId] = useState<string | null>(null);",
  "const [editingId, setEditingId] = useState<string | null>(null);\n  const [eraserMode, setEraserMode] = useState<'object' | 'pixel'>('object');"
);

// 2. Toolbar submenu
const targetToolbar = `        {(tool === 'draw' || tool === 'rect' || selectedIds.length > 0) && (
          <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl shadow-md border border-zinc-200">
            {COLORS.map(c => (
              <button key={c} onClick={() => {
                setBrushColor(c);
                if (selectedIds.length > 0) {
                  setObjects(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, fill: c } : o));
                  selectedIds.forEach(id => emitEvent({ type: 'UPDATE_OBJECT', id, changes: { fill: c } }));
                }
              }} className={cn("w-6 h-6 rounded-full border-2 transition-transform", brushColor === c ? "border-indigo-500 scale-125" : "border-zinc-300 hover:scale-110")} style={{ backgroundColor: c }} />
            ))}
            {tool === 'draw' && (
              <>
                <div className="w-px h-4 bg-zinc-200 mx-1" />
                {SIZES.map(s => (
                  <button key={s} onClick={() => setBrushSize(s)} className={cn("w-6 h-6 flex items-center justify-center rounded-md", brushSize === s ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")}>
                    <div className="bg-current rounded-full" style={{ width: s, height: s }} />
                  </button>
                ))}
              </>
            )}
          </div>
        )}`;

const replaceToolbar = `        {(tool === 'draw' || tool === 'rect' || selectedIds.length > 0) && (
          <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl shadow-md border border-zinc-200">
            {COLORS.map(c => (
              <button key={c} onClick={() => {
                setBrushColor(c);
                if (selectedIds.length > 0) {
                  setObjects(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, fill: c } : o));
                  selectedIds.forEach(id => emitEvent({ type: 'UPDATE_OBJECT', id, changes: { fill: c } }));
                }
              }} className={cn("w-6 h-6 rounded-full border-2 transition-transform", brushColor === c ? "border-indigo-500 scale-125" : "border-zinc-300 hover:scale-110")} style={{ backgroundColor: c }} />
            ))}
            {tool === 'draw' && (
              <>
                <div className="w-px h-4 bg-zinc-200 mx-1" />
                {SIZES.map(s => (
                  <button key={s} onClick={() => setBrushSize(s)} className={cn("w-6 h-6 flex items-center justify-center rounded-md", brushSize === s ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")}>
                    <div className="bg-current rounded-full" style={{ width: s, height: s }} />
                  </button>
                ))}
              </>
            )}
          </div>
        )}
        
        {tool === 'eraser' && (
          <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl shadow-md border border-zinc-200 text-sm font-medium">
            <button onClick={() => setEraserMode('object')} className={cn("px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2", eraserMode === 'object' ? "bg-rose-100 text-rose-700" : "text-zinc-500 hover:bg-zinc-100")}>
               <MousePointer2 size={16} /> Object
            </button>
            <button onClick={() => setEraserMode('pixel')} className={cn("px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2", eraserMode === 'pixel' ? "bg-rose-100 text-rose-700" : "text-zinc-500 hover:bg-zinc-100")}>
               <Pen size={16} /> Pixel
            </button>
            
            {eraserMode === 'pixel' && (
              <>
                <div className="w-px h-4 bg-zinc-200 mx-1" />
                {SIZES.map(s => (
                  <button key={s} onClick={() => setBrushSize(s)} className={cn("w-6 h-6 flex items-center justify-center rounded-md", brushSize === s ? "bg-rose-100 text-rose-700" : "text-zinc-500 hover:bg-zinc-100")}>
                    <div className="bg-current rounded-full" style={{ width: s, height: s }} />
                  </button>
                ))}
              </>
            )}
          </div>
        )}`;

code = code.replace(targetToolbar, replaceToolbar);

fs.writeFileSync('src/components/Canvas.tsx', code);
