# STEMBoard

A real-time collaborative whiteboard designed for STEM education and brainstorming. It supports multiple users working on the same canvas seamlessly using WebSockets, featuring a rich set of drawing and mathematical tools.

## Features

- **Real-Time Collaboration**: Work together with remote cursors using Socket.io.
- **Rich Shape Tools**: Draw freehand, squares, circles, triangles, and polygons.
- **Mathematical Text & Markdown**: Insert rich text that automatically parses Markdown and LaTeX/KaTeX (e.g. `$$ E=mc^2 $$`) into beautiful math equations.
- **Smart Group Selection**: Drag multiple objects at once, select via lasso, or click anywhere inside a group bounding box to move it.
- **High-Quality Export**: Export your whiteboard to high-resolution JPEG or PDF while preserving the canvas background and grid patterns.
- **Configurable Canvas**: Toggle between White, Paper, or Gray backgrounds, and activate Dots or Grid patterns with adjustable scaling.
- **Infinite Space Pan**: Pan around the infinite canvas using the Pan tool or by holding the spacebar.

## Project Structure

The codebase is organized cleanly to separate concerns:

- `src/components/`
  - `Canvas.tsx`: The core canvas engine built with `react-konva`. Handles rendering, event routing, real-time cursor syncing, drawing logic, and exports.
  - `TextNode.tsx`: A specialized component for rendering Markdown and KaTeX math formulas within the Konva stage using HTML overlays.
- `src/pages/`
  - `Room.tsx`: The workspace wrapper that manages Socket.io connections, room state, toolbars, and background settings.
- `src/lib/`
  - `firebase.ts`: Configuration for Firebase, used for long-term data persistence.
  - `freehand.ts`: Utility for generating SVG paths from `perfect-freehand` strokes for smooth drawing.
- `server.ts`: The Express/Socket.io backend server that routes real-time events between users.

## Deployment

The application consists of a Vite React frontend and an Express Socket.io backend. It can be deployed as a single full-stack Node.js application.

1. **Build the Application:**
   Run the build script to compile the frontend and bundle the backend server:
   \`\`\`bash
   npm run build
   \`\`\`
   This will output a standalone \`dist/server.cjs\` file and the compiled frontend assets in the \`dist/\` folder.

2. **Start the Production Server:**
   Launch the compiled server:
   \`\`\`bash
   npm start
   \`\`\`
   The application will run on port 3000 by default (configurable via the \`PORT\` environment variable).

3. **Deploying to Cloud Providers:**
   You can deploy this repository to services like Google Cloud Run, Heroku, or Render. Make sure the hosting service supports WebSockets.

## Development

To start the development server with live reload:

\`\`\`bash
npm run dev
\`\`\`
