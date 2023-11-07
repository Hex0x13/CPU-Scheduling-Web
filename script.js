const selectProcessType = document.querySelector("#process-type");
const numOfProcess = document.querySelector("#num-of-process");
const startProcessBtn = document.querySelector(".start-process-btn");
const resultTable = document.querySelector(".result-table");
const inputTable = document.querySelector(".table-input");
const ganttChart = document.querySelector(".gantt-chart");
const processInputClass = 'process-input';
const priorityInputClass = 'priotity-input';
let ganttChartList = null;
let processListResult = null;

numOfProcess.addEventListener("change", createProcessInput);
selectProcessType.addEventListener("change", createProcessInput);
startProcessBtn.onclick = startProcess;

class NonPreemptiveProcess {
    constructor(pid, arrivalTime, burstTime) {
        this.pid = pid;
        this.arrivalTime = arrivalTime;
        this.burstTime = burstTime;
        this.startTime = 0;
        this.endTime = 0;
        this.remainingTime = burstTime;
    }

    waitingTime() {
        return +this.startTime - +this.arrivalTime;
    }

    turnaroundTime() {
        return this.waitingTime() + +this.burstTime;
    }
}

class PreemptiveProcess {
    constructor(pid, arrivalTime, burstTime) {
        this.pid = pid;
        this.arrivalTime = arrivalTime;
        this.burstTime = burstTime;
        this._startTime = [];
        this._endTime = [];
        this.remainingTime = burstTime;
        this._startTimeIndex = 0;
        this._endTimeIndex = 0;
    }

    addStartTime(time) {
        this._startTime.push(time);
    }

    addEndTime(time) {
        this._endTime.push(time);
    }

    waitingTime() {
        let result = 0;
        const arrivalTimelist = [this.arrivalTime, ...this._endTime];
        this._startTime.forEach((startTime, i) => {
            result += +startTime - +arrivalTimelist[i];
        });
        return result;
    }

    turnaroundTime() {
        return this.waitingTime() + +this.burstTime;
    }

    getStartTime(index = null) {
        if (index !== null && index < this._startTime.length) {
            if (index < 0) {
                return this._startTime[this._startTime.length + index];
            }
            return this._startTime[index];
        } else {
            const starttime = this._startTime[this._startTimeIndex];
            if (this._startTimeIndex >= this._startTime.length) {
                this._startTimeIndex = 0;
            }
            this._startTimeIndex++;
            return starttime;
        }
    }

    getEndTime(index = null) {
        if (index !== null && index < this._endTime.length) {
            if (index < 0) {
                return this._endTime[this._endTime.length + index];
            }
            return this._endTime[index];
        } else {
            const endtime = this._endTime[this._endTimeIndex];
            if (this._endTimeIndex >= this._endTime.length) {
                this._endTimeIndex = 0;
            }
            this._endTimeIndex++;
            return endtime;
        }
    }

    resetIndices() {
        this._startTimeIndex = 0;
        this._endTimeIndex = 0;
    }
}

function inputProcess(rows) {
    ['PID', 'Arrival Time', 'Burst Time'].forEach((info) => {
        const child = document.createElement('div');
        child.textContent = info;
        inputTable.appendChild(child);
    });
    for (let i = 0; i < rows; i++) {
        const pid = document.createElement('div');
        const arrivalTimeInput = document.createElement('input');
        const burstTimeInput = document.createElement('input');
        arrivalTimeInput.setAttribute('type', 'number');
        burstTimeInput.setAttribute('type', 'number');
        pid.textContent = `P${i + 1}`;
        arrivalTimeInput.classList.add(processInputClass);
        burstTimeInput.classList.add(processInputClass);

        inputTable.appendChild(pid);
        inputTable.appendChild(arrivalTimeInput);
        inputTable.appendChild(burstTimeInput);
    }

}

