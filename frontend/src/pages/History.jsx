import React, { useEffect, useState } from "react";
import { Typography, Table, Card, List, Spin, Empty, message, Badge } from "antd";
import api from "../api";
import moment from "moment";

const { Title } = Typography;

export default function History() {
  const [demandes, setDemandes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [demandesResp, notificationsResp] = await Promise.all([
        api.get("/conges/demandes/"),
        api.get("/notifications/"),
      ]);
      setDemandes(demandesResp.data || []);
      setNotifications(notificationsResp.data || []);
    } catch (err) {
      console.error(err);
      message.error("Impossible de charger l'historique.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    {
      title: "Employé",
      key: "employe",
      render: (_, record) => {
        const u = record.employe_detail?.user;
        return u ? `${u.first_name} ${u.last_name}` : "N/A";
      },
    },
    {
      title: "Type de congé",
      key: "type",
      render: (_, record) => record.type_conge_detail?.nom || "Non spécifié",
    },
    { title: "Période", key: "periode", render: (_, record) => `${record.date_debut} → ${record.date_fin}` },
    { title: "Jours", dataIndex: "duree_jours", key: "duree_jours", width: 90 },
    {
      title: "Statut",
      key: "statut",
      render: (_, record) => {
        const colors = {
          BROUILLON: "default",
          SOUMIS: "blue",
          VALIDE_N1: "cyan",
          VALIDE_RH: "green",
          REFUSE: "red",
        };
        return <Badge color={colors[record.statut] || "default"} text={record.statut_display || record.statut} />;
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "60vh" }}>
        <Spin tip="Chargement de l'historique..." size="large" />
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: "24px" }}>
      <Title level={2} style={{ color: "#fff", textAlign: "center" }}>
        Historique des demandes et notifications
      </Title>

      <Card title="Historique des demandes de congé" className="glass-card" style={{ marginBottom: 24 }}>
        {demandes.length === 0 ? (
          <Empty description="Aucune demande de congé enregistrée." />
        ) : (
          <Table
            columns={columns}
            dataSource={demandes}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            bordered
            className="glass-card"
            style={{ background: "transparent" }}
          />
        )}
      </Card>

      <Card title="Historique des notifications" className="glass-card">
        {notifications.length === 0 ? (
          <Empty description="Aucune notification reçue." />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                style={{
                  background: item.lue ? "rgba(255, 255, 255, 0.02)" : "rgba(90, 103, 216, 0.08)",
                  borderRadius: 10,
                  marginBottom: 12,
                  padding: 18,
                }}
              >
                <List.Item.Meta
                  title={
                    <span style={{ color: item.lue ? "rgba(255, 255, 255, 0.65)" : "#fff" }}>
                      {item.lue ? "Lue" : "Non lue"}
                    </span>
                  }
                  description={item.message}
                />
                <div style={{ color: "rgba(255, 255, 255, 0.35)", fontSize: 12 }}>
                  {moment(item.date_envoi).format("DD/MM/YYYY HH:mm")}
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
