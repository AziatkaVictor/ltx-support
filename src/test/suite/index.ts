import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';
import { Logger } from '../../classes/shared/Logger';

export function run(): Promise<void> {
	const mocha = new Mocha({
		ui: 'tdd',
		reporter: CustomReporter
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
			}
		});
	});
}

// This reporter outputs test results, indenting two spaces per suite
export class CustomReporter extends Mocha.reporters.Base {
	private indents = 0;
	private test: string = '1';

	constructor(runner: Mocha.Runner) {
		super(runner);
		const stats = runner.stats;

		runner
			.on("suite", (suite: Mocha.Suite) => {
				if (suite.title === '') return;

				Logger.instance.suite(`${this.indent()}${suite.title}`);
				this.increaseIndent();
				this.write(this.indents, suite.suites.length + suite.tests.length);

			})
			.on("suite end", (suite: Mocha.Suite) => {
				this.write(this.indents, suite.suites.length + suite.tests.length);
				this.decreaseIndent();
				this.write(this.indents, this.read(this.indents) - 1);
			})
			.on("pass", (test: Mocha.Test) => {
				Logger.instance.success(`${this.indent()}${test.title}`);
				this.write(this.indents, this.read(this.indents) - 1);
			})
			.on("fail", (test: Mocha.Test, err: Error) => {
				Logger.instance.fail(`${this.indent()}${test.title} Error: ${err.message}`);
				this.write(this.indents, this.read(this.indents) - 1);
			})
			.once("end", () => {
				if (stats.failures > 0) {
					Logger.instance.fail(`Test count: ${stats.failures + stats.passes}`);
					Logger.instance.fail(`Duration: ${stats.duration}`);
					Logger.instance.fail(`Count of failed tests: ${stats.failures}`);
				}
				else {
					Logger.instance.success(`Test count: ${stats.failures + stats.passes}`);
					Logger.instance.success(`Duration: ${stats.duration}`);
					Logger.instance.success(`All tests are passed!`);
				}
			});
	}

	private read(index: number): number {
		const arr: string[] = this.test.split(":");
		if ((arr.length - 1) < index) {
			return 0;
		}
		return Number(arr[index]);
	}

	private write(index: number, value: number) {
		var arr: string[] = this.test.split(":");
		if ((arr.length - 1) < index) {
			for (var i = arr.length - 1 - index; i > index; i++) {
				arr.push("0");
			}
		}
		arr[index] = value.toString();
		this.test = arr.join(":");
	}

	private indent() {
		var result = ``;

		if (this.indents > 0) {
			for (var symbol of this.test.split(":").slice(1, this.indents)) {
				if (Number(symbol) > 1) {
					result += "│    ";
				}
				else {
					result += '     ';
				}
			}
			if (Number(this.test.split(":")[this.indents]) > 1) {
				result += '├─── '
			}
			else {
				result += '└─── '
			}
		}

		return result;
	}

	private increaseIndent() {
		this.indents++;
	}

	private decreaseIndent() {
		this.indents--;
	}
}