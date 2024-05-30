/*
 * Copyright (C) 2023 Intel Corporation.  All rights reserved.
 * SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception
 */

import fs from 'fs';
import path from 'path';
import { exec, execSync } from 'child_process';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const benchmark_dir = dirname(__filename);
const benchmarks = fs.readdirSync(benchmark_dir);
const ts2wasm_script = path.join(benchmark_dir, '../../build/cli/ts2wasm.js');
const iwasm_gc = path.join(benchmark_dir, '../../runtime-library/build/iwasm_gc');
const default_qjs = path.join(benchmark_dir, '../../runtime-library/deps/quickjs/qjs');
const wamrc = path.join(benchmark_dir, '../../runtime-library/deps/wamr-gc/wamr-compiler/build/wamrc');
const nodewasm = path.join(benchmark_dir, '../../tools/validate/run_module/run_module_on_node.js')
const optimize_level = 3;
const validate_res_error = 'Validate result error';

function print_help() {
    console.log(`Usage: node run_benchmark.js [options]`);
    console.log(`Options:`);
    console.log(`  --no-clean=true|false`);
    console.log(`  --times=NUM`);
    console.log(`  --gc-heap=NUM`);
    console.log(`  --benchmarks=NAME1,NAME2,...`);
    console.log(`  --runtimes=NAME1,NAME2,...`);
    console.log(`  --help`);
    console.log(`Example:`);
    console.log(`  node run_benchmark.js --no-clean=true --times=10 --gc-heap=40960000 --benchmarks=mandelbrot,binarytrees_class --runtimes=wamr-interp,qjs`);
    process.exit(0);
}

function parseArguments(rawArgs) {
    const args = {};
    rawArgs.forEach(arg => {
        if (arg === '--help' || arg === 'help' || arg === 'h') {
            print_help();
        }
        const [key, value] = arg.split('=');
        args[key] = value;
    });
    return args;
}

const args = parseArguments(process.argv.slice(2));

const shouldClean = args['--no-clean'] ? false : true;
const multirun = args['--times'] ? parseInt(args['--times']) : 1;
const wamr_stack_size = args['--stack-size'] ? parseInt(args['--stack-size']) : 40960000;
const wamr_gc_heap = args['--gc-heap'] ? parseInt(args['--gc-heap']) : 40960000;
const specifed_benchmarks = args['--benchmarks'] ? args['--benchmarks'].split(',') : null;
const specified_runtimes = args['--runtimes'] ? args['--runtimes'].split(',') : null;
const warm_up_times = args['--warmup'] ? parseInt(args['--warmup']) : 0;

const default_gc_size_option = `--gc-heap-size=${wamr_gc_heap}`
const stack_size_option = `--stack-size=${wamr_stack_size}`

let qjs;
try {
    qjs = execSync('which qjs').toString().trim();
} catch (error) {
    if (process.env.QJS_PATH) {
        qjs = process.env.QJS_PATH;
    } else {
        const default_qjs_path = '/usr/local/bin/qjs';
        if (fs.existsSync(default_qjs_path)) {
            qjs = default_qjs_path;
        } else {
            if (fs.existsSync(default_qjs)) {
                qjs = default_qjs;
            }
            else {
                console.error("Error: QJS_PATH is not defined, and no default qjs path is provided.");
                process.exit(1);
            }
        }
    }
}

let node_cmd;
try {
    node_cmd = execSync('which node').toString().trim();
} catch (error) {
    if (process.env.NODE_PATH) {
        node_cmd = process.env.NODE_PATH;
    } else {
        const default_node_path = '/usr/local/bin/node';
        if (fs.existsSync(default_node_path)) {
            node_cmd = default_node_path;
        } else {
            console.error("Error: NODE_PATH is not defined, and no default node path is provided.");
            process.exit(1);
        }
    }
}

let wamr_interp_times = [];
let qjs_js_times = [];
let wamr_aot_times = [];
let v8_js_times = [];
let v8_wasm_times = []
let moonbit_wamr_interp_times = [];
let moonbit_qjs_js_times = [];
let moonbit_wamr_aot_times = [];
let moonbit_v8_js_times = [];
let moonbit_v8_wasm_times = []
let moonbit_wasm1_times = [];
let moonbit_wasm1_aot_times = [];
let prefixs = [];

let benchmark_options = {
    'merkletrees': {
        // skip: true
        wamr_option: [default_gc_size_option]
    },
    'mandelbrot': {
        wamr_option: [default_gc_size_option]
    },
    'mandelbrot_i32': {
        wamr_option: [default_gc_size_option]
    },
    'binarytrees_class': {
        wamr_option: [default_gc_size_option]
    },
    'binarytrees_interface': {
        wamr_option: [default_gc_size_option]
    },
    'quicksort': {
        wamr_option: [stack_size_option, default_gc_size_option]
    },
    'quicksort_float': {
        wamr_option: [stack_size_option, default_gc_size_option]
    },
}

