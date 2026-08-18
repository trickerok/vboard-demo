import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// The original issue was that I added `|| tool === 'select-lasso'` everywhere `tool === 'select'` appeared.
// Let's replace ALL `(tool === 'select' || tool === 'select-lasso')` with `tool === 'select'`
// EXCEPT where we actually want both.
// Where do we want both?
// 1. draggable={tool === 'select' || tool === 'select-lasso'}
// 2. Transformer logic
// 3. Selection box / lasso logic trigger (but they are separated now)

code = code.replace(/\(tool === 'select' \|\| tool === 'select-lasso'\)/g, "tool === 'select'");

// Now add back lasso support where needed:
// 1. Draggable
code = code.replace(/draggable=\{tool === 'select'\}/g, "draggable={tool === 'select' || tool === 'select-lasso'}");

// 2. Transformer
code = code.replace(/\{tool === 'select' && <Transformer/g, "{(tool === 'select' || tool === 'select-lasso') && <Transformer");

// 3. handleShapePointerDown
code = code.replace(/if \(tool === 'select'\) {/g, "if (tool === 'select' || tool === 'select-lasso') {");

// 4. handleShapeDblClick
code = code.replace(/if \(tool === 'select' && type === 'text'\)/g, "if ((tool === 'select' || tool === 'select-lasso') && type === 'text')");

// 5. In handlePointerUp, the selection logic:
code = code.replace(/if \(tool === 'select' && lassoPtsRef.current.length > 0\) {/g, "if ((tool === 'select' || tool === 'select-lasso') && lassoPtsRef.current.length > 0) {");

// 6. In tool button styling (around 570)
code = code.replace(/className=\{cn\("p-2 rounded-lg transition-colors", tool === 'select' \? "bg-indigo-100/g, "className={cn(\"p-2 rounded-lg transition-colors\", tool === 'select' ? \"bg-indigo-100");

// Also, the error for TS2367 was `"polygon"` and `"select-lasso"`. Where did `"polygon"` come from?
// Is there a place where I did `obj.type === 'select'`?
// No, the error said `types '"polygon"' and '"select-lasso"' have no overlap.`
// Oh!
// In `handlePointerDown`, earlier we saw:
// `} else if (tool === 'select-lasso') {`
// followed by `} else if (tool === 'select') {` (which was changed to `tool === 'select' || tool === 'select-lasso'`).
// If `tool` was defined as `'select' | 'select-lasso' | ... | 'polygon'`, then `tool` CAN be `'polygon'`.

fs.writeFileSync('src/components/Canvas.tsx', code);
