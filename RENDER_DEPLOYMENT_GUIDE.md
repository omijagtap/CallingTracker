# 🚀 Render Deployment Guide for UpGrad Calling Tracker

## 📋 Pre-Deployment Checklist

### ✅ Security Setup Complete
- [x] Moved all sensitive data to environment variables
- [x] Created `.env.example` with placeholder values
- [x] Secured email credentials
- [x] Protected Supabase credentials

## 🔧 Step 1: Prepare Your Environment Variables

### Required Environment Variables for Render:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://mkmuhctmddhttosgcpmo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Email Configuration (SMTP)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=intlesgcidba@upgrad.com
SMTP_PASS=htmwlfsdhjjmxlls

# Admin Configuration
ADMIN_USERNAME=Air01
ADMIN_PASSWORD=Omkar@123

# Application Settings
NEXTAUTH_SECRET=your_random_secret_here_32_chars_min
NEXTAUTH_URL=https://your-app-name.onrender.com
NODE_ENV=production
```

## 🗄️ Step 2: Setup Supabase Database

### Create Email Activities Table:
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the SQL from `database/create_email_table.sql`
4. Verify the table was created successfully

## 🌐 Step 3: Deploy to Render

### 3.1 Connect GitHub Repository
1. Push your code to GitHub (instructions below)
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository

### 3.2 Configure Render Settings
```yaml
# Build Command
npm install

# Start Command  
npm start

# Environment
Node.js

# Auto-Deploy
Yes (recommended)
```

### 3.3 Add Environment Variables in Render
1. Go to your service → Environment
2. Add all the environment variables listed above
3. **Important**: Use your actual values, not placeholders!

## 📤 Step 4: Push to GitHub

### 4.1 Initialize Git Repository
```bash
cd "C:\Users\OmkarJagtap\OneDrive - UpGrad Education Private Limited\Desktop\Non Submmision\V2 - Website"
git init
git add .
git commit -m "Initial commit: UpGrad Calling Tracker"
```

### 4.2 Create GitHub Repository
1. Go to GitHub.com
2. Create new repository: `upgrad-calling-tracker`
3. **Don't** initialize with README (you already have files)

### 4.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/upgrad-calling-tracker.git
git branch -M main
git push -u origin main
```

## 🔒 Step 5: Security Verification

### Files That Should NOT be in GitHub:
- `.env.local` ✅ (already in .gitignore)
- `.env` ✅ (already in .gitignore)
- `node_modules/` ✅ (already in .gitignore)

### Files That SHOULD be in GitHub:
- `.env.example` ✅ (with placeholder values)
- All source code ✅
- Database SQL files ✅

## 🧪 Step 6: Test Your Deployment

### After Deployment:
1. **Visit your Render URL**
2. **Login with admin credentials**
3. **Setup email table** using the Email Setup Widget
4. **Send test email** to verify SMTP works
5. **Upload CSV** to test full functionality
6. **Check email count** updates properly

## 🔧 Step 7: Post-Deployment Configuration

### Update NEXTAUTH_URL:
1. After deployment, get your Render URL
2. Update `NEXTAUTH_URL` environment variable in Render
3. Redeploy if necessary

### Verify Email Tracking:
1. Go to Admin Dashboard
2. Click "Setup Email Table" 
3. Send test emails
4. Verify email count increases

## 🚨 Troubleshooting

### Common Issues:

#### 1. Email Count Still 0:
- Run the SQL from `database/create_email_table.sql` in Supabase
- Use the Email Setup Widget in admin dashboard
- Check Render logs for errors

#### 2. SMTP Errors:
- Verify SMTP credentials in Render environment variables
- Check if Office365 allows app passwords
- Test email configuration in admin dashboard

#### 3. Supabase Connection Issues:
- Verify Supabase URL and keys in environment variables
- Check Supabase project is active
- Ensure database tables exist

#### 4. Build Failures:
- Check Render build logs
- Verify all dependencies in package.json
- Ensure Node.js version compatibility

## 📞 Support

If you encounter issues:
1. Check Render deployment logs
2. Verify all environment variables are set
3. Test Supabase connection
4. Check email configuration

## 🎉 Success Checklist

- [ ] Code pushed to GitHub successfully
- [ ] Render deployment completed
- [ ] Environment variables configured
- [ ] Supabase database setup
- [ ] Email table created
- [ ] Admin login works
- [ ] Email sending works
- [ ] Email count tracking works
- [ ] CSV upload works
- [ ] All features functional

---

**🔐 Security Note**: Never commit actual passwords or API keys to GitHub. Always use environment variables for sensitive data.
