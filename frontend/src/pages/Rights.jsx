import React from "react";
import { Card, Row, Col, Typography } from "antd";

const { Title, Paragraph } = Typography;

const profiles = [
  { profile: "Cadre", conge_annuel: "25j", maladie: "Illimité", RTT: "12j", exceptionnel: "5j" },
  { profile: "Agent", conge_annuel: "21j", maladie: "Illimité", RTT: "6j", exceptionnel: "3j" },
  { profile: "Stagiaire", conge_annuel: "18j", maladie: "5j", RTT: "0j", exceptionnel: "2j" },
  { profile: "Dirigeant", conge_annuel: "30j", maladie: "Illimité", RTT: "15j", exceptionnel: "10j" },
];

const roles = [
  { title: "Responsable RH", description: "Accès total – validation, configuration, rapports" },
  { title: "Manager", description: "Validation N+1 – consulter l'équipe" },
  { title: "DRH", description: "Validation finale, statistiques globales" },
  { title: "Employé", description: "Soumettre des demandes, consulter son historique" },
];

const rules = [
  { title: "Délai de carence", description: "48h minimum avant la date de départ" },
  { title: "Chevauchement", description: "Maximum 2 employés par département absents simultanément" },
  { title: "Fractionnement", description: "Solde peut être utilisé en demi-journées" },
  { title: "Report", description: "Maximum 10 jours reportables à N+1" },
  { title: "Alerte solde", description: "Notification si < 5 jours restants" },
  { title: "Pièces justificatives", description: "Obligatoire pour absence maladie > 2 jours" },
];

export default function RightsPage() {
  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <Title level={2} style={{ color: "#fff", textAlign: "center", marginBottom: 24 }}>
        Droits & Quotas
      </Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card className="glass-card" title="Quotas par profil" headStyle={{ color: "#fff" }} bodyStyle={{ padding: 16 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 12, color: "var(--color-text-secondary)", fontSize: 12 }}>Profil</th>
                    <th style={{ textAlign: "left", padding: 12, color: "var(--color-text-secondary)", fontSize: 12 }}>Congé annuel</th>
                    <th style={{ textAlign: "left", padding: 12, color: "var(--color-text-secondary)", fontSize: 12 }}>Maladie</th>
                    <th style={{ textAlign: "left", padding: 12, color: "var(--color-text-secondary)", fontSize: 12 }}>RTT</th>
                    <th style={{ textAlign: "left", padding: 12, color: "var(--color-text-secondary)", fontSize: 12 }}>Exceptionnel</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((item) => (
                    <tr key={item.profile}>
                      <td style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>{item.profile}</td>
                      <td style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>{item.conge_annuel}</td>
                      <td style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>{item.maladie}</td>
                      <td style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>{item.RTT}</td>
                      <td style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>{item.exceptionnel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="glass-card" title="Rôles et permissions" headStyle={{ color: "#fff" }} bodyStyle={{ padding: 16 }} style={{ marginTop: 24 }}>
            {roles.map((item) => (
              <div key={item.title} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{item.title}</div>
                <Paragraph style={{ margin: 4, color: "var(--color-text-secondary)", fontSize: 13 }}>
                  {item.description}
                </Paragraph>
              </div>
            ))}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card className="glass-card" title="Règles de gestion des congés" headStyle={{ color: "#fff" }} bodyStyle={{ padding: 16 }}>
            <div style={{ display: "grid", gap: 12 }}>
              {rules.map((rule) => (
                <div key={rule.title} className="alert alert-info" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>{rule.title}</div>
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{rule.description}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
