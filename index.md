---
layout: default
title: MR BunkManager
description: A comprehensive attendance management and student collaboration platform built with React Native (Expo) and Firebase.
---

<style>
  /* Glassmorphism Theme Styles */
  .hero {
    text-align: center;
    padding: 80px 20px;
    margin-bottom: 60px;
  }

  .hero-logo {
    width: 120px;
    height: 120px;
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    margin-bottom: 30px;
  }

  .hero h1 {
    font-size: 3.5em;
    font-weight: 800;
    letter-spacing: -0.03em;
    margin-bottom: 20px;
    background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    font-size: 1.25em;
    color: rgba(255,255,255,0.6);
    max-width: 600px;
    margin: 0 auto 40px;
    line-height: 1.6;
  }

  .hero-buttons {
    display: flex;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .hero-buttons a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 14px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95em;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .btn-primary {
    background: #fff;
    color: #0a0a0a;
  }

  .btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 40px rgba(255,255,255,0.2);
  }

  .btn-glass {
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.9);
    border: 1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
  }

  .btn-glass:hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.2);
    transform: translateY(-3px);
  }

  /* Section Titles */
  .section-header {
    margin-bottom: 40px;
  }

  .section-header h2 {
    font-size: 2em;
    font-weight: 700;
    margin-bottom: 10px;
    color: #fff;
  }

  .section-header p {
    color: rgba(255,255,255,0.5);
    font-size: 1.1em;
  }

  /* Feature Grid */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 20px;
    margin-bottom: 80px;
  }

  .feature-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 32px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .feature-card:hover {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.1);
    transform: translateY(-5px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  }

  .feature-icon {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5em;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    margin-bottom: 20px;
  }

  .feature-card h3 {
    font-size: 1.2em;
    font-weight: 600;
    color: #fff;
    margin-bottom: 12px;
  }

  .feature-card p {
    color: rgba(255,255,255,0.5);
    font-size: 0.95em;
    line-height: 1.7;
    margin: 0;
  }

  /* Tech Stack */
  .tech-section {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 24px;
    padding: 40px;
    margin-bottom: 80px;
  }

  .tech-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 40px;
  }

  .tech-category h3 {
    font-size: 0.85em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.4);
    margin-bottom: 20px;
  }

  .tech-item {
    display: flex;
    justify-content: space-between;
    padding: 14px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .tech-item:last-child {
    border-bottom: none;
  }

  .tech-name {
    color: #fff;
    font-weight: 500;
  }

  .tech-purpose {
    color: rgba(255,255,255,0.4);
    font-size: 0.9em;
  }

  /* Quick Start */
  .quickstart-section {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 24px;
    padding: 40px;
    margin-bottom: 80px;
  }

  .quickstart-section h3 {
    color: rgba(255,255,255,0.4);
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 30px 0 15px;
  }

  .quickstart-section h3:first-of-type {
    margin-top: 0;
  }

  .quickstart-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .quickstart-section ul li {
    color: rgba(255,255,255,0.7);
    padding: 8px 0;
    padding-left: 20px;
    position: relative;
  }

  .quickstart-section ul li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: rgba(255,255,255,0.3);
  }

  /* Team Section */
  .team-section {
    margin-bottom: 60px;
  }

  .team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
  }

  .team-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 18px;
    padding: 24px 16px;
    text-align: center;
    transition: all 0.3s ease;
  }

  .team-card:hover {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.08);
    transform: translateY(-4px);
  }

  .avatar {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3em;
    font-weight: 700;
    margin: 0 auto 16px;
    color: #fff;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .team-card h4 {
    font-size: 1em;
    font-weight: 600;
    color: #fff;
    margin: 0 0 4px;
  }

  .team-role {
    font-size: 0.85em;
    color: rgba(255,255,255,0.4);
    margin-bottom: 12px;
  }

  .team-badges {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }

  .badge {
    font-size: 0.7em;
    padding: 4px 10px;
    border-radius: 20px;
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.6);
    border: 1px solid rgba(255,255,255,0.08);
  }

  /* API Table */
  .api-section {
    margin-bottom: 80px;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .hero h1 {
      font-size: 2.2em;
    }

    .hero-subtitle {
      font-size: 1em;
    }

    .hero-buttons {
      flex-direction: column;
      align-items: center;
    }

    .hero-buttons a {
      width: 100%;
      max-width: 280px;
      justify-content: center;
    }

    .features-grid {
      grid-template-columns: 1fr;
    }

    .tech-section, .quickstart-section {
      padding: 24px;
    }
  }
</style>

<!-- Hero Section -->
<div class="hero">
  <img src="https://raw.githubusercontent.com/mithun50/MR_BunkManager/main/assets/images/logo.png" alt="MR BunkManager" class="hero-logo">
  <h1>MR BunkManager</h1>
  <p class="hero-subtitle">A comprehensive attendance management and student collaboration platform built with React Native & Firebase</p>
  <div class="hero-buttons">
    <a href="https://github.com/mithun50/MR_BunkManager" class="btn-primary">View on GitHub</a>
    <a href="docs/API" class="btn-glass">API Docs</a>
    <a href="docs/ARCHITECTURE" class="btn-glass">Architecture</a>
  </div>
</div>

<!-- Features Section -->
<div class="section-header">
  <h2>Features</h2>
  <p>Everything you need to manage your attendance and collaborate with peers</p>
</div>

