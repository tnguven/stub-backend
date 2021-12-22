const exitHook = require('./../../../lib/app/utils/exit-hook');

exitHook(() => {
  console.log('before');
});

exitHook(() => {
  console.log('after ');
});

const unsubscribe = exitHook(() => {
  console.log('unsubscribe');
});

unsubscribe();

process.exit(0);
