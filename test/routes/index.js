'use strict'

const supertest = require('supertest')
const express = require('express')
const tapeWithoutPromise = require('tape')
const addPromiseSupport = require('tape-promise').default
const tape = addPromiseSupport(tapeWithoutPromise)

const router = require('../../src/routes')
const app = express()
app.use(router)

// warning: uses live hafas api, could be brittle
tape('GET /stations', async t => {
	const withoutQuery = await supertest(app).get('/stations')
	t.equal(withoutQuery.status, 400, '400 without query')

	const emptyQuery = await supertest(app).get('/stations').query({ query: '' })
	t.equal(emptyQuery.status, 400, '400 with empty')

	const { body: berlinResults } = await supertest(app).get('/stations').query({ query: 'Berlin' })
	t.deepEqual(berlinResults[0], {
		id: '8096003',
		name: 'Berlin',
		isMeta: true,
		timezone: 'Europe/Berlin',
		flag: '🇩🇪',
	}, 'first result for berlin')

	const { body: prezelleResults } = await supertest(app).get('/stations').query({ query: 'Prezelle' })
	t.deepEqual(prezelleResults.length, 0, 'no results for non-trainstations')
})