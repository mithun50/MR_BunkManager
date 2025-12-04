# MR Bunk Manager - Project Report

## Academic Project Documentation

**Project Title:** MR Bunk Manager - Smart Attendance Management and Student Collaboration Platform

**Version:** 1.0.0

**Platform:** Cross-Platform Mobile and Web Application

**Live Web Application:** https://mr-bunk-manager-idtl.vercel.app

---

## Table of Contents

1. Abstract
2. Introduction
3. Problem Statement
4. Objectives
5. Literature Survey
6. System Analysis
7. System Design
8. Technology Stack
9. Module Description
10. Features and Functionality
11. Implementation Details
12. Testing and Results
13. Limitations and Future Scope
14. Conclusion
15. References

---

## 1. Abstract

MR Bunk Manager is a comprehensive mobile and web application designed to revolutionize how students manage their academic attendance and collaborate with peers. The application addresses the critical challenge faced by students in tracking their attendance across multiple subjects while maintaining the minimum attendance percentage required by educational institutions.

The system integrates artificial intelligence capabilities for automated timetable extraction, real-time attendance calculations, and an intelligent chatbot assistant. Additionally, it provides a social learning platform where students can share academic notes, form study groups, and engage in collaborative learning.

Built using modern cross-platform technologies, the application supports Android, iOS, and web platforms from a single codebase, ensuring accessibility across all devices. The implementation follows industry-standard architectural patterns and incorporates offline-first design principles to ensure functionality even without internet connectivity.

**Keywords:** Attendance Management, Student Collaboration, Cross-Platform Development, Artificial Intelligence, Real-Time Database, Social Learning

---

## 2. Introduction

### 2.1 Background

In the contemporary educational landscape, students are required to maintain a minimum attendance percentage, typically seventy-five to eighty-five percent, to be eligible for examinations. Many students struggle to track their attendance across multiple subjects, leading to last-minute realizations about attendance shortages. This often results in academic penalties or examination debarment.

Traditional methods of attendance tracking, such as manual registers or institutional portals, lack real-time calculation capabilities and fail to provide predictive insights about future attendance requirements. Students need a proactive tool that not only tracks attendance but also advises them on how many classes they can miss while still meeting requirements.

### 2.2 Motivation

The motivation for developing MR Bunk Manager stems from personal observations of students facing attendance-related academic challenges. The lack of a unified platform that combines attendance tracking, schedule management, and peer collaboration creates inefficiencies in the academic workflow.

Furthermore, the rise of artificial intelligence in educational technology presents an opportunity to automate tedious tasks like timetable entry and provide intelligent recommendations based on attendance patterns.

### 2.3 Scope

The scope of this project encompasses:

- Development of a cross-platform mobile and web application
- Implementation of intelligent attendance tracking and prediction algorithms
- Integration of artificial intelligence for timetable extraction and student assistance
- Creation of a social learning platform for note sharing and group collaboration
- Design of a scalable backend infrastructure supporting real-time data synchronization

---

## 3. Problem Statement

Students in higher educational institutions face several challenges related to attendance management:

**Primary Challenges:**

1. Lack of real-time attendance visibility across multiple subjects
2. Inability to calculate permissible absences while maintaining minimum attendance
3. Manual and time-consuming process of maintaining personal attendance records
4. Absence of a unified platform for schedule management and attendance tracking
5. Limited collaboration tools tailored for academic peer learning

**Secondary Challenges:**

1. Difficulty in entering and maintaining complex weekly timetables
2. No predictive analytics for attendance planning
3. Fragmented communication channels for student study groups
4. Limited access to peer-generated academic resources

**Proposed Solution:**

A comprehensive application that automates attendance tracking, provides intelligent calculations for permissible absences, offers artificial intelligence-powered timetable entry, and facilitates peer collaboration through social learning features.

---

## 4. Objectives

### 4.1 Primary Objectives

