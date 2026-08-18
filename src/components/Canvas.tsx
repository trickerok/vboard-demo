import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Path, Group, Line, Transformer, Circle as KonvaCircle, RegularPolygon } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';
import { Socket } from 'socket.io-client';
import { CanvasObject, CanvasEvent } from '../types';
import { MousePointer2, Hand, Pen, Square, Trash2, Eraser, Type, LassoSelect, Hexagon, Undo2, Redo2, Circle, Triangle, Download } from 'lucide-react';
import jsPDF from 'jspdf';


type HistoryAction = 
  | { type: 'ADD'; object: CanvasObject }
  | { type: 'UPDATE'; id: string; before: Partial<CanvasObject>; after: Partial<CanvasObject> }
  | { type: 'DELETE'; objects: CanvasObject[] };

import { cn } from '../lib/utils';
import { Html } from 'react-konva-utils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getSvgPathFromStroke } from '../lib/freehand';
import getStroke from 'perfect-freehand';
import { TextNode } from './TextNode';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import 'katex/dist/katex.min.css';

interface CanvasProps {
  socket: Socket | null;
  roomId: string;
  bgPattern?: 'none' | 'grid' | 'dots';
  bgColor?: 'white' | 'paper' | 'gray';
  gridSize?: number;
  localUserId: string;
  localUserName: string;
  localUserColor: string;
}

const COLORS = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308'];
const SIZES = [4, 8, 12, 16];

export function Canvas({ socket, roomId, bgPattern = 'grid', bgColor = 'white', gridSize = 40, localUserId, localUserName, localUserColor }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trRef = useRef<any>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  useEffect(() => {
    if (trRef.current) {
      const nodes = selectedIds.map(id => trRef.current.getStage().findOne(`#${id}`)).filter(Boolean);
      trRef.current.nodes(nodes);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedIds, objects]);
  


  // Tools and Settings
  const [tool, setTool] = useState<'select' | 'select-lasso' | 'pan' | 'draw' | 'eraser' | 'text' | 'rect' | 'polygon' | 'circle' | 'triangle'>('select');
  const [brushColor, setBrushColor] = useState(COLORS[0]);
  const [customColor, setCustomColor] = useState('#8b5cf6');
  const [strokeColor, setStrokeColor] = useState('transparent');
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [brushSize, setBrushSize] = useState(SIZES[1]);

  const [isSpacePan, setIsSpacePan] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const undoStack = useRef<HistoryAction[]>([]);
  const redoStack = useRef<HistoryAction[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const objectsRef = useRef<CanvasObject[]>([]);
  
  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  const [eraserMode, setEraserMode] = useState<'object' | 'pixel'>('object');

  // Fast Native Refs
  const lastPanRef = useRef<{ x: number, y: number } | null>(null);
  const dragStartPos = useRef<Record<string, {x: number, y: number, node?: any}>>({});
  const lastEmitRef = useRef<Record<string, number>>({});
  
  const drawingLineRef = useRef<any>(null);
  // Remote Cursors
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

  const polygonLineRef = useRef<any>(null);
  const drawingPoints = useRef<number[][]>([]);
  
  const lassoLineRef = useRef<any>(null);
  const lassoPtsRef = useRef<number[]>([]);
  const polygonPtsRef = useRef<number[]>([]);

    useEffect(() => {
    if (tool !== 'polygon') {
      polygonPtsRef.current = [];
      if (polygonLineRef.current) {
        polygonLineRef.current.hide();
        polygonLineRef.current.getLayer()?.batchDraw();
      }
    }
  }, [tool]);


  useEffect(() => {
    if (!containerRef.current) return;
    
    // We can just grab the stage from the first layer or ref if possible, but fallback is fine
    let scaleX = 1;
    let scaleY = 1;
    let x = 0;
    let y = 0;
    if (trRef.current) {
        const stage = trRef.current.getStage();
        if (stage) {
           scaleX = stage.scaleX();
           scaleY = stage.scaleY();
           x = stage.x();
           y = stage.y();
        }
    }
    
    const bgColorValue = bgColor === 'paper' ? '#fdfbf7' : bgColor === 'gray' ? '#f3f4f6' : '#ffffff';
    const bgImage = 
      bgPattern === 'grid' ? `linear-gradient(to right, #00000010 1px, transparent 1px), linear-gradient(to bottom, #00000010 1px, transparent 1px)` :
      bgPattern === 'dots' ? `radial-gradient(circle, #00000020 2px, transparent 2px)` : 'none';
      
    containerRef.current.style.backgroundColor = bgColorValue;
    containerRef.current.style.backgroundImage = bgImage;
    containerRef.current.style.backgroundSize = bgPattern === 'grid' ? `${gridSize * scaleX}px ${gridSize * scaleY}px` : bgPattern === 'dots' ? `${gridSize * scaleX}px ${gridSize * scaleY}px` : 'auto';
    containerRef.current.style.backgroundPosition = `${x}px ${y}px`;
  }, [bgPattern, bgColor, dimensions, gridSize]);
  
  // We need to update background position / size on pan and zoom!
  const updateBg = (stage: any) => {
    if (!containerRef.current) return;
    const bgImage = 
      bgPattern === 'grid' ? `linear-gradient(to right, #00000010 1px, transparent 1px), linear-gradient(to bottom, #00000010 1px, transparent 1px)` :
      bgPattern === 'dots' ? `radial-gradient(circle, #00000020 1.5px, transparent 1.5px)` : 'none';
    
    containerRef.current.style.backgroundImage = bgImage;
    if (bgPattern !== 'none') {
        containerRef.current.style.backgroundSize = `${gridSize * stage.scaleX()}px ${gridSize * stage.scaleY()}px`;
        containerRef.current.style.backgroundPosition = `${stage.x()}px ${stage.y()}px`;
    }
  };

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if editing text
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePan(true);
      }
      if (e.code === 'Delete' && selectedIds.length > 0) {
        setObjects(prev => prev.filter(o => !selectedIds.includes(o.id)));
        emitEvent({ type: 'DELETE_OBJECTS', ids: selectedIds });
        setSelectedIds([]);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePan(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedIds]);

  // Socket Events
  useEffect(() => {
    if (!socket) return;
    const handleCanvasEvent = (event: CanvasEvent) => {
      if (event.type === 'ADD_OBJECT') {
        setObjects((prev) => prev.find((o) => o.id === event.object.id) ? prev : [...prev, event.object]);
      } else if (event.type === 'UPDATE_OBJECT') {
        setObjects((prev) => prev.map((obj) => (obj.id === event.id ? ({ ...obj, ...event.changes } as CanvasObject) : obj)));
      } else if (event.type === 'DELETE_OBJECTS') {
        setObjects((prev) => prev.filter((obj) => !event.ids.includes(obj.id)));
        setSelectedIds((prev) => prev.filter(id => !event.ids.includes(id)));
      }
    };
    socket.on('canvas_event', handleCanvasEvent);
    return () => { socket.off('canvas_event', handleCanvasEvent); };
  }, [socket]);

  const emitEvent = useCallback((event: CanvasEvent, persist: boolean = true, skipHistory: boolean = false) => {
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


  // Load existing objects from Firestore
  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'rooms', roomId, 'objects'));
        const loadedObjects: CanvasObject[] = [];
        querySnapshot.forEach((doc) => {
          loadedObjects.push(doc.data() as CanvasObject);
        });
        setObjects(loadedObjects);
      } catch (err) {
        console.error("Failed to load objects", err);
      }
    };
    fetchObjects();
  }, [roomId]);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
    if (newScale < 0.1 || newScale > 10) return;
    stage.scale({ x: newScale, y: newScale });
    stage.position({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
    updateBg(stage);
  };

  const getStagePointer = (stage: any) => {
    const pointer = stage.getPointerPosition();
    return {
      x: (pointer.x - stage.x()) / stage.scaleX(),
      y: (pointer.y - stage.y()) / stage.scaleY()
    };
  };

  const handlePointerDown = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;

    if (e.evt.button === 1 || e.evt.button === 2 || tool === 'pan' || isSpacePan) {
       lastPanRef.current = { x: e.evt.clientX, y: e.evt.clientY };
       return;
    }

    const pt = getStagePointer(stage);
    const performErase = (pt: any) => {
      const eraserRadius = 15 / stage.scaleX();
      const idsToDelete = new Set<string>();
      
      objects.forEach(obj => {
        if (obj.type === 'rect') {
           if (pt.x >= obj.x && pt.x <= obj.x + (obj.width || 0) && pt.y >= obj.y && pt.y <= obj.y + (obj.height || 0)) {
               idsToDelete.add(obj.id);
           }
        } else if (obj.type === 'text') {
           if (pt.x >= obj.x && pt.x <= obj.x + 300 && pt.y >= obj.y && pt.y <= obj.y + 100) {
               idsToDelete.add(obj.id);
           }
        } else if (obj.type === 'path') {
           for (let i = 0; i < obj.points.length; i++) {
               const p = obj.points[i];
               const px = (p.x !== undefined ? p.x : (Array.isArray(p) ? p[0] : p)) + (obj.x || 0);
               const py = (p.y !== undefined ? p.y : (Array.isArray(p) ? p[1] : p)) + (obj.y || 0);
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
        }
      });
      
      if (idsToDelete.size > 0) {
         const arr = Array.from(idsToDelete);
         setObjects(prev => prev.filter(o => !idsToDelete.has(o.id)));
         setSelectedIds(prev => prev.filter(id => !idsToDelete.has(id)));
         emitEvent({ type: 'DELETE_OBJECTS', ids: arr });
      }
    };

    if (tool === 'eraser') {
      const pt = getStagePointer(stage);
      if (eraserMode === 'object') {
         performErase(pt);
      } else {
         const pressure = e.evt.pressure ?? 0.5;
         drawingPoints.current = [[pt.x, pt.y]];
         if (drawingLineRef.current) {
            drawingLineRef.current.setAttr('data', getSvgPathFromStroke(getStroke(drawingPoints.current, { size: brushSize, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })));
            drawingLineRef.current.setAttr('fill', '#000000');
            drawingLineRef.current.setAttr('globalCompositeOperation', 'destination-out');
            drawingLineRef.current.show();
            drawingLineRef.current.getLayer().batchDraw();
         }
         setSelectedIds([]);
      }
      return;
    }

    if (tool === 'text') {
      const id = uuidv4();
      const newObj: CanvasObject = { id, type: 'text', x: pt.x, y: pt.y, content: 'Double click to edit...\n\nMath: $$E = mc^2$$\n\n```js\nconsole.log("Code");\n```' };
      setObjects(prev => [...prev, newObj]);
      emitEvent({ type: 'ADD_OBJECT', object: newObj });
      setEditingId(id);
      setTool('select');
      setSelectedIds([id]);
      return;
    }


    if (tool === 'rect') {
      const id = uuidv4();
      const newObj: CanvasObject = { id, type: 'rect', x: pt.x - 50, y: pt.y - 50, width: 100, height: 100, fill: brushColor, stroke: strokeColor, strokeWidth: strokeColor === 'transparent' ? 0 : 4 };
      setObjects(prev => [...prev, newObj]);
      emitEvent({ type: 'ADD_OBJECT', object: newObj });
      setTool('select');
      setSelectedIds([id]);
      return;
    }

    if (tool === 'circle') {
      const id = uuidv4();
      const newObj: CanvasObject = { id, type: 'circle', x: pt.x, y: pt.y, radius: 50, fill: brushColor, stroke: strokeColor, strokeWidth: strokeColor === 'transparent' ? 0 : 4 };
      setObjects(prev => [...prev, newObj]);
      emitEvent({ type: 'ADD_OBJECT', object: newObj });
      setTool('select');
      setSelectedIds([id]);
      return;
    }

    if (tool === 'triangle') {
      const id = uuidv4();
      const newObj: CanvasObject = { id, type: 'triangle', x: pt.x, y: pt.y, radius: 50, fill: brushColor, stroke: strokeColor, strokeWidth: strokeColor === 'transparent' ? 0 : 4 };
      setObjects(prev => [...prev, newObj]);
      emitEvent({ type: 'ADD_OBJECT', object: newObj });
      setTool('select');
      setSelectedIds([id]);
      return;
    }

    if (tool === 'polygon') {
      const id = uuidv4();
      // Use hexagon for polygon tool
      const newObj: CanvasObject = { id, type: 'polygon', x: pt.x, y: pt.y, points: [], radius: 50, sides: 6, fill: brushColor, stroke: strokeColor, strokeWidth: strokeColor === 'transparent' ? 0 : 4 };
      setObjects(prev => [...prev, newObj]);
      emitEvent({ type: 'ADD_OBJECT', object: newObj });
      setTool('select');
      setSelectedIds([id]);
      return;
    }

    if (tool === 'draw') {
      const pressure = e.evt.pressure ?? 0.5;
      drawingPoints.current = [[pt.x, pt.y]];
      if (drawingLineRef.current) {
         drawingLineRef.current.setAttr('data', getSvgPathFromStroke(getStroke(drawingPoints.current, { size: brushSize, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })));
         drawingLineRef.current.setAttr('globalCompositeOperation', 'source-over');
         drawingLineRef.current.setAttr('fill', brushColor);
         drawingLineRef.current.show();
         drawingLineRef.current.getLayer().batchDraw();
      }
      setSelectedIds([]);
    } else if (tool === 'select-lasso') {
      if (e.target === stage) {
        if (!e.evt.shiftKey) setSelectedIds([]);
        lassoPtsRef.current = [pt.x, pt.y];
        if (lassoLineRef.current) {
           lassoLineRef.current.setAttr('points', lassoPtsRef.current);
           lassoLineRef.current.show();
           lassoLineRef.current.getLayer().batchDraw();
        }
      }
    } else if (tool === 'select') {
      if (e.target === stage) {
        if (!e.evt.shiftKey) setSelectedIds([]);
        lassoPtsRef.current = [pt.x, pt.y, pt.x, pt.y]; // Use lasso points to store box: startX, startY, currentX, currentY
        if (lassoLineRef.current) { // we will use lassoLineRef for drawing a box too (using a Rect later, or just a 4-point polygon)
           // Actually, let's just use the lasso line to draw a 4-point box
           const [sx, sy] = [pt.x, pt.y];
           lassoLineRef.current.setAttr('points', [sx, sy, sx, sy, sx, sy, sx, sy, sx, sy]);
           lassoLineRef.current.setAttr('closed', true);
           lassoLineRef.current.show();
           lassoLineRef.current.getLayer().batchDraw();
        }
      }
    }
  };

  const handlePointerMove = (e: any) => {
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
    }

    if (lastPanRef.current && (e.evt.buttons === 4 || e.evt.buttons === 2 || (e.evt.buttons === 1 && (tool === 'pan' || isSpacePan)))) {
       const dx = e.evt.clientX - lastPanRef.current.x;
       const dy = e.evt.clientY - lastPanRef.current.y;
       stage.position({ x: stage.x() + dx, y: stage.y() + dy });
       lastPanRef.current = { x: e.evt.clientX, y: e.evt.clientY };
       updateBg(stage);
       return;
    }

        if (e.evt.buttons !== 1) {
      if (drawingPoints.current.length > 0 || lassoPtsRef.current.length > 0) {
        handlePointerUp(e);
      }
      return;
    }
    const pt = getStagePointer(stage);

    if (tool === 'eraser' && eraserMode === 'object') {
      const pos = stage.getPointerPosition();
      if (pos) {
        const shape = stage.getIntersection(pos);
        if (shape && shape.attrs.id && shape.attrs.id !== 'lasso-line' && shape.attrs.id !== 'drawing-line' && shape.attrs.id !== 'selection-rect') {
          const id = shape.attrs.id;
          setObjects(prev => prev.filter(o => o.id !== id));
          setSelectedIds(prev => prev.filter(sid => sid !== id));
          emitEvent({ type: 'DELETE_OBJECTS', ids: [id] });
        }
      }
      return;
    }
    
    if (tool === 'eraser' && eraserMode === 'pixel' && drawingPoints.current.length > 0) {
      const pressure = e.evt.pressure ?? 0.5;
      if (e.evt.shiftKey && drawingPoints.current.length > 1) {
          drawingPoints.current = [drawingPoints.current[0], [pt.x, pt.y, pressure]];
      } else {
          drawingPoints.current.push([pt.x, pt.y, pressure]);
      }
      if (drawingLineRef.current) {
         drawingLineRef.current.setAttr('data', getSvgPathFromStroke(getStroke(drawingPoints.current, { size: brushSize, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })));
         drawingLineRef.current.getLayer().batchDraw();
      }
      return;
    }

    if (tool === 'select-lasso' && lassoPtsRef.current.length > 0) {
      lassoPtsRef.current.push(pt.x, pt.y);
      if (lassoLineRef.current) {
         lassoLineRef.current.setAttr('closed', false);
         lassoLineRef.current.setAttr('points', lassoPtsRef.current);
         lassoLineRef.current.getLayer().batchDraw();
      }
      return;
    }
    if (tool === 'select' && lassoPtsRef.current.length > 0) {
      const sx = lassoPtsRef.current[0];
      const sy = lassoPtsRef.current[1];
      lassoPtsRef.current = [sx, sy, pt.x, pt.y]; // Store only start and end
      if (lassoLineRef.current) {
         // Draw a box using 5 points
         lassoLineRef.current.setAttr('points', [sx, sy, pt.x, sy, pt.x, pt.y, sx, pt.y, sx, sy]);
         lassoLineRef.current.setAttr('closed', true);
         lassoLineRef.current.getLayer().batchDraw();
      }
      return;
    }
    

        if (tool === 'polygon' && polygonPtsRef.current.length > 0) {
      if (polygonLineRef.current) {
         const pts = [...polygonPtsRef.current, pt.x, pt.y];
         polygonLineRef.current.setAttr('points', pts);
         polygonLineRef.current.getLayer().batchDraw();
      }
      return;
    }
    if (tool === 'draw' && drawingPoints.current.length > 0) {
      const pressure = e.evt.pressure ?? 0.5;
      if (e.evt.shiftKey && drawingPoints.current.length > 1) {
          drawingPoints.current = [drawingPoints.current[0], [pt.x, pt.y, pressure]];
      } else {
          drawingPoints.current.push([pt.x, pt.y, pressure]);
      }
      if (drawingLineRef.current) {
         drawingLineRef.current.setAttr('data', getSvgPathFromStroke(getStroke(drawingPoints.current, { size: brushSize, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })));
         drawingLineRef.current.getLayer().batchDraw();
      }
    }
  };

  const isPointInPolygon = (point: [number, number], vs: number[]) => {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 2; i < vs.length; j = i, i += 2) {
        const xi = vs[i], yi = vs[i+1];
        const xj = vs[j], yj = vs[j+1];
        const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
  };

  const handlePointerUp = (e: any) => {
    lastPanRef.current = null;
    
    if ((tool === 'select' || tool === 'select-lasso') && lassoPtsRef.current.length > 0) {
      const isBox = tool === 'select';
      const sx = lassoPtsRef.current[0];
      const sy = lassoPtsRef.current[1];
      const ex = isBox ? lassoPtsRef.current[2] : 0;
      const ey = isBox ? lassoPtsRef.current[3] : 0;
      const minX = isBox ? Math.min(sx, ex) : 0;
      const maxX = isBox ? Math.max(sx, ex) : 0;
      const minY = isBox ? Math.min(sy, ey) : 0;
      const maxY = isBox ? Math.max(sy, ey) : 0;

      if (!isBox ? lassoPtsRef.current.length > 4 : (Math.abs(ex - sx) > 5 && Math.abs(ey - sy) > 5)) {
        const newSelectedIds: string[] = [];
        objects.forEach(obj => {
          let cx = 0, cy = 0;
          if (obj.type === 'rect') {
              cx = obj.x + obj.width / 2;
              cy = obj.y + obj.height / 2;
          } else if (obj.type === 'text') {
              cx = obj.x + (obj.width || 150) / 2;
              cy = obj.y + (obj.height || 50) / 2;
          } else if (obj.type === 'path' || obj.type === 'polygon') {
              let _minX = Infinity, _maxX = -Infinity, _minY = Infinity, _maxY = -Infinity;
              obj.points.forEach((p: any) => {
                  let px = p.x !== undefined ? p.x : (Array.isArray(p) ? p[0] : p);
                  let py = p.y !== undefined ? p.y : (Array.isArray(p) ? p[1] : p);
                  if (px < _minX) _minX = px;
                  if (px > _maxX) _maxX = px;
                  if (py < _minY) _minY = py;
                  if (py > _maxY) _maxY = py;
              });
              cx = obj.x + (_minX + _maxX) / 2;
              cy = obj.y + (_minY + _maxY) / 2;
          }
          
          let selected = false;
          if (isBox) {
             selected = (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY);
          } else {
             selected = isPointInPolygon([cx, cy], lassoPtsRef.current);
          }

          if (selected) {
              newSelectedIds.push(obj.id);
          }
        });
        setSelectedIds(prev => e.evt.shiftKey ? Array.from(new Set([...prev, ...newSelectedIds])) : newSelectedIds);
      }
      lassoPtsRef.current = [];
      if (lassoLineRef.current) {
        lassoLineRef.current.hide();
        lassoLineRef.current.getLayer().batchDraw();
      }
    }

    if ((tool === 'draw' || (tool === 'eraser' && eraserMode === 'pixel')) && drawingPoints.current.length > 0) {
      let finalPoints = drawingPoints.current;
      if (finalPoints.length === 1) {
        finalPoints = [finalPoints[0], [finalPoints[0][0] + 0.1, finalPoints[0][1] + 0.1]];
      }
      const newObj: CanvasObject = {
        id: uuidv4(),
        type: 'path',
        x: 0,
        y: 0,
        points: finalPoints.map(pt => ({ x: pt[0], y: pt[1], p: pt[2] || 0.5 })),
        fill: tool === 'eraser' ? '#000' : brushColor,
        size: brushSize,
        isEraser: tool === 'eraser'
      };
      setObjects(prev => [...prev, newObj]);
      emitEvent({ type: 'ADD_OBJECT', object: newObj });
      
      drawingPoints.current = [];
      if (drawingLineRef.current) {
        drawingLineRef.current.setAttr('points', []);
        drawingLineRef.current.hide();
        drawingLineRef.current.getLayer().batchDraw();
      }
    }
  };

  // Object Interactions
  const handleShapePointerDown = (e: any, id: string) => {

    if (tool === 'select' || tool === 'select-lasso') {
      if (e.evt.shiftKey) {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
      } else if (!selectedIds.includes(id)) {
        setSelectedIds([id]);
      }
    }
  };

  const handleShapeDblClick = (e: any, id: string, type: string) => {
    if ((tool === 'select' || tool === 'select-lasso') && type === 'text') setEditingId(id);
  };



  const handleShapePointerEnter = (e: any, id: string) => {
    if (tool === 'eraser' && eraserMode === 'object' && e.evt.buttons === 1) {
      setObjects(prev => prev.filter(o => o.id !== id));
      setSelectedIds(prev => prev.filter(sid => sid !== id));
      emitEvent({ type: 'DELETE_OBJECTS', ids: [id] });
    }
  };

  const handleDragStart = (e: any, id: string) => {
    if ((tool !== 'select' && tool !== 'select-lasso')) return;
    const targetIds = selectedIds.includes(id) ? selectedIds : [id];
    if (!selectedIds.includes(id)) setSelectedIds([id]);
    
    dragStartPos.current = {};
    const stage = e.target.getStage();
    objects.forEach(o => {
      if (targetIds.includes(o.id)) {
        const node = stage.findOne(`#${o.id}`);
        dragStartPos.current[o.id] = { x: o.x, y: o.y, node };
      }
    });
  };

  const handleDragMove = (e: any, id: string) => {
    if ((tool !== 'select' && tool !== 'select-lasso')) return;
    const startPos = dragStartPos.current[id];
    if (!startPos) return;

    const dx = e.target.x() - startPos.x;
    const dy = e.target.y() - startPos.y;
    const targetIds = selectedIds.includes(id) ? selectedIds : [id];
    const changesMap: Record<string, {x: number, y: number}> = {};

    targetIds.forEach(targetId => {
      if (dragStartPos.current[targetId]) {
        const newX = dragStartPos.current[targetId].x + dx;
        const newY = dragStartPos.current[targetId].y + dy;
        
        if (targetId !== id) {
          const node = dragStartPos.current[targetId]?.node;
          if (node) node.position({ x: newX, y: newY });
        }
      }
    });
  };

  const handleTransformEnd = (e: any) => {
    const node = e.target;
    const id = node.id();
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    
    const changes = {
       x: node.x(),
       y: node.y(),
       width: Math.max(5, (node.width() || 100) * scaleX),
       height: Math.max(5, (node.height() || 100) * scaleY)
    };
    
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...changes } : o));
    emitEvent({ type: 'UPDATE_OBJECT', id, changes });
  };

  const handleDragEnd = (e: any, id: string) => {
    if ((tool !== 'select' && tool !== 'select-lasso')) return;
    const startPos = dragStartPos.current[id];
    if (!startPos) return;

    const dx = e.target.x() - startPos.x;
    const dy = e.target.y() - startPos.y;
    const targetIds = selectedIds.includes(id) ? selectedIds : [id];
    
    setObjects(prev => prev.map(o => {
      if (targetIds.includes(o.id) && dragStartPos.current[o.id]) {
        return { ...o, x: dragStartPos.current[o.id].x + dx, y: dragStartPos.current[o.id].y + dy };
      }
      return o;
    }));

    targetIds.forEach(targetId => {
      if (dragStartPos.current[targetId]) {
        emitEvent({ type: 'UPDATE_OBJECT', id: targetId, changes: { x: dragStartPos.current[targetId].x + dx, y: dragStartPos.current[targetId].y + dy } });
      }
    });
  };

  const getSelectionBoundingBox = () => {
    if (selectedIds.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const targetObjects = objects.filter(o => selectedIds.includes(o.id));
    if (targetObjects.length === 0) return null;

    targetObjects.forEach(obj => {
       if (obj.type === 'rect') {
          minX = Math.min(minX, obj.x);
          minY = Math.min(minY, obj.y);
          maxX = Math.max(maxX, obj.x + (obj.width || 0));
          maxY = Math.max(maxY, obj.y + (obj.height || 0));
       } else if (obj.type === 'circle' || obj.type === 'triangle' || (obj.type === 'polygon' && obj.radius)) {
          minX = Math.min(minX, obj.x - (obj.radius || 0));
          minY = Math.min(minY, obj.y - (obj.radius || 0));
          maxX = Math.max(maxX, obj.x + (obj.radius || 0));
          maxY = Math.max(maxY, obj.y + (obj.radius || 0));
       } else if (obj.type === 'text') {
          minX = Math.min(minX, obj.x);
          minY = Math.min(minY, obj.y);
          maxX = Math.max(maxX, obj.x + 300);
          maxY = Math.max(maxY, obj.y + 100);
       } else if (obj.type === 'path' || obj.type === 'polygon') {
          obj.points.forEach((p: any) => {
             const px = (p.x !== undefined ? p.x : (Array.isArray(p) ? p[0] : p)) + (obj.x || 0);
             const py = (p.y !== undefined ? p.y : (Array.isArray(p) ? p[1] : p)) + (obj.y || 0);
             minX = Math.min(minX, px);
             minY = Math.min(minY, py);
             maxX = Math.max(maxX, px);
             maxY = Math.max(maxY, py);
          });
       }
    });

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  const selectedBBox = getSelectionBoundingBox();

  const getBoundingBox = () => {
    const stage = trRef.current?.getStage();
    if (!stage) return null;
    
    // Let's get the bounding box of selected objects if any, else all objects
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const targetObjects = selectedIds.length > 0 
      ? objects.filter(o => selectedIds.includes(o.id))
      : objects;
      
    if (targetObjects.length === 0) return null;

    targetObjects.forEach(obj => {
       if (obj.type === 'rect') {
          minX = Math.min(minX, obj.x);
          minY = Math.min(minY, obj.y);
          maxX = Math.max(maxX, obj.x + (obj.width || 0));
          maxY = Math.max(maxY, obj.y + (obj.height || 0));
       } else if (obj.type === 'circle' || obj.type === 'triangle' || (obj.type === 'polygon' && obj.radius)) {
          minX = Math.min(minX, obj.x - (obj.radius || 0));
          minY = Math.min(minY, obj.y - (obj.radius || 0));
          maxX = Math.max(maxX, obj.x + (obj.radius || 0));
          maxY = Math.max(maxY, obj.y + (obj.radius || 0));
       } else if (obj.type === 'text') {
          minX = Math.min(minX, obj.x);
          minY = Math.min(minY, obj.y);
          maxX = Math.max(maxX, obj.x + 300);
          maxY = Math.max(maxY, obj.y + 100);
       } else if (obj.type === 'path' || obj.type === 'polygon') {
          obj.points.forEach((p: any) => {
             const px = (p.x !== undefined ? p.x : (Array.isArray(p) ? p[0] : p)) + (obj.x || 0);
             const py = (p.y !== undefined ? p.y : (Array.isArray(p) ? p[1] : p)) + (obj.y || 0);
             minX = Math.min(minX, px);
             minY = Math.min(minY, py);
             maxX = Math.max(maxX, px);
             maxY = Math.max(maxY, py);
          });
       }
    });
    
    // Add some padding
    const padding = 20;
    return {
      x: minX - padding,
      y: minY - padding,
      width: (maxX - minX) + padding * 2,
      height: (maxY - minY) + padding * 2
    };
  };

  const exportWithBackground = async (format: 'jpg' | 'pdf') => {
    if (!trRef.current) return;
    const stage = trRef.current.getStage();
    if (!stage) return;
    
    // Hide selections to avoid exporting glowing bounding boxes
    const oldSelectedIds = selectedIds;
    setSelectedIds([]);
    await new Promise(r => setTimeout(r, 50));
    
    const bbox = getBoundingBox();
    const pixelRatio = 4; // High Quality Export
    
    const exportX = bbox ? bbox.x * stage.scaleX() + stage.x() : 0;
    const exportY = bbox ? bbox.y * stage.scaleY() + stage.y() : 0;
    const exportWidth = bbox ? bbox.width * stage.scaleX() : stage.width();
    const exportHeight = bbox ? bbox.height * stage.scaleY() : stage.height();

    const canvas = document.createElement('canvas');
    canvas.width = exportWidth * pixelRatio;
    canvas.height = exportHeight * pixelRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
       setSelectedIds(oldSelectedIds);
       return;
    }
    
    // Fill background color
    ctx.fillStyle = bgColor === 'paper' ? '#fdfbf7' : bgColor === 'gray' ? '#f3f4f6' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pattern
    if (bgPattern !== 'none') {
       ctx.strokeStyle = bgPattern === 'grid' ? 'rgba(0,0,0,0.06)' : 'transparent';
       ctx.fillStyle = bgPattern === 'dots' ? 'rgba(0,0,0,0.12)' : 'transparent';
       ctx.lineWidth = 1 * pixelRatio;
       
       const scaledGridSize = gridSize * stage.scaleX() * pixelRatio;
       const offsetX = (stage.x() * pixelRatio) - (exportX * pixelRatio);
       const offsetY = (stage.y() * pixelRatio) - (exportY * pixelRatio);
       
       let startX = offsetX % scaledGridSize;
       let startY = offsetY % scaledGridSize;
       if (startX > 0) startX -= scaledGridSize;
       if (startY > 0) startY -= scaledGridSize;
       
       if (bgPattern === 'grid') {
          ctx.beginPath();
          for (let x = startX; x < canvas.width; x += scaledGridSize) {
             ctx.moveTo(x, 0);
             ctx.lineTo(x, canvas.height);
          }
          for (let y = startY; y < canvas.height; y += scaledGridSize) {
             ctx.moveTo(0, y);
             ctx.lineTo(canvas.width, y);
          }
          ctx.stroke();
       } else if (bgPattern === 'dots') {
          for (let x = startX; x < canvas.width; x += scaledGridSize) {
             for (let y = startY; y < canvas.height; y += scaledGridSize) {
                ctx.beginPath();
                ctx.arc(x, y, 1.5 * pixelRatio, 0, Math.PI * 2);
                ctx.fill();
             }
          }
       }
    }
    
    // Get Konva stage data (without background to let it be transparent, but wait, if it's transparent jpeg it becomes black. We must use png)
    const stageDataURL = stage.toDataURL({
      pixelRatio,
      mimeType: 'image/png',
      x: bbox ? bbox.x * stage.scaleX() + stage.x() : undefined,
      y: bbox ? bbox.y * stage.scaleY() + stage.y() : undefined,
      width: bbox ? bbox.width * stage.scaleX() : undefined,
      height: bbox ? bbox.height * stage.scaleY() : undefined
    });
    
    const img = new Image();
    img.src = stageDataURL;
    await new Promise(r => { img.onload = r; });
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const finalDataURL = canvas.toDataURL('image/jpeg', 1.0);
    
    if (format === 'jpg') {
       const link = document.createElement('a');
       link.download = `stemboard-${roomId}.jpg`;
       link.href = finalDataURL;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
    } else {
       const pdfWidth = bbox ? bbox.width : stage.width();
       const pdfHeight = bbox ? bbox.height : stage.height();
       const pdf = new jsPDF({
         orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
         unit: 'px',
         format: [pdfWidth, pdfHeight]
       });
       pdf.addImage(finalDataURL, 'JPEG', 0, 0, pdfWidth, pdfHeight);
       pdf.save(`stemboard-${roomId}.pdf`);
    }
    
    setSelectedIds(oldSelectedIds);
  };

  const exportToJPG = () => exportWithBackground('jpg');
  const exportToPDF = () => exportWithBackground('pdf');

  return (
    <div ref={containerRef} onContextMenu={(e) => e.preventDefault()} className="h-full w-full relative outline-none overflow-hidden transition-colors duration-300">
      <div className="absolute top-4 left-4 z-50 flex items-center gap-1 p-1 bg-white rounded-xl shadow-md border border-zinc-200 pointer-events-auto">
        <button onClick={handleUndo} disabled={undoStack.current.length === 0} className={cn("p-2 rounded-lg transition-colors", undoStack.current.length === 0 ? "text-zinc-300 cursor-not-allowed" : "text-zinc-500 hover:bg-zinc-100")} title="Undo (Ctrl+Z)"><Undo2 size={20} /></button>
        <button onClick={handleRedo} disabled={redoStack.current.length === 0} className={cn("p-2 rounded-lg transition-colors", redoStack.current.length === 0 ? "text-zinc-300 cursor-not-allowed" : "text-zinc-500 hover:bg-zinc-100")} title="Redo (Ctrl+Shift+Z)"><Redo2 size={20} /></button>
      </div>
      
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 pointer-events-auto items-end">
         <div className="flex items-center gap-1 p-1 bg-white rounded-xl shadow-md border border-zinc-200">
           <button onClick={exportToJPG} className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium text-zinc-600 hover:bg-zinc-100" title="Export JPG"><Download size={16} /> JPG</button>
           <div className="w-px h-4 bg-zinc-200" />
           <button onClick={exportToPDF} className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium text-zinc-600 hover:bg-zinc-100" title="Export PDF"><Download size={16} /> PDF</button>
         </div>

      </div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1 p-1 bg-white rounded-xl shadow-md border border-zinc-200">
          <button onClick={() => setTool('select')} className={cn("p-2 rounded-lg transition-colors", tool === 'select' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Select Tool"><MousePointer2 size={20} /></button>
          <button onClick={() => setTool('select-lasso')} className={cn("p-2 rounded-lg transition-colors", tool === 'select-lasso' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Lasso Select"><LassoSelect size={20} /></button>
          <button onClick={() => setTool('pan')} className={cn("p-2 rounded-lg transition-colors", tool === 'pan' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Pan Tool"><Hand size={20} /></button>
          <button onClick={() => setTool('draw')} className={cn("p-2 rounded-lg transition-colors", tool === 'draw' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Draw Tool"><Pen size={20} /></button>
          <button onClick={() => setTool('text')} className={cn("p-2 rounded-lg transition-colors", tool === 'text' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Text/Math/Code (Markdown)"><Type size={20} /></button>
          <button onClick={() => setTool('eraser')} className={cn("p-2 rounded-lg transition-colors", tool === 'eraser' ? "bg-rose-100 text-rose-700" : "text-zinc-500 hover:bg-zinc-100")} title="Eraser"><Eraser size={20} /></button>
          <div className="w-px h-6 bg-zinc-200 mx-1" />
          <button onClick={() => setTool(tool === 'circle' ? 'circle' : tool === 'triangle' ? 'triangle' : tool === 'polygon' ? 'polygon' : 'rect')} className={cn("p-2 rounded-lg transition-colors", ['rect', 'circle', 'triangle', 'polygon'].includes(tool) ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Shapes">
            {tool === 'circle' ? <Circle size={20} /> : tool === 'triangle' ? <Triangle size={20} /> : tool === 'polygon' ? <Hexagon size={20} /> : <Square size={20} />}
          </button>
          {selectedIds.length > 0 && <button onClick={() => { setObjects(prev => prev.filter(o => !selectedIds.includes(o.id))); emitEvent({ type: 'DELETE_OBJECTS', ids: selectedIds }); setSelectedIds([]); }} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors" title="Delete Selected"><Trash2 size={20} /></button>}
        </div>
        
        {(tool === 'draw' || tool === 'rect' || tool === 'circle' || tool === 'triangle' || tool === 'polygon' || selectedIds.length > 0) && (
          <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl shadow-md border border-zinc-200">
            {['rect', 'circle', 'triangle', 'polygon'].includes(tool) && (
               <div className="flex items-center gap-1 mr-2 border-r pr-3 border-zinc-200">
                 <button onClick={() => setTool('rect')} className={cn("p-1.5 rounded-md transition-colors", tool === 'rect' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Square"><Square size={16} /></button>
                 <button onClick={() => setTool('circle')} className={cn("p-1.5 rounded-md transition-colors", tool === 'circle' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Circle"><Circle size={16} /></button>
                 <button onClick={() => setTool('triangle')} className={cn("p-1.5 rounded-md transition-colors", tool === 'triangle' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Triangle"><Triangle size={16} /></button>
                 <button onClick={() => setTool('polygon')} className={cn("p-1.5 rounded-md transition-colors", tool === 'polygon' ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100")} title="Polygon"><Hexagon size={16} /></button>
               </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1 mr-1">Fill:</span>
              {COLORS.map(c => (
                <button key={c} onClick={() => {
                  setBrushColor(c);
                  if (selectedIds.length > 0) {
                    setObjects(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, fill: c } : o));
                    selectedIds.forEach(id => emitEvent({ type: 'UPDATE_OBJECT', id, changes: { fill: c } }));
                  }
                }} className={cn("w-6 h-6 rounded-full border-2 transition-transform", brushColor === c ? "border-indigo-500 scale-125" : "border-zinc-300 hover:scale-110")} style={{ backgroundColor: c }} />
              ))}
              <div className="relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-transform overflow-hidden cursor-pointer" style={{ borderColor: brushColor === customColor ? '#6366f1' : '#d4d4d8', backgroundColor: customColor, transform: brushColor === customColor ? 'scale(1.25)' : 'scale(1)' }}>
                 <input type="color" value={customColor} onChange={(e) => {
                    const c = e.target.value;
                    setCustomColor(c);
                    setBrushColor(c);
                    if (selectedIds.length > 0) {
                      setObjects(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, fill: c } : o));
                      selectedIds.forEach(id => emitEvent({ type: 'UPDATE_OBJECT', id, changes: { fill: c } }));
                    }
                 }} className="absolute inset-[-10px] w-10 h-10 opacity-0 cursor-pointer" title="Custom Color" />
              </div>
            </div>
            
            {(['rect', 'circle', 'triangle', 'polygon', 'select', 'select-lasso'].includes(tool) || selectedIds.length > 0) && (
              <>
                <div className="w-px h-6 bg-zinc-200 mx-2" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1 mr-1">Stroke:</span>
                  <button onClick={() => {
                      setStrokeColor('transparent');
                      if (selectedIds.length > 0) {
                        setObjects(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, stroke: 'transparent', strokeWidth: 0 } : o));
                        selectedIds.forEach(id => emitEvent({ type: 'UPDATE_OBJECT', id, changes: { stroke: 'transparent', strokeWidth: 0 } }));
                      }
                    }} 
                    className={cn("w-6 h-6 rounded-full border-2 transition-transform relative overflow-hidden", strokeColor === 'transparent' ? "border-indigo-500 scale-125" : "border-zinc-300 hover:scale-110")} 
                    style={{ backgroundColor: 'white' }}
                  >
                     <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-rose-500 -rotate-45 -translate-y-1/2" />
                  </button>
                  {COLORS.map(c => (
                    <button key={c} onClick={() => {
                      setStrokeColor(c);
                      if (selectedIds.length > 0) {
                        setObjects(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, stroke: c, strokeWidth: 4 } : o));
                        selectedIds.forEach(id => emitEvent({ type: 'UPDATE_OBJECT', id, changes: { stroke: c, strokeWidth: 4 } }));
                      }
                    }} className={cn("w-6 h-6 rounded-full border-2 transition-transform", strokeColor === c ? "border-indigo-500 scale-125" : "border-zinc-300 hover:scale-110")} style={{ backgroundColor: c }} />
                  ))}
                  <div className="relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-transform overflow-hidden cursor-pointer" style={{ borderColor: strokeColor !== 'transparent' && !COLORS.includes(strokeColor) ? '#6366f1' : '#d4d4d8', backgroundColor: strokeColor !== 'transparent' && !COLORS.includes(strokeColor) ? strokeColor : '#8b5cf6', transform: strokeColor !== 'transparent' && !COLORS.includes(strokeColor) ? 'scale(1.25)' : 'scale(1)' }}>
                     <input type="color" value={strokeColor !== 'transparent' ? strokeColor : '#8b5cf6'} onChange={(e) => {
                        const c = e.target.value;
                        setStrokeColor(c);
                        if (selectedIds.length > 0) {
                          setObjects(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, stroke: c, strokeWidth: 4 } : o));
                          selectedIds.forEach(id => emitEvent({ type: 'UPDATE_OBJECT', id, changes: { stroke: c, strokeWidth: 4 } }));
                        }
                     }} className="absolute inset-[-10px] w-10 h-10 opacity-0 cursor-pointer" title="Custom Stroke Color" />
                  </div>
                </div>
              </>
            )}
            
            {tool === 'draw' && (
              <>
                <div className="w-px h-4 bg-zinc-200 mx-1" />
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1 mr-1">Size:</span>
                <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-24 accent-indigo-500" title="Brush Size" />
                <span className="text-xs text-zinc-500 min-w-[20px]">{brushSize}px</span>
              </>
            )}
          </div>
        )}
        
        {tool === 'eraser' && (
          <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl shadow-md border border-zinc-200 text-sm font-medium">
            <button onClick={() => setEraserMode('object')} className={cn("px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2", eraserMode === 'object' ? "bg-rose-100 text-rose-700" : "text-zinc-500 hover:bg-zinc-100")}>
               <MousePointer2 size={16} /> Object
            </button>
            <button onClick={() => setEraserMode('pixel')} className={cn("px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2", eraserMode === 'pixel' ? "bg-rose-100 text-rose-700" : "text-zinc-500 hover:bg-zinc-100")}>
               <Pen size={16} /> Pixel
            </button>
            
            {eraserMode === 'pixel' && (
              <>
                <div className="w-px h-4 bg-zinc-200 mx-1" />
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1 mr-1">Size:</span>
                <input type="range" min="1" max="100" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-24 accent-rose-500" title="Eraser Size" />
                <span className="text-xs text-zinc-500 min-w-[20px]">{brushSize}px</span>
              </>
            )}
          </div>
        )}
      </div>
      
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={(e) => {
             if (e.evt.buttons === 1) {
                handlePointerUp(e);
             } else {
                // Hard cleanup if we missed it
                drawingPoints.current = [];
                if (drawingLineRef.current) {
                   drawingLineRef.current.setAttr('data', '');
                   drawingLineRef.current.hide();
                }
             }
          }}
          className={tool === 'pan' || isSpacePan ? 'cursor-grab active:cursor-grabbing' : (tool === 'draw' ? 'cursor-crosshair' : (tool === 'eraser' ? 'cursor-cell' : 'cursor-default'))}
        >
          <Layer>
            {objects.map((obj) => {
              if (obj.type === 'rect') {
                const isSelected = selectedIds.includes(obj.id);
                return (
                  <Rect key={obj.id} id={obj.id} x={obj.x} y={obj.y} width={obj.width} height={obj.height} fill={obj.fill} cornerRadius={8} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} onTransformEnd={handleTransformEnd} shadowColor={isSelected ? "#6366f1" : "rgba(0,0,0,0.15)"} shadowBlur={isSelected ? 10 : 15} shadowOffsetY={isSelected ? 0 : 5} stroke={obj.stroke || "transparent"} strokeWidth={obj.strokeWidth || 0} />
                );
              } else if (obj.type === 'circle') {
                const isSelected = selectedIds.includes(obj.id);
                return (
                  <KonvaCircle key={obj.id} id={obj.id} x={obj.x} y={obj.y} radius={obj.radius} fill={obj.fill} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor={isSelected ? "#6366f1" : "rgba(0,0,0,0.15)"} shadowBlur={isSelected ? 10 : 15} shadowOffsetY={isSelected ? 0 : 5} stroke={obj.stroke || "transparent"} strokeWidth={obj.strokeWidth || 0} />
                );
              } else if (obj.type === 'triangle') {
                const isSelected = selectedIds.includes(obj.id);
                return (
                  <RegularPolygon key={obj.id} id={obj.id} sides={3} x={obj.x} y={obj.y} radius={obj.radius} fill={obj.fill} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor={isSelected ? "#6366f1" : "rgba(0,0,0,0.15)"} shadowBlur={isSelected ? 10 : 15} shadowOffsetY={isSelected ? 0 : 5} stroke={obj.stroke || "transparent"} strokeWidth={obj.strokeWidth || 0} />
                );
              } else if (obj.type === 'path') {
                const isSelected = selectedIds.includes(obj.id);
                const pts = obj.points.map(pt => [pt.x, pt.y, pt.p]);
                const pathData = getSvgPathFromStroke(getStroke(pts, { size: obj.size || 6, thinning: 0.5, smoothing: 0.5, streamline: 0.5 }));
                return (
                  <Path key={obj.id} id={obj.id} x={obj.x} y={obj.y} data={pathData} fill={obj.fill} hitStrokeWidth={20} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor={isSelected ? "#6366f1" : "transparent"} shadowBlur={isSelected ? 10 : 0} globalCompositeOperation={obj.isEraser ? 'destination-out' : 'source-over'} />
                );
              } else if (obj.type === 'polygon') {
                const isSelected = selectedIds.includes(obj.id);
                // We changed polygon to just be a RegularPolygon with 6 sides instead of a custom Line if it has a radius.
                if (obj.radius) {
                   return (
                     <RegularPolygon key={obj.id} id={obj.id} sides={obj.sides || 6} x={obj.x} y={obj.y} radius={obj.radius} fill={obj.fill} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} shadowColor={isSelected ? "#6366f1" : "rgba(0,0,0,0.15)"} shadowBlur={isSelected ? 10 : 15} shadowOffsetY={isSelected ? 0 : 5} stroke={obj.stroke || "transparent"} strokeWidth={obj.strokeWidth || 0} />
                   );
                } else {
                   return (
                     <Line key={obj.id} id={obj.id} x={obj.x} y={obj.y} points={obj.points} fill={obj.fill} closed={true} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onPointerEnter={(e) => handleShapePointerEnter(e, obj.id)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)} onTransformEnd={handleTransformEnd} stroke={obj.stroke || "transparent"} strokeWidth={obj.strokeWidth || 4} shadowColor={isSelected ? "#6366f1" : "transparent"} shadowBlur={isSelected ? 10 : 0} />
                   );
                }
              } else if (obj.type === 'text') {
                const isSelected = selectedIds.includes(obj.id);
                const isEditing = editingId === obj.id;
                return (
                  <Group key={obj.id} id={obj.id} x={obj.x} y={obj.y} draggable={tool === 'select' || tool === 'select-lasso'} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onDblClick={(e) => handleShapeDblClick(e, obj.id, obj.type)} onDblTap={(e) => handleShapeDblClick(e, obj.id, obj.type)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)}>
                    <Rect x={0} y={0} width={300} height={100} fill="transparent" stroke={isSelected ? "#6366f1" : "transparent"} strokeWidth={2} shadowColor="transparent" shadowBlur={0} cornerRadius={8} />
                    <Html transform={true} divProps={{ style: { pointerEvents: isEditing ? 'auto' : 'none' } }}>
                      <div onPointerDown={isEditing ? (e) => e.stopPropagation() : undefined} style={{ width: 300 }}>
                        {isEditing ? (
                          <textarea autoFocus className="bg-white text-zinc-900 border-2 border-indigo-500 rounded-lg shadow-xl p-2 outline-none font-mono text-sm resize-y" style={{ minWidth: 300, minHeight: 100 }} defaultValue={obj.content} onBlur={(e) => { setEditingId(null); setObjects(prev => prev.map(o => o.id === obj.id ? { ...o, content: e.target.value } : o)); emitEvent({ type: 'UPDATE_OBJECT', id: obj.id, changes: { content: e.target.value } }); }} onKeyDown={(e) => { if (e.key === 'Escape') e.currentTarget.blur(); if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }} />
                        ) : (
                          <div className={cn("bg-white border rounded-lg shadow-sm p-4 overflow-hidden prose prose-sm max-w-none", isSelected ? "border-indigo-500" : "border-zinc-200")}>
                            <ReactMarkdown 
                              remarkPlugins={[remarkMath, remarkGfm]} 
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                code({node, inline, className, children, ...props}: any) {
                                  const match = /language-(\w+)/.exec(className || '')
                                  return !inline && match ? (
                                    <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className={className} {...props}>{children}</code>
                                  )
                                }
                              }}
                            >
                              {obj.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </Html>
                  </Group>
                );
              }
              return null;
            })}

            {/* Native Layer Drawing for Speed */}
            <Path ref={drawingLineRef} fill={brushColor} visible={false} listening={false} data="" />
            
            {/* Native Lasso Line */}
            <Line ref={lassoLineRef} stroke="#6366f1" strokeWidth={1} fill="rgba(99, 102, 241, 0.1)" closed={true} visible={false} listening={false} points={[]} />
            {selectedBBox && (tool === 'select' || tool === 'select-lasso') && selectedIds.length > 0 && (
              <Rect
                x={selectedBBox.x}
                y={selectedBBox.y}
                width={selectedBBox.width}
                height={selectedBBox.height}
                fill="transparent"
                draggable
                onPointerDown={(e) => {
                  // Prevent the stage from seeing this click, which would deselect
                  e.cancelBubble = true;
                }}
                onClick={(e) => {
                  // If they click on the bounding box without dragging, we should clear the selection
                  // because it feels natural to click empty space to deselect.
                  // Wait, if they click the box, maybe they just wanted to select the group?
                  // We'll let them click outside the box to deselect.
                }}
                onDragStart={(e) => {
                  selectedIds.forEach(id => handleDragStart(e, id));
                }}
                onDragMove={(e) => {
                  const dx = e.target.x() - selectedBBox.x;
                  const dy = e.target.y() - selectedBBox.y;
                  selectedIds.forEach(targetId => {
                    if (dragStartPos.current[targetId]) {
                      const newX = dragStartPos.current[targetId].x + dx;
                      const newY = dragStartPos.current[targetId].y + dy;
                      const node = dragStartPos.current[targetId]?.node;
                      if (node) node.position({ x: newX, y: newY });
                    }
                  });
                }}
                onDragEnd={(e) => {
                  const dx = e.target.x() - selectedBBox.x;
                  const dy = e.target.y() - selectedBBox.y;
                  
                  setObjects(prev => {
                    const next = [...prev];
                    const updates: Record<string, any> = {};
                    selectedIds.forEach(id => {
                      const idx = next.findIndex(o => o.id === id);
                      if (idx !== -1 && dragStartPos.current[id]) {
                        next[idx] = { ...next[idx], x: dragStartPos.current[id].x + dx, y: dragStartPos.current[id].y + dy };
                        updates[id] = { x: next[idx].x, y: next[idx].y };
                      }
                    });
                    emitEvent({ type: 'UPDATE_MULTIPLE', updates });
                    return next;
                  });
                  
                  // Reset rect position so it matches the newly updated bbox on next render
                  e.target.position({ x: selectedBBox.x, y: selectedBBox.y });
                }}
              />
            )}
            {/* Polygon Preview Line */}
            <Line ref={polygonLineRef} stroke="transparent" strokeWidth={0} closed={true} visible={false} listening={false} points={[]} opacity={0.7} />
            {(tool === 'select' || tool === 'select-lasso') && <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10 ? oldBox : newBox} />}
          </Layer>
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
                        transform: `translate(${screenX}px, ${screenY}px)`
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
      )}
    </div>
  );
}
