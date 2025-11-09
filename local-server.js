#!/usr/bin/env node

/**
 * Simple Local Development Server
 * This script sets up a minimal local server for testing the Nudge AI services
 */

import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Mock environment for local development
const mockEnv = {
  logger: {
    error: (...args) => console.error('[ERROR]', ...args),
    info: (...args) => console.log('[INFO]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    debug: (...args) => console.log('[DEBUG]', ...args),
  },
  CUSTOMERS_DB: {
    prepare: async () => ({
      execute: async () => ({ results: [] }),
      first: async () => null,
    }),
  },
  INVOICES_DB: {
    prepare: async () => ({
      execute: async () => ({ results: [] }),
      first: async () => null,
    }),
  },
};

// Read the HTML file once at startup
let demoHTML = '';
try {
  demoHTML = readFileSync(resolve('./demo.html'), 'utf8');
  console.log('✅ Loaded demo.html frontend');
} catch (error) {
  console.error('❌ Could not load demo.html:', error.message);
}

// Message storage for tracking status
const messageHistory = [];

// AI Agent for message customization
const aiAgent = {
  // Analyze communication history to personalize messages
  analyzeCommunicationHistory: (customerId, strategy) => {
    const customerMessages = messageHistory.filter(m => m.customerId === customerId);
    
    const analysis = {
      previousCommunications: customerMessages,
      messageCount: customerMessages.length,
      lastCommunication: customerMessages.length > 0 ? customerMessages[customerMessages.length - 1] : null,
      communicationPattern: [],
      escalationLevel: 0,
      customerTone: 'professional',
      preferredChannel: 'email'
    };
    
    // Analyze communication patterns
    if (customerMessages.length > 0) {
      analysis.communicationPattern = customerMessages.map(m => ({
        strategy: m.strategy,
        channel: m.channel,
        daysAgo: Math.floor((new Date() - new Date(m.timestamp)) / (1000 * 60 * 60 * 24)),
        status: m.status
      }));
      
      // Determine escalation level based on previous strategies
      const strategyOrder = ['reminder', 'negotiation', 'final_notice'];
      const maxStrategyIndex = Math.max(...customerMessages.map(m => 
        strategyOrder.indexOf(m.strategy)
      ));
      analysis.escalationLevel = maxStrategyIndex;
      
      // Determine preferred channel
      const channelCounts = {};
      customerMessages.forEach(m => {
        channelCounts[m.channel] = (channelCounts[m.channel] || 0) + 1;
      });
      analysis.preferredChannel = Object.keys(channelCounts).reduce((a, b) => 
        channelCounts[a] > channelCounts[b] ? a : b
      );
    }
    
    return analysis;
  },
  
  // Generate personalized AI message
  generatePersonalizedMessage: (customer, invoices, analysis, strategy, channel) => {
    const overdueInvoices = invoices.filter(inv => inv.daysPastDue > 0);
    const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const daysSinceLastContact = analysis.lastCommunication ? 
      Math.floor((new Date() - new Date(analysis.lastCommunication.timestamp)) / (1000 * 60 * 60 * 24)) : null;
    
    // AI-powered message customization based on context
    let message = '';
    let personalization = '';
    
    // Build contextual personalization
    if (analysis.messageCount === 0) {
      personalization = "I'm reaching out for the first time regarding";
    } else if (daysSinceLastContact && daysSinceLastContact > 14) {
      personalization = `Following up after ${daysSinceLastContact} days since our last communication regarding`;
    } else if (analysis.messageCount >= 3) {
      personalization = "As we've discussed multiple times, this concerns";
    } else {
      personalization = "Following up on our previous discussion about";
    }
    
    // Customize based on communication history
    if (analysis.communicationPattern.some(p => p.strategy === 'negotiation')) {
      message += `Hi ${customer.name},\n\n${personalization} your account balance. I know we previously discussed payment options, and I want to find the best solution for you.\n\n`;
    } else if (analysis.escalationLevel >= 2) {
      message += `${customer.name},\n\n${personalization} your seriously overdue account. This requires your immediate attention.\n\n`;
    } else {
      message += `Dear ${customer.name},\n\n${personalization} your outstanding invoices.\n\n`;
    }
    
    // Add contextual invoice details
    if (overdueInvoices.length === 1) {
      const inv = overdueInvoices[0];
      message += `Invoice ${inv.invoiceNumber} for $${inv.amount.toFixed(2)} is now ${inv.daysPastDue} days past due (due: ${new Date(inv.dueDate).toLocaleDateString()}).\n\n`;
    } else {
      message += `You currently have ${overdueInvoices.length} overdue invoices totaling $${totalOverdueAmount.toFixed(2)}:\n`;
      overdueInvoices.forEach(inv => {
        message += `• Invoice ${inv.invoiceNumber}: $${inv.amount.toFixed(2)} (${inv.daysPastDue} days overdue)\n`;
      });
      message += '\n';
    }
    
    // AI-driven strategy customization
    if (strategy === 'reminder') {
      if (analysis.messageCount === 0) {
        message += `Since this is our first contact, I want to make sure you have all the information you need. Sometimes payments get missed accidentally, so please check if this invoice has been overlooked.\n\n`;
      } else {
        message += `I understand life gets busy, but want to make sure this doesn't fall through the cracks. A quick payment can help avoid additional fees.\n\n`;
      }
    } else if (strategy === 'negotiation') {
      if (analysis.escalationLevel >= 1) {
        message += `Given that we've already tried to resolve this, I want to be direct: we're willing to work with you. Options include:\n- Payment plans starting at $${Math.max(50, Math.floor(totalOverdueAmount / 6))}/month\n- Temporary hardship deferment\n- Settlement options up to 20% discount\n\n`;
      } else {
        message += `I notice this has been outstanding for a while now. We understand that everyone faces financial challenges sometimes. Let's find a solution that works for both of us.\n\n`;
      }
    } else if (strategy === 'final_notice') {
      const urgency = analysis.messageCount >= 5 ? "extremely urgent" : "urgent";
      message += `This is your ${urgency} final notice. We've attempted to contact you ${analysis.messageCount} times without resolution.\n\nFailure to pay within 48 hours will result in:\n- Additional late fees of $50\n- Credit bureau reporting\n- Potential third-party collection action\n\n`;
    }
    
    // Add channel-specific customization
    if (channel === 'sms') {
      // Shorten for SMS
      message = message.split('\n').filter(line => line.trim()).slice(0, 4).join(' ').replace(/\n+/g, ' ');
      message += ` Reply HELP for options. Balance: $${totalOverdueAmount.toFixed(2)}`;
    } else if (channel === 'phone') {
      message += `\n\nWhen you call, please have your account ID (${customer.customerId}) ready. Our team is available 8AM-8PM EST.\n\n`;
    }
    
    // Add AI-generated call to action based on history
    if (analysis.preferredChannel === 'email' && channel !== 'email') {
      message += `P.S. I notice you prefer email communication - future notices will be sent to ${customer.email}\n\n`;
    }
    
    // Sign off
    if (strategy === 'final_notice') {
      message += `Collections Department\nNudge AI\nURGENT: Call 1-800-COLLECT`;
    } else if (strategy === 'negotiation') {
      message += `I'm here to help find the right solution for you.\n\nBest regards,\n${analysis.messageCount > 2 ? 'Sarah, Senior Account Manager' : 'Account Management Team'}\nNudge AI Collections\nPhone: 1-800-COLLECT\nEmail: collections@nudgeai.com`;
    } else {
      message += `Thank you for your attention to this matter.\n\nBest regards,\nNudge AI Collections Team`;
    }
    
    return message.trim();
  }
};

// Import services (we'll mock them for now)
const mockServiceHandler = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    console.log(`${req.method} ${url.pathname}`);
    
    // Serve the frontend for root path
    if (url.pathname === '/' || url.pathname === '/demo') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(demoHTML);
      return;
    }
    
    // Mock routing based on service
    if (url.pathname.startsWith('/customers')) {
      handleCustomerRoutes(req, res, url);
    } else if (url.pathname.startsWith('/invoices')) {
      handleInvoiceRoutes(req, res, url);
    } else if (url.pathname.startsWith('/communications')) {
      handleCommunicationRoutes(req, res, url);
    } else if (url.pathname.startsWith('/autofill')) {
      handleAutofillRoutes(req, res, url);
    } else if (url.pathname.startsWith('/admin')) {
      handleAdminRoutes(req, res, url);
    } else {
      // Health check
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        message: 'Nudge AI Local Development Server',
        timestamp: new Date().toISOString(),
        endpoints: [
          '/customers',
          '/invoices', 
          '/communications',
          '/admin'
        ]
      }));
    }
  } catch (error) {
    console.error('Request error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
};

// Mock route handlers
const handleCustomerRoutes = async (req, res, url) => {
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      customers: [
        {
          customerId: 'CUST-001',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-0123',
          status: 'active',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z'
        },
        {
          customerId: 'CUST-002',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1-555-0456',
          status: 'active',
          createdAt: '2025-01-10T14:30:00Z',
          updatedAt: '2025-01-10T14:30:00Z'
        },
        {
          customerId: 'CUST-003',
          name: 'Robert Johnson',
          email: 'robert@example.com',
          phone: '+1-555-0789',
          status: 'active',
          createdAt: '2024-12-20T09:15:00Z',
          updatedAt: '2024-12-20T09:15:00Z'
        }
      ],
      pagination: { page: 1, limit: 10, total: 3 }
    }));
  } else if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        customer: {
          customerId: 'CUST-002',
          name: JSON.parse(body).name,
          status: 'active',
          createdAt: new Date().toISOString()
        }
      }));
    });
  }
};

