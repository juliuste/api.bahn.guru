'use strict'

const asyncHandler = require('express-async-handler')
const { DateTime } = require('luxon')
const Ajv = require('ajv')
const logger = require('pino')()
const first = require('lodash/first')
const last = require('lodash/last')
const cleanStationName = require('db-clean-station-name')

const passengersSchema = {
	type: 'array',
	items: {
		type: 'object',
		properties: {
			kind: {
				enum: [
					'adult',
					'child',
				],
				type: 'string',
				title: 'kind',
			},
			loyaltyCard: {
				enum: [
					'bahncard25',
					'bahncard50',
				],
				type: 'string',
				title: 'loyaltyCard',
			},
		},
		required: [
			'kind',
		],
	},
}

const validatePassengers = new Ajv({ allErrors: true }).compile(passengersSchema)

const createJourneySummary = journey => {
	if (!journey.price || !journey.price.amount || journey.price.currency !== 'EUR') return null
	return {
		originName: cleanStationName(journey.origin.name),
		destinationName: cleanStationName(journey.destination.name),
		departure: first(journey.legs).departure,
		arrival: last(journey.legs).arrival,
		transfers: journey.legs.length - 1,
		price: {
			amount: journey.price.amount,
			currency: journey.price.currency,
		},
	}
}

const loyaltyCardId = (loyaltyCard, wagonClass) => {
	if (loyaltyCard === 'bahncard25') {
		if (wagonClass === '1') return 1
		if (wagonClass === '2') return 2
	}
	if (loyaltyCard === 'bahncard50') {
		if (wagonClass === '1') return 3
		if (wagonClass === '2') return 4
	}
	return 0
}

const requestHandler = fetchFn => asyncHandler(async (req, res, next) => {
	// origin
	if (!req.query.origin) return res.status(400).end('missing origin')
	if (typeof req.query.origin !== 'string' || req.query.origin.length === 0) return res.status(400).end('invalid origin')

	// destination
	if (!req.query.destination) return res.status(400).end('missing destination')
	if (typeof req.query.destination !== 'string' || req.query.destination.length === 0) return res.status(400).end('invalid destination')

	// day
	if (!req.query.day) return res.status(400).end('missing day')
	const isoDay = DateTime.fromFormat(req.query.day, 'yyyy-MM-dd', { zone: 'Europe/Berlin' })
	if (!isoDay) return res.status(400).end('invalid day')

	// class
	if (!req.query.class) return res.status(400).end('missing class')
	if (!['1', '2'].includes(req.query.class)) return res.status(400).end('invalid class')

	// passengers
	if (!req.query.passengers) return res.status(400).end('missing passengers')
	let passengers
	try {
		passengers = JSON.parse(req.query.passengers)
	} catch (error) {
		logger.info('invalid passenger list', { error, passengers })
		return res.status(400).end('invalid passengers')
	}
	if (passengers.length === 0) return res.status(400).end('empty passengers')
	if (!validatePassengers(passengers)) return res.status(400).end('invalid passengers')

	const journeys = await fetchFn(req.query.origin, req.query.destination, new Date(isoDay), {
		class: req.query.class,
		travellers: passengers.map(passenger => ({
			typ: 'E', // @todo use passenger.kind instead
			bc: passenger.loyaltyCard ? loyaltyCardId(passenger.loyaltyCard, req.query.class) : 0,
		})),
	})

	const journeySummaries = journeys.map(createJourneySummary).filter(Boolean)
	return res.json(journeySummaries)
})

module.exports = { loyaltyCardId, requestHandler }
