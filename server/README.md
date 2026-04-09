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
RESEND_API_KEY=your_resend_api_key_here
```

To get your Resend API key:
1. Go to resend.com and sign in
2. Click on API Keys in the sidebar
3. Copy your API key and paste it as the value for `RESEND_API_KEY`

Note: Never commit your `.env` file to the repository.