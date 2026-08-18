import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const importTarget = `import { MousePointer2, Hand, Pen, Square, Trash2, Eraser, Type, LassoSelect, Hexagon } from 'lucide-react';`;
const importReplace = `import { MousePointer2, Hand, Pen, Square, Trash2, Eraser, Type, LassoSelect, Hexagon, Undo2, Redo2 } from 'lucide-react';

type HistoryAction = 
  | { type: 'ADD'; object: CanvasObject }
  | { type: 'UPDATE'; id: string; before: Partial<CanvasObject>; after: Partial<CanvasObject> }
  | { type: 'DELETE'; objects: CanvasObject[] };
`;
code = code.replace(importTarget, importReplace);


const stateTarget = `  const [editingId, setEditingId] = useState<string | null>(null);`;
const stateReplace = `  const [editingId, setEditingId] = useState<string | null>(null);
  
  const undoStack = useRef<HistoryAction[]>([]);
  const redoStack = useRef<HistoryAction[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const objectsRef = useRef<CanvasObject[]>([]);
  
  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);
`;
code = code.replace(stateTarget, stateReplace);

const emitTarget = `  const emitEvent = useCallback((event: CanvasEvent, persist: boolean = true) => {
    if (socket) {
      socket.emit('canvas_event', { roomId, event });
    }
    if (persist) {
      if (event.type === 'ADD_OBJECT') {
        setDoc(doc(db, 'rooms', roomId, 'objects', event.object.id), event.object).catch(console.error);
      } else if (event.type === 'UPDATE_OBJECT') {
        updateDoc(doc(db, 'rooms', roomId, 'objects', event.id), event.changes).catch(console.error);
      } else if (event.type === 'DELETE_OBJECTS') {
        event.ids.forEach(id => {
          deleteDoc(doc(db, 'rooms', roomId, 'objects', id)).catch(console.error);
        });
      }
    }
  }, [socket, roomId]);`;

const emitReplace = `  const emitEvent = useCallback((event: CanvasEvent, persist: boolean = true, skipHistory: boolean = false) => {
    if (socket) {
      socket.emit('canvas_event', { roomId, event });
    }
    if (persist) {
      if (event.type === 'ADD_OBJECT') {
        setDoc(doc(db, 'rooms', roomId, 'objects', event.object.id), event.object).catch(console.error);
      } else if (event.type === 'UPDATE_OBJECT') {
        updateDoc(doc(db, 'rooms', roomId, 'objects', event.id), event.changes).catch(console.error);
      } else if (event.type === 'DELETE_OBJECTS') {
        event.ids.forEach(id => {
          deleteDoc(doc(db, 'rooms', roomId, 'objects', id)).catch(console.error);
        });
      }
    }
    
    if (!skipHistory) {
      if (event.type === 'ADD_OBJECT') {
         undoStack.current.push({ type: 'ADD', object: event.object });
         redoStack.current = [];
         setHistoryCount(c => c + 1);
      } else if (event.type === 'DELETE_OBJECTS') {
         const deletedObjs = objectsRef.current.filter(o => event.ids.includes(o.id));
         undoStack.current.push({ type: 'DELETE', objects: deletedObjs });
         redoStack.current = [];
         setHistoryCount(c => c + 1);
      } else if (event.type === 'UPDATE_OBJECT') {
         const existing = objectsRef.current.find(o => o.id === event.id);
         if (existing) {
            const before: any = {};
            for (const key in event.changes) {
               before[key] = (existing as any)[key];
            }
            undoStack.current.push({ type: 'UPDATE', id: event.id, before, after: event.changes });
            redoStack.current = [];
            setHistoryCount(c => c + 1);
         }
      }
    }
  }, [socket, roomId]);

  const handleUndo = useCallback(() => {
     const action = undoStack.current.pop();
     if (!action) return;
     
     if (action.type === 'ADD') {
        setObjects(prev => prev.filter(o => o.id !== action.object.id));
        emitEvent({ type: 'DELETE_OBJECTS', ids: [action.object.id] }, true, true);
     } else if (action.type === 'DELETE') {
        setObjects(prev => [...prev, ...action.objects]);
        action.objects.forEach(obj => {
           emitEvent({ type: 'ADD_OBJECT', object: obj }, true, true);
        });
     } else if (action.type === 'UPDATE') {
        setObjects(prev => prev.map(o => o.id === action.id ? { ...o, ...action.before } : o));
        emitEvent({ type: 'UPDATE_OBJECT', id: action.id, changes: action.before }, true, true);
     }
     
     redoStack.current.push(action);
     setHistoryCount(c => c + 1);
  }, [emitEvent]);

  const handleRedo = useCallback(() => {
     const action = redoStack.current.pop();
     if (!action) return;
     
     if (action.type === 'ADD') {
        setObjects(prev => [...prev, action.object]);
        emitEvent({ type: 'ADD_OBJECT', object: action.object }, true, true);
     } else if (action.type === 'DELETE') {
        const ids = action.objects.map(o => o.id);
        setObjects(prev => prev.filter(o => !ids.includes(o.id)));
        emitEvent({ type: 'DELETE_OBJECTS', ids }, true, true);
     } else if (action.type === 'UPDATE') {
        setObjects(prev => prev.map(o => o.id === action.id ? { ...o, ...action.after } : o));
        emitEvent({ type: 'UPDATE_OBJECT', id: action.id, changes: action.after }, true, true);
     }
     
     undoStack.current.push(action);
     setHistoryCount(c => c + 1);
  }, [emitEvent]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
       if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return;
       if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
          if (e.shiftKey) {
             handleRedo();
          } else {
             handleUndo();
          }
       } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
          handleRedo();
       }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);
`;

code = code.replace(emitTarget, emitReplace);

const toolbarTarget = `<div className="flex items-center gap-1 p-1 bg-white rounded-xl shadow-md border border-zinc-200">`;
const toolbarReplace = `<div className="absolute top-4 left-4 z-50 flex items-center gap-1 p-1 bg-white rounded-xl shadow-md border border-zinc-200 pointer-events-auto">
        <button onClick={handleUndo} disabled={undoStack.current.length === 0} className={cn("p-2 rounded-lg transition-colors", undoStack.current.length === 0 ? "text-zinc-300 cursor-not-allowed" : "text-zinc-500 hover:bg-zinc-100")} title="Undo (Ctrl+Z)"><Undo2 size={20} /></button>
        <button onClick={handleRedo} disabled={redoStack.current.length === 0} className={cn("p-2 rounded-lg transition-colors", redoStack.current.length === 0 ? "text-zinc-300 cursor-not-allowed" : "text-zinc-500 hover:bg-zinc-100")} title="Redo (Ctrl+Shift+Z)"><Redo2 size={20} /></button>
      </div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1 p-1 bg-white rounded-xl shadow-md border border-zinc-200">`;
code = code.replace(`<div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1 p-1 bg-white rounded-xl shadow-md border border-zinc-200">`, toolbarReplace);

fs.writeFileSync('src/components/Canvas.tsx', code);
