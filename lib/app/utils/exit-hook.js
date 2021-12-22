const events = [
  { event: 'exit' },
  { event: 'SIGINT', signal: 2 },
  { event: 'SIGUSR2', signal: 12 },
  { event: 'SIGTERM', signal: 15 },
  { event: 'SIGQUIT', signal: 3 }
];

const callbacks = new Set();
let isCalled = false;
let isRegistered = false;

/**
 * @param {boolean} shouldManuallyExit
 * @param {number} signal
 */
async function exit(shouldManuallyExit, signal) {
  if (isCalled) {
    return;
  }
  isCalled = true;

  try {
    await Promise.all(callbacks.map(({ onExit }) => onExit()));
    if (shouldManuallyExit) process.exit(128 + signal);
  } catch (err) {
    // ignore err
  }
}

/**
 * @param {object} onExit
 * @return {(function(): void)}
 */
module.exports = function exitHook(onExit) {
  callbacks.add(onExit);

  if (!isRegistered) {
    isRegistered = true;

    process.stdin.resume();

    events.forEach(({ event, signal }) => {
      if (signal) process.once(event, exit.bind(undefined, true, signal));
      else process.once(event, exit);
    });
  }

  return () => {
    callbacks.delete(onExit);
  };
};
