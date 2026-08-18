import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Canvas } from '../components/Canvas';
import { v4 as uuidv4 } from 'uuid';
import { Share2, Check, Settings, Image as ImageIcon } from 'lucide-react';
import { Settings2 } from 'lucide-react';

export function Room() {
  const { roomId } = useParams<{ roomId: string }>();
    const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [bgPattern, setBgPattern] = useState<'none' | 'grid' | 'dots'>('grid');
  const [bgColor, setBgColor] = useState<'white' | 'paper' | 'gray'>('white');
  const [gridSize, setGridSize] = useState(40);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const [localUserId] = useState(() => uuidv4());
  const [localUserName] = useState(() => {
    const names = ["Curious Fox", "Happy Penguin", "Sleepy Bear", "Swift Falcon", "Clever Owl", "Brave Lion", "Jumping Frog", "Sneaky Cat", "Loyal Dog", "Lazy Sloth", "Dancing Turtle", "Fierce Tiger", "Gentle Deer"];
    return names[Math.floor(Math.random() * names.length)];
  });
  const [localUserColor] = useState(() => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'));


  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    // In dev mode on AI Studio, the websocket connects to the same origin, just port 3000
    // but the setup proxies everything smoothly. 
    // Usually passing '/' or letting it default is fine, 
    // but we can explicitly connect to window.location.origin
    const socketInstance = io(window.location.origin, {
      path: '/socket.io/',
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to socket server');
      if (roomId) {
        socketInstance.emit('join_room', roomId);
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from socket server');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [roomId]);

  return (
    <div className="flex h-screen w-full flex-col bg-zinc-100">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 shadow-sm z-10 relative">
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
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'} shadow-sm`} />
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {socket && roomId ? (
          <Canvas socket={socket} roomId={roomId} bgPattern={bgPattern} bgColor={bgColor} gridSize={gridSize} localUserId={localUserId} localUserName={localUserName} localUserColor={localUserColor} />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#f8f9fa]">
            <p className="text-zinc-500 font-medium animate-pulse">Initializing workspace...</p>
          </div>
        )}
      </main>
    </div>
  );
}

