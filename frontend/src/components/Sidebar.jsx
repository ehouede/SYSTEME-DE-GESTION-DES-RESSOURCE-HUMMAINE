import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../api";

const allNavSections = [
  {
    label: "Principal",
    items: [
      { path: "/dashboard", icon: "ti-dashboard", label: "Tableau de bord", roles: ["EMPLOYE", "MANAGER", "RH", "ADMIN"] },
      { path: "/leaves", icon: "ti-calendar-off", label: "Demandes de congé", countKey: "leaves", roles: ["EMPLOYE", "MANAGER", "RH", "ADMIN"] },
      { path: "/absences", icon: "ti-user-x", label: "Absences", roles: ["EMPLOYE", "MANAGER", "RH", "ADMIN"] },
      { path: "/validation", icon: "ti-checks", label: "Validations", countKey: "validation", roles: ["MANAGER", "RH", "ADMIN"] },
    ],
  },
  {
    label: "Analytique",
    items: [
      { path: "/stats", icon: "ti-chart-bar", label: "Statistiques RH", roles: ["RH", "ADMIN"] },
      { path: "/history", icon: "ti-history", label: "Historique", roles: ["MANAGER", "RH", "ADMIN"] },
      { path: "/notifications", icon: "ti-bell", label: "Notifications", countKey: "notifications", roles: ["EMPLOYE", "MANAGER", "RH", "ADMIN"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { path: "/rights", icon: "ti-shield-check", label: "Droits & Quotas", roles: ["RH", "ADMIN"] },
      { path: "/personnel", icon: "ti-users", label: "Employés", roles: ["RH", "ADMIN"] },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error(e);
      return null;
    }
  });
  const [counts, setCounts] = useState({ notifications: 0, validation: 0, leaves: 0 });

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
    const fetchCounts = async () => {
      if (!currentUser) return;
      try {
        const [notificationsResp, demandesResp] = await Promise.all([
          api.get("/notifications/"),
          api.get("/conges/demandes/"),
        ]);

        const notificationsData = notificationsResp.data || [];
        const demandesData = demandesResp.data || [];

        const unreadNotifications = notificationsData.filter((n) => !n.lue).length;
        const validationCount = currentUser.role === "MANAGER"
          ? demandesData.filter((d) => d.statut === "SOUMIS").length
          : ["RH", "ADMIN"].includes(currentUser.role)
            ? demandesData.filter((d) => ["SOUMIS", "VALIDE_N1"].includes(d.statut)).length
            : 0;

        setCounts({
          notifications: unreadNotifications,
          validation: validationCount,
          leaves: demandesData.length,
        });
      } catch (err) {
        console.error("Erreur lors du chargement des badges de menu", err);
      }
    };

    fetchCounts();
  }, [currentUser]);

  const userRole = currentUser?.role;
  const navSections = allNavSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(userRole)),
    }))
    .filter((section) => section.items.length > 0);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-text">
          <i className="ti ti-building-community" style={{ color: "var(--color-text-info)" }}></i> GRH Suite
        </div>
        <div className="logo-sub">Gestion des ressources humaines</div>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div className="nav-section" key={section.label}>
            <div className="nav-label">{section.label}</div>
            {section.items.map((item) => {
                const badgeValue = item.countKey ? counts[item.countKey] : item.badge;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                  >
                    <i className={`ti ${item.icon}`}></i>
                    {item.label}
                    {badgeValue > 0 ? <span className="nav-badge">{badgeValue}</span> : null}
                  </NavLink>
                );
              })}
          </div>
        ))}
      </nav>

      <div style={{ padding: "12px 16px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
        <div className="flex">
          <div className="avatar">{currentUser?.first_name?.[0] || "U"}{currentUser?.last_name?.[0] || ""}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{currentUser ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() : "Utilisateur"}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{currentUser?.role || "Connecté"}</div>
          </div>
        </div>
        <button className="btn btn-sm" style={{ width: "100%", marginTop: 12 }} onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
