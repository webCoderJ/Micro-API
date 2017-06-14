// 实现与MySQL交互
var mysql = require('mysql')
var conf = require('../conf/db')
var util = require('../util/util')
var sql = require('./userSqlMqpping')

// 使用连接池，提升性能
var pool = mysql.createPool(util.extend({}, conf.mysql))

// 如果数据库中不存在要查询的表，创建该表。
var createUserTable = (connection, ...args) => {
  return new Promise((resolve, reject) => {
    connection.query(sql.createUserTable, (err, result, fields) => {
      if (!err) {
        // 创建表之后继续未完成的查询
        connection.query(...args, (err, res) => {
          let response
          if (err) {
            response = {
              code: 1,
              msg: '操作失败',
              stack: err
            }
          }
          response = {
            code: 0,
            msg: '操作成功',
            data: res
          }
          resolve(response)
        })
      }
    })
  })
}

module.exports = {
  get: (ctx, next) => {
    return new Promise((resolve, reject) => {
      pool.getConnection(function (err, connection) {
        // 返回结果
        let res
        if (err) {
          res = {
            code: 1,
            msg: '操作失败',
            stack: err
          }
        }
        if (ctx.query.id) {
          connection.query(sql.queryById, ctx.query.id, function (err, result) {
            if (err) {
              res = {
                code: 1,
                msg: '操作失败',
                stack: err
              }
            } else {
              res = {
                code: 0,
                msg: '查询成功',
                data: result
              }
            }
            // 释放连接
            connection.release()
            resolve(res)
          })
        } else {
          connection.query(sql.queryAll, function (err, result) {
            if (err) {
              res = {
                code: 1,
                msg: '操作失败',
                stack: err
              }
            } else {
              res = {
                code: 0,
                msg: '查询成功',
                data: result
              }
            }
            // 释放连接
            connection.release()
            resolve(res)
          })
        }
      })
    })
  },
  add: (ctx, next) => {
    return new Promise((resolve, reject) => {
      pool.getConnection(function (err, connection) {
        if (err) {
          resolve({
            code: 1,
            msg: '操作失败',
            stack: err
          })
        }
        let param = ctx.query
        // 建立连接，向表中插入值
        // 'INSERT INTO user(id, name, age) VALUES(0,?,?)'
        connection.query(sql.insert, [param.name, param.age], function (err, result) {
          let res
          if (err) {
            if (err.errno === 1146) {
              createUserTable(connection, sql.insert, [param.name, param.age]).then((res) => {
                resolve(res)
              })
            } else {
              res = {
                code: 1,
                msg: '操作失败',
                stack: err
              }
            }
          } else {
            res = {
              code: 0,
              msg: '增加成功',
              data: {}
            }
          }
          // 释放连接
          connection.release()
          resolve(res)
        })
      })
    })
  },
  delete: (ctx, next) => {
    return new Promise((resolve, reject) => {
      pool.getConnection(function (err, connection) {
        if (err) {
          resolve({
            code: 1,
            msg: '操作失败',
            stack: err
          })
        }
        let id = ctx.query.id
        connection.query(sql.delete, id, function (err, result) {
          let res
          if (err) {
            res = {
              code: 1,
              msg: '操作失败',
              stack: err
            }
          } else {
            res = {
              code: 0,
              msg: '删除成功',
              data: {}
            }
          }
          // 释放连接
          connection.release()
          resolve(res)
        })
      })
    })
  },
  update: (ctx, next) => {
    return new Promise((resolve, reject) => {
      pool.getConnection(function (err, connection) {
        if (err) {
          resolve({
            code: 1,
            msg: '操作失败',
            stack: err
          })
        }
        let id = ctx.query.id
        let name = ctx.query.name
        let age = ctx.query.age
        connection.query(sql.update, [name, age, id], function (err, result) {
          let res
          if (err) {
            res = {
              code: 1,
              msg: '操作失败',
              stack: err
            }
          } else {
            res = {
              code: 0,
              msg: '更新成功',
              data: {}
            }
          }
          // 释放连接
          connection.release()
          resolve(res)
        })
      })
    })
  }
}
