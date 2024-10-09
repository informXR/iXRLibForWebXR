const { iXRInit } = require('iXRlibforwebxr');

async function main() {
  // Simulate GET request parameters
  const urlParams = new URLSearchParams({
    xrdm_orgid: 'get-the-org-id-from-informxr-io',
    xrdm_deviceid: 'iXRLibForWebXR_device_id',
    xrdm_devicemodel: 'iXRLibForWebXR_device_model',
    xrdm_authsecret: 'ChangeThisToYourAuthSecret'
  });

  // Simulate setting the URL
  if (typeof window !== 'undefined') {
    window.history.pushState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
  }

  // Pass appId directly to iXRInit
  const iXR = await iXRInit({
    appId: 'update-with-valid-appid'
  });

  //iXR.setAPIBaseURL('https://dev-libapi.informxr.io/');

  // After creating the iXR instance
  console.log('iXR instance created:', iXR);

  // You could also add a method to iXR to get the current auth data for verification
  if (iXR.getAuthData) {
    console.log('Current auth data:', await iXR.getAuthData());
  }

  // Test various iXR methods
  try {
    // Log an event
    await iXR.Event('user_action', 'action=click,target=button');
    console.log('Event logged successfully');

    // Log info
    await iXR.LogInfo('User completed onboarding');
    console.log('Info logged successfully');

    // Send telemetry data
    await iXR.Telemetry('performance_metrics', { fps: 60, latency: 20 });
    console.log('Telemetry sent successfully');

    // Test other methods as needed
    // ...

  } catch (error) {
    console.error('Error occurred:', error);
  }
}

main();