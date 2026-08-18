import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

code = code.replace(
  "<button onClick={() => setTool('rect')} className={cn(\"p-2 rounded-lg transition-colors\", tool === 'rect' ? \"bg-indigo-100 text-indigo-700\" : \"text-zinc-500 hover:bg-zinc-100\")} title=\"Square\"><Square size={20} /></button>",
  "<button onClick={() => setTool('rect')} className={cn(\"p-2 rounded-lg transition-colors\", tool === 'rect' ? \"bg-indigo-100 text-indigo-700\" : \"text-zinc-500 hover:bg-zinc-100\")} title=\"Square\"><Square size={20} /></button>\n          <button onClick={() => setTool('polygon')} className={cn(\"p-2 rounded-lg transition-colors\", tool === 'polygon' ? \"bg-indigo-100 text-indigo-700\" : \"text-zinc-500 hover:bg-zinc-100\")} title=\"Polygon\"><Hexagon size={20} /></button>"
);

fs.writeFileSync('src/components/Canvas.tsx', code);
