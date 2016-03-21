var data_post;
var model_selected;

function onDrop(event, ui) {
    if (ui.draggable.hasClass('in-selector')) {
        var dragged_field_type = ui.draggable.attr('field-type');
        var target_field_type = $(this).attr('target-field-type');

        if (dragged_field_type != target_field_type) {
            alert('类型不符合！');
            //ui.draggable.remove();
        } else {
            var text = $(this).attr('target-field-text') + " : "
                + ui.draggable.text() + " - "
                + ui.draggable.attr('from-table-text') + " - "
                + ui.draggable.attr('from-database-text');
            $(`<li class="list-group-item"
                            from-database="${ui.draggable.attr('from-database')}"
                            from-table="${ui.draggable.attr('from-table')}"
                            field-name="${ui.draggable.attr('field-name')}"
                            field-type="${dragged_field_type}"
                            target-field-type="${$(this).attr('target-field-type')}"
                            target-field-name="${$(this).attr('target-field-name')}"
                            target-field-text="${$(this).attr('target-field-text')}"
                        ></li>`)
                .text(text)
                .insertBefore($(this));
            $(this).prev().droppable({
                drop: onDrop
            });
            $(this).remove();
        }
    }
}

$(document).ready(function() {
    $('.order-selector').each(function() {
        var get_model = `/json/model/${model_selected}.json`;
        var get_datasets = $(this).attr('source');
        $.get(get_model, function(model, status) {
            if (status == 'success') {
                $.get(get_datasets, function(datasets, status) {
                    if (status == 'success') {
                        onDataLoadReady(model, datasets);
                    } else {
                        //TODO Show error in info box.
                    }
                });
            } else {
                //TODO Show error in info box.
            }
        });
    });
});

function onDataLoadReady(model, datasets) {
    $('.order-selector').each(function() {
        var this_id = $(this).attr('id');

        $(`#${this_id}-tree-selector`).treeview({
            data: datasets,
            onNodeSelected: function(event, node) {
                $(`#${this_id}-fields-selector`).text('');
                var parent = $(`#${this_id}-tree-selector`).treeview('getParent', node);
                for (var item in node.data) {
                    $(`#${this_id}-fields-selector`).append(
                         `<li class="list-group-item in-selector"
                         from-database-text="${parent.text}" from-table-text="${node.text}"
                         from-database="${parent.name}" from-table="${node.name}"
                         field-name="${item}" field-type="${node.data[item]}">
                         ${item}</li>`
                    );
                }

                $(`#${this_id}-fields-selector li`).css('z-index', '100');

                $(`#${this_id}-fields-selector li`).draggable({
                    revert: true,
                    helper: "clone",
                    connectWith: `#${this_id}-fields-result`
                }).disableSelection();
            }
        }).disableSelection();

        for (var item of model.fields) {
            $(`#${this_id}-fields-result`).append(
                `<li class="list-group-item placeholder"
                target-field-name="${item.name}" target-field-type="${item.type}" target-field-text="${item.text}">
                字段名: ${item.text} 字段类型: ${item.type}</li>`
            );
        }

        //$(`#${this_id}-fields-result`).sortable({
        //    placeholder: "list-group-item-info"
        //}).disableSelection();
        $(`#${this_id}-fields-result`).disableSelection();

        $(`#${this_id}-fields-result li`).droppable({
            drop: onDrop
        });

        $(`#${this_id}-btn-submit`).click(function() {
            if (data_post = null || data_post == undefined) {
                data_post = {};
            }
            data_post.selected = {};
            $(`#${this_id}-fields-result li`).each(function () {
                var selection = {
                    "target-field-name": $(this).attr('target-field-name'),
                    "field-name": $(this).attr('field-name'),
                    "field-type": $(this).attr('field-type'),
                    "from-database": $(this).attr('from-database'),
                    "from-table": $(this).attr('from-table')
                };
                data_post.selected[selection['target-field-name']] = selection;
            });
        });
    });
}