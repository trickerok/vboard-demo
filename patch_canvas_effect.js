import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const oldEffect = `  useEffect(() => {
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
  }, [bgPattern, bgColor, dimensions]);`;

const newEffect = `  useEffect(() => {
    if (!containerRef.current) return;
    
    // We can just grab the stage from the first layer or ref if possible, but fallback is fine
    let scaleX = 1;
    let scaleY = 1;
    let x = 0;
    let y = 0;
    if (trRef.current) {
        const stage = trRef.current.getStage();
        if (stage) {
           scaleX = stage.scaleX();
           scaleY = stage.scaleY();
           x = stage.x();
           y = stage.y();
        }
    }
    
    const bgColorValue = bgColor === 'paper' ? '#fdfbf7' : bgColor === 'gray' ? '#f3f4f6' : '#ffffff';
    const bgImage = 
      bgPattern === 'grid' ? \`linear-gradient(to right, #00000010 1px, transparent 1px), linear-gradient(to bottom, #00000010 1px, transparent 1px)\` :
      bgPattern === 'dots' ? \`radial-gradient(circle, #00000020 2px, transparent 2px)\` : 'none';
      
    containerRef.current.style.backgroundColor = bgColorValue;
    containerRef.current.style.backgroundImage = bgImage;
    containerRef.current.style.backgroundSize = bgPattern === 'grid' ? \`\${40 * scaleX}px \${40 * scaleY}px\` : bgPattern === 'dots' ? \`\${40 * scaleX}px \${40 * scaleY}px\` : 'auto';
    containerRef.current.style.backgroundPosition = \`\${x}px \${y}px\`;
  }, [bgPattern, bgColor, dimensions]);`;

code = code.replace(oldEffect, newEffect);

fs.writeFileSync('src/components/Canvas.tsx', code);
