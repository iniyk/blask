/**
 * Created by iniyk on 16/5/1.
 */

var g_node_selected = null;

$(document).ready(function() {
    setupDatasetTreeView();
});

function onLoadingBox(box_id) {
    var content = `
    <div class="overlay">
        <i class="fa fa-refresh fa-spin"></i>
    </div>
    `;
    $(`#${box_id}`).append(content);
}

function onBoxReady(box_id) {
    $(`#${box_id} .overlay`).remove();
}

function box_alert(box_id, type, title, text) {
    var content = `
    <div class="alert alert-${type} alert-dismissable">
        <button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
        <h4><i class="icon fa fa-ban"></i> ${title}</h4>
        ${text}
    </div>
    `;
    $(`#${box_id} .box-body`).prepend(content);
}

function setupDatasetTreeView() {
    onLoadingBox('data-selector-box');
    var get_datasets = $("#data-selector").attr('source');
    $.get(get_datasets, function(datasets, status) {
        if (status == 'success') {
            setupDatasetTreeViewData(datasets);
        } else {
            box_alert("data-selector-box", "danger", "错误", "数据集列表读取错误");
        }
        onBoxReady('data-selector-box');
    });
}

function setupDatasetTreeViewData(datasets) {
    $("#data-selector").treeview({
        data: datasets,
        onNodeSelected: dataNodeSelected
    }).disableSelection();
}

function dataNodeSelected(event, node) {
    renderTable(node);
}

function setupDisplayChange(node) {
    $('.btn-display-selector').each(function() {
        $(this).click(function() {
            var display_type = $(this).attr('for');
            if (display_type === 'table') {
                renderTable(node);
            } else if (display_type === 'line') {
                renderLine(node);
            } else if (display_type === 'bar') {
                renderBar(node);
            } else if (display_type === 'pie') {
                renderPie(node);
            }
        });
    });
}

function renderTable(node) {
    $("#charts-col").html('');
    var content = `
        <div class="box box-primary" id="data-display-box">
            <div class="box-header">
                <h3 class="box-title">${node.text}</h3>
            </div>
            <div class="box-body">
                <div class="btn-group">
                    <a class="btn btn-default active btn-display-selector" for="table">表格</a>
                    <a class="btn btn-default btn-display-selector" for="line">折线图</a>
                    <a class="btn btn-default btn-display-selector" for="bar">柱形图</a>
                    <a class="btn btn-default btn-display-selector" for="pie">饼状图</a>
                </div>
                <div id="charts-container">
                    <table id="charts-table" class="table table-striped table-bordered display" width="100%"></table>
                </div>
            </div>
        </div>
    `;
    $("#charts-col").html(content);
    onLoadingBox('data-display-box');
    var data_request = `/mongodb/datasets/${node.name.toLowerCase()}`;
    $.get(data_request, function(dataset, status) {
        if (status === "success") {
            var columns = [];
            for (var col in dataset[0]) {
                if (col !== '_id' && col !== "__v") {
                    columns.push({"title": col});
                }
            }
            var data = [];
            for (var record of dataset) {
                var row = [];
                for (var col of columns) {
                    row.push(record[col.title]);
                }
                data.push(row);
            }
            $('#charts-table').DataTable({
                data: data,
                columns: columns
            });
            setupDisplayChange(node);
            onBoxReady('data-display-box');
        } else {
            box_alert("data-display-box", "danger", "错误", "数据集读取错误");
        }
    });
}

