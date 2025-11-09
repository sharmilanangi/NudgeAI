# Nudge AI Local Testing Guide

## 🚀 Quick Start

### 1. Start the Local Development Server
```bash
cd /Users/srnangi/Documents/AIT/nudge-ai
node local-server.js
```

The server will start on `http://localhost:3001`

### 2. Test the API Endpoints

Open a new terminal and try these commands:

#### Health Check
```bash
curl http://localhost:3001/
```

#### Get Customers
```bash
curl http://localhost:3001/customers
```

#### Create a Customer
```bash
curl -X POST http://localhost:3001/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Smith",
    "email": "alice@example.com", 
    "phone": "+1-555-0456"
  }'
```

#### Get Invoices
```bash
curl http://localhost:3001/invoices
```

#### Send Communication
```bash
curl -X POST http://localhost:3001/communications \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST-001",
    "channel": "email",
    "strategy": "reminder",
    "content": "Payment reminder for invoice INV-001"
  }'
```

#### Admin Status
```bash
curl http://localhost:3001/admin
```

## 🌐 Web Interface Testing

You can also test the endpoints in your browser:
- Open http://localhost:3001 for the health check
- Open http://localhost:3001/customers to see customer data

## 🛠 Advanced Testing Options

### Option 1: Raindrop CLI (Recommended for full testing)
If you have the Raindrop CLI installed:
```bash
# Install Raindrop CLI (if not already installed)
npm install -g @liquidmetal-ai/raindrop-cli

# Run locally with Raindrop
raindrop dev

# Deploy to staging for testing
raindrop deploy --env staging
```

### Option 2: Postman Collection
Import these examples into Postman:

1. **GET** http://localhost:3001/
2. **GET** http://localhost:3001/customers  
3. **POST** http://localhost:3001/customers
   ```json
   {
     "name": "Test User",
     "email": "test@example.com",
     "phone": "+1-555-0123"
   }
   ```
4. **GET** http://localhost:3001/invoices
5. **POST** http://localhost:3001/communications
   ```json
   {
     "customerId": "CUST-001",
     "channel": "email", 
     "strategy": "reminder",
     "content": "Test message"
   }
   ```

### Option 3: Testing with Node.js Script
```bash
node test-endpoints.js
```

## 📊 Expected Response Formats

### Customer Response
```json
{
  "customers": [
    {
      "customerId": "CUST-001",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-0123",
      "status": "active",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1 }
}
```

### Communication Response
```json
{
  "success": true,
  "communicationId": "COMM-001",
  "status": "queued",
  "message": "Communication queued successfully"
}
```

## 🔍 Debugging Tips

1. **Check the server logs** - All requests are logged in the terminal
2. **Use browser dev tools** - Network tab shows full request/response details
3. **Test with curl -v** - Verbose mode shows headers and connection details
4. **Validate JSON** - Use JSON validators to ensure correct formatting

## 🚨 Common Issues

- **CORS errors**: The local server includes CORS headers
- **Connection refused**: Make sure the server is running on port 3001
- **Invalid JSON**: Double-check your JSON syntax in POST requests

## 📝 Next Steps

Once you're comfortable with the local server:
1. Try implementing actual service logic in the src/ directories
2. Set up a local database (SQLite) for persistence
3. Test the Raindrop deployment pipeline
4. Add authentication and proper error handling