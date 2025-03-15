const express = require("express");
const dotenv = require("dotenv");
const axios = require("axios");
const moment = require("moment");

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const faceBookAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;
const PAGE_ID = process.env.FACEBOOK_PAGE_ID;

// Fetch posts for a specific month

async function getPagePosts(month, year) {
    const startDate = moment(`${year}-${month}-01`).startOf('month').unix();
    const endDate = moment(`${year}-${month}-01`).endOf('month').unix();
    
    try {
        const response = await axios.get(`https://graph.facebook.com/v19.0/${PAGE_ID}/posts`, {
            params: {
                access_token: faceBookAccessToken,
                fields: 'id,message,created_time,reactions',
                since: startDate, // أضف تاريخ البداية
                until: endDate // أضف تاريخ النهاية
            }
        });
        return response.data.data;
    } catch (error) {
        console.error('Error details:', error.response?.data); // للحصول على تفاصيل الخطأ من فيسبوك
        throw error;
    }
}

// Get detailed reactions and comments for a post
async function getPostInteractions(postId) {
    try {
        const [reactions, comments] = await Promise.all([
            axios.get(`https://graph.facebook.com/v19.0/${postId}/reactions`, {
                params: {
                    access_token: faceBookAccessToken,
                    fields: 'id,type,name'
                }
            }),
            axios.get(`https://graph.facebook.com/v19.0/${postId}/comments`, {
                params: {
                    access_token: faceBookAccessToken,
                    fields: 'id,from,message,created_time'
                }
            })
        ]);
        
        return {
            reactions: reactions.data.data,
            comments: comments.data.data
        };
    } catch (error) {
        console.error(`Error fetching interactions for post ${postId}:`, error.message);
        throw error;
    }
}

// Calculate user engagement rates
function calculateUserEngagement(interactions) {
    const userEngagement = new Map();
    
    // Process reactions
    interactions.forEach(post => {
        post.reactions.forEach(reaction => {
            if (!userEngagement.has(reaction.id)) {
                userEngagement.set(reaction.id, {
                    name: reaction.name,
                    reactions: 0,
                    comments: 0,
                    totalInteractions: 0
                });
            }
            const user = userEngagement.get(reaction.id);
            user.reactions++;
            user.totalInteractions++;
        });
        
        // Process comments
        post.comments.forEach(comment => {
            const userId = comment.from.id;
            if (!userEngagement.has(userId)) {
                userEngagement.set(userId, {
                    name: comment.from.name,
                    reactions: 0,
                    comments: 0,
                    totalInteractions: 0
                });
            }
            const user = userEngagement.get(userId);
            user.comments++;
            user.totalInteractions++;
        });
    });
    
    return Array.from(userEngagement.entries()).map(([userId, data]) => ({
        userId,
        ...data
    }));
}

// API endpoint to get engagement analytics
app.get('/page-analytics', async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).json({ error: 'Month and year are required' });
        }

        // Get all posts for the specified month
        const posts = await getPagePosts(month, year);
        
        // Get detailed interactions for each post
        const postsWithInteractions = await Promise.all(
            posts.map(async (post) => {
                const interactions = await getPostInteractions(post.id);
                return {
                    postId: post.id,
                    message: post.message,
                    created_time: post.created_time,
                    ...interactions
                };
            })
        );
        
        // Calculate engagement rates
        const userEngagementStats = calculateUserEngagement(postsWithInteractions);
        
        // Sort users by total interactions
        const sortedUsers = userEngagementStats.sort((a, b) => b.totalInteractions - a.totalInteractions);
        
        res.json({
            totalPosts: posts.length,
            period: `${month}/${year}`,
            userEngagement: sortedUsers
        });
    } catch (error) {
        console.error('Error in page analytics:', error.message);
        res.status(500).json({ error: 'Failed to fetch page analytics' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
