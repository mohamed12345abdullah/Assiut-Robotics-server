const express=require('express');

const memberControler=require("../controler/member.controler");
const JWT=require('../jwt/jwt')
const Router=express.Router();

Router.route("/createAccount")
        .post(memberControler.createAccount)

Router.route("/getAllMembers")
        .get(memberControler.getAllMembers)

Router.route("/login")
        .post(memberControler.login);

Router.route("/verify")
        .post(JWT.verify,memberControler.verify)
module.exports=Router;        