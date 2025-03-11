// Replace with actual database logic
let committees = [
    {
        id: 1,
        name: 'Committee A',
        members: [
            { id: 1, name: 'Member A1', role: 'Member' },
            { id: 2, name: 'Member A2', role: 'Head' }
        ],
        pending: [
            { id: 3, name: 'Pending A1' }
        ]
    },
    {
        id: 2,
        name: 'Committee B',
        members: [
            { id: 4, name: 'Member B1', role: 'Member' }
        ],
        pending: []
    }
];

module.exports = committees;
