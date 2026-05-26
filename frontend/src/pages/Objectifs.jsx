import React, { useState, useEffect } from "react";
import { Table, Typography, Button, Modal, Form, Input, Select, DatePicker, Slider, InputNumber, message, Space, Tag, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from "@ant-design/icons";
import api from "../api";
import moment from "moment";

const { Title, Text } = Typography;

export default function Objectifs() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();
  const [progressForm] = Form.useForm();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/objectifs/");
      setData(res.data);
    } catch (err) {
      console.error(err);
      message.error("Impossible de charger les objectifs");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (["RH", "ADMIN", "MANAGER"].includes(user.role)) {
        try {
          const res = await api.get("/personnel/employes/");
          setEmployees(res.data);
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEdit = record => {
    setEditing(record);
    form.setFieldsValue({
      employe: record.employe,
      titre: record.titre,
      description: record.description,
      date_limite: record.date_limite ? moment(record.date_limite) : null,
      progression: record.progression,
      statut: record.statut,
    });
    setModalVisible(true);
  };

  const openProgressModal = record => {
    setEditing(record);
    progressForm.setFieldsValue({
      progression: record.progression,
    });
    setProgressModalVisible(true);
  };

  const handleDelete = async id => {
    try {
      await api.delete(`/objectifs/${id}/`);
      setData(prev => prev.filter(item => item.id !== id));
      message.success("Objectif supprimé avec succès");
    } catch (err) {
      console.error(err);
      message.error("Erreur lors de la suppression");
    }
  };

  const handleSubmit = async values => {
    const payload = {
      employe: values.employe,
      titre: values.titre,
      description: values.description,
      date_limite: values.date_limite.format("YYYY-MM-DD"),
      progression: values.progression || 0,
      statut: values.statut,
    };

    if (editing) {
      try {
        const resp = await api.put(`/objectifs/${editing.id}/`, payload);
        setData(prev => prev.map(item => (item.id === editing.id ? resp.data : item)));
        message.success("Objectif mis à jour");
        setModalVisible(false);
      } catch (err) {
        console.error(err);
        message.error("Erreur lors de la mise à jour");
      }
    } else {
      try {
        const resp = await api.post("/objectifs/", payload);
        setData(prev => [resp.data, ...prev]);
        message.success("Objectif créé avec succès");
        setModalVisible(false);
        form.resetFields();
      } catch (err) {
        console.error(err);
        message.error("Erreur lors de la création");
      }
    }
  };

  const handleUpdateProgress = async values => {
    try {
      const resp = await api.put(`/objectifs/${editing.id}/`, {
        progression: values.progression,
      });
      setData(prev => prev.map(item => (item.id === editing.id ? resp.data : item)));
      message.success("Progression mise à jour !");
      setProgressModalVisible(false);
    } catch (err) {
      console.error(err);
      message.error("Erreur lors de la mise à jour de la progression");
    }
  };

  const isStaff = currentUser && ["RH", "ADMIN", "MANAGER"].includes(currentUser.role);

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "Titre", dataIndex: "titre", key: "titre" },
    { title: "Description", dataIndex: "description", key: "description" },
    { 
      title: "Assigné à", 
      key: "employee", 
      render: (_, record) => record.employe_name || "Chargement..."
    },
    { 
      title: "Date Limite", 
      dataIndex: "date_limite", 
      key: "date_limite",
      render: (d) => d ? moment(d).format("DD/MM/YYYY") : "--"
    },
    { 
      title: "Progression", 
      dataIndex: "progression", 
      key: "progression",
      render: (p) => <Slider value={p} disabled tooltip={{ formatter: val => `${val}%` }} />
    },
    { 
      title: "Statut", 
      dataIndex: "statut", 
      key: "statut",
      render: (s, record) => {
        const colors = { NON_COMMENCE: "default", EN_COURS: "blue", TERMINE: "success", ANNULE: "error" };
        return <Tag color={colors[s] || "default"}>{record.statut_display || s}</Tag>;
      }
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const isOwner = currentUser && record.employe_name?.includes(currentUser.last_name);
        return (
          <Space size="small">
            {isStaff ? (
              <>
                <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
                <Popconfirm title="Confirmer la suppression ?" onConfirm={() => handleDelete(record.id)} okText="Oui" cancelText="Non">
                  <Button icon={<DeleteOutlined />} size="small" danger />
                </Popconfirm>
              </>
            ) : (
              // Simple employee can only update progress
              <Button 
                icon={<CheckOutlined />} 
                size="small" 
                type="primary"
                onClick={() => openProgressModal(record)}
              >
                Mettre à jour la progression
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="glass-card" style={{ padding: "24px" }}>
      <Title level={2} style={{ color: "#fff", textAlign: "center" }}>Gestion des Objectifs</Title>
      
      {isStaff && (
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={openAdd} 
          style={{ marginBottom: 16 }}
        >
          Assigner un objectif
        </Button>
      )}

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

      {/* Main Creation/Edition Modal for managers/RH */}
      <Modal 
        title={editing ? "Modifier l'objectif" : "Nouvel Objectif"} 
        open={modalVisible} 
        onCancel={() => setModalVisible(false)} 
        footer={null} 
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="employe" label="Employé concerné" rules={[{ required: true, message: "Sélectionnez l'employé !" }]}>
            <Select placeholder="Choisir l'employé">
              {employees.map(e => (
                <Select.Option key={e.id} value={e.id}>
                  {e.user?.first_name} {e.user?.last_name} ({e.matricule})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="titre" label="Titre de l'objectif" rules={[{ required: true, message: "Titre requis !" }]}>
            <Input placeholder="Titre de l'objectif" />
          </Form.Item>
          <Form.Item name="description" label="Description / Critères de réussite" rules={[{ required: true, message: "Description requise !" }]}>
            <Input.TextArea rows={3} placeholder="Détaillez les tâches et attentes..." />
          </Form.Item>
          <Form.Item name="date_limite" label="Date limite" rules={[{ required: true, message: "Date limite requise !" }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="progression" label="Progression initiale (%)" initialValue={0}>
            <Slider min={0} max={100} />
          </Form.Item>
          <Form.Item name="statut" label="Statut de l'objectif" rules={[{ required: true }]} initialValue="NON_COMMENCE">
            <Select>
              <Select.Option value="NON_COMMENCE">Non commencé</Select.Option>
              <Select.Option value="EN_COURS">En cours</Select.Option>
              <Select.Option value="TERMINE">Terminé</Select.Option>
              <Select.Option value="ANNULE">Annulé</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              {editing ? "Sauvegarder" : "Créer et assigner"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Progress Only Modal for simple employees */}
      <Modal 
        title="Mettre à jour la progression" 
        open={progressModalVisible} 
        onCancel={() => setProgressModalVisible(false)} 
        footer={null} 
        destroyOnClose
      >
        <Form form={progressForm} layout="vertical" onFinish={handleUpdateProgress}>
          <Form.Item name="progression" label="Progression actuelle (%)" rules={[{ required: true }]}>
            <Slider min={0} max={100} tooltip={{ open: true }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Enregistrer la progression
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
