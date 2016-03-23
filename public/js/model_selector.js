/**
 * Created by Administrator on 2016/3/22.
 */
var data_post;

function renderModelSelectorBox(prev_box, next_box) {
    $('.model-selector').each(function() {
        var get_model_list = $(this).attr('source');
        $.get(get_model_list, function(model_list, status) {
            if (status == 'success') {
                onModelListLoadReady(model_list, prev_box, next_box);
            } else {
                //TODO Show error in info box.
            }
        });
    });
}

function onModelListLoadReady(model_list, prev_box, next_box) {
    $('.model-selector').each(function() {
        var this_id = $(this).attr('id');
        var node_selected = null;

        $(`#${this_id}-model-selector`).treeview({
            data: model_list,
            onNodeSelected: function (event, node) {
                node_selected = node;
            }
        }).disableSelection();

        //$(`#${this_id}-box .box-footer`).collapse();
        //$(`#${this_id}-box .box-body`).collapse();

        $(`#${this_id}-submit`).click(function() {
            if (data_post == null || data_post == undefined) {
                data_post = {};
            }
            data_post.model_selected = node_selected.name;

            $(`#${this_id}-box .box-footer`).collapse('hide');
            $(`#${this_id}-box .box-body`).collapse('hide');

            if (next_box == null || next_box == undefined) {
                //TODO something must be done to remove this digging-content, but I'm so lazy to do this.
                var post_url = $('#digging-content').attr('post');
                $.post(post_url, data_post, function(data, status) {
                    $('#digging-content').html(data);
                });
            } else {
                next_box.find(".box-footer").each(function () {
                    $(this).collapse('show');
                });
                next_box.find(".box-body").each(function () {
                    $(this).collapse('show');
                });
            }
        });

        if (prev_box == null || prev_box == undefined) {
            $(`#${this_id}-cancel`).remove();
        } else {
            $(`#${this_id}-cancel`).click(function () {
                $(`#${this_id}-box .box-footer`).collapse('hide');
                $(`#${this_id}-box .box-body`).collapse('hide');

                prev_box.find(".box-footer").each(function () {
                    $(this).collapse('show');
                });
                prev_box.find(".box-body").each(function () {
                    $(this).collapse('show');
                });
            });
        }
    });
}