import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// 1. Remove the old polygon drawing logic from handlePointerDown
const oldPolyTarget = `    if (tool === 'polygon') {
      const sx = pt.x, sy = pt.y;
      if (polygonPtsRef.current.length >= 6) {
         const firstX = polygonPtsRef.current[0];
         const firstY = polygonPtsRef.current[1];
         const dx = sx - firstX;
         const dy = sy - firstY;
         if (dx*dx + dy*dy < 400) {
            const id = uuidv4();
            const newObj: CanvasObject = { id, type: 'polygon', x: 0, y: 0, points: [...polygonPtsRef.current], fill: brushColor, stroke: strokeColor, strokeWidth: strokeColor === 'transparent' ? 0 : 4 };
            setObjects(prev => [...prev, newObj]);
            emitEvent({ type: 'ADD_OBJECT', object: newObj });
            polygonPtsRef.current = [];
            if (polygonLineRef.current) {
               polygonLineRef.current.hide();
               polygonLineRef.current.getLayer().batchDraw();
            }
            setTool('select');
            setSelectedIds([id]);
            return;
         }
      }
      polygonPtsRef.current.push(pt.x, pt.y);
      if (polygonLineRef.current) {
         polygonLineRef.current.setAttr('points', polygonPtsRef.current);
         polygonLineRef.current.setAttr('stroke', brushColor);
         polygonLineRef.current.setAttr('strokeWidth', 2);
         polygonLineRef.current.setAttr('fill', brushColor + '40'); // slight fill
         polygonLineRef.current.show();
         polygonLineRef.current.getLayer().batchDraw();
      }
      return;
    }`;

code = code.replace(oldPolyTarget, "");

// 2. Add 'polygon' to the drop-shape block
const toolInsertTarget = `    if (tool === 'triangle') {
      const id = uuidv4();
      const newObj: CanvasObject = { id, type: 'triangle', x: pt.x, y: pt.y, radius: 50, fill: brushColor, stroke: strokeColor, strokeWidth: strokeColor === 'transparent' ? 0 : 4 };
      setObjects(prev => [...prev, newObj]);
      emitEvent({ type: 'ADD_OBJECT', object: newObj });
      setTool('select');
      setSelectedIds([id]);
      return;
    }`;

const toolInsertReplace = `    if (tool === 'triangle') {
      const id = uuidv4();
      const newObj: CanvasObject = { id, type: 'triangle', x: pt.x, y: pt.y, radius: 50, fill: brushColor, stroke: strokeColor, strokeWidth: strokeColor === 'transparent' ? 0 : 4 };
      setObjects(prev => [...prev, newObj]);
      emitEvent({ type: 'ADD_OBJECT', object: newObj });
      setTool('select');
      setSelectedIds([id]);
      return;
    }

    if (tool === 'polygon') {
      const id = uuidv4();
      // Use hexagon for polygon tool
      const newObj: CanvasObject = { id, type: 'polygon', x: pt.x, y: pt.y, points: [], radius: 50, sides: 6, fill: brushColor, stroke: strokeColor, strokeWidth: strokeColor === 'transparent' ? 0 : 4 };
      setObjects(prev => [...prev, newObj]);
      emitEvent({ type: 'ADD_OBJECT', object: newObj });
      setTool('select');
      setSelectedIds([id]);
      return;
    }`;
code = code.replace(toolInsertTarget, toolInsertReplace);

// 3. Fix Rendering to support stroke properly and use glowing shadow for selection
const renderTarget = `              if (obj.type === 'rect') {
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
                );
              } else if (obj.type === 'path') {
                const isSelected = selectedIds.includes(obj.id);
                const pts = obj.points.map(pt => [pt.x, pt.y, pt.p]);
                const pathData = getSvgPathFromStroke(getStroke(pts, { size: obj.size || 6, thinning: 0.5, smoothing: 0.5, streamline: 0.5 }));
                return (
                  <Path key={obj.id} id={obj.id} x={obj.x} y={obj.y} data={pathData} fill={obj.fill} hitStrokeWidth={20} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor="transparent" shadowBlur={0} globalCompositeOperation={obj.isEraser ? 'destination-out' : 'source-over'} />
                );
              } else if (obj.type === 'polygon') {
                const isSelected = selectedIds.includes(obj.id);
                return (
                  <Line key={obj.id} id={obj.id} x={obj.x} y={obj.y} points={obj.points} fill={obj.fill} closed={true} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} onTransformEnd={handleTransformEnd} stroke={isSelected ? "#6366f1" : "transparent"} strokeWidth={2} />
                );
              }`;

