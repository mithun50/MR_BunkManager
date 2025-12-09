# Mister BunkManager - NotebookLLM Video Script

## Project Overview

Mister BunkManager is a comprehensive attendance management and student collaboration platform built with React Native (Expo) and Firebase. It helps students track their attendance, manage class schedules, collaborate through study groups, and share study materials.

---

## Key Features to Highlight

### 1. Smart Attendance Tracking
- Track attendance across all subjects with visual analytics
- Beautiful donut charts showing overall and subject-wise attendance percentages
- Mark attendance as Present, Absent, or Leave
- Automatic attendance percentage calculation
- Always know how many classes you must attend to maintain your required attendance

### 2. Timetable Management - Two Ways
**Manual Entry (Default):**
- Add, edit, and delete class entries with an intuitive UI
- Specify day, time, subject, faculty, room, and class type
- Perfect for students who want full control

**OCR Extraction (AI-Powered):**
- Simply upload or capture a photo of your timetable
- OCR.space API extracts text from the image
- Groq AI (Llama 4 Maverick) intelligently parses the text into structured entries
- Review and edit extracted entries before saving
- Supports JPG, PNG, GIF, WebP, BMP, and TIFF formats

### 3. AI Assistant
- Get personalized attendance advice powered by AI
- Ask questions about your attendance status
- Voice-based interaction available
- Context-aware responses based on your actual attendance data

### 4. Study Groups & Collaboration
- Create and join study groups with classmates
- Real-time chat messaging
- Share files, links, and study materials within groups
- Group categories: Study, Project, Social, General

### 5. Notes Sharing Platform
- Share study materials with the community
- Support for text notes, PDFs, images, and links
- Like, comment, and save notes from other students
- Follow classmates to see their shared content in your feed
- Search and discover notes by subject or tags

### 6. Smart Notifications
- Daily reminders about tomorrow's classes (8 AM)
- Class reminders 30 and 10 minutes before each class
- Notifications when followed users share new notes
- Group activity notifications

---

## Technical Highlights

### Cross-Platform
- Works on Android, iOS, and Web
- Built with React Native and Expo SDK 54
- Responsive design adapts to mobile, tablet, and desktop

### Modern Tech Stack
- **Frontend:** React Native, Expo Router, React Native Paper (Material Design)
- **Backend:** Firebase (Authentication, Firestore Database)
- **AI Services:** Groq API for chat, OCR.space for image text extraction
- **State Management:** Zustand
- **File Storage:** Google Drive and Catbox.moe integration

### Offline Support
- Works offline with local caching
- Queues operations when offline
- Auto-syncs when back online

---

## User Journey

### Getting Started
1. Download the app or access via web
2. Create an account with email verification
3. Complete onboarding: set up profile, add timetable, configure attendance goal

### Daily Usage
1. Open app to see today's classes on dashboard
2. Mark attendance after each class
3. Check attendance calculator to stay on track with your attendance goals
4. Share notes and collaborate in study groups

### The Attendance Calculator
- Set your minimum attendance target (e.g., 75%)
- The app calculates how many classes you need to attend to reach your goal
- Stay informed and maintain good attendance throughout the semester

---

## Target Audience

- College and university students
- Students who want to manage attendance effectively
- Study groups looking for collaboration tools
- Anyone who wants to share and discover study materials

---

## Why Mister BunkManager?

1. **All-in-One Solution:** Attendance + Timetable + Notes + Groups in one app
2. **AI-Powered:** Smart timetable extraction and personalized assistance
3. **Student-Focused:** Built by students, for students
4. **Free & Open Source:** Available on GitHub
5. **Cross-Platform:** Use on any device

---

## Call to Action

- Download the Android app from GitHub releases
- Try the web app at mr-bunk-manager-idtl.vercel.app
- Star the project on GitHub: github.com/mithun50/MR_BunkManager

---

## Development Team

- **Mithun Gowda B** - Core Developer, Full-Stack Development
- **Nevil Dsouza** - Team Leader, Core Dev, Testing
- **Naren V** - UI Designer
- **Manas Habbu** - Documentation, Presentation, Design
- **Manasvi R** - Documentation, Presentation Design
- **Lavanya** - Documentation, Presentation

---

## Quick Stats

- **Platform:** Android, iOS, Web
- **Version:** 1.0.1
- **Tech:** React Native + Expo + Firebase
- **AI:** Groq (Llama 4 Maverick) + OCR.space
- **License:** Apache 2.0
- **Package:** com.idtl.mrbunkmanager

---

## Script Notes for Video Generation

**Tone:** Friendly, informative, student-focused
**Duration Target:** 2-3 minutes
**Key Messages:**
1. Stay on top of your attendance goals
2. AI makes timetable setup effortless
3. Collaborate and share with classmates
4. Available everywhere - phone, tablet, web

**Visual Suggestions:**
- Show the colorful dashboard with donut charts
- Demo the OCR timetable extraction flow
- Highlight the attendance calculator feature
- Show study groups and notes sharing

---

*Mister BunkManager - Smart Attendance Management for Smart Students*
