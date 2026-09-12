export async function onRequestPost(context) {
  // Clear cookie and remove from KV
  const cookie = `admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie
    }
  });
}
