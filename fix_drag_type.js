import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

code = code.replace("const dragStartPos = useRef<Record<string, {x: number, y: number}>>({});", "const dragStartPos = useRef<Record<string, {x: number, y: number, node?: any}>>({});");

fs.writeFileSync('src/components/Canvas.tsx', code);