const renderReplace = `              if (obj.type === 'rect') {
                const isSelected = selectedIds.includes(obj.id);
                return (
                  <Rect key={obj.id} id={obj.id} x={obj.x} y={obj.y} width={obj.width} height={obj.height} fill={obj.fill} cornerRadius={8} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} onTransformEnd={handleTransformEnd} shadowColor={isSelected ? "#6366f1" : "rgba(0,0,0,0.15)"} shadowBlur={isSelected ? 10 : 15} shadowOffsetY={isSelected ? 0 : 5} stroke={obj.stroke || "transparent"} strokeWidth={obj.strokeWidth || 0} />
                );
              } else if (obj.type === 'circle') {
                const isSelected = selectedIds.includes(obj.id);
                return (
                  <Circle key={obj.id} id={obj.id} x={obj.x} y={obj.y} radius={obj.radius} fill={obj.fill} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor={isSelected ? "#6366f1" : "rgba(0,0,0,0.15)"} shadowBlur={isSelected ? 10 : 15} shadowOffsetY={isSelected ? 0 : 5} stroke={obj.stroke || "transparent"} strokeWidth={obj.strokeWidth || 0} />
                );
              } else if (obj.type === 'triangle') {
                const isSelected = selectedIds.includes(obj.id);
                return (
                  <RegularPolygon key={obj.id} id={obj.id} sides={3} x={obj.x} y={obj.y} radius={obj.radius} fill={obj.fill} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor={isSelected ? "#6366f1" : "rgba(0,0,0,0.15)"} shadowBlur={isSelected ? 10 : 15} shadowOffsetY={isSelected ? 0 : 5} stroke={obj.stroke || "transparent"} strokeWidth={obj.strokeWidth || 0} />
                );
              } else if (obj.type === 'path') {
                const isSelected = selectedIds.includes(obj.id);
                const pts = obj.points.map(pt => [pt.x, pt.y, pt.p]);
                const pathData = getSvgPathFromStroke(getStroke(pts, { size: obj.size || 6, thinning: 0.5, smoothing: 0.5, streamline: 0.5 }));
                return (
                  <Path key={obj.id} id={obj.id} x={obj.x} y={obj.y} data={pathData} fill={obj.fill} hitStrokeWidth={20} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor={isSelected ? "#6366f1" : "transparent"} shadowBlur={isSelected ? 10 : 0} globalCompositeOperation={obj.isEraser ? 'destination-out' : 'source-over'} />
                );
              } else if (obj.type === 'polygon') {
                const isSelected = selectedIds.includes(obj.id);
                // We changed polygon to just be a RegularPolygon with 6 sides instead of a custom Line if it has a radius.
                if (obj.radius) {
                   return (
                     <RegularPolygon key={obj.id} id={obj.id} sides={obj.sides || 6} x={obj.x} y={obj.y} radius={obj.radius} fill={obj.fill} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor={isSelected ? "#6366f1" : "rgba(0,0,0,0.15)"} shadowBlur={isSelected ? 10 : 15} shadowOffsetY={isSelected ? 0 : 5} stroke={obj.stroke || "transparent"} strokeWidth={obj.strokeWidth || 0} />
                   );
                } else {
                   return (
                     <Line key={obj.id} id={obj.id} x={obj.x} y={obj.y} points={obj.points} fill={obj.fill} closed={true} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} onTransformEnd={handleTransformEnd} stroke={obj.stroke || "transparent"} strokeWidth={obj.strokeWidth || 4} shadowColor={isSelected ? "#6366f1" : "transparent"} shadowBlur={isSelected ? 10 : 0} />
                   );
                }
              }`;

code = code.replace(renderTarget, renderReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
