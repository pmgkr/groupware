// utils/queue.ts
type Task = () => void;

let queue: Task[] = [];
let running = false;

export function enqueue(task: Task) {
  queue.push(task);
  run();
}

function run() {
  if (running) return;
  running = true;

  requestAnimationFrame(() => {
    const tasks = [...queue];
    queue = [];
    tasks.forEach((t) => t());
    running = false;
  });
}