1. **Automated Attendance Tracking:** Develop a system that allows students to record attendance quickly and view subject-wise attendance percentages in real-time.

2. **Intelligent Bunk Calculation:** Implement algorithms that calculate how many classes a student can miss while maintaining the minimum required attendance percentage.

3. **AI-Powered Timetable Entry:** Integrate artificial intelligence vision capabilities to extract timetable information from images of handwritten or printed schedules.

4. **Cross-Platform Accessibility:** Build the application to work seamlessly on Android, iOS, and web platforms from a unified codebase.

### 4.2 Secondary Objectives

1. **Social Learning Platform:** Create features for note sharing, peer following, and academic content discovery.

2. **Group Collaboration:** Implement real-time group chat functionality for study group coordination.

3. **Intelligent Assistant:** Develop an AI-powered chatbot that provides attendance advice and academic support.

4. **Offline Functionality:** Ensure core features work without internet connectivity through offline-first architecture.

5. **Push Notifications:** Implement reminder systems for upcoming classes and attendance warnings.

---

## 5. Literature Survey

### 5.1 Existing Systems

**5.1.1 Institutional Attendance Portals**

Most educational institutions provide web-based portals for attendance viewing. However, these systems typically only display cumulative attendance without predictive analytics or real-time updates. They lack mobile-first design and do not integrate with personal schedule management.

**5.1.2 Generic Attendance Applications**

Several mobile applications exist for attendance tracking, but they focus primarily on workplace attendance or simple counters without educational context. They do not calculate minimum attendance requirements or provide subject-wise tracking.

**5.1.3 Student Collaboration Platforms**

Existing platforms like Discord or WhatsApp groups provide communication channels but lack integration with academic workflows. They do not offer features specifically designed for academic note sharing or attendance-aware collaboration.

### 5.2 Limitations of Existing Systems

1. No integration between attendance tracking and schedule management
2. Lack of predictive analytics for attendance planning
3. Absence of artificial intelligence for automation
4. No unified platform combining attendance and collaboration
5. Limited cross-platform availability
6. No offline functionality

### 5.3 Proposed Improvements

MR Bunk Manager addresses these limitations through:

1. Unified platform integrating attendance, timetable, and collaboration
2. Artificial intelligence for timetable extraction and intelligent assistance
3. Real-time attendance calculations with bunk prediction
4. Cross-platform development ensuring universal accessibility
5. Offline-first architecture for uninterrupted usage
6. Social features tailored for academic contexts

---

## 6. System Analysis

### 6.1 Feasibility Study

**6.1.1 Technical Feasibility**

The project is technically feasible using established technologies:
- React Native framework for cross-platform mobile development
- Firebase platform for backend services including authentication, database, and storage
- Groq API for artificial intelligence capabilities
- Expo framework for simplified development and deployment

**6.1.2 Economic Feasibility**

The project utilizes cost-effective technologies:
- Open-source frontend framework with no licensing costs
- Firebase free tier supports significant user base
- AI API costs are minimal for educational usage patterns
- Cloud hosting costs are manageable for student-focused applications

**6.1.3 Operational Feasibility**

The application is designed for ease of use:
- Intuitive user interface following Material Design guidelines
- Minimal learning curve for target users
- Self-explanatory features requiring no training
- Accessible on devices students already own

### 6.2 Requirement Analysis

**6.2.1 Functional Requirements**

1. User registration and authentication with email verification
2. Profile creation with academic details
3. Timetable entry through manual input or image upload
4. Subject-wise attendance recording and tracking
5. Real-time attendance percentage calculation
6. Bunk calculation showing permissible absences
7. Note creation, sharing, and discovery
8. User following and feed generation
9. Group creation and real-time messaging
10. Push notification delivery

**6.2.2 Non-Functional Requirements**

1. Response time under three seconds for all operations
2. Support for concurrent users without performance degradation
3. Data encryption for sensitive information
4. Offline functionality for core features
5. Cross-platform consistency in user experience
6. Accessibility compliance for diverse users

