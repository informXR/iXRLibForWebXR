export function getUserIP(): Promise<string> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Not in browser environment'));
  }

  return new Promise((resolve, reject) => {
    const myPeerConnection = window.RTCPeerConnection || (window as any).mozRTCPeerConnection || (window as any).webkitRTCPeerConnection;
    if (!myPeerConnection) {
      reject(new Error('WebRTC not supported'));
      return;
    }

    const pc = new myPeerConnection({ iceServers: [] });
    const noop = () => {};
    const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g;

    pc.createDataChannel("");

    pc.createOffer()
      .then(sdp => {
        if (sdp.sdp) {  // Add this check
          sdp.sdp.split('\n').forEach(line => {
            if (line.indexOf('candidate') < 0) return;
            line.match(ipRegex)?.forEach(ip => resolve(ip));
          });
        }
        
        pc.setLocalDescription(sdp, noop, noop);
      })
      .catch(reject);

    pc.onicecandidate = (ice) => {
      if (!ice || !ice.candidate || !ice.candidate.candidate) return;
      ice.candidate.candidate.match(ipRegex)?.forEach(ip => resolve(ip));
    };

    // Set a timeout in case we can't get the IP
    setTimeout(() => {
      reject(new Error('Timeout getting IP address'));
    }, 5000);
  });
}