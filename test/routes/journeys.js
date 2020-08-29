const supertest = require('supertest')
const express = require('express')
const tapeWithoutPromise = require('tape')
const addPromiseSupport = require('tape-promise').default
const tape = addPromiseSupport(tapeWithoutPromise)

const { requestHandler } = require('../../src/routes/journeys')

let mockArgs
let mockHasBeenCalled = false
const normalFetchFn = async (...args) => { mockArgs = args; mockHasBeenCalled = true; return { some: 'response' } }
const throwingFetchFn = async () => { throw new Error('something went wrong') }

const app = express()
app.get('/journeys-no-error', requestHandler(normalFetchFn))
app.get('/journeys-with-error', requestHandler(throwingFetchFn))
// eslint-disable-next-line handle-callback-err
app.use((err, req, res, next) => {
	res.status(418).end('catched')
})

tape('requestHandler', async t => {
	const withMissingParams = await supertest(app).get('/journeys-no-error').query({ origin: '123' })
	t.equal(withMissingParams.status, 400, '400 without full query')
	t.equal(withMissingParams.text, 'missing destination')
	t.equal(mockHasBeenCalled, false)

	const withInvalidPassengersJson = await supertest(app).get('/journeys-no-error').query({ origin: '123', destination: '234', day: '2029-01-01', class: '2', passengers: '{invalid:json}' })
	t.equal(withInvalidPassengersJson.status, 400, '400 with invalid passengers (invalid JSON)')
	t.equal(withInvalidPassengersJson.text, 'invalid passengers')
	t.equal(mockHasBeenCalled, false)

	const withInvalidPassengersSchema = await supertest(app).get('/journeys-no-error').query({ origin: '123', destination: '234', day: '2029-01-01', class: '2', passengers: '[{"a":"b"}]' })
	t.equal(withInvalidPassengersSchema.status, 400, '400 with invalid passengers (invalid schema)')
	t.equal(withInvalidPassengersSchema.text, 'invalid passengers')
	t.equal(mockHasBeenCalled, false)

	const valid = await supertest(app).get('/journeys-no-error').query({ origin: '123', destination: '234', day: '2029-01-01', class: '2', passengers: '[{"kind": "adult", "loyaltyCard": "bahncard25"}, {"kind": "adult"}]' })
	t.equal(valid.status, 200, '200 with valid query')
	t.deepEqual(valid.body, { some: 'response' })
	t.equal(mockHasBeenCalled, true)
	t.deepEqual(mockArgs, ['123', '234', new Date('2029-01-01T00:00:00.000+01:00'), {
		class: '2',
		travellers: [{ typ: 'E', bc: 2 }, { typ: 'E', bc: 0 }],
	}])

	const failed = await supertest(app).get('/journeys-with-error').query({ origin: '123', destination: '234', day: '2029-01-01', class: '2', passengers: '[{"kind": "adult", "loyaltyCard": "bahncard25"}, {"kind": "adult"}]' })
	t.equal(failed.status, 418, 'internal error forwarded to error middleware')
	t.equal(failed.text, 'catched')
})
