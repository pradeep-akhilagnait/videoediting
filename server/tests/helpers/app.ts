import supertest from 'supertest';
import { createApp } from '../../src/app.js';

/** A fresh supertest agent bound to the real Express app. */
export const request = () => supertest(createApp());

/** Log in through the real auth endpoint and return the access token. */
export async function login(email: string, password: string): Promise<string> {
  const res = await request().post('/api/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.accessToken as string;
}

/** Authorization header for a bearer token. */
export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