function collect_benchmark_options(options) {
    if (options == undefined) {
        return '';
    }
    return options.join(' ');
}

console.log(`\x1b[33m======================== options ========================\x1b[0m`);
console.log(`QJS_PATH: ${qjs}`);
console.log(`NODE_PATH: ${node_cmd}`);
console.log(`strategy: run ${multirun} times and get average`);
console.log(`clean generated files: ${shouldClean ? 'true' : 'false'}`);
console.log(`\x1b[33m======================== running ========================\x1b[0m`);

function run_multiple_times(cmd) {
    let elapsed;
    let elapse_arr = [];
    console.log(`\n\t${cmd}`)

    try {
        for (let i = 0; i < warm_up_times; i++) {
            execSync(cmd);
        }
        for (let i = 0; i < multirun; i++) {
            let start = performance.now();
            let ret = execSync(cmd);
            let end = performance.now();
            elapsed = (end - start);
            elapse_arr.push(elapsed);
            ret = ret.toString().trim();
            if (ret.startsWith(validate_res_error)) {
                throw new Error(ret);
            }
        }
    }
    catch (e) {
        console.log('')
        if (e.status) {
            console.log(`\x1b[31mExit Code: ${e.status}\x1b[0m`);
        }
        console.log(`\x1b[31m${e.message}\x1b[0m`);
        if (e.stdout) {
            console.log(`\x1b[31m${e.stdout.toString()}\x1b[0m`);
        }
        return NaN
    }

    elapsed = elapse_arr.reduce((a, b) => a + b, 0) / elapse_arr.length;
    return elapsed;
}

