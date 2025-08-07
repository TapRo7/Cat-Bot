const inviteApiUrl = process.env.INVITE_API_URL;
const inviteApiToken = process.env.INVITE_API_TOKEN;

async function fetchInviteInfo(guildId, memberId) {
    const payload = {
        token: inviteApiToken,
        guildId,
        memberId
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    };

    try {
        const response = await fetch(inviteApiUrl, options);
        if (response.status !== 200) {
            return null;
        }

        const responseJson = await response.json();
        if (!responseJson.inviterId || !responseJson.inviteCode) {
            return null;
        }
        return responseJson;
    } catch (error) {
        console.error(`Error in invite API fetch: ${error}`);
        return null;
    }
}

module.exports = { fetchInviteInfo };