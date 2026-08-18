import fs from 'fs';

let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

const target = `import { cn } from '../lib/utils';`;
const replace = `import { cn } from '../lib/utils';
import { Html } from 'react-konva-utils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';`;
code = code.replace(target, replace);

// Fix TS2448 'selectedIds' used before declaration
const selIdTarget = `  useEffect(() => {
    if (trRef.current) {
      const nodes = selectedIds.map(id => trRef.current.getStage().findOne(\`#\${id}\`)).filter(Boolean);
      trRef.current.nodes(nodes);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedIds, objects]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [objects, setObjects] = useState<CanvasObject[]>([]);`;
  
const selIdReplace = `  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  useEffect(() => {
    if (trRef.current) {
      const nodes = selectedIds.map(id => trRef.current.getStage().findOne(\`#\${id}\`)).filter(Boolean);
      trRef.current.nodes(nodes);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedIds, objects]);`;
code = code.replace(selIdTarget, selIdReplace);
code = code.replace("  const [selectedIds, setSelectedIds] = useState<string[]>([]);\n", ""); // remove original declaration further down


fs.writeFileSync('src/components/Canvas.tsx', code);

// Fix TextNode.tsx TS2339 error
let tnCode = fs.readFileSync('src/components/TextNode.tsx', 'utf-8');
tnCode = tnCode.replace("const { width, height } = entry.boundingClientRect;", "const width = entry.contentRect.width; const height = entry.contentRect.height;");
fs.writeFileSync('src/components/TextNode.tsx', tnCode);
