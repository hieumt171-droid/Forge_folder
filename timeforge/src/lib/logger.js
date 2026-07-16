const createLogger = (module) => {
  const write = (level, event, payload = {}) => {
    console.log(
      JSON.stringify({
        '@formatLog': true,
        level,
        module,
        event,
        ts: new Date().toISOString(),
        appVersion: process.env.APP_VERSION ?? 'unknown',
        ...payload
      })
    );
  };

  return {
    start(action, meta = {}) { write('info', `${action}.start`, meta); },
    success(action, meta = {}) { write('info', `${action}.success`, meta); },
    error(action, meta = {}) { write('error', `${action}.error`, meta); },

    async run(action, meta, fn) {
      const startedAt = Date.now();
      this.start(action, meta);
      try {
        const result = await fn();
        this.success(action, { ...meta, durationMs: Date.now() - startedAt });
        return result;
      } catch (err) {
        this.error(action, {
          ...meta,
          durationMs: Date.now() - startedAt,
          message: err?.message,
          errorName: err?.name
        });
        throw err;
      }
    }
  };
};

module.exports = { createLogger };
