import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../api";

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login/", {
        username: values.username,
        password: values.password,
      });

      // Save tokens and user info
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      message.success("Connexion réussie !");
      
      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Identifiants invalides.";
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex-center" 
      style={{ 
        minHeight: "100vh", 
        background: "var(--bg-gradient)",
        padding: "20px"
      }}
    >
      <Card 
        className="glass-card" 
        style={{ 
          width: "100%", 
          maxWidth: "420px", 
          background: "rgba(255, 255, 255, 0.06)",
          borderColor: "rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: "700" }}>
            BENIN-SERVICE SAS
          </Title>
          <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
            Système de Gestion des Ressources Humaines
          </Text>
        </div>

        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Veuillez entrer votre nom d'utilisateur !" }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: "rgba(255, 255, 255, 0.45)" }} />} 
              placeholder="Nom d'utilisateur" 
              style={{
                background: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#fff"
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Veuillez entrer votre mot de passe !" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "rgba(255, 255, 255, 0.45)" }} />}
              placeholder="Mot de passe"
              style={{
                background: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#fff"
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: "30px" }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              style={{
                fontWeight: "600",
                height: "45px"
              }}
            >
              Se connecter
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
