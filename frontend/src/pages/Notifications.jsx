import React, { useEffect, useState } from "react";
import { List, Spin, Alert, Card, Button, Badge, Space, message, Empty } from "antd";
import { BellOutlined, CheckOutlined, CheckSquareOutlined } from "@ant-design/icons";
import api from "../api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response = await api.get("/notifications/");
      setNotifications(response.data);
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/lire/`);
      message.success("Notification marquée comme lue");
      fetchData(); // Reload list
    } catch (err) {
      console.error(err);
      message.error("Impossible de modifier la notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const resp = await api.post("/notifications/lire-tout/");
      message.success(resp.data.detail || "Toutes les notifications ont été lues.");
      fetchData();
    } catch (err) {
      console.error(err);
      message.error("Impossible de marquer les notifications comme lues");
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "60vh" }}>
        <Spin tip="Chargement des notifications..." size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message="Erreur"
          description="Impossible de charger les notifications de l'utilisateur."
          type="error"
          showIcon
        />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.lue).length;

  return (
    <div className="flex-center" style={{ padding: "24px", minHeight: "80vh" }}>
      <Card 
        className="glass-card" 
        style={{ width: "100%", maxWidth: "800px" }} 
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span style={{ color: "#fff" }}>
              <BellOutlined style={{ marginRight: 8 }} />
              Notifications
              {unreadCount > 0 && (
                <Badge count={unreadCount} style={{ backgroundColor: "var(--primary-color)", marginLeft: 8 }} />
              )}
            </span>
            {unreadCount > 0 && (
              <Button 
                type="link" 
                icon={<CheckSquareOutlined />} 
                onClick={handleMarkAllAsRead}
                style={{ color: "var(--primary-color)", padding: 0 }}
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>
        }
      >
        {notifications.length === 0 ? (
          <Empty description="Aucune notification pour le moment." style={{ padding: "40px 0" }} />
        ) : (
          <List
            dataSource={notifications}
            itemLayout="horizontal"
            renderItem={item => (
              <List.Item
                style={{
                  background: item.lue ? "rgba(255, 255, 255, 0.01)" : "rgba(90, 103, 216, 0.08)",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  padding: "16px 24px",
                  border: item.lue ? "1px solid rgba(255, 255, 255, 0.03)" : "1px solid rgba(90, 103, 216, 0.3)",
                  transition: "all 0.3s ease"
                }}
                actions={[
                  !item.lue && (
                    <Button
                      key="read"
                      icon={<CheckOutlined />}
                      size="small"
                      onClick={() => handleMarkAsRead(item.id)}
                      title="Marquer comme lue"
                    />
                  )
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  title={
                    <span style={{ color: item.lue ? "rgba(255, 255, 255, 0.65)" : "#fff", fontWeight: item.lue ? "normal" : "600" }}>
                      {!item.lue && <Badge status="processing" style={{ marginRight: 8 }} />}
                      Message système
                    </span>
                  }
                  description={
                    <div style={{ color: item.lue ? "rgba(255, 255, 255, 0.45)" : "rgba(255, 255, 255, 0.8)" }}>
                      {item.message}
                    </div>
                  }
                />
                <div style={{ color: "rgba(255, 255, 255, 0.35)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                  {new Date(item.date_envoi).toLocaleString()}
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
