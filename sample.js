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
    }
}

function foo() {
    const p = new NonPreemptiveProcess('p1', 4, 1);
    p.hello = 'HI THERE';
    fee(p);
}

function fee(p) {
    console.log(p.hello);
}

foo();