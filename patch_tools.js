import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const importTarget = `import { MousePointer2, Hand, Pen, Square, Trash2, Eraser, Type, LassoSelect, Hexagon, Undo2, Redo2 } from 'lucide-react';`;
const importReplace = `import { MousePointer2, Hand, Pen, Square, Trash2, Eraser, Type, LassoSelect, Hexagon, Undo2, Redo2, Circle, Triangle, Download } from 'lucide-react';
import jsPDF from 'jspdf';
`;
code = code.replace(importTarget, importReplace);

const toolTarget = `const [tool, setTool] = useState<'select' | 'select-lasso' | 'pan' | 'draw' | 'eraser' | 'text' | 'rect' | 'polygon'>('select');`;
const toolReplace = `const [tool, setTool] = useState<'select' | 'select-lasso' | 'pan' | 'draw' | 'eraser' | 'text' | 'rect' | 'polygon' | 'circle' | 'triangle'>('select');`;
code = code.replace(toolTarget, toolReplace);


// Event handling: down
const downTarget = `    if (tool === 'rect') {
      const id = uuidv4();
      const newObj: CanvasObject = { id, type: 'rect', x: pt.x - 50, y: pt.y - 50, width: 100, height: 100, fill: brushColor };
      setObjects(prev => [...prev, newObj]);
      emitEvent({ type: 'ADD_OBJECT', object: newObj });
      setTool('select');
      setSelectedIds([id]);
      return;
    }`;
const downReplace = `    if (tool === 'rect') {
      const id = uuidv4();
      const newObj: CanvasObject = { id, type: 'rect', x: pt.x - 50, y: pt.y - 50, width: 100, height: 100, fill: brushColor };
      setObjects(prev => [...prev, newObj]);
      emitEvent({ type: 'ADD_OBJECT', object: newObj });
      setTool('select');
      setSelectedIds([id]);
      return;
    }

    if (tool === 'circle') {
      const id = uuidv4();
      const newObj: CanvasObject = { id, type: 'circle', x: pt.x, y: pt.y, radius: 50, fill: brushColor };
      setObjects(prev => [...prev, newObj]);
      emitEvent({ type: 'ADD_OBJECT', object: newObj });
      setTool('select');
      setSelectedIds([id]);
      return;
    }

    if (tool === 'triangle') {
      const id = uuidv4();
      const newObj: CanvasObject = { id, type: 'triangle', x: pt.x, y: pt.y, radius: 50, fill: brushColor };
      setObjects(prev => [...prev, newObj]);
      emitEvent({ type: 'ADD_OBJECT', object: newObj });
      setTool('select');
      setSelectedIds([id]);
      return;
    }`;
code = code.replace(downTarget, downReplace);

// We need to render the shapes in <Layer>
const renderTarget = `              if (obj.type === 'rect') {
                const isSelected = selectedIds.includes(obj.id);
                return (
                  <Rect key={obj.id} id={obj.id} x={obj.x} y={obj.y} width={obj.width} height={obj.height} fill={obj.fill} cornerRadius={8} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} onTransformEnd={handleTransformEnd} shadowColor="rgba(0,0,0,0.15)" shadowBlur={15} shadowOffsetY={5} stroke={isSelected ? "#6366f1" : "transparent"} strokeWidth={2} />
                );`;
const renderReplace = `              if (obj.type === 'rect') {
                const isSelected = selectedIds.includes(obj.id);
                return (
                  <Rect key={obj.id} id={obj.id} x={obj.x} y={obj.y} width={obj.width} height={obj.height} fill={obj.fill} cornerRadius={8} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} onTransformEnd={handleTransformEnd} shadowColor="rgba(0,0,0,0.15)" shadowBlur={15} shadowOffsetY={5} stroke={isSelected ? "#6366f1" : "transparent"} strokeWidth={2} />
                );
              } else if (obj.type === 'circle') {
                const isSelected = selectedIds.includes(obj.id);
                return (
                  <Circle key={obj.id} id={obj.id} x={obj.x} y={obj.y} radius={obj.radius} fill={obj.fill} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor="rgba(0,0,0,0.15)" shadowBlur={15} shadowOffsetY={5} stroke={isSelected ? "#6366f1" : "transparent"} strokeWidth={2} />
                );
              } else if (obj.type === 'triangle') {
                const isSelected = selectedIds.includes(obj.id);
                return (
                  <RegularPolygon key={obj.id} id={obj.id} sides={3} x={obj.x} y={obj.y} radius={obj.radius} fill={obj.fill} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor="rgba(0,0,0,0.15)" shadowBlur={15} shadowOffsetY={5} stroke={isSelected ? "#6366f1" : "transparent"} strokeWidth={2} />
                );`;
code = code.replace(renderTarget, renderReplace);

// Need to import Circle and RegularPolygon from react-konva if not imported
const konvaTarget = `import { Stage, Layer, Rect, Path, Line } from 'react-konva';`;
const konvaReplace = `import { Stage, Layer, Rect, Path, Line, Circle, RegularPolygon } from 'react-konva';`;
if (code.includes(konvaTarget)) {
   code = code.replace(konvaTarget, konvaReplace);
} else {
   code = code.replace(`import { Stage, Layer, Rect, Path, Line, Html } from 'react-konva';`, `import { Stage, Layer, Rect, Path, Line, Circle, RegularPolygon } from 'react-konva';`);
   code = code.replace(`import { Stage, Layer, Rect, Path, Line, Group } from 'react-konva';`, `import { Stage, Layer, Rect, Path, Line, Circle, RegularPolygon, Group } from 'react-konva';`);
}

