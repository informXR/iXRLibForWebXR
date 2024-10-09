export function logError(context: string, error: any): void {
  console.error('=== Error ===');
  console.error(`Context: ${context}`);
  console.error('Message:', error.message);
  if (error.response) {
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
    console.error('Response headers:', error.response.headers);
  } else if (error.request) {
    console.error('Request:', error.request);
  }
  console.error('Stack:', error.stack);
  console.error('=============');
}

export function logInfo(context: string, message: string, data?: any): void {
  console.log('=== Info ===');
  console.log(`Context: ${context}`);
  console.log('Message:', message);
  if (data) {
    const sanitizedData = sanitizeSensitiveData(data);
    console.log('Data:', sanitizedData);
  }
  console.log('============');
}

function sanitizeSensitiveData(data: any): any {
  const sensitiveKeys = ['apiToken', 'apiSecret', 'authSecret', 'token', 'secret'];
  if (typeof data === 'object' && data !== null) {
    return Object.keys(data).reduce((acc: any, key) => {
      if (sensitiveKeys.includes(key)) {
        acc[key] = '[REDACTED]';
      } else if (typeof data[key] === 'object') {
        acc[key] = sanitizeSensitiveData(data[key]);
      } else {
        acc[key] = data[key];
      }
      return acc;
    }, Array.isArray(data) ? [] : {});
  }
  return data;
}