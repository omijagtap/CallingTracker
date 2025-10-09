# 🚀 DEPLOY TO RENDER NOW - Step by Step

## ✅ GitHub Push Complete!
Your code is now live at: **https://github.com/omijagtap/CallingTracker**

## 🌐 Deploy to Render (5 Minutes)

### Step 1: Go to Render
1. Open: **https://dashboard.render.com**
2. Sign up/Login with GitHub account
3. Click **"New +"** → **"Web Service"**

### Step 2: Connect Repository
1. Click **"Connect a repository"**
2. Find and select: **omijagtap/CallingTracker**
3. Click **"Connect"**

### Step 3: Configure Service
```
Name: upgrad-calling-tracker
Environment: Node
Region: Oregon (US West)
Branch: main
Build Command: npm install
Start Command: npm start
```

### Step 4: Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

**COPY THESE EXACT VALUES:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://mkmuhctmddhttosgcpmo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbXVoY3RtZGRodHRvc2djcG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3MzE4NzQsImV4cCI6MjA0OTMwNzg3NH0.YOJhNTcOlxKGJCGKJmxvJgJhJGJCGKJCGKJCGKJCGK

# Email Configuration
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=intlesgcidba@upgrad.com
SMTP_PASS=htmwlfsdhjjmxlls

# Admin Configuration
ADMIN_USERNAME=Air01
ADMIN_PASSWORD=Omkar@123

# Application Settings
NODE_ENV=production
NEXTAUTH_SECRET=upgrad-calling-tracker-secret-key-2024
```

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes)
3. You'll get a URL like: **https://upgrad-calling-tracker.onrender.com**

## 🔧 After Deployment

### Step 1: Setup Email Table
1. Go to your Render URL
2. Login with: **Air01** / **Omkar@123**
3. Find **"Email Setup Widget"** in admin dashboard
4. Click **"Setup Email Table"**
5. Wait for success message

### Step 2: Test Everything
1. **Send test email** using Email Test Widget
2. **Upload a CSV file**
3. **Check email count** increases
4. **Verify all features work**

## 🎯 Your Live URLs

- **GitHub**: https://github.com/omijagtap/CallingTracker
- **Render**: https://upgrad-calling-tracker.onrender.com (after deployment)
- **Supabase**: https://mkmuhctmddhttosgcpmo.supabase.co

## 🚨 If Deployment Fails

### Common Issues:
1. **Build fails**: Check Node.js version in Render settings
2. **Environment variables**: Double-check all values are correct
3. **Email not working**: Verify SMTP credentials
4. **Database errors**: Run the email table setup

### Quick Fixes:
1. Check Render build logs
2. Verify all environment variables are set
3. Ensure Supabase is accessible
4. Test email configuration

## ✅ Success Checklist

- [ ] Code pushed to GitHub ✅
- [ ] Render service created
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Email table setup complete
- [ ] Admin login works
- [ ] Email sending works
- [ ] CSV upload works
- [ ] Email count tracking works

## 🎉 You're Done!

Your UpGrad Calling Tracker is now live and ready to use!

**Next Steps:**
1. Share the Render URL with your team
2. Start uploading CSV files
3. Track learner interactions
4. Monitor email statistics

---

**Need Help?** Check the deployment logs in Render dashboard or contact support.
