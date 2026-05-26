import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, Select, Typography, message, Alert } from "antd";
import { UserOutlined, MailOutlined, LockOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../api";

const { Title, Text } = Typography;

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        JSON.parse(userStr);
        setIsAuthorized(true);
      } catch (e) {
        console.error(e);
      }
    }
    setCheckingAuth(false);
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await api.post("/auth/register/", {
        username: values.username,
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        role: values.role,
        password: values.password,
      });

      message.success("Compte utilisateur créé avec succès !");
      navigate("/personnel");
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data ? JSON.stringify(err.response.data) : "Erreur lors de la création du compte.";
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return null;
  }

  if (!isAuthorized) {
    return (
      <div className="flex-center" style={{ minHeight: "80vh", padding: "20px" }}>
        <Card className="glass-card" style={{ maxWidth: "500px", textAlign: "center" }}>
          <Alert
            message="Accès Refusé"
            description="Vous devez être connecté pour créer un nouveau compte utilisateur."
            type="error"
            showIcon
            icon={<InfoCircleOutlined />}
          />
          <Button type="primary" onClick={() => navigate("/login")} style={{ marginTop: "20px" }}>
            Se connecter
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-center" style={{ minHeight: "80vh", padding: "20px" }}>
      <Card 
        className="glass-card" 
        style={{ 
          width: "100%", 
          maxWidth: "500px", 
          background: "rgba(255, 255, 255, 0.06)",
          borderColor: "rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: "700" }}>
            Nouveau Compte Utilisateur
          </Title>
          <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
            Enregistrer un accès système pour un employé
          </Text>
        </div>

        <Form
          name="register_form"
          onFinish={onFinish}
          layout="vertical"
          size="middle"
        >
          <Form.Item
            name="username"
            label={<span style={{ color: "#fff" }}>Nom d'utilisateur</span>}
            rules={[{ required: true, message: "Nom d'utilisateur obligatoire !" }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: "rgba(255, 255, 255, 0.45)" }} />} 
              placeholder="Ex: jean.dupont" 
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span style={{ color: "#fff" }}>E-mail</span>}
            rules={[
              { required: true, message: "E-mail obligatoire !" },
              { type: "email", message: "Format e-mail invalide !" }
            ]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: "rgba(255, 255, 255, 0.45)" }} />} 
              placeholder="Ex: jean.dupont@entreprise.bj" 
            />
          </Form.Item>

          <Form.Item
            name="first_name"
            label={<span style={{ color: "#fff" }}>Prénom</span>}
            rules={[{ required: true, message: "Prénom obligatoire !" }]}
          >
            <Input placeholder="Prénom" />
          </Form.Item>

          <Form.Item
            name="last_name"
            label={<span style={{ color: "#fff" }}>Nom</span>}
            rules={[{ required: true, message: "Nom de famille obligatoire !" }]}
          >
            <Input placeholder="Nom" />
          </Form.Item>

          <Form.Item
            name="role"
            label={<span style={{ color: "#fff" }}>Rôle système</span>}
            rules={[{ required: true, message: "Veuillez choisir un rôle !" }]}
            initialValue="EMPLOYE"
          >
            <Select>
              <Select.Option value="EMPLOYE">Employé</Select.Option>
              <Select.Option value="MANAGER">Manager</Select.Option>
              <Select.Option value="RH">Ressources Humaines</Select.Option>
              <Select.Option value="ADMIN">Administrateur</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: "#fff" }}>Mot de passe</span>}
            rules={[
              { required: true, message: "Mot de passe obligatoire !" },
              { min: 6, message: "Le mot de passe doit comporter au moins 6 caractères !" }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "rgba(255, 255, 255, 0.45)" }} />}
              placeholder="Mot de passe temporaire"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: "25px" }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              style={{
                fontWeight: "600",
                height: "40px"
              }}
            >
              Créer l'utilisateur
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
