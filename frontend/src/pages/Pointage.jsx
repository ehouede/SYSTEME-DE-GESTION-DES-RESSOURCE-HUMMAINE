import React, { useState, useEffect } from "react";
import { Table, Typography, message, Modal, Form, TimePicker, DatePicker, Button, Popconfirm, Card, Space, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import api from "../api";
import moment from "moment";

const { Title, Text } = Typography;

export default function Pointage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/pointage/");
      setData(res.data);
    } catch (err) {
      console.error(err);
      message.error("Impossible de charger les pointages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check today's pointage state for the logged-in user
  const getTodayStatus = () => {
    const todayStr = moment().format("YYYY-MM-DD");
    // Find pointage for today
    const todayPointage = data.find(p => p.date === todayStr);
    
    if (!todayPointage) {
      return { action: "ARRIVAL", text: "Pointer l'arrivée", disabled: false };
    }
    if (!todayPointage.heure_depart) {
      return { action: "DEPARTURE", text: "Pointer le départ", disabled: false, record: todayPointage };
    }
    return { action: "DONE", text: "Déjà pointé aujourd'hui", disabled: true, record: todayPointage };
  };

  const handlePointer = async () => {
    try {
      setLoading(true);
      const resp = await api.post("/pointage/pointer/");
      message.success(resp.data.detail);
      fetchData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Erreur de pointage.";
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = record => {
    setEditing(record);
    form.setFieldsValue({
      date: moment(record.date),
      heure_arrivee: record.heure_arrivee ? moment(record.heure_arrivee, "HH:mm:ss") : null,
      heure_depart: record.heure_depart ? moment(record.heure_depart, "HH:mm:ss") : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async id => {
    try {
      await api.delete(`/pointage/${id}/`);
      setData(prev => prev.filter(item => item.id !== id));
      message.success("Pointage supprimé");
    } catch (err) {
      console.error(err);
      message.error("Erreur lors de la suppression");
    }
  };

  const handleSubmit = async values => {
    const payload = {
      date: values.date.format("YYYY-MM-DD"),
      heure_arrivee: values.heure_arrivee ? values.heure_arrivee.format("HH:mm:ss") : null,
      heure_depart: values.heure_depart ? values.heure_depart.format("HH:mm:ss") : null,
    };

    try {
      const resp = await api.put(`/pointage/${editing.id}/`, payload);
      setData(prev => prev.map(item => (item.id === editing.id ? resp.data : item)));
      message.success("Pointage mis à jour");
      setModalVisible(false);
    } catch (err) {
      console.error(err);
      message.error("Erreur lors de la mise à jour");
    }
  };

  const todayState = getTodayStatus();
  const isRHOrAdmin = currentUser && (currentUser.role === "RH" || currentUser.role === "ADMIN");

  const columns = [
    { title: "Date", dataIndex: "date", key: "date", width: 120 },
    { 
      title: "Employé", 
      key: "employee", 
      render: (_, record) => record.employe_name || "Chargement..."
    },
    { 
      title: "Heure d'arrivée", 
      dataIndex: "heure_arrivee", 
      key: "heure_arrivee",
      render: (t) => t ? t.substring(0, 5) : "--:--"
    },
    { 
      title: "Heure de départ", 
      dataIndex: "heure_depart", 
      key: "heure_depart",
      render: (t) => t ? t.substring(0, 5) : "--:--"
    },
    { 
      title: "Statut", 
      dataIndex: "statut", 
      key: "statut",
      render: (s, record) => {
        const colors = { PRESENT: "success", EN_RETARD: "warning", ABSENT: "error" };
        return <Tag color={colors[s] || "default"}>{record.statut_display || s}</Tag>;
      }
    },
  ];

  if (isRHOrAdmin) {
    columns.push({
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Popconfirm title="Confirmer la suppression ?" onConfirm={() => handleDelete(record.id)} okText="Oui" cancelText="Non">
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    });
  }

  return (
    <div className="glass-card" style={{ padding: "24px" }}>
      <Title level={2} style={{ color: "#fff", textAlign: "center" }}>Gestion des Pointages</Title>
      
      {/* Interactive clocking card for the logged-in employee */}
      <Card 
        style={{ 
          background: "rgba(255, 255, 255, 0.04)", 
          borderColor: "rgba(255, 255, 255, 0.1)", 
          marginBottom: "24px",
          textAlign: "center"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px" }}>
          <ClockCircleOutlined style={{ fontSize: "3rem", color: "var(--primary-color)", marginBottom: "16px" }} />
          <Title level={4} style={{ color: "#fff", margin: "0 0 8px 0" }}>
            {moment().format("dddd DD MMMM YYYY")}
          </Title>
          <Text style={{ color: "rgba(255, 255, 255, 0.65)", marginBottom: "20px" }}>
            {todayState.action === "ARRIVAL" && "Enregistrez votre heure d'arrivée pour débuter la journée."}
            {todayState.action === "DEPARTURE" && `Arrivée enregistrée à ${todayState.record?.heure_arrivee?.substring(0, 5)}. N'oubliez pas de pointer votre départ.`}
            {todayState.action === "DONE" && `Journée complétée : Arrivée à ${todayState.record?.heure_arrivee?.substring(0, 5)} | Départ à ${todayState.record?.heure_depart?.substring(0, 5)}`}
          </Text>
          
          <Button 
            type="primary" 
            size="large" 
            disabled={todayState.disabled}
            loading={loading}
            onClick={handlePointer}
            style={{ 
              minWidth: "220px", 
              height: "50px", 
              fontSize: "1.1rem", 
              fontWeight: "600",
              boxShadow: "0 4px 15px rgba(90, 103, 216, 0.3)"
            }}
          >
            {todayState.text}
          </Button>
        </div>
      </Card>

      <Title level={4} style={{ color: "#fff", marginBottom: "16px" }}>
        {isRHOrAdmin ? "Historique des Pointages de l'Entreprise" : "Mon Historique de Pointage"}
      </Title>
      
      <Table 
        columns={columns} 
        dataSource={data} 
        loading={loading} 
        rowKey="id" 
        pagination={{ pageSize: 10 }} 
        bordered 
        className="glass-card" 
        style={{ background: "transparent" }}
      />

      <Modal 
        title="Modifier le pointage manuel" 
        open={modalVisible} 
        onCancel={() => setModalVisible(false)} 
        footer={null} 
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} disabled /></Form.Item>
          <Form.Item name="heure_arrivee" label="Heure d'arrivée"><TimePicker style={{ width: "100%" }} format="HH:mm:ss" /></Form.Item>
          <Form.Item name="heure_depart" label="Heure de départ"><TimePicker style={{ width: "100%" }} format="HH:mm:ss" /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" block size="large">Mettre à jour le pointage</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
