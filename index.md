---
layout: default
title: MR BunkManager
description: A comprehensive attendance management and student collaboration platform built with React Native (Expo) and Firebase.
---

<style>
  /* Custom styles for unique UI */
  .hero-section {
    text-align: center;
    padding: 40px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    margin-bottom: 40px;
    box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
  }

  .hero-section img {
    width: 150px;
    height: 150px;
    border-radius: 30px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.3);
    margin-bottom: 20px;
    border: 4px solid rgba(255,255,255,0.3);
  }

  .hero-section h1 {
    color: #ffffff;
    font-size: 2.5em;
    margin: 10px 0;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
  }

  .hero-section p {
    color: rgba(255,255,255,0.9);
    font-size: 1.2em;
    max-width: 600px;
    margin: 0 auto 20px;
  }

  .nav-buttons {
    display: flex;
    justify-content: center;
    gap: 15px;
    flex-wrap: wrap;
    margin-top: 25px;
  }

  .nav-buttons a {
    display: inline-block;
    padding: 12px 28px;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .btn-primary {
    background: #ffffff;
    color: #667eea;
  }

  .btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
  }

  .btn-secondary {
    background: rgba(255,255,255,0.2);
    color: #ffffff;
    border: 2px solid rgba(255,255,255,0.5);
  }

  .btn-secondary:hover {
    background: rgba(255,255,255,0.3);
    transform: translateY(-3px);
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 25px;
    margin: 40px 0;
  }

  .feature-card {
    background: linear-gradient(145deg, #f8f9fa, #ffffff);
    border-radius: 16px;
    padding: 25px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid rgba(0,0,0,0.05);
    transition: all 0.3s ease;
  }

  .feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
  }

  .feature-card h3 {
    color: #667eea;
    margin-top: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .feature-icon {
    font-size: 1.5em;
  }

  .tech-stack {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 16px;
    padding: 30px;
    margin: 40px 0;
    color: #ffffff;
  }

  .tech-stack h2 {
    color: #ffffff;
    border-bottom: 2px solid #667eea;
    padding-bottom: 10px;
  }

  .tech-stack table {
    width: 100%;
    border-collapse: collapse;
  }

  .tech-stack th {
    background: rgba(102, 126, 234, 0.3);
    color: #ffffff;
    padding: 12px;
    text-align: left;
  }

  .tech-stack td {
    padding: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.9);
  }

  .team-section {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    border-radius: 16px;
    padding: 30px;
    margin: 40px 0;
    color: #ffffff;
  }

  .team-section h2 {
    color: #ffffff;
    text-align: center;
    margin-bottom: 30px;
  }

  .team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }

  .team-card {
    background: rgba(255,255,255,0.15);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
  }

  .team-card h4 {
    margin: 10px 0 5px;
    color: #ffffff;
  }

  .team-card .role {
    font-size: 0.85em;
    color: rgba(255,255,255,0.8);
    margin-bottom: 8px;
  }

  .team-card .badge {
    display: inline-block;
    background: rgba(255,255,255,0.2);
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75em;
    margin: 2px;
  }

  .avatar-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5em;
    font-weight: bold;
    margin: 0 auto;
    color: #ffffff;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  .section-title::before {
    content: '';
    width: 5px;
    height: 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 3px;
  }

  .install-section {
    background: #f8f9fa;
    border-radius: 16px;
    padding: 30px;
    margin: 40px 0;
    border-left: 5px solid #667eea;
  }

  .footer-section {
    text-align: center;
    padding: 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    margin-top: 40px;
    color: #ffffff;
  }

  .footer-section code {
    background: rgba(255,255,255,0.2);
    padding: 3px 10px;
    border-radius: 5px;
    color: #ffffff;
  }

  @media (max-width: 768px) {
    .hero-section h1 {
      font-size: 1.8em;
    }
    .nav-buttons {
      flex-direction: column;
      align-items: center;
    }
    .nav-buttons a {
      width: 80%;
      text-align: center;
    }
  }
</style>

<div class="hero-section">
  <img src="https://raw.githubusercontent.com/mithun50/MR_BunkManager/main/assets/images/logo.png" alt="MR BunkManager Logo">
  <h1>MR BunkManager</h1>
  <p>A comprehensive attendance management and student collaboration platform built with React Native & Firebase</p>
  <div class="nav-buttons">
    <a href="https://github.com/mithun50/MR_BunkManager" class="btn-primary">⭐ View on GitHub</a>
    <a href="docs/API.html" class="btn-secondary">📚 API Docs</a>
    <a href="docs/ARCHITECTURE.html" class="btn-secondary">🏗️ Architecture</a>
  </div>
</div>

<h2 class="section-title">Features</h2>

<div class="feature-grid">
  <div class="feature-card">
    <h3><span class="feature-icon">📊</span> Attendance Tracking</h3>
    <p>Track attendance across all subjects with beautiful visual analytics and donut charts. Know exactly how many classes you can skip!</p>
  </div>

  <div class="feature-card">
    <h3><span class="feature-icon">📅</span> Timetable Management</h3>
    <p>Add, edit, and manage your class schedules with ease. Manual entry with intuitive UI for quick setup.</p>
  </div>

  <div class="feature-card">
    <h3><span class="feature-icon">👥</span> Study Groups</h3>
    <p>Create and join study groups with real-time chat, file sharing, and voice/video calls.</p>
  </div>

  <div class="feature-card">
    <h3><span class="feature-icon">📝</span> Notes Sharing</h3>
    <p>Share study materials including text, PDFs, images, and links. Follow classmates and build your feed.</p>
  </div>

  <div class="feature-card">
    <h3><span class="feature-icon">🤖</span> AI Assistant</h3>
    <p>BunkBot AI provides personalized attendance advice. Voice-enabled for hands-free interaction.</p>
  </div>

  <div class="feature-card">
    <h3><span class="feature-icon">🔔</span> Smart Notifications</h3>
    <p>Daily reminders, class alerts 30/10 minutes before, and activity notifications from your network.</p>
  </div>
