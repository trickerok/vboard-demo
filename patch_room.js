import fs from 'fs';
let code = fs.readFileSync('src/pages/Room.tsx', 'utf-8');

code = code.replace(
  "import { Canvas } from '../components/Canvas';",
  "import { Canvas } from '../components/Canvas';\nimport { Share2, Check } from 'lucide-react';"
);

const stateInsert = `  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [bgPattern, setBgPattern] = useState<'none' | 'grid' | 'dots'>('grid');
  const [bgColor, setBgColor] = useState<'white' | 'paper' | 'gray'>('white');
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };`;

code = code.replace(
  "const [socket, setSocket] = useState<Socket | null>(null);\n  const [isConnected, setIsConnected] = useState(false);",
  stateInsert
);

const headerInsert = `<header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 shadow-sm z-10 relative">
        <h2 className="text-lg font-semibold text-zinc-800">STEMBoard</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1">
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
          </div>

          <button onClick={handleShare} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
          
          <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-200">
            <div className={\`h-2 w-2 rounded-full \${isConnected ? 'bg-emerald-500' : 'bg-rose-500'} shadow-sm\`} />
          </div>
        </div>
      </header>`;

code = code.replace(
  /<header[\s\S]*?<\/header>/,
  headerInsert
);

code = code.replace(
  "<Canvas socket={socket} roomId={roomId} />",
  "<Canvas socket={socket} roomId={roomId} bgPattern={bgPattern} bgColor={bgColor} />"
);

fs.writeFileSync('src/pages/Room.tsx', code);
