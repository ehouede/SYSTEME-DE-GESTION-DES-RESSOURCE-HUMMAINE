import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import PersonnelPage from "./pages/Personnel";
import PointagePage from "./pages/Pointage";
import CongesPage from "./pages/Conges";
import ObjectifsPage from "./pages/Objectifs";
import NotificationsPage from "./pages/Notifications";
import ValidationPage from "./pages/Validation";
import HistoryPage from "./pages/History";
import AbsencesPage from "./pages/Absences";
import StatsPage from "./pages/Stats";

const titleMap = {
  "/dashboard": "Tableau de bord RH",
  "/leaves": "Demandes de congé",
  "/conges": "Demandes de congé",
  "/absences": "Gestion des absences",
  "/validation": "Validation hiérarchique",
  "/stats": "Statistiques RH",
  "/history": "Historique",
  "/notifications": "Notifications",
  "/rights": "Droits & Quotas",
  "/employees": "Employés",
  "/personnel": "Employés",
  "/pointage": "Pointage",
  "/objectifs": "Objectifs",
};

const placeholderContent = {
  "/absences": "Suivez les absences et les justificatifs depuis cette interface.",
  "/validation": "Validez les demandes de congé et les absences en attente.",
  "/stats": "Visualisez les indicateurs RH, les tendances et les statistiques.",
  "/history": "Consultez l'historique des demandes et des actions RH.",
  "/rights": "Gérez les droits, quotas et règles de gestion des congés.",
};

function PlaceholderPage({ title, description }) {
  return (
    <div className="card">
      <div className="section-title">{title}</div>
      <p className="text-muted" style={{ marginTop: 12 }}>{description}</p>
    </div>
  );
}

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const pageTitle = titleMap[location.pathname] || "SGRH Suite";
  const showShell = location.pathname !== "/login" && location.pathname !== "/register";

  if (!showShell) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <div className="app">
        <Sidebar />
        <div className="main">
          <div className="topbar">
            <div className="page-title">{pageTitle}</div>
            <div className="topbar-actions">
              <button className="btn btn-sm" onClick={() => navigate("/notifications")} style={{ position: "relative" }}>
                <i className="ti ti-bell" style={{ fontSize: 16 }}></i>
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 6,
                    height: 6,
                    background: "var(--color-text-danger)",
                    borderRadius: "50%",
                  }}
                />
              </button>
              {currentUser && currentUser.role === "EMPLOYE" && (
                <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                  <i className="ti ti-plus"></i> Nouvelle demande
                </button>
              )}
              <div className="avatar" style={{ width: 34, height: 34 }}>DR</div>
            </div>
          </div>
          <div className="content">
            <Routes>
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/personnel" element={<ProtectedRoute><PersonnelPage /></ProtectedRoute>} />
              <Route path="/pointage" element={<ProtectedRoute><PointagePage /></ProtectedRoute>} />
              <Route path="/conges" element={<ProtectedRoute><CongesPage /></ProtectedRoute>} />
              <Route path="/leaves" element={<Navigate to="/conges" replace />} />
              <Route path="/objectifs" element={<ProtectedRoute><ObjectifsPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/absences" element={<ProtectedRoute><AbsencesPage /></ProtectedRoute>} />
              <Route path="/validation" element={<ProtectedRoute><ValidationPage /></ProtectedRoute>} />
              <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
              <Route path="/rights" element={<ProtectedRoute><PlaceholderPage title="Droits & Quotas" description={placeholderContent["/rights"]} /></ProtectedRoute>} />
              <Route path="/employees" element={<Navigate to="/personnel" replace />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </div>

      <div className="modal-overlay" style={{ display: modalOpen ? "flex" : "none" }} onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
        <div className="modal">
          <div className="modal-header">
            <div className="modal-title">Nouvelle demande de congé</div>
            <button className="modal-close" onClick={() => setModalOpen(false)}>
              <i className="ti ti-x"></i>
            </button>
          </div>
          <div className="form-group">
            <label className="form-label">Type de congé</label>
            <select className="form-control">
              <option>Congé annuel</option>
              <option>Congé maladie</option>
              <option>Congé maternité / paternité</option>
              <option>Congé sans solde</option>
              <option>RTT</option>
              <option>Congé exceptionnel</option>
            </select>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Date de début</label>
              <input type="date" className="form-control" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="form-group">
              <label className="form-label">Date de fin</label>
              <input type="date" className="form-control" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Motif / Commentaire</label>
            <textarea className="form-control" placeholder="Précisez le motif de votre demande (optionnel)..."></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Document justificatif</label>
            <input type="file" className="form-control" style={{ padding: 6 }} />
          </div>
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            <i className="ti ti-info-circle"></i>
            Solde disponible : <strong>18 jours</strong> de congé annuel
          </div>
          <div className="flex" style={{ justifyContent: "flex-end", gap: 8 }}>
            <button className="btn" onClick={() => setModalOpen(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={() => setModalOpen(false)}>
              <i className="ti ti-send"></i> Soumettre
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