</div>

<div class="tech-stack">
  <h2>🛠️ Tech Stack</h2>

  <h3>Frontend (Mobile App)</h3>
  <table>
    <tr><th>Technology</th><th>Purpose</th></tr>
    <tr><td>React Native 0.81</td><td>Cross-platform mobile framework</td></tr>
    <tr><td>Expo SDK 54</td><td>Development and build tooling</td></tr>
    <tr><td>Expo Router</td><td>File-based navigation</td></tr>
    <tr><td>React Native Paper</td><td>Material Design UI components</td></tr>
    <tr><td>Zustand</td><td>State management</td></tr>
    <tr><td>Groq API</td><td>AI chat (Llama 4 Maverick)</td></tr>
  </table>

  <h3 style="margin-top: 25px;">Backend & Database</h3>
  <table>
    <tr><th>Service</th><th>Purpose</th></tr>
    <tr><td>Node.js + Express</td><td>Notification server</td></tr>
    <tr><td>Firebase Firestore</td><td>Primary database</td></tr>
    <tr><td>Firebase Auth</td><td>User authentication</td></tr>
    <tr><td>Google Drive API</td><td>File storage</td></tr>
    <tr><td>FCM</td><td>Push notifications</td></tr>
  </table>
</div>

<div class="install-section">
  <h2 class="section-title">Quick Start</h2>

  <h3>Prerequisites</h3>
  <ul>
    <li>Node.js 18+</li>
    <li>Expo CLI & EAS CLI</li>
    <li>Firebase project</li>
  </ul>

  <h3>Installation</h3>

```bash
# Clone the repository
git clone https://github.com/mithun50/MR_BunkManager.git
cd MR_BunkManager

# Install dependencies
npm install

# Start development server
npx expo start
```

  <h3>Build for Production</h3>

```bash
# Build Android APK
eas build -p android --profile preview

# Build for Play Store
eas build -p android --profile production
```
</div>

<h2 class="section-title">Project Structure</h2>

```
MR_BunkManager/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Authentication screens
│   ├── (onboarding)/       # Onboarding flow
│   ├── (tabs)/             # Main app tabs
│   └── note/[id].tsx       # Dynamic routes
├── src/
│   ├── components/         # Reusable components
│   ├── services/           # API & business logic
│   ├── store/              # Zustand stores
│   └── types/              # TypeScript definitions
├── backend/                # Notification server
└── docs/                   # Documentation
```

<h2 class="section-title">API Endpoints</h2>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| POST | `/save-token` | Register push token |
| POST | `/send-notification` | Send to specific user |
| POST | `/send-daily-reminders` | Daily class reminders |
| POST | `/send-class-reminders` | 30/10 min before class |
| POST | `/notify-group-members` | Group activity alerts |
| POST | `/notify-followers` | New note notifications |
| POST | `/upload` | Upload to Google Drive |

<div class="team-section">
  <h2>👨‍💻 Development Team</h2>
  <div class="team-grid">
    <div class="team-card">
      <div class="avatar-circle" style="background: linear-gradient(135deg, #FF9800, #F57C00);">M</div>
      <h4>Mithun Gowda B</h4>
      <div class="role">Core Developer</div>
      <span class="badge">Main Dev</span>
      <span class="badge">Full-Stack</span>
    </div>

    <div class="team-card">
      <div class="avatar-circle" style="background: linear-gradient(135deg, #2196F3, #1976D2);">N</div>
      <h4>Nevil Dsouza</h4>
      <div class="role">Team Leader</div>
      <span class="badge">Core Dev</span>
      <span class="badge">Tester</span>
    </div>

    <div class="team-card">
      <div class="avatar-circle" style="background: linear-gradient(135deg, #4CAF50, #388E3C);">N</div>
      <h4>Naren V</h4>
      <div class="role">Developer</div>
      <span class="badge">UI Designer</span>
    </div>

    <div class="team-card">
      <div class="avatar-circle" style="background: linear-gradient(135deg, #00BCD4, #0097A7);">M</div>
      <h4>Manas Habbu</h4>
      <div class="role">Developer</div>
      <span class="badge">Documentation</span>
      <span class="badge">Design</span>
    </div>

    <div class="team-card">
      <div class="avatar-circle" style="background: linear-gradient(135deg, #9C27B0, #7B1FA2);">M</div>
      <h4>Manasvi R</h4>
      <div class="role">Developer</div>
      <span class="badge">Documentation</span>
      <span class="badge">Presentation</span>
    </div>

    <div class="team-card">
      <div class="avatar-circle" style="background: linear-gradient(135deg, #E91E63, #C2185B);">L</div>
      <h4>Lavanya</h4>
      <div class="role">Developer</div>
      <span class="badge">Documentation</span>
      <span class="badge">Presentation</span>
    </div>
  </div>
</div>