const handleInvoiceRoutes = async (req, res, url) => {
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      invoices: [
        {
          invoiceNumber: 'INV-001',
          customerId: 'CUST-001',
          amount: 750.00,
          dueDate: '2024-12-01T00:00:00Z',
          status: 'pending',
          daysPastDue: 38,
          createdAt: '2024-11-15T10:00:00Z',
          issueDate: '2024-11-15T10:00:00Z'
        },
        {
          invoiceNumber: 'INV-002',
          customerId: 'CUST-002',
          amount: 1250.00,
          dueDate: '2025-02-15T00:00:00Z',
          status: 'pending',
          daysPastDue: 0,
          createdAt: '2025-01-10T14:30:00Z',
          issueDate: '2025-01-10T14:30:00Z'
        },
        {
          invoiceNumber: 'INV-003',
          customerId: 'CUST-003',
          amount: 2400.00,
          dueDate: '2024-11-20T00:00:00Z',
          status: 'pending',
          daysPastDue: 49,
          createdAt: '2024-11-01T09:15:00Z',
          issueDate: '2024-11-01T09:15:00Z'
        },
        {
          invoiceNumber: 'INV-004',
          customerId: 'CUST-003',
          amount: 875.50,
          dueDate: '2024-12-15T00:00:00Z',
          status: 'pending',
          daysPastDue: 24,
          createdAt: '2024-11-20T09:15:00Z',
          issueDate: '2024-11-20T09:15:00Z'
        },
        {
          invoiceNumber: 'INV-005',
          customerId: 'CUST-001',
          amount: 320.00,
          dueDate: '2025-01-20T00:00:00Z',
          status: 'pending',
          daysPastDue: 19,
          createdAt: '2025-01-05T10:00:00Z',
          issueDate: '2025-01-05T10:00:00Z'
        }
      ]
    }));
  }
};

