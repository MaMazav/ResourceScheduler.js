var LifoScheduler=function LifoSchedulerClosure(){function LifoScheduler(createResource,jobsLimit){this._resourceCreator=createResource;this._jobsLimit=jobsLimit;this._freeResourcesCount=this._jobsLimit;this._freeResources=new Array(this._jobsLimit);this._pendingJobs=[]}LifoScheduler.prototype={enqueueJob:function enqueueJob(jobFunc,jobContext){if(this._freeResourcesCount>0){--this._freeResourcesCount;var resource=this._freeResources.pop();if(resource===undefined)resource=this._resourceCreator();
jobFunc(resource,jobContext)}else this._pendingJobs.push({jobFunc:jobFunc,jobContext:jobContext})},jobDone:function jobDone(resource){if(this._pendingJobs.length>0){var nextJob=this._pendingJobs.pop();nextJob.jobFunc(resource,nextJob.jobContext)}else{this._freeResources.push(resource);++this._freeResourcesCount}},shouldYieldOrAbort:function shouldYieldOrAbort(jobContext){return false},tryYield:function yieldResource(jobFunc,jobContext,resource){return false}};return LifoScheduler}();var LinkedList=function LinkedListClosure(){function LinkedList(){this._first={_prev:null,_parent:this};this._last={_next:null,_parent:this};this._count=0;this._last._prev=this._first;this._first._next=this._last}LinkedList.prototype.add=function add(value,addBefore){if(addBefore===null||addBefore===undefined)addBefore=this._last;this._validateIteratorOfThis(addBefore);++this._count;var newNode={_value:value,_next:addBefore,_prev:addBefore._prev,_parent:this};newNode._prev._next=newNode;addBefore._prev=
newNode;return newNode};LinkedList.prototype.remove=function remove(iterator){this._validateIteratorOfThis(iterator);--this._count;iterator._prev._next=iterator._next;iterator._next._prev=iterator._prev;iterator._parent=null};LinkedList.prototype.getValue=function getValue(iterator){this._validateIteratorOfThis(iterator);return iterator._value};LinkedList.prototype.getFirstIterator=function getFirstIterator(){var iterator=this.getNextIterator(this._first);return iterator};LinkedList.prototype.getLastIterator=
function getFirstIterator(){var iterator=this.getPrevIterator(this._last);return iterator};LinkedList.prototype.getNextIterator=function getNextIterator(iterator){this._validateIteratorOfThis(iterator);if(iterator._next===this._last)return null;return iterator._next};LinkedList.prototype.getPrevIterator=function getPrevIterator(iterator){this._validateIteratorOfThis(iterator);if(iterator._prev===this._first)return null;return iterator._prev};LinkedList.prototype.getCount=function getCount(){return this._count};
LinkedList.prototype._validateIteratorOfThis=function validateIteratorOfThis(iterator){if(iterator._parent!==this)throw"iterator must be of the current LinkedList";};return LinkedList}();var PriorityScheduler=function PrioritySchedulerClosure(){function PriorityScheduler(createResource,jobsLimit,prioritizer,options){options=options||{};this._resourceCreator=createResource;this._jobsLimit=jobsLimit;this._prioritizer=prioritizer;this._showLog=options["showLog"];this._schedulerName=options["schedulerName"];this._numNewJobs=options["numNewJobs"]||20;this._numJobsBeforeRerankOldPriorities=options["numJobsBeforeRerankOldPriorities"]||20;this._freeResourcesCount=this._jobsLimit;this._freeResources=
new Array(this._jobsLimit);this._resourcesGuaranteedForHighPriority=options["resourcesGuaranteedForHighPriority"]||0;this._highPriorityToGuaranteeResource=options["highPriorityToGuaranteeResource"]||0;this._logCallIndentPrefix=">";this._pendingJobsCount=0;this._oldPendingJobsByPriority=[];this._newPendingJobsLinkedList=new LinkedList;this._schedulesCounter=0}PriorityScheduler.prototype={enqueueJob:function enqueueJob(jobFunc,jobContext,jobAbortedFunc){log(this,"enqueueJob() start",+1);var priority=
this._prioritizer["getPriority"](jobContext);if(priority<0){jobAbortedFunc(jobContext);log(this,"enqueueJob() end: job aborted",-1);return}var job={jobFunc:jobFunc,jobAbortedFunc:jobAbortedFunc,jobContext:jobContext};var minPriority=getMinimalPriorityToSchedule(this);var resource=null;if(priority>=minPriority)resource=tryGetFreeResource(this);if(resource!==null){schedule(this,job,resource);log(this,"enqueueJob() end: job scheduled",-1);return}enqueueNewJob(this,job,priority);ensurePendingJobsCount(this);
log(this,"enqueueJob() end: job pending",-1)},jobDone:function jobDone(resource,jobContext){if(this._showLog){var priority=this._prioritizer["getPriority"](jobContext);log(this,"jobDone() start: job done of priority "+priority,+1)}resourceFreed(this,resource);ensurePendingJobsCount(this);log(this,"jobDone() end",-1)},shouldYieldOrAbort:function shouldYieldOrAbort(jobContext){log(this,"shouldYieldOrAbort() start",+1);var priority=this._prioritizer["getPriority"](jobContext);var result=priority<0||
hasNewJobWithHigherPriority(this,priority);log(this,"shouldYieldOrAbort() end",-1);return result},tryYield:function tryYield(jobContinueFunc,jobContext,jobAbortedFunc,jobYieldedFunc,resource){log(this,"tryYield() start",+1);var priority=this._prioritizer["getPriority"](jobContext);if(priority<0){jobAbortedFunc(jobContext);resourceFreed(this,resource);log(this,"tryYield() end: job aborted",-1);return true}var higherPriorityJob=tryDequeueNewJobWithHigherPriority(this,priority);ensurePendingJobsCount(this);
if(higherPriorityJob===null){log(this,"tryYield() end: job continues",-1);return false}jobYieldedFunc(jobContext);var job={jobFunc:jobContinueFunc,jobAbortedFunc:jobAbortedFunc,jobContext:jobContext};enqueueNewJob(this,job,priority);ensurePendingJobsCount(this);schedule(this,higherPriorityJob,resource);ensurePendingJobsCount(this);log(this,"tryYield() end: job yielded",-1);return true}};function hasNewJobWithHigherPriority(self,lowPriority){var currentNode=self._newPendingJobsLinkedList.getFirstIterator();
log(self,"hasNewJobWithHigherPriority() start",+1);while(currentNode!==null){var nextNode=self._newPendingJobsLinkedList.getNextIterator(currentNode);var job=self._newPendingJobsLinkedList.getValue(currentNode);var priority=self._prioritizer["getPriority"](job.jobContext);if(priority<0){extractJobFromLinkedList(self,currentNode);--self._pendingJobsCount;job.jobAbortedFunc(job.jobContext);currentNode=nextNode;continue}if(priority>lowPriority){log(self,"hasNewJobWithHigherPriority() end: returns true",
-1);return true}currentNode=nextNode}log(self,"hasNewJobWithHigherPriority() end: returns false",-1);return false}function tryDequeueNewJobWithHigherPriority(self,lowPriority){log(self,"tryDequeueNewJobWithHigherPriority() start",+1);var jobToScheduleNode=null;var highestPriorityFound=lowPriority;var countedPriorities=[];var currentNode=self._newPendingJobsLinkedList.getFirstIterator();while(currentNode!==null){var nextNode=self._newPendingJobsLinkedList.getNextIterator(currentNode);var job=self._newPendingJobsLinkedList.getValue(currentNode);
var priority=self._prioritizer["getPriority"](job.jobContext);if(priority<0){extractJobFromLinkedList(self,currentNode);--self._pendingJobsCount;job.jobAbortedFunc(job.jobContext);currentNode=nextNode;continue}if(highestPriorityFound===undefined||priority>highestPriorityFound){highestPriorityFound=priority;jobToScheduleNode=currentNode}if(!self._showLog){currentNode=nextNode;continue}if(countedPriorities[priority]===undefined)countedPriorities[priority]=1;else++countedPriorities[priority];currentNode=
nextNode}var jobToSchedule=null;if(jobToScheduleNode!==null){jobToSchedule=extractJobFromLinkedList(self,jobToScheduleNode);--self._pendingJobsCount}if(self._showLog){var jobsListMessage="tryDequeueNewJobWithHigherPriority(): Jobs list:";for(var i=0;i<countedPriorities.length;++i)if(countedPriorities[i]!==undefined)jobsListMessage+=countedPriorities[i]+" jobs of priority "+i+";";log(self,jobsListMessage);if(jobToSchedule!==null)log(self,"tryDequeueNewJobWithHigherPriority(): dequeued new job of priority "+
highestPriorityFound)}ensurePendingJobsCount(self);log(self,"tryDequeueNewJobWithHigherPriority() end",-1);return jobToSchedule}function tryGetFreeResource(self){log(self,"tryGetFreeResource() start",+1);if(self._freeResourcesCount===0)return null;--self._freeResourcesCount;var resource=self._freeResources.pop();if(resource===undefined)resource=self._resourceCreator();ensurePendingJobsCount(self);log(self,"tryGetFreeResource() end",-1);return resource}function enqueueNewJob(self,job,priority){log(self,
"enqueueNewJob() start",+1);++self._pendingJobsCount;var firstIterator=self._newPendingJobsLinkedList.getFirstIterator();addJobToLinkedList(self,job,firstIterator);if(self._showLog)log(self,"enqueueNewJob(): enqueued job of priority "+priority);if(self._newPendingJobsLinkedList.getCount()<=self._numNewJobs){ensurePendingJobsCount(self);log(self,"enqueueNewJob() end: _newPendingJobsLinkedList is small enough",-1);return}var lastIterator=self._newPendingJobsLinkedList.getLastIterator();var oldJob=extractJobFromLinkedList(self,
lastIterator);enqueueOldJob(self,oldJob);ensurePendingJobsCount(self);log(self,"enqueueNewJob() end: One job moved from new job list to old job list",-1)}function enqueueOldJob(self,job){log(self,"enqueueOldJob() start",+1);var priority=self._prioritizer["getPriority"](job.jobContext);if(priority<0){--self._pendingJobsCount;job.jobAbortedFunc(job.jobContext);log(self,"enqueueOldJob() end: job aborted",-1);return}if(self._oldPendingJobsByPriority[priority]===undefined)self._oldPendingJobsByPriority[priority]=
[];self._oldPendingJobsByPriority[priority].push(job);log(self,"enqueueOldJob() end: job enqueued to old job list",-1)}function rerankPriorities(self){log(self,"rerankPriorities() start",+1);var originalOldsArray=self._oldPendingJobsByPriority;var originalNewsList=self._newPendingJobsLinkedList;if(originalOldsArray.length===0){log(self,"rerankPriorities() end: no need to rerank",-1);return}self._oldPendingJobsByPriority=[];self._newPendingJobsLinkedList=new LinkedList;for(var i=0;i<originalOldsArray.length;++i){if(originalOldsArray[i]===
undefined)continue;for(var j=0;j<originalOldsArray[i].length;++j)enqueueOldJob(self,originalOldsArray[i][j])}var iterator=originalNewsList.getFirstIterator();while(iterator!==null){var value=originalNewsList.getValue(iterator);enqueueOldJob(self,value);iterator=originalNewsList.getNextIterator(iterator)}var message="rerankPriorities(): ";for(var i=self._oldPendingJobsByPriority.length-1;i>=0;--i){var highPriorityJobs=self._oldPendingJobsByPriority[i];if(highPriorityJobs===undefined)continue;if(self._showLog)message+=
highPriorityJobs.length+" jobs in priority "+i+";";while(highPriorityJobs.length>0&&self._newPendingJobsLinkedList.getCount()<self._numNewJobs){var job=highPriorityJobs.pop();addJobToLinkedList(self,job)}if(self._newPendingJobsLinkedList.getCount()>=self._numNewJobs&&!self._showLog)break}if(self._showLog)log(self,message);ensurePendingJobsCount(self);log(self,"rerankPriorities() end: rerank done",-1)}function resourceFreed(self,resource){log(self,"resourceFreed() start",+1);++self._freeResourcesCount;
var minPriority=getMinimalPriorityToSchedule(self);--self._freeResourcesCount;var job=tryDequeueNewJobWithHigherPriority(self,minPriority);if(job!==null){ensurePendingJobsCount(self);schedule(self,job,resource);ensurePendingJobsCount(self);log(self,"resourceFreed() end: new job scheduled",-1);return}var hasOldJobs=self._pendingJobsCount>self._newPendingJobsLinkedList.getCount();if(!hasOldJobs){self._freeResources.push(resource);++self._freeResourcesCount;ensurePendingJobsCount(self);log(self,"resourceFreed() end: no job to schedule",
-1);return}var numPriorities=self._oldPendingJobsByPriority.length;var jobPriority;for(var priority=numPriorities-1;priority>=0;--priority){var jobs=self._oldPendingJobsByPriority[priority];if(jobs===undefined||jobs.length===0)continue;for(var i=jobs.length-1;i>=0;--i){job=jobs[i];jobPriority=self._prioritizer["getPriority"](job.jobContext);if(jobPriority>=priority){jobs.length=i;break}else if(jobPriority<0){--self._pendingJobsCount;job.jobAbortedFunc(job.jobContext)}else{if(self._oldPendingJobsByPriority[jobPriority]===
undefined)self._oldPendingJobsByPriority[jobPriority]=[];self._oldPendingJobsByPriority[jobPriority].push(job)}job=null}if(job!==null)break;jobs.length=0}if(job===null){self._freeResources.push(resource);++self._freeResourcesCount;ensurePendingJobsCount(self);log(self,"resourceFreed() end: no non-aborted job to schedule",-1);return}if(self._showLog)log(self,"resourceFreed(): dequeued old job of priority "+jobPriority);--self._pendingJobsCount;ensurePendingJobsCount(self);schedule(self,job,resource);
ensurePendingJobsCount(self);log(self,"resourceFreed() end: job scheduled",-1)}function schedule(self,job,resource){log(self,"schedule() start",+1);++self._schedulesCounter;if(self._schedulesCounter>=self._numJobsBeforeRerankOldPriorities){self._schedulesCounter=0;rerankPriorities(self)}if(self._showLog){var priority=self._prioritizer["getPriority"](job.jobContext);log(self,"schedule(): scheduled job of priority "+priority)}job.jobFunc(resource,job.jobContext);log(self,"schedule() end",-1)}function addJobToLinkedList(self,
job,addBefore){log(self,"addJobToLinkedList() start",+1);self._newPendingJobsLinkedList.add(job,addBefore);ensureNumberOfNodes(self);log(self,"addJobToLinkedList() end",-1)}function extractJobFromLinkedList(self,iterator){log(self,"extractJobFromLinkedList() start",+1);var value=self._newPendingJobsLinkedList.getValue(iterator);self._newPendingJobsLinkedList.remove(iterator);ensureNumberOfNodes(self);log(self,"extractJobFromLinkedList() end",-1);return value}function ensureNumberOfNodes(self){if(!self._showLog)return;
log(self,"ensureNumberOfNodes() start",+1);var iterator=self._newPendingJobsLinkedList.getFirstIterator();var expectedCount=0;while(iterator!==null){++expectedCount;iterator=self._newPendingJobsLinkedList.getNextIterator(iterator)}if(expectedCount!==self._newPendingJobsLinkedList.getCount())throw"Unexpected count of new jobs";log(self,"ensureNumberOfNodes() end",-1)}function ensurePendingJobsCount(self){if(!self._showLog)return;log(self,"ensurePendingJobsCount() start",+1);var oldJobsCount=0;for(var i=
0;i<self._oldPendingJobsByPriority.length;++i){var jobs=self._oldPendingJobsByPriority[i];if(jobs!==undefined)oldJobsCount+=jobs.length}var expectedCount=oldJobsCount+self._newPendingJobsLinkedList.getCount();if(expectedCount!==self._pendingJobsCount)throw"Unexpected count of jobs";log(self,"ensurePendingJobsCount() end",-1)}function getMinimalPriorityToSchedule(self){log(self,"getMinimalPriorityToSchedule() start",+1);if(self._freeResourcesCount<=self._resourcesGuaranteedForHighPriority){log(self,
"getMinimalPriorityToSchedule() end: guarantee resource for high priority is needed",-1);return self._highPriorityToGuaranteeResources}log(self,"getMinimalPriorityToSchedule() end: enough resources, no need to guarantee resource for high priority",-1);return 0}function log(self,msg,addIndent){if(!self._showLog)return;if(addIndent===-1)self._logCallIndentPrefix=self._logCallIndentPrefix.substr(1);if(self._schedulerName!==undefined)console.log(self._logCallIndentPrefix+"PriorityScheduler "+self._schedulerName+
": "+msg);else console.log(self._logCallIndentPrefix+"PriorityScheduler: "+msg);if(addIndent===1)self._logCallIndentPrefix+=">"}return PriorityScheduler}();self["ResourceScheduler"]={};self["ResourceScheduler"]["PriorityScheduler"]=PriorityScheduler;self["ResourceScheduler"]["LifoScheduler"]=LifoScheduler;PriorityScheduler.prototype["shouldYieldOrAbort"]=PriorityScheduler.prototype.shouldYieldOrAbort;PriorityScheduler.prototype["enqueueJob"]=PriorityScheduler.prototype.enqueueJob;PriorityScheduler.prototype["tryYield"]=PriorityScheduler.prototype.tryYield;PriorityScheduler.prototype["jobDone"]=PriorityScheduler.prototype.jobDone;
LifoScheduler.prototype["shouldYieldOrAbort"]=LifoScheduler.prototype.shouldYieldOrAbort;LifoScheduler.prototype["enqueueJob"]=LifoScheduler.prototype.enqueueJob;LifoScheduler.prototype["tryYield"]=LifoScheduler.prototype.tryYield;LifoScheduler.prototype["jobDone"]=LifoScheduler.prototype.jobDone;