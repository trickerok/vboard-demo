import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const canvasPropsTarget = `interface CanvasProps {
  socket: Socket | null;
  roomId: string;
  bgPattern?: 'none' | 'grid' | 'dots';
  bgColor?: 'white' | 'paper' | 'gray';
}`;
const canvasPropsReplace = `interface CanvasProps {
  socket: Socket | null;
  roomId: string;
  bgPattern?: 'none' | 'grid' | 'dots';
  bgColor?: 'white' | 'paper' | 'gray';
  localUserId: string;
  localUserName: string;
  localUserColor: string;
}`;
code = code.replace(canvasPropsTarget, canvasPropsReplace);

const canvasFuncTarget = `export function Canvas({ socket, roomId, bgPattern = 'grid', bgColor = 'white' }: CanvasProps) {`;
const canvasFuncReplace = `export function Canvas({ socket, roomId, bgPattern = 'grid', bgColor = 'white', localUserId, localUserName, localUserColor }: CanvasProps) {`;
code = code.replace(canvasFuncTarget, canvasFuncReplace);

const cursorStateInsert = `  // Remote Cursors
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { x: number; y: number; name: string; color: string; lastUpdate: number }>>({});

  useEffect(() => {
    if (!socket) return;
    
    const handleCursorUpdate = (data: { userId: string, name: string, x: number, y: number, color: string }) => {
      setRemoteCursors(prev => ({
        ...prev,
        [data.userId]: { ...data, lastUpdate: Date.now() }
      }));
    };
    
    socket.on('cursor_update', handleCursorUpdate);
    
    return () => {
      socket.off('cursor_update', handleCursorUpdate);
    };
  }, [socket]);
  
  // Clean up stale cursors
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRemoteCursors(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(key => {
          if (now - next[key].lastUpdate > 10000) { // remove after 10s of inactivity
            delete next[key];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);
`;

code = code.replace(
  "  const drawingLineRef = useRef<any>(null);",
  "  const drawingLineRef = useRef<any>(null);\n" + cursorStateInsert
);


// Track pointer move for cursors
const moveTarget = `  const handlePointerMove = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;`;

const moveReplace = `  const handlePointerMove = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    // Emit cursor pos (throttle this slightly in a real app, but this is fine for now)
    const pointer = stage.getPointerPosition();
    if (pointer && socket) {
      const x = (pointer.x - stage.x()) / stage.scaleX();
      const y = (pointer.y - stage.y()) / stage.scaleY();
      // Throttle cursor emit
      if (!window.lastCursorEmit || Date.now() - window.lastCursorEmit > 50) {
         socket.emit('cursor_move', { roomId, userId: localUserId, name: localUserName, x, y, color: localUserColor });
         window.lastCursorEmit = Date.now();
      }
    }`;
code = code.replace(moveTarget, moveReplace);

// Render cursors in the markup
const renderTarget = `          </Layer>
        </Stage>
      )}`;

const renderReplace = `          </Layer>
        </Stage>
      )}
      
      {/* Render Remote Cursors Overlay */}
      {dimensions.width > 0 && trRef.current && (
         <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-hidden">
            {Object.values(remoteCursors).map((cursor: any) => {
               const stage = trRef.current.getStage();
               if (!stage) return null;
               
               // Map stage coordinates to screen coordinates
               const screenX = cursor.x * stage.scaleX() + stage.x();
               const screenY = cursor.y * stage.scaleY() + stage.y();
               
               return (
                  <div 
                     key={cursor.userId}
                     className="absolute flex items-start drop-shadow-md transition-all duration-75"
                     style={{ 
                        transform: \`translate(\${screenX}px, \${screenY}px)\`
                     }}
                  >
                     <MousePointer2 
                        size={20} 
                        color={cursor.color} 
                        fill={cursor.color} 
                        style={{ transform: 'rotate(-25deg)', transformOrigin: 'top left' }}
                     />
                     <div 
                        className="ml-4 mt-2 px-2 py-1 rounded-md text-xs font-semibold text-white shadow-sm whitespace-nowrap"
                        style={{ backgroundColor: cursor.color }}
                     >
                        {cursor.name}
                     </div>
                  </div>
               );
            })}
         </div>
      )}`;

code = code.replace(renderTarget, renderReplace);


fs.writeFileSync('src/components/Canvas.tsx', code);
