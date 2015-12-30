var MiningModel = {
    MiningModel: function() {
        var mm = {};

        mm.id = -1;
        mm.name = "Unnamed Mining Model";
        mm.comment = "";
        mm.icon = "fa fa-question fa-5x";
        mm.panel = "panel panel-info"

        return mm;
    },
    MiningModel: function(id, name, comment, icon, panel) {
        var mm = {};

        mm.id = id;
        mm.name = name;
        mm.comment = comment;
        mm.icon = icon;
        mm.panel = panel

        return mm;
    },
    Create: function () {
        return MiningModel.MiningModel();
    }
};

module.exports = MiningModel;