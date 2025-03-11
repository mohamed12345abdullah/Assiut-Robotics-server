const express = require("express");

const blogController = require("../controller/blog.controller");
const JWT = require("../middleware/jwt");
const Router = express.Router();

Router.route("/add").post(blogController.addBlog);

Router.route("/getBlogs").get(blogController.getBlogs);

module.exports = Router;
