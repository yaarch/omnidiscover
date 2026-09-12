export async function onRequestGet(context) {
  const { env } = context;
  
  // Middleware has already verified the session
  // In a real implementation, you'd fetch the email from the KV session
  return new Response(JSON.stringify({ authenticated: true, email: env.ADMIN_EMAIL || 'admin' }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
