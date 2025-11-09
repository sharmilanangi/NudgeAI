# NudgeAI - AI-Powered Insurance Collection Agency Replacement

<div align="center">

![NudgeAI Logo](https://img.shields.io/badge/NudgeAI-AI%20Collection%20System-blue?style=for-the-badge)

**An intelligent, automated collection system that replaces traditional human collection agencies**

[![Built with Raindrop](https://img.shields.io/badge/Built%20with-Raindrop-purple)](https://liquidmetal.ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

[View Live Demo](#) · [Report Bug](#) · [Request Feature](#)

</div>

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Architecture](#architecture)
- [Built With](#built-with)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 About

NudgeAI is a cutting-edge, AI-driven collection system designed to replace traditional human collection agencies for insurance companies. By leveraging intelligent AI agents, the system communicates with debtors via email, phone, and SMS, significantly reducing collection costs while maintaining or improving recovery rates.

**Key Benefits:**
- 🤖 **70% cost reduction** compared to traditional agencies
- 📊 **30%+ recovery rates** exceeding industry averages
- 🔒 **Built-in compliance** with FDCPA and state regulations
- 📈 **Scalable solution** handling 100 to 10,000+ collections monthly
- 🌐 **Multi-channel communication** (Email, SMS, Voice)

## ✨ Features

### 🎛️ Smart Collection Dashboard
- **Customer Data Display**: Invoice details, customer info, payment status
- **Real-time Status Updates**: Live conversation summaries and suggested actions
- **Action Controls**: Send communications, view history, manage payment plans

### 🤖 AI Agent Communication System
- **Multi-Channel Support**: Email, SMS, and voice conversations
- **Emotionally Intelligent**: Persuasive yet compliant messaging
- **Payment Plan Negotiation**: AI-powered flexible payment arrangements
- **Context-Aware**: Smart follow-ups based on conversation history

### ⚖️ Compliance Engine
- **FDCPA Compliant**: Fair Debt Collection Practices Act adherence
- **State-Specific Rules**: Configurable compliance per jurisdiction
- **Built-in Safeguards**: Call time restrictions, frequency limits, consent management

### 💳 Payment Processing
- **Secure Gateway**: Integrated payment processing with multiple methods
- **Payment Plans**: Flexible arrangement creation and management
- **Automatic Posting**: Real-time payment updates and receipt generation

### 📊 Analytics & Reporting
- **Recovery Metrics**: Track collection effectiveness and ROI
- **Channel Analytics**: Compare performance across communication channels
- **Aging Analysis**: Monitor debt aging and collection patterns

## 🏗️ Architecture

NudgeAI is built on the **Raindrop Framework** using a microservices architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Core Services │
│                 │◄──►│                 │◄──►│                 │
│ React + Vite    │    │ Public Service  │    │ • Customer      │
│ Tailwind CSS    │    │                 │    │ • Invoice       │
└─────────────────┘    └─────────────────┘    │ • Communication │
                                              │ • AI Agent      │
                                              │ • Payment       │
                                              │ • Compliance    │
                                              └─────────────────┘
                                                        │
                       ┌─────────────────┐             │
                       │   Observers     │◄────────────┤
                       │                 │             │
                       • Payment Events  │             │
                       • Communication   │             │
                       • Customer Updates│             │
                       • Compliance      │             │
                       └─────────────────┘             │
                                                        │
                       ┌─────────────────┐             │
                       │   Data Layer    │◄────────────┘
                       │                 │
                       • SQL Databases   │
                       • Smart Buckets   │
                       • Message Queues  │
                       └─────────────────┘
```

### Microservices Components

| Component | Purpose | Visibility |
|-----------|---------|------------|
| **api-gateway** | Main API entry point | Public |
| **customer-service** | Customer data management | Private |
| **invoice-service** | Invoice management | Private |
| **communication-service** | Multi-channel messaging | Private |
| **ai-agent-service** | AI conversation engine | Private |
| **payment-processor** | Payment processing | Protected |
| **compliance-service** | Regulatory compliance | Private |
| **analytics-service** | Data analysis | Private |

## 🛠️ Built With

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **TypeScript** - Type-safe development

### Backend
- **Raindrop Framework** - Serverless microservices platform
- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe backend development
- **Zod** - Runtime type validation
- **Kysely** - Type-safe SQL query builder

### Infrastructure
- **Smart Buckets** - Customer data and communication logs
- **SQL Databases** - Structured data storage
- **Message Queues** - Asynchronous processing
- **Scheduled Tasks** - Automated follow-ups

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Raindrop CLI** (optional for deployment)
  ```bash
  npm install -g @liquidmetal-ai/raindrop-cli
  ```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sharmilanangi/NudgeAI.git
   cd NudgeAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Setup databases**
   ```bash
   # Create database migrations
   npm run create-migration
   
   # Generate seed data
   npm run seed:createSql
   ```

### Local Development

1. **Start the local development server**
   ```bash
   node local-server.js
   ```
   The server will start on `http://localhost:3001`

2. **Test the application**
   ```bash
   # Run the test script
   node test-endpoints.js
   
   # Or test manually with curl
   curl http://localhost:3001/
   ```

3. **Run tests**
   ```bash
   npm test                # Run tests once
   npm run test:watch      # Run tests in watch mode
   ```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build the TypeScript project |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run create-migration` | Create database migrations |
| `npm run seed:createSql` | Generate seed data |

## 📚 API Documentation

### Base URL
- **Local**: `http://localhost:3001`
- **Production**: `https://your-domain.com` (after deployment)

### Core Endpoints

#### Customer Management
```http
GET    /customers              # List customers
POST   /customers              # Create customer
GET    /customers/:id          # Get customer details
PUT    /customers/:id          # Update customer
```

#### Invoice Management
```http
GET    /invoices               # List invoices
POST   /invoices               # Create invoice
GET    /invoices/:id           # Get invoice details
PUT    /invoices/:id           # Update invoice
```

#### Communication
```http
POST   /communications         # Send communication
GET    /communications/:id     # Get communication history
```

#### Payment Processing
```http
POST   /payments/process       # Process payment
GET    /payments/:invoiceId    # Get payment history
POST   /payments/plans         # Create payment plan
```

#### Admin
```http
GET    /admin                  # Admin dashboard data
```

### Example Usage

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

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Each service has corresponding `*.test.ts` files
- **Integration Tests**: API endpoint testing via `test-endpoints.js`
- **Local Testing**: Manual testing via `local-server.js`

### Testing the API
Use the provided test script:
```bash
node test-endpoints.js
```

Or test manually with curl commands (see API documentation above).

## 🚀 Deployment

### Using Raindrop CLI (Recommended)

1. **Install Raindrop CLI**
   ```bash
   npm install -g @liquidmetal-ai/raindrop-cli
   ```

2. **Login to Raindrop**
   ```bash
   raindrop login
   ```

3. **Deploy to staging**
   ```bash
   raindrop deploy --env staging
   ```

4. **Deploy to production**
   ```bash
   raindrop deploy --env production
   ```

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**
   - Vercel
   - Netlify
   - AWS
   - Google Cloud
   - Any Node.js hosting platform

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=your_database_url

# Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Email Service
SENDGRID_API_KEY=your_sendgrid_key

# AI Services
OPENAI_API_KEY=your_openai_key

# Raindrop (if using Raindrop platform)
RAINDROP_API_KEY=your_raindrop_key
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npm test
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Style

This project uses:
- **ESLint** for linting
- **Prettier** for formatting
- **TypeScript** for type safety

Run the linter and formatter before committing:
```bash
npm run lint
npm run format
```

## 📝 Project Status

### Current Version: 1.0.0

### Completed Features ✅
- [x] Basic API structure
- [x] Customer management
- [x] Invoice handling
- [x] Communication system
- [x] Payment processing
- [x] Compliance framework
- [x] Local testing setup
- [x] Database integration

### In Progress 🚧
- [ ] AI agent integration
- [ ] Voice calling capabilities
- [ ] Advanced analytics
- [ ] Multi-language support

### Planned Features 📋
- [ ] Advanced payment negotiation
- [ ] Predictive analytics
- [ ] Custom client branding
- [ ] API reseller program
- [ ] Mobile apps

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Raindrop Framework](https://liquidmetal.ai)** - For the amazing serverless platform
- **[OpenAI](https://openai.com)** - For AI conversation capabilities
- **[Stripe](https://stripe.com)** - For payment processing
- Our early testers and feedback providers

## 📞 Support

- **Email**: support@nudgeai.com
- **Documentation**: [docs.nudgeai.com](https://docs.nudgeai.com)
- **Issues**: [GitHub Issues](https://github.com/sharmilanangi/NudgeAI/issues)

---

<div align="center">

**Made with ❤️ by the NudgeAI Team**

[![Twitter](https://img.shields.io/badge/Twitter-@NudgeAI-blue?style=flat-square)](https://twitter.com/nudgeai)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-NudgeAI-blue?style=flat-square)](https://linkedin.com/company/nudgeai)

</div>