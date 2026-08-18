import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const targetObjInsert = `    if (tool === 'rect') {
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

const replaceObjInsert = `    if (tool === 'rect') {
      const id = uuidv4();
      const newObj: CanvasObject = { id, type: 'rect', x: pt.x - 50, y: pt.y - 50, width: 100, height: 100, fill: brushColor, stroke: strokeColor, strokeWidth: strokeColor === 'transparent' ? 0 : 4 };
      setObjects(prev => [...prev, newObj]);
      emitEvent({ type: 'ADD_OBJECT', object: newObj });
      setTool('select');
      setSelectedIds([id]);
      return;
    }

    if (tool === 'circle') {
      const id = uuidv4();
      const newObj: CanvasObject = { id, type: 'circle', x: pt.x, y: pt.y, radius: 50, fill: brushColor, stroke: strokeColor, strokeWidth: strokeColor === 'transparent' ? 0 : 4 };
      setObjects(prev => [...prev, newObj]);
      emitEvent({ type: 'ADD_OBJECT', object: newObj });
      setTool('select');
      setSelectedIds([id]);
      return;
    }

    if (tool === 'triangle') {
      const id = uuidv4();
      const newObj: CanvasObject = { id, type: 'triangle', x: pt.x, y: pt.y, radius: 50, fill: brushColor, stroke: strokeColor, strokeWidth: strokeColor === 'transparent' ? 0 : 4 };
      setObjects(prev => [...prev, newObj]);
      emitEvent({ type: 'ADD_OBJECT', object: newObj });
      setTool('select');
      setSelectedIds([id]);
      return;
    }`;
code = code.replace(targetObjInsert, replaceObjInsert);

const polyTarget = `const newObj: CanvasObject = { id, type: 'polygon', x: 0, y: 0, points: [...polygonPtsRef.current], fill: brushColor };`;
const polyReplace = `const newObj: CanvasObject = { id, type: 'polygon', x: 0, y: 0, points: [...polygonPtsRef.current], fill: brushColor, stroke: strokeColor, strokeWidth: strokeColor === 'transparent' ? 0 : 4 };`;
code = code.replace(polyTarget, polyReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
