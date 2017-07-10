function DateTools() {

}

DateTools.prototype.isToday = function(td) {
    var d = new Date();

    return td.getDate() == d.getDate() &&
           td.getMonth() == d.getMonth() &&
           td.getFullYear() == d.getFullYear();
};

DateTools.prototype.getLowerUpperBoundDate = function(date) {
    var lowerBoundDate = new Date(date);
    lowerBoundDate.setHours(0, 0, 0, 0);

    var upperBoundDate = new Date(date);
    upperBoundDate.setHours(23, 59, 59, 999);

    return {
        lower: lowerBoundDate,
        upper: upperBoundDate
    };
};

DateTools.prototype.fromDateYMD = function(ymd) {
    return new Date(ymd.year, ymd.month - 1, ymd.day);
};

DateTools.prototype.toDateYMD = function(date) {
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
    };
};

module.exports = (new DateTools());
