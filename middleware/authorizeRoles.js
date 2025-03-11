const Member = require("../mongoose.models/member"); // استدعاء الموديل الخاص بالمستخدمين

const authorizeRoles = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // تأكد أن req.decoded.email موجود بعد فك الـ JWT
            if (!req.decoded || !req.decoded.email) {
                return res.status(401).json({ message: "Unauthorized. No email provided." });
            }

            // البحث عن المستخدم في قاعدة البيانات
            const user = await Member.findOne({ email: req.decoded.email });

            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }

            // التحقق مما إذا كان دوره ضمن الأدوار المسموح بها
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ message: "Access denied. Insufficient permissions." });
            }

            // إضافة بيانات المستخدم إلى الطلب
            req.user = user;

            // السماح بالانتقال إلى الـ middleware التالي
            next();
        } catch (error) {
            res.status(500).json({ message: "Server error.", error: error.message });
        }
    };
};

module.exports = authorizeRoles;
