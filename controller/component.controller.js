require("dotenv").config();
const MONGOURL = process.env.MONGOURL;
const mongoose = require("mongoose");
mongoose.connect(MONGOURL);
const component = require("../mongoose.models/component");
const path = require('path');
const fs = require('fs');
const sendEmail = require('../utils/sendEmail');
const cloudinary = require('../utils/cloudinary');
const { uploadToCloud } = require("../utils/cloudinary");
const asyncWrapper = require("../middleware/asyncWrapper");
const createError = require("../utils/createError");
const Member = require("../mongoose.models/member");

const addComponent = async (req, res) => {
    try {
        const email = req.decoded.email;
        const member = await Member.findOne({ email });

        if (!member) {
            const error = createError(400, 'Fail', "member not found");
            throw (error);
        }

        const { title, price, taxes, ads, discount, total, category } = req.body;
        const newComponent = await new component({
            title,
            image: req.imageUrl,
            price,
            taxes,
            ads,
            discount,
            total,
            category,
        });

        await newComponent.save();

        res.status(200).send({ message: "add component successfully" });
    } catch (error) {
        console.log(error);
        res.status(400).send({ message: error.message });
    }
};

const getComponent = asyncWrapper(async (req, res) => {
    const components = await component.find({ deleted: false })

    let data = components.filter(component =>
        component.deleted === false
    );
    if (!data) {
        const error = createError(400, 'Fail', "components not found");
        throw (error);
    }
    res.status(200).send({ message: "get data successfully", data: data });
});