### 6.3 Use Case Analysis

**Primary Actors:**
- Student User
- System Administrator

**Use Cases:**

1. Register and Create Profile
2. Enter or Upload Timetable
3. Record Daily Attendance
4. View Attendance Statistics
5. Calculate Permissible Bunks
6. Create and Share Notes
7. Follow Other Users
8. Join and Participate in Groups
9. Interact with AI Assistant
10. Receive Notifications

---

## 7. System Design

### 7.1 Architectural Overview

The application follows a three-tier architecture:

**Presentation Layer:** Cross-platform user interface built with React Native, providing consistent experience across Android, iOS, and web platforms.

**Business Logic Layer:** Service layer implementing attendance calculations, data transformations, and integration with external APIs including artificial intelligence services.

**Data Layer:** Cloud-based database using Firebase Firestore with real-time synchronization capabilities and offline persistence.

### 7.2 Design Patterns

**7.2.1 Service Layer Pattern**

All business logic is encapsulated in dedicated service modules, separating concerns from the user interface layer. This promotes reusability, testability, and maintainability.

**7.2.2 State Management Pattern**

Global application state is managed through a centralized store system, enabling predictable state updates and efficient UI rendering through selective subscriptions.

**7.2.3 Repository Pattern**

Data access is abstracted through repository-style services, allowing the application to switch between different data sources without modifying business logic.

**7.2.4 Observer Pattern**

Real-time data synchronization utilizes the observer pattern, where UI components automatically update when underlying data changes in the database.

### 7.3 Database Design

The database structure follows a document-oriented model optimized for the application's query patterns:

**User Collection:** Stores user profiles including academic details, preferences, and metadata.

**Subject Collection:** Contains subject information linked to users, including attendance statistics.

**Timetable Collection:** Holds weekly schedule entries with day, time, subject, and location information.

**Attendance Collection:** Records individual attendance entries with date, subject, and status.

**Notes Collection:** Stores user-generated academic content with author information and engagement metrics.

**Groups Collection:** Contains study group information including members, settings, and activity timestamps.

**Messages Collection:** Holds group chat messages with threading and reply support.

### 7.4 Navigation Design

The application implements a file-based routing system with the following structure:

**Authentication Flow:** Login, registration, email verification, and password recovery screens.

**Onboarding Flow:** Profile setup and timetable entry wizard for new users.

**Main Application:** Tab-based navigation with five primary sections - Dashboard, Timetable, Groups, Community, and Profile.

**Modal Screens:** Overlay screens for note creation, user search, and detailed views.

---

## 8. Technology Stack

### 8.1 Frontend Technologies

**React Native:** An open-source framework for building native mobile applications using JavaScript and React. Selected for its ability to target multiple platforms from a single codebase while delivering near-native performance.

**Expo:** A framework and platform built around React Native that simplifies development, testing, and deployment. Provides access to native device capabilities through managed APIs.

**TypeScript:** A strongly-typed superset of JavaScript that enhances code quality through static type checking and improved developer tooling.

**React Native Paper:** A component library implementing Material Design 3 guidelines, providing consistent and accessible user interface components.

**Zustand:** A lightweight state management library chosen for its minimal boilerplate, efficient rendering, and intuitive API.

### 8.2 Backend Technologies

**Firebase Authentication:** Handles user registration, login, and session management with support for email-password and social authentication methods.

**Cloud Firestore:** A NoSQL document database providing real-time synchronization, offline persistence, and scalable performance.

**Firebase Storage:** Managed file storage service for user-uploaded content including images and documents.

**Firebase Cloud Messaging:** Push notification delivery service for Android and iOS platforms.

**Node.js:** JavaScript runtime used for the notification server handling scheduled reminders and background tasks.

**Express.js:** Web framework for building the notification server API endpoints.

### 8.3 Artificial Intelligence

