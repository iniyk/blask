/**
 * Created by Administrator on 2016/3/14.
 */

function is_empty(obj) {
    if (obj == undefined) return true;
    if (obj == null) return true;
    if (obj == '') return true;
    for (var prop in obj) {
        return false;
    }
    return true;
}
