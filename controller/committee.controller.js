// const committees = require('../mongoose.models/committee');

// const logger = require('../utils/logger');



// const committeeController = {
//     getAllCommittees: (req, res) => {
//         res.json(committees);
//     },

//     approveMember: (req, res) => {
//         const { committeeId } = req.params;
//         const { memberId } = req.body;

//         const committee = committees.find(c => c.id === parseInt(committeeId));
//         if (!committee) return res.status(404).json({ message: 'Committee not found' });

//         const memberIndex = committee.pending.findIndex(m => m.id === memberId);
//         if (memberIndex === -1) return res.status(404).json({ message: 'Member not found in pending list' });

//         const member = committee.pending.splice(memberIndex, 1)[0];
//         member.role = 'Member';
//         committee.members.push(member);

//         logger.info(`Member ${memberId} approved in committee ${committeeId}`);
//         res.json({ message: 'Member approved', member });
//     },

//     removeMember: (req, res) => {
//         const { committeeId, memberId } = req.params;

//         const committee = committees.find(c => c.id === parseInt(committeeId));
//         if (!committee) return res.status(404).json({ message: 'Committee not found' });

//         const memberIndex = committee.members.findIndex(m => m.id === parseInt(memberId));
//         if (memberIndex === -1) return res.status(404).json({ message: 'Member not found' });

//         committee.members.splice(memberIndex, 1);
//         res.json({ message: 'Member removed' });
//     },

//     setHead: (req, res) => {
//         const { committeeId } = req.params;
//         const { memberId } = req.body;

//         const committee = committees.find(c => c.id === parseInt(committeeId));
//         if (!committee) return res.status(404).json({ message: 'Committee not found' });

//         const member = committee.members.find(m => m.id === memberId);
//         if (!member) return res.status(404).json({ message: 'Member not found' });

//         // Reset head roles
//         committee.members.forEach(m => {
//             if (m.role === 'Head') m.role = 'Member';
//         });

//         member.role = 'Head';
//         res.json({ message: 'Head assigned', member });
//     }
// };

// module.exports = committeeController;
