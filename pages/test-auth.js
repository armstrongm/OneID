// pages/test-auth.js - Simple test page
export default function TestAuth() {
  const testPingOneConfig = () => {
    const clientId = process.env.NEXT_PUBLIC_PINGONE_CLIENT_ID;
    const envId = process.env.NEXT_PUBLIC_PINGONE_ENVIRONMENT_ID;
    const redirectUri = 'http://localhost:3000/auth/callback';
    
    const authUrl = `https://auth.pingone.com/${envId}/as/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=openid profile email&` +
      `state=test123`;
    
    console.log('Auth URL:', authUrl);
    window.location.href = authUrl;
  };

  return (
    <div className="p-8">
      <h1>PingOne Test</h1>
      <button 
        onClick={testPingOneConfig}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test PingOne Auth (No PKCE)
      </button>
    </div>
  );
}