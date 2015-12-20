# ResourceScheduler.js
ResourceScheduler.js is a Javascript library for tasks scheduling. Useful for sue-cases of tasks that require a lot of resource like CPU, network bandwidth, etc.
The library is espacially useful for tasks which can be prioritized.

# Documentation and Demo
Can be found here:
<TBD>

# Compilation
The library was compiled using Google Closure Compiler:

```
cd src
java -jar closure_compiler.jar --js lifoscheduler.js --js linkedlist.js --js priorityscheduler.js --js resourceschedulerexports.js --js_output_file ..\resourcescheduler.js --compilation_level ADVANCED_OPTIMIZATIONS
java -jar closure_compiler.jar --js lifoscheduler.js --js linkedlist.js --js priorityscheduler.js --js resourceschedulerexports.js --js_output_file ..\resourcescheduler.debug.js --compilation_level WHITESPACE_ONLY
```

# License
This library is distributed under Apache 2.0 license.
