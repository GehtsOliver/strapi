'use strict';

// Test a simple default API with no relations

const { omit, pick } = require('lodash/fp');

const { createTestBuilder } = require('../../../test/helpers/builder');
const { createStrapiInstance } = require('../../../test/helpers/strapi');
const { createAuthRequest } = require('../../../test/helpers/request');

let strapi;
let rq;
let data = {
  products: [],
  shops: [],
};

const productModel = {
  attributes: {
    name: {
      type: 'string',
    },
  },
  connection: 'default',
  name: 'product',
  description: '',
  collectionName: '',
};

const productWithDPModel = {
  attributes: {
    name: {
      type: 'string',
    },
  },
  connection: 'default',
  name: 'product',
  draftAndPublish: true,
  description: '',
  collectionName: '',
};

const shopModel = {
  attributes: {
    name: {
      type: 'string',
    },
    products: {
      dominant: true,
      nature: 'manyToMany',
      target: 'application::product.product',
      targetAttribute: 'shops',
    },
  },
  connection: 'default',
  name: 'shop',
};

const shops = [
  {
    name: 'market',
  },
];

const products = ({ withPublished = false }) => ({ shop }) => {
  const shops = [shop[0].id];

  const entries = [
    {
      name: 'tomato',
      shops,
      published_at: new Date(),
    },
    {
      name: 'apple',
      shops,
      published_at: null,
    },
  ];

  if (withPublished) {
    return entries;
  }

  return entries.map(omit('published_at'));
};

describe('Relation-list route', () => {
  describe('without draftAndPublish', () => {
    const builder = createTestBuilder();

    beforeAll(async () => {
      await builder
        .addContentTypes([productModel, shopModel])
        .addFixtures(shopModel.name, shops)
        .addFixtures(productModel.name, products({ withPublished: false }))
        .build();

      strapi = await createStrapiInstance({ ensureSuperAdmin: true });
      rq = await createAuthRequest({ strapi });

      data.shops = builder.sanitizedFixturesFor(shopModel.name, strapi);
      data.products = builder.sanitizedFixturesFor(productModel.name, strapi);
    }, 60000);

    afterAll(async () => {
      await strapi.destroy();
      await builder.cleanup();
    }, 60000);

    test('Can get relation-list for products of a shop', async () => {
      const res = await rq({
        method: 'GET',
        url: '/content-manager/relations/application::shop.shop/products',
      });

      expect(res.body).toHaveLength(data.products.length);
      data.products.forEach((product, index) => {
        expect(res.body[index]).toStrictEqual(pick(['_id', 'id', 'name'], product));
      });
    });
  });

  describe('with draftAndPublish', () => {
    const builder = createTestBuilder();

    beforeAll(async () => {
      await builder
        .addContentTypes([productWithDPModel, shopModel])
        .addFixtures(shopModel.name, shops)
        .addFixtures(productWithDPModel.name, products({ withPublished: true }))
        .build();

      strapi = await createStrapiInstance({ ensureSuperAdmin: true });
      rq = await createAuthRequest({ strapi });

      data.shops = builder.sanitizedFixturesFor(shopModel.name, strapi);
      data.products = builder.sanitizedFixturesFor(productWithDPModel.name, strapi);
    }, 60000);

    afterAll(async () => {
      await strapi.destroy();
      await builder.cleanup();
    }, 60000);

    test('Can get relation-list for products of a shop', async () => {
      const res = await rq({
        method: 'GET',
        url: '/content-manager/relations/application::shop.shop/products',
      });

      expect(res.body).toHaveLength(data.products.length);

      const tomatoProductRes = res.body.find(p => p.name === 'tomato');
      const appleProductRes = res.body.find(p => p.name === 'apple');

      expect(tomatoProductRes).toMatchObject(pick(['_id', 'id', 'name'], data.products[0]));
      expect(tomatoProductRes.published_at).toBeISODate();
      expect(appleProductRes).toStrictEqual({
        ...pick(['_id', 'id', 'name'], data.products[1]),
        published_at: null,
      });
    });
  });
});
