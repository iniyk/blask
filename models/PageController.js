/**
 * Created by Administrator on 2016/3/14.
 */
function Pages(router_now) {
    var _ = require('underscore');
    var Common = require('./Common');

    var pages = {};
    pages.page_list = ['index', 'source', 'exchange', 'model', 'schema', 'display', 'dataset'];

    _.map(pages.page_list, function(name, index) {
        pages[name] =Common.readJsonSync(`./views/json/${name}.json`);
    });

    pages.on_navbar = ['index', 'source', 'exchange', 'model', 'schema', 'display'];

    _.map(pages.on_navbar, function(name, index) {
        pages[name].router = router_now + name;
    });

    pages.index['sidebar'] = {};

    _.map(pages.on_navbar, function(name, index) {
        pages.index.sidebar[name] = {
            name: pages[name].name,
            title: pages[name].title,
            href: pages[name].router,
            icon: pages[name].icon,
            items: {}
        };
    });

    return pages;
}

module.exports.Pages = Pages;