**Groq API:** High-performance inference API hosting the Llama 4 Maverick model, providing natural language processing and vision capabilities for timetable extraction and chatbot functionality.

### 8.4 External Services

**Catbox.moe:** File hosting service used for avatar and image uploads.

**Google Drive API:** Integration for storing and sharing note attachments.

**Vercel:** Cloud platform for deploying the web application.

---

## 9. Module Description

### 9.1 Authentication Module

Handles user identity management including registration with email verification, password-based login, social authentication via Google, and password recovery. Implements secure session management and automatic authentication state persistence.

### 9.2 Profile Management Module

Manages user profile information including academic details such as college, course, department, semester, and roll number. Supports profile photo upload and minimum attendance preference configuration.

### 9.3 Timetable Module

Provides two methods for timetable entry:

**Manual Entry:** Form-based input for adding individual schedule entries with day, time, subject, and location fields.

**AI-Powered Extraction:** Image upload functionality where artificial intelligence analyzes photographs of timetables and automatically extracts schedule information.

### 9.4 Attendance Tracking Module

Core module implementing:

**Recording:** Interface for marking daily attendance as present or absent for each scheduled class.

**Calculation:** Real-time computation of subject-wise and overall attendance percentages.

**Prediction:** Algorithm calculating how many classes can be missed while maintaining minimum attendance, or how many must be attended to reach minimum if below threshold.

**Visualization:** Graphical representation of attendance through donut charts and progress indicators.

### 9.5 Notes Module

Academic content sharing system featuring:

**Creation:** Rich text editor supporting formatted content, file attachments, and metadata tagging.

**Discovery:** Feed-based exploration of public notes filtered by subject, college, or author.

**Interaction:** Engagement features including likes, comments, and saves with real-time count updates.

### 9.6 Social Module

Peer connection features including:

**Following:** Ability to follow other users and receive their content in personalized feeds.

**User Discovery:** Search functionality for finding peers by name or academic details.

**Profile Viewing:** Detailed view of other users' profiles including their shared notes and statistics.

### 9.7 Groups Module

Collaborative study group features:

**Creation:** Tools for creating public or private groups with category classification.

**Messaging:** Real-time chat functionality with file sharing and message replies.

**Management:** Administrative controls for member management and group settings.

### 9.8 AI Assistant Module

Intelligent chatbot providing:

**Attendance Advice:** Context-aware recommendations based on current attendance statistics.

**Academic Support:** General assistance for study-related queries.

**Voice Interaction:** Speech recognition for hands-free operation.

### 9.9 Notification Module

Push notification system delivering:

**Class Reminders:** Alerts before scheduled classes.

**Attendance Warnings:** Notifications when attendance drops below threshold.

**Social Updates:** Alerts for likes, comments, and new followers.

---

## 10. Features and Functionality

### 10.1 Core Features

**Dashboard:**
The main screen displaying overall attendance statistics, subject-wise breakdown, and quick access to common actions. Shows the number of classes that can be bunked or must be attended to meet minimum requirements.

**Timetable View:**
Weekly schedule display organized by days, showing all classes with timing, subject, and location information. Supports direct attendance marking from schedule entries.

**Attendance Recording:**
Simple interface for recording presence or absence in each class. Includes calendar view for historical attendance review and modification.

**Bunk Calculator:**
Automatic calculation showing:
- Current attendance percentage per subject
- Overall attendance percentage
- Number of classes that can be missed safely
- Number of classes that must be attended if below minimum

### 10.2 AI-Powered Features

**Timetable Extraction:**
Users can photograph their written or printed timetables. The artificial intelligence vision model analyzes the image and automatically extracts subject names, timings, days, and room numbers, populating the schedule without manual entry.

**Intelligent Assistant:**
A conversational chatbot that understands attendance context and provides personalized advice. Can answer questions about attendance status, suggest optimal bunk strategies, and provide academic motivation.

### 10.3 Social Features

**Note Sharing:**
Create and share academic notes including text content, PDF documents, and images. Notes are tagged with subject and course information for discoverability.

