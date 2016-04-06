var data_post = {};

$(document).ready(function () {
    renderModelSelectorBox();
});

function onLoadingBox(box_middle_name) {
    var content = `
    <div class="overlay">
        <i class="fa fa-refresh fa-spin"></i>
    </div>
    `;
    $(`#digging-${box_middle_name}-box`).append(content);
}

function onBoxReady(box_middle_name) {
    $(`#digging-${box_middle_name}-box .overlay`).remove();
}

function box_alert(box_middle_name, type, title, text) {
    var content = `
    <div class="alert alert-${type} alert-dismissable">
        <button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
        <h4><i class="icon fa fa-ban"></i> ${title}</h4>
        ${text}
    </div>
    `;
    $(`#digging-${box_middle_name}-box .box-body`).prepend(content);
}

function renderModelSelectorBox() {
    onLoadingBox('model');
    var get_model_list = $('#digging-model-box').attr('source');
    $.get(get_model_list, function(model_list, status) {
        if (status == 'success') {
            onModelListLoadReady(model_list);
        } else {
            box_alert("model", "danger", "错误", "算法与模型列表读取错误");
        }
        onBoxReady('model');
    });
}

function onModelListLoadReady(model_list) {
    $("#model-selector").treeview({
        data: model_list,
        onNodeSelected: function (event, node) {
            if (node.nodes == undefined || node.catalog != "catalog") {
                data_post.model_selected = node.name;
                if (node.description != undefined) {
                    $("#model-description").html(node.description);
                }
            }
        },
        onNodeUnselected: function (event, node) {
            data_post.model_selected = undefined;
            $("#model-description").html('');
        }
    }).disableSelection();

    $("#btn-model-next").click(function() {
        if (data_post.model_selected == null ||
            data_post.model_selected == undefined ||
            data_post.model_selected == "") {
            box_alert("model", "danger", "错误", "必须选择一个模型");
        } else {
            $("#digging-model-box .box-body").collapse('hide');
            $("#digging-model-box .box-footer").collapse('hide');
            renderFieldsSelectorBox();
            $("#digging-fields-box .box-body").collapse('show');
            $("#digging-fields-box .box-footer").collapse('show');
        }
    });
}

function onDrop(event, ui) {
    if (ui.draggable.hasClass('in-selector')) {
        var dragged_field_type = ui.draggable.attr('field-type');
        var target_field_type = $(this).attr('target-field-type');

        if (dragged_field_type != target_field_type) {
            box_alert("fields", "danger", "错误", "类型不符合");
        } else {
            var text = $(this).attr('target-field-text') + " : " +
                "<span class=\"label label-primary\">" +
                ui.draggable.attr('field-name') +
                "</span><span class=\"pull-right\">来源: " +
                "<span class=\"label label-info\">" +
                ui.draggable.attr('from-database-text') + " - " +
                ui.draggable.attr('from-table-text') +
                "</span></span>";
            $(`<li class="list-group-item"
                            from-database="${ui.draggable.attr('from-database')}"
                            from-table="${ui.draggable.attr('from-table')}"
                            field-name="${ui.draggable.attr('field-name')}"
                            field-type="${dragged_field_type}"
                            target-field-type="${$(this).attr('target-field-type')}"
                            target-field-name="${$(this).attr('target-field-name')}"
                            target-field-text="${$(this).attr('target-field-text')}"
                        ></li>`)
                .html(text)
                .insertBefore($(this));
            $(this).prev().droppable({
                drop: onDrop
            });
            $(this).remove();
        }
    }
}

function renderFieldsSelectorBox() {
    onLoadingBox('fields');
    var get_model = `/helper/u/${data_post.model_selected}`;
    var get_datasets = $("#digging-fields-box").attr('source');
    $.get(get_model, function(model, status) {
        if (status == 'success') {
            $.get(get_datasets, function(datasets, status) {
                if (status == 'success') {
                    onFieldsLoadReady(model, datasets);
                } else {
                    box_alert("fields", "danger", "错误", "数据集列表读取错误");
                }
                onBoxReady('fields');
            });
        } else {
            box_alert("fields", "danger", "错误", "模型信息读取错误");
        }
    });
}

