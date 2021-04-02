# Boilerplate

### Node, TypeScript, PostgreSQL, Express

Created by [https://tuomas.id/](https://tuomas.id/)

The goal of this boilerplate is to be a robust and feature rich [Express](https://expressjs.com/) API backend that can easily be developed on top of. Everything custom is included in the template files and can easily be inspected, modified and removed if necessary.

### Install

```bash
npm install
```

### Configure

```bash
# Create the .env file and configure
cp .env.example .env
```

### Start

```bash
# To run without auto-restart
npm start

# To run with auto-restart
npm run watch
```

## Conventions used

### [Hashids](https://hashids.org/)

When IDs are sent to the client, they should be obfuscated for improved security. This boilerplate uses Hashids to accomplish this.

### SQL transactions

SQL transactions are an incredibly powerful feature that way too many developers never end up taking advantage of.
This boilerplate implements a wrapper around [express](https://expressjs.com/) request handlers that takes care of async errors, DB transactions and return values.
If something goes wrong while calling an endpoint, the transaction will be automatically rolled back, and everything is like the request never happened.

```js
const genericRouter = Router();

genericRouter.get(
  '/generic/:id',
  Request(async (trx, req, res) => {
    const { id } = req.body;

    // <Multiple SQL queries and other endpoint logic>

    // All SQL queries done prior to this will be automatically rolled back
    // Express responds with 500 status code
    throw new Error('Oops');
  })
);
```

To have a closer look at how this works, please see the `src/middleware.ts`

### SQL template literals

SQL queries should be simple and easy to write, but still secure agains injection attacks. ES6 template literals are a nice way to accomplish just that.
This boilerplate uses a custom wrapper around the [node-postgres](https://node-postgres.com/) PoolClient, that allows for template literal queries that automatically escape added parameters.

```js
await trx.sql`
  SELECT ${trx.select(columns)}
  FROM "Table"
  WHERE _id = ${_id}
`;
```

To see everything this client has to offer, please see the `src/lib/trx.ts` file.

---

Write your own stuff here ✏️
