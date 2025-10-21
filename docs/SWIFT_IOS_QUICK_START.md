# TradeYa iOS - Quick Start Guide

**Version:** 1.0  
**Last Updated:** October 21, 2025  
**For:** Developers starting iOS development immediately

---

## 🚀 Get Started in 30 Minutes

This guide will get you from zero to a working iOS app with Firebase integration in 30 minutes.

---

## Prerequisites Checklist

Before you begin, ensure you have:

- ✅ macOS Ventura (13.0) or later
- ✅ Xcode 15.0+ installed ([Download](https://developer.apple.com/xcode/))
- ✅ Apple ID (free) for Xcode
- ✅ Access to TradeYa Firebase project
- ✅ Basic Swift knowledge (recommended)

---

## Step 1: Create Xcode Project (5 minutes)

### 1.1 Open Xcode

```bash
# Launch Xcode from Applications or Spotlight
open -a Xcode
```

### 1.2 Create New Project

1. **File → New → Project**
2. **Choose template:** iOS → App
3. **Configure project:**
   - Product Name: `TradeYa`
   - Team: Select your Apple ID team
   - Organization Identifier: `com.yourcompany.tradeya`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Storage: **None**
   - ✅ Include Tests
4. **Click "Next"** and choose save location
5. **Create**

### 1.3 Set Deployment Target

1. Select project in navigator
2. Under "General" tab → "Deployment Info"
3. Set **Minimum Deployments** to **iOS 17.0**

---

## Step 2: Add Firebase SDK (5 minutes)

### 2.1 Add Swift Package

1. **File → Add Package Dependencies...**
2. Paste URL: `https://github.com/firebase/firebase-ios-sdk`
3. **Dependency Rule:** Up to Next Major Version: `10.0.0`
4. **Add Package**
5. **Select products** (check these):
   - ✅ FirebaseAuth
   - ✅ FirebaseFirestore
   - ✅ FirebaseFirestoreSwift
   - ✅ FirebaseStorage
   - ✅ FirebaseFunctions
   - ✅ FirebaseMessaging
6. **Add Package**

### 2.2 Download GoogleService-Info.plist

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select **TradeYa** project (or your existing project)
3. Click **⚙️ Settings** → **Project Settings**
4. Under **Your apps**, click **iOS** (or add iOS app if not exists)
5. **Download `GoogleService-Info.plist`**
6. **Drag file into Xcode** project root
7. ✅ Ensure "Copy items if needed" is **checked**
8. ✅ Ensure "TradeYa" target is **selected**

---

## Step 3: Initialize Firebase (10 minutes)

### 3.1 Create AppDelegate.swift

**File → New → File → Swift File → "AppDelegate.swift"**

```swift
// AppDelegate.swift
import UIKit
import FirebaseCore

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
    ) -> Bool {
        // Configure Firebase
        FirebaseApp.configure()
        print("✅ Firebase configured successfully")
        return true
    }
}
```

### 3.2 Update TradeYaApp.swift

Open `TradeYaApp.swift` and replace with:

```swift
// TradeYaApp.swift
import SwiftUI

@main
struct TradeYaApp: App {
    
    // Register app delegate
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

### 3.3 Test Firebase Connection

In `ContentView.swift`:

```swift
// ContentView.swift
import SwiftUI
import FirebaseFirestore

struct ContentView: View {
    @State private var connectionStatus = "Testing..."
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "flame.fill")
                .imageScale(.large)
                .foregroundStyle(.orange)
                .font(.system(size: 60))
            
            Text("TradeYa iOS")
                .font(.title)
                .fontWeight(.bold)
            
            Text("Firebase Status: \(connectionStatus)")
                .foregroundColor(
                    connectionStatus == "Connected ✅" ? .green : .orange
                )
        }
        .padding()
        .task {
            await testFirebaseConnection()
        }
    }
    
    private func testFirebaseConnection() async {
        do {
            let db = Firestore.firestore()
            _ = try await db.collection("test").limit(to: 1).getDocuments()
            connectionStatus = "Connected ✅"
        } catch {
            connectionStatus = "Error: \(error.localizedDescription)"
        }
    }
}

#Preview {
    ContentView()
}
```

### 3.4 Run App

1. Select simulator: **iPhone 15 Pro** (or any iOS 17+ device)
2. **⌘R** or click ▶️ Play button
3. **You should see:** "Firebase Status: Connected ✅"

🎉 **Congratulations!** Firebase is connected.

---

## Step 4: Create Project Structure (5 minutes)

### 4.1 Create Folders

In Xcode project navigator, **right-click on TradeYa folder** → **New Group**, create:

```
TradeYa/
├── App/
├── Models/
├── Services/
├── ViewModels/
├── Views/
│   ├── Auth/
│   ├── Trades/
│   ├── Profile/
│   ├── Chat/
│   └── Components/
├── Utilities/
│   └── Extensions/
└── Resources/
```

### 4.2 Move Existing Files

1. Drag `TradeYaApp.swift` → **App/** folder
2. Drag `ContentView.swift` → **Views/** folder
3. Drag `AppDelegate.swift` → **App/** folder
4. Drag `Assets.xcassets` → **Resources/** folder

---

## Step 5: Create Your First Model (3 minutes)

### 5.1 Create Trade.swift

**File → New → File → Swift File → "Trade.swift"**

Save in **Models/** folder:

```swift
// Models/Trade.swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

