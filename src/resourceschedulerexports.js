'use strict';

self['ResourceScheduler'] = {};
self['ResourceScheduler']['PriorityScheduler'] = PriorityScheduler;
self['ResourceScheduler']['LifoScheduler'] = LifoScheduler;

PriorityScheduler.prototype['shouldYieldOrAbort'] = PriorityScheduler.prototype.shouldYieldOrAbort;
PriorityScheduler.prototype['enqueueJob'] = PriorityScheduler.prototype.enqueueJob;
PriorityScheduler.prototype['tryYield'] = PriorityScheduler.prototype.tryYield;
PriorityScheduler.prototype['jobDone'] = PriorityScheduler.prototype.jobDone;

LifoScheduler.prototype['shouldYieldOrAbort'] = PriorityScheduler.prototype.shouldYieldOrAbort;
LifoScheduler.prototype['enqueueJob'] = LifoScheduler.prototype.enqueueJob;
LifoScheduler.prototype['tryYield'] = LifoScheduler.prototype.tryYield;
LifoScheduler.prototype['jobDone'] = LifoScheduler.prototype.jobDone;
