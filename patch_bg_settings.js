import fs from 'fs';

let roomCode = fs.readFileSync('src/pages/Room.tsx', 'utf-8');
let canvasCode = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

// We'll move gridSize state to Room.tsx and pass it down.
const roomImportsTarget = `import { Share2, Check } from 'lucide-react';`;
const roomImportsReplace = `import { Share2, Check, Settings, Image as ImageIcon } from 'lucide-react';\nimport { Settings2 } from 'lucide-react';`;
roomCode = roomCode.replace(roomImportsTarget, roomImportsReplace);

const roomStateTarget = `  const [bgColor, setBgColor] = useState<'white' | 'paper' | 'gray'>('white');`;
const roomStateReplace = `  const [bgColor, setBgColor] = useState<'white' | 'paper' | 'gray'>('white');\n  const [gridSize, setGridSize] = useState(40);\n  const [showBgMenu, setShowBgMenu] = useState(false);`;
roomCode = roomCode.replace(roomStateTarget, roomStateReplace);

const roomHeaderTarget = `          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1"> 
             <select
                 value={bgPattern} 
                 onChange={(e) => setBgPattern(e.target.value as any)}
                className="bg-transparent text-sm font-medium text-zinc-600 outline-none cursor-pointer"
             >
                <option value="none">Blank</option>
                <option value="grid">Grid</option>
                <option value="dots">Dots</option>
             </select>
             <div className="w-px h-4 bg-zinc-200" />
             <select
                 value={bgColor} 
                 onChange={(e) => setBgColor(e.target.value as any)}
                className="bg-transparent text-sm font-medium text-zinc-600 outline-none cursor-pointer"
             >
                <option value="white">White</option>
                <option value="paper">Paper</option>
                <option value="gray">Gray</option>
             </select>
          </div>`;

const roomHeaderReplace = `          <div className="relative">
            <button 
              onClick={() => setShowBgMenu(!showBgMenu)}
              className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors"
            >
              <Settings2 size={16} /> Background
            </button>
            {showBgMenu && (
              <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-zinc-200 p-3 flex flex-col gap-3 z-50 min-w-[200px]">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pattern</span>
                  <select
                     value={bgPattern} 
                     onChange={(e) => setBgPattern(e.target.value as any)}
                    className="bg-zinc-50 border border-zinc-200 text-sm font-medium text-zinc-700 rounded-lg px-2 py-1.5 outline-none cursor-pointer w-full"
                  >
                    <option value="none">Blank</option>
                    <option value="grid">Grid</option>
                    <option value="dots">Dots</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Color</span>
                  <select
                     value={bgColor} 
                     onChange={(e) => setBgColor(e.target.value as any)}
                    className="bg-zinc-50 border border-zinc-200 text-sm font-medium text-zinc-700 rounded-lg px-2 py-1.5 outline-none cursor-pointer w-full"
                  >
                    <option value="white">White</option>
                    <option value="paper">Paper</option>
                    <option value="gray">Gray</option>
                  </select>
                </div>
                {bgPattern !== 'none' && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Grid Size: {gridSize}</span>
                    <input type="range" min="10" max="100" step="5" value={gridSize} onChange={(e) => setGridSize(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                  </div>
                )}
              </div>
            )}
          </div>`;
roomCode = roomCode.replace(roomHeaderTarget, roomHeaderReplace);

const canvasRenderTarget = `<Canvas socket={socket} roomId={roomId} bgPattern={bgPattern} bgColor={bgColor} localUserId={localUserId} localUserName={localUserName} localUserColor={localUserColor} />`;
const canvasRenderReplace = `<Canvas socket={socket} roomId={roomId} bgPattern={bgPattern} bgColor={bgColor} gridSize={gridSize} localUserId={localUserId} localUserName={localUserName} localUserColor={localUserColor} />`;
roomCode = roomCode.replace(canvasRenderTarget, canvasRenderReplace);

fs.writeFileSync('src/pages/Room.tsx', roomCode);

// Fix Canvas.tsx
const canvasPropsTarget = `  bgPattern?: 'none' | 'grid' | 'dots';
  bgColor?: 'white' | 'paper' | 'gray';
  localUserId: string;`;
const canvasPropsReplace = `  bgPattern?: 'none' | 'grid' | 'dots';
  bgColor?: 'white' | 'paper' | 'gray';
  gridSize?: number;
  localUserId: string;`;
canvasCode = canvasCode.replace(canvasPropsTarget, canvasPropsReplace);

const canvasFuncTarget = `export function Canvas({ socket, roomId, bgPattern = 'grid', bgColor = 'white', localUserId, localUserName, localUserColor }: CanvasProps) {`;
const canvasFuncReplace = `export function Canvas({ socket, roomId, bgPattern = 'grid', bgColor = 'white', gridSize = 40, localUserId, localUserName, localUserColor }: CanvasProps) {`;
canvasCode = canvasCode.replace(canvasFuncTarget, canvasFuncReplace);

const gridStateTarget = `const [brushSize, setBrushSize] = useState(SIZES[1]);
  const [gridSize, setGridSize] = useState(40);`;
const gridStateReplace = `const [brushSize, setBrushSize] = useState(SIZES[1]);`;
canvasCode = canvasCode.replace(gridStateTarget, gridStateReplace);

const gridRemoveTarget = `         {bgPattern !== 'none' && (
           <div className="flex items-center gap-2 p-1.5 px-3 bg-white rounded-xl shadow-md border border-zinc-200 w-auto">
             <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Grid:</span>
             <input type="range" min="10" max="100" step="5" value={gridSize} onChange={(e) => setGridSize(parseInt(e.target.value))} className="w-24 accent-zinc-500" title="Grid Size" />
             <span className="text-xs text-zinc-500 min-w-[24px] text-right">{gridSize}</span>
           </div>
         )}`;
canvasCode = canvasCode.replace(gridRemoveTarget, "");

// Improve export quality
const jpegTarget = `const finalDataURL = canvas.toDataURL('image/jpeg', 0.9);`;
const jpegReplace = `const finalDataURL = canvas.toDataURL('image/jpeg', 1.0);`;
canvasCode = canvasCode.replace(jpegTarget, jpegReplace);

const pixelRatioTarget = `const pixelRatio = 2;`;
const pixelRatioReplace = `const pixelRatio = 4; // High Quality Export`;
canvasCode = canvasCode.replace(pixelRatioTarget, pixelRatioReplace);

fs.writeFileSync('src/components/Canvas.tsx', canvasCode);