const handleCommunicationRoutes = async (req, res, url) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const commData = JSON.parse(body);
      const messageId = 'COMM-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      // Store message with initial status
      const message = {
        messageId: messageId,
        ...commData,
        status: 'sent',
        timestamp: new Date().toISOString(),
        channelDisplay: commData.channel === 'email' ? 'Email Sent' : 
                        commData.channel === 'sms' ? 'SMS Sent' : 'Phone Call Attempted'
      };
      messageHistory.push(message);
      
      res.writeHead(202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        communicationId: messageId,
        status: 'sent',
        channelDisplay: message.channelDisplay,
        message: 'Communication sent successfully'
      }));
    });
  } else if (req.method === 'GET' && url.searchParams.has('customerId')) {
    // Get messages for a specific customer
    const customerId = url.searchParams.get('customerId');
    const customerMessages = messageHistory.filter(m => m.customerId === customerId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      messages: customerMessages
    }));
  }
};

const handleAdminRoutes = async (req, res, url) => {
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'Admin service running',
      users: [],
      configurations: []
    }));
  }
};

const handleAutofillRoutes = async (req, res, url) => {
  if (req.method === 'GET' && url.searchParams.has('customerId')) {
    const customerId = url.searchParams.get('customerId');
    const strategy = url.searchParams.get('strategy') || 'reminder';
    const channel = url.searchParams.get('channel') || 'email';
    
    // Mock customer and invoice data based on customer ID
    const customers = {
      'CUST-001': {
        customerId: 'CUST-001',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123'
      },
      'CUST-002': {
        customerId: 'CUST-002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1-555-0456'
      },
      'CUST-003': {
        customerId: 'CUST-003',
        name: 'Robert Johnson',
        email: 'robert@example.com',
        phone: '+1-555-0789'
      }
    };
    
    const customerInvoices = {
      'CUST-001': [
        {
          invoiceNumber: 'INV-001',
          amount: 750.00,
          daysPastDue: 38,
          dueDate: '2024-12-01T00:00:00Z'
        },
        {
          invoiceNumber: 'INV-005',
          amount: 320.00,
          daysPastDue: 19,
          dueDate: '2025-01-20T00:00:00Z'
        }
      ],
      'CUST-002': [
        {
          invoiceNumber: 'INV-002',
          amount: 1250.00,
          daysPastDue: 0,
          dueDate: '2025-02-15T00:00:00Z'
        }
      ],
      'CUST-003': [
        {
          invoiceNumber: 'INV-003',
          amount: 2400.00,
          daysPastDue: 49,
          dueDate: '2024-11-20T00:00:00Z'
        },
        {
          invoiceNumber: 'INV-004',
          amount: 875.50,
          daysPastDue: 24,
          dueDate: '2024-12-15T00:00:00Z'
        }
      ]
    };
    
    const customer = customers[customerId] || customers['CUST-001'];
    const invoices = customerInvoices[customerId] || [];
    const overdueInvoices = invoices.filter(inv => inv.daysPastDue > 0);
    const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    
    // Use AI Agent to analyze communication history and generate personalized message
    const analysis = aiAgent.analyzeCommunicationHistory(customerId, strategy);
    const personalizedMessage = aiAgent.generatePersonalizedMessage(
      customer, 
      invoices, 
      analysis, 
      strategy, 
      channel
    );
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: personalizedMessage,
      customer: customer,
      invoices: invoices,
      overdueInvoices: overdueInvoices,
      totalOverdueAmount: totalOverdueAmount,
      aiAnalysis: analysis,
      isAIGenerated: true
    }));
  }
};

// Start server
const PORT = process.env.PORT || 3001;
const server = createHttpServer(mockServiceHandler);

server.listen(PORT, () => {
  console.log(`🚀 Nudge AI Local Server running on http://localhost:${PORT}`);
  console.log('\n📋 Available endpoints:');
  console.log('  GET  /                    - Health check');
  console.log('  GET  /customers           - List customers');
  console.log('  POST /customers           - Create customer');
  console.log('  GET  /invoices            - List invoices');
  console.log('  POST /communications      - Send communication');
  console.log('  GET  /admin               - Admin status');
  console.log('\n🧪 Example commands:');
  console.log(`  curl http://localhost:${PORT}/`);
  console.log(`  curl http://localhost:${PORT}/customers`);
  console.log(`  curl -X POST http://localhost:${PORT}/customers -H "Content-Type: application/json" -d '{"name":"Test User","email":"test@example.com"}'`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});