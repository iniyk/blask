/**
 * Created by iniyk on 16/3/29.
 */
function isEmpty(obj) {
    if (obj == undefined) return true;
    if (obj == null) return true;
    if (obj == '') return true;
    for (var prop in obj) {
        return false;
    }
    return true;
}

$(document).ready(function () {
    var role = $('#status-content').attr('role');
    if (role == "content") {
        getData(function (running, helper) {
            showInWebSite(running, helper, function(running, helper) {
                setupDatabaseModel(running, helper);
            });
        });
    } else if (role == "list") {
        getListData(function (runnings) {
            showList(runnings);
        });
    }
});

function getListData(callback) {
    var running_data_req = $('#status-content').attr('source');
    $.get(running_data_req, function(runnings, status) {
        callback(runnings);
    });
}

function showList(runnings) {
    for (var running of runnings) {
        var record = '';
        record += ` <td>
                        <a href="/demo/${$('#status-content').attr('type')}/status/${running['_id']}">${running['_id']}</a>
                    </td>`;
        record += `<td>${running['model']}</td>`;
        //record += `<td>${running['type']}</td>`;
        //record += `<td>${running['user']}</td>`;
        var status = `<td><span class="label label-success">已完成</span></td>`;
        if (isEmpty(running.finish)) {
            status = `<td>
                            <div class="progress progress-xs">
                                <div class="progress-bar progress-bar-primary" style="width: ${Math.random()*100}%">
                                </div>
                            </div>
                          </td>`;
        }
        record += status;
        record += `<td>${running['start']==undefined?new Date().toLocaleString():new Date(running['start']).toLocaleString()}</td>`;
        record += `<td>${running['finish']==undefined?"-":new Date(running['finish']).toLocaleString()}</td>`;
        record = `<tr>${record}</tr>`;
        $('#list-records-content').append(record);
    }
    $('#result-table').DataTable({
        order: [[0, 'desc']]
    });
}

function getData(callback) {
    var running_data_req = $('#status-content').attr('source');
    $.get(running_data_req, function(data, status) {
        var running = data.running, helper = data.helper;
        callback(running, helper);
    });
}

function showInWebSite(running, helper, callback) {
    $('#helper-text').text(helper['text']);
    $('#type').text(running['type']);
    //$('#exec').text(running['exec']);
    //$('#user').text(running['user']);
    $('#type').text(running['type']);
    $('#id').text(running['_id']);
    $('#start').text(running['start']==undefined?new Date().toLocaleString():new Date(running['start']).toLocaleString());
    $('#finish').text(running['finish']==undefined?"-":new Date(running['finish']).toLocaleString());
    var status = `<td><span class="label label-success">已完成</span></td>`;
    if (isEmpty(running['finish'])) {
        status = `<td>
                    <div class="progress progress-xs">
                        <div class="progress-bar progress-bar-primary" style="width: ${Math.random()*100}%">
                        </div>
                    </div>
                  </td>`;
    }
    $('#status').html(status);

    for (var argument of helper['arguments']) {
        var content = `
            <tr>
                <td>${argument.text}</td>
                <td>${running.input[argument.name]}</td>
            </tr>
        `;
        $('#arguments-content').append(content);
    }

    for (var field of helper['outputs']) {
        var th = `
            <th>
                ${field.text}
            </th>
        `;
        $('#output-fields-content').append(th);
    }

    var record_number = 0;
    for (var field_name in running['output']) {
        var field = running['output'][field_name];
        record_number = record_number > field.length ? record_number : field.length;
    }
    for (var index=0; index<record_number; index++) {
        var tr = '';
        for (var field_name in running['output']) {
            var field = running['output'][field_name];
            tr += `
                <td>${field[index]}</td>
            `;
        }
        tr = `<tr>${tr}</tr>`;
        $('#output-records-content').append(tr);
    }
    $('#result-table').DataTable();

    callback(running, helper);
}

function setupDatabaseModel(running, helper) {
    $("#btn-model-database").click(function() {
        $('#model-to-database').modal('show');
        $('#database-tbody').html('');
        for (var field_name in running.output) {
            //var field = running['output'][field_name];
            var tr = `
                <tr>
                    <td>${field_name}</td>
                    <td>
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" checked="true" field="${field_name}" class="checkbox-field">导出
                            </label>
                        </div>
                    </td>
                </tr>
            `;
            $('#database-tbody').append(tr);
        }
        $('#btn-to-database').click(function() {
            var table_name = $('#input-collection').val();
            var table_text = $('#input-text').val();
            var data_selected = [];
            $('.checkbox-field').each(function() {
                if ($(this).is(':checked')) {
                    data_selected.push($(this).attr('field'));
                }
            });
            var req = {
                name: table_name,
                text: table_text,
                data: data_selected,
                run_id: running._id
            };
            $('#model-to-database').modal('hide');
            $.post('/data/export', req, function(res, status) {
                $('#status-content').prepend(`
                    <div class="row">
                        <div class="col-lg-12">
                            <div class="alert alert-success alert-dismissable">
                                <button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
                                <h4><i class="icon fa fa-ban"></i> 完成</h4>
                                导出到数据仓库完成!
                            </div>
                        </div>
                    </div>
                `);
            });
        });
    });
}