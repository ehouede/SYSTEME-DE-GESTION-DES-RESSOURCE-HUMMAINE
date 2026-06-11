import React, { useState, useEffect } from "react";
import { Table, Typography, message, Modal, Form, Input, Select, DatePicker, Button, Popconfirm, Tag, Space, Alert, Statistic, Row, Col } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, SendOutlined } from "@ant-design/icons";
import api from "../api";
import moment from "moment";

const { Title } = Typography;

export default function Conges() {
  const [data, setData] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [soldes, setSoldes] = useState({});
  const [selectedType, setSelectedType] = useState(null);
  const [daysCount, setDaysCount] = useState(0);
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
      const res = await api.get("/conges/demandes/");
      setData(res.data);
    } catch (err) {
      console.error(err);
      message.error("Impossible de charger les congés");
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await api.get("/conges/types/");
      setLeaveTypes(res.data);
    } catch (err) {
      console.error(err);
      message.error("Impossible de charger les types de congés");
    }
  };

  const fetchSoldes = async () => {
    try {
      const res = await api.get("/conges/soldes/");
      const soldesMap = {};
      res.data.forEach(s => {
        soldesMap[s.type_conge] = s;
      });
      setSoldes(soldesMap);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTypes();
    fetchSoldes();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setSelectedType(null);
    setDaysCount(0);
    form.resetFields();
    setModalVisible(true);
  };

  const openEdit = record => {
    setEditing(record);
    form.setFieldsValue({
      type_conge: record.type_conge,
      date_debut: moment(record.date_debut),
      date_fin: moment(record.date_fin),
      motif: record.motif,
    });
    setModalVisible(true);
  };

  const handleDelete = async id => {
    try {
      await api.delete(`/conges/demandes/${id}/`);
      setData(prev => prev.filter(item => item.id !== id));
      message.success("Demande supprimée avec succès");
    } catch (err) {
      console.error(err);
      message.error("Erreur lors de la suppression");
    }
  };

  const handleTypeChange = (typeId) => {
    setSelectedType(typeId);
    calculateDays();
  };

  const calculateDays = () => {
    const dateDeb = form.getFieldValue("date_debut");
    const dateFin = form.getFieldValue("date_fin");
    if (dateDeb && dateFin && dateFin.isSameOrAfter(dateDeb)) {
      const jours = dateFin.diff(dateDeb, "days") + 1;
      setDaysCount(jours);
    } else {
      setDaysCount(0);
    }
  };

  const handleDatesChange = () => {
    calculateDays();
  };

  const handleSoumettre = async id => {
    try {
      const resp = await api.post(`/conges/demandes/${id}/soumettre/`);
      message.success(resp.data.detail || "Demande soumise avec succès !");
      fetchData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Erreur lors de la soumission.";
      message.error(errMsg);
    }
  };

  const handleValider = async id => {
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

  const handleRefuser = async id => {
    try {
      const resp = await api.post(`/conges/demandes/${id}/refuser/`);
      message.success(resp.data.detail || "Demande refusée.");
      fetchData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Erreur lors du traitement.";
      message.error(errMsg);
    }
  };

  const handleSubmit = async values => {
    const payload = {
      type_conge: values.type_conge,
      date_debut: values.date_debut.format("YYYY-MM-DD"),
      date_fin: values.date_fin.format("YYYY-MM-DD"),
      motif: values.motif,
    };

    if (editing) {
      try {
        const resp = await api.put(`/conges/demandes/${editing.id}/`, payload);
        setData(prev => prev.map(item => (item.id === editing.id ? resp.data : item)));
        message.success("Demande de congé mise à jour");
        setModalVisible(false);
      } catch (err) {
        console.error(err);
        message.error("Erreur lors de la mise à jour");
      }
    } else {
      try {
        const resp = await api.post("/conges/demandes/", payload);
        setData(prev => [resp.data, ...prev]);
        message.success("Demande créée en Brouillon. N'oubliez pas de la soumettre !");
        setModalVisible(false);
        form.resetFields();
      } catch (err) {
        console.error(err);
        const errMsg = err.response?.data ? JSON.stringify(err.response.data) : "Erreur lors de l’ajout.";
        message.error(errMsg);
      }
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { 
      title: "Employé", 
      key: "employee",
      render: (_, record) => {
        const u = record.employe_detail?.user;
        return u ? `${u.first_name} ${u.last_name}` : "Chargement...";
      }
    },
    { 
      title: "Type", 
      key: "type",
      render: (_, record) => record.type_conge_detail?.nom || "Non spécifié" 
    },
    { title: "Début", dataIndex: "date_debut", key: "date_debut" },
    { title: "Fin", dataIndex: "date_fin", key: "date_fin" },
    { title: "Jours", dataIndex: "duree_jours", key: "duree_jours", width: 80 },
    { 
      title: "Statut", 
      key: "status", 
      render: (_, record) => {
        const statusColors = {
          BROUILLON: "default",
          SOUMIS: "blue",
          VALIDE_N1: "cyan",
          VALIDE_RH: "success",
          REFUSE: "error"
        };
        return (
          <Tag color={statusColors[record.statut] || "default"}>
            {record.statut_display || record.statut}
          </Tag>
        );
      }
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const isOwner = currentUser && record.employe_detail?.user?.id === currentUser.id;
        const isRH = currentUser && (currentUser.role === "RH" || currentUser.role === "ADMIN");
        const isManager = currentUser && currentUser.role === "MANAGER";

        return (
          <Space size="small">
            {isOwner && record.statut === "BROUILLON" && (
              <>
                <Button 
                  icon={<SendOutlined />} 
                  size="small" 
                  type="primary" 
                  onClick={() => handleSoumettre(record.id)}
                  title="Soumettre pour validation"
                >
                  Soumettre
                </Button>
                <Button 
                  icon={<EditOutlined />} 
                  size="small" 
                  onClick={() => openEdit(record)} 
                />
                <Popconfirm 
                  title="Confirmer la suppression ?" 
                  onConfirm={() => handleDelete(record.id)} 
                  okText="Oui" 
                  cancelText="Non"
                >
                  <Button icon={<DeleteOutlined />} size="small" danger />
                </Popconfirm>
              </>
            )}

            {/* Validation Manager (N1) */}
            {isManager && record.statut === "SOUMIS" && !isOwner && (
              <>
                <Button 
                  icon={<CheckOutlined />} 
                  size="small" 
                  style={{ backgroundColor: "#2e7d32", color: "#fff", borderColor: "#2e7d32" }}
                  onClick={() => handleValider(record.id)}
                >
                  Valider N1
                </Button>
                <Button 
                  icon={<CloseOutlined />} 
                  size="small" 
                  danger
                  onClick={() => handleRefuser(record.id)}
                >
                  Refuser
                </Button>
              </>
            )}

            {/* Validation RH */}
            {isRH && (record.statut === "SOUMIS" || record.statut === "VALIDE_N1") && (
              <>
                <Button 
                  icon={<CheckOutlined />} 
                  size="small" 
                  type="primary"
                  style={{ backgroundColor: "#2e7d32", borderColor: "#2e7d32" }}
                  onClick={() => handleValider(record.id)}
                >
                  Valider RH
                </Button>
                <Button 
                  icon={<CloseOutlined />} 
                  size="small" 
                  danger
                  onClick={() => handleRefuser(record.id)}
                >
                  Refuser
                </Button>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="glass-card" style={{ padding: "24px" }}>
      <Title level={2} style={{ color: "#fff", textAlign: "center" }}>Gestion des Congés</Title>
      
      {/* Creation available to any employee */}
      <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        onClick={openAdd} 
        style={{ marginBottom: 16 }}
      >
        Faire une demande de congé
      </Button>

      <Table 
        columns={columns} 
        dataSource={data} 
        loading={loading} 
        rowKey="id" 
        pagination={{ pageSize: 8 }} 
        bordered 
        className="glass-card" 
        style={{ background: "transparent" }}
      />

      <Modal 
        title={editing ? "Modifier la demande" : "Nouvelle demande de congé"} 
        open={modalVisible} 
        onCancel={() => setModalVisible(false)} 
        footer={null} 
        destroyOnClose
        width={600}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleSubmit}
          requiredMark="optional"
        >
          <Form.Item 
            name="type_conge" 
            label="Type de congé *" 
            rules={[{ required: true, message: "Sélectionnez le type de congé!" }]}
          >
            <Select 
              placeholder="Choisir le motif de congé"
              onChange={handleTypeChange}
            >
              {leaveTypes.map(t => (
                <Select.Option key={t.id} value={t.id}>
                  {t.nom} ({t.code} - max {t.duree_standard}j)
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {selectedType && soldes[selectedType] && (
            <Alert
              message={`Solde disponible : ${soldes[selectedType].jours_restants} jours`}
              type={soldes[selectedType].jours_restants > 0 ? "success" : "error"}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item 
            name="date_debut" 
            label="Date de début *" 
            rules={[{ required: true, message: "La date de début est requise!" }]}
          >
            <DatePicker 
              style={{ width: "100%" }}
              onChange={handleDatesChange}
              disabledDate={(current) => current && current < moment().startOf('day')}
              format="DD/MM/YYYY"
              placeholder="Sélectionnez une date"
            />
          </Form.Item>

          <Form.Item 
            name="date_fin" 
            label="Date de fin *" 
            rules={[
              { required: true, message: "La date de fin est requise!" },
              {
                validator: (_, value) => {
                  const dateDeb = form.getFieldValue("date_debut");
                  if (dateDeb && value && value.isBefore(dateDeb)) {
                    return Promise.reject(new Error("La date de fin doit être >= à la date de début"));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <DatePicker 
              style={{ width: "100%" }}
              onChange={handleDatesChange}
              disabledDate={(current) => current && current < moment().startOf('day')}
              format="DD/MM/YYYY"
              placeholder="Sélectionnez une date"
            />
          </Form.Item>

          {daysCount > 0 && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Statistic 
                  title="Jours demandés" 
                  value={daysCount}
                  prefix="📅"
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Solde restant" 
                  value={selectedType && soldes[selectedType] ? Math.max(0, soldes[selectedType].jours_restants - daysCount) : "-"}
                  valueStyle={{ 
                    color: selectedType && soldes[selectedType] && (soldes[selectedType].jours_restants - daysCount) < 0 ? '#ff4d4f' : '#52c41a'
                  }}
                />
              </Col>
            </Row>
          )}

          <Form.Item name="motif" label="Motif / Commentaire">
            <Input.TextArea 
              rows={3} 
              placeholder="Justifiez votre demande... (optionnel)" 
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              style={{
                backgroundColor: "#1890ff",
                borderColor: "#1890ff",
                color: "#fff",
                fontSize: "16px",
                fontWeight: "600",
                height: "45px"
              }}
            >
              {editing ? "✓ Mettre à jour" : "✓ Créer le brouillon"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
