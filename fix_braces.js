import fs from 'fs';

let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// The missing bracket from polyDownTarget removal
const downTarget = `    } else if ((tool === 'select' || tool === 'select-lasso')) {
      if (e.target === stage) {
        if (!e.evt.shiftKey) setSelectedIds([]);
        lassoPtsRef.current = [pt.x, pt.y, pt.x, pt.y]; // Use lasso points to store box: startX, startY, currentX, currentY
        if (lassoLineRef.current) { // we will use lassoLineRef for drawing a box too (using a Rect later, or just a 4-point polygon)
           // Actually, let's just use the lasso line to draw a 4-point box
           const [sx, sy] = [pt.x, pt.y];
           lassoLineRef.current.setAttr('points', [sx, sy, sx, sy, sx, sy, sx, sy, sx, sy]);
           lassoLineRef.current.setAttr('closed', true);
           lassoLineRef.current.show();
           lassoLineRef.current.getLayer().batchDraw();
        }
      }
      
  };`;

const downReplace = `    } else if ((tool === 'select' || tool === 'select-lasso')) {
      if (e.target === stage) {
        if (!e.evt.shiftKey) setSelectedIds([]);
        lassoPtsRef.current = [pt.x, pt.y, pt.x, pt.y]; // Use lasso points to store box: startX, startY, currentX, currentY
        if (lassoLineRef.current) { // we will use lassoLineRef for drawing a box too (using a Rect later, or just a 4-point polygon)
           // Actually, let's just use the lasso line to draw a 4-point box
           const [sx, sy] = [pt.x, pt.y];
           lassoLineRef.current.setAttr('points', [sx, sy, sx, sy, sx, sy, sx, sy, sx, sy]);
           lassoLineRef.current.setAttr('closed', true);
           lassoLineRef.current.show();
           lassoLineRef.current.getLayer().batchDraw();
        }
      }
    }
  };`;
code = code.replace(downTarget, downReplace);

const upTarget = `      lassoPtsRef.current = [];
      if (lassoLineRef.current) {
        lassoLineRef.current.hide();
        lassoLineRef.current.getLayer().batchDraw();
      }

    if (tool === 'draw' && drawingPoints.current.length > 0) {`;

const upReplace = `      lassoPtsRef.current = [];
      if (lassoLineRef.current) {
        lassoLineRef.current.hide();
        lassoLineRef.current.getLayer().batchDraw();
      }
    }

    if (tool === 'draw' && drawingPoints.current.length > 0) {`;
code = code.replace(upTarget, upReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
