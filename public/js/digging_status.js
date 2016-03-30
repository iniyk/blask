/**
 * Created by iniyk on 16/3/29.
 */
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
        `
        $('#arguments-content').append(content);
    }
}