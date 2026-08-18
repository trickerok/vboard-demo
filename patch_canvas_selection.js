import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const bboxTarget = `  const getBoundingBox = () => {`;
const bboxReplace = `  const getSelectionBoundingBox = () => {
    if (selectedIds.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const targetObjects = objects.filter(o => selectedIds.includes(o.id));
    if (targetObjects.length === 0) return null;

    targetObjects.forEach(obj => {
       if (obj.type === 'rect') {
          minX = Math.min(minX, obj.x);
          minY = Math.min(minY, obj.y);
          maxX = Math.max(maxX, obj.x + (obj.width || 0));
          maxY = Math.max(maxY, obj.y + (obj.height || 0));
       } else if (obj.type === 'circle' || obj.type === 'triangle' || (obj.type === 'polygon' && obj.radius)) {
          minX = Math.min(minX, obj.x - (obj.radius || 0));
          minY = Math.min(minY, obj.y - (obj.radius || 0));
          maxX = Math.max(maxX, obj.x + (obj.radius || 0));
          maxY = Math.max(maxY, obj.y + (obj.radius || 0));
       } else if (obj.type === 'text') {
          minX = Math.min(minX, obj.x);
          minY = Math.min(minY, obj.y);
          maxX = Math.max(maxX, obj.x + 300);
          maxY = Math.max(maxY, obj.y + 100);
       } else if (obj.type === 'path' || obj.type === 'polygon') {
          obj.points.forEach((p: any) => {
             const px = (p.x !== undefined ? p.x : (Array.isArray(p) ? p[0] : p)) + (obj.x || 0);
             const py = (p.y !== undefined ? p.y : (Array.isArray(p) ? p[1] : p)) + (obj.y || 0);
             minX = Math.min(minX, px);
             minY = Math.min(minY, py);
             maxX = Math.max(maxX, px);
             maxY = Math.max(maxY, py);
          });
       }
    });

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  const selectedBBox = getSelectionBoundingBox();

  const getBoundingBox = () => {`;

code = code.replace(bboxTarget, bboxReplace);

const renderTarget = `{/* Polygon Preview Line */}`;
const renderReplace = `{selectedBBox && (tool === 'select' || tool === 'select-lasso') && selectedIds.length > 0 && (
              <Rect
                x={selectedBBox.x}
                y={selectedBBox.y}
                width={selectedBBox.width}
                height={selectedBBox.height}
                fill="transparent"
                draggable
                onPointerDown={(e) => {
                  // Prevent the stage from seeing this click, which would deselect
                  e.cancelBubble = true;
                }}
                onClick={(e) => {
                  // If they click on the bounding box without dragging, we should clear the selection
                  // because it feels natural to click empty space to deselect.
                  // Wait, if they click the box, maybe they just wanted to select the group?
                  // We'll let them click outside the box to deselect.
                }}
                onDragStart={(e) => {
                  selectedIds.forEach(id => handleDragStart(e, id));
                }}
                onDragMove={(e) => {
                  const dx = e.target.x() - selectedBBox.x;
                  const dy = e.target.y() - selectedBBox.y;
                  selectedIds.forEach(targetId => {
                    if (dragStartPos.current[targetId]) {
                      const newX = dragStartPos.current[targetId].x + dx;
                      const newY = dragStartPos.current[targetId].y + dy;
                      const node = dragStartPos.current[targetId]?.node;
                      if (node) node.position({ x: newX, y: newY });
                    }
                  });
                }}
                onDragEnd={(e) => {
                  const dx = e.target.x() - selectedBBox.x;
                  const dy = e.target.y() - selectedBBox.y;
                  
                  setObjects(prev => {
                    const next = [...prev];
                    const updates: Record<string, any> = {};
                    selectedIds.forEach(id => {
                      const idx = next.findIndex(o => o.id === id);
                      if (idx !== -1 && dragStartPos.current[id]) {
                        next[idx] = { ...next[idx], x: dragStartPos.current[id].x + dx, y: dragStartPos.current[id].y + dy };
                        updates[id] = { x: next[idx].x, y: next[idx].y };
                      }
                    });
                    emitEvent({ type: 'UPDATE_MULTIPLE', updates });
                    return next;
                  });
                  
                  // Reset rect position so it matches the newly updated bbox on next render
                  e.target.position({ x: selectedBBox.x, y: selectedBBox.y });
                }}
              />
            )}
            {/* Polygon Preview Line */}`;

code = code.replace(renderTarget, renderReplace);
fs.writeFileSync('src/components/Canvas.tsx', code);
