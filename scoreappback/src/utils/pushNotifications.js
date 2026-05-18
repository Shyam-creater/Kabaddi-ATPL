const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
let expo = new Expo();

/**
 * Sends push notifications to specified tokens using the Expo Push Service.
 * @param {Array<string>} tokens - Array of Expo Push Tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} media - { image, contentImage, type }
 */
const sendPushNotifications = async (tokens, title, body, media = {}) => {
    let messages = [];
    const { image, contentImage, type } = media;
    
    for (let pushToken of tokens) {
        if (!Expo.isExpoPushToken(pushToken)) continue;

        messages.push({
            to: pushToken,
            sound: 'default',
            title,
            body,
            data: { image, contentImage, type, title, body },
            // Best effort for OS display
            ...(contentImage ? { image: contentImage } : (image ? { image } : {}))
        });
    }

    if (messages.length === 0) return [];

    // The Expo push notification service accepts batches of messages at a time.
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    
    // Send the chunks to the Expo push notification service properly.
    for (let chunk of chunks) {
        try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            // FALLBACK for development: handle multiple experience IDs (different projects)
            // Error code: PUSH_TOO_MANY_EXPERIENCE_IDS
            if (error.code === 'PUSH_TOO_MANY_EXPERIENCE_IDS') {
                console.warn('Multiple experience IDs detected in push chunk. Retrying individually...');
                for (let message of chunk) {
                    try {
                        let singleTicket = await expo.sendPushNotificationsAsync([message]);
                        tickets.push(...singleTicket);
                    } catch (innerError) {
                        console.error('Failed to send individual push:', innerError);
                    }
                }
            } else {
                console.error('Error sending push notification chunk:', error);
            }
        }
    }
    
    return tickets;
};

module.exports = { sendPushNotifications };