**Feed System:**
Personalized feed showing notes from followed users and popular content from the broader community.

**Following System:**
Follow interesting peers to receive their content in feeds. View follower and following counts on profiles.

### 10.4 Collaboration Features

**Study Groups:**
Create topic-focused or course-specific groups for collaborative learning. Groups can be public for anyone to join or private with invitation-only access.

**Group Chat:**
Real-time messaging within groups supporting text messages, file sharing, and reply threading.

**Member Management:**
Group administrators can manage members, promote other administrators, and configure group settings.

### 10.5 Platform Features

**Offline Support:**
Core functionality including attendance recording and viewing works without internet connectivity. Data synchronizes automatically when connection is restored.

**Dark Mode:**
Full dark theme support respecting system preferences with manual override option.

**Responsive Design:**
Adaptive layouts optimizing the experience for phones, tablets, and desktop browsers.

**Push Notifications:**
Timely reminders for classes and attendance warnings delivered even when the application is not active.

---

## 11. Implementation Details

### 11.1 Development Approach

The project followed an iterative development methodology with the following phases:

**Phase One - Foundation:**
Setup of development environment, project structure, and core dependencies. Implementation of authentication flow and basic navigation.

**Phase Two - Core Features:**
Development of timetable management, attendance tracking, and calculation algorithms. Integration of data persistence and synchronization.

**Phase Three - Intelligence:**
Integration of artificial intelligence APIs for timetable extraction and chatbot functionality. Development of voice interaction capabilities.

**Phase Four - Social Platform:**
Implementation of notes system, following mechanism, and group collaboration features. Development of real-time messaging.

**Phase Five - Polish:**
User interface refinement, responsive design implementation, performance optimization, and bug fixing.

### 11.2 State Management Implementation

The application utilizes five global state stores:

**Authentication Store:** Manages user session, profile data, and push notification tokens.

**Groups Store:** Handles group listings, selected group data, messages, and member information.

**Notes Store:** Manages note interaction states including likes and saves for optimistic UI updates.

**Network Store:** Tracks internet connectivity status for offline functionality.

**Theme Store:** Manages dark and light mode preferences with persistence.

### 11.3 Service Layer Implementation

Business logic is organized into specialized services:

**Authentication Service:** Handles all authentication operations including registration, login, verification, and password management.

**Firestore Service:** Provides data access operations for all collections with proper error handling and type safety.

**Notes Service:** Manages note creation, retrieval, updates, and deletion with pagination support.

**Groups Service:** Handles group operations including creation, membership, and real-time message subscriptions.

**Social Service:** Implements like, save, and comment functionality with count management.

**Follow Service:** Manages user following relationships and provides suggestion algorithms.

**Chat Service:** Integrates with artificial intelligence API for chatbot responses.

**Notification Service:** Handles push token registration and notification permission management.

**Cache Service:** Provides local caching with time-to-live support for performance optimization.

**Offline Queue Service:** Queues operations during offline periods for later synchronization.

### 11.4 Responsive Design Implementation

A custom responsive hook provides:

**Breakpoint Detection:** Identifies device category from extra-small phones to large desktops.

**Platform Detection:** Distinguishes between iOS, Android, and web platforms.

**Device Detection:** Identifies actual mobile devices even when using desktop browser modes.

**Utility Functions:** Provides responsive value selection, adaptive spacing, and font scaling.

### 11.5 Offline Architecture

Offline functionality is achieved through:

**Firestore Persistence:** Database operations are cached locally and synchronized when online.

**Operation Queue:** Write operations during offline periods are queued and executed upon reconnection.

**Cache Layer:** Frequently accessed data is cached in local storage with configurable expiration.

**Network Monitoring:** Continuous monitoring of connectivity status to trigger synchronization.

---

## 12. Testing and Results

### 12.1 Testing Methodology

**Unit Testing:** Individual service functions tested in isolation to verify correct behavior.

