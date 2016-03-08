/**
 * Created by iniyk on 16/3/8.
 */
var express = require('express');
var router = express.Router();

var _ = require("underscore");

var router_now = 'demo/';

var pages = {
    index: {
        name: 'index',
        title: '首页',
        router: router_now + 'index'
    },
    source: {
        name: 'source',
        title: '数据源管理',
        router: router_now + 'source'
    },
    exchange: {
        name: 'exchange',
        title: '数据转换',
        router: router_now + 'exchange'
    },
    model: {
        name: 'model',
        title: '数据挖掘',
        router: router_now + 'model'
    },
    schema: {
        name: 'schema',
        title: '元数据管理',
        router: router_now + 'schema'
    },
    display: {
        name: 'display',
        title: '数据展示',
        router: router_now + 'display'
    }
};

//GET demo index
router.get('/', function(req, res, next) {
    var page = {
        name: pages.index.name,
        title: pages.index.title,
        pages: pages
    };
    res.render('demo/index', {page: page});
});

//GET other page include index
_.map(pages, function (page, index) {
    var page_to_pass = {
        name: page.name,
        title: page.title,
        pages: pages
    }
    router.get('/' + page.name, function(req, res, next) {
        res.render('demo/' + page.name, {page: page});
    });
});

module.exports = router;