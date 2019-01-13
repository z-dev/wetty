import * as yargs from 'yargs';
import logger from './logger';
import WeTTy from './wetty';

interface Options {
  sshhost: string;
  sshport: number;
  sshuser: string;
  sshauth: string;
  sshkey?: string;
  sshpass?: string;
  sslkey?: string;
  sslcert?: string;
  base: string;
  host: string;
  port: number;
  command?: string;
}

interface CLI extends Options {
  help: boolean;
}

export default class Server {
  public static start({
    sshuser,
    sshhost,
    sshauth,
    sshport,
    sshkey,
    sshpass,
    base,
    host,
    port,
    command,
    sslkey,
    sslcert,
  }: Options): Promise<void> {
    return WeTTy.start(
      {
        user: sshuser,
        host: sshhost,
        auth: sshauth,
        port: sshport,
        pass: sshpass,
        key: sshkey,
      },
      { base, host, port },
      command,
      { key: sslkey, cert: sslcert }
    );
  }

  public static get wetty(): WeTTy {
    return WeTTy;
  }

  public static init(opts: CLI): void {
    if (!opts.help) {
      this.start(opts).catch(err => {
        logger.error(err);
        process.exitCode = 1;
      });
    } else {
      yargs.showHelp();
      process.exitCode = 0;
    }
  }
}
