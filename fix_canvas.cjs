const fs = require('fs');
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// 1. Add TextNode import
code = code.replace("import { getSvgPathFromStroke } from '../lib/freehand';", "import { getSvgPathFromStroke } from '../lib/freehand';\nimport { TextNode } from './TextNode';");

// 2. Fix Eraser tool logic in handlePointerMove
const moveTarget = "if (e.evt.buttons !== 1) return;\n    const pt = getStagePointer(stage);";
const moveReplacement = `    if (e.evt.buttons !== 1) return;
    const pt = getStagePointer(stage);

    if (tool === 'eraser') {
      const pos = stage.getPointerPosition();
      if (pos) {
        const shape = stage.getIntersection(pos);
        if (shape && shape.attrs.id && shape.attrs.id !== 'lasso-line' && shape.attrs.id !== 'drawing-line' && shape.attrs.id !== 'selection-rect') {
          const id = shape.attrs.id;
          setObjects(prev => prev.filter(o => o.id !== id));
          setSelectedIds(prev => prev.filter(sid => sid !== id));
          emitEvent({ type: 'DELETE_OBJECTS', ids: [id] });
        }
      }
      return;
    }`;
code = code.replace(moveTarget, moveReplacement);

// 3. Update select tools and drawing
const selectTarget = `    } else if (tool === 'select') {
      if (e.target === stage) {
        if (!e.evt.shiftKey) setSelectedIds([]);
        lassoPtsRef.current = [pt.x, pt.y];
        if (lassoLineRef.current) {
           lassoLineRef.current.setAttr('points', lassoPtsRef.current);
           lassoLineRef.current.show();
           lassoLineRef.current.getLayer().batchDraw();
        }
      }
    }`;
const selectReplacement = `    } else if (tool === 'select-lasso') {
      if (e.target === stage) {
        if (!e.evt.shiftKey) setSelectedIds([]);
        lassoPtsRef.current = [pt.x, pt.y];
        if (lassoLineRef.current) {
           lassoLineRef.current.setAttr('points', lassoPtsRef.current);
           lassoLineRef.current.show();
           lassoLineRef.current.getLayer().batchDraw();
        }
      }
    } else if (tool === 'select') {
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
    } else if (tool === 'polygon') {
      const pressure = e.evt.pressure ?? 0.5;
      drawingPoints.current = [[pt.x, pt.y, pressure]];
      if (drawingLineRef.current) {
         drawingLineRef.current.setAttr('data', '');
         drawingLineRef.current.setAttr('fill', brushColor);
         drawingLineRef.current.show();
         drawingLineRef.current.getLayer().batchDraw();
      }
      setSelectedIds([]);
    }`;
code = code.replace(selectTarget, selectReplacement);

// 4. Pointer Move updates for select, select-lasso, polygon
const moveLassoTarget = `    if (tool === 'select' && lassoPtsRef.current.length > 0) {
      lassoPtsRef.current.push(pt.x, pt.y);
      if (lassoLineRef.current) {
         lassoLineRef.current.setAttr('points', lassoPtsRef.current);
         lassoLineRef.current.getLayer().batchDraw();
      }
      return;
    }`;
const moveLassoReplacement = `    if (tool === 'select-lasso' && lassoPtsRef.current.length > 0) {
      lassoPtsRef.current.push(pt.x, pt.y);
      if (lassoLineRef.current) {
         lassoLineRef.current.setAttr('closed', false);
         lassoLineRef.current.setAttr('points', lassoPtsRef.current);
         lassoLineRef.current.getLayer().batchDraw();
      }
      return;
    }
    if (tool === 'select' && lassoPtsRef.current.length > 0) {
      const sx = lassoPtsRef.current[0];
      const sy = lassoPtsRef.current[1];
      lassoPtsRef.current = [sx, sy, pt.x, pt.y]; // Store only start and end
      if (lassoLineRef.current) {
         // Draw a box using 5 points
         lassoLineRef.current.setAttr('points', [sx, sy, pt.x, sy, pt.x, pt.y, sx, pt.y, sx, sy]);
         lassoLineRef.current.setAttr('closed', true);
         lassoLineRef.current.getLayer().batchDraw();
      }
      return;
    }
    if (tool === 'polygon' && drawingPoints.current.length > 0) {
      drawingPoints.current.push([pt.x, pt.y]);
      if (drawingLineRef.current) {
         drawingLineRef.current.setAttr('data', getSvgPathFromStroke(getStroke(drawingPoints.current, { size: brushSize, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })));
         drawingLineRef.current.getLayer().batchDraw();
      }
      return;
    }`;
code = code.replace(moveLassoTarget, moveLassoReplacement);