enum TradeStatus: String, Codable {
    case open
    case inProgress = "in-progress"
    case completed
    case cancelled
    
    var displayName: String {
        switch self {
        case .open: return "Open"
        case .inProgress: return "In Progress"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        }
    }
}

struct TradeSkill: Codable, Identifiable, Hashable {
    let id: UUID
    let name: String
    let level: String // "beginner", "intermediate", "advanced", "expert"
    
    init(id: UUID = UUID(), name: String, level: String) {
        self.id = id
        self.name = name
        self.level = level
    }
    
    enum CodingKeys: String, CodingKey {
        case name, level
    }
}

struct Trade: Codable, Identifiable {
    @DocumentID var id: String?
    let title: String
    let description: String
    let skillsOffered: [TradeSkill]
    let skillsWanted: [TradeSkill]
    let creatorId: String
    var creatorName: String?
    var status: TradeStatus
    
    @ServerTimestamp var createdAt: Timestamp?
    @ServerTimestamp var updatedAt: Timestamp?
}
```

---

## Step 6: Create Your First Service (3 minutes)

### 6.1 Create TradeService.swift

**File → New → File → Swift File → "TradeService.swift"**

Save in **Services/** folder:

```swift
// Services/TradeService.swift
import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

class TradeService: ObservableObject {
    
    private let db = Firestore.firestore()
    private let tradesCollection: CollectionReference
    
    @Published var trades: [Trade] = []
    @Published var isLoading = false
    @Published var error: Error?
    
    init() {
        self.tradesCollection = db.collection("trades")
    }
    
    // MARK: - Fetch Trades
    
    func fetchTrades() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let snapshot = try await tradesCollection
                .order(by: "createdAt", descending: true)
                .limit(to: 20)
                .getDocuments()
            
            self.trades = try snapshot.documents.compactMap { doc in
                try doc.data(as: Trade.self)
            }
            
            print("✅ Fetched \(trades.count) trades")
        } catch {
            self.error = error
            print("❌ Error fetching trades: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Create Trade
    
    func createTrade(_ trade: Trade) async throws -> Trade {
        var newTrade = trade
        let docRef = try tradesCollection.addDocument(from: newTrade)
        newTrade.id = docRef.documentID
        print("✅ Created trade: \(newTrade.title)")
        return newTrade
    }
}
```

---

## Step 7: Create Your First View (3 minutes)

### 7.1 Create TradeListView.swift

**File → New → File → Swift File → "TradeListView.swift"**

Save in **Views/Trades/** folder:

```swift
// Views/Trades/TradeListView.swift
import SwiftUI

struct TradeListView: View {
    
    @StateObject private var tradeService = TradeService()
    
    var body: some View {
        NavigationStack {
            Group {
                if tradeService.isLoading {
                    ProgressView("Loading trades...")
                } else if tradeService.trades.isEmpty {
                    ContentUnavailableView(
                        "No Trades Yet",
                        systemImage: "arrow.left.arrow.right.circle",
                        description: Text("Be the first to create a trade!")
                    )
                } else {
                    List(tradeService.trades) { trade in
                        TradeRow(trade: trade)
                    }
                }
            }
            .navigationTitle("Trades")
            .task {
                await tradeService.fetchTrades()
            }
            .refreshable {
                await tradeService.fetchTrades()
            }
        }
    }
}

// MARK: - Trade Row

struct TradeRow: View {
    let trade: Trade
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(trade.title)
                    .font(.headline)
                
                Spacer()
                
                Text(trade.status.displayName)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(statusColor.opacity(0.2))
                    .foregroundColor(statusColor)
                    .cornerRadius(8)
            }
            
            Text(trade.description)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(2)
            
            HStack {
                Label(
                    "\(trade.skillsOffered.count) offered",
                    systemImage: "arrow.up.circle.fill"
                )
                .font(.caption)
                .foregroundColor(.green)
                
                Label(
                    "\(trade.skillsWanted.count) wanted",
                    systemImage: "arrow.down.circle.fill"
                )
                .font(.caption)
                .foregroundColor(.blue)
            }
        }
        .padding(.vertical, 4)
    }
    
    private var statusColor: Color {
        switch trade.status {
        case .open: return .blue
        case .inProgress: return .orange
        case .completed: return .green
        case .cancelled: return .gray
        }
    }
}

#Preview {
    TradeListView()
}
```

### 7.2 Update ContentView to Show Trades

```swift
// Views/ContentView.swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            TradeListView()
                .tabItem {
                    Label("Trades", systemImage: "arrow.left.arrow.right")
                }
            
            Text("Profile")
                .tabItem {
                    Label("Profile", systemImage: "person.circle")
                }
        }
    }
}

#Preview {
    ContentView()
}
```

---

## Step 8: Test Your App (2 minutes)

### 8.1 Run the App

1. **⌘R** or click ▶️
2. You should see a **TabView** with "Trades" tab
3. The app will try to fetch trades from Firestore

### 8.2 Add Test Data (Optional)

If you see "No Trades Yet", add test data via Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. **Firestore Database**
3. **Start collection** → Collection ID: `trades`
4. **Add Document** with auto-ID
5. Add fields:
   ```
   title: "Test Trade" (string)
   description: "This is a test trade" (string)
   creatorId: "test123" (string)
   status: "open" (string)
   skillsOffered: [] (array)
   skillsWanted: [] (array)
   createdAt: [timestamp] (timestamp)
   ```
6. **Save**
7. **Pull to refresh** in the app

🎉 **You should now see your first trade!**

---

## Next Steps

### Option A: Follow Full Migration Guide

Continue with the comprehensive guide:
- 📖 Read: `SWIFT_IOS_MIGRATION_COMPREHENSIVE_GUIDE.md`
- 💻 Use code from: `SWIFT_IOS_CODE_EXAMPLES.md`

### Option B: Build Feature by Feature

Recommended order:

1. **Week 1-2: Authentication**
   - [ ] Login/Signup views
   - [ ] Auth service
   - [ ] User profile model

2. **Week 3-4: Trade System**
   - [ ] Create trade view
   - [ ] Trade detail view
   - [ ] Accept/complete trade flows

3. **Week 5-6: Messaging**
   - [ ] Chat models
   - [ ] Chat service
   - [ ] Chat UI

4. **Week 7-8: Gamification**
   - [ ] XP system
   - [ ] Achievements
   - [ ] Leaderboards

### Option C: Hire iOS Developers

If you need help, consider:

1. **Full-time iOS Developer**
   - Senior level: $120k-180k/year
   - Mid level: $80k-120k/year

2. **Freelance iOS Developers**
   - Upwork, Toptal, Gun.io
   - Rates: $50-150/hour

3. **iOS Development Agency**
   - Full project: $200k-400k
   - Timeline: 6-8 months

---

## Common Issues & Solutions

### Issue: "No such module 'FirebaseFirestore'"

**Solution:**
1. Clean build folder: **⇧⌘K**
2. Close and reopen Xcode
3. Verify package dependencies are resolved

### Issue: "GoogleService-Info.plist not found"

**Solution:**
1. Ensure file is in project root
2. Check target membership in File Inspector
3. Rebuild project

### Issue: "Firebase not configured"

**Solution:**
1. Ensure `FirebaseApp.configure()` is called in `AppDelegate`
2. Verify `GoogleService-Info.plist` is correct
3. Check console for errors

### Issue: "No permission to access Firestore"

**Solution:**
1. Update Firestore Rules (temporarily for testing):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true; // ONLY FOR TESTING
       }
     }
   }
   ```
2. Remember to update to proper security rules later

---

## Useful Commands

```bash
# Clean build folder
⇧⌘K

# Build
⌘B

# Run
⌘R

# Stop
⌘.

# Show/hide navigator
⌘0

# Show/hide inspector
⌥⌘0

# Open quickly (find files)
⇧⌘O

# Format code
⌃I
```

---

## Learning Resources

### Swift Language
- [Swift.org Documentation](https://docs.swift.org)
- [Apple's Swift Book](https://docs.swift.org/swift-book/)

### SwiftUI
- [Apple SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
- [Hacking with Swift](https://www.hackingwithswift.com/100/swiftui)

### Firebase iOS
- [Firebase iOS Documentation](https://firebase.google.com/docs/ios/setup)
- [Firebase iOS Codelab](https://firebase.google.com/codelabs/firebase-ios-swift)

### Design
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Apple Design Resources](https://developer.apple.com/design/resources/)

---

## Support

### Questions?

1. **Check docs:** Read the comprehensive migration guide
2. **Firebase Console:** [console.firebase.google.com](https://console.firebase.google.com)
3. **Apple Developer Forums:** [developer.apple.com/forums](https://developer.apple.com/forums)
4. **Stack Overflow:** Tag questions with `swift`, `swiftui`, `firebase`

---

## Checklist

Use this to track your progress:

### Setup ✅
- [ ] Xcode installed
- [ ] Project created
- [ ] Firebase SDK added
- [ ] GoogleService-Info.plist added
- [ ] Firebase connected
- [ ] Project structure created

### Core Features
- [ ] Authentication (login/signup)
- [ ] Trade listing
- [ ] Trade creation
- [ ] Trade detail
- [ ] User profiles
- [ ] Messaging
- [ ] Gamification
- [ ] Challenges
- [ ] Collaboration

### Testing
- [ ] Unit tests
- [ ] UI tests
- [ ] Manual testing
- [ ] Beta testing (TestFlight)

### Launch
- [ ] App Store assets
- [ ] Privacy policy
- [ ] App review submission
- [ ] Approved & live

---

**🎉 You're ready to build TradeYa for iOS!**

Start with authentication or trades, then gradually add features. The comprehensive guide and code examples have everything you need.

Good luck! 🚀

---

**Document Version:** 1.0  
**Last Updated:** October 21, 2025  
**Maintained By:** TradeYa Development Team


