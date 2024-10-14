import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 6001;

// Add a webxrdemo route that redirects to the main app with parameters
app.get('/webxrdemo', (req, res) => {
  const { xrdm_orgid, xrdm_authsecret } = req.query;

  if (!xrdm_orgid || !xrdm_authsecret) {
    return res.status(400).send('Missing required parameters: xrdm_orgid and xrdm_authsecret');
  }

  const demoParams = {
    xrdm_orgid,
    xrdm_authsecret
  };

  const demoUrl = new URL('/', `http://localhost:${port}`);
  Object.entries(demoParams).forEach(([key, value]) => {
    demoUrl.searchParams.append(key, value);
  });

  res.redirect(demoUrl.toString());
});

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// For any other routes, serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Visit http://localhost:${port}/webxrdemo?xrdm_orgid=YOUR_ORG_ID&xrdm_authsecret=YOUR_AUTH_SECRET to load the app with demo parameters`);
});