<div class="features-grid">
  <div class="feature-card">
    <div class="feature-icon">📊</div>
    <h3>Attendance Tracking</h3>
    <p>Track attendance across all subjects with beautiful visual analytics and donut charts. Know exactly how many classes you can skip.</p>
  </div>

  <div class="feature-card">
    <div class="feature-icon">📅</div>
    <h3>Timetable Management</h3>
    <p>Add, edit, and manage your class schedules with ease. Manual entry with intuitive UI for quick setup.</p>
  </div>

  <div class="feature-card">
    <div class="feature-icon">👥</div>
    <h3>Study Groups</h3>
    <p>Create and join study groups with real-time chat, file sharing, and voice/video calls.</p>
  </div>

  <div class="feature-card">
    <div class="feature-icon">📝</div>
    <h3>Notes Sharing</h3>
    <p>Share study materials including text, PDFs, images, and links. Follow classmates and build your feed.</p>
  </div>

  <div class="feature-card">
    <div class="feature-icon">🤖</div>
    <h3>AI Assistant</h3>
    <p>BunkBot AI provides personalized attendance advice. Voice-enabled for hands-free interaction.</p>
  </div>

  <div class="feature-card">
    <div class="feature-icon">🔔</div>
    <h3>Smart Notifications</h3>
    <p>Daily reminders, class alerts 30/10 minutes before, and activity notifications from your network.</p>
  </div>
</div>

<!-- Tech Stack Section -->
<div class="section-header">
  <h2>Tech Stack</h2>
  <p>Built with modern technologies for the best experience</p>
</div>

<div class="tech-section">
  <div class="tech-grid">
    <div class="tech-category">
      <h3>Frontend</h3>
      <div class="tech-item">
        <span class="tech-name">React Native 0.81</span>
        <span class="tech-purpose">Mobile Framework</span>
      </div>
      <div class="tech-item">
        <span class="tech-name">Expo SDK 54</span>
        <span class="tech-purpose">Build Tooling</span>
      </div>
      <div class="tech-item">
        <span class="tech-name">Expo Router</span>
        <span class="tech-purpose">Navigation</span>
      </div>
      <div class="tech-item">
        <span class="tech-name">React Native Paper</span>
        <span class="tech-purpose">UI Components</span>
      </div>
      <div class="tech-item">
        <span class="tech-name">Zustand</span>
        <span class="tech-purpose">State Management</span>
      </div>
    </div>
    <div class="tech-category">
      <h3>Backend & Services</h3>
      <div class="tech-item">
        <span class="tech-name">Node.js + Express</span>
        <span class="tech-purpose">Notification Server</span>
      </div>
      <div class="tech-item">
        <span class="tech-name">Firebase Firestore</span>
        <span class="tech-purpose">Database</span>
      </div>
      <div class="tech-item">
        <span class="tech-name">Firebase Auth</span>
        <span class="tech-purpose">Authentication</span>
      </div>
      <div class="tech-item">
        <span class="tech-name">Google Drive API</span>
        <span class="tech-purpose">File Storage</span>
      </div>
      <div class="tech-item">
        <span class="tech-name">Groq API</span>
        <span class="tech-purpose">AI Chat</span>
      </div>
    </div>
  </div>
</div>

<!-- Quick Start Section -->
<div class="section-header">
  <h2>Quick Start</h2>
  <p>Get up and running in minutes</p>
</div>

<div class="quickstart-section">
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

<!-- API Section -->
<div class="section-header">
  <h2>API Endpoints</h2>
  <p>Backend notification server endpoints</p>
</div>

<div class="api-section">

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

</div>

<!-- Team Section -->
<div class="section-header">
  <h2>Development Team</h2>
  <p>The people behind MR BunkManager</p>
</div>

<div class="team-section">
  <div class="team-grid">
    <div class="team-card">
      <div class="avatar" style="background: linear-gradient(135deg, rgba(255,152,0,0.2), rgba(245,124,0,0.2));">M</div>
      <h4>Mithun Gowda B</h4>
      <div class="team-role">Core Developer</div>
      <div class="team-badges">
        <span class="badge">Main Dev</span>
        <span class="badge">Full-Stack</span>
      </div>
    </div>

    <div class="team-card">
      <div class="avatar" style="background: linear-gradient(135deg, rgba(33,150,243,0.2), rgba(25,118,210,0.2));">N</div>
      <h4>Nevil Dsouza</h4>
      <div class="team-role">Team Leader</div>
      <div class="team-badges">
        <span class="badge">Core Dev</span>
        <span class="badge">Tester</span>
      </div>
    </div>

    <div class="team-card">
      <div class="avatar" style="background: linear-gradient(135deg, rgba(76,175,80,0.2), rgba(56,142,60,0.2));">N</div>
      <h4>Naren V</h4>
      <div class="team-role">Developer</div>
      <div class="team-badges">
        <span class="badge">UI Designer</span>
      </div>
    </div>

    <div class="team-card">
      <div class="avatar" style="background: linear-gradient(135deg, rgba(0,188,212,0.2), rgba(0,151,167,0.2));">M</div>
      <h4>Manas Habbu</h4>
      <div class="team-role">Developer</div>
      <div class="team-badges">
        <span class="badge">Docs</span>
        <span class="badge">Design</span>
      </div>
    </div>

    <div class="team-card">
      <div class="avatar" style="background: linear-gradient(135deg, rgba(156,39,176,0.2), rgba(123,31,162,0.2));">M</div>
      <h4>Manasvi R</h4>
      <div class="team-role">Developer</div>
      <div class="team-badges">
        <span class="badge">Docs</span>
        <span class="badge">Presentation</span>
      </div>
    </div>

    <div class="team-card">
      <div class="avatar" style="background: linear-gradient(135deg, rgba(233,30,99,0.2), rgba(194,24,91,0.2));">L</div>
      <h4>Lavanya</h4>
      <div class="team-role">Developer</div>
      <div class="team-badges">
        <span class="badge">Docs</span>
        <span class="badge">Presentation</span>
      </div>
    </div>
  </div>
</div>
