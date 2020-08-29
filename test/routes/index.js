'use strict'

const supertest = require('supertest')
const express = require('express')
const tapeWithoutPromise = require('tape')
const addPromiseSupport = require('tape-promise').default
const tape = addPromiseSupport(tapeWithoutPromise)

const router = require('../../src/routes')
router.use('/error', (req, res, next) => {
	throw new Error('something went wrong')
})
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

tape('GET /stations/:id', async t => {
	const { body: berlinResult } = await supertest(app).get('/stations/8096003')
	t.deepEqual(berlinResult, {
		id: '8096003',
		name: 'Berlin',
		isMeta: true,
		timezone: 'Europe/Berlin',
		flag: '🇩🇪',
	}, 'result for berlin')

	const notFound = await supertest(app).get('/stations/something-else')
	t.equal(notFound.status, 404, '404 not found')
	t.equal(notFound.text, 'station not found')
})
