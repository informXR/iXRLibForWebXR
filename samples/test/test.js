const { createIXR } = require('ixrlibforwebxr');

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

  // Pass appId directly to createIXR
  const ixr = await createIXR({
    appId: 'update-with-valid-appid'
  });

  //ixr.setAPIBaseURL('https://dev-libapi.informxr.io/');

  // After creating the IXR instance
  console.log('IXR instance created:', ixr);

  // You could also add a method to IXR to get the current auth data for verification
  if (ixr.getAuthData) {
    console.log('Current auth data:', await ixr.getAuthData());
  }

  // Test various IXR methods
  try {
    // Log an event
    await ixr.Event('user_action', 'action=click,target=button');
    console.log('Event logged successfully');

    // Log info
    await ixr.LogInfo('User completed onboarding');
    console.log('Info logged successfully');

    // Send telemetry data
    await ixr.Telemetry('performance_metrics', { fps: 60, latency: 20 });
    console.log('Telemetry sent successfully');

    // Test other methods as needed
    // ...

  } catch (error) {
    console.error('Error occurred:', error);
  }
}

main();