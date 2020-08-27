'use strict'

const asyncHandler = require('express-async-handler')
const hafas = require('db-hafas')('api.bahn.guru')
const stations = require('./stations.json')

const requestHandler = asyncHandler(async (req, res, next) => {
	if (!req.query.query) return res.status(400).end('missing query')
	const matches = await hafas.locations(String(req.query.query), {
		fuzzy: true,
		results: 5,
		stops: true,
		addresses: false,
		poi: false,
		subStops: false,
		entrances: false,
		linesOfStops: false,
	})
	res.status(200).json(matches.map(m => stations[String(m.id)]).filter(s => !!s))
})

module.exports = requestHandler
