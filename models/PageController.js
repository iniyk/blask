/**
 * Created by Administrator on 2016/3/14.
 */
function Pages(router_now) {
    var _ = require('underscore');
    var Common = require('./Common');

    var pages = {
        index: {
            name: 'index',
            title: '首页',
            icon: 'glyphicon glyphicon-home'
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

    var source = Common.readJsonSync('./views/json/source.json');
    pages.source = source;

    var exchange = Common.readJsonSync('./views/json/exchange.json');
    pages.exchange = exchange;

    var model = Common.readJsonSync('./views/json/model.json');
    pages.model = model;

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

    return pages;
}

module.exports.Pages = Pages;