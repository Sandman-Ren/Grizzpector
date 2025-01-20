import winston from 'winston';
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";


const logDir = "./logs";
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, {recursive: true});
}

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({level, message, ...meta}) => {
                    const hasMeta = Object.keys(meta).length > 0;
                    const formattedMeta = hasMeta ? JSON.stringify(meta, null, 2) : '';
                    return `${level}: ${message} ${formattedMeta}`;
                })
            )
        }),
        new DailyRotateFile({
            dirname: logDir,
            filename: 'grizzpector-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '30d',
            format: winston.format.json()
        }),
    ],
});
