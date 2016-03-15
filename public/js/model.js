$(document).ready(function() {
    var node_selected = new Set();
    $.get("/json/data/model_tree.json", function (model_tree) {
        $("#model-selector").treeview({
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
});/**
 * Created by Administrator on 2016/3/14.
 */
