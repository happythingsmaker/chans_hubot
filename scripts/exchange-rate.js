"use strict"

// Description:
//  Show currency exchange rate from EUR to Target Currency
//
// Commands:
//   (환율|currency|exchange rate)
//   (환율|currency|exchange rate) [target currency]
//   (환율|currency|exchange rate) [base currency] [target currency]
//   (환율|currency|exchange rate) [base amount] [base currency] [target currency]

const util = require('util');
const parseString = require("xml2js").parseString
const axios = require('axios')
const moment = require('moment')

require("../lib/sbot")

const CURRENCY_INFO_FROM_ECB = `https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`

class UnitExpression {
  constructor() {
    this.unitToExpr = {}
    this.exprToUnit = {}
  }

  add(unit, ...exprs) {
    this.unitToExpr[unit] = exprs || []
  }

  addUnits(...units) {
    for (let unit of units)
      this.unitToExpr[unit] = []
  }

  compile() {
    this.exprToUnit = {}
    for (var unit in this.unitToExpr) {
      this.exprToUnit[unit] = unit
      for (var expr of this.unitToExpr[unit])
        this.exprToUnit[expr] = unit
    }
  }
}

const unitExpr = new UnitExpression()
unitExpr.addUnits(
  "USD", "JPY", "BGN", "CZK", "DKK", "GBP", "HUF", "PLN", "RON", "SEK",
  "CHF", "ISK", "NOK", "HRK", "RUB", "TRY", "AUD", "BRL", "CAD", "CNY",
  "HKD", "IDR", "ILS", "INR", "KRW", "MXN", "MYR", "NZD", "PHP", "SGD",
  "THB"
)
unitExpr.add('EUR', 'EURO', 'EUROS', '€', '유로')
unitExpr.add('KRW', 'KRW', 'WON', '₩', '원' )
unitExpr.add('USD', 'DOLLAR', '달러', '딸라', '$' )
unitExpr.add('SGD', '씽딸' )
unitExpr.add('GBP', '파운드', 'pound' )
unitExpr.compile()

let cacheQueryHistory = {}
let cachedExchangeRate = {}

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

/**
 * Send answer and save it in cache
 * @param {object} msg
 * @param {{base: (string), target: (string), amount: (number), key: (string)}} param1
 * @param {{rate: (number), date: (string)}} param2
 */ 
async function responseCallback (msg, {base, target, amount, key}, {rate, date}) {
  if (rate == undefined)
    throw Error(`Unsupported Currency, please check the currency ${base}, ${target}`)

  let result = amount * rate
  if (result < 0.01) {
    amount *= 1000
    result *= 1000
  }

  const answer = `*${formatNumber(amount)} ${base} = ${formatNumber(result.toFixed(2))} ${target}* at ${date}`
  msg.$send(answer)
  // keep in cache
  cacheQueryHistory[key] = {
    answer,
    time: (new Date).getTime() // epoch in milisecond
  }
}

/** 
 * fetch data, calculate reate, and send
 * @param {Object} msg
 * @param {Object} query - {amount, base, target}
 * @param {number=} muteFor
 */
async function answerExchangeRate(msg, query, muteFor = 5000 * 60) {
  const room = msg.message.room
  const thread = msg.message.thread_ts || '' // TODO: this is not universal but slack specific
  // mange cache/mute per room and thread
  query.key = `${query.amount}-${query.base}-${query.target}-${room}-${thread}`
  const cachedQuery = cacheQueryHistory[query.key]
  if (cachedQuery && (new Date).getTime() - cachedQuery.time < muteFor) {
    // mute for 5mins
  } else {
    return await getExchangeRate(query)
      .then(result => responseCallback(msg, query, result))
      .catch(err => msg.$send(err))
  }
}

/** 
 * Generate rateObj{[currency]:rate}, date from xml data
 * @param {string} data
 * @return {Object} {rateObj, date}
 */
async function parseXml(data) {
  const result = await util.promisify(parseString)(data)
  const resultBase = result["gesmes:Envelope"].Cube[0].Cube
  const date = resultBase[0].$.time
  const exchangeRateArray = resultBase[0].Cube

  const rateObj = exchangeRateArray.reduce((p, n) => {
    p[n.$.currency] = parseFloat(n.$.rate)
    return p
  }, {EUR: 1})
  unitExpr.compile()
  return { rateObj, date }
}

/**
 *
 * @param {Object} query
 * @return {Object} {rate, date}
 */
// return {rate, date}
async function getExchangeRate(query) {
  const {base, target} = query
  // use cache if it's younger than 3 hours
  const ageOfCache = (new Date).getTime() - moment(cachedExchangeRate.fetchTime || 0).valueOf()
  if (ageOfCache > 3600 * 3 * 1000) {
    console.log("new fetch after", ageOfCache / 3600 / 1000)
    const res = await axios.get(CURRENCY_INFO_FROM_ECB)
    cachedExchangeRate = await parseXml(res.data)
    cachedExchangeRate.fetchTime = (new Date).getTime()
  }
  const {rateObj, date} = cachedExchangeRate
  const rate = (!(base in rateObj) || 
    !(target in rateObj)) ? 
    undefined : (rateObj[target] / rateObj[base])
  return {rate, date}
}

module.exports = robot => {
  robot.$set_sbot()

  robot.hear(/(환율|currency|exchange rate)(?:(?:\s*([0-9]+))?(?:\s*([a-zA-Z]{3}))?(?:\s*([a-zA-Z]{3})))?/i, msg => {
    let query = {
      amount: msg.match[2] || 1,
      base: msg.match[3] || "EUR",
      target: msg.match[4] || "KRW",

    }
    robot.logger.info(query)
    msg.finish()
    answerExchangeRate(msg, query)
      .catch(console.err)
  })

  // capture currency in message then show exchange rate
  const reUnits = Object.keys(unitExpr.exprToUnit).join('|').replace(/\$/g, '\\$')
  const currencyContainingExpression = new RegExp(`([\\d,\\.]+)\\s*(${reUnits})(?:.+?(${reUnits}))?`, 'i')

  robot.hear(currencyContainingExpression, msg => {
    const amount =  msg.match[1].replace(/,/g, '')
    if (isNaN(amount)) 
      return
    const baseExpr = msg.match[2]
    const base = unitExpr.exprToUnit[baseExpr.toUpperCase()]
    const targetExpr = msg.match[3] || (base == 'EUR' ? 'KRW' : 'EUR')
    const target = unitExpr.exprToUnit[targetExpr.toUpperCase()]
    const query = { amount, base, target }

    console.log(msg.message)

    answerExchangeRate(msg, query)
      .catch(console.err)
  })
}