let executed_benchmarks = 0;
for (let benchmark of benchmarks) {
    let filename = path.basename(benchmark);
    let prefix = path.basename(filename, path.extname(filename));
    let extension = path.extname(filename).slice(1);
    let js_file = `${prefix}.js`;
    let elapsed;

    if (extension != 'ts')
        continue;

    if (!fs.existsSync(`${prefix}.js`))
        continue;

    if (benchmark_options[prefix]?.skip) {
        console.log(`\x1b[33mSkip ${prefix} benchmark.\x1b[0m`);
        continue;
    }

    if (specifed_benchmarks && !specifed_benchmarks.includes(prefix)) {
        console.log(`\x1b[33mSkip ${prefix} benchmark due to argument filter.\x1b[0m`);
        continue;
    }

    console.log(`\x1b[36m################### ${prefix} ###################\x1b[0m`);
    prefixs.push(prefix);

    console.log(`Compiling ${prefix} benchmark:`);
    execSync(`node ${ts2wasm_script} ${filename} --opt ${optimize_level} --output ${prefix}.wasm > tmp.txt`);
    execSync(`wasm-tools print ${prefix}.wasm -o ${prefix}.wat`)
    execSync(`wasm-opt -all -O3 -o ${prefix}.wasm ${prefix}.wasm`)

    // https://github.com/bytecodealliance/wasm-micro-runtime/issues/3164#issuecomment-1952034927
    execSync(`${wamrc} --enable-gc --size-level=0 -o ${prefix}.aot ${prefix}.wasm > tmp.txt`);

    execSync(`moon clean --source-dir ${prefix} > tmp.txt`)
    execSync(`moon build --source-dir ${prefix} --target wasm-gc > tmp.txt`)
    execSync(`moon build --source-dir ${prefix} --target wasm > tmp.txt`)
    execSync(`moon build --source-dir ${prefix} --target wasm-gc --output-wat > tmp.txt`)
    execSync(`wasm-opt -all -O3 ${prefix}/target/wasm-gc/release/build/lib/lib.wasm  -o ${prefix}/target/wasm-gc/release/build/lib/lib.wasm`)
    execSync(`wasm-opt -all -O3 ${prefix}/target/wasm/release/build/lib/lib.wasm  -o ${prefix}/target/wasm/release/build/lib/lib.wasm`)

    // aot for moonbit
    execSync(`${wamrc} --enable-gc --size-level=0 -o ${prefix}/target/wasm-gc/release/build/lib/lib.aot ${prefix}/target/wasm-gc/release/build/lib/lib.wasm  > tmp.txt`);
    execSync(`${wamrc} --enable-gc --size-level=0 -o ${prefix}/target/wasm/release/build/lib/lib.aot ${prefix}/target/wasm/release/build/lib/lib.wasm  > tmp.txt`);

    if (specified_runtimes && !specified_runtimes.includes('moonbit-wasm-aot')) {
        console.log(`\x1b[33mSkip MoonBit Wasm1 Aot due to argument filter.\x1b[0m`);
    }
    else {
        process.stdout.write(`MoonBit Wasm1 Aot ... \t\t`);
        elapsed = run_multiple_times(`${iwasm_gc} -f main ${prefix}/target/wasm/release/build/lib/lib.aot`);
        moonbit_wasm1_aot_times.push(elapsed);
        console.log(`${elapsed.toFixed(2)}ms`);
    }

    if (specified_runtimes && !specified_runtimes.includes('moonbit-wasm')) {
        console.log(`\x1b[33mSkip MoonBit Wasm1 due to argument filter.\x1b[0m`);
    }
    else {
        process.stdout.write(`MoonBit Wasm1 ... \t\t`);
        elapsed = run_multiple_times(`${iwasm_gc} -f main ${prefix}/target/wasm/release/build/lib/lib.wasm`);
        moonbit_wasm1_times.push(elapsed);
        console.log(`${elapsed.toFixed(2)}ms`);
    }

    if (specified_runtimes && !specified_runtimes.includes('wamr-interp')) {
        console.log(`\x1b[33mSkip WAMR interpreter due to argument filter.\x1b[0m`);
    }
    else {
        process.stdout.write(`WAMR interpreter ... \t`);
        elapsed = run_multiple_times(`${iwasm_gc} ${collect_benchmark_options(benchmark_options[prefix]?.wamr_option)} -f main ${prefix}.wasm`);
        wamr_interp_times.push(elapsed);
        console.log(`${elapsed.toFixed(2)}ms`);
    }

    if (specified_runtimes && !specified_runtimes.includes('wamr-aot')) {
        console.log(`\x1b[33mSkip WAMR AoT due to argument filter.\x1b[0m`);
    }
    else {
        process.stdout.write(`WAMR AoT ... \t\t`);
        elapsed = run_multiple_times(`${iwasm_gc} ${collect_benchmark_options(benchmark_options[prefix]?.wamr_option)} -f main ${prefix}.aot`);
        wamr_aot_times.push(elapsed);
        console.log(`${elapsed.toFixed(2)}ms`);
    }

    if (specified_runtimes && !specified_runtimes.includes('node-wasm')) {
        console.log(`\x1b[33mSkip Node Wasm due to argument filter.\x1b[0m`);
    }
    else {
        process.stdout.write(`Node Wasm ... \t\t`);
        elapsed = run_multiple_times(`node ${nodewasm} -s -f main ${prefix}.wasm`);
        v8_wasm_times.push(elapsed);
        console.log(`${elapsed.toFixed(2)}ms`);
    }

    if (specified_runtimes && !specified_runtimes.includes('moonbit-node-wasm')) {
        console.log(`\x1b[33mSkip MoonBit Node Wasm due to argument filter.\x1b[0m`);
    }
    else {
        process.stdout.write(`MoonBit Node Wasm ... \t\t`);
        elapsed = run_multiple_times(`node ${nodewasm} -s -f main ${prefix}/target/wasm-gc/release/build/lib/lib.wasm`);
        moonbit_v8_wasm_times.push(elapsed);
        console.log(`${elapsed.toFixed(2)}ms`);
    }

    if (specified_runtimes && !specified_runtimes.includes('qjs')) {
        console.log(`\x1b[33mSkip QuickJS due to argument filter.\x1b[0m`);
    }
    else {
        process.stdout.write(`QuickJS ... \t\t`);
        elapsed = run_multiple_times(`${qjs} ${js_file}`);
        qjs_js_times.push(elapsed);
        console.log(`${elapsed.toFixed(2)}ms`);
    }

    if (specified_runtimes && !specified_runtimes.includes('node')) {
        console.log(`\x1b[33mSkip Node due to argument filter.\x1b[0m`);
    }
    else {
        process.stdout.write(`Node ... \t\t`);
        elapsed = run_multiple_times(`${node_cmd} ${js_file}`);
        v8_js_times.push(elapsed);
        console.log(`${elapsed.toFixed(2)}ms`);
    }

    if (specified_runtimes && !specified_runtimes.includes('moonbit-wamr-interp')) {
        console.log(`\x1b[33mSkip MoonBit WAMR interpreter due to argument filter.\x1b[0m`);
    }
    else {
        process.stdout.write(`MoonBit WAMR interpreter ... \t\t`);
        elapsed = run_multiple_times(`${iwasm_gc} ${collect_benchmark_options(benchmark_options[prefix]?.wamr_option)} -f main ${prefix}/target/wasm-gc/release/build/lib/lib.wasm`);
        moonbit_wamr_interp_times.push(elapsed);
        console.log(`${elapsed.toFixed(2)}ms`);
    }

    if (specified_runtimes && !specified_runtimes.includes('moonbit-wamr-aot')) {
        console.log(`\x1b[33mSkip Moonbit WAMR AoT due to argument filter.\x1b[0m`);
    }
    else {
        process.stdout.write(`MoonBit WAMR AoT ... \t\t`);
        elapsed = run_multiple_times(`${iwasm_gc} ${collect_benchmark_options(benchmark_options[prefix]?.wamr_option)} -f main ${prefix}/target/wasm-gc/release/build/lib/lib.aot`);
        moonbit_wamr_aot_times.push(elapsed);
        console.log(`${elapsed.toFixed(2)}ms`);
    }

    if (specified_runtimes && !specified_runtimes.includes('moonbit-qjs')) {
        console.log(`\x1b[33mSkip MoonBit QuickJS due to argument filter.\x1b[0m`);
    }
    else {
        process.stdout.write(`MoonBit QuickJS ... \t\t`);
        elapsed = run_multiple_times(`${qjs} ${prefix}/target/js/release/build/main/main.js`);
        moonbit_qjs_js_times.push(elapsed);
        console.log(`${elapsed.toFixed(2)}ms`);
    }

    if (specified_runtimes && !specified_runtimes.includes('moonbit-node')) {
        console.log(`\x1b[33mSkip MoonBit Node due to argument filter.\x1b[0m`);
    }
    else {
        process.stdout.write(`MoonBit Node ... \t\t`);
        elapsed = run_multiple_times(`${node_cmd} ${prefix}/target/js/release/build/main/main.js`);
        moonbit_v8_js_times.push(elapsed);
        console.log(`${elapsed.toFixed(2)}ms`);
    }

    executed_benchmarks++;
}