function onFieldsLoadReady(model, datasets) {
    $("#dataset-selector").html('');
    $("#fields-selector").html('');
    $("#fields-result").html('');

    $("#dataset-selector").treeview({
        data: datasets,
        onNodeSelected: function(event, node) {
            $("#fields-selector").html('');
            var parent = $("#dataset-selector").treeview('getParent', node);
            for (var item in node.data) {
                $("#fields-selector").append(
                    `<li class="list-group-item in-selector"
                     from-database-text="${parent.text}" from-table-text="${node.text}"
                     from-database="${parent.name}" from-table="${node.name}"
                     field-name="${item}" field-type="${node.data[item]}">
                     ${item}<div class="label label-primary pull-right">${node.data[item]}</div></li>`
                );
            }

            $("#fields-selector li").css('z-index', '100');

            $("#fields-selector li").draggable({
                cursor: "crosshair",
                cursorAt: { left: 5 },
                revert: true,
                helper: "clone",
                connectWith: "#fields-result"
            }).disableSelection();
        }
    }).disableSelection();

    for (var item of model.fields) {
        $("#fields-result").append(
            `<li class="list-group-item list-group-item-warning placeholder"
            target-field-name="${item.name}" target-field-type="${item.type}" target-field-text="${item.text}">
            字段名: <span class="label label-danger">${item.text}</span>
            <span class="pull-right">
            字段类型: <span class="label label-warning">${item.type}</span>
            </span></li>`
        );
    }

    $("#fields-result").disableSelection();

    $("#fields-result li").droppable({
        drop: onDrop
    });

    $("#btn-fields-prev").click(function() {
        $("#dataset-selector").html('');
        $("#fields-selector").html('');
        $("#fields-result").html('');

        $("#digging-fields-box .box-body").collapse('hide');
        $("#digging-fields-box .box-footer").collapse('hide');

        $("#digging-model-box .box-body").collapse('show');
        $("#digging-model-box .box-footer").collapse('show');
    });

    $("#btn-fields-next").click(function() {
        var checked = true;
        data_post.fields_selected = {};
        $("#fields-result li").each(function () {
            var selection = {
                "target-field-name": $(this).attr('target-field-name'),
                "field-name": $(this).attr('field-name'),
                "field-type": $(this).attr('field-type'),
                "from-database": $(this).attr('from-database'),
                "from-table": $(this).attr('from-table')
            };
            if (selection["field-name"] == undefined ||
                selection["field-name"] == null ||
                selection["field-name"] == "") {
                checked = false;
            } else {
                data_post.fields_selected[selection['target-field-name']] = selection;
            }
        });
        if (checked) {
            $("#digging-fields-box .box-body").collapse('hide');
            $("#digging-fields-box .box-footer").collapse('hide');

            renderArgumentsBox(model);

            $("#digging-arguments-box .box-body").collapse('show');
            $("#digging-arguments-box .box-footer").collapse('show');
        } else {
            data_post.fields_selected = undefined;
            box_alert("fields", "danger", "错误", "必填字段不得留空");
        }
    });
}

function renderArgumentsBox(model) {
    $("#model-result").html('');
    $(".arguments-form").html('');

    for (var item_name in model.outputs) {
        var item = model.outputs[item_name];
        $("#model-result").append(
            `<li class="list-group-item list-group-item-info placeholder">
            输出字段: <span class="label label-success">${item.text}</span>
            <span class="pull-right">
            字段类型: <span class="label label-info">${item.type}</span>
            </span></li>`
        );
    }

    var which_col = 0;

    for (var arg of model.arguments) {
        //var arg_name = arg.name;
        //var arg = model.arguments[arg_name];
        var form_group = `
        <div class="form-group" id="${arg.name}-group">
            <label for="${arg.name}">${arg.text}</label>
        </div>
        `;
        $("#arguments-form").children('div').slice(which_col, which_col+1).append(form_group);

        if (arg["input-type"] == "slider") {
            var content = `<input type="text" id="${arg["input-type"]}-${arg.name}" name="${arg.name}" value="" />`;
            $(`#${arg.name}-group`).append(content);

            $(`#${arg["input-type"]}-${arg.name}`).ionRangeSlider({
                min: arg.range.min,
                max: arg.range.max,
                step: arg.range.step
            });
        }

        which_col = which_col ^ 1;
    }

    $("#btn-arguments-prev").click(function() {
        $("#digging-arguments-box .box-body").collapse('hide');
        $("#digging-arguments-box .box-footer").collapse('hide');

        data_post.arguments = undefined;

        $("#digging-fields-box .box-body").collapse('show');
        $("#digging-fields-box .box-footer").collapse('show');
    });

    $("#btn-arguments-submit").click(function() {
        data_post.arguments = {};
        for (var arg of model.arguments) {
            var arg_name = arg.name;
            //var arg = model.arguments[arg_name];
            var value = $(`#${arg["input-type"]}-${arg.name}`).val();

            data_post.arguments[arg_name] = value;
        }
        data_post["model_type"] = "digging";

        $.ajax({
            type: "POST",
            url: $("#digging-content").attr('post'),
            data: data_post,
            dataType: "json",
            success: function(data, status) {
                window.location.href = $("#digging-content").attr('after-post') + data["run-id"] + '/';
            }
        });
    });
}