function roundRobinProcessInput(rows) {
    inputProcess(rows);
    const quantumTimeLabel = document.createElement('label');
    const quantumTimeInput = document.createElement('input');
    quantumTimeLabel.textContent = 'Quantum Time: ';
    quantumTimeLabel.setAttribute('for', 'quantum-time-input')
    quantumTimeInput.setAttribute('type', 'number');
    quantumTimeInput.id = 'quantum-time-input';
    inputTable.appendChild(quantumTimeLabel);
    inputTable.appendChild(quantumTimeInput);
}

function priotitySchedInput(rows) {
    ['PID', 'Arrival Time', 'Burst Time', 'Priority'].forEach((info) => {
        const child = document.createElement('div');
        child.textContent = info;
        inputTable.appendChild(child);
    });
    for (let i = 0; i < rows; i++) {
        const pid = document.createElement('div');
        const arrivalTimeInput = document.createElement('input');
        const burstTimeInput = document.createElement('input');
        const priorityInput = document.createElement('input');
        arrivalTimeInput.setAttribute('type', 'number');
        burstTimeInput.setAttribute('type', 'number');
        priorityInput.setAttribute('type', 'number');
        pid.textContent = `P${i + 1}`;
        arrivalTimeInput.classList.add(processInputClass);
        burstTimeInput.classList.add(processInputClass);
        priorityInput.classList.add(priorityInputClass);

        inputTable.appendChild(pid);
        inputTable.appendChild(arrivalTimeInput);
        inputTable.appendChild(burstTimeInput);
        inputTable.appendChild(priorityInput);
    }
}

function createProcessInput() {
    inputTable.innerHTML = '';
    const processType = selectProcessType.value;
    if (processType === 'RoundRobin') {
        inputTable.classList.remove('four-col');
        inputTable.style.gridTemplateColumns = 'repeat(3, 1fr)';
        roundRobinProcessInput(+numOfProcess.value);
    } else if (processType == 'NonPreempPriority' || processType == 'PreempPriority') {
        inputTable.classList.add('four-col');
        inputTable.style.gridTemplateColumns = 'repeat(4, 1fr)';
        priotitySchedInput(+numOfProcess.value);
    } else {
        inputTable.classList.remove('four-col');
        inputTable.style.gridTemplateColumns = 'repeat(3, 1fr)';
        inputProcess(parseInt(+numOfProcess.value));
    }
}

function fcfsAlogirthm(processList) {
    processList.sort((p1, p2) => p1.arrivalTime - p2.arrivalTime);
    let ready_queue = [];
    let time = 0;
    let idle = null;
    let top = null;
    while (ready_queue.length > 0 || processList.length > 0) {
        while (processList.length > 0 && processList[0].arrivalTime <= time) {
            if (idle) {
                idle.endTime = time;
                ganttChartList.push(idle);
                idle = null;
            }
            ready_queue.push(processList.shift());
        }
        if (ready_queue.length > 0) {
            top = ready_queue.shift();
            top.startTime = time;
            ganttChartList.push(top);
            while (top.remainingTime > 0) {
                time += 1;
                top.remainingTime -= 1;
                while (processList.length > 0 && processList[0].arrivalTime <= time) {
                    ready_queue.push(processList.shift());
                }
            }
            top.endTime = time;
            processListResult.push(top);
        } else {
            if (!idle) {
                idle = new NonPreemptiveProcess(' ', 0, 0);
                idle.startTime = time;
            }
            time += 1;
        }
    }
}

