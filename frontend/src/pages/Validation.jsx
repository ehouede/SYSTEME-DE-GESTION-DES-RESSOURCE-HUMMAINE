import React, { useEffect, useState } from "react";
import { Table, Typography, message, Button, Space, Tag, Empty } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import api from "../api";

const { Title } = Typography;

export default function Validation() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/conges/demandes/");
      setData(res.data || []);
    } catch (err) {
      console.error(err);
      message.error("Impossible de charger les demandes à valider");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleValider = async (id) => {
    try {
      const resp = await api.post(`/conges/demandes/${id}/valider/`);
      message.success(resp.data.detail || "Demande validée avec succès !");
      fetchData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Erreur lors de la validation.";
      message.error(errMsg);
    }
  };

  const handleRefuser = async (id) => {
    try {
      const resp = await api.post(`/conges/demandes/${id}/refuser/`);
      message.success(resp.data.detail || "Demande refusée.");
      fetchData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Erreur lors du refus.";
      message.error(errMsg);
    }
  };

  const pendingRequests = data.filter((record) => {
    if (!currentUser) return false;
    if (currentUser.role === "MANAGER") {
      return record.statut === "SOUMIS";
    }
    if (["RH", "ADMIN"].includes(currentUser.role)) {
      return ["SOUMIS", "VALIDE_N1"].includes(record.statut);
    }
    return false;
  });

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    {
      title: "Employé",
      key: "employe",
      render: (_, record) => {
        const u = record.employe_detail?.user;
        return u ? `${u.first_name} ${u.last_name}` : "Non disponible";
      },
    },
    {
      title: "Type de congé",
      key: "type",
      render: (_, record) => record.type_conge_detail?.nom || "Non spécifié",
    },
    { title: "Début", dataIndex: "date_debut", key: "date_debut" },
    { title: "Fin", dataIndex: "date_fin", key: "date_fin" },
    { title: "Jours", dataIndex: "duree_jours", key: "duree_jours", width: 90 },
    {
      title: "Statut",
      key: "statut",
      render: (_, record) => {
        const statusColors = {
          BROUILLON: "default",
          SOUMIS: "blue",
          VALIDE_N1: "cyan",
          VALIDE_RH: "green",
          REFUSE: "red",
        };
        return <Tag color={statusColors[record.statut] || "default"}>{record.statut_display || record.statut}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<CheckOutlined />}
            type="primary"
            size="small"
            onClick={() => handleValider(record.id)}
          >
            Valider
          </Button>
          <Button
            icon={<CloseOutlined />}
            danger
            size="small"
            onClick={() => handleRefuser(record.id)}
          >
            Refuser
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="glass-card" style={{ padding: "24px" }}>
      <Title level={2} style={{ color: "#fff", textAlign: "center" }}>
        Validation des demandes de congé
      </Title>

      {pendingRequests.length === 0 ? (
        <Empty description="Aucune demande de congé à valider pour le moment." style={{ padding: "40px 0" }} />
      ) : (
        <Table
          columns={columns}
          dataSource={pendingRequests}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          bordered
          className="glass-card"
          style={{ background: "transparent" }}
        />
      )}
    </div>
  );
}
