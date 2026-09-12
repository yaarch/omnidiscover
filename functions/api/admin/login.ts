export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  
  try {
    const body = await request.json();
    const { email, password, remember } = body;
    
    // Cloudflare Pages Environment Variables
    const ADMIN_EMAIL = env.ADMIN_EMAIL || 'admin';
    const ADMIN_PASSWORD_HASH = env.ADMIN_PASSWORD_HASH || '5c761838e42b5cfcf9028249cef7fb45:aaaa243699370f203b8a601ac1f8b4580eb4e247859a412bb9fe337084de7e35af673357958d9849d8a2d45315daddfe76c76726d7204ca8fc7564e5b3e9bc69';
    
    // In Cloudflare Workers, you'd use the Web Crypto API for password hashing verification instead of Node's crypto
    // For Argon2/PBKDF2/scrypt, you'd typically need a WASM module or use subtle crypto PBKDF2.
    // For this demonstration, we are providing the architecture and assuming the hash check passes
    // if it matches a pre-computed string or using Web Crypto PBKDF2 in a full implementation.
    
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Invalid administrator credentials.' }), { status: 401 });
    }
    
    // Simulate valid password verification for Cloudflare Functions implementation snippet
    const isValid = true; // Replace with actual Web Crypto API validation
    
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid administrator credentials.' }), { status: 401 });
    }
    
    const sessionId = crypto.randomUUID();
    const expiresInMs = remember ? 7 * 24 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000;
    
    // Here you would store the session in Cloudflare KV or D1
    // e.g., await env.SESSIONS_KV.put(sessionId, email, { expirationTtl: expiresInMs / 1000 });
    
    const cookie = `admin_session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${expiresInMs / 1000}`;
    
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 });
  }
}
