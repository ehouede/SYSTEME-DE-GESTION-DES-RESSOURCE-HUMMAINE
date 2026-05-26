import React, { useState, useEffect } from "react";
import { Row, Col, Card, Statistic, Table, Tag, Spin, message, Typography, List } from "antd";
import moment from "moment";
import api from "../api";

const { Title, Text } = Typography;

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
          <Card title="Par département" className="glass-card">
            <List
              itemLayout="horizontal"
              dataSource={departmentData}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text style={{ color: "#fff" }}>{item.department}</Text>}
                    description={<Text type="secondary">{item.days}j</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Par type de congé" className="glass-card">
            <Table
              columns={[
                { title: "Type", dataIndex: "type", key: "type" },
                { title: "Demandes", dataIndex: "count", key: "count" },
              ]}
              dataSource={typeData}
              pagination={false}
              rowKey="key"
              bordered
              className="glass-card"
              style={{ background: "transparent" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Solde de congés par employé" className="glass-card">
            <List
              itemLayout="horizontal"
              dataSource={employeeBalanceRows}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text style={{ color: "#fff" }}>{item.name}</Text>}
                    description={<Text type="secondary">{Math.round(item.taken)}/{Math.round(item.total)}j</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Absentéisme mensuel" className="glass-card">
            <List
              itemLayout="horizontal"
              dataSource={monthlyAbsences.slice(0, 6)}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text style={{ color: "#fff" }}>{item.month}</Text>}
                    description={<Text type="secondary">{item.value}j</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
