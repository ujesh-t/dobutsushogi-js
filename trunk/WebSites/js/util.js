
// ----------------------------------------------------------------------------------------------
// Debug output
// ----------------------------------------------------------------------------------------------
// For IE6,7
if (!('console' in window)) {
    window.console = {};
    window.console.log = function (str) {
        return str;
    };
}

function p() {
    /// <summary>
    /// デバッグ用出力
    /// </summary>
    for (var i = 0; i < arguments.length; i++) {
        console.log(arguments[i]);
    }
}
function pp() {
    /// <summary>
    /// デバッグ用出力 (画面にも出す)
    /// </summary>
    for (var i = 0; i < arguments.length; i++) {
        var a = arguments[i];
        var date = new Date();
        var unixTime = date.getTime();
        var str = (typeof a === "undefined") ? "undefined" : (a == null) ? "null" : a.toString();
        var opt = $("<option></option>").attr({ value: unixTime })
                .text($.format("{0}", str));
        $("#debug-logs").prepend(opt);
        $("#debug-logs").val(unixTime);
        console.log(a);
    }
}


// ----------------------------------------------------------------------------------------------
// jQuery Exztensions
// ----------------------------------------------------------------------------------------------
$.extend({
    format: function (fmt) {
        for (var i = 1; i < arguments.length; i++) {
            var reg = new RegExp("\\{" + (i - 1) + "\\}", "g");
            fmt = fmt.replace(reg, arguments[i]);
        }
        return fmt;
    },
    // pre-loads specified image paths
    preLoadImages: function () {
        for (var i = arguments.length; i--; ) {
            $('img').attr("src", arguments[i]);
        }
    }
});


// ----------------------------------------------------------------------------------------------
// Array utilities
// ----------------------------------------------------------------------------------------------
// 配列探索（自作オブジェクトでequalsを実装しているもののみ）
Array.prototype.myIndexOf = function (obj) {
    if (this.length == 0)
        return -1;
    if (obj == null)
        return -1;
    for (var i = 0; i < this.length; i++) {
        if (this[i].equals(obj))
            return i;
    }
    return -1;
};
Array.prototype.getRandomItem = function () {
    return this[~ ~(Math.random() * this.length)];
};
Array.prototype.removeAt = function (index) {
    Array.prototype.splice.apply(this, [i, 1]);
    return this;
};
Array.prototype.remove = function (value) {
    for (var i = this.length - 1; i >= 0; i--) {
        if (this[i] === value) {
            this.splice(i, 1);
        }
    }
    return this;
};
Array.prototype.removeOne = function (value) {
    for (var i = this.length - 1; i >= 0; i--) {
        if (this[i] === value) {
            this.splice(i, 1);
            break;
        }
    }
    return this;
};
Array.prototype.clone = function () {
    return Array.apply(null, this);
}
