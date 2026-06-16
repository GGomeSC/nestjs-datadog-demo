import { format, transports } from 'winston';
import type { LoggerOptions } from 'winston';

export const loggerOptions: LoggerOptions = {
  format: format.combine(
    format.timestamp(),
    format.printf((info) =>
      JSON.stringify({
        level: info.level,
        message: typeof info.message === 'string' ? info.message : JSON.stringify(info.message),
        timestamp: info.timestamp,
        context: typeof info.context === 'string' ? info.context : 'Application',
      }),
    ),
  ),
  transports: [new transports.Console()],
};