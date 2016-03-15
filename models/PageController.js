/**
 * Created by Administrator on 2016/3/14.
 */
function Pages(router_now) {
    var _ = require('underscore');
    var Common = require('./Common');

    var pages = {};

    var index = Common.readJsonSync('./views/json/index.json');
    pages.index = index;

    var source = Common.readJsonSync('./views/json/source.json');
    pages.source = source;

    var exchange = Common.readJsonSync('./views/json/exchange.json');
    pages.exchange = exchange;

    var model = Common.readJsonSync('./views/json/model.json');
    pages.model = model;

    var schema = Common.readJsonSync('./views/json/schema.json');
    pages.schema = schema;

    var display = Common.readJsonSync('./views/json/display.json');
    pages.display = display;

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