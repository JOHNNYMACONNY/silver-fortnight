# TradeYa Native iOS Swift Migration - Comprehensive Guide

**Version:** 1.0  
**Last Updated:** October 21, 2025  
**Target Platform:** iOS 17.0+  
**Swift Version:** 5.9+

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Migration Strategy Overview](#migration-strategy-overview)
3. [Technical Architecture](#technical-architecture)
4. [Project Setup](#project-setup)
5. [Data Models Migration](#data-models-migration)
6. [Firebase Integration](#firebase-integration)
7. [Service Layer Implementation](#service-layer-implementation)
8. [SwiftUI Views & Components](#swiftui-views--components)
9. [Feature-by-Feature Migration](#feature-by-feature-migration)
10. [Testing Strategy](#testing-strategy)
11. [Deployment & Distribution](#deployment--distribution)
12. [Timeline & Resources](#timeline--resources)
13. [Code Examples & Patterns](#code-examples--patterns)
14. [Best Practices & Recommendations](#best-practices--recommendations)

---

## Executive Summary

### Project Overview

This guide provides a complete roadmap for migrating **TradeYa** from a React/TypeScript web application to a native iOS application built with Swift and SwiftUI.

**Current Tech Stack:**
- React 18.3.1 + TypeScript 5.9
- Firebase (Auth, Firestore, Storage, Functions)
- Vite build system
- TailwindCSS + Framer Motion
- ~805 source files, 460+ React components

**Target Tech Stack:**
- Swift 5.9+ with SwiftUI
- Firebase iOS SDK 10.0+
- Xcode 15+
- iOS 17.0+ deployment target
- Native iOS frameworks (Combine, async/await)

### Key Metrics

| Metric | Current (Web) | Target (iOS) |
|--------|--------------|--------------|
| Codebase Size | ~805 files | ~400-500 files |
| Code Reusability | 0% (full rewrite) | N/A |
| Development Time | N/A | 6-12 months |
| Team Size | N/A | 2-4 developers |
| Estimated Cost | N/A | $250k-$400k |

### Migration Benefits

✅ **Native Performance:** 2-3x faster UI rendering  
✅ **Better UX:** Native iOS patterns and gestures  
✅ **Offline Support:** CoreData + Firestore persistence  
✅ **Push Notifications:** APNs integration  
✅ **App Store Presence:** Direct access to iOS users  
✅ **System Integration:** Widgets, Shortcuts, Siri  
✅ **Battery Efficiency:** Native power management  

---

## Migration Strategy Overview

### Approach: Complete Native Rewrite

We recommend a **complete native rewrite** over hybrid approaches (React Native, Capacitor) for the following reasons:

1. **Best Performance:** Native Swift provides optimal performance for complex features
2. **Future-Proof:** Full access to latest iOS features and APIs
3. **Better Debugging:** Native tools (Xcode, Instruments)
4. **Team Growth:** Build iOS expertise internally
5. **Long-term Maintenance:** Single codebase per platform

### Phased Migration Strategy

```
Phase 1: Foundation (Weeks 1-4)
├── Project setup & Firebase integration
├── Core data models
├── Authentication system
└── Basic navigation

Phase 2: Core Features (Weeks 5-12)
├── Trade system (create, browse, accept)
├── User profiles & portfolios
├── Real-time messaging
└── Basic search & filtering

Phase 3: Advanced Features (Weeks 13-20)
├── Gamification (XP, achievements, leaderboards)
├── Challenge system (3-tier progression)
├── Collaboration workflows
└── Evidence submission & galleries

Phase 4: Polish & Testing (Weeks 21-26)
├── UI/UX refinements
├── Performance optimization
├── Comprehensive testing
├── Beta program
└── App Store submission
```

---

## Technical Architecture

### MVVM Architecture Pattern

TradeYa iOS will use the **Model-View-ViewModel (MVVM)** pattern, which is the standard for SwiftUI applications.

```
┌─────────────────────────────────────────┐
│           SwiftUI Views                 │
│  (User Interface, Declarative)          │
└──────────────┬──────────────────────────┘
               │ Observes @Published
               │ properties
┌──────────────▼──────────────────────────┐
│          ViewModels                     │
│  (Presentation Logic, State Management) │
└──────────────┬──────────────────────────┘
               │ Calls methods
               │
┌──────────────▼──────────────────────────┐
│           Services                      │
│  (Business Logic, Firebase Integration) │
└──────────────┬──────────────────────────┘
               │ Reads/Writes
               │
┌──────────────▼──────────────────────────┐
│           Models                        │
│  (Data Structures, Codable)             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Firebase Backend                │
│  (Auth, Firestore, Storage, Functions)  │
└─────────────────────────────────────────┘
```

### Project Structure

```
TradeYa-iOS/
├── App/
│   ├── TradeYaApp.swift              // App entry point
│   ├── AppDelegate.swift             // Firebase configuration
│   └── AppEnvironment.swift          // Environment setup
│
├── Models/
│   ├── Trade/
│   │   ├── Trade.swift
│   │   ├── TradeSkill.swift
│   │   └── TradeStatus.swift
│   ├── User/
│   │   ├── User.swift
│   │   └── UserRole.swift
│   ├── Chat/
│   │   ├── ChatMessage.swift
│   │   ├── ChatConversation.swift
│   │   └── ChatParticipant.swift
│   ├── Collaboration/
│   │   ├── Collaboration.swift
│   │   ├── CollaborationRole.swift
│   │   └── RoleApplication.swift
│   ├── Gamification/
│   │   ├── UserXP.swift
│   │   ├── Achievement.swift
│   │   ├── Leaderboard.swift
│   │   └── UserStreak.swift
│   ├── Challenge/
│   │   ├── Challenge.swift
│   │   ├── UserChallenge.swift
│   │   └── ChallengeSubmission.swift
│   └── Portfolio/
│       ├── PortfolioItem.swift
│       └── EmbeddedEvidence.swift
│
├── Services/
│   ├── Firebase/
│   │   ├── FirebaseManager.swift     // Singleton manager
│   │   ├── AuthService.swift         // Authentication
│   │   ├── FirestoreService.swift    // Base Firestore ops
│   │   └── StorageService.swift      // File uploads
│   ├── TradeService.swift            // Trade operations
│   ├── UserService.swift             // User management
│   ├── ChatService.swift             // Messaging
│   ├── CollaborationService.swift    // Collaboration workflows
│   ├── GamificationService.swift     // XP & achievements
│   ├── ChallengeService.swift        // Challenge system
│   ├── LeaderboardService.swift      // Rankings
│   ├── NotificationService.swift     // Push notifications
│   └── AnalyticsService.swift        // Analytics tracking
│
├── ViewModels/
│   ├── Auth/
│   │   └── AuthViewModel.swift
│   ├── Trades/
│   │   ├── TradeListViewModel.swift
│   │   ├── TradeDetailViewModel.swift
│   │   └── CreateTradeViewModel.swift
│   ├── Profile/
│   │   ├── ProfileViewModel.swift
│   │   └── PortfolioViewModel.swift
│   ├── Chat/
│   │   ├── ConversationListViewModel.swift
│   │   └── ChatViewModel.swift
│   ├── Gamification/
│   │   ├── GamificationViewModel.swift
│   │   └── LeaderboardViewModel.swift
│   └── Challenges/
│       ├── ChallengeListViewModel.swift
│       └── ChallengeDetailViewModel.swift
│
├── Views/
│   ├── Root/
│   │   ├── ContentView.swift         // Main tab navigation
│   │   └── SplashView.swift
│   ├── Auth/
│   │   ├── LoginView.swift
│   │   ├── SignUpView.swift
│   │   └── ForgotPasswordView.swift
│   ├── Trades/
│   │   ├── TradeListView.swift
│   │   ├── TradeDetailView.swift
│   │   ├── CreateTradeView.swift
│   │   └── TradeFilterView.swift
│   ├── Profile/
│   │   ├── ProfileView.swift
│   │   ├── EditProfileView.swift
│   │   ├── PortfolioView.swift
│   │   └── SettingsView.swift
│   ├── Chat/
│   │   ├── ConversationListView.swift
│   │   ├── ChatView.swift
│   │   └── ChatDetailView.swift
│   ├── Challenges/
│   │   ├── ChallengeListView.swift
│   │   ├── ChallengeDetailView.swift
│   │   ├── ChallengeSubmissionView.swift
│   │   └── ThreeTierProgressView.swift
│   ├── Collaboration/
│   │   ├── CollaborationListView.swift
│   │   ├── CollaborationDetailView.swift
│   │   └── RoleManagementView.swift
│   ├── Gamification/
│   │   ├── GamificationDashboardView.swift
│   │   ├── LeaderboardView.swift
│   │   ├── AchievementsView.swift
│   │   └── StreakView.swift
│   └── Components/
│       ├── TradeCard.swift
│       ├── UserAvatar.swift
│       ├── SkillPill.swift
│       ├── MessageBubble.swift
│       ├── LoadingView.swift
│       ├── EmptyStateView.swift
│       └── ErrorView.swift
│
├── Utilities/
│   ├── Extensions/
│   │   ├── Color+Extensions.swift
│   │   ├── Date+Extensions.swift
│   │   ├── String+Extensions.swift
│   │   └── View+Extensions.swift
│   ├── Helpers/
│   │   ├── ImageCache.swift
│   │   ├── DateFormatter+Helpers.swift
│   │   └── ValidationHelpers.swift
│   ├── Constants.swift               // App-wide constants
│   └── Theme.swift                   // Design system
│
├── Resources/
│   ├── Assets.xcassets               // Images, colors
│   ├── Localizable.strings           // i18n strings
│   ├── GoogleService-Info.plist      // Firebase config
│   └── Info.plist
│
└── Tests/
    ├── UnitTests/
    │   ├── ModelTests/
    │   ├── ServiceTests/
    │   └── ViewModelTests/
    ├── UITests/
    │   └── TradeYaUITests.swift
    └── IntegrationTests/
        └── FirebaseIntegrationTests.swift
```

---

## Project Setup

### Prerequisites

1. **Development Environment:**
   - macOS Ventura (13.0) or later
   - Xcode 15.0 or later
   - Swift 5.9 or later
   - iOS 17.0+ device or simulator

2. **Apple Developer Account:**
   - Individual or Organization account ($99/year)
   - Required for App Store distribution
   - Needed for push notifications

3. **Firebase Configuration:**
   - Use existing Firebase project
   - Download iOS `GoogleService-Info.plist`
   - Enable iOS platform in Firebase Console

### Step 1: Create Xcode Project

```bash
# Open Xcode
# File > New > Project
# Choose "iOS" > "App"
# Product Name: TradeYa
# Organization Identifier: com.yourcompany.tradeya
# Interface: SwiftUI
# Language: Swift
# Storage: None (we'll use Firebase)
```

### Step 2: Configure Firebase iOS SDK

**Using Swift Package Manager (Recommended):**

```swift
// In Xcode:
// File > Add Package Dependencies
// Enter URL: https://github.com/firebase/firebase-ios-sdk
// Version: 11.0.0 or later

// Add these products:
- FirebaseAuth
- FirebaseFirestore
- FirebaseFirestoreSwift
- FirebaseStorage
- FirebaseFunctions
- FirebaseMessaging
- FirebaseAnalytics
```

**Package.swift configuration:**

```swift
// Package.swift
import PackageDescription

let package = Package(
    name: "TradeYa",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(name: "TradeYa", targets: ["TradeYa"])
    ],
    dependencies: [
        .package(
            url: "https://github.com/firebase/firebase-ios-sdk",
            from: "11.0.0"
        )
    ],
    targets: [
        .target(
            name: "TradeYa",
            dependencies: [
                .product(name: "FirebaseAuth", package: "firebase-ios-sdk"),
                .product(name: "FirebaseFirestore", package: "firebase-ios-sdk"),
                .product(name: "FirebaseFirestoreSwift", package: "firebase-ios-sdk"),
                .product(name: "FirebaseStorage", package: "firebase-ios-sdk"),
                .product(name: "FirebaseFunctions", package: "firebase-ios-sdk"),
                .product(name: "FirebaseMessaging", package: "firebase-ios-sdk"),
            ]
        )
    ]
)
```

### Step 3: Initialize Firebase

**AppDelegate.swift:**

```swift
import UIKit
import FirebaseCore
import FirebaseMessaging
import UserNotifications

class AppDelegate: NSObject, UIApplicationDelegate {
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
    ) -> Bool {
        
        // Configure Firebase
        FirebaseApp.configure()
        
        // Request notification permissions
        UNUserNotificationCenter.current().delegate = self
        
        let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
        UNUserNotificationCenter.current().requestAuthorization(
            options: authOptions,
            completionHandler: { _, _ in }
        )
        
        application.registerForRemoteNotifications()
        
        // Set messaging delegate
        Messaging.messaging().delegate = self
        
        return true
    }
    
    // Handle device token registration
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        Messaging.messaging().apnsToken = deviceToken
    }
}

// MARK: - UNUserNotificationCenterDelegate
extension AppDelegate: UNUserNotificationCenterDelegate {
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([[.banner, .sound]])
    }
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        // Handle notification tap
        completionHandler()
    }
}

// MARK: - MessagingDelegate
extension AppDelegate: MessagingDelegate {
    
    func messaging(
        _ messaging: Messaging,
        didReceiveRegistrationToken fcmToken: String?
    ) {
        guard let token = fcmToken else { return }
        print("FCM Token: \(token)")
        // Store token in Firestore user document
    }
}
```

**TradeYaApp.swift:**

```swift
import SwiftUI
import FirebaseCore

@main
struct TradeYaApp: App {
    
    // Register app delegate for Firebase setup
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    
    // Global state
    @StateObject private var authViewModel = AuthViewModel()
    @StateObject private var themeManager = ThemeManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authViewModel)
                .environmentObject(themeManager)
                .preferredColorScheme(themeManager.colorScheme)
        }
    }
}
```

### Step 4: Add GoogleService-Info.plist

1. Download from Firebase Console (iOS app configuration)
2. Add to Xcode project root
3. Ensure it's included in target membership

### Step 5: Configure Info.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Camera access for profile photos -->
    <key>NSCameraUsageDescription</key>
    <string>TradeYa needs access to your camera to upload photos for your profile and evidence submissions.</string>
    
    <!-- Photo library access -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>TradeYa needs access to your photo library to upload images.</string>
    
    <!-- Location (optional, for trade location features) -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>TradeYa uses your location to show nearby trade opportunities.</string>
    
    <!-- Allow arbitrary loads for user-uploaded images -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoadsInWebContent</key>
        <true/>
    </dict>
</dict>
</plist>
```

---

## Data Models Migration

### Base Protocols

**Identifiable Protocol (Built-in):**

```swift
// All models conform to Identifiable for SwiftUI List/ForEach
public protocol Identifiable {
    associatedtype ID: Hashable
    var id: ID { get }
}
```

**Timestampable Protocol (Custom):**

```swift
import Foundation
import FirebaseFirestore

protocol Timestampable {
    var createdAt: Timestamp? { get set }
    var updatedAt: Timestamp? { get set }
}
```

### Trade Models

**Models/Trade/TradeStatus.swift:**

```swift
import Foundation

enum TradeStatus: String, Codable, CaseIterable {
    case open
    case inProgress = "in-progress"
    case pendingConfirmation = "pending_confirmation"
    case pendingEvidence = "pending_evidence"
    case completed
    case cancelled
    case disputed
    
    var displayName: String {
        switch self {
        case .open: return "Open"
        case .inProgress: return "In Progress"
        case .pendingConfirmation: return "Pending Confirmation"
        case .pendingEvidence: return "Pending Evidence"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        case .disputed: return "Disputed"
        }
    }
    
    var systemImage: String {
        switch self {
        case .open: return "doc.text"
        case .inProgress: return "arrow.triangle.2.circlepath"
        case .pendingConfirmation: return "clock"
        case .pendingEvidence: return "photo.on.rectangle"
        case .completed: return "checkmark.circle.fill"
        case .cancelled: return "xmark.circle"
        case .disputed: return "exclamationmark.triangle"
        }
    }
    
    var color: String {
        switch self {
        case .open: return "blue"
        case .inProgress: return "orange"
        case .pendingConfirmation: return "yellow"
        case .pendingEvidence: return "purple"
        case .completed: return "green"
        case .cancelled: return "gray"
        case .disputed: return "red"
        }
    }
}
```

**Models/Trade/TradeSkill.swift:**

```swift
import Foundation

enum SkillLevel: String, Codable, CaseIterable {
    case beginner
    case intermediate
    case advanced
    case expert
    
    var displayName: String {
        rawValue.capitalized
    }
    
    var emoji: String {
        switch self {
        case .beginner: return "🌱"
        case .intermediate: return "🌿"
        case .advanced: return "🌳"
        case .expert: return "⭐"
        }
    }
}

struct TradeSkill: Codable, Identifiable, Hashable {
    let id: UUID
    let name: String
    let level: SkillLevel
    var category: String?
    var description: String?
    
    // Default initializer
    init(
        id: UUID = UUID(),
        name: String,
        level: SkillLevel,
        category: String? = nil,
        description: String? = nil
    ) {
        self.id = id
        self.name = name
        self.level = level
        self.category = category
        self.description = description
    }
    
    // Coding keys (exclude auto-generated ID from Firestore)
    enum CodingKeys: String, CodingKey {
        case name, level, category, description
    }
}
```

**Models/Trade/Trade.swift:**

```swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

struct Trade: Codable, Identifiable, Timestampable {
    // Firestore document ID
    @DocumentID var id: String?
    
    // Basic Information
    let title: String
    let description: String
    
    // Skills
    let skillsOffered: [TradeSkill]
    let skillsWanted: [TradeSkill]
    var skillsIndex: [String]? // Normalized for search
    
    // Creator Information
    let creatorId: String
    var creatorName: String?
    var creatorPhotoURL: String?
    
    // Participant Information
    var participantId: String?
    var participantName: String?
    var participantPhotoURL: String?
    
    // Status
    var status: TradeStatus
    
    // Location
    var location: String?
    var isRemote: Bool?
    
    // Details
    var timeCommitment: String?
    var category: String?
    var tags: [String]?
    var images: [String]?
    var requirements: String?
    var deliverables: String?
    var timeline: String?
    var compensation: String?
    
    // Visibility
    var visibility: TradeVisibility
    
    // Timestamps
    @ServerTimestamp var createdAt: Timestamp?
    @ServerTimestamp var updatedAt: Timestamp?
    var completedAt: Timestamp?
    
    // Computed properties
    var isOpen: Bool {
        status == .open
    }
    
    var isCompleted: Bool {
        status == .completed
    }
    
    var hasParticipant: Bool {
        participantId != nil
    }
}

enum TradeVisibility: String, Codable {
    case `public`
    case `private`
    case unlisted
}

// MARK: - Helpers
extension Trade {
    
    /// Generate skills index for search
    static func computeSkillsIndex(
        offered: [TradeSkill],
        wanted: [TradeSkill]
    ) -> [String] {
        let allSkills = offered + wanted
        let normalized = Set(allSkills.map { $0.name.lowercased().trimmingCharacters(in: .whitespaces) })
        return Array(normalized)
    }
    
    /// Check if user is creator
    func isCreator(userId: String) -> Bool {
        creatorId == userId
    }
    
    /// Check if user is participant
    func isParticipant(userId: String) -> Bool {
        participantId == userId
    }
    
    /// Check if user is involved in trade
    func isInvolved(userId: String) -> Bool {
        isCreator(userId: userId) || isParticipant(userId: userId)
    }
}
```

### User Models

**Models/User/UserRole.swift:**

```swift
import Foundation

enum UserRole: String, Codable {
    case user
    case admin
    case moderator
    
    var displayName: String {
        rawValue.capitalized
    }
    
    var canModerateContent: Bool {
        self == .admin || self == .moderator
    }
    
    var canAccessAdminPanel: Bool {
        self == .admin
    }
}
```

**Models/User/User.swift:**

```swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

struct User: Codable, Identifiable, Timestampable {
    @DocumentID var id: String?
    let uid: String
    
    // Basic Info
    var email: String?
    var displayName: String?
    var profilePicture: String?
    var photoURL: String?
    
    // Profile Details
    var bio: String?
    var location: String?
    var website: String?
    var interests: String?
    
    // Skills (can be refined based on actual structure)
    var skills: [String: Any]?
    
    // Reputation & Role
    var reputationScore: Int?
    var role: UserRole?
    
    // Privacy
    var isPublic: Bool?
    
    // Banner & FX
    var banner: String?
    var bannerFx: BannerFx?
    
    // Timestamps
    @ServerTimestamp var createdAt: Timestamp?
    @ServerTimestamp var updatedAt: Timestamp?
    
    // Coding keys
    enum CodingKeys: String, CodingKey {
        case id, uid, email, displayName, profilePicture, photoURL
        case bio, location, website, interests, skills
        case reputationScore, role
        case isPublic = "public"
        case banner, bannerFx
        case createdAt, updatedAt
    }
}

struct BannerFx: Codable {
    let enable: Bool
    let preset: BannerPreset
    let opacity: Double
    let blendMode: BlendMode
}

enum BannerPreset: String, Codable {
    case ribbons
    case aurora
    case metaballs
    case audio
}

enum BlendMode: String, Codable {
    case screen
    case softLight = "soft-light"
    case overlay
    case plusLighter = "plus-lighter"
}

// MARK: - Helpers
extension User {
    var displayPhotoURL: String? {
        photoURL ?? profilePicture
    }
    
    var displayNameOrEmail: String {
        displayName ?? email ?? "User"
    }
    
    var isAdmin: Bool {
        role == .admin
    }
    
    var isModerator: Bool {
        role == .moderator
    }
}
```

### Chat Models

**Models/Chat/MessageType.swift:**

```swift
import Foundation

enum MessageType: String, Codable {
    case text
    case image
    case file
    case system
    
    var systemImage: String {
        switch self {
        case .text: return "text.bubble"
        case .image: return "photo"
        case .file: return "doc"
        case .system: return "info.circle"
        }
    }
}

enum MessageStatus: String, Codable {
    case sending
    case sent
    case delivered
    case read
    case failed
    
    var displayName: String {
        rawValue.capitalized
    }
}
```

**Models/Chat/ChatMessage.swift:**

```swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

struct ChatAttachment: Codable, Identifiable, Hashable {
    let id: UUID
    let url: String
    let name: String
    var size: Int?
    var thumbnailUrl: String?
    var mimeType: String?
    
    init(
        id: UUID = UUID(),
        url: String,
        name: String,
        size: Int? = nil,
        thumbnailUrl: String? = nil,
        mimeType: String? = nil
    ) {
        self.id = id
        self.url = url
        self.name = name
        self.size = size
        self.thumbnailUrl = thumbnailUrl
        self.mimeType = mimeType
    }
    
    enum CodingKeys: String, CodingKey {
        case url, name, size, thumbnailUrl, mimeType
    }
}

struct ChatMessage: Codable, Identifiable, Timestampable {
    @DocumentID var id: String?
    
    let conversationId: String
    let senderId: String
    let senderName: String
    var senderAvatar: String?
    
    let content: String
    let type: MessageType
    
    // Timestamps
    @ServerTimestamp var createdAt: Timestamp?
    @ServerTimestamp var updatedAt: Timestamp?
    var editedAt: Timestamp?
    
    // Status
    var readBy: [String]
    var edited: Bool?
    var status: MessageStatus?
    
    // Attachments
    var attachments: [ChatAttachment]?
    
    // Schema
    var schemaVersion: String?
    
    // Computed properties
    var isRead: Bool {
        readBy.count > 1 // More than just sender
    }
    
    var timestamp: Date {
        createdAt?.dateValue() ?? Date()
    }
}

// MARK: - Helpers
extension ChatMessage {
    func isReadBy(userId: String) -> Bool {
        readBy.contains(userId)
    }
    
    func isSentBy(userId: String) -> Bool {
        senderId == userId
    }
}
```

**Models/Chat/ChatConversation.swift:**

```swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

enum ConversationType: String, Codable {
    case direct
    case group
    case trade
    case collaboration
    
    var systemImage: String {
        switch self {
        case .direct: return "person.2"
        case .group: return "person.3"
        case .trade: return "arrow.left.arrow.right"
        case .collaboration: return "person.3.sequence"
        }
    }
}

struct ChatParticipant: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    var photoURL: String?
    var lastReadTimestamp: Timestamp?
    
    enum CodingKeys: String, CodingKey {
        case id, name, photoURL, lastReadTimestamp
    }
}

struct ChatConversation: Codable, Identifiable, Timestampable {
    @DocumentID var id: String?
    
    var title: String?
    let type: ConversationType
    
    // Participants
    var participants: [ChatParticipant]
    var participantIds: [String]
    
    // Last Activity
    var lastMessage: String?
    var lastActivity: Timestamp?
    var messageCount: Int?
    var unreadCount: [String: Int]? // userId: count
    
    // Context
    var relatedTradeId: String?
    var relatedCollaborationId: String?
    
    // Timestamps
    @ServerTimestamp var createdAt: Timestamp?
    @ServerTimestamp var updatedAt: Timestamp?
    
    // Schema
    var schemaVersion: String
    
    // Legacy support
    var participants_legacy: [ChatParticipant]?
}

// MARK: - Helpers
extension ChatConversation {
    func unreadCount(for userId: String) -> Int {
        unreadCount?[userId] ?? 0
    }
    
    func hasUnread(for userId: String) -> Bool {
        unreadCount(for: userId) > 0
    }
    
    func otherParticipants(excludingUserId userId: String) -> [ChatParticipant] {
        participants.filter { $0.id != userId }
    }
    
    func displayTitle(for currentUserId: String) -> String {
        if let title = title, !title.isEmpty {
            return title
        }
        
        if type == .direct {
            return otherParticipants(excludingUserId: currentUserId)
                .first?.name ?? "Chat"
        }
        
        return "Group Chat"
    }
}
```

### Gamification Models

**Models/Gamification/UserXP.swift:**

```swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

struct UserXP: Codable, Identifiable {
    @DocumentID var id: String?
    let userId: String
    
    var totalXP: Int
    var currentLevel: Int
    var xpToNextLevel: Int
    
    var categoryXP: [String: Int]?
    
    @ServerTimestamp var lastUpdated: Timestamp?
    @ServerTimestamp var createdAt: Timestamp?
    
    // Computed properties
    var progressToNextLevel: Double {
        guard xpToNextLevel > 0 else { return 1.0 }
        let xpInCurrentLevel = totalXP - xpForLevel(currentLevel)
        return Double(xpInCurrentLevel) / Double(xpToNextLevel)
    }
    
    private func xpForLevel(_ level: Int) -> Int {
        // Implement level calculation logic
        // This should match your TypeScript LEVEL_TIERS logic
        return level * 1000 // Placeholder
    }
}

// XP Transaction for audit trail
struct XPTransaction: Codable, Identifiable {
    @DocumentID var id: String?
    
    let userId: String
    let amount: Int
    let source: XPSource
    var sourceId: String?
    var description: String?
    
    var previousTotal: Int
    var newTotal: Int
    var previousLevel: Int
    var newLevel: Int
    
    @ServerTimestamp var createdAt: Timestamp?
}

enum XPSource: String, Codable {
    case tradeCompleted = "trade_completed"
    case challengeCompleted = "challenge_completed"
    case collaborationCompleted = "collaboration_completed"
    case dailyLogin = "daily_login"
    case profileCompletion = "profile_completion"
    case skillPractice = "skill_practice"
    case achievementUnlocked = "achievement_unlocked"
    case other
    
    var displayName: String {
        switch self {
        case .tradeCompleted: return "Trade Completed"
        case .challengeCompleted: return "Challenge Completed"
        case .collaborationCompleted: return "Collaboration Completed"
        case .dailyLogin: return "Daily Login"
        case .profileCompletion: return "Profile Completion"
        case .skillPractice: return "Skill Practice"
        case .achievementUnlocked: return "Achievement Unlocked"
        case .other: return "Other"
        }
    }
}
```

**Models/Gamification/Achievement.swift:**

```swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

enum AchievementTier: String, Codable {
    case bronze
    case silver
    case gold
    case platinum
    
    var color: String {
        switch self {
        case .bronze: return "brown"
        case .silver: return "gray"
        case .gold: return "yellow"
        case .platinum: return "blue"
        }
    }
    
    var emoji: String {
        switch self {
        case .bronze: return "🥉"
        case .silver: return "🥈"
        case .gold: return "🥇"
        case .platinum: return "💎"
        }
    }
}

struct Achievement: Codable, Identifiable {
    @DocumentID var id: String?
    
    let name: String
    let description: String
    let icon: String
    let xpReward: Int
    let category: String
    let tier: AchievementTier
    var requirement: Int
    var hidden: Bool?
    
    @ServerTimestamp var createdAt: Timestamp?
}

struct UserAchievement: Codable, Identifiable {
    @DocumentID var id: String?
    
    let userId: String
    let achievementId: String
    var achievementName: String?
    var achievementIcon: String?
    var progress: Int
    var isUnlocked: Bool
    
    @ServerTimestamp var unlockedAt: Timestamp?
    @ServerTimestamp var createdAt: Timestamp?
}
```

**Models/Gamification/Leaderboard.swift:**

```swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

enum LeaderboardCategory: String, Codable {
    case global
    case trades
    case challenges
    case collaborations
    
    var displayName: String {
        rawValue.capitalized
    }
}

enum LeaderboardTimeframe: String, Codable {
    case allTime = "all-time"
    case monthly
    case weekly
    
    var displayName: String {
        switch self {
        case .allTime: return "All Time"
        case .monthly: return "This Month"
        case .weekly: return "This Week"
        }
    }
}

struct LeaderboardEntry: Codable, Identifiable {
    let id: UUID
    let userId: String
    let displayName: String
    var photoURL: String?
    var xp: Int
    var level: Int
    var rank: Int
    var isCurrentUser: Bool?
    
    init(
        id: UUID = UUID(),
        userId: String,
        displayName: String,
        photoURL: String? = nil,
        xp: Int,
        level: Int,
        rank: Int,
        isCurrentUser: Bool? = nil
    ) {
        self.id = id
        self.userId = userId
        self.displayName = displayName
        self.photoURL = photoURL
        self.xp = xp
        self.level = level
        self.rank = rank
        self.isCurrentUser = isCurrentUser
    }
    
    enum CodingKeys: String, CodingKey {
        case userId, displayName, photoURL, xp, level, rank, isCurrentUser
    }
}

struct LeaderboardData: Codable {
    let entries: [LeaderboardEntry]
    let totalCount: Int
    var currentUserRank: Int?
    let category: LeaderboardCategory
    let timeframe: LeaderboardTimeframe
    var lastUpdated: Timestamp?
}
```

**Models/Gamification/UserStreak.swift:**

```swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

enum StreakType: String, Codable {
    case login
    case challenge
    case skillPractice = "skill_practice"
    
    var displayName: String {
        switch self {
        case .login: return "Login Streak"
        case .challenge: return "Challenge Streak"
        case .skillPractice: return "Skill Practice Streak"
        }
    }
    
    var emoji: String {
        switch self {
        case .login: return "🔥"
        case .challenge: return "🎯"
        case .skillPractice: return "💪"
        }
    }
}

struct UserStreak: Codable, Identifiable {
    @DocumentID var id: String?
    
    let userId: String
    let type: StreakType
    
    var currentStreak: Int
    var longestStreak: Int
    var isActive: Bool
    var freezeCount: Int?
    
    @ServerTimestamp var lastActivityDate: Timestamp?
    @ServerTimestamp var createdAt: Timestamp?
    
    // Computed properties
    var daysUntilReset: Int {
        guard let lastActivity = lastActivityDate?.dateValue() else { return 0 }
        let calendar = Calendar.current
        let now = Date()
        let daysSince = calendar.dateComponents([.day], from: lastActivity, to: now).day ?? 0
        return max(0, 1 - daysSince)
    }
    
    var canUseFreeze: Bool {
        (freezeCount ?? 0) > 0
    }
}
```

### Challenge Models

**Models/Challenge/Challenge.swift:**

```swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

enum ChallengeType: String, Codable {
    case solo
    case trade
    case collaboration
    
    var displayName: String {
        rawValue.capitalized
    }
    
    var systemImage: String {
        switch self {
        case .solo: return "person"
        case .trade: return "arrow.left.arrow.right"
        case .collaboration: return "person.3"
        }
    }
}

enum ChallengeDifficulty: String, Codable {
    case beginner
    case intermediate
    case advanced
    case expert
    
    var displayName: String {
        rawValue.capitalized
    }
    
    var color: String {
        switch self {
        case .beginner: return "green"
        case .intermediate: return "blue"
        case .advanced: return "orange"
        case .expert: return "red"
        }
    }
}

enum ChallengeCategory: String, Codable {
    case design
    case development
    case writing
    case marketing
    case photography
    case music
    case video
    case other
    
    var displayName: String {
        rawValue.capitalized
    }
    
    var systemImage: String {
        switch self {
        case .design: return "paintbrush"
        case .development: return "chevron.left.forwardslash.chevron.right"
        case .writing: return "text.justify"
        case .marketing: return "megaphone"
        case .photography: return "camera"
        case .music: return "music.note"
        case .video: return "video"
        case .other: return "star"
        }
    }
}

struct ChallengeRequirement: Codable {
    let description: String
    let type: String // "upload", "text", "link", etc.
    var minCount: Int?
    var maxCount: Int?
}

struct Challenge: Codable, Identifiable, Timestampable {
    @DocumentID var id: String?
    
    let title: String
    let description: String
    let type: ChallengeType
    let difficulty: ChallengeDifficulty
    let category: ChallengeCategory
    
    var requirements: [ChallengeRequirement]
    var xpReward: Int
    var estimatedTimeMinutes: Int?
    var skillTags: [String]?
    
    var isActive: Bool
    var participantCount: Int?
    var completionCount: Int?
    
    @ServerTimestamp var createdAt: Timestamp?
    @ServerTimestamp var updatedAt: Timestamp?
}
```

**Models/Challenge/UserChallenge.swift:**

```swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

enum UserChallengeStatus: String, Codable {
    case notStarted = "not_started"
    case inProgress = "in_progress"
    case submitted
    case completed
    case failed
    
    var displayName: String {
        switch self {
        case .notStarted: return "Not Started"
        case .inProgress: return "In Progress"
        case .submitted: return "Submitted"
        case .completed: return "Completed"
        case .failed: return "Failed"
        }
    }
    
    var systemImage: String {
        switch self {
        case .notStarted: return "circle"
        case .inProgress: return "circle.lefthalf.filled"
        case .submitted: return "checkmark.circle"
        case .completed: return "checkmark.circle.fill"
        case .failed: return "xmark.circle"
        }
    }
}

struct UserChallenge: Codable, Identifiable, Timestampable {
    @DocumentID var id: String?
    
    let userId: String
    let challengeId: String
    
    var status: UserChallengeStatus
    var progress: Int?
    
    var startedAt: Timestamp?
    var submittedAt: Timestamp?
    var completedAt: Timestamp?
    var completionTimeMinutes: Int?
    
    @ServerTimestamp var createdAt: Timestamp?
    @ServerTimestamp var updatedAt: Timestamp?
}
```

**Models/Challenge/ChallengeSubmission.swift:**

```swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

struct ChallengeSubmission: Codable, Identifiable, Timestampable {
    @DocumentID var id: String?
    
    let userId: String
    let challengeId: String
    let userChallengeId: String
    
    var evidence: [EmbeddedEvidence]
    var notes: String?
    
    var reviewStatus: ReviewStatus?
    var feedback: [ChallengeFeedback]?
    
    @ServerTimestamp var submittedAt: Timestamp?
    @ServerTimestamp var reviewedAt: Timestamp?
    @ServerTimestamp var createdAt: Timestamp?
    @ServerTimestamp var updatedAt: Timestamp?
}

enum ReviewStatus: String, Codable {
    case pending
    case approved
    case rejected
    case needsRevision = "needs_revision"
    
    var displayName: String {
        switch self {
        case .pending: return "Pending Review"
        case .approved: return "Approved"
        case .rejected: return "Rejected"
        case .needsRevision: return "Needs Revision"
        }
    }
}

struct ChallengeFeedback: Codable, Identifiable {
    let id: UUID
    let reviewerId: String
    let reviewerName: String
    let comment: String
    var rating: Int? // 1-5
    
    @ServerTimestamp var createdAt: Timestamp?
    
    init(
        id: UUID = UUID(),
        reviewerId: String,
        reviewerName: String,
        comment: String,
        rating: Int? = nil
    ) {
        self.id = id
        self.reviewerId = reviewerId
        self.reviewerName = reviewerName
        self.comment = comment
        self.rating = rating
    }
    
    enum CodingKeys: String, CodingKey {
        case reviewerId, reviewerName, comment, rating, createdAt
    }
}
```

### Portfolio Models

**Models/Portfolio/PortfolioItem.swift:**

```swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

enum PortfolioSourceType: String, Codable {
    case trade
    case collaboration
    
    var systemImage: String {
        switch self {
        case .trade: return "arrow.left.arrow.right"
        case .collaboration: return "person.3"
        }
    }
}

struct PortfolioCollaborator: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    var photoURL: String?
    var role: String?
    
    enum CodingKeys: String, CodingKey {
        case id, name, photoURL, role
    }
}

struct PortfolioItem: Codable, Identifiable {
    @DocumentID var id: String?
    
    let userId: String
    let sourceId: String
    let sourceType: PortfolioSourceType
    
    let title: String
    let description: String
    let skills: [String]
    var role: String?
    
    var completedAt: Timestamp?
    
    var visible: Bool
    var featured: Bool
    var pinned: Bool
    
    var category: String?
    var customOrder: Int?
    
    var evidence: [EmbeddedEvidence]?
    var collaborators: [PortfolioCollaborator]?
    
    @ServerTimestamp var createdAt: Timestamp?
    @ServerTimestamp var updatedAt: Timestamp?
}
```

**Models/Portfolio/EmbeddedEvidence.swift:**

```swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

enum EmbedType: String, Codable {
    case image
    case video
    case audio
    case document
    case code
    case design
    case other
    
    var systemImage: String {
        switch self {
        case .image: return "photo"
        case .video: return "video"
        case .audio: return "waveform"
        case .document: return "doc"
        case .code: return "chevron.left.forwardslash.chevron.right"
        case .design: return "paintpalette"
        case .other: return "link"
        }
    }
}

struct EmbeddedEvidence: Codable, Identifiable, Hashable {
    @DocumentID var id: String?
    
    let userId: String
    var userName: String?
    var userPhotoURL: String?
    
    let title: String
    let description: String
    
    // Embed info
    let embedUrl: String
    var embedCode: String?
    let embedType: EmbedType
    let embedService: String // youtube, vimeo, imgur, etc.
    
    // Metadata
    var thumbnailUrl: String?
    let originalUrl: String
    
    @ServerTimestamp var createdAt: Timestamp?
}
```

### Collaboration Models

**Models/Collaboration/Collaboration.swift:**

```swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

enum CollaborationStatus: String, Codable {
    case planning
    case active
    case completed
    case cancelled
    
    var displayName: String {
        rawValue.capitalized
    }
    
    var systemImage: String {
        switch self {
        case .planning: return "lightbulb"
        case .active: return "arrow.triangle.2.circlepath"
        case .completed: return "checkmark.circle.fill"
        case .cancelled: return "xmark.circle"
        }
    }
}

struct Collaboration: Codable, Identifiable, Timestampable {
    @DocumentID var id: String?
    
    let title: String
    let description: String
    
    let creatorId: String
    var creatorName: String?
    var creatorPhotoURL: String?
    
    var status: CollaborationStatus
    var category: String?
    var tags: [String]?
    
    var participantIds: [String]
    var maxParticipants: Int?
    
    var startDate: Timestamp?
    var endDate: Timestamp?
    var completedAt: Timestamp?
    
    @ServerTimestamp var createdAt: Timestamp?
    @ServerTimestamp var updatedAt: Timestamp?
}
```

**Models/Collaboration/CollaborationRole.swift:**

```swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

enum RoleState: String, Codable {
    case active
    case pending
    case archived
    case deleted
    
    var displayName: String {
        rawValue.capitalized
    }
}

enum CompletionRequestStatus: String, Codable {
    case none
    case requested
    case confirmed
    case rejected
    
    var displayName: String {
        switch self {
        case .none: return "Not Requested"
        case .requested: return "Requested"
        case .confirmed: return "Confirmed"
        case .rejected: return "Rejected"
        }
    }
}

struct CollaborationRole: Codable, Identifiable, Timestampable {
    @DocumentID var id: String?
    
    let collaborationId: String
    
    // Role details
    let title: String
    let description: String
    var maxParticipants: Int
    
    // Hierarchy
    var parentRoleId: String?
    var childRoleIds: [String]
    
    // Participant tracking
    var participantId: String?
    var participantName: String?
    var participantPhotoURL: String?
    var assignedUserId: String?
    
    // Previous participant (for abandonment)
    var previousParticipantId: String?
    var previousParticipantName: String?
    var previousParticipantPhotoURL: String?
    var abandonmentReason: String?
    var abandonedAt: Timestamp?
    
    // Status
    var status: RoleState
    var applicationCount: Int
    var completionStatus: CompletionRequestStatus?
    
    // Completion metadata
    var completionRequestedAt: Timestamp?
    var completionConfirmedAt: Timestamp?
    var completionNotes: String?
    var completionEvidence: [EmbeddedEvidence]?
    
    // Skills
    var requiredSkills: [TradeSkill]?
    var preferredSkills: [TradeSkill]?
    
    // Timestamps
    @ServerTimestamp var createdAt: Timestamp?
    @ServerTimestamp var updatedAt: Timestamp?
    var filledAt: Timestamp?
    var completedAt: Timestamp?
}

// MARK: - Helpers
extension CollaborationRole {
    var isFilled: Bool {
        participantId != nil || assignedUserId != nil
    }
    
    var isCompleted: Bool {
        completedAt != nil
    }
    
    var canAcceptApplications: Bool {
        status == .active && !isFilled
    }
}
```

---

## Firebase Integration

### Firebase Manager (Singleton)

**Services/Firebase/FirebaseManager.swift:**

```swift
import Foundation
import FirebaseCore
import FirebaseFirestore
import FirebaseAuth
import FirebaseStorage
import FirebaseFunctions

/// Singleton manager for Firebase services
class FirebaseManager {
    
    // MARK: - Shared Instance
    static let shared = FirebaseManager()
    
    // MARK: - Firebase Services
    let db: Firestore
    let auth: Auth
    let storage: Storage
    let functions: Functions
    
    // MARK: - Collection References
    var tradesCollection: CollectionReference {
        db.collection("trades")
    }
    
    var usersCollection: CollectionReference {
        db.collection("users")
    }
    
    var conversationsCollection: CollectionReference {
        db.collection("conversations")
    }
    
    var messagesCollection: CollectionReference {
        db.collection("messages")
    }
    
    var collaborationsCollection: CollectionReference {
        db.collection("collaborations")
    }
    
    var collaborationRolesCollection: CollectionReference {
        db.collection("collaborationRoles")
    }
    
    var challengesCollection: CollectionReference {
        db.collection("challenges")
    }
    
    var userChallengesCollection: CollectionReference {
        db.collection("userChallenges")
    }
    
    var challengeSubmissionsCollection: CollectionReference {
        db.collection("challengeSubmissions")
    }
    
    var userXPCollection: CollectionReference {
        db.collection("userXP")
    }
    
    var achievementsCollection: CollectionReference {
        db.collection("achievements")
    }
    
    var userAchievementsCollection: CollectionReference {
        db.collection("userAchievements")
    }
    
    var streaksCollection: CollectionReference {
        db.collection("streaks")
    }
    
    var portfolioCollection: CollectionReference {
        db.collection("portfolio")
    }
    
    var notificationsCollection: CollectionReference {
        db.collection("notifications")
    }
    
    // MARK: - Initialization
    private init() {
        // Firebase should be configured in AppDelegate
        // This initializes the service references
        
        self.db = Firestore.firestore()
        self.auth = Auth.auth()
        self.storage = Storage.storage()
        self.functions = Functions.functions()
        
        // Configure Firestore settings
        configureFirestore()
    }
    
    // MARK: - Configuration
    private func configureFirestore() {
        let settings = FirestoreSettings()
        
        // Enable offline persistence
        settings.isPersistenceEnabled = true
        
        // Set cache size (unlimited for better offline experience)
        settings.cacheSizeBytes = FirestoreCacheSizeUnlimited
        
        // Apply settings
        db.settings = settings
    }
    
    // MARK: - Helper Methods
    
    /// Get user document reference
    func userDocument(userId: String) -> DocumentReference {
        usersCollection.document(userId)
    }
    
    /// Get trade document reference
    func tradeDocument(tradeId: String) -> DocumentReference {
        tradesCollection.document(tradeId)
    }
    
    /// Get conversation document reference
    func conversationDocument(conversationId: String) -> DocumentReference {
        conversationsCollection.document(conversationId)
    }
    
    /// Get collaboration document reference
    func collaborationDocument(collaborationId: String) -> DocumentReference {
        collaborationsCollection.document(collaborationId)
    }
    
    /// Enable network (for testing offline scenarios)
    func enableNetwork() async throws {
        try await db.enableNetwork()
    }
    
    /// Disable network (for testing offline scenarios)
    func disableNetwork() async throws {
        try await db.disableNetwork()
    }
}
```

### Authentication Service

**Services/Firebase/AuthService.swift:**

```swift
import Foundation
import FirebaseAuth
import FirebaseFirestore

/// Authentication service handling user authentication
class AuthService: ObservableObject {
    
    @Published var currentUser: FirebaseAuth.User?
    @Published var isAuthenticated = false
    
    private let auth = FirebaseManager.shared.auth
    private var authStateHandler: AuthStateDidChangeListenerHandle?
    
    init() {
        setupAuthStateListener()
    }
    
    // MARK: - Auth State Listener
    
    private func setupAuthStateListener() {
        authStateHandler = auth.addStateDidChangeListener { [weak self] _, user in
            self?.currentUser = user
            self?.isAuthenticated = user != nil
        }
    }
    
    // MARK: - Sign Up
    
    func signUp(email: String, password: String, displayName: String?) async throws -> FirebaseAuth.User {
        let result = try await auth.createUser(withEmail: email, password: password)
        
        // Update display name if provided
        if let displayName = displayName {
            let changeRequest = result.user.createProfileChangeRequest()
            changeRequest.displayName = displayName
            try await changeRequest.commitChanges()
        }
        
        // Create user profile in Firestore
        try await createUserProfile(user: result.user, displayName: displayName)
        
        return result.user
    }
    
    // MARK: - Sign In
    
    func signIn(email: String, password: String) async throws -> FirebaseAuth.User {
        let result = try await auth.signIn(withEmail: email, password: password)
        return result.user
    }
    
    // MARK: - Sign Out
    
    func signOut() throws {
        try auth.signOut()
    }
    
    // MARK: - Password Reset
    
    func sendPasswordReset(email: String) async throws {
        try await auth.sendPasswordReset(withEmail: email)
    }
    
    // MARK: - Delete Account
    
    func deleteAccount() async throws {
        guard let user = currentUser else {
            throw AuthError.noUserSignedIn
        }
        
        // Delete user profile from Firestore
        let userId = user.uid
        try await FirebaseManager.shared.userDocument(userId: userId).delete()
        
        // Delete Firebase Auth account
        try await user.delete()
    }
    
    // MARK: - Update Profile
    
    func updateDisplayName(_ displayName: String) async throws {
        guard let user = currentUser else {
            throw AuthError.noUserSignedIn
        }
        
        let changeRequest = user.createProfileChangeRequest()
        changeRequest.displayName = displayName
        try await changeRequest.commitChanges()
        
        // Update Firestore profile
        try await FirebaseManager.shared.userDocument(userId: user.uid)
            .updateData(["displayName": displayName])
    }
    
    func updatePhotoURL(_ photoURL: URL) async throws {
        guard let user = currentUser else {
            throw AuthError.noUserSignedIn
        }
        
        let changeRequest = user.createProfileChangeRequest()
        changeRequest.photoURL = photoURL
        try await changeRequest.commitChanges()
        
        // Update Firestore profile
        try await FirebaseManager.shared.userDocument(userId: user.uid)
            .updateData(["photoURL": photoURL.absoluteString])
    }
    
    // MARK: - Private Helpers
    
    private func createUserProfile(user: FirebaseAuth.User, displayName: String?) async throws {
        let userProfile = User(
            id: user.uid,
            uid: user.uid,
            email: user.email,
            displayName: displayName ?? user.displayName,
            photoURL: user.photoURL?.absoluteString,
            reputationScore: 0,
            role: .user,
            isPublic: true
        )
        
        try FirebaseManager.shared.userDocument(userId: user.uid)
            .setData(from: userProfile)
    }
    
    deinit {
        if let handler = authStateHandler {
            auth.removeStateDidChangeListener(handler)
        }
    }
}

// MARK: - AuthError

enum AuthError: LocalizedError {
    case noUserSignedIn
    case invalidCredentials
    case weakPassword
    case emailAlreadyInUse
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .noUserSignedIn:
            return "No user is currently signed in."
        case .invalidCredentials:
            return "Invalid email or password."
        case .weakPassword:
            return "Password is too weak. Please use at least 6 characters."
        case .emailAlreadyInUse:
            return "This email is already registered."
        case .unknown:
            return "An unknown error occurred."
        }
    }
}
```

### Storage Service

**Services/Firebase/StorageService.swift:**

```swift
import Foundation
import FirebaseStorage
import UIKit

/// Service for handling file uploads to Firebase Storage
class StorageService {
    
    private let storage = FirebaseManager.shared.storage
    
    // MARK: - Upload Image
    
    /// Upload an image to Firebase Storage
    /// - Parameters:
    ///   - image: The UIImage to upload
    ///   - path: Storage path (e.g., "users/\(userId)/profile.jpg")
    ///   - compressionQuality: JPEG compression quality (0.0 - 1.0)
    /// - Returns: Download URL of the uploaded image
    func uploadImage(
        _ image: UIImage,
        to path: String,
        compressionQuality: CGFloat = 0.8
    ) async throws -> URL {
        guard let imageData = image.jpegData(compressionQuality: compressionQuality) else {
            throw StorageError.invalidImageData
        }
        
        let ref = storage.reference().child(path)
        let metadata = StorageMetadata()
        metadata.contentType = "image/jpeg"
        
        _ = try await ref.putDataAsync(imageData, metadata: metadata)
        let downloadURL = try await ref.downloadURL()
        
        return downloadURL
    }
    
    // MARK: - Upload File
    
    /// Upload a file to Firebase Storage
    /// - Parameters:
    ///   - data: File data
    ///   - path: Storage path
    ///   - contentType: MIME type
    /// - Returns: Download URL
    func uploadFile(
        _ data: Data,
        to path: String,
        contentType: String
    ) async throws -> URL {
        let ref = storage.reference().child(path)
        let metadata = StorageMetadata()
        metadata.contentType = contentType
        
        _ = try await ref.putDataAsync(data, metadata: metadata)
        let downloadURL = try await ref.downloadURL()
        
        return downloadURL
    }
    
    // MARK: - Delete File
    
    /// Delete a file from Firebase Storage
    /// - Parameter path: Storage path to delete
    func deleteFile(at path: String) async throws {
        let ref = storage.reference().child(path)
        try await ref.delete()
    }
    
    // MARK: - Download File
    
    /// Download a file from Firebase Storage
    /// - Parameter url: Download URL
    /// - Returns: File data
    func downloadFile(from url: URL) async throws -> Data {
        let (data, _) = try await URLSession.shared.data(from: url)
        return data
    }
    
    // MARK: - Helper Methods
    
    /// Generate a unique file path for user uploads
    /// - Parameters:
    ///   - userId: User ID
    ///   - type: File type (e.g., "profile", "evidence")
    ///   - fileExtension: File extension
    /// - Returns: Storage path
    func generatePath(
        for userId: String,
        type: String,
        fileExtension: String
    ) -> String {
        let timestamp = Int(Date().timeIntervalSince1970)
        let randomId = UUID().uuidString.prefix(8)
        return "users/\(userId)/\(type)/\(timestamp)_\(randomId).\(fileExtension)"
    }
}

// MARK: - StorageError

enum StorageError: LocalizedError {
    case invalidImageData
    case uploadFailed
    case downloadFailed
    case fileNotFound
    
    var errorDescription: String? {
        switch self {
        case .invalidImageData:
            return "Could not convert image to data."
        case .uploadFailed:
            return "File upload failed."
        case .downloadFailed:
            return "File download failed."
        case .fileNotFound:
            return "File not found in storage."
        }
    }
}
```

---

**[Continued in next section due to length...]**

## Quick Reference: Migration Checklist

### ✅ Phase 1: Foundation (Weeks 1-4)
- [ ] Create Xcode project
- [ ] Install Firebase iOS SDK
- [ ] Configure Firebase (GoogleService-Info.plist)
- [ ] Implement AppDelegate & Firebase initialization
- [ ] Create all data models (Trade, User, Chat, etc.)
- [ ] Set up project structure
- [ ] Implement FirebaseManager singleton
- [ ] Implement AuthService
- [ ] Implement StorageService
- [ ] Create basic navigation (TabView)
- [ ] Implement login/signup flows

### ✅ Phase 2: Core Features (Weeks 5-12)
- [ ] Implement TradeService
- [ ] Create Trade list & detail views
- [ ] Implement UserService
- [ ] Create Profile views
- [ ] Implement ChatService
- [ ] Create messaging interface
- [ ] Implement search & filtering
- [ ] Add image upload functionality
- [ ] Implement real-time listeners

### ✅ Phase 3: Advanced Features (Weeks 13-20)
- [ ] Implement GamificationService
- [ ] Create XP & leveling system
- [ ] Implement LeaderboardService
- [ ] Create leaderboard views
- [ ] Implement ChallengeService
- [ ] Create challenge flows
- [ ] Implement CollaborationService
- [ ] Create role management system
- [ ] Implement StreakService
- [ ] Create achievements system

### ✅ Phase 4: Polish & Launch (Weeks 21-26)
- [ ] Implement animations
- [ ] Add loading states
- [ ] Add error handling
- [ ] Implement accessibility
- [ ] Write unit tests
- [ ] Write UI tests
- [ ] Performance optimization
- [ ] Beta testing (TestFlight)
- [ ] App Store assets
- [ ] Submit to App Store

---

## Estimated Timeline & Budget

### Team Composition
- 1 Senior iOS Developer (Lead)
- 1-2 Mid-level iOS Developers
- 1 UI/UX Designer (Part-time)
- 1 QA Engineer (Part-time)

### Timeline: 26 Weeks (6 Months)
- MVP: 12 weeks
- Full Feature Parity: 20 weeks
- Polish & Launch: 26 weeks

### Budget Range
- **Conservative:** $275,000 - $325,000
- **Realistic:** $325,000 - $425,000
- **With Contingency:** $425,000 - $525,000

**Note:** Budget estimates updated for 2025 market rates and inflation. Costs include team salaries, tools, services, and 20% contingency buffer.

---

## App Store Submission Requirements

### Privacy Policy & Compliance

#### Privacy Policy (Required for iOS 17+)
Your app **must** include a privacy policy URL in App Store Connect:

1. **Create Privacy Policy Document**
   - Describe data collection practices
   - Explain how user data is used
   - List third-party services (Firebase, Analytics)
   - Include data retention policies

2. **Host on Accessible URL**
   - Must be publicly accessible
   - Should load quickly
   - No login required to view

3. **Add to App Store Connect**
   - Project Settings → App Privacy
   - Enter Privacy Policy URL
   - Complete Privacy Nutrition Labels

**Example Privacy Policy Sections:**
```markdown
# TradeYa Privacy Policy

## Data We Collect
- Account information (email, name)
- Profile data and skills
- Trade and collaboration history
- Messages and communications

## How We Use Data
- Facilitate skill trades
- Enable messaging features
- Display user profiles
- Improve app experience

## Third-Party Services
- Firebase (Google) for authentication and database
- Analytics for app improvement
```

#### App Tracking Transparency (ATT)

If using analytics or advertising, implement ATT framework:

```swift
// AppDelegate.swift or early in app lifecycle
import AppTrackingTransparency
import AdSupport

func requestTrackingAuthorization() {
    // Wait for app to be in foreground
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
        ATTrackingManager.requestTrackingAuthorization { status in
            switch status {
            case .authorized:
                // Tracking authorized - enable analytics
                print("Tracking authorized")
                // Initialize full analytics
                
            case .denied, .restricted:
                // Tracking denied - use limited analytics
                print("Tracking denied")
                // Use privacy-preserving analytics only
                
            case .notDetermined:
                // User hasn't decided yet
                print("Tracking not determined")
                
            @unknown default:
                break
            }
        }
    }
}
```

**Info.plist Entry Required:**
```xml
<key>NSUserTrackingUsageDescription</key>
<string>We use tracking to improve your experience and provide personalized trade recommendations.</string>
```

### App Store Screenshots & Metadata

#### Required Screenshots

You must provide screenshots for these sizes:

1. **6.7" iPhone Pro Max** (Required)
   - Size: 1290 x 2796 pixels
   - Minimum: 3 screenshots
   - Maximum: 10 screenshots

2. **6.5" iPhone Plus** (Required)
   - Size: 1242 x 2688 pixels
   - Minimum: 3 screenshots
   - Maximum: 10 screenshots

3. **5.5" iPhone** (Required)
   - Size: 1242 x 2208 pixels
   - Minimum: 3 screenshots
   - Maximum: 10 screenshots

4. **12.9" iPad Pro** (Optional but recommended)
   - Size: 2048 x 2732 pixels
   - Shows iPad optimization

**Screenshot Best Practices:**
- Show key features: Browse Trades, Chat, Profile, Challenges
- Include descriptive text overlays
- Use actual app UI (no mockups)
- Show value proposition clearly
- Maintain consistent branding

#### App Icon Requirements

- **Size:** 1024 x 1024 pixels
- **Format:** PNG (no alpha channel)
- **Color Space:** RGB
- **Shape:** Square (iOS adds rounded corners)

**Design Guidelines:**
- Clear and recognizable at small sizes
- Avoid text that becomes unreadable when small
- Use vibrant colors
- Consistent with app branding

#### App Description

**App Name:**
- Maximum 30 characters
- Example: "TradeYa - Skill Exchange"

**Subtitle:**
- Maximum 30 characters
- Example: "Trade Skills & Collaborate"

**Description:**
- Maximum 4000 characters
- First 2-3 sentences are crucial (visible without expanding)
- Include keywords for App Store search
- Highlight key features

**Example Description Structure:**
```
TradeYa connects creative professionals to trade skills and collaborate on projects. Exchange your expertise for new skills without monetary transactions.

KEY FEATURES:
• Browse & create skill trades
• Real-time messaging
• Gamification with XP and achievements
• Challenge system to build portfolio
• Collaboration tools for team projects
• Evidence gallery to showcase work

PERFECT FOR:
• Designers seeking development skills
• Developers wanting design help
• Content creators building portfolios
• Freelancers expanding their skillset

[Continue with more details...]
```

### App Store Review Guidelines Compliance

#### Key Guidelines to Follow:

1. **Design**
   - App must use native iOS UI patterns
   - SwiftUI is native ✅
   - No misleading metadata

2. **Business**
   - If implementing in-app purchases later, follow Apple's rules
   - Subscription model requires specific implementation
   - Cannot circumvent Apple's payment system

3. **Legal**
   - Comply with all applicable laws
   - Proper licensing for any third-party content
   - Age rating must be accurate

4. **Safety**
   - User-generated content must be moderated
   - Report abuse features required
   - Protect minors (if age 17+)

**Implementation for TradeYa:**

```swift
// Content Reporting Feature
struct ReportContentView: View {
    let contentId: String
    let contentType: String // "trade", "message", "user"
    
    @State private var reason = ""
    @State private var details = ""
    
    var body: some View {
        Form {
            Section("Report Reason") {
                Picker("Reason", selection: $reason) {
                    Text("Inappropriate Content").tag("inappropriate")
                    Text("Spam").tag("spam")
                    Text("Harassment").tag("harassment")
                    Text("Other").tag("other")
                }
            }
            
            Section("Details") {
                TextEditor(text: $details)
                    .frame(height: 100)
            }
            
            Button("Submit Report") {
                submitReport()
            }
            .disabled(reason.isEmpty)
        }
        .navigationTitle("Report Content")
    }
    
    private func submitReport() {
        // Send to Firebase or Cloud Function for review
        // Implement moderation queue
    }
}
```

### TestFlight Beta Testing

Before App Store submission, test with real users:

1. **Setup TestFlight**
   - Upload build to App Store Connect
   - Add internal testers (up to 100)
   - Add external testers (up to 10,000)

2. **Beta Testing Period**
   - Recommended: 2-4 weeks
   - Gather feedback
   - Fix critical bugs
   - Test on various devices

3. **Prepare for Launch**
   - Address all beta feedback
   - Ensure no crashes
   - Verify all features work
   - Check performance on older devices

### Submission Checklist

Before submitting to App Store:

- [ ] Privacy Policy URL ready and hosted
- [ ] ATT implementation (if using tracking)
- [ ] All screenshots prepared (3+ sizes)
- [ ] App icon (1024x1024) ready
- [ ] App description written
- [ ] Keywords selected for App Store search
- [ ] Age rating determined
- [ ] Contact information for app support
- [ ] Copyright text
- [ ] Category selected (Productivity? Social Networking?)
- [ ] Content rights verified
- [ ] App tested on iOS 17, 18
- [ ] TestFlight beta completed
- [ ] No crashes or critical bugs
- [ ] All features functional
- [ ] Performance optimized

---

## Next Steps

1. **Review this guide** with your team
2. **Hire iOS developers** if needed
3. **Set up Apple Developer account** ($99/year)
4. **Prepare privacy policy** and legal documents
5. **Create Xcode project** following Phase 1
6. **Start with authentication** and basic CRUD operations
7. **Plan TestFlight beta** testing strategy
8. **Prepare App Store assets** (screenshots, icon, description)
9. **Iterate and test** frequently

---

**Document Version:** 1.1  
**Last Updated:** October 21, 2025  
**Maintained By:** TradeYa Development Team  
**Changes:** Updated Firebase SDK to 11.0, adjusted 2025 budget, added App Store requirements

---



