import * as LRU from 'lru-cache';
import { Response, Request, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import * as request from 'request';
import 'reflect-metadata';

import config from '../config';

export const AuthenticationServiceType = Symbol('AuthenticationServiceType');

export class AuthenticationException extends Error { }

/**
 * AuthenticationService interface
 */
export interface AuthenticationService {

  validate(jwtToken: string): Promise<boolean>;

}

/**
 * ExternalHttpJwtAuthenticationService class
 */
@injectable()
export class ExternalHttpJwtAuthenticationService implements AuthenticationService {

  private apiUrl: string = config.auth.url;
  private timeout: number = config.auth.timeout;

  constructor() {
  }

  /**
   * Validate JWT token
   * @param jwtToken
   */
  async validate(jwtToken: string): Promise<boolean> {
    if (!jwtToken) {
      return false;
    }

    return await this.callVerifyJwtTokenMethodEndpoint(jwtToken);
  }

  /**
   * Make HTTP/HTTPS request
   * @param jwtToken
   */
  private async callVerifyJwtTokenMethodEndpoint(jwtToken: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      request.post({
        url: this.apiUrl,
        timeout: this.timeout,
        headers: {
          'accept': 'application/json'
        },
        json: { token: jwtToken }
        // agentOptions: {
        //   cert: '',
        //   key: '',
        //   passphrase: '',
        //   securityOptions: 'SSL_OP_NO_SSLv3'
        // }
      }, (error: any, response: any, body: any) => {
        if (error) {
          return reject(new AuthenticationException(error));
        }

        if (response.statusCode !== 200 || !body.decoded) {
          return reject(new AuthenticationException('Invalid token'));
        }

        if (!body.decoded.isTenant) {
          return reject(new AuthenticationException('JWT isn\'t type of tenant'));
        }

        resolve(true);
      });
    });
  }

}

/**
 * Simple, single value token validator
 * @internal
 */
@injectable()
export class JwtSingleInlineAuthenticationService implements AuthenticationService {

  private storedToken: string = 'TOKEN';

  /**
   * Set token
   * @param token
   */
  public setToken(token: string) {
    this.storedToken = token;
  }

  /**
   * Validate JWT token
   * @param jwtToken
   */
  async validate(jwtToken: string): Promise<boolean> {
    if (jwtToken !== this.storedToken) {
      return false;
    }
    return true;
  }

}

/**
 * Cache decorator for only successfully request
 */
export class CachedAuthenticationDecorator implements AuthenticationService {
  private lruCache: any;

  /**
   * @param authenticationService
   * @param maxAgeInSeconds
   * @param maxLength
   */
  constructor(private authenticationService: AuthenticationService, maxAgeInSeconds: number = 30, maxLength: number = 1000) {
    this.lruCache = LRU({
      max: maxLength,
      maxAge: maxAgeInSeconds * 1000
    });
  }

  /**
   * @inheritdoc
   */
  async validate(jwtToken: string): Promise<boolean> {
    try {
      if (this.lruCache.has(jwtToken)) {
        return this.lruCache.get(jwtToken);
      }

      const result = await this.authenticationService.validate(jwtToken);
      this.lruCache.set(jwtToken, result);
      return result;
    } catch (err) {
      throw err;
    }
  }
}
