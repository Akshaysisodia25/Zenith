const fs = require('fs');
let html = fs.readFileSync('session.html', 'utf8');

// Fix handleSignal
html = html.replace(/if \(!peers\[data.sender\]\) \{\s*initiateConnection\(data.sender\);\s*\}/, 
`if (!peers[data.sender] && myId > data.sender) {
                    initiateConnection(data.sender);
                }`);

// Fix announceCamera
html = html.replace(/if \(p\.id !== myId && !peers\[p\.id\]\) initiateConnection\(p\.id\);/,
`if (p.id !== myId && !peers[p.id] && myId > p.id) initiateConnection(p.id);`);

// Wait, the friend who joins without the link (via code) will have their cam disabled.
// If the room they joined HAD a cam required, the original creator had `cam=on`.
// But when the friend joins via Join Modal, they don't have `cam=on`.
// Maybe `rooms.html` "Join Friend" should also add `cam=on` by default?
// Or maybe `session.html` should let them know the other person's video is there.
// If the friend joins without cam, they should STILL receive video from the creator!
// But if they join without cam, `isVideoOn` is false.
// If `isVideoOn` is false, `handleSyncData` does NOT initiate WebRTC:
//    if (isVideoOn && !peers[data.id]) {
//        initiateConnection(data.id);
//    }
// So if they don't have a camera on, they NEVER connect via WebRTC, so they never see the creator's video!
// To fix this, we should connect WebRTC EVEN IF our camera is off, so we can RECEIVE their video!

html = html.replace(/if \(isVideoOn && !peers\[data\.id\]\) \{/,
`if (!peers[data.id] && myId > data.id) {`);

fs.writeFileSync('session.html', html);
