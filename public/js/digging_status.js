/**
 * Created by iniyk on 16/3/29.
 */
var debug_running;

$(document).ready(function () {
    getData(function(running, helper) {
        showInWebSite(running, helper);
    });
});

function getData(callback) {
    var running_data_req = $('#status-content').attr('source');
    $.get(running_data_req, function(data, status) {
        var running = data.running, helper = data.helper;
        callback(running, helper);
    });
}

function showInWebSite(running, helper) {
    debug_running = running;
    $('#helper-text').text(helper['text']);
    $('#type').text(running['type']);
    //$('#exec').text(running['exec']);
    $('#user').text(running['user']);
    $('#type').text(running['type']);
    $('#id').text(running['_id']);

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
}