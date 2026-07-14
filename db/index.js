import jsonServer from "json-server";

const server = jsonServer.create();
const router = jsonServer.router("db/data.json");
const middlewares = jsonServer.defaults();

export const port = process.env.PORT || 3000;

server.use(middlewares);
server.use(router);

server.listen(port, () => {
  console.log(`JSON Server running on port ${port}`);
});
