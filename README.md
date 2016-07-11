# resource-scheduler.js
resource-scheduler.js is a Javascript library for tasks scheduling. Useful for sue-cases of tasks that require a lot of resource like CPU, network bandwidth, etc.
The library is espacially useful for tasks which can be prioritized.

# Documentation
Can be found here:
http://mamazav.github.io/resource-scheduler.js

# Compilation
The library was compiled using Google Closure Compiler:

```
cd src
java -jar closure_compiler.jar --js lifo-scheduler.js --js linked-list.js --js priority-scheduler.js --js resource-scheduler-exports.js --js_output_file ..\resource-scheduler.dev.js --compilation_level ADVANCED_OPTIMIZATIONS
java -jar closure_compiler.jar --js lifo-scheduler.js --js linked-list.js --js priority-scheduler.js --js resource-scheduler-exports.js --js_output_file ..\resource-scheduler.dev.debug.js --compilation_level WHITESPACE_ONLY
```

# License
This library is distributed under Apache 2.0 license.