// Update the Toolbar rendering
const toolbarTarget = `          <button onClick={() => setTool('rect')} className={cn("p-2 rounded-lg transition-colors", tool === 'rect' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Square"><Square size={20} /></button>
          <button onClick={() => setTool('polygon')} className={cn("p-2 rounded-lg transition-colors", tool === 'polygon' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Polygon"><Hexagon size={20} /></button>`;
const toolbarReplace = `          <button onClick={() => setTool('rect')} className={cn("p-2 rounded-lg transition-colors", tool === 'rect' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Square"><Square size={20} /></button>
          <button onClick={() => setTool('circle')} className={cn("p-2 rounded-lg transition-colors", tool === 'circle' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Circle"><Circle size={20} /></button>
          <button onClick={() => setTool('triangle')} className={cn("p-2 rounded-lg transition-colors", tool === 'triangle' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Triangle"><Triangle size={20} /></button>
          <button onClick={() => setTool('polygon')} className={cn("p-2 rounded-lg transition-colors", tool === 'polygon' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Polygon"><Hexagon size={20} /></button>`;
code = code.replace(toolbarTarget, toolbarReplace);

// Let's add Export Buttons to the top-right
const undoRedoTarget = `      <div className="absolute top-4 left-4 z-50 flex items-center gap-1 p-1 bg-white rounded-xl shadow-md border border-zinc-200 pointer-events-auto">
        <button onClick={handleUndo} disabled={undoStack.current.length === 0} className={cn("p-2 rounded-lg transition-colors", undoStack.current.length === 0 ? "text-zinc-300 cursor-not-allowed" : "text-zinc-500 hover:bg-zinc-100")} title="Undo (Ctrl+Z)"><Undo2 size={20} /></button>
        <button onClick={handleRedo} disabled={redoStack.current.length === 0} className={cn("p-2 rounded-lg transition-colors", redoStack.current.length === 0 ? "text-zinc-300 cursor-not-allowed" : "text-zinc-500 hover:bg-zinc-100")} title="Redo (Ctrl+Shift+Z)"><Redo2 size={20} /></button>
      </div>`;

const undoRedoReplace = `      <div className="absolute top-4 left-4 z-50 flex items-center gap-1 p-1 bg-white rounded-xl shadow-md border border-zinc-200 pointer-events-auto">
        <button onClick={handleUndo} disabled={undoStack.current.length === 0} className={cn("p-2 rounded-lg transition-colors", undoStack.current.length === 0 ? "text-zinc-300 cursor-not-allowed" : "text-zinc-500 hover:bg-zinc-100")} title="Undo (Ctrl+Z)"><Undo2 size={20} /></button>
        <button onClick={handleRedo} disabled={redoStack.current.length === 0} className={cn("p-2 rounded-lg transition-colors", redoStack.current.length === 0 ? "text-zinc-300 cursor-not-allowed" : "text-zinc-500 hover:bg-zinc-100")} title="Redo (Ctrl+Shift+Z)"><Redo2 size={20} /></button>
      </div>
      
      <div className="absolute top-4 right-4 z-50 flex items-center gap-1 p-1 bg-white rounded-xl shadow-md border border-zinc-200 pointer-events-auto">
        <button onClick={exportToJPG} className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium text-zinc-600 hover:bg-zinc-100" title="Export JPG"><Download size={16} /> JPG</button>
        <div className="w-px h-4 bg-zinc-200" />
        <button onClick={exportToPDF} className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium text-zinc-600 hover:bg-zinc-100" title="Export PDF"><Download size={16} /> PDF</button>
      </div>`;
code = code.replace(undoRedoTarget, undoRedoReplace);

const methodsTarget = `  const getStroke = require('perfect-freehand').getStroke;`;
const methodsReplace = `  const getStroke = require('perfect-freehand').getStroke;

  const exportToJPG = () => {
    if (!trRef.current) return;
    const stage = trRef.current.getStage();
    if (!stage) return;
    
    // Save original position & scale to restore later
    const oldScale = stage.scaleX();
    const oldPos = stage.position();
    
    // Optional: reset stage to capture everything or just current view
    // Let's capture current view but with higher resolution
    const dataURL = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/jpeg', backgroundColor: bgColor === 'paper' ? '#fdfbf7' : bgColor === 'gray' ? '#f3f4f6' : '#ffffff' });
    
    const link = document.createElement('a');
    link.download = \`stemboard-\${roomId}.jpg\`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (!trRef.current) return;
    const stage = trRef.current.getStage();
    if (!stage) return;
    
    const dataURL = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/jpeg', backgroundColor: bgColor === 'paper' ? '#fdfbf7' : bgColor === 'gray' ? '#f3f4f6' : '#ffffff' });
    
    const pdf = new jsPDF({
      orientation: stage.width() > stage.height() ? 'landscape' : 'portrait',
      unit: 'px',
      format: [stage.width(), stage.height()]
    });
    
    pdf.addImage(dataURL, 'JPEG', 0, 0, stage.width(), stage.height());
    pdf.save(\`stemboard-\${roomId}.pdf\`);
  };
`;
code = code.replace(methodsTarget, methodsReplace);

// Update colors selection block to show for new tools
const colorMenuTarget = `{(tool === 'draw' || tool === 'rect' || selectedIds.length > 0) && (`
const colorMenuReplace = `{(tool === 'draw' || tool === 'rect' || tool === 'circle' || tool === 'triangle' || tool === 'polygon' || selectedIds.length > 0) && (`
code = code.replace(colorMenuTarget, colorMenuReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
