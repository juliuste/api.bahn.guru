'use strict'

const fromPairs = require('lodash/fromPairs')
const { countries } = require('countries-list')
const trainlineStations = require('trainline-stations')

const validAndFormattedStations = trainlineStations
	.map(s => {
		if (!(s.id && s.db_id && s.name && s.time_zone && s.is_suggestable && countries[s.country] && countries[s.country].emoji)) return null
		return {
			id: String(s.db_id),
			name: s.name,
			isMeta: s.is_city,
			timezone: s.time_zone,
			flag: countries[s.country].emoji,
		}
	})
	.filter(s => !!s)

module.exports = fromPairs(validAndFormattedStations.map(s => [s.id, s]))
