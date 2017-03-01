'use strict';

self['ResourceScheduler'] = {};
self['ResourceScheduler']['PriorityScheduler'] = PriorityScheduler;
self['ResourceScheduler']['LifoScheduler'] = LifoScheduler;

PriorityScheduler.prototype['enqueueJob'] = PriorityScheduler.prototype.enqueueJob;

LifoScheduler.prototype['enqueueJob'] = LifoScheduler.prototype.enqueueJob;
