import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 6001;

// Middleware to inject simulated GET parameters
app.use((req, res, next) => {
  const simulatedParams = {
    xrdm_orgid: '',
    xrdm_deviceid: 'iXRLibForWebXR_device_id',
    xrdm_devicemodel: 'iXRLibForWebXR_device_model',
    xrdm_authsecret: ''
  };

  // Parse the existing query parameters
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Merge the simulated parameters with existing ones
  for (const [key, value] of Object.entries(simulatedParams)) {
    url.searchParams.set(key, value);
  }
  
  // Update the request URL
  req.url = url.pathname + url.search;

  next();
});

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// For any other routes, serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
