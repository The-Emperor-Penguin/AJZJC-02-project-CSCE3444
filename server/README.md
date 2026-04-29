# OutfitPilot Server

## Setup

**Warning: You must set up a .env in order for auth to work locally**

Before starting the server add a `.env` file to the server folder:

```env
JWT_SECRET=your_secret_key_here
PORT=3000
DATABASE_URL=your_railway_database_url_here
NODE_ENV=development
RESEND_API_KEY=your_resend_api_key_here
BASE_URL=your_railway_base_url_here
```

You can generate a secret key for JWT_SECRET using:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Running the Server Locally

```bash
cd server
npm install
node server.js
```

## Deployment

The server is deployed on Railway. Environment variables are set directly in Railway's dashboard and should never be committed to the repository.

## Forgot Password

The forgot password feature uses Resend for email delivery. Railway blocks outbound SMTP so Nodemailer is not used. To get your Resend API key:

1. Go to resend.com and sign in
2. Click on API Keys in the sidebar
3. Copy your key and add it as RESEND_API_KEY in your .env

**Note: Never commit your .env file to the repository.**