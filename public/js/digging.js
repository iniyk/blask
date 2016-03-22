var data_post = {};

$(document).ready(function () {
    var box_list = [];
    $(".model-selector").each(function() {
        var this_id = $(this).attr('id');
        box_list.push($(`#${this_id}-box`));
    });
    $(".order-selector").each(function() {
        var this_id = $(this).attr('id');
        box_list.push($(`#${this_id}-box`));
    });

    //renderModelSelectorBox(null, box_list[1]);
    //renderOrderSelectorBox(box_list[0], null);
});