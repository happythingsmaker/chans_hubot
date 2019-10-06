# Description:
#   hubot-mongodb-brain
#   support MongoLab and MongoHQ on heroku.
#   forked from https://github.com/shokai/hubot-mongodb-brain to fix mongo version issue
#
# Dependencies:
#   "mongodb": "^3.x"
#   "lodash" : "*"
#
# Configuration:
#   MONGODB_URL or MONGOLAB_URI or MONGOHQ_URL or 'mongodb://localhost/hubot-brain'
#
# Author:
#   Sho Hashimoto <hashimoto@shokai.org>

'use strict'

_           = require 'lodash'
MongoClient = require('mongodb').MongoClient

deepClone = (obj) -> JSON.parse JSON.stringify obj

module.exports = (robot) ->
  mongoUrl = process.env.MONGODB_URL or
             process.env.MONGOLAB_URI or
             process.env.MONGOHQ_URL or
             'mongodb://localhost/hubot-brain'

  matched = mongoUrl.match(/^(.+\/\/.+)\/(.+)$/)

  throw new Error 'Wrong mongo url' unless matched

  mongoUrl = matched[1]
  mongo_dbname = matched[2]

  MongoClient.connect mongoUrl, (err, client) ->
    throw err if err

    db = client.db(mongo_dbname)

    robot.brain.on 'close', ->
      client.close()

    robot.logger.info "MongoDB connected"
    robot.brain.setAutoSave false

    cache = {}

    ## restore data from mongodb
    db.createCollection 'brain', (err, collection) ->
      collection.find({type: '_private'}).toArray (err, docs) ->
        return robot.logger.error err if err
        _private = {}
        for doc in docs
          _private[doc.key] = doc.value
        cache = deepClone _private
        robot.brain.mergeData {_private: _private}
        robot.brain.resetSaveInterval 10
        robot.brain.setAutoSave true

    ## save data into mongodb
    robot.brain.on 'save', (data) ->
      db.collection 'brain', (err, collection) ->
        for k,v of data._private
          do (k,v) ->
            return if _.isEqual cache[k], v  # skip not modified key
            robot.logger.debug "save \"#{k}\" into mongodb-brain"
            cache[k] = deepClone v
            collection.update
              type: '_private'
              key:  k
            ,
              $set:
                value: v
            ,
              upsert: true
            , (err, res) ->
              robot.logger.error err if err
            return

