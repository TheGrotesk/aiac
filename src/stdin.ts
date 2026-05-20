/**
 * Read a single line from stdin without closing or destroying the stream.
 * readline.close() tears down stdin and breaks subsequent reads — this uses
 * raw data events and just pauses after capturing one line.
 */
export function readLine(): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = '';

    const onData = (chunk: Buffer | string) => {
      buffer += chunk.toString();
      const idx = buffer.indexOf('\n');
      if (idx !== -1) {
        const line = buffer.slice(0, idx).replace(/\r$/, '');
        cleanup();
        process.stdout.write('\n');
        resolve(line.trim());
      }
    };

    const onEnd = () => {
      cleanup();
      reject(new Error('stdin closed before input was received'));
    };

    function cleanup() {
      process.stdin.removeListener('data', onData);
      process.stdin.removeListener('end', onEnd);
      process.stdin.pause();
    }

    process.stdin.resume();
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', onData);
    process.stdin.once('end', onEnd);
  });
}
