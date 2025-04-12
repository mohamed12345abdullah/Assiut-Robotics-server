const asyncWrapper = require("./asyncWrapper");
const createError = require("../utils/createError");
const component = require("../mongoose.models/component");
const Member = require("../mongoose.models/member");

// Validate required fields in request body
const validateRequest = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];
    requiredFields.forEach(field => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      throw createError(400, 'Fail', `Missing required fields: ${missingFields.join(', ')}`);
    }
    next();
  };
};

// Check if component exists
const componentExists = asyncWrapper(async (req, res, next) => {
  const componentId = req.params.id || req.body.componentId;
  if (!componentId) {
    throw createError(400, 'Fail', 'Component ID is required');
  }

  const foundComponent = await component.findById(componentId);
  if (!foundComponent) {
    throw createError(404, 'Fail', 'Component not found');
  }

  req.component = foundComponent;
  next();
});

// Check if component is available
const isComponentAvailable = asyncWrapper(async (req, res, next) => {
  if (req.component.status !== 'available') {
    throw createError(400, 'Fail', 'Component is not available for this operation');
  }
  next();
});

// Check if component is borrowed
const isComponentBorrowed = asyncWrapper(async (req, res, next) => {
  if (req.component.status !== 'borrowed') {
    throw createError(400, 'Fail', 'Component must be borrowed for this operation');
  }
  next();
});

// Check if user is OC member
const isOCMember = asyncWrapper(async (req, res, next) => {
  const member = await Member.findById(req.decoded._id).select('committee');
  if (member.committee !== 'OC') {
    throw createError(403, 'Fail', 'This operation requires OC membership');
  }
  next();
});

// Check if user is OC member or leader
const isLeaderOrOC = asyncWrapper(async (req, res, next) => {
  const member = await Member.findById(req.decoded._id).select('committee role');
  if (member.committee !== 'OC' && member.role !== 'leader') {
    throw createError(403, 'Fail', 'This operation requires OC membership or leader role');
  }
  next();
});

module.exports = {
  validateRequest,
  componentExists,
  isComponentAvailable,
  isComponentBorrowed,
  isOCMember,
  isLeaderOrOC
};