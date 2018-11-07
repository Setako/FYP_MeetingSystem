import dotenv from "dotenv";
dotenv.config();

import { MongodbServer } from "./db-server";
import { Server } from "./server";

const server = new Server();
const dbServer = new MongodbServer();

server.start();
dbServer.start()
    .catch(() => {
        console.log("Since Mongodb cannot be connected, server will be closed.");
        dbServer.close();
        server.close();
    });
