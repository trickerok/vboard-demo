import fs from 'fs';
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

code = code.replace(
  "export function Canvas({ socket, roomId, bgPattern = 'grid', setBgPattern, bgColor = 'white', setBgColor, gridSize = 40, setGridSize, localUserId, localUserName, localUserColor }: CanvasProps) {",
  "export function Canvas({ socket, roomId, bgPattern = 'grid', setBgPattern, bgColor = 'white', setBgColor, gridSize = 40, setGridSize, localUserId, localUserName, localUserColor }: CanvasProps) {\n  const [showMenu, setShowMenu] = useState(false);"
);

// If the previous string was just standard without setters:
if (!code.includes("const [showMenu, setShowMenu] = useState(false);")) {
  code = code.replace(
    "export function Canvas({ socket, roomId, bgPattern = 'grid', bgColor = 'white', gridSize = 40, localUserId, localUserName, localUserColor }: CanvasProps) {",
    "export function Canvas({ socket, roomId, bgPattern = 'grid', bgColor = 'white', gridSize = 40, localUserId, localUserName, localUserColor }: CanvasProps) {\n  const [showMenu, setShowMenu] = useState(false);"
  );
}

fs.writeFileSync('src/components/Canvas.tsx', code);
