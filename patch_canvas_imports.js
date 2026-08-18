import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

code = code.replace(
  "import { Stage, Layer, Rect, Path, Group, Line, Transformer } from 'react-konva';",
  "import { Stage, Layer, Rect, Path, Group, Line, Transformer, Circle, RegularPolygon } from 'react-konva';"
);

fs.writeFileSync('src/components/Canvas.tsx', code);
