# Outfit Pilot Server

## Setup
**Warning you must set up a .env inorder for auth to work**

You need to install docker https://www.docker.com/.
then you need to run this command to setup postgres:
```bash
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

If you already ran the above command and you need to start postgres you can use the following command:

```bash
docker run -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```
before starting the server you need to add a .env, here is an example of the .env:


```env
JWT_SECRET=your_secret_key_here
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
NODE_ENV=development

```

You can create the secret key for the .env by using this 

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
## Forgot Password - Local Setup
To test the forgot password email feature locally, add the following to your `server/.env` file:

```env
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-16-character-app-password
```

To generate a Gmail App Password:
1. Go to myaccount.google.com
2. Navigate to Security
3. Enable 2-Step Verification if not already on
4. Search for "App Passwords"
5. Create a new app password and copy the 16 character code
6. Paste it as the value for `EMAIL_PASS`

Note: Never commit your `.env` file to the repository.