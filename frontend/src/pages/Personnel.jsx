import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, message, Typography, Popconfirm, Row, Col } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import api from "../api";
import moment from "moment";

const { Title } = Typography;

export default function Personnel() {
  const [data, setData] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null); // null for add, otherwise record
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();

  // Fetch personnel list
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/personnel/employes/");
      setData(response.data);
    } catch (err) {
      console.error(err);
      message.error("Impossible de charger les données du personnel");
    } finally {
      setLoading(false);
    }
  };

  // Fetch services list
  const fetchServices = async () => {
    try {
      const response = await api.get("/personnel/services/");
      setServices(response.data);
    } catch (err) {
      console.error(err);
      message.error("Impossible de charger les services");
    }
  };

  useEffect(() => {
    fetchData();
    fetchServices();

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const openAddModal = () => {
    setEditing(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = record => {
    setEditing(record);
    form.setFieldsValue({
      first_name: record.user?.first_name,
      last_name: record.user?.last_name,
      email: record.user?.email,
      matricule: record.matricule,
      date_naissance: record.date_naissance ? moment(record.date_naissance) : null,
      telephone: record.telephone,
      adresse: record.adresse,
      ifu: record.ifu,
      service: record.service,
      poste: record.poste,
      date_embauche: record.date_embauche ? moment(record.date_embauche) : null,
      salaire_base_saisi: record.salaire_base_saisi,
    });
    setModalVisible(true);
  };

  const handleDelete = async id => {
    try {
      await api.delete(`/personnel/employes/${id}/`);
      setData(prev => prev.filter(item => item.id !== id));
      message.success("Employé supprimé avec succès");
    } catch (err) {
      console.error(err);
      message.error("Erreur lors de la suppression");
    }
  };

  const downloadContract = async record => {
    try {
      message.loading({ content: "Génération du contrat en cours...", key: "dl_contrat" });
      const response = await api.get(`/personnel/employes/${record.id}/contrat_pdf/`, {
        responseType: "blob",
      });
      const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
      const fileLink = document.createElement("a");
      fileLink.href = fileUrl;
      
      // Determine if fallback HTML or PDF
      const disposition = response.headers["content-disposition"];
      const isHtml = response.data.type === "text/html";
      const ext = isHtml ? ".html" : ".pdf";
      
      fileLink.setAttribute("download", `contrat_${record.matricule}${ext}`);
      document.body.appendChild(fileLink);
      fileLink.click();
      document.body.removeChild(fileLink);
      message.success({ content: "Contrat téléchargé !", key: "dl_contrat", duration: 2 });
    } catch (err) {
      console.error(err);
      message.error({ content: "Impossible de télécharger le contrat", key: "dl_contrat", duration: 2 });
    }
  };

  const handleSubmit = async values => {
    if (editing) {
      // Update existing employee
      const payload = {
        user: {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          telephone: values.telephone,
        },
        matricule: values.matricule,
        date_naissance: values.date_naissance ? values.date_naissance.format("YYYY-MM-DD") : null,
        telephone: values.telephone,
        adresse: values.adresse,
        ifu: values.ifu,
        service: values.service,
        poste: values.poste,
        date_embauche: values.date_embauche ? values.date_embauche.format("YYYY-MM-DD") : null,
        salaire_base_saisi: values.salaire_base_saisi,
      };

      try {
        const resp = await api.put(`/personnel/employes/${editing.id}/`, payload);
        setData(prev => prev.map(item => (item.id === editing.id ? resp.data : item)));
        message.success("Employé mis à jour");
        setModalVisible(false);
      } catch (err) {
        console.error(err);
        message.error("Erreur lors de la mise à jour");
      }
    } else {
      // Create new employee & active contract
      const payload = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        username: values.username,
        password: values.password,
        matricule: values.matricule,
        date_naissance: values.date_naissance ? values.date_naissance.format("YYYY-MM-DD") : null,
        telephone: values.telephone,
        adresse: values.adresse,
        ifu: values.ifu,
        service: values.service,
        poste: values.poste,
        date_embauche: values.date_embauche ? values.date_embauche.format("YYYY-MM-DD") : null,
        salaire_base_saisi: values.salaire_base_saisi,
        type_contrat: values.type_contrat,
        date_debut: values.date_debut ? values.date_debut.format("YYYY-MM-DD") : null,
        date_fin: values.date_fin ? values.date_fin.format("YYYY-MM-DD") : null,
      };

      try {
        const resp = await api.post("/personnel/employes/", payload);
        setData(prev => [...prev, resp.data]);
        const successMsg = resp.data.temp_password
          ? `Employé créé. Identifiant: ${resp.data.user?.username}, mot de passe: ${resp.data.temp_password}`
          : "Employé et contrat créés avec succès";
        message.success(successMsg);
        setModalVisible(false);
        form.resetFields();
      } catch (err) {
        console.error(err);
        message.error("Erreur lors de l’ajout");
      }
    }
  };

  const columns = [
    { title: "Matricule", dataIndex: "matricule", key: "matricule" },
    { 
      title: "Nom complet", 
      key: "name", 
      render: (_, record) => `${record.user?.first_name || ""} ${record.user?.last_name || ""}` 
    },
    { 
      title: "Rôle", 
      key: "role", 
      render: (_, record) => {
        const roles = { EMPLOYE: "Employé", MANAGER: "Manager", RH: "RH", ADMIN: "Admin" };
        return roles[record.user?.role] || record.user?.role || "Employé";
      }
    },
    { title: "Poste", dataIndex: "poste", key: "poste" },
    { 
      title: "Service", 
      key: "service", 
      render: (_, record) => record.service_detail?.nom || "Aucun"
    },
    { title: "Téléphone", dataIndex: "telephone", key: "telephone" },
    { 
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(record)}
          />
          <Button
            icon={<DownloadOutlined />}
            size="small"
            onClick={() => downloadContract(record)}
            title="Télécharger le contrat"
          />
          <Popconfirm
            title="Confirmer la suppression ?"
            onConfirm={() => handleDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="glass-card" style={{ padding: "24px" }}>
      <Title level={2} style={{ color: "#fff", textAlign: "center" }}>
        Gestion du Personnel
      </Title>
      {currentUser && ["RH", "ADMIN"].includes(currentUser.role) && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAddModal}
          style={{ marginBottom: 16 }}
        >
          Ajouter un employé
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

      <Modal
        title={editing ? "Modifier l'employé" : "Nouvel employé"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Title level={5} style={{ color: "var(--primary-color)", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 8, marginBottom: 16 }}>
            Informations Personnelles
          </Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="first_name" label="Prénom" rules={[{ required: true }]}>
                <Input placeholder="Prénom de l'employé" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="last_name" label="Nom" rules={[{ required: true }]}>
                <Input placeholder="Nom de famille" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="E-mail" rules={[{ required: true, type: "email" }]}>
                <Input placeholder="Ex: email@entreprise.bj" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="telephone" label="Téléphone" rules={[{ required: true }]}>
                <Input placeholder="Numéro de téléphone" />
              </Form.Item>
            </Col>
          </Row>
          {!editing && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="username" label="Nom d'utilisateur" rules={[{ required: true }]}> 
                  <Input placeholder="Identifiant de connexion" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="password" label="Mot de passe" rules={[{ required: true, min: 6 }]}> 
                  <Input.Password placeholder="Mot de passe temporaire" />
                </Form.Item>
              </Col>
            </Row>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date_naissance" label="Date de naissance" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} placeholder="Choisir la date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ifu" label="Numéro IFU">
                <Input placeholder="IFU (optionnel)" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="adresse" label="Adresse physique" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="Adresse complète" />
          </Form.Item>

          <Title level={5} style={{ color: "var(--primary-color)", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 8, marginBottom: 16, marginTop: 24 }}>
            Informations Professionnelles
          </Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="matricule" label="Matricule" rules={[{ required: true }]}>
                <Input placeholder="Matricule unique" disabled={!!editing} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="service" label="Service" rules={[{ required: true }]}>
                <Select placeholder="Sélectionner le service">
                  {services.map(s => (
                    <Select.Option key={s.id} value={s.id}>{s.nom}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="poste" label="Poste occupé" rules={[{ required: true }]}>
                <Input placeholder="Nom du poste" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date_embauche" label="Date d'embauche" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} placeholder="Date de recrutement" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="salaire_base_saisi" label="Salaire de base (FCFA)" rules={[{ required: true }]}>
                <InputNumber style={{ width: "100%" }} min={0} placeholder="Salaire brut négocié" />
              </Form.Item>
            </Col>
          </Row>

          {!editing && (
            <>
              <Title level={5} style={{ color: "var(--primary-color)", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 8, marginBottom: 16, marginTop: 24 }}>
                Détails du Contrat Initial
              </Title>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="type_contrat" label="Type de contrat" rules={[{ required: true }]}>
                    <Select placeholder="Type">
                      <Select.Option value="CDI">CDI</Select.Option>
                      <Select.Option value="CDD">CDD</Select.Option>
                      <Select.Option value="STAGE">Stage</Select.Option>
                      <Select.Option value="PESS">Prestation</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="date_debut" label="Date de début" rules={[{ required: true }]}>
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="date_fin" label="Date de fin (optionnel)">
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Form.Item style={{ marginTop: 32 }}>
            <Button type="primary" htmlType="submit" block size="large">
              {editing ? "Enregistrer les modifications" : "Créer le profil et générer le contrat"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