if (shouldClean) {
    execSync(`rm -f *.wasm`);
    execSync(`rm -f *.aot`);
    execSync(`rm -f tmp.txt`);
}

console.log(`\x1b[32m====================== results ======================\x1b[0m`);
let results = [];

for (let i = 0; i < executed_benchmarks; i++) {
    let wamr_interp_time = wamr_interp_times[i];
    let qjs_js_time = qjs_js_times[i];
    let wamr_aot_time = wamr_aot_times[i];
    let v8_js_time = v8_js_times[i];
    let v8_wasm_time = v8_wasm_times[i]
    let moonbit_wamr_interp_time = moonbit_wamr_interp_times[i];
    let moonbit_qjs_js_time = moonbit_qjs_js_times[i];
    let moonbit_wamr_aot_time = moonbit_wamr_aot_times[i];
    let moonbit_v8_js_time = moonbit_v8_js_times[i];
    let moonbit_v8_wasm_time = moonbit_v8_wasm_times[i]
    let moonbit_wasm1_time = moonbit_wasm1_times[i];
    let moonbit_wasm1_aot_time = moonbit_wasm1_aot_times[i];

    let r = {
        benchmark: prefixs[i]
    }

    if(moonbit_wasm1_aot_time) {
      r['mbt wasm1 aot'] = moonbit_wasm1_aot_time.toFixed(2) + 'ms'
    }

    if (moonbit_wasm1_time) {
      r['mbt wasm1'] = moonbit_wasm1_time.toFixed(2) + 'ms'
    }

    if (wamr_interp_time) {
        r['interp'] = wamr_interp_time.toFixed(2) + 'ms';
    }

    if (wamr_aot_time) {
        r['aot'] = wamr_aot_time.toFixed(2) + 'ms';
    }

    if (qjs_js_time) {
        r['qjs'] = qjs_js_time.toFixed(2) + 'ms';
    }

    if (v8_js_time) {
        r['Node'] = v8_js_time.toFixed(2) + 'ms';
    }

    if (v8_wasm_time) {
      r['v8 wasm'] = v8_wasm_time.toFixed(2) + 'ms'
    }

    if (moonbit_wamr_interp_time) {
      r['mbt interp'] = moonbit_wamr_interp_time.toFixed(2) + 'ms'
    }

    if (moonbit_wamr_aot_time) {
        r['mbt aot'] = moonbit_wamr_aot_time.toFixed(2) + 'ms';
    }

    if (moonbit_qjs_js_time) {
      r['mbt qjs'] = moonbit_qjs_js_time.toFixed(2) + 'ms'
    }

    if (moonbit_v8_js_time) {
        r['mbt node'] = moonbit_v8_js_time.toFixed(2) + 'ms';
    }

    if (moonbit_v8_wasm_time) {
      r['mbt v8 wasm'] = moonbit_v8_wasm_time.toFixed(2) + 'ms'
    }

    if (wamr_interp_time && moonbit_wamr_interp_time) {
        let ratio = moonbit_wamr_interp_time / wamr_interp_time
        let formatted_result = ratio.toFixed(2);
        r['mbt/ts(interp)'] = formatted_result;
    }

    if (wamr_aot_time && moonbit_wamr_aot_time) {
        let ratio = moonbit_wamr_aot_time / wamr_aot_time
        let formatted_result = ratio.toFixed(2);
        r['mbt/ts(aot)'] = formatted_result;
    }

    if (qjs_js_time && moonbit_qjs_js_time) {
        let ratio = moonbit_qjs_js_time / qjs_js_time;
        let formatted_result = ratio.toFixed(2);
        r['mbt/js(qjs)'] = formatted_result;
    }

    if (v8_wasm_time && moonbit_v8_wasm_time) {
      let ratio = moonbit_v8_wasm_time / v8_wasm_time
      let formatted_result = ratio.toFixed(2);
      r['mbt/ts(v8 wasm)'] = formatted_result;
    }

    if (v8_js_time && moonbit_v8_js_time) {
        let ratio = moonbit_v8_js_time / v8_js_time
        let formatted_result = ratio.toFixed(2);
        r['mbt/js(node)'] = formatted_result;
    }

    if (wamr_interp_time && qjs_js_time) {
        let ratio = wamr_interp_time / qjs_js_time;
        let formatted_result = ratio.toFixed(2);
        r['interp/qjs'] = formatted_result;
    }

    if (moonbit_wamr_interp_time && qjs_js_time) {
        let ratio = moonbit_wamr_interp_time / qjs_js_time;
        let formatted_result = ratio.toFixed(2);
        r['mbt interp/qjs'] = formatted_result;
    }

    if (moonbit_wamr_aot_time && qjs_js_time) {
        let ratio_aot = moonbit_wamr_aot_time / qjs_js_time;
        let formatted_result_aot = ratio_aot.toFixed(2);
        r['mbt aot/qjs'] = formatted_result_aot;
    }

    if (wamr_aot_time && qjs_js_time) {
        let ratio_aot = wamr_aot_time / qjs_js_time;
        let formatted_result_aot = ratio_aot.toFixed(2);
        r['aot/qjs'] = formatted_result_aot;
    }

    if (wamr_interp_time && v8_js_time) {
        let ratio = wamr_interp_time / v8_js_time;
        let formatted_result = ratio.toFixed(2);
        r['WAMR_interpreter/node'] = formatted_result;
    }

    if (wamr_aot_time && v8_js_time) {
        let ratio_aot = wamr_aot_time / v8_js_time;
        let formatted_result_aot = ratio_aot.toFixed(2);
        r['WAMR_aot/node'] = formatted_result_aot;
    }

    if (moonbit_wasm1_time && wamr_interp_time) {
        let ratio_aot = moonbit_wasm1_time / wamr_interp_time;
        let formatted_result_aot = ratio_aot.toFixed(2);
        r['mbt/ts wasm1/interp'] = formatted_result_aot;
    }

    if (moonbit_wasm1_time && moonbit_wamr_interp_time) {
        let ratio_aot = moonbit_wasm1_time / moonbit_wamr_interp_time;
        let formatted_result_aot = ratio_aot.toFixed(2);
        r['mbt wasm1/wasm-gc'] = formatted_result_aot;
    }

    if (moonbit_wasm1_aot_time && moonbit_wamr_aot_time) {
        let ratio_aot = moonbit_wasm1_aot_time / moonbit_wamr_aot_time;
        let formatted_result_aot = ratio_aot.toFixed(2);
        r['mbt wasm1/wasm-gc(aot)'] = formatted_result_aot;
    }

    if (moonbit_wasm1_aot_time && qjs_js_time) {
        let ratio_aot = moonbit_wasm1_aot_time / qjs_js_time;
        let formatted_result_aot = ratio_aot.toFixed(2);
        r['mbt wasm1(aot)/qjs'] = formatted_result_aot;
    }

    if (moonbit_wasm1_time && qjs_js_time) {
        let ratio_aot = moonbit_wasm1_time / qjs_js_time;
        let formatted_result_aot = ratio_aot.toFixed(2);
        r['mbt wasm1/qjs'] = formatted_result_aot;
    }

    results.push(r);
}

console.table(results);