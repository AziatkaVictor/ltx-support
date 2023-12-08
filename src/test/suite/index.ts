import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';

export function run(): Promise<void> {
	const mocha = new Mocha({
		ui: 'tdd'
	});
 
	const testsRoot = path.resolve(__dirname, '..');

	return new Promise((success, error) => {
		glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
			if (err) {
				return error(err);
			}

			files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

			try {
				mocha.run(failures => {
					if (failures > 0) {
						error(new Error(`${failures} tests failed.`));
					} else {
						success();
					}
				});
			} catch (err) {
				console.error(err);
				error(err);
			}
		});
	});
}