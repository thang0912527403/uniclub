/**
 * ICE server configuration for WebRTC peer connections.
 * Includes STUN and TURN servers for NAT traversal.
 */
export const rtcConfig: RTCConfiguration = {
  iceServers: [
    {
      urls: "stun:free.stun.twilio.com:3478",
    },
    {
      urls: "turn:free.expressturn.com:3478",
      username: "000000002085847899",
      credential: "88FQ3nhiT+lQ6shQXhswDHKVD28=",
    },
    {
      urls: "turn:free.expressturn.com:3478",
      username: "000000002085848795",
      credential: "Xm5fuYejzQfYJSJPttawHpsrcbI=",
    }
  ]
};
