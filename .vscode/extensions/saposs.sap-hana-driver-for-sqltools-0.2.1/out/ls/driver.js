"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_driver_1 = __importDefault(require("@sqltools/base-driver"));
const queries_1 = __importDefault(require("./queries"));
const require_1 = __importDefault(require("@sqltools/base-driver/dist/lib/require"));
const types_1 = require("@sqltools/types");
class SAPHana extends base_driver_1.default {
    constructor() {
        super(...arguments);
        this.deps = [{
                type: base_driver_1.default.CONSTANTS.DEPENDENCY_PACKAGE,
                name: '@sap/hana-client'
            }];
        this.queries = queries_1.default;
        this.query = async (query, opt = {}) => {
            return this.open().then(conn => {
                return new Promise((resolve) => {
                    const params = this.getParams(opt);
                    if (params.length > 0) {
                        conn.prepare(query.toString(), (err, statement) => {
                            if (err) {
                                return this.resolveErr(resolve, err, query);
                            }
                            statement.exec(params, (err, rows) => {
                                if (err) {
                                    return this.resolveErr(resolve, err, query);
                                }
                                return this.resolveQueryResults(resolve, rows, query);
                            });
                        });
                    }
                    else {
                        conn.exec(query.toString(), (err, rows) => {
                            if (err) {
                                return this.resolveErr(resolve, err, query);
                            }
                            return this.resolveQueryResults(resolve, rows, query);
                        });
                    }
                });
            });
        };
        this.getStaticCompletions = async () => {
            return {};
        };
    }
    get lib() {
        return require_1.default('@sap/hana-client');
    }
    open() {
        if (this.connection) {
            return this.connection;
        }
        let connOptions = {
            HOST: this.credentials.server,
            PORT: this.credentials.port,
            UID: this.credentials.username,
            PWD: this.credentials.password
        };
        if (this.credentials.connectionTimeout && this.credentials.connectionTimeout > 0) {
            connOptions["CONNECTTIMEOUT"] = this.credentials.connectionTimeout * 1000;
        }
        connOptions = Object.assign(Object.assign({}, connOptions), (this.credentials["hanaOptions"] || {}));
        try {
            const conn = this.lib.createConnection(connOptions);
            this.connection = new Promise((resolve, reject) => conn.connect(err => {
                if (err) {
                    this.log.extend('error')("Connection to SAP HANA failed", err.toString());
                    reject(err);
                }
                this.schema = this.credentials.database;
                conn.exec("SET SCHEMA " + this.schema, err => {
                    if (err) {
                        reject(err);
                    }
                    this.log.extend('debug')("Connection to SAP Hana succeeded!");
                    resolve(conn);
                });
            }));
            return this.connection;
        }
        catch (e) {
            this.log.extend('error')("Connection to SAP HANA failed" + e.toString());
            Promise.reject(e);
        }
        return this.connection;
    }
    async close() {
        if (!this.connection)
            return;
        if (!this.connection)
            return;
        await this.connection.then(conn => conn.disconnect());
        this.connection = null;
    }
    getParams(opt) {
        const ret = [];
        Object.keys(opt).forEach(key => {
            if (key !== 'requestId' &&
                key !== 'limit' &&
                key !== 'page' &&
                key !== 'connId' &&
                opt[key]) {
                ret.push(opt[key]);
            }
        });
        return ret;
    }
    resolveQueryResults(resolve, rows, query) {
        const cols = [];
        if (rows && rows.length > 0) {
            for (const colName in rows[0]) {
                cols.push(colName);
            }
        }
        const res = {
            connId: this.getId(),
            results: rows,
            cols: cols,
            query: query,
            messages: []
        };
        return resolve([res]);
    }
    resolveErr(resolve, err, query) {
        const messages = [];
        if (err.message) {
            messages.push(err.message);
            console.log("query error:" + err.message);
        }
        return resolve([{
                connId: this.getId(),
                error: err,
                results: [],
                cols: [],
                query: query,
                messages: messages
            }]);
    }
    async testConnection() {
        await this.open();
        await this.query('SELECT 1 from dummy', {});
    }
    async getChildrenForItem({ item, parent }) {
        switch (item.type) {
            case types_1.ContextValue.CONNECTION:
            case types_1.ContextValue.CONNECTED_CONNECTION:
                return [
                    { schema: this.schema, label: 'Tables', type: types_1.ContextValue.RESOURCE_GROUP, iconId: 'folder', childType: types_1.ContextValue.TABLE },
                    { schema: this.schema, label: 'Views', type: types_1.ContextValue.RESOURCE_GROUP, iconId: 'folder', childType: types_1.ContextValue.VIEW },
                ];
            case types_1.ContextValue.TABLE:
            case types_1.ContextValue.VIEW:
                return this.queryResults(this.queries.fetchColumns(item));
            case types_1.ContextValue.RESOURCE_GROUP:
                return this.getChildrenForGroup({ item, parent });
        }
        return [];
    }
    async getChildrenForGroup({ item }) {
        switch (item.childType) {
            case types_1.ContextValue.TABLE:
                return this.queryResults(this.queries.fetchTables(item));
            case types_1.ContextValue.VIEW:
                return this.queryResults(this.queries.fetchViews(item));
        }
        return [];
    }
    async searchItems(itemType, search, extraParams = {}) {
        switch (itemType) {
            case types_1.ContextValue.TABLE:
                return this.queryResults(this.queries.searchTables({ search }));
            case types_1.ContextValue.COLUMN:
                return this.queryResults(this.queries.searchColumns(Object.assign({ search }, extraParams)));
        }
        return [];
    }
}
exports.default = SAPHana;
