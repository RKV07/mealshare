import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import { StudentProvider } from "./StudentContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx"; // Student Dashboard
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminStudents from "./pages/AdminStudents.jsx";
import AdminMeals from "./pages/AdminMeals.jsx";
import AdminNGO from "./pages/AdminNGO.jsx";
import Surplus from "./pages/Surplus.jsx";
import Reports from "./pages/Reports.jsx";
import Inventory from "./pages/Inventory.jsx";
import Bookings from "./pages/Bookings.jsx";
import NGODashboard from "./pages/NGODashboard.jsx";
import NGOSurplus from "./pages/NGOSurplus.jsx";
import NGOClaims from "./pages/NGOClaims.jsx";

const titles = {
  "/admin/dashboard": "Admin Dashboard",
  "/admin/students":  "User Management",
  "/admin/meals":     "Meal Management",
  "/admin/bookings":  "Meal Bookings",
  "/admin/ngo":       "NGO Requests",
  "/admin/inventory": "Ingredient Inventory",
  "/admin/reports":   "Reports & Analytics",
  "/student/dashboard": "Student Dashboard",
  "/student/bookings":  "Book Meals",
  "/student/surplus":   "Surplus Board",
  "/student/reports":   "Reports",
  "/ngo/dashboard":   "NGO Portal Overview",
  "/ngo/surplus":     "Available Surplus Board",
  "/ngo/claims":      "My Food Claims Tracker",
};

function AdminRoute({ children }) {
  const { account } = useAuth();
  const role = account?.role || (account?.is_admin ? 'admin' : 'student');
  if (role !== 'admin') return <RootRedirect />;
  return children;
}

function StudentRoute({ children }) {
  const { account } = useAuth();
  const role = account?.role || (account?.is_admin ? 'admin' : 'student');
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'ngo')   return <Navigate to="/ngo/dashboard" replace />;
  return children;
}

function NGORoute({ children }) {
  const { account } = useAuth();
  const role = account?.role || (account?.is_admin ? 'admin' : 'student');
  if (role !== 'ngo') return <RootRedirect />;
  return children;
}

function RootRedirect() {
  const { account } = useAuth();
  const role = account?.role || (account?.is_admin ? 'admin' : 'student');
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'ngo')   return <Navigate to="/ngo/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
}

function Shell() {
  const location = useLocation();
  const title = titles[location.pathname] || "MealShare";

  return (
    <div className="min-h-screen w-full flex bg-bgSoft dark:bg-[#0f1412] font-display">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} />
        <main className="flex-1 p-6 space-y-6 max-w-[1400px] w-full mx-auto">
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/students"  element={<AdminRoute><AdminStudents /></AdminRoute>} />
            <Route path="/admin/meals"     element={<AdminRoute><AdminMeals /></AdminRoute>} />
            <Route path="/admin/bookings"  element={<AdminRoute><Bookings /></AdminRoute>} />
            <Route path="/admin/ngo"       element={<AdminRoute><AdminNGO /></AdminRoute>} />
            <Route path="/admin/inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
            <Route path="/admin/reports"   element={<AdminRoute><Reports /></AdminRoute>} />

            {/* Student Routes */}
            <Route path="/student/dashboard" element={<StudentRoute><Dashboard /></StudentRoute>} />
            <Route path="/student/bookings"  element={<StudentRoute><Bookings /></StudentRoute>} />
            <Route path="/student/surplus"   element={<StudentRoute><Surplus /></StudentRoute>} />
            <Route path="/student/reports"   element={<StudentRoute><Reports /></StudentRoute>} />

            {/* NGO Routes */}
            <Route path="/ngo/dashboard" element={<NGORoute><NGODashboard /></NGORoute>} />
            <Route path="/ngo/surplus"   element={<NGORoute><NGOSurplus /></NGORoute>} />
            <Route path="/ngo/claims"    element={<NGORoute><NGOClaims /></NGORoute>} />

            {/* Legacy Fallbacks */}
            <Route path="/surplus"   element={<Navigate to="/student/surplus" replace />} />
            <Route path="/bookings"  element={<RootRedirect />} />
            <Route path="/inventory" element={<Navigate to="/admin/inventory" replace />} />
            <Route path="/students"  element={<Navigate to="/admin/students" replace />} />
            <Route path="/reports"   element={<RootRedirect />} />
            <Route path="*"          element={<RootRedirect />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function Gate() {
  const { account, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-bgSoft dark:bg-[#0f1412] font-display text-inkSoft dark:text-gray-400 text-sm">
        Loading…
      </div>
    );
  }
  if (!account) return <Home />;
  return (
    <StudentProvider initialStudent={account}>
      <Shell />
    </StudentProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ThemeProvider>
  );
}
