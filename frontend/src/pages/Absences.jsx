import React, { useState, useEffect } from "react";
import { Typography, Table, Card, Spin, Empty, message, Badge } from "antd";
import api from "../api";
import moment from "moment";

const { Title } = Typography;

export default function Absences() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const response = await api.get("/conges/demandes/");
      setDemandes(response.data || []);
    } catch (err) {
      console.error(err);
      message.error("Impossible de charger les absences.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    {
      title: "Employé",
      key: "employe",
      render: (_, record) => {
        const user = record.employe_detail?.user;
        return user ? `${user.first_name} ${user.last_name}` : "N/A";
      },
    },
    {
      title: "Type d'absence",
      key: "type",
      render: (_, record) => record.type_conge_detail?.nom || "Non spécifié",
    },
    {
      title: "Période",
      key: "periode",
      render: (_, record) => `${record.date_debut} → ${record.date_fin}`,
    },
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
    {
      title: "Motif",
      dataIndex: "motif",
      key: "motif",
      render: (text) => text || "-",
    },
    {
      title: "Dernière mise à jour",
      key: "updated",
      render: (_, record) => record.updated_at ? moment(record.updated_at).format("DD/MM/YYYY HH:mm") : "-",
    },
  ];

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "60vh" }}>
        <Spin tip="Chargement des absences..." size="large" />
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: "24px" }}>
      <Title level={2} style={{ color: "#fff", textAlign: "center" }}>
        Gestion des absences
      </Title>
      <Card title="Absences enregistrées" className="glass-card">
        {demandes.length === 0 ? (
          <Empty description="Aucune absence trouvée." />
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
    </div>
  );
}