// 5. Pointer Up updates
const upTarget = `    if (tool === 'select' && lassoPtsRef.current.length > 0) {
      if (lassoPtsRef.current.length > 4) {
        const newSelectedIds: string[] = [];
        objects.forEach(obj => {
          let cx = 0, cy = 0;
          if (obj.type === 'rect') {
              cx = obj.x + obj.width / 2;
              cy = obj.y + obj.height / 2;
          } else if (obj.type === 'text') {
              cx = obj.x + 150;
              cy = obj.y + 75;
          } else if (obj.type === 'path') {
              let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
              obj.points.forEach(p => {
                  if (p[0] < minX) minX = p[0];
                  if (p[0] > maxX) maxX = p[0];
                  if (p[1] < minY) minY = p[1];
                  if (p[1] > maxY) maxY = p[1];
              });
              cx = obj.x + (minX + maxX) / 2;
              cy = obj.y + (minY + maxY) / 2;
          }
          if (isPointInPolygon([cx, cy], lassoPtsRef.current)) {
              newSelectedIds.push(obj.id);
          }
        });
        setSelectedIds(prev => e.evt.shiftKey ? Array.from(new Set([...prev, ...newSelectedIds])) : newSelectedIds);
      }
      lassoPtsRef.current = [];
      if (lassoLineRef.current) {
        lassoLineRef.current.hide();
        lassoLineRef.current.getLayer().batchDraw();
      }
    }`;
const upReplacement = `    if ((tool === 'select' || tool === 'select-lasso') && lassoPtsRef.current.length > 0) {
      const isBox = tool === 'select';
      const sx = lassoPtsRef.current[0];
      const sy = lassoPtsRef.current[1];
      const ex = isBox ? lassoPtsRef.current[2] : 0;
      const ey = isBox ? lassoPtsRef.current[3] : 0;
      const minX = isBox ? Math.min(sx, ex) : 0;
      const maxX = isBox ? Math.max(sx, ex) : 0;
      const minY = isBox ? Math.min(sy, ey) : 0;
      const maxY = isBox ? Math.max(sy, ey) : 0;

      if (!isBox ? lassoPtsRef.current.length > 4 : (Math.abs(ex - sx) > 5 && Math.abs(ey - sy) > 5)) {
        const newSelectedIds: string[] = [];
        objects.forEach(obj => {
          let cx = 0, cy = 0;
          if (obj.type === 'rect') {
              cx = obj.x + obj.width / 2;
              cy = obj.y + obj.height / 2;
          } else if (obj.type === 'text') {
              cx = obj.x + (obj.width || 150) / 2;
              cy = obj.y + (obj.height || 50) / 2;
          } else if (obj.type === 'path' || obj.type === 'polygon') {
              let _minX = Infinity, _maxX = -Infinity, _minY = Infinity, _maxY = -Infinity;
              obj.points.forEach((p: any) => {
                  let px = Array.isArray(p) ? p[0] : p; // handle flat arrays vs nested
                  let py = Array.isArray(p) ? p[1] : p;
                  if (px < _minX) _minX = px;
                  if (px > _maxX) _maxX = px;
                  if (py < _minY) _minY = py;
                  if (py > _maxY) _maxY = py;
              });
              cx = obj.x + (_minX + _maxX) / 2;
              cy = obj.y + (_minY + _maxY) / 2;
          }
          
          let selected = false;
          if (isBox) {
             selected = (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY);
          } else {
             selected = isPointInPolygon([cx, cy], lassoPtsRef.current);
          }

          if (selected) {
              newSelectedIds.push(obj.id);
          }
        });
        setSelectedIds(prev => e.evt.shiftKey ? Array.from(new Set([...prev, ...newSelectedIds])) : newSelectedIds);
      }
      lassoPtsRef.current = [];
      if (lassoLineRef.current) {
        lassoLineRef.current.hide();
        lassoLineRef.current.getLayer().batchDraw();
      }
    } else if (tool === 'polygon' && drawingPoints.current.length > 0) {
      if (drawingPoints.current.length > 2) {
        const id = uuidv4();
        // flatten drawing points for polygon
        const flatPoints = drawingPoints.current.flatMap(p => [p[0], p[1]]);
        const newObj: CanvasObject = { id, type: 'polygon', x: 0, y: 0, points: flatPoints, fill: brushColor };
        setObjects(prev => [...prev, newObj]);
        emitEvent({ type: 'ADD_OBJECT', object: newObj });
      }
      drawingPoints.current = [];
      if (drawingLineRef.current) {
        drawingLineRef.current.hide();
        drawingLineRef.current.setAttr('fill', 'transparent'); // reset
        drawingLineRef.current.getLayer().batchDraw();
      }
    }`;
code = code.replace(upTarget, upReplacement);

// 6. Handle tool interactions (handleShapePointerEnter/Down for eraser fix just in case)
const oldEnterTarget = `  const handleShapePointerEnter = (e: any, id: string) => {
    if (tool === 'eraser' && e.evt.buttons === 1) {
      setObjects(prev => prev.filter(o => o.id !== id));
      setSelectedIds(prev => prev.filter(sid => sid !== id));
      emitEvent({ type: 'DELETE_OBJECTS', ids: [id] });
    }
  };`;
