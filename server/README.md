# Outfit Pilot Server

## Setup
**Warning you must set up a .env inorder for auth to work**

```env
JWT_SECRET=your_secret_key_here
PORT=3000

```

You can create the secret key using this 

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```