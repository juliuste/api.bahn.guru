'use strict'

const asyncHandler = require('express-async-handler')
const stations = require('./stations.json')
const stationsMap = new Map(Object.entries(stations))

const requestHandler = asyncHandler(async (req, res, next) => {
	if (!req.params.id) return res.status(404).end()
	const station = stationsMap.get(String(req.params.id))
	if (!station) return res.status(404).end('station not found')
	return res.status(200).json(station)
})

module.exports = requestHandler
