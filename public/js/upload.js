/**
 * Created by iniyk on 16/4/8.
 */
$(document).ready(function () {
   $('#file-submit').click(onFileSubmit);
});

function onFileSubmit() {
    var type = "no-type";
    $(".panel-nav").each(function () {
        if ($(this).hasClass('active')) {
            type = $(this).attr('target');
        }
    });
    var request = `/data/upload/${type}`;
    var data = new FormData();
    data.append('name', $(`#${type}-name`).val());
    data.append('text', $(`#${type}-text`).val());
    data.append('datafile', document.getElementById(`${type}-datafile`).files[0]);
    if (type == 'csv') {
        data.append('separator', $(`#${type}-separator`).val());
    }
    $.ajax({
        url: request,
        type: "POST",
        data: data,
        processData: false,
        contentType: false
    }).done(function (res) {
            $('#main-content').prepend(`
            <div class="row">
                <div class="col-lg-12">
                    <div class="alert alert-${res.status === 'success' ? 'success' : 'danger'} alert-dismissable">
                        <button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
                        <h4><i class="icon fa fa-${res.status === 'success' ? 'check' : 'ban'}"></i> 完成</h4>
                        ${res.info}
                    </div>
                </div>
            </div>
        `);
    });
}