# Mr. Bunk Manager

[![Expo](https://img.shields.io/badge/Expo-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Mr. Bunk Manager is an intelligent all-in-one attendance and academic management application designed specifically for students. The app leverages AI to automate timetable extraction, attendance tracking, and academic planning while providing smart recommendations for class attendance optimization.

## 🎯 Project Overview

**Mr. Bunk Manager** is an intelligent all-in-one attendance and academic management application designed specifically for students. The app leverages AI to automate timetable extraction, attendance tracking, and academic planning while providing smart recommendations for class attendance optimization.

### Vision
To empower students with intelligent tools that help them balance academic requirements, optimize attendance, and stay organized throughout their academic journey.

### Target Audience
- College/University students
- Students managing minimum attendance requirements (75%, 85%, etc.)
- Students juggling multiple courses, labs, and academic events
- Study groups and class communities

## ✨ Core Features

### 1. **AI-Powered Timetable Extraction**
- Upload photo of timetable
- AI extracts and organizes schedule automatically
- Manual editing capabilities for corrections
- Multi-semester support
- Sync across devices

### 2. **Smart Attendance Tracking**
- Automatic attendance calculation
- Real-time attendance percentage display
- Subject-wise and overall attendance tracking
- Historical attendance data and trends
- Manual attendance entry and editing

### 3. **Bunk Management System**
- Calculate classes to attend for minimum percentage
- Show how many classes can be safely bunked
- Smart recommendations: attend or skip suggestions
- "Safe zone" and "danger zone" indicators
- Predictive analysis for future attendance

### 4. **Intelligent Reminders**
- Lab session reminders
- Record submission alerts
- Upcoming class notifications
- Customizable reminder timing (15 min, 30 min, 1 hour before)
- Exam alerts and countdown

### 5. **Academic Event Calendar**
- Upload academic event calendar (PDF/image)
- AI-powered calendar extraction
- Automatic event notifications
- Exam schedules and deadlines
- Assignment and project due dates

### 6. **Class Groups & Collaboration**
- Subject-wise group creation
- Admin-managed groups (CR/class representative)
- Notice board for announcements
- Notes sharing for all semester modules
- File upload and download support
- Group chat functionality

### 7. **AI Assistant**
- Voice-to-voice interaction
- Natural language query support
- Attendance queries: "How many classes can I bunk?"
- Schedule queries: "What's my next class?"
- English communication improvement
- Academic guidance and tips
- Conversational AI with context awareness

### 8. **Analytics & Insights**
- Attendance trends and patterns
- Subject-wise performance overview
- Weekly/monthly attendance reports
- Bunk history and patterns
- Predictive analytics for attendance goals

## 🛠️ Tech Stack

### **Frontend Framework**
- **React Native** (via Expo)
  - Cross-platform development (iOS & Android)
  - Expo SDK for rapid development
  - TypeScript for type safety
  - Hot reload and OTA updates

### **UI/UX Libraries**
- **React Native Paper** - Material Design components
- **React Navigation** - Navigation and routing
- **React Native Reanimated** - Smooth animations
- **React Native Gesture Handler** - Touch interactions
- **Expo Vector Icons** - Icon library
- **React Native Chart Kit** - Data visualization

### **State Management**
- **Zustand** or **Redux Toolkit** - Global state management
- **React Query** - Server state management and caching
- **AsyncStorage** - Local storage

### **AI/ML Integration**
- **Google Gemini 2.0 Flash** - Multimodal AI for timetable & calendar extraction
- **xAI Grok API** - Conversational AI assistant with real-time context
- **Google Cloud Speech-to-Text API** - Voice-to-text conversion
- **Google Cloud Text-to-Speech API** - Text-to-speech for voice assistant
- **Google ML Kit** (optional) - On-device OCR fallback

### **Backend & Database**
- **Supabase** (PostgreSQL Database) - Relational database with SQL
  - Supabase Auth - Authentication system
  - Supabase Storage - File storage
  - Edge Functions - Serverless Deno functions
  - Real-time Subscriptions - WebSocket-based
  - Row Level Security (RLS) - Granular access control

### **Notifications**
- **Expo Notifications** - Push notifications
- **Expo Background Fetch** - Background tasks for reminders
- **Expo Task Manager** - Scheduled notifications

### **Camera & File Handling**
- **Expo Camera** - Camera access for timetable photos
- **Expo Image Picker** - Photo/document selection
- **Expo Document Picker** - PDF and file uploads
- **Expo File System** - File management

### **Calendar & Scheduling**
- **Expo Calendar** - Device calendar integration
- **date-fns** - Date manipulation and formatting
- **react-native-calendars** - Calendar UI components

## 📱 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (optional but recommended)
- Android Studio or Xcode for device simulation (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/narenashwin/MR_BunkManager.git
cd MR_BunkManager
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Add your API keys and configuration
```

4. Start the development server:
```bash
npm start
# or
yarn start
```

5. Scan the QR code with the Expo Go app on your mobile device or use an emulator.

### Available Scripts

- `npm start` - Start the development server
- `npm run android` - Run the app on Android
- `npm run ios` - Run the app on iOS
- `npm run web` - Run the app on web
- `npm run reset-project` - Reset the project to initial state
- `npm run lint` - Lint the code

## 🗂️ Project Structure

```
MR_BunkManager/
├── app/                    # Expo Router app structure
│   ├── (tabs)/            # Main tab navigation
│   │   ├── index.tsx      # Home screen
│   │   └── explore.tsx    # Explore screen
│   ├── modal.tsx          # Modal screen
│   └── _layout.tsx        # Root layout
├── assets/                # Static assets (images, icons)
├── components/            # Reusable UI components
│   ├── ui/               # UI building blocks
│   └── ...               # Other components
├── constants/             # Constants and themes
├── hooks/                 # Custom React hooks
├── scripts/               # Build scripts
└── ...
```

## 🗓️ Development Roadmap

### **Phase 1: Foundation (Weeks 1-3)** ✅
- ✅ Project setup with Expo and TypeScript
- ✅ Authentication system (Supabase Auth)
- ✅ Database schema design
- ✅ Basic navigation structure
- ✅ UI component library setup (React Native Paper)

### **Phase 2: Core Features (Weeks 4-7)**
- ⏳ Timetable management screen
- ⏳ AI timetable extraction integration
- ⏳ Manual timetable entry/editing
- ⏳ Attendance tracking implementation
- ⏳ Attendance calculation algorithms
- ⏳ Dashboard with today's classes

### **Phase 3: Smart Features (Weeks 8-10)**
- ⏳ Bunk calculator algorithms
- ⏳ Smart attendance recommendations
- ⏳ Attendance analytics and charts
- ⏳ Notification system setup
- ⏳ Reminder scheduling

### **Phase 4: AI Assistant (Weeks 11-13)**
- ⏳ Voice recording integration
- ⏳ OpenAI Whisper API integration
- ⏳ GPT-4 context-aware responses
- ⏳ Text-to-speech implementation
- ⏳ Voice assistant UI/UX

### **Phase 5: Collaboration (Weeks 14-16)**
- ⏳ Class groups creation
- ⏳ Group posts and notices
- ⏳ File upload/download system
- ⏳ Real-time updates
- ⏳ Admin controls

### **Phase 6: Calendar & Events (Weeks 17-18)**
- ⏳ Calendar UI implementation
- ⏳ Event extraction from images/PDFs
- ⏳ Event notifications
- ⏳ Calendar sync

### **Phase 7: Polish & Testing (Weeks 19-21)**
- ⏳ UI/UX refinement
- ⏳ Performance optimization
- ⏳ Bug fixes and testing
- ⏳ User feedback implementation
- ⏳ Beta testing

### **Phase 8: Launch (Week 22)**
- ⏳ App Store submission (iOS)
- ⏳ Google Play submission (Android)
- ⏳ Documentation and user guides
- ⏳ Marketing materials

## 🤖 AI Integration Details

### **Why Gemini and Grok?**

#### **Google Gemini 2.0 Flash - Advantages:**
1. **Multimodal Excellence**: Native support for images, text, and structured data extraction
2. **Cost Efficiency**: Generous free tier (15 requests/minute, 1500 requests/day)
3. **Speed**: Optimized for fast response times (flash variant)
4. **Accuracy**: Superior vision capabilities for timetable/calendar extraction
5. **JSON Mode**: Native structured output support
6. **Long Context**: Handles complex documents efficiently

**Use Cases in App:**
- Timetable extraction from images
- Academic calendar parsing
- Document understanding
- Image-based data extraction

#### **xAI Grok - Advantages:**
1. **Real-time Context**: Access to current information and events
2. **Conversational**: Natural, engaging student-friendly responses
3. **Context Awareness**: Better understanding of student queries
4. **Educational Focus**: Designed for helpful, informative interactions
5. **Humor & Personality**: More relatable for student users

**Use Cases in App:**
- Student AI assistant conversations
- Attendance queries
- Schedule questions
- Academic guidance
- English communication practice

## 🎨 UI/UX Design Guidelines

### **Design Principles**
1. **Simplicity First** - Clean, intuitive interfaces
2. **Mobile-First** - Optimized for one-hand usage
3. **Quick Actions** - Most tasks in 2-3 taps
4. **Visual Feedback** - Clear status indicators
5. **Accessibility** - High contrast, readable fonts

### **Color Scheme**
- **Primary:** #6366F1 (Indigo) - Actions, CTAs
- **Secondary:** #10B981 (Green) - Success, safe attendance
- **Warning:** #F59E0B (Amber) - Warning zone
- **Danger:** #EF4444 (Red) - Critical attendance
- **Background:** #F9FAFB (Light gray)
- **Text:** #111827 (Dark gray)

### **Key Screens**

1. **Dashboard**
   - Today's classes list
   - Overall attendance percentage (circular progress)
   - Quick actions: Mark Attendance, View Timetable
   - Upcoming events carousel
   - AI Assistant floating button

2. **Attendance Screen**
   - Subject cards with progress bars
   - Color-coded status (green/yellow/red)
   - Bunk calculator for each subject
   - Charts and analytics

3. **Timetable Screen**
   - Weekly grid view
   - Day selector tabs
   - Add/Edit timetable button
   - AI upload option

4. **AI Assistant Screen**
   - Chat interface
   - Voice button (prominent)
   - Suggested queries chips
   - Conversation history

5. **Groups Screen**
   - Group list cards
   - Notice board feed
   - Create/Join group options
   - File attachments

## 📊 Success Metrics

### **User Engagement**
- Daily Active Users (DAU)
- Session duration
- Feature adoption rates
- Attendance marking frequency

### **Performance**
- App load time < 3s
- AI response time < 5s
- API response time < 2s
- Crash-free rate > 99%

## 🔒 Security & Privacy

### **Data Protection**
- End-to-end encryption for sensitive data
- Secure API key storage
- Row Level Security (RLS) in Supabase
- No data sharing with third parties

### **Compliance**
- GDPR compliance (for EU users)
- Data deletion on user request
- Privacy policy and terms of service
- Age verification (13+)

## 🎯 Future Enhancements

### **Version 2.0 Features**
- Offline mode support
- Study planner and goal tracking
- GPA calculator
- Scholarship and internship alerts
- Peer study matching
- Pomodoro timer for study sessions
- Integration with LMS (Moodle, Canvas)

### **Premium Features** (Optional)
- Unlimited AI assistant queries
- Advanced analytics and insights
- Custom themes
- Ad-free experience
- Priority support

## 🤝 Contributing

We welcome contributions to Mr. Bunk Manager! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please make sure to update tests as appropriate and follow the code style guidelines.

## 📞 Support & Community

### **Documentation**
- User guide
- FAQ section
- Video tutorials
- Developer documentation

### **Community**
- Discord server
- GitHub discussions
- Feature request portal
- Bug reporting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributors

- **Project Lead:** [Your Name]
- **AI Integration:** [Team Member]
- **UI/UX Design:** [Team Member]
- **Backend:** [Team Member]

## 🙏 Acknowledgments

- Google for Gemini 2.0 Flash and Cloud APIs
- xAI for Grok conversational AI
- Supabase for backend infrastructure
- Expo team for React Native framework
- Open source community

---

**Made with ❤️ for students, by students**

**Last Updated:** 2025-11-13  
**Version:** 1.0.0  
**Status:** 🔄 In Development