fetch("http://localhost:3000/api/admin/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin", password: "admin" })
}).then(r => r.json()).then(console.log).catch(console.error)
