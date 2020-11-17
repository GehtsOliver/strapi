'use strict';

const { createTestBuilder } = require('../../../../test/helpers/builder');
const { createStrapiInstance } = require('../../../../test/helpers/strapi');
const { createAuthRequest } = require('../../../../test/helpers/request');

const builder = createTestBuilder();
let strapi;
let rq;

const ct = {
  name: 'withstring',
  attributes: {
    field: {
      type: 'string',
    },
  },
};

describe('Test type string', () => {
  beforeAll(async () => {
    await builder.addContentType(ct).build();

    strapi = await createStrapiInstance({ ensureSuperAdmin: true });
    rq = await createAuthRequest({ strapi });
  }, 60000);

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  }, 60000);

  test('Creates an entry with JSON', async () => {
    const res = await rq.post(
      '/content-manager/collection-types/application::withstring.withstring',
      {
        body: {
          field: 'Some string',
        },
      }
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      field: 'Some string',
    });
  });

  test('Reading entry, returns correct value', async () => {
    const res = await rq.get(
      '/content-manager/collection-types/application::withstring.withstring'
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(Array.isArray(res.body.results)).toBe(true);
    res.body.results.forEach(entry => {
      expect(entry.field).toEqual(expect.any(String));
    });
  });

  test('Updating entry with JSON sets the right value and format', async () => {
    const res = await rq.post(
      '/content-manager/collection-types/application::withstring.withstring',
      {
        body: { field: 'Some string' },
      }
    );

    const updateRes = await rq.put(
      `/content-manager/collection-types/application::withstring.withstring/${res.body.id}`,
      {
        body: { field: 'Updated string' },
      }
    );
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body).toMatchObject({
      id: res.body.id,
      field: 'Updated string',
    });
  });
});
