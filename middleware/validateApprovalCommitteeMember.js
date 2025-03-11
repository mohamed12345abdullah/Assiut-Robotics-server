const { body, param, validationResult } = require('express-validator');

const validateApprovalCommitteeMember = [
    param('committeeId').isNumeric().withMessage('Committee ID must be numeric'),
    body('memberId').isNumeric().withMessage('Member ID must be numeric'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = validateApprovalCommitteeMember;
