import fs from 'fs';

let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// 1. Add handleShapePointerEnter
const dragStartTarget = `  const handleDragStart = (e: any, id: string) => {`;
const dragStartReplace = `  const handleShapePointerEnter = (e: any, id: string) => {
    if (tool === 'eraser' && e.evt.buttons === 1) {
      setObjects(prev => prev.filter(o => o.id !== id));
      setSelectedIds(prev => prev.filter(sid => sid !== id));
      emitEvent({ type: 'DELETE_OBJECTS', ids: [id] });
    }
  };

  const handleDragStart = (e: any, id: string) => {`;
code = code.replace(dragStartTarget, dragStartReplace);

// 2. Modify handlePointerMove for missed pointer ups
const moveButtonsTarget = `    if (e.evt.buttons !== 1) return;
    const pt = getStagePointer(stage);`;
const moveButtonsReplace = `    if (e.evt.buttons !== 1) {
      if (drawingPoints.current.length > 0 || lassoPtsRef.current.length > 0) {
        handlePointerUp(e);
      }
      return;
    }
    const pt = getStagePointer(stage);`;
code = code.replace(moveButtonsTarget, moveButtonsReplace);

// 3. Remove declarative props that cause ghost line React re-renders
const nativeLayerTarget = `{/* Native Layer Drawing for Speed */}
            <Path ref={drawingLineRef} fill={brushColor} visible={false} listening={false} data="" />`;
const nativeLayerReplace = `{/* Native Layer Drawing for Speed */}
            <Path ref={drawingLineRef} visible={false} listening={false} data="" />`;
code = code.replace(nativeLayerTarget, nativeLayerReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
