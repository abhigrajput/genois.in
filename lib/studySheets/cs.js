/**
 * Curated revision sheets — CS fundamentals.
 *
 * HAND-AUTHORED, same contract as ./patterns.js and lib/skillTaxonomy.js.
 *
 * MAPPING RULE
 * ------------
 * Unlike the DSA sheets — which inherit their skills from a pattern id — these
 * declare `skills` explicitly, and every id MUST exist in lib/skillTaxonomy.js.
 * ./index.js asserts both directions at request time via the debug endpoint:
 *   - no sheet claims a skill the taxonomy has never heard of, and
 *   - every `cs.*` skill is claimed by at least one sheet.
 * That is what lets the evidence overlay say "you are weak in Deadlocks, here is
 * the sheet" without a second, parallel opinion about what a topic is.
 *
 * A sheet groups skills that are genuinely revised together (synchronisation and
 * deadlock are one sitting, not two), so the mapping is deliberately many-to-one
 * rather than one sheet per taxonomy row.
 *
 * These are interview revision sheets for Indian campus placements: what gets
 * asked, what a good answer sounds like, and the specific confusions that cost
 * marks. They are not a textbook substitute and do not pretend to be.
 */

export const CS_SHEETS = [
  // ── OOP & Design ──────────────────────────────────────────────────────────
  {
    id: 'oop-pillars',
    title: 'OOP — The Four Pillars',
    group: 'OOP & Design',
    skills: ['cs.oop-encapsulation', 'cs.oop-inheritance', 'cs.oop-polymorphism', 'cs.oop-abstraction'],
    summary:
      'The most-asked topic in Indian campus interviews, and the one most often answered with memorised definitions. Have an example for each.',
    recognise: [
      '"What are the four pillars of OOP?" — expect it in almost every HR-adjacent technical round.',
      '"Difference between abstraction and encapsulation" — the classic trap.',
      '"Overloading vs overriding" — expect a code snippet to trace.',
      'Any "design a class for X" question.',
    ],
    concepts: [
      { term: 'Encapsulation', detail: 'Bundling data with the methods that operate on it, and restricting direct access. Private fields plus public methods. The point is that an object controls its own invariants — nobody can set balance to −500 from outside.' },
      { term: 'Abstraction', detail: 'Exposing what something does while hiding how. A driver uses a brake pedal without knowing about hydraulics. Achieved through abstract classes and interfaces.' },
      { term: 'Abstraction vs encapsulation', detail: 'The distinction interviewers probe: abstraction is a DESIGN concern (which details to expose), encapsulation is an IMPLEMENTATION mechanism (access modifiers enforcing it). Abstraction hides complexity; encapsulation hides data.' },
      { term: 'Inheritance', detail: 'A class acquires the members of another, modelling an is-a relationship. A Dog is an Animal. Reuse is a side effect, not the justification — if it is not is-a, use composition.' },
      { term: 'Polymorphism', detail: 'One interface, many implementations. Compile-time (overloading — same name, different parameter lists) and runtime (overriding — a subclass replaces a base method, resolved by the object\'s actual type).' },
      { term: 'Overloading vs overriding', detail: 'Overloading: same class, same name, different signatures, resolved at compile time. Overriding: subclass, identical signature, resolved at runtime through the vtable. Different mechanisms with confusingly similar names.' },
      { term: 'Why virtual matters in C++', detail: 'Without the virtual keyword, calling through a base pointer runs the BASE version — no runtime dispatch. Java methods are virtual by default; C++ ones are not. This is a favourite trick question.' },
      { term: 'The diamond problem', detail: 'D inherits from B and C, which both inherit from A — which A does D get? C++ answers with virtual inheritance; Java sidesteps it by forbidding multiple class inheritance and allowing multiple interfaces instead.' },
      { term: 'Composition over inheritance', detail: 'Inheritance is rigid and couples you to a base class\'s internals. Prefer has-a: a Car HAS an Engine rather than IS an Engine. Modern design guidance leans this way heavily.' },
    ],
    template: {
      caption: 'Runtime polymorphism — and the virtual keyword that enables it',
      lang: 'cpp',
      code: `class Shape {
public:
    virtual double area() const = 0;      // pure virtual => Shape is abstract
    virtual ~Shape() = default;           // virtual dtor: delete via base is safe
};

class Circle : public Shape {
    double r;                             // encapsulated: private by default
public:
    Circle(double radius) : r(radius) {}
    double area() const override { return 3.14159 * r * r; }
};

// Without 'virtual' on area(), this would call Shape::area — not Circle's.
void report(const Shape& s) { cout << s.area(); }   // one interface, many types`,
    },
    pitfalls: [
      'Defining abstraction and encapsulation with the same sentence ("hiding details"). Name the difference: design intent vs enforcement mechanism.',
      'Claiming Java supports multiple inheritance. It does for interfaces, not for classes.',
      'Forgetting a virtual destructor in a C++ base class — deleting a derived object through a base pointer is undefined behaviour and leaks.',
      'Calling overloading "runtime polymorphism". It is resolved at compile time.',
      'Using inheritance for code reuse where there is no is-a relationship. That is the textbook argument for composition.',
    ],
    recall: [
      { q: 'Four pillars?', a: 'Encapsulation, abstraction, inheritance, polymorphism.' },
      { q: 'Abstraction vs encapsulation in one line?', a: 'Abstraction decides what to expose (design); encapsulation enforces it (access modifiers).' },
      { q: 'Overloading vs overriding — when is each resolved?', a: 'Overloading at compile time, overriding at runtime.' },
      { q: 'What happens without virtual in C++?', a: 'A base-pointer call runs the base version — no runtime dispatch.' },
      { q: 'What is the diamond problem?', a: 'Ambiguity when a class inherits the same ancestor via two paths. C++ uses virtual inheritance; Java forbids multiple class inheritance.' },
      { q: 'Why prefer composition over inheritance?', a: 'Looser coupling — you depend on an interface rather than a base class\'s internals.' },
      { q: 'What makes a C++ class abstract?', a: 'At least one pure virtual function (= 0).' },
    ],
    interview: [
      { q: 'Give a real example of encapsulation.', a: 'A BankAccount with a private balance and public deposit/withdraw. Withdraw rejects overdrafts, so the invariant "balance ≥ 0" cannot be broken from outside — that guarantee is the actual value.' },
      { q: 'Can you override a static method?', a: 'No. Statics belong to the class, not an instance, so they are hidden rather than overridden — there is no dynamic dispatch to participate in.' },
      { q: 'Why is a virtual destructor needed?', a: 'Deleting a derived object through a base pointer with a non-virtual destructor only runs the base destructor. The derived part never cleans up.' },
    ],
  },

  {
    id: 'oop-design',
    title: 'SOLID & Design Patterns',
    group: 'OOP & Design',
    skills: ['cs.oop-solid', 'cs.design-patterns'],
    summary:
      'Asked as "name the SOLID principles" and "which patterns have you used". Know a handful properly rather than twenty by name.',
    recognise: [
      '"What is SOLID?" — expect all five expanded.',
      '"Which design patterns have you used in your project?"',
      '"How would you make this class testable / extensible?"',
      'Any code-smell question about a class that does too much.',
    ],
    concepts: [
      { term: 'S — Single Responsibility', detail: 'A class should have one reason to change. A class that parses input AND writes to a database changes when either changes — that is two reasons, so two classes.' },
      { term: 'O — Open/Closed', detail: 'Open for extension, closed for modification. Adding a new shape should mean a new class, not another branch in an existing switch statement.' },
      { term: 'L — Liskov Substitution', detail: 'A subclass must be usable anywhere the base is, without surprises. The classic violation: Square extends Rectangle, then setWidth also changes the height and breaks every caller\'s assumption.' },
      { term: 'I — Interface Segregation', detail: 'Many small interfaces beat one fat one. A class forced to implement methods it does not need (and throw from them) signals a violation.' },
      { term: 'D — Dependency Inversion', detail: 'Depend on abstractions, not concrete classes. Take a Database interface, not a MySQLDatabase — this is what makes unit testing with a fake possible.' },
      { term: 'Singleton', detail: 'One instance, globally reachable. Common for config, logging and connection pools. Widely criticised as hidden global state that makes testing hard — say that, it shows judgement.' },
      { term: 'Factory', detail: 'Creation behind a method, so callers ask for what they want rather than naming a concrete class. Used when the concrete type is chosen at runtime.' },
      { term: 'Observer', detail: 'Subjects notify registered listeners on change. Event listeners, pub/sub, React state subscriptions — all the same shape.' },
      { term: 'Strategy', detail: 'Interchangeable algorithms behind one interface, selected at runtime. Different payment methods, different sorting policies. The standard fix for a large conditional.' },
      { term: 'MVC', detail: 'Model (data and rules), View (presentation), Controller (input handling). The separation everyone quotes; the value is that a change to presentation cannot break business rules.' },
    ],
    pitfalls: [
      'Listing SOLID letters without an example each. Interviewers push for one immediately.',
      'Describing Liskov as "a subclass should behave like its parent" and stopping. Name the Square/Rectangle violation.',
      'Naming Singleton as your favourite pattern with no awareness of its criticisms.',
      'Confusing Factory with Builder. Factory chooses a type; Builder assembles a complex object step by step.',
      'Claiming a pattern you used without being able to point at where. Interviewers ask for the file.',
    ],
    recall: [
      { q: 'What does the S in SOLID stand for?', a: 'Single Responsibility — one reason to change.' },
      { q: 'Open/Closed in practice?', a: 'Extend by adding a class, not by editing existing code.' },
      { q: 'Classic Liskov violation?', a: 'Square extends Rectangle — setting width silently changes height, breaking base-class expectations.' },
      { q: 'What does Dependency Inversion enable?', a: 'Testing and swapping implementations, by depending on an interface rather than a concrete class.' },
      { q: 'When would you use Strategy?', a: 'Interchangeable algorithms chosen at runtime — typically replacing a big conditional.' },
      { q: 'Main criticism of Singleton?', a: 'Hidden global state; it makes unit testing and reasoning about dependencies harder.' },
      { q: 'Observer pattern in one line?', a: 'Subjects notify subscribed observers when their state changes.' },
    ],
    interview: [
      { q: 'Which pattern did you use in your project, and why?', a: 'Pick one you genuinely used and name the alternative you rejected. "Strategy for payment providers, because adding one should not mean editing the checkout flow" beats any textbook definition.' },
      { q: 'How does Dependency Inversion help testing?', a: 'The class takes an interface, so a test injects an in-memory fake instead of a real database — the test becomes fast and deterministic.' },
      { q: 'Is SOLID always right?', a: 'No. Applied dogmatically it produces a dozen one-method classes for a script. The principles pay off where change is expected; state that trade-off.' },
    ],
  },

  // ── Operating Systems ─────────────────────────────────────────────────────
  {
    id: 'os-processes-threads',
    title: 'OS — Processes & Threads',
    group: 'Operating Systems',
    skills: ['cs.os-processes', 'cs.os-threads'],
    summary:
      'Process vs thread is close to guaranteed in any OS round. Know the memory-sharing answer cold.',
    recognise: [
      '"Difference between a process and a thread" — near-certain.',
      '"What is a context switch and why is it expensive?"',
      '"How do processes communicate?"',
      'Anything about concurrency vs parallelism.',
    ],
    concepts: [
      { term: 'Process', detail: 'A program in execution with its own address space, file descriptors and PID. Isolated by the OS — one crashing process cannot corrupt another\'s memory.' },
      { term: 'Thread', detail: 'A unit of execution INSIDE a process. Threads share the heap, globals and file descriptors, but each has its own stack, registers and program counter. Shared memory is why they need synchronisation.' },
      { term: 'The one-line answer', detail: 'Processes are isolated and communicate through the OS; threads share an address space and communicate through memory. Everything else — cheaper creation, cheaper switching, weaker fault isolation — follows from that.' },
      { term: 'Context switch', detail: 'Saving one execution context and restoring another. Costly because of the register save/restore, the scheduler run, and — for a process switch — TLB and cache invalidation. Thread switches within a process are cheaper because the address space is unchanged.' },
      { term: 'PCB', detail: 'The Process Control Block: the kernel\'s record of a process — PID, state, registers, memory map, open files. What gets saved and restored on a switch.' },
      { term: 'Process states', detail: 'New → Ready → Running → (Waiting) → Terminated. Ready means runnable but not scheduled; Waiting means blocked on I/O and not schedulable until it completes.' },
      { term: 'fork()', detail: 'Creates a near-identical child. Returns 0 in the child and the child\'s PID in the parent — that return value is how one line of code takes two paths. Modern kernels use copy-on-write so memory is not physically duplicated up front.' },
      { term: 'IPC mechanisms', detail: 'Pipes (one-way, related processes), named pipes/FIFOs, message queues, shared memory (fastest, needs synchronisation), and sockets (works across machines).' },
      { term: 'Zombie vs orphan', detail: 'Zombie: finished but its exit status has not been reaped by the parent. Orphan: parent died first, so init/systemd adopts it. Both come up as follow-ups to fork().' },
      { term: 'Concurrency vs parallelism', detail: 'Concurrency is dealing with many tasks by interleaving them; parallelism is executing them literally simultaneously on multiple cores. A single core can be concurrent but never parallel.' },
    ],
    pitfalls: [
      'Saying threads have their own memory. They share the heap and globals — only the stack and registers are per-thread.',
      'Claiming a context switch is "just slow" without a reason. Name TLB/cache invalidation.',
      'Confusing concurrency with parallelism.',
      'Forgetting that fork() returns twice, with different values.',
      'Describing shared memory as the safest IPC. It is the fastest and the most dangerous — it needs explicit synchronisation.',
    ],
    recall: [
      { q: 'Process vs thread in one line?', a: 'Processes have separate address spaces; threads share one within a process.' },
      { q: 'What is private to each thread?', a: 'Stack, registers, program counter.' },
      { q: 'Why is a process context switch expensive?', a: 'Register save/restore plus TLB and cache invalidation from the address-space change.' },
      { q: 'What does fork() return?', a: '0 in the child, the child PID in the parent.' },
      { q: 'What is a zombie process?', a: 'One that has terminated but whose exit status the parent has not yet reaped.' },
      { q: 'Fastest IPC mechanism?', a: 'Shared memory — but it requires explicit synchronisation.' },
      { q: 'Concurrency vs parallelism?', a: 'Interleaving tasks versus literally running them at the same instant.' },
    ],
    interview: [
      { q: 'When would you choose processes over threads?', a: 'When fault isolation or security matters more than communication speed — a crash or memory corruption stays contained. Chrome uses a process per tab for exactly this reason.' },
      { q: 'What is a thread pool for?', a: 'Thread creation is not free. A pool reuses a fixed set of workers, which caps concurrency and removes per-task creation cost.' },
      { q: 'Can two threads run truly simultaneously?', a: 'Only on multiple cores. On a single core they interleave. (And in CPython the GIL prevents true parallel bytecode execution regardless of cores.)' },
    ],
  },

  {
    id: 'os-scheduling',
    title: 'OS — CPU Scheduling',
    group: 'Operating Systems',
    skills: ['cs.os-scheduling'],
    summary:
      'Algorithm names, their trade-offs, and the arithmetic. Expect to compute average waiting time by hand.',
    recognise: [
      '"Explain CPU scheduling algorithms."',
      'A table of processes with burst times — compute average waiting/turnaround time.',
      '"What is starvation and how do you prevent it?"',
      '"Preemptive vs non-preemptive."',
    ],
    concepts: [
      { term: 'The metrics', detail: 'Turnaround = completion − arrival. Waiting = turnaround − burst. Response = first-run − arrival. Interactive systems optimise response; batch systems optimise turnaround.' },
      { term: 'FCFS', detail: 'First come, first served. Non-preemptive, trivially fair, and vulnerable to the convoy effect — one long job at the front makes everyone wait.' },
      { term: 'SJF', detail: 'Shortest Job First. Provably optimal for average waiting time, but requires knowing burst times in advance (so it is estimated in practice) and starves long jobs.' },
      { term: 'SRTF', detail: 'Preemptive SJF: a newly arrived shorter job preempts the running one. Better average waiting than SJF, more context switches, and worse starvation.' },
      { term: 'Round Robin', detail: 'Each process gets a time quantum, then goes to the back of the queue. Preemptive, no starvation, good response time. Quantum choice is everything — too small and switching overhead dominates, too large and it degenerates into FCFS.' },
      { term: 'Priority scheduling', detail: 'Highest priority first, preemptive or not. Starves low-priority processes unless you apply AGING — gradually raising the priority of waiting jobs.' },
      { term: 'Multilevel feedback queue', detail: 'Multiple queues with different quanta; a process that uses its whole slice drops to a lower-priority queue. Approximates SJF without knowing burst times, which is why real schedulers resemble it.' },
      { term: 'Starvation vs deadlock', detail: 'Starvation: a process is runnable but never scheduled — it could proceed. Deadlock: processes are blocked on each other and none can ever proceed. Aging fixes starvation; it cannot fix deadlock.' },
    ],
    template: {
      caption: 'Worked example — FCFS vs SJF on the same jobs (all arrive at t=0)',
      lang: 'text',
      code: `Jobs:  P1 burst 24    P2 burst 3    P3 burst 3

FCFS  (order P1,P2,P3)
  start times: P1=0, P2=24, P3=27
  waiting:     0, 24, 27          -> average (0+24+27)/3 = 17.0

SJF   (order P2,P3,P1)
  start times: P2=0, P3=3, P1=6
  waiting:     6, 0, 3            -> average (6+0+3)/3  = 3.0

Same jobs, same CPU. Ordering alone cuts average waiting time from 17 to 3 --
this is the convoy effect, and it is the standard exam question.`,
    },
    pitfalls: [
      'Mixing up turnaround and waiting time. Waiting = turnaround − burst.',
      'Calling SJF "the best algorithm" without noting it needs burst times you do not have.',
      'Saying Round Robin has no overhead. Each quantum expiry is a context switch.',
      'Confusing starvation with deadlock.',
      'Forgetting arrival times when they are non-zero — the ready queue only contains jobs that have arrived.',
    ],
    recall: [
      { q: 'Waiting time formula?', a: 'Turnaround − burst, where turnaround = completion − arrival.' },
      { q: 'Which algorithm minimises average waiting time?', a: 'SJF — provably optimal, but needs burst times in advance.' },
      { q: 'What is the convoy effect?', a: 'Under FCFS, one long job at the front delays every short job behind it.' },
      { q: 'What does the Round Robin quantum control?', a: 'The trade-off between responsiveness and context-switch overhead.' },
      { q: 'How do you prevent starvation in priority scheduling?', a: 'Aging — raise the priority of long-waiting processes.' },
      { q: 'Preemptive version of SJF?', a: 'SRTF, Shortest Remaining Time First.' },
      { q: 'Starvation vs deadlock?', a: 'Starvation: runnable but never scheduled. Deadlock: blocked on each other, never runnable.' },
    ],
    interview: [
      { q: 'Which algorithm would you use for an interactive OS?', a: 'Round Robin or a multilevel feedback queue — response time matters more than raw throughput, and no user process should starve.' },
      { q: 'What happens if the RR quantum is very large?', a: 'It becomes FCFS: every process finishes inside its own slice, so preemption never happens.' },
      { q: 'Can SJF be implemented exactly in practice?', a: 'No — burst times are unknown. Schedulers estimate them via exponential averaging of recent bursts, or approximate SJF with feedback queues.' },
    ],
  },

  {
    id: 'os-sync-deadlock',
    title: 'OS — Synchronization & Deadlocks',
    group: 'Operating Systems',
    skills: ['cs.os-synchronization', 'cs.os-deadlock'],
    summary:
      'Race conditions, the tools that prevent them, and the four deadlock conditions. Be able to name all four.',
    recognise: [
      '"What is a race condition?"',
      '"Mutex vs semaphore" — a very common pair.',
      '"Four necessary conditions for deadlock" — expect all four by name.',
      'Producer-consumer or reader-writer problems.',
    ],
    concepts: [
      { term: 'Race condition', detail: 'Two threads access shared data concurrently and the result depends on timing. counter++ is three operations (read, add, write); interleaving them loses updates.' },
      { term: 'Critical section', detail: 'The code region touching shared state. A correct solution needs mutual exclusion, progress (no unnecessary blocking) and bounded waiting (no starvation).' },
      { term: 'Mutex', detail: 'A binary lock with OWNERSHIP — only the thread that locked it may unlock it. For protecting a critical section.' },
      { term: 'Semaphore', detail: 'A counter with wait() and signal(), no ownership, and any thread may signal. A counting semaphore admits N concurrent holders; it is a signalling and resource-counting device, not just a lock.' },
      { term: 'Mutex vs semaphore, the real answer', detail: 'Ownership and intent. Mutex: mutual exclusion, released by its owner. Semaphore: counting/signalling, releasable by anyone — which is exactly what makes producer-consumer work.' },
      { term: 'Deadlock — all four required', detail: 'Mutual exclusion, hold and wait, no preemption, circular wait. Break ANY one and deadlock is impossible — which is what every prevention scheme does.' },
      { term: 'Prevention vs avoidance vs detection', detail: 'Prevention: design so a condition can never hold (e.g. a global lock ordering kills circular wait). Avoidance: check at runtime that granting a request keeps the system in a safe state (Banker\'s algorithm). Detection: let it happen, find the cycle, recover by killing or rolling back.' },
      { term: "Banker's algorithm", detail: 'Avoidance. Each process declares its maximum need; a request is granted only if a safe sequence still exists afterwards. Rarely used in practice — the maximum-claim requirement is unrealistic — but always examinable.' },
      { term: 'Producer-consumer', detail: 'A bounded buffer with two counting semaphores (empty slots, full slots) plus a mutex for the buffer itself. The classic demonstration of why semaphores are not just locks.' },
      { term: 'Livelock and priority inversion', detail: 'Livelock: threads keep changing state in response to each other and make no progress — busy, not blocked. Priority inversion: a low-priority thread holds a lock a high-priority thread needs; fixed by priority inheritance.' },
    ],
    template: {
      caption: 'Why a race condition exists, and lock ordering as deadlock prevention',
      lang: 'cpp',
      code: `// counter++ is NOT atomic — read, increment, write. Two threads interleave:
//   T1 reads 5 | T2 reads 5 | T1 writes 6 | T2 writes 6   -> one update lost
mutex m;
void increment() {
    lock_guard<mutex> g(m);       // RAII: unlocks even if the body throws
    counter++;
}

// Deadlock: T1 takes A then B, T2 takes B then A -> circular wait.
// Prevention: EVERY thread takes locks in one global order.
void transfer(Account& from, Account& to) {
    Account* first  = &from;
    Account* second = &to;
    if (first->id > second->id) swap(first, second);   // fixed order kills the cycle
    lock_guard<mutex> g1(first->m);
    lock_guard<mutex> g2(second->m);
    // ... move the money
}`,
    },
    pitfalls: [
      'Saying a mutex is "a semaphore with value 1". The difference is ownership — only the locking thread may unlock a mutex.',
      'Naming three deadlock conditions. There are four; circular wait is the one people drop.',
      'Confusing prevention with avoidance. Prevention is structural and static; avoidance is a runtime safety check.',
      'Forgetting to unlock on an early return or exception. Use RAII (lock_guard) or try/finally.',
      'Believing volatile provides thread safety. It prevents certain compiler optimisations; it does not make operations atomic.',
    ],
    recall: [
      { q: 'Why is counter++ unsafe across threads?', a: 'It is read-modify-write — three steps that can interleave, losing an update.' },
      { q: 'Mutex vs semaphore?', a: 'Mutex has ownership and is for mutual exclusion; a semaphore is a counter for signalling and can be released by any thread.' },
      { q: 'Four deadlock conditions?', a: 'Mutual exclusion, hold and wait, no preemption, circular wait.' },
      { q: 'Simplest practical deadlock prevention?', a: 'A global lock ordering — it makes circular wait impossible.' },
      { q: "What does Banker's algorithm do?", a: 'Avoidance: grants a request only if a safe execution sequence still exists.' },
      { q: 'Livelock vs deadlock?', a: 'Livelock threads are active but make no progress; deadlocked threads are blocked entirely.' },
      { q: 'What is priority inversion?', a: 'A low-priority thread holds a lock a high-priority thread needs; priority inheritance fixes it.' },
    ],
    interview: [
      { q: 'Solve producer-consumer with semaphores.', a: 'Two counting semaphores — empty (initialised to buffer size) and full (0) — plus a mutex. Producer waits on empty, locks, inserts, unlocks, signals full. Consumer mirrors it. Take the mutex INSIDE the semaphore wait, never outside, or you deadlock.' },
      { q: 'How do you detect a deadlock at runtime?', a: 'Build a wait-for graph and look for a cycle. Recovery means killing a process or rolling one back to release its resources.' },
      { q: 'Is a spinlock ever better than a mutex?', a: 'Yes, when the critical section is very short and you have multiple cores — spinning beats the cost of a context switch. On a single core it is pure waste.' },
    ],
  },

  {
    id: 'os-memory',
    title: 'OS — Memory, Virtual Memory & File Systems',
    group: 'Operating Systems',
    skills: ['cs.os-memory', 'cs.os-virtual-memory', 'cs.os-file-systems'],
    summary:
      'Paging, page faults and replacement policies. Also where "stack vs heap" lives — the most-asked question in the group.',
    recognise: [
      '"Stack vs heap" — extremely common, often as a C/C++ question.',
      '"What is virtual memory / paging / a page fault?"',
      'Page replacement arithmetic — count the faults for a reference string.',
      '"Internal vs external fragmentation."',
    ],
    concepts: [
      { term: 'Stack vs heap', detail: 'Stack: automatic, LIFO, per-thread, fast, fixed size, freed on return. Heap: manual or GC-managed, shared across threads, large, slower, and where fragmentation and leaks live.' },
      { term: 'Virtual memory', detail: 'Every process sees its own contiguous address space; the MMU translates virtual pages to physical frames. Buys isolation, lets a process exceed physical RAM, and simplifies allocation.' },
      { term: 'Paging', detail: 'Memory is split into fixed-size pages (virtual) and frames (physical). A page table maps between them. Fixed size eliminates external fragmentation but wastes part of the last page — that is internal fragmentation.' },
      { term: 'Page fault', detail: 'A referenced page is not resident. The OS traps, fetches it from disk, updates the page table and restarts the instruction. Not an error — it is the normal mechanism of demand paging.' },
      { term: 'TLB', detail: 'A small cache of recent translations. Without it every access would need an extra memory read for the page table. A TLB miss is what makes page-table walks visible in performance.' },
      { term: 'Replacement policies', detail: 'FIFO (simple, suffers Belady\'s anomaly — more frames can mean more faults). LRU (evict least recently used; good, needs tracking). Optimal (evict what is used furthest in future; unimplementable, used as a benchmark).' },
      { term: 'Thrashing', detail: 'So little memory per process that the system spends its time paging rather than executing. Fixed by reducing the multiprogramming degree or applying a working-set model.' },
      { term: 'Internal vs external fragmentation', detail: 'Internal: allocated-but-unused space inside a block (last page). External: enough total free memory but no single contiguous run big enough. Paging removes external; segmentation reintroduces it.' },
      { term: 'Segmentation', detail: 'Variable-size, logically meaningful divisions (code, data, stack) rather than uniform pages. Matches program structure; suffers external fragmentation. Real systems combine both.' },
      { term: 'File system essentials', detail: 'An inode holds metadata (permissions, size, timestamps, block pointers) but NOT the filename — directories map names to inode numbers, which is exactly how hard links work.' },
      { term: 'Disk scheduling', detail: 'FCFS, SSTF (shortest seek first, can starve), SCAN/elevator, C-SCAN (uniform wait). Being asked to trace head movement for a request queue is standard.' },
    ],
    template: {
      caption: 'Page replacement traced by hand — LRU vs FIFO, 3 frames',
      lang: 'text',
      code: `Reference string:  7 0 1 2 0 3 0 4
Frames: 3

FIFO                                     LRU
 7 -> [7]        fault                    7 -> [7]        fault
 0 -> [7,0]      fault                    0 -> [7,0]      fault
 1 -> [7,0,1]    fault                    1 -> [7,0,1]    fault
 2 -> [0,1,2]    fault (evict 7)          2 -> [0,1,2]    fault (evict 7, oldest use)
 0 -> [0,1,2]    HIT                      0 -> [0,1,2]    HIT
 3 -> [1,2,3]    fault (evict 0)          3 -> [0,2,3]    fault (evict 1, LRU)
 0 -> [2,3,0]    fault (evict 1)          0 -> [0,2,3]    HIT
 4 -> [3,0,4]    fault (evict 2)          4 -> [0,3,4]    fault (evict 2)

FIFO: 7 faults        LRU: 6 faults
FIFO evicted 0 right before it was needed again -- LRU's recency signal did not.`,
    },
    pitfalls: [
      'Saying paging causes external fragmentation. It causes INTERNAL fragmentation; fixed-size pages are precisely what removes external.',
      'Treating a page fault as an error. It is the normal path in demand paging.',
      'Claiming LRU always beats FIFO. Usually, not always — and only FIFO suffers Belady\'s anomaly.',
      'Saying the inode stores the filename. It does not; the directory entry does.',
      'Confusing thrashing with a slow disk. Thrashing is a memory-pressure feedback loop.',
    ],
    recall: [
      { q: 'Stack vs heap in one line?', a: 'Stack: automatic, per-thread, LIFO, fast, small. Heap: manual/GC, shared, large, slower.' },
      { q: 'What is a page fault?', a: 'A reference to a non-resident page; the OS loads it and restarts the instruction.' },
      { q: 'Which fragmentation does paging cause?', a: 'Internal — the unused tail of the last page.' },
      { q: "What is Belady's anomaly?", a: 'More frames producing MORE page faults — possible under FIFO, impossible under LRU.' },
      { q: 'What does the TLB cache?', a: 'Recent virtual-to-physical page translations.' },
      { q: 'What is thrashing?', a: 'The system paging so heavily that useful work stops.' },
      { q: 'Does an inode store the filename?', a: 'No — the directory entry maps a name to an inode number.' },
    ],
    interview: [
      { q: 'Why is virtual memory useful beyond running big programs?', a: 'Isolation and simplicity: each process gets a private contiguous space, so it cannot read another\'s memory, and the loader does not need contiguous physical RAM.' },
      { q: 'How would you implement LRU efficiently?', a: 'Hash map to doubly-linked-list nodes — O(1) lookup and O(1) reordering. In hardware, exact LRU is too costly, so approximations like the clock algorithm are used.' },
      { q: 'What are hard links and soft links?', a: 'A hard link is another directory entry pointing at the same inode — the file survives until all links are gone. A symlink is a separate file containing a path, and it breaks if the target moves.' },
    ],
  },

  // ── Databases ─────────────────────────────────────────────────────────────
  {
    id: 'db-sql-joins',
    title: 'DBMS — SQL & Joins',
    group: 'Databases',
    skills: ['cs.db-sql', 'cs.db-joins'],
    summary:
      'You will be asked to write a query on paper. Know join types, GROUP BY, and why WHERE and HAVING are different.',
    recognise: [
      '"Write a query to find the second-highest salary" — the canonical question.',
      '"Difference between INNER and LEFT JOIN."',
      '"WHERE vs HAVING."',
      'Anything with "per department", "per customer" — that is GROUP BY.',
    ],
    concepts: [
      { term: 'Logical execution order', detail: 'FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. This explains most SQL confusion: a SELECT alias is unavailable in WHERE because WHERE runs first.' },
      { term: 'INNER JOIN', detail: 'Only rows matching in both tables. Non-matching rows on either side disappear.' },
      { term: 'LEFT JOIN', detail: 'All left rows, with NULLs where the right has no match. The standard way to find missing relationships: LEFT JOIN then WHERE right.id IS NULL.' },
      { term: 'RIGHT / FULL OUTER', detail: 'Mirror of LEFT, and both sides preserved. RIGHT JOIN is rare in practice — people flip the table order and use LEFT.' },
      { term: 'CROSS JOIN', detail: 'Every combination — the Cartesian product. Usually an accident caused by a missing join condition, and the reason a query suddenly returns millions of rows.' },
      { term: 'WHERE vs HAVING', detail: 'WHERE filters rows BEFORE grouping and cannot use aggregates. HAVING filters groups AFTER, and can. "Departments with more than 5 employees" is HAVING COUNT(*) > 5.' },
      { term: 'Aggregates and NULL', detail: 'COUNT(*) counts rows; COUNT(col) skips NULLs. SUM and AVG ignore NULLs too — so AVG is not the same as SUM/COUNT(*) when nulls are present.' },
      { term: 'NULL comparison', detail: 'NULL = NULL is not true, it is unknown. Use IS NULL / IS NOT NULL. This single rule causes more silently-wrong queries than any other.' },
      { term: 'Window functions', detail: 'Aggregate without collapsing rows: ROW_NUMBER(), RANK(), DENSE_RANK() over a PARTITION. The modern answer to "nth highest per group". RANK skips after ties, DENSE_RANK does not.' },
      { term: 'UNION vs UNION ALL', detail: 'UNION removes duplicates and therefore sorts; UNION ALL just concatenates and is significantly faster. Use ALL unless you need deduplication.' },
    ],
    template: {
      caption: 'Second-highest salary three ways, and the missing-rows LEFT JOIN',
      lang: 'sql',
      code: `-- 1. Subquery: highest below the max
SELECT MAX(salary) FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- 2. OFFSET (returns NULL-free but empty if there is no 2nd distinct value)
SELECT DISTINCT salary FROM employees
ORDER BY salary DESC LIMIT 1 OFFSET 1;

-- 3. Window function — generalises to nth, and to per-department
SELECT salary FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM employees
) t WHERE rnk = 2;

-- Customers who have never ordered: LEFT JOIN + IS NULL
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;`,
    },
    pitfalls: [
      'Using = NULL instead of IS NULL. It never matches.',
      'Putting an aggregate in WHERE. Aggregates belong in HAVING.',
      'Selecting a non-aggregated column that is not in the GROUP BY. Strict modes reject it; lax ones return an arbitrary row.',
      'Assuming LIMIT 1 OFFSET 1 handles ties. With two people on the top salary it returns that same salary again unless you add DISTINCT.',
      'Forgetting the join condition and producing a Cartesian product.',
      'Using UNION where UNION ALL would do — paying for a sort you did not need.',
    ],
    recall: [
      { q: 'Logical order of SQL clauses?', a: 'FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.' },
      { q: 'WHERE vs HAVING?', a: 'WHERE filters rows before grouping; HAVING filters groups after and may use aggregates.' },
      { q: 'How do you find rows with no match in another table?', a: 'LEFT JOIN, then WHERE the right-side key IS NULL.' },
      { q: 'COUNT(*) vs COUNT(col)?', a: 'COUNT(*) counts rows; COUNT(col) skips NULLs.' },
      { q: 'RANK vs DENSE_RANK?', a: 'After a tie, RANK skips numbers; DENSE_RANK does not.' },
      { q: 'UNION vs UNION ALL?', a: 'UNION deduplicates (and sorts); UNION ALL simply concatenates and is faster.' },
      { q: 'Why does NULL = NULL fail?', a: 'NULL means unknown, so the comparison is unknown rather than true. Use IS NULL.' },
    ],
    interview: [
      { q: 'Find the nth highest salary per department.', a: 'DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) in a subquery, then filter on the rank. PARTITION BY restarts the ranking per department.' },
      { q: 'Why is SELECT * bad in production?', a: 'It breaks when columns change, ships unnecessary bytes, and prevents covering-index-only scans — the index no longer satisfies the query alone.' },
      { q: 'Find duplicate emails.', a: 'SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1. The grouped filter is exactly what HAVING is for.' },
    ],
  },

  {
    id: 'db-design',
    title: 'DBMS — Normalization & Indexing',
    group: 'Databases',
    skills: ['cs.db-normalization', 'cs.db-indexing'],
    summary:
      'Normal forms up to BCNF, and why an index makes reads fast and writes slower. Both are near-certain questions.',
    recognise: [
      '"Explain 1NF, 2NF, 3NF" — often with a table to normalise.',
      '"What is an index and how does it work?"',
      '"Why not index every column?"',
      '"Clustered vs non-clustered index."',
    ],
    concepts: [
      { term: 'Why normalise', detail: 'To remove redundancy and the update/insert/delete anomalies it causes. If a customer address is stored on every order row, changing it means updating every row — and missing one leaves the database inconsistent.' },
      { term: '1NF', detail: 'Atomic values only — no repeating groups, no comma-separated lists in a column. A phone_numbers column holding "9876,9877" violates it.' },
      { term: '2NF', detail: '1NF plus no partial dependency: no non-key column depends on only PART of a composite key. Only relevant when the primary key is composite.' },
      { term: '3NF', detail: '2NF plus no transitive dependency: non-key columns must not depend on other non-key columns. If dept_name depends on dept_id which depends on the key, split it out.' },
      { term: 'BCNF', detail: 'A stricter 3NF: every determinant must be a candidate key. It matters in tables with overlapping candidate keys — the standard follow-up when you say 3NF.' },
      { term: 'Denormalisation', detail: 'Deliberately reintroducing redundancy to avoid joins on a read-heavy workload. A valid engineering choice, not a mistake — but you now own keeping the copies consistent.' },
      { term: 'What an index is', detail: 'A separate sorted structure (usually a B+ tree) mapping column values to row locations. It converts an O(n) table scan into an O(log n) descent.' },
      { term: 'Why B+ trees', detail: 'Shallow and wide, so few disk seeks; all data sits in the leaves, which are linked — making range scans and ORDER BY cheap. Hash indexes beat them for equality but cannot do ranges at all.' },
      { term: 'Clustered vs non-clustered', detail: 'Clustered: the table rows ARE stored in index order, so there can be only one. Non-clustered: a separate structure pointing back at rows, and you may have many.' },
      { term: 'Composite index order matters', detail: 'An index on (a, b) serves queries filtering on a, or on a AND b — but not on b alone. This leftmost-prefix rule is a favourite interview trap.' },
      { term: 'The cost of an index', detail: 'Every INSERT, UPDATE and DELETE must maintain every index on the table, plus storage. Indexes trade write throughput for read speed, which is why you do not index everything.' },
      { term: 'Covering index', detail: 'When the index contains every column a query needs, the engine answers from the index alone and never touches the table. The reason SELECT * defeats this optimisation.' },
    ],
    pitfalls: [
      'Reciting normal-form definitions without an example table. Interviewers ask you to normalise something concrete.',
      'Saying an index "makes the database faster". It makes reads faster and writes slower.',
      'Expecting an index on (a, b) to help a query filtering only on b.',
      'Indexing a very low-cardinality column (like a boolean). The planner will usually ignore it and scan instead.',
      'Claiming normalisation is always correct. Read-heavy analytics systems denormalise deliberately.',
      'Applying a function to an indexed column in WHERE (WHERE YEAR(created_at) = 2026). That prevents index use — rewrite as a range.',
    ],
    recall: [
      { q: '1NF requires what?', a: 'Atomic values — no repeating groups or multi-valued columns.' },
      { q: '2NF removes which dependency?', a: 'Partial dependency on part of a composite key.' },
      { q: '3NF removes which dependency?', a: 'Transitive dependency — non-key columns depending on other non-key columns.' },
      { q: 'How is BCNF stricter than 3NF?', a: 'Every determinant must be a candidate key.' },
      { q: 'What data structure backs most indexes?', a: 'A B+ tree — shallow, and leaves linked for range scans.' },
      { q: 'How many clustered indexes can a table have?', a: 'One — it defines the physical row order.' },
      { q: 'Does an index on (a, b) help a query filtering only on b?', a: 'No — leftmost prefix rule.' },
      { q: 'What is a covering index?', a: 'One containing every column the query needs, so the table is never read.' },
    ],
    interview: [
      { q: 'When would you denormalise?', a: 'A read-heavy workload where a join is the bottleneck — for example storing a comment count on the post row instead of counting every time. The cost is keeping it accurate on every write.' },
      { q: 'Why might the planner ignore your index?', a: 'Low selectivity (the query matches most rows, so a scan is cheaper), a function wrapping the column, a type mismatch, or stale statistics.' },
      { q: 'Hash index vs B-tree index?', a: 'Hash is O(1) for equality but useless for ranges or ordering. B-tree is O(log n) and handles equality, ranges, sorting and prefix matches — which is why it is the default.' },
    ],
  },

  {
    id: 'db-transactions',
    title: 'DBMS — Transactions, ACID & Concurrency',
    group: 'Databases',
    skills: ['cs.db-transactions', 'cs.db-concurrency'],
    summary:
      'ACID expanded properly, the read phenomena, and which isolation level prevents which. Expect the table.',
    recognise: [
      '"What is ACID?" — expand all four with meaning, not just names.',
      '"Dirty read / non-repeatable read / phantom read."',
      '"What are isolation levels?"',
      'Bank transfer examples — the standard framing.',
    ],
    concepts: [
      { term: 'Atomicity', detail: 'All or nothing. A transfer that debits then crashes must not leave the debit applied — the transaction rolls back entirely.' },
      { term: 'Consistency', detail: 'A transaction moves the database from one valid state to another, preserving constraints, keys and triggers. Note this is a different "C" from the one in CAP.' },
      { term: 'Isolation', detail: 'Concurrent transactions must not observe each other\'s intermediate state. The degree to which this holds is exactly what isolation levels tune.' },
      { term: 'Durability', detail: 'Once committed, it survives a crash — guaranteed by a write-ahead log flushed to disk before commit is acknowledged.' },
      { term: 'Dirty read', detail: 'Reading uncommitted data that may still be rolled back. Prevented from READ COMMITTED upward.' },
      { term: 'Non-repeatable read', detail: 'Re-reading the same ROW inside one transaction returns a different value because another transaction committed an update. Prevented by REPEATABLE READ.' },
      { term: 'Phantom read', detail: 'Re-running the same QUERY returns different ROWS because another transaction inserted or deleted matching ones. Prevented only by SERIALIZABLE (and by MySQL InnoDB\'s gap locks at REPEATABLE READ).' },
      { term: 'The four levels', detail: 'READ UNCOMMITTED (nothing prevented) → READ COMMITTED (no dirty reads; the PostgreSQL default) → REPEATABLE READ (no non-repeatable reads; the MySQL default) → SERIALIZABLE (nothing anomalous, lowest concurrency).' },
      { term: 'Two-phase locking', detail: 'A growing phase acquiring locks and a shrinking phase releasing them, with no acquisition after the first release. Guarantees serialisability; strict 2PL holds all locks to commit, which is what most engines actually do.' },
      { term: 'MVCC', detail: 'Multi-Version Concurrency Control: writers create new row versions instead of overwriting, so readers never block writers and vice versa. How PostgreSQL and InnoDB achieve high concurrency, at the cost of needing vacuum/purge.' },
      { term: 'Optimistic vs pessimistic', detail: 'Pessimistic locks up front, assuming conflict. Optimistic proceeds and validates at commit, assuming conflict is rare. Optimistic wins under low contention; it wastes work under high contention.' },
    ],
    template: {
      caption: 'The isolation-level table — memorise this grid',
      lang: 'text',
      code: `Isolation level     Dirty read   Non-repeatable   Phantom
------------------------------------------------------------------
READ UNCOMMITTED    possible     possible         possible
READ COMMITTED      prevented    possible         possible     <- PostgreSQL default
REPEATABLE READ     prevented    prevented        possible*    <- MySQL default
SERIALIZABLE        prevented    prevented        prevented

* InnoDB's gap locks prevent phantoms at REPEATABLE READ, which is why
  MySQL and PostgreSQL give different answers to the same question.

Higher isolation = fewer anomalies = less concurrency. It is a dial, not a
"more is better" setting -- say that and you sound like you have shipped one.`,
    },
    pitfalls: [
      'Reciting ACID as four words with no meaning attached.',
      'Confusing non-repeatable read (same row, changed value) with phantom read (same query, different row set).',
      'Saying SERIALIZABLE is always the right choice. It is the slowest and can force retries under contention.',
      'Conflating ACID\'s Consistency with CAP\'s Consistency. They are unrelated ideas that share a letter.',
      'Assuming every database defaults to the same level. PostgreSQL is READ COMMITTED, MySQL is REPEATABLE READ.',
    ],
    recall: [
      { q: 'Expand ACID.', a: 'Atomicity, Consistency, Isolation, Durability.' },
      { q: 'What guarantees durability?', a: 'A write-ahead log flushed to disk before commit is acknowledged.' },
      { q: 'Dirty read?', a: 'Reading uncommitted data that may be rolled back.' },
      { q: 'Non-repeatable vs phantom read?', a: 'Non-repeatable: the same row changes value. Phantom: the same query returns a different set of rows.' },
      { q: 'Lowest level preventing dirty reads?', a: 'READ COMMITTED.' },
      { q: 'What does MVCC achieve?', a: 'Readers never block writers — each sees a consistent snapshot via row versions.' },
      { q: 'Default level in PostgreSQL and MySQL?', a: 'READ COMMITTED and REPEATABLE READ respectively.' },
    ],
    interview: [
      { q: 'Which isolation level for a banking transfer?', a: 'SERIALIZABLE, or REPEATABLE READ with explicit SELECT ... FOR UPDATE row locks. Correctness beats throughput when money moves — but say the cost out loud.' },
      { q: 'How does a database roll back?', a: 'The undo log holds the previous values. On rollback or crash recovery, committed changes are replayed from the redo log and uncommitted ones are reversed from undo.' },
      { q: 'Two users book the last seat simultaneously — what happens?', a: 'Without protection, both succeed and you have oversold. Fix with a pessimistic SELECT ... FOR UPDATE lock, or optimistic concurrency using a version column where the second update matches zero rows and retries.' },
    ],
  },

  {
    id: 'db-nosql',
    title: 'DBMS — NoSQL & Data Modelling',
    group: 'Databases',
    skills: ['cs.db-nosql'],
    summary:
      'When to leave SQL, the four NoSQL families, and how to draw an ER diagram. Usually asked as "SQL vs NoSQL".',
    recognise: [
      '"SQL vs NoSQL — when would you use each?"',
      '"Design the schema for <app>."',
      'ER diagram questions: entities, relationships, cardinality.',
      'Anything about MongoDB, Redis or Cassandra by name.',
    ],
    concepts: [
      { term: 'The four families', detail: 'Document (MongoDB — nested JSON-ish records), key-value (Redis, DynamoDB — fastest, simplest), column-family (Cassandra, HBase — wide sparse rows at scale), graph (Neo4j — relationships are first-class).' },
      { term: 'Schema-on-write vs schema-on-read', detail: 'Relational databases validate structure at write time; document stores accept anything and push interpretation to the reader. Flexible early, painful later when five versions of a document coexist.' },
      { term: 'When SQL wins', detail: 'Relationships and joins, multi-row transactions, reporting and ad-hoc queries, and anything where data integrity is the product. Most campus projects are in this category.' },
      { term: 'When NoSQL wins', detail: 'Massive horizontal scale, genuinely schemaless or rapidly evolving data, very high write throughput, or a natural document/graph shape. Not "because it is modern".' },
      { term: 'Embed vs reference', detail: 'The core document-modelling decision. Embed when the child is always read with the parent and stays small (order line items). Reference when it is shared, large, or updated independently (a user referenced by many posts).' },
      { term: 'Model around queries', detail: 'Relational modelling starts from the data; NoSQL modelling starts from the access patterns, and duplication is expected. Saying this is the sign you actually understand the trade.' },
      { term: 'ER diagram basics', detail: 'Entities are rectangles, attributes ellipses, relationships diamonds. Cardinality: 1:1, 1:N, M:N. An M:N relationship always becomes a junction table with both foreign keys.' },
      { term: 'Redis is not just a cache', detail: 'It has real data structures — lists, sets, sorted sets, hashes — which makes it the standard answer for leaderboards (sorted sets), rate limiting (counters with TTL) and session storage.' },
    ],
    pitfalls: [
      'Saying "NoSQL is faster". It is faster at particular access patterns and slower or impossible at others, notably joins.',
      'Claiming NoSQL has no transactions. MongoDB has supported multi-document ACID transactions since 4.0 — the older answer is now wrong.',
      'Embedding an unbounded array in a document. It grows forever and eventually exceeds the document size limit.',
      'Choosing NoSQL for a highly relational domain, then reimplementing joins in application code.',
      'Forgetting the junction table for an M:N relationship.',
    ],
    recall: [
      { q: 'Four NoSQL families?', a: 'Document, key-value, column-family, graph.' },
      { q: 'Schema-on-read vs schema-on-write?', a: 'NoSQL validates at read time; relational validates at write time.' },
      { q: 'When do you embed rather than reference?', a: 'When the child is always read with the parent, stays bounded, and is not shared.' },
      { q: 'What does an M:N relationship become in SQL?', a: 'A junction table holding both foreign keys.' },
      { q: 'Which Redis structure powers a leaderboard?', a: 'A sorted set (ZSET).' },
      { q: 'What drives NoSQL schema design?', a: 'The query/access patterns, not the shape of the data.' },
    ],
    interview: [
      { q: 'Design a schema for a blog with comments.', a: 'Relational: users, posts, comments with foreign keys — comments are queried independently and can be paginated. Document: embed comments only if they are few and always shown with the post; otherwise reference, because an unbounded embedded array will eventually break.' },
      { q: 'Can you use both?', a: 'Yes, and most real systems do — PostgreSQL as the source of truth, Redis for sessions and hot reads, maybe Elasticsearch for search. Polyglot persistence; the cost is keeping them in sync.' },
      { q: 'What does eventual consistency mean for a user?', a: 'A write may not be visible on every replica immediately. Fine for a like count, unacceptable for an account balance — pick per feature, not per company.' },
    ],
  },

  // ── Networks ──────────────────────────────────────────────────────────────
  {
    id: 'net-models',
    title: 'CN — OSI, TCP/IP & Transport',
    group: 'Networks',
    skills: ['cs.net-models', 'cs.net-transport'],
    summary:
      'The seven layers and TCP vs UDP. Both are close to guaranteed, and both are usually answered too shallowly.',
    recognise: [
      '"Explain the OSI model" — all seven, in order.',
      '"TCP vs UDP" — with a use case for each.',
      '"What is the three-way handshake?"',
      '"What happens when you type a URL?" — the famous whole-stack question.',
    ],
    concepts: [
      { term: 'OSI, seven layers', detail: 'Physical, Data Link, Network, Transport, Session, Presentation, Application. Bottom-up mnemonic: Please Do Not Throw Sausage Pizza Away.' },
      { term: 'What each layer does', detail: 'Physical: bits on a wire. Data Link: frames and MAC addressing on the local link. Network: IP addressing and routing between networks. Transport: TCP/UDP, ports, end-to-end delivery. Session/Presentation/Application: dialogue, encoding/encryption, and the protocols you actually use.' },
      { term: 'OSI vs TCP/IP', detail: 'OSI is the seven-layer teaching model; TCP/IP is the four-layer model the internet actually runs on (Link, Internet, Transport, Application) and collapses OSI\'s top three into one.' },
      { term: 'TCP', detail: 'Connection-oriented, reliable, ordered. Handshake, acknowledgements, retransmission, flow control and congestion control. You pay in latency and overhead for the guarantee.' },
      { term: 'UDP', detail: 'Connectionless, no ordering, no retransmission, no handshake. Just a header and go — which is why it wins for live video, voice, gaming and DNS, where a late packet is worse than a lost one.' },
      { term: 'Three-way handshake', detail: 'SYN → SYN-ACK → ACK. Both sides exchange and acknowledge initial sequence numbers, which is what makes ordering and retransmission possible. Teardown is four-way (FIN, ACK, FIN, ACK) because each direction closes independently.' },
      { term: 'Flow vs congestion control', detail: 'Flow control protects the RECEIVER from being overwhelmed (the advertised window). Congestion control protects the NETWORK (slow start, congestion avoidance, fast retransmit). Different problems, routinely confused.' },
      { term: 'Ports', detail: 'A port identifies the application on a host. 20/21 FTP, 22 SSH, 25 SMTP, 53 DNS, 80 HTTP, 443 HTTPS, 3306 MySQL, 5432 PostgreSQL. Learn those.' },
      { term: 'Encapsulation', detail: 'Each layer wraps the one above with its own header: data → segment (TCP) → packet (IP) → frame (Ethernet). The receiver unwraps in reverse.' },
    ],
    pitfalls: [
      'Getting the layer order wrong, or placing routers at layer 2. Routers are layer 3; switches are layer 2.',
      'Saying UDP is "unreliable" as if it were broken. It is unreliable BY DESIGN, and that is why it is faster.',
      'Confusing flow control with congestion control.',
      'Saying the handshake is three-way and the teardown is too. Teardown is four-way.',
      'Claiming HTTPS is a different port only. It is HTTP over TLS — a different protocol stack, conventionally on 443.',
    ],
    recall: [
      { q: 'Seven OSI layers bottom-up?', a: 'Physical, Data Link, Network, Transport, Session, Presentation, Application.' },
      { q: 'Which layer is a router?', a: 'Layer 3, Network. A switch is layer 2.' },
      { q: 'Three-way handshake sequence?', a: 'SYN, SYN-ACK, ACK.' },
      { q: 'Why is teardown four-way?', a: 'Each direction closes independently — FIN and ACK in both directions.' },
      { q: 'Flow control vs congestion control?', a: 'Flow protects the receiver; congestion protects the network.' },
      { q: 'One good use of UDP?', a: 'Live video, voice, gaming or DNS — retransmitting a late packet is worse than dropping it.' },
      { q: 'Ports for HTTP, HTTPS, SSH, DNS?', a: '80, 443, 22, 53.' },
    ],
    interview: [
      { q: 'What happens when you type a URL and press enter?', a: 'DNS resolution (cache → resolver → root → TLD → authoritative), TCP handshake to the IP, TLS handshake for HTTPS, HTTP request, server response, then the browser parses HTML, fetches subresources and renders. Interviewers use this to see how many layers you can connect.' },
      { q: 'Why does TCP need sequence numbers?', a: 'IP packets can arrive out of order, duplicated or not at all. Sequence numbers let the receiver reorder, discard duplicates and detect gaps so the sender can retransmit.' },
      { q: 'What is a SYN flood?', a: 'Half-open connections opened faster than they time out, exhausting the backlog queue. Mitigated with SYN cookies, which avoid allocating state until the handshake completes.' },
    ],
  },

  {
    id: 'net-web',
    title: 'CN — HTTP, DNS & Sockets',
    group: 'Networks',
    skills: ['cs.net-http', 'cs.net-dns', 'cs.net-sockets'],
    summary:
      'The layer web developers are actually asked about: methods, status codes, cookies, CORS and how a name becomes an IP.',
    recognise: [
      '"Difference between GET and POST."',
      '"What do status codes 401 and 403 mean?"',
      '"Explain CORS" — very common for full-stack roles.',
      '"How does DNS resolution work?"',
      '"Cookies vs localStorage vs sessions."',
    ],
    concepts: [
      { term: 'HTTP is stateless', detail: 'Every request stands alone; the server remembers nothing between them. Cookies, tokens and sessions exist entirely to reintroduce state on top of that.' },
      { term: 'Methods and their properties', detail: 'GET (safe, idempotent, cacheable), POST (neither safe nor idempotent), PUT (idempotent — repeating it changes nothing further), PATCH (partial, not necessarily idempotent), DELETE (idempotent).' },
      { term: 'GET vs POST, properly', detail: 'Not "one is secure". GET puts parameters in the URL (logged, bookmarked, cached, length-limited) and should not change server state; POST carries a body and may. Over HTTPS both are equally encrypted in transit.' },
      { term: 'Status code families', detail: '2xx success, 3xx redirect, 4xx client error, 5xx server error. Know 200, 201, 204, 301 vs 302 (permanent vs temporary), 304, 400, 401, 403, 404, 409, 429, 500, 502, 503.' },
      { term: '401 vs 403', detail: '401 Unauthorized means not authenticated — who are you? 403 Forbidden means authenticated but not permitted. The names are historically backwards, which is why this is asked.' },
      { term: 'Cookies vs localStorage', detail: 'Cookies are sent automatically with every matching request and can be HttpOnly (invisible to JavaScript, so XSS cannot steal them). localStorage is JS-only, never auto-sent, and is fully readable by any script on the page.' },
      { term: 'CORS', detail: 'Browsers block cross-origin reads by default. The SERVER opts in with Access-Control-Allow-Origin. Non-simple requests trigger a preflight OPTIONS first. CORS is a browser restriction — it is not a server-side security control, and it does not protect an API from curl.' },
      { term: 'DNS resolution', detail: 'Browser cache → OS cache → resolver → root → TLD (.com) → authoritative nameserver → IP, cached along the way per the TTL. Record types: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), TXT (verification).' },
      { term: 'Sockets', detail: 'An endpoint identified by IP plus port. Server: socket → bind → listen → accept. Client: socket → connect. accept() returns a NEW socket per connection so the listener keeps listening.' },
      { term: 'HTTP/1.1 vs 2 vs 3', detail: '1.1 pipelines poorly and suffers head-of-line blocking. HTTP/2 multiplexes many streams over one TCP connection. HTTP/3 moves to QUIC over UDP, removing TCP-level head-of-line blocking entirely.' },
      { term: 'WebSockets', detail: 'Start as an HTTP request with Upgrade, then become a persistent bidirectional channel. For genuine server push — chat, live feeds — where polling would be wasteful.' },
    ],
    pitfalls: [
      'Saying POST is "more secure" than GET. Over HTTPS both bodies and URLs are encrypted in transit; the difference is logging, caching and history.',
      'Swapping 401 and 403.',
      'Thinking CORS protects your API. It restricts browsers, nothing else.',
      'Storing a JWT in localStorage without acknowledging the XSS exposure. An HttpOnly cookie is the safer default.',
      'Confusing 301 and 302 — a wrongly issued permanent redirect is aggressively cached and very hard to undo.',
      'Calling a CNAME an A record. A CNAME points at another NAME, not an address.',
    ],
    recall: [
      { q: 'Is HTTP stateful?', a: 'No — cookies, tokens and sessions add state on top.' },
      { q: 'Which methods are idempotent?', a: 'GET, PUT, DELETE (and HEAD/OPTIONS). POST is not.' },
      { q: '401 vs 403?', a: '401 = not authenticated; 403 = authenticated but not allowed.' },
      { q: '301 vs 302?', a: 'Permanent vs temporary redirect; 301 is cached aggressively.' },
      { q: 'What does HttpOnly protect against?', a: 'JavaScript reading the cookie — so XSS cannot steal the token.' },
      { q: 'Who grants CORS permission?', a: 'The server, via Access-Control-Allow-Origin. The browser enforces it.' },
      { q: 'DNS record for an IPv4 address?', a: 'An A record. AAAA is IPv6.' },
      { q: 'Server socket call sequence?', a: 'socket → bind → listen → accept.' },
    ],
    interview: [
      { q: 'Why does a preflight OPTIONS request happen?', a: 'For non-simple requests — custom headers, or methods beyond GET/POST/HEAD. The browser asks permission before sending the real request, so a server that never opted in is never hit with it.' },
      { q: 'How would you keep a user logged in?', a: 'A signed token or session id in an HttpOnly, Secure, SameSite cookie. Short-lived access token plus a refresh token if you need revocation. Say why HttpOnly matters — that is the part interviewers listen for.' },
      { q: 'Polling vs WebSockets vs SSE?', a: 'Polling is simplest and wasteful. SSE is one-way server→client over plain HTTP, ideal for feeds. WebSockets are bidirectional and the right answer for chat. Match the tool to the direction of data flow.' },
    ],
  },

  {
    id: 'net-infra',
    title: 'CN — Routing, Switching & Security',
    group: 'Networks',
    skills: ['cs.net-routing', 'cs.net-security'],
    summary:
      'How packets find their way, and the encryption vocabulary. TLS and hashing-vs-encryption come up in every security-adjacent round.',
    recognise: [
      '"What is subnetting / NAT / a private IP?"',
      '"How does HTTPS work?" — the TLS handshake.',
      '"Encryption vs hashing" — a favourite.',
      '"Symmetric vs asymmetric encryption."',
    ],
    concepts: [
      { term: 'Routing vs switching', detail: 'A switch forwards frames within one network using MAC addresses (layer 2). A router forwards packets between networks using IP addresses (layer 3), consulting a routing table.' },
      { term: 'ARP', detail: 'Maps a known IP to the MAC address needed to actually deliver the frame on the local link. IP alone cannot put bytes on a wire.' },
      { term: 'NAT', detail: 'Many private addresses share one public IP; the router rewrites addresses and ports and tracks the mapping. Why your laptop is 192.168.x.x and the world sees one address — and a large part of why IPv4 has survived.' },
      { term: 'Private ranges', detail: '10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. Not routable on the public internet.' },
      { term: 'Subnet masks / CIDR', detail: '/24 means 24 network bits, leaving 8 host bits → 256 addresses, 254 usable (network and broadcast are reserved). Being asked to compute usable hosts for a /26 is standard.' },
      { term: 'Routing algorithms', detail: 'Distance vector (RIP — tell neighbours everything you know, slow convergence, count-to-infinity). Link state (OSPF — everyone learns the full topology and runs Dijkstra). BGP routes between autonomous systems and effectively runs the internet.' },
      { term: 'Symmetric vs asymmetric', detail: 'Symmetric (AES): one shared key, fast, but key distribution is the problem. Asymmetric (RSA, ECC): a public/private pair, solves distribution, far slower. TLS uses asymmetric to agree a symmetric key, then symmetric for the data.' },
      { term: 'Encryption vs hashing', detail: 'Encryption is REVERSIBLE with a key; hashing is one-way. Passwords are hashed — never encrypted — with a slow salted algorithm (bcrypt, argon2), so a database leak does not surrender them.' },
      { term: 'TLS handshake', detail: 'Client hello with supported ciphers → server responds with its certificate → client validates it against a trusted CA → key exchange establishes a shared session key → symmetric encryption from there. The certificate proves identity; the exchange provides secrecy.' },
      { term: 'Digital signature', detail: 'Hash the message, encrypt the hash with the PRIVATE key. Anyone can decrypt it with the public key and compare — proving authenticity and integrity. Note the key usage is the reverse of encryption.' },
      { term: 'Firewalls', detail: 'Filter traffic by rules. Stateless inspects each packet alone; stateful tracks connections and can allow return traffic for an outbound connection it already saw.' },
    ],
    pitfalls: [
      'Saying passwords are "encrypted". If they can be decrypted, the design is wrong — they must be hashed with a salt.',
      'Claiming TLS uses only asymmetric encryption. It uses asymmetric to establish a key, then symmetric for bulk data because asymmetric is too slow.',
      'Confusing a switch with a router.',
      'Forgetting that a /24 has 254 usable hosts, not 256.',
      'Believing HTTPS hides everything. The domain (via SNI/DNS) and traffic size and timing are still observable.',
      'Using MD5 or SHA-1 for passwords. Both are broken for that purpose, and being fast makes them worse, not better.',
    ],
    recall: [
      { q: 'Switch vs router?', a: 'Switch: MAC addresses within a network (L2). Router: IP addresses between networks (L3).' },
      { q: 'What does ARP resolve?', a: 'An IP address to a MAC address on the local link.' },
      { q: 'Usable hosts in a /24?', a: '254 — 256 minus network and broadcast.' },
      { q: 'Encryption vs hashing?', a: 'Encryption is reversible with a key; hashing is one-way.' },
      { q: 'Why does TLS use both key types?', a: 'Asymmetric to exchange a key safely, symmetric for speed on the actual data.' },
      { q: 'How is a digital signature made?', a: 'Hash the message and encrypt the hash with the sender\'s private key.' },
      { q: 'Which algorithms for password hashing?', a: 'bcrypt, scrypt or argon2 — deliberately slow and salted.' },
      { q: 'Three private IP ranges?', a: '10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.' },
    ],
    interview: [
      { q: 'Explain HTTPS end to end.', a: 'TCP handshake, then TLS: cipher negotiation, the server\'s certificate validated up a CA chain, a key exchange producing a shared session key, then symmetric encryption of all traffic. The certificate answers "is this really the server?"; the exchange answers "can anyone else read this?".' },
      { q: 'Why salt a password hash?', a: 'Identical passwords otherwise produce identical hashes, so one rainbow table cracks every user at once. A unique per-user salt forces the attacker to attack each password individually.' },
      { q: 'What does a firewall not protect against?', a: 'Anything riding on allowed traffic — SQL injection or XSS over permitted port 443, or an insider already inside the perimeter. Perimeter control is not application security.' },
    ],
  },

  // ── System Design ─────────────────────────────────────────────────────────
  {
    id: 'sd-scaling',
    title: 'System Design — Scaling, Load Balancing & Caching',
    group: 'System Design',
    skills: ['cs.sd-scalability', 'cs.sd-load-balancing', 'cs.sd-caching'],
    summary:
      'The vocabulary every design round expects in the first five minutes. Know what each lever costs, not just its name.',
    recognise: [
      '"Design a URL shortener / Instagram / a rate limiter."',
      '"How would you scale this to a million users?"',
      '"Horizontal vs vertical scaling."',
      '"Where would you add a cache?"',
    ],
    concepts: [
      { term: 'Vertical vs horizontal', detail: 'Vertical: a bigger machine — simple, no code changes, hard ceiling, single point of failure. Horizontal: more machines — effectively unbounded, but forces you to deal with statelessness, balancing and distributed data.' },
      { term: 'Statelessness is the precondition', detail: 'You cannot horizontally scale servers that keep session state in memory. Push state to Redis or a database and any server can serve any request — this is the step people forget to mention.' },
      { term: 'Load balancer', detail: 'Distributes requests and removes unhealthy nodes via health checks. Layer 4 balances on IP/port (fast, opaque); layer 7 reads HTTP and can route by path or header (flexible, slower).' },
      { term: 'Balancing algorithms', detail: 'Round robin, least connections, weighted, IP hash (sticky — the same client keeps landing on the same server, which is a workaround for state rather than a solution).' },
      { term: 'Consistent hashing', detail: 'Naive hash(key) % N remaps almost every key when N changes. Consistent hashing places nodes on a ring so adding or removing one only moves the keys adjacent to it — essential for cache and shard clusters.' },
      { term: 'Caching layers', detail: 'Browser → CDN → application/Redis → database query cache. Each hop you avoid is latency and load saved; the closest cache to the user always wins.' },
      { term: 'Cache strategies', detail: 'Cache-aside (app checks cache, on miss reads the DB and populates — the common default). Write-through (write both, consistent, slower writes). Write-behind (write cache now, DB later — fast, risks loss).' },
      { term: 'Invalidation', detail: 'The genuinely hard part. TTL is the simple answer; explicit invalidation on write is precise but easy to miss a path. Cache what is read far more than written.' },
      { term: 'Cache stampede', detail: 'A hot key expires and a thousand requests hit the database simultaneously. Mitigate with a lock/single-flight so one request refills, or randomised TTL jitter so keys do not expire together.' },
      { term: 'Replication vs sharding', detail: 'Replication copies the same data for read scaling and redundancy. Sharding splits DIFFERENT data across nodes for write scaling and capacity. They solve different problems and are usually combined.' },
      { term: 'Sharding keys', detail: 'The choice that decides whether it works. A bad key creates hotspots (sharding by country when one country is 80% of traffic) and makes cross-shard joins impossible.' },
    ],
    pitfalls: [
      'Saying "add a load balancer" without making the servers stateless first.',
      'Adding a cache before knowing the read/write ratio. Caching write-heavy data adds invalidation cost for no benefit.',
      'Using hash % N for cache node selection — every rebalance evicts nearly everything.',
      'Confusing replication with sharding.',
      'Jumping to microservices in a design round. Scale the monolith first and say why.',
      'Ignoring the database. It is the bottleneck in almost every design question, and app servers are the easy part.',
    ],
    recall: [
      { q: 'Vertical vs horizontal scaling?', a: 'Bigger machine vs more machines. Vertical has a hard ceiling and a single point of failure.' },
      { q: 'What must be true before you can scale horizontally?', a: 'Servers must be stateless — session state lives in a shared store.' },
      { q: 'L4 vs L7 load balancing?', a: 'L4 balances on IP/port; L7 understands HTTP and can route on path or header.' },
      { q: 'Why consistent hashing?', a: 'Adding or removing a node remaps only adjacent keys instead of nearly all of them.' },
      { q: 'What is cache-aside?', a: 'The app checks the cache, and on a miss reads the DB and populates it.' },
      { q: 'What is a cache stampede?', a: 'A hot key expiring and every request hitting the database at once.' },
      { q: 'Replication vs sharding?', a: 'Replication copies the same data (read scale); sharding splits different data (write scale).' },
    ],
    interview: [
      { q: 'Design a URL shortener.', a: 'Base62-encode an auto-increment id or use a distributed id generator; store id → long URL in a key-value store; serve redirects from cache since reads dominate writes by orders of magnitude. Discuss custom aliases, collisions and analytics as extensions.' },
      { q: 'Where is the bottleneck as you scale?', a: 'Almost always the database. App servers scale by adding boxes; the database needs read replicas, then caching, then sharding — each step more expensive than the last.' },
      { q: 'How do you design a rate limiter?', a: 'Token bucket or sliding window counters in Redis, keyed by user or IP with a TTL. Token bucket allows controlled bursts; a fixed window is simpler but permits a double burst at the boundary.' },
    ],
  },

  {
    id: 'sd-distributed',
    title: 'System Design — CAP, Consistency & Queues',
    group: 'System Design',
    skills: ['cs.sd-cap', 'cs.sd-queues'],
    summary:
      'The distributed-systems half: what you give up under a partition, and why async processing exists.',
    recognise: [
      '"Explain the CAP theorem."',
      '"What is eventual consistency?"',
      '"Why use a message queue?"',
      'Anything mentioning Kafka, RabbitMQ, or "process this in the background".',
    ],
    concepts: [
      { term: 'CAP, stated correctly', detail: 'Under a network PARTITION you must choose between consistency and availability. Partitions are not optional, so the real choice is CP or AP. "Pick two of three" is the popular phrasing and it is misleading.' },
      { term: 'CP vs AP in practice', detail: 'CP (HBase, ZooKeeper, most RDBMS setups): refuse requests rather than serve stale data. AP (Cassandra, DynamoDB): keep answering and reconcile later. Banking leans CP; a social feed leans AP.' },
      { term: 'Eventual consistency', detail: 'Given no new writes, replicas converge. Fine for a like count or a feed; unacceptable for a balance or an inventory decrement.' },
      { term: 'Strong consistency costs', detail: 'It requires coordination — a quorum or a leader — which adds latency and reduces availability. Nothing here is free, and saying so is the mark of a real answer.' },
      { term: 'Quorum', detail: 'With N replicas, requiring R reads and W writes such that R + W > N guarantees a read sees the latest write. Tuning R and W slides you along the consistency/latency dial.' },
      { term: 'Consensus', detail: 'Raft and Paxos let a cluster agree on a value despite failures. Raft is the one to name — leader election plus a replicated log — because it was explicitly designed to be understandable.' },
      { term: 'Why a message queue', detail: 'Decoupling (producer does not know the consumer), buffering (absorb spikes), retries (failures do not lose work), and responsiveness (return immediately, process later). Sending an email or encoding a video should never block an HTTP response.' },
      { term: 'Queue vs log', detail: 'RabbitMQ: a broker that pushes and deletes on ack — good for task distribution. Kafka: a durable append-only log where consumers track their own offset and can replay — good for event streaming and multiple independent consumers.' },
      { term: 'Delivery semantics', detail: 'At-most-once (may lose), at-least-once (may duplicate — the common default), exactly-once (very hard, usually approximated). Because at-least-once is the norm, consumers must be IDEMPOTENT.' },
      { term: 'Idempotency', detail: 'Processing the same message twice must have the same effect as once. Achieved with an idempotency key and a record of what has been handled — the single most important queue-consumer discipline.' },
      { term: 'Dead letter queue', detail: 'Where messages go after repeated failures, so one poison message cannot block the queue forever and can be inspected later.' },
    ],
    pitfalls: [
      'Stating CAP as "pick any two". You cannot opt out of partitions.',
      'Confusing CAP\'s Consistency with ACID\'s. CAP means every read sees the latest write; ACID means constraints hold.',
      'Claiming exactly-once delivery is easy. It generally is not — you get at-least-once plus idempotent consumers.',
      'Writing a queue consumer that is not idempotent, then being surprised by duplicate charges on retry.',
      'Adding a queue where a synchronous call was fine. Queues buy decoupling at the cost of eventual consistency and debugging difficulty.',
    ],
    recall: [
      { q: 'What does CAP actually force you to choose?', a: 'Consistency or availability, but only during a network partition.' },
      { q: 'Give a CP and an AP system.', a: 'CP: ZooKeeper, HBase. AP: Cassandra, DynamoDB.' },
      { q: 'Quorum condition for reading the latest write?', a: 'R + W > N.' },
      { q: 'Name a consensus algorithm.', a: 'Raft (or Paxos). Raft is designed to be more understandable.' },
      { q: 'Four reasons to use a message queue?', a: 'Decoupling, buffering, retries, and fast responses.' },
      { q: 'Kafka vs RabbitMQ in one line?', a: 'Kafka is a replayable durable log with consumer-tracked offsets; RabbitMQ is a broker that pushes and deletes on ack.' },
      { q: 'Why must consumers be idempotent?', a: 'Because delivery is normally at-least-once, so duplicates will happen.' },
    ],
    interview: [
      { q: 'Would you choose consistency or availability for a payment system?', a: 'Consistency. Rejecting a transaction during a partition is recoverable; double-spending is not. Invert that for a like counter, where availability obviously wins.' },
      { q: 'How do you make a payment consumer idempotent?', a: 'Client sends an idempotency key; the server records processed keys in a unique-constrained table. A duplicate insert fails, so you return the original result rather than charging twice.' },
      { q: 'What breaks when you add a queue?', a: 'The user no longer gets an immediate result, so you need status tracking and a failure path. You have traded latency and simplicity for throughput and resilience — say so explicitly.' },
    ],
  },

  {
    id: 'sd-api',
    title: 'System Design — API Design & Auth',
    group: 'System Design',
    skills: ['cs.sd-api'],
    summary:
      'REST conventions, versioning, and the auth questions every full-stack interview reaches eventually.',
    recognise: [
      '"Design a REST API for X."',
      '"REST vs GraphQL."',
      '"How does JWT work?" — near-certain for full-stack roles.',
      '"How do you version an API?"',
    ],
    concepts: [
      { term: 'REST basics', detail: 'Resources as nouns, HTTP methods as verbs. GET /users/1, POST /users, PUT /users/1, DELETE /users/1. If a verb appears in your URL (/getUser), it is not REST.' },
      { term: 'Status codes carry meaning', detail: '201 with a Location header on create, 204 on delete with no body, 400 for validation failure, 401 vs 403, 409 for conflict, 429 for rate limiting. Returning 200 with {"error": ...} defeats every HTTP-aware client.' },
      { term: 'Idempotency', detail: 'PUT and DELETE must be safe to retry. POST is not — which is why payment APIs take an Idempotency-Key header so a retried request cannot charge twice.' },
      { term: 'Versioning', detail: 'URL path (/v1/users) is the most visible and most common. Header-based is cleaner in theory and harder to debug. Whichever you pick, never break v1 while clients still use it.' },
      { term: 'Pagination', detail: 'Offset/limit is simple but drifts when rows are inserted mid-pagination and gets slow at high offsets. Cursor-based (keyset) is stable and fast — the right answer for feeds.' },
      { term: 'REST vs GraphQL', detail: 'REST: many endpoints, fixed shapes, easy caching. GraphQL: one endpoint, the client picks fields, solving over- and under-fetching — at the cost of caching complexity and expensive-query risk.' },
      { term: 'Authentication vs authorization', detail: 'Authentication is who you are; authorization is what you may do. 401 vs 403 mirrors exactly this split.' },
      { term: 'JWT', detail: 'header.payload.signature, base64url-encoded and SIGNED, not encrypted — anyone can read the payload, so never put secrets in it. The server verifies the signature without a database lookup, which is the whole appeal.' },
      { term: 'The JWT trade-off', detail: 'Statelessness means you cannot revoke a token before it expires. Standard mitigation: short-lived access tokens plus a refresh token you can revoke server-side.' },
      { term: 'OAuth 2.0', detail: 'Delegated authorization — "log in with Google" without giving your app the password. Authorization code flow: redirect → user consents → code → server exchanges it for a token. OAuth is authorization; OIDC layers identity on top.' },
      { term: 'Rate limiting', detail: 'Token bucket or sliding window per API key or user. Return 429 with a Retry-After header so well-behaved clients back off correctly.' },
    ],
    pitfalls: [
      'Verbs in endpoint URLs (/createUser). Use POST /users.',
      'Returning 200 for errors. Clients, proxies and monitoring all rely on the status code.',
      'Saying a JWT is encrypted. It is signed — the payload is readable by anyone holding the token.',
      'Storing sensitive data in the JWT payload.',
      'Offset pagination on a live feed, then wondering why users see duplicates or skipped items.',
      'Breaking an existing API version without a deprecation path.',
    ],
    recall: [
      { q: 'RESTful way to create a user?', a: 'POST /users, responding 201 with a Location header.' },
      { q: 'Which methods must be idempotent?', a: 'GET, PUT, DELETE. POST is not.' },
      { q: 'Three parts of a JWT?', a: 'Header, payload, signature.' },
      { q: 'Is a JWT encrypted?', a: 'No — signed. The payload is readable by anyone.' },
      { q: 'Main JWT drawback?', a: 'It cannot be revoked before expiry; use short-lived tokens plus refresh tokens.' },
      { q: 'Cursor vs offset pagination?', a: 'Cursor is stable under inserts and fast at depth; offset drifts and slows down.' },
      { q: 'What problem does GraphQL solve?', a: 'Over-fetching and under-fetching — the client specifies exactly which fields it needs.' },
      { q: 'Status code for rate limiting?', a: '429, ideally with Retry-After.' },
    ],
    interview: [
      { q: 'Design a REST API for a blog.', a: 'GET/POST /posts, GET/PUT/DELETE /posts/{id}, GET/POST /posts/{id}/comments. Cursor pagination on lists, 201 with Location on create, 404 for a missing post, 403 when editing someone else\'s. Nest comments under posts because they do not exist independently.' },
      { q: 'How do you implement logout with JWTs?', a: 'Deleting the client-side token is not real logout — the token stays valid. Either keep a short expiry with revocable refresh tokens, or maintain a server-side denylist of revoked ids, which reintroduces the state JWTs were meant to avoid.' },
      { q: 'How do you handle a breaking change?', a: 'Publish /v2 alongside /v1, announce a deprecation window, monitor v1 usage, and only remove it once traffic reaches zero. Never mutate v1 semantics under live clients.' },
    ],
  },

  // ── Engineering Practice ──────────────────────────────────────────────────
  {
    id: 'eng-practice',
    title: 'Git, Testing & Debugging',
    group: 'Engineering Practice',
    skills: ['cs.git', 'cs.testing'],
    summary:
      'The questions that check you have actually worked on a team. Interviewers ask these to see if your project was real.',
    recognise: [
      '"Merge vs rebase."',
      '"How do you resolve a merge conflict?"',
      '"What is unit testing / TDD?"',
      '"How do you debug a bug you cannot reproduce?"',
    ],
    concepts: [
      { term: 'Merge vs rebase', detail: 'Merge preserves history and creates a merge commit. Rebase replays your commits on top of the target for a linear history, but rewrites commit hashes. Rule of thumb: never rebase a branch other people have pulled.' },
      { term: 'Merge conflicts', detail: 'Git cannot decide between two edits to the same lines. Open the file, resolve the conflict markers, git add, then continue. Conflicts are normal — being unable to describe the resolution is what looks bad.' },
      { term: 'reset vs revert', detail: 'reset moves the branch pointer and rewrites history (dangerous on a shared branch). revert creates a NEW commit that undoes an old one — safe on shared branches, because nothing is rewritten.' },
      { term: 'Branching models', detail: 'Feature branches off main, PR, review, merge. Git Flow adds develop/release/hotfix branches — heavier, now less fashionable than trunk-based development with short-lived branches.' },
      { term: 'Useful recovery commands', detail: 'git stash (park work), git cherry-pick (take one commit), git bisect (binary search for the commit that broke it), git reflog (recover what you thought you destroyed).' },
      { term: 'Testing pyramid', detail: 'Many fast unit tests, fewer integration tests, very few slow end-to-end tests. Inverting it gives a suite that is slow, flaky and distrusted.' },
      { term: 'Unit vs integration vs E2E', detail: 'Unit: one function in isolation with dependencies mocked. Integration: components together, often with a real database. E2E: the whole system through the user interface.' },
      { term: 'TDD', detail: 'Red, green, refactor — write a failing test, make it pass minimally, then clean up. The value is that it forces you to define the interface and the expected behaviour before implementing.' },
      { term: 'Mocks and stubs', detail: 'Replace real dependencies to keep tests fast and deterministic. Over-mocking is a real hazard: a test that mocks everything verifies only that your mocks were called.' },
      { term: 'Debugging method', detail: 'Reproduce reliably, isolate by bisecting the input or the commit history, form ONE hypothesis, test it, repeat. Randomly changing code until it works is the anti-pattern — and describing the method above is what separates a good answer.' },
      { term: 'Code review', detail: 'Look for correctness, edge cases, readability and tests — not style a formatter should handle. Small PRs get real reviews; thousand-line PRs get "LGTM".' },
    ],
    pitfalls: [
      'Rebasing a shared branch and force-pushing over your team\'s work.',
      'Using git reset --hard on a shared branch when revert was the correct tool.',
      'Committing secrets. Once pushed, rotate the credential — deleting the file does not remove it from history.',
      'Writing tests only for the happy path. Edge cases and error paths are where bugs live.',
      'Chasing a bug without reproducing it first. Without a reproduction you cannot know you fixed it.',
      'Claiming "100% coverage" as a quality measure. Coverage says lines ran, not that behaviour is correct.',
    ],
    recall: [
      { q: 'Merge vs rebase?', a: 'Merge keeps history and adds a merge commit; rebase replays commits for a linear history and rewrites hashes.' },
      { q: 'When must you not rebase?', a: 'On a branch others have already pulled.' },
      { q: 'reset vs revert?', a: 'reset rewrites history; revert adds a new commit undoing an old one — safe when shared.' },
      { q: 'What does git bisect do?', a: 'Binary searches commit history to find the one that introduced a bug.' },
      { q: 'Testing pyramid shape?', a: 'Many unit, fewer integration, very few E2E.' },
      { q: 'TDD cycle?', a: 'Red, green, refactor.' },
      { q: 'First step in debugging?', a: 'Reproduce it reliably.' },
      { q: 'Does 100% coverage mean correct?', a: 'No — it means every line executed, not that behaviour was verified.' },
    ],
    interview: [
      { q: 'You pushed a secret to GitHub. What now?', a: 'Rotate the credential immediately — assume it is compromised. Then purge it from history (filter-repo or BFG) and force-push. Removing the file in a new commit leaves it fully readable in history.' },
      { q: 'How do you debug something that only fails in production?', a: 'Start from logs, metrics and traces to narrow the conditions; check what differs — data volume, concurrency, config, timezone. Try to reproduce with production-like data in staging. Add targeted logging if you must, rather than guessing.' },
      { q: 'What makes a good unit test?', a: 'Fast, deterministic, independent of other tests, and testing one behaviour with a name that states it. If it breaks you should know what is wrong from the name alone.' },
    ],
  },

  {
    id: 'web-fundamentals',
    title: 'Web Fundamentals',
    group: 'Engineering Practice',
    skills: ['cs.web-fundamentals'],
    summary:
      'The browser-side questions for full-stack roles: how JS handles async, how a page renders, and the React basics.',
    recognise: [
      '"What is the event loop?" — very common for JS roles.',
      '"var vs let vs const", "== vs ===".',
      '"What are React hooks / why keys in lists?"',
      '"What happens when a browser renders a page?"',
    ],
    concepts: [
      { term: 'The event loop', detail: 'JavaScript is single-threaded. The call stack runs synchronous code; async callbacks wait in queues and are pushed onto the stack only when it empties. This is why a long loop freezes the whole page.' },
      { term: 'Microtasks beat macrotasks', detail: 'Promise callbacks (microtasks) run before setTimeout callbacks (macrotasks), and the entire microtask queue drains between each macrotask. This is the ordering trick interviewers use to test real understanding.' },
      { term: 'var vs let vs const', detail: 'var is function-scoped and hoisted as undefined. let and const are block-scoped and live in the temporal dead zone until declared. const prevents reassignment, not mutation — a const object\'s fields can still change.' },
      { term: '== vs ===', detail: '== coerces types before comparing ("5" == 5 is true); === does not. Always use === unless you deliberately want the coercion.' },
      { term: 'Closures', detail: 'A function keeps access to the scope it was defined in, even after that scope returns. The basis of private state, and the classic loop-with-var interview bug.' },
      { term: 'Promises and async/await', detail: 'A promise is a placeholder for a future value with pending/fulfilled/rejected states. async/await is syntax over the same machinery — await pauses only that async function, never the thread. Wrap awaits in try/catch, since there is no .catch() to fall back on.' },
      { term: 'Critical rendering path', detail: 'HTML → DOM, CSS → CSSOM, combined into a render tree, then layout (geometry) and paint (pixels). A synchronous script in <head> blocks parsing — which is why defer and async exist.' },
      { term: 'Reflow vs repaint', detail: 'Reflow recalculates geometry and is expensive; repaint only redraws pixels. Changing width causes reflow; changing colour only repaints. Batch DOM changes to avoid layout thrashing.' },
      { term: 'Event bubbling and delegation', detail: 'Events propagate from the target up to the root. Delegation exploits this: one listener on a parent handles clicks on any number of children, including ones added later.' },
      { term: 'React re-render model', detail: 'State changes mark a component dirty; React re-renders it and its children, diffs the virtual DOM, and applies the minimal real-DOM change. Re-render does not mean the DOM was touched.' },
      { term: 'Why keys matter', detail: 'Keys let React match elements across renders. Using an array index as a key breaks on insertion or reordering — state attaches to the wrong row, a bug that looks like data corruption.' },
      { term: 'useState vs useEffect', detail: 'useState holds state across renders. useEffect runs side effects after render; its dependency array controls when it re-runs, and omitting it means it runs after every render.' },
    ],
    pitfalls: [
      'Saying JavaScript is multi-threaded. It is single-threaded with an event loop (Web Workers are a separate mechanism).',
      'Believing const makes an object immutable. It only prevents reassignment of the binding.',
      'Using array index as a React key in a list that can reorder or have items inserted.',
      'Expecting setTimeout(fn, 0) to run before a resolved promise callback. Microtasks go first.',
      'Forgetting the useEffect dependency array and creating an infinite render loop.',
      'Mutating React state directly instead of replacing it — the reference is unchanged, so nothing re-renders.',
    ],
    recall: [
      { q: 'Is JavaScript single or multi-threaded?', a: 'Single-threaded, with an event loop for async work.' },
      { q: 'Which runs first — a promise callback or setTimeout(0)?', a: 'The promise callback; microtasks drain before the next macrotask.' },
      { q: 'var vs let scope?', a: 'var is function-scoped and hoisted; let is block-scoped with a temporal dead zone.' },
      { q: 'Does const make an object immutable?', a: 'No — only the binding cannot be reassigned.' },
      { q: 'What is a closure?', a: 'A function retaining access to its defining scope after that scope has returned.' },
      { q: 'Reflow vs repaint?', a: 'Reflow recalculates layout geometry (expensive); repaint only redraws pixels.' },
      { q: 'Why does React need keys?', a: 'To match elements across renders; index keys break under insertion or reordering.' },
      { q: 'What does the useEffect dependency array control?', a: 'When the effect re-runs. Omitting it means after every render.' },
    ],
    interview: [
      { q: 'Explain the output order of a mixed sync/setTimeout/promise snippet.', a: 'All synchronous code first, then the entire microtask queue (promises), then macrotasks (setTimeout) one at a time with microtasks drained between each. Walk the stack and the two queues out loud.' },
      { q: 'Why is the virtual DOM faster?', a: 'It is not inherently faster than a hand-optimised direct update — it is faster than naive full re-rendering, and it makes the fast path the default. Saying this rather than "virtual DOM = fast" is the better answer.' },
      { q: 'How would you optimise a slow page?', a: 'Measure first with Lighthouse or the performance panel. Then the usual levers: reduce and defer JS, compress and lazy-load images, cache and use a CDN, minimise reflows, code-split. Naming measurement first is the part that matters.' },
    ],
  },
];

export default CS_SHEETS;
