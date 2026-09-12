sed -i 's/const \[activeTab/const \[auditLogs, setAuditLogs\] = useState<any\[\]>([]);\n  const \[activeTab/' src/components/views/AdminView.tsx
sed -i 's/reloadInquiries();/reloadInquiries();\n    if (activeTab === "security") {\n      fetch("\/api\/admin\/audit")\n        .then(res => res.json())\n        .then(data => setAuditLogs(data || []));\n    }/' src/components/views/AdminView.tsx
