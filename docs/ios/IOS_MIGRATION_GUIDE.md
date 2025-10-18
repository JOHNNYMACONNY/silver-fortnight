# TradeYa iOS Migration Guide

> **Version:** 1.1  
> **Last Updated:** January 2025  
> **Target:** iOS 17+ | Swift 6.0 | Firebase iOS SDK 10+  
> **Team:** Intermediate Swift/Firebase developers  

---

## Executive Summary

This guide provides a complete roadmap for building the TradeYa iOS app using SwiftUI and Firebase. The iOS app will maintain 1:1 feature parity with the web application while leveraging native iOS capabilities for optimal performance and user experience.

**Timeline:** 4-6 weeks for MVP (aggressive)  
**Approach:** Function-first with clean SwiftUI, then apply glassmorphic polish  
**Backend:** Existing Firebase infrastructure (no changes needed)

---

## Table of Contents

1. [Development Strategy](#development-strategy)
2. [Project Setup](#project-setup)
3. [Architecture Overview](#architecture-overview)
4. [Data Models](#data-models)
5. [Feature Implementation](#feature-implementation)
6. [Design System](#design-system)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Guide](#deployment-guide)
9. [Troubleshooting](#troubleshooting)

---

## Development Strategy

### Sequential vs. Parallel Development

**RECOMMENDATION: Stabilize web app first, then build iOS**

**Why Sequential is Better:**
- Firebase schema serves as single source of truth
- Clearer requirements ("make it work like the web app")
- Easier debugging (no moving targets)
- Better resource allocation (web devs can QA iOS by comparison)

**Suggested Timeline:**
1. **Weeks 1-2:** Finalize web app MVP, lock Firebase schema
2. **Weeks 3-6:** Build iOS app referencing stable web version
3. **Week 7+:** Polish glassmorphic UI, add advanced features

### Phase 1: Function-First MVP (Weeks 1-4)

Build core features with clean, native SwiftUI:
- ✅ Authentication (email + Google Sign-In)
- ✅ Browse trades (real-time Firestore listeners)
- ✅ Create trades
- ✅ Basic messaging
- ✅ User profiles

**Design Philosophy:** Use standard SwiftUI components with basic design tokens. Focus on functionality and feature parity.

### Phase 2: Glassmorphic Polish (Weeks 5-6)

Apply premium design layer:
- ✅ Blur effects and transparency
- ✅ Smooth animations
- ✅ Premium shadows and gradients
- ✅ Match web app's aesthetic

---

## Project Setup

### Prerequisites

- Xcode 15.0+ (latest stable)
- macOS Ventura or later
- Apple Developer Account ($99/year)
- Access to TradeYa Firebase project

### 1. Create Xcode Project

```bash
# Open Xcode and create new project with:
- Template: iOS App
- Interface: SwiftUI
- Language: Swift
- Product Name: TradeYa
- Organization Identifier: com.tradeya (or your domain)
- Bundle Identifier: com.tradeya.TradeYa
```

### 2. Add Firebase SDK via Swift Package Manager

```swift
// File > Add Packages > Enter URL:
https://github.com/firebase/firebase-ios-sdk

// Select these packages:
- FirebaseAuth
- FirebaseFirestore
- FirebaseStorage
- FirebaseAnalytics (optional)
- FirebaseMessaging (for push notifications)
```

### 3. Configure Firebase

1. **Firebase Console:** Add iOS app to existing TradeYa project
2. **Bundle ID:** Use the same Bundle Identifier from Xcode
3. **Download:** `GoogleService-Info.plist`
4. **Add to Xcode:** Drag file into project root (ensure "Copy items" is checked)

### 4. Initialize Firebase in App

```swift
// TradeYaApp.swift
import SwiftUI
import FirebaseCore

@main
struct TradeYaApp: App {
    
    init() {
        FirebaseApp.configure()
    }
    
    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(AuthService())
        }
    }
}
```

### 5. Project Structure

Create this folder structure in Xcode:

```
TradeYa/
├── App/
│   └── TradeYaApp.swift
├── Models/
│   ├── User.swift
│   ├── Trade.swift
│   ├── Message.swift
│   └── Conversation.swift
├── Views/
│   ├── Auth/
│   ├── Trades/
│   ├── Messages/
│   ├── Profile/
│   └── Components/
├── ViewModels/ (OPTIONAL - see note below)
│   ├── AuthViewModel.swift
│   ├── TradeViewModel.swift
│   └── MessageViewModel.swift
├── Services/
│   ├── AuthService.swift
│   ├── FirestoreService.swift
│   ├── TradeService.swift
│   └── MessageService.swift
├── Utilities/
│   ├── Constants.swift
│   └── Extensions/
└── Resources/
    ├── Assets.xcassets
    └── GoogleService-Info.plist
```

**Note on ViewModels Folder:** With the modern `@Observable` macro (iOS 17+), the distinction between ViewModels and Services often blurs. Many developers combine these into a single `Services/` folder where classes handle both data management and UI state. The ViewModels folder is **optional** - use it if your team prefers clear separation, or merge ViewModel logic directly into Services for simplicity.

---

## Architecture Overview

### MVVM Pattern (Model-View-ViewModel)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   SwiftUI   │────▶│  ViewModel   │────▶│   Service   │
│    Views    │◀────│  (@Observable)│◀────│  (Firebase) │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    Models    │
                    │  (Codable)   │
                    └──────────────┘
```

### Firebase Collections (Reference from Web App)

Your web app uses these Firestore collections:

```
firestore/
├── users/                    # User profiles
├── trades/                   # Trade listings
├── conversations/            # Chat conversations
│   └── {conversationId}/
│       └── messages/         # Chat messages
├── notifications/            # User notifications
├── challenges/               # Skill challenges (future)
└── gamification/            # XP, achievements (future)
```

**Important:** iOS app uses identical collection names and structure.

---

## Data Models

### User Model

```swift
// Models/User.swift
import FirebaseFirestore

struct User: Codable, Identifiable, Equatable {
    @DocumentID var id: String?
    var uid: String
    var email: String?
    var displayName: String?
    var profilePicture: String?
    var photoURL: String?
    var bio: String?
    var location: String?
    var website: String?
    var skills: [String]?
    var reputationScore: Int?
    var interests: String?
    var role: UserRole?
    var createdAt: Timestamp?
    var updatedAt: Timestamp?
    var isPublic: Bool?
    
    enum UserRole: String, Codable {
        case user
        case admin
        case moderator
    }
    
    enum CodingKeys: String, CodingKey {
        case id, uid, email, displayName, profilePicture, photoURL
        case bio, location, website, skills, reputationScore
        case interests, role, createdAt, updatedAt
        case isPublic = "public"
    }
}
```

### Trade Model

```swift
// Models/Trade.swift
import FirebaseFirestore

struct Trade: Codable, Identifiable, Hashable {
    @DocumentID var id: String?
    var title: String
    var description: String
    var creatorId: String
    var creatorName: String?
    var creatorPhotoURL: String?
    var participantId: String?
    var participantName: String?
    var participantPhotoURL: String?
    var category: String
    var skillsOffered: [TradeSkill]
    var skillsWanted: [TradeSkill]
    var offeredSkills: [TradeSkill]  // Alias for compatibility
    var requestedSkills: [TradeSkill] // Alias for compatibility
    var status: TradeStatus
    var interestedUsers: [String]?
    var acceptedUserId: String?
    var createdAt: Timestamp
    var updatedAt: Timestamp
    
    enum TradeStatus: String, Codable {
        case open
        case active
        case completed
        case cancelled
        case pendingConfirmation = "pending-confirmation"
    }
}

struct TradeSkill: Codable, Hashable {
    var name: String
    var level: String?  // "beginner", "intermediate", "advanced"
}
```

### Message Models

```swift
// Models/Message.swift
import FirebaseFirestore

struct ChatMessage: Codable, Identifiable {
    @DocumentID var id: String?
    var conversationId: String
    var senderId: String
    var senderName: String
    var senderAvatar: String?
    var content: String
    var type: MessageType
    var timestamp: Timestamp
    var isRead: Bool?
    var readBy: [String]?
    
    enum MessageType: String, Codable {
        case text
        case image
        case file
        case system
    }
}

struct Conversation: Codable, Identifiable {
    @DocumentID var id: String?
    var participants: [String]
    var participantNames: [String: String]
    var participantAvatars: [String: String]
    var lastMessage: String?
    var lastMessageTimestamp: Timestamp?
    var unreadCount: [String: Int]?
    var createdAt: Timestamp
    var updatedAt: Timestamp
}
```

---

## Feature Implementation

## Sprint 1: Authentication (Week 1)

### AuthService.swift

```swift
// Services/AuthService.swift
import FirebaseAuth
import FirebaseFirestore
import Observation

@Observable
@MainActor
class AuthService {
    var currentUser: User?
    var isAuthenticated = false
    var isLoading = false
    var errorMessage: String?
    
    private let auth = Auth.auth()
    private let db = Firestore.firestore()
    
    init() {
        // Listen to auth state changes
        auth.addStateDidChangeListener { [weak self] _, firebaseUser in
            Task { @MainActor in
                if let firebaseUser = firebaseUser {
                    await self?.fetchUserProfile(uid: firebaseUser.uid)
                } else {
                    self?.currentUser = nil
                    self?.isAuthenticated = false
                }
            }
        }
    }
    
    // Sign up with email
    func signUp(email: String, password: String, displayName: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        let authResult = try await auth.createUser(withEmail: email, password: password)
        
        // Create Firestore profile (matches web app structure)
        let newUser = User(
            id: authResult.user.uid,
            uid: authResult.user.uid,
            email: email,
            displayName: displayName,
            reputationScore: 0,
            role: .user,
            createdAt: Timestamp(),
            updatedAt: Timestamp(),
            isPublic: true
        )
        
        try await createUserProfile(user: newUser)
        await fetchUserProfile(uid: authResult.user.uid)
    }
    
    // Sign in with email
    func signIn(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        try await auth.signIn(withEmail: email, password: password)
    }
    
    // Sign out
    func signOut() throws {
        try auth.signOut()
        currentUser = nil
        isAuthenticated = false
    }
    
    // MARK: - Private Methods
    
    private func createUserProfile(user: User) async throws {
        try db.collection("users").document(user.uid).setData(from: user)
    }
    
    private func fetchUserProfile(uid: String) async {
        do {
            let snapshot = try await db.collection("users").document(uid).getDocument()
            self.currentUser = try snapshot.data(as: User.self)
            self.isAuthenticated = true
        } catch {
            print("Error fetching profile: \(error)")
            errorMessage = error.localizedDescription
        }
    }
}
```

### Login View

```swift
// Views/Auth/LoginView.swift
import SwiftUI

struct LoginView: View {
    @Environment(AuthService.self) private var authService
    @State private var email = ""
    @State private var password = ""
    @State private var showingSignUp = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                // Logo/Branding
                VStack(spacing: 8) {
                    Image(systemName: "arrow.triangle.2.circlepath")
                        .font(.system(size: 60))
                        .foregroundStyle(.orange)
                    
                    Text("TradeYa")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Trade skills, grow together")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 60)
                
                // Form
                VStack(spacing: 16) {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    
                    SecureField("Password", text: $password)
                        .textContentType(.password)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    
                    Button {
                        Task {
                            try? await authService.signIn(email: email, password: password)
                        }
                    } label: {
                        if authService.isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("Sign In")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.orange)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .disabled(authService.isLoading)
                }
                .padding(.horizontal, 32)
                
                if let error = authService.errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                        .padding()
                }
                
                Spacer()
                
                // Sign up link
                Button {
                    showingSignUp = true
                } label: {
                    Text("Don't have an account? **Sign Up**")
                        .foregroundColor(.secondary)
                }
            }
            .sheet(isPresented: $showingSignUp) {
                SignUpView()
            }
        }
    }
}
```

### Google Sign-In Implementation

```swift
// Services/AuthService.swift (add to existing AuthService)

import GoogleSignIn
import FirebaseAuth

// Add to AuthService class:

func signInWithGoogle() async throws {
    // Get the root view controller
    guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
          let rootViewController = windowScene.windows.first?.rootViewController else {
        throw NSError(domain: "AuthService", code: -1, userInfo: [NSLocalizedDescriptionKey: "No root view controller"])
    }
    
    // Get client ID from Firebase config
    guard let clientID = FirebaseApp.app()?.options.clientID else {
        throw NSError(domain: "AuthService", code: -1, userInfo: [NSLocalizedDescriptionKey: "No client ID found"])
    }
    
    // Configure Google Sign-In
    let config = GIDConfiguration(clientID: clientID)
    GIDSignIn.sharedInstance.configuration = config
    
    // Perform sign-in
    let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController)
    
    guard let idToken = result.user.idToken?.tokenString else {
        throw NSError(domain: "AuthService", code: -1, userInfo: [NSLocalizedDescriptionKey: "No ID token"])
    }
    
    let accessToken = result.user.accessToken.tokenString
    
    // Create Firebase credential
    let credential = GoogleAuthProvider.credential(withIDToken: idToken, accessToken: accessToken)
    
    // Sign in to Firebase
    let authResult = try await auth.signIn(with: credential)
    
    // Check if user profile exists, create if not
    let userExists = try await checkUserExists(uid: authResult.user.uid)
    if !userExists {
        let newUser = User(
            id: authResult.user.uid,
            uid: authResult.user.uid,
            email: authResult.user.email,
            displayName: authResult.user.displayName,
            photoURL: authResult.user.photoURL?.absoluteString,
            reputationScore: 0,
            role: .user,
            createdAt: Timestamp(),
            updatedAt: Timestamp(),
            isPublic: true
        )
        try await createUserProfile(user: newUser)
    }
    
    await fetchUserProfile(uid: authResult.user.uid)
}

private func checkUserExists(uid: String) async throws -> Bool {
    let snapshot = try await db.collection("users").document(uid).getDocument()
    return snapshot.exists
}
```

**Setup Requirements:**

1. **Add Google Sign-In SDK** via Swift Package Manager:
   ```
   https://github.com/google/GoogleSignIn-iOS
   ```

2. **Configure URL Scheme** in `Info.plist`:
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
       <dict>
           <key>CFBundleURLSchemes</key>
           <array>
               <string>YOUR_REVERSED_CLIENT_ID</string>
           </array>
       </dict>
   </array>
   ```
   Replace `YOUR_REVERSED_CLIENT_ID` with value from `GoogleService-Info.plist`

3. **Add Google Sign-In Button** to LoginView:
   ```swift
   Button {
       Task {
           try? await authService.signInWithGoogle()
       }
   } label: {
       HStack {
           Image(systemName: "g.circle.fill")
           Text("Sign in with Google")
       }
   }
   .buttonStyle(.bordered)
   ```

---

## Sprint 2: Trades (Week 2)

### TradeService.swift

```swift
// Services/TradeService.swift
import FirebaseFirestore
import Observation

@Observable
@MainActor
class TradeService {
    var trades: [Trade] = []
    var isLoading = false
    var errorMessage: String?
    
    private let db = Firestore.firestore()
    private var listener: ListenerRegistration?
    
    // Listen to all open trades (real-time)
    func listenToTrades() {
        isLoading = true
        
        listener = db.collection("trades")
            .whereField("status", isEqualTo: "open")
            .order(by: "createdAt", descending: true)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self = self else { return }
                
                Task { @MainActor in
                    if let error = error {
                        self.errorMessage = error.localizedDescription
                        self.isLoading = false
                        return
                    }
                    
                    guard let documents = snapshot?.documents else {
                        self.isLoading = false
                        return
                    }
                    
                    self.trades = documents.compactMap { doc in
                        try? doc.data(as: Trade.self)
                    }
                    self.isLoading = false
                }
            }
    }
    
    // Create new trade
    func createTrade(
        title: String,
        description: String,
        category: String,
        offeredSkills: [TradeSkill],
        requestedSkills: [TradeSkill],
        creator: User
    ) async throws {
        let trade = Trade(
            title: title,
            description: description,
            creatorId: creator.uid,
            creatorName: creator.displayName,
            creatorPhotoURL: creator.photoURL,
            category: category,
            skillsOffered: offeredSkills,
            skillsWanted: requestedSkills,
            offeredSkills: offeredSkills,
            requestedSkills: requestedSkills,
            status: .open,
            createdAt: Timestamp(),
            updatedAt: Timestamp()
        )
        
        try db.collection("trades").addDocument(from: trade)
    }
    
    // Get single trade
    func getTrade(id: String) async throws -> Trade {
        let snapshot = try await db.collection("trades").document(id).getDocument()
        return try snapshot.data(as: Trade.self)
    }
    
    // Stop listening
    func stopListening() {
        listener?.remove()
        listener = nil
    }
    
    deinit {
        stopListening()
    }
}
```

### Trades List View

```swift
// Views/Trades/TradesListView.swift
import SwiftUI

struct TradesListView: View {
    @State private var tradeService = TradeService()
    @Environment(AuthService.self) private var authService
    @State private var showingCreateTrade = false
    
    var body: some View {
        NavigationStack {
            Group {
                if tradeService.isLoading && tradeService.trades.isEmpty {
                    ProgressView("Loading trades...")
                } else if tradeService.trades.isEmpty {
                    ContentUnavailableView(
                        "No Trades Yet",
                        systemImage: "arrow.triangle.2.circlepath",
                        description: Text("Be the first to create a trade!")
                    )
                } else {
                    List(tradeService.trades) { trade in
                        NavigationLink(value: trade) {
                            TradeCard(trade: trade)
                        }
                        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Trades")
            .navigationDestination(for: Trade.self) { trade in
                TradeDetailView(trade: trade)
            }
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingCreateTrade = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                    }
                }
            }
            .sheet(isPresented: $showingCreateTrade) {
                CreateTradeView()
            }
        }
        .onAppear {
            tradeService.listenToTrades()
        }
    }
}

struct TradeCard: View {
    let trade: Trade
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Creator info
            HStack(spacing: 12) {
                AsyncImage(url: URL(string: trade.creatorPhotoURL ?? "")) { image in
                    image
                        .resizable()
                        .scaledToFill()
                } placeholder: {
                    Circle()
                        .fill(Color.gray.opacity(0.3))
                        .overlay {
                            Image(systemName: "person.fill")
                                .foregroundColor(.white)
                        }
                }
                .frame(width: 40, height: 40)
                .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(trade.title)
                        .font(.headline)
                    Text(trade.creatorName ?? "Unknown")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Description
            Text(trade.description)
                .font(.body)
                .lineLimit(2)
                .foregroundColor(.secondary)
            
            // Skills
            HStack(spacing: 8) {
                ForEach(trade.offeredSkills.prefix(2), id: \.name) { skill in
                    SkillTag(skill: skill, color: .orange)
                }
                
                Image(systemName: "arrow.right")
                    .foregroundColor(.secondary)
                
                ForEach(trade.requestedSkills.prefix(2), id: \.name) { skill in
                    SkillTag(skill: skill, color: .blue)
                }
            }
        }
        .padding(.vertical, 8)
    }
}

struct SkillTag: View {
    let skill: TradeSkill
    let color: Color
    
    var body: some View {
        Text(skill.name)
            .font(.caption)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(color.opacity(0.1))
            .foregroundColor(color)
            .cornerRadius(8)
    }
}
```

---

## Design System

### Phase 1: Clean Native iOS (MVP)

Use these design tokens from your web app:

```swift
// Utilities/Constants.swift

struct DesignTokens {
    
    // MARK: - Colors (from tailwind.config.ts)
    
    struct Colors {
        // Primary brand color (orange)
        static let primary = Color(hex: "#f97316")        // orange-500
        static let primaryHover = Color(hex: "#ea580c")   // orange-600
        
        // Secondary color (blue)
        static let secondary = Color(hex: "#0ea5e9")      // sky-500
        
        // Accent color (purple)
        static let accent = Color(hex: "#8b5cf6")         // violet-500
        
        // Semantic colors
        static let success = Color(hex: "#22c55e")        // green-500
        static let warning = Color(hex: "#f59e0b")        // amber-500
        static let error = Color(hex: "#ef4444")          // red-500
        
        // Neutral colors (adapt to light/dark mode)
        static let background = Color(.systemBackground)
        static let secondaryBackground = Color(.secondarySystemBackground)
        static let cardBackground = Color(.systemGray6)
    }
    
    // MARK: - Spacing
    
    struct Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
    }
    
    // MARK: - Corner Radius
    
    struct CornerRadius {
        static let small: CGFloat = 8
        static let medium: CGFloat = 12
        static let large: CGFloat = 16
        static let card: CGFloat = 16
    }
    
    // MARK: - Shadows
    
    struct Shadows {
        static let small = Color.black.opacity(0.1)
        static let medium = Color.black.opacity(0.15)
        static let large = Color.black.opacity(0.2)
    }
}

// Color extension for hex support
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
```

### Phase 2: Glassmorphic Polish (Post-MVP)

Apply after MVP is functioning:

```swift
// Utilities/GlassmorphicModifiers.swift

struct GlassCard: ViewModifier {
    var blur: CGFloat = 20
    var opacity: Double = 0.7
    
    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.card)
                    .fill(.ultraThinMaterial)
                    .opacity(opacity)
            )
            .overlay {
                RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.card)
                    .stroke(Color.white.opacity(0.2), lineWidth: 1)
            }
            .shadow(color: DesignTokens.Shadows.medium, radius: 10, x: 0, y: 5)
    }
}

extension View {
    func glassCard(blur: CGFloat = 20, opacity: Double = 0.7) -> some View {
        modifier(GlassCard(blur: blur, opacity: opacity))
    }
}
```

---

## Testing Strategy

### Manual Testing Checklist

Test each feature against web app:

**Authentication:**
- [ ] Sign up creates user in Firestore `users` collection
- [ ] Login persists across app restarts
- [ ] Profile data matches web app structure
- [ ] Sign out clears user session

**Trades:**
- [ ] Browse shows same trades as web app
- [ ] Real-time updates work (create trade on web, see on iOS)
- [ ] Create trade form validates correctly
- [ ] Trade detail shows all information

**Messaging:**
- [ ] Conversations list shows correct order
- [ ] Messages appear in real-time
- [ ] Send message updates `lastMessage` in conversation
- [ ] Read receipts work (if implemented)

**Profile:**
- [ ] Profile displays correct user data
- [ ] Edit profile updates Firestore
- [ ] Image upload works (Firebase Storage)

### Unit Testing

```swift
// Example: Test Trade model Codable conformance
import XCTest
@testable import TradeYa

final class TradeModelTests: XCTestCase {
    func testTradeDecoding() throws {
        let json = """
        {
            "title": "iOS dev for design",
            "description": "Exchange skills",
            "creatorId": "user123",
            "category": "tech",
            "skillsOffered": [{"name": "Swift", "level": "advanced"}],
            "skillsWanted": [{"name": "Figma", "level": "intermediate"}],
            "offeredSkills": [{"name": "Swift", "level": "advanced"}],
            "requestedSkills": [{"name": "Figma", "level": "intermediate"}],
            "status": "open",
            "createdAt": {"seconds": 1234567890, "nanoseconds": 0},
            "updatedAt": {"seconds": 1234567890, "nanoseconds": 0}
        }
        """.data(using: .utf8)!
        
        let trade = try JSONDecoder().decode(Trade.self, from: json)
        XCTAssertEqual(trade.title, "iOS dev for design")
        XCTAssertEqual(trade.status, .open)
    }
}
```

---

## Deployment Guide

### TestFlight Beta Testing

1. **Archive Build:**
   - Xcode > Product > Archive
   - Select archive > Distribute App > App Store Connect

2. **Upload to App Store Connect:**
   - Sign in to [App Store Connect](https://appstoreconnect.apple.com)
   - My Apps > TradeYa > TestFlight tab
   - Add build when processing completes (~5-10 minutes)

3. **Add Beta Testers:**
   - Internal Testing (up to 100 team members)
   - External Testing (up to 10,000 testers, requires beta review)

### App Store Submission

**Requirements:**
- [ ] App icon (1024×1024 PNG)
- [ ] Screenshots - See [Apple's latest requirements](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/)
  - iPhone 15 Pro Max (6.7") - Required
  - iPhone 15 Pro (6.1") - Optional but recommended
  - iPad Pro (12.9") - If supporting iPad
- [ ] Privacy Policy URL (required)
- [ ] App description and keywords
- [ ] Age rating questionnaire
- [ ] Support URL (recommended)
- [ ] Marketing URL (optional)

**Submission Steps:**
1. Complete app information in App Store Connect
2. Submit for review (typically 24-48 hours)
3. Monitor status in App Store Connect

---

## Troubleshooting

### Firebase Authentication Issues

**Problem:** User not persisting after app restart  
**Solution:** Check `auth.currentUser` in AppDelegate/SceneDelegate

**Problem:** Google Sign-In crashes  
**Solution:** Verify URL schemes in Info.plist match `GoogleService-Info.plist`

### Firestore Permission Errors

**Problem:** "Missing or insufficient permissions"  
**Solution:** Your web app's Firestore rules already handle this. Ensure user is authenticated before queries.

**Problem:** Real-time listener not updating  
**Solution:** Check listener is added in `onAppear` and removed in `onDisappear`

### Common Build Errors

**Problem:** "No such module 'Firebase...'"  
**Solution:** File > Packages > Resolve Package Versions

**Problem:** "GoogleService-Info.plist not found"  
**Solution:** Ensure file is in project root and added to target

---

## Reference Resources

### Firebase Documentation
- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- [Firestore iOS Guide](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Auth iOS](https://firebase.google.com/docs/auth/ios/start)

### SwiftUI Learning
- [Apple SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
- [Hacking with Swift](https://www.hackingwithswift.com/quick-start/swiftui)
- [Stanford CS193p](https://cs193p.sites.stanford.edu/)

### Web App Cross-Reference

When implementing features, reference these web app files:

- **Data Models:** `src/services/firestore.ts` (lines 466-544)
- **Auth Logic:** `src/services/entities/UserService.ts`
- **Trade Queries:** `src/services/entities/TradeService.ts`
- **Message Service:** `src/services/chat/chatService.ts`
- **Design Tokens:** `tailwind.config.ts` (lines 115-375)

---

## Post-MVP Roadmap

> **Note:** This section is for planning purposes only. Focus on completing the MVP first before tackling these advanced features. This roadmap helps you make architectural decisions today that won't require major refactoring later.

### Phase 3: Enhanced Features (Weeks 7-10)

**Once MVP is stable and tested, add these features one at a time:**

#### 1. Push Notifications (1 week)
**Why:** Keep users engaged with real-time alerts

**Implementation:**
- Firebase Cloud Messaging integration
- Notification permissions handling
- Deep linking from notifications
- Badge count management

**Architectural Note:** Design your notification service to handle multiple notification types from day 1 (trades, messages, gamification).

```swift
// Services/NotificationService.swift
@Observable
@MainActor
class NotificationService {
    func requestPermissions() async throws { }
    func registerForRemoteNotifications() async throws { }
    func handleNotification(_ notification: UNNotification) { }
}
```

---

#### 2. Trade Proposals (1 week)
**Why:** Formalize the trade negotiation process

**What Changes:**
- Add `TradeProposal` model (already exists in web app)
- Proposal submission flow
- Accept/reject proposals
- Notification integration

**Web App Reference:** `src/services/firestore.ts` lines 531-544

**Firestore Collection:** `proposals` (create new)

---

#### 3. Search & Advanced Filters (1 week)
**Why:** Help users find relevant trades quickly

**Implementation:**
- Search by skill name
- Filter by category, location, skill level
- Sort options (newest, most relevant)
- Search history (UserDefaults)

**Note:** iOS native search works great. Consider Algolia only if you need fuzzy search across thousands of trades.

---

#### 4. Image Uploads (1 week)
**Why:** Users can showcase their work

**Implementation:**
- Firebase Storage integration
- Photo picker for profiles and trades
- Image compression (before upload)
- Progress indicators

```swift
// Services/StorageService.swift
func uploadImage(_ image: UIImage, path: String) async throws -> String {
    // Returns download URL
}
```

---

### Phase 4: Gamification (Weeks 11-14)

**Why:** Matches your web app's engagement system

**Features to Add:**

#### XP & Leveling System
- Track XP in user profile
- Award XP for actions (complete trade, helpful review)
- Level-up animations
- Progress bars

**Web App Reference:** `src/services/gamification.ts`

#### Achievements
- Badge collection UI
- Achievement unlock animations
- Share achievements (iOS Share Sheet)

#### Streaks
- Daily login tracking
- Streak preservation logic
- Visual streak indicators

**Architectural Note:** Use `@Observable` class for gamification state to automatically update UI when XP/achievements change.

---

### Phase 5: Skill Challenges (Weeks 15-18)

**Why:** Core differentiator of TradeYa platform

**Three-Tier System:** (matches web app)

1. **Solo Challenges** - Individual skill building
2. **Trade Challenges** - 1-on-1 skill exchanges  
3. **Collaboration Challenges** - Team projects

**Implementation Strategy:**
- Reuse Trade/Collaboration models where possible
- Add `challengeId` field to link trades to challenges
- Challenge discovery feed (similar to Trades list)
- Progress tracking with milestones

**Web App Reference:** `docs/CHALLENGE_SYSTEM_IMPLEMENTATION_PLAN.md`

**Key iOS Considerations:**
- Rich notifications for challenge milestones
- Calendar integration for deadlines
- Widgets showing active challenges (iOS 17+)

---

### Phase 6: Collaborations (Weeks 19-22)

**Why:** Multi-person project management

**Features:**
- Team creation and invites
- Role-based permissions
- Collaboration chat (extends existing messaging)
- File sharing (Firebase Storage)
- Project milestones

**Web App Reference:** `src/services/collaboration.ts`

**Architectural Note:** Collaboration is essentially a Trade with multiple participants. Consider extending `Trade` model vs creating separate `Collaboration` model.

---

### Phase 7: Glassmorphic Polish (Weeks 23-24)

**Why:** Match web app's premium aesthetic

**Apply these refinements:**

```swift
// Enhanced glassmorphic effects
struct PremiumCard: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial)
            .overlay {
                RoundedRectangle(cornerRadius: 20)
                    .stroke(
                        LinearGradient(
                            colors: [.white.opacity(0.3), .white.opacity(0.1)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            }
            .shadow(color: .black.opacity(0.1), radius: 20, y: 10)
    }
}
```

**Design Enhancements:**
- Animated gradients on cards
- Particle effects (confetti on achievements)
- Smooth micro-interactions
- Custom fonts (from web app)
- 3D transforms on card hovers (iOS 17+ hover effects)

**Web App Reference:** `tailwind.config.ts` animations (lines 251-357)

---

### Technical Debt Prevention

**As you build post-MVP features, keep these in mind:**

1. **Modular Services:** Each feature should have its own service class
2. **Shared Components:** Build reusable SwiftUI components (cards, buttons, forms)
3. **Consistent Error Handling:** Use Result types or unified error service
4. **Performance:** Profile with Instruments after each major feature
5. **Testing:** Add unit tests for business logic, UI tests for critical flows

---

### When to Add Each Feature

**Priority Matrix:**

| Feature | User Impact | Complexity | Priority |
|---------|-------------|------------|----------|
| Push Notifications | HIGH | Medium | 🔴 Phase 3 |
| Trade Proposals | HIGH | Low | 🔴 Phase 3 |
| Search/Filters | HIGH | Low | 🔴 Phase 3 |
| Image Uploads | MEDIUM | Medium | 🟡 Phase 3 |
| XP/Achievements | MEDIUM | Medium | 🟡 Phase 4 |
| Streaks | MEDIUM | Low | 🟡 Phase 4 |
| Challenges | HIGH | High | 🟢 Phase 5 |
| Collaborations | HIGH | High | 🟢 Phase 6 |
| Glassmorphic Polish | LOW | Medium | 🔵 Phase 7 |

**Recommended Order:**
1. Get MVP to 100% feature parity with web app
2. Add Phase 3 features (notifications, proposals, search)
3. Add gamification (Phase 4) - drives engagement
4. Add challenges (Phase 5) - unique value proposition
5. Add collaborations (Phase 6) - expand use cases
6. Polish UI (Phase 7) - final 10% that makes 90% difference

---

### Architecture Decisions for Future Features

**Design patterns to use NOW that will help LATER:**

1. **Protocol-Oriented Services:** Define protocols for services so you can mock them in tests
   ```swift
   protocol TradeServiceProtocol {
       func createTrade(...) async throws -> Trade
       func listenToTrades()
   }
   ```

2. **Dependency Injection:** Pass services to views via environment
   ```swift
   .environment(TradeService())
   .environment(GamificationService())
   ```

3. **Feature Flags:** Use UserDefaults or remote config to toggle features
   ```swift
   struct FeatureFlags {
       static var challengesEnabled: Bool {
           UserDefaults.standard.bool(forKey: "challenges_enabled")
       }
   }
   ```

4. **Modular View Structure:** Each feature in its own folder
   ```
   Views/
   ├── Trades/
   ├── Challenges/
   ├── Gamification/
   └── Collaborations/
   ```

---

### Resources for Future Features

**Firebase Cloud Messaging:**
- [Firebase iOS Push Notifications](https://firebase.google.com/docs/cloud-messaging/ios/client)

**Image Handling:**
- [Firebase Storage iOS Guide](https://firebase.google.com/docs/storage/ios/start)
- [Swift Image Compression](https://developer.apple.com/documentation/uikit/uiimage/1624096-jpegdata)

**Gamification:**
- [iOS GameKit Framework](https://developer.apple.com/documentation/gamekit) (for achievements/leaderboards)
- Web app's gamification service as reference

**Widgets:**
- [iOS 17 Widgets](https://developer.apple.com/documentation/widgetkit) (for challenge progress)

---

## Next Steps After MVP

**Immediate Actions (Post-MVP):**

1. ✅ **Celebrate!** Your team built a production iOS app
2. 📊 **Gather Analytics** - Track which features users engage with most
3. 🐛 **Fix Critical Bugs** - Address any issues from beta testing
4. 📱 **Submit to App Store** - Get approved (typically 24-48 hours)
5. 👥 **Get User Feedback** - TestFlight beta, early adopters
6. 🎯 **Prioritize Phase 3** - Based on user requests and data
7. 🔄 **Iterate** - Add features incrementally, test thoroughly

**Success Metrics to Track:**

- Daily Active Users (DAU)
- Trade completion rate
- Message response time
- User retention (Day 1, Day 7, Day 30)
- App Store rating
- Crash-free rate (aim for 99.5%+)

Use these metrics to decide which Phase 3+ features to prioritize.

---

## Version History

- **v1.1** (January 2025) - Added Post-MVP Roadmap, Google Sign-In implementation, ViewModels clarification, updated screenshot requirements
- **v1.0** (January 2025) - Initial guide, MVP focus

---

**Questions or Issues?** Reference the web app implementation in `/src` directory or consult Firebase documentation.

**Ready to Start?** Begin with Project Setup, then work through features sprint-by-sprint. Test each feature against the web app before moving to the next.

