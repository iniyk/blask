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
        source: {
            name: 'source',
            title: '数据源管理',
            icon: 'fa fa-database'
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
                        'data-target': '#modalAddMysql'
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

    return pages;
}

module.exports.Pages = Pages;