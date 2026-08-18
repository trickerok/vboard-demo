import fs from 'fs';

let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const target = `        } else if (obj.type === 'path') {
           for (let i = 0; i < obj.points.length; i++) {
               const p = obj.points[i];
               const px = Array.isArray(p) ? p[0] : p;
               const py = Array.isArray(p) ? p[1] : p;
               const dx = px - pt.x;
               const dy = py - pt.y;
               if (dx*dx + dy*dy <= eraserRadius*eraserRadius) {
                   idsToDelete.add(obj.id);
                   break;
               }
           }
        } else if (obj.type === 'polygon') {
           for (let i = 0; i < obj.points.length; i+=2) {
               const dx = obj.points[i] - pt.x;
               const dy = obj.points[i+1] - pt.y;
               if (dx*dx + dy*dy <= eraserRadius*eraserRadius) {
                   idsToDelete.add(obj.id);
                   break;
               }
           }
        }`;

const replace = `        } else if (obj.type === 'path') {
           for (let i = 0; i < obj.points.length; i++) {
               const p = obj.points[i];
               const px = (Array.isArray(p) ? p[0] : p) + (obj.x || 0);
               const py = (Array.isArray(p) ? p[1] : p) + (obj.y || 0);
               const dx = px - pt.x;
               const dy = py - pt.y;
               if (dx*dx + dy*dy <= eraserRadius*eraserRadius) {
                   idsToDelete.add(obj.id);
                   break;
               }
           }
        } else if (obj.type === 'polygon') {
           for (let i = 0; i < obj.points.length; i+=2) {
               const px = obj.points[i] + (obj.x || 0);
               const py = obj.points[i+1] + (obj.y || 0);
               const dx = px - pt.x;
               const dy = py - pt.y;
               if (dx*dx + dy*dy <= eraserRadius*eraserRadius) {
                   idsToDelete.add(obj.id);
                   break;
               }
           }
        }`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/Canvas.tsx', code);
