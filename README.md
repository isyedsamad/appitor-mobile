# 📱 Appitor Mobile

A Modern, Secure & Role-Based Mobile Application for the Appitor ERP Platform

![Build](https://img.shields.io/badge/build-active-success)
![Platform](https://img.shields.io/badge/platform-Expo%20%7C%20React%20Native-blue)
![Firebase](https://img.shields.io/badge/backend-Firebase-orange)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🚀 Overview

**Appitor Mobile** is the official mobile application for the **Appitor School ERP Platform**.

It is designed for **teachers, students, and staff**, providing fast, secure, and role-based access to academic and administrative features directly from mobile devices.

The app is built using **Expo + React Native** and integrates deeply with **Firebase** for authentication, data, notifications, and real-time updates.

---

## 🎯 Objectives

- Provide a **fast & reliable mobile experience**
- Maintain **strict role-based access control**
- Work seamlessly across **multiple school branches**
- Offer **offline-tolerant, real-world workflows**
- Match **production-grade system design standards**

---

## 🧠 Design Principles

- Auth-first architecture
- Role-driven UI rendering
- Branch-aware data isolation
- Minimal network reads
- Clean navigation flow
- Scalable for future modules

---

## 🔐 Authentication Strategy

- Firebase Authentication
- Email / Phone login
- Centralized AuthContext
- Persistent login state
- Secure logout handling

### Rules

- Routing only handled in `app/index.tsx`
- Login screens never redirect directly
- Logout uses Firebase `signOut()` only
- AuthContext controls user & branch data

---

## 🧑‍💼 Role-Based Navigation

UI and routes are rendered **strictly based on role**.

Supported roles:

- Admin
- Teacher / Employee
- Student

Each role:

- Has isolated route groups
- Sees only permitted actions
- Cannot access unauthorized screens

---

## 🏫 Branch Awareness

- Each user belongs to one or more branches
- Branch selection handled via context
- All Firestore queries are branch-scoped
- Prevents cross-branch data access

---

## 🧩 Feature Modules (Mobile)

### ✅ Attendance

- Daily attendance marking
- NFC / Manual support
- Class & section filtering
- Real-time updates

### ✅ Timetable

- Teacher & student views
- Period-wise structure
- Cached for performance

### ✅ Homework

- Teacher homework entry
- Student homework view
- Date-based filtering

### ✅ Profile

- User info
- Logout
- App settings

---

## 🗄️ Firestore Data Access (Mobile)

All reads:

- Are permission-checked
- Are branch-scoped
- Avoid deep nesting
- Avoid large array reads

---

## 🎨 UI & UX Guidelines

- Minimalist design
- Touch-friendly components
- Consistent spacing & typography
- Theme-aware colors
- Keyboard-safe screens
- SafeArea compliant layouts

---

## 🛠️ Tech Stack

Frontend:

- Expo
- React Native
- Expo Router

Backend:

- Firebase Firestore
- Firebase Authentication
- Firebase Cloud Messaging

---

## 🔔 Notifications

- Firebase Cloud Messaging (FCM)
- Role-based delivery
- Event-driven triggers
- Branch-aware notifications

---

## 🧪 Development Guidelines

- No hardcoded roles
- No direct Firestore access outside lib
- No navigation inside screens
- Use shared UI components
- Follow naming conventions

---

## 🚧 Roadmap

- [ ] Parent App
- [ ] Offline Attendance
- [ ] Exam & Marks Module
- [ ] Fee Payment Integration
- [ ] Push Notification Center
- [ ] App Performance Monitoring

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow architecture guidelines
4. Write clean commits
5. Open a pull request

---

## 📄 License

MIT License  
Free to use, modify, and distribute.

---

## ⭐ Support

If you find Appitor Mobile useful:

- ⭐ Star the repository
- 🧑‍💻 Contribute
- 📢 Share with institutions

Your support helps keep the project growing 🚀
