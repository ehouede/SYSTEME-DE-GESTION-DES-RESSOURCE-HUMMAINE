import React, { useState, useEffect, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ConfigProvider, theme as antdTheme } from 'antd';
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy-load page components to reduce initial bundle size
const DashboardPage = React.lazy(() => import("./pages/Dashboard"));
const LoginPage = React.lazy(() => import("./pages/Login"));
const RegisterPage = React.lazy(() => import("./pages/Register"));
const PersonnelPage = React.lazy(() => import("./pages/Personnel"));
const PointagePage = React.lazy(() => import("./pages/Pointage"));
const CongesPage = React.lazy(() => import("./pages/Conges"));
const ObjectifsPage = React.lazy(() => import("./pages/Objectifs"));
const NotificationsPage = React.lazy(() => import("./pages/Notifications"));
const ValidationPage = React.lazy(() => import("./pages/Validation"));
const HistoryPage = React.lazy(() => import("./pages/History"));
const AbsencesPage = React.lazy(() => import("./pages/Absences"));
const StatsPage = React.lazy(() => import("./pages/Stats"));
const RightsPage = React.lazy(() => import("./pages/Rights"));

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

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [types, setTypes] = useState([]);
  const [typeId, setTypeId] = useState("");
  const [dateStart, setDateStart] = useState(new Date().toISOString().split("T")[0]);
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().split("T")[0]);
  const [motif, setMotif] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    // Apply theme to root element via data-theme attribute and persist
    try {
      if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.error('Error applying theme', e);
    }
  }, [theme]);

  useEffect(() => {
    // Charger les types de congé pour le select
    import("./api").then(({ default: api }) => {
      api.get('/conges/types/').then(resp => {
        setTypes(resp.data);
        if (resp.data && resp.data.length > 0) setTypeId(resp.data[0].id);
      }).catch(e => {
        console.error('Erreur chargement types de congé', e);
      });
    });
  }, []);

  const handleSubmit = async () => {
    if (!typeId) return alert('Veuillez choisir un type de congé.');
    setSubmitting(true);
    try {
      const api = (await import('./api')).default;
      // 1) créer la demande (Brouillon)
      const payload = {
        type_conge: typeId,
        date_debut: dateStart,
        date_fin: dateEnd,
        motif: motif,
      };
      const createResp = await api.post('/conges/demandes/', payload);
      const demande = createResp.data;
      // 2) Appeler l'action soumettre
      await api.post(`/conges/demandes/${demande.id}/soumettre/`);
      alert('Demande soumise avec succès !');
      // Réinitialiser et fermer modal
      setModalOpen(false);
      setMotif('');
      setDateStart(new Date().toISOString().split('T')[0]);
      setDateEnd(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || err?.response?.data || err.message || 'Erreur lors de la soumission';
      alert(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const pageTitle = titleMap[location.pathname] || "BENIN-SERVICE SAS ";
  const showShell = location.pathname !== "/login" && location.pathname !== "/register";

  if (!showShell) {
    return (
      <Suspense fallback={<div>Chargement...</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'light' ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm,
        token: theme === 'light' ? {
          colorPrimary: '#5A67D8',
          colorBgBase: '#ffffff',
          colorBgContainer: '#ffffff',
          colorBgElevated: '#f3f4f6',
          colorBorder: 'rgba(15, 23, 42, 0.06)',
          colorTextBase: '#0f172a',
          colorTextSecondary: '#374151',
          borderRadius: 14,
          fontFamily: 'Inter, sans-serif',
        } : {
          colorPrimary: '#5A67D8',
          colorBgBase: '#111827',
          colorBgContainer: '#111827',
          colorBgElevated: '#1f2937',
          colorBorder: 'rgba(148, 163, 184, 0.2)',
          colorTextBase: '#f8fafc',
          colorTextSecondary: '#94a3b8',
          borderRadius: 14,
          fontFamily: 'Inter, sans-serif',
        }
      }}
    >
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
              {/* Theme toggle removed */}
              <div className="avatar" style={{ width: 34, height: 34 }}>DR</div>
            </div>
          </div>
          <div className="content">
            <Suspense fallback={<div>Chargement...</div>}>
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
                <Route path="/rights" element={<ProtectedRoute><RightsPage /></ProtectedRoute>} />
                <Route path="/employees" element={<Navigate to="/personnel" replace />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
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
            <select className="form-control" value={typeId} onChange={e => setTypeId(e.target.value)}>
              {types.length === 0 && <option value="">Chargement...</option>}
              {types.map(t => (
                <option key={t.id} value={t.id}>{t.nom}</option>
              ))}
            </select>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Date de début</label>
              <input type="date" className="form-control" value={dateStart} onChange={e => setDateStart(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Date de fin</label>
              <input type="date" className="form-control" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Motif / Commentaire</label>
            <textarea className="form-control" placeholder="Précisez le motif de votre demande (optionnel)..." value={motif} onChange={e => setMotif(e.target.value)}></textarea>
          </div>
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            <i className="ti ti-info-circle"></i>
            Solde disponible : <strong>18 jours</strong> de congé annuel
          </div>
          <div className="flex" style={{ justifyContent: "flex-end", gap: 8 }}>
            <button className="btn" onClick={() => setModalOpen(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              <i className="ti ti-send"></i> {submitting ? 'Envoi...' : 'Soumettre'}
            </button>
          </div>
        </div>
      </div>
    </>
    </ConfigProvider>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
