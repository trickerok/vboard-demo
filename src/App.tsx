/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Room } from './pages/Room';

function Home() {
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    const roomId = uuidv4();
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-zinc-900">STEMBoard</h1>
        <p className="mb-8 text-lg text-zinc-600">Real-time collaborative whiteboard for STEM education.</p>
        <button 
          onClick={handleCreateRoom}
          className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Create New Room
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </Router>
  );
}

