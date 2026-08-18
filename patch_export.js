import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const target = `  return (
    <div ref={containerRef} onContextMenu={(e) => e.preventDefault()}`;

const replace = `  const exportToJPG = () => {
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
  };

  return (
    <div ref={containerRef} onContextMenu={(e) => e.preventDefault()}`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/Canvas.tsx', code);