**Integration Testing:** End-to-end workflows tested including authentication, data operations, and synchronization.

**User Acceptance Testing:** Real users tested the application providing feedback on usability and functionality.

**Cross-Platform Testing:** Application tested on Android devices, iOS simulators, and web browsers to ensure consistency.

### 12.2 Test Results

**Functionality:** All core features including attendance tracking, calculations, and note sharing work as specified.

**Performance:** Application loads within three seconds and responds to interactions within one second.

**Reliability:** Offline functionality maintains data integrity across connection changes.

**Compatibility:** Consistent behavior observed across tested platforms and device sizes.

### 12.3 User Feedback

Initial users reported:

- Intuitive interface requiring minimal learning
- Accurate attendance calculations matching manual verification
- Helpful AI timetable extraction saving significant time
- Useful bunk calculator for planning absences
- Enjoyable social features for peer collaboration

---

## 13. Limitations and Future Scope

### 13.1 Current Limitations

1. **Timetable Extraction Accuracy:** AI extraction may require manual corrections for complex or unclear timetable images.

2. **Offline Chat:** Group messaging requires internet connectivity and does not queue messages offline.

3. **Institution Integration:** No direct integration with institutional attendance systems requiring manual entry.

4. **Language Support:** Currently supports English only without localization for other languages.

5. **Notification Customization:** Limited options for customizing notification timing and frequency.

### 13.2 Future Enhancements

**Short Term:**

1. Improved AI model training for better timetable extraction accuracy
2. Calendar integration for syncing with device calendars
3. Export functionality for attendance reports
4. Enhanced notification customization options
5. Additional language support

**Medium Term:**

1. Institutional API integration where available
2. Advanced analytics with attendance trends and predictions
3. Gamification elements for attendance motivation
4. Video note support for recorded explanations
5. Collaborative note editing

**Long Term:**

1. Machine learning for personalized bunk recommendations
2. Virtual study rooms with video conferencing
3. Integration with learning management systems
4. Peer tutoring marketplace
5. Academic performance correlation analysis

---

## 14. Conclusion

MR Bunk Manager successfully addresses the attendance management challenges faced by students in higher education. The application provides a comprehensive solution combining intelligent attendance tracking, AI-powered automation, and social collaboration features in a unified cross-platform experience.

Key achievements of this project include:

1. **Practical Solution:** Addressing a real problem faced by students with measurable impact on attendance awareness.

2. **Technical Excellence:** Implementation of modern technologies including cross-platform development, real-time databases, and artificial intelligence.

3. **User-Centric Design:** Intuitive interface designed for the target demographic with minimal learning curve.

4. **Scalable Architecture:** Design patterns and infrastructure capable of supporting growth in user base.

5. **Innovation:** Novel features including AI timetable extraction and context-aware chatbot assistance.

The project demonstrates the application of software engineering principles to solve practical problems while showcasing proficiency in contemporary development technologies and methodologies.

---

## 15. References

1. React Native Documentation - https://reactnative.dev/docs/getting-started

2. Expo Documentation - https://docs.expo.dev/

3. Firebase Documentation - https://firebase.google.com/docs

4. Groq API Documentation - https://console.groq.com/docs

5. Material Design 3 Guidelines - https://m3.material.io/

6. TypeScript Documentation - https://www.typescriptlang.org/docs/

7. Zustand State Management - https://github.com/pmndrs/zustand

8. React Native Paper - https://callstack.github.io/react-native-paper/

9. Expo Router Documentation - https://docs.expo.dev/router/introduction/

10. Cloud Firestore Data Model - https://firebase.google.com/docs/firestore/data-model

---

**Submitted By:** [Student Name]

**Roll Number:** [Roll Number]

**Course:** [Course Name]

**Semester:** [Semester]

**Academic Year:** [Year]

**Institution:** [Institution Name]

---

*This document was prepared as part of academic project documentation requirements.*
