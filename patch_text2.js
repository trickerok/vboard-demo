import fs from 'fs';

let code = fs.readFileSync('src/components/TextNode.tsx', 'utf-8');

const interfaceTarget = `  onDragMove: (e: any) => void;
  onDragEnd: (e: any) => void;
}`;
const interfaceReplace = `  onDragMove: (e: any) => void;
  onDragEnd: (e: any) => void;
  onPointerEnter: (e: any) => void;
}`;
code = code.replace(interfaceTarget, interfaceReplace);

const propsTarget = `export function TextNode({ obj, isSelected, isEditing, tool, setEditingId, updateObject, onPointerDown, onDblClick, onDragStart, onDragMove, onDragEnd }: TextNodeProps) {`;
const propsReplace = `export function TextNode({ obj, isSelected, isEditing, tool, setEditingId, updateObject, onPointerDown, onDblClick, onDragStart, onDragMove, onDragEnd, onPointerEnter }: TextNodeProps) {`;
code = code.replace(propsTarget, propsReplace);

const groupTarget = `      onDragStart={onDragStart} 
      onDragMove={onDragMove} 
      onDragEnd={onDragEnd}`;
const groupReplace = `      onDragStart={onDragStart} 
      onDragMove={onDragMove} 
      onDragEnd={onDragEnd}
      onPointerEnter={onPointerEnter}`;
code = code.replace(groupTarget, groupReplace);

fs.writeFileSync('src/components/TextNode.tsx', code);

// Now patch Canvas.tsx to pass onPointerEnter to TextNode
let canvasCode = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');
const textNodeRender = `                  <TextNode
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
                  />`;
const textNodeReplace = `                  <TextNode
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
                    onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)}
                    onDblClick={(e) => handleShapeDblClick(e, obj.id, obj.type)}
                    onDragStart={(e) => handleDragStart(e, obj.id)}
                    onDragMove={(e) => handleDragMove(e, obj.id)}
                    onDragEnd={(e) => handleDragEnd(e, obj.id)}
                  />`;
canvasCode = canvasCode.replace(textNodeRender, textNodeReplace);
fs.writeFileSync('src/components/Canvas.tsx', canvasCode);

