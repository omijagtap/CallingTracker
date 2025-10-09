# 🎯 Calling Tracker - UpGrad Education Platform

> A comprehensive learner management and calling tracker system built for educational institutions with advanced analytics and reporting capabilities.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://your-render-url.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/omijagtap/CallingTracker.git)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

## ✨ Features

### 🔐 Authentication System
- **Admin Access**: Special admin login (`Air01` / `Omkar@123`)
- **User Registration**: Secure user account creation
- **Session Management**: Persistent login with localStorage
- **Role-based Access**: Different dashboards for admin and users

### 📊 Admin Dashboard
- **Global Activity Timeline**: Real-time activity tracking with scroll pagination
- **Cohort Distribution Charts**: Visual analytics using Recharts
- **User Management**: View, search, and manage all users
- **CSV Upload Tracking**: Monitor all file uploads and reports
- **Email Management**: Send bulk emails and notifications

### 👤 User Dashboard
- **Personal Activity History**: Track individual user actions
- **CSV Upload**: Upload and process learner data files
- **Remarks System**: Add and manage learner remarks
- **Data Visualization**: Personal analytics and insights

### 📧 Email System
- **SMTP Integration**: Office365 email configuration
- **Bulk Email Sending**: Send emails to multiple recipients
- **Email Templates**: Professional email templates
- **Test Email Feature**: Verify email configuration

- **Dark Theme**: Professional dark mode interface
- **Responsive Design**: Works on all device sizes
- **Animated Components**: Smooth transitions and effects
- **Accessible**: Built with Radix UI components

## 📞 UpGrad Calling Tracker

A comprehensive web application for tracking learner interactions, managing CSV uploads, and monitoring user activities with real-time email tracking.

## ✨ Features

- **CSV Upload & Processing**: Upload learner data and track submission status
- **Learner Management**: Add remarks, track history, and manage learner information  
- **User Dashboard**: Personalized dashboard with activity tracking and statistics
- **Admin Panel**: Comprehensive admin interface with analytics and user management
- **Real-time Updates**: Live activity tracking and notifications
- **Email Integration**: Send reports and notifications with tracking
- **Data Visualization**: Charts and analytics for better insights
- **Badge System**: Achievement tracking and user recognition
- **Online Status**: Real-time user presence monitoring

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui Components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom authentication system
- **Email**: Nodemailer with Office365 SMTP
- **Charts**: Recharts for data visualization
- **Deployment**: Render (recommended)
│   ├── users.json          # User data
│   ├── activities.json     # Activity logs
│   └── tracking.json       # Tracking data
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler check

# Email
npm run email:python # Run Python email script (if needed)
```

## 🌐 Deployment

### Render.com (Recommended)
This project is configured for automatic deployment on Render.com:

1. **Connect Repository**: Link your GitHub repository to Render
2. **Environment Variables**: Set up the required environment variables
3. **Auto Deploy**: Enable automatic deploys from the main branch
4. **Build Command**: `npm install && npm run build`
5. **Start Command**: `npm start`

### Manual Deployment
```bash
# Build the project
npm run build

# Start the production server
npm start
```

## 📊 Database Schema

The application uses SQLite with the following main tables:

- **users**: User accounts and profiles
- **activities**: User activity tracking
- **uploads**: CSV upload records
- **remarks**: Learner remarks and comments

## 🔒 Security Features

- **Input Validation**: All user inputs are validated
- **SQL Injection Protection**: Prepared statements used
- **Session Security**: Secure session management
- **Email Security**: SMTP with TLS encryption
- **Environment Variables**: Sensitive data in environment files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Omkar Jagtap**
- GitHub: [@omijagtap](https://github.com/omijagtap)
- Email: omijgatp304@gmail.com

## 🙏 Acknowledgments

- UpGrad Education for the project requirements
- Next.js team for the amazing framework
- Radix UI for accessible components
- Tailwind CSS for utility-first styling

---

<div align="center">
  <p>Made with ❤️ for UpGrad Education Platform</p>
  <p>⭐ Star this repository if you found it helpful!</p>
</div>
