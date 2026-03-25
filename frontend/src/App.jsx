// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Templates from "./pages/Templates";
import Annexure1 from "./pages/Annexure1";
import Annexure2 from "./pages/Annexure2";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import DynamicTemplate from "./pages/DynamicTemplate";
import Upload from "./pages/Upload";
import Master from "./pages/Master";
import AssignDocument from "./pages/AssignDocument";
import AssignedDocuments from "./pages/AssignedDocuments";
import AdminUserDetails from "./pages/AdminUserDetails";
import DocumentHistory from "./pages/DocumentHistory";
import GenerateMasterSheet from "./pages/GenerateMasterSheet";
import GenerateDossier from "./pages/GenerateDossier";

/* ✅ NEW IMPORTS */
import DocumentSelection from "./pages/DocumentSelection";
import GenerateAnnexure1 from "./pages/GenerateAnnexure1";
import GenerateAnnexure2 from "./pages/GenerateAnnexure2";

/* Protected Route */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return user ? children : <Navigate to="/" />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* Public */}
        <Route path="/" element={<Login />} />

        {/* Protected Routes */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          }
        />

        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master"
          element={
            <ProtectedRoute>
              <Master />
            </ProtectedRoute>
          }
        />
<Route path="/generate-dossier" element={<GenerateDossier />} />
<Route path="/generate/:template/:userId" element={<DynamicTemplate />} />
        <Route
          path="/assign/:documentId"
          element={
            <ProtectedRoute>
              <AssignDocument />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assigned-documents"
          element={
            <ProtectedRoute>
              <AssignedDocuments />
            </ProtectedRoute>
          }
        />

        {/* ✅ NEW DOCUMENT SELECTION PAGE */}
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <DocumentSelection />
            </ProtectedRoute>
          }
        />

        {/* ✅ MASTER SHEET */}
        <Route
          path="/generate-master-sheet"
          element={
            <ProtectedRoute>
              <GenerateMasterSheet />
            </ProtectedRoute>
          }
        />

        {/* ✅ ANNEXURE 1 */}
        <Route
          path="/generate-annexure-1"
          element={
            <ProtectedRoute>
              <GenerateAnnexure1 />
            </ProtectedRoute>
          }
        />

        {/* ✅ ANNEXURE 2 */}
        <Route
          path="/generate-annexure-2"
          element={
            <ProtectedRoute>
              <GenerateAnnexure2 />
            </ProtectedRoute>
          }
        />
<Route path="/generate/:template/:userId" element={<DynamicTemplate />} />
        <Route path="/templates" element={<Templates />} />
<Route path="/templates/annexure-1" element={<Annexure1 />} />
<Route path="/templates/annexure-2" element={<Annexure2 />} />

        {/* Admin & History (kept unchanged) */}
        <Route path="/admin/user-details" element={<AdminUserDetails />} />
        <Route path="/documents/history/:id" element={<DocumentHistory />} />

      </Routes>
    </AuthProvider>
  );
}

export default App;