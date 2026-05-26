import React from "react";
import { Card, Row, Col, Typography } from "antd";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

// Define modules for navigation
const modules = [
  { name: "Personnel", path: "/personnel", color: "#4F46E5" },
  { name: "Pointage", path: "/pointage", color: "#6366F1" },
  { name: "Congés", path: "/conges", color: "#818CF8" },
  { name: "Objectifs", path: "/objectifs", color: "#A5B4FC" },
  { name: "Notifications", path: "/notifications", color: "#E0E7FF" },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1 },
    }),
  };

  return (
    <div className="glass-card" style={{ padding: "24px" }}>
      <Title level={2} style={{ color: "#fff", textAlign: "center" }}>
        Tableau de bord SGRH
      </Title>
      <Row gutter={[24, 24]} justify="center">
        {modules.map((mod, idx) => (
          <Col key={mod.name} xs={24} sm={12} md={8} lg={6}>
            <motion.div
              custom={idx}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <Card
                hoverable
                className="glass-card"
                style={{
                  background: `rgba(255,255,255,0.08)`,
                  borderColor: mod.color,
                }}
                onClick={() => navigate(mod.path)}
              >
                <Title level={4} style={{ color: "#fff", margin: 0 }}>
                  {mod.name}
                </Title>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>
    </div>
  );
}
