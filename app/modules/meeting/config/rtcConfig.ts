/**
 * ICE server configuration for WebRTC peer connections.
 * Includes STUN and TURN servers for NAT traversal.
 */
export const rtcConfig: RTCConfiguration = {
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:standard.relay.metered.ca:80",
      username: "c8af2a6d067a2d2bd56f1a64",
      credential: "EqNHfvLSLD6Udxsj",
    },
    {
      urls: "turn:standard.relay.metered.ca:80?transport=tcp",
      username: "c8af2a6d067a2d2bd56f1a64",
      credential: "EqNHfvLSLD6Udxsj",
    },
    {
      urls: "turn:standard.relay.metered.ca:443",
      username: "c8af2a6d067a2d2bd56f1a64",
      credential: "EqNHfvLSLD6Udxsj",
    },
    {
      urls: "turns:standard.relay.metered.ca:443?transport=tcp",
      username: "c8af2a6d067a2d2bd56f1a64",
      credential: "EqNHfvLSLD6Udxsj",
    },
  ],
};
