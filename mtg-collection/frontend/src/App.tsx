import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DeckDetail from "./pages/DeckDetail";
import Collection from "./pages/Collection";
import Orders from "./pages/Orders";
import Import from "./pages/Import";

function Nav() {
  const base = "text-sm font-medium px-3 py-2 rounded-lg transition-colors";
  const active = `${base} bg-gray-800 text-white`;
  const inactive = `${base} text-gray-400 hover:text-white`;

  return (
    <nav className="flex items-center gap-1 px-4 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
      <span className="text-white font-bold text-lg mr-4">🃏 MTG</span>
      <NavLink to="/" end className={({ isActive }) => isActive ? active : inactive}>Decks</NavLink>
      <NavLink to="/collection" className={({ isActive }) => isActive ? active : inactive}>Collection</NavLink>
      <NavLink to="/orders" className={({ isActive }) => isActive ? active : inactive}>Orders</NavLink>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <Nav />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/decks/:id" element={<DeckDetail />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/import" element={<Import />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
