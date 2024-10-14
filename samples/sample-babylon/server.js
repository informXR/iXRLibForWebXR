const express = require('express');
const path = require('path');
const url = require('url');

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
  const parsedUrl = url.parse(req.url, true);
  
  // Merge the simulated parameters with existing ones
  const newQuery = { ...simulatedParams, ...parsedUrl.query };
  
  // Reconstruct the URL with the new query parameters
  req.url = url.format({
    pathname: parsedUrl.pathname,
    query: newQuery
  });

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
