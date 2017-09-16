import KeyValAdapter from './key-val-adapter';
import SQLite from 'react-native-sqlite-storage';

const TYPES = {
    STRING: 0,
    NUMBER: 1,
    BOOLEAN: 2,
    NULL: 3
};

function coerce(val, type) {
    if (type === undefined) {
        switch(typeof val) {
            case "string":
                return TYPES.STRING;
                break;
            case "number":
                return TYPES.NUMBER;
                break;
            case "boolean":
                return TYPES.BOOLEAN;
                break;
            default:
                return TYPES.NULL;
        }
    } else {
        switch(parseInt(type)) {
            case TYPES.NUMBER:
                return parseFloat(val);
                break;
            case TYPES.BOOLEAN:
                return val === "true";
                break;
            case TYPES.NULL:
                return null
                break;
            default:
                return val;
        }
    }
}

const processRow = row => {
    if (row.rel === "undefined") {
        delete row.rel;
        if (row.val === "undefined" || row.rel === "null") {
            row.val = null;
        } else {
            row.val = coerce(row.val, row.type);
        }
    } else {
        delete row.val;
    }
    return row;
}

module.exports = new KeyValAdapter({
    opt: function(ctx, opt, once) {
        if (once) { 
            return;
        }

        const sqlOpt = opt.sqlite || {};
        this.db = SQLite.openDatabase({
                name: sqlOpt.database_name || "GunDB.db",
                location: sqlOpt.database_location || "default",
                version: sqlOpt.database_version || "1.0",
                displayName: sqlOpt.database_displayname || "GunDB SQLite",
                size: sqlOpt.database_size || 20000,
            },
            sqlOpt.onOpen || (() => {}),
            sqlOpt.onError || (() => {})
        );
        this.tableName = sqlOpt.table || "GunTable";

        this.db.transaction(tx => {
            tx.executeSql(`CREATE TABLE IF NOT EXISTS ${this.tableName} (keyField, key, field, val, rel, state, type)`, [], 
            (tx, rs) => console.log("Table created."), 
            (tx, error) => sqlOpt.onError(error));
        });
    },
    get: function(key, field, done) {
        if (field) {
            this.db.transaction(tx => {
                const keyField = `${key}_${field}`;
                tx.executeSql(
                    `SELECT * FROM ${this.tableName} WHERE keyField = ?`, [keyField],
                    (tx, results) => done(null, results.rows.raw().map(processRow)),
                    (tx, err) => done(err)
                );
            });
        } else {
            this.db.transaction(tx => {
                tx.executeSql(
                    `SELECT * FROM ${this.tableName} WHERE key = ?`, [key],
                    (tx, results) => done(null, results.rows.raw().map(processRow)),
                    (tx, err) => done(err)
                );
            });
        }
    },
    put: function(batch, done) {
        const inserts = batch.map(node => {
            const keyField = `${node.key}_${node.field}`;
            return {
                sql: `INSERT OR REPLACE INTO ${this.tableName} (keyField, key, field, val, rel, state, type) VALUES (?,?,?, COALESCE(?, ""),COALESCE(?, ""),?,?)`,
                vars: [keyField, node.key, node.field, node.val + "", node.rel + "", node.state, coerce(node.val), keyField]
            };
        });
        this.db.transaction(
            tx => inserts.forEach(row => tx.executeSql(row.sql, row.vars)),
            err => done(this.errors.internal),
            () => done(null)
        );
    }
});