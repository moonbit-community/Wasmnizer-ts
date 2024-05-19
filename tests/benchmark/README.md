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
node run_benchmark.js --benchmarks=mandelbrot,mandelbrot_i32,fibonacci,binarytrees_class,binarytrees_interface,nbody_class,nbody_interface --runtimes=wamr-interp,wamr-aot,moonbit-wamr-interp,moonbit-wamr-aot --warmup=3 --times=10
```

result on Apple M3 Max, 16 (12 performance and 4 efficiency), 128GB:

```
====================== results ======================
┌─────────┬─────────────────────────┬─────────────┬──────────────┬─────────────┬────────────┬────────────────┬─────────────┐
│ (index) │ benchmark               │ interp      │ aot          │ mbt interp  │ mbt aot    │ mbt/ts(interp) │ mbt/ts(aot) │
├─────────┼─────────────────────────┼─────────────┼──────────────┼─────────────┼────────────┼────────────────┼─────────────┤
│ 0       │ 'binarytrees_class'     │ '403.04ms'  │ '161.04ms'   │ '306.96ms'  │ '154.60ms' │ '0.76'         │ '0.96'      │
│ 1       │ 'binarytrees_interface' │ '2113.18ms' │ '598.02ms'   │ '311.12ms'  │ '157.24ms' │ '0.15'         │ '0.26'      │
│ 2       │ 'fibonacci'             │ '515.42ms'  │ '115.79ms'   │ '538.94ms'  │ '103.65ms' │ '1.05'         │ '0.90'      │
│ 3       │ 'mandelbrot'            │ '2141.25ms' │ '481.71ms'   │ '2057.80ms' │ '470.01ms' │ '0.96'         │ '0.98'      │
│ 4       │ 'mandelbrot_i32'        │ '2196.66ms' │ '30444.61ms' │ '2199.79ms' │ '498.73ms' │ '1.00'         │ '0.02'      │
│ 5       │ 'nbody_class'           │ '1321.58ms' │ '77.50ms'    │ '1182.86ms' │            │ '0.90'         │             │
│ 6       │ 'nbody_interface'       │ '4815.03ms' │              │ '1185.96ms' │            │ '0.25'         │             │
└─────────┴─────────────────────────┴─────────────┴──────────────┴─────────────┴────────────┴────────────────┴─────────────┘
```