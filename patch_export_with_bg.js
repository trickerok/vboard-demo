import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const exportTarget = `  const exportToJPG = () => {
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

const exportReplace = `  const exportWithBackground = async (format: 'jpg' | 'pdf') => {
    if (!trRef.current) return;
    const stage = trRef.current.getStage();
    if (!stage) return;
    
    // Hide selections to avoid exporting glowing bounding boxes
    const oldSelectedIds = selectedIds;
    setSelectedIds([]);
    await new Promise(r => setTimeout(r, 50));
    
    const bbox = getBoundingBox();
    const pixelRatio = 2;
    
    const exportX = bbox ? bbox.x * stage.scaleX() + stage.x() : 0;
    const exportY = bbox ? bbox.y * stage.scaleY() + stage.y() : 0;
    const exportWidth = bbox ? bbox.width * stage.scaleX() : stage.width();
    const exportHeight = bbox ? bbox.height * stage.scaleY() : stage.height();

    const canvas = document.createElement('canvas');
    canvas.width = exportWidth * pixelRatio;
    canvas.height = exportHeight * pixelRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
       setSelectedIds(oldSelectedIds);
       return;
    }
    
    // Fill background color
    ctx.fillStyle = bgColor === 'paper' ? '#fdfbf7' : bgColor === 'gray' ? '#f3f4f6' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pattern
    if (bgPattern !== 'none') {
       ctx.strokeStyle = bgPattern === 'grid' ? 'rgba(0,0,0,0.06)' : 'transparent';
       ctx.fillStyle = bgPattern === 'dots' ? 'rgba(0,0,0,0.12)' : 'transparent';
       ctx.lineWidth = 1 * pixelRatio;
       
       const scaledGridSize = gridSize * stage.scaleX() * pixelRatio;
       const offsetX = (stage.x() * pixelRatio) - (exportX * pixelRatio);
       const offsetY = (stage.y() * pixelRatio) - (exportY * pixelRatio);
       
       let startX = offsetX % scaledGridSize;
       let startY = offsetY % scaledGridSize;
       if (startX > 0) startX -= scaledGridSize;
       if (startY > 0) startY -= scaledGridSize;
       
       if (bgPattern === 'grid') {
          ctx.beginPath();
          for (let x = startX; x < canvas.width; x += scaledGridSize) {
             ctx.moveTo(x, 0);
             ctx.lineTo(x, canvas.height);
          }
          for (let y = startY; y < canvas.height; y += scaledGridSize) {
             ctx.moveTo(0, y);
             ctx.lineTo(canvas.width, y);
          }
          ctx.stroke();
       } else if (bgPattern === 'dots') {
          for (let x = startX; x < canvas.width; x += scaledGridSize) {
             for (let y = startY; y < canvas.height; y += scaledGridSize) {
                ctx.beginPath();
                ctx.arc(x, y, 1.5 * pixelRatio, 0, Math.PI * 2);
                ctx.fill();
             }
          }
       }
    }
    
    // Get Konva stage data (without background to let it be transparent, but wait, if it's transparent jpeg it becomes black. We must use png)
    const stageDataURL = stage.toDataURL({
      pixelRatio,
      mimeType: 'image/png',
      x: bbox ? bbox.x * stage.scaleX() + stage.x() : undefined,
      y: bbox ? bbox.y * stage.scaleY() + stage.y() : undefined,
      width: bbox ? bbox.width * stage.scaleX() : undefined,
      height: bbox ? bbox.height * stage.scaleY() : undefined
    });
    
    const img = new Image();
    img.src = stageDataURL;
    await new Promise(r => { img.onload = r; });
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const finalDataURL = canvas.toDataURL('image/jpeg', 0.9);
    
    if (format === 'jpg') {
       const link = document.createElement('a');
       link.download = \`stemboard-\${roomId}.jpg\`;
       link.href = finalDataURL;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
    } else {
       const pdfWidth = bbox ? bbox.width : stage.width();
       const pdfHeight = bbox ? bbox.height : stage.height();
       const pdf = new jsPDF({
         orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
         unit: 'px',
         format: [pdfWidth, pdfHeight]
       });
       pdf.addImage(finalDataURL, 'JPEG', 0, 0, pdfWidth, pdfHeight);
       pdf.save(\`stemboard-\${roomId}.pdf\`);
    }
    
    setSelectedIds(oldSelectedIds);
  };

  const exportToJPG = () => exportWithBackground('jpg');
  const exportToPDF = () => exportWithBackground('pdf');`;

code = code.replace(exportTarget, exportReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
