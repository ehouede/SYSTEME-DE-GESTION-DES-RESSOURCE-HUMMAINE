import React, { useState, useEffect } from "react";
import { Row, Col, Card, Statistic, Table, Tag, Spin, message, Typography, List } from "antd";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import moment from "moment";
import api from "../api";

const { Title, Text } = Typography;

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#a4de6c", "#d084d0"];

const statusColorMap = {
  BROUILLON: "default",
  SOUMIS: "blue",
  VALIDE_N1: "cyan",
  VALIDE_RH: "green",
  REFUSE: "red",
};

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export default function Stats() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [soldes, setSoldes] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [requestsResp, notificationsResp, employeesResp, soldesResp] = await Promise.all([
          api.get("/conges/demandes/"),
          api.get("/notifications/"),
          api.get("/personnel/employes/"),
          api.get("/conges/soldes/"),
        ]);

        setRequests(requestsResp.data || []);
        setNotifications(notificationsResp.data || []);
        setEmployees(employeesResp.data || []);
        setSoldes(soldesResp.data || []);
      } catch (err) {
        console.error(err);
        message.error("Impossible de charger les statistiques RH.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const requestCount = requests.length;
  const employeeCount = employees.length;
  const notificationCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.lue).length;

  const validatedRequests = requests.filter((r) => r.statut === "VALIDE_RH" || r.statut === "VALIDE_N1");
  const totalDays = requests.reduce((acc, item) => acc + (item.duree_jours || 0), 0);
  const takenDays = validatedRequests.reduce((acc, item) => acc + (item.duree_jours || 0), 0);
  const avgDuration = requestCount ? (totalDays / requestCount).toFixed(1) : 0;

  const baseWorkingDays = employeeCount * 220;
  const absenteeismRate = baseWorkingDays ? ((totalDays / baseWorkingDays) * 100).toFixed(1) : 0;

  const averageValidationHours = requests
    .filter((r) => r.statut !== "BROUILLON")
    .map((r) => {
      const created = moment(r.date_demande);
      return moment().diff(created, "hours");
    });
  const avgValidation = averageValidationHours.length
    ? Math.round(averageValidationHours.reduce((sum, value) => sum + value, 0) / averageValidationHours.length)
    : 0;

  const statusCounts = requests.reduce((acc, item) => {
    const key = item.statut || "AUTRE";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const typeCounts = requests.reduce((acc, item) => {
    const key = item.type_conge_detail?.nom || item.type_conge || "Inconnu";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const departmentCounts = requests.reduce((acc, item) => {
    const serviceName = item.employe_detail?.service_detail?.nom || "Non attribué";
    acc[serviceName] = (acc[serviceName] || 0) + (item.duree_jours || 0);
    return acc;
  }, {});

  const employeeBalances = soldes.reduce((acc, item) => {
    const name = item.employe_name || "Utilisateur inconnu";
    if (!acc[name]) {
      acc[name] = {
        name,
        taken: 0,
        total: 0,
      };
    }
    acc[name].taken += parseFloat(item.jours_pris || 0);
    acc[name].total += parseFloat(item.jours_acquis || 0);
    return acc;
  }, {});

  const employeeBalanceRows = Object.values(employeeBalances)
    .sort((a, b) => b.taken - a.taken)
    .slice(0, 8);

  const monthlyAbsences = Array.from({ length: 12 }, (_, index) => ({
    month: MONTHS[index],
    value: 0,
  }));

  requests.forEach((item) => {
    const date = moment(item.date_debut);
    if (date.isValid() && date.year() === moment().year()) {
      const monthIndex = date.month();
      monthlyAbsences[monthIndex].value += item.duree_jours || 0;
    }
  });

  const summaryCards = [
    {
      title: "Taux d'absentéisme",
      value: `${absenteeismRate}%`,
      description: "+0.8% vs N-1",
    },
    {
      title: "Jours pris YTD",
      value: takenDays,
      description: "-12% vs cible",
    },
    {
      title: "Durée moy. congé",
      value: `${avgDuration}j`,
      description: "Par congé",
    },
    {
      title: "Délai validation",
      value: `${avgValidation}h`,
      description: "Moy. cette semaine",
    },
  ];

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    key: status,
    status,
    count,
  }));

  const typeData = Object.entries(typeCounts).map(([type, count]) => ({
    key: type,
    type,
    count,
  }));

  const departmentData = Object.entries(departmentCounts).map(([department, days]) => ({
    key: department,
    department,
    days,
  }));

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "60vh" }}>
        <Spin tip="Chargement des statistiques RH..." size="large" />
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: "24px" }}>
      <Title level={2} style={{ color: "#fff", textAlign: "center" }}>
        Statistiques RH
      </Title>

      <div style={{ marginBottom: 24 }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 16 }}>
          Vue d'ensemble
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {summaryCards.map((card) => (
          <Col xs={24} sm={12} md={6} key={card.title}>
            <Card className="glass-card" style={{ textAlign: "center" }}>
              <Statistic title={card.title} value={card.value} valueStyle={{ color: "#fff" }} />
              <div style={{ marginTop: 8, color: "rgba(255,255,255,0.65)" }}>{card.description}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Absentéisme mensuel" className="glass-card">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyAbsences}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ background: "rgba(0,0,0,0.8)", border: "none", borderRadius: 8 }} />
                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={{ fill: "#8884d8" }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Demandes par statut" className="glass-card">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ type, count }) => `${type}: ${count}`} outerRadius={80} fill="#8884d8" dataKey="count">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Demandes par type de congé" className="glass-card">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="type" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ background: "rgba(0,0,0,0.8)", border: "none", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Solde de congés par employé (top 8)" className="glass-card">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeBalanceRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ background: "rgba(0,0,0,0.8)", border: "none", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="taken" fill="#ff7c7c" name="Jours pris" />
                <Bar dataKey="total" fill="#ffc658" name="Jours acquis" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Jours pris par département" className="glass-card">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                <YAxis dataKey="department" type="category" stroke="rgba(255,255,255,0.5)" width={150} />
                <Tooltip contentStyle={{ background: "rgba(0,0,0,0.8)", border: "none", borderRadius: 8 }} />
                <Bar dataKey="days" fill="#a4de6c" name="Jours" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
