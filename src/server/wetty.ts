/**
 * Create WeTTY server
 * @module WeTTy
 */
import server from './server';
import getCommand from './command';
import term from './term';
import logger from './logger';
import loadSSL from './ssl';
import { SSL, SSH, SSLBuffer, Server } from './interfaces';

export default class WeTTy {
  /**
   * Starts WeTTy Server
   * @name start
   */
  public static start(
    ssh: SSH = { user: '', host: 'localhost', auth: 'password', port: 22 },
    serverConf: Server = { base: '/wetty/', port: 3000, host: '0.0.0.0' },
    command: string = '',
    ssl?: SSL
  ): Promise<void> {
    return loadSSL(ssl).then((sslBuffer: SSLBuffer) => {
      if (ssh.key) {
        logger.warn(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
! Password-less auth enabled using private key from ${ssh.key}.
! This is dangerous, anything that reaches the wetty server
! will be able to run remote operations without authentication.
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
      }

      const io = server(serverConf, sslBuffer);
      /**
       * Wetty server connected too
       * @fires WeTTy#connnection
       */
      io.on('connection', (socket: SocketIO.Socket) => {
        /**
         * @event wetty#connection
         * @name connection
         */
        logger.info('Connection accepted.');
        const { args, user: sshUser } = getCommand(socket, ssh, command);
        logger.debug('Command Generated', {
          user: sshUser,
          cmd: args.join(' '),
        });

        if (sshUser) {
          term.spawn(socket, args);
        } else {
          term
            .login(socket)
            .then((username: string) => {
              args[1] = `${username.trim()}@${args[1]}`;
              logger.debug('Spawning term', {
                username: username.trim(),
                cmd: args.join(' ').trim(),
              });
              return term.spawn(socket, args);
            })
            .catch(() => {
              logger.info('Disconnect signal sent');
            });
        }
      });
    });
  }
}
