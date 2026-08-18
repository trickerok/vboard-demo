import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const dragStartTarget = `  const handleDragStart = (e: any, id: string) => {
    if ((tool !== 'select' && tool !== 'select-lasso')) return;
    const targetIds = selectedIds.includes(id) ? selectedIds : [id];
    if (!selectedIds.includes(id)) setSelectedIds([id]);
    
    dragStartPos.current = {};
    objects.forEach(o => {
      if (targetIds.includes(o.id)) dragStartPos.current[o.id] = { x: o.x, y: o.y };
    });
  };`;
const dragStartReplace = `  const handleDragStart = (e: any, id: string) => {
    if ((tool !== 'select' && tool !== 'select-lasso')) return;
    const targetIds = selectedIds.includes(id) ? selectedIds : [id];
    if (!selectedIds.includes(id)) setSelectedIds([id]);
    
    dragStartPos.current = {};
    const stage = e.target.getStage();
    objects.forEach(o => {
      if (targetIds.includes(o.id)) {
        const node = stage.findOne(\`#\${o.id}\`);
        dragStartPos.current[o.id] = { x: o.x, y: o.y, node };
      }
    });
  };`;
code = code.replace(dragStartTarget, dragStartReplace);

const dragMoveTarget = `        if (targetId !== id) {
          const node = e.target.getStage().findOne(\`#\${targetId}\`);
          if (node) node.position({ x: newX, y: newY });
        }`;
const dragMoveReplace = `        if (targetId !== id) {
          const node = dragStartPos.current[targetId]?.node;
          if (node) node.position({ x: newX, y: newY });
        }`;
code = code.replace(dragMoveTarget, dragMoveReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
