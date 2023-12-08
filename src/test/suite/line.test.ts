import * as assert from 'assert';
import { LtxLine } from '../../ltx/ltxLine';

suite("LTX Line", () => {
	suite('Get Property Name', () => {
		test('Test 1', () => {
			const data = "on_info = nil";
			const line = new LtxLine(0, data, null);
			assert.strictEqual(line.getPropertyName(), "on_info");
		});
	
		test('Test 2', () => {
			const data = "on_info32 = nil";
			const line = new LtxLine(0, data, null);
			assert.strictEqual(line.getPropertyName(), "on_info");
		});
	
		test('Test 3', () => {
			const data = " = nil";
			const line = new LtxLine(0, data, null);
			assert.equal(line.getPropertyName(), null);
		});
	
		test('Test 4', () => {
			const data = "on_i2/@nmfo = nil";
			const line = new LtxLine(0, data, null);
			assert.equal(line.getPropertyName(), null);
		});
	
		test('Test 5', () => {
			const data = "on_info";
			const line = new LtxLine(0, data, null);
			assert.equal(line.getPropertyName(), null);
		});
	});

	suite('Get Property Name', () => {
	});
});