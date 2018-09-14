import bodyParser from "body-parser";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import logger from "morgan";
import dbConfig from "./config/dbConfig";
import { apiRouter } from "./router";

export class Server {

    public app: express.Express;
    public mongodbPath: string = `mongodb://localhost/${dbConfig.dbName}`;
    private server: http.Server;
    private mongoConnection: mongoose.Connection;

    constructor() {
        this.app = express();
        this.app.use(bodyParser.json());
        this.app.use(logger("dev"));

        this.route();

        mongoose.set("useCreateIndex", true);
    }

    public stop() {
        if (this.mongoConnection) {
            this.mongoConnection.close();
        }
        if (this.server) {
            this.server.close();
        }
    }

    public start() {
        this.server = this.app.listen(3000, () => console.log(`Express listen on http://localhost:3000`));
        this.startMongo();
    }

    private route() {
        this.app.use("/api", apiRouter);
    }

    private async startMongo() {
        this.mongoConnection = (await mongoose.connect(this.mongodbPath, {
            useNewUrlParser: true,
        })).connection;

        console.log(`Mongodb starting on ${this.mongodbPath}`);
    }
}
