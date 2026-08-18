import fs from 'fs';

let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const textRenderTarget = `              } else if (obj.type === 'text') {
                const isSelected = selectedIds.includes(obj.id);
                const isEditing = editingId === obj.id;
                return (
                  <Group key={obj.id} id={obj.id} x={obj.x} y={obj.y} draggable={(tool === 'select' || tool === 'select-lasso')} onPointerDown={(e) => handleShapePointerDown(e, obj.id)} onDblClick={(e) => handleShapeDblClick(e, obj.id, obj.type)} onDblTap={(e) => handleShapeDblClick(e, obj.id, obj.type)} onDragStart={(e) => handleDragStart(e, obj.id)} onDragMove={(e) => handleDragMove(e, obj.id)} onDragEnd={(e) => handleDragEnd(e, obj.id)}>
                    <Rect x={0} y={0} width={300} height={100} fill="transparent" stroke={isSelected ? "#6366f1" : "transparent"} strokeWidth={2} shadowColor={isSelected ? "#6366f1" : "transparent"} shadowBlur={isSelected ? 10 : 0} cornerRadius={8} />
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
              }`;

const textRenderReplace = `              } else if (obj.type === 'text') {
                return (
                  <TextNode
                    key={obj.id}
                    obj={obj}
                    isSelected={selectedIds.includes(obj.id)}
                    isEditing={editingId === obj.id}
                    tool={tool}
                    setEditingId={setEditingId}
                    updateObject={(id, changes) => {
                      setObjects(prev => prev.map(o => o.id === id ? { ...o, ...changes } : o));
                      emitEvent({ type: 'UPDATE_OBJECT', id, changes });
                    }}
                    onPointerDown={(e) => handleShapePointerDown(e, obj.id)}
                    onDblClick={(e) => handleShapeDblClick(e, obj.id, obj.type)}
                    onDragStart={(e) => handleDragStart(e, obj.id)}
                    onDragMove={(e) => handleDragMove(e, obj.id)}
                    onDragEnd={(e) => handleDragEnd(e, obj.id)}
                  />
                );
              }`;

code = code.replace(textRenderTarget, textRenderReplace);

// Also remove unused imports that are now in TextNode
code = code.replace("import ReactMarkdown from 'react-markdown';\nimport remarkMath from 'remark-math';\nimport rehypeKatex from 'rehype-katex';\nimport remarkGfm from 'remark-gfm';\nimport 'katex/dist/katex.min.css';\nimport { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';\nimport { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';", "import 'katex/dist/katex.min.css';");
code = code.replace("import { Html } from 'react-konva-utils';\n", "");

fs.writeFileSync('src/components/Canvas.tsx', code);