function sjfAlgorithm(processList) {
    processList.sort((p1, p2) => p1.arrivalTime - p2.arrivalTime);
    let ready_queue = new Heap((a, b) => a.burstTime - b.burstTime);
    let time = 0;
    let idle = null;
    let top = null;
    while (!ready_queue.isEmpty() || processList.length > 0) {
        while (processList.length > 0 && processList[0].arrivalTime <= time) {
            if (idle) {
                idle.endTime = time;
                ganttChartList.push(idle);
                idle = null;
            }
            ready_queue.offer(processList.shift());
        }
        if (!ready_queue.isEmpty()) {
            top = ready_queue.poll();
            top.startTime = time;
            ganttChartList.push(top);
            while (top.remainingTime > 0) {
                time += 1;
                top.remainingTime -= 1;
                while (processList.length > 0 && processList[0].arrivalTime <= time) {
                    ready_queue.offer(processList.shift());
                }
            }
            top.endTime = time;
            processListResult.push(top);
        } else {
            if (!idle) {
                idle = new NonPreemptiveProcess(' ', 0, 0);
                idle.startTime = time;
            }
            time += 1;
        }
    }
}

function srtfAlgorithm(processList) {
    processList.sort((p1, p2) => p1.arrivalTime - p2.arrivalTime);
    let ready_queue = new Heap((a, b) => {
        let r = a.remainingTime - b.remainingTime;
        if (r === 0) {
            return a.arrivalTime - b.arrivalTime;
        }
        return r;
    });
    let time = 0;
    let idle = null;
    let top = null;
    let temp = null;
    while (!ready_queue.isEmpty() || processList.length > 0) {
        while (processList.length > 0 && processList[0].arrivalTime <= time) {
            if (idle) {
                idle.addEndTime(time);
                ganttChartList.push(idle);
                idle = null;
            }
            ready_queue.offer(processList.shift());
        }
        if (!ready_queue.isEmpty()) {
            top = ready_queue.poll();
            top.addStartTime(time);
            ganttChartList.push(top);
            while (top.remainingTime > 0) {
                time += 1;
                top.remainingTime -= 1;
                while (processList.length > 0 && processList[0].arrivalTime <= time) {
                    ready_queue.offer(processList.shift());
                }
                if (!ready_queue.isEmpty()) {
                    temp = ready_queue.poll();
                    if (temp.remainingTime < top.remainingTime) {
                        top.addEndTime(time);
                        ready_queue.offer(top);
                        top = temp;
                        top.addStartTime(time);
                        ganttChartList.push(top);
                    } else {
                        ready_queue.offer(temp);
                    }
                }
            }
            top.addEndTime(time);
            processListResult.push(top);
        } else {
            if (!idle) {
                idle = new PreemptiveProcess(' ', 0, 0);
                idle.addStartTime(time);
            }
            time += 1;
        }
    }
}

function roundRobinAlgorithm(processList, quantumTime) {
    processList.sort((p1, p2) => p1.arrivalTime - p2.arrivalTime);
    let ready_queue = [];
    let time = 0;
    let idle = null;
    let top = null;
    while (ready_queue.length > 0 || processList.length > 0) {
        while (processList.length > 0 && processList[0].arrivalTime <= time) {
            if (idle) {
                idle.addEndTime(time);
                ganttChartList.push(idle);
                idle = null;
            }
            ready_queue.push(processList.shift());
        }
        if (ready_queue.length > 0) {
            top = ready_queue.shift();
            top.addStartTime(time);
            ganttChartList.push(top);
            const remainingQuantum = Math.min(quantumTime, top.remainingTime);
            for (let i = 0; i < remainingQuantum; i++) {
                time += 1;
                top.remainingTime -= 1;
                while (processList.length > 0 && processList[0].arrivalTime <= time) {
                    ready_queue.push(processList.shift());
                }
            }
            if (top.remainingTime > 0) {
                top.addEndTime(time);
                ready_queue.push(top);
            } else {
                top.addEndTime(time);
                processListResult.push(top);
            }

        } else {
            if (!idle) {
                idle = new PreemptiveProcess(' ', 0, 0);
                idle.addStartTime(time);
            }
            time += 1;
        }
    }
}

