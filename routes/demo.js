/**
 * Created by iniyk on 16/3/8.
 */
var express = require('express');
var router = express.Router();

var _ = require('underscore');
var PageController = require('../models/PageController');
var router_now = '/demo/';

var pages = PageController.Pages(router_now);

//GET demo index
router.get('/', function(req, res, next) {
    var page = {};
    _.map(pages.index, function(value, attr) {
        page[attr] = value;
    });
    page.pages = pages;
    res.render('demo/main', {page: page});
});

//GET all page include index
_.map(pages, function (one_in_pages, index) {
    var page = {};
    _.map(one_in_pages, function(value, attr) {
        page[attr] = value;
    });
    page.pages = pages;
    router.get('/' + page.name, function(req, res, next) {
        res.render('demo/main', {page: page});
    });
});

module.exports = router;