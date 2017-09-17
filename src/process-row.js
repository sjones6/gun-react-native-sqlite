const coerce = require("./coerce");

/**
 * Given a row, return a value recognized by the GunFlint KeyVal adapter
 * 
 * @param {SQLiteRow} row  
 */
module.exports = function(row) {

    // Treat all relationship's that are null/undefined as though
    // they are plain values.
    if (row.rel === "undefined" || row.rel === "null") {
        delete row.rel;
        if (row.val === "undefined" || row.rel === "null") {
            row.val = null;
        } else {
            row.val = coerce(row.val, row.type);
        }
    
    // This is a relationship; so remove value
    } else {
        delete row.val;
    }

    // finish
    return row;
};