function renderLine(node) {
    $("#charts-col").html('');
    var content = `
        <div class="box box-primary" id="data-display-box">
            <div class="box-header">
                <h3 class="box-title">${node.text}</h3>
            </div>
            <div class="box-body">
                <div class="btn-group">
                    <a class="btn btn-default btn-display-selector" for="table">表格</a>
                    <a class="btn btn-default active btn-display-selector" for="line">折线图</a>
                    <a class="btn btn-default btn-display-selector" for="bar">柱形图</a>
                    <a class="btn btn-default btn-display-selector" for="pie">饼状图</a>
                </div>
                <div id="charts-container">
                    <canvas id="chart-canvas"></canvas>
                </div>
            </div>
        </div>
    `;
    $("#charts-col").html(content);

    var ctx = $('#chart-canvas');
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["January", "February", "March", "April", "May", "June", "July"],
            datasets: [
                {
                    label: "销售额",
                    fill: false,
                    lineTension: 0.1,
                    backgroundColor: "rgba(75,192,192,0.4)",
                    borderColor: "rgba(75,192,192,1)",
                    borderCapStyle: 'butt',
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: 'miter',
                    pointBorderColor: "rgba(75,192,192,1)",
                    pointBackgroundColor: "#fff",
                    pointBorderWidth: 1,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: "rgba(75,192,192,1)",
                    pointHoverBorderColor: "rgba(220,220,220,1)",
                    pointHoverBorderWidth: 2,
                    pointRadius: 1,
                    pointHitRadius: 10,
                    data: [65, 59, 80, 81, 56, 55, 40]
                }
            ]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });

    setupDisplayChange(node);
}

function renderBar(node) {
    $("#charts-col").html('');
    var content = `
        <div class="box box-primary" id="data-display-box">
            <div class="box-header">
                <h3 class="box-title">${node.text}</h3>
            </div>
            <div class="box-body">
                <div class="btn-group">
                    <a class="btn btn-default btn-display-selector" for="table">表格</a>
                    <a class="btn btn-default btn-display-selector" for="line">折线图</a>
                    <a class="btn btn-default btn-display-selector" for="bar">柱形图</a>
                    <a class="btn btn-default active btn-display-selector" for="pie">饼状图</a>
                </div>
                <div id="charts-container">
                    <canvas id="chart-canvas"></canvas>
                </div>
            </div>
        </div>
    `;
    $("#charts-col").html(content);

    var ctx = $('#chart-canvas');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Iris-setosa", "Iris-versicolor", "Iris-virginica"],
            datasets: [
                {
                    label: "My First dataset",
                    backgroundColor: "rgba(255,99,132,0.2)",
                    borderColor: "rgba(255,99,132,1)",
                    borderWidth: 1,
                    hoverBackgroundColor: "rgba(255,99,132,0.4)",
                    hoverBorderColor: "rgba(255,99,132,1)",
                    data: [59, 56, 55]
                }
            ]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });

    setupDisplayChange(node);
}

function renderPie(node) {
    $("#charts-col").html('');
    var content = `
        <div class="box box-primary" id="data-display-box">
            <div class="box-header">
                <h3 class="box-title">${node.text}</h3>
            </div>
            <div class="box-body">
                <div class="btn-group">
                    <a class="btn btn-default btn-display-selector" for="table">表格</a>
                    <a class="btn btn-default btn-display-selector" for="line">折线图</a>
                    <a class="btn btn-default btn-display-selector" for="bar">柱形图</a>
                    <a class="btn btn-default active btn-display-selector" for="pie">饼状图</a>
                </div>
                <div id="charts-container">
                    <canvas id="chart-canvas"></canvas>
                </div>
            </div>
        </div>
    `;
    $("#charts-col").html(content);

    var ctx = $('#chart-canvas');
    var myChart = new Chart(ctx, {
        type: 'polarArea',
        data: {
            datasets: [{
                data: [
                    11,
                    16,
                    7,
                    3,
                    14
                ],
                backgroundColor: [
                    "#FF6384",
                    "#4BC0C0",
                    "#FFCE56",
                    "#E7E9ED",
                    "#36A2EB"
                ],
                label: 'My dataset' // for legend
            }],
            labels: [
                "Red",
                "Green",
                "Yellow",
                "Grey",
                "Blue"
            ]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });

    setupDisplayChange(node);
}