require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/test', (req, res) => {
  res.json({ message: "API is working" });
});

app.get('/', (req, res) => {
  res.send('Server Running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});