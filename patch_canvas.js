import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const propsTarget = `interface CanvasProps {
  socket: Socket | null;
  roomId: string;
}`;
const propsReplace = `interface CanvasProps {
  socket: Socket | null;
  roomId: string;
  bgPattern?: 'none' | 'grid' | 'dots';
  bgColor?: 'white' | 'paper' | 'gray';
}`;
code = code.replace(propsTarget, propsReplace);

const fnTarget = `export function Canvas({ socket, roomId }: CanvasProps) {`;
const fnReplace = `export function Canvas({ socket, roomId, bgPattern = 'grid', bgColor = 'white' }: CanvasProps) {`;
code = code.replace(fnTarget, fnReplace);


// Update background colors and panning in useEffects
// Let's create an effect to update containerRef styles when bgPattern or bgColor change.
const effectInsert = `
  useEffect(() => {
    if (!containerRef.current || !trRef.current) return;
    const stage = trRef.current.getStage();
    if (!stage) return;
    
    const bgColorValue = bgColor === 'paper' ? '#fdfbf7' : bgColor === 'gray' ? '#f3f4f6' : '#ffffff';
    const bgImage = 
      bgPattern === 'grid' ? \`linear-gradient(to right, #00000010 1px, transparent 1px), linear-gradient(to bottom, #00000010 1px, transparent 1px)\` :
      bgPattern === 'dots' ? \`radial-gradient(circle, #00000020 1.5px, transparent 1.5px)\` : 'none';
      
    containerRef.current.style.backgroundColor = bgColorValue;
    containerRef.current.style.backgroundImage = bgImage;
    containerRef.current.style.backgroundSize = bgPattern === 'grid' ? \`\${40 * stage.scaleX()}px \${40 * stage.scaleY()}px\` : bgPattern === 'dots' ? \`\${40 * stage.scaleX()}px \${40 * stage.scaleY()}px\` : 'auto';
    containerRef.current.style.backgroundPosition = \`\${stage.x()}px \${stage.y()}px\`;
  }, [bgPattern, bgColor, dimensions]);
  
  // We need to update background position / size on pan and zoom!
  const updateBg = (stage: any) => {
    if (!containerRef.current) return;
    const bgImage = 
      bgPattern === 'grid' ? \`linear-gradient(to right, #00000010 1px, transparent 1px), linear-gradient(to bottom, #00000010 1px, transparent 1px)\` :
      bgPattern === 'dots' ? \`radial-gradient(circle, #00000020 1.5px, transparent 1.5px)\` : 'none';
    
    containerRef.current.style.backgroundImage = bgImage;
    if (bgPattern !== 'none') {
        containerRef.current.style.backgroundSize = \`\${40 * stage.scaleX()}px \${40 * stage.scaleY()}px\`;
        containerRef.current.style.backgroundPosition = \`\${stage.x()}px \${stage.y()}px\`;
    }
  };
`;

code = code.replace(
  "  // Handle Resize",
  effectInsert + "\n  // Handle Resize"
);

// handleWheel -> call updateBg(stage)
const wheelTarget = `    stage.scale({ x: newScale, y: newScale });
    stage.position({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
  };`;
const wheelReplace = `    stage.scale({ x: newScale, y: newScale });
    stage.position({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
    updateBg(stage);
  };`;
code = code.replace(wheelTarget, wheelReplace);


// handlePointerMove -> call updateBg(stage) on pan
const panTarget = `       stage.position({ x: stage.x() + dx, y: stage.y() + dy });
       lastPanRef.current = { x: e.evt.clientX, y: e.evt.clientY };
       return;`;
const panReplace = `       stage.position({ x: stage.x() + dx, y: stage.y() + dy });
       lastPanRef.current = { x: e.evt.clientX, y: e.evt.clientY };
       updateBg(stage);
       return;`;
code = code.replace(panTarget, panReplace);

// We need to make sure the outer div doesn't have a hardcoded bg-[#f8f9fa] class since it conflicts.
const renderDivTarget = `<div ref={containerRef} onContextMenu={(e) => e.preventDefault()} className="h-full w-full relative outline-none overflow-hidden bg-[#f8f9fa]">`;
const renderDivReplace = `<div ref={containerRef} onContextMenu={(e) => e.preventDefault()} className="h-full w-full relative outline-none overflow-hidden transition-colors duration-300">`;
code = code.replace(renderDivTarget, renderDivReplace);


fs.writeFileSync('src/components/Canvas.tsx', code);