code = code.replace(oldEnterTarget, "");

// remove duplicate eraser in handleShapePointerDown
const oldDownTarget = `    if (tool === 'eraser' && e.evt.buttons === 1) {
      setObjects(prev => prev.filter(o => o.id !== id));
      setSelectedIds(prev => prev.filter(sid => sid !== id));
      emitEvent({ type: 'DELETE_OBJECTS', ids: [id] });
      return;
    }`;
code = code.replace(oldDownTarget, "");

// also make sure selection drag tools check for select-lasso
code = code.replace(/tool !== 'select'/g, "(tool !== 'select' && tool !== 'select-lasso')");
code = code.replace(/tool === 'select'/g, "(tool === 'select' || tool === 'select-lasso')");

// We need to render TextNode instead of HTML
const textRenderTarget = `              } else if (obj.type === 'text') {
                const isSelected = selectedIds.includes(obj.id);
                const isEditing = editingId === obj.id;
                return (
                  <Group key={obj.id} id={obj.id} x={obj.x} y={obj.y} draggable={tool === 'select'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onDblClick={(e) => handleShapeDblClick(e, obj.id, obj.type)} onDblTap={(e) => handleShapeDblClick(e, obj.id, obj.type)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)}>
                    <Rect x={0} y={0} width={300} height={100} fill="transparent" stroke={isSelected ? "#6366f1" : "transparent"} strokeWidth={2} shadowColor={isSelected ? "#6366f1" : "transparent"} shadowBlur={isSelected ? 10 : 0} cornerRadius={8} />
                    <Html transform={true} divProps={{ style: { pointerEvents: isEditing ? 'auto' : 'none' } }}>
                      <div onPointerDown={isEditing ? (e) => e.stopPropagation() : undefined} style={{ width: 300 }}>
                        {isEditing ? (
                          <textarea autoFocus className="bg-white text-zinc-900 border-2 border-indigo-500 rounded-lg shadow-xl p-2 outline-none font-mono text-sm resize-y" style={{ minWidth: 300, minHeight: 100 }} defaultValue={obj.content} onBlur={(e) => { setEditingId(null); setObjects(prev => prev.map(o => o.id === obj.id ? { ...o, content: e.target.value } : o)); emitEvent({ type: 'UPDATE_OBJECT', id: obj.id, changes: { content: e.target.value } }); }} onKeyDown={(e) => { if (e.key === 'Escape') e.currentTarget.blur(); if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }} />
                        ) : (
                          <div className={cn("bg-white border rounded-lg shadow-sm p-4 overflow-hidden prose prose-sm max-w-none", isSelected ? "border-indigo-500" : "border-zinc-200")}>
                            <ReactMarkdown 
                              remarkPlugins={[remarkMath, remarkGfm]} 
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                code({node, inline, className, children, ...props}: any) {
                                  const match = /language-(\w+)/.exec(className || '')
                                  return !inline && match ? (
                                    <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className={className} {...props}>{children}</code>
                                  )
                                }
                              }}
                            >
                              {obj.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </Html>
                  </Group>
                );
              }`;

const textRenderReplacement = `              } else if (obj.type === 'text') {
                return (
                  <TextNode
                    key={obj.id}
                    obj={obj}
                    isSelected={selectedIds.includes(obj.id)}
                    isEditing={editingId === obj.id}
                    tool={tool}
                    setEditingId={setEditingId}
                    updateObject={(id, changes) => {
                      setObjects(prev => prev.map(o => o.id === id ? { ...o, ...changes } : o));
                      emitEvent({ type: 'UPDATE_OBJECT', id, changes });
                    }}
                    onPointerDown={(e) => handleShapePointerDown(e, obj.id)}
                    onDblClick={(e) => handleShapeDblClick(e, obj.id, obj.type)}
                    onDragStart={(e) => handleDragStart(e, obj.id)}
                    onDragMove={(e) => handleDragMove(e, obj.id)}
                    onDragEnd={(e) => handleDragEnd(e, obj.id)}
                  />
                );
              } else if (obj.type === 'polygon') {
                const isSelected = selectedIds.includes(obj.id);
                return (
                  <Line key={obj.id} id={obj.id} x={obj.x} y={obj.y} points={obj.points} fill={obj.fill} closed draggable={(tool === 'select' || tool === 'select-lasso')} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor={isSelected ? "#6366f1" : "transparent"} shadowBlur={isSelected ? 10 : 0} stroke={isSelected ? "#6366f1" : "transparent"} strokeWidth={2} />
                );
              }`;
code = code.replace(textRenderTarget, textRenderReplacement);

fs.writeFileSync('src/components/Canvas.tsx', code);
