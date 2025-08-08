// Test script to validate frontend-backend API flow
const https = require('https');

// Disable SSL verification for localhost
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const API_BASE_URL = 'https://localhost:3000';

// Test the basic health endpoint
async function testHealthEndpoint() {
  console.log('Testing health endpoint...');
  
  return new Promise((resolve, reject) => {
    const req = https.get(`${API_BASE_URL}/test-db`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Health endpoint status: ${res.statusCode}`);
        console.log(`Health endpoint response:`, data);
        resolve({ status: res.statusCode, data });
      });
    });
    
    req.on('error', (error) => {
      console.error('Health endpoint error:', error);
      reject(error);
    });
  });
}

// Test API endpoints without auth
async function testUnauthenticatedAPI() {
  console.log('\nTesting API endpoint without authentication...');
  
  return new Promise((resolve, reject) => {
    const req = https.get(`${API_BASE_URL}/api/v1/accounts`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`API endpoint status: ${res.statusCode}`);
        console.log(`API endpoint response:`, data);
        resolve({ status: res.statusCode, data });
      });
    });
    
    req.on('error', (error) => {
      console.error('API endpoint error:', error);
      reject(error);
    });
  });
}

// Run tests
async function runTests() {
  try {
    await testHealthEndpoint();
    await testUnauthenticatedAPI();
    console.log('\n✅ Basic connectivity tests completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTests();