function nonPreempPriorityAlgorithm(processList) {
    processList.sort((p1, p2) => p1.arrivalTime - p2.arrivalTime);
    let ready_queue = new Heap((a, b) => {
        console.log(a, b);
        if (a.priority === b.priority) {
            return a.arrivalTime - b.arrivalTime;
        }
        return a.priority - b.priority;
    });
    let time = 0;
    let idle = null;
    let top = null;
    while (!ready_queue.isEmpty() || processList.length > 0) {
        while (processList.length > 0 && processList[0].arrivalTime <= time) {
            if (idle) {
                idle.endTime = time;
                ganttChartList.push(idle);
                idle = null;
            }
            ready_queue.offer(processList.shift());
        }
        if (!ready_queue.isEmpty()) {
            top = ready_queue.poll();
            top.startTime = time;
            ganttChartList.push(top);
            while (top.remainingTime > 0) {
                while (processList.length > 0 && processList[0].arrivalTime <= time) {
                    ready_queue.offer(processList.shift());
                }
                time += 1;
                top.remainingTime -= 1;
            }
            top.endTime = time;
            processListResult.push(top);
        } else {
            if (!idle) {
                idle = new NonPreemptiveProcess(' ', 0, 0);
                idle.startTime = time;
            }
            time += 1;
        }
    }
}

function preempPriorityAlgorithm(processList) {
    processList.sort((p1, p2) => p1.arrivalTime - p2.arrivalTime);
    let ready_queue = new Heap((a, b) => {
        let r = a.priority - b.priority;
        if (r === 0) {
            return a.arrivalTime - b.arrivalTime;
        }
        return r;
    });
    let time = 0;
    let idle = null;
    let top = null;
    let temp = null;
    while (!ready_queue.isEmpty() || processList.length > 0) {
        while (processList.length > 0 && processList[0].arrivalTime <= time) {
            if (idle) {
                idle.addEndTime(time);
                ganttChartList.push(idle);
                idle = null;
            }
            ready_queue.offer(processList.shift());
        }
        if (!ready_queue.isEmpty()) {
            top = ready_queue.poll();
            top.addStartTime(time);
            ganttChartList.push(top);
            while (top.remainingTime > 0) {
                time += 1;
                top.remainingTime -= 1;
                while (processList.length > 0 && processList[0].arrivalTime <= time) {
                    ready_queue.offer(processList.shift());
                }
                if (!ready_queue.isEmpty()) {
                    temp = ready_queue.poll();
                    if (temp.priority < top.priority) {
                        top.addEndTime(time);
                        ready_queue.offer(top);
                        top = temp;
                        top.addStartTime(time);
                        ganttChartList.push(top);
                    } else {
                        ready_queue.offer(temp);
                    }
                }
            }
            top.addEndTime(time);
            processListResult.push(top);
        } else {
            if (!idle) {
                idle = new PreemptiveProcess(' ', 0, 0);
                idle.addStartTime(time);
            }
            time += 1;
        }
    }
}

function displayProcess() {
    resultTable.innerHTML = '';
    processListResult.sort((p1, p2) => p1.pid.localeCompare(p2.pid));
    ['PID', 'Waiting Time', 'Turnaround Time'].forEach((info) => {
        const element = document.createElement('div');
        element.textContent = info;
        resultTable.appendChild(element);
    });
    processListResult.forEach((process) => {
        const pid = document.createElement('div');
        const waitingTime = document.createElement('div');
        const turnaroundTime = document.createElement('div');
        pid.textContent = process.pid;
        waitingTime.textContent = process.waitingTime();
        turnaroundTime.textContent = process.turnaroundTime();
        resultTable.appendChild(pid);
        resultTable.appendChild(waitingTime);
        resultTable.appendChild(turnaroundTime);
    });
}

