$(document).ready(function() {
    var node_selected = new Set();
    $.get("/json/exchange_tree.json", function (model_tree) {
        $("#exchange-selector").treeview({
            data: model_tree,
            multiSelect: false,
            onNodeSelected: function(event, node) {
                node_selected.add(node.text);
            },
            onNodeUnselected: function (event, node) {
                node_selected.delete(node.text);
            }
        });
    });
});