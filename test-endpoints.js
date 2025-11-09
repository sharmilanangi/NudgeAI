#!/usr/bin/env node

/**
 * Automated endpoint testing script
 * Tests all major endpoints of the Nudge AI local server
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('🏥 Testing Health Check...');
  try {
    const response = await makeRequest('GET', '/');
    console.log(`✅ Status: ${response.statusCode}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testGetCustomers() {
  console.log('\n👥 Testing Get Customers...');
  try {
    const response = await makeRequest('GET', '/customers');
    console.log(`✅ Status: ${response.statusCode}`);
    console.log(`Found ${response.body.customers?.length || 0} customers`);
    return response.statusCode === 200;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testCreateCustomer() {
  console.log('\n👤 Testing Create Customer...');
  try {
    const customerData = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1-555-0123'
    };
    
    const response = await makeRequest('POST', '/customers', customerData);
    console.log(`✅ Status: ${response.statusCode}`);
    console.log(`Created customer:`, response.body.customer?.customerId);
    return response.statusCode === 201;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testGetInvoices() {
  console.log('\n🧾 Testing Get Invoices...');
  try {
    const response = await makeRequest('GET', '/invoices');
    console.log(`✅ Status: ${response.statusCode}`);
    console.log(`Found ${response.body.invoices?.length || 0} invoices`);
    return response.statusCode === 200;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testSendCommunication() {
  console.log('\n📬 Testing Send Communication...');
  try {
    const commData = {
      customerId: 'CUST-001',
      channel: 'email',
      strategy: 'reminder',
      content: 'Test payment reminder'
    };
    
    const response = await makeRequest('POST', '/communications', commData);
    console.log(`✅ Status: ${response.statusCode}`);
    console.log(`Communication ID:`, response.body.communicationId);
    return response.statusCode === 202;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testAdminStatus() {
  console.log('\n⚙️ Testing Admin Status...');
  try {
    const response = await makeRequest('GET', '/admin');
    console.log(`✅ Status: ${response.statusCode}`);
    console.log(`Admin status:`, response.body.status);
    return response.statusCode === 200;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Nudge AI Endpoint Tests\n');
  console.log('Make sure the local server is running on http://localhost:3001\n');

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Get Customers', fn: testGetCustomers },
    { name: 'Create Customer', fn: testCreateCustomer },
    { name: 'Get Invoices', fn: testGetInvoices },
    { name: 'Send Communication', fn: testSendCommunication },
    { name: 'Admin Status', fn: testAdminStatus }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your Nudge AI server is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the server logs and try again.');
  }
}

// Check if server is running first
async function checkServer() {
  try {
    await makeRequest('GET', '/');
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Server is not running on http://localhost:3001');
    console.log('Please start the server first: node local-server.js');
    process.exit(1);
  }

  await runTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTests, makeRequest };