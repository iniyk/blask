/**
 * Created by iniyk on 15/12/30.
 */

/**
 * A class to control panel.
 * @class
 */
var Panel = {
    Panel: function() {
        var panel = {};

        panel.id = -1;
        panel.name = "Unnamed Mining Model";
        panel.comment = "";
        panel.icon = "fa fa-question fa-5x";
        panel.panel_type = "panel panel-info"

        return panel;
    },
    Panel: function(id, name, comment, icon, panel_type) {
        var panel = {};

        panel.id = id;
        panel.name = name;
        panel.comment = comment;
        panel.icon = icon;
        panel.panel_type = panel_type

        return panel;
    },
    Create: function () {
        return Panel.Panel();
    },
    Create: function(id, name, comment, icon, panel_type) {
        return Panel.Panel(id, name, comment, icon, panel_type);
    }
};

exports = module.exports = Panel;