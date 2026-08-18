import fs from 'fs';
let code = fs.readFileSync('src/pages/Room.tsx', 'utf-8');

const targetCanvasProps = `<Canvas socket={socket} roomId={roomId} bgPattern={bgPattern} bgColor={bgColor} />`;

const animalNames = ["Curious Fox", "Happy Penguin", "Sleepy Bear", "Swift Falcon", "Clever Owl", "Brave Lion", "Jumping Frog", "Sneaky Cat", "Loyal Dog", "Lazy Sloth", "Dancing Turtle", "Fierce Tiger", "Gentle Deer"];
const generateRandomName = () => animalNames[Math.floor(Math.random() * animalNames.length)];
const generateRandomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

const stateInsert = `
  const [localUserId] = useState(() => uuidv4());
  const [localUserName] = useState(() => {
    const names = ["Curious Fox", "Happy Penguin", "Sleepy Bear", "Swift Falcon", "Clever Owl", "Brave Lion", "Jumping Frog", "Sneaky Cat", "Loyal Dog", "Lazy Sloth", "Dancing Turtle", "Fierce Tiger", "Gentle Deer"];
    return names[Math.floor(Math.random() * names.length)];
  });
  const [localUserColor] = useState(() => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'));
`;

code = code.replace(
  "const [copied, setCopied] = useState(false);",
  "const [copied, setCopied] = useState(false);\n" + stateInsert
);

code = code.replace(
  "import { Canvas } from '../components/Canvas';",
  "import { Canvas } from '../components/Canvas';\nimport { v4 as uuidv4 } from 'uuid';"
);

// We need to make sure we don't duplicate uuid import. Let's just remove one if it exists or do it carefully.
// Ah, the first block in Room doesn't import uuidv4 natively. So we're good.

const replaceCanvasProps = `<Canvas socket={socket} roomId={roomId} bgPattern={bgPattern} bgColor={bgColor} localUserId={localUserId} localUserName={localUserName} localUserColor={localUserColor} />`;

code = code.replace(targetCanvasProps, replaceCanvasProps);
fs.writeFileSync('src/pages/Room.tsx', code);
