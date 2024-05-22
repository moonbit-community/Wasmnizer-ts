## Wasmnizer-ts benchmarks

These benchmarks are based on some open source efforts to measure performance of the `ts2wasm compiler`, please refer to below table for license information of every benchmark.

|  benchmark  |  source link  |   license   |
|  :-----:  |  :-----:  | :-----:  |
| binarytrees | [Programming-Language-Benchmarks](https://github.com/hanabi1224/Programming-Language-Benchmarks/blob/main/bench/algorithm/binarytrees/1.ts) | [MIT License](./MIT_LICENSE.txt) |
| mandelbrot | [wasm-mandelbrot](https://github.com/ColinEberhardt/wasm-mandelbrot/blob/master/assemblyscript/mandelbrot.ts) | |
| merkletrees | [Programming-Language-Benchmarks](https://github.com/hanabi1224/Programming-Language-Benchmarks/blob/main/bench/algorithm/merkletrees/1.ts) | [MIT License](./MIT_LICENSE.txt) |
| nbody | [Programming-Language-Benchmarks](https://github.com/hanabi1224/Programming-Language-Benchmarks/blob/main/bench/algorithm/nbody/6.ts) | [MIT License](./MIT_LICENSE.txt) |
| spectral_norm | [The Benchmarks Game](https://benchmarksgame-team.pages.debian.net/benchmarksgame/program/spectralnorm-typescript-1.html) | [3-Clause BSD License](./BSD_LICENSE.txt) |

## Run

1. Prepare runtime environment

- WAMR

    ``` bash
    cd runtime-library
    ./build.sh
    # if you are using macos, run
    # ./build.sh -DWAMR_BUILD_PLATFORM=darwin -DWAMR_BUILD_TARGET=AARCH64
    cd deps/wamr-gc/wamr-compiler
    python3 -m venv env
    source env/bin/activate.fish
    cmake .. -DWAMR_BUILD_PLATFORM=darwin -DWAMR_BUILD_TARGET=AARCH64 -DWAMR_BUILD_WITH_CUSTOM_LLVM=1
    make
    ```

- quickjs

    ``` bash
    cd runtime-library/deps/quickjs
    make
    export PATH=$(pwd):$PATH
    ```

- moonbit

    ``` bash
    /bin/bash -c "$(curl -fsSL https://cli.moonbitlang.cn/mac_m1_moon_setup.sh)"
    ```

2. execute `run_benchmark.js` script

    ``` bash
    cd tests/benchmarks
    node run_benchmark.js
    # run multiple times to get average result
    node run_benchmark.js --times 3
    # run specific benchmark
    node run_benchmark.js --benchmark binarytrees
    # run specific runtime mode
    node run_benchmark.js --runtimes wamr-aot # (wamr-aot | wamr-interp | qjs | node)
    # get result after multiple times warm up
    node run_benchmark.js --warmup 3
    ```

## Validate benchmark result

When writing benchmarks, it is recommended to add verification of the benchmark execution results. One approach is to print `Validate result error when executing [benchmark name]` if the execution result is incorrect. For example, to validate the result of `quicksort`:

```typescript
if (arr[0] !== minimum || arr[size - 1] !== maxinum) {
    console.log('Validate result error when executing quicksort');
}
```

> Note: Currently Wasmnizer-ts is under functionality development, the performance optimization is not on high priority.

---

## MooBit Benchmark Result

```
node run_benchmark.js --benchmarks=mandelbrot,mandelbrot_i32,fibonacci,binarytrees_class,binarytrees_interface,nbody_class,nbody_interface --runtimes=wamr-interp,wamr-aot,moonbit-wamr-interp,moonbit-wamr-aot,qjs,node-wasm,moonbit-node-wasm --warmup=3 --times=10
```

result on Apple M3 Max, 16 (12 performance and 4 efficiency), 128GB:

```
┌─────────┬─────────────────────────┬─────────────┬──────────────┬─────────────┬────────────┬─────────────┬────────────┬─────────────┬────────────────┬─────────────┬─────────────────┬────────────┬────────────────┬─────────────┬─────────┐
│ (index) │ benchmark               │ interp      │ aot          │ qjs         │ v8 wasm    │ mbt interp  │ mbt aot    │ mbt v8 wasm │ mbt/ts(interp) │ mbt/ts(aot) │ mbt/ts(v8 wasm) │ interp/qjs │ mbt interp/qjs │ mbt aot/qjs │ aot/qjs │
├─────────┼─────────────────────────┼─────────────┼──────────────┼─────────────┼────────────┼─────────────┼────────────┼─────────────┼────────────────┼─────────────┼─────────────────┼────────────┼────────────────┼─────────────┼─────────┤
│ 0       │ 'binarytrees_class'     │ '395.14ms'  │ '160.29ms'   │ '680.55ms'  │ '52.21ms'  │ '307.22ms'  │ '149.70ms' │ '47.40ms'   │ '0.78'         │ '0.93'      │ '0.91'          │ '0.58'     │ '0.45'         │ '0.22'      │ '0.24'  │
│ 1       │ 'binarytrees_interface' │ '2049.92ms' │ '594.33ms'   │ '505.68ms'  │            │ '308.74ms'  │ '149.40ms' │ '46.71ms'   │ '0.15'         │ '0.25'      │                 │ '4.05'     │ '0.61'         │ '0.30'      │ '1.18'  │
│ 2       │ 'fibonacci'             │ '503.80ms'  │ '110.86ms'   │ '574.38ms'  │ '65.86ms'  │ '521.54ms'  │ '100.36ms' │ '83.62ms'   │ '1.04'         │ '0.91'      │ '1.27'          │ '0.88'     │ '0.91'         │ '0.17'      │ '0.19'  │
│ 3       │ 'mandelbrot'            │ '2092.55ms' │ '445.19ms'   │ '6725.73ms' │ '791.48ms' │ '2030.03ms' │ '421.00ms' │ '785.97ms'  │ '0.97'         │ '0.95'      │ '0.99'          │ '0.31'     │ '0.30'         │ '0.06'      │ '0.07'  │
│ 4       │ 'mandelbrot_i32'        │ '2207.94ms' │ '28505.02ms' │ '6783.39ms' │ '795.46ms' │ '2031.14ms' │ '422.13ms' │ '812.28ms'  │ '0.92'         │ '0.01'      │ '1.02'          │ '0.33'     │ '0.30'         │ '0.06'      │ '4.20'  │
│ 5       │ 'nbody_class'           │ '1231.77ms' │ '71.97ms'    │ '2081.94ms' │ '139.07ms' │ '1122.48ms' │            │ '110.10ms'  │ '0.91'         │             │ '0.79'          │ '0.59'     │ '0.54'         │             │ '0.03'  │
│ 6       │ 'nbody_interface'       │ '4526.38ms' │              │ '2103.06ms' │ '327.14ms' │ '1125.86ms' │            │ '111.98ms'  │ '0.25'         │             │ '0.34'          │ '2.15'     │ '0.54'         │             │         │
└─────────┴─────────────────────────┴─────────────┴──────────────┴─────────────┴────────────┴─────────────┴────────────┴─────────────┴────────────────┴─────────────┴─────────────────┴────────────┴────────────────┴─────────────┴─────────┘
```

The performance gap in v8 wasm may be related to this issue: https://issues.chromium.org/issues/340987659