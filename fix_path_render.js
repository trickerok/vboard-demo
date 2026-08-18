import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const pathRender = `<Path key={obj.id} id={obj.id} x={obj.x} y={obj.y} data={pathData} fill={obj.fill} hitStrokeWidth={20} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor="transparent" shadowBlur={0} />`;

const pathRenderReplace = `<Path key={obj.id} id={obj.id} x={obj.x} y={obj.y} data={pathData} fill={obj.fill} hitStrokeWidth={20} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor="transparent" shadowBlur={0} globalCompositeOperation={obj.isEraser ? 'destination-out' : 'source-over'} />`;

code = code.replace(pathRender, pathRenderReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
