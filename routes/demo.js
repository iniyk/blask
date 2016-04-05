/**
 * Created by iniyk on 16/3/8.
 */
var express = require('express');
var router = express.Router();

var _ = require('underscore');

var Common = require('../models/Common');
var Logger = require('../models/Logger')();
var logger = Logger.handle("RouterDemo");
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
_.map(pages.page_list, function (name, index) {
    var one_in_pages = pages[name];
    var page = {};
    _.map(one_in_pages, function(value, attr) {
        page[attr] = value;
    });
    page.pages = pages;
    router.get('/' + page.name, function(req, res, next) {
        page.request = undefined;
        res.render('demo/main', {page: page});
    });
    //logger.debug(`Page ${page.name} is resource : ${page.is_resource}`);
    if (page.is_resource) {
        router.get(`/${page.name}/:id([a-z0-9]+)`, function(req, res, next) {
            page.request = {};
            page.request.id = req.params.id;
            res.render('demo/main', {page: page});
        });
    }
});

module.exports = router;