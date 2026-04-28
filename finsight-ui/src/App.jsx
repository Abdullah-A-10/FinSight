import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Simulation from "./pages/Simulation";
import Advisor from "./pages/Advisor";
import Accounts from "./pages/Accounts";
import ProtectedRoute from "./components/ProtectedRoute";
import LifeEvents from "./pages/LifeEvents";
import Budgets from './pages/Budgets'

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/simulate" element={<Simulation />} />
            <Route path="/advisor" element={<Advisor />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/life-events" element={<LifeEvents />} />
            <Route path="/budgets" element={<Budgets />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
