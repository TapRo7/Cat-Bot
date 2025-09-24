const activeCareUsers = new Set();

function startCare(userId) {
    if (activeCareUsers.has(userId)) return false;
    activeCareUsers.add(userId);
    return true;
}

function endCare(userId) {
    activeCareUsers.delete(userId);
}

module.exports = { startCare, endCare };