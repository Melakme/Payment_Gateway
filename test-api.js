import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testEndpoints() {
  console.log('🧪 Testing Payment Gateway API Endpoints...\n');

  // Test health endpoint
  try {
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
  }

  // Test metrics endpoint (should require auth)
  try {
    const metricsResponse = await fetch(`${BASE_URL}/api/metrics`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('📊 Metrics Endpoint Status:', metricsResponse.status, metricsResponse.statusText);
  } catch (error) {
    console.log('❌ Metrics Endpoint Failed:', error.message);
  }

  // Test users endpoint (should require auth)
  try {
    const usersResponse = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('👥 Users Endpoint Status:', usersResponse.status, usersResponse.statusText);
  } catch (error) {
    console.log('❌ Users Endpoint Failed:', error.message);
  }

  console.log('\n🎯 Expected Results:');
  console.log('- Health: 200 OK');
  console.log('- Metrics: 401 Unauthorized (requires valid token)');
  console.log('- Users: 401 Unauthorized (requires valid token)');
  console.log('\n✅ If you see 401 errors for metrics and users, the endpoints are working correctly!');
}

testEndpoints(); 