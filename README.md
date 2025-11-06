# TradeYa

> **A platform for creative professionals to trade skills, collaborate on projects, and build their portfolios through gamified challenges.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0.5-646CFF?logo=vite)](https://vitejs.dev/)

---

## 🚀 Overview

**TradeYa** is a comprehensive platform designed for creative professionals to:

- 🤝 **Trade Skills**: Exchange services and collaborate without monetary transactions
- 🎯 **Complete Challenges**: Participate in gamified skill-building challenges (Solo → Trade → Collaboration)
- 🏆 **Earn Recognition**: Build XP, unlock achievements, and climb leaderboards
- 💼 **Build Portfolios**: Showcase completed work and collaborate on real projects
- 💬 **Connect & Communicate**: Real-time messaging and collaboration tools

---

## ✨ Key Features

### **Trade System**
- Create and manage skill-based trades
- Propose and accept trade offers
- Track trade lifecycle from proposal to completion
- Evidence submission and verification

### **Challenge System**
- **Three-tier progression**: Solo → Trade → Collaboration challenges
- Skill-based challenges across creative disciplines
- XP rewards and achievement tracking
- Celebration modals with confetti animations

### **Gamification**
- XP and leveling system
- Global and category-based leaderboards
- Achievement badges and milestones
- Streak tracking and daily login rewards

### **Collaboration**
- Multi-user project management
- Role-based access control (Creator, Lead, Contributor, Viewer)
- Progress tracking and milestone management
- Real-time communication

### **Messaging**
- Real-time chat system
- Conversation management
- Read receipts and typing indicators
- Message threading

---

## 🛠️ Tech Stack

### **Frontend**
- **React 18.3.1** with TypeScript
- **Vite 6.0.5** for build tooling
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons

### **Backend & Database**
- **Firebase Authentication** for user management
- **Firestore** for real-time database
- **Firebase Storage** for file uploads
- **Firebase Cloud Functions** for serverless operations

### **Testing**
- **Jest** for unit and integration tests
- **Playwright** for end-to-end testing
- **React Testing Library** for component tests

### **Development**
- **ESLint** & **Prettier** for code quality
- **TypeScript** for type safety
- **Vite** for fast development and optimized builds

---

## 📦 Installation

### **Prerequisites**
- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- Git

### **Setup**

```bash
# Clone the repository
git clone https://github.com/yourusername/silver-fortnight.git
cd silver-fortnight

# Install dependencies
npm install

# Install Firebase Functions dependencies
cd functions && npm install && cd ..

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase configuration

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🔧 Development

### **Available Scripts**

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Production build (optimized)
npm run preview               # Preview production build

# Testing
npm test                       # Run unit tests with coverage
npm run test:watch            # Run tests in watch mode
npm run test:ci               # CI test suite (fast)
npm run test:ci:full          # Full test suite
npm run test:e2e              # Run Playwright E2E tests
npm run test:e2e:ui           # Open Playwright UI

# Code Quality
npm run lint                   # Lint code
npm run lint:fix              # Fix linting issues
npm run format                # Format with Prettier
npm run type-check            # TypeScript type checking

# Firebase
npm run deploy:production:full # Deploy to production
npm run functions:build        # Build Cloud Functions
```

### **Project Structure**

```
silver-fortnight/
├── src/
│   ├── components/          # React components
│   │   ├── features/       # Feature-specific components
│   │   ├── ui/            # Reusable UI components
│   │   └── animations/    # Animation components
│   ├── pages/             # Page components
│   ├── services/          # Business logic and Firebase services
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── functions/             # Firebase Cloud Functions
├── public/               # Static assets
├── docs/                 # Documentation
├── scripts/              # Build and utility scripts
├── tests/                # Test files
└── e2e/                  # End-to-end tests
```

---

## 🚀 Deployment

### **Production Deployment**

      ```bash
# Full production deployment (hosting + functions + rules)
npm run deploy:production:full

# Deploy specific components
npm run deploy:application:production    # Hosting only
npm run deploy:functions:production     # Functions only
npm run deploy:rules:production         # Security rules only
```

### **Environment Configuration**

The project supports multiple environments:
- **Development**: `localhost:5173`
- **Staging**: `tradeya-staging.web.app`
- **Production**: `tradeya.io` and `tradeya-45ede.web.app`

Configure environment variables in `.env` files:
- `.env` - Development
- `.env.production` - Production

---

## 📊 Testing

### **Test Strategy**

- **Unit Tests**: Component and service logic (Jest)
- **Integration Tests**: Feature workflows and data flow (Jest)
- **E2E Tests**: Complete user journeys (Playwright)

### **Running Tests**

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:integration
npm run test:e2e

# Run E2E tests for specific features
npm run test:e2e:trade-lifecycle
npm run test:e2e:collaboration
npm run test:e2e:challenges

# Test with coverage
npm run test:ci:full
```

---

## 🔐 Security

- Firebase Security Rules for Firestore and Storage
- Role-based access control (RBAC)
- User authentication via Firebase Auth
- Secure API endpoints via Cloud Functions
- Input validation and sanitization

See [SECURITY.md](./docs/security/SECURITY.md) for more details.

---

## 📚 Documentation

Comprehensive documentation is now organized in the `docs/` directory. See **[docs/README.md](./docs/README.md)** for the complete documentation index.

### Quick Links

- **[Implementation Master Plan](./docs/IMPLEMENTATION_MASTER_PLAN.md)** - Overall project architecture and roadmap
- **[Implementation Progress](./docs/IMPLEMENTATION_PROGRESS.md)** - Current status and tracking
- **[Quick Deploy Guide](./docs/deployment/QUICK_DEPLOY_INSTRUCTIONS.md)** - Fast deployment instructions
- **[Testing Guide](./docs/testing/TESTING.md)** - Testing strategy and execution
- **[User Guide](./docs/guides/USER_GUIDE.md)** - End-user documentation

### Documentation Categories

- 📁 **[Features](./docs/features/)** - Authentication, messaging, portfolio, collaboration, etc.
- 🏆 **[Challenges](./docs/challenges/)** - Challenge system documentation
- 🎮 **[Gamification](./docs/gamification/)** - Gamification, XP, achievements
- 🔄 **[Trade System](./docs/trade-system/)** - Trade lifecycle and proposals
- 🎨 **[Design](./docs/design/)** - Design system and UI components
- 🚀 **[Deployment](./docs/deployment/)** - Deployment guides and CI/CD
- 🔥 **[Firebase](./docs/firebase/)** - Firebase security, indexes, migrations
- ⚡ **[Performance](./docs/performance/)** - Optimization and profiling
- 🧪 **[Testing](./docs/testing/)** - Test strategies and coverage
- 📱 **[iOS](./docs/ios/)** - Swift/iOS migration documentation
- 🔐 **[Security](./docs/security/)** - Security policies and fixes
- 🛠️ **[Technical](./docs/technical/)** - Technical reference and configs
- 📚 **[Guides](./docs/guides/)** - Best practices and workflows
- 📊 **[Summaries](./docs/summaries/)** - Reports and status updates

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- React community for excellent libraries
- All contributors and testers

---

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check the [documentation](./docs/)
- Review the [FAQ](./docs/USER_GUIDE.md#faq)

---

**Built with ❤️ for creative professionals**
