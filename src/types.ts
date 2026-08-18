export type CanvasObject = 
  | { id: string; type: 'rect'; x: number; y: number; width: number; height: number; fill: string; stroke?: string; strokeWidth?: number }
  | { id: string; type: 'path'; x: number; y: number; points: {x: number, y: number, p: number}[]; fill: string; size?: number; isEraser?: boolean }
  | { id: string; type: 'text'; x: number; y: number; content: string; width?: number; height?: number }
  | { id: string; type: 'polygon'; x: number; y: number; points: number[]; fill: string; stroke?: string; strokeWidth?: number; radius?: number; sides?: number }
  | { id: string; type: 'circle'; x: number; y: number; radius: number; fill: string; stroke?: string; strokeWidth?: number }
  | { id: string; type: 'triangle'; x: number; y: number; radius: number; fill: string; stroke?: string; strokeWidth?: number };

export type CanvasEvent = 
  | { type: 'ADD_OBJECT'; object: CanvasObject }
  | { type: 'UPDATE_OBJECT'; id: string; changes: Partial<CanvasObject> }
  | { type: 'DELETE_OBJECTS'; ids: string[] };

declare global {
  interface Window {
    lastCursorEmit: number;
  }
}
