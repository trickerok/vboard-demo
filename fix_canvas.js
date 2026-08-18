import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// Fix path saving
code = code.replace(
  "points: finalPoints,",
  "points: finalPoints.map(pt => ({ x: pt[0], y: pt[1], p: pt[2] || 0.5 })),"
);

// Fix getStroke call
// const pathData = getSvgPathFromStroke(getStroke(obj.points, { size: obj.size || 6, thinning: 0.5, smoothing: 0.5, streamline: 0.5 }));
// Needs to pass array of arrays to getStroke if getStroke doesn't like {x,y,p}
code = code.replace(
  "const pathData = getSvgPathFromStroke(getStroke(obj.points,",
  "const pts = obj.points.map(pt => [pt.x, pt.y, pt.p]);\n                const pathData = getSvgPathFromStroke(getStroke(pts,"
);

// Fix collision bounds for path
// obj.points.forEach((p: any) => {
//    let px = Array.isArray(p) ? p[0] : p;
//    let py = Array.isArray(p) ? p[1] : p;
code = code.replace(
  "let px = Array.isArray(p) ? p[0] : p; // handle flat arrays vs nested",
  "let px = p.x !== undefined ? p.x : (Array.isArray(p) ? p[0] : p);"
);
code = code.replace(
  "let py = Array.isArray(p) ? p[1] : p;",
  "let py = p.y !== undefined ? p.y : (Array.isArray(p) ? p[1] : p);"
);

// Fix hit test for eraser for path
// const px = (Array.isArray(p) ? p[0] : p) + (obj.x || 0);
// const py = (Array.isArray(p) ? p[1] : p) + (obj.y || 0);
code = code.replace(
  "const px = (Array.isArray(p) ? p[0] : p) + (obj.x || 0);",
  "const px = (p.x !== undefined ? p.x : (Array.isArray(p) ? p[0] : p)) + (obj.x || 0);"
);
code = code.replace(
  "const py = (Array.isArray(p) ? p[1] : p) + (obj.y || 0);",
  "const py = (p.y !== undefined ? p.y : (Array.isArray(p) ? p[1] : p)) + (obj.y || 0);"
);

// Remove shadow glow for selection
code = code.replace(
  "shadowColor={isSelected ? \"#6366f1\" : \"rgba(0,0,0,0.15)\"} shadowBlur={isSelected ? 10 : 15} shadowOffsetY={isSelected ? 0 : 5}",
  "shadowColor=\"rgba(0,0,0,0.15)\" shadowBlur={15} shadowOffsetY={5} stroke={isSelected ? \"#6366f1\" : \"transparent\"} strokeWidth={2}"
);
code = code.replace(
  "shadowColor={isSelected ? \"#6366f1\" : \"transparent\"} shadowBlur={isSelected ? 10 : 0}",
  "shadowColor=\"transparent\" shadowBlur={0}"
);
code = code.replace(
  "shadowColor={isSelected ? \"#6366f1\" : \"transparent\"} shadowBlur={isSelected ? 10 : 0}",
  "shadowColor=\"transparent\" shadowBlur={0}"
);

fs.writeFileSync('src/components/Canvas.tsx', code);
