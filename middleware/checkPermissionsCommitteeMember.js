const checkPermissionsCommitteeMember = (req, res, next) => {
    const userRole = req.headers['x-user-role']; // افتراض أنك ترسل الدور عبر Header
    if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: You do not have permission' });
    }
    next();
};

module.exports = checkPermissionsCommitteeMember;
