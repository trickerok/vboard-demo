import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const konvaTarget = `import { Stage, Layer, Rect, Path, Group, Line, Transformer, Circle, RegularPolygon } from 'react-konva';`;
const konvaReplace = `import { Stage, Layer, Rect, Path, Group, Line, Transformer, Circle as KonvaCircle, RegularPolygon } from 'react-konva';`;
code = code.replace(konvaTarget, konvaReplace);

const renderCircleTarget = `<Circle key={obj.id} id={obj.id} x={obj.x} y={obj.y} radius={obj.radius} fill={obj.fill}`;
const renderCircleReplace = `<KonvaCircle key={obj.id} id={obj.id} x={obj.x} y={obj.y} radius={obj.radius} fill={obj.fill}`;
code = code.replace(renderCircleTarget, renderCircleReplace);

const exportTarget = `  const exportToJPG = () => {
    if (!trRef.current) return;
    const stage = trRef.current.getStage();
    if (!stage) return;
    
    // Save original position & scale to restore later
    const oldScale = stage.scaleX();
    const oldPos = stage.position();
    
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
  };`;

const exportReplace = `  const getBoundingBox = () => {
    const stage = trRef.current?.getStage();
    if (!stage) return null;
    
    // Let's get the bounding box of selected objects if any, else all objects
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const targetObjects = selectedIds.length > 0 
      ? objects.filter(o => selectedIds.includes(o.id))
      : objects;
      
    if (targetObjects.length === 0) return null;

    targetObjects.forEach(obj => {
       if (obj.type === 'rect') {
          minX = Math.min(minX, obj.x);
          minY = Math.min(minY, obj.y);
          maxX = Math.max(maxX, obj.x + (obj.width || 0));
          maxY = Math.max(maxY, obj.y + (obj.height || 0));
       } else if (obj.type === 'circle' || obj.type === 'triangle' || (obj.type === 'polygon' && obj.radius)) {
          minX = Math.min(minX, obj.x - (obj.radius || 0));
          minY = Math.min(minY, obj.y - (obj.radius || 0));
          maxX = Math.max(maxX, obj.x + (obj.radius || 0));
          maxY = Math.max(maxY, obj.y + (obj.radius || 0));
       } else if (obj.type === 'text') {
          minX = Math.min(minX, obj.x);
          minY = Math.min(minY, obj.y);
          maxX = Math.max(maxX, obj.x + 300);
          maxY = Math.max(maxY, obj.y + 100);
       } else if (obj.type === 'path' || obj.type === 'polygon') {
          obj.points.forEach((p: any) => {
             const px = (p.x !== undefined ? p.x : (Array.isArray(p) ? p[0] : p)) + (obj.x || 0);
             const py = (p.y !== undefined ? p.y : (Array.isArray(p) ? p[1] : p)) + (obj.y || 0);
             minX = Math.min(minX, px);
             minY = Math.min(minY, py);
             maxX = Math.max(maxX, px);
             maxY = Math.max(maxY, py);
          });
       }
    });
    
    // Add some padding
    const padding = 20;
    return {
      x: minX - padding,
      y: minY - padding,
      width: (maxX - minX) + padding * 2,
      height: (maxY - minY) + padding * 2
    };
  };

  const exportToJPG = () => {
    if (!trRef.current) return;
    const stage = trRef.current.getStage();
    if (!stage) return;
    
    const bbox = getBoundingBox();
    
    const config = bbox ? {
      pixelRatio: 2,
      mimeType: 'image/jpeg',
      backgroundColor: bgColor === 'paper' ? '#fdfbf7' : bgColor === 'gray' ? '#f3f4f6' : '#ffffff',
      x: bbox.x * stage.scaleX() + stage.x(),
      y: bbox.y * stage.scaleY() + stage.y(),
      width: bbox.width * stage.scaleX(),
      height: bbox.height * stage.scaleY()
    } : {
      pixelRatio: 2,
      mimeType: 'image/jpeg',
      backgroundColor: bgColor === 'paper' ? '#fdfbf7' : bgColor === 'gray' ? '#f3f4f6' : '#ffffff'
    };
    
    const dataURL = stage.toDataURL(config);
    
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
    
    const bbox = getBoundingBox();
    
    const config = bbox ? {
      pixelRatio: 2,
      mimeType: 'image/jpeg',
      backgroundColor: bgColor === 'paper' ? '#fdfbf7' : bgColor === 'gray' ? '#f3f4f6' : '#ffffff',
      x: bbox.x * stage.scaleX() + stage.x(),
      y: bbox.y * stage.scaleY() + stage.y(),
      width: bbox.width * stage.scaleX(),
      height: bbox.height * stage.scaleY()
    } : {
      pixelRatio: 2,
      mimeType: 'image/jpeg',
      backgroundColor: bgColor === 'paper' ? '#fdfbf7' : bgColor === 'gray' ? '#f3f4f6' : '#ffffff'
    };
    
    const dataURL = stage.toDataURL(config);
    
    const pdfWidth = bbox ? bbox.width : stage.width();
    const pdfHeight = bbox ? bbox.height : stage.height();
    
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [pdfWidth, pdfHeight]
    });
    
    pdf.addImage(dataURL, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(\`stemboard-\${roomId}.pdf\`);
  };`;
code = code.replace(exportTarget, exportReplace);

const menuTarget = `          <div className="relative">
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
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-zinc-200 p-1 flex gap-1 z-50">`;
const menuReplace = `          <div className="relative" onMouseLeave={() => setShowShapeMenu(false)}>
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
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-zinc-200 p-1 flex gap-1 z-50">`;
code = code.replace(menuTarget, menuReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
