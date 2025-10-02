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

### 🎨 Modern UI/UX
- **Dark Theme**: Professional dark mode interface
- **Responsive Design**: Works on all device sizes
- **Animated Components**: Smooth transitions and effects
- **Accessible**: Built with Radix UI components

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + Radix UI
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Database**: Better SQLite3 (local file-based)
- **Email**: Nodemailer with Office365 SMTP
- **File Processing**: CSV parsing and validation

### Development
- **Build Tool**: Turbopack (Next.js)
- **Package Manager**: npm
- **Type Checking**: TypeScript strict mode
- **Code Quality**: ESLint + Prettier

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git installed
- Text editor (VS Code recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/omijagtap/CallingTracker.git
   cd CallingTracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Email Configuration
   SENDER_EMAIL=your-email@upgrad.com
   APP_PASSWORD=your-app-specific-password
   
   # Optional: Database path (defaults to ./data/)
   DATABASE_PATH=./data/
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Admin Access
- **Username**: `Air01`
- **Password**: `Omkar@123`

## 📁 Project Structure

```
CallingTracker/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── login/            # Authentication pages
│   │   └── landing/          # Landing page
│   ├── components/
│   │   ├── app/              # Application components
│   │   └── ui/               # Reusable UI components
│   ├── lib/                  # Utilities and configurations
│   │   ├── auth-context.tsx  # Authentication context
│   │   ├── db.ts            # Database configuration
│   │   ├── models.ts        # Data models
│   │   └── email-service.ts # Email service
│   └── hooks/               # Custom React hooks
├── data/                    # Local database files
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
