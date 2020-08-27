'use strict'

const { Router } = require('express')
const logger = require('pino')()

const stations = require('./stations')

const router = new Router()

router.route('/stations').get(stations)

router.use((err, req, res, next) => {
	logger.error({ err })
	res.status(500).end('internal server error')
})

module.exports = router
