/**
 * Created by Administrator on 2016/3/15.
 */
function refresh_a_table(table_element) {
    var req_url = table_element.attr('source');
    $.get(req_url, function(table, status) {
        if (status == 'success') {
            table_element.children('thead').html('');
            table_element.children('thead').append('<tr></tr>');
            table_element.children('tbody').text('');
            for (var data_head in table.schema) {
                table_element.children('thead').children('tr').append(`<th>${table.schema[data_head].title}</th>`);
            }
            for (var record of table.data) {
                var row_content = '<tr>\n';
                for (var cell of record) {
                    row_content += `    <td>${cell}</td>`;
                }
                row_content += '</tr>\n';
                table_element.children('tbody').append(row_content);
            }
            table_element.DataTable();
        } else {
            // TODO Add info-box different style.
            $('#info-box').text('data');
        }
    });
}

function refresh_json_table(table_id) {
    if (table_id == null) {
        $('.table-ajax').each(function () {
            refresh_a_table($(this));
        });
    } else {
        refresh_a_table($(`#${table_id}`));
    }
}

$(document).ready(function() {
    refresh_json_table(null);
    $('.btn-refresh').each(function () {
        $(this).click(function() {
            var table_id = $(this).attr('for');
            refresh_json_table(table_id);
        })
    });
    //$('#example1').DataTable();
});