import React, { useState, useEffect, useRef } from 'react';
import { Group, Rect } from 'react-konva';
import { Html } from 'react-konva-utils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '../lib/utils';
import { CanvasObject } from '../types';

interface TextNodeProps {
  obj: CanvasObject & { type: 'text' };
  isSelected: boolean;
  isEditing: boolean;
  tool: string;
  setEditingId: (id: string | null) => void;
  updateObject: (id: string, changes: Partial<CanvasObject>) => void;
  onPointerDown: (e: any) => void;
  onDblClick: (e: any) => void;
  onDragStart: (e: any) => void;
  onDragMove: (e: any) => void;
  onDragEnd: (e: any) => void;
  onPointerEnter: (e: any) => void;
}

export function TextNode({ obj, isSelected, isEditing, tool, setEditingId, updateObject, onPointerDown, onDblClick, onDragStart, onDragMove, onDragEnd, onPointerEnter }: TextNodeProps) {
  const [size, setSize] = useState({ width: obj.width || 300, height: obj.height || 100 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width; const height = entry.contentRect.height;
        if (width > 0 && height > 0) {
          setSize({ width, height });
          // Optionally sync to remote if it changes significantly, but local state is fine for hitbox
        }
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [isEditing, obj.content]);

  return (
    <Group 
      id={obj.id} 
      x={obj.x} 
      y={obj.y} 
      draggable={tool === 'select'} 
      onPointerDown={onPointerDown} 
      onDblClick={onDblClick} 
      onDblTap={onDblClick} 
      onDragStart={onDragStart} 
      onDragMove={onDragMove} 
      onDragEnd={onDragEnd}
      onPointerEnter={onPointerEnter}
    >
      <Rect 
        x={0} y={0} 
        width={size.width} height={size.height} 
        fill="transparent" 
        stroke={isSelected ? "#6366f1" : "transparent"} 
        strokeWidth={2} 
        shadowColor={isSelected ? "#6366f1" : "transparent"} 
        shadowBlur={isSelected ? 10 : 0} 
        cornerRadius={8} 
      />
      <Html transform={true} divProps={{ style: { pointerEvents: isEditing ? 'auto' : 'none' } }}>
        <div ref={containerRef} onPointerDown={isEditing ? (e) => e.stopPropagation() : undefined} className="inline-block" style={{ minWidth: 150 }}>
          {isEditing ? (
            <textarea 
              autoFocus 
              className="bg-white text-zinc-900 border-2 border-indigo-500 rounded-lg shadow-xl p-2 outline-none font-mono text-sm resize-y" 
              style={{ minWidth: 300, minHeight: 100 }} 
              defaultValue={obj.content} 
              onBlur={(e) => { 
                setEditingId(null); 
                updateObject(obj.id, { content: e.target.value, width: size.width, height: size.height }); 
              }} 
              onKeyDown={(e) => { 
                if (e.key === 'Escape') e.currentTarget.blur(); 
                if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } 
              }} 
            />
          ) : (
            <div className={cn("bg-white border rounded-lg shadow-sm p-4 overflow-hidden prose prose-sm max-w-none break-words", isSelected ? "border-indigo-500" : "border-zinc-200")} style={{ minWidth: 150 }}>
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
