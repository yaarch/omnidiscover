export async function onRequest(context) {
  const { request, env } = context;
  
  // Exclude login/logout from auth check
  const url = new URL(request.url);
  if (url.pathname.includes('/login') || url.pathname.includes('/logout')) {
    return context.next();
  }

  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader || !cookieHeader.includes('admin_session=')) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required.' }), { status: 401 });
  }

  // Validate session against KV or D1 here
  // const sessionStr = await env.SESSIONS_KV.get(sessionId);
  // if (!sessionStr) return 401...

  return context.next();
}
