/**
 * Created by iniyk on 16/3/8.
 */
var express = require('express');
var router = express.Router();

var _ = require('underscore');

var router_now = '/demo/';

var pages = {
    index: {
        name: 'index',
        title: '首页',
        icon: 'glyphicon glyphicon-home'
    },
    source: {
        name: 'source',
        title: '数据源管理',
        icon: 'fa fa-database'
    },
    exchange: {
        name: 'exchange',
        title: '数据转换',
        icon: 'fa fa-random'
    },
    model: {
        name: 'model',
        title: '数据挖掘',
        icon: 'fa fa-dollar'
    },
    schema: {
        name: 'schema',
        title: '元数据管理',
        icon: 'fa fa-table'
    },
    display: {
        name: 'display',
        title: '数据展示',
        icon: 'fa fa-bar-chart'
    }
};

_.map(pages, function(page, name) {
    page.router = router_now + name;
});

pages.index['sidebar'] = {};

_.map(pages, function(page, name) {
    pages.index.sidebar[name] = {
        name: page.name,
        title: page.title,
        href: page.router,
        icon: page.icon,
        items: {}
    };
});

pages.source['sidebar'] = {
    add: {
        name: 'add',
        title: '添加数据源',
        href: '#',
        icon: 'fa fa-plus',
        items: {
            oracle: {
                name: 'add-oracle',
                title: 'Oracle数据源',
                href: '#',
                icon: 'fa fa-circle-o',
                attrs: {
                    'data-toggle': 'modal',
                    'data-target': '#modelAddMysql'
                }
            },
            mysql: {
                name: 'add-mysql',
                title: 'MySQL数据源',
                href: '#',
                icon: 'fa fa-circle-o'
            },
            mongodb: {
                name: 'add-mongodb',
                title: 'MongoDB数据源',
                href: '#',
                icon: 'fa fa-circle-o'
            }
        }
    },
    showall: {
        name: 'showall',
        title: '显示全部数据源',
        href: '#',
        icon: 'fa fa-folder-open'
    },
    upload: {
        name: 'upload',
        title: '由文件上传',
        href: '#',
        icon: 'fa fa-upload'
    },
    settings: {
        name: 'settings',
        title: '设置',
        href: '#',
        icon: 'fa fa-gear'
    }
};

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