const updateComponent = async (req, res) => {
    try {
        console.log(req.body);
        const email = req.decoded.email;

        const member = await Member.findOne({ email });
        if (!member) {
            const error = createError(400, 'Fail', "member not found");
            throw (error);
        }

        const updatedComponent = await component.findByIdAndUpdate(req.body.id, req.body.newpro);
        if (!updatedComponent) {
            const error = createError(400, 'Fail', "component not found");
            throw (error);
        }
        updatedComponent.historyOfUpdate.push({
            updatedBy: member._id,
            updatedAt: Date.now()
        });
        await updatedComponent.save();

        res.status(200).send({ message: "updated" });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
};

const deleteOne = async (req, res) => {
    try {
        console.log("delete one");
        const id = req.body.id;
        const email = req.decoded.email;
        const member = await Member.findOne({ email });
        if (!member) {
            const error = createError(400, 'Fail', "member not found");
            throw (error);
        }
        if (!id) {
            const error = createError(400, 'Fail', "id is required");
            throw (error);
        }
        const mycomponent = await component.findById(id);
        if (!mycomponent) {
            const error = createError(400, 'Fail', "component not found");
            throw (error);
        }
        mycomponent.deleted = true;
        mycomponent.deletedBy = member._id;
        await mycomponent.save();

        res.status(200).send({ message: "deleted" });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Borrow Component
const borrowComponent = asyncWrapper(async (req, res) => {
    const { componentId, borrowerId, returnDate } = req.body;
    const email = req.decoded.email;
    const member = await Member.findOne({ email });

    const componentToBorrow = await component.findById(componentId);
    if (!componentToBorrow) {
        throw createError(404, 'Fail', 'Component not found');
    }

    if (componentToBorrow.status !== 'available') {
        throw createError(400, 'Fail', 'Component is not available for borrowing');
    }

    componentToBorrow.status = 'borrowed';
    componentToBorrow.borrowedBy = borrowerId;
    componentToBorrow.borrowedAt = new Date();
    componentToBorrow.expectedReturnDate = returnDate;
    componentToBorrow.borrowedByMember = member._id;

    await componentToBorrow.save();

    res.status(200).json({
        message: 'Component borrowed successfully',
        data: componentToBorrow
    });
});

// Return Component
const returnComponent = asyncWrapper(async (req, res) => {
    const { componentId } = req.body;

    const componentToReturn = await component.findById(componentId);
    if (!componentToReturn) {
        throw createError(404, 'Fail', 'Component not found');
    }

    if (componentToReturn.status !== 'borrowed') {
        throw createError(400, 'Fail', 'Component is not currently borrowed');
    }

    componentToReturn.status = 'available';
    componentToReturn.returnedAt = new Date();
    componentToReturn.borrowHistory.push({
        borrowedBy: componentToReturn.borrowedBy,
        borrowedAt: componentToReturn.borrowedAt,
        returnedAt: componentToReturn.returnedAt
    });
    componentToReturn.borrowedBy = null;
    componentToReturn.borrowedAt = null;
    componentToReturn.expectedReturnDate = null;

    await componentToReturn.save();

    res.status(200).json({
        message: 'Component returned successfully',
        data: componentToReturn
    });
});

// Request to Borrow
const requestToBorrow = asyncWrapper(async (req, res) => {
    const { componentId, purpose, expectedReturnDate } = req.body;
    const email = req.decoded.email;
    const member = await Member.findOne({ email });

    const componentToRequest = await component.findById(componentId);
    if (!componentToRequest) {
        throw createError(404, 'Fail', 'Component not found');
    }

    if (componentToRequest.status !== 'available') {
        throw createError(400, 'Fail', 'Component is not available for borrowing');
    }

    componentToRequest.borrowRequests.push({
        requestedBy: member._id,
        purpose,
        expectedReturnDate,
        requestedAt: new Date()
    });

    await componentToRequest.save();

    res.status(200).json({
        message: 'Borrow request submitted successfully',
        data: componentToRequest
    });
});

// Accept Borrow Request
const acceptRequestToBorrow = asyncWrapper(async (req, res) => {
    const { componentId, requestId } = req.body;

    const componentToUpdate = await component.findById(componentId);
    if (!componentToUpdate) {
        throw createError(404, 'Fail', 'Component not found');
    }

    const request = componentToUpdate.borrowRequests.id(requestId);
    if (!request) {
        throw createError(404, 'Fail', 'Borrow request not found');
    }

    // Update component status
    componentToUpdate.status = 'borrowed';
    componentToUpdate.borrowedBy = request.requestedBy;
    componentToUpdate.borrowedAt = new Date();
    componentToUpdate.expectedReturnDate = request.expectedReturnDate;

    // Move request to approvedRequests
    componentToUpdate.approvedRequests.push({
        approvedBy: req.decoded._id,
        requestedBy: request.requestedBy,
        purpose: request.purpose,
        expectedReturnDate: request.expectedReturnDate,
        approvedAt: new Date()
    });

    // Remove the request
    componentToUpdate.borrowRequests.pull(requestId);

    await componentToUpdate.save();

    res.status(200).json({
        message: 'Borrow request accepted successfully',
        data: componentToUpdate
    });
});

// Reject Borrow Request
const rejectRequestToBorrow = asyncWrapper(async (req, res) => {
    const { componentId, requestId, reason } = req.body;

    const componentToUpdate = await component.findById(componentId);
    if (!componentToUpdate) {
        throw createError(404, 'Fail', 'Component not found');
    }

    const request = componentToUpdate.borrowRequests.id(requestId);
    if (!request) {
        throw createError(404, 'Fail', 'Borrow request not found');
    }

    // Move request to rejectedRequests
    componentToUpdate.rejectedRequests.push({
        rejectedBy: req.decoded._id,
        requestedBy: request.requestedBy,
        purpose: request.purpose,
        expectedReturnDate: request.expectedReturnDate,
        rejectedAt: new Date(),
        reason
    });

    // Remove the request
    componentToUpdate.borrowRequests.pull(requestId);

    await componentToUpdate.save();

    res.status(200).json({
        message: 'Borrow request rejected successfully',
        data: componentToUpdate
    });
});

// Get Requested Components
const getRequestedComponent = asyncWrapper(async (req, res) => {
    const components = await component.find({
        'borrowRequests.0': { $exists: true }
    }).populate('borrowRequests.requestedBy');

    res.status(200).json({
        message: 'Requested components retrieved successfully',
        data: components
    });
});

// Get Borrowed Components
const getBorrowedComponent = asyncWrapper(async (req, res) => {
    const components = await component.find({
        status: 'borrowed'
    }).populate('borrowedBy');

    res.status(200).json({
        message: 'Borrowed components retrieved successfully',
        data: components
    });
});

// Get Component History
const getHistoryComponent = asyncWrapper(async (req, res) => {
    const components = await component.find({
        $or: [
            { 'borrowHistory.0': { $exists: true } },
            { 'approvedRequests.0': { $exists: true } },
            { 'rejectedRequests.0': { $exists: true } }
        ]
    }).populate('borrowHistory.borrowedBy approvedRequests.requestedBy rejectedRequests.requestedBy');

    res.status(200).json({
        message: 'Component history retrieved successfully',
        data: components
    });
});

// Get Deleted Components
const getDeletedComponent = asyncWrapper(async (req, res) => {
    const components = await component.find({ deleted: true })
        .populate('deletedBy');

    res.status(200).json({
        message: 'Deleted components retrieved successfully',
        data: components
    });
});

const getComponentById = asyncWrapper(async (req, res) => {
    const component = req.component;
    await component.populate([
      { path: "createdBy", select: "name email" },
      { path: "currentBorrower.member", select: "name email" },
      { path: "borrowRequests.requestedBy", select: "name email" }
    ]);
  
    res.status(200).json({
      status: "Success",
      data: component
    });
  });

module.exports = {
    addComponent,
    getComponent,
    updateComponent,
    deleteOne,
    borrowComponent,
    returnComponent,
    requestToBorrow,
    acceptRequestToBorrow,
    rejectRequestToBorrow,
    getRequestedComponent,
    getBorrowedComponent,
    getHistoryComponent,
    getDeletedComponent,
    getComponentById
};