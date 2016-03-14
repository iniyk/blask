$(document).ready(function() {
    $.get("/json/modeltree.json", function (model_tree) {
        $("#exchange-selector").treeview({data: model_tree});
    });
});