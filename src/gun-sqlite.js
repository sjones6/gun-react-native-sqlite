import KeyValAdapter from './key-val-adapter';
import SQLite from 'react-native-sqlite-storage';
import coerce from './coerce';
import processRow from './process-row';

const adapter = new KeyValAdapter({

    /**
     * @param {Gun}          ctx   The gun instance serving the Gun db
     * @param {object|null}  opt   Options passed when instantiating Gun, if any
     * @param {boolean}      once  When called via `gun.opt`, `once` is true; during construction, it is false
     */
    opt: function(ctx, opt, once) {
        if (once) { 
            return;
        }

        // Acquire DB connection
        const sqlOpt = opt.sqlite || {};
        sqlOpt.onReady = opt.onReady || (() => {});
        this.db = SQLite.openDatabase({
                name: sqlOpt.database_name || "GunDB.db",
                location: sqlOpt.database_location || "default"
            },
            sqlOpt.onOpen || (() => {}),
            sqlOpt.onError || (() => {})
        );
        this.tableName = sqlOpt.table || "GunTable";

        // Prepare the DB for writes with table and indexes
        this.db.transaction(
            tx => {
                tx.executeSql(`CREATE TABLE IF NOT EXISTS ${this.tableName} (keyField PRIMARY KEY, key, field, val, rel, state, type)`, []);
                tx.executeSql(`CREATE INDEX IF NOT EXISTS ${this.tableName}_index ON ${this.tableName} (keyField, key)`, [])
            },
            err => sqlOpt.onError(err),
            () => sqlOpt.onReady.call(null)
        );
    },

    /**
     * Retrieve Nodes from SQLiteStorage
     * 
     * @param {string}   key        The node key to lookup
     * @param {string}   [field]    The field to lookup, if given
     * @param {function} done       Callback for when lookup finishes
     */
    get: function(key, field, done) {

        // Retrieve field only
        if (field) {
            this.db.transaction(tx => {
                const keyField = `${key}_${field}`;
                tx.executeSql(
                    `SELECT * FROM ${this.tableName} WHERE keyField = ?`, [keyField],
                    (tx, results) => done(null, results.rows.raw().map(processRow)),
                    (tx, err) => done(err)
                );
            });

        // Retrieve entire node
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

    /**
     * Write nodes to storage
     * 
     * @param {Array.object}  batch    The batch writes of key:value pairs
     * @param {function}      done     Called after write is complete
     */
    put: function(batch, done) {

        // Produce an array of upsert queries
        const inserts = batch.map(node => {
            const keyField = `${node.key}_${node.field}`;
            return {
                sql: `INSERT OR REPLACE INTO ${this.tableName} (keyField, key, field, val, rel, state, type) VALUES (?,?,?, COALESCE(?, ""),COALESCE(?, ""),COALESCE(?, 0),COALESCE(?, 3))`,
                vars: [keyField, node.key, node.field, node.val + "", node.rel + "", node.state, coerce(node.val), keyField]
            };
        });

        // Run transations
        this.db.transaction(
            tx => inserts.forEach(row => tx.executeSql(row.sql, row.vars)),
            err => done(this.errors.internal),
            () => done(null)
        );
    }
});

/**
 * Clean out old graph data from the DB given a timestamp
 * 
 * @todo Implement a smarter, configurable LRU algorithm.
 * 
 * @param {integer}  number   The timestamp to delete before which to delete all data
 * @param {function} cb       A function to call after success/error  
 */
adapter.clean = function(timestamp, cb) {
    if (!timestamp) {
        return;
    }

    const ctx = this.outerContext;
    ctx.db.transaction(
        tx => tx.executeSql(`DELETE FROM ${ctx.tableName} WHERE state < ?`, [timestamp]),
        cb,
        cb
    );
}


module.exports = adapter;