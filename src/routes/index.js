'use strict'

const { Router } = require('express')
const prices = require('db-prices')

const stations = require('./stations')
const stationsId = require('./stations-id')
const { requestHandler: journeys } = require('./journeys')

const router = new Router()

router.route('/stations').get(stations)
router.route('/stations/:id').get(stationsId)
router.route('/journeys').get(journeys(prices))

module.exports = router
