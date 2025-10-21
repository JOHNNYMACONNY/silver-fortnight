# Product Context

This file provides a high-level overview of the project and the expected product that will be created. Initially it is based upon projectBrief.md (if provided) and all other available project-related information in the working directory. This file is intended to be updated as the project evolves, and should be used to inform all other modes of the project's goals and context.
2025-12-06 08:56:18 - Log of updates made will be appended as footnotes to the end of this file.

## Project Goal

TradeYa is a comprehensive skill-trading platform that enables users to exchange skills and services in a collaborative marketplace environment. The platform facilitates peer-to-peer skill sharing through secure trades, collaboration opportunities, and community-driven features.

## Key Features

* **Skill Trading System**: Core functionality for proposing, negotiating, and completing skill exchanges
* **Collaboration Roles**: Advanced role management system for project-based collaborations
* **User Profiles & Portfolios**: Comprehensive user management with evidence galleries and reputation systems
* **Real-time Messaging**: Chat system for trade negotiations and collaboration communication
* **Gamification**: Achievement system, XP tracking, and leaderboards to encourage participation
* **Security & Moderation**: Robust security measures, role-based access control, and content moderation
* **Performance Optimization**: Advanced performance monitoring, smart preloading, and asset optimization
* **Migration Infrastructure**: Comprehensive Firestore migration system for schema evolution

## Overall Architecture

* **Frontend**: React with TypeScript, Vite build system, Tailwind CSS for styling
* **Backend**: Firebase ecosystem (Firestore, Authentication, Storage, Functions)
* **State Management**: React Context API with custom hooks for complex operations
* **Testing**: Jest and React Testing Library with comprehensive migration testing suite
* **Performance**: RUM service, smart bundling, virtualization, and adaptive loading
* **Security**: Firestore security rules, role-based access control, input validation
* **Documentation**: Extensive markdown documentation with automated maintenance