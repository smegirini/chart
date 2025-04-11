import app from './app';
import dotenv from 'dotenv';

dotenv.config(); // Ensure environment variables are loaded

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
}); 