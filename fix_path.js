import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// 1. In the render loop for 'path'
const pathTarget = `              } else if (obj.type === 'path') {
                const isSelected = selectedIds.includes(obj.id);
                const flatPts = obj.points.flatMap(p => [p[0], p[1]]);
                return (
                  <Line key={obj.id} id={obj.id} x={obj.x} y={obj.y} points={flatPts} stroke={obj.fill} strokeWidth={obj.size || 6} tension={0.5} lineCap="round" lineJoin="round" hitStrokeWidth={20} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor={isSelected ? "#6366f1" : "transparent"} shadowBlur={isSelected ? 10 : 0} />
                );`;

const pathReplace = `              } else if (obj.type === 'path') {
                const isSelected = selectedIds.includes(obj.id);
                const pathData = getSvgPathFromStroke(getStroke(obj.points, { size: obj.size || 6, thinning: 0.5, smoothing: 0.5, streamline: 0.5 }));
                return (
                  <Path key={obj.id} id={obj.id} x={obj.x} y={obj.y} data={pathData} fill={obj.fill} hitStrokeWidth={20} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor={isSelected ? "#6366f1" : "transparent"} shadowBlur={isSelected ? 10 : 0} />
                );`;
code = code.replace(pathTarget, pathReplace);

// 2. The Native Layer Drawing
const previewTarget = `<Line ref={drawingLineRef} stroke={brushColor} strokeWidth={brushSize} tension={0.5} lineCap="round" lineJoin="round" visible={false} listening={false} points={[]} />`;
const previewReplace = `<Path ref={drawingLineRef} fill={brushColor} visible={false} listening={false} data="" />`;
code = code.replace(previewTarget, previewReplace);

// 3. handlePointerDown for drawing
const downTarget = `      if (drawingLineRef.current) {
         drawingLineRef.current.setAttr('points', [pt.x, pt.y]);
         drawingLineRef.current.setAttr('stroke', brushColor);
         drawingLineRef.current.setAttr('strokeWidth', brushSize);
         drawingLineRef.current.show();
         drawingLineRef.current.getLayer().batchDraw();
      }`;
const downReplace = `      if (drawingLineRef.current) {
         drawingLineRef.current.setAttr('data', getSvgPathFromStroke(getStroke(drawingPoints.current, { size: brushSize, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })));
         drawingLineRef.current.setAttr('fill', brushColor);
         drawingLineRef.current.show();
         drawingLineRef.current.getLayer().batchDraw();
      }`;
code = code.replace(downTarget, downReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
