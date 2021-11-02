"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@sqltools/types");
const factory_1 = __importDefault(require("@sqltools/base-driver/dist/lib/factory"));
const describeTable = factory_1.default `
SELECT *
FROM
${p => p.isView ? 'VIEW_COLUMNS' : 'TABLE_COLUMNS'} C
WHERE
  C.SCHEMA_NAME = '${p => p.schema}' and C.${p => p.isView ? 'VIEW_NAME' : 'TABLE_NAME'} = '${p => p.label}'`;
const fetchColumns = factory_1.default `
SELECT
  C.COLUMN_NAME AS "label",
  C.CS_DATA_TYPE_NAME AS "dataType",
  C.DEFAULT_VALUE as "defaultValue",
  C.IS_NULLABLE as "isNullable",
  'column' as "iconName",
  'NO_CHILD' as "childType"
FROM
  ${p => p.isView ? 'VIEW_COLUMNS' : 'TABLE_COLUMNS'} C
WHERE
  C.SCHEMA_NAME = '${p => p.schema}' AND
  C.${p => p.isView ? 'VIEW_NAME' : 'TABLE_NAME'} = '${p => p.label}'
ORDER BY C.COLUMN_NAME ASC
`;
const fetchRecords = factory_1.default `
SELECT *
FROM ${p => (p.table.label || p.table)}
LIMIT ${p => p.limit || 50}
OFFSET ${p => p.offset || 0}
`;
const countRecords = factory_1.default `
SELECT COUNT(*) AS "total"
FROM ${p => (p.table.label || p.table)}
`;
const fetchTablesAndViews = (type) => {
    switch (type) {
        case types_1.ContextValue.TABLE:
            return factory_1.default `
        SELECT
          A.TABLE_NAME AS "label",
          '${type}' as "type",
          '${p => p.schema}' as "schema",
          'table' as "iconName",
          0 as "isView"
        FROM
          TABLE_COLUMNS A
        WHERE 
          A.SCHEMA_NAME = '${p => p.schema}'
        GROUP BY 
          A.TABLE_NAME 
`;
        case types_1.ContextValue.VIEW:
            return factory_1.default `
      SELECT
        B.VIEW_NAME AS "label",
        '${type}' as "type",
        '${p => p.schema}' as "schema",
        1 as "isView",
        'view' as "iconName"
      FROM
        VIEW_COLUMNS B
      WHERE 
        B.SCHEMA_NAME = '${p => p.schema}'
      GROUP BY 
        B.VIEW_NAME  
`;
    }
};
const fetchTables = fetchTablesAndViews(types_1.ContextValue.TABLE);
const fetchViews = fetchTablesAndViews(types_1.ContextValue.VIEW);
const searchTables = factory_1.default `
SELECT name AS label,
  type
FROM sqlite_master
${p => p.search ? `WHERE LOWER(name) LIKE '%${p.search.toLowerCase()}%'` : ''}
ORDER BY name
`;
const searchColumns = factory_1.default `
SELECT C.name AS label,
  T.name AS "table",
  C.type AS dataType,
  C."notnull" AS isNullable,
  C.pk AS isPk,
  '${types_1.ContextValue.COLUMN}' as type
FROM sqlite_master AS T
LEFT OUTER JOIN pragma_table_info((T.name)) AS C ON 1 = 1
WHERE 1 = 1
${p => p.tables.filter(t => !!t.label).length
    ? `AND LOWER(T.name) IN (${p.tables.filter(t => !!t.label).map(t => `'${t.label}'`.toLowerCase()).join(', ')})`
    : ''}
${p => p.search
    ? `AND (
    LOWER(T.name || '.' || C.name) LIKE '%${p.search.toLowerCase()}%'
    OR LOWER(C.name) LIKE '%${p.search.toLowerCase()}%'
  )`
    : ''}
ORDER BY C.name ASC,
  C.cid ASC
LIMIT ${p => p.limit || 100}
`;
exports.default = {
    describeTable,
    countRecords,
    fetchColumns,
    fetchRecords,
    fetchTables,
    fetchViews,
    searchTables,
    searchColumns
};