function displayGanttChart() {
    ganttChart.innerHTML = '';
    let element;
    let startTimeElement;
    let width;
    let startTime, endTime;
    ganttChartList.forEach((col) => {
        if (col instanceof PreemptiveProcess) {
            startTime = +col.getStartTime();
            endTime = +col.getEndTime();
        } else {
            startTime = +col.startTime;
            endTime = +col.endTime;
        }
        element = document.createElement('div');
        startTimeElement = document.createElement('div');
        width = 50 * (endTime - startTime);
        element.textContent = col.pid;
        element.style.width = `${width}px`;
        startTimeElement.textContent = startTime;
        ganttChart.appendChild(element);
        element.appendChild(startTimeElement);
    });
    const endTimeElement = document.createElement('div');
    const process = ganttChartList[ganttChartList.length - 1];
    if (process instanceof PreemptiveProcess) {
        endTimeElement.textContent = process.getEndTime(-1);
    } else {
        endTimeElement.textContent = process.endTime;
    }
    element.appendChild(endTimeElement);
}
function startProcess() {
    processListResult = [];
    ganttChartList = [];
    const processGroup = selectProcessType.options[selectProcessType.selectedIndex].parentElement.label;
    let processList = [];
    const table = document.querySelectorAll('.'+processInputClass);
    let pid = 1;
    if (processGroup === 'Non-Preemptive') {
        for (let i = 0; i < table.length; i += 2) {
            const p = new NonPreemptiveProcess(`P${pid}`, +table[i].value, +table[i + 1].value);
            processList.push(p);
            pid += 1;
        }
    } else if (processGroup === 'Preemptive') {
        for (let i = 0; i < table.length; i += 2) {
            const p = new PreemptiveProcess(`P${pid}`, +table[i].value, +table[i + 1].value);
            processList.push(p);
            pid += 1;
        }
    }
    if (selectProcessType.value.includes('Priority')) {
        document.querySelectorAll('.'+priorityInputClass).forEach((p, i) => {
            processList[i].priority = +p.value;
        });
    }

    switch (selectProcessType.value)
    {
        case 'FCFS':
            fcfsAlogirthm(processList);
            break;
        case 'SJF':
            sjfAlgorithm(processList);
            break;
        case 'NonPreempPriority':
            nonPreempPriorityAlgorithm(processList);
            break;
        case 'SRTF':
            srtfAlgorithm(processList);
            break;
        case 'RoundRobin':
            const quantumTime = +document.querySelector('#quantum-time-input').value;
            roundRobinAlgorithm(processList, quantumTime);
            break;
        case 'PreempPriority':
            preempPriorityAlgorithm(processList);
            break;
    }
    displayProcess();
    displayGanttChart();
}



class Heap {
    constructor(comparator) {
        this.heap = [];
        this.comparator = comparator;
    }

    offer(value) {
        this.heap.push(value);
        this.bubbleUp();
    }

    poll() {
        if (this.isEmpty()) {
            return null;
        }

        if (this.heap.length === 1) {
            return this.heap.pop();
        }

        const min = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.sinkDown(0);

        return min;
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    bubbleUp() {
        let index = this.heap.length - 1;
        while (index > 0) {
            const element = this.heap[index];
            const parentIndex = Math.floor((index - 1) / 2);
            const parent = this.heap[parentIndex];
            if (this.comparator(element, parent) < 0) { // element < parent
                this.heap[index] = parent;
                this.heap[parentIndex] = element;
                index = parentIndex;
            } else {
                break;
            }
        }
    }

    sinkDown(index) {
        const leftChildIdx = 2 * index + 1;
        const rightChildIdx = 2 * index + 2;
        let smallest = index;

        if (leftChildIdx < this.heap.length && this.comparator(this.heap[leftChildIdx], this.heap[smallest]) < 0) { // this.heap[leftChildIdx] < this.heap[smallest]
            smallest = leftChildIdx;
        }

        if (rightChildIdx < this.heap.length && this.comparator(this.heap[rightChildIdx], this.heap[smallest]) < 0) { // this.heap[rightChildIdx] < this.heap[smallest]
            smallest = rightChildIdx;
        }

        if (smallest !== index) {
            const temp = this.heap[index];
            this.heap[index] = this.heap[smallest];
            this.heap[smallest] = temp;
            this.sinkDown(smallest);
        }
    }
}


window.onload = () => {
    createProcessInput();
};