# Mr. Bunk Manager - Comprehensive Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Core Features](#core-features)
3. [Tech Stack](#tech-stack)
4. [Feature Specifications](#feature-specifications)
5. [Development Roadmap](#development-roadmap)
6. [Todo List](#todo-list)
7. [API Requirements](#api-requirements)
8. [AI Integration Details](#ai-integration-details)
9. [UI/UX Design Guidelines](#uiux-design-guidelines)
10. [Success Metrics](#success-metrics)
11. [Security & Privacy](#security--privacy)
12. [Future Enhancements](#future-enhancements)
13. [Support & Community](#support--community)
14. [License](#license)
15. [Contributors](#contributors)
16. [Acknowledgments](#acknowledgments)
17. [Contact](#contact)

---

## 🎯 Project Overview

**Mr. Bunk Manager** is an intelligent all-in-one attendance and academic management application designed specifically for students. The app leverages AI to automate timetable extraction, attendance tracking, and academic planning while providing smart recommendations for class attendance optimization.

### Vision
To empower students with intelligent tools that help them balance academic requirements, optimize attendance, and stay organized throughout their academic journey.

### Target Audience
- College/University students
- Students managing minimum attendance requirements (75%, 85%, etc.)
- Students juggling multiple courses, labs, and academic events
- Study groups and class communities

---

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

---

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

**Option 1: Firebase (Recommended for Beginners)**
- **Firebase Authentication** - Email, Google, Apple sign-in
- **Cloud Firestore** - NoSQL real-time database
- **Firebase Storage** - File storage for images, PDFs, notes
- **Cloud Functions** - Serverless backend logic
- **Firebase Cloud Messaging** - Push notifications
- **Firebase Analytics** - Built-in analytics
- **Advantages**: Easy setup, generous free tier, excellent docs, tight React Native integration

**Option 2: Supabase (Recommended for Advanced Users)**
- **PostgreSQL Database** - Relational database with SQL
- **Supabase Auth** - Authentication system
- **Supabase Storage** - File storage
- **Edge Functions** - Serverless Deno functions
- **Real-time Subscriptions** - WebSocket-based
- **Row Level Security (RLS)** - Granular access control
- **Advantages**: SQL database, open source, built-in Postgres features, REST API

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

### **Voice & Audio**
- **Expo AV** - Audio recording and playback
- **Expo Speech** - Text-to-speech (basic)
- **react-native-voice** (if needed) - Advanced voice recognition

### **Analytics & Monitoring**
- **Expo Analytics** - User analytics
- **Sentry** - Error tracking and monitoring
- **Mixpanel** or **Amplitude** - User behavior analytics

### **Development Tools**
- **TypeScript** - Type safety
- **ESLint & Prettier** - Code quality
- **Husky** - Git hooks
- **Jest & React Native Testing Library** - Unit testing
- **Detox** (optional) - E2E testing

---

## 📱 Feature Specifications

### Feature 1: AI Timetable Extraction

**User Flow:**
1. User taps "Add Timetable" button
2. Choose: Take Photo / Upload from Gallery
3. Crop/adjust image if needed
4. App shows loading with AI processing message
5. Extracted timetable displayed for review
6. User can edit/correct entries
7. Save timetable to database

**Technical Implementation:**
- Use Expo Camera or Image Picker
- Send image to Google Gemini 2.0 Flash API
- Prompt: "Extract timetable data: Day, Time, Subject, Room, Type (Lecture/Lab)"
- Parse JSON response
- Display in editable table format
- Store in Supabase database

### Feature 2: Smart Attendance Tracking

**User Flow:**
1. Dashboard shows today's classes
2. User marks attendance (Present/Absent) after class
3. App calculates and updates percentage
4. View subject-wise and overall attendance
5. Get alerts when attendance drops below threshold

**Technical Implementation:**
- Automatic class schedule from timetable
- Manual attendance marking (swipe/tap gesture)
- Real-time calculation: `(Present / Total) * 100`
- Background notifications for classes
- Store attendance records in database

**Calculations:**
- **Current Percentage:** `(attended / total) * 100`
- **Classes to Attend:** `Math.ceil((required% * (total + n) - attended) / (1 - required%))`
- **Classes Can Bunk:** `Math.floor((attended - required% * total) / required%)`

---

### Feature 3: Bunk Management Algorithms

**Algorithm: Safe Bunk Calculator**
- Calculate current percentage: `(attended / total) * 100`
- Calculate classes that can be safely bunked
- Calculate classes that must be attended to reach/maintain required percentage
- Determine status (Safe, Warning, Danger) based on current percentage vs required percentage

**Smart Recommendations:**
- If attendance > required% + 10%: "You can safely bunk this class"
- If attendance = required% ± 5%: "Attend this class to maintain minimum"
- If attendance < required% - 5%: "MUST ATTEND - Attendance critical!"

---

### Feature 4: AI Assistant Implementation

**Voice-to-Voice Flow:**
1. User taps microphone button
2. Record audio
3. Send to Google Cloud Speech-to-Text API (speech-to-text)
4. Process text with Grok API + context (attendance data, schedule)
5. Generate response text
6. Convert to speech (Google Cloud Text-to-Speech)
7. Play audio response

**Context Injection:**
- Current attendance data
- Today's schedule
- Upcoming events
- Academic queries support

**Sample Queries & Responses:**
- User: "How many classes can I bunk?"
  - Response: "Based on your current 87% attendance, you can safely bunk 3 more classes and still maintain the 85% requirement."

- User: "What's my next class?"
  - Response: "Your next class is Data Structures at 2 PM in Room 301. It's a lecture session."

---

### Feature 5: Class Groups & Collaboration

**Group Structure:**
- Group ID
- Name
- Subject
- Semester
- Admin ID
- Members list
- Creation date

**Features:**
- Admin can post notices and notes
- File upload support
- Real-time updates
- Comment/reply functionality
- Search within group posts

---

### Feature 6: Academic Event Calendar

**Event Extraction Flow:**
1. User uploads academic calendar (PDF/image)
2. AI extracts events (Gemini 2.0 Flash)
3. Parse dates, event names, descriptions
4. Store in database
5. Setup notifications for each event

**Notification Strategy:**
- Exams: 7 days before, 3 days before, 1 day before
- Assignments: 3 days before, 1 day before
- Events: 1 day before

---

## 🗓️ Development Roadmap

### **Phase 1: Foundation (Weeks 1-3)**
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

---

## ✅ Todo List

### **Current Development Status**

#### **Phase 1: Foundation (Weeks 1-3)** 🔄 In Progress
- [ ] Initialize Expo project with TypeScript
- [ ] Setup project structure and folder organization
- [ ] Configure ESLint, Prettier, and TypeScript
- [ ] Setup Supabase project and configure environment
- [ ] Design and implement database schema
- [ ] Create authentication system (login, signup, password reset)
- [ ] Setup React Navigation structure
- [ ] Install and configure React Native Paper
- [ ] Create base UI components (Button, Input, Card, etc.)
- [ ] Implement dark/light theme system
- [ ] Setup state management (Zustand/Redux Toolkit)
- [ ] Configure Expo notifications
- [ ] Setup error tracking (Sentry)

#### **Phase 2: Core Features (Weeks 4-7)** ⏳ Pending
- [ ] Design timetable management screens
- [ ] Implement manual timetable entry form
- [ ] Create timetable grid/list view component
- [ ] Integrate Expo Camera for timetable photo capture
- [ ] Implement image upload from gallery
- [ ] Setup OpenAI GPT-4 Vision API integration
- [ ] Create AI extraction prompt and response parser
- [ ] Build timetable editing interface
- [ ] Implement subject management (add, edit, delete)
- [ ] Create dashboard screen layout
- [ ] Build today's classes component
- [ ] Implement attendance marking UI (swipe/tap gestures)
- [ ] Create attendance calculation functions
- [ ] Build subject-wise attendance display
- [ ] Implement overall attendance progress indicator
- [ ] Setup local storage for offline data
- [ ] Create attendance history view

#### **Phase 3: Smart Features (Weeks 8-10)** ⏳ Pending
- [ ] Implement bunk calculator algorithm
- [ ] Create "classes can bunk" display component
- [ ] Build "classes must attend" calculation
- [ ] Implement attendance status indicators (safe/warning/danger)
- [ ] Create smart recommendation system
- [ ] Build attendance analytics charts (weekly, monthly)
- [ ] Implement trend analysis visualization
- [ ] Setup background notification system
- [ ] Create class reminder scheduling
- [ ] Implement customizable reminder timing
- [ ] Build exam alert notifications
- [ ] Create notification preferences screen
- [ ] Test notification delivery and reliability

#### **Phase 4: AI Assistant (Weeks 11-13)** ⏳ Pending
- [ ] Design AI assistant UI/UX
- [ ] Implement chat interface layout
- [ ] Setup Expo AV for audio recording
- [ ] Integrate OpenAI Whisper API for speech-to-text
- [ ] Create context injection system (attendance, schedule, events)
- [ ] Integrate GPT-4 API for conversational responses
- [ ] Implement query routing logic
- [ ] Setup ElevenLabs or OpenAI TTS API
- [ ] Implement text-to-speech playback
- [ ] Create voice button UI with animation
- [ ] Build conversation history storage
- [ ] Implement suggested queries feature
- [ ] Add English communication improvement mode
- [ ] Test voice assistant accuracy and response time

#### **Phase 5: Collaboration (Weeks 14-16)** ⏳ Pending
- [ ] Design class groups screens
- [ ] Implement group creation flow
- [ ] Build group join functionality
- [ ] Create admin controls and permissions
- [ ] Implement group member management
- [ ] Build notice board feed UI
- [ ] Create post creation interface (notice, notes, discussion)
- [ ] Implement file upload system (Supabase Storage)
- [ ] Build file download and preview
- [ ] Setup real-time updates (Supabase subscriptions)
- [ ] Create comment/reply functionality
- [ ] Implement group search feature
- [ ] Build notification system for group posts
- [ ] Test real-time synchronization

#### **Phase 6: Calendar & Events (Weeks 17-18)** ⏳ Pending
- [ ] Design calendar UI layout
- [ ] Implement calendar view component
- [ ] Create event creation form
- [ ] Build manual event entry
- [ ] Integrate GPT-4 Vision for calendar extraction
- [ ] Implement PDF/image upload for calendars
- [ ] Create event parsing and validation
- [ ] Build event notification scheduling
- [ ] Implement event reminder system (7 days, 3 days, 1 day)
- [ ] Create event categories and filtering
- [ ] Build upcoming events widget
- [ ] Implement device calendar sync (optional)
- [ ] Test calendar extraction accuracy

#### **Phase 7: Polish & Testing (Weeks 19-21)** ⏳ Pending
- [ ] Conduct UI/UX review and refinement
- [ ] Implement loading states and error handling
- [ ] Add animations and transitions
- [ ] Optimize app performance (bundle size, render time)
- [ ] Implement offline mode support
- [ ] Create onboarding tutorial screens
- [ ] Write unit tests for core functions
- [ ] Write integration tests for API calls
- [ ] Conduct E2E testing with Detox (optional)
- [ ] Perform security audit
- [ ] Fix identified bugs and issues
- [ ] Gather beta tester feedback
- [ ] Implement user feedback improvements
- [ ] Finalize app icons and splash screens

#### **Phase 8: Launch (Week 22)** ⏳ Pending
- [ ] Prepare App Store assets (screenshots, descriptions)
- [ ] Write app store listing copy
- [ ] Create promotional materials
- [ ] Setup app analytics and monitoring
- [ ] Configure production environment variables
- [ ] Build production app bundles
- [ ] Submit to Apple App Store
- [ ] Submit to Google Play Store
- [ ] Create user documentation and FAQ
- [ ] Setup support channels (email, chat)
- [ ] Launch marketing campaign
- [ ] Monitor initial user feedback
- [ ] Prepare for post-launch updates

### **Ongoing Tasks**
- [ ] Regular code reviews and refactoring
- [ ] Documentation updates
- [ ] Performance monitoring
- [ ] User feedback collection
- [ ] Bug triage and fixes
- [ ] Security updates
- [ ] API key rotation and management

### **Future Enhancements** 🎯 Planned
- [ ] Offline mode with local database sync
- [ ] Study planner and goal tracking
- [ ] GPA calculator integration
- [ ] Scholarship and internship alerts
- [ ] Peer study matching feature
- [ ] Pomodoro timer for study sessions
- [ ] LMS integration (Moodle, Canvas)
- [ ] Export attendance reports (PDF, CSV)
- [ ] Multi-language support
- [ ] Accessibility improvements (screen reader, high contrast)
- [ ] Widget for home screen (Android/iOS)
- [ ] Apple Watch / Wear OS companion app

---

## 🔌 API Requirements

### **Google Gemini APIs**

1. **Gemini 2.0 Flash API** (Timetable & Calendar Extraction)
   - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
   - Model: `gemini-2.0-flash`
   - Features: Multimodal (text + images), fast response, vision capabilities
   - Usage: Extract timetable and calendar data from images
   - Cost: Free tier available, then pay-per-use

### **xAI Grok APIs**

1. **Grok API** (Conversational AI Assistant)
   - Endpoint: `https://api.x.ai/v1/chat/completions`
   - Model: `grok-beta`
   - Features: Real-time context, conversational, up-to-date knowledge
   - Usage: Context-aware AI assistant for student queries
   - Cost: Beta pricing available

### **Google Cloud Speech & TTS APIs**

1. **Cloud Speech-to-Text API** (Voice Input)
   - Endpoint: `https://speech.googleapis.com/v1/speech:recognize`
   - Features: 125+ languages, automatic punctuation, noise filtering
   - Usage: Convert student voice queries to text
   - Cost: Free tier: 60 minutes/month

2. **Cloud Text-to-Speech API** (Voice Output)
   - Endpoint: `https://texttospeech.googleapis.com/v1/text:synthesize`
   - Features: 220+ voices, 40+ languages, WaveNet voices
   - Usage: Convert AI responses to natural speech
   - Cost: Free tier: 1 million characters/month

---

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

#### **Google Cloud Speech/TTS - Advantages:**
1. **Quality**: Industry-leading natural voices (WaveNet/Neural2)
2. **Free Tier**: 60 min/month STT, 1M chars/month TTS
3. **Accuracy**: Superior speech recognition with punctuation
4. **Latency**: Fast processing for real-time voice interactions
5. **Language Support**: 125+ languages for global expansion

**Use Cases in App:**
- Voice-to-voice AI assistant
- Hands-free attendance queries
- Voice-based schedule checks
- English pronunciation practice

---

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

### **Typography**
- **Headings:** Poppins Bold (24-32px)
- **Body:** Inter Regular (14-16px)
- **Captions:** Inter Light (12-14px)

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

---

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

### **Business Metrics**
- User retention (Day 7, Day 30)
- App store ratings > 4.5/5
- User referrals
- Premium conversion (if applicable)

---

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

---

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

---

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

---

## 📄 License

MIT License (or your preferred license)

---

## 👥 Contributors

- **Project Lead:** [Your Name]
- **AI Integration:** [Team Member]
- **UI/UX Design:** [Team Member]
- **Backend:** [Team Member]

---

## 🙏 Acknowledgments

- Google for Gemini 2.0 Flash and Cloud APIs
- xAI for Grok conversational AI
- Supabase for backend infrastructure
- Expo team for React Native framework
- Open source community

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
**Status:** 🔄 In Development

---


**Made with ❤️ for students, by